'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLeads, Lead, LeadFilters } from '../context/LeadContext';
import LeadTable from '../components/LeadTable';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const { leads, deleteLead, getFilteredLeads, updateLead } = useLeads();
  const [activeFilters, setActiveFilters] = useState<LeadFilters>({
    status: ['New'] // Show "New" leads by default
  });
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<Lead[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [showMassDeleteModal, setShowMassDeleteModal] = useState(false);
  const [leadsToDelete, setLeadsToDelete] = useState<Lead[]>([]);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
  const [showEmptyStatusNotification, setShowEmptyStatusNotification] = useState(false);
  const [emptyStatusMessage, setEmptyStatusMessage] = useState('');
  const [discomFilter, setDiscomFilter] = useState<string>('');
  const [showExportPasswordModal, setShowExportPasswordModal] = useState(false);
  const [exportPassword, setExportPassword] = useState('');

  // Create a stable reference for activeFilters to prevent infinite loops
  const activeFiltersKey = useMemo(() => {
    return `${activeFilters.status?.join(',') || 'none'}-${activeFilters.searchTerm || 'none'}-${activeFilters.discom || 'none'}`;
  }, [activeFilters.status, activeFilters.searchTerm, activeFilters.discom]);

  // Show toast notification
  const showToastNotification = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  }, []);

  // Reset selectAll state when filters change
  useEffect(() => {
    setSelectAll(false);
    setSelectedLeads(new Set());
  }, [activeFiltersKey]);
  
  // Auto-clear status filter when leads are updated to ensure leads disappear when status changes
  useEffect(() => {
    if (activeFilters.status && activeFilters.status.length > 0) {
      // Check if any leads with the current status still exist
      const filteredLeads = getFilteredLeads(activeFilters);
      if (filteredLeads.length === 0) {
        // If no leads match the current status filter, clear the filter
        setActiveFilters(prev => ({
          ...prev,
          status: [] // Clear status filter to show "no status selected" message
        }));
      }
    }
  }, [leads, activeFilters.status, getFilteredLeads]);

  // Handle return from edit page - refresh the view
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Clear any stored editing data when leaving the page
      localStorage.removeItem('editingLead');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Check for lead update notification
  useEffect(() => {
    const leadUpdated = localStorage.getItem('leadUpdated');
    if (leadUpdated === 'true') {
      showToastNotification('Lead updated successfully! The lead has been removed from the main dashboard view but can be viewed by clicking on the status buttons.', 'success');
      localStorage.removeItem('leadUpdated');
    }
  }, [showToastNotification]);

  // Check for updated leads and clear main dashboard view if needed
  useEffect(() => {
    // Check if there are any leads marked as updated
    const hasUpdatedLeads = leads.some(lead => lead.isUpdated && !lead.isDeleted && !lead.isDone);
    
    // Only clear the main dashboard view if we're on main dashboard (no status filter) 
    // and there are updated leads, but DON'T clear if user has manually selected a status
    if (hasUpdatedLeads && (!activeFilters.status || activeFilters.status.length === 0)) {
      // This ensures updated leads are removed from the main dashboard view
      // but allows users to still click status buttons to see updated leads
      console.log('Clearing main dashboard view due to updated leads');
    }
  }, [leads.length, activeFiltersKey]);
  
  // Helper function to parse DD-MM-YYYY format dates
  const parseFollowUpDate = (dateString: string): Date | null => {
    if (!dateString) return null;
    
    try {
      // Handle DD-MM-YYYY format
      const dateParts = dateString.split('-');
      if (dateString.includes('-') && dateParts[0] && dateParts[0].length <= 2) {
        const [day, month, year] = dateString.split('-');
        if (day && month && year) {
          return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        }
      }
      // Handle other date formats
      return new Date(dateString);
    } catch {
      return null;
    }
  };

  // Helper function to format date to DD-MM-YYYY
  const formatDateToDDMMYYYY = (dateString: string): string => {
    if (!dateString) return '';
    
    // If already in DD-MM-YYYY format, return as is
    if (dateString.match(/^\d{2}-\d{2}-\d{4}$/)) {
      return dateString;
    }
    
    // If it's a Date object or ISO string, convert to DD-MM-YYYY
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString; // Return original if invalid
      
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      
      return `${day}-${month}-${year}`;
    } catch {
      return dateString; // Return original if conversion fails
    }
  };
  
  // Calculate summary stats with memoization
  const summaryStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(today.getDate() + 7);

    let dueToday = 0;
    let upcoming = 0;
    let overdue = 0;
    let followUpMandate = 0;
    let totalLeads = 0;

    leads.forEach(lead => {
      if (!lead.isDeleted && !lead.isDone) {
        totalLeads++;
      }

      // Count Mandate & Documentation leads regardless of follow-up date
      if (!lead.isDeleted && !lead.isDone && (lead.status === 'Mandate Sent' || lead.status === 'Documentation')) {
        followUpMandate++;
      }

      // Only process follow-up date calculations if lead has a follow-up date
      if (lead.isDeleted || lead.isDone || !lead.followUpDate) return;

      const followUpDate = parseFollowUpDate(lead.followUpDate);
      if (!followUpDate) return;
      
      followUpDate.setHours(0, 0, 0, 0);

      if (followUpDate.getTime() === today.getTime()) {
        dueToday++;
      } else if (followUpDate > today && followUpDate <= sevenDaysLater) {
        upcoming++;
      } else if (followUpDate < today) {
        overdue++;
      }
    });

    return {
      totalLeads,
      dueToday,
      upcoming,
      overdue,
      followUpMandate
    };
  }, [leads]);

  // Calculate status counts with memoization - use filtered leads based on current filters
  const statusCounts = useMemo(() => {
    const counts = {
      'New': 0,
      'CNR': 0,
      'Busy': 0,
      'Follow-up': 0,
      'Deal Close': 0,
      'Work Alloted': 0,
      'Hotlead': 0,
      'Mandate Sent': 0,
      'Documentation': 0,
      'Others': 0
    };

    console.log('=== STATUS COUNTS DEBUG ===');
    console.log('Total leads:', leads.length);
    console.log('Current activeFilters:', activeFilters);
    
    // Create a temporary filter object that excludes status filtering to get leads for status counts
    const tempFilters = { ...activeFilters };
    delete tempFilters.status; // Remove status filter to count all statuses
    
    // Get filtered leads (excluding status filter)
    const filteredLeadsForCounts = leads.filter(lead => {
      // Apply all filters except status
      if (lead.isDone || lead.isDeleted) return false;
      
      // Apply discom filter if active
      if (tempFilters.discom && tempFilters.discom !== '') {
        const leadDiscom = String(lead.discom || '').trim().toUpperCase();
        const filterDiscom = String(tempFilters.discom).trim().toUpperCase();
        if (leadDiscom !== filterDiscom) return false;
      }
      
      // Apply follow-up date filters if active
      if (tempFilters.followUpDateStart && lead.followUpDate < tempFilters.followUpDateStart) return false;
      if (tempFilters.followUpDateEnd && lead.followUpDate > tempFilters.followUpDateEnd) return false;
      
      // Apply search filter if active
      if (tempFilters.searchTerm) {
        const searchTerm = tempFilters.searchTerm.toLowerCase();
        const searchableText = [
          lead.kva,
          lead.clientName,
          lead.company,
          lead.mobileNumber,
          lead.consumerNumber,
          lead.notes
        ].join(' ').toLowerCase();
        
        if (/^\d+$/.test(tempFilters.searchTerm)) {
          // Phone number search
          const allMobileNumbers = [
            lead.mobileNumber,
            ...(lead.mobileNumbers || []).map(m => m.number)
          ].filter((num): num is string => Boolean(num)); // Type guard to ensure only strings
          if (!allMobileNumbers.some(num => num.includes(tempFilters.searchTerm!))) return false;
        } else {
          // Text search
          if (!searchableText.includes(searchTerm)) return false;
        }
      }
      
      return true;
    });
    
    console.log('Filtered leads for status counts:', filteredLeadsForCounts.length);
    
    filteredLeadsForCounts.forEach(lead => {
      console.log(`Lead ${lead.kva}: status="${lead.status}", discom="${lead.discom}"`);
      if (lead.status in counts) {
        counts[lead.status as keyof typeof counts]++;
        console.log(`Incremented count for status: ${lead.status}`);
      }
    });

    console.log('Final status counts:', counts);
    console.log('=== END STATUS COUNTS DEBUG ===');

    return counts;
  }, [leads, activeFilters]);

  const { dueToday, upcoming, overdue, followUpMandate } = summaryStats;


  
  // Handle lead click to view details
  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setShowLeadModal(true);
    // Prevent body scrolling when modal is open
    document.body.style.overflow = 'hidden';
  };

  // Copy to clipboard function
  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // WhatsApp redirect function
  const handleWhatsAppRedirect = (lead: Lead) => {
    // Get the main phone number
    const mainPhoneNumber = lead.mobileNumbers && lead.mobileNumbers.length > 0 
      ? lead.mobileNumbers.find(m => m.isMain)?.number || lead.mobileNumbers[0]?.number || lead.mobileNumber
      : lead.mobileNumber;

    if (!mainPhoneNumber || mainPhoneNumber.trim() === '') {
      alert('No phone number available for this lead.');
      return;
    }

    // Clean the phone number (remove any non-digit characters)
    const cleanNumber = mainPhoneNumber.replace(/[^0-9]/g, '');
    
    // Check if number is valid (should be 10 digits for Indian numbers)
    if (cleanNumber.length !== 10) {
      alert(`Invalid phone number: ${mainPhoneNumber}. Please check the number format.`);
      return;
    }

    // Create WhatsApp URL
    const whatsappUrl = `https://wa.me/91${cleanNumber}`;
    
    // Open WhatsApp in new tab
    window.open(whatsappUrl, '_blank');
  };












  
  // Show export password modal
  const handleExportExcel = () => {
    setShowExportPasswordModal(true);
    setExportPassword('');
  };

  // Actual export function with password verification
  const performExport = async () => {
    // Password verification - you can change this password
    const EXPORT_PASSWORD = 'admin123'; // Change this to your desired password
    
    if (exportPassword !== EXPORT_PASSWORD) {
      showToastNotification('Incorrect password. Please try again.', 'error');
      return;
    }

    try {
      // Dynamic import to avoid turbopack issues
      const XLSX = await import('xlsx');
      
      // Get filtered leads based on current view
      const leadsToExport = getFilteredLeads(activeFilters);
      
      // Define Excel headers with remapped column names for export
      const headers = [
        'con.no', 
        'KVA', 
        'Connection Date', 
        'Company Name', 
        'Client Name', 
        'Discom',
        'GIDC',
        'GST Number',
        'Unit Type',
        'Main Mobile Number', 
        'Lead Status', 
        'Last Discussion', 
        'Address',
        'Next Follow-up Date',
        'Mobile Number 2', 
        'Contact Name 2', 
        'Mobile Number 3', 
        'Contact Name 3'
      ];
      
      // Convert leads to Excel rows with remapped data
      const rows = leadsToExport.map(lead => {
        // Get mobile numbers and contacts
        const mobileNumbers = lead.mobileNumbers || [];
        const mainMobile = mobileNumbers.find(m => m.isMain) || mobileNumbers[0] || { number: lead.mobileNumber || '', name: '' };
        const mobile2 = mobileNumbers[1] || { number: '', name: '' };
        const mobile3 = mobileNumbers[2] || { number: '', name: '' };
        
        // Format main mobile number (phone number only, no contact name)
        const mainMobileDisplay = mainMobile.number || '';
        console.log('🔍 Export Debug - Lead:', lead.clientName, 'Main Mobile:', mainMobileDisplay);
        
        return [
          lead.consumerNumber || '',
          lead.kva || '',
          lead.connectionDate && lead.connectionDate.trim() !== '' ? lead.connectionDate : '',
          lead.company || '',
          lead.clientName || '',
          lead.discom || '', // Discom
          lead.gidc || '', // GIDC
          lead.gstNumber || '', // GST Number
          lead.unitType || 'New', // Unit Type
          mainMobileDisplay, // Main Mobile Number (with contact name if available)
          lead.status || 'New', // Lead Status
          lead.notes || '', // Last Discussion
          lead.companyLocation || (lead.notes && lead.notes.includes('Address:') ? lead.notes.split('Address:')[1]?.trim() || '' : ''), // Address
          lead.followUpDate || '', // Next Follow-up Date
          mobile2.number || '', // Mobile Number 2
          mobile2.name || '', // Contact Name 2
          mobile3.number || '', // Mobile Number 3
          mobile3.name || '' // Contact Name 3
        ];
      });
      
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Leads');
      
      // Generate Excel file and download
      XLSX.writeFile(wb, `leads-export-${new Date().toISOString().split('T')[0]}.xlsx`);
      
      // Close modal and show success message
      setShowExportPasswordModal(false);
      setExportPassword('');
      showToastNotification(`Successfully exported ${leadsToExport.length} leads to Excel format`, 'success');
    } catch (error) {
      console.error('Export error:', error);
      showToastNotification('Failed to export leads. Please try again.', 'error');
    }
  };

  // Search functionality
  const handleSearch = () => {
    setActiveFilters(prev => ({
      ...prev,
      searchTerm: searchTerm.trim()
    }));
    setShowSuggestions(false);
  };

  // Generate search suggestions
  const generateSuggestions = (query: string) => {
    if (query.length < 2) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const queryLower = query.toLowerCase();
    const queryNumbers = query.replace(/[^0-9]/g, ''); // Extract numbers for phone/consumer number search

    const suggestions = leads.filter(lead => {
      // Search in KVA
      const kvaMatch = lead.kva.toLowerCase().includes(queryLower);
      
      // Search in Consumer Number (both original and cleaned)
      const consumerMatch = lead.consumerNumber.toLowerCase().includes(queryLower) || 
                           lead.consumerNumber.replace(/[^0-9]/g, '').includes(queryNumbers);
      
      // Search in Mobile Numbers (both original and cleaned)
      const allMobileNumbers = [
        lead.mobileNumber, // backward compatibility
        ...(lead.mobileNumbers || []).map(m => m.number)
      ].filter(Boolean);
      
      const mobileMatch = allMobileNumbers.some(mobileNumber => 
        mobileNumber?.toLowerCase().includes(queryLower) || 
        mobileNumber?.replace(/[^0-9]/g, '').includes(queryNumbers)
      );
      
      // Search in Mobile Number Names (including client name fallback only for main number)
      const allMobileNames = (lead.mobileNumbers || []).map(m => m.name || (m.isMain ? lead.clientName : '')).filter(Boolean);
      const mobileNameMatch = allMobileNames.some(mobileName => 
        mobileName?.toLowerCase().includes(queryLower)
      );
      
      // Search in Company Name
      const companyMatch = lead.company.toLowerCase().includes(queryLower);
      
      // Search in Address
      const locationMatch = lead.companyLocation?.toLowerCase().includes(queryLower);
      
      // Search in Client Name
      const clientMatch = lead.clientName.toLowerCase().includes(queryLower);
      
      // Search in Connection Date
      const dateMatch = lead.connectionDate.toLowerCase().includes(queryLower);
      
      return kvaMatch || consumerMatch || mobileMatch || mobileNameMatch || companyMatch || locationMatch || clientMatch || dateMatch;
    }).slice(0, 8); // Show more suggestions

    setSearchSuggestions(suggestions);
    setShowSuggestions(suggestions.length > 0);
  };

  // Handle search input change
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setActiveFilters(prev => ({
      ...prev,
      searchTerm: value
    }));
    generateSuggestions(value);
  };

  // Handle suggestion click
  const handleSuggestionClick = (lead: Lead) => {
    // Determine what field was matched and use that for the search
    const queryLower = searchTerm.toLowerCase();
    const queryNumbers = searchTerm.replace(/[^0-9]/g, '');
    
    // Get all mobile numbers for this lead
    const allMobileNumbers = [
      lead.mobileNumber, // backward compatibility
      ...(lead.mobileNumbers || []).map(m => m.number)
    ].filter(Boolean);
    
    // Get all mobile names for this lead (including client name fallback only for main number)
    const allMobileNames = (lead.mobileNumbers || []).map(m => m.name || (m.isMain ? lead.clientName : '')).filter(Boolean);
    
    let searchValue = lead.kva; // Default to KVA
    
    if (lead.consumerNumber.toLowerCase().includes(queryLower) || lead.consumerNumber.replace(/[^0-9]/g, '').includes(queryNumbers)) {
      searchValue = lead.consumerNumber;
    } else if (allMobileNumbers.some(mobileNumber => 
      mobileNumber?.toLowerCase().includes(queryLower) || 
      mobileNumber?.replace(/[^0-9]/g, '').includes(queryNumbers)
    )) {
      // Show the main mobile number or the first one found
      const mainMobile = lead.mobileNumbers?.find(m => m.isMain)?.number || lead.mobileNumber || allMobileNumbers[0];
      searchValue = mainMobile || '';
    } else if (allMobileNames.some((mobileName: string) => 
      mobileName?.toLowerCase().includes(queryLower)
    )) {
      // Show the mobile name that matched (including client name fallback only for main number)
      const matchedMobile = lead.mobileNumbers?.find(m => 
        (m.name || (m.isMain ? lead.clientName : ''))?.toLowerCase().includes(queryLower)
      );
      searchValue = matchedMobile?.name || (matchedMobile?.isMain ? lead.clientName : '') || '';
    } else if (lead.company.toLowerCase().includes(queryLower)) {
      searchValue = lead.company;
    } else if (lead.companyLocation?.toLowerCase().includes(queryLower)) {
      searchValue = lead.companyLocation;
    } else if (lead.clientName.toLowerCase().includes(queryLower)) {
      searchValue = lead.clientName;
    } else if (lead.connectionDate.toLowerCase().includes(queryLower)) {
      searchValue = lead.connectionDate;
    }
    
    setSearchTerm(searchValue);
    setActiveFilters(prev => ({
      ...prev,
      searchTerm: searchValue
    }));
    setShowSuggestions(false);
  };



  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
    setActiveFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters.searchTerm;
      return newFilters;
    });
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm('');
    setDiscomFilter('');
    setActiveFilters({
      status: [] // Clear to show no leads - user must select a status
    });
    setSelectedLeads(new Set());
    setSelectAll(false);
  };

  // Handle status filter
  const handleStatusFilter = (status: Lead['status']) => {
    // Check if the status has zero leads
    if (statusCounts[status] === 0) {
      setEmptyStatusMessage(`Your ${status} lead is empty, please add lead to processed.`);
      setShowEmptyStatusNotification(true);
      // Auto-hide after 3 seconds
      setTimeout(() => {
        setShowEmptyStatusNotification(false);
      }, 3000);
      return;
    }
    
    // Set the status filter - this will show leads with this status (including updated ones)
    setActiveFilters(prev => ({
      ...prev,
      status: [status]
    }));
    setSelectedLeads(new Set());
    setSelectAll(false);
  };

  // Handle individual lead selection
  const handleLeadSelection = (leadId: string, checked: boolean) => {
    const newSelectedLeads = new Set(selectedLeads);
    if (checked) {
      newSelectedLeads.add(leadId);
    } else {
      newSelectedLeads.delete(leadId);
    }
    setSelectedLeads(newSelectedLeads);
    
    // Update selectAll state based on selection
    const filteredLeads = getFilteredLeads(activeFilters);
    setSelectAll(newSelectedLeads.size === filteredLeads.length && filteredLeads.length > 0);
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Select all filtered leads
      const filteredLeads = getFilteredLeads(activeFilters);
      setSelectedLeads(new Set(filteredLeads.map(lead => lead.id)));
      setSelectAll(true);
    } else {
      // Deselect all
      setSelectedLeads(new Set());
      setSelectAll(false);
    }
  };

  // Bulk delete selected leads
  const handleBulkDelete = () => {
    if (selectedLeads.size === 0) return;
    
    // Get the actual lead objects for the selected IDs
    const filteredLeads = getFilteredLeads(activeFilters);
    const selectedLeadObjects = filteredLeads.filter(lead => selectedLeads.has(lead.id));
    
    setLeadsToDelete(selectedLeadObjects);
    setShowMassDeleteModal(true);
  };

  // Bulk update status for selected leads
  const handleBulkStatusUpdate = (newStatus: Lead['status']) => {
    if (selectedLeads.size === 0) return;
    
    const filteredLeads = getFilteredLeads(activeFilters);
    const selectedLeadObjects = filteredLeads.filter(lead => selectedLeads.has(lead.id));
    
    // Update each selected lead's status
    selectedLeadObjects.forEach(lead => {
      const updatedLead = { ...lead, status: newStatus };
      updateLead(updatedLead);
    });
    
    // Show notification
    showToastNotification(`${selectedLeads.size} lead(s) status updated to "${newStatus}" and removed from main dashboard view`, 'success');
    
    // Clear selection
    setSelectedLeads(new Set());
    setSelectAll(false);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedLeads(new Set());
    setSelectAll(false);
  };

  // Handle edit lead
  const handleEditLead = (lead: Lead) => {
    // Store the lead data in localStorage for editing
    localStorage.setItem('editingLead', JSON.stringify(lead));
    // Navigate to add-lead page with a flag to indicate we're editing
    router.push(`/add-lead?mode=edit&id=${lead.id}&from=dashboard`);
  };


  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white-800">Lead Management Dashboard</h1>
        <div className="flex space-x-2">
          {/* Discom Filter */}
          <div className="flex items-center gap-2">
            <select
              value={discomFilter}
              onChange={(e) => {
                const value = e.target.value;
                setDiscomFilter(value);
                if (value === '') {
                  setActiveFilters({
                    status: ['New'] // Show "New" leads from all discoms when selecting "All Discoms"
                  });
                } else {
                  setActiveFilters(prev => ({
                    ...prev,
                    discom: value,
                    status: ['New'] // Automatically show New status when discom is selected
                  }));
                }
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm bg-white text-gray-700"
              aria-label="Filter by Discom"
            >
              <option value="">All Discoms</option>
              <option value="UGVCL">UGVCL</option>
              <option value="MGVCL">MGVCL</option>
              <option value="DGVCL">DGVCL</option>
              <option value="PGVCL">PGVCL</option>
            </select>
          </div>
          {/* Export Button */}
          <button
            onClick={handleExportExcel}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Export Leads</span>
          </button>
            
          </div>
          </div>

      {/* Status Filter Section */}
      <div className="bg-gradient-to-br from-slate-800 via-gray-700 to-slate-800 p-3 rounded-lg shadow-lg border border-slate-600/30 mb-4 relative overflow-hidden mx-auto w-fit">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-cyan-500/5"></div>
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500"></div>
            <div className="relative">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
              <h3 className="text-base font-semibold text-white">Filter by Status</h3>
              <span className="text-xs text-white/80">Click any status to filter leads</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              <button
                onClick={() => handleStatusFilter('New')}
                className={`px-2.5 py-1.5 rounded-md transition-colors text-xs font-medium flex items-center gap-1 whitespace-nowrap ${
                  activeFilters.status?.length === 1 && activeFilters.status[0] === 'New'
                    ? 'bg-blue-800 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                New
                <span className={`px-1 py-0.5 rounded-full text-xs font-bold ${
                  activeFilters.status?.length === 1 && activeFilters.status[0] === 'New'
                    ? 'bg-blue-900 text-blue-100'
                    : 'bg-blue-500 text-white'
                }`}>
                  {statusCounts['New']}
                </span>
              </button>
              <button
                onClick={() => handleStatusFilter('CNR')}
                className={`px-2.5 py-1.5 rounded-md transition-colors text-xs font-medium flex items-center gap-1 whitespace-nowrap ${
                  activeFilters.status?.length === 1 && activeFilters.status[0] === 'CNR'
                    ? 'bg-orange-800 text-white'
                    : 'bg-orange-600 hover:bg-orange-700 text-white'
                }`}
              >
                CNR
                <span className={`px-1 py-0.5 rounded-full text-xs font-bold ${
                  activeFilters.status?.length === 1 && activeFilters.status[0] === 'CNR'
                    ? 'bg-orange-900 text-orange-100'
                    : 'bg-orange-500 text-white'
                }`}>
                  {statusCounts['CNR']}
                </span>
              </button>
              <button
                onClick={() => handleStatusFilter('Busy')}
                className={`px-2.5 py-1.5 rounded-md transition-colors text-xs font-medium flex items-center gap-1 whitespace-nowrap ${
                  activeFilters.status?.length === 1 && activeFilters.status[0] === 'Busy'
                    ? 'bg-yellow-800 text-white'
                    : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                }`}
              >
                Busy
                <span className={`px-1 py-0.5 rounded-full text-xs font-bold ${
                  activeFilters.status?.length === 1 && activeFilters.status[0] === 'Busy'
                    ? 'bg-yellow-900 text-yellow-100'
                    : 'bg-yellow-500 text-white'
                }`}>
                  {statusCounts['Busy']}
                </span>
              </button>
              <button
                onClick={() => handleStatusFilter('Follow-up')}
                className={`px-2.5 py-1.5 rounded-md transition-colors text-xs font-medium flex items-center gap-1 whitespace-nowrap ${
                  activeFilters.status?.length === 1 && activeFilters.status[0] === 'Follow-up'
                    ? 'bg-purple-800 text-white'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                Follow-up
                <span className={`px-1 py-0.5 rounded-full text-xs font-bold ${
                  activeFilters.status?.length === 1 && activeFilters.status[0] === 'Follow-up'
                    ? 'bg-purple-900 text-purple-100'
                    : 'bg-purple-500 text-white'
                }`}>
                  {statusCounts['Follow-up']}
                </span>
              </button>
              <button
                onClick={() => handleStatusFilter('Deal Close')}
                className={`px-2.5 py-1.5 rounded-md transition-colors text-xs font-medium flex items-center gap-1 whitespace-nowrap ${
                  activeFilters.status?.length === 1 && activeFilters.status[0] === 'Deal Close'
                    ? 'bg-green-800 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                Deal Close
                <span className={`px-1 py-0.5 rounded-full text-xs font-bold ${
                  activeFilters.status?.length === 1 && activeFilters.status[0] === 'Deal Close'
                    ? 'bg-green-900 text-green-100'
                    : 'bg-green-500 text-white'
                }`}>
                  {statusCounts['Deal Close']}
                </span>
              </button>
              <button
                onClick={() => handleStatusFilter('Work Alloted')}
                className={`px-2.5 py-1.5 rounded-md transition-colors text-xs font-medium flex items-center gap-1 whitespace-nowrap ${
                  activeFilters.status?.length === 1 && activeFilters.status[0] === 'Work Alloted'
                    ? 'bg-indigo-800 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                Work Alloted
                <span className={`px-1 py-0.5 rounded-full text-xs font-bold ${
                  activeFilters.status?.length === 1 && activeFilters.status[0] === 'Work Alloted'
                    ? 'bg-indigo-900 text-indigo-100'
                    : 'bg-indigo-500 text-white'
                }`}>
                  {statusCounts['Work Alloted']}
                </span>
              </button>
              <button
                onClick={() => handleStatusFilter('Hotlead')}
                className={`px-2.5 py-1.5 rounded-md transition-colors text-xs font-medium flex items-center gap-1 whitespace-nowrap ${
                  activeFilters.status?.length === 1 && activeFilters.status[0] === 'Hotlead'
                    ? 'bg-red-800 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                Hotlead
                <span className={`px-1 py-0.5 rounded-full text-xs font-bold ${
                  activeFilters.status?.length === 1 && activeFilters.status[0] === 'Hotlead'
                    ? 'bg-red-900 text-red-100'
                    : 'bg-red-500 text-white'
                }`}>
                  {statusCounts['Hotlead']}
                </span>
              </button>
              <button
                onClick={() => handleStatusFilter('Mandate Sent')}
                className={`px-2.5 py-1.5 rounded-md transition-colors text-xs font-medium flex items-center gap-1 whitespace-nowrap ${
                  activeFilters.status?.length === 1 && activeFilters.status[0] === 'Mandate Sent'
                    ? 'bg-teal-800 text-white'
                    : 'bg-teal-600 hover:bg-teal-700 text-white'
                }`}
              >
                Mandate Sent
                <span className={`px-1 py-0.5 rounded-full text-xs font-bold ${
                  activeFilters.status?.length === 1 && activeFilters.status[0] === 'Mandate Sent'
                    ? 'bg-teal-900 text-teal-100'
                    : 'bg-teal-500 text-white'
                }`}>
                  {statusCounts['Mandate Sent']}
                </span>
              </button>
              <button
                onClick={() => handleStatusFilter('Documentation')}
                className={`px-2.5 py-1.5 rounded-md transition-colors text-xs font-medium flex items-center gap-1 whitespace-nowrap ${
                  activeFilters.status?.length === 1 && activeFilters.status[0] === 'Documentation'
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-600 hover:bg-slate-700 text-white'
                }`}
              >
                Documentation
                <span className={`px-1 py-0.5 rounded-full text-xs font-bold ${
                  activeFilters.status?.length === 1 && activeFilters.status[0] === 'Documentation'
                    ? 'bg-slate-900 text-slate-100'
                    : 'bg-slate-500 text-white'
                }`}>
                  {statusCounts['Documentation']}
                </span>
              </button>
              <button
                onClick={() => handleStatusFilter('Others')}
                className={`px-2.5 py-1.5 rounded-md transition-colors text-xs font-medium flex items-center gap-1 whitespace-nowrap ${
                  activeFilters.status?.length === 1 && activeFilters.status[0] === 'Others'
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-600 hover:bg-gray-700 text-white'
                }`}
              >
                Others
                <span className={`px-1 py-0.5 rounded-full text-xs font-bold ${
                  activeFilters.status?.length === 1 && activeFilters.status[0] === 'Others'
                    ? 'bg-gray-900 text-gray-100'
                    : 'bg-gray-500 text-white'
                }`}>
                  {statusCounts['Others']}
                </span>
              </button>
            </div>
            </div>
          </div>

      {/* Bulk Actions Section */}
      <div className="bg-white p-3 rounded-lg shadow-md mb-4">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {/* Search Input */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <input
                type="text"
                placeholder="Search leads..."
                value={searchTerm}
                onChange={handleSearchInputChange}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                onFocus={() => searchTerm.length >= 2 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-black placeholder-gray-500 text-sm"
              />
              
              {/* Search Suggestions Dropdown */}
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                  {searchSuggestions.map((lead) => {
                    // Determine what field matched for highlighting
                    const queryLower = searchTerm.toLowerCase();
                    const queryNumbers = searchTerm.replace(/[^0-9]/g, '');
                    
                    const getMatchType = () => {
                      if (lead.kva.toLowerCase().includes(queryLower)) return 'KVA';
                      if (lead.consumerNumber.toLowerCase().includes(queryLower) || lead.consumerNumber.replace(/[^0-9]/g, '').includes(queryNumbers)) return 'Consumer No.';
                      
                      // Check all mobile numbers
                      const allMobileNumbers = [
                        lead.mobileNumber, // backward compatibility
                        ...(lead.mobileNumbers || []).map(m => m.number)
                      ].filter(Boolean);
                      
                      if (allMobileNumbers.some(mobileNumber => 
                        mobileNumber?.toLowerCase().includes(queryLower) || 
                        mobileNumber?.replace(/[^0-9]/g, '').includes(queryNumbers)
                      )) return 'Phone';
                      
                      // Check mobile number names (including client name fallback only for main number)
                      const allMobileNames = (lead.mobileNumbers || []).map(m => m.name || (m.isMain ? lead.clientName : '')).filter(Boolean);
                      if (allMobileNames.some(mobileName => 
                        mobileName?.toLowerCase().includes(queryLower)
                      )) return 'Contact';
                      
                      if (lead.company.toLowerCase().includes(queryLower)) return 'Company';
                      if (lead.companyLocation?.toLowerCase().includes(queryLower)) return 'Address';
                      if (lead.clientName.toLowerCase().includes(queryLower)) return 'Client';
                      if (lead.connectionDate.toLowerCase().includes(queryLower)) return 'Date';
                      return 'Match';
                    };

                    const matchType = getMatchType();

                    return (
                      <div
                        key={lead.id}
                        onClick={() => handleSuggestionClick(lead)}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0 text-sm"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{lead.kva}</div>
                            <div className="text-xs text-gray-600">{lead.company} • {lead.clientName}</div>
                          </div>
                          <div className="ml-2">
                            <span className="inline-flex px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                              {matchType}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            <button
              onClick={handleSearch}
              className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
            >
              Search
            </button>
            
            {activeFilters.searchTerm && (
              <button
                onClick={clearSearch}
                className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
              >
                Clear
              </button>
            )}
          </div>
          
              <button
                onClick={() => handleSelectAll(!selectAll)}
                className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                  selectAll 
                    ? 'bg-purple-600 text-white hover:bg-purple-700' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {selectAll ? 'Deselect All' : 'Select All'}
              </button>
            {selectedLeads.size > 0 && (
              <>
                <span className="text-sm text-gray-600">
                  {selectedLeads.size} lead(s) selected
                </span>
                <select
                  onChange={(e) => {
                    const newStatus = e.target.value as Lead['status'];
                    if (newStatus) {
                      handleBulkStatusUpdate(newStatus);
                    }
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  defaultValue=""
                  aria-label="Update status for selected leads"
                >
                  <option value="" disabled>Update Status</option>
                  <option value="New">New</option>
                  <option value="CNR">CNR</option>
                  <option value="Busy">Busy</option>
                  <option value="Follow-up">Follow-up</option>
                  <option value="Deal Close">Deal Close</option>
                  <option value="Work Alloted">Work Alloted</option>
                  <option value="Hotlead">Hotlead</option>
                  <option value="Mandate Sent">Mandate Sent</option>
                  <option value="Documentation">Documentation</option>
                  <option value="Others">Others</option>
                </select>
                <button
                  onClick={handleBulkDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete Selected
                </button>
                <button
                  onClick={clearSelection}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
              </>
            )}
        </div>
      </div>  

      {/* Status Filter Indicator */}
      {activeFilters.status && activeFilters.status.length === 1 ? (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-blue-800">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <circle cx="10" cy="10" r="3" />
                </svg>
              </div>
              <div>
                <span className="font-semibold text-lg">Filtered by Status: {activeFilters.status[0]}</span>
                <p className="text-sm text-blue-600">Showing leads with {activeFilters.status[0]} status only</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2 shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Back to Main Dashboard
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <circle cx="10" cy="10" r="3" />
              </svg>
              <span className="font-medium">No status selected - Click a status button to view leads (including updated ones)</span>
            </div>
          </div>
        </div>
      )}

      {/* Empty Status Notification */}
      {showEmptyStatusNotification && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-yellow-800">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <circle cx="10" cy="10" r="3" />
              </svg>
              <span className="font-medium">{emptyStatusMessage}</span>
            </div>
            <button
              onClick={() => setShowEmptyStatusNotification(false)}
              className="text-yellow-600 hover:text-yellow-800 text-sm font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div 
          className="bg-white p-4 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-all duration-200 hover:bg-gray-50"
          onClick={() => router.push('/all-leads')}
        >
          <h3 className="text-lg font-semibold text-gray-700">All Leads</h3>
          <p className="text-3xl font-bold text-blue-600">{leads.length}</p>
        </div>
        <div 
          className="bg-white p-4 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-all duration-200 hover:bg-gray-50"
          onClick={() => router.push('/due-today')}
        >
          <h3 className="text-lg font-semibold text-gray-700">Due Today</h3>
          <p className="text-3xl font-bold text-yellow-600">{dueToday}</p>
        </div>
        <div 
          className="bg-white p-4 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-all duration-200 hover:bg-gray-50"
          onClick={() => router.push('/upcoming')}
        >
          <h3 className="text-lg font-semibold text-gray-700">Upcoming (7 Days)</h3>
          <p className="text-3xl font-bold text-green-600">{upcoming}</p>
        </div>
        <div 
          className="bg-white p-4 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-all duration-200 hover:bg-gray-50"
          onClick={() => router.push('/due-today?tab=overdue')}
        >
          <h3 className="text-lg font-semibold text-gray-700">Overdue</h3>
          <p className="text-3xl font-bold text-red-600">{overdue}</p>
        </div>
        <div 
          className="bg-white p-4 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-all duration-200 hover:bg-gray-50"
          onClick={() => router.push('/follow-up-mandate')}
        >
          <h3 className="text-lg font-semibold text-gray-700">Mandate & Documentation</h3>
          <p className="text-3xl font-bold text-purple-600">{followUpMandate}</p>
        </div>
      </div>
      

      
      {/* Lead Table */}
      <div data-lead-table className="relative">
        <div className="sticky top-0 z-10 bg-white shadow-sm rounded-lg">
          <LeadTable 
            filters={activeFilters} 
            onLeadClick={handleLeadClick}
            selectedLeads={selectedLeads}
            onLeadSelection={handleLeadSelection}
            selectAll={selectAll}
            onSelectAll={handleSelectAll}
          />
        </div>
      </div>

      {/* Lead Detail Modal */}
      {showLeadModal && selectedLead && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-5/6 lg:w-4/5 xl:w-3/4 shadow-lg rounded-md bg-white">
            <div className="mt-3">
            {/* Modal Header */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Lead Details</h3>
              <button
                onClick={() => {
                  setShowLeadModal(false);
                  // Restore body scrolling when modal is closed
                  document.body.style.overflow = 'unset';
                }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="Close modal"
              >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
              </button>
            </div>

              {/* Modal Content */}
              <div className="space-y-3">
                {/* Main Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {/* Basic Info */}
                  <div className="bg-gray-50 p-3 rounded-md">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-medium text-gray-600">Client Name</label>
                      <button
                        onClick={() => copyToClipboard(selectedLead.clientName, 'clientName')}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title="Copy client name"
                      >
                        {copiedField === 'clientName' ? (
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{selectedLead.clientName}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-medium text-gray-600">Company</label>
                      <button
                        onClick={() => copyToClipboard(selectedLead.company, 'company')}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title="Copy company name"
                      >
                        {copiedField === 'company' ? (
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{selectedLead.company}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-medium text-gray-600">Consumer Number</label>
                      <button
                        onClick={() => copyToClipboard(selectedLead.consumerNumber || 'N/A', 'consumerNumber')}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title="Copy consumer number"
                      >
                        {copiedField === 'consumerNumber' ? (
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{selectedLead.consumerNumber || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-medium text-gray-600">KVA</label>
                      <button
                        onClick={() => copyToClipboard(selectedLead.kva, 'kva')}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title="Copy KVA"
                      >
                        {copiedField === 'kva' ? (
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{selectedLead.kva}</p>
                  </div>
                  
                  {/* Contact Info */}
                  <div className="bg-gray-50 p-3 rounded-md">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-medium text-gray-600">Main Phone</label>
                      <button
                        onClick={() => {
                          const phoneNumber = selectedLead.mobileNumbers && selectedLead.mobileNumbers.length > 0 
                            ? selectedLead.mobileNumbers.find(m => m.isMain)?.number || selectedLead.mobileNumbers[0]?.number || 'N/A'
                            : selectedLead.mobileNumber || 'N/A';
                          copyToClipboard(phoneNumber, 'mainPhone');
                        }}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title="Copy main phone number"
                      >
                        {copiedField === 'mainPhone' ? (
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                  </div>
                    <p className="text-sm font-medium text-gray-900">
                      {(() => {
                        const phoneNumber = selectedLead.mobileNumbers && selectedLead.mobileNumbers.length > 0 
                          ? selectedLead.mobileNumbers.find(m => m.isMain)?.number || selectedLead.mobileNumbers[0]?.number || 'N/A'
                          : selectedLead.mobileNumber || 'N/A';
                        return phoneNumber;
                      })()}
                    </p>
                </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          selectedLead.status === 'New' ? 'bg-blue-100 text-blue-800' :
                          selectedLead.status === 'CNR' ? 'bg-orange-100 text-orange-800' :
                          selectedLead.status === 'Busy' ? 'bg-yellow-100 text-yellow-800' :
                          selectedLead.status === 'Follow-up' ? 'bg-purple-100 text-purple-800' :
                          selectedLead.status === 'Deal Close' ? 'bg-green-100 text-green-800' :
                          selectedLead.status === 'Work Alloted' ? 'bg-indigo-100 text-indigo-800' :
                          selectedLead.status === 'Hotlead' ? 'bg-red-100 text-red-800' :
                          selectedLead.status === 'Others' ? 'bg-gray-100 text-gray-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedLead.status}
                        </span>
                      </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Unit Type</label>
                    <p className="text-sm font-medium text-gray-900">{selectedLead.unitType}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Discom</label>
                    <p className="text-sm font-medium text-gray-900">{selectedLead.discom || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <label className="block text-xs font-medium text-gray-600 mb-1">GIDC</label>
                    <p className="text-sm font-medium text-gray-900">{selectedLead.gidc || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <label className="block text-xs font-medium text-gray-600 mb-1">GST Number</label>
                    <p className="text-sm font-medium text-gray-900">{selectedLead.gstNumber || 'N/A'}</p>
                  </div>
                  
                  {/* Dates */}
                  <div className="bg-gray-50 p-3 rounded-md">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Connection Date</label>
                    <p className="text-sm font-medium text-gray-900">{formatDateToDDMMYYYY(selectedLead.connectionDate)}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Follow-up Date</label>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedLead.followUpDate ? formatDateToDDMMYYYY(selectedLead.followUpDate) : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Last Activity</label>
                    <p className="text-sm font-medium text-gray-900">{formatDateToDDMMYYYY(selectedLead.lastActivityDate)}</p>
                  </div>
                  

                  </div>

                {/* Additional Numbers */}
                {selectedLead.mobileNumbers && selectedLead.mobileNumbers.length > 0 && (
                  <div className="bg-gray-50 p-3 rounded-md">
                    <label className="block text-xs font-medium text-gray-600 mb-2">All Mobile Numbers</label>
                    <div className="space-y-2">
                      {selectedLead.mobileNumbers.filter(m => m.number && m.number.trim()).map((mobile, index) => (
                        <div key={index} className="flex items-center justify-between bg-white px-3 py-2 rounded border">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">
                              {mobile.name ? `${mobile.name}` : `Mobile ${index + 1}`}
                            </div>
                            <div className="text-sm text-gray-600">{mobile.number}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            {mobile.isMain && (
                              <span className="px-2 py-1 text-xs font-bold bg-blue-100 text-blue-800 rounded-full">
                                Main
                              </span>
                            )}
                            <button
                              onClick={() => copyToClipboard(mobile.number, `mobile${index + 1}`)}
                              className="text-gray-400 hover:text-gray-600 transition-colors"
                              title="Copy mobile number"
                            >
                              {copiedField === `mobile${index + 1}` ? (
                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes and Additional Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedLead.companyLocation && (
                    <div className="bg-gray-50 p-3 rounded-md">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Company Location</label>
                      <p className="text-sm font-medium text-gray-900">{selectedLead.companyLocation}</p>
                    </div>
                  )}
                  {selectedLead.notes && (
                    <div className="bg-gray-50 p-3 rounded-md">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Last Discussion</label>
                      <p className="text-sm font-medium text-gray-900 line-clamp-3">{selectedLead.notes}</p>
                    </div>
                  )}
                  {selectedLead.finalConclusion && (
                    <div className="bg-gray-50 p-3 rounded-md">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Final Conclusion</label>
                      <p className="text-sm font-medium text-gray-900 line-clamp-3">{selectedLead.finalConclusion}</p>
                    </div>
                  )}
                </div>

                {/* Recent Activities - Compact */}
                {selectedLead.activities && selectedLead.activities.filter(activity => activity.description !== 'Lead created').length > 0 && (
                  <div className="bg-gray-50 p-3 rounded-md">
                    <label className="block text-xs font-medium text-gray-600 mb-2">Recent Activities</label>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {selectedLead.activities.filter(activity => activity.description !== 'Lead created').slice(-3).map((activity) => (
                        <div key={activity.id} className="bg-white p-2 rounded text-xs">
                          <p className="text-gray-900 font-medium">{activity.description}</p>
                          <p className="text-gray-500">
                            {new Date(activity.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
            
              {/* Modal Footer */}
              <div className="flex justify-between items-center mt-6 pt-4 border-t">
                <div className="flex space-x-3">
                  <button 
                    onClick={() => {
                        const allInfo = `Client: ${selectedLead.clientName}
Company: ${selectedLead.company}
Consumer Number: ${selectedLead.consumerNumber || 'N/A'}
KVA: ${selectedLead.kva}
Discom: ${selectedLead.discom || 'N/A'}
GIDC: ${selectedLead.gidc || 'N/A'}
GST Number: ${selectedLead.gstNumber || 'N/A'}
Phone: ${(() => {
  const phoneNumber = selectedLead.mobileNumbers && selectedLead.mobileNumbers.length > 0 
    ? selectedLead.mobileNumbers.find(m => m.isMain)?.number || selectedLead.mobileNumbers[0]?.number || 'N/A'
    : selectedLead.mobileNumber || 'N/A';
  const contactName = selectedLead.mobileNumbers && selectedLead.mobileNumbers.length > 0 
    ? selectedLead.mobileNumbers.find(m => m.isMain)?.name || selectedLead.clientName || 'N/A'
    : selectedLead.clientName || 'N/A';
  return `${phoneNumber} - ${contactName}`;
})()}
Status: ${selectedLead.status}
Unit Type: ${selectedLead.unitType}
Connection Date: ${formatDateToDDMMYYYY(selectedLead.connectionDate)}
Follow-up Date: ${selectedLead.followUpDate ? formatDateToDDMMYYYY(selectedLead.followUpDate) : 'N/A'}
Last Activity: ${formatDateToDDMMYYYY(selectedLead.lastActivityDate)}
${selectedLead.companyLocation ? `Location: ${selectedLead.companyLocation}` : ''}
${selectedLead.notes ? `Last Discussion: ${selectedLead.notes}` : ''}
${selectedLead.finalConclusion ? `Conclusion: ${selectedLead.finalConclusion}` : ''}`;
                        copyToClipboard(allInfo, 'allInfo');
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors flex items-center space-x-2"
                    >
                      {copiedField === 'allInfo' ? (
                        <>
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span>Copy All Info</span>
                        </>
                      )}
                  </button>
                  
                  <button 
                    onClick={() => handleWhatsAppRedirect(selectedLead)}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                    </svg>
                    <span>WhatsApp</span>
                  </button>
                </div>
                <div className="flex space-x-3">
              <button 
                onClick={() => {
                  setShowLeadModal(false);
                  // Restore body scrolling when modal is closed
                  document.body.style.overflow = 'unset';
                }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                Close
              </button>
              <button 
                onClick={() => handleEditLead(selectedLead)}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Edit Lead
              </button>
              <button
                onClick={() => {
                  setLeadToDelete(selectedLead);
                  setShowDeleteModal(true);
                }}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                Delete Lead
              </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ultra Sleek Premium Delete Modal */}
      {showDeleteModal && leadToDelete && (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900/95 via-gray-900/90 to-black/95 backdrop-blur-xl flex items-center justify-center z-[60] p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl w-full max-w-md transform transition-all duration-700 ease-out border border-white/20">
            {/* Sleek Modal Header */}
            <div className="flex justify-center items-center p-6 bg-gradient-to-br from-slate-50 via-white to-gray-50 rounded-t-3xl">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-rose-500 via-pink-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
                  <div className="w-12 h-12 bg-gradient-to-br from-rose-400 to-pink-500 rounded-xl flex items-center justify-center shadow-inner">
                    <svg className="w-7 h-7 text-white drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
              </div>
            </div>
            
            {/* Sleek Modal Content */}
            <div className="p-6 text-center bg-gradient-to-br from-white via-slate-50/50 to-gray-50/30">
              <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-slate-800 via-gray-700 to-slate-800 bg-clip-text text-transparent">
                Delete Lead
              </h3>
              <p className="text-slate-600 mb-6 text-base font-medium">
                Are you sure you want to delete this lead?
              </p>
              
              {/* Sleek Lead Details Card */}
              <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-2xl p-5 mb-6 border border-slate-200/50 shadow-inner">
                <div className="text-xs text-slate-500 mb-3 font-semibold uppercase tracking-wider">Lead Information</div>
                <div className="space-y-2">
                  <div className="text-lg font-bold text-slate-800">{leadToDelete.kva}</div>
                  {leadToDelete.clientName && (
                    <div className="text-sm text-slate-600 font-medium">{leadToDelete.clientName}</div>
                  )}
                  {leadToDelete.company && (
                    <div className="text-sm text-slate-500">{leadToDelete.company}</div>
                  )}
                </div>
              </div>
              
              {/* Sleek Warning Message */}
              <div className="bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200/50 rounded-2xl p-4 mb-6 shadow-sm">
                <div className="flex items-center justify-center space-x-3 text-rose-700 text-sm font-semibold">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>This action cannot be done without your attention.</span>
                </div>
              </div>
            </div>
            
            {/* Sleek Action Buttons */}
            <div className="flex justify-center space-x-4 p-6 bg-gradient-to-br from-slate-50 via-white to-gray-50 rounded-b-3xl">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setLeadToDelete(null);
                }}
                className="px-6 py-3 text-sm font-bold text-slate-700 bg-white/80 backdrop-blur-sm border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteLead(leadToDelete.id);
                  setShowDeleteModal(false);
                  setShowLeadModal(false);
                  setLeadToDelete(null);
                  document.body.style.overflow = 'unset';
                }}
                className="px-6 py-3 text-sm font-bold bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white hover:from-rose-600 hover:via-pink-600 hover:to-rose-700 rounded-2xl transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5"
              >
                Delete Lead
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ultra Sleek Premium Mass Delete Modal */}
      {showMassDeleteModal && leadsToDelete.length > 0 && (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900/95 via-gray-900/90 to-black/95 backdrop-blur-xl flex items-center justify-center z-[60] p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl w-full max-w-lg transform transition-all duration-700 ease-out border border-white/20">
            {/* Sleek Modal Header */}
            <div className="flex justify-center items-center p-6 bg-gradient-to-br from-slate-50 via-white to-gray-50 rounded-t-3xl">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-rose-500 via-pink-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
                  <div className="w-12 h-12 bg-gradient-to-br from-rose-400 to-pink-500 rounded-xl flex items-center justify-center shadow-inner">
                    <svg className="w-7 h-7 text-white drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                </div>
                <div className="absolute -top-2 -right-2 w-7 h-7 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                  <span className="text-white text-sm font-bold">{leadsToDelete.length}</span>
                </div>
              </div>
            </div>
            
            {/* Sleek Modal Content */}
            <div className="p-6 text-center bg-gradient-to-br from-white via-slate-50/50 to-gray-50/30">
              <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-slate-800 via-gray-700 to-slate-800 bg-clip-text text-transparent">
                Delete {leadsToDelete.length} Leads
              </h3>
              <p className="text-slate-600 mb-6 text-base font-medium">
                Are you sure you want to delete these {leadsToDelete.length} selected leads?
              </p>
              
              {/* Sleek Leads List */}
              <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-2xl p-5 mb-6 border border-slate-200/50 shadow-inner max-h-52 overflow-y-auto">
                <div className="text-xs text-slate-500 mb-4 font-semibold uppercase tracking-wider">Selected Leads</div>
                <div className="space-y-3">
                  {leadsToDelete.slice(0, 4).map((lead, index) => (
                    <div key={lead.id} className="flex items-center justify-between bg-white/80 backdrop-blur-sm rounded-xl p-3 shadow-sm border border-slate-200/50">
                      <div className="flex-1 text-left">
                        <div className="font-bold text-slate-800 text-sm">{lead.kva}</div>
                        {lead.clientName && (
                          <div className="text-xs text-slate-600 font-medium">{lead.clientName}</div>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 bg-gradient-to-r from-slate-100 to-gray-100 px-3 py-1 rounded-full font-semibold">
                        #{index + 1}
                      </div>
                    </div>
                  ))}
                  {leadsToDelete.length > 4 && (
                    <div className="text-center text-sm text-slate-500 font-semibold bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-slate-200/50">
                      ... and {leadsToDelete.length - 4} more leads
                    </div>
                  )}
                </div>
              </div>
              
              {/* Sleek Warning Message */}
              <div className="bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200/50 rounded-2xl p-4 mb-6 shadow-sm">
                <div className="flex items-center justify-center space-x-3 text-rose-700 text-sm font-semibold">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>This action cannot be done without your attention.</span>
                </div>
              </div>
            </div>
            
            {/* Sleek Action Buttons */}
            <div className="flex justify-center space-x-4 p-6 bg-gradient-to-br from-slate-50 via-white to-gray-50 rounded-b-3xl">
              <button
                onClick={() => {
                  setShowMassDeleteModal(false);
                  setLeadsToDelete([]);
                }}
                className="px-6 py-3 text-sm font-bold text-slate-700 bg-white/80 backdrop-blur-sm border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  leadsToDelete.forEach(lead => deleteLead(lead.id));
                  setShowMassDeleteModal(false);
                  setLeadsToDelete([]);
                  setSelectedLeads(new Set());
                  setSelectAll(false);
                }}
                className="px-6 py-3 text-sm font-bold bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white hover:from-rose-600 hover:via-pink-600 hover:to-rose-700 rounded-2xl transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5"
              >
                Delete {leadsToDelete.length} Leads
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Password Modal */}
      {showExportPasswordModal && (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900/95 via-gray-900/90 to-black/95 backdrop-blur-xl flex items-center justify-center z-[60] p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl w-full max-w-md transform transition-all duration-700 ease-out border border-white/20">
            {/* Modal Header */}
            <div className="flex justify-center items-center p-6 bg-gradient-to-br from-slate-50 via-white to-gray-50 rounded-t-3xl">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center shadow-inner">
                    <svg className="w-7 h-7 text-white drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
              </div>
            </div>
            
            {/* Modal Content */}
            <div className="p-6 text-center bg-gradient-to-br from-white via-slate-50/50 to-gray-50/30">
              <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-slate-800 via-gray-700 to-slate-800 bg-clip-text text-transparent">
                Export Leads
              </h3>
              <p className="text-slate-600 mb-6 text-base font-medium">
                Please enter the password to export leads data
              </p>
              
              {/* Password Input */}
              <div className="mb-6">
                <input
                  type="password"
                  value={exportPassword}
                  onChange={(e) => setExportPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && performExport()}
                  placeholder="Enter password"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 text-center font-medium text-lg text-black placeholder-black"
                  autoFocus
                />
              </div>
              
              {/* Warning Notice */}
              <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200/50 rounded-2xl p-4 mb-4 shadow-sm">
                <div className="flex items-center justify-center space-x-3 text-red-700 text-sm font-bold">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>⚠️ STAY AWAY, IF YOU'RE NOT ADMIN ⚠️</span>
                </div>
              </div>
              
              {/* Security Notice */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-2xl p-4 mb-6 shadow-sm">
                <div className="flex items-center justify-center space-x-3 text-blue-700 text-sm font-semibold">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span>This action requires authorization to protect sensitive data.</span>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-center space-x-4 p-6 bg-gradient-to-br from-slate-50 via-white to-gray-50 rounded-b-3xl">
              <button
                onClick={() => {
                  setShowExportPasswordModal(false);
                  setExportPassword('');
                }}
                className="px-6 py-3 text-sm font-bold text-slate-700 bg-white/80 backdrop-blur-sm border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Cancel
              </button>
              <button
                onClick={performExport}
                className="px-6 py-3 text-sm font-bold bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 text-white hover:from-blue-600 hover:via-indigo-600 hover:to-blue-700 rounded-2xl transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5"
              >
                Export Leads
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`px-6 py-4 rounded-lg shadow-lg text-white font-medium ${
            toastType === 'success' ? 'bg-green-600' :
            toastType === 'error' ? 'bg-red-600' :
            'bg-blue-600'
          }`}>
            <div className="flex items-center space-x-3">
              {toastType === 'success' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {toastType === 'error' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              {toastType === 'info' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <span>{toastMessage}</span>
              <button
                onClick={() => setShowToast(false)}
                className="ml-4 text-white hover:text-gray-200"
                aria-label="Close notification"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
