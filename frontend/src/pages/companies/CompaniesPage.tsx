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
import { PlusIcon, Trash2Icon, EditIcon, SearchIcon, X, LoaderIcon } from 'lucide-react';
import { Company } from '@/types/company';
import { CompanyDialog } from './CompanyDialog';
import { useAuth } from '@/hooks/useAuth';

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
              <TableHead className="w-[120px] text-right">Действия</TableHead>
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
                        onClick={() => handleEditCompany(company)}
                      >
                        <EditIcon className="h-4 w-4" />
                      </Button>
                      <AlertDialog open={deleteCompanyId === company.id}>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeleteCompany(company.id)}
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
    </div>
  );
} 