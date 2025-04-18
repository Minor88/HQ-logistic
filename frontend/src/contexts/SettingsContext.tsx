import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";

interface SettingsContextType {
  logoUrl: string;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

const defaultSettings: SettingsContextType = {
  logoUrl: "/logo.svg",
  sidebarCollapsed: false,
  toggleSidebar: () => {},
  setSidebarCollapsed: () => {},
};

const SettingsContext = createContext<SettingsContextType>(defaultSettings);

export const useSettings = () => useContext(SettingsContext);

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Загружаем состояние сайдбара из localStorage
    const savedState = localStorage.getItem("sidebar-collapsed");
    return savedState ? JSON.parse(savedState) : false;
  });
  
  const [logoUrl, setLogoUrl] = useState("/logo.svg");

  // Сохраняем состояние сайдбара в localStorage при его изменении
  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => !prev);
  };

  return (
    <SettingsContext.Provider 
      value={{ 
        logoUrl, 
        sidebarCollapsed, 
        toggleSidebar, 
        setSidebarCollapsed 
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}; 