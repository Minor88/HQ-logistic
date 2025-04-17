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
      width: 80,
      renderCell: (params: GridRenderCellParams<Finance>) => (
        <div className="flex items-center">
          <DollarSign className="h-4 w-4 mr-2 text-apple-purple" />
          {params.value}
        </div>
      )
    },
    { 
      field: 'operationTypeDisplay', 
      headerName: 'Тип операции', 
      width: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Badge variant={params.row.operationType === 'in' ? 'default' : 'destructive'}>
          {params.value || (params.row.operationType === 'in' ? 'Входящий' : 'Исходящий')}
        </Badge>
      )
    },
    { 
      field: 'paymentDate', 
      headerName: 'Дата оплаты', 
      width: 130,
      valueFormatter: (params) => 
        formatDate(params.value as string) || 'Н/Д'
    },
    { 
      field: 'documentTypeDisplay', 
      headerName: 'Тип документа', 
      width: 130,
      valueFormatter: (params) => 
        params.value || '-'
    },
    { 
      field: 'currencyDisplay', 
      headerName: 'Валюта', 
      width: 100,
      valueFormatter: (params) => 
        params.value || '-'
    },
    { 
      field: 'amount', 
      headerName: 'Сумма', 
      width: 120,
      type: 'number',
      valueFormatter: (params) => 
        params.value !== undefined ? `${params.value.toFixed(2)}` : '-'
    },
    { 
      field: 'counterpartyName', 
      headerName: 'Контрагент', 
      width: 150,
      valueFormatter: (params) => 
        params.value || 'Не указан'
    },
    { 
      field: 'articleName', 
      headerName: 'Статья', 
      width: 150,
      valueFormatter: (params) => 
        params.value || 'Не указана'
    },
    { 
      field: 'isPaid', 
      headerName: 'Оплачено', 
      width: 100,
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
      width: 150,
      renderCell: (params: GridRenderCellParams<Finance>) => (
        params.value ? (
          <Link 
            to={`/shipments?id=${params.row.shipment}`}
            className="text-apple-purple hover:underline flex items-center"
          >
            <Truck className="h-4 w-4 mr-1" />
            {params.value}
          </Link>
        ) : '-'
      )
    },
    { 
      field: 'requestNumber', 
      headerName: 'Заявка', 
      width: 150,
      renderCell: (params: GridRenderCellParams<Finance>) => (
        params.value ? (
          <Link 
            to={`/requests?id=${params.row.request}`}
            className="text-apple-purple hover:underline flex items-center"
          >
            <FileText className="h-4 w-4 mr-1" />
            {params.value}
          </Link>
        ) : '-'
      )
    },
    { 
      field: 'comment', 
      headerName: 'Комментарий', 
      width: 200,
      renderCell: (params: GridRenderCellParams) => (
        <div className="max-w-[200px] truncate" title={params.value as string || ''}>
          {params.value || '-'}
        </div>
      )
    },
    { 
      field: 'createdAt', 
      headerName: 'Дата создания', 
      width: 130,
      valueFormatter: (params) => 
        formatDate(params.value as string) || 'Н/Д'
    },
    { 
      field: 'createdByName', 
      headerName: 'Создал', 
      width: 150,
      valueFormatter: (params) => 
        params.value || 'Н/Д'
    },
    {
      field: 'actions',
      headerName: 'Действия',
      width: 150,
      type: 'actions',
      getActions: (params: GridRowParams) => {
        const finance = params.row as Finance;
        const actions = [
          <GridActionsCellItem
            icon={<Eye className="h-4 w-4" />}
            label="Просмотр"
            onClick={() => onViewClick(finance)}
          />
        ];
        
        if (canEditFinance(finance)) {
          actions.push(
            <GridActionsCellItem
              icon={<Edit2 className="h-4 w-4" />}
              label="Редактировать"
              onClick={() => onEditClick(finance)}
            />,
            <GridActionsCellItem
              icon={<Trash2 className="h-4 w-4" />}
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
      <div className="mb-4 flex justify-end">
        <Button onClick={onAddClick}>
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