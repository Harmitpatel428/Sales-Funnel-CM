'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MandateData, ConsultantInfo } from '../services/pdfServiceV2';
import { formatSubjectLine, getSchemeDescription, getAllSchemeNames } from '../utils/schemeUtils';

interface PDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (updatedData: MandateData, updatedConsultantInfo: ConsultantInfo) => void;
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

  const handleFieldChange = (field: keyof MandateData, value: string | string[]) => {
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

  const handleSchemeToggle = (scheme: string) => {
    const currentSchemes = editableData.schemes;
    const isSelected = currentSchemes.includes(scheme);
    
    if (isSelected) {
      handleFieldChange('schemes', currentSchemes.filter(s => s !== scheme));
    } else {
      handleFieldChange('schemes', [...currentSchemes, scheme]);
    }
  };

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
    onConfirm(editableData, editableConsultantInfo);
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
                    <input
                      type="text"
                      value={editableConsultantInfo.name}
                      onChange={(e) => handleConsultantFieldChange('name', e.target.value)}
                      className="pdf-input text-xs font-bold"
                      aria-label="Consultant name"
                      title="Edit consultant name"
                    />
                    <input
                      type="text"
                      value={editableConsultantInfo.address}
                      onChange={(e) => handleConsultantFieldChange('address', e.target.value)}
                      className="pdf-input text-xs mt-1"
                      aria-label="Consultant address"
                      title="Edit consultant address"
                    />
                    <input
                      type="text"
                      value={`Email: ${editableConsultantInfo.email}`}
                      onChange={(e) => handleConsultantFieldChange('email', e.target.value.replace('Email: ', ''))}
                      className="pdf-input text-xs mt-1"
                      aria-label="Consultant email"
                      title="Edit consultant email"
                    />
                    <input
                      type="text"
                      value={`Phone: ${editableConsultantInfo.phone}`}
                      onChange={(e) => handleConsultantFieldChange('phone', e.target.value.replace('Phone: ', ''))}
                      className="pdf-input text-xs mt-1"
                      aria-label="Consultant phone"
                      title="Edit consultant phone"
                    />
                  </div>

                  {/* Date - Top Right */}
                  <div className="text-right mb-4">
                    <span className="text-xs">Date: {formatDate()}</span>
                  </div>

                  {/* Subject Line */}
                  <div className="mb-4">
                    <div className="text-xs font-bold">
                      {subjectLine}
                    </div>
                  </div>
                </div>

                {/* Client Details */}
                <div className="mb-6">
                  <div className="text-xs font-bold mb-2">To,</div>
                  <input
                    type="text"
                    value={editableData.clientName}
                    onChange={(e) => handleFieldChange('clientName', e.target.value)}
                    className="pdf-input text-xs font-bold mb-1"
                    aria-label="Client name"
                    title="Edit client name"
                  />
                  <input
                    type="text"
                    value={editableData.company}
                    onChange={(e) => handleFieldChange('company', e.target.value)}
                    className="pdf-input text-xs mb-1"
                    aria-label="Company name"
                    title="Edit company name"
                  />
                  <input
                    type="text"
                    value={editableData.address}
                    onChange={(e) => handleFieldChange('address', e.target.value)}
                    className="pdf-input text-xs"
                    aria-label="Client address"
                    title="Edit client address"
                  />
                </div>

                {/* Commercial Offer */}
                <div className="mb-6">
                  <div className="text-xs font-bold mb-3">COMMERCIAL OFFER</div>
                  <div className="space-y-1">
                    <div className="flex">
                      <span className="text-xs font-bold w-24">Case Name:</span>
                      <input
                        type="text"
                        value={editableData.clientName}
                        onChange={(e) => handleFieldChange('clientName', e.target.value)}
                        className="pdf-input flex-1 text-xs"
                        aria-label="Case name"
                        title="Edit case name"
                      />
                    </div>
                    <div className="flex">
                      <span className="text-xs font-bold w-24">Type of Case:</span>
                      <input
                        type="text"
                        value={editableData.typeOfCase}
                        onChange={(e) => handleFieldChange('typeOfCase', e.target.value)}
                        className="pdf-input flex-1 text-xs"
                        placeholder="Enter type of case"
                        aria-label="Type of case"
                        title="Edit type of case"
                      />
                    </div>
                    <div className="flex">
                      <span className="text-xs font-bold w-24">Project Cost:</span>
                      <input
                        type="text"
                        value={editableData.projectCost}
                        onChange={(e) => handleFieldChange('projectCost', e.target.value)}
                        className="pdf-input flex-1 text-xs"
                        placeholder="Enter project cost"
                        aria-label="Project cost"
                        title="Edit project cost"
                      />
                    </div>
                    <div className="flex">
                      <span className="text-xs font-bold w-24">Industry:</span>
                      <input
                        type="text"
                        value={editableData.industriesType}
                        onChange={(e) => handleFieldChange('industriesType', e.target.value)}
                        className="pdf-input flex-1 text-xs"
                        placeholder="Enter industry type"
                        aria-label="Industry type"
                        title="Edit industry type"
                      />
                    </div>
                    <div className="flex">
                      <span className="text-xs font-bold w-24">Term Loan:</span>
                      <input
                        type="text"
                        value={editableData.termLoanAmount}
                        onChange={(e) => handleFieldChange('termLoanAmount', e.target.value)}
                        className="pdf-input flex-1 text-xs"
                        placeholder="Enter term loan amount"
                        aria-label="Term loan amount"
                        title="Edit term loan amount"
                      />
                    </div>
                    <div className="flex">
                      <span className="text-xs font-bold w-24">Power Conn:</span>
                      <input
                        type="text"
                        value={editableData.powerConnection}
                        onChange={(e) => handleFieldChange('powerConnection', e.target.value)}
                        className="pdf-input flex-1 text-xs"
                        placeholder="Enter power connection"
                        aria-label="Power connection"
                        title="Edit power connection"
                      />
                    </div>
                    <div className="flex">
                      <span className="text-xs font-bold w-24">KVA:</span>
                      <input
                        type="text"
                        value={editableData.kva}
                        onChange={(e) => handleFieldChange('kva', e.target.value)}
                        className="pdf-input flex-1 text-xs"
                        placeholder="Enter KVA"
                        aria-label="KVA"
                        title="Edit KVA"
                      />
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
                                  <div key={descIndex} className="text-xs">
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
                    <div>1. Assessment of eligibility for various government subsidy schemes under Atmanirbhar Gujarat Scheme 2022.</div>
                    <div>2. Preparation and submission of all required documents and applications.</div>
                    <div>3. Liaison with concerned government departments and agencies.</div>
                    <div>4. Follow-up on application status and expedite approvals.</div>
                    <div>5. Guidance on compliance requirements and procedures.</div>
                    <div>6. Support for any additional documentation or clarifications required.</div>
                    <div>7. Regular updates on the progress of applications.</div>
                  </div>
                </div>

                {/* Eligibility Criteria */}
                <div className="mb-6">
                  <div className="text-xs font-bold mb-3">ELIGIBILITY CRITERIA</div>
                  <div className="space-y-1 text-xs">
                    <div>1. The unit should be registered under the Companies Act, 2013 or Partnership Act, 1932 or any other relevant Act.</div>
                    <div>2. The unit should be operational and engaged in manufacturing or service activities.</div>
                    <div>3. The unit should have valid business registration and necessary licenses.</div>
                    <div>4. The unit should comply with all applicable laws and regulations.</div>
                    <div>5. The unit should have proper financial statements and project documentation.</div>
                    <div>6. The unit should meet the minimum investment and employment criteria as specified in the scheme.</div>
                    <div>7. The unit should adhere to environmental and safety standards.</div>
                  </div>
                </div>

                {/* Our Fees */}
                <div className="mb-6">
                  <div className="text-xs font-bold mb-3">OUR FEES</div>
                  <div className="text-xs mb-2">Our consulting fees are structured as follows:</div>
                  <div className="space-y-1">
                    {editableData.schemes.map((scheme, index) => {
                      let feeAmount = '';
                      switch (scheme) {
                        case 'Interest Subsidy':
                          feeAmount = '₹25,000';
                          break;
                        case 'Power Connection Charges':
                          feeAmount = '₹15,000';
                          break;
                        case 'Electric Duty Exemption':
                          feeAmount = '₹20,000';
                          break;
                        default:
                          feeAmount = '₹10,000';
                      }
                      return (
                        <div key={index} className="text-xs">
                          {scheme}: {feeAmount} (Fixed Fee)
                        </div>
                      );
                    })}
                    {editableData.schemes.length > 0 && (
                      <div className="text-xs font-bold mt-2">
                        Total: ₹{(editableData.schemes.length * 15000).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Terms & Conditions */}
                <div className="mb-6">
                  <div className="text-xs font-bold mb-3">TERMS & CONDITIONS</div>
                  <div className="space-y-1 text-xs">
                    <div>1. All services are subject to client cooperation and timely provision of required documents.</div>
                    <div>2. Fees are payable as per agreed terms and conditions.</div>
                    <div>3. We reserve the right to modify our services based on changing government policies.</div>
                    <div>4. Confidentiality of client information is maintained at all times.</div>
                    <div>5. Any additional services beyond the scope will be charged separately.</div>
                    <div>6. This mandate is valid for 90 days from the date of signing.</div>
                    <div>7. Payment terms: 50% advance, 50% on completion of work.</div>
                    <div>8. We are not responsible for delays caused by government departments or policy changes.</div>
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
