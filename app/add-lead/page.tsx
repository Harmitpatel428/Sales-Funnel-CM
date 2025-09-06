'use client';

import React, { useState, FormEvent, ChangeEvent, useEffect } from 'react';
import { useLeads, Lead, MobileNumber } from '../context/LeadContext';
import { useRouter } from 'next/navigation';

export default function AddLeadPage() {
  const router = useRouter();
  const { addLead, updateLead, leads } = useLeads();
  
  // Track where the user came from
  const [cameFromHome, setCameFromHome] = useState(false);
  const [sourcePage, setSourcePage] = useState<string>('');
  
  const [formData, setFormData] = useState({
    kva: '',
    connectionDate: '',
    consumerNumber: '',
    company: '',
    clientName: '',
    discom: '',
    gidc: '',
    gstNumber: '',
    mobileNumber: '', // Keep for backward compatibility
    mobileNumbers: [
      { id: '1', number: '', name: '', isMain: true },
      { id: '2', number: '', name: '', isMain: false },
      { id: '3', number: '', name: '', isMain: false }
    ] as MobileNumber[],
    companyLocation: '',
    unitType: 'New' as Lead['unitType'],
    status: 'New' as Lead['status'],
    lastActivityDate: '', // Will be auto-set to current date on submission
    followUpDate: '',
    finalConclusion: '',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<Partial<Record<keyof typeof formData, string>>>({});
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Extract address from notes helper function
  const extractAddressFromNotes = (notes: string) => {
    if (!notes || !notes.includes('Address:')) {
      return { address: '', cleanNotes: notes };
    }
    
    // More comprehensive regex to catch different address formats
    const addressMatch = notes.match(/Address:\s*(.+?)(?:\s*\||\s*$)/i);
    if (addressMatch && addressMatch[1]) {
      const address = addressMatch[1].trim();
      // Remove the entire address line including "Address:" prefix
      let cleanNotes = notes.replace(/Address:\s*.+?(?:\s*\||\s*$)/i, '').trim();
      // Remove any trailing pipes or extra whitespace
      cleanNotes = cleanNotes.replace(/\|\s*$/, '').replace(/\s+$/, '').trim();
      return { address, cleanNotes };
    }
    
    return { address: '', cleanNotes: notes };
  };





  // Check if we're in edit mode and load lead data
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const mode = searchParams.get('mode');
    const from = searchParams.get('from');
    
    // Check if user came from home page
    if (from === 'home') {
      setCameFromHome(true);
    }
    
    // Store source page for navigation back
    if (from) {
      setSourcePage(from);
    }
    
    if (mode === 'edit') {
      const storedLead = localStorage.getItem('editingLead');
      if (storedLead) {
        try {
          const leadData = JSON.parse(storedLead);
          setIsEditMode(true);
          setEditingLeadId(leadData.id);
          // Extract address from notes if it exists
          const { address, cleanNotes } = extractAddressFromNotes(leadData.notes || '');
          
          // Handle mobile numbers - convert old format to new format if needed
          let mobileNumbers: MobileNumber[] = [
            { id: '1', number: '', name: '', isMain: true },
            { id: '2', number: '', name: '', isMain: false },
            { id: '3', number: '', name: '', isMain: false }
          ];
          
          if (leadData.mobileNumbers && Array.isArray(leadData.mobileNumbers)) {
            // New format - use existing mobile numbers but ensure we have 3 slots
            leadData.mobileNumbers.forEach((mobile: { id?: string; number?: string; name?: string; isMain?: boolean }, index: number) => {
              if (index < 3) { // Only process first 3 mobile numbers
                mobileNumbers[index] = {
                  id: mobile.id || String(index + 1),
                  number: mobile.number || '',
                  name: mobile.name || '',
                  isMain: mobile.isMain || false
                };
              }
            });
          } else if (leadData.mobileNumber) {
            // Old format - convert to new format
            mobileNumbers[0] = { id: '1', number: leadData.mobileNumber, name: '', isMain: true };
          }
          
          console.log('Mobile numbers being set:', mobileNumbers); // Debug log
          setFormData({
            kva: leadData.kva || '',
            connectionDate: leadData.connectionDate || '',
            consumerNumber: leadData.consumerNumber || '',
            company: leadData.company || '',
            clientName: leadData.clientName || '',
            discom: leadData.discom || '',
            gidc: leadData.gidc || '',
            gstNumber: leadData.gstNumber || '',
            mobileNumber: leadData.mobileNumber || '', // Keep for backward compatibility
            mobileNumbers: mobileNumbers,
            companyLocation: leadData.companyLocation || address, // Use existing or extracted address
            unitType: leadData.unitType || 'New',
            status: leadData.status || 'New',
            lastActivityDate: leadData.lastActivityDate || '', // Keep existing or blank
            followUpDate: leadData.followUpDate || '',
            finalConclusion: leadData.finalConclusion || '',
            notes: cleanNotes || '', // Use clean notes without address
          });
        } catch (error) {
          console.error('Error parsing stored lead data:', error);
        }
      }
    }
    
    setIsHydrated(true);
  }, []);

  // Auto-detect client name when leads are loaded and first mobile number is complete
  useEffect(() => {
    if (leads.length > 0 && formData.mobileNumbers[0]?.number?.length === 10 && !formData.clientName.trim()) {
      console.log('🔄 useEffect: Attempting auto-detection for mobile:', formData.mobileNumbers[0].number);
      
      const existingLead = leads.find(lead => {
        // Check main mobile number (backward compatibility)
        if (lead.mobileNumber && lead.mobileNumber.trim() === formData.mobileNumbers[0]?.number) {
          console.log('✅ useEffect: Found match in main mobile number:', lead.clientName);
          return true;
        }
        
        // Check mobile numbers array
        if (lead.mobileNumbers && Array.isArray(lead.mobileNumbers)) {
          const hasMatch = lead.mobileNumbers.some(m => 
            m.number && m.number.trim() === formData.mobileNumbers[0]?.number
          );
          if (hasMatch) {
            console.log('✅ useEffect: Found match in mobile numbers array:', lead.clientName);
            return true;
          }
        }
        
        return false;
      });
      
      if (existingLead) {
        console.log('🎉 useEffect: Auto-populating client name:', existingLead.clientName);
        setFormData(prev => ({
          ...prev,
          clientName: existingLead.clientName
        }));
      } else {
        console.log('❌ useEffect: No matching lead found for mobile:', formData.mobileNumbers[0].number);
      }
    }
  }, [leads, formData.mobileNumbers[0]?.number, formData.clientName]);

  // Generate UUID function
  const generateId = (): string => {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
      return window.crypto.randomUUID();
    }
    // Fallback UUID generation
    return 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  };

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof typeof formData, string>> = {};

    // Required field validations
    if (!formData.kva.trim()) {
      newErrors.kva = 'KVA is required';
    }

    if (!formData.consumerNumber.trim()) {
      newErrors.consumerNumber = 'Consumer number is required';
    } else if (!/^[\d\s\-\+\(\)]+$/.test(formData.consumerNumber.trim())) {
      newErrors.consumerNumber = 'Please enter a valid consumer number';
    }

    if (!formData.company.trim()) {
      newErrors.company = 'Company name is required';
    }

    if (!formData.clientName.trim()) {
      newErrors.clientName = 'Client name is required';
    }

    // Mobile numbers are now optional - no validation error if none provided
    
    // Validate individual mobile numbers
    formData.mobileNumbers.forEach((mobile, index) => {
      if (mobile.number.trim() && !/^[\d\s\-\+\(\)]+$/.test(mobile.number.trim())) {
        newErrors[`mobileNumber_${index}` as keyof typeof formData] = 'Please enter a valid mobile number';
      }
    });

    // Connection date validation (if provided) - now accepts DD-MM-YYYY format
    if (formData.connectionDate && !/^\d{2}-\d{2}-\d{4}$/.test(formData.connectionDate)) {
      newErrors.connectionDate = 'Please enter a valid connection date (DD-MM-YYYY)';
    }

    // Date validation for DD-MM-YYYY format
    if (formData.followUpDate && formData.followUpDate.trim() !== '') {
      // Validate DD-MM-YYYY format
      if (!/^\d{2}-\d{2}-\d{4}$/.test(formData.followUpDate)) {
        newErrors.followUpDate = 'Please enter a valid follow-up date (DD-MM-YYYY)';
      } else {
        // Check if date is in the past
        try {
          const dateParts = formData.followUpDate.split('-');
          if (dateParts.length === 3 && dateParts[0] && dateParts[1] && dateParts[2]) {
            const day = dateParts[0];
            const month = dateParts[1];
            const year = dateParts[2];
            const followUpDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (followUpDate < today) {
              newErrors.followUpDate = 'Follow-up date cannot be in the past';
            }
          }
        } catch {
          newErrors.followUpDate = 'Please enter a valid follow-up date (DD-MM-YYYY)';
        }
      }
    }

    // Required fields for specific statuses
    const statusesRequiringFollowUp = ['Follow-up', 'Hotlead', 'Mandate Sent', 'Documentation'];
    if (statusesRequiringFollowUp.includes(formData.status)) {
      if (!formData.followUpDate.trim()) {
        newErrors.followUpDate = 'Next follow-up date is required for this status';
      }
      if (!formData.notes.trim()) {
        newErrors.notes = 'Last discussion is required for this status';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle mobile number changes - only allow numeric input with max 10 digits
  const handleMobileNumberChange = (index: number, value: string) => {
    // Only allow numeric characters (0-9) and limit to 10 digits
    const numericValue = value.replace(/[^0-9]/g, '').slice(0, 10);
    
    console.log('🔍 Mobile number change:', { index, value, numericValue, leadsCount: leads.length });
    
    setFormData(prev => {
      let updatedMobileNumbers = prev.mobileNumbers.map((mobile, i) => 
        i === index ? { ...mobile, number: numericValue } : mobile
      );

      // Auto-detect client name from first mobile number if it's complete (10 digits)
      let updatedClientName = prev.clientName;
      
      if (index === 0 && numericValue.length === 10 && !prev.clientName.trim()) {
        console.log('🎯 Auto-detection triggered for mobile:', numericValue);
        console.log('📊 Available leads:', leads.length);
        
        // Try to find existing lead with this mobile number
        const existingLead = leads.find(lead => {
          // Check main mobile number (backward compatibility)
          if (lead.mobileNumber && lead.mobileNumber.trim() === numericValue) {
            console.log('✅ Found match in main mobile number:', lead.clientName);
            return true;
          }
          
          // Check mobile numbers array
          if (lead.mobileNumbers && Array.isArray(lead.mobileNumbers)) {
            const hasMatch = lead.mobileNumbers.some(m => 
              m.number && m.number.trim() === numericValue
            );
            if (hasMatch) {
              console.log('✅ Found match in mobile numbers array:', lead.clientName);
              return true;
            }
          }
          
          return false;
        });
        
        if (existingLead) {
          console.log('🎉 Auto-populating client name:', existingLead.clientName);
          updatedClientName = existingLead.clientName;
          
          // Also auto-populate the first mobile number's name if it's empty
          if (updatedMobileNumbers[0] && !updatedMobileNumbers[0].name.trim()) {
            updatedMobileNumbers = updatedMobileNumbers.map((mobile, i) => 
              i === 0 ? { ...mobile, name: existingLead.clientName } : mobile
            );
          }
        } else {
          console.log('❌ No matching lead found for mobile:', numericValue);
        }
      }

      return {
        ...prev,
        mobileNumbers: updatedMobileNumbers,
        clientName: updatedClientName
      };
    });

    // Clear error for this field
    const errorKey = `mobileNumber_${index}` as keyof typeof formData;
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  // Handle mobile number name changes
  const handleMobileNameChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      mobileNumbers: prev.mobileNumbers.map((mobile, i) => 
        i === index ? { ...mobile, name: value } : mobile
      )
    }));
  };



  // Handle main mobile number selection
  const handleMainMobileNumberChange = (index: number) => {
    setFormData(prev => ({
      ...prev,
      mobileNumbers: prev.mobileNumbers.map((mobile, i) => ({
        ...mobile,
        isMain: i === index
      }))
    }));
  };

  // Handle connection date changes with auto-formatting
  const handleConnectionDateChange = (e: ChangeEvent<HTMLInputElement>): void => {
    let value = e.target.value;
    
    // Allow user to delete dashes, but auto-add them back
    // Remove all non-numeric characters first
    const numericValue = value.replace(/[^0-9]/g, '');
    
    // Auto-format with dashes based on numeric length
    let formattedValue = '';
    if (numericValue.length >= 1) {
      formattedValue = numericValue.slice(0, 2);
      if (numericValue.length >= 3) {
        formattedValue += '-' + numericValue.slice(2, 4);
        if (numericValue.length >= 5) {
          formattedValue += '-' + numericValue.slice(4, 8);
        }
      }
    }
    
    setFormData(prev => ({
      ...prev,
      connectionDate: formattedValue
    }));

    // Clear error for this field
    if (errors.connectionDate) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.connectionDate;
        return newErrors;
      });
    }
  };


  // Handle input changes
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ): void => {
    const { name, value } = e.target;
    
    // If notes are being changed, automatically extract address
    if (name === 'notes') {
      const { address, cleanNotes } = extractAddressFromNotes(value);
      
      // Auto-capitalize the first letter of the notes
      const capitalizedNotes = cleanNotes.charAt(0).toUpperCase() + cleanNotes.slice(1);
      
      setFormData(prev => ({
        ...prev,
        [name]: capitalizedNotes, // Use capitalized clean notes without address
        companyLocation: address || prev.companyLocation // Set address if found, otherwise keep existing
      }));
    } else {
      setFormData(prev => {
        const updatedFormData = {
          ...prev,
          [name]: value
        };

        // Auto-populate first mobile number's name when client name is entered
        if (name === 'clientName' && value.trim() && prev.mobileNumbers && prev.mobileNumbers[0] && !prev.mobileNumbers[0].name.trim()) {
          updatedFormData.mobileNumbers = prev.mobileNumbers.map((mobile, index) => 
            index === 0 ? { ...mobile, name: value.trim() } : mobile
          );
        }

        return updatedFormData;
      });
    }

    // Clear error for this field
    if (errors[name as keyof typeof formData]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name as keyof typeof formData];
        return newErrors;
      });
    }
  };

  // Handle suggestion insertion for notes
  const handleSuggestionClick = (suggestion: string) => {
    // Auto-capitalize the first letter of the suggestion
    const capitalizedSuggestion = suggestion.charAt(0).toUpperCase() + suggestion.slice(1);
    
    setFormData(prev => ({
      ...prev,
      notes: capitalizedSuggestion
    }));

    // Clear error for notes field
    if (errors.notes) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.notes;
        return newErrors;
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Always set Last Activity Date to current date on form submission
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const currentDate = day + '-' + month + '-' + year;
      
      if (isEditMode && editingLeadId) {
        // Get main mobile number for backward compatibility
        const mainMobileNumber = formData.mobileNumbers.find(mobile => mobile.isMain)?.number || formData.mobileNumbers[0]?.number || '';
        
        // Update existing lead
        const updatedLead: Lead = {
          id: editingLeadId,
          kva: formData.kva,
          connectionDate: formData.connectionDate,
          consumerNumber: formData.consumerNumber,
          company: formData.company,
          clientName: formData.clientName,
          discom: formData.discom,
          gidc: formData.gidc,
          gstNumber: formData.gstNumber,
          mobileNumber: mainMobileNumber, // Keep for backward compatibility
          mobileNumbers: formData.mobileNumbers,
          companyLocation: formData.companyLocation,
          unitType: formData.unitType,
          status: formData.status,
          lastActivityDate: currentDate, // Always update to current date
          followUpDate: formData.followUpDate,
          finalConclusion: formData.finalConclusion,
          notes: formData.notes,
          isDone: false,
          isDeleted: false,
          isUpdated: false,
          mandateStatus: 'Pending',
          documentStatus: formData.status === 'Mandate Sent' ? 'Signed Mandate' : 
                         formData.status === 'Documentation' ? 'Pending Documents' : 'Pending Documents',
        };
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        updateLead(updatedLead);
        
        // Clear stored editing data
        localStorage.removeItem('editingLead');
        
        // Navigate back to appropriate page
        if (cameFromHome) {
          router.push('/');
        } else if (sourcePage) {
          // Navigate back to the specific source page with proper route mapping
          const routeMap: { [key: string]: string } = {
            'documentation': '/follow-up-mandate?tab=pending',
            'mandate-sent': '/follow-up-mandate?tab=signed',
            'due-today': '/due-today',
            'upcoming': '/upcoming',
            'all-leads': '/all-leads',
            'dashboard': '/dashboard'
          };
          const targetRoute = routeMap[sourcePage] || '/dashboard';
          router.push(targetRoute);
        } else {
          // Add a flag to indicate successful update
          localStorage.setItem('leadUpdated', 'true');
          router.push('/dashboard');
        }
      } else {
        // Add new lead
        const leadId = generateId();
        
        // Auto-populate contact name ONLY for the first mobile number (index 0) if no contact name is provided
        const updatedMobileNumbers = formData.mobileNumbers.map((mobile, index) => {
          // ONLY apply to the first mobile number (index 0) - regardless of isMain status
          if (index === 0 && mobile.number && mobile.number.trim() !== '' && !mobile.name && formData.clientName) {
            return { ...mobile, name: formData.clientName };
          }
          // For all other mobile numbers (index 1, 2, etc.), keep them exactly as they are
          return mobile;
        });
        
        // Get main mobile number for backward compatibility
        const mainMobileNumber = updatedMobileNumbers.find(mobile => mobile.isMain)?.number || updatedMobileNumbers[0]?.number || '';
        
        const newLead: Lead = {
          id: leadId,
          kva: formData.kva,
          connectionDate: formData.connectionDate,
          consumerNumber: formData.consumerNumber,
          company: formData.company,
          clientName: formData.clientName,
          discom: formData.discom,
          gidc: formData.gidc,
          gstNumber: formData.gstNumber,
          mobileNumber: mainMobileNumber, // Keep for backward compatibility
          mobileNumbers: updatedMobileNumbers,
          companyLocation: formData.companyLocation,
          unitType: formData.unitType,
          status: formData.status,
          lastActivityDate: currentDate, // Always set to current date
          followUpDate: formData.followUpDate,
          finalConclusion: formData.finalConclusion,
          notes: formData.notes,
          isDone: false,
          isDeleted: false,
          isUpdated: false,
          mandateStatus: 'Pending',
          documentStatus: formData.status === 'Mandate Sent' ? 'Signed Mandate' : 
                         formData.status === 'Documentation' ? 'Pending Documents' : 'Pending Documents',
          activities: [{
            id: generateId(),
            leadId: leadId,
            description: 'Lead created',
            timestamp: new Date().toISOString()
          }]
        };
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        addLead(newLead);
        
        // Reset form after successful submission
        setFormData({
          kva: '',
          connectionDate: '',
          consumerNumber: '',
          company: '',
          clientName: '',
          discom: '',
          gidc: '',
          gstNumber: '',
          mobileNumber: '', // Keep for backward compatibility
          mobileNumbers: [
            { id: '1', number: '', name: '', isMain: true },
            { id: '2', number: '', name: '', isMain: false },
            { id: '3', number: '', name: '', isMain: false }
          ],
          companyLocation: '',
          unitType: 'New',
          status: 'New',
          lastActivityDate: '', // Will be auto-set to current date on submission
          followUpDate: '',
          finalConclusion: '',
          notes: '',
        });
        
        // Navigate back to appropriate page
        if (cameFromHome) {
          router.push('/');
        } else if (sourcePage) {
          // Navigate back to the specific source page with proper route mapping
          const routeMap: { [key: string]: string } = {
            'documentation': '/follow-up-mandate?tab=pending',
            'mandate-sent': '/follow-up-mandate?tab=signed',
            'due-today': '/due-today',
            'upcoming': '/upcoming',
            'all-leads': '/all-leads',
            'dashboard': '/dashboard'
          };
          const targetRoute = routeMap[sourcePage] || '/dashboard';
          router.push(targetRoute);
        } else {
          router.push('/dashboard');
        }
      }
      
    } catch (error) {
      console.error('Error saving lead:', error);
      alert('Error saving lead. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = (): void => {
    // Clear stored editing data if in edit mode
    if (isEditMode) {
      localStorage.removeItem('editingLead');
    }
    // Navigate back to appropriate page
    if (cameFromHome) {
      router.push('/');
    } else if (sourcePage) {
      // Navigate back to the specific source page with proper route mapping
      const routeMap: { [key: string]: string } = {
        'documentation': '/follow-up-mandate?tab=pending',
        'mandate-sent': '/follow-up-mandate?tab=signed',
        'due-today': '/due-today',
        'upcoming': '/upcoming',
        'all-leads': '/all-leads',
        'dashboard': '/dashboard'
      };
      const targetRoute = routeMap[sourcePage] || '/dashboard';
      router.push(targetRoute);
    } else {
      router.push('/dashboard');
    }
  };

  // Show loading state during hydration
  if (!isHydrated) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        </div>
      </div>
    );
  }

  // Debug log to show current form data
  console.log('Current form data mobile numbers:', formData.mobileNumbers);
  console.log('Available leads for auto-detection:', leads.length);


  // Manual trigger for auto-detection (for first mobile number only)
  const triggerAutoDetection = () => {
    console.log('🔧 Auto-Detect button clicked!');
    console.log('📱 First mobile number:', formData.mobileNumbers[0]?.number);
    console.log('📊 Available leads:', leads.length);
    
    // Check if first mobile number exists and is complete
    const firstMobileNumber = formData.mobileNumbers[0]?.number?.trim();
    
    if (!firstMobileNumber) {
      console.log('❌ No mobile number entered in first contact box');
      return;
    }
    
    if (firstMobileNumber.length !== 10) {
      console.log('❌ Mobile number is not complete (10 digits required)');
      return;
    }
    
    console.log('🔍 Searching for mobile number:', firstMobileNumber);
    
    // Search through all leads for matching mobile number
    const existingLead = leads.find(lead => {
      console.log('🔍 Checking lead:', lead.clientName, 'with mobile:', lead.mobileNumber);
      
      // Check main mobile number (backward compatibility)
      if (lead.mobileNumber && lead.mobileNumber.trim() === firstMobileNumber) {
        console.log('✅ Found match in main mobile number:', lead.clientName);
        return true;
      }
      
      // Check mobile numbers array
      if (lead.mobileNumbers && Array.isArray(lead.mobileNumbers)) {
        const hasMatch = lead.mobileNumbers.some(m => {
          console.log('🔍 Checking mobile in array:', m.number);
          return m.number && m.number.trim() === firstMobileNumber;
        });
        if (hasMatch) {
          console.log('✅ Found match in mobile numbers array:', lead.clientName);
          return true;
        }
      }
      
      return false;
    });
    
    if (existingLead) {
      console.log('🎉 Auto-populating client name:', existingLead.clientName);
      setFormData(prev => ({
        ...prev,
        clientName: existingLead.clientName
      }));
      
      // Also auto-populate the first mobile number's name if it's empty
      if (formData.mobileNumbers[0] && !formData.mobileNumbers[0].name.trim()) {
        setFormData(prev => ({
          ...prev,
          mobileNumbers: prev.mobileNumbers.map((mobile, index) => 
            index === 0 ? { ...mobile, name: existingLead.clientName } : mobile
          )
        }));
      }
      
      console.log('✅ Client name auto-detected:', existingLead.clientName);
    } else {
      console.log('❌ No matching lead found for mobile:', firstMobileNumber);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditMode ? 'Edit Lead' : 'Add New Lead'}
          </h1>
          <button
            type="button"
            onClick={handleCancel}
            className="text-gray-600 hover:text-gray-800 transition-colors duration-200"
            aria-label="Go back"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 pb-8" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="kva" className="block text-sm font-medium text-gray-700">
                KVA <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="kva"
                name="kva"
                value={formData.kva}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 text-black ${
                  errors.kva ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Enter KVA"
                disabled={isSubmitting}
              />
              {errors.kva && (
                <p className="text-sm text-red-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.kva}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <label htmlFor="connectionDate" className="block text-sm font-medium text-gray-700">
                Connection Date
              </label>
              <input
                type="text"
                id="connectionDate"
                name="connectionDate"
                value={formData.connectionDate}
                onChange={handleConnectionDateChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 text-black ${
                  errors.connectionDate ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="DD-MM-YYYY"
                disabled={isSubmitting}
                maxLength={10}
              />
              {errors.connectionDate && (
                <p className="text-sm text-red-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.connectionDate}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <label htmlFor="consumerNumber" className="block text-sm font-medium text-gray-700">
                Consumer Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="consumerNumber"
                name="consumerNumber"
                value={formData.consumerNumber}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 text-black ${
                  errors.consumerNumber ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Enter consumer number"
                disabled={isSubmitting}
              />
              {errors.consumerNumber && (
                <p className="text-sm text-red-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.consumerNumber}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 text-black ${
                  errors.company ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Enter company name"
                disabled={isSubmitting}
              />
              {errors.company && (
                <p className="text-sm text-red-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.company}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <label htmlFor="clientName" className="block text-sm font-medium text-gray-700">
                Client Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="clientName"
                name="clientName"
                value={formData.clientName}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 text-black ${
                  errors.clientName ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Enter client name"
                disabled={isSubmitting}
              />
              {errors.clientName && (
                <p className="text-sm text-red-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.clientName}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <label htmlFor="discom" className="block text-sm font-medium text-gray-700">
                Discom
              </label>
              <select
                id="discom"
                name="discom"
                value={formData.discom}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 text-black"
                disabled={isSubmitting}
              >
                <option value="">Select Discom</option>
                <option value="UGVCL">UGVCL</option>
                <option value="MGVCL">MGVCL</option>
                <option value="DGVCL">DGVCL</option>
                <option value="PGVCL">PGVCL</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="gidc" className="block text-sm font-medium text-gray-700">
                GIDC
              </label>
              <input
                type="text"
                id="gidc"
                name="gidc"
                value={formData.gidc || ''}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 text-black"
                placeholder="Enter GIDC"
                disabled={isSubmitting}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="gstNumber" className="block text-sm font-medium text-gray-700">
                GST Number
              </label>
              <input
                type="text"
                id="gstNumber"
                name="gstNumber"
                value={formData.gstNumber || ''}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 text-black"
                placeholder="Enter GST Number"
                disabled={isSubmitting}
              />
            </div>
            
            {/* Mobile Numbers Section */}
            <div className="md:col-span-2 space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Mobile Numbers
              </label>
              <div className="space-y-2">
                {formData.mobileNumbers.map((mobile, index) => (
                  <div key={mobile.id} className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={mobile.name}
                          onChange={(e) => handleMobileNameChange(index, e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 text-black"
                          placeholder={`Contact ${index + 1}`}
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={mobile.number}
                          onChange={(e) => handleMobileNumberChange(index, e.target.value)}
                          className={`w-full px-3 py-2 text-sm border rounded-md focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 text-black ${
                            errors[`mobileNumber_${index}` as keyof typeof formData] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                          }`}
                          placeholder={`Mobile ${index + 1}`}
                          disabled={isSubmitting}
                          pattern="[0-9]*"
                          inputMode="numeric"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleMainMobileNumberChange(index)}
                        disabled={isSubmitting}
                        className={`flex items-center space-x-1 px-2 py-2 text-xs rounded-md border transition-all duration-200 ${
                          mobile.isMain
                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                            : 'border-gray-300 bg-white text-gray-600 hover:border-purple-300 hover:bg-purple-25'
                        }`}
                      >
                        <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${
                          mobile.isMain ? 'border-purple-500 bg-purple-500' : 'border-gray-400'
                        }`}>
                          {mobile.isMain && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                          )}
                        </div>
                        <span className="font-medium">
                          {mobile.isMain ? 'Main' : 'Main'}
                        </span>
                      </button>
                      {index === 0 && (
                        <button
                          type="button"
                          onClick={triggerAutoDetection}
                          className="px-3 py-2 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
                          disabled={isSubmitting}
                        >
                          Auto-Detect
                        </button>
                      )}
                    </div>
                    {errors[`mobileNumber_${index}` as keyof typeof formData] && (
                      <p className="text-sm text-red-600 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors[`mobileNumber_${index}` as keyof typeof formData]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              {errors.mobileNumbers && (
                <p className="text-sm text-red-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.mobileNumbers}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <label htmlFor="companyLocation" className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <input
                type="text"
                id="companyLocation"
                name="companyLocation"
                value={formData.companyLocation}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 text-black"
                placeholder="Enter address"
                disabled={isSubmitting}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="unitType" className="block text-sm font-medium text-gray-700">
                Unit Type <span className="text-red-500">*</span>
              </label>
              <select
                id="unitType"
                name="unitType"
                value={formData.unitType}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 text-black"
                disabled={isSubmitting}
              >
                <option value="New">New</option>
                <option value="Existing">Existing</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Lead Status <span className="text-red-500">*</span>
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 text-black"
                disabled={isSubmitting}
              >
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
            </div>
            
            <div className="space-y-2">
              <label htmlFor="lastActivityDate" className="block text-sm font-medium text-gray-700">
                Last Activity Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="lastActivityDate"
                  name="lastActivityDate"
                  value={formData.lastActivityDate ? (() => {
                    // Convert DD-MM-YYYY to YYYY-MM-DD for date input
                    const [day, month, year] = formData.lastActivityDate.split('-');
                    return `${year}-${month}-${day}`;
                  })() : ''}
                  onChange={(e) => {
                    if (e.target.value) {
                      // Convert YYYY-MM-DD to DD-MM-YYYY
                      const [year, month, day] = e.target.value.split('-');
                      const formattedDate = `${day}-${month}-${year}`;
                      setFormData(prev => ({
                        ...prev,
                        lastActivityDate: formattedDate
                      }));
                    }
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 text-black"
                  disabled={isSubmitting}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="followUpDate" className="block text-sm font-medium text-gray-700">
                Next Follow-up Date
                {['Follow-up', 'Hotlead', 'Mandate Sent', 'Documentation', 'Meeting Requested', 'Work Confirmation Pending'].includes(formData.status) && (
                  <span className="text-red-500">*</span>
                )}
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="followUpDate"
                  name="followUpDate"
                  value={formData.followUpDate ? (() => {
                    // Convert DD-MM-YYYY to YYYY-MM-DD for date input
                    const [day, month, year] = formData.followUpDate.split('-');
                    return `${year}-${month}-${day}`;
                  })() : ''}
                  onChange={(e) => {
                    if (e.target.value) {
                      // Convert YYYY-MM-DD to DD-MM-YYYY
                      const [year, month, day] = e.target.value.split('-');
                      const formattedDate = `${day}-${month}-${year}`;
                      setFormData(prev => ({
                        ...prev,
                        followUpDate: formattedDate
                      }));
                      // Clear error if exists
                      if (errors.followUpDate) {
                        setErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.followUpDate;
                          return newErrors;
                        });
                      }
                    }
                  }}
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 text-black ${
                    errors.followUpDate ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  disabled={isSubmitting}
                />
              </div>
              {errors.followUpDate && (
                <p className="text-sm text-red-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.followUpDate}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Last Discussion
              {['Follow-up', 'Hotlead', 'Mandate Sent', 'Documentation', 'Meeting Requested', 'Work Confirmation Pending'].includes(formData.status) && (
                <span className="text-red-500">*</span>
              )}
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 resize-vertical text-black text-sm"
              placeholder="Enter details about the last discussion with this lead"
              disabled={isSubmitting}
            />
            
            {/* Discussion Suggestions */}
            <div className="mt-3">
              <p className="text-sm text-gray-600 mb-2">Quick suggestions:</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleSuggestionClick("Call me after sometime I am busy right now.")}
                  className="px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors border border-blue-200"
                >
                  Call me after sometime I am busy right now.
                </button>
                <button
                  type="button"
                  onClick={() => handleSuggestionClick("I need to discuss this with my partner or management")}
                  className="px-3 py-1.5 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors border border-green-200"
                >
                  I need to discuss this with my partner or management
                </button>
                <button
                  type="button"
                  onClick={() => handleSuggestionClick("Send me details, I'll review")}
                  className="px-3 py-1.5 text-xs bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors border border-purple-200"
                >
                  Send me details, I'll review
                </button>
                <button
                  type="button"
                  onClick={() => handleSuggestionClick("Connect with the number I am giving.")}
                  className="px-3 py-1.5 text-xs bg-orange-100 text-orange-700 rounded-full hover:bg-orange-200 transition-colors border border-orange-200"
                >
                  Connect with the number I am giving.
                </button>
                <button
                  type="button"
                  onClick={() => handleSuggestionClick("Send me your mandate.")}
                  className="px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors border border-red-200"
                >
                  Send me your mandate.
                </button>
                <button
                  type="button"
                  onClick={() => handleSuggestionClick("They want to meet in-person we've requested client's work location/address for meeting.")}
                  className="px-3 py-1.5 text-xs bg-indigo-100 text-indigo-700 rounded-full hover:bg-indigo-200 transition-colors border border-indigo-200"
                >
                  They want to meet in-person we've requested client's work location/address for meeting.
                </button>
                <button
                  type="button"
                  onClick={() => handleSuggestionClick("Conversation happened, but the work confirmation is still pending.")}
                  className="px-3 py-1.5 text-xs bg-teal-100 text-teal-700 rounded-full hover:bg-teal-200 transition-colors border border-teal-200"
                >
                  Conversation happened, but the work confirmation is still pending.
                </button>
              </div>
            </div>
            {errors.notes && (
              <p className="text-sm text-red-600 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.notes}
              </p>
            )}
          </div>
          
          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 sm:flex-none sm:px-8 py-3 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                isSubmitting
                  ? 'bg-gray-400 cursor-not-allowed text-white'
                  : 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isEditMode ? 'Updating Lead...' : 'Adding Lead...'}
                </span>
              ) : (
                isEditMode ? 'Update Lead' : 'Add Lead'
              )}
            </button>
            
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none sm:px-8 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
