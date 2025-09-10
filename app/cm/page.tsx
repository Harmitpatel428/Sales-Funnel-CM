'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLeads } from '../context/LeadContext';
import { useMandates } from '../context/MandateContext';
import { Lead, Mandate } from '../context/MandateContext';

export default function CMPage() {
  const router = useRouter();
  const { leads } = useLeads();
  const { addMandate } = useMandates();
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showMandatesList, setShowMandatesList] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    mandateName: '',
    clientName: '',
    company: '',
    consumerNumber: '',
    kva: '',
    phone: '',
    address: '',
    discom: '',
    gidc: '',
    gstNumber: '',
    notes: '',
    status: 'draft' as Mandate['status']
  });

  // Generate UUID function
  const generateId = (): string => {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
      return window.crypto.randomUUID();
    }
    return 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  };

  // Filter leads based on search term
  const filteredLeads = leads.filter(lead => 
    !lead.isDeleted && 
    (lead.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
     lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
     lead.consumerNumber.includes(searchTerm) ||
     lead.kva.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle lead selection for creating mandate from existing lead
  const handleLeadSelection = (lead: Lead) => {
    setSelectedLead(lead);
    setFormData({
      mandateName: `${lead.clientName} - ${lead.company}`,
      clientName: lead.clientName,
      company: lead.company,
      consumerNumber: lead.consumerNumber,
      kva: lead.kva,
      phone: lead.mobileNumbers.find(m => m.isMain)?.number || lead.mobileNumber || '',
      address: lead.companyLocation || '',
      discom: lead.discom || '',
      gidc: lead.gidc || '',
      gstNumber: lead.gstNumber || '',
      notes: lead.notes || '',
      status: 'draft'
    });
    setShowCreateForm(true);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newMandate: Mandate = {
      mandateId: generateId(),
      leadId: selectedLead?.id || null,
      mandateName: formData.mandateName,
      clientName: formData.clientName,
      company: formData.company,
      consumerNumber: formData.consumerNumber,
      kva: formData.kva,
      phone: formData.phone,
      address: formData.address,
      discom: formData.discom,
      gidc: formData.gidc,
      gstNumber: formData.gstNumber,
      createdAt: new Date().toISOString(),
      status: formData.status,
      notes: formData.notes,
      isDeleted: false
    };

    addMandate(newMandate);
    
    // Reset form and go back to main view
    setFormData({
      mandateName: '',
      clientName: '',
      company: '',
      consumerNumber: '',
      kva: '',
      phone: '',
      address: '',
      discom: '',
      gidc: '',
      gstNumber: '',
      notes: '',
      status: 'draft'
    });
    setSelectedLead(null);
    setShowCreateForm(false);
    
    // Show success message
    alert('Mandate created successfully!');
  };

  // Handle cancel
  const handleCancel = () => {
    setFormData({
      mandateName: '',
      clientName: '',
      company: '',
      consumerNumber: '',
      kva: '',
      phone: '',
      address: '',
      discom: '',
      gidc: '',
      gstNumber: '',
      notes: '',
      status: 'draft'
    });
    setSelectedLead(null);
    setShowCreateForm(false);
    setShowMandatesList(false);
  };

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (showMandatesList) {
    return <MandatesListView onBack={() => setShowMandatesList(false)} />;
  }

  if (showCreateForm) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {selectedLead ? 'Create Mandate from Lead' : 'Create New Mandate'}
            </h1>
            <button
              onClick={handleCancel}
              className="text-gray-600 hover:text-gray-800 transition-colors duration-200"
              aria-label="Go back"
              title="Go back"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="mandateName" className="block text-sm font-medium text-gray-700">
                  Mandate Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="mandateName"
                  name="mandateName"
                  value={formData.mandateName}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 placeholder:text-indigo-400"
                  placeholder="Enter mandate name"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                </select>
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
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 "
                  placeholder="Enter client name"
                />
              </div>

              <div className="space-y-2">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 "
                  placeholder="Enter company name"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="consumerNumber" className="block text-sm font-medium text-gray-700">
                  Consumer Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="consumerNumber"
                  name="consumerNumber"
                  value={formData.consumerNumber}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 "
                  placeholder="Enter consumer number"
                />
              </div>

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
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 "
                  placeholder="Enter KVA"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 "
                  placeholder="Enter phone number"
                />
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                  value={formData.gidc}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 "
                  placeholder="Enter GIDC"
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
                  value={formData.gstNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 "
                  placeholder="Enter GST Number"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 "
                placeholder="Enter address"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-vertical "
                placeholder="Enter any additional notes"
              />
            </div>

            {/* Form Actions */}
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                type="submit"
                className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              >
                Create Mandate
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mandate Management</h1>
          <button
            onClick={() => setShowMandatesList(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
          >
            View All Mandates
          </button>
        </div>

        {/* Main Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Create Mandate from Existing Lead */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Create Mandate from Existing Lead</h2>
            </div>
            <p className="text-gray-600 mb-6">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Search by client name, company, consumer number, or KVA..."
                />
              </div>

              {/* Leads List */}
              <div className="max-h-64 overflow-y-auto space-y-2">
                {filteredLeads.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    {searchTerm ? 'No leads found matching your search.' : 'No leads available.'}
                  </p>
                ) : (
                  filteredLeads.map((lead) => (
                    <div
                      key={lead.id}
                      onClick={() => handleLeadSelection(lead)}
                      className="p-3 bg-white rounded-md border border-gray-200 hover:border-purple-300 hover:bg-purple-50 cursor-pointer transition-colors duration-200"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">{lead.clientName}</h3>
                          <p className="text-sm text-gray-600">{lead.company}</p>
                          <p className="text-xs text-gray-500">
                            Consumer: {lead.consumerNumber} | KVA: {lead.kva}
                          </p>
                        </div>
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
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
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Create New Mandate</h2>
            </div>
            <p className="text-gray-600 mb-6">
              Create a standalone mandate without linking to any existing lead.
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200 font-medium"
            >
              Create New Mandate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Mandates List View Component
function MandatesListView({ onBack }: { onBack: () => void }) {
  const { mandates, getFilteredMandates, deleteMandate } = useMandates();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'active' | 'closed'>('all');

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
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">All Mandates</h1>
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-800 transition-colors duration-200"
            aria-label="Go back"
            title="Go back"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 "
              placeholder="Search mandates..."
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mandate Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMandates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No mandates found.
                  </td>
                </tr>
              ) : (
                filteredMandates.map((mandate) => (
                  <tr key={mandate.mandateId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{mandate.mandateName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{mandate.clientName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{mandate.company}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        mandate.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                        mandate.status === 'active' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {mandate.status.charAt(0).toUpperCase() + mandate.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(mandate.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleDelete(mandate.mandateId)}
                        className="text-red-600 hover:text-red-900 transition-colors duration-200"
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
  );
}