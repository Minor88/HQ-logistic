import React, { useEffect, useState, useCallback } from 'react';
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
  DialogDescription,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Request, RequestFormData, RequestStatus } from '@/services/requestService';
import requestService from '@/services/requestService';
import { zodResolver } from '@hookform/resolvers/zod';
// @ts-ignore
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { FileText, Plus, Eye, Edit2, Trash2, Filter, X, FileSpreadsheet, Calendar as CalendarIcon, Folder, Truck, File, Edit, Trash } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDate } from '@/lib/utils';
import FileManager from '@/components/files/FileManager';
import { RequestsDataGrid } from '@/components/tables/RequestsDataGrid';
import { RequestsTable } from '@/components/tables/RequestsTable';
import userService from '@/services/userService';
import shipmentService, { Shipment, ShipmentStatus } from '@/services/shipmentService';
import { CompanyResponse } from '@/types/company';
import { UserProfile } from '@/types/user';

// Схема валидации для формы заявки
const requestSchema = z.object({
  number: z.string().min(1, { message: 'Номер обязателен' }),
  status: z.number({ required_error: 'Выберите статус' }),
  client: z.number({ required_error: 'Выберите клиента' }),
  manager: z.number().optional(),
  shipment: z.number().optional(),
  comment: z.string().optional(),
  description: z.string().optional(),
  warehouseNumber: z.string().optional(),
  colMest: z.number().optional(),
  declaredWeight: z.number().optional(),
  declaredVolume: z.number().optional(),
  actualWeight: z.number().optional(),
  actualVolume: z.number().optional(),
  rate: z.string().optional(),
});

// Типы сортировки и параметры фильтрации
type SortDirection = 'asc' | 'desc' | null;
type SortField = 'number' | 'createdAt' | 'client' | 'status' | null;

interface FilterParams {
  search: string;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  status: number | null;
  client: number | null;
  shipment: number | null;
}

export default function RequestsPage() {
  // Состояние для заявок с учетом пагинации
  const [requestsData, setRequestsData] = useState<PaginatedResponse<Request>>({
    count: 0,
    next: null,
    previous: null,
    results: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statuses, setStatuses] = useState<RequestStatus[]>([]);
  const [shipmentStatuses, setShipmentStatuses] = useState<ShipmentStatus[]>([]);
  const [filters, setFilters] = useState<FilterParams>({
    search: '',
    dateRange: {
      start: null,
      end: null
    },
    status: null,
    client: null,
    shipment: null
  });
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  
  // Состояние диалогов
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isFiltersDialogOpen, setIsFiltersDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  
  const { user } = useAuth();
  
  // Проверка прав доступа
  const canManageRequests = user?.role !== 'client';
  const canEditRequest = (request: Request) => {
    if (canManageRequests) return true;
    if (user?.role === 'client' && request.client.toString() === user.id) {
      // Проверяем, имеет ли заявка статус "Новая заявка"
      const status = statuses.find(s => s.id === request.status);
      return status?.code === 'new';
    }
    return false;
  };
  
  // Инициализация формы
  const form = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      number: '',
      status: 0,
      client: 0,
      manager: undefined,
      shipment: undefined,
      comment: '',
      description: '',
      warehouseNumber: '',
      colMest: undefined,
      declaredWeight: undefined,
      declaredVolume: undefined,
      actualWeight: undefined,
      actualVolume: undefined,
      rate: '',
    },
  });

  const [currentPage, setCurrentPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  
  const [clients, setClients] = useState<{id: number, name: string}[]>([]);
  const [managers, setManagers] = useState<{id: number, name: string}[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  
  // Загрузка списка заявок
  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Подготавливаем параметры запроса с учетом фильтрации и сортировки
      const params: Record<string, any> = {
        page: currentPage + 1, // Backend использует 1-based пагинацию
        pageSize: rowsPerPage,
        ...filters,
      };
      
      if (sortField && sortDirection) {
        params.ordering = sortDirection === 'asc' ? sortField : `-${sortField}`;
      }
      
      const result = await requestService.getRequests(params);
      
      // Обогащаем результаты дополнительной информацией
      // (имена клиентов, менеджеров, статусов и отправлений)
      const enrichedResults = result.results.map(request => ({
        ...request,
        clientName: clients.find(c => c.id === request.client)?.name || 'Н/Д',
        managerName: request.manager ? 
          managers.find(m => m.id === request.manager)?.name || 'Н/Д' 
          : 'Не назначен',
        statusDisplay: statuses.find(s => s.id === request.status)?.name || 'Неизвестный статус',
        shipmentNumber: request.shipment ? 
          shipments.find(s => s.id === request.shipment)?.number || 'Н/Д' 
          : null,
        shipmentStatusDisplay: request.shipment ? 
          shipmentStatuses.find(
            s => s.id === shipments.find(ship => ship.id === request.shipment)?.status
          )?.name || 'Неизвестный статус' 
          : null,
        shipmentComment: request.shipment ?
          shipments.find(s => s.id === request.shipment)?.comment || ''
          : null
      }));
      
      setRequestsData({
        ...result,
        results: enrichedResults
      });
    } catch (error) {
      console.error('Error loading requests:', error);
      toast.error('Failed to load requests');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, rowsPerPage, filters, sortField, sortDirection, clients, statuses, shipments, shipmentStatuses, managers]);

  // Загрузка статусов заявок
  const loadStatuses = async () => {
    try {
      const data = await requestService.getRequestStatuses();
      setStatuses(data);
    } catch (error) {
      console.error('Ошибка при загрузке статусов:', error);
      toast.error('Не удалось загрузить статусы заявок');
    }
  };

  // Загрузка клиентов
  const loadClients = async () => {
    try {
      const response = await userService.getCompanyUsers();
      
      // Фильтруем только клиентов из списка пользователей
      const clientsList = response.results.filter(user => 
        user.user_group === 'client' || user.userGroup === 'client'
      ).map(user => ({
        id: user.id,
        name: user.user?.first_name && user.user?.last_name 
          ? `${user.user.first_name} ${user.user.last_name}`.trim()
          : user.user?.firstName && user.user?.lastName
            ? `${user.user.firstName} ${user.user.lastName}`.trim()
            : user.user?.username || 'Неизвестный клиент'
      }));
      
      setClients(clientsList);
    } catch (error) {
      console.error('Ошибка при загрузке клиентов:', error);
      toast.error('Не удалось загрузить список клиентов');
    }
  };

  const loadManagers = async () => {
    try {
      const response = await userService.getCompanyUsers();
      
      // Фильтруем только менеджеров из списка пользователей
      const managersList = response.results.filter(user => 
        user.user_group === 'manager' || user.userGroup === 'manager' || 
        user.user_group === 'admin' || user.userGroup === 'admin'
      ).map(user => ({
        id: user.id,
        name: user.user?.first_name && user.user?.last_name 
          ? `${user.user.first_name} ${user.user.last_name}`.trim()
          : user.user?.firstName && user.user?.lastName
            ? `${user.user.firstName} ${user.user.lastName}`.trim()
            : user.user?.username || 'Неизвестный менеджер'
      }));
      
      setManagers(managersList);
    } catch (error) {
      console.error('Ошибка при загрузке менеджеров:', error);
      toast.error('Не удалось загрузить список менеджеров');
    }
  };

  const loadShipments = async () => {
    try {
      const shipmentsData = await shipmentService.getShipments();
      setShipments(shipmentsData.results);
    } catch (error) {
      console.error('Ошибка при загрузке отправлений:', error);
      toast.error('Не удалось загрузить список отправлений');
    }
  };
  
  const loadShipmentStatuses = async () => {
    try {
      const data = await shipmentService.getShipmentStatuses();
      setShipmentStatuses(data);
    } catch (error) {
      console.error('Ошибка при загрузке статусов отправлений:', error);
      toast.error('Не удалось загрузить статусы отправлений');
    }
  };

  useEffect(() => {
    // Загружаем данные при монтировании компонента
    loadStatuses();
    loadShipmentStatuses();
    loadClients();
    loadManagers();
    loadShipments();
    
    // Устанавливаем поисковый запрос из параметров фильтрации
    setSearchQuery(filters.search);
  }, []);
  
  // Загружаем заявки после загрузки всех справочников
  useEffect(() => {
    if (statuses.length > 0 && shipmentStatuses.length > 0 && clients.length > 0 && shipments.length > 0) {
      loadRequests();
    }
  }, [statuses, shipmentStatuses, clients, shipments]);

  // Обновляем список заявок при изменении статусов
  useEffect(() => {
    // При изменении статусов обновим отображение имен статусов в таблице
    if (statuses.length > 0 && requestsData.results.length > 0) {
      const updatedRequests = {
        ...requestsData,
        results: requestsData.results.map(request => {
          const matchingStatus = statuses.find(s => s.id === request.status);
          return {
            ...request,
            statusDisplay: matchingStatus?.name || request.statusDisplay
          };
        })
      };
      setRequestsData(updatedRequests);
    }
  }, [statuses]);

  // Эффект для обновления поискового запроса при изменении filters.search
  useEffect(() => {
    setSearchQuery(filters.search);
  }, [filters.search]);

  // Фильтрация заявок по поисковому запросу
  const filteredRequests = requestsData.results.filter(request => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      (request.number?.toLowerCase().includes(query) || false) ||
      (request.comment?.toLowerCase().includes(query) || false) ||
      (request.description?.toLowerCase().includes(query) || false) ||
      (request.warehouseNumber?.toLowerCase().includes(query) || false) ||
      (request.clientName?.toLowerCase().includes(query) || false) ||
      (request.statusDisplay?.toLowerCase().includes(query) || false)
    );
  });

  // Обработчик создания заявки
  const handleAddRequest = async (data: RequestFormData) => {
    try {
      // Подготавливаем данные
      const payload = {
        ...data,
        company: user?.companyId ? parseInt(user.companyId) : undefined,
        colMest: data.colMest,
        declaredWeight: data.declaredWeight,
        declaredVolume: data.declaredVolume
      };
      
      const createdRequest = await requestService.createRequest(payload);
      
      await loadRequests();
      setIsAddDialogOpen(false);
      form.reset();
      toast.success('Заявка успешно создана');
    } catch (error) {
      console.error('Ошибка при создании заявки:', error);
      toast.error('Не удалось создать заявку');
    }
  };

  // Обработчик открытия диалога редактирования
  const handleEditClick = (request: Request) => {
    setSelectedRequest(request);
    form.reset({
      number: request.number,
      status: request.status,
      client: request.client,
      manager: request.manager || undefined,
      shipment: request.shipment || undefined,
      comment: request.comment || '',
      description: request.description || '',
      warehouseNumber: request.warehouseNumber || '',
      colMest: request.colMest,
      declaredWeight: request.declaredWeight,
      declaredVolume: request.declaredVolume,
      actualWeight: request.actualWeight,
      actualVolume: request.actualVolume,
      rate: request.rate || '',
    });
    setIsEditDialogOpen(true);
  };

  // Обработчик обновления заявки
  const handleUpdateRequest = async (data: RequestFormData) => {
    if (!selectedRequest) return;
    
    try {
      // Убираем неопределенные значения
      const updatedData = {
        ...data,
      };
      
      // Используем разные методы для обновления в зависимости от роли пользователя
      if (user?.role === 'warehouse') {
        // Для роли warehouse используем специальный метод, который позволяет менять только статус, комментарий и фактические вес/объем
        await requestService.updateRequestStatus(selectedRequest.id.toString(), {
          status: updatedData.status,
          comment: updatedData.comment,
          actualWeight: updatedData.actualWeight,
          actualVolume: updatedData.actualVolume
        });
      } else {
        // Для остальных ролей используем обычный метод обновления
        await requestService.updateRequest(selectedRequest.id.toString(), updatedData);
      }
      
      await loadRequests();
      setIsEditDialogOpen(false);
      form.reset();
      toast.success('Заявка успешно обновлена');
    } catch (error) {
      console.error('Ошибка при обновлении заявки:', error);
      toast.error('Не удалось обновить заявку');
    }
  };

  // Обработчик открытия диалога удаления
  const handleDeleteClick = (request: Request) => {
    setSelectedRequest(request);
    setIsDeleteDialogOpen(true);
  };

  // Обработчик удаления заявки
  const handleDeleteRequest = async () => {
    if (!selectedRequest) return;
    
    try {
      await requestService.deleteRequest(selectedRequest.id.toString());
      await loadRequests();
      setIsDeleteDialogOpen(false);
      toast.success('Заявка успешно удалена');
    } catch (error) {
      console.error('Ошибка при удалении заявки:', error);
      toast.error('Не удалось удалить заявку');
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
  const handleViewClick = (request: Request) => {
    setSelectedRequest(request);
    setIsViewDialogOpen(true);
  };

  // Обработчик сортировки
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Если текущее поле сортировки то же самое, меняем направление
      const newDirection = sortDirection === 'asc' ? 'desc' : 
                          sortDirection === 'desc' ? null : 'asc';
      setSortDirection(newDirection);
      if (newDirection === null) {
        setSortField(null);
      }
    } else {
      // Если новое поле сортировки, устанавливаем сортировку по возрастанию
      setSortField(field);
      setSortDirection('asc');
    }
    
    // Перезагружаем данные с новыми параметрами сортировки
    loadRequests();
  };

  // Обработчик применения фильтров
  const handleApplyFilters = (newFilters: FilterParams) => {
    setFilters(newFilters);
    setIsFiltersDialogOpen(false);
    loadRequests();
  };

  // Функция для экспорта данных в Excel
  const exportToExcel = () => {
    // Заглушка для будущей реализации
    toast.info('Функция экспорта в Excel будет реализована в ближайшее время');
    
    // TODO: Реализовать экспорт в Excel
    // 1. Преобразовать данные в формат, подходящий для Excel
    // 2. Использовать библиотеку для генерации Excel-файла
    // 3. Скачать файл
  };

  // Функция для обработки файлов заявок
  const handleFilesClick = async (request: Request) => {
    setSelectedRequest(request);
    
    // Откроем диалог с файлами заявки
    // Заглушка для будущей реализации
    toast.info('Функциональность работы с файлами заявок будет реализована в ближайшее время');
    
    // TODO: Реализовать диалог с файлами заявки
  };

  // Функция для просмотра информации о клиентах, которую можно использовать для создания и редактирования заявок
  const loadClientInformation = async (clientId: number) => {
    try {
      // Заглушка для будущей реализации
      // TODO: Загрузить информацию о клиенте из API
      toast.info('Загрузка информации о клиенте будет реализована в ближайшее время');
    } catch (error) {
      console.error('Ошибка при загрузке информации о клиенте:', error);
      toast.error('Не удалось загрузить информацию о клиенте');
    }
  };

  // Обработчик изменения страницы
  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
  }, []);

  // Обработчик изменения количества строк на странице
  const handleRowsPerPageChange = useCallback((newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(0);
  }, []);

  // Загружаем заявки при изменении параметров пагинации, фильтрации или сортировки
  useEffect(() => {
    if (clients.length > 0 && statuses.length > 0 && shipments.length > 0 && shipmentStatuses.length > 0) {
      loadRequests();
    }
  }, [loadRequests, currentPage, rowsPerPage, filters, sortField, sortDirection]);

  return (
    <div className="container mx-auto py-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Заявки</CardTitle>
          <CardDescription>
            Управление заявками вашей логистической компании
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RequestsDataGrid
            requests={filteredRequests}
            isLoading={isLoading}
            onViewClick={handleViewClick}
            onEditClick={handleEditClick}
            onDeleteClick={handleDeleteClick}
            onFilesClick={handleFilesClick}
            onAddClick={() => {
              // Найдем статус по умолчанию или первый в списке
              const defaultStatus = statuses.find(s => s.isDefault);
              const firstStatus = statuses[0];
              const statusId = defaultStatus?.id || (firstStatus?.id || 0);
              
              form.reset({
                number: '',
                status: statusId,
                client: user?.role === 'client' ? parseInt(user.id) : 0,
                manager: undefined,
                shipment: undefined,
                comment: '',
                description: '',
                warehouseNumber: '',
                colMest: undefined,
                declaredWeight: undefined,
                declaredVolume: undefined,
                actualWeight: undefined,
                actualVolume: undefined,
                rate: '',
              });
              setIsAddDialogOpen(true);
            }}
            getStatusBadgeVariant={getStatusBadgeVariant}
            getStatusName={getStatusName}
            canEditRequest={canEditRequest}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            page={currentPage}
            pageSize={rowsPerPage}
          />
        </CardContent>
      </Card>
      
      {/* Диалог добавления заявки */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Добавить новую заявку</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddRequest)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Номер</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Номер заявки" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="warehouseNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Складской номер</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Складской номер" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="client"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Клиент</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        defaultValue={field.value?.toString()}
                        disabled={user?.role === 'client'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите клиента" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id.toString()}>
                              {client.name}
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
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Статус</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        defaultValue={field.value?.toString()}
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
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="manager"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Менеджер</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value) || value)} 
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите менеджера" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Не выбрано</SelectItem>
                          {managers.map((manager) => (
                            <SelectItem key={manager.id} value={manager.id.toString()}>
                              {manager.name}
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
                  name="shipment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Отправление</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value) || value)} 
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите отправление" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Не выбрано</SelectItem>
                          {shipments.map((shipment) => (
                            <SelectItem key={shipment.id} value={shipment.id.toString()}>
                              {shipment.number}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Описание</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Описание заявки" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="colMest"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Количество мест</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="1" 
                          {...field} 
                          value={field.value || ''} 
                          onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} 
                          placeholder="0"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="declaredWeight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Вес (кг)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          {...field} 
                          value={field.value || ''} 
                          onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} 
                          placeholder="0.00"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="declaredVolume"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Объем (м³)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.001" 
                          {...field} 
                          value={field.value || ''} 
                          onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} 
                          placeholder="0.000"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {user?.role === 'warehouse' && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="actualWeight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Фактический вес (кг)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            {...field} 
                            value={field.value || ''} 
                            onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} 
                            placeholder="0.00"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="actualVolume"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Фактический объем (м³)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.001" 
                            {...field} 
                            value={field.value || ''} 
                            onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} 
                            placeholder="0.000"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ставка</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ставка" />
                      </FormControl>
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
              </div>
              
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
      
      {/* Диалог редактирования заявки */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Редактировать заявку</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleUpdateRequest)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Номер заявки</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="RQ-12345" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="warehouseNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Складской номер</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="WH-1234" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="client"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Клиент</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        defaultValue={field.value?.toString()}
                        disabled={user?.role === 'client'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите клиента" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id.toString()}>
                              {client.name}
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
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Статус</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        defaultValue={field.value?.toString()}
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
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="manager"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Менеджер</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value) || value)} 
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите менеджера" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Не выбрано</SelectItem>
                          {managers.map((manager) => (
                            <SelectItem key={manager.id} value={manager.id.toString()}>
                              {manager.name}
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
                  name="shipment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Отправление</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value) || value)} 
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите отправление" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Не выбрано</SelectItem>
                          {shipments.map((shipment) => (
                            <SelectItem key={shipment.id} value={shipment.id.toString()}>
                              {shipment.number}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Описание</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Описание заявки" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="colMest"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Количество мест</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="1" 
                          {...field} 
                          value={field.value || ''} 
                          onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} 
                          placeholder="0"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="declaredWeight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Вес (кг)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          {...field} 
                          value={field.value || ''} 
                          onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} 
                          placeholder="0.00"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="declaredVolume"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Объем (м³)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.001" 
                          {...field} 
                          value={field.value || ''} 
                          onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} 
                          placeholder="0.000"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {user?.role === 'warehouse' && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="actualWeight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Фактический вес (кг)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            {...field} 
                            value={field.value || ''} 
                            onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} 
                            placeholder="0.00"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="actualVolume"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Фактический объем (м³)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.001" 
                            {...field} 
                            value={field.value || ''} 
                            onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} 
                            placeholder="0.000"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ставка</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ставка" />
                      </FormControl>
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
              </div>
              
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
            Вы действительно хотите удалить заявку{' '}
            <strong>{selectedRequest?.number}</strong>?
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
              onClick={handleDeleteRequest}
            >
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Диалог просмотра заявки */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Просмотр заявки #{selectedRequest?.number}</DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <Tabs defaultValue="info">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">Информация</TabsTrigger>
                <TabsTrigger value="files">Файлы</TabsTrigger>
              </TabsList>
              
              <TabsContent value="info">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium">Номер:</h3>
                      <p className="text-sm">{selectedRequest.number}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Дата создания:</h3>
                      <p className="text-sm">{formatDate(selectedRequest.createdAt || '') || 'Не указана'}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium">Складской номер:</h3>
                      <p className="text-sm">{selectedRequest.warehouseNumber || '-'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Статус:</h3>
                      <div className="mt-1">
                        <Badge variant={getStatusBadgeVariant(selectedRequest.status)}>
                          {selectedRequest.statusDisplay || getStatusName(selectedRequest.status)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium">Клиент:</h3>
                      <p className="text-sm">{selectedRequest.clientName || 'Не указан'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Менеджер:</h3>
                      <p className="text-sm">{selectedRequest.managerName || '-'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium">Описание:</h3>
                    <p className="text-sm">{selectedRequest.description || '-'}</p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <h3 className="text-sm font-medium">Количество мест:</h3>
                      <p className="text-sm">{selectedRequest.colMest || '-'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Вес (кг):</h3>
                      <p className="text-sm">{selectedRequest.declaredWeight || '-'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Объем (м³):</h3>
                      <p className="text-sm">{selectedRequest.declaredVolume || '-'}</p>
                    </div>
                  </div>
                  
                  {(selectedRequest.actualWeight || selectedRequest.actualVolume) && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium">Фактический вес (кг):</h3>
                        <p className="text-sm">{selectedRequest.actualWeight || '-'}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium">Фактический объем (м³):</h3>
                        <p className="text-sm">{selectedRequest.actualVolume || '-'}</p>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="text-sm font-medium">Ставка:</h3>
                    <p className="text-sm">{selectedRequest.rate || '-'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium">Комментарий:</h3>
                    <p className="text-sm">{selectedRequest.comment || '-'}</p>
                  </div>
                  
                  {selectedRequest.shipment && (
                    <div className="space-y-2 mt-4">
                      <h2 className="text-lg font-medium">Данные отправления</h2>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium">Номер отправления:</h3>
                          <Link 
                            to={`/shipments?id=${selectedRequest.shipment}`}
                            className="text-apple-purple hover:underline flex items-center"
                          >
                            <Truck className="h-4 w-4 mr-1" />
                            {selectedRequest.shipmentNumber}
                          </Link>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium">Статус отправления:</h3>
                          <div className="mt-1">
                            <Badge variant="outline">
                              {selectedRequest.shipmentStatusDisplay || '-'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium">Комментарий отправления:</h3>
                        <p className="text-sm">{selectedRequest.shipmentComment || '-'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="files">
                <div className="space-y-4">
                  <FileManager 
                    shipmentId={selectedRequest.id.toString()}
                    readOnly={!canEditRequest(selectedRequest)}
                  />
                </div>
              </TabsContent>
            </Tabs>
          )}
          
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Диалог фильтров */}
      <Dialog open={isFiltersDialogOpen} onOpenChange={setIsFiltersDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Фильтры</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="font-medium">Поиск</label>
              <Input 
                placeholder="Поиск по номеру, описанию, комментарию..." 
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <label className="font-medium">Период создания</label>
              <div className="flex space-x-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateRange.start ? formatDate(filters.dateRange.start.toISOString()) : "От"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.dateRange.start || undefined}
                      onSelect={(date) => setFilters({
                        ...filters, 
                        dateRange: {...filters.dateRange, start: date}
                      })}
                    />
                  </PopoverContent>
                </Popover>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateRange.end ? formatDate(filters.dateRange.end.toISOString()) : "До"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.dateRange.end || undefined}
                      onSelect={(date) => setFilters({
                        ...filters, 
                        dateRange: {...filters.dateRange, end: date}
                      })}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="font-medium">Статус</label>
              <Select 
                value={filters.status?.toString() || "all"}
                onValueChange={(value) => setFilters({
                  ...filters, 
                  status: value !== "all" ? parseInt(value) : null
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Все статусы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  {statuses.map((status) => (
                    <SelectItem key={status.id} value={status.id.toString()}>
                      {status.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="font-medium">Клиент</label>
              <Select 
                value={filters.client?.toString() || "all"}
                onValueChange={(value) => setFilters({
                  ...filters, 
                  client: value !== "all" ? parseInt(value) : null
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Все клиенты" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все клиенты</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="font-medium">Отправление</label>
              <Select 
                value={filters.shipment?.toString() || "all"}
                onValueChange={(value) => setFilters({
                  ...filters, 
                  shipment: value !== "all" ? parseInt(value) : null
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Все отправления" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все отправления</SelectItem>
                  {shipments.map((shipment) => (
                    <SelectItem key={shipment.id} value={shipment.id.toString()}>
                      {shipment.number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setFilters({
                  search: '',
                  dateRange: {
                    start: null,
                    end: null
                  },
                  status: null,
                  client: null,
                  shipment: null
                });
              }}
            >
              Сбросить фильтры
            </Button>
            <Button 
              type="button"
              onClick={() => {
                loadRequests();
                setIsFiltersDialogOpen(false);
              }}
            >
              Применить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 