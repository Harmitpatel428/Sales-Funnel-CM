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
      subjectLine: formatSubjectLine(mandateData.schemes, mandateData.policy)
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
        subjectLine: formatSubjectLine(value as string[], editableData.policy)
      }));
    }
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

  // Function to convert number to Roman numeral
  const toRomanNumeral = (num: number): string => {
    const romanNumerals = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
    return romanNumerals[num] || num.toString();
  };

  // Function to get the policy header text with taluka category if applicable
  const getPolicyHeaderText = (): string => {
    if (!editableData.policy) return 'Work description';
    
    const policyText = `Under ${editableData.policy}`;
    
    // Check if policy is "Under Atmanirbhar Gujarat Scheme MSMEs 2022" and taluka category exists
    if (editableData.policy === 'Atmanirbhar Gujarat Scheme MSMEs 2022' && editableData.category) {
      const romanCategory = toRomanNumeral(parseInt(editableData.category));
      return `${policyText} (Taluka Category ${romanCategory})`;
    }
    
    return policyText;
  };

  // Function to get benefit details based on scheme and taluka category
  const getBenefitDetails = (scheme: string, category: string): string => {
    // Handle Capital Subsidy with category-specific details
    if (scheme === 'Capital Subsidy' && category) {
      switch (category) {
        case '1':
          return '25% of Term Loan, up to ₹35 lakhs';
        case '2':
          return '20% of Term Loan, up to ₹30 lakhs';
        case '3':
          return '10% of Term Loan, up to ₹10 lakhs';
        default:
          return 'Benefit details as per taluka category';
      }
    }

    // Handle Interest Subsidy with category-specific details
    if (scheme === 'Interest Subsidy' && category) {
      switch (category) {
        case '1':
          return '7% subsidy, max ₹35 lakhs/year';
        case '2':
          return '6% subsidy, max ₹30 lakhs/year';
        case '3':
          return '5% subsidy, max ₹25 lakhs/year';
        default:
          return 'Interest subsidy as per taluka category';
      }
    }

    // Handle SGST Subsidy with category-specific details
    if (scheme === 'SGST Subsidy' && category) {
      switch (category) {
        case '1':
          return '100% SGST reimbursement (max 7.5% of FCI/year)';
        case '2':
          return '90% SGST reimbursement';
        case '3':
          return '80% SGST reimbursement';
        default:
          return 'SGST reimbursement as per taluka category';
      }
    }

    // Handle Electric Duty Exemption
    if (scheme === 'Electric Duty Exemption') {
      return '100% exemption on electricity duty';
    }

    // Handle Power Connection Charges
    if (scheme === 'Power Connection Charges') {
      return '35% of DISCOM charges (Maximum 5 Lakhs)';
    }

    // Handle Solar Subsidy with category-specific details (same as Interest Subsidy)
    if (scheme === 'Solar Subsidy' && category) {
      switch (category) {
        case '1':
          return '7% subsidy, max ₹35 lakhs/year';
        case '2':
          return '6% subsidy, max ₹30 lakhs/year';
        case '3':
          return '5% subsidy, max ₹25 lakhs/year';
        default:
          return 'Solar subsidy as per taluka category';
      }
    }

    // Handle Rent
    if (scheme === 'Rent') {
      return '65% of rent amount (Maximum 1 Lakh) - PA';
    }

    // For other schemes, use the scheme description or default
    const schemeDesc = getSchemeDescription(scheme);
    return schemeDesc?.description[0] || 'Benefit details';
  };

  // Function to get duration based on scheme and taluka category
  const getDuration = (scheme: string, category: string): string => {
    // Handle Interest Subsidy with category-specific durations
    if (scheme === 'Interest Subsidy' && category) {
      switch (category) {
        case '1':
          return '7 Years';
        case '2':
          return '6 Years';
        case '3':
          return '5 Years';
        default:
          return 'As per scheme';
      }
    }

    // Handle Solar Subsidy with category-specific durations (same as Interest Subsidy)
    if (scheme === 'Solar Subsidy' && category) {
      switch (category) {
        case '1':
          return '7 Years';
        case '2':
          return '6 Years';
        case '3':
          return '5 Years';
        default:
          return 'As per scheme';
      }
    }

    // Handle SGST Subsidy with category-specific durations
    if (scheme === 'SGST Subsidy' && category) {
      return '10 Years';
    }

    // Handle Capital Subsidy
    if (scheme === 'Capital Subsidy') {
      return 'One Time Benefit';
    }

    // For other schemes, use default durations
    if (scheme === 'Power Connection Charges') return 'One Time Benefit';
    if (scheme === 'Electric Duty Exemption') return '5 Years';
    if (scheme === 'Rent') return '5 Years';
    
    return 'As per scheme';
  };

  // Function to get application timeline based on scheme
  const getApplicationTimeline = (scheme: string): string => {
    // Handle Capital Subsidy and Interest Subsidy with updated timeline
    if (scheme === 'Capital Subsidy' || scheme === 'Interest Subsidy') {
      return 'Within 1 year from DOCP or First disbursement';
    }

    // Handle other schemes with their specific timelines
    if (scheme === 'Power Connection Charges') return 'Within 1 year from estimate payment receipt date to DISCOM';
    if (scheme === 'Electric Duty Exemption') return 'Within 90 days from Date of production or trail production';
    if (scheme === 'SGST Subsidy') return 'Within 1 year from DOCP';
    if (scheme === 'Rent') return 'Within one year from the date of Rent agreement/lease';
    if (scheme === 'Solar Subsidy') return 'Within 1 year from commissioning';
    
    return 'As per scheme guidelines';
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
                
                {/* Document Header */}
                <div className="mb-6">
                  {/* Company Logo */}
                  <div className="text-center mb-6 -mt-4">
                    <div className="mb-1">
                      <div className="text-5xl font-bold text-blue-600">
                        <div>V4U</div>
                        <div className="text-base -mt-2">Biz Solutions</div>
                      </div>
                    </div>
                  </div>

                  {/* Commercial Offer Container */}
                  <div className="mb-4 -mx-8">
                    <div className="text-base font-bold text-gray-800 bg-gray-100 border border-gray-300 py-2 px-4 w-full text-center">
                      Commercial Offer for Subsidy Work
                    </div>
                  </div>

                  {/* Date */}
                  <div className="text-right mb-4">
                    <span className="text-xs font-medium">Date: {formatDate()}</span>
                  </div>

                </div>

                {/* Client Details */}
                <div className="mb-6">
                  <div className="bg-blue-100 rounded-lg p-4 mb-4 w-1/2 border border-blue-300 shadow-lg">
                    <div className="text-sm font-bold mb-2">To,</div>
                    <div className="text-sm font-bold mb-1">
                      M/S {editableData.company}
                    </div>
                    <div className="text-sm font-bold mb-1">Address: {editableData.address}</div>
                  </div>
                </div>

                {/* Subject Line */}
                <div className="mb-4">
                  <div className="text-sm">
                    <span className="font-bold">Subject:</span> 
                    <span
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => handleContentChange('subjectLine', e.target.textContent || '')}
                      className="pdf-input focus:outline-none focus:bg-blue-50 focus:border focus:border-blue-300 rounded px-1 py-0.5 pdf-input-min-height ml-1"
                    >
                      {editableContent.subjectLine}
                    </span>
                  </div>
                </div>

                {/* Salutation */}
                <div className="mb-0">
                  <div className="text-sm">Dear Sir,</div>
                </div>

                {/* Opening Paragraph */}
                <div className="mb-6">
                  <div className="text-sm">
                    With reference to above said subject & as per discussion with <span className="font-bold underline">Mr {editableData.clientName} sir</span> hereby we are sending our commercial offer and scope of work.
                  </div>
                </div>

                {/* Commercial Offer */}
                <div className="mb-6">
                  <div className="text-sm font-bold mb-3">Details of Proposed Firm are as under:</div>
                  <div className="bg-blue-100 rounded-lg p-4 mb-4 w-1/2 border border-blue-300 shadow-lg">
                    <div className="text-sm font-bold mb-2">Case name: M/S {editableData.company}</div>
                    <div className="space-y-1 text-xs">
                      {editableData.typeOfCase && (
                        <div className="flex">
                          <span className="font-bold w-32">Type of Case:</span>
                          <span>{editableData.typeOfCase}</span>
                        </div>
                      )}
                      {editableData.category && (
                        <div className="flex">
                          <span className="font-bold w-32">Taluka Category:</span>
                          <span>{editableData.category}</span>
                        </div>
                      )}
                      {editableData.projectCost && (
                        <div className="flex">
                          <span className="font-bold w-32">Cost of Project:</span>
                          <span>₹. {editableData.projectCost} (Approx.)</span>
                        </div>
                      )}
                      {editableData.industriesType && (
                        <div className="flex">
                          <span className="font-bold w-32">Industries Type:</span>
                          <span>{editableData.industriesType}</span>
                        </div>
                      )}
                      {editableData.termLoanAmount && (
                        <div className="flex">
                          <span className="font-bold w-32">Term Loan Amount:</span>
                          <span>₹. {editableData.termLoanAmount}</span>
                        </div>
                      )}
                      {editableData.powerConnection && (
                        <div className="flex">
                          <span className="font-bold w-32">Power Connection:</span>
                          <span>{editableData.powerConnection} KVA</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>


                {/* Proposed Benefits */}
                <div className="mb-6">
                  <div className="text-xs font-bold mb-3">WORK DESCRIPTION & PROPOSED BENEFITS</div>
                  <div className="border border-black rounded bg-blue-100">
                    {/* Merged Header Row */}
                    <div className="bg-blue-100 border-b border-black">
                      <div className="text-xs font-bold p-2 text-center">{getPolicyHeaderText()}</div>
                    </div>
                    
                      {/* Table Header */}
                      <div className="flex border-b border-black bg-blue-100">
                        <div className="w-20 text-xs font-bold p-2 border-r border-black text-center">Benefits </div>
                        <div className="w-32 text-xs font-bold p-2 border-r border-black text-center">Subsidy Name</div>
                        <div className="flex-1 text-xs font-bold p-2 border-r border-black text-center">Benefit Details</div>
                        <div className="w-20 text-xs font-bold p-2 border-r border-black text-center">Duration</div>
                        <div className="flex-1 text-xs font-bold p-2 text-center">Application Time Line</div>
                      </div>
                    
                    {/* Table Rows */}
                    {editableData.schemes.length === 0 ? (
                      <div className="text-xs text-gray-500 p-4 text-center">No specific schemes selected</div>
                    ) : (
                      editableData.schemes.map((scheme, index) => {
                        const schemeDesc = getSchemeDescription(scheme);
                        const benefitCategory = `Benefit - ${String.fromCharCode(65 + index)}`; // A, B, C, etc.
                        
                        return (
                          <div key={scheme} className="flex border-b border-black bg-blue-100">
                            <div className="w-20 text-xs p-2 border-r border-black text-center font-bold">
                              {benefitCategory}
                            </div>
                            <div className="w-32 text-xs p-2 border-r border-black">
                              {schemeDesc?.title || scheme}
                            </div>
                            <div className="flex-1 text-xs p-2 border-r border-black">
                              {getBenefitDetails(scheme, editableData.category)}
                            </div>
                            <div className="w-20 text-xs p-2 border-r border-black text-center">
                              {getDuration(scheme, editableData.category)}
                            </div>
                            <div className="flex-1 text-xs p-2 text-center">
                              {getApplicationTimeline(scheme)}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  
                  {/* Note */}
                  <div className="text-xs text-red-600 mt-2">
                    Note: - DOCP means Date of commercial production
                  </div>
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
                        className="focus:outline-none focus:bg-blue-50 focus:border focus:border-blue-300 rounded px-1 py-0.5 pdf-input-min-height"
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
                        className="focus:outline-none focus:bg-blue-50 focus:border focus:border-blue-300 rounded px-1 py-0.5 pdf-input-min-height"
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
                    <div className="border border-gray-400 rounded">
                      {/* Fees Table Header */}
                      <div className="flex border-b border-gray-400 bg-gray-100">
                        <div className="flex-1 text-xs font-bold p-2 border-r border-gray-400">Scheme Name</div>
                        <div className="w-24 text-xs font-bold text-right p-2 border-r border-gray-400">Our Fees</div>
                        <div className="w-20 text-xs font-bold text-center p-2">Description</div>
                      </div>
                      
                      {/* Fees Table Rows */}
                      {editableData.schemes.map((scheme, index) => {
                        const feeType = editableData.feeTypes?.[scheme] || 'percentage';
                        const fee = editableData.fees[scheme] || 0;
                        const percentage = editableData.percentages?.[scheme] || 0;
                        
                        // Use the selected fee type to determine what to show
                        const displayValue = feeType === 'fee' ? fee : percentage;
                        const displaySymbol = feeType === 'fee' ? '₹' : '%';
                        
                        return (
                          <div key={scheme} className={`flex items-center ${index < editableData.schemes.length - 1 ? 'border-b border-gray-400' : ''}`}>
                            <div className="flex-1 text-xs p-2 border-r border-gray-400">
                              {index + 1}. {scheme}
                            </div>
                            <div className="w-24 text-right p-2 border-r border-gray-400">
                              <div
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => {
                                  const value = parseInt(e.target.textContent?.replace(/[₹%,]/g, '') || '0') || 0;
                                  if (feeType === 'fee') {
                                    handleFieldChange('fees', {
                                      ...editableData.fees,
                                      [scheme]: value
                                    });
                                  } else {
                                    handleFieldChange('percentages', {
                                      ...editableData.percentages,
                                      [scheme]: value
                                    });
                                  }
                                }}
                                className="text-xs focus:outline-none focus:bg-blue-50 focus:border focus:border-blue-300 rounded px-1 py-0.5 text-right pdf-input-min-height"
                              >
                                {displayValue.toLocaleString()}{displaySymbol}
                              </div>
                            </div>
                            <div className="w-20 text-center text-xs text-gray-600 p-2">
                              {feeType === 'fee' ? 'One time' : 'Of subsidy amount'}
                            </div>
                          </div>
                        );
                      })}
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
                        className="focus:outline-none focus:bg-blue-50 focus:border focus:border-blue-300 rounded px-1 py-0.5 pdf-input-min-height"
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
