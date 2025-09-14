'use client';

import React, { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation'; // Not used currently
import { useLeads, Lead } from '../context/LeadContext';
import { useMandates, Mandate } from '../context/MandateContext';
import { MandateData, ConsultantInfo, DEFAULT_CONSULTANT_INFO, EditableContent } from '../services/pdfServiceSimple';
import PDFPreviewModal from '../components/PDFPreviewModal';

export default function CMPage() {
  // const router = useRouter(); // Not used currently
  const { leads } = useLeads();
  const { addMandate } = useMandates();
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showMandatesList, setShowMandatesList] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [consultantInfo, setConsultantInfo] = useState<ConsultantInfo>(DEFAULT_CONSULTANT_INFO);
  const [showConsultantForm, setShowConsultantForm] = useState(false);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [formData, setFormData] = useState({
    clientName: '',
    company: '',
    kva: '',
    address: '',
    schemes: [] as string[],
    typeOfCase: '',
    category: '',
    projectCost: '',
    industriesType: '',
    termLoanAmount: '',
    powerConnection: '',
    policy: '',
    fees: {} as { [schemeName: string]: number },
    percentages: {} as { [schemeName: string]: number },
    feeTypes: {} as { [schemeName: string]: 'fee' | 'percentage' }
  });
  
  const [additionalFees, setAdditionalFees] = useState<Array<{
    id: string;
    name: string;
    amount: number;
    feeType: 'fee' | 'percentage';
  }>>([]);

  // Generate UUID function
  const generateId = (): string => {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
      return window.crypto.randomUUID();
    }
    return 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  };

  // Handle ESC key to go back
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showCreateForm, showMandatesList, selectedLead]); // Include dependencies that handleCancel uses


  // Filter leads based on search term
  const filteredLeads = leads.filter(lead => 
    !lead.isDeleted && 
    (lead.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
     lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
     lead.kva.toLowerCase().includes(searchTerm.toLowerCase()))
  );


  // Add sample leads if none exist
  const addSampleLeads = () => {
    if (typeof window === 'undefined') return; // Check for SSR
    if (leads.length === 0) {
      const sampleLeads: Lead[] = [
        {
          id: 'sample-1',
          kva: '100',
          connectionDate: '15-01-2024',
          consumerNumber: '1234567890',
          company: 'Manglam Seeds Pvt Ltd',
          clientName: 'Rajesh Kumar',
          discom: 'UGVCL',
          gidc: 'GIDC-001',
          gstNumber: '24ABCDE1234F1Z5',
          mobileNumber: '9876543210',
          mobileNumbers: [
            { id: '1', number: '9876543210', name: 'Rajesh Kumar', isMain: true },
            { id: '2', number: '9876543211', name: 'Assistant', isMain: false }
          ],
          companyLocation: 'Industrial Area, Phase 1, Chandigarh',
          unitType: 'New' as const,
          status: 'New' as const,
          lastActivityDate: '15-01-2024',
          followUpDate: '20-01-2024',
          finalConclusion: '',
          notes: 'Interested in subsidy schemes',
          isDone: false,
          isDeleted: false,
          isUpdated: false,
          mandateStatus: 'Pending' as const,
          documentStatus: 'Pending Documents' as const
        },
        {
          id: 'sample-2',
          kva: '50',
          connectionDate: '10-01-2024',
          consumerNumber: '0987654321',
          company: 'Tech Solutions Ltd',
          clientName: 'Priya Sharma',
          discom: 'MGVCL',
          gidc: 'GIDC-002',
          gstNumber: '24FGHIJ5678K1L9',
          mobileNumber: '8765432109',
          mobileNumbers: [
            { id: '1', number: '8765432109', name: 'Priya Sharma', isMain: true }
          ],
          companyLocation: 'Sector 17, Chandigarh',
          unitType: 'Existing' as const,
          status: 'Follow-up' as const,
          lastActivityDate: '12-01-2024',
          followUpDate: '18-01-2024',
          finalConclusion: '',
          notes: 'Follow up required for documentation',
          isDone: false,
          isDeleted: false,
          isUpdated: false,
          mandateStatus: 'Pending' as const,
          documentStatus: 'Pending Documents' as const
        }
      ];
      
      // Add sample leads to localStorage
      try {
        localStorage.setItem('leads', JSON.stringify(sampleLeads));
        // Reload the page to see the leads
        window.location.reload();
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
    }
  };

  // Clear localStorage function for debugging
  const clearLocalStorage = () => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem('leads');
      localStorage.removeItem('mandates');
      localStorage.removeItem('savedViews');
      alert('LocalStorage cleared successfully!');
      window.location.reload();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  };

  // Handle lead selection for creating mandate from existing lead
  const handleLeadSelection = (lead: Lead) => {
    setSelectedLead(lead);
    
    // Find the main contact information
    const mainContact = lead.mobileNumbers?.find(m => m.isMain);
    
    setFormData({
      clientName: mainContact?.name || lead.clientName,
      company: lead.company,
      kva: lead.kva,
      address: lead.companyLocation || '',
      schemes: [],
      typeOfCase: '',
      category: '',
      projectCost: '',
      industriesType: '',
      termLoanAmount: '',
      powerConnection: '',
      policy: '',
      fees: {},
      percentages: {},
      feeTypes: {}
    });
    setShowCreateForm(true);
  };



  // Handle form submission - Show PDF preview modal
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 HANDLE SUBMIT CALLED - Showing PDF preview modal');
    
    // Show PDF preview modal instead of directly downloading
    setShowPDFPreview(true);
  };

  // Handle PDF preview confirmation and download
  const handlePDFConfirm = async (updatedData: MandateData, updatedConsultantInfo: ConsultantInfo, editableContent: EditableContent) => {
    try {
      console.log('📄 Starting PDF generation for download...');
      
      // Update consultant info
      setConsultantInfo(updatedConsultantInfo);
      
      // Create mandate record
      const newMandate: Mandate = {
        mandateId: generateId(),
        leadId: selectedLead?.id || undefined,
        mandateName: `${updatedData.clientName} - ${updatedData.company}`,
        clientName: updatedData.clientName,
        company: updatedData.company,
        kva: updatedData.kva,
        address: updatedData.address,
        schemes: updatedData.schemes,
        typeOfCase: updatedData.typeOfCase,
        category: updatedData.category,
        projectCost: updatedData.projectCost,
        industriesType: updatedData.industriesType,
        termLoanAmount: updatedData.termLoanAmount,
        powerConnection: updatedData.powerConnection,
        createdAt: new Date().toISOString(),
        status: 'draft',
        isDeleted: false
      };

      addMandate(newMandate);

      // Generate and download PDF
      const { pdfServiceSimple } = await import('../services/pdfServiceSimple');
      console.log('📥 Calling downloadPDF...');
      pdfServiceSimple.downloadPDF(updatedData, updatedConsultantInfo, undefined, editableContent);
      console.log('✅ PDF download initiated');
      
      // Close modal and reset form
      setShowPDFPreview(false);
      setFormData({
        clientName: '',
        company: '',
        kva: '',
        address: '',
        schemes: [],
        typeOfCase: '',
        category: '',
        projectCost: '',
        industriesType: '',
        termLoanAmount: '',
        powerConnection: '',
        policy: '',
        fees: {},
        percentages: {},
        feeTypes: {}
      });
      setSelectedLead(null);
      setShowCreateForm(false);
      
      alert('Mandate created and PDF generated successfully!');
    } catch (error) {
      console.error('❌ Error generating PDF:', error);
      alert('Mandate created successfully, but there was an error generating the PDF.');
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setFormData({
      clientName: '',
      company: '',
      kva: '',
      address: '',
      schemes: [],
      typeOfCase: '',
      category: '',
      projectCost: '',
      industriesType: '',
      termLoanAmount: '',
      powerConnection: '',
      policy: '',
      fees: {},
      percentages: {},
      feeTypes: {}
    });
    setSelectedLead(null);
    setShowCreateForm(false);
    setShowMandatesList(false);
    setShowPDFPreview(false);
  };

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle scheme selection changes
  const handleSchemeChange = (scheme: string, checked: boolean) => {
    setFormData(prev => {
      let newSchemes: string[];
      let newFees: { [schemeName: string]: number };
      let newPercentages: { [schemeName: string]: number };
      let newFeeTypes: { [schemeName: string]: 'fee' | 'percentage' };

      if (checked) {
        // Add scheme with default fee, percentage, and fee type
        newSchemes = [...prev.schemes, scheme];
        newFees = { ...prev.fees, [scheme]: 0 };
        newPercentages = { ...prev.percentages, [scheme]: 0 };
        newFeeTypes = { ...prev.feeTypes, [scheme]: 'percentage' }; // Default to percentage
      } else {
        // Remove scheme and its fee/percentage/type
        newSchemes = prev.schemes.filter(s => s !== scheme);
        newFees = { ...prev.fees };
        newPercentages = { ...prev.percentages };
        newFeeTypes = { ...prev.feeTypes };
        delete newFees[scheme];
        delete newPercentages[scheme];
        delete newFeeTypes[scheme];
      }

      return {
        ...prev,
        schemes: newSchemes,
        fees: newFees,
        percentages: newPercentages,
        feeTypes: newFeeTypes
      };
    });
  };

  // Handle fee input changes
  const handleFeeChange = (scheme: string, fee: number) => {
    setFormData(prev => ({
      ...prev,
      fees: {
        ...prev.fees,
        [scheme]: fee
      }
    }));
  };

  // Handle percentage input changes
  const handlePercentageChange = (scheme: string, percentage: number) => {
    setFormData(prev => ({
      ...prev,
      percentages: {
        ...prev.percentages,
        [scheme]: percentage
      }
    }));
  };

  // Handle additional fee field changes
  const handleAdditionalFeeChange = (id: string, field: 'name' | 'amount' | 'feeType', value: string | number) => {
    setAdditionalFees(prev => prev.map(fee => 
      fee.id === id ? { ...fee, [field]: value } : fee
    ));
  };

  // Add new additional fee field
  const addAdditionalFee = () => {
    if (additionalFees.length < 4) {
      const newFee = {
        id: generateId(),
        name: '',
        amount: 0,
        feeType: 'fee' as 'fee' | 'percentage'
      };
      setAdditionalFees(prev => [...prev, newFee]);
    }
  };

  // Remove additional fee field
  const removeAdditionalFee = (id: string) => {
    setAdditionalFees(prev => prev.filter(fee => fee.id !== id));
  };

  // Handle fee type changes
  const handleFeeTypeChange = (scheme: string, feeType: 'fee' | 'percentage') => {
    setFormData(prev => ({
      ...prev,
      feeTypes: {
        ...prev.feeTypes,
        [scheme]: feeType
      }
    }));
  };

  if (showMandatesList) {
    return <MandatesListView onBack={() => setShowMandatesList(false)} />;
  }

  if (showCreateForm) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:py-6">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Header */}
            <div className="px-4 sm:px-6 py-4 sm:py-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                    {selectedLead ? 'Create Mandate from Lead' : 'Create New Mandate'}
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Press <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 border border-gray-300 rounded">ESC</kbd> to cancel
                  </p>
                </div>
                <button
                  onClick={handleCancel}
                  className="ml-4 text-gray-600 hover:text-gray-800 transition-colors duration-200 flex-shrink-0"
                  aria-label="Go back"
                  title="Go back"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="relative">
              <div className="px-4 sm:px-6 py-4 sm:py-6">
                {/* Policy Selection Section */}
                <div className="mb-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center">
                        <div className="w-6 h-6 bg-green-600 rounded flex items-center justify-center mr-2">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900">Select Policy</h3>
                      </div>
                      <select
                        id="policy"
                        name="policy"
                        value={formData.policy}
                        onChange={handleChange}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-black text-sm w-80"
                        title="Select Policy"
                        aria-label="Select Policy"
                      >
                        <option value="">Select Policy</option>
                        <option value="Atmanirbhar Gujarat Scheme MSMEs 2022">Under Atmanirbhar Gujarat Scheme MSMEs 2022</option>
                        <option value="CEICED department (Electric Duty Exemption)">Under CEICED department (Electric Duty Exemption)</option>
                        <option value="Other - Customisable">Other - Customisable</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Desktop: Two columns, Mobile: Single column */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                  {/* Left Column - Lead Information */}
                  <div className="space-y-0">
                    <div className="bg-gray-50 rounded-lg p-2">
                      <h2 className="text-lg font-semibold text-gray-900 mb-3">Lead Information</h2>
                      <div className="space-y-0">

                        <div className="space-y-1">
                          <label htmlFor="clientName" className="block text-sm font-medium text-gray-700">
                            Client Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            id="clientName"
                            name="clientName"
                            value={formData.clientName}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-black text-sm"
                            placeholder="Enter client name"
                          />
                        </div>

                        <div className="space-y-1">
                          <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                            Company <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            id="company"
                            name="company"
                            value={formData.company}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-black text-sm"
                            placeholder="Enter company name"
                          />
                        </div>

                        <div className="space-y-1">
                          <label htmlFor="kva" className="block text-sm font-medium text-gray-700">
                            KVA <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            id="kva"
                            name="kva"
                            value={formData.kva}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-black text-sm"
                            placeholder="Enter KVA"
                          />
                        </div>

                        <div className="space-y-1">
                          <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                            Address
                          </label>
                          <input
                            type="text"
                            id="address"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-black text-sm"
                            placeholder="Enter address"
                          />
                        </div>

                      </div>
                    </div>
                  </div>

                  {/* Right Column - Scheme Options */}
                  <div className="space-y-0">
                    <div className="bg-gray-50 rounded-lg p-2">
                      <div className="flex items-center mb-4">
                        <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center mr-3">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900">Scheme Options</h2>
                      </div>
                      
                      <div className="space-y-0">
                        <p className="text-sm text-gray-600 mb-3">Select applicable schemes:</p>
                        <div className="space-y-0">
                          {[
                            'Capital Subsidy',
                            'Interest Subsidy',
                            'SGST Subsidy',
                            'Rent',
                            'Power Connection Charges',
                            'Electric Duty Exemption',
                            'Solar Subsidy'
                          ].map((scheme) => (
                            <label 
                              key={scheme} 
                              className={`flex items-center p-2 rounded-lg border cursor-pointer transition-colors duration-200 ${
                                formData.schemes.includes(scheme)
                                  ? 'border-purple-500 bg-purple-50'
                                  : 'border-gray-200 bg-white hover:border-purple-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={formData.schemes.includes(scheme)}
                                onChange={(e) => handleSchemeChange(scheme, e.target.checked)}
                                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded mr-3"
                              />
                              <span className={`text-sm font-medium ${
                                formData.schemes.includes(scheme)
                                  ? 'text-purple-900'
                                  : 'text-gray-700'
                              }`}>
                                {scheme}
                              </span>
                            </label>
                          ))}
                        </div>
                        
                        {formData.schemes.length > 0 && (
                          <div className="mt-4 p-3 bg-purple-100 rounded-lg">
                            <p className="text-sm text-purple-800 font-medium">
                              {formData.schemes.length} scheme{formData.schemes.length !== 1 ? 's' : ''} selected
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Consultant Fees Section */}
                  {formData.schemes.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Consultant Fees</h2>
                      </div>
                      
                      <div className="space-y-4">
                        <p className="text-sm text-gray-600 mb-4">Enter fees and percentages for each selected scheme:</p>
                        <div className="space-y-0">
                          {formData.schemes.map((scheme) => (
                            <div key={scheme} className="bg-gray-50 rounded-lg p-2">
                              {/* Inline Layout: Label + Selector + Input in one line */}
                              <div className="flex items-center justify-between">
                                {/* Scheme Label */}
                                <div className="flex-shrink-0 w-48">
                                  <h3 className="text-sm font-medium text-gray-700">{scheme}</h3>
                                </div>
                                
                                {/* Right side: Toggle buttons + Input */}
                                <div className="flex items-center space-x-2">
                                  {/* Fee Type Selector - Icon Style */}
                                  <div className="flex space-x-1">
                                    <button
                                      type="button"
                                      onClick={() => handleFeeTypeChange(scheme, 'fee')}
                                      className={`px-2 py-1 text-xs rounded border transition-colors duration-200 ${
                                        formData.feeTypes[scheme] === 'fee'
                                          ? 'bg-purple-600 text-white border-purple-600'
                                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                      }`}
                                      title="Fee Amount"
                                    >
                                      ₹
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleFeeTypeChange(scheme, 'percentage')}
                                      className={`px-2 py-1 text-xs rounded border transition-colors duration-200 ${
                                        formData.feeTypes[scheme] === 'percentage'
                                          ? 'bg-purple-600 text-white border-purple-600'
                                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                      }`}
                                      title="Percentage"
                                    >
                                      %
                                    </button>
                                  </div>
                                  
                                  {/* Input Field */}
                                  <div className="relative w-32">
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={formData.feeTypes[scheme] === 'fee' ? (formData.fees[scheme] || '') : (formData.percentages[scheme] || '')}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        if (formData.feeTypes[scheme] === 'fee') {
                                          handleFeeChange(scheme, value === '' ? 0 : parseFloat(value) || 0);
                                        } else {
                                          handlePercentageChange(scheme, value === '' ? 0 : parseFloat(value) || 0);
                                        }
                                      }}
                                      className="w-full px-3 py-1.5 pr-6 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                      placeholder="Enter amount"
                                    />
                                    <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                                      {formData.feeTypes[scheme] === 'fee' ? '₹' : '%'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Details of Proposed Firm Section */}
                  <div className="space-y-0">
                    <div className="bg-gray-50 rounded-lg p-2">
                      <div className="flex items-center mb-4">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900">Details of Proposed Firm</h2>
                      </div>
                      
                      <div className="space-y-0">
                        {/* Type of Case */}
                        <div className="space-y-1">
                          <label htmlFor="typeOfCase" className="block text-sm font-medium text-gray-700">
                            Type of Case
                          </label>
                          <select
                            id="typeOfCase"
                            name="typeOfCase"
                            value={formData.typeOfCase}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-black text-sm"
                          >
                            <option value="">Select Type of Case</option>
                            <option value="New Unit">New Unit</option>
                            <option value="Expansion Unit">Expansion Unit</option>
                          </select>
                        </div>

                        {/* Category Dropdown */}
                        <div className="space-y-1">
                          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                            Category
                          </label>
                          <select
                            id="category"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-black text-sm"
                          >
                            <option value="">Select Category</option>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                          </select>
                        </div>

                        {/* Project Cost */}
                        <div className="space-y-1">
                          <label htmlFor="projectCost" className="block text-sm font-medium text-gray-700">
                            Project Cost
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              id="projectCost"
                              name="projectCost"
                              value={formData.projectCost}
                              onChange={handleChange}
                              className="w-full px-3 py-2 pr-16 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-black text-sm"
                              placeholder="Enter project cost"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                              <span className="text-gray-500 text-sm">Approx</span>
                            </div>
                          </div>
                        </div>

                        {/* Industries Type Dropdown */}
                        <div className="space-y-1">
                          <label htmlFor="industriesType" className="block text-sm font-medium text-gray-700">
                            Industries Type
                          </label>
                          <select
                            id="industriesType"
                            name="industriesType"
                            value={formData.industriesType}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-black text-sm"
                          >
                            <option value="">Select Industry Type</option>
                            <option value="Manufacturing">Manufacturing</option>
                            <option value="Service">Service</option>
                          </select>
                        </div>

                        {/* Term Loan Amount */}
                        <div className="space-y-1">
                          <label htmlFor="termLoanAmount" className="block text-sm font-medium text-gray-700">
                            Term Loan Amount
                          </label>
                          <input
                            type="text"
                            id="termLoanAmount"
                            name="termLoanAmount"
                            value={formData.termLoanAmount}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-black text-sm"
                            placeholder="Enter term loan amount"
                          />
                        </div>

                        {/* Power Connection */}
                        <div className="space-y-1">
                          <label htmlFor="powerConnection" className="block text-sm font-medium text-gray-700">
                            Power Connection
                          </label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              id="powerConnection"
                              name="powerConnection"
                              value={formData.powerConnection}
                              onChange={handleChange}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-black text-sm"
                              placeholder="Enter power connection details"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (formData.kva) {
                                  setFormData(prev => ({
                                    ...prev,
                                    powerConnection: formData.kva
                                  }));
                                }
                              }}
                              className="px-3 py-2 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-1"
                              title="Auto-detect from KVA"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              <span>Auto Detect</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Consultant Information Section */}
              <div className="px-4 sm:px-6 py-4 sm:py-6 border-t border-gray-200 bg-blue-50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Consultant Information</h3>
                  <button
                    type="button"
                    onClick={() => setShowConsultantForm(!showConsultantForm)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    <span>{showConsultantForm ? 'Hide' : 'Edit'} Consultant Info</span>
                    <svg 
                      className={`w-4 h-4 transition-transform duration-200 ${showConsultantForm ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
                
                {showConsultantForm && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="consultantName" className="block text-sm font-medium text-gray-700">
                        Consultant Name
                      </label>
                      <input
                        type="text"
                        id="consultantName"
                        value={consultantInfo.name}
                        onChange={(e) => setConsultantInfo(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="Enter consultant name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="consultantEmail" className="block text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <input
                        type="email"
                        id="consultantEmail"
                        value={consultantInfo.email}
                        onChange={(e) => setConsultantInfo(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="Enter email"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="consultantPhone" className="block text-sm font-medium text-gray-700">
                        Phone
                      </label>
                      <input
                        type="tel"
                        id="consultantPhone"
                        value={consultantInfo.phone}
                        onChange={(e) => setConsultantInfo(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="Enter phone number"
                      />
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <label htmlFor="consultantAddress" className="block text-sm font-medium text-gray-700">
                        Address
                      </label>
                      <textarea
                        id="consultantAddress"
                        value={consultantInfo.address}
                        onChange={(e) => setConsultantInfo(prev => ({ ...prev, address: e.target.value }))}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-vertical"
                        placeholder="Enter consultant address"
                      />
                    </div>
                  </div>
                )}
              </div>



              {/* Form Actions - Desktop */}
              <div className="hidden sm:block px-4 sm:px-6 py-4 sm:py-6 border-t border-gray-200 bg-gray-50">
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 font-medium"
                  >
                    Create Mandate
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>

              {/* Form Actions - Mobile (Sticky) */}
              <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 font-medium text-sm"
                  >
                    Create Mandate
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-3 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 font-medium text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>

              {/* Mobile bottom padding to prevent content from being hidden behind sticky button */}
              <div className="sm:hidden h-20"></div>
            </form>
          </div>
        </div>

        {/* PDF Preview Modal */}
        <PDFPreviewModal
          isOpen={showPDFPreview}
          onClose={() => setShowPDFPreview(false)}
          onConfirm={handlePDFConfirm}
          mandateData={{
            clientName: formData.clientName,
            company: formData.company,
            address: formData.address || '',
            kva: formData.kva,
            schemes: formData.schemes,
            typeOfCase: formData.typeOfCase,
            category: formData.category,
            projectCost: formData.projectCost,
            industriesType: formData.industriesType,
            termLoanAmount: formData.termLoanAmount,
            powerConnection: formData.powerConnection,
            policy: formData.policy,
            fees: formData.fees,
            percentages: formData.percentages,
            feeTypes: formData.feeTypes
          }}
          consultantInfo={consultantInfo}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="max-w-6xl mx-auto px-4 py-4 sm:py-6">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="px-4 sm:px-6 py-4 sm:py-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Mandate Management</h1>
              <button
                onClick={() => setShowMandatesList(true)}
                className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium text-sm sm:text-base"
              >
                View All Mandates
              </button>
            </div>
          </div>

          {/* Main Options */}
          <div className="px-4 sm:px-6 py-4 sm:py-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              {/* Create Mandate from Existing Lead */}
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4 sm:p-6 border border-purple-200">
                <div className="flex items-start sm:items-center mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-600 rounded-lg flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Create Mandate from Existing Lead</h2>
                </div>
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                  Select an existing lead to create a mandate. The form will be pre-filled with lead information.
                </p>

                {/* Search Leads */}
                <div className="space-y-4">
                  <div>
                    <label htmlFor="leadSearch" className="block text-sm font-medium text-gray-700 mb-2">
                      Search Leads
                    </label>
                    <input
                      type="text"
                      id="leadSearch"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-black text-sm sm:text-base"
                      placeholder="Search by client name, company, or KVA..."
                    />
                  </div>

                  {/* Leads List */}
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {filteredLeads.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-gray-500 text-sm mb-3">
                          {searchTerm ? 'No leads found matching your search.' : 'No leads available.'}
                        </p>
                        {leads.length === 0 && (
                          <div className="flex gap-2">
                            <button
                              onClick={addSampleLeads}
                              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm"
                            >
                              Add Sample Leads
                            </button>
                            <button
                              onClick={clearLocalStorage}
                              className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 text-sm"
                            >
                              Clear Storage
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      filteredLeads.map((lead) => (
                        <div
                          key={lead.id}
                          onClick={() => handleLeadSelection(lead)}
                          className="p-3 bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 cursor-pointer transition-colors duration-200"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">{lead.clientName}</h3>
                              <p className="text-xs sm:text-sm text-gray-600 truncate">{lead.company}</p>
                              <p className="text-xs text-gray-500">
                                KVA: {lead.kva}
                              </p>
                            </div>
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full flex-shrink-0 ml-2">
                              {lead.status}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Create New Mandate */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 sm:p-6 border border-green-200">
                <div className="flex items-start sm:items-center mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-600 rounded-lg flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Create New Mandate</h2>
                </div>
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                  Create a standalone mandate without linking to any existing lead.
                </p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium text-sm sm:text-base"
                >
                  Create New Mandate
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Mandates List View Component
function MandatesListView({ onBack }: { onBack: () => void }) {
  const { getFilteredMandates, deleteMandate } = useMandates();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'active' | 'closed'>('all');

  // Handle ESC key to go back
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onBack();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onBack]);

  const filteredMandates = getFilteredMandates({
    searchTerm: searchTerm || undefined,
    status: statusFilter === 'all' ? undefined : [statusFilter as Mandate['status']]
  });

  const handleDelete = (mandateId: string) => {
    if (confirm('Are you sure you want to delete this mandate?')) {
      deleteMandate(mandateId);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-4 sm:py-6">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="px-4 sm:px-6 py-4 sm:py-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">All Mandates</h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Press <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 border border-gray-300 rounded">ESC</kbd> to go back
                </p>
              </div>
              <button
                onClick={onBack}
                className="ml-4 text-gray-600 hover:text-gray-800 transition-colors duration-200 flex-shrink-0"
                aria-label="Go back"
                title="Go back"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="px-4 sm:px-6 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-black text-sm sm:text-base"
                  placeholder="Search mandates..."
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "all" | "draft" | "active" | "closed")}
                className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-black text-sm sm:text-base"
                aria-label="Filter by status"
                title="Filter by status"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {/* Mandates Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mandate Name
                    </th>
                    <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMandates.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 sm:px-6 py-8 text-center text-gray-500 text-sm">
                        No mandates found.
                      </td>
                    </tr>
                  ) : (
                    filteredMandates.map((mandate) => (
                      <tr key={mandate.mandateId} className="hover:bg-gray-50">
                        <td className="px-3 sm:px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 truncate max-w-xs">{mandate.mandateName}</div>
                          <div className="sm:hidden text-xs text-gray-500 mt-1">
                            {mandate.clientName} • {mandate.company}
                          </div>
                        </td>
                        <td className="hidden sm:table-cell px-6 py-4">
                          <div className="text-sm text-gray-900 truncate max-w-xs">{mandate.clientName}</div>
                        </td>
                        <td className="hidden md:table-cell px-6 py-4">
                          <div className="text-sm text-gray-900 truncate max-w-xs">{mandate.company}</div>
                        </td>
                        <td className="px-3 sm:px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            mandate.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                            mandate.status === 'active' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {mandate.status.charAt(0).toUpperCase() + mandate.status.slice(1)}
                          </span>
                        </td>
                        <td className="hidden lg:table-cell px-6 py-4">
                          <div className="text-sm text-gray-500">{formatDate(mandate.createdAt)}</div>
                        </td>
                        <td className="px-3 sm:px-6 py-4">
                          <button
                            onClick={() => handleDelete(mandate.mandateId)}
                            className="text-red-600 hover:text-red-900 transition-colors duration-200 text-sm"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}