'use client';

import React, { useState, useEffect } from 'react';
import { MandateData, ConsultantInfo } from '../services/pdfServiceSimple';
import { formatSubjectLine, getSchemeDescription } from '../utils/schemeUtils';

interface PDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (updatedData: MandateData, updatedConsultantInfo: ConsultantInfo, editableContent: any) => void;
  mandateData: MandateData;
  consultantInfo: ConsultantInfo;
}

export default function PDFPreviewModal({
  isOpen,
  onClose,
  onConfirm,
  mandateData,
  consultantInfo
}: PDFPreviewModalProps) {
  const [editableData, setEditableData] = useState<MandateData>(mandateData);
  const [editableConsultantInfo, setEditableConsultantInfo] = useState<ConsultantInfo>(consultantInfo);
  const [editableContent, setEditableContent] = useState({
    subjectLine: '',
    workScope: [
      'Assessment of eligibility for various government subsidy schemes under Atmanirbhar Gujarat Scheme 2022.',
      'Preparation and submission of all required documents and applications.',
      'Liaison with concerned government departments and agencies.',
      'Follow-up on application status and expedite approvals.',
      'Guidance on compliance requirements and procedures.',
      'Support for any additional documentation or clarifications required.',
      'Regular updates on the progress of applications.'
    ],
    eligibilityCriteria: [
      'The unit should be registered under the Companies Act, 2013 or Partnership Act, 1932 or any other relevant Act.',
      'The unit should be operational and engaged in manufacturing or service activities.',
      'The unit should have valid business registration and necessary licenses.',
      'The unit should comply with all applicable laws and regulations.',
      'The unit should have proper financial statements and project documentation.',
      'The unit should meet the minimum investment and employment criteria as specified in the scheme.',
      'The unit should adhere to environmental and safety standards.'
    ],
    termsAndConditions: [
      'All services are subject to client cooperation and timely provision of required documents.',
      'Fees are payable as per agreed terms and conditions.',
      'We reserve the right to modify our services based on changing government policies.',
      'Confidentiality of client information is maintained at all times.',
      'Any additional services beyond the scope will be charged separately.',
      'This mandate is valid for 90 days from the date of signing.',
      'Payment terms: 50% advance, 50% on completion of work.',
      'We are not responsible for delays caused by government departments or policy changes.'
    ]
  });

  // Update editable data when mandateData changes
  useEffect(() => {
    setEditableData(mandateData);
    setEditableContent(prev => ({
      ...prev,
      subjectLine: formatSubjectLine(mandateData.schemes)
    }));
  }, [mandateData]);

  useEffect(() => {
    setEditableConsultantInfo(consultantInfo);
  }, [consultantInfo]);

  if (!isOpen) return null;

  const formatDate = (): string => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleFieldChange = (field: keyof MandateData, value: string | string[] | { [schemeName: string]: number }) => {
    setEditableData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Update subject line when schemes change
    if (field === 'schemes') {
      setEditableContent(prev => ({
        ...prev,
        subjectLine: formatSubjectLine(value as string[])
      }));
    }
  };

  const handleConsultantFieldChange = (field: keyof ConsultantInfo, value: string) => {
    setEditableConsultantInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Note: Scheme selection is now handled in the main form, not in the preview modal

  const handleContentChange = (field: keyof typeof editableContent, value: string | string[]) => {
    setEditableContent(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleListEdit = (listName: keyof typeof editableContent, index: number, value: string) => {
    if (Array.isArray(editableContent[listName])) {
      const newList = [...(editableContent[listName] as string[])];
      newList[index] = value;
      handleContentChange(listName, newList);
    }
  };

  const handleConfirm = () => {
    onConfirm(editableData, editableConsultantInfo, editableContent);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">PDF Preview - Mandate Document</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              aria-label="Close modal"
              title="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Content - Scrollable PDF Preview */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6">
            {/* PDF Preview Container */}
            <div className="bg-white border border-gray-300 shadow-lg mx-auto pdf-preview-container">
              {/* PDF Content */}
              <div className="p-8 text-black pdf-content">
                
                {/* Header Section */}
                <div className="mb-6">
                  {/* Consultant Info - Top Left */}
                  <div className="mb-4">
                    <div
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => handleConsultantFieldChange('name', e.target.textContent || '')}
                      className="pdf-input text-xs font-bold focus:outline-none focus:bg-blue-50 focus:border focus:border-blue-300 rounded px-1 py-0.5"
                      style={{ minHeight: '14px' }}
                    >
                      {editableConsultantInfo.name}
                    </div>
                    <div
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => handleConsultantFieldChange('address', e.target.textContent || '')}
                      className="pdf-input text-xs mt-1 focus:outline-none focus:bg-blue-50 focus:border focus:border-blue-300 rounded px-1 py-0.5"
                      style={{ minHeight: '14px' }}
                    >
                      {editableConsultantInfo.address}
                    </div>
                    <div
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => handleConsultantFieldChange('email', e.target.textContent?.replace('Email: ', '') || '')}
                      className="pdf-input text-xs mt-1 focus:outline-none focus:bg-blue-50 focus:border focus:border-blue-300 rounded px-1 py-0.5"
                      style={{ minHeight: '14px' }}
                    >
                      Email: {editableConsultantInfo.email}
                    </div>
                    <div
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => handleConsultantFieldChange('phone', e.target.textContent?.replace('Phone: ', '') || '')}
                      className="pdf-input text-xs mt-1 focus:outline-none focus:bg-blue-50 focus:border focus:border-blue-300 rounded px-1 py-0.5"
                      style={{ minHeight: '14px' }}
                    >
                      Phone: {editableConsultantInfo.phone}
                    </div>
                  </div>

                  {/* Date - Top Right */}
                  <div className="text-right mb-4">
                    <span className="text-xs">Date: {formatDate()}</span>
                  </div>

                  {/* Subject Line */}
                  <div className="mb-4">
                    <div
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => handleContentChange('subjectLine', e.target.textContent || '')}
                      className="pdf-input text-xs font-bold focus:outline-none focus:bg-blue-50 focus:border focus:border-blue-300 rounded px-1 py-0.5"
                      style={{ minHeight: '14px' }}
                    >
                      {editableContent.subjectLine}
                    </div>
                  </div>
                </div>

                {/* Client Details */}
                <div className="mb-6">
                  <div className="text-xs font-bold mb-2">To,</div>
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => handleFieldChange('clientName', e.target.textContent || '')}
                    className="pdf-input text-xs font-bold mb-1 focus:outline-none focus:bg-blue-50 focus:border focus:border-blue-300 rounded px-1 py-0.5"
                    style={{ minHeight: '14px' }}
                  >
                    {editableData.clientName}
                  </div>
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => handleFieldChange('company', e.target.textContent || '')}
                    className="pdf-input text-xs mb-1 focus:outline-none focus:bg-blue-50 focus:border focus:border-blue-300 rounded px-1 py-0.5"
                    style={{ minHeight: '14px' }}
                  >
                    {editableData.company}
                  </div>
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => handleFieldChange('address', e.target.textContent || '')}
                    className="pdf-input text-xs focus:outline-none focus:bg-blue-50 focus:border focus:border-blue-300 rounded px-1 py-0.5"
                    style={{ minHeight: '14px' }}
                  >
                    {editableData.address}
                  </div>
                </div>

                {/* Commercial Offer */}
                <div className="mb-6">
                  <div className="text-xs font-bold mb-3">COMMERCIAL OFFER</div>
                  <div className="space-y-1">
                    <div className="flex">
                      <span className="text-xs font-bold w-24">Case Name:</span>
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => handleFieldChange('clientName', e.target.textContent || '')}
                        className="pdf-input flex-1 text-xs focus:outline-none focus:bg-blue-50 focus:border focus:border-blue-300 rounded px-1 py-0.5"
                        style={{ minHeight: '14px' }}
                      >
                        {editableData.clientName}
                      </div>
                    </div>
                    <div className="flex">
                      <span className="text-xs font-bold w-24">Type of Case:</span>
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => handleFieldChange('typeOfCase', e.target.textContent || '')}
                        className="pdf-input flex-1 text-xs focus:outline-none focus:bg-blue-50 focus:border focus:border-blue-300 rounded px-1 py-0.5"
                        style={{ minHeight: '14px' }}
                        data-placeholder="Enter type of case"
                      >
                        {editableData.typeOfCase || 'Enter type of case'}
                      </div>
                    </div>
                    <div className="flex">
                      <span className="text-xs font-bold w-24">Project Cost:</span>
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => handleFieldChange('projectCost', e.target.textContent || '')}
                        className="pdf-input flex-1 text-xs focus:outline-none focus:bg-blue-50 focus:border focus:border-blue-300 rounded px-1 py-0.5"
                        style={{ minHeight: '14px' }}
                        data-placeholder="Enter project cost"
                      >
                        {editableData.projectCost || 'Enter project cost'}
                      </div>
                    </div>
                    <div className="flex">
                      <span className="text-xs font-bold w-24">Industry:</span>
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => handleFieldChange('industriesType', e.target.textContent || '')}
                        className="pdf-input flex-1 text-xs focus:outline-none focus:bg-blue-50 focus:border focus:border-blue-300 rounded px-1 py-0.5"
                        style={{ minHeight: '14px' }}
                        data-placeholder="Enter industry type"
                      >
                        {editableData.industriesType || 'Enter industry type'}
                      </div>
                    </div>
                    <div className="flex">
                      <span className="text-xs font-bold w-24">Term Loan:</span>
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => handleFieldChange('termLoanAmount', e.target.textContent || '')}
                        className="pdf-input flex-1 text-xs focus:outline-none focus:bg-blue-50 focus:border focus:border-blue-300 rounded px-1 py-0.5"
                        style={{ minHeight: '14px' }}
                        data-placeholder="Enter term loan amount"
                      >
                        {editableData.termLoanAmount || 'Enter term loan amount'}
                      </div>
                    </div>
                    <div className="flex">
                      <span className="text-xs font-bold w-24">Power Conn:</span>
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => handleFieldChange('powerConnection', e.target.textContent || '')}
                        className="pdf-input flex-1 text-xs focus:outline-none focus:bg-blue-50 focus:border focus:border-blue-300 rounded px-1 py-0.5"
                        style={{ minHeight: '14px' }}
                        data-placeholder="Enter power connection"
                      >
                        {editableData.powerConnection || 'Enter power connection'}
                      </div>
                    </div>
                    <div className="flex">
                      <span className="text-xs font-bold w-24">KVA:</span>
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => handleFieldChange('kva', e.target.textContent || '')}
                        className="pdf-input flex-1 text-xs focus:outline-none focus:bg-blue-50 focus:border focus:border-blue-300 rounded px-1 py-0.5"
                        style={{ minHeight: '14px' }}
                        data-placeholder="Enter KVA"
                      >
                        {editableData.kva || 'Enter KVA'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Proposed Benefits */}
                <div className="mb-6">
                  <div className="text-xs font-bold mb-3">PROPOSED BENEFITS</div>
                  {editableData.schemes.length === 0 ? (
                    <div className="text-xs text-gray-500">No specific schemes selected</div>
                  ) : (
                    <div className="space-y-3">
                      {editableData.schemes.map((scheme, index) => {
                        const schemeDesc = getSchemeDescription(scheme);
                        const schemeTitle = schemeDesc?.title || scheme;
                        
                        return (
                          <div key={scheme} className="space-y-1">
                            <div className="text-xs font-bold">
                              {index + 1}. {schemeTitle}
                            </div>
                            {schemeDesc && (
                              <div className="ml-4 space-y-1">
                                {schemeDesc.description.map((desc, descIndex) => (
                                  <div
                                    key={descIndex}
                                    contentEditable
                                    suppressContentEditableWarning
                                    onBlur={(e) => {
                                      // Update the scheme description in state
                                      // This would require more complex state management
                                      console.log('Scheme description edited:', e.target.textContent);
                                    }}
                                    className="text-xs focus:outline-none focus:bg-blue-50 focus:border focus:border-blue-300 rounded px-1 py-0.5"
                                    style={{ minHeight: '14px' }}
                                  >
                                    • {desc}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Work Scope */}
                <div className="mb-6">
                  <div className="text-xs font-bold mb-3">WORK SCOPE</div>
                  <div className="space-y-1 text-xs">
                    {editableContent.workScope.map((item, index) => (
                      <div
                        key={index}
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => handleListEdit('workScope', index, e.target.textContent || '')}
                        className="focus:outline-none focus:bg-blue-50 focus:border focus:border-blue-300 rounded px-1 py-0.5"
                        style={{ minHeight: '14px' }}
                      >
                        {index + 1}. {item}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Eligibility Criteria */}
                <div className="mb-6">
                  <div className="text-xs font-bold mb-3">ELIGIBILITY CRITERIA</div>
                  <div className="space-y-1 text-xs">
                    {editableContent.eligibilityCriteria.map((item, index) => (
                      <div
                        key={index}
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => handleListEdit('eligibilityCriteria', index, e.target.textContent || '')}
                        className="focus:outline-none focus:bg-blue-50 focus:border focus:border-blue-300 rounded px-1 py-0.5"
                        style={{ minHeight: '14px' }}
                      >
                        {index + 1}. {item}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Our Fees */}
                <div className="mb-6">
                  <div className="text-xs font-bold mb-3">OUR FEES</div>
                  <div className="text-xs mb-2">Our consulting fees are structured as follows:</div>
                  
                  {editableData.schemes.length > 0 ? (
                    <div className="space-y-2">
                      {/* Fees Table Header */}
                      <div className="flex border-b border-gray-300 pb-1">
                        <div className="flex-1 text-xs font-bold">Scheme Name</div>
                        <div className="w-24 text-xs font-bold text-right">Consultant Fee (₹)</div>
                      </div>
                      
                      {/* Fees Table Rows */}
                      {editableData.schemes.map((scheme, index) => (
                        <div key={scheme} className="flex items-center border-b border-gray-200 pb-1">
                          <div className="flex-1 text-xs">
                            {index + 1}. {scheme}
                          </div>
                          <div className="w-24 text-right">
                            <div
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={(e) => {
                                const fee = parseInt(e.target.textContent?.replace(/[₹,]/g, '') || '0') || 0;
                                handleFieldChange('fees', {
                                  ...editableData.fees,
                                  [scheme]: fee
                                });
                              }}
                              className="text-xs focus:outline-none focus:bg-blue-50 focus:border focus:border-blue-300 rounded px-1 py-0.5 text-right"
                              style={{ minHeight: '14px' }}
                            >
                              ₹{(editableData.fees[scheme] || 0).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* Total Row */}
                      <div className="flex items-center pt-2 border-t border-gray-300">
                        <div className="flex-1 text-xs font-bold">Total Fees:</div>
                        <div className="w-24 text-xs font-bold text-right">
                          ₹{Object.values(editableData.fees).reduce((sum, fee) => sum + fee, 0).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500">No schemes selected</div>
                  )}
                </div>

                {/* Terms & Conditions */}
                <div className="mb-6">
                  <div className="text-xs font-bold mb-3">TERMS & CONDITIONS</div>
                  <div className="space-y-1 text-xs">
                    {editableContent.termsAndConditions.map((item, index) => (
                      <div
                        key={index}
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => handleListEdit('termsAndConditions', index, e.target.textContent || '')}
                        className="focus:outline-none focus:bg-blue-50 focus:border focus:border-blue-300 rounded px-1 py-0.5"
                        style={{ minHeight: '14px' }}
                      >
                        {index + 1}. {item}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="text-center">
                  <div className="text-xs font-bold">APPROVED & AUTHORIZED BY (Sign and Stamp)</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
            >
              Back / Edit Form
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 font-medium"
            >
              Confirm & Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
