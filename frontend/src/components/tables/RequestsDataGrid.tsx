import React from 'react';
import { 
  DataGrid, 
  GridColDef, 
  GridToolbar, 
  GridRenderCellParams,
  GridActionsCellItem,
  GridRowParams
} from '@mui/x-data-grid';
import { Request } from '@/services/requestService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Eye, 
  Edit2, 
  Trash2, 
  Folder, 
  Truck 
} from 'lucide-react';

export interface RequestsDataGridProps {
  /**
   * Данные заявок для отображения
   */
  requests: Request[];
  
  /**
   * Загрузка данных
   */
  isLoading: boolean;
  
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

  /**
   * Обработчик изменения страницы пагинации
   */
  onPageChange?: (newPage: number) => void;

  /**
   * Обработчик изменения количества строк на странице
   */
  onRowsPerPageChange?: (pageSize: number) => void;

  /**
   * Текущая страница (для пагинации)
   */
  page?: number;

  /**
   * Количество строк на странице (для пагинации)
   */
  pageSize?: number;
}

export function RequestsDataGrid({
  requests,
  isLoading,
  onViewClick,
  onEditClick,
  onDeleteClick,
  onFilesClick,
  onAddClick,
  getStatusBadgeVariant,
  getStatusName,
  canEditRequest,
  onPageChange,
  onRowsPerPageChange,
  page = 0,
  pageSize = 10
}: RequestsDataGridProps) {
  // Добавляем отладочный вывод
  console.log('Requests получены в таблицу:', requests);
  
  if (requests.length > 0) {
    console.log('Пример данных первой заявки:', {
      colMest: requests[0].colMest,
      declaredWeight: requests[0].declaredWeight,
      declaredVolume: requests[0].declaredVolume,
      actualWeight: requests[0].actualWeight,
      actualVolume: requests[0].actualVolume,
      rate: requests[0].rate,
      comment: requests[0].comment,
      // Поля для обратной совместимости
      places: requests[0].places,
      weight: requests[0].weight,
      volume: requests[0].volume
    });
  }
  
  // Преобразуем данные для DataGrid (добавляем id, если его нет)
  const rows = requests.map(request => {
    // Убедимся, что у нас есть все необходимые поля для отображения
    const safeRequest = {
      id: request.id || Math.random().toString(36).substr(2, 9),
      number: request.number || '',
      createdAt: request.createdAt || '',
      warehouseNumber: request.warehouseNumber || '',
      description: request.description || '',
      // Используем как новые, так и поля для обратной совместимости, с принудительным преобразованием в Number
      colMest: request.colMest !== undefined && request.colMest !== null ? Number(request.colMest) : (request.places !== undefined && request.places !== null ? Number(request.places) : null),
      declaredWeight: request.declaredWeight !== undefined && request.declaredWeight !== null ? Number(request.declaredWeight) : (request.weight !== undefined && request.weight !== null ? Number(request.weight) : null),
      declaredVolume: request.declaredVolume !== undefined && request.declaredVolume !== null ? Number(request.declaredVolume) : (request.volume !== undefined && request.volume !== null ? Number(request.volume) : null),
      actualWeight: request.actualWeight !== undefined && request.actualWeight !== null ? Number(request.actualWeight) : null,
      actualVolume: request.actualVolume !== undefined && request.actualVolume !== null ? Number(request.actualVolume) : null,
      rate: request.rate || '',
      comment: request.comment || '',
      clientName: request.clientName || '',
      status: request.status,
      statusCode: request.statusCode || '',
      statusDisplay: request.statusDisplay || '',
      shipment: request.shipment,
      shipmentNumber: request.shipmentNumber || '',
      shipmentStatusDisplay: request.shipmentStatusDisplay || '',
      shipmentComment: request.shipmentComment || '',
      client: request.client,
      manager: request.manager
    };
    return safeRequest;
  });
  
  // Отладочный вывод для преобразованных строк
  console.log('Преобразованные строки для таблицы:', rows);
  if (rows.length > 0) {
    console.log('Пример преобразованных данных:', {
      colMest: rows[0].colMest,
      declaredWeight: rows[0].declaredWeight,
      declaredVolume: rows[0].declaredVolume,
      actualWeight: rows[0].actualWeight,
      actualVolume: rows[0].actualVolume,
      rate: rows[0].rate,
      comment: rows[0].comment
    });
  }

  // Определяем колонки таблицы
  const columns: GridColDef[] = [
    { 
      field: 'number', 
      headerName: 'Номер', 
      width: 120,
      renderCell: (params: GridRenderCellParams<Request>) => (
        <div className="flex items-center">
          <FileText className="h-4 w-4 mr-2 text-apple-purple" />
          {params.value !== undefined ? params.value : '-'}
        </div>
      )
    },
    { 
      field: 'createdAt', 
      headerName: 'Дата создания', 
      width: 150,
      renderCell: (params: GridRenderCellParams<Request>) => {
        if (params.value === undefined || params.value === null) return <span>Н/Д</span>;
        return <span>{formatDate(params.value as string) || 'Н/Д'}</span>;
      }
    },
    { 
      field: 'warehouseNumber', 
      headerName: 'Складской №', 
      width: 130,
      renderCell: (params: GridRenderCellParams<Request>) => {
        return <span>{params.value !== undefined && params.value !== null ? params.value : '-'}</span>;
      }
    },
    { 
      field: 'description', 
      headerName: 'Описание', 
      width: 200,
      renderCell: (params: GridRenderCellParams<Request>) => (
        <div className="max-w-[200px] truncate" title={params.value !== undefined ? params.value as string : ''}>
          {params.value !== undefined ? params.value : '-'}
        </div>
      )
    },
    { 
      field: 'colMest', 
      headerName: 'Кол-во мест', 
      width: 100,
      renderCell: (params: GridRenderCellParams<Request>) => {
        const value = params.value !== undefined && params.value !== null 
          ? typeof params.value === 'number' 
            ? params.value.toString() 
            : params.value 
          : // Проверяем поле places для обратной совместимости
            ((params.row as any).places !== undefined && (params.row as any).places !== null
              ? (params.row as any).places.toString()
              : '-');
        return <span>{value}</span>;
      }
    },
    { 
      field: 'declaredWeight', 
      headerName: 'Вес (кг)', 
      width: 100,
      renderCell: (params: GridRenderCellParams<Request>) => {
        const value = params.value !== undefined && params.value !== null 
          ? typeof params.value === 'number' 
            ? params.value.toString() 
            : params.value 
          : // Проверяем поле weight для обратной совместимости
            ((params.row as any).weight !== undefined && (params.row as any).weight !== null
              ? (params.row as any).weight.toString()
              : '-');
        return <span>{value}</span>;
      }
    },
    { 
      field: 'declaredVolume', 
      headerName: 'Объем (м³)', 
      width: 100,
      renderCell: (params: GridRenderCellParams<Request>) => {
        const value = params.value !== undefined && params.value !== null 
          ? typeof params.value === 'number' 
            ? params.value.toString() 
            : params.value 
          : // Проверяем поле volume для обратной совместимости
            ((params.row as any).volume !== undefined && (params.row as any).volume !== null
              ? (params.row as any).volume.toString()
              : '-');
        return <span>{value}</span>;
      }
    },
    { 
      field: 'actualWeight', 
      headerName: 'Факт. вес (кг)', 
      width: 120,
      renderCell: (params: GridRenderCellParams<Request>) => {
        // Проверяем значение в ячейке
        let value = '-';
        
        if (params.value !== undefined && params.value !== null) {
          value = typeof params.value === 'number' ? params.value.toString() : params.value as string;
        } else if (params.row && (params.row as any).actualWeight !== undefined && (params.row as any).actualWeight !== null) {
          // Проверяем, есть ли поле в объекте строки (дополнительная проверка)
          value = (params.row as any).actualWeight.toString();
        }
        
        return <span>{value}</span>;
      }
    },
    { 
      field: 'actualVolume', 
      headerName: 'Факт. объем (м³)', 
      width: 140,
      renderCell: (params: GridRenderCellParams<Request>) => {
        // Проверяем значение в ячейке
        let value = '-';
        
        if (params.value !== undefined && params.value !== null) {
          value = typeof params.value === 'number' ? params.value.toString() : params.value as string;
        } else if (params.row && (params.row as any).actualVolume !== undefined && (params.row as any).actualVolume !== null) {
          // Проверяем, есть ли поле в объекте строки (дополнительная проверка)
          value = (params.row as any).actualVolume.toString();
        }
        
        return <span>{value}</span>;
      }
    },
    { 
      field: 'rate', 
      headerName: 'Ставка', 
      width: 100,
      renderCell: (params: GridRenderCellParams<Request>) => {
        // Проверяем значение в ячейке
        let value = '-';
        
        if (params.value !== undefined && params.value !== null && params.value !== '') {
          value = params.value as string;
        } else if (params.row && (params.row as any).rate !== undefined && (params.row as any).rate !== null && (params.row as any).rate !== '') {
          // Проверяем, есть ли поле в объекте строки (дополнительная проверка)
          value = (params.row as any).rate as string;
        }
        
        return <span>{value}</span>;
      }
    },
    { 
      field: 'comment', 
      headerName: 'Комментарий', 
      width: 200,
      renderCell: (params: GridRenderCellParams<Request>) => {
        // Проверяем значение в ячейке
        let value = '-';
        let title = '';
        
        if (params.value !== undefined && params.value !== null && params.value !== '') {
          value = params.value as string;
          title = value;
        } else if (params.row && (params.row as any).comment !== undefined && (params.row as any).comment !== null && (params.row as any).comment !== '') {
          // Проверяем, есть ли поле в объекте строки (дополнительная проверка)
          value = (params.row as any).comment as string;
          title = value;
        }
        
        return (
          <div className="max-w-[200px] truncate" title={title}>
            {value}
          </div>
        );
      }
    },
    { 
      field: 'clientName', 
      headerName: 'Клиент', 
      width: 150,
      renderCell: (params: GridRenderCellParams<Request>) => {
        return <span>{params.value !== undefined && params.value !== null ? params.value : 'Н/Д'}</span>;
      }
    },
    { 
      field: 'status', 
      headerName: 'Статус', 
      width: 150,
      renderCell: (params: GridRenderCellParams<Request>) => {
        if (!params.row) return 'Неизвестный статус';
        
        const statusId = params.value !== undefined ? params.value as number : 0;
        const statusDisplay = params.row.statusDisplay || getStatusName(statusId) || 'Неизвестный статус';
        
        return (
          <Badge variant={getStatusBadgeVariant(statusId)}>
            {statusDisplay}
          </Badge>
        );
      }
    },
    { 
      field: 'shipmentNumber', 
      headerName: 'Отправление', 
      width: 150,
      renderCell: (params: GridRenderCellParams<Request>) => {
        if (!params.row || !params.row.shipment) return '-';
        
        return (
          params.value !== undefined && params.value ? (
            <Link 
              to={`/shipments?id=${params.row.shipment}`}
              className="text-apple-purple hover:underline flex items-center"
            >
              <Truck className="h-4 w-4 mr-1" />
              {params.value}
            </Link>
          ) : '-'
        );
      }
    },
    { 
      field: 'shipmentStatusDisplay', 
      headerName: 'Статус отправления', 
      width: 170,
      renderCell: (params: GridRenderCellParams<Request>) => (
        params.value !== undefined && params.value ? (
          <Badge variant="outline">
            {params.value}
          </Badge>
        ) : '-'
      )
    },
    { 
      field: 'shipmentComment', 
      headerName: 'Комментарий отправления', 
      width: 200,
      renderCell: (params: GridRenderCellParams<Request>) => (
        <div className="max-w-[200px] truncate" title={params.value !== undefined ? params.value as string : ''}>
          {params.value !== undefined ? params.value : '-'}
        </div>
      )
    },
    {
      field: 'files',
      headerName: 'Файлы',
      width: 80,
      renderCell: (params: GridRenderCellParams<Request>) => (
        <Button 
          variant="ghost" 
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onFilesClick(params.row);
          }}
        >
          <Folder className="h-4 w-4" />
        </Button>
      )
    },
    {
      field: 'actions',
      headerName: 'Действия',
      width: 150,
      type: 'actions',
      getActions: (params: GridRowParams) => {
        if (!params.row) return [];
        
        const request = params.row as Request;
        const actions = [
          <GridActionsCellItem
            icon={<Eye className="h-4 w-4" />}
            label="Просмотр"
            onClick={() => onViewClick(request)}
            key="view"
          />
        ];
        
        if (canEditRequest(request)) {
          actions.push(
            <GridActionsCellItem
              icon={<Edit2 className="h-4 w-4" />}
              label="Редактировать"
              onClick={() => onEditClick(request)}
              key="edit"
            />,
            <GridActionsCellItem
              icon={<Trash2 className="h-4 w-4" />}
              label="Удалить"
              onClick={() => onDeleteClick(request)}
              color="error"
              key="delete"
            />
          );
        }
        
        return actions;
      }
    }
  ];

  return (
    <div className="w-full h-[600px]">
      <div className="mb-4 flex justify-end">
        <Button onClick={onAddClick}>
          Добавить заявку
        </Button>
      </div>
      <DataGrid
        rows={rows}
        columns={columns}
        loading={isLoading}
        disableRowSelectionOnClick
        autoHeight
        pageSizeOptions={[10, 25, 50, 100]}
        initialState={{
          pagination: {
            paginationModel: { pageSize, page },
          },
        }}
        paginationModel={{ pageSize, page }}
        onPaginationModelChange={(model) => {
          if (onPageChange) onPageChange(model.page);
          if (onRowsPerPageChange) onRowsPerPageChange(model.pageSize);
        }}
        slots={{
          toolbar: GridToolbar,
        }}
        slotProps={{
          toolbar: {
            showQuickFilter: true,
            quickFilterProps: { debounceMs: 500 },
          },
        }}
        sx={{
          boxShadow: 2,
          border: 2,
          borderColor: 'primary.light',
          '& .MuiDataGrid-cell:hover': {
            color: 'primary.main',
          },
        }}
      />
    </div>
  );
} 