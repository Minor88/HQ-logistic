import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  useReactTable,
  ColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  SortingState,
  ColumnOrderState,
  Header,
  ColumnSizingState,
  VisibilityState,
  Table as ReactTable,
  flexRender
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Settings2Icon, GripVerticalIcon } from 'lucide-react';
import { useTableSettings, TableSettings, ColumnSettings } from '@/services/tableSettingsService';

const ResponsiveGridLayout = WidthProvider(Responsive);

export interface CustomTableProps<TData> {
  /**
   * Уникальный идентификатор таблицы для сохранения настроек
   */
  tableId: string;
  
  /**
   * Определения колонок таблицы
   */
  columns: ColumnDef<TData>[];
  
  /**
   * Данные для отображения в таблице
   */
  data: TData[];
  
  /**
   * Высота таблицы (в пикселях)
   */
  height?: number;
  
  /**
   * Обработчик нажатия на строку
   */
  onRowClick?: (row: TData) => void;
  
  /**
   * Функция для рендеринга пагинации
   */
  renderPagination?: (table: ReactTable<TData>) => React.ReactNode;
  
  /**
   * Функция для рендеринга дополнительных элементов управления таблицей
   */
  renderTableControls?: (table: ReactTable<TData>) => React.ReactNode;
}

export interface SortableHeaderProps {
  header: Header<any, unknown>;
  updateColumnOrder: (columnIds: string[]) => void;
}

// Компонент перетаскиваемого заголовка колонки
function SortableHeader({ header, updateColumnOrder }: SortableHeaderProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: header.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="flex items-center space-x-2"
    >
      <span {...listeners}>
        <GripVerticalIcon size={16} className="cursor-grab text-gray-400 hover:text-gray-600" />
      </span>
      <div>
        {flexRender(
          header.column.columnDef.header,
          header.getContext()
        )}
      </div>
    </div>
  );
}

export function CustomTable<TData>({
  tableId,
  columns,
  data,
  height = 500,
  onRowClick,
  renderPagination,
  renderTableControls,
}: CustomTableProps<TData>) {
  // Состояния таблицы
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([]);
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Виртуализация
  const tableContainerRef = useRef<HTMLDivElement>(null);
  
  // Хук для работы с настройками таблицы
  const { loadSettings, saveSettings, resetSettings } = useTableSettings(tableId);
  
  // Создаем дефолтные настройки на основе колонок
  const defaultSettings = useMemo<TableSettings>(() => {
    const columnSettings: Record<string, ColumnSettings> = {};
    
    columns.forEach((column, index) => {
      const id = String(column.id || (column as any).accessorKey || index);
      columnSettings[id] = {
        id,
        visible: true,
        width: 150, // Дефолтная ширина
        order: index
      };
    });
    
    return {
      columns: columnSettings,
      pageSize: 10
    };
  }, [columns]);
  
  // Загружаем сохраненные настройки или используем дефолтные
  useEffect(() => {
    const savedSettings = loadSettings();
    
    if (savedSettings) {
      // Настройки видимости колонок
      const visibility: VisibilityState = {};
      const sizing: ColumnSizingState = {};
      const order: ColumnOrderState = [];
      
      // Сортируем колонки по их порядку в сохраненных настройках
      const sortedColumns = Object.values(savedSettings.columns)
        .sort((a, b) => a.order - b.order);
      
      // Заполняем состояния из сохраненных настроек
      sortedColumns.forEach(colSettings => {
        visibility[colSettings.id] = colSettings.visible;
        sizing[colSettings.id] = colSettings.width;
        order.push(colSettings.id);
      });
      
      setColumnVisibility(visibility);
      setColumnSizing(sizing);
      setColumnOrder(order);
    } else {
      // Используем дефолтные настройки
      const defaultOrder = columns.map((col, index) => String(col.id || (col as any).accessorKey || index));
      setColumnOrder(defaultOrder);
      
      // Сохраняем дефолтные настройки
      saveSettings(defaultSettings);
    }
  }, [columns, loadSettings, saveSettings, defaultSettings]);
  
  // Создаем экземпляр таблицы
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      columnOrder,
      columnSizing,
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    onColumnSizingChange: setColumnSizing,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
  });

  // Виртуализация строк для оптимизации рендеринга больших таблиц
  const { rows } = table.getRowModel();
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 50, // Примерная высота строки
    overscan: 10,
  });
  
  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();
  const paddingTop = virtualRows.length > 0 ? virtualRows[0].start || 0 : 0;
  const paddingBottom = virtualRows.length > 0
    ? totalSize - (virtualRows[virtualRows.length - 1].end || 0)
    : 0;
  
  // Сохраняем настройки при их изменении
  useEffect(() => {
    // Если таблица инициализирована и есть данные о колонках
    if (table.getAllColumns().length > 0) {
      const updatedSettings: TableSettings = {
        columns: {},
        pageSize: table.getState().pagination.pageSize
      };
      
      // Получаем текущие состояния колонок
      table.getAllColumns().forEach((column, index) => {
        const id = column.id;
        updatedSettings.columns[id] = {
          id,
          visible: column.getIsVisible(),
          width: column.getSize(),
          order: columnOrder.indexOf(id) !== -1 ? columnOrder.indexOf(id) : index
        };
      });
      
      saveSettings(updatedSettings);
    }
  }, [columnVisibility, columnOrder, columnSizing, table, saveSettings]);
  
  // Обработчик DnD для изменения порядка колонок
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = columnOrder.indexOf(active.id.toString());
      const newIndex = columnOrder.indexOf(over.id.toString());
      
      const newColumnOrder = arrayMove(columnOrder, oldIndex, newIndex);
      setColumnOrder(newColumnOrder);
    }
  };
  
  // Обработчик сброса настроек
  const handleResetSettings = () => {
    resetSettings(defaultSettings);
    window.location.reload(); // Перезагружаем страницу для применения дефолтных настроек
  };
  
  // Обработчик ручного изменения ширины колонки
  const handleColumnWidthChange = (columnId: string, width: number) => {
    setColumnSizing((prev) => ({
      ...prev,
      [columnId]: width
    }));
  };

  return (
    <div className="space-y-4">
      {/* Элементы управления таблицей */}
      <div className="flex justify-between items-center">
        {renderTableControls && renderTableControls(table)}
        
        <div className="flex items-center space-x-2">
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings2Icon className="mr-2 h-4 w-4" />
                Настройки таблицы
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Настройки таблицы</DialogTitle>
                <DialogDescription>
                  Настройте видимость и порядок колонок таблицы. Для изменения порядка колонок перетащите их.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col space-y-4 my-4">
                <div className="font-bold mb-2">Видимость колонок</div>
                <div className="grid grid-cols-2 gap-4">
                  {table.getAllColumns().map(column => {
                    // Пропускаем колонки без заголовка
                    if (!column.columnDef.header) return null;
                    
                    return (
                      <div key={column.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={column.id}
                          checked={column.getIsVisible()}
                          onCheckedChange={(value) => {
                            column.toggleVisibility(!!value);
                          }}
                        />
                        <label htmlFor={column.id} className="text-sm font-medium">
                          {column.columnDef.header.toString()}
                        </label>
                      </div>
                    );
                  })}
                </div>
                
                <div className="font-bold mb-2 mt-4">Ширина колонок</div>
                <div className="grid grid-cols-2 gap-4">
                  {table.getAllColumns().map(column => {
                    // Пропускаем колонки без заголовка
                    if (!column.columnDef.header) return null;
                    
                    return (
                      <div key={column.id} className="flex items-center space-x-2">
                        <div className="text-sm font-medium w-32">
                          {column.columnDef.header.toString()}:
                        </div>
                        <Input
                          type="number"
                          min="50"
                          max="500"
                          value={column.getSize()}
                          onChange={(e) => handleColumnWidthChange(column.id, Number(e.target.value))}
                          className="w-20"
                        />
                        <span className="text-sm">px</span>
                      </div>
                    );
                  })}
                </div>
                
                <div className="font-bold mb-2 mt-4">Порядок колонок</div>
                <div className="border rounded-md p-4">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={columnOrder}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {table.getHeaderGroups().map(headerGroup => (
                          <React.Fragment key={headerGroup.id}>
                            {headerGroup.headers
                              .filter(header => header.column.getIsVisible())
                              .map(header => (
                                <SortableHeader 
                                  key={header.id} 
                                  header={header} 
                                  updateColumnOrder={setColumnOrder} 
                                />
                              ))}
                          </React.Fragment>
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleResetSettings}>
                  Сбросить настройки
                </Button>
                <Button onClick={() => setIsSettingsOpen(false)}>
                  Сохранить
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Таблица с виртуализацией */}
      <div
        ref={tableContainerRef}
        className="rounded-md border overflow-auto"
        style={{ height }}
      >
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead 
                    key={header.id}
                    style={{ 
                      width: header.getSize(),
                      position: 'relative'
                    }}
                  >
                    <div
                      {...{
                        onMouseDown: header.getResizeHandler(),
                        onTouchStart: header.getResizeHandler(),
                        className: `resizer ${
                          header.column.getIsResizing() ? 'isResizing' : ''
                        }`,
                        style: {
                          position: 'absolute',
                          right: 0,
                          top: 0,
                          height: '100%',
                          width: '5px',
                          background: header.column.getIsResizing()
                            ? 'rgba(0,0,0,0.5)'
                            : 'rgba(0,0,0,0)',
                          cursor: 'col-resize',
                          userSelect: 'none',
                          touchAction: 'none',
                        },
                      }}
                    />
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length > 0 ? (
              <>
                {paddingTop > 0 && (
                  <tr>
                    <td style={{ height: `${paddingTop}px` }} />
                  </tr>
                )}
                {virtualRows.map(virtualRow => {
                  const row = rows[virtualRow.index];
                  return (
                    <TableRow
                      key={row.id}
                      onClick={() => onRowClick && onRowClick(row.original)}
                      className={onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}
                    >
                      {row.getVisibleCells().map(cell => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
                {paddingBottom > 0 && (
                  <tr>
                    <td style={{ height: `${paddingBottom}px` }} />
                  </tr>
                )}
              </>
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Нет данных для отображения
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Пагинация */}
      {renderPagination && renderPagination(table)}
    </div>
  );
} 