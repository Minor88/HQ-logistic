import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
// @ts-ignore
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { GripVertical, Trash2, Edit2 } from 'lucide-react';

// Используем простую реализацию drag-and-drop вместо библиотеки
// поскольку библиотека может отсутствовать в проекте
const Draggable = ({ children, onDragStart, onDragEnd, draggableId, index, ...rest }: any) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ id: draggableId, index }));
    onDragStart && onDragStart(e, { draggableId, index });
  };

  const handleDragEnd = (e: React.DragEvent) => {
    onDragEnd && onDragEnd(e, { draggableId, index });
  };

  return (
    <tr
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      {...rest}
    >
      {children}
    </tr>
  );
};

const Droppable = ({ children, onDrop, droppableId, ...rest }: any) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      const dropTargetIndex = Array.from(e.currentTarget.querySelectorAll('tr')).indexOf(e.target as HTMLTableRowElement);
      
      if (dropTargetIndex >= 0) {
        onDrop && onDrop(e, { sourceIndex: data.index, destinationIndex: dropTargetIndex, draggableId: data.id });
      }
    } catch (error) {
      console.error('Ошибка при обработке drop-события:', error);
    }
  };

  return (
    <tbody
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{ backgroundColor: isDragOver ? 'rgba(0, 0, 0, 0.05)' : 'transparent' }}
      {...rest}
    >
      {children}
    </tbody>
  );
};

interface ShipmentStatus {
  id: number;
  code: string;
  name: string;
  isDefault: boolean;
  isFinal: boolean;
  order: number;
}

const statusSchema = z.object({
  code: z.string().min(2, { message: 'Код должен содержать минимум 2 символа' }),
  name: z.string().min(3, { message: 'Название должно содержать минимум 3 символа' }),
  is_default: z.boolean().default(false),
  is_final: z.boolean().default(false),
});

type FormData = z.infer<typeof statusSchema>;

const ShipmentStatusManager: React.FC = () => {
  const [statuses, setStatuses] = useState<ShipmentStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ShipmentStatus | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(statusSchema),
    defaultValues: {
      code: '',
      name: '',
      is_default: false,
      is_final: false,
    },
  });

  // Загрузка статусов отправлений
  const loadStatuses = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get<{ results: ShipmentStatus[] }>('/shipment-statuses/');
      // Обрабатываем пагинированные данные
      const statusesArray = Array.isArray(data) ? data : data.results || [];
      setStatuses(statusesArray);
    } catch (error) {
      toast.error('Не удалось загрузить статусы отправлений');
      console.error('Ошибка при загрузке статусов отправлений:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStatuses();
  }, []);

  // Создание нового статуса
  const handleAddStatus = async (data: FormData) => {
    try {
      // Преобразуем snake_case в camelCase для бэкенда
      const payload = {
        code: data.code,
        name: data.name,
        isDefault: data.is_default,  // Преобразуем имя поля
        isFinal: data.is_final,      // Преобразуем имя поля
        order: statuses.length, 
      };
      
      await api.post('/shipment-statuses/', payload);
      
      toast.success('Статус успешно создан');
      await loadStatuses();
      setIsAddDialogOpen(false);
      form.reset();
    } catch (error) {
      toast.error('Не удалось создать статус');
      console.error('Ошибка при создании статуса:', error);
    }
  };

  // Обновление статуса
  const handleUpdateStatus = async (data: FormData) => {
    if (!selectedStatus) return;

    try {
      // Преобразуем snake_case в camelCase для бэкенда
      const payload = {
        code: data.code,
        name: data.name,
        isDefault: data.is_default,  // Преобразуем имя поля
        isFinal: data.is_final,      // Преобразуем имя поля
        order: selectedStatus.order
      };
      
      await api.put(`/shipment-statuses/${selectedStatus.id}/`, payload);
      
      toast.success('Статус успешно обновлен');
      await loadStatuses();
      setIsEditDialogOpen(false);
      form.reset();
    } catch (error) {
      toast.error('Не удалось обновить статус');
      console.error('Ошибка при обновлении статуса:', error);
    }
  };

  // Удаление статуса
  const handleDeleteStatus = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот статус?')) return;

    try {
      await api.delete(`/shipment-statuses/${id}/`);
      toast.success('Статус успешно удален');
      await loadStatuses();
    } catch (error) {
      toast.error('Не удалось удалить статус');
      console.error('Ошибка при удалении статуса:', error);
    }
  };

  // Перемещение статусов (изменение порядка)
  const handleDrop = async (e: React.DragEvent, { sourceIndex, destinationIndex }: { sourceIndex: number, destinationIndex: number }) => {
    if (sourceIndex === destinationIndex) return;

    const reorderedStatuses = Array.from(statuses);
    const [removed] = reorderedStatuses.splice(sourceIndex, 1);
    reorderedStatuses.splice(destinationIndex, 0, removed);

    // Обновляем order для каждого статуса
    const updatedStatuses = reorderedStatuses.map((status, index) => ({
      ...status,
      order: index,
    }));

    setStatuses(updatedStatuses);

    // Отправляем новый порядок на сервер
    try {
      // Предполагается, что у нас есть эндпоинт для обновления порядка
      await api.post('/shipment-statuses/reorder/', {
        statuses: updatedStatuses.map(status => ({
          id: status.id,
          order: status.order,
        })),
      });
    } catch (error) {
      toast.error('Не удалось обновить порядок статусов');
      console.error('Ошибка при обновлении порядка статусов:', error);
      await loadStatuses(); // Загружаем исходный порядок в случае ошибки
    }
  };

  // Открытие диалога редактирования
  const handleEditClick = (status: ShipmentStatus) => {
    setSelectedStatus(status);
    // Преобразуем camelCase в snake_case для формы
    form.reset({
      code: status.code,
      name: status.name,
      is_default: status.isDefault,  // Преобразуем имя поля
      is_final: status.isFinal,      // Преобразуем имя поля
    });
    setIsEditDialogOpen(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Статусы отправлений</h2>
        <Button onClick={() => {
          form.reset();
          setIsAddDialogOpen(true);
        }}>
          Добавить статус
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-4">Загрузка...</div>
      ) : statuses.length === 0 ? (
        <div className="text-center py-4">Статусы отправлений не найдены</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead style={{ width: '40px' }}></TableHead>
              <TableHead>Код</TableHead>
              <TableHead>Название</TableHead>
              <TableHead>По умолчанию</TableHead>
              <TableHead>Финальный</TableHead>
              <TableHead style={{ width: '120px' }}>Действия</TableHead>
            </TableRow>
          </TableHeader>
          <Droppable droppableId="statuses" onDrop={handleDrop}>
            {statuses.map((status, index) => (
              <Draggable key={status.id} draggableId={String(status.id)} index={index}>
                <TableCell className="cursor-move">
                  <GripVertical className="h-4 w-4" />
                </TableCell>
                <TableCell>{status.code}</TableCell>
                <TableCell>{status.name}</TableCell>
                <TableCell>{status.isDefault ? 'Да' : 'Нет'}</TableCell>
                <TableCell>{status.isFinal ? 'Да' : 'Нет'}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEditClick(status)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDeleteStatus(status.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </Draggable>
            ))}
          </Droppable>
        </Table>
      )}

      {/* Диалог добавления статуса */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить статус отправления</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddStatus)} className="space-y-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Код</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="например, new" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Название</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="например, Новая" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex space-x-6">
                <FormField
                  control={form.control}
                  name="is_default"
                  render={({ field }) => {
                    return (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                          }}
                        />
                      </FormControl>
                      <FormLabel>По умолчанию</FormLabel>
                    </FormItem>
                    );
                  }}
                />
                <FormField
                  control={form.control}
                  name="is_final"
                  render={({ field }) => {
                    return (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                          }}
                        />
                      </FormControl>
                      <FormLabel>Финальный</FormLabel>
                    </FormItem>
                    );
                  }}
                />
              </div>
              <DialogFooter>
                <Button type="submit">Сохранить</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Диалог редактирования статуса */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать статус отправления</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleUpdateStatus)} className="space-y-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Код</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="например, new" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Название</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="например, Новая" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex space-x-6">
                <FormField
                  control={form.control}
                  name="is_default"
                  render={({ field }) => {
                    return (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                          }}
                        />
                      </FormControl>
                      <FormLabel>По умолчанию</FormLabel>
                    </FormItem>
                    );
                  }}
                />
                <FormField
                  control={form.control}
                  name="is_final"
                  render={({ field }) => {
                    return (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                          }}
                        />
                      </FormControl>
                      <FormLabel>Финальный</FormLabel>
                    </FormItem>
                    );
                  }}
                />
              </div>
              <DialogFooter>
                <Button type="submit">Сохранить</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShipmentStatusManager; 