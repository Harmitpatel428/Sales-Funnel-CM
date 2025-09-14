'use client';

import React, { useState, useEffect } from 'react';
import { MandateData, ConsultantInfo, EditableContent } from '../services/pdfServiceSimple';
import { formatSubjectLine, getSchemeDescription } from '../utils/schemeUtils';

interface PDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (updatedData: MandateData, updatedConsultantInfo: ConsultantInfo, editableContent: EditableContent) => void;
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
    eligibilityCriteria: [] as string[],
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
    setEditableContent((prev: EditableContent) => ({
      ...prev,
      subjectLine: formatSubjectLine(mandateData.schemes, mandateData.policy, mandateData.typeOfCase)
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
    setEditableData((prev: MandateData) => ({
      ...prev,
      [field]: value
    }));
    
    // Update subject line when schemes or typeOfCase change
    if (field === 'schemes' || field === 'typeOfCase') {
      const updatedData = { ...editableData, [field]: value };
      setEditableContent((prev: EditableContent) => ({
        ...prev,
        subjectLine: formatSubjectLine(updatedData.schemes, updatedData.policy, updatedData.typeOfCase)
      }));
    }
  };


  // Note: Scheme selection is now handled in the main form, not in the preview modal

  const handleContentChange = (field: keyof typeof editableContent, value: string | string[]) => {
    setEditableContent((prev: EditableContent) => ({
      ...prev,
      [field]: value
    }));
  };

  // Removed unused handleListEdit function

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
          return '100% of net SGST for up to 7.5% of eFCI PA';
        case '2':
          return '90% of net SGST for upto 6.5% of eFCI p.a.';
        case '3':
          return '80% of net SGST for up to 5% of eFCI PA';
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

  // Function to generate dynamic work description based on current benefits
  const getDynamicWorkDescription = (): string => {
    if (editableData.schemes.length === 0) {
      return 'MSME Various Applications as per above stated benefit & Issuance of Electric duty exemption certificate from concerned Dept.';
    }

    // Generate benefit letters (A, B, C, etc.)
    const benefitLetters = editableData.schemes.map((_: string, index: number) => 
      String.fromCharCode(65 + index) // A, B, C, etc.
    ).join(', ');

    // Check if Electric Duty Exemption is selected
    const hasElectricDutyExemption = editableData.schemes.includes('Electric Duty Exemption');
    
    if (hasElectricDutyExemption) {
      return `MSME Various Applications as per above stated benefit ${benefitLetters} & Issuance of Electric duty exemption certificate from concerned Dept.`;
    } else {
      return `MSME Various Applications as per above stated benefit ${benefitLetters}`;
    }
  };

  // Function to get dynamic eligibility criteria based on selected schemes
  const getDynamicEligibilityCriteria = (): string[] => {
    const criteria: string[] = [];
    
    // Check if Power Connection Charges is selected
    if (editableData.schemes.includes('Power Connection Charges')) {
      criteria.push('<span class="text-red-600 font-bold">• Eligibility Criteria for Power connection Charges: (Read carefully)</span>');
      criteria.push('1. MSME should be located in other than GIDC / industrial park area approved by IC/IMD.');
      criteria.push('2. To eligible expenditure includes charges / expense paid to the power distribution Licensee (except refundable deposit) for new connection or additional load in case of existing consumer (in case of expansion) or for shifting of connection or service line hear the expansion means additional load for existing consumer.');
      criteria.push('3. According to MSME criteria, the gross capital investment in plant and machinery should be up to ₹ 50cr.');
    }
    
    // Check if Electric Duty Exemption is selected
    if (editableData.schemes.includes('Electric Duty Exemption')) {
      criteria.push('<span class="text-red-600 font-bold">• Eligibility Criteria for EDE & Tentative Benefits: (Read carefully)</span>');
      criteria.push('1. Electric duty benefits is available only for Manufacturing unit having new machinery installed for new and additional units in Gujarat.');
      criteria.push('2. To get full benefit from this scheme, an application must be submitted within 90 days from the production date. If the application is submitted later, the benefit will only be applicable for the remaining period out of the 60 months.');
      criteria.push('3. Benefits as per actual consumption pattern.');
      criteria.push('4. Electric duty benefits are available only for Production area and not for non-industrial consumption like labor colony, Mess, canteen, (Dining arrangement tables and chairs for workers). Club House, Library, Guest House (Residential) Recreation Center etc. And its client responsibility to carry out installation of sub-meter for such non-industrial consumption.');
      criteria.push('5. If Installation of a sub-meter is carried out in the facility mentioned above after commencement of production, then benefit will be applicable from the date mentioned in performa-15 for sub-meter provided by UGVCL and period between date of production and date of Performa- 15 for sub meter will be deducted from benefit period of 60 months.');
      criteria.push('6. If there is D.G set (Diesel Generator Set) install within premises then its registration must be done by client.');
      criteria.push('7. If Dg set is being used in unit, then whatever units are consumed it is client\'s responsibility to pay electricity Duty chalan for that consumption time to time.');
      criteria.push('8. Whenever visit is carried out by Electrical duty inspector and if above criteria is not fulfill and due to this if application gets rejected and client loses benefit during that period then client will be responsible for that.');
      criteria.push('9. In case of expansion in Gujarat, investment for plant & machinery in such expansion unit must be more than 50% of gross block of existing unit plant & machinery.');
      criteria.push('10. If we are undertaking an expansion within the same plot, all the newly installed machinery must be clearly identifiable. For this, a partition or a separate shed/building is necessary. To record the electricity consumed by the newly installed machinery, it is mandatory to install a lab-tested sub-meter within the partition/building/shed.');
      criteria.push('11. The benefit of exemption, granted in any manner, shall be subject to verification and review of required necessary, information or documents produced while making an application or physical verification of the undertaking and the same. Shall, after giving an opportunity of being heard to the applicant to prove the Bonafide, be liable to be withdrawn with immediate effect, if it is established at any time that any false or fictitious information and / or documents are produced by the new industrial undertaking for the purpose of getting the benefit of exemption, the financial benefit so gained prior to the date of withdrawal of such benefit shall have be remitted back to the State Government. Provided that if such remittance is not made within the period of thirty days, the amount of such remittance together with interest thereon at the rate of 18 per cent. Per annum shall be recoverable either through a Civil Court or as an arrear of land revenue.');
    }
    
    // Check if Rent is selected
    if (editableData.schemes.includes('Rent')) {
      criteria.push('<span class="text-red-600 font-bold">• Eligibility Criteria for Rent Assistance: (Read Carefully)</span>');
      criteria.push('1. The owner of shed/premises should have legal ownership and possession.');
      criteria.push('2. The service activity and trading activity will not be eligible under the scheme.');
      criteria.push('3. Rent must be paid by cheque/e-payment.');
      criteria.push('4. Rent/lease agreement (notarized or registered) must be in policy period.');
      criteria.push('5. Applicants need to apply within one year from the date of agreement of rent/lease deed.');
      criteria.push('6. Enterprise is eligible for maximum 3 applications with total assistance of Rs.1,00,000/-(One Lakh) per annum during the operative period of the scheme.');
      criteria.push('7. Rent/lease deed should be minimum of 11 months (expandable up to 5 year)');
      criteria.push('8. Enterprise must be in commercial production.');
      criteria.push('9. The assistance of rent will be given with effect from the date of rent deed or three months prior to the date of production whichever is later.');
      criteria.push('10. Enterprise shall have to submit required approvals related to shed/premises.');
      criteria.push('11. If enterprise submit sublease agreement, then recognized intuitions/ authority \'s Approval/ Consent/NOC is required');
      criteria.push('12. Unit must have to provide prior intimation to concern DIC in case of changing its rental premises.');
      criteria.push('13. If the enterprise has signed rent/lease agreement on or after 05/10/2022 then, enterprise will be eligible for this scheme. And expenditure incurred on or after 07/08/2020 is eligible under this scheme.');
      criteria.push('14. It is further clarified that the clause 7.2 of the GR is applicable only for schemes 1 to 4. For other schemes, all new applications from existing and new/expansion/diversification units (on or after 5/10/2022) for expense incurred on or after 7/08/2020 shall have to be made under the Aatmanirbhar Gujarat Scheme for Assistance to MSMEs.');
      criteria.push('15. Rent agreement between family members/blood relations will not be eligible.');
    }
    
    // If no specific schemes are selected, return default criteria
    if (criteria.length === 0) {
      return editableContent.eligibilityCriteria;
    }
    
    return criteria;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden pdf-modal-bg">
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
            <div className="border border-gray-300 shadow-lg mx-auto pdf-preview-container pdf-modal-bg">
              {/* PDF Content */}
              <div className="p-8 text-black pdf-content pdf-modal-bg">
                
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
                    <div className="text-base font-bold text-gray-800 py-2 px-4 w-full text-center pdf-commercial-offer-header">
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
                      onBlur={(e: React.FocusEvent<HTMLSpanElement>) => handleContentChange('subjectLine', e.target.textContent || '')}
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
                      editableData.schemes.map((scheme: string, index: number) => {
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
                    
                    {/* Note Row - Merged */}
                    <div className="border-b border-black bg-blue-100">
                      <div className="text-xs p-2 text-center font-bold text-red-600">
                        Note: - DOCP means Date of commercial production
                      </div>
                    </div>
                  </div>
                </div>

                {/* SGST Subsidy Benefits - Only show when SGST Subsidy is selected */}
                {editableData.schemes.includes('SGST Subsidy') && (
                  <div className="mb-6">
                    <div className="text-xs font-bold mb-3">SGST Application Procedure Stages</div>
                    <div className="text-xs">
                      <div>Stage 1 Registration for FEC Certificate</div>
                      <div>Stage 2 Department issue FEC certificate.</div>
                      <div>Stage 3 Claims for benefits.</div>
                    </div>
                  </div>
                )}

                {/* Work Scope */}
                <div className="mb-6">
                  <div className="text-xs font-bold mb-3">WORK SCOPE</div>
                  <div className="border border-black rounded bg-blue-100">
                    {/* Table Header */}
                    <div className="flex bg-blue-100 border-b border-black">
                      <div className="w-16 text-xs font-bold p-2 border-r border-black text-center">Sr. No</div>
                      <div className="w-[30%] text-xs font-bold p-2 border-r border-black text-center">Work description</div>
                      <div className="w-[70%] text-xs font-bold p-2 text-center">Work scope</div>
                    </div>
                    
                    {/* Table Row */}
                    <div className="flex border-b border-black">
                      <div className="w-16 text-xs p-2 border-r border-black text-center">1</div>
                      <div className="w-[30%] text-xs p-2 border-r border-black">
                        {getDynamicWorkDescription()}
                      </div>
                      <div className="w-[70%] text-xs p-2">
                        <div className="space-y-1">
                          <div>• Basic doc&apos;s collection as per check list.</div>
                          <div>• Check eligibility as per scheme norms.</div>
                          <div>• Application to concern dept. online in Govt portal within stipulated time line.</div>
                          <div>• Query solving & hearing support as and when required.</div>
                          <div>• Liaison with dept. as and when required.</div>
                          <div>• Support in inspection.</div>
                          <div>• Exemption certificate issuance.</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Our Fees */}
                <div className="mb-6">
                  <div className="text-xs font-bold mb-3">OUR FEES</div>
                  
                  {editableData.schemes.length > 0 ? (
                    <div className="border border-black rounded bg-blue-100">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-blue-100">
                            <th className="text-xs font-bold p-2 border border-black text-left">Scheme Name</th>
                            <th className="text-xs font-bold p-2 border border-black text-right">Our Fees</th>
                            <th className="text-xs font-bold p-2 border border-black text-center">Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {editableData.schemes.map((scheme: string, index: number) => {
                            const feeType = editableData.feeTypes?.[scheme] || 'percentage';
                            const fee = editableData.fees[scheme] || 0;
                            const percentage = editableData.percentages?.[scheme] || 0;
                            
                            // Use the selected fee type to determine what to show
                            const displayValue = feeType === 'fee' ? fee : percentage;
                            const displaySymbol = feeType === 'fee' ? '₹' : '%';
                            
                            return (
                              <tr key={scheme} className="bg-blue-100">
                                <td className="text-xs p-2 border border-black">
                                  {index + 1}. {scheme}
                                </td>
                                <td className="text-xs p-2 border border-black text-right">
                                  <div
                                    contentEditable
                                    suppressContentEditableWarning
                                    onBlur={(e: React.FocusEvent<HTMLDivElement>) => {
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
                                    {displayValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{displaySymbol}
                                  </div>
                                </td>
                                <td className="text-xs p-2 border border-black text-center">
                                  {feeType === 'fee' ? 'One time' : 'Of subsidy amount'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500">No schemes selected</div>
                  )}
                </div>

                {/* Eligibility Criteria */}
                <div className="mb-6">
                  <div className="text-xs font-bold mb-3">ELIGIBILITY CRITERIA</div>
                  <div className="space-y-1 text-xs">
                    {getDynamicEligibilityCriteria().map((item, index) => (
                      <div
                        key={index}
                        className="pdf-input-min-height"
                        dangerouslySetInnerHTML={{ __html: item }}
                      />
                    ))}
                  </div>
                </div>

                {/* Duty Of Client */}
                <div className="mb-6">
                  <div className="text-xs font-bold mb-3">DUTY OF CLIENT</div>
                  <div className="space-y-1 text-xs">
                    <div>1. To provide all required documents within stipulated timeline.</div>
                    <div>2. To inform immediate once you receive the query letter from concern department and to give support in personal hearing if any technical clarification required.</div>
                  </div>
                </div>

                {/* Terms & Conditions */}
                <div className="mb-6">
                  <div className="text-xs font-bold mb-3">TERMS & CONDITIONS</div>
                  <div className="space-y-1 text-xs">
                    <div>1. Once the FEE is finalized, there will be NO CHANGES made to it and it will be considered as full and final.</div>
                    <div>2. We will affix your company&apos;s authorized seal on all documents related to the subsidy and then sign them. This is exclusively for the subsidy.</div>
                    <div>3. We shall strive maximum to avail benefit under the said scheme however we do not guarantee the end results or outcome as this is a Government Scheme, which depends upon the policy framework and changes coming from time to time, as well as the documents provided to us.</div>
                    <div>4. This offer is valid till 7 days from the date of initial communication.</div>
                    <div>5. Subsidy will be as per Govt norms – Main GR of particular scheme is base for any clarification.</div>
                    <div>6. All the required document and certification must provide by client side. If any extra docs/Certificate (Chartered accountant) is required then expenses will be bear by client.</div>
                    <div>7. Above fees consist our consulting fees and out of pocket expenses/ liaison cost.</div>
                    <div>8. We as consultant is not responsible for lesser/higher subsidy amount released, it will be based on Government Norms and calculation as per Portal.</div>
                    {(() => {
                      let termNumber = 9;
                      const terms = [];
                      
                      
                      // SGST Subsidy Specific
                      if (editableData.schemes.includes('SGST Subsidy')) {
                        terms.push(
                          <div key={termNumber}>
                            {termNumber}. In case of SGST PEC/FEC fees against completion of each stage. Payment within 2 days against SGST PEC/FEC /claim release.
                          </div>
                        );
                        termNumber++;
                      }
                      
                      // Power Connection Charges Specific
                      if (editableData.schemes.includes('Power Connection Charges')) {
                        terms.push(
                          <div key={termNumber}>
                            {termNumber}. Power connection charges Payment method is within 2 days from subsidy payment credit in your bank A/C.
                          </div>
                        );
                        termNumber++;
                      }
                      
                      // Electric Duty Exemption Specific (3 terms)
                      if (editableData.schemes.includes('Electric Duty Exemption')) {
                        terms.push(
                          <div key={termNumber}>
                            {termNumber}. In Electric Duty subsidy our service shall conclude as soon as the exemption certificate issued by dept
                          </div>
                        );
                        termNumber++;
                        terms.push(
                          <div key={termNumber}>
                            {termNumber}. Our work will continue until the duty is reduced to zero, and credit will be given as per the DISCOM rules and regulations. It depends on DISCOM funds
                          </div>
                        );
                        termNumber++;
                        terms.push(
                          <div key={termNumber}>
                            {termNumber}. Payment should be made by client within 2 days from exemption of electricity duty in light bill.
                          </div>
                        );
                        termNumber++;
                      }
                      
                      // Rent Subsidy Specific
                      if (editableData.schemes.includes('Rent')) {
                        terms.push(
                          <div key={termNumber}>
                            {termNumber}. In rent subsidy assistant payment method is within 2 days from subsidy released to your bank account.
                          </div>
                        );
                        termNumber++;
                      }
                      
                      // Remaining payment terms for Rent, SGST, Interest, Solar Subsidy
                      if (editableData.schemes.includes('Rent') || editableData.schemes.includes('SGST Subsidy') || editableData.schemes.includes('Interest Subsidy') || editableData.schemes.includes('Solar Subsidy')) {
                        terms.push(
                          <div key={termNumber}>
                            {termNumber}. Remaining part of Payment within 2 days subsidy released to your bank account.
                          </div>
                        );
                        termNumber++;
                      }
                      
                      return terms;
                    })()}
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
