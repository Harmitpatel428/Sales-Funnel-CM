'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface MobileNumber {
  id: string;
  number: string;
  name: string;
  isMain: boolean;
}

export interface Lead {
  id: string;
  kva: string;
  connectionDate: string;
  consumerNumber: string;
  company: string;
  clientName: string;
  discom?: string;
  gidc?: string; // New field for GIDC
  gstNumber?: string; // New field for GST Number
  mobileNumbers: MobileNumber[]; // Updated to support multiple mobile numbers
  mobileNumber: string; // Keep for backward compatibility
  companyLocation?: string; // New field for company location
  unitType: 'New' | 'Existing' | 'Other'; // Renamed from status for unit type
  marketingObjective?: string;
  budget?: string;
  timeline?: string;
  status: 'New' | 'CNR' | 'Busy' | 'Follow-up' | 'Deal Close' | 'Work Alloted' | 'Hotlead' | 'Mandate Sent' | 'Documentation';
  contactOwner?: string;
  lastActivityDate: string;
  followUpDate: string;
  finalConclusion?: string;
  notes?: string;
  isDone: boolean;
  isDeleted: boolean; // New field to mark leads as deleted instead of removing them
  isUpdated: boolean; // New field to track if lead has been updated
  activities?: Activity[];
  mandateStatus?: 'Pending' | 'In Progress' | 'Completed';
  documentStatus?: 'Pending Documents' | 'Documents Submitted' | 'Documents Reviewed' | 'Signed Mandate';
}

export interface Activity {
  id: string;
  leadId: string;
  description: string;
  timestamp: string;
}

interface LeadContextType {
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  addLead: (lead: Lead) => void;
  updateLead: (updatedLead: Lead) => void;
  deleteLead: (id: string) => void;
  markAsDone: (id: string) => void;
  addActivity: (leadId: string, description: string) => void;
  getFilteredLeads: (filters: LeadFilters) => Lead[];
  resetUpdatedLeads: () => void;
  savedViews: SavedView[];
  addSavedView: (view: SavedView) => void;
  deleteSavedView: (id: string) => void;
}

export interface LeadFilters {
  status?: Lead['status'][];
  followUpDateStart?: string;
  followUpDateEnd?: string;
  searchTerm?: string;
  discom?: string;
}

export interface SavedView {
  id: string;
  name: string;
  filters: LeadFilters;
}

const LeadContext = createContext<LeadContextType | undefined>(undefined);

export function LeadProvider({ children }: { children: ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load leads from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('leads');
      if (stored) {
        setLeads(JSON.parse(stored));
      }
      
      const storedViews = localStorage.getItem('savedViews');
      if (storedViews) {
        setSavedViews(JSON.parse(storedViews));
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setIsHydrated(true);
    }
  }, []);

    // Save leads to localStorage whenever they change (debounced)
  useEffect(() => {
    if (!isHydrated) return;
    
    const timeoutId = setTimeout(() => {
      localStorage.setItem('leads', JSON.stringify(leads));
    }, 300); // Debounce by 300ms
    
    return () => clearTimeout(timeoutId);
  }, [leads, isHydrated]);

  // Save views to localStorage whenever they change (debounced)
  useEffect(() => {
    if (!isHydrated) return;
    
    const timeoutId = setTimeout(() => {
      localStorage.setItem('savedViews', JSON.stringify(savedViews));
    }, 300); // Debounce by 300ms
    
    return () => clearTimeout(timeoutId);
  }, [savedViews, isHydrated]);

  const addLead = (lead: Lead) => {
    console.log('Adding lead:', lead);
    setLeads(prev => {
      const newLeads = [...prev, { ...lead, isUpdated: false }];
      console.log('Updated leads:', newLeads);
      return newLeads;
    });
  };
  
  const updateLead = (updatedLead: Lead) => {
    setLeads(prev => 
      prev.map(lead => lead.id === updatedLead.id ? { 
        ...updatedLead, 
        isUpdated: true,
        lastActivityDate: new Date().toISOString()
      } : lead)
    );
  };
  
  const deleteLead = (id: string) => {
    setLeads(prev => {
      const updated = prev.map(lead => 
        lead.id === id 
          ? { ...lead, isDeleted: true, lastActivityDate: new Date().toISOString() }
          : lead
      );
      return updated;
    });
  };

  const markAsDone = (id: string) => {
    setLeads(prev =>
      prev.map(l => (l.id === id ? { 
        ...l, 
        isDone: true,
        lastActivityDate: new Date().toISOString() // Update timestamp when marked as done
      } : l))
    );
  };
  
  const addActivity = (leadId: string, description: string) => {
    const newActivity = {
      id: crypto.randomUUID(),
      leadId,
      description,
      timestamp: new Date().toISOString()
    };
    
    setLeads(prev => 
      prev.map(lead => {
        if (lead.id === leadId) {
          const activities = lead.activities || [];
          return {
            ...lead,
            activities: [...activities, newActivity],
            lastActivityDate: new Date().toISOString()
          };
        }
        return lead;
      })
    );
  };
  
  const getFilteredLeads = (filters: LeadFilters): Lead[] => {
    console.log('=== FILTERED LEADS DEBUG ===');
    console.log('Filters:', filters);
    console.log('Total leads:', leads.length);
    
    return leads.filter(lead => {
      console.log(`Checking lead ${lead.kva}: status="${lead.status}", isDeleted=${lead.isDeleted}, isDone=${lead.isDone}, isUpdated=${lead.isUpdated}`);
      
      // Filter out deleted leads (isDeleted: true) - they should not appear in dashboard
      if (lead.isDeleted) {
        console.log(`Lead ${lead.kva} filtered out: isDeleted=true`);
        return false;
      }
      
      // Filter out completed leads (isDone: true)
      if (lead.isDone) {
        console.log(`Lead ${lead.kva} filtered out: isDone=true`);
        return false;
      }
      
      // For main dashboard (no status filter), only show leads that are NOT updated
      // This ensures updated leads are removed from the main dashboard view
      if (!filters.status || filters.status.length === 0) {
        if (lead.isUpdated) {
          console.log(`Lead ${lead.kva} filtered out: isUpdated=true (main dashboard)`);
          return false; // Hide updated leads from main dashboard
        }
      }
      
      // Filter by status
      if (filters.status && filters.status.length > 0 && !filters.status.includes(lead.status)) {
        console.log(`Lead ${lead.kva} filtered out: status "${lead.status}" not in filter ${filters.status}`);
        return false;
      }
      
      // Filter by follow-up date range
      if (filters.followUpDateStart && lead.followUpDate < filters.followUpDateStart) {
        return false;
      }
      if (filters.followUpDateEnd && lead.followUpDate > filters.followUpDateEnd) {
        return false;
      }
      
      // Filter by discom - robust comparison
      if (filters.discom && filters.discom !== '') {
        const leadDiscom = String(lead.discom || '').trim().toUpperCase();
        const filterDiscom = String(filters.discom).trim().toUpperCase();
        
        console.log(`=== DISCOM FILTER DEBUG ===`);
        console.log(`Lead ${lead.kva} discom: "${lead.discom}" -> normalized: "${leadDiscom}"`);
        console.log(`Filter discom: "${filters.discom}" -> normalized: "${filterDiscom}"`);
        console.log(`Match: ${leadDiscom === filterDiscom}`);
        
        if (leadDiscom !== filterDiscom) {
          console.log(`Lead ${lead.kva} filtered out: discom "${leadDiscom}" doesn't match filter "${filterDiscom}"`);
          console.log(`=== END DISCOM FILTER DEBUG ===`);
          return false;
        }
        console.log(`Lead ${lead.kva} passed discom filter`);
        console.log(`=== END DISCOM FILTER DEBUG ===`);
      }
      
      // Search term (search in name, company, email, notes, etc.)
      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        
        // Check if it's a phone number search (only digits)
        if (/^\d+$/.test(filters.searchTerm)) {
          // Search in all mobile numbers
          const allMobileNumbers = [
            lead.mobileNumber, // backward compatibility
            ...(lead.mobileNumbers || []).map(m => m.number)
          ];
          
          for (const mobileNumber of allMobileNumbers) {
            if (mobileNumber) {
              const phoneDigits = mobileNumber.replace(/[^0-9]/g, '');
              if (phoneDigits.includes(filters.searchTerm)) {
                return true;
              }
            }
          }
        }
        
        // Regular text search
        const allMobileNumbers = [
          lead.mobileNumber, // backward compatibility
          ...(lead.mobileNumbers || []).map(m => m.number)
        ].filter(Boolean);
        
        const allMobileNames = (lead.mobileNumbers || []).map(m => m.name).filter(Boolean);
        
        const searchableFields = [
          lead.clientName,
          lead.company,
          ...allMobileNumbers,
          ...allMobileNames,
          lead.consumerNumber,
          lead.kva,
          lead.discom,
          lead.companyLocation,
          lead.notes,
          lead.finalConclusion
        ].filter(Boolean).map(field => field?.toLowerCase());
        
        return searchableFields.some(field => field?.includes(searchTerm));
      }
      
      return true;
    });
  };

  const resetUpdatedLeads = () => {
    setLeads(prev => 
      prev.map(lead => ({ ...lead, isUpdated: false }))
    );
  };
  
  const addSavedView = (view: SavedView) => {
    setSavedViews(prev => [...prev, view]);
  };
  
  const deleteSavedView = (id: string) => {
    setSavedViews(prev => prev.filter(view => view.id !== id));
  };

  return (
    <LeadContext.Provider value={{
      leads,
      setLeads,
      addLead,
      updateLead,
      deleteLead,
      markAsDone,
      addActivity,
      getFilteredLeads,
      resetUpdatedLeads,
      savedViews,
      addSavedView,
      deleteSavedView
    }}>
      {!isHydrated ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      ) : (
        children
      )}
    </LeadContext.Provider>
  );
}

export function useLeads() {
  const ctx = useContext(LeadContext);
  if (!ctx) throw new Error('useLeads must be used inside LeadProvider');
  return ctx;
}
