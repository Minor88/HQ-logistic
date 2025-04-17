import React, { useState } from 'react';
import { CustomTable } from '@/components/ui/custom-table';
import { Request } from '@/services/requestService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  FileText, 
  Folder, 
  Eye, 
  Edit2, 
  Trash2, 
  Truck 
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { ColumnDef } from '@tanstack/react-table';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export interface RequestsTableProps {
  /**
   * Данные заявок для отображения
   */
  requests: Request[];
  
  /**
   * Загрузка данных
   */
  isLoading: boolean;
  
  /**
   * Поисковый запрос
   */
  searchQuery: string;
  
  /**
   * Обработчик изменения поискового запроса
   */
  onSearchChange: (value: string) => void;
  
  /**
   * Обработчик открытия диалога просмотра заявки
   */
  onViewClick: (request: Request) => void;
  
  /**
   * Обработчик открытия диалога редактирования заявки
   */
  onEditClick: (request: Request) => void;
  
  /**
   * Обработчик открытия диалога удаления заявки
   */
  onDeleteClick: (request: Request) => void;
  
  /**
   * Обработчик открытия диалога с файлами заявки
   */
  onFilesClick: (request: Request) => void;
  
  /**
   * Обработчик открытия диалога добавления новой заявки
   */
  onAddClick: () => void;
  
  /**
   * Обработчик открытия диалога фильтров
   */
  onFiltersClick: () => void;
  
  /**
   * Обработчик очистки фильтров
   */
  onClearFilters: () => void;
  
  /**
   * Обработчик экспорта в Excel
   */
  onExportToExcel: () => void;
  
  /**
   * Функция получения варианта бейджа для статуса
   */
  getStatusBadgeVariant: (statusId: number) => "default" | "secondary" | "destructive" | "outline";
  
  /**
   * Функция получения имени статуса по ID
   */
  getStatusName: (statusId: number) => string;
  
  /**
   * Проверка прав на редактирование заявки
   */
  canEditRequest: (request: Request) => boolean;
}

export function RequestsTable({
  requests,
  isLoading,
  searchQuery,
  onSearchChange,
  onViewClick,
  onEditClick,
  onDeleteClick,
  onFilesClick,
  onAddClick,
  onFiltersClick,
  onClearFilters,
  onExportToExcel,
  getStatusBadgeVariant,
  getStatusName,
  canEditRequest
}: RequestsTableProps) {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Определение колонок таблицы
  const columns = React.useMemo<ColumnDef<Request>[]>(
    () => [
      {
        accessorKey: 'number',
        header: 'Номер',
        cell: ({ row }) => (
          <div className="flex items-center">
            <FileText className="h-4 w-4 mr-2 text-apple-purple" />
            {row.original.number}
          </div>
        ),
        size: 120,
      },
      {
        accessorKey: 'createdAt',
        header: 'Дата создания',
        cell: ({ row }) => (
          <span className="font-medium">
            {formatDate(row.original.createdAt) || 'Н/Д'}
          </span>
        ),
        size: 150,
      },
      {
        accessorKey: 'warehouseNumber',
        header: 'Складской №',
        cell: ({ row }) => row.original.warehouseNumber || '-',
        size: 130,
      },
      {
        accessorKey: 'description',
        header: 'Описание',
        cell: ({ row }) => (
          <div className="max-w-[200px] truncate" title={row.original.description || ''}>
            {row.original.description || '-'}
          </div>
        ),
        size: 200,
      },
      {
        accessorKey: 'places',
        header: 'Кол-во мест',
        cell: ({ row }) => row.original.places || '-',
        size: 100,
      },
      {
        accessorKey: 'weight',
        header: 'Вес (кг)',
        cell: ({ row }) => row.original.weight || '-',
        size: 100,
      },
      {
        accessorKey: 'volume',
        header: 'Объем (м³)',
        cell: ({ row }) => row.original.volume || '-',
        size: 100,
      },
      {
        accessorKey: 'actualWeight',
        header: 'Факт. вес (кг)',
        cell: ({ row }) => row.original.actualWeight || '-',
        size: 120,
      },
      {
        accessorKey: 'actualVolume',
        header: 'Факт. объем (м³)',
        cell: ({ row }) => row.original.actualVolume || '-',
        size: 140,
      },
      {
        accessorKey: 'rate',
        header: 'Ставка',
        cell: ({ row }) => row.original.rate || '-',
        size: 100,
      },
      {
        accessorKey: 'comment',
        header: 'Комментарий',
        cell: ({ row }) => (
          <div className="max-w-[200px] truncate" title={row.original.comment || ''}>
            {row.original.comment || '-'}
          </div>
        ),
        size: 200,
      },
      {
        accessorKey: 'clientName',
        header: 'Клиент',
        cell: ({ row }) => row.original.clientName || 'Н/Д',
        size: 150,
      },
      {
        accessorKey: 'status',
        header: 'Статус',
        cell: ({ row }) => (
          <Badge variant={getStatusBadgeVariant(row.original.status)}>
            {row.original.statusDisplay || getStatusName(row.original.status) || 'Неизвестный статус'}
          </Badge>
        ),
        size: 150,
      },
      {
        accessorKey: 'shipmentNumber',
        header: 'Отправление',
        cell: ({ row }) => (
          row.original.shipmentNumber ? (
            <Link 
              to={`/shipments?id=${row.original.shipment}`}
              className="text-apple-purple hover:underline flex items-center"
            >
              <Truck className="h-4 w-4 mr-1" />
              {row.original.shipmentNumber}
            </Link>
          ) : '-'
        ),
        size: 150,
      },
      {
        accessorKey: 'shipmentStatusDisplay',
        header: 'Статус отправления',
        cell: ({ row }) => (
          row.original.shipmentStatusDisplay ? (
            <Badge variant="outline">
              {row.original.shipmentStatusDisplay}
            </Badge>
          ) : '-'
        ),
        size: 170,
      },
      {
        accessorKey: 'shipmentComment',
        header: 'Комментарий отправления',
        cell: ({ row }) => (
          <div className="max-w-[200px] truncate" title={row.original.shipmentComment || ''}>
            {row.original.shipmentComment || '-'}
          </div>
        ),
        size: 200,
      },
      {
        id: 'files',
        header: 'Файлы',
        cell: ({ row }) => (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onFilesClick(row.original);
            }}
          >
            <Folder className="h-4 w-4" />
          </Button>
        ),
        size: 80,
      },
      {
        id: 'actions',
        header: 'Действия',
        cell: ({ row }) => (
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onViewClick(row.original);
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
            {canEditRequest(row.original) && (
              <>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditClick(row.original);
                  }}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button 
                  variant="destructive" 
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteClick(row.original);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        ),
        size: 150,
      },
    ],
    [onViewClick, onEditClick, onDeleteClick, onFilesClick, canEditRequest, getStatusBadgeVariant, getStatusName]
  );

  // Рендерим контролы таблицы
  const renderTableControls = () => (
    <div className="flex justify-between w-full">
      <div className="w-1/3">
        <Input
          placeholder="Поиск заявок..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="flex space-x-2">
        <Button
          variant="outline"
          onClick={onFiltersClick}
        >
          Фильтры
        </Button>
        <Button
          variant="outline"
          onClick={onClearFilters}
        >
          Очистить фильтры
        </Button>
        <Button
          variant="outline"
          onClick={onExportToExcel}
        >
          Экспорт в Excel
        </Button>
        <Button onClick={onAddClick}>
          Добавить заявку
        </Button>
      </div>
    </div>
  );

  // Рендерим пагинацию
  const renderPagination = (table: any) => {
    const totalPages = table.getPageCount();
    const currentPage = table.getState().pagination.pageIndex + 1;
    
    const goToPage = (page: number) => {
      table.setPageIndex(page - 1);
    };
    
    return (
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Показано {table.getRowModel().rows.length} из {requests.length} заявок
        </div>
        <Pagination>
          <PaginationContent>
            {table.getCanPreviousPage() ? (
              <PaginationItem>
                <PaginationPrevious onClick={() => table.previousPage()} />
              </PaginationItem>
            ) : (
              <PaginationItem>
                <PaginationPrevious className="pointer-events-none opacity-50" />
              </PaginationItem>
            )}
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageIndex = i + 1;
              return (
                <PaginationItem key={pageIndex}>
                  <PaginationLink 
                    isActive={currentPage === pageIndex}
                    onClick={() => goToPage(pageIndex)}
                  >
                    {pageIndex}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            
            {totalPages > 5 && currentPage <= 3 && (
              <>
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink onClick={() => goToPage(totalPages)}>
                    {totalPages}
                  </PaginationLink>
                </PaginationItem>
              </>
            )}
            
            {totalPages > 5 && currentPage > 3 && currentPage < totalPages - 2 && (
              <>
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink 
                    isActive={true}
                    onClick={() => goToPage(currentPage)}
                  >
                    {currentPage}
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink onClick={() => goToPage(totalPages)}>
                    {totalPages}
                  </PaginationLink>
                </PaginationItem>
              </>
            )}
            
            {totalPages > 5 && currentPage >= totalPages - 2 && currentPage !== totalPages && (
              <>
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
                {Array.from({ length: 3 }, (_, i) => {
                  const pageIndex = totalPages - 2 + i;
                  return (
                    <PaginationItem key={pageIndex}>
                      <PaginationLink 
                        isActive={currentPage === pageIndex}
                        onClick={() => goToPage(pageIndex)}
                      >
                        {pageIndex}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
              </>
            )}
            
            {table.getCanNextPage() ? (
              <PaginationItem>
                <PaginationNext onClick={() => table.nextPage()} />
              </PaginationItem>
            ) : (
              <PaginationItem>
                <PaginationNext className="pointer-events-none opacity-50" />
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      </div>
    );
  };

  return (
    <CustomTable 
      tableId="requests-table"
      columns={columns}
      data={requests}
      height={600}
      onRowClick={onViewClick}
      renderTableControls={renderTableControls}
      renderPagination={renderPagination}
    />
  );
} 