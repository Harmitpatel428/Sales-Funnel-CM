'use client';

import React, { useState } from 'react';
import { PDFServiceV2, MandateData, ConsultantInfo, DEFAULT_CONSULTANT_INFO } from '../services/pdfServiceV2';

export default function TestPreviewPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const testData: MandateData = {
    clientName: 'Test Client',
    company: 'Test Company Ltd',
    address: '123 Test Street, Test City',
    kva: '100 KVA',
    schemes: ['Interest Subsidy', 'Power Connection Charges'],
    typeOfCase: 'New Industrial Unit',
    category: '1',
    projectCost: '₹50,00,000',
    industriesType: 'Manufacturing',
    termLoanAmount: '₹30,00,000',
    powerConnection: '11 KV'
  };

  const handleTestPreview = async () => {
    setIsGenerating(true);
    try {
      const pdfService = new PDFServiceV2();
      const pdf = pdfService.generateSimpleMandatePDF(testData, DEFAULT_CONSULTANT_INFO);
      
      const pdfBlob = pdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      setPreviewUrl(url);
    } catch (error) {
      console.error('Error generating test PDF:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (previewUrl) {
      const link = document.createElement('a');
      link.href = previewUrl;
      link.download = 'Test_Mandate.pdf';
      link.click();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">PDF Preview Test</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Data</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><strong>Client:</strong> {testData.clientName}</div>
            <div><strong>Company:</strong> {testData.company}</div>
            <div><strong>Address:</strong> {testData.address}</div>
            <div><strong>KVA:</strong> {testData.kva}</div>
            <div><strong>Schemes:</strong> {testData.schemes.join(', ')}</div>
            <div><strong>Project Cost:</strong> {testData.projectCost}</div>
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={handleTestPreview}
            disabled={isGenerating}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? 'Generating...' : 'Generate Test PDF'}
          </button>
          
          {previewUrl && (
            <button
              onClick={handleDownload}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Download PDF
            </button>
          )}
        </div>

        {previewUrl && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">PDF Preview</h2>
            <iframe
              src={previewUrl}
              className="w-full h-96 border border-gray-300 rounded-lg"
              title="PDF Preview"
            />
          </div>
        )}
      </div>
    </div>
  );
}
