'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { LeadFilters } from './LeadContext';

interface NavigationContextType {
  discomFilter: string;
  onDiscomChange: (value: string) => void;
  onExportClick: () => void;
  setOnExportClick: (callback: () => void) => void;
  // Persistent filter state
  activeFilters: LeadFilters;
  setActiveFilters: (filters: LeadFilters | ((prev: LeadFilters) => LeadFilters)) => void;
  // Helper to restore filter from URL
  restoreFiltersFromUrl: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [onExportClick, setOnExportClick] = useState<() => void>(() => {});
  const [activeFilters, setActiveFiltersState] = useState<LeadFilters>({
    status: ['New'], // Default to New status
    discom: '' // Default to All Discoms
  });

  // Wrapper function to handle both direct values and updater functions
  const setActiveFilters = (filters: LeadFilters | ((prev: LeadFilters) => LeadFilters)) => {
    if (typeof filters === 'function') {
      setActiveFiltersState(filters);
    } else {
      setActiveFiltersState(filters);
    }
  };

  // Get current Discom filter from activeFilters
  const discomFilter = activeFilters.discom || '';

  const handleDiscomChange = (value: string) => {
    setActiveFilters(prev => ({
      ...prev,
      discom: value
    }));
    
    // Update URL with Discom filter
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (value && value !== '') {
        url.searchParams.set('discom', value);
      } else {
        url.searchParams.delete('discom');
      }
      window.history.replaceState({}, '', url.toString());
    }
  };

  // Helper function to restore filters from URL parameters
  const restoreFiltersFromUrl = () => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const filterParam = urlParams.get('filter');
      const discomParam = urlParams.get('discom');
      
      if (filterParam) {
        try {
          const filters = JSON.parse(decodeURIComponent(filterParam));
          setActiveFiltersState(filters);
        } catch (error) {
          console.error('Error parsing filter from URL:', error);
          // Fallback to default
          setActiveFiltersState({ status: ['New'], discom: '' });
        }
      } else if (discomParam) {
        // If only discom parameter is present, update just the discom filter
        setActiveFiltersState(prev => ({
          ...prev,
          discom: discomParam
        }));
      }
    }
  };

  // Restore filters from URL on mount
  useEffect(() => {
    restoreFiltersFromUrl();
  }, []);

  return (
    <NavigationContext.Provider value={{
      discomFilter,
      onDiscomChange: handleDiscomChange,
      onExportClick,
      setOnExportClick,
      activeFilters,
      setActiveFilters,
      restoreFiltersFromUrl
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
