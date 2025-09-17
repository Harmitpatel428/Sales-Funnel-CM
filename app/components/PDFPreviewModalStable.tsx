'use client';

import React, { useState, useEffect } from 'react';
import { MandateData, ConsultantInfo } from '../services/pdfServiceSimple';
import { formatSubjectLine, getSchemeDescription } from '../utils/schemeUtils';
import { generatePDF, generateWord } from '../utils/pdfGenerator';
import { setupPrintShortcut } from '../utils/printUtils';
import '../styles/pdf-styles.css';
import '../styles/print-styles.css';

interface PDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  mandateData: MandateData;
  consultantInfo: ConsultantInfo;
}

export default function PDFPreviewModalStable({
  isOpen,
  onClose,
  mandateData,
  consultantInfo
}: PDFPreviewModalProps) {
  const [editableData, setEditableData] = useState<MandateData>({
    ...mandateData,
    applicationFees: mandateData.applicationFees || 0,
    sanctioningFees: mandateData.sanctioningFees || 0,
    additionalFees: mandateData.additionalFees || [],
    customFeeName: mandateData.customFeeName || ''
  });
  const [editableConsultantInfo, setEditableConsultantInfo] = useState<ConsultantInfo>(consultantInfo);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isGeneratingWord, setIsGeneratingWord] = useState(false);

  // Update editable data when mandateData changes
  useEffect(() => {
    setEditableData({
      ...mandateData,
      applicationFees: mandateData.applicationFees || 0,
      sanctioningFees: mandateData.sanctioningFees || 0,
      additionalFees: mandateData.additionalFees || [],
      customFeeName: mandateData.customFeeName || ''
    });
  }, [mandateData]);

  useEffect(() => {
    setEditableConsultantInfo(consultantInfo);
  }, [consultantInfo]);

  // Add keyboard event listener for Ctrl+P/Cmd+P
  useEffect(() => {
    if (!isOpen) return;
    
    const cleanup = setupPrintShortcut();
    
    return cleanup;
  }, [isOpen]);

  if (!isOpen) return null;

  const formatDate = (): string => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${day}-${month}-${year}`;
  };


  const handleDownloadPDF = async () => {
    if (isGeneratingPDF) return;
    
    try {
      setIsGeneratingPDF(true);
      console.log('Starting PDF generation...');
      
      if (typeof window === 'undefined') {
        throw new Error('PDF generation only available in browser environment');
      }
      
      await generatePDF(editableData, editableConsultantInfo, {
        subjectLine: formatSubjectLine(editableData.schemes, editableData.policy, editableData.typeOfCase),
        workScope: [
          'Assessment of eligibility for various government subsidy schemes under Atmanirbhar Gujarat Scheme 2022.',
          'Preparation and submission of all required documents and applications.',
          'Liaison with concerned government departments and agencies.',
          'Follow-up on application status and expedite approvals.',
          'Guidance on compliance requirements and procedures.',
          'Support for any additional documentation or clarifications required.',
          'Regular updates on the progress of applications.'
        ],
        eligibilityCriteria: getDynamicEligibilityCriteria(),
        termsAndConditions: getDynamicTermsAndConditions(),
        dutyOfClient: 'To provide all required documents within stipulated timeline and inform immediately once you receive the query letter from concern department and to give support in personal hearing if any technical clarification required.',
        proposedBenefits: 'Various government subsidy schemes under Atmanirbhar Gujarat Scheme 2022 including Capital Subsidy, Interest Subsidy, Electric Duty Exemption, and other applicable benefits.'
      }, `Commercial_Offer_${editableData.company}_${formatDate()}.pdf`);
      
      console.log('PDF generation completed successfully');
      
    } catch (error) {
      console.error('PDF generation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Error generating PDF: ${errorMessage}. Please try again.`);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleDownloadWord = async () => {
    if (isGeneratingWord) return;
    
    try {
      setIsGeneratingWord(true);
      console.log('Starting Word document generation...');
      
      if (typeof window === 'undefined') {
        throw new Error('Word generation only available in browser environment');
      }
      
      await generateWord(editableData, editableConsultantInfo, {
        subjectLine: formatSubjectLine(editableData.schemes, editableData.policy, editableData.typeOfCase),
        workScope: [
          'Assessment of eligibility for various government subsidy schemes under Atmanirbhar Gujarat Scheme 2022.',
          'Preparation and submission of all required documents and applications.',
          'Liaison with concerned government departments and agencies.',
          'Follow-up on application status and expedite approvals.',
          'Guidance on compliance requirements and procedures.',
          'Support for any additional documentation or clarifications required.',
          'Regular updates on the progress of applications.'
        ],
        eligibilityCriteria: getDynamicEligibilityCriteria(),
        termsAndConditions: getDynamicTermsAndConditions(),
        dutyOfClient: 'To provide all required documents within stipulated timeline and inform immediately once you receive the query letter from concern department and to give support in personal hearing if any technical clarification required.',
        proposedBenefits: 'Various government subsidy schemes under Atmanirbhar Gujarat Scheme 2022 including Capital Subsidy, Interest Subsidy, Electric Duty Exemption, and other applicable benefits.'
      }, `Commercial_Offer_${editableData.company}_${formatDate()}.docx`);
      
      console.log('Word document generation completed successfully');
      
    } catch (error) {
      console.error('Word generation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Error generating Word document: ${errorMessage}. Please try again.`);
    } finally {
      setIsGeneratingWord(false);
    }
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
    
    if (editableData.policy === 'Atmanirbhar Gujarat Scheme MSMEs 2022' && editableData.category) {
      const romanCategory = toRomanNumeral(parseInt(editableData.category));
      return `${policyText} (Taluka Category ${romanCategory})`;
    }
    
    return policyText;
  };

  // Function to get benefit details based on scheme and taluka category
  const getBenefitDetails = (scheme: string, category: string): string => {
    if (scheme === 'Capital Subsidy' && category) {
      switch (category) {
        case '1': return '25% of Term Loan, up to ₹35 lakhs';
        case '2': return '20% of Term Loan, up to ₹30 lakhs';
        case '3': return '10% of Term Loan, up to ₹10 lakhs';
        default: return 'Benefit details as per taluka category';
      }
    }

    if (scheme === 'Interest Subsidy' && category) {
      switch (category) {
        case '1': return '7% subsidy, max ₹35 lakhs/year';
        case '2': return '6% subsidy, max ₹30 lakhs/year';
        case '3': return '5% subsidy, max ₹25 lakhs/year';
        default: return 'Interest subsidy as per taluka category';
      }
    }

    if (scheme === 'SGST Subsidy' && category) {
      switch (category) {
        case '1': return '100% of net SGST for up to 7.5% of eFCI PA';
        case '2': return '90% of net SGST for upto 6.5% of eFCI p.a.';
        case '3': return '80% of net SGST for up to 5% of eFCI PA';
        default: return 'SGST reimbursement as per taluka category';
      }
    }

    if (scheme === 'Electric Duty Exemption') return '100% exemption on electricity duty';
    if (scheme === 'Power Connection Charges') return '35% of DISCOM charges (Maximum 5 Lakhs)';

    if (scheme === 'Solar Subsidy' && category) {
      switch (category) {
        case '1': return '7% subsidy, max ₹35 lakhs/year';
        case '2': return '6% subsidy, max ₹30 lakhs/year';
        case '3': return '5% subsidy, max ₹25 lakhs/year';
        default: return 'Solar subsidy as per taluka category';
      }
    }

    if (scheme === 'Rent') return '65% of rent amount (Maximum 1 Lakh) - PA';

    const schemeDesc = getSchemeDescription(scheme);
    return schemeDesc?.description[0] || 'Benefit details';
  };

  // Function to get duration based on scheme and taluka category
  const getDuration = (scheme: string, category: string): string => {
    if (scheme === 'Interest Subsidy' && category) {
      switch (category) {
        case '1': return '7 Years';
        case '2': return '6 Years';
        case '3': return '5 Years';
        default: return 'As per scheme';
      }
    }

    if (scheme === 'Solar Subsidy' && category) {
      switch (category) {
        case '1': return '7 Years';
        case '2': return '6 Years';
        case '3': return '5 Years';
        default: return 'As per scheme';
      }
    }

    if (scheme === 'SGST Subsidy' && category) return '10 Years';
    if (scheme === 'Capital Subsidy') return 'One Time Benefit';
    if (scheme === 'Power Connection Charges') return 'One Time Benefit';
    if (scheme === 'Electric Duty Exemption') return '5 Years';
    if (scheme === 'Rent') return '5 Years';
    
    return 'As per scheme';
  };

  // Function to get application timeline based on scheme
  const getApplicationTimeline = (scheme: string): string => {
    if (scheme === 'Capital Subsidy' || scheme === 'Interest Subsidy') {
      return 'Within 1 year from DOCP or First disbursement';
    }

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

    const benefitLetters = editableData.schemes.map((_: string, index: number) => 
      String.fromCharCode(65 + index)
    ).join(', ');

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
      return [
        '1. All services are subject to client cooperation and timely provision of required documents.',
        '2. Fees are payable as per agreed terms and conditions.',
        '3. We reserve the right to modify our services based on changing government policies.'
      ];
    }
    
    return criteria;
  };

  // Function to get dynamic terms and conditions based on selected schemes
  const getDynamicTermsAndConditions = (): string[] => {
    const terms: string[] = [
      '1. Once the FEE is finalized, there will be NO CHANGES made to it and it will be considered as full and final.',
      '2. We will affix your company\'s authorized seal on all documents related to the subsidy and then sign them. This is exclusively for the subsidy.',
      '3. We shall strive maximum to avail benefit under the said scheme however we do not guarantee the end results or outcome as this is a Government Scheme, which depends upon the policy framework and changes coming from time to time, as well as the documents provided to us.',
      '4. This offer is valid till 7 days from the date of initial communication.',
      '5. Subsidy will be as per Govt norms – Main GR of particular scheme is base for any clarification.',
      '6. All the required document and certification must provide by client side. If any extra docs/Certificate (Chartered accountant) is required then expenses will be bear by client.',
      '7. Above fees consist our consulting fees and out of pocket expenses/ liaison cost.',
      '8. We as consultant is not responsible for lesser/higher subsidy amount released, it will be based on Government Norms and calculation as per Portal.'
    ];

    let termNumber = 9;
    
    // SGST Subsidy Specific
    if (editableData.schemes.includes('SGST Subsidy')) {
      terms.push(
        `${termNumber}. In case of SGST PEC/FEC fees against completion of each stage. Payment within 2 days against SGST PEC/FEC /claim release.`
      );
      termNumber++;
    }
    
    // Power Connection Charges Specific
    if (editableData.schemes.includes('Power Connection Charges')) {
      terms.push(
        `${termNumber}. Power connection charges Payment method is within 2 days from subsidy payment credit in your bank A/C.`
      );
      termNumber++;
    }
    
    // Electric Duty Exemption Specific (3 terms)
    if (editableData.schemes.includes('Electric Duty Exemption')) {
      terms.push(
        `${termNumber}. In Electric Duty subsidy our service shall conclude as soon as the exemption certificate issued by dept`
      );
      termNumber++;
      terms.push(
        `${termNumber}. Our work will continue until the duty is reduced to zero, and credit will be given as per the DISCOM rules and regulations. It depends on DISCOM funds`
      );
      termNumber++;
      terms.push(
        `${termNumber}. Payment should be made by client within 2 days from exemption of electricity duty in light bill.`
      );
      termNumber++;
    }
    
    // Rent Subsidy Specific
    if (editableData.schemes.includes('Rent')) {
      terms.push(
        `${termNumber}. In rent subsidy assistant payment method is within 2 days from subsidy released to your bank account.`
      );
      termNumber++;
    }
    
    // Remaining payment terms for Rent, SGST, Interest, Solar Subsidy
    if (editableData.schemes.includes('Rent') || editableData.schemes.includes('SGST Subsidy') || editableData.schemes.includes('Interest Subsidy') || editableData.schemes.includes('Solar Subsidy')) {
      terms.push(
        `${termNumber}. Remaining part of Payment within 2 days subsidy released to your bank account.`
      );
      termNumber++;
    }
    
    return terms;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden pdf-modal-bg">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-semibold text-gray-900">PDF Preview - Mandate Document</h2>
              <div className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                Press <kbd className="px-1 py-0.5 bg-white border border-gray-300 rounded text-xs">Ctrl+P</kbd> to print
              </div>
            </div>
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
            <div id="pdf-preview" className="border border-gray-300 shadow-lg mx-auto pdf-preview-container pdf-modal-bg pdf-preview-styled">
              
              {/* Fixed Header for Print/PDF */}
              <header className="pdf-header hidden print:block">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    V4U
                  </div>
                  <div className="text-sm text-blue-600 mb-2">
                    Biz Solutions
                  </div>
                  <div className="text-base font-bold text-gray-800">
                    Commercial Offer for Subsidy Work
                  </div>
                </div>
              </header>

              {/* PDF Content */}
              <div className="p-8 text-black pdf-content pdf-modal-bg pdf-content-styled">
                
                {/* Document Header - Hidden in print/PDF */}
                <div className="mb-6 print:hidden">
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
                    <span className="ml-1">
                      {formatSubjectLine(editableData.schemes, editableData.policy, editableData.typeOfCase)}
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
                <div className="mb-4">
                  <div className="text-xs font-bold mb-2">WORK DESCRIPTION & PROPOSED BENEFITS</div>
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
                        const benefitCategory = `Benefit - ${String.fromCharCode(65 + index)}`;
                        
                        return (
                          <div key={scheme} className="flex border-b border-black bg-white">
                            <div className="w-20 text-xs p-2 border-r border-black text-center font-bold bg-white">
                              {benefitCategory}
                            </div>
                            <div className="w-32 text-xs p-2 border-r border-black bg-white">
                              {schemeDesc?.title || scheme}
                            </div>
                            <div className="flex-1 text-xs p-2 border-r border-black bg-white">
                              {getBenefitDetails(scheme, editableData.category)}
                            </div>
                            <div className="w-20 text-xs p-2 border-r border-black text-center bg-white">
                              {getDuration(scheme, editableData.category)}
                            </div>
                            <div className="flex-1 text-xs p-2 text-center bg-white">
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
                  <div className="mb-3">
                    <div className="text-xs font-bold mb-2">SGST Application Procedure Stages</div>
                    <div className="text-xs">
                      <div>Stage 1 Registration for FEC Certificate</div>
                      <div>Stage 2 Department issue FEC certificate.</div>
                      <div>Stage 3 Claims for benefits.</div>
                    </div>
                  </div>
                )}

                {/* Work Scope */}
                <div className="mb-4 work-scope-section">
                  <div className="text-xs font-bold mb-2">WORK SCOPE</div>
                  <div className="border border-black rounded bg-blue-100">
                    {/* Table Header */}
                    <div className="flex bg-blue-100 border-b border-black">
                      <div className="w-16 text-xs font-bold p-2 border-r border-black text-center">Sr. No</div>
                      <div className="w-[30%] text-xs font-bold p-2 border-r border-black text-center">Work description</div>
                      <div className="w-[70%] text-xs font-bold p-2 text-center">Work scope</div>
                    </div>
                    
                    {/* Table Row */}
                    <div className="flex border-b border-black bg-white">
                      <div className="w-16 text-xs p-2 border-r border-black text-center bg-white">1</div>
                      <div className="w-[30%] text-xs p-2 border-r border-black bg-white">
                        {getDynamicWorkDescription()}
                      </div>
                      <div className="w-[70%] text-xs p-2 bg-white">
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
                <div className="mb-4">
                  <div className="text-xs font-bold mb-2">OUR FEES</div>
                  
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
                            
                            const displayValue = feeType === 'fee' ? fee : percentage;
                            const displaySymbol = feeType === 'fee' ? '₹' : '%';
                            
                            return (
                              <tr key={scheme} className="bg-white">
                                <td className="text-xs p-2 border border-black bg-white">
                                  {index + 1}. {scheme}
                                </td>
                                <td className="text-xs p-2 border border-black text-right bg-white">
                                  {displayValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{displaySymbol}
                                </td>
                                <td className="text-xs p-2 border border-black text-center bg-white">
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
                  
                  {/* Custom Fee Display - Show exactly as in screenshot */}
                  {editableData.customFeeName && (
                    <div className="mt-4 text-xs">
                      <div className="text-xs">
                        {(() => {
                          const customFeeText = editableData.customFeeName;
                          
                          // Check if the text contains stage patterns - improved regex
                          const stagePattern = /Stage[- ]*(\d+)[:.\-\s]*(.*?)(?=Stage[- ]*\d+|$)/gis;
                          const stages = [];
                          let match;
                          
                          while ((match = stagePattern.exec(customFeeText)) !== null) {
                            const stageNumber = match[1];
                            const stageContent = match[2].trim();
                            if (stageContent) {
                              stages.push({ number: stageNumber, content: stageContent });
                            }
                          }
                          
                          // If stages are detected, display them exactly like screenshot
                          if (stages.length > 0) {
                            return (
                              <div>
                                <div className="mb-2 font-bold">PEC/FEC Stages wise fees (Additional Fees)</div>
                                {stages.map((stage, index) => (
                                  <div key={index} className="mb-1">
                                    <span className="font-bold">Stage-{stage.number}:</span> 
                                    <div className="ml-0">
                                      {stage.content.split('\n').map((line, lineIndex) => (
                                        <div key={lineIndex} className={lineIndex > 0 ? "mt-1" : ""}>
                                          {line}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          } else {
                            // If no stages detected, display as single item with line breaks preserved
                            return (
                              <div>
                                {customFeeText.split('\n').map((line, index) => (
                                  <div key={index} className="mb-1">
                                    {line}
                                  </div>
                                ))}
                              </div>
                            );
                          }
                        })()}
                      </div>
                    </div>
                  )}
                  
                  {/* Additional Fees - Only show when there are additional fees */}
                  {editableData.additionalFees && editableData.additionalFees.length > 0 && (
                    <div className="mt-4 text-xs additional-fees-section">
                      <div className="font-bold mb-2">Additional Fees:</div>
                      <div className="space-y-1 text-xs">
                        {editableData.additionalFees.map((fee, index) => {
                          const displayValue = fee.feeType === 'fee' ? fee.amount : fee.amount;
                          const displaySymbol = fee.feeType === 'fee' ? '₹' : '%';
                          const stageNumber = index + 1;
                          
                          return (
                            <div key={fee.id} className="text-xs">
                              Stage {stageNumber}: {fee.name} {displayValue.toLocaleString('en-IN')}{displaySymbol}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment Method */}
                {(editableData.applicationFees > 0 && editableData.sanctioningFees > 0) && (
                  <div className="mb-4 payment-method-section">
                    <div className="text-xs font-bold mb-2">PAYMENT METHOD</div>
                    
                    <div className="text-xs">
                      Processing fees application to sanctions of Rs.{editableData.applicationFees.toLocaleString('en-IN')}/- (non-adjustable) at the time of assignment finalization, Rs.{editableData.sanctioningFees.toLocaleString('en-IN')}/- (adjustable) against sanction of subsidy and rest against fund release.
                    </div>
                  </div>
                )}

                {/* Eligibility Criteria */}
                <div className="mb-4">
                  <div className="text-xs font-bold mb-2">ELIGIBILITY CRITERIA</div>
                  <div className="space-y-1 text-xs">
                    {getDynamicEligibilityCriteria().map((item, index) => (
                      <div key={index} className="pdf-input-min-height">
                        {item.includes('<span') ? (
                          <div dangerouslySetInnerHTML={{ __html: item }} />
                        ) : (
                          item
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Duty Of Client */}
                <div className="mb-4">
                  <div className="text-xs font-bold mb-2">DUTY OF CLIENT</div>
                  <div className="space-y-1 text-xs">
                    <div>1. To provide all required documents within stipulated timeline.</div>
                    <div>2. To inform immediate once you receive the query letter from concern department and to give support in personal hearing if any technical clarification required.</div>
                  </div>
                </div>

                {/* Terms & Conditions */}
                <div className="mb-4 page-break-before">
                  <div className="text-xs font-bold mb-2">TERMS & CONDITIONS</div>
                  <div className="space-y-1 text-xs">
                    {getDynamicTermsAndConditions().map((item, index) => (
                      <div key={index} className="pdf-input-min-height">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="text-center">
                  <div className="text-xs font-bold">APPROVED & AUTHORIZED BY (Sign and Stamp)</div>
                </div>
              </div>

              {/* Fixed Footer for Print/PDF */}
              <footer className="pdf-footer hidden print:block">
                <div className="text-center">
                  <div className="text-xs text-gray-500">
                    Confidential – V4U Biz Solutions
                  </div>
                </div>
              </footer>
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
            
            {/* Download Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={handleDownloadPDF}
                disabled={isGeneratingPDF}
                className={`px-4 py-2 rounded-lg transition-colors duration-200 font-medium flex items-center ${
                  isGeneratingPDF 
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {isGeneratingPDF ? (
                  <>
                    <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                    Download PDF
                  </>
                )}
              </button>
              <button
                onClick={handleDownloadWord}
                disabled={isGeneratingWord}
                className={`px-4 py-2 rounded-lg transition-colors duration-200 font-medium flex items-center ${
                  isGeneratingWord 
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isGeneratingWord ? (
                  <>
                    <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating Word...
                  </>
                ) : (
                  <>
                    <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                    Download Word
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
