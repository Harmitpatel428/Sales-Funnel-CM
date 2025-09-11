'use client';

import React from 'react';
import { pdfServiceSimple, MandateData, ConsultantInfo, DEFAULT_CONSULTANT_INFO } from '../services/pdfServiceSimple';

export default function DebugPDFPage() {
  const testPDF = () => {
    console.log('Starting PDF generation test...');
    
    const mandateData: MandateData = {
      clientName: 'Test Client',
      company: 'Test Company',
      address: 'Test Address',
      phone: '1234567890',
      kva: '100',
      schemes: ['Interest Subsidy'],
      typeOfCase: 'New',
      category: 'Manufacturing',
      projectCost: '₹1.00 Cr',
      industriesType: 'Test Industry',
      termLoanAmount: '₹50 Lakhs',
      powerConnection: '100 KVA'
    };

    const consultantInfo: ConsultantInfo = DEFAULT_CONSULTANT_INFO;

    try {
      console.log('Calling pdfServiceSimple.downloadPDF...');
      pdfServiceSimple.downloadPDF(mandateData, consultantInfo);
      console.log('PDF generation completed successfully');
      alert('PDF generated successfully! Check your downloads folder.');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">PDF Debug Test</h1>
          
          <div className="space-y-4">
            <p className="text-gray-600">
              This page tests PDF generation with minimal data to identify any issues.
            </p>
            
            <button
              onClick={testPDF}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium text-lg"
            >
              Test PDF Generation
            </button>
            
            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
              <h3 className="font-semibold mb-2">Debug Information:</h3>
              <p className="text-sm text-gray-600">
                - Check browser console for any error messages<br/>
                - Check if PDF downloads to your default downloads folder<br/>
                - Verify that jsPDF and jspdf-autotable are loaded correctly
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
