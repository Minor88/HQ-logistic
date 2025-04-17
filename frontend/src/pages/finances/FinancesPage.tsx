import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { PaginatedResponse } from '@/types/user';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { DollarSign, Plus, Eye, Edit2, Trash2 } from 'lucide-react';
import { DataGrid } from '@mui/x-data-grid';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ru from 'date-fns/locale/ru';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Checkbox } from '@/components/ui/checkbox';
import financeService, { Finance, FinanceFormData, Article } from '@/services/financeService';

// Схема валидации для формы финансовой операции
const financeSchema = z.object({
  operationType: z.string(),
  paymentDate: z.string(),
  documentType: z.string(),
  currency: z.string(),
  counterparty: z.number().optional(),
  article: z.number().optional(),
  comment: z.string().optional(),
  amount: z.number().optional(),
  isPaid: z.boolean().default(false),
  shipment: z.number().optional(),
  request: z.number().optional(),
  basis: z.number().optional(),
});

export default function FinancesPage() {
  // Состояние для финансовых операций с учетом пагинации
  const [financesData, setFinancesData] = useState<PaginatedResponse<Finance>>({
    count: 0,
    next: null,
    previous: null,
    results: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [articles, setArticles] = useState<Article[]>([]);
  const [counterparties, setCounterparties] = useState<any[]>([]);
  const [shipments, setShipments] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  
  // Состояние диалогов
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedFinance, setSelectedFinance] = useState<Finance | null>(null);
  
  const { user } = useAuth();
  
  // Проверка прав доступа
  const canManageFinances = user?.role !== 'client';
  const canEditFinance = (finance: Finance) => {
    return canManageFinances;
  };
  
  // Инициализация формы
  const form = useForm<FinanceFormData>({
    resolver: zodResolver(financeSchema),
    defaultValues: {
      operationType: 'in',
      paymentDate: new Date().toISOString().split('T')[0],
      documentType: 'bill',
      currency: 'rub',
      counterparty: undefined,
      article: undefined,
      comment: '',
      amount: undefined,
      isPaid: false,
      shipment: undefined,
      request: undefined,
      basis: undefined,
    },
  });

  // Загрузка списка финансовых операций
  const loadFinances = async () => {
    setIsLoading(true);
    try {
      const data = await financeService.getFinances();
      setFinancesData(data);
    } catch (error) {
      console.error('Ошибка при загрузке финансовых операций:', error);
      toast.error('Не удалось загрузить финансовые операции');
    } finally {
      setIsLoading(false);
    }
  };

  // Загрузка статей расходов/доходов
  const loadArticles = async () => {
    try {
      const data = await financeService.getArticles();
      setArticles(data);
    } catch (error) {
      console.error('Ошибка при загрузке статей:', error);
      toast.error('Не удалось загрузить статьи расходов/доходов');
    }
  };

  // TODO: Загрузка контрагентов, отправлений и заявок через API
  const loadRequiredData = async () => {
    try {
      // Заглушка для демонстрации
      setCounterparties([
        { id: 1, name: 'Контрагент 1' },
        { id: 2, name: 'Контрагент 2' },
      ]);
      
      setShipments([
        { id: 1, number: 'SH-001' },
        { id: 2, number: 'SH-002' },
      ]);
      
      setRequests([
        { id: 1, number: 'RQ-001' },
        { id: 2, number: 'RQ-002' },
      ]);
    } catch (error) {
      console.error('Ошибка при загрузке данных:', error);
    }
  };

  useEffect(() => {
    // Загружаем данные при монтировании компонента
    loadFinances();
    loadArticles();
    loadRequiredData();
  }, []);

  // Обработчик создания финансовой операции
  const handleAddFinance = async (data: FinanceFormData) => {
    try {
      const payload = {
        ...data,
        company: user?.companyId ? parseInt(user.companyId) : undefined,
      };
      
      const createdFinance = await financeService.createFinance(payload);
      
      await loadFinances();
      setIsAddDialogOpen(false);
      form.reset();
      toast.success('Финансовая операция успешно создана');
    } catch (error) {
      console.error('Ошибка при создании финансовой операции:', error);
      toast.error('Не удалось создать финансовую операцию');
    }
  };

  // Обработчик открытия диалога редактирования
  const handleEditClick = (finance: Finance) => {
    setSelectedFinance(finance);
    form.reset({
      operationType: finance.operationType,
      paymentDate: finance.paymentDate,
      documentType: finance.documentType,
      currency: finance.currency,
      counterparty: finance.counterparty,
      article: finance.article,
      comment: finance.comment || '',
      amount: finance.amount,
      isPaid: finance.isPaid,
      shipment: finance.shipment,
      request: finance.request,
      basis: finance.basis,
    });
    setIsEditDialogOpen(true);
  };

  // Обработчик обновления финансовой операции
  const handleUpdateFinance = async (data: FinanceFormData) => {
    if (!selectedFinance) return;
    
    try {
      await financeService.updateFinance(selectedFinance.number.toString(), data);
      
      await loadFinances();
      setIsEditDialogOpen(false);
      form.reset();
      toast.success('Финансовая операция успешно обновлена');
    } catch (error) {
      console.error('Ошибка при обновлении финансовой операции:', error);
      toast.error('Не удалось обновить финансовую операцию');
    }
  };

  // Обработчик открытия диалога удаления
  const handleDeleteClick = (finance: Finance) => {
    setSelectedFinance(finance);
    setIsDeleteDialogOpen(true);
  };

  // Обработчик удаления финансовой операции
  const handleDeleteFinance = async () => {
    if (!selectedFinance) return;
    
    try {
      await financeService.deleteFinance(selectedFinance.number.toString());
      await loadFinances();
      setIsDeleteDialogOpen(false);
      toast.success('Финансовая операция успешно удалена');
    } catch (error) {
      console.error('Ошибка при удалении финансовой операции:', error);
      toast.error('Не удалось удалить финансовую операцию');
    }
  };

  // Обработчик открытия диалога просмотра
  const handleViewClick = (finance: Finance) => {
    setSelectedFinance(finance);
    setIsViewDialogOpen(true);
  };

  return (
    <div className="container mx-auto py-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Финансы</CardTitle>
          <CardDescription>
            Управление финансовыми операциями вашей компании
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Заглушка для демонстрации, так как мы не создавали компонент FinancesDataGrid с нуля */}
          <div className="w-full h-[600px]">
            <div className="mb-4 flex justify-end">
              <Button onClick={() => setIsAddDialogOpen(true)}>
                Добавить финансовую операцию
              </Button>
            </div>
            <div className="text-center p-10 border rounded-md">
              <DollarSign className="w-12 h-12 mx-auto mb-4 text-apple-purple" />
              <h3 className="text-2xl font-bold mb-2">Финансовый модуль</h3>
              <p className="text-gray-500 mb-4">
                Здесь будет отображаться MUI X Data Grid с данными финансовых операций.
              </p>
              <p className="text-sm text-gray-400">
                Для завершения реализации необходимо установить правильные типы и завершить компонент FinancesDataGrid.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Диалог добавления финансовой операции */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Добавить новую финансовую операцию</DialogTitle>
          </DialogHeader>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAddFinance)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="operationType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Тип операции</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите тип операции" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="in">Входящий (доход)</SelectItem>
                            <SelectItem value="out">Исходящий (расход)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="paymentDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Дата оплаты</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="documentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Тип документа</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите тип документа" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="bill">Счёт</SelectItem>
                            <SelectItem value="payment">Оплата</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Валюта</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите валюту" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="rub">Рубль</SelectItem>
                            <SelectItem value="rubbn">Безнал</SelectItem>
                            <SelectItem value="rubnds">НДС</SelectItem>
                            <SelectItem value="eur">Евро</SelectItem>
                            <SelectItem value="usd">Доллар</SelectItem>
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
                    name="counterparty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Контрагент</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))} 
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите контрагента" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {counterparties.map((counterparty) => (
                              <SelectItem key={counterparty.id} value={counterparty.id.toString()}>
                                {counterparty.name}
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
                    name="article"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Статья</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))} 
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите статью" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {articles.map((article) => (
                              <SelectItem key={article.id} value={article.id.toString()}>
                                {article.name}
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
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Сумма</FormLabel>
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
                    name="isPaid"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0 mt-8">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel>Оплачено</FormLabel>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="shipment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Отправление</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))} 
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите отправление" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
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
                  
                  <FormField
                    control={form.control}
                    name="request"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Заявка</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))} 
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите заявку" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {requests.map((request) => (
                              <SelectItem key={request.id} value={request.id.toString()}>
                                {request.number}
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
                  name="comment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Комментарий</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Комментарий к операции" />
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
          </LocalizationProvider>
        </DialogContent>
      </Dialog>
      
      {/* Диалог подтверждения удаления */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Подтверждение удаления</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            Вы действительно хотите удалить финансовую операцию №{' '}
            <strong>{selectedFinance?.number}</strong>?
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
              onClick={handleDeleteFinance}
            >
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 