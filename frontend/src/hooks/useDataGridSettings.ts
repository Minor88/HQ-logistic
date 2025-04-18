import { useState, useEffect } from 'react';
import { 
  GridSortModel, 
  GridFilterModel, 
  GridColumnVisibilityModel, 
  GridPaginationModel, 
  GridColumnOrderChangeParams, 
  GridRowSelectionModel,
  GridColumnResizeParams
} from '@mui/x-data-grid';
import tableSettingsService, { TableSettings, useTableSettings, ColumnSettings } from '@/services/tableSettingsService';

/**
 * Интерфейс для хранения настроек DataGrid в localStorage
 */
export interface DataGridSettings {
  sortModel?: GridSortModel;
  filterModel?: GridFilterModel;
  columnVisibilityModel?: GridColumnVisibilityModel;
  paginationModel?: GridPaginationModel;
  columnOrderModel?: string[];
  rowSelectionModel?: GridRowSelectionModel;
  columnWidthModel?: Record<string, number>;
}

/**
 * Хук для управления настройками MUI DataGrid с сохранением в localStorage
 * 
 * @param tableId Уникальный идентификатор таблицы
 * @param defaultSettings Настройки по умолчанию (опционально)
 * @returns Объект с текущими настройками и методами для их управления
 */
export const useDataGridSettings = (
  tableId: string,
  defaultSettings: DataGridSettings = {}
) => {
  // Используем сервис для работы с настройками таблиц
  const { 
    saveSettings, 
    loadSettings, 
    resetSettings 
  } = useTableSettings(tableId);
  
  // Состояние для хранения текущих настроек DataGrid
  const [settings, setSettings] = useState<DataGridSettings>(defaultSettings);
  
  // Функция для конвертации настроек из старого формата
  const convertOldSettings = (oldSettings: TableSettings): DataGridSettings => {
    const newSettings: DataGridSettings = {};
    
    // Конвертируем информацию о видимости колонок
    if (oldSettings.columns) {
      const columnVisibilityModel: GridColumnVisibilityModel = {};
      
      // Создаем порядок колонок
      const columnOrderModel: string[] = [];
      
      // Сохраняем ширины колонок
      const columnWidthModel: Record<string, number> = {};
      
      // Сортируем колонки по порядку
      const sortedColumns = Object.entries(oldSettings.columns)
        .sort(([, a], [, b]) => a.order - b.order);
      
      for (const [key, column] of sortedColumns) {
        // Добавляем в модель видимости
        columnVisibilityModel[key] = column.visible;
        
        // Добавляем в порядок колонок
        columnOrderModel.push(key);
        
        // Добавляем ширину колонки, если есть
        if (column.width) {
          columnWidthModel[key] = column.width;
        }
      }
      
      newSettings.columnVisibilityModel = columnVisibilityModel;
      newSettings.columnOrderModel = columnOrderModel;
      newSettings.columnWidthModel = columnWidthModel;
    }
    
    // Конвертируем настройки пагинации
    if (oldSettings.pageSize) {
      newSettings.paginationModel = {
        pageSize: oldSettings.pageSize,
        page: 0
      };
    }
    
    return newSettings;
  };
  
  // Загрузка сохраненных настроек при монтировании компонента
  useEffect(() => {
    // Загружаем сохраненные настройки таблицы
    const savedTableSettings = loadSettings();
    
    if (!savedTableSettings) {
      // Если настроек нет, используем настройки по умолчанию
      if (defaultSettings) {
        saveDataGridSettings(defaultSettings);
      }
      return;
    }
    
    if (savedTableSettings.dataGrid) {
      // Новый формат - используем dataGrid
      setSettings(savedTableSettings.dataGrid as DataGridSettings);
    } else if (savedTableSettings.columns) {
      // Старый формат - конвертируем
      const convertedSettings = convertOldSettings(savedTableSettings);
      
      // Объединяем с настройками по умолчанию
      const mergedSettings = { ...defaultSettings, ...convertedSettings };
      
      // Устанавливаем как текущие настройки
      setSettings(mergedSettings);
      
      // Сохраняем в новом формате, сохраняя при этом и старый формат
      saveSettings({
        ...savedTableSettings,
        dataGrid: mergedSettings
      });
    } else if (defaultSettings) {
      // Ни старого, ни нового формата - используем настройки по умолчанию
      saveDataGridSettings(defaultSettings);
    }
  }, [tableId]);
  
  // Сохранение настроек DataGrid
  const saveDataGridSettings = (dataGridSettings: DataGridSettings) => {
    // Загружаем текущие настройки таблицы
    const currentTableSettings = loadSettings() || {
      columns: {},
      pageSize: dataGridSettings.paginationModel?.pageSize || 10,
    };
    
    // Обновляем информацию о видимости колонок в старом формате для обратной совместимости
    if (dataGridSettings.columnVisibilityModel) {
      // Создаем новый объект колонок, если его нет
      const columns: Record<string, ColumnSettings> = {};
      
      // Используем текущий порядок колонок или создаем новый
      const columnOrder = dataGridSettings.columnOrderModel || 
        Object.keys(dataGridSettings.columnVisibilityModel);
      
      // Обновляем информацию о колонках
      columnOrder.forEach((key, index) => {
        const isVisible = dataGridSettings.columnVisibilityModel?.[key] ?? true;
        const width = dataGridSettings.columnWidthModel?.[key] || 
                     currentTableSettings.columns[key]?.width || 
                     150;
        
        columns[key] = {
          id: key,
          visible: isVisible,
          width: width,
          order: index
        };
      });
      
      // Обновляем колонки в старом формате
      currentTableSettings.columns = columns;
    }
    
    // Обновляем размер страницы в старом формате
    if (dataGridSettings.paginationModel?.pageSize) {
      currentTableSettings.pageSize = dataGridSettings.paginationModel.pageSize;
    }
    
    // Обновляем dataGrid в новом формате
    const updatedTableSettings: TableSettings = {
      ...currentTableSettings,
      dataGrid: dataGridSettings
    };
    
    // Сохраняем в localStorage
    saveSettings(updatedTableSettings);
    
    // Обновляем состояние
    setSettings(dataGridSettings);
  };
  
  // Обработчики изменения различных моделей DataGrid
  const handleSortModelChange = (model: GridSortModel) => {
    saveDataGridSettings({ ...settings, sortModel: model });
  };
  
  const handleFilterModelChange = (model: GridFilterModel) => {
    saveDataGridSettings({ ...settings, filterModel: model });
  };
  
  const handleColumnVisibilityModelChange = (model: GridColumnVisibilityModel) => {
    saveDataGridSettings({ ...settings, columnVisibilityModel: model });
  };
  
  const handlePaginationModelChange = (model: GridPaginationModel) => {
    saveDataGridSettings({ ...settings, paginationModel: model });
  };
  
  const handleColumnOrderChange = (params: GridColumnOrderChangeParams) => {
    // Получаем информацию о перемещении колонки
    const { column, targetIndex } = params;
    
    // Создаем копию текущего порядка колонок или инициализируем пустой массив на основе всех колонок
    let currentOrder = settings.columnOrderModel ? [...settings.columnOrderModel] : [];

    if (column && column.field) {
      // Если колонка найдена в текущем порядке, удаляем ее
      const fieldIndex = currentOrder.indexOf(column.field);
      if (fieldIndex !== -1) {
        currentOrder.splice(fieldIndex, 1);
      } else if (currentOrder.length === 0) {
        // Если порядок пуст, нужно инициализировать его с текущими полями
        // В этом случае мы оставляем пустой массив, так как нет данных о всех колонках
      }
      
      // Вставляем колонку в новую позицию
      // Ограничиваем targetIndex длиной массива
      const insertIndex = Math.min(targetIndex, currentOrder.length);
      currentOrder.splice(insertIndex, 0, column.field);
    }
    
    // Сохраняем изменение порядка колонок
    saveDataGridSettings({ 
      ...settings, 
      columnOrderModel: currentOrder
    });
  };
  
  const handleRowSelectionModelChange = (model: GridRowSelectionModel) => {
    saveDataGridSettings({ ...settings, rowSelectionModel: model });
  };
  
  const handleColumnWidthChange = (params: GridColumnResizeParams) => {
    // Получаем текущую модель ширины колонок или инициализируем новую
    const currentWidths = settings.columnWidthModel || {};
    
    // Обновляем ширину для конкретной колонки
    const updatedWidths = {
      ...currentWidths,
      [params.colDef.field]: params.width
    };
    
    // Сохраняем обновленные ширины колонок
    saveDataGridSettings({
      ...settings,
      columnWidthModel: updatedWidths
    });
  };
  
  // Сброс настроек к значениям по умолчанию
  const resetDataGridSettings = () => {
    const defaultTableSettings: TableSettings = {
      columns: {},
      pageSize: defaultSettings.paginationModel?.pageSize || 10,
      dataGrid: defaultSettings
    };
    
    resetSettings(defaultTableSettings);
    setSettings(defaultSettings);
  };
  
  // Получение пропсов для DataGrid на основе текущих настроек
  const getDataGridProps = () => {
    // Преобразуем модель ширины колонок в формат для DataGrid
    const columnWidths: Record<string, number> = settings.columnWidthModel || {};
    
    return {
      sortModel: settings.sortModel,
      filterModel: settings.filterModel,
      columnVisibilityModel: settings.columnVisibilityModel,
      paginationModel: settings.paginationModel,
      rowSelectionModel: settings.rowSelectionModel,
      onSortModelChange: handleSortModelChange,
      onFilterModelChange: handleFilterModelChange,
      onColumnVisibilityModelChange: handleColumnVisibilityModelChange,
      onPaginationModelChange: handlePaginationModelChange,
      onColumnOrderChange: handleColumnOrderChange,
      onRowSelectionModelChange: handleRowSelectionModelChange,
      onColumnWidthChange: handleColumnWidthChange,
      columnOrder: settings.columnOrderModel,
      initialState: {
        pagination: {
          paginationModel: settings.paginationModel,
        },
        sorting: {
          sortModel: settings.sortModel,
        },
        filter: {
          filterModel: settings.filterModel,
        },
        columns: {
          columnVisibilityModel: settings.columnVisibilityModel,
          orderedFields: settings.columnOrderModel || [],
          dimensions: {
            // Указываем ширину для каждой колонки
            ...Object.fromEntries(
              Object.entries(columnWidths).map(([field, width]) => [
                field,
                { width, maxWidth: Infinity, minWidth: 50, flex: 0 }
              ])
            ),
          }
        }
      }
    };
  };
  
  return {
    settings,
    handleSortModelChange,
    handleFilterModelChange,
    handleColumnVisibilityModelChange,
    handlePaginationModelChange,
    handleColumnOrderChange,
    handleRowSelectionModelChange,
    handleColumnWidthChange,
    resetDataGridSettings,
    getDataGridProps
  };
}; 