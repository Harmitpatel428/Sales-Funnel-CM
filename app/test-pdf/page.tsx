'use client';

import React, { useState } from 'react';
import { pdfServiceV2, MandateData, ConsultantInfo, DEFAULT_CONSULTANT_INFO } from '../services/pdfServiceV2';

export default function TestPDFPage() {
  const [consultantInfo, setConsultantInfo] = useState<ConsultantInfo>(DEFAULT_CONSULTANT_INFO);
  const [mandateData, setMandateData] = useState<MandateData>({
    clientName: 'M/s Mangalam Seeds Ltd',
    company: 'M/s Mangalam Seeds Ltd',
    address: 'Village: Maktupur, Ta: Unjha, Dist: Mehsana, Gujarat-382430',
    phone: '+91-9876543210',
    kva: '300',
    schemes: ['Interest Subsidy', 'Power Connection Charges', 'Electric Duty Exemption'],
    typeOfCase: 'New-Category II',
    category: 'Manufacturing',
    projectCost: '₹3.50 Cr (Approx.)',
    industriesType: 'Seed Manufacturing',
    termLoanAmount: '₹1.40 Cr (Approx.)',
    powerConnection: '300 KVA'
  });

  const handleGeneratePDF = () => {
    try {
      pdfServiceV2.downloadPDF(mandateData, consultantInfo);
      alert('PDF generated successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Check console for details.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">PDF Generation Test</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Mandate Data */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Mandate Data</h2>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Client Name</label>
                  <input
                    type="text"
                    value={mandateData.clientName}
                    onChange={(e) => setMandateData(prev => ({ ...prev, clientName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Company</label>
                  <input
                    type="text"
                    value={mandateData.company}
                    onChange={(e) => setMandateData(prev => ({ ...prev, company: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <textarea
                    value={mandateData.address}
                    onChange={(e) => setMandateData(prev => ({ ...prev, address: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="tel"
                    value={mandateData.phone}
                    onChange={(e) => setMandateData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">KVA</label>
                  <input
                    type="text"
                    value={mandateData.kva}
                    onChange={(e) => setMandateData(prev => ({ ...prev, kva: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* Consultant Info */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Consultant Information</h2>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={consultantInfo.name}
                    onChange={(e) => setConsultantInfo(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={consultantInfo.email}
                    onChange={(e) => setConsultantInfo(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="tel"
                    value={consultantInfo.phone}
                    onChange={(e) => setConsultantInfo(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <textarea
                    value={consultantInfo.address}
                    onChange={(e) => setConsultantInfo(prev => ({ ...prev, address: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Schemes */}
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Selected Schemes</h2>
            <div className="flex flex-wrap gap-2">
              {mandateData.schemes.map((scheme, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                >
                  {scheme}
                </span>
              ))}
            </div>
          </div>

          {/* Generate PDF Button */}
          <div className="mt-8 text-center">
            <button
              onClick={handleGeneratePDF}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium text-lg"
            >
              Generate & Download PDF
            </button>
          </div>

          {/* Sample Data Button */}
          <div className="mt-4 text-center">
            <button
              onClick={() => {
                setMandateData({
                  clientName: 'M/s Mangalam Seeds Ltd',
                  company: 'M/s Mangalam Seeds Ltd',
                  address: 'Village: Maktupur, Ta: Unjha, Dist: Mehsana, Gujarat-382430',
                  phone: '+91-9876543210',
                  kva: '300',
                  schemes: ['Interest Subsidy', 'Power Connection Charges', 'Electric Duty Exemption'],
                  typeOfCase: 'New-Category II',
                  category: 'Manufacturing',
                  projectCost: '₹3.50 Cr (Approx.)',
                  industriesType: 'Seed Manufacturing',
                  termLoanAmount: '₹1.40 Cr (Approx.)',
                  powerConnection: '300 KVA'
                });
                setConsultantInfo({
                  name: 'Dr. Rajesh Kumar',
                  address: '123 Business Center, Sector 17, Chandigarh, 160017',
                  email: 'rajesh.kumar@consulting.com',
                  phone: '+91-9876543210'
                });
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 font-medium"
            >
              Load Sample Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
