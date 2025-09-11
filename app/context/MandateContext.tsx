'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Mandate {
  mandateId: string;
  leadId?: string | undefined; // Optional - undefined if standalone
  mandateName: string;
  clientName: string;
  company: string;
  kva: string;
  address?: string;
  schemes: string[];
  typeOfCase?: string;
  category?: string;
  projectCost?: string;
  industriesType?: string;
  termLoanAmount?: string;
  powerConnection?: string;
  createdAt: string;
  status: 'draft' | 'active' | 'closed';
  isDeleted: boolean;
}

interface MandateContextType {
  mandates: Mandate[];
  setMandates: React.Dispatch<React.SetStateAction<Mandate[]>>;
  addMandate: (mandate: Mandate) => void;
  updateMandate: (updatedMandate: Mandate) => void;
  deleteMandate: (mandateId: string) => void;
  getFilteredMandates: (filters: MandateFilters) => Mandate[];
}

export interface MandateFilters {
  status?: Mandate['status'][] | undefined;
  searchTerm?: string | undefined;
  leadId?: string | undefined;
}

const MandateContext = createContext<MandateContextType | undefined>(undefined);

export function MandateProvider({ children }: { children: ReactNode }) {
  const [mandates, setMandates] = useState<Mandate[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load mandates from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('mandates');
      if (stored) {
        const parsedMandates = JSON.parse(stored);
        if (Array.isArray(parsedMandates)) {
          setMandates(parsedMandates);
        } else {
          console.warn('Invalid mandates data format, clearing localStorage');
          localStorage.removeItem('mandates');
        }
      }
    } catch (err) {
      console.error('Error loading mandates:', err);
      // Clear corrupted data
      localStorage.removeItem('mandates');
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Save mandates to localStorage whenever they change (debounced)
  useEffect(() => {
    if (!isHydrated) return;
    
    const timeoutId = setTimeout(() => {
      localStorage.setItem('mandates', JSON.stringify(mandates));
    }, 300); // Debounce by 300ms
    
    return () => clearTimeout(timeoutId);
  }, [mandates, isHydrated]);

  const addMandate = (mandate: Mandate) => {
    console.log('Adding mandate:', mandate);
    setMandates(prev => [...prev, mandate]);
  };
  
  const updateMandate = (updatedMandate: Mandate) => {
    setMandates(prev => 
      prev.map(mandate => mandate.mandateId === updatedMandate.mandateId ? updatedMandate : mandate)
    );
  };
  
  const deleteMandate = (mandateId: string) => {
    setMandates(prev => 
      prev.map(mandate => 
        mandate.mandateId === mandateId 
          ? { ...mandate, isDeleted: true }
          : mandate
      )
    );
  };

  const getFilteredMandates = (filters: MandateFilters): Mandate[] => {
    return mandates.filter(mandate => {
      // Filter out deleted mandates
      if (mandate.isDeleted) {
        return false;
      }
      
      // Filter by status
      if (filters.status && filters.status.length > 0 && !filters.status.includes(mandate.status)) {
        return false;
      }
      
      // Filter by leadId
      if (filters.leadId && mandate.leadId !== filters.leadId) {
        return false;
      }
      
      // Search term (search in mandate name, client name, company, etc.)
      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        
        const searchableFields = [
          mandate.mandateName,
          mandate.clientName,
          mandate.company,
          mandate.kva,
          mandate.address,
          mandate.typeOfCase,
          mandate.category,
          mandate.projectCost,
          mandate.industriesType,
          mandate.termLoanAmount,
          mandate.powerConnection,
          ...mandate.schemes
        ].filter(Boolean).map(field => field?.toLowerCase());
        
        return searchableFields.some(field => field?.includes(searchTerm));
      }
      
      return true;
    });
  };

  return (
    <MandateContext.Provider value={{
      mandates,
      setMandates,
      addMandate,
      updateMandate,
      deleteMandate,
      getFilteredMandates
    }}>
      {!isHydrated ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      ) : (
        children
      )}
    </MandateContext.Provider>
  );
}

export function useMandates() {
  const ctx = useContext(MandateContext);
  if (!ctx) throw new Error('useMandates must be used inside MandateProvider');
  return ctx;
}
