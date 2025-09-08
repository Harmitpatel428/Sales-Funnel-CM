'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface NavigationContextType {
  discomFilter: string;
  setDiscomFilter: (value: string) => void;
  onDiscomChange: (value: string) => void;
  onExportClick: () => void;
  setOnExportClick: (callback: () => void) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [discomFilter, setDiscomFilter] = useState('');
  const [onExportClick, setOnExportClick] = useState<() => void>(() => {});

  const handleDiscomChange = (value: string) => {
    setDiscomFilter(value);
  };

  return (
    <NavigationContext.Provider value={{
      discomFilter,
      setDiscomFilter,
      onDiscomChange: handleDiscomChange,
      onExportClick,
      setOnExportClick
    }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}
