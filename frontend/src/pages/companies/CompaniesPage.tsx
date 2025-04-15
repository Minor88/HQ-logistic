import { useState } from 'react';
import { useCompanies } from '@/hooks/useCompanies';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusIcon, Trash2Icon, EditIcon, SearchIcon, X, LoaderIcon, UserPlus, UserIcon } from 'lucide-react';
import { Company } from '@/types/company';
import { CompanyDialog } from './CompanyDialog';
import { useAuth } from '@/hooks/useAuth';
import companyService from '@/services/companyService';
import authService from '@/services/authService';
// @ts-ignore - Игнорируем проблемы с типами
import { z } from 'zod';
// @ts-ignore - Игнорируем проблемы с типами
import { zodResolver } from '@hookform/resolvers/zod';
// @ts-ignore - Игнорируем проблемы с типами
import { useForm } from 'react-hook-form';
import { AdminFormData } from '@/types/auth';

// Схема валидации для формы администратора
const adminSchema = z.object({
  email: z.string().email('Введите корректный email'),
  username: z.string().min(3, 'Логин должен содержать минимум 3 символа'),
  first_name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  last_name: z.string().min(2, 'Фамилия должна содержать минимум 2 символа'),
  password: z.union([
    z.string().min(8, 'Пароль должен содержать минимум 8 символов'),
    z.string().length(0)  // Пустая строка
  ]).optional(),
  phone: z.string().optional(),
});

type AdminFormValues = z.infer<typeof adminSchema>;

export default function CompaniesPage() {
  const { user } = useAuth();
  const { 
    companies, 
    metadata, 
    isLoading, 
    queryParams, 
    setPage, 
    setSearch, 
    setLimit,
    createCompany,
    updateCompany,
    deleteCompany,
    isCreating,
    isUpdating,
    isDeleting
  } = useCompanies();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [deleteCompanyId, setDeleteCompanyId] = useState<number | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isAdminDialogOpen, setIsAdminDialogOpen] = useState(false);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);
  const [companyAdmins, setCompanyAdmins] = useState<any[]>([]);
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [deleteAdminId, setDeleteAdminId] = useState<string | null>(null);
  const [editingAdmin, setEditingAdmin] = useState<any | null>(null);
  
  // Используем встроенную форму для админа
  const adminForm = useForm<AdminFormValues>({
    resolver: zodResolver(adminSchema),
    defaultValues: {
      email: '',
      username: '',
      first_name: '',
      last_name: '',
      password: '',
      phone: '',
    },
  });
  
  // Проверяем, является ли пользователь суперюзером
  if (user?.role !== 'superuser') {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center h-[70vh]">
          <h1 className="text-2xl font-bold mb-4">Доступ запрещен</h1>
          <p className="text-gray-600">У вас нет прав для просмотра этой страницы</p>
        </div>
      </div>
    );
  }
  
  // Обработчики действий
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };
  
  const handleClearSearch = () => {
    setSearch('');
  };
  
  const handleEditCompany = (company: Company) => {
    setEditingCompany(company);
  };
  
  const handleCloseEditDialog = () => {
    setEditingCompany(null);
  };
  
  const handleCreateCompany = () => {
    setIsCreateDialogOpen(true);
  };
  
  const handleCloseCreateDialog = () => {
    setIsCreateDialogOpen(false);
  };
  
  const handleDeleteCompany = (id: number) => {
    setDeleteCompanyId(id);
  };
  
  const confirmDelete = () => {
    if (deleteCompanyId) {
      deleteCompany(deleteCompanyId);
      setDeleteCompanyId(null);
    }
  };
  
  // Функции для работы с администраторами
  const handleOpenAdminManager = async (company: Company) => {
    setSelectedCompany(company);
    setIsLoadingAdmins(true);
    try {
      const admins = await companyService.getCompanyAdmins(company.id.toString());
      setCompanyAdmins(admins);
      console.log('Данные администраторов:', admins);
      
      if (admins.length > 0) {
        const firstAdmin = admins[0];
        console.log('Детальная структура первого администратора:', JSON.stringify(firstAdmin, null, 2));
        
        // Вывод всех полей объекта
        for (const key in firstAdmin) {
          if (key === 'user' && firstAdmin[key]) {
            console.log(`Поле ${key}:`, firstAdmin[key]);
          } else {
            console.log(`Поле ${key}: – ${JSON.stringify(firstAdmin[key])}`);
          }
        }
      }
    } catch (error) {
      console.error('Ошибка при загрузке администраторов:', error);
    } finally {
      setIsLoadingAdmins(false);
    }
  };
  
  const handleCloseAdminManager = () => {
    setSelectedCompany(null);
    setCompanyAdmins([]);
  };
  
  const handleAddAdmin = () => {
    setEditingAdmin(null); // Очищаем редактируемого админа, чтобы перейти в режим создания
    adminForm.reset(); // Сбрасываем форму
    setIsAdminDialogOpen(true);
  };
  
  const handleEditAdmin = (admin: any) => {
    setEditingAdmin(admin);
    
    // Заполняем форму данными администратора
    adminForm.reset({
      email: admin.user?.email || '',
      username: admin.user?.username || '',
      first_name: admin.user?.firstName || '',
      last_name: admin.user?.lastName || '',
      password: '', // Пароль не заполняем при редактировании
      phone: admin.phone || '',
    });
    
    setIsAdminDialogOpen(true);
  };
  
  const handleCloseAdminDialog = () => {
    setIsAdminDialogOpen(false);
    setEditingAdmin(null);
  };
  
  const handleSubmitAdmin = async (data: AdminFormValues) => {
    if (!selectedCompany) return;
    
    setIsAddingAdmin(true);
    try {
      // Очищаем пустые поля и формируем данные
      const adminData: Partial<AdminFormData> = {};
      
      if (data.email) adminData.email = data.email;
      if (data.username) adminData.username = data.username;
      if (data.first_name) adminData.first_name = data.first_name;
      if (data.last_name) adminData.last_name = data.last_name;
      if (data.phone) adminData.phone = data.phone;
      if (data.password) adminData.password = data.password;
      
      if (editingAdmin) {
        // Режим редактирования
        await companyService.updateCompanyAdmin(
          selectedCompany.id.toString(), 
          editingAdmin.id.toString(), 
          adminData
        );
      } else {
        // Режим создания
        await companyService.addCompanyAdmin(
          selectedCompany.id.toString(), 
          adminData as AdminFormData
        );
      }
      
      // Обновляем список администраторов
      const admins = await companyService.getCompanyAdmins(selectedCompany.id.toString());
      setCompanyAdmins(admins);
      setIsAdminDialogOpen(false);
      adminForm.reset(); // Сбрасываем форму
      setEditingAdmin(null);
    } catch (error) {
      console.error('Ошибка при сохранении администратора:', error);
    } finally {
      setIsAddingAdmin(false);
    }
  };
  
  const handleDeleteAdmin = (adminId: string) => {
    setDeleteAdminId(adminId);
  };
  
  const confirmDeleteAdmin = async () => {
    if (!selectedCompany || !deleteAdminId) return;
    
    try {
      await companyService.removeCompanyAdmin(selectedCompany.id.toString(), deleteAdminId);
      const admins = await companyService.getCompanyAdmins(selectedCompany.id.toString());
      setCompanyAdmins(admins);
    } catch (error) {
      console.error('Ошибка при удалении администратора:', error);
    } finally {
      setDeleteAdminId(null);
    }
  };
  
  // Генерация элементов пагинации
  const renderPaginationItems = () => {
    const items = [];
    const maxVisible = 5;
    const halfVisible = Math.floor(maxVisible / 2);
    
    let startPage = Math.max(1, metadata.page - halfVisible);
    let endPage = Math.min(metadata.totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink 
            onClick={() => setPage(i)}
            isActive={metadata.page === i}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    return items;
  };
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Управление компаниями</h1>
        <Button onClick={handleCreateCompany}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Добавить компанию
        </Button>
      </div>
      
      <div className="relative mb-6">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          className="pl-10 pr-10"
          placeholder="Поиск компаний..."
          value={queryParams.search || ''}
          onChange={handleSearchChange}
        />
        {queryParams.search && (
          <button 
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            onClick={handleClearSearch}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Название</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Телефон</TableHead>
              <TableHead>Адрес</TableHead>
              <TableHead className="w-[180px] text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <div className="flex justify-center items-center">
                    <LoaderIcon className="h-6 w-6 animate-spin mr-2" />
                    Загрузка...
                  </div>
                </TableCell>
              </TableRow>
            ) : companies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Компании не найдены
                </TableCell>
              </TableRow>
            ) : (
              companies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell className="font-medium">{company.name}</TableCell>
                  <TableCell>{company.email || '—'}</TableCell>
                  <TableCell>{company.phone || '—'}</TableCell>
                  <TableCell>{company.address || '—'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleOpenAdminManager(company)}
                        title="Управление администраторами"
                      >
                        <UserIcon className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleEditCompany(company)}
                        title="Редактировать компанию"
                      >
                        <EditIcon className="h-4 w-4" />
                      </Button>
                      <AlertDialog open={deleteCompanyId === company.id}>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeleteCompany(company.id)}
                            title="Удалить компанию"
                          >
                            <Trash2Icon className="h-4 w-4 text-red-500" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Удаление компании</AlertDialogTitle>
                            <AlertDialogDescription>
                              Вы уверены, что хотите удалить компанию "{company.name}"? 
                              Это действие невозможно отменить.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setDeleteCompanyId(null)}>
                              Отмена
                            </AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={confirmDelete}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              Удалить
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {metadata.totalPages > 1 && (
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Показано {metadata.page > 0 ? (metadata.page - 1) * metadata.limit + 1 : 0} - 
            {Math.min(metadata.page * metadata.limit, metadata.total)} из {metadata.total}
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setPage(Math.max(1, metadata.page - 1))}
                  className={metadata.page <= 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              
              {renderPaginationItems()}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setPage(Math.min(metadata.totalPages, metadata.page + 1))}
                  className={metadata.page >= metadata.totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
      
      {/* Модальное окно для создания компании */}
      {isCreateDialogOpen && (
        <CompanyDialog 
          open={isCreateDialogOpen}
          onClose={handleCloseCreateDialog}
          onSubmit={(data) => {
            createCompany(data);
            handleCloseCreateDialog();
          }}
          isLoading={isCreating}
        />
      )}
      
      {/* Модальное окно для редактирования компании */}
      {editingCompany && (
        <CompanyDialog 
          open={!!editingCompany}
          company={editingCompany}
          onClose={handleCloseEditDialog}
          onSubmit={(data) => {
            updateCompany(editingCompany.id, data);
            handleCloseEditDialog();
          }}
          isLoading={isUpdating}
        />
      )}
      
      {/* Модальное окно для управления администраторами */}
      <Dialog open={!!selectedCompany} onOpenChange={(open) => !open && handleCloseAdminManager()}>
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle>Управление администраторами компании "{selectedCompany?.name}"</DialogTitle>
            <DialogDescription>
              Здесь вы можете добавлять и удалять администраторов компании
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingAdmins ? (
            <div className="flex justify-center items-center p-8">
              <LoaderIcon className="h-6 w-6 animate-spin mr-2" />
              Загрузка администраторов...
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Администраторы</h3>
                <Button size="sm" onClick={handleAddAdmin}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Добавить
                </Button>
              </div>
              
              {companyAdmins.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  У компании нет администраторов
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Имя</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="w-[80px] text-right">Действия</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {companyAdmins.map((admin) => (
                        <TableRow key={admin.id}>
                          <TableCell>{`${admin.user?.firstName || ''} ${admin.user?.lastName || ''}`}</TableCell>
                          <TableCell>{admin.user?.email || ''}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleEditAdmin(admin)}
                              >
                                <EditIcon className="h-4 w-4" />
                              </Button>
                              <AlertDialog open={deleteAdminId === admin.id}>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => handleDeleteAdmin(admin.id)}
                                  >
                                    <Trash2Icon className="h-4 w-4 text-red-500" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Удаление администратора</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Вы уверены, что хотите удалить администратора {admin.user?.firstName || ''} {admin.user?.lastName || ''}?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setDeleteAdminId(null)}>
                                      Отмена
                                    </AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={confirmDeleteAdmin}
                                      className="bg-red-500 hover:bg-red-600"
                                    >
                                      Удалить
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              
              <DialogFooter>
                <Button variant="outline" onClick={handleCloseAdminManager}>
                  Закрыть
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Диалог добавления/редактирования администратора */}
      <Dialog open={isAdminDialogOpen} onOpenChange={(open) => {
        if (!open) handleCloseAdminDialog();
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingAdmin ? 'Редактировать администратора' : 'Добавить администратора'}
            </DialogTitle>
            <DialogDescription>
              {editingAdmin 
                ? `Редактирование администратора для компании "${selectedCompany?.name}"`
                : `Добавление администратора для компании "${selectedCompany?.name}"`
              }
            </DialogDescription>
          </DialogHeader>
          <Form {...adminForm}>
            <form onSubmit={adminForm.handleSubmit(handleSubmitAdmin)} className="space-y-4">
              <FormField
                control={adminForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={adminForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Логин</FormLabel>
                    <FormControl>
                      <Input placeholder="username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={adminForm.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Имя</FormLabel>
                    <FormControl>
                      <Input placeholder="Иван" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={adminForm.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Фамилия</FormLabel>
                    <FormControl>
                      <Input placeholder="Иванов" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={adminForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Телефон</FormLabel>
                    <FormControl>
                      <Input placeholder="+7 (999) 123-45-67" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={adminForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{editingAdmin ? "Новый пароль (оставьте пустым, чтобы не менять)" : "Пароль"}</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="********" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseAdminDialog}>
                  Отмена
                </Button>
                <Button type="submit" disabled={isAddingAdmin}>
                  {isAddingAdmin ? (
                    <>
                      <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                      {editingAdmin ? 'Сохранение...' : 'Добавление...'}
                    </>
                  ) : (
                    editingAdmin ? 'Сохранить' : 'Добавить'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 