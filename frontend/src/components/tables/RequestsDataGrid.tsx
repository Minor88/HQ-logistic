import React, { useMemo } from 'react';
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
import { useDataGridSettings } from '@/hooks/useDataGridSettings';
import { useAuth } from '@/hooks/useAuth';

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

  /**
   * Общее количество записей (для серверной пагинации)
   */
  rowCount?: number;
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
  pageSize = 10,
  rowCount
}: RequestsDataGridProps) {
  // Получаем ID пользователя для уникального идентификатора таблицы
  const { user } = useAuth();
  const userId = user?.id || 'anonymous';
  const tableId = `requests-table`;
  
  console.log('RequestsDataGrid: Инициализация с пользователем', { userId, tableId });
  
  // Используем хук для сохранения настроек
  const { getDataGridProps, settings } = useDataGridSettings(tableId, {
    paginationModel: { page, pageSize }
  });

  // Мемоизируем данные для DataGrid
  const rows = useMemo(() => {
    return requests.map(request => {
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
  }, [requests]);

  // Мемоизируем определения колонок
  const columns = useMemo<GridColDef[]>(() => {
    // Получаем сохраненные ширины колонок
    const columnWidths = settings.columnWidthModel || {};
    
    // Стиль ячейки
    const sx = {
      display: "flex",
      alignItems: "center",
      height: "100%",
      whiteSpace: "nowrap", 
      overflow: "hidden", 
      textOverflow: "ellipsis"
    };
    
    return [
      { 
        field: 'number', 
        headerName: 'Номер', 
        width: columnWidths['number'] || 80,
        renderCell: (params: GridRenderCellParams<Request>) => (
          <div style={sx}>
            <FileText className="h-3 w-3 mr-1 text-apple-purple" />
            {params.value !== undefined ? params.value : '-'}
          </div>
        )
      },
      { 
        field: 'createdAt', 
        headerName: 'Дата создания', 
        width: columnWidths['createdAt'] || 120,
        renderCell: (params: GridRenderCellParams<Request>) => {
          if (params.value === undefined || params.value === null) return <span style={sx}>Н/Д</span>;
          return <span style={sx}>{formatDate(params.value as string) || 'Н/Д'}</span>;
        }
      },
      { 
        field: 'warehouseNumber', 
        headerName: 'Складской №', 
        width: columnWidths['warehouseNumber'] || 100,
        renderCell: (params: GridRenderCellParams<Request>) => {
          return <span style={sx}>{params.value !== undefined && params.value !== null ? params.value : '-'}</span>;
        }
      },
      { 
        field: 'description', 
        headerName: 'Описание', 
        width: columnWidths['description'] || 150,
        renderCell: (params: GridRenderCellParams<Request>) => (
          <div style={{...sx, maxWidth: '150px'}} title={params.value !== undefined ? params.value as string : ''}>
            {params.value !== undefined ? params.value : '-'}
          </div>
        )
      },
      { 
        field: 'colMest', 
        headerName: 'Кол-во мест', 
        width: columnWidths['colMest'] || 80,
        renderCell: (params: GridRenderCellParams<Request>) => {
          const value = params.value !== undefined && params.value !== null 
            ? typeof params.value === 'number' 
              ? params.value.toString() 
              : params.value 
            : ((params.row as any).places !== undefined && (params.row as any).places !== null
                ? (params.row as any).places.toString()
                : '-');
          return <span style={sx}>{value}</span>;
        }
      },
      { 
        field: 'declaredWeight', 
        headerName: 'Вес (кг)', 
        width: columnWidths['declaredWeight'] || 80,
        renderCell: (params: GridRenderCellParams<Request>) => {
          const value = params.value !== undefined && params.value !== null 
            ? typeof params.value === 'number' 
              ? params.value.toString() 
              : params.value 
            : ((params.row as any).weight !== undefined && (params.row as any).weight !== null
                ? (params.row as any).weight.toString()
                : '-');
          return <span style={sx}>{value}</span>;
        }
      },
      { 
        field: 'declaredVolume', 
        headerName: 'Объем (м³)', 
        width: columnWidths['declaredVolume'] || 80,
        renderCell: (params: GridRenderCellParams<Request>) => {
          const value = params.value !== undefined && params.value !== null 
            ? typeof params.value === 'number' 
              ? params.value.toString() 
              : params.value 
            : ((params.row as any).volume !== undefined && (params.row as any).volume !== null
                ? (params.row as any).volume.toString()
                : '-');
          return <span style={sx}>{value}</span>;
        }
      },
      { 
        field: 'actualWeight', 
        headerName: 'Факт. вес (кг)', 
        width: columnWidths['actualWeight'] || 90,
        renderCell: (params: GridRenderCellParams<Request>) => {
          // Проверяем значение в ячейке
          let value = '-';
          
          if (params.value !== undefined && params.value !== null) {
            value = typeof params.value === 'number' ? params.value.toString() : params.value as string;
          } else if (params.row && (params.row as any).actualWeight !== undefined && (params.row as any).actualWeight !== null) {
            // Проверяем, есть ли поле в объекте строки (дополнительная проверка)
            value = (params.row as any).actualWeight.toString();
          }
          
          return <span style={sx}>{value}</span>;
        }
      },
      { 
        field: 'actualVolume', 
        headerName: 'Факт. объем (м³)', 
        width: columnWidths['actualVolume'] || 100,
        renderCell: (params: GridRenderCellParams<Request>) => {
          // Проверяем значение в ячейке
          let value = '-';
          
          if (params.value !== undefined && params.value !== null) {
            value = typeof params.value === 'number' ? params.value.toString() : params.value as string;
          } else if (params.row && (params.row as any).actualVolume !== undefined && (params.row as any).actualVolume !== null) {
            // Проверяем, есть ли поле в объекте строки (дополнительная проверка)
            value = (params.row as any).actualVolume.toString();
          }
          
          return <span style={sx}>{value}</span>;
        }
      },
      { 
        field: 'rate', 
        headerName: 'Ставка', 
        width: columnWidths['rate'] || 80,
        renderCell: (params: GridRenderCellParams<Request>) => {
          // Проверяем значение в ячейке
          let value = '-';
          
          if (params.value !== undefined && params.value !== null && params.value !== '') {
            value = params.value as string;
          } else if (params.row && (params.row as any).rate !== undefined && (params.row as any).rate !== null && (params.row as any).rate !== '') {
            // Проверяем, есть ли поле в объекте строки (дополнительная проверка)
            value = (params.row as any).rate as string;
          }
          
          return <span style={sx}>{value}</span>;
        }
      },
      { 
        field: 'comment', 
        headerName: 'Комментарий', 
        width: columnWidths['comment'] || 150,
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
            <div style={{...sx, maxWidth: '150px'}} title={title}>
              {value}
            </div>
          );
        }
      },
      { 
        field: 'clientName', 
        headerName: 'Клиент', 
        width: columnWidths['clientName'] || 120,
        renderCell: (params: GridRenderCellParams<Request>) => {
          return <span style={sx}>{params.value !== undefined && params.value !== null ? params.value : 'Н/Д'}</span>;
        }
      },
      { 
        field: 'status', 
        headerName: 'Статус', 
        width: columnWidths['status'] || 120,
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
        width: columnWidths['shipmentNumber'] || 120,
        renderCell: (params: GridRenderCellParams<Request>) => {
          if (!params.row || !params.row.shipment) return '-';
          
          return (
            params.value !== undefined && params.value ? (
              <Link 
                to={`/shipments?id=${params.row.shipment}`}
                className="text-apple-purple hover:underline flex items-center"
              >
                <Truck className="h-3 w-3 mr-1" />
                {params.value}
              </Link>
            ) : '-'
          );
        }
      },
      { 
        field: 'shipmentStatusDisplay', 
        headerName: 'Статус отправления', 
        width: columnWidths['shipmentStatusDisplay'] || 130,
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
        width: columnWidths['shipmentComment'] || 150,
        renderCell: (params: GridRenderCellParams<Request>) => (
          <div style={{...sx, maxWidth: '150px'}} title={params.value !== undefined ? params.value as string : ''}>
            {params.value !== undefined ? params.value : '-'}
          </div>
        )
      },
      {
        field: 'files',
        headerName: 'Файлы',
        width: columnWidths['files'] || 60,
        renderCell: (params: GridRenderCellParams<Request>) => (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onFilesClick(params.row);
            }}
          >
            <Folder className="h-3 w-3" />
          </Button>
        )
      },
      {
        field: 'actions',
        headerName: 'Действия',
        width: columnWidths['actions'] || 120,
        type: 'actions',
        getActions: (params: GridRowParams) => {
          if (!params.row) return [];
          
          const request = params.row as Request;
          const actions = [
            <GridActionsCellItem
              icon={<Eye className="h-3 w-3" />}
              label="Просмотр"
              onClick={() => onViewClick(request)}
              key="view"
            />
          ];
          
          if (canEditRequest(request)) {
            actions.push(
              <GridActionsCellItem
                icon={<Edit2 className="h-3 w-3" />}
                label="Редактировать"
                onClick={() => onEditClick(request)}
                key="edit"
              />,
              <GridActionsCellItem
                icon={<Trash2 className="h-3 w-3" />}
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
  }, [settings.columnWidthModel, getStatusName, getStatusBadgeVariant, onViewClick, onEditClick, onDeleteClick, onFilesClick, canEditRequest]);

  return (
    <div className="h-full flex flex-col">
      <Button 
        onClick={onAddClick}
        className="mb-4 self-end"
      >
        Добавить заявку
      </Button>

      <DataGrid
        {...getDataGridProps()}
        rows={rows}
        columns={columns}
        loading={isLoading}
        disableRowSelectionOnClick
        paginationMode="server"
        pageSizeOptions={[5, 10, 25, 50, 100]}
        rowCount={rowCount || rows.length}
        onPaginationModelChange={(model) => {
          if (onPageChange && model.page !== page) {
            onPageChange(model.page);
          }
          if (onRowsPerPageChange && model.pageSize !== pageSize) {
            onRowsPerPageChange(model.pageSize);
          }
        }}
        slots={{
          toolbar: GridToolbar,
        }}
        slotProps={{
          toolbar: {
            showQuickFilter: true,
          },
        }}
        sx={{
          // Современный стильный дизайн с акцентными цветами
          '& .MuiDataGrid-root': {
            border: 'none',
            borderRadius: '0.8rem',
            fontFamily: 'sans-serif',
            fontSize: '0.7rem',
          },
          '& .MuiDataGrid-main': {
            borderRadius: '0.8rem',
            overflow: 'hidden',
          },
          '& .MuiDataGrid-cell': {
            borderBottom: '1px solid rgba(224, 224, 224, 0.5)',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            fontSize: '0.7rem',
          },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: '#F1F0FB', // apple-soft-gray
            color: '#6E59A5', // apple-purple-dark
            fontWeight: 'bold',
            fontSize: '0.7rem',
          },
          '& .MuiDataGrid-row': {
            '&:nth-of-type(odd)': {
              backgroundColor: 'rgba(241, 240, 251, 0.1)',
            },
            '&:hover': {
              backgroundColor: 'rgba(241, 240, 251, 0.3)',
            },
          },
          '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-cell:focus': {
            outline: 'none',
          },
          '& .MuiDataGrid-toolbarContainer': {
            padding: '16px',
            backgroundColor: 'white',
            borderBottom: '1px solid rgba(224, 224, 224, 0.5)',
          },
          '& .MuiDataGrid-footerContainer': {
            backgroundColor: '#F1F0FB', // apple-soft-gray
            borderTop: '1px solid rgba(224, 224, 224, 0.5)',
          },
          '& .MuiButton-root': {
            color: '#9b87f5', // apple-purple
            '&:hover': {
              backgroundColor: 'rgba(155, 135, 245, 0.1)',
            },
          },
          '& .MuiTablePagination-root': {
            color: '#6E59A5', // apple-purple-dark
          },
          '& .MuiIconButton-root': {
            color: '#9b87f5', // apple-purple
          },
          '& .MuiDataGrid-virtualScroller': {
            backgroundColor: 'white',
          },
          '& .MuiDataGrid-horizontalScrollbar': {
            zIndex: 0,
          },
          '& .MuiDataGrid-virtualScrollerRenderZone': {
            position: 'relative',
            zIndex: 0,
          },
          boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.05)',
          border: '1px solid rgba(224, 224, 224, 0.5)',
          borderRadius: '0.8rem',
          overflow: 'hidden',
          position: 'relative',
          zIndex: 0,
        }}
      />
    </div>
  );
} 