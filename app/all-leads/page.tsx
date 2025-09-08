'use client';

import { useState, useMemo, useRef } from 'react';
import { useLeads, Lead } from '../context/LeadContext';
import { useRouter } from 'next/navigation';
import LeadTable from '../components/LeadTable';
// XLSX is imported dynamically to avoid turbopack issues

export default function AllLeadsPage() {
  const router = useRouter();
  const { leads, setLeads } = useLeads();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  // Password protection states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [passwordError, setPasswordError] = useState('');
  
  // Password change states
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordChangeError, setPasswordChangeError] = useState('');
  
  // Bulk delete states
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkDeletePassword, setBulkDeletePassword] = useState('');
  const [bulkDeleteError, setBulkDeleteError] = useState('');
  
  // Toast notification states
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
  
  // Password for deletion (stored in localStorage)
  const [DELETE_PASSWORD, setDELETE_PASSWORD] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('deletePassword') || 'admin123';
    }
    return 'admin123';
  });

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

  // Filter leads based on status and search term
  const allLeads = useMemo(() => {
    let filtered = leads; // Show all leads regardless of status or deletion status
    
    if (searchTerm) {
      filtered = filtered.filter(lead => {
        const searchLower = searchTerm.toLowerCase();
        
        // Check if it's a phone number search (only digits)
        if (/^\d+$/.test(searchTerm)) {
          const allMobileNumbers = [
            lead.mobileNumber,
            ...(lead.mobileNumbers || []).map(m => m.number)
          ];
          
          for (const mobileNumber of allMobileNumbers) {
            if (mobileNumber) {
              const phoneDigits = mobileNumber.replace(/[^0-9]/g, '');
              if (phoneDigits.includes(searchTerm)) {
                return true;
              }
            }
          }
        }
        
        // Regular text search
        const allMobileNumbers = [
          lead.mobileNumber,
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
          lead.finalConclusion,
          lead.status
        ].filter(Boolean).map(field => field?.toLowerCase());
        
        return searchableFields.some(field => field?.includes(searchLower));
      });
    }
    
    // Sort leads: deleted leads first, then completed leads, then active leads
    return filtered.sort((a, b) => {
      // If one is deleted and the other isn't, deleted goes first
      if (a.isDeleted && !b.isDeleted) return -1;
      if (!a.isDeleted && b.isDeleted) return 1;
      
      // If both are deleted or both are not deleted, check completion status
      if (a.isDone && !b.isDone) return -1;
      if (!a.isDone && b.isDone) return 1;
      
      // If both have same deletion and completion status, sort by lastActivityDate (most recent first)
      const dateA = new Date(a.lastActivityDate).getTime();
      const dateB = new Date(b.lastActivityDate).getTime();
      return dateB - dateA; // Most recent first
    });
  }, [leads, searchTerm]);


  // Modal functions
  const openModal = (lead: Lead) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedLead(null);
    setIsModalOpen(false);
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

  // Password protection functions (currently unused but kept for future functionality)
  // const handleDeleteClick = (lead: Lead) => {
  //   setLeadToDelete(lead);
  //   setShowPasswordModal(true);
  //   setPassword('');
  //   setPasswordError('');
  // };


  const handlePasswordSubmit = () => {
    if (password === DELETE_PASSWORD) {
      if (leadToDelete) {
        // Always permanently delete when deleting from All Leads page
        setLeads(prev => prev.filter(lead => lead.id !== leadToDelete.id));
        setShowPasswordModal(false);
        setLeadToDelete(null);
        setPassword('');
        setPasswordError('');
      }
    } else {
      setPasswordError('Incorrect password. Please try again.');
    }
  };

  const handlePasswordCancel = () => {
    setShowPasswordModal(false);
    setLeadToDelete(null);
    setPassword('');
    setPasswordError('');
  };

  // Password change functions
  const handlePasswordChangeSubmit = () => {
    if (currentPassword !== DELETE_PASSWORD) {
      setPasswordChangeError('Current password is incorrect.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordChangeError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 4) {
      setPasswordChangeError('New password must be at least 4 characters long.');
      return;
    }
    
    setDELETE_PASSWORD(newPassword);
    localStorage.setItem('deletePassword', newPassword);
    setShowPasswordChangeModal(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordChangeError('');
  };

  const handlePasswordChangeCancel = () => {
    setShowPasswordChangeModal(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordChangeError('');
  };

  // Bulk delete functions
  const handleSelectLead = (leadId: string) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(leadId)) {
      newSelected.delete(leadId);
    } else {
      newSelected.add(leadId);
    }
    setSelectedLeads(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedLeads.size === allLeads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(allLeads.map(lead => lead.id)));
    }
  };

  const handleBulkDeleteClick = () => {
    if (selectedLeads.size === 0) return;
    setShowBulkDeleteModal(true);
    setBulkDeletePassword('');
    setBulkDeleteError('');
  };

  // Bulk restore function
  const handleBulkRestoreClick = () => {
    if (selectedLeads.size === 0) return;
    
    // Restore all selected deleted leads
    setLeads(prev => 
      prev.map(lead => 
        selectedLeads.has(lead.id) && lead.isDeleted 
          ? { ...lead, isDeleted: false }
          : lead
      )
    );
    
    setSelectedLeads(new Set());
    
    // Show success message
    alert(`${selectedLeads.size} leads have been restored successfully!`);
  };

  // Check if any selected leads are already deleted
  const hasDeletedLeads = Array.from(selectedLeads).some(leadId => {
    const lead = leads.find(l => l.id === leadId);
    return lead?.isDeleted;
  });


  const handleBulkDeleteSubmit = () => {
    if (bulkDeletePassword !== DELETE_PASSWORD) {
      setBulkDeleteError('Incorrect password. Please try again.');
      return;
    }
    
    // Always permanently delete all selected leads
    setLeads(prev => prev.filter(lead => !selectedLeads.has(lead.id)));
    
    setShowBulkDeleteModal(false);
    setSelectedLeads(new Set());
    setBulkDeletePassword('');
    setBulkDeleteError('');
  };

  const handleBulkDeleteCancel = () => {
    setShowBulkDeleteModal(false);
    setBulkDeletePassword('');
    setBulkDeleteError('');
  };

  // Secret password change access
  const handleSecretClick = () => {
    setShowPasswordChangeModal(true);
  };

  // Handle lead click
  const handleLeadClick = (lead: Lead) => {
    openModal(lead);
  };

  // File input ref for import
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Convert Excel serial date to readable date string in DD-MM-YYYY format
  const convertExcelDate = (value: string | number | Date | null | undefined): string => {
    console.log('=== CONVERT EXCEL DATE DEBUG ===');
    console.log('Input value:', value);
    console.log('Input type:', typeof value);
    
    if (!value) {
      console.log('Empty value, returning empty string');
      return '';
    }
    
    // If it's already a string, return as is
    if (typeof value === 'string') {
      const trimmed = value.trim();
      console.log('Trimmed string:', trimmed);
      
      // Check if it's already in DD-MM-YYYY format
      if (trimmed.match(/^\d{2}-\d{2}-\d{4}$/)) {
        console.log('Already in DD-MM-YYYY format:', trimmed);
        return trimmed;
      } else if (trimmed.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Convert from YYYY-MM-DD to DD-MM-YYYY
        const parts = trimmed.split('-');
        const year = parts[0];
        const month = parts[1];
        const day = parts[2];
        const converted = `${day}-${month}-${year}`;
        console.log(`Converting date format from YYYY-MM-DD: ${trimmed} to DD-MM-YYYY: ${converted}`);
        return converted;
      } else if (trimmed.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
        // Handle MM/DD/YYYY or DD/MM/YYYY format
        const parts = trimmed.split('/');
        if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
          // Assume DD/MM/YYYY format
          const day = parts[0].padStart(2, '0');
          const month = parts[1].padStart(2, '0');
          const year = parts[2];
          const converted = `${day}-${month}-${year}`;
          console.log(`Converting date format from DD/MM/YYYY: ${trimmed} to DD-MM-YYYY: ${converted}`);
          return converted;
        }
      } else {
        // Try to parse as date and convert
        const date = new Date(trimmed);
        if (!isNaN(date.getTime())) {
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          const converted = `${day}-${month}-${year}`;
          console.log(`Converting parsed date: ${trimmed} to DD-MM-YYYY: ${converted}`);
          return converted;
        }
        console.log('Could not parse date, returning original:', trimmed);
        return trimmed; // Return original if can't parse
      }
    }
    
    // If it's a number (Excel serial date), convert it
    if (typeof value === 'number') {
      console.log('Processing number value:', value);
      // Excel serial date (days since 1900-01-01, but Excel incorrectly treats 1900 as leap year)
      const excelEpoch = new Date(1900, 0, 1);
      const date = new Date(excelEpoch.getTime() + (value - 2) * 24 * 60 * 60 * 1000);
      
      if (!isNaN(date.getTime())) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const converted = `${day}-${month}-${year}`;
        console.log(`Converting Excel serial date: ${value} to DD-MM-YYYY: ${converted}`);
        return converted;
      }
    }
    
    // If it's a Date object
    if (value instanceof Date) {
      console.log('Processing Date object:', value);
      const day = String(value.getDate()).padStart(2, '0');
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const year = value.getFullYear();
      const converted = `${day}-${month}-${year}`;
      console.log(`Converting Date object to DD-MM-YYYY: ${converted}`);
      return converted;
    }
    
    console.log('Could not convert value, returning empty string');
    console.log('=== END CONVERT EXCEL DATE DEBUG ===');
    return '';
  };

  // Set default values for required fields
  const setDefaultValues = (lead: Partial<Lead>) => {
    if (!lead.status) lead.status = 'New';
    if (!lead.unitType) lead.unitType = 'New';
    if (!lead.lastActivityDate) lead.lastActivityDate = new Date().toLocaleDateString('en-GB');
    if (!lead.isDone) lead.isDone = false;
    if (!lead.isDeleted) lead.isDeleted = false;
    if (!lead.isUpdated) lead.isUpdated = false;
    if (!lead.activities) lead.activities = [];
    if (!lead.mandateStatus) lead.mandateStatus = 'Pending';
    if (!lead.documentStatus) lead.documentStatus = 'Pending Documents';
    if (!lead.mobileNumbers) lead.mobileNumbers = [];
  };

  // Map header to lead field - updated to match your Excel format exactly
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapHeaderToField = (lead: Partial<Lead>, header: string, value: any) => {
    const headerLower = header.toLowerCase().trim();
    console.log('=== MAPPING DEBUG ===');
    console.log('Header: "' + header + '" -> "' + headerLower + '"');
    console.log('Value: "' + value + '" (type: ' + typeof value + ')');
    console.log('Value length: ' + (value ? value.toString().length : 'undefined'));
    console.log('Is empty: ' + (!value || value === '' || value === null || value === undefined));
    console.log('Processing header: ' + headerLower);
    
    // Debug for exact export format headers
    if (header === 'Mobile Number 2' || header === 'Contact Name 2') {
      console.log('🎯 EXACT EXPORT FORMAT HEADER DETECTED:', header);
      console.log('🎯 HEADER LOWER:', headerLower);
      console.log('🎯 VALUE:', value);
    }
    
    // Check if this is a status-related header
    const isStatusHeader = headerLower.includes('status') || 
                          headerLower === 'status' || 
                          headerLower === 'lead status' || 
                          headerLower === 'current status' ||
                          headerLower === 'leadstatus' ||
                          headerLower === 'lead_status' ||
                          headerLower === 'lead-status';
    
    if (isStatusHeader) {
      console.log('🎯 STATUS HEADER DETECTED:', headerLower);
    }
    
    // Special handling for discom headers - check if header contains "discom" in any case
    if (headerLower.includes('discom')) {
      console.log('=== DISCOM HEADER DETECTED ===');
      console.log('Original header:', header);
      console.log('Header lowercase:', headerLower);
      console.log('Value:', value);
      console.log('Value type:', typeof value);
      console.log('String value:', String(value));
      lead.discom = String(value);
      console.log('Mapped discom:', lead.discom);
      console.log('=== END DISCOM MAPPING DEBUG ===');
      return; // Exit early to avoid switch statement
    }
    
    switch (headerLower) {
      // Your Excel column headers - exact matches
      case 'con.no':
      case 'con.no.':
      case 'connection number':
      case 'consumer number':
      case 'consumernumber':
        lead.consumerNumber = String(value);
        break;
      case 'kva':
      case 'name':
      case 'full name':
      case 'lead name':
      case 'contact name':
        lead.kva = String(value);
        break;
      case 'connection date':
      case 'connectiondate':
      case 'email':
      case 'email address':
      case 'contact email':
        console.log(`Setting connection date to: "${value}" (original: ${value})`);
        lead.connectionDate = convertExcelDate(value);
        console.log(`Connection date after setting: "${lead.connectionDate}"`);
        break;
      case 'company':
      case 'company name':
      case 'organization':
        lead.company = String(value);
        break;
      case 'company location':
      case 'companylocation':
      case 'location':
      case 'address':
        lead.companyLocation = String(value);
        break;
      case 'client name':
      case 'clientname':
      case 'client':
        lead.clientName = String(value);
        break;
      case 'mo.no':
      case 'mo.no.':
      case 'mo .no':
      case 'mo .no.':
      case 'mobile number':
      case 'mobilenumber':
      case 'mobile':
      case 'phone':
      case 'phone number':
      case 'contact phone':
      case 'telephone':
      case 'main mobile number':
        console.log('*** MOBILE NUMBER MAPPING ***');
        console.log('Setting mobileNumber to: "' + String(value) + '"');
        console.log('Original value: "' + value + '" (type: ' + typeof value + ')');
        lead.mobileNumber = String(value);
        console.log('Lead mobileNumber after setting: "' + lead.mobileNumber + '"');
        break;
      case 'mobile number 2':
      case 'mobile number2':
      case 'mobile2':
      case 'phone 2':
      case 'phone2':
      case 'mobile no 2':
      case 'mobile no. 2':
      case 'mobile no2':
      case 'contact number 2':
      case 'contact no 2':
      case 'mobile no 2':
      case 'mobile no. 2':
      case 'mobile no2':
      case 'mobile 2':
      case 'mobile2':
      case 'phone no 2':
      case 'phone no. 2':
      case 'phone no2':
      case 'phone 2':
      case 'phone2':
      case 'tel 2':
      case 'tel2':
      case 'telephone 2':
      case 'telephone2':
        console.log('*** MOBILE NUMBER 2 MAPPING ***');
        console.log('Setting mobileNumber2 to: "' + String(value) + '"');
        console.log('Current lead.mobileNumber:', lead.mobileNumber);
        console.log('Current lead.mobileNumbers:', lead.mobileNumbers);
        
        // Initialize mobileNumbers array if it doesn't exist
        if (!lead.mobileNumbers) {
          lead.mobileNumbers = [];
          console.log('Initialized mobileNumbers array');
        }
        
        // Always ensure we have at least 2 slots
        while (lead.mobileNumbers.length < 2) {
                lead.mobileNumbers.push({
            id: String(lead.mobileNumbers.length + 1), 
            number: '', 
                  name: '',
            isMain: lead.mobileNumbers.length === 0 
          });
          console.log('Added slot', lead.mobileNumbers.length, 'isMain:', lead.mobileNumbers[lead.mobileNumbers.length - 1]?.isMain);
        }
        
        // Set the second mobile number (index 1)
        lead.mobileNumbers[1] = { 
          id: '2', 
          number: String(value), 
          name: lead.mobileNumbers[1]?.name || '', 
                  isMain: false
        };
        console.log('Set mobile number 2:', lead.mobileNumbers[1]);
        
        // If we have a main mobile number but no entry in slot 0, add it
        if (lead.mobileNumber && (!lead.mobileNumbers[0] || !lead.mobileNumbers[0].number)) {
          lead.mobileNumbers[0] = { 
            id: '1', 
            number: lead.mobileNumber, 
                  name: '',
                  isMain: true
          };
          console.log('Added main mobile number to slot 0:', lead.mobileNumbers[0]);
        }
        
        console.log('Final mobileNumbers array:', lead.mobileNumbers);
        break;
      case 'mobile number 3':
      case 'mobile number3':
      case 'mobile3':
      case 'phone 3':
      case 'phone3':
      case 'mobile no 3':
      case 'mobile no. 3':
      case 'mobile no3':
      case 'contact number 3':
      case 'contact no 3':
        console.log('*** MOBILE NUMBER 3 MAPPING ***');
        console.log('Setting mobileNumber3 to: "' + String(value) + '"');
        if (!lead.mobileNumbers) {
          // Initialize with main mobile number if it exists
          lead.mobileNumbers = [];
          if (lead.mobileNumber) {
            lead.mobileNumbers.push({ id: '1', number: lead.mobileNumber, name: '', isMain: true });
          }
        }
        // Ensure we have at least 3 slots
        while (lead.mobileNumbers.length < 3) {
          lead.mobileNumbers.push({ id: String(lead.mobileNumbers.length + 1), number: '', name: '', isMain: false });
        }
        // Set the third mobile number
        lead.mobileNumbers[2] = { 
          id: '3', 
          number: String(value), 
          name: lead.mobileNumbers[2]?.name || '', 
                  isMain: false
        };
        break;
      case 'contact name 2':
      case 'contact name2':
      case 'contact2':
      case 'name 2':
      case 'name2':
      case 'contact person 2':
      case 'person name 2':
      case 'contact person2':
      case 'contact 2':
      case 'contact2':
      case 'person 2':
      case 'person2':
      case 'contact person name 2':
      case 'contact person name2':
      case 'person contact 2':
      case 'person contact2':
      case 'contact person name 2':
      case 'contact person name2':
        console.log('*** CONTACT NAME 2 MAPPING ***');
        console.log('Setting contact name 2 to: "' + String(value) + '"');
        console.log('Current lead.mobileNumber:', lead.mobileNumber);
        console.log('Current lead.mobileNumbers:', lead.mobileNumbers);
        
        // Initialize mobileNumbers array if it doesn't exist
        if (!lead.mobileNumbers) {
          lead.mobileNumbers = [];
          console.log('Initialized mobileNumbers array');
        }
        
        // Always ensure we have at least 2 slots
        while (lead.mobileNumbers.length < 2) {
                lead.mobileNumbers.push({
            id: String(lead.mobileNumbers.length + 1), 
                  number: '',
            name: '', 
            isMain: lead.mobileNumbers.length === 0 
          });
          console.log('Added slot', lead.mobileNumbers.length, 'isMain:', lead.mobileNumbers[lead.mobileNumbers.length - 1]?.isMain);
        }
        
        // Set the second contact name (index 1)
        lead.mobileNumbers[1] = { 
          id: '2', 
          number: lead.mobileNumbers[1]?.number || '', 
          name: String(value), 
          isMain: false 
        };
        console.log('Set contact name 2:', lead.mobileNumbers[1]);
        
        // If we have a main mobile number but no entry in slot 0, add it
        if (lead.mobileNumber && (!lead.mobileNumbers[0] || !lead.mobileNumbers[0].number)) {
          lead.mobileNumbers[0] = { 
            id: '1', 
            number: lead.mobileNumber, 
            name: '', 
            isMain: true 
          };
          console.log('Added main mobile number to slot 0:', lead.mobileNumbers[0]);
        }
        
        console.log('Final mobileNumbers array:', lead.mobileNumbers);
        break;
      case 'contact name 3':
      case 'contact name3':
      case 'contact3':
      case 'name 3':
      case 'name3':
      case 'contact person 3':
      case 'person name 3':
      case 'contact person3':
        console.log('*** CONTACT NAME 3 MAPPING ***');
        console.log('Setting contact name 3 to: "' + String(value) + '"');
        if (!lead.mobileNumbers) {
          // Initialize with main mobile number if it exists
          lead.mobileNumbers = [];
          if (lead.mobileNumber) {
            lead.mobileNumbers.push({ id: '1', number: lead.mobileNumber, name: '', isMain: true });
          }
        }
        // Ensure we have at least 3 slots
        while (lead.mobileNumbers.length < 3) {
          lead.mobileNumbers.push({ id: String(lead.mobileNumbers.length + 1), number: '', name: '', isMain: false });
        }
        // Set the third contact name
        lead.mobileNumbers[2] = { 
          id: '3', 
          number: lead.mobileNumbers[2]?.number || '', 
          name: String(value), 
          isMain: false 
        };
        break;
      case 'lead status':
      case 'leadstatus':
      case 'status':
      case 'current status':
      case 'lead_status':
      case 'lead-status':
        console.log('*** STATUS MAPPING ***');
        console.log('Status value: "' + String(value) + '"');
        const statusValue = String(value).toLowerCase().trim();
        if (statusValue === 'new') {
              lead.status = 'New';
          console.log('✅ Mapped to New');
        } else if (statusValue === 'cnr') {
          lead.status = 'CNR';
          console.log('✅ Mapped to CNR');
        } else if (statusValue === 'busy') {
          lead.status = 'Busy';
          console.log('✅ Mapped to Busy');
        } else if (statusValue === 'follow-up' || statusValue === 'followup' || statusValue === 'follow up') {
              lead.status = 'Follow-up';
          console.log('✅ Mapped to Follow-up');
        } else if (statusValue === 'deal close' || statusValue === 'dealclose' || statusValue === 'deal_close') {
          lead.status = 'Deal Close';
          console.log('✅ Mapped to Deal Close');
        } else if (statusValue === 'work alloted' || statusValue === 'workalloted' || statusValue === 'work_alloted') {
          lead.status = 'Work Alloted';
          console.log('✅ Mapped to Work Alloted');
        } else if (statusValue === 'hotlead' || statusValue === 'hot lead' || statusValue === 'hot_lead') {
          lead.status = 'Hotlead';
          console.log('✅ Mapped to Hotlead');
        } else if (statusValue === 'mandate sent' || statusValue === 'mandatesent' || statusValue === 'mandate_sent') {
          lead.status = 'Mandate Sent';
          console.log('✅ Mapped to Mandate Sent');
        } else if (statusValue === 'documentation') {
          lead.status = 'Documentation';
          console.log('✅ Mapped to Documentation');
        } else if (statusValue === 'others' || statusValue === 'other') {
          lead.status = 'Others';
          console.log('✅ Mapped to Others');
        } else {
          // Flexible mapping for variations
          if (statusValue.includes('new')) {
            lead.status = 'New';
            console.log('✅ Flexible mapping: New');
          } else if (statusValue.includes('cnr')) {
            lead.status = 'CNR';
            console.log('✅ Flexible mapping: CNR');
          } else if (statusValue.includes('busy')) {
            lead.status = 'Busy';
            console.log('✅ Flexible mapping: Busy');
            } else if (statusValue.includes('follow')) {
              lead.status = 'Follow-up';
            console.log('✅ Flexible mapping: Follow-up');
          } else if (statusValue.includes('deal') || statusValue.includes('close')) {
              lead.status = 'Deal Close';
            console.log('✅ Flexible mapping: Deal Close');
          } else if (statusValue.includes('work') || statusValue.includes('allot')) {
            lead.status = 'Work Alloted';
            console.log('✅ Flexible mapping: Work Alloted');
          } else if (statusValue.includes('hot')) {
            lead.status = 'Hotlead';
            console.log('✅ Flexible mapping: Hotlead');
          } else if (statusValue.includes('mandate')) {
            lead.status = 'Mandate Sent';
            console.log('✅ Flexible mapping: Mandate Sent');
          } else if (statusValue.includes('document')) {
            lead.status = 'Documentation';
            console.log('✅ Flexible mapping: Documentation');
          } else if (statusValue.includes('other')) {
            lead.status = 'Others';
            console.log('✅ Flexible mapping: Others');
            } else {
            lead.status = 'New'; // Default fallback
            console.log('⚠️ Default mapping: New');
          }
        }
        break;
      case 'unit type':
      case 'unittype':
      case 'unit_type':
      case 'type':
        console.log('*** UNIT TYPE MAPPING ***');
        console.log('Unit type value: "' + String(value) + '"');
        const unitTypeValue = String(value).toLowerCase().trim();
        if (unitTypeValue === 'new') {
          lead.unitType = 'New';
          console.log('✅ Mapped to New');
        } else if (unitTypeValue === 'existing') {
          lead.unitType = 'Existing';
          console.log('✅ Mapped to Existing');
        } else if (unitTypeValue === 'other' || unitTypeValue === 'others') {
          lead.unitType = 'Other';
          console.log('✅ Mapped to Other');
        } else {
          lead.unitType = 'New'; // Default fallback
          console.log('⚠️ Default mapping: New');
        }
        break;
      case 'follow-up date':
      case 'followup date':
      case 'follow_up_date':
      case 'followupdate':
      case 'next follow-up':
      case 'next followup':
      case 'next_follow_up':
      case 'nextfollowup':
      case 'follow up date':
      case 'followup':
      case 'follow-up':
      case 'next follow up':
      case 'next follow-up date':
      case 'next followup date':
      case 'next_follow_up_date':
      case 'nextfollowupdate':
      case 'followupdate':
      case 'follow_up':
      case 'followup_date':
      case 'next_followup':
      case 'nextfollowup_date':
        console.log('*** FOLLOW-UP DATE MAPPING ***');
        console.log('Follow-up date value: "' + String(value) + '"');
        console.log('Follow-up date value type:', typeof value);
        lead.followUpDate = convertExcelDate(value);
        console.log('Follow-up date after setting: "' + lead.followUpDate + '"');
        break;
      case 'last activity date':
      case 'lastactivitydate':
      case 'last_activity_date':
      case 'last activity':
      case 'lastactivity':
      case 'last_activity':
      case 'activity date':
      case 'activitydate':
      case 'activity_date':
      case 'last call date':
      case 'lastcalldate':
      case 'last_call_date':
      case 'last contact date':
      case 'lastcontactdate':
      case 'last_contact_date':
        console.log('*** LAST ACTIVITY DATE MAPPING ***');
        console.log('Last activity date value: "' + String(value) + '"');
        console.log('Last activity date value type:', typeof value);
        lead.lastActivityDate = convertExcelDate(value);
        console.log('Last activity date after setting: "' + lead.lastActivityDate + '"');
        break;
      case 'notes':
      case 'discussion':
      case 'last discussion':
      case 'lastdiscussion':
      case 'last_discussion':
      case 'last-discussion':
      case 'call notes':
      case 'comments':
      case 'comment':
      case 'description':
        // If notes already exist, append the new value
        if (lead.notes) {
          lead.notes = `${lead.notes} | ${String(value)}`;
        } else {
          lead.notes = String(value);
        }
        break;
      case 'gidc':
        lead.gidc = String(value);
        break;
      case 'gst number':
      case 'gstnumber':
      case 'gst_number':
      case 'gst':
        lead.gstNumber = String(value);
        break;
      case 'final conclusion':
      case 'finalconclusion':
      case 'final_conclusion':
      case 'conclusion':
        lead.finalConclusion = String(value);
        break;
      default:
        console.log('⚠️ UNMAPPED HEADER: ' + headerLower);
        break;
    }
    
    // Fallback: Check for partial matches for mobile number 2 and contact name 2
    if (headerLower.includes('mobile') && headerLower.includes('2') && !headerLower.includes('name')) {
      console.log('🔄 FALLBACK: Mobile Number 2 detected via partial match:', headerLower);
      if (!lead.mobileNumbers) {
        lead.mobileNumbers = [];
        if (lead.mobileNumber) {
          lead.mobileNumbers.push({ id: '1', number: lead.mobileNumber, name: '', isMain: true });
        }
      }
      while (lead.mobileNumbers.length < 2) {
        lead.mobileNumbers.push({ id: String(lead.mobileNumbers.length + 1), number: '', name: '', isMain: false });
      }
      lead.mobileNumbers[1] = { 
        id: '2', 
        number: String(value), 
        name: lead.mobileNumbers[1]?.name || '', 
        isMain: false 
      };
      return;
    }
    
    if (headerLower.includes('contact') && headerLower.includes('2') && headerLower.includes('name')) {
      console.log('🔄 FALLBACK: Contact Name 2 detected via partial match:', headerLower);
      if (!lead.mobileNumbers) {
        lead.mobileNumbers = [];
        if (lead.mobileNumber) {
          lead.mobileNumbers.push({ id: '1', number: lead.mobileNumber, name: '', isMain: true });
        }
      }
      while (lead.mobileNumbers.length < 2) {
        lead.mobileNumbers.push({ id: String(lead.mobileNumbers.length + 1), number: '', name: '', isMain: false });
      }
      lead.mobileNumbers[1] = { 
        id: '2', 
        number: lead.mobileNumbers[1]?.number || '', 
        name: String(value), 
        isMain: false 
      };
      return;
    }
    
    console.log('=== END MAPPING DEBUG ===');
  };

  // Parse CSV file
  const parseCSV = (content: string): Partial<Lead>[] => {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0]?.split(',').map(h => h.trim().replace(/"/g, '')) || [];
    console.log('CSV Headers:', headers);

    return lines.slice(1).map((line) => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const lead: Partial<Lead> = {};

      headers.forEach((header, index) => {
        const value = values[index] || '';
        mapHeaderToField(lead, header, value);
      });

      // Set default values for required fields
      setDefaultValues(lead);
      return lead;
    });
  };

  // Parse Excel file using xlsx library
  const parseExcel = async (file: File): Promise<Partial<Lead>[]> => {
    console.log('Starting Excel parsing...');
    
    try {
      // Dynamic import to avoid turbopack issues
      const XLSX = await import('xlsx');
      console.log('XLSX library loaded successfully');
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
          try {
            console.log('File read successfully, size:', e.target?.result);
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            console.log('Data converted to Uint8Array, length:', data.length);
            
            const workbook = XLSX.read(data, { type: 'array' });
            console.log('Workbook read, sheet names:', workbook.SheetNames);
            
            // Get the first sheet
            const sheetName = workbook.SheetNames[0];
            if (!sheetName) {
              reject(new Error('No sheets found in Excel file'));
              return;
            }
            const worksheet = workbook.Sheets[sheetName];
            if (!worksheet) {
              reject(new Error('Could not load worksheet'));
              return;
            }
            console.log('Worksheet loaded:', sheetName);
            
            // Convert to JSON with proper date handling
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
              header: 1,
              raw: false, // Convert dates to strings for better handling
              defval: '',
              dateNF: 'dd-mm-yyyy' // Specify date format
            });
            console.log('JSON data:', jsonData);
            
            if (jsonData.length < 2) {
              reject(new Error('No data rows found in Excel file'));
              return;
            }
            
            const headers = jsonData[0] as string[];
            console.log('Excel Headers:', headers);
            
            const leads = jsonData.slice(1).map((row: unknown, index: number) => {
              const rowArray = row as any[];
              const lead: Partial<Lead> = {};
              
              headers.forEach((header, colIndex) => {
                const value = rowArray[colIndex];
                if (value !== undefined && value !== null && value !== '') {
                  console.log(`Processing row ${index + 1}, header: "${header}", value: "${value}"`);
                  
                  // Special debug for discom headers
                  if (header && header.toLowerCase().includes('discom')) {
                    console.log('=== DISCOM HEADER DEBUG ===');
                    console.log('Header:', header);
                    console.log('Value:', value);
                    console.log('Value type:', typeof value);
                    console.log('Value length:', value ? value.toString().length : 'undefined');
                    console.log('=== END DISCOM HEADER DEBUG ===');
                  }
                  
                  // Special debug for follow-up date headers
                  if (header && (header.toLowerCase().includes('follow') || header.toLowerCase().includes('next'))) {
                    console.log('=== FOLLOW-UP DATE HEADER DEBUG ===');
                    console.log('Header:', header);
                    console.log('Value:', value);
                    console.log('Value type:', typeof value);
                    console.log('Value length:', value ? value.toString().length : 'undefined');
                    console.log('=== END FOLLOW-UP DATE HEADER DEBUG ===');
                  }
                  
                  // Special debug for last activity date headers
                  if (header && (header.toLowerCase().includes('activity') || header.toLowerCase().includes('last'))) {
                    console.log('=== LAST ACTIVITY DATE HEADER DEBUG ===');
                    console.log('Header:', header);
                    console.log('Value:', value);
                    console.log('Value type:', typeof value);
                    console.log('Value length:', value ? value.toString().length : 'undefined');
                    console.log('=== END LAST ACTIVITY DATE HEADER DEBUG ===');
                  }
                  
                  mapHeaderToField(lead, header, value);
                }
              });

              // Set default values for required fields
              setDefaultValues(lead);
              console.log('Processed lead:', lead);
              return lead;
            });

            console.log('All leads processed:', leads);
            resolve(leads);
    } catch (error) {
            console.error('Excel parsing error:', error);
            reject(new Error(`Error parsing Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`));
          }
        };

        reader.onerror = () => {
          console.error('FileReader error');
          reject(new Error('Failed to read file'));
        };
        
        console.log('Starting file read...');
        reader.readAsArrayBuffer(file);
      });
    } catch (error) {
      console.error('Failed to load XLSX library:', error);
      throw new Error('Failed to load Excel parsing library');
    }
  };

  // Handle Excel/CSV import
  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('=== EXCEL IMPORT STARTED ===');
    const file = event.target.files?.[0];
    if (!file) {
      console.log('No file selected');
      return;
    }

    console.log('File selected:', file.name, file.type, file.size);

    try {
      let leads: Partial<Lead>[] = [];
      
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        console.log('Processing CSV file...');
        const content = await file.text();
        leads = parseCSV(content);
      } else {
        console.log('Processing Excel file...');
        leads = await parseExcel(file);
      }

      console.log('Parsed leads:', leads);

      // Filter out leads without client names
      const validLeads = leads.filter(lead => lead.clientName && lead.clientName.trim() !== '');
      console.log('Valid leads (with client names):', validLeads);

      if (validLeads.length > 0) {
        // Add unique IDs to leads
        const leadsWithIds = validLeads.map((lead, index) => ({
          ...lead,
          id: `imported-${Date.now()}-${index}`,
        })) as Lead[];

        console.log('Leads with IDs:', leadsWithIds);

        // Add leads to the system
        setLeads(prev => [...prev, ...leadsWithIds]);
        
        // Show success notification
        setShowToast(true);
        setToastMessage(`Successfully imported ${validLeads.length} leads from ${file.name}`);
        setToastType('success');
        
        // Auto-hide toast after 5 seconds
        setTimeout(() => {
          setShowToast(false);
        }, 5000);
      } else {
        setShowToast(true);
        setToastMessage(`No valid leads found in ${file.name}`);
        setToastType('error');
        
        // Auto-hide toast after 5 seconds
        setTimeout(() => {
          setShowToast(false);
        }, 5000);
      }
      
      // Clear the file input
      event.target.value = '';
    } catch (error) {
      console.error('=== IMPORT ERROR ===');
      console.error('Import error:', error);
      
      // Show error notification
      setShowToast(true);
      setToastMessage(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setToastType('error');
      
      // Auto-hide toast after 5 seconds
      setTimeout(() => {
        setShowToast(false);
      }, 5000);
    }
  };

  // Export function (copied from dashboard)
  const handleExportExcel = async () => {
    try {
      // Dynamic import to avoid turbopack issues
      const XLSX = await import('xlsx');
      
      // Get filtered leads
      const leadsToExport = allLeads;
      
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
      XLSX.writeFile(wb, `leads-export-all-${new Date().toISOString().split('T')[0]}.xlsx`);
      
      // Show success notification
      setShowToast(true);
      setToastMessage(`Successfully exported ${leadsToExport.length} leads to Excel format`);
      setToastType('success');
      
      // Auto-hide toast after 5 seconds
      setTimeout(() => {
        setShowToast(false);
      }, 5000);
    } catch (error) {
      console.error('Export error:', error);
      setShowToast(true);
      setToastMessage('Failed to export leads. Please try again.');
      setToastType('error');
      
      // Auto-hide toast after 5 seconds
      setTimeout(() => {
        setShowToast(false);
      }, 5000);
    }
  };


  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-800 rounded-lg mb-8 p-8">
        {/* Title Section */}
        <div className="text-center mb-6">
          <h1 
            className="text-4xl md:text-5xl font-bold text-white cursor-pointer select-none mb-2"
            onClick={handleSecretClick}
            title="Click 5 times quickly to access password change"
          >
            All Leads
          </h1>
          <p className="text-blue-100 text-sm font-medium">
            🚷 This page is strictly reserved for Admins Anil Patel & Jitendra Patel - unauthorized access will be monitored.
          </p>
        </div>
        
        {/* Stats and Action Buttons */}
        <div className="flex flex-col lg:flex-row items-center justify-between space-y-2 lg:space-y-0 lg:space-x-4">
          {/* Total Leads Stat Box - Enhanced */}
          <div className="relative group">
            {/* Animated Border Glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-500 rounded-2xl blur-sm opacity-0 group-hover:opacity-25 transition-all duration-600 animate-pulse"></div>
            
            {/* Main Container */}
            <div className="relative bg-white border-2 border-blue-200 rounded-2xl px-8 py-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-blue-300 overflow-hidden">
              {/* Animated Background Waves */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-50/40 via-emerald-50/20 to-purple-50/40 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              {/* Floating Dots */}
              <div className="absolute top-4 right-4 w-1 h-1 bg-emerald-400 rounded-full opacity-0 group-hover:opacity-70 animate-bounce animation-delay-1000"></div>
              <div className="absolute bottom-4 left-4 w-1 h-1 bg-blue-400 rounded-full opacity-0 group-hover:opacity-70 animate-bounce animation-delay-2000"></div>
              <div className="absolute top-1/2 right-6 w-0.5 h-0.5 bg-purple-400 rounded-full opacity-0 group-hover:opacity-70 animate-bounce animation-delay-3000"></div>
              
              {/* Content */}
              <div className="relative z-10 text-center">
                <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-1 group-hover:text-blue-700 transition-colors duration-300 group-hover:scale-105 transform transition-transform duration-300">
                  {allLeads.length}
                </div>
                <div className="text-black text-sm font-semibold uppercase tracking-wide group-hover:text-black transition-colors duration-300">
                  Total Leads
                </div>
              </div>
              
              {/* Top and Bottom Accent Lines */}
              <div className="absolute top-0 left-1/2 right-1/2 h-0.5 bg-gradient-to-r from-emerald-400 to-blue-500 transform -translate-x-1/2 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-center"></div>
              <div className="absolute bottom-0 left-1/2 right-1/2 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transform -translate-x-1/2 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-center"></div>
              
              {/* Side Accent Lines */}
              <div className="absolute top-1/2 left-0 w-0.5 h-8 bg-gradient-to-b from-emerald-400 to-blue-500 transform -translate-y-1/2 scale-y-0 group-hover:scale-y-100 transition-transform duration-500 origin-center"></div>
              <div className="absolute top-1/2 right-0 w-0.5 h-8 bg-gradient-to-b from-blue-500 to-purple-500 transform -translate-y-1/2 scale-y-0 group-hover:scale-y-100 transition-transform duration-500 origin-center"></div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center items-center space-x-2">
            {/* Import Button */}
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.xlsm,.csv"
                onChange={handleFileImport}
                className="hidden"
                id="file-import"
              />
              <label
                htmlFor="file-import"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl cursor-pointer flex items-center space-x-2 font-semibold transition-colors shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                <span>Import Leads</span>
              </label>
            </div>
            
            {/* Export Button */}
            <button
              onClick={handleExportExcel}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center space-x-2 font-semibold transition-colors shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Export All Leads</span>
            </button>
            
          </div>
        </div>
      </div>



      {/* Leads Table */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="p-3">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-semibold text-black">All Leads</h2>
              
              {/* Search Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  id="search"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search leads..."
                  className="block w-48 pl-8 pr-3 py-1 border border-gray-300 rounded-md leading-5 bg-white placeholder-black focus:outline-none focus:placeholder-black focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-black"
                    title="Clear search"
                  >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleSelectAll}
                className="px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                {selectedLeads.size === allLeads.length ? 'Deselect All' : 'Select All'}
              </button>
              {selectedLeads.size > 0 && (
                <>
                  <button
                    onClick={handleBulkDeleteClick}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Delete Selected ({selectedLeads.size})
                  </button>
                  {hasDeletedLeads && (
                    <button
                      onClick={handleBulkRestoreClick}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Restore Selected ({selectedLeads.size})
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
          <LeadTable
            leads={allLeads}
            onLeadClick={handleLeadClick}
            selectedLeads={selectedLeads}
            onLeadSelection={handleSelectLead}
            showActions={false}
            emptyMessage="No leads found in the system"
          />
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && selectedLead && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-5 mx-auto p-3 border w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-black">Lead Details</h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-black transition-colors"
                  title="Close modal"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Content */}
              <div className="space-y-2">
                {/* Main Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {/* Basic Info */}
                  <div className="bg-gray-50 p-2 rounded-md">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-medium text-black">Client Name</label>
                      <button
                        onClick={() => copyToClipboard(selectedLead.clientName, 'clientName')}
                        className="text-gray-400 hover:text-black transition-colors"
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
                    <p className="text-sm font-medium text-black">{selectedLead.clientName}</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-md">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-medium text-black">Company</label>
                      <button
                        onClick={() => copyToClipboard(selectedLead.company, 'company')}
                        className="text-gray-400 hover:text-black transition-colors"
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
                    <p className="text-sm font-medium text-black">{selectedLead.company}</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-md">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-medium text-black">Consumer Number</label>
                      <button
                        onClick={() => copyToClipboard(selectedLead.consumerNumber || 'N/A', 'consumerNumber')}
                        className="text-gray-400 hover:text-black transition-colors"
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
                    <p className="text-sm font-medium text-black">{selectedLead.consumerNumber || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-md">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-medium text-black">KVA</label>
                      <button
                        onClick={() => copyToClipboard(selectedLead.kva, 'kva')}
                        className="text-gray-400 hover:text-black transition-colors"
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
                    <p className="text-sm font-medium text-black">{selectedLead.kva}</p>
                  </div>
                  
                  {/* Contact Info */}
                  <div className="bg-gray-50 p-2 rounded-md">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-medium text-black">Main Phone</label>
                      <button
                        onClick={() => {
                          const phoneNumber = selectedLead.mobileNumbers && selectedLead.mobileNumbers.length > 0 
                            ? selectedLead.mobileNumbers.find(m => m.isMain)?.number || selectedLead.mobileNumbers[0]?.number || 'N/A'
                            : selectedLead.mobileNumber || 'N/A';
                          copyToClipboard(phoneNumber, 'mainPhone');
                        }}
                        className="text-gray-400 hover:text-black transition-colors"
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
                    <p className="text-sm font-medium text-black">
                      {(() => {
                        const phoneNumber = selectedLead.mobileNumbers && selectedLead.mobileNumbers.length > 0 
                          ? selectedLead.mobileNumbers.find(m => m.isMain)?.number || selectedLead.mobileNumbers[0]?.number || 'N/A'
                          : selectedLead.mobileNumber || 'N/A';
                        return phoneNumber;
                      })()}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-md">
                    <label className="block text-xs font-medium text-black mb-1">Status</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedLead.status === 'New' ? 'bg-blue-100 text-blue-800' :
                      selectedLead.status === 'CNR' ? 'bg-purple-100 text-purple-800' :
                      selectedLead.status === 'Busy' ? 'bg-yellow-100 text-yellow-800' :
                      selectedLead.status === 'Follow-up' ? 'bg-orange-100 text-orange-800' :
                      selectedLead.status === 'Deal Close' ? 'bg-green-100 text-green-800' :
                      selectedLead.status === 'Work Alloted' ? 'bg-indigo-100 text-indigo-800' :
                      selectedLead.status === 'Hotlead' ? 'bg-red-100 text-red-800' :
                      selectedLead.status === 'Mandate Sent' ? 'bg-emerald-100 text-emerald-800' :
                      selectedLead.status === 'Documentation' ? 'bg-teal-100 text-teal-800' :
                      'bg-gray-100 text-black'
                    }`}>
                      {selectedLead.status}
                    </span>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-md">
                    <label className="block text-xs font-medium text-black mb-1">Unit Type</label>
                    <p className="text-sm font-medium text-black">{selectedLead.unitType}</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-md">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-medium text-black">Discom</label>
                      <button
                        onClick={() => copyToClipboard(selectedLead.discom || 'N/A', 'discom')}
                        className="text-gray-400 hover:text-black transition-colors"
                        title="Copy discom"
                      >
                        {copiedField === 'discom' ? (
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
                    <p className="text-sm font-medium text-black">{selectedLead.discom || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-md">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-medium text-black">GIDC</label>
                      <button
                        onClick={() => copyToClipboard(selectedLead.gidc || 'N/A', 'gidc')}
                        className="text-gray-400 hover:text-black transition-colors"
                        title="Copy gidc"
                      >
                        {copiedField === 'gidc' ? (
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
                    <p className="text-sm font-medium text-black">{selectedLead.gidc || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-md">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-medium text-black">GST Number</label>
                      <button
                        onClick={() => copyToClipboard(selectedLead.gstNumber || 'N/A', 'gstNumber')}
                        className="text-gray-400 hover:text-black transition-colors"
                        title="Copy gst number"
                      >
                        {copiedField === 'gstNumber' ? (
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
                    <p className="text-sm font-medium text-black">{selectedLead.gstNumber || 'N/A'}</p>
                  </div>
                  
                  {/* Dates */}
                  <div className="bg-gray-50 p-2 rounded-md">
                    <label className="block text-xs font-medium text-black mb-1">Connection Date</label>
                    <p className="text-sm font-medium text-black">{formatDateToDDMMYYYY(selectedLead.connectionDate)}</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-md">
                    <label className="block text-xs font-medium text-black mb-1">Follow-up Date</label>
                    <p className="text-sm font-medium text-black">
                      {selectedLead.followUpDate ? formatDateToDDMMYYYY(selectedLead.followUpDate) : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-md">
                    <label className="block text-xs font-medium text-black mb-1">Last Activity</label>
                    <p className="text-sm font-medium text-black">{formatDateToDDMMYYYY(selectedLead.lastActivityDate)}</p>
                  </div>
                  
                </div>

                {/* Additional Numbers */}
                {selectedLead.mobileNumbers && selectedLead.mobileNumbers.filter(m => !m.isMain && m.number.trim()).length > 0 && (
                  <div className="bg-gray-50 p-2 rounded-md">
                    <label className="block text-xs font-medium text-black mb-2">Additional Numbers</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedLead.mobileNumbers.filter(m => !m.isMain && m.number.trim()).map((mobile, index) => (
                        <span key={index} className="text-sm font-medium text-black bg-white px-2 py-1 rounded border">
                          {mobile.name ? `${mobile.name}: ${mobile.number}` : mobile.number}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes and Additional Info */}
                {(selectedLead.companyLocation || selectedLead.notes || selectedLead.finalConclusion) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedLead.companyLocation && (
                      <div className="bg-gray-50 p-2 rounded-md">
                        <label className="block text-xs font-medium text-black mb-1">Company Location</label>
                        <p className="text-sm font-medium text-black">{selectedLead.companyLocation}</p>
                      </div>
                    )}
                    {selectedLead.notes && (
                      <div className="bg-gray-50 p-2 rounded-md">
                        <label className="block text-xs font-medium text-black mb-1">Last Discussion</label>
                        <p className="text-sm font-medium text-black line-clamp-3">{selectedLead.notes}</p>
                      </div>
                    )}
                    {selectedLead.finalConclusion && (
                      <div className="bg-gray-50 p-2 rounded-md">
                        <label className="block text-xs font-medium text-black mb-1">Final Conclusion</label>
                        <p className="text-sm font-medium text-black line-clamp-3">{selectedLead.finalConclusion}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Recent Activities - Compact */}
                {selectedLead.activities && selectedLead.activities.length > 0 && (
                  <div className="bg-gray-50 p-2 rounded-md">
                    <label className="block text-xs font-medium text-black mb-2">Recent Activities</label>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {selectedLead.activities.slice(-3).map((activity) => (
                        <div key={activity.id} className="bg-white p-2 rounded text-xs">
                          <p className="text-black font-medium">{activity.description}</p>
                          <p className="text-black">
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
                    className="px-4 py-2 text-sm font-medium text-black bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors flex items-center space-x-2"
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
                    onClick={closeModal}
                    className="px-4 py-2 text-sm font-medium text-black bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                  >
                    Close
                  </button>
                  {!selectedLead.isDeleted && (
                    <button
                      onClick={() => {
                        // Store the lead data in localStorage for the edit form
                        localStorage.setItem('editingLead', JSON.stringify(selectedLead));
                        closeModal();
                        router.push(`/add-lead?mode=edit&id=${selectedLead.id}&from=all-leads`);
                      }}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      Edit Lead
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Protection Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-3 border w-80 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-black">Delete Lead Protection</h3>
                <button
                  onClick={handlePasswordCancel}
                  className="text-gray-400 hover:text-black transition-colors"
                  title="Close modal"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Content */}
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        {leadToDelete?.isDeleted ? 'Warning: Permanent Deletion' : 'Warning: Delete Lead'}
                      </h3>
                      <div className="mt-2 text-sm text-red-700">
                        {leadToDelete?.isDeleted ? (
                          <>
                            <p>You are about to permanently delete this lead from the system:</p>
                            <p className="font-semibold mt-1">{leadToDelete?.clientName} - {leadToDelete?.company}</p>
                            <p className="mt-1">This will completely remove the lead from all records. This action cannot be undone.</p>
                          </>
                        ) : (
                          <>
                            <p>You are about to delete this lead:</p>
                            <p className="font-semibold mt-1">{leadToDelete?.clientName} - {leadToDelete?.company}</p>
                            <p className="mt-1">The lead will be marked as deleted and moved to the &quot;All Leads&quot; page. This action cannot be undone.</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-black mb-2">
                    Enter Admin Password to Continue
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                    placeholder="Enter password..."
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-black text-black focus:outline-none focus:ring-red-500 focus:border-red-500"
                    autoFocus
                  />
                  {passwordError && (
                    <p className="mt-2 text-sm text-red-600">{passwordError}</p>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                <button
                  onClick={handlePasswordCancel}
                  className="px-4 py-2 text-sm font-medium text-black bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordSubmit}
                  disabled={!password.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {leadToDelete?.isDeleted ? 'Permanently Delete' : 'Delete Lead'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordChangeModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-3 border w-80 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-black">Change Delete Password</h3>
                <button
                  onClick={handlePasswordChangeCancel}
                  className="text-gray-400 hover:text-black transition-colors"
                  title="Close modal"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Content */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-black mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password..."
                    autoComplete="off"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-black text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-black mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password..."
                    autoComplete="new-password"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-black text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-black mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password..."
                    autoComplete="new-password"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-black text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {passwordChangeError && (
                  <p className="text-sm text-red-600">{passwordChangeError}</p>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                <button
                  onClick={handlePasswordChangeCancel}
                  className="px-4 py-2 text-sm font-medium text-black bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordChangeSubmit}
                  disabled={!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Change Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-3 border w-80 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-black">Bulk Delete Protection</h3>
                <button
                  onClick={handleBulkDeleteCancel}
                  className="text-gray-400 hover:text-black transition-colors"
                  title="Close modal"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Content */}
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        {hasDeletedLeads ? 'Warning: Mixed Bulk Deletion' : 'Warning: Bulk Deletion'}
                      </h3>
                      <div className="mt-2 text-sm text-red-700">
                        {hasDeletedLeads ? (
                          <>
                            <p>You are about to delete {selectedLeads.size} leads:</p>
                            <p className="mt-1">• Some leads will be marked as deleted and moved to &quot;All Leads&quot;</p>
                            <p className="mt-1">• Some leads will be permanently removed from the system</p>
                            <p className="mt-1">This action cannot be undone.</p>
                          </>
                        ) : (
                          <>
                            <p>You are about to delete {selectedLeads.size} leads.</p>
                            <p className="mt-1">The leads will be marked as deleted and moved to the &quot;All Leads&quot; page.</p>
                            <p className="mt-1">This action cannot be undone.</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="bulkDeletePassword" className="block text-sm font-medium text-black mb-2">
                    Enter Admin Password to Continue
                  </label>
                  <input
                    type="password"
                    id="bulkDeletePassword"
                    value={bulkDeletePassword}
                    onChange={(e) => setBulkDeletePassword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleBulkDeleteSubmit()}
                    placeholder="Enter password..."
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-black text-black focus:outline-none focus:ring-red-500 focus:border-red-500"
                    autoFocus
                  />
                  {bulkDeleteError && (
                    <p className="mt-2 text-sm text-red-600">{bulkDeleteError}</p>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                <button
                  onClick={handleBulkDeleteCancel}
                  className="px-4 py-2 text-sm font-medium text-black bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkDeleteSubmit}
                  disabled={!bulkDeletePassword.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {hasDeletedLeads ? `Process ${selectedLeads.size} Leads` : `Delete ${selectedLeads.size} Leads`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden ${
            toastType === 'success' ? 'border-l-4 border-green-400' :
            toastType === 'error' ? 'border-l-4 border-red-400' :
            'border-l-4 border-blue-400'
          }`}>
            <div className="p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {toastType === 'success' ? (
                    <svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : toastType === 'error' ? (
                    <svg className="h-6 w-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  ) : (
                    <svg className="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <div className="ml-3 w-0 flex-1 pt-0.5">
                  <p className={`text-sm font-medium ${
                    toastType === 'success' ? 'text-green-800' :
                    toastType === 'error' ? 'text-red-800' :
                    'text-blue-800'
                  }`}>
                    {toastMessage}
                  </p>
                </div>
                <div className="ml-4 flex-shrink-0 flex">
                  <button
                    onClick={() => setShowToast(false)}
                    className={`bg-white rounded-md inline-flex ${
                      toastType === 'success' ? 'text-green-400 hover:text-green-500' :
                      toastType === 'error' ? 'text-red-400 hover:text-red-500' :
                      'text-blue-400 hover:text-blue-500'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
