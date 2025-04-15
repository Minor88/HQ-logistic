/**
 * @ts-ignore: Игнорируем ошибку с импортом useForm
 */
// Стандартный импорт из react-hook-form не работает, используем ts-ignore для обхода проблемы
import React, { useEffect, useState } from 'react';
import { z } from 'zod';
// @ts-ignore
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import userService, { UserFormData } from '@/services/userService';
import { PaginatedResponse, UserProfile, UserRole } from '@/types/user';
import { useAuth } from '@/hooks/useAuth';

// Схема валидации для формы пользователя
const userSchema = z.object({
  email: z.string().email({ message: 'Некорректный email' }),
  username: z.string().min(3, { message: 'Минимум 3 символа' }),
  first_name: z.string().min(2, { message: 'Введите имя' }),
  last_name: z.string().min(2, { message: 'Введите фамилию' }),
  password: z.string().min(6, { message: 'Минимум 6 символов' }),
  phone: z.string().optional(),
  user_group: z.enum(['admin', 'boss', 'manager', 'warehouse', 'client']),
});

export default function UsersPage() {
  // Состояние списка пользователей
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Состояние диалогов
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  
  const { user } = useAuth();
  
  // Инициализация формы
  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: '',
      username: '',
      first_name: '',
      last_name: '',
      password: '',
      phone: '',
      user_group: 'manager',
    },
  });

  // Загрузка списка пользователей
  const loadUsers = async () => {
    try {
      setIsLoading(true);
      
      const data = await userService.getCompanyUsers();
      console.log('[UsersPage] Получен ответ от API:', {
        тип: typeof data,
        isPaginated: data && typeof data === 'object' && 'results' in data,
        isArray: Array.isArray(data)
      });
      
      if (data && data.results) {
        console.log('[UsersPage] Получены данные в пагинированном формате:', 
          data.results.length, 'пользователей');
        setUsers(data.results);
        setFilteredUsers(data.results);
      } else if (Array.isArray(data)) {
        console.log('[UsersPage] Получены данные в формате массива:', 
          data.length, 'пользователей');
        setUsers(data);
        setFilteredUsers(data);
      } else {
        console.error('[UsersPage] Неожиданный формат данных от API');
        setUsers([]);
        setFilteredUsers([]);
      }
    } catch (error) {
      console.error('[UsersPage] Ошибка при загрузке пользователей:', error);
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Загрузка пользователей при монтировании
  useEffect(() => {
    loadUsers();
  }, []);

  // Фильтрация пользователей при изменении поискового запроса
  useEffect(() => {
    if (!users || !Array.isArray(users)) {
      setFilteredUsers([]);
      return;
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const filtered = users.filter(
        profile => 
          profile.user.email.toLowerCase().includes(query) ||
          profile.user.first_name.toLowerCase().includes(query) ||
          profile.user.last_name.toLowerCase().includes(query) ||
          (profile.phone && profile.phone.includes(query))
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  // Проверка на доступность создания пользователей
  const canManageUsers = user?.role === 'admin' || user?.role === 'boss';

  // Обработчик создания пользователя
  const handleAddUser = async (data: UserFormData) => {
    try {
      await userService.createUser(data);
      await loadUsers();
      setIsAddDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error('Ошибка при создании пользователя:', error);
    }
  };

  // Обработчик открытия диалога редактирования
  const handleEditClick = async (profile: UserProfile) => {
    setSelectedUser(profile);
    
    // Используем camelCase или snake_case поля в зависимости от того, что доступно
    form.reset({
      email: profile.user.email,
      username: profile.user.username,
      first_name: profile.user.firstName || profile.user.first_name || '',
      last_name: profile.user.lastName || profile.user.last_name || '',
      password: '', // Не заполняем пароль при редактировании
      phone: profile.phone || '',
      user_group: (profile.userGroup || profile.user_group || 'manager') as UserRole,
    });
    
    setIsEditDialogOpen(true);
  };

  // Обработчик обновления пользователя
  const handleUpdateUser = async (data: UserFormData) => {
    if (!selectedUser) return;
    
    // Удаляем пароль из данных, если он пустой
    const updateData: Partial<UserFormData> = { ...data };
    if (!updateData.password) {
      delete updateData.password;
    }
    
    try {
      await userService.updateUser(selectedUser.id.toString(), updateData);
      await loadUsers();
      setIsEditDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error('Ошибка при обновлении пользователя:', error);
    }
  };

  // Обработчик открытия диалога удаления
  const handleDeleteClick = (profile: UserProfile) => {
    setSelectedUser(profile);
    setIsDeleteDialogOpen(true);
  };

  // Обработчик удаления пользователя
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      await userService.deleteUser(selectedUser.id.toString());
      await loadUsers();
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Ошибка при удалении пользователя:', error);
    }
  };

  // Получение названия роли
  const getRoleName = (role: string): string => {
    const roleMap: Record<string, string> = {
      'superuser': 'Суперпользователь',
      'admin': 'Администратор',
      'boss': 'Руководитель',
      'manager': 'Менеджер',
      'warehouse': 'Работник склада',
      'client': 'Клиент',
    };
    
    return roleMap[role] || role;
  };

  return (
    <div className="container mx-auto py-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Управление пользователями</CardTitle>
          <CardDescription>
            Просмотр, добавление и редактирование пользователей вашей компании
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between mb-4">
            <div className="w-1/3">
              <Input
                placeholder="Поиск пользователей..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {canManageUsers && (
              <Button onClick={() => {
                form.reset({
                  email: '',
                  username: '',
                  first_name: '',
                  last_name: '',
                  password: '',
                  phone: '',
                  user_group: 'manager',
                });
                setIsAddDialogOpen(true);
              }}>
                Добавить пользователя
              </Button>
            )}
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Имя</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Телефон</TableHead>
                <TableHead>Роль</TableHead>
                <TableHead>Статус</TableHead>
                {canManageUsers && <TableHead>Действия</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={canManageUsers ? 6 : 5} className="text-center">
                    Загрузка...
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canManageUsers ? 6 : 5} className="text-center">
                    Пользователи не найдены
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((profile) => {
                  // Безопасное извлечение данных с учетом camelCase полей
                  const firstName = profile.user?.firstName || profile.user?.first_name || '';
                  const lastName = profile.user?.lastName || profile.user?.last_name || '';
                  const email = profile.user?.email || '';
                  const roleName = profile.roleDisplay || profile.role_display || 
                    (profile.userGroup && getRoleName(profile.userGroup)) || 
                    (profile.user_group && getRoleName(profile.user_group)) || 
                    'Неизвестно';
                  const isActive = profile.isActive !== undefined ? profile.isActive : profile.is_active;
                  
                  return (
                    <TableRow key={profile.id}>
                      <TableCell>
                        {firstName} {lastName}
                      </TableCell>
                      <TableCell>{email}</TableCell>
                      <TableCell>{profile.phone || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {roleName}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={isActive ? "success" : "destructive"}>
                          {isActive ? "Активен" : "Неактивен"}
                        </Badge>
                      </TableCell>
                      {canManageUsers && (
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditClick(profile)}
                            >
                              Изменить
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleDeleteClick(profile)}
                            >
                              Удалить
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Диалог добавления пользователя */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Добавить нового пользователя</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddUser)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="email@example.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Логин</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="username" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Имя</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Иван" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Фамилия</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Иванов" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Пароль</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" placeholder="******" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Телефон</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="+7 (999) 123-45-67" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="user_group"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Роль пользователя</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите роль" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {user?.role === 'boss' && (
                          <SelectItem value="admin">Администратор</SelectItem>
                        )}
                        <SelectItem value="manager">Менеджер</SelectItem>
                        <SelectItem value="warehouse">Работник склада</SelectItem>
                        <SelectItem value="client">Клиент</SelectItem>
                      </SelectContent>
                    </Select>
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
      
      {/* Диалог редактирования пользователя */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Редактировать пользователя</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleUpdateUser)} className="space-y-4">
              {/* Те же поля формы, что и при добавлении */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="email@example.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Логин</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="username" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Имя</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Иван" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Фамилия</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Иванов" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Пароль (оставьте пустым, чтобы не менять)</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" placeholder="******" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Телефон</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="+7 (999) 123-45-67" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="user_group"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Роль пользователя</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите роль" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {user?.role === 'boss' && (
                          <SelectItem value="admin">Администратор</SelectItem>
                        )}
                        <SelectItem value="manager">Менеджер</SelectItem>
                        <SelectItem value="warehouse">Работник склада</SelectItem>
                        <SelectItem value="client">Клиент</SelectItem>
                      </SelectContent>
                    </Select>
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
            Вы действительно хотите удалить пользователя{' '}
            <strong>
              {selectedUser?.user.first_name} {selectedUser?.user.last_name}
            </strong>?
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
              onClick={handleDeleteUser}
            >
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 