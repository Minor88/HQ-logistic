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
}

// Ключи для localStorage
const getTableSettingsKey = (userId: string, tableId: string) => 
  `table_settings_${userId}_${tableId}`;

/**
 * Сервис для работы с настройками таблиц
 */
const tableSettingsService = {
  // Сохранение настроек таблицы
  saveTableSettings: (userId: string, tableId: string, settings: TableSettings): void => {
    try {
      localStorage.setItem(
        getTableSettingsKey(userId, tableId),
        JSON.stringify(settings)
      );
    } catch (error) {
      console.error('Ошибка при сохранении настроек таблицы:', error);
    }
  },

  // Загрузка настроек таблицы
  loadTableSettings: (userId: string, tableId: string): TableSettings | null => {
    try {
      const savedSettings = localStorage.getItem(getTableSettingsKey(userId, tableId));
      
      if (!savedSettings) {
        return null;
      }
      
      return JSON.parse(savedSettings) as TableSettings;
    } catch (error) {
      console.error('Ошибка при загрузке настроек таблицы:', error);
      return null;
    }
  },

  // Удаление настроек таблицы
  removeTableSettings: (userId: string, tableId: string): void => {
    try {
      localStorage.removeItem(getTableSettingsKey(userId, tableId));
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
    tableSettingsService.saveTableSettings(userId, tableId, defaultSettings);
  }
};

export default tableSettingsService;

// Хук для удобного использования настроек таблицы
export const useTableSettings = (tableId: string) => {
  const { user } = useAuth();
  const userId = user?.id || 'anonymous';

  const saveSettings = (settings: TableSettings) => {
    tableSettingsService.saveTableSettings(userId, tableId, settings);
  };

  const loadSettings = (): TableSettings | null => {
    return tableSettingsService.loadTableSettings(userId, tableId);
  };

  const resetSettings = (defaultSettings: TableSettings) => {
    tableSettingsService.resetTableSettings(userId, tableId, defaultSettings);
  };

  return { saveSettings, loadSettings, resetSettings };
}; 