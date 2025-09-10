'use client';

import React from 'react';
import { useLeads } from '../context/LeadContext';

export default function DebugLeadsPage() {
  const { leads } = useLeads();

  const addSampleLeads = () => {
    const sampleLeads = [
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
    
    localStorage.setItem('leads', JSON.stringify(sampleLeads));
    window.location.reload();
  };

  const clearLeads = () => {
    localStorage.removeItem('leads');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Debug Leads</h1>
          
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Actions</h2>
            <div className="flex gap-4">
              <button
                onClick={addSampleLeads}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Add Sample Leads
              </button>
              <button
                onClick={clearLeads}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
              >
                Clear All Leads
              </button>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Leads Data</h2>
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="text-sm text-gray-700 mb-2">
                <strong>Total Leads:</strong> {leads.length}
              </p>
              <p className="text-sm text-gray-700 mb-2">
                <strong>LocalStorage:</strong> {localStorage.getItem('leads') ? 'Has data' : 'No data'}
              </p>
              <pre className="text-xs text-gray-600 overflow-auto max-h-64">
                {JSON.stringify(leads, null, 2)}
              </pre>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Raw LocalStorage</h2>
            <div className="bg-gray-100 p-4 rounded-lg">
              <pre className="text-xs text-gray-600 overflow-auto max-h-64">
                {localStorage.getItem('leads') || 'No data in localStorage'}
              </pre>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Leads List</h2>
            {leads.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No leads available</p>
            ) : (
              <div className="space-y-3">
                {leads.map((lead) => (
                  <div key={lead.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{lead.clientName}</h3>
                        <p className="text-sm text-gray-600">{lead.company}</p>
                        <p className="text-xs text-gray-500">KVA: {lead.kva}</p>
                        <p className="text-xs text-gray-500">Status: {lead.status}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        lead.isDeleted ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {lead.isDeleted ? 'Deleted' : 'Active'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
