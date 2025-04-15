import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { PaginatedResponse } from '@/types/user';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Shipment, ShipmentFormData, ShipmentStatus } from '@/services/shipmentService';
import shipmentService from '@/services/shipmentService';
import { zodResolver } from '@hookform/resolvers/zod';
// @ts-ignore
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { Truck, Plus, Eye, Edit2, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDate } from '@/lib/utils';
import FileManager from '@/components/files/FileManager';

// Схема валидации для формы отправления
const shipmentSchema = z.object({
  number: z.string().min(1, { message: 'Номер обязателен' }),
  status: z.number({ required_error: 'Выберите статус' }),
  comment: z.string().optional(),
});

export default function ShipmentsPage() {
  // Состояние для отправлений с учетом пагинации
  const [shipmentsData, setShipmentsData] = useState<PaginatedResponse<Shipment>>({
    count: 0,
    next: null,
    previous: null,
    results: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statuses, setStatuses] = useState<ShipmentStatus[]>([]);
  
  // Состояние диалогов
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  
  const { user } = useAuth();
  
  // Проверка прав доступа
  const canManageShipments = user?.role !== 'client';
  
  // Инициализация формы
  const form = useForm<ShipmentFormData>({
    resolver: zodResolver(shipmentSchema),
    defaultValues: {
      number: '',
      status: 0,
      comment: '',
    },
  });

  // Загрузка списка отправлений
  const loadShipments = async () => {
    setIsLoading(true);
    try {
      const data = await shipmentService.getShipments();
      setShipmentsData(data);
    } catch (error) {
      console.error('Ошибка при загрузке отправлений:', error);
      toast.error('Не удалось загрузить отправления');
    } finally {
      setIsLoading(false);
    }
  };

  // Загрузка статусов отправлений
  const loadStatuses = async () => {
    try {
      const data = await shipmentService.getShipmentStatuses();
      setStatuses(data);
    } catch (error) {
      console.error('Ошибка при загрузке статусов:', error);
      toast.error('Не удалось загрузить статусы отправлений');
    }
  };

  useEffect(() => {
    loadShipments();
    loadStatuses();
  }, []);

  // Обновляем список отправлений при изменении статусов
  useEffect(() => {
    // При изменении статусов обновим отображение имен статусов в таблице
    if (statuses.length > 0 && shipmentsData.results.length > 0) {
      const updatedShipments = {
        ...shipmentsData,
        results: shipmentsData.results.map(shipment => {
          const matchingStatus = statuses.find(s => s.id === shipment.status);
          return {
            ...shipment,
            statusDisplay: matchingStatus?.name || shipment.statusDisplay
          };
        })
      };
      setShipmentsData(updatedShipments);
    }
  }, [statuses]);

  // Фильтрация отправлений по поисковому запросу
  const filteredShipments = shipmentsData.results.filter(shipment => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      shipment.number.toLowerCase().includes(query) ||
      (shipment.comment?.toLowerCase().includes(query) || false) ||
      (shipment.statusDisplay?.toLowerCase().includes(query) || false)
    );
  });

  // Обработчик создания отправления
  const handleAddShipment = async (data: ShipmentFormData) => {
    try {
      const payload = {
        ...data,
        company: user?.companyId ? parseInt(user.companyId) : undefined,
        comment: data.comment || ''
      };
      
      const createdShipment = await shipmentService.createShipment(payload);
      
      await loadShipments();
      setIsAddDialogOpen(false);
      form.reset();
      toast.success('Отправление успешно создано');
    } catch (error) {
      console.error('Ошибка при создании отправления:', error);
      toast.error('Не удалось создать отправление');
    }
  };

  // Обработчик открытия диалога редактирования
  const handleEditClick = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    form.reset({
      number: shipment.number,
      status: shipment.status,
      comment: shipment.comment || '',
    });
    setIsEditDialogOpen(true);
  };

  // Обработчик обновления отправления
  const handleUpdateShipment = async (data: ShipmentFormData) => {
    if (!selectedShipment) return;
    
    try {
      // Формируем полный payload, включая все обязательные поля
      const payload = {
        ...data,
        comment: data.comment || '',
        company: selectedShipment.company // Явно включаем company в payload
      };
      
      await shipmentService.updateShipment(selectedShipment.id.toString(), payload);
      
      await loadShipments();
      setIsEditDialogOpen(false);
      form.reset();
      toast.success('Отправление успешно обновлено');
    } catch (error) {
      console.error('Ошибка при обновлении отправления:', error);
      toast.error('Не удалось обновить отправление');
    }
  };

  // Обработчик открытия диалога удаления
  const handleDeleteClick = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setIsDeleteDialogOpen(true);
  };

  // Обработчик удаления отправления
  const handleDeleteShipment = async () => {
    if (!selectedShipment) return;
    
    try {
      await shipmentService.deleteShipment(selectedShipment.id.toString());
      await loadShipments();
      setIsDeleteDialogOpen(false);
      toast.success('Отправление успешно удалено');
    } catch (error) {
      console.error('Ошибка при удалении отправления:', error);
      toast.error('Не удалось удалить отправление');
    }
  };

  // Получение названия статуса по ID
  const getStatusName = (statusId: number): string => {
    const status = statuses.find(s => s.id === statusId);
    return status?.name || 'Неизвестно';
  };

  // Получение типа бейджа для статуса
  const getStatusBadgeVariant = (statusId: number): "default" | "secondary" | "destructive" | "outline" => {
    const status = statuses.find(s => s.id === statusId);
    if (!status) return "default";
    
    if (status.isFinal) {
      return status.code === 'cancelled' ? "destructive" : "secondary";
    }
    return "outline";
  };

  // Обработчик открытия диалога просмотра
  const handleViewClick = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setIsViewDialogOpen(true);
  };

  return (
    <div className="container mx-auto py-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Отправления</CardTitle>
          <CardDescription>
            Управление отправлениями вашей логистической компании
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between mb-4">
            <div className="w-1/3">
              <Input
                placeholder="Поиск отправлений..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {canManageShipments && (
              <Button onClick={() => {
                // Найдем статус по умолчанию или первый в списке
                const defaultStatus = statuses.find(s => s.isDefault);
                const firstStatus = statuses[0];
                const statusId = defaultStatus?.id || (firstStatus?.id || 0);
                
                form.reset({
                  number: '',
                  status: statusId,
                  comment: '',
                });
                setIsAddDialogOpen(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Добавить отправление
              </Button>
            )}
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Номер</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Дата создания</TableHead>
                <TableHead>Комментарий</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Загрузка...
                  </TableCell>
                </TableRow>
              ) : filteredShipments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Отправления не найдены
                  </TableCell>
                </TableRow>
              ) : (
                filteredShipments.map((shipment) => (
                  <TableRow key={shipment.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <Truck className="h-4 w-4 mr-2 text-apple-purple" />
                        {shipment.number}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(shipment.status)}>
                        {shipment.statusDisplay || getStatusName(shipment.status) || 'Неизвестный статус'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {formatDate(shipment.createdAt) || 'Н/Д'}
                      </span>
                    </TableCell>
                    <TableCell className="truncate max-w-xs">
                      {shipment.comment ? (
                        <span className="text-gray-800">{shipment.comment}</span>
                      ) : (
                        <span className="text-gray-400 italic">Нет комментария</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => handleViewClick(shipment)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {canManageShipments && (
                          <>
                            <Button 
                              variant="outline" 
                              size="icon"
                              onClick={() => handleEditClick(shipment)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="icon"
                              onClick={() => handleDeleteClick(shipment)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Диалог добавления отправления */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Добавить новое отправление</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddShipment)} className="space-y-4">
              <FormField
                control={form.control}
                name="number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Номер отправления</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="SF-12345" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Статус</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      defaultValue={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите статус" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statuses.map((status) => (
                          <SelectItem key={status.id} value={status.id.toString()}>
                            {status.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="comment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Комментарий</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Дополнительная информация" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Отмена
                </Button>
                <Button type="submit">Создать</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Диалог редактирования отправления */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Редактировать отправление</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleUpdateShipment)} className="space-y-4">
              <FormField
                control={form.control}
                name="number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Номер отправления</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="SF-12345" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Статус</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      defaultValue={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите статус" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statuses.map((status) => (
                          <SelectItem key={status.id} value={status.id.toString()}>
                            {status.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="comment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Комментарий</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Дополнительная информация" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Отмена
                </Button>
                <Button type="submit">Сохранить</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Диалог подтверждения удаления */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Подтверждение удаления</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            Вы действительно хотите удалить отправление{' '}
            <strong>{selectedShipment?.number}</strong>?
            <br />
            Это действие нельзя отменить.
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Отмена
            </Button>
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleDeleteShipment}
            >
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Диалог просмотра отправления */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Просмотр отправления</DialogTitle>
          </DialogHeader>
          
          {selectedShipment && (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="info">Информация</TabsTrigger>
                <TabsTrigger value="files">Файлы и папки</TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="space-y-4">
                <div className="flex flex-col space-y-1">
                  <span className="text-sm text-gray-500">Номер отправления</span>
                  <span className="font-medium">{selectedShipment.number}</span>
                </div>
                
                <div className="flex flex-col space-y-1">
                  <span className="text-sm text-gray-500">Статус</span>
                  <div>
                    <Badge variant={getStatusBadgeVariant(selectedShipment.status)}>
                      {selectedShipment.statusDisplay || getStatusName(selectedShipment.status) || 'Неизвестный статус'}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-1">
                  <span className="text-sm text-gray-500">Дата создания</span>
                  <span>{formatDate(selectedShipment.createdAt) || 'Н/Д'}</span>
                </div>
                
                <div className="flex flex-col space-y-1">
                  <span className="text-sm text-gray-500">Создал</span>
                  <span>{selectedShipment.createdByName || 'Н/Д'}</span>
                </div>
                
                <div className="flex flex-col space-y-1">
                  <span className="text-sm text-gray-500">Комментарий</span>
                  {selectedShipment.comment ? (
                    <span>{selectedShipment.comment}</span>
                  ) : (
                    <span className="text-gray-400 italic">Нет комментария</span>
                  )}
                </div>
                
                <div className="flex flex-col space-y-1">
                  <span className="text-sm text-gray-500">Количество заявок</span>
                  <span>{selectedShipment.requestsCount || 0}</span>
                </div>
              </TabsContent>
              
              <TabsContent value="files">
                <FileManager 
                  shipmentId={selectedShipment.id} 
                  readOnly={!canManageShipments} 
                />
              </TabsContent>
            </Tabs>
          )}
          
          <DialogFooter>
            <Button 
              type="button" 
              onClick={() => setIsViewDialogOpen(false)}
            >
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 