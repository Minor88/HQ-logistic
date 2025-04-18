import React from 'react';
import { 
  DataGrid, 
  GridColDef, 
  GridToolbar, 
  GridRenderCellParams,
  GridActionsCellItem,
  GridRowParams
} from '@mui/x-data-grid';
import { Finance } from '@/services/financeService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { 
  DollarSign, 
  Eye, 
  Edit2, 
  Trash2, 
  Truck, 
  FileText 
} from 'lucide-react';

export interface FinancesDataGridProps {
  /**
   * Данные финансовых операций для отображения
   */
  finances: Finance[];
  
  /**
   * Загрузка данных
   */
  isLoading: boolean;
  
  /**
   * Обработчик открытия диалога просмотра финансовой операции
   */
  onViewClick: (finance: Finance) => void;
  
  /**
   * Обработчик открытия диалога редактирования финансовой операции
   */
  onEditClick: (finance: Finance) => void;
  
  /**
   * Обработчик открытия диалога удаления финансовой операции
   */
  onDeleteClick: (finance: Finance) => void;
  
  /**
   * Обработчик открытия диалога добавления новой финансовой операции
   */
  onAddClick: () => void;
  
  /**
   * Проверка прав на редактирование финансовой операции
   */
  canEditFinance: (finance: Finance) => boolean;
}

export function FinancesDataGrid({
  finances,
  isLoading,
  onViewClick,
  onEditClick,
  onDeleteClick,
  onAddClick,
  canEditFinance
}: FinancesDataGridProps) {
  // Преобразуем данные для DataGrid 
  const rows = finances.map(finance => ({
    ...finance,
    id: finance.number
  }));

  // Определяем колонки таблицы
  const columns: GridColDef[] = [
    { 
      field: 'number', 
      headerName: '№', 
      width: 60,
      renderCell: (params: GridRenderCellParams<Finance>) => (
        <div className="flex items-center">
          <DollarSign className="h-3 w-3 mr-1 text-apple-purple" />
          {params.value}
        </div>
      )
    },
    { 
      field: 'operationTypeDisplay', 
      headerName: 'Тип операции', 
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Badge variant={params.row.operationType === 'in' ? 'default' : 'destructive'}>
          {params.value || (params.row.operationType === 'in' ? 'Входящий' : 'Исходящий')}
        </Badge>
      )
    },
    { 
      field: 'paymentDate', 
      headerName: 'Дата оплаты', 
      width: 100,
      renderCell: (params: GridRenderCellParams<Finance>) => (
        <span>{formatDate(params.value as string) || 'Н/Д'}</span>
      )
    },
    { 
      field: 'documentTypeDisplay', 
      headerName: 'Тип документа', 
      width: 100,
      renderCell: (params: GridRenderCellParams<Finance>) => (
        <span>{params.value !== undefined && params.value !== null ? params.value : '-'}</span>
      )
    },
    { 
      field: 'currencyDisplay', 
      headerName: 'Валюта', 
      width: 70,
      renderCell: (params: GridRenderCellParams<Finance>) => (
        <span>{params.value !== undefined && params.value !== null ? params.value : '-'}</span>
      )
    },
    { 
      field: 'amount', 
      headerName: 'Сумма', 
      width: 90,
      type: 'number',
      renderCell: (params: GridRenderCellParams<Finance>) => (
        <span>{params.value !== undefined && params.value !== null ? `${Number(params.value).toFixed(2)}` : '-'}</span>
      )
    },
    { 
      field: 'counterpartyName', 
      headerName: 'Контрагент', 
      width: 120,
      renderCell: (params: GridRenderCellParams<Finance>) => (
        <span>{params.value !== undefined && params.value !== null ? params.value : 'Не указан'}</span>
      )
    },
    { 
      field: 'articleName', 
      headerName: 'Статья', 
      width: 120,
      renderCell: (params: GridRenderCellParams<Finance>) => (
        <span>{params.value !== undefined && params.value !== null ? params.value : 'Не указана'}</span>
      )
    },
    { 
      field: 'isPaid', 
      headerName: 'Оплачено', 
      width: 80,
      type: 'boolean',
      renderCell: (params: GridRenderCellParams) => (
        params.value ? 
          <Badge variant="secondary">Да</Badge> : 
          <Badge variant="outline">Нет</Badge>
      )
    },
    { 
      field: 'shipmentNumber', 
      headerName: 'Отправление', 
      width: 120,
      renderCell: (params: GridRenderCellParams<Finance>) => (
        params.value ? (
          <Link 
            to={`/shipments?id=${params.row.shipment}`}
            className="text-apple-purple hover:underline flex items-center"
          >
            <Truck className="h-3 w-3 mr-1" />
            {params.value}
          </Link>
        ) : '-'
      )
    },
    { 
      field: 'requestNumber', 
      headerName: 'Заявка', 
      width: 120,
      renderCell: (params: GridRenderCellParams<Finance>) => (
        params.value ? (
          <Link 
            to={`/requests?id=${params.row.request}`}
            className="text-apple-purple hover:underline flex items-center"
          >
            <FileText className="h-3 w-3 mr-1" />
            {params.value}
          </Link>
        ) : '-'
      )
    },
    { 
      field: 'comment', 
      headerName: 'Комментарий', 
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <div className="max-w-[150px] truncate" title={params.value as string || ''}>
          {params.value || '-'}
        </div>
      )
    },
    { 
      field: 'createdAt', 
      headerName: 'Дата создания', 
      width: 100,
      renderCell: (params: GridRenderCellParams<Finance>) => (
        <span>{formatDate(params.value as string) || 'Н/Д'}</span>
      )
    },
    { 
      field: 'createdByName', 
      headerName: 'Создал', 
      width: 120,
      renderCell: (params: GridRenderCellParams<Finance>) => (
        <span>{params.value !== undefined && params.value !== null ? params.value : 'Н/Д'}</span>
      )
    },
    {
      field: 'actions',
      headerName: 'Действия',
      width: 120,
      type: 'actions',
      getActions: (params: GridRowParams) => {
        const finance = params.row as Finance;
        const actions = [
          <GridActionsCellItem
            icon={<Eye className="h-3 w-3" />}
            label="Просмотр"
            onClick={() => onViewClick(finance)}
          />
        ];
        
        if (canEditFinance(finance)) {
          actions.push(
            <GridActionsCellItem
              icon={<Edit2 className="h-3 w-3" />}
              label="Редактировать"
              onClick={() => onEditClick(finance)}
            />,
            <GridActionsCellItem
              icon={<Trash2 className="h-3 w-3" />}
              label="Удалить"
              onClick={() => onDeleteClick(finance)}
              color="error"
            />
          );
        }
        
        return actions;
      }
    }
  ];

  return (
    <div className="w-full h-[600px]">
      <div className="mb-2 flex justify-end">
        <Button onClick={onAddClick} className="bg-apple-purple hover:bg-apple-purple-dark text-white text-xs py-1 px-3 h-8">
          Добавить финансовую операцию
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
            paginationModel: { pageSize: 10, page: 0 },
          },
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