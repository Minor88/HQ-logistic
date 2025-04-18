import { useAuth } from '@/hooks/useAuth';

// Типы настроек таблицы
export interface ColumnSettings {
  id: string;
  visible: boolean;
  width: number;
  order: number;
}

export interface TableSettings {
  columns: Record<string, ColumnSettings>;
  pageSize: number;
  dataGrid?: Record<string, any>; // Дополнительные настройки для DataGrid
}

// Ключи для localStorage
const getTableSettingsKey = (userId: string, tableId: string) => {
  const key = `table_settings_${userId}_${tableId}`;
  console.log('Ключ для localStorage:', key);
  return key;
};

/**
 * Сервис для работы с настройками таблиц
 */
const tableSettingsService = {
  // Сохранение настроек таблицы
  saveTableSettings: (userId: string, tableId: string, settings: TableSettings): void => {
    try {
      const key = getTableSettingsKey(userId, tableId);
      console.log('Сохранение настроек в localStorage:', { key, settings });
      localStorage.setItem(
        key,
        JSON.stringify(settings)
      );
    } catch (error) {
      console.error('Ошибка при сохранении настроек таблицы:', error);
    }
  },

  // Загрузка настроек таблицы
  loadTableSettings: (userId: string, tableId: string): TableSettings | null => {
    try {
      const key = getTableSettingsKey(userId, tableId);
      const savedSettings = localStorage.getItem(key);
      
      console.log('Загрузка настроек из localStorage:', { key, savedSettings: savedSettings ? 'найдены' : 'не найдены' });
      
      if (!savedSettings) {
        return null;
      }
      
      const parsedSettings = JSON.parse(savedSettings) as TableSettings;
      console.log('Загруженные настройки:', parsedSettings);
      return parsedSettings;
    } catch (error) {
      console.error('Ошибка при загрузке настроек таблицы:', error);
      return null;
    }
  },

  // Удаление настроек таблицы
  removeTableSettings: (userId: string, tableId: string): void => {
    try {
      const key = getTableSettingsKey(userId, tableId);
      console.log('Удаление настроек из localStorage:', key);
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Ошибка при удалении настроек таблицы:', error);
    }
  },

  // Сброс настроек таблицы к значениям по умолчанию
  resetTableSettings: (
    userId: string, 
    tableId: string, 
    defaultSettings: TableSettings
  ): void => {
    console.log('Сброс настроек таблицы к значениям по умолчанию:', { userId, tableId, defaultSettings });
    tableSettingsService.saveTableSettings(userId, tableId, defaultSettings);
  }
};

export default tableSettingsService;

// Хук для удобного использования настроек таблицы
export const useTableSettings = (tableId: string) => {
  const { user } = useAuth();
  const userId = user?.id || 'anonymous';

  console.log('useTableSettings инициализирован:', { userId, tableId, user });

  const saveSettings = (settings: TableSettings) => {
    console.log('useTableSettings.saveSettings вызван:', { userId, tableId, settings });
    tableSettingsService.saveTableSettings(userId, tableId, settings);
  };

  const loadSettings = (): TableSettings | null => {
    console.log('useTableSettings.loadSettings вызван:', { userId, tableId });
    return tableSettingsService.loadTableSettings(userId, tableId);
  };

  const resetSettings = (defaultSettings: TableSettings) => {
    console.log('useTableSettings.resetSettings вызван:', { userId, tableId, defaultSettings });
    tableSettingsService.resetTableSettings(userId, tableId, defaultSettings);
  };

  return { saveSettings, loadSettings, resetSettings };
}; 