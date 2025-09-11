'use client';

import React, { useState } from 'react';
import { pdfServiceSimple, MandateData, DEFAULT_CONSULTANT_INFO } from '../services/pdfServiceSimple';

export default function MandatePreviewTestPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    clientName: 'Test Client Name',
    company: 'Test Company Ltd',
    kva: '100',
    address: '123 Test Street, Test City, Gujarat',
    schemes: ['Interest Subsidy', 'Power Connection Charges'],
    typeOfCase: 'New Industrial Unit',
    category: '1',
    projectCost: '₹50,00,000',
    industriesType: 'Manufacturing',
    termLoanAmount: '₹30,00,000',
    powerConnection: '100 KVA'
  });

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const mandateData: MandateData = {
        clientName: formData.clientName,
        company: formData.company,
        address: formData.address,
        kva: formData.kva,
        schemes: formData.schemes,
        typeOfCase: formData.typeOfCase,
        category: formData.category,
        projectCost: formData.projectCost,
        industriesType: formData.industriesType,
        termLoanAmount: formData.termLoanAmount,
        powerConnection: formData.powerConnection
      };

      console.log('Generating PDF with data:', mandateData);
      console.log('Selected schemes:', mandateData.schemes);
      
      const pdf = pdfServiceSimple.generateMandatePDF(mandateData, DEFAULT_CONSULTANT_INFO);
      console.log('PDF generated successfully');
      
      // Direct download without preview
      const pdfBlob = pdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Mandate_${formData.clientName}_${new Date().toISOString().split('T')[0]}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      
      console.log('PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Generate Mandate PDF</h1>
        
        <div className="max-w-4xl mx-auto">
          {/* Form */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Mandate Form</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="clientName" className="block text-sm font-medium text-gray-700">Client Name</label>
                <input
                  id="clientName"
                  type="text"
                  value={formData.clientName}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700">Company</label>
                <input
                  id="company"
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
                <textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="kva" className="block text-sm font-medium text-gray-700">KVA</label>
                <input
                  id="kva"
                  type="text"
                  value={formData.kva}
                  onChange={(e) => setFormData(prev => ({ ...prev, kva: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="projectCost" className="block text-sm font-medium text-gray-700">Project Cost</label>
                <input
                  id="projectCost"
                  type="text"
                  value={formData.projectCost}
                  onChange={(e) => setFormData(prev => ({ ...prev, projectCost: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Schemes</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {['Interest Subsidy', 'Power Connection Charges', 'Electric Duty Exemption', 'SGST Subsidy', 'Rent', 'Solar Subsidy'].map((scheme) => (
                    <label key={scheme} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.schemes.includes(scheme)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({ ...prev, schemes: [...prev.schemes, scheme] }));
                          } else {
                            setFormData(prev => ({ ...prev, schemes: prev.schemes.filter(s => s !== scheme) }));
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">{scheme}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-center">
              <button
                onClick={handleDownload}
                disabled={isGenerating}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold"
              >
                {isGenerating ? 'Generating PDF...' : 'Generate & Download PDF'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
