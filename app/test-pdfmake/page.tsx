'use client';

import React, { useState } from 'react';
import { pdfServiceV2, MandateData, ConsultantInfo, DEFAULT_CONSULTANT_INFO } from '../services/pdfServiceV2';

export default function TestPDFMakePage() {
  const [consultantInfo] = useState<ConsultantInfo>(DEFAULT_CONSULTANT_INFO);
  const [mandateData] = useState<MandateData>({
    clientName: 'M/s Mangalam Seeds Ltd',
    company: 'M/s Mangalam Seeds Ltd',
    address: 'Village: Maktupur, Ta: Unjha, Dist: Mehsana, Gujarat-382430',
    kva: '300',
    schemes: ['Interest Subsidy', 'Power Connection Charges', 'Electric Duty Exemption'],
    typeOfCase: 'New-Category II',
    category: 'Manufacturing',
    projectCost: '₹3.50 Cr (Approx.)',
    industriesType: 'Seed Manufacturing',
    termLoanAmount: '₹1.40 Cr (Approx.)',
    powerConnection: '300 KVA',
    policy: 'MSME Policy',
    fees: {
      'Interest Subsidy': 25000,
      'Power Connection Charges': 15000,
      'Electric Duty Exemption': 20000
    },
    percentages: {
      'Interest Subsidy': 2.5,
      'Power Connection Charges': 1.5,
      'Electric Duty Exemption': 2.0
    },
    feeTypes: {
      'Interest Subsidy': 'fee',
      'Power Connection Charges': 'fee',
      'Electric Duty Exemption': 'fee'
    }
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
          <h1 className="text-2xl font-bold text-gray-900 mb-6">PDFMake Test - Mandate Generation</h1>
          
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Current Mandate Data</h2>
            <div className="bg-gray-100 p-4 rounded-lg">
              <pre className="text-sm text-gray-700 overflow-auto">
                {JSON.stringify(mandateData, null, 2)}
              </pre>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Consultant Information</h2>
            <div className="bg-gray-100 p-4 rounded-lg">
              <pre className="text-sm text-gray-700 overflow-auto">
                {JSON.stringify(consultantInfo, null, 2)}
              </pre>
            </div>
          </div>

          <div className="mb-6">
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

          <div className="text-center">
            <button
              onClick={handleGeneratePDF}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium text-lg"
            >
              Generate & Download PDF
            </button>
          </div>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              This will generate a PDF with the exact format matching your sample PDF.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
