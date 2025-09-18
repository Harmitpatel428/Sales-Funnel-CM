'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MandateData, ConsultantInfo } from '../services/pdfServiceSimple';
import { formatSubjectLine, getSchemeDescription } from '../utils/schemeUtils';
import { generatePDF, generateWord, printPreview } from '../utils/pdfGenerator';
import LoadingSpinner from './LoadingSpinner';
import AccessibleModal from './AccessibleModal';
import ModalErrorBoundary from './ModalErrorBoundary';
import '../styles/print.css';
// DocumentGenerator will be imported dynamically to avoid SSR issues

interface PDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  mandateData: MandateData;
  consultantInfo: ConsultantInfo;
}

export default function PDFPreviewModal({
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
  const [error, setError] = useState<string | null>(null);
  
  const formatDate = (): string => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${day}-${month}-${year}`;
  };
  
  const [editableContent, setEditableContent] = useState({
    subjectLine: '',
    salutation: 'Dear Sir,',
    openingParagraph: 'With reference to above said subject & as per discussion with Mr {clientName} sir hereby we are sending our commercial offer and scope of work.',
    detailsHeader: 'Details of Proposed Firm are as under:',
    benefitsHeader: 'WORK DESCRIPTION & PROPOSED BENEFITS',
    policyHeader: '',
    benefitsColumnHeader: 'Benefits',
    subsidyNameColumnHeader: 'Subsidy Name',
    benefitDetailsColumnHeader: 'Benefit Details',
    durationColumnHeader: 'Duration',
    applicationTimelineColumnHeader: 'Application Time Line',
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
    ],
    dutyOfClient: [
      'To provide all required documents within stipulated timeline.',
      'To inform immediate once you receive the query letter from concern department and to give support in personal hearing if any technical clarification required.'
    ],
    proposedBenefits: 'Various government subsidy schemes under Atmanirbhar Gujarat Scheme 2022 including Capital Subsidy, Interest Subsidy, Electric Duty Exemption, and other applicable benefits.',
    sgstProcedureHeader: 'SGST Application Procedure Stages',
    sgstStage1: 'Stage 1 Registration for FEC Certificate',
    sgstStage2: 'Stage 2 Department issue FEC certificate.',
    sgstStage3: 'Stage 3 Claims for benefits.',
    paymentMethodHeader: 'PAYMENT METHOD',
    paymentMethodText: '',
    additionalFeesHeader: 'Additional Fees:',
    footerText: 'APPROVED & AUTHORIZED BY (Sign and Stamp)',
    commercialOfferHeader: 'Commercial Offer for Subsidy Work',
    companyName: 'V4U',
    companyTagline: 'Biz Solutions',
    documentDate: formatDate()
  });

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

  // Update editable data when mandateData changes
  useEffect(() => {
    setEditableData({
      ...mandateData,
      applicationFees: mandateData.applicationFees || 0,
      sanctioningFees: mandateData.sanctioningFees || 0,
      additionalFees: mandateData.additionalFees || [],
      customFeeName: mandateData.customFeeName || ''
    });
    setEditableContent((prev) => ({
      ...prev,
      subjectLine: formatSubjectLine(mandateData.schemes, mandateData.policy, mandateData.typeOfCase),
      policyHeader: getPolicyHeaderText()
    }));
  }, [mandateData]);

  useEffect(() => {
    setEditableConsultantInfo(consultantInfo);
  }, [consultantInfo]);

  // Add keyboard event listener for Ctrl+P/Cmd+P
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'p') {
        event.preventDefault();
        handlePrint();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!isOpen) return null;


  const handleFieldChange = (field: keyof MandateData, value: string | string[] | { [schemeName: string]: number } | any[]) => {
    setEditableData((prev: MandateData) => ({
      ...prev,
      [field]: value
    }));
    
    // Update subject line when schemes or typeOfCase change
    if (field === 'schemes' || field === 'typeOfCase') {
      const updatedData = { ...editableData, [field]: value };
      setEditableContent((prev) => ({
        ...prev,
        subjectLine: formatSubjectLine(updatedData.schemes, updatedData.policy, updatedData.typeOfCase)
      }));
    }
  };


  // Note: Scheme selection is now handled in the main form, not in the preview modal

  const handleContentChange = (field: keyof typeof editableContent, value: string | string[]) => {
    setEditableContent((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  // Helper functions for managing editable lists
  const addListItem = (field: 'workScope' | 'termsAndConditions' | 'dutyOfClient' | 'eligibilityCriteria', item: string = '') => {
    setEditableContent((prev) => ({
      ...prev,
      [field]: [...(prev[field] as string[]), item]
    }));
  };

  const removeListItem = (field: 'workScope' | 'termsAndConditions' | 'dutyOfClient' | 'eligibilityCriteria', index: number) => {
    setEditableContent((prev) => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index)
    }));
  };

  const updateListItem = (field: 'workScope' | 'termsAndConditions' | 'dutyOfClient' | 'eligibilityCriteria', index: number, value: string) => {
    setEditableContent((prev) => ({
      ...prev,
      [field]: (prev[field] as string[]).map((item, i) => i === index ? value : item)
    }));
  };

  // Handle scheme selection within modal
  const handleSchemeToggle = (scheme: string) => {
    const isSelected = editableData.schemes.includes(scheme);
    let newSchemes: string[];
    let newFees: { [schemeName: string]: number };
    let newPercentages: { [schemeName: string]: number };
    let newFeeTypes: { [schemeName: string]: 'fee' | 'percentage' };

    if (isSelected) {
      // Remove scheme
      newSchemes = editableData.schemes.filter(s => s !== scheme);
      newFees = { ...editableData.fees };
      newPercentages = { ...editableData.percentages };
      newFeeTypes = { ...editableData.feeTypes };
      delete newFees[scheme];
      delete newPercentages[scheme];
      delete newFeeTypes[scheme];
    } else {
      // Add scheme
      newSchemes = [...editableData.schemes, scheme];
      newFees = { ...editableData.fees, [scheme]: 0 };
      newPercentages = { ...editableData.percentages, [scheme]: 0 };
      newFeeTypes = { ...editableData.feeTypes, [scheme]: 'percentage' };
    }

    setEditableData(prev => ({
      ...prev,
      schemes: newSchemes,
      fees: newFees,
      percentages: newPercentages,
      feeTypes: newFeeTypes
    }));
  };

  // Removed unused handleListEdit function

  const handleDownloadPDF = async () => {
    if (isGeneratingPDF) return; // Prevent multiple simultaneous generations
    
    try {
      setIsGeneratingPDF(true);
      setError(null); // Clear any previous errors
      
      // Check if we're in browser environment
      if (typeof window === 'undefined') {
        throw new Error('PDF generation only available in browser environment');
      }
      
      // Verify PDF preview element exists and has content
      const pdfElement = document.getElementById("pdf-preview");
      if (!pdfElement) {
        throw new Error("PDF preview element not found");
      }
      
      // Log content verification
      const tables = pdfElement.querySelectorAll('table, .print-flex-table');
      const sections = pdfElement.querySelectorAll('.print-content > div');
      console.log(`PDF Preview contains: ${tables.length} tables, ${sections.length} sections`);
      console.log(`PDF Preview height: ${pdfElement.scrollHeight}px`);
      
      // Use pixel-perfect generator for exact styling match
      await generatePDF(editableData, editableConsultantInfo, editableContent, `Commercial_Offer_${editableData.company}_${formatDate()}.pdf`);
      
      // PDF generation completed successfully
      console.log('PDF generation completed successfully');
      
    } catch (error) {
      console.error('PDF generation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`PDF generation failed: ${errorMessage}. Please try again.`);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePrint = () => {
    try {
      printPreview();
    } catch (error) {
      console.error('Print failed:', error);
      setError('Print failed. Please try again.');
    }
  };

  const handleDownloadWord = async () => {
    if (isGeneratingWord) return; // Prevent multiple simultaneous generations
    
    try {
      setIsGeneratingWord(true);
      setError(null); // Clear any previous errors
      // Starting Word document generation
      
      // Check if we're in browser environment
      if (typeof window === 'undefined') {
        throw new Error('Word generation only available in browser environment');
      }
      
      // Use pixel-perfect generator for Word generation
      await generateWord(editableData, editableConsultantInfo, editableContent, `Commercial_Offer_${editableData.company}_${formatDate()}.docx`);
      
      // Word document generation completed successfully
      
    } catch (error) {
      console.error('Word generation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Word generation failed: ${errorMessage}. Please try again.`);
    } finally {
      setIsGeneratingWord(false);
    }
  };

  // Function to get benefit details based on scheme and taluka category
  const getBenefitDetails = useCallback((scheme: string, category: string): string => {
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
  }, []);

  // Function to get duration based on scheme and taluka category
  const getDuration = useCallback((scheme: string, category: string): string => {
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
  }, []);

  // Function to get application timeline based on scheme
  const getApplicationTimeline = useCallback((scheme: string): string => {
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
  }, []);

  // Function to generate dynamic work description based on current benefits
  const getDynamicWorkDescription = useMemo((): string => {
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
  }, [editableData.schemes]);

  // Function to get dynamic eligibility criteria based on selected schemes
  const getDynamicEligibilityCriteria = useMemo((): string[] => {
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
  }, [editableData.schemes, editableContent.eligibilityCriteria]);

  return (
    <ModalErrorBoundary>
      <AccessibleModal
        isOpen={isOpen}
        onClose={onClose}
        title="PDF Preview - Mandate Document"
        size="xl"
        className="max-h-[90vh] overflow-hidden"
      >
        <div className="rounded-lg shadow-xl w-full max-h-[90vh] overflow-hidden bg-white">
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
          
          {/* Scheme Selection */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">Edit Schemes</h3>
              <span className="text-xs text-gray-500">{editableData.schemes.length} selected</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                'Capital Subsidy',
                'Interest Subsidy',
                'SGST Subsidy',
                'Rent',
                'Power Connection Charges',
                'Electric Duty Exemption',
                'Solar Subsidy'
              ].map((scheme) => (
                <button
                  key={scheme}
                  onClick={() => handleSchemeToggle(scheme)}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors duration-200 ${
                    editableData.schemes.includes(scheme)
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {scheme}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Content - Scrollable PDF Preview */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6">
            {/* PDF Preview Container */}
            <div id="pdf-preview" className="border border-gray-300 shadow-lg mx-auto print-container">
              
              {/* Fixed Header for Print/PDF */}
              <header className="print-header">
                <div className="text-center">
                  <div className="print-title text-blue-600 mb-1">
                    V4U Biz Solutions
                  </div>
                  <div className="print-subtitle text-blue-600 mb-2">
                    Commercial Offer & Mandate Document
                  </div>
                  <div className="text-base font-bold text-gray-800">
                    Commercial Offer for Subsidy Work
                  </div>
                </div>
              </header>

              {/* PDF Content */}
              <div className="p-8 text-black print-content">
                
                {/* Document Header - Hidden in print/PDF */}
                <div className="mb-6 print:hidden">
                  {/* Company Logo */}
                  <div className="text-center mb-6 -mt-4">
                    <div className="mb-1">
                      <div className="text-5xl font-bold text-blue-600">
                        <div>
                          <span
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e: React.FocusEvent<HTMLSpanElement>) => handleContentChange('companyName', e.target.textContent || '')}
                            className="pdf-input focus:outline-none focus:bg-blue-50 focus:border focus:border-blue-300 rounded px-1 py-0.5 pdf-input-min-height"
                          >
                            V4U
                          </span>
                        </div>
                        <div className="text-base -mt-2">
                          <span
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e: React.FocusEvent<HTMLSpanElement>) => handleContentChange('companyTagline', e.target.textContent || '')}
                            className="pdf-input focus:outline-none focus:bg-blue-50 focus:border focus:border-blue-300 rounded px-1 py-0.5 pdf-input-min-height"
                          >
                            Biz Solutions
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Commercial Offer Container */}
                  <div className="mb-4 -mx-8">
                    <div className="text-base font-bold text-gray-800 py-2 px-4 w-full text-center pdf-commercial-offer-header">
                      <span
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e: React.FocusEvent<HTMLSpanElement>) => handleContentChange('commercialOfferHeader', e.target.textContent || '')}
                        className="pdf-input focus:outline-none focus:bg-blue-50 focus:border focus:border-blue-300 rounded px-1 py-0.5 pdf-input-min-height"
                      >
                        Commercial Offer for Subsidy Work
                      </span>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="text-right mb-4">
                    <span className="text-xs font-medium">
                      Date: <span
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e: React.FocusEvent<HTMLSpanElement>) => handleContentChange('documentDate', e.target.textContent || '')}
                        className="pdf-input focus:outline-none focus:bg-blue-50 focus:border focus:border-blue-300 rounded px-1 py-0.5 pdf-input-min-height"
                      >
                        {formatDate()}
                      </span>
                    </span>
                  </div>

                </div>

                {/* Client Details */}
                <div className="mb-6">
                  <div className="bg-blue-100 rounded-lg p-4 mb-4 w-1/2 border border-blue-300 shadow-lg">
                    <div className="text-sm font-bold mb-2">To,</div>
                    <div className="text-sm font-bold mb-1">
                      <span
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e: React.FocusEvent<HTMLSpanElement>) => handleFieldChange('company', e.target.textContent?.replace('M/S ', '') || '')}
                        className="pdf-input focus:outline-none focus:bg-blue-50 focus:border focus:border-blue-300 rounded px-1 py-0.5 pdf-input-min-height"
                      >
                        M/S {editableData.company}
                      </span>
                    </div>
                    <div className="text-sm font-bold mb-1">
                      Address: <span
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e: React.FocusEvent<HTMLSpanElement>) => handleFieldChange('address', e.target.textContent || '')}
                        className="pdf-input focus:outline-none focus:bg-blue-50 focus:border focus:border-blue-300 rounded px-1 py-0.5 pdf-input-min-height"
                      >
                        {editableData.address}
                      </span>
                    </div>
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
                  <div className="text-sm">
                    <span
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e: React.FocusEvent<HTMLSpanElement>) => handleContentChange('salutation', e.target.textContent || '')}
                      className="pdf-input focus:outline-none focus:bg-blue-50 focus:border focus:border-blue-300 rounded px-1 py-0.5 pdf-input-min-height"
                    >
                      Dear Sir,
                    </span>
                  </div>
                </div>

                {/* Opening Paragraph */}
                <div className="mb-6">
                  <div className="text-sm">
                    <span
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e: React.FocusEvent<HTMLSpanElement>) => handleContentChange('openingParagraph', e.target.textContent || '')}
                      className="pdf-input focus:outline-none focus:bg-blue-50 focus:border focus:border-blue-300 rounded px-1 py-0.5 pdf-input-min-height"
                    >
                      {editableContent.openingParagraph.replace('{clientName}', editableData.clientName)}
                    </span>
                  </div>
                </div>

                {/* Commercial Offer */}
                <div className="mb-6">
                  <div className="text-sm font-bold mb-3">
                    <span
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e: React.FocusEvent<HTMLSpanElement>) => handleContentChange('detailsHeader', e.target.textContent || '')}
                      className="pdf-input focus:outline-none focus:bg-blue-50 focus:border focus:border-blue-300 rounded px-1 py-0.5 pdf-input-min-height"
                    >
                      {editableContent.detailsHeader}
                    </span>
                  </div>
                  <div className="bg-blue-100 rounded-lg p-4 mb-4 w-1/2 border border-blue-300 shadow-lg">
                    <div className="text-sm font-bold mb-2">
                      Case name: <span
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e: React.FocusEvent<HTMLSpanElement>) => handleFieldChange('company', e.target.textContent?.replace('M/S ', '') || '')}
                        className="pdf-input focus:outline-none focus:bg-blue-50 focus:border focus:border-blue-300 rounded px-1 py-0.5 pdf-input-min-height"
                      >
                        M/S {editableData.company}
                      </span>
                    </div>
                    <div className="space-y-1 text-xs">
                      {editableData.typeOfCase && (
                        <div className="flex">
                          <span className="font-bold w-32">Type of Case:</span>
                          <span
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e: React.FocusEvent<HTMLSpanElement>) => handleFieldChange('typeOfCase', e.target.textContent || '')}
                            className="pdf-input focus:outline-none focus:bg-blue-50 focus:border focus:border-blue-300 rounded px-1 py-0.5 pdf-input-min-height"
                          >
                            {editableData.typeOfCase}
                          </span>
                        </div>
                      )}
                      {editableData.category && (
                        <div className="flex">
                          <span className="font-bold w-32">Taluka Category:</span>
                          <span
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e: React.FocusEvent<HTMLSpanElement>) => handleFieldChange('category', e.target.textContent || '')}
                            className="pdf-input focus:outline-none focus:bg-blue-50 focus:border focus:border-blue-300 rounded px-1 py-0.5 pdf-input-min-height"
                          >
                            {editableData.category}
                          </span>
                        </div>
                      )}
                      {editableData.projectCost && (
                        <div className="flex">
                          <span className="font-bold w-32">Cost of Project:</span>
                          <span
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e: React.FocusEvent<HTMLSpanElement>) => handleFieldChange('projectCost', e.target.textContent?.replace('₹. ', '').replace(' (Approx.)', '') || '')}
                            className="pdf-input focus:outline-none focus:bg-blue-50 focus:border focus:border-blue-300 rounded px-1 py-0.5 pdf-input-min-height"
                          >
                            ₹. {editableData.projectCost} (Approx.)
                          </span>
                        </div>
                      )}
                      {editableData.industriesType && (
                        <div className="flex">
                          <span className="font-bold w-32">Industries Type:</span>
                          <span
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e: React.FocusEvent<HTMLSpanElement>) => handleFieldChange('industriesType', e.target.textContent || '')}
                            className="pdf-input focus:outline-none focus:bg-blue-50 focus:border focus:border-blue-300 rounded px-1 py-0.5 pdf-input-min-height"
                          >
                            {editableData.industriesType}
                          </span>
                        </div>
                      )}
                      {editableData.termLoanAmount && (
                        <div className="flex">
                          <span className="font-bold w-32">Term Loan Amount:</span>
                          <span
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e: React.FocusEvent<HTMLSpanElement>) => handleFieldChange('termLoanAmount', e.target.textContent?.replace('₹. ', '') || '')}
                            className="pdf-input focus:outline-none focus:bg-blue-50 focus:border focus:border-blue-300 rounded px-1 py-0.5 pdf-input-min-height"
                          >
                            ₹. {editableData.termLoanAmount}
                          </span>
                        </div>
                      )}
                      {editableData.powerConnection && (
                        <div className="flex">
                          <span className="font-bold w-32">Power Connection:</span>
                          <span
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e: React.FocusEvent<HTMLSpanElement>) => handleFieldChange('powerConnection', e.target.textContent?.replace(' KVA', '') || '')}
                            className="pdf-input focus:outline-none focus:bg-blue-50 focus:border focus:border-blue-300 rounded px-1 py-0.5 pdf-input-min-height"
                          >
                            {editableData.powerConnection} KVA
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>


                {/* Proposed Benefits */}
                <div className="mb-4">
                  <div className="text-xs font-bold mb-2">
                    <span
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e: React.FocusEvent<HTMLSpanElement>) => handleContentChange('benefitsHeader', e.target.textContent || '')}
                      className="pdf-input focus:outline-none focus:bg-blue-50 focus:border focus:border-blue-300 rounded px-1 py-0.5 pdf-input-min-height"
                    >
                      {editableContent.benefitsHeader}
                    </span>
                  </div>
                  <div className="border border-black rounded bg-blue-100">
                    {/* Merged Header Row */}
                    <div className="bg-blue-100 border-b border-black">
                      <div className="text-xs font-bold p-2 text-center">
                        <span
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e: React.FocusEvent<HTMLSpanElement>) => handleContentChange('policyHeader', e.target.textContent || '')}
                          className="pdf-input focus:outline-none focus:bg-blue-50 focus:border focus:border-blue-300 rounded px-1 py-0.5 pdf-input-min-height"
                        >
                          {editableContent.policyHeader || getPolicyHeaderText()}
                        </span>
                      </div>
                    </div>
                    
                      {/* Table Header */}
                      <div className="print-flex-table border-b border-black bg-blue-100">
                        <div className="w-20 text-xs font-bold p-2 border-r border-black text-center">
                          <span
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e: React.FocusEvent<HTMLSpanElement>) => handleContentChange('benefitsColumnHeader', e.target.textContent || '')}
                            className="pdf-input focus:outline-none focus:bg-blue-50 focus:border focus:border-blue-300 rounded px-1 py-0.5 pdf-input-min-height"
                          >
                            {editableContent.benefitsColumnHeader}
                          </span>
                        </div>
                        <div className="w-32 text-xs font-bold p-2 border-r border-black text-center">
                          <span
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e: React.FocusEvent<HTMLSpanElement>) => handleContentChange('subsidyNameColumnHeader', e.target.textContent || '')}
                            className="pdf-input focus:outline-none focus:bg-blue-50 focus:border focus:border-blue-300 rounded px-1 py-0.5 pdf-input-min-height"
                          >
                            {editableContent.subsidyNameColumnHeader}
                          </span>
                        </div>
                        <div className="flex-1 text-xs font-bold p-2 border-r border-black text-center">
                          <span
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e: React.FocusEvent<HTMLSpanElement>) => handleContentChange('benefitDetailsColumnHeader', e.target.textContent || '')}
                            className="pdf-input focus:outline-none focus:bg-blue-50 focus:border focus:border-blue-300 rounded px-1 py-0.5 pdf-input-min-height"
                          >
                            {editableContent.benefitDetailsColumnHeader}
                          </span>
                        </div>
                        <div className="w-20 text-xs font-bold p-2 border-r border-black text-center">
                          <span
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e: React.FocusEvent<HTMLSpanElement>) => handleContentChange('durationColumnHeader', e.target.textContent || '')}
                            className="pdf-input focus:outline-none focus:bg-blue-50 focus:border focus:border-blue-300 rounded px-1 py-0.5 pdf-input-min-height"
                          >
                            {editableContent.durationColumnHeader}
                          </span>
                        </div>
                        <div className="flex-1 text-xs font-bold p-2 text-center">
                          <span
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e: React.FocusEvent<HTMLSpanElement>) => handleContentChange('applicationTimelineColumnHeader', e.target.textContent || '')}
                            className="pdf-input focus:outline-none focus:bg-blue-50 focus:border focus:border-blue-300 rounded px-1 py-0.5 pdf-input-min-height"
                          >
                            {editableContent.applicationTimelineColumnHeader}
                          </span>
                        </div>
                      </div>
                    
                    {/* Table Rows */}
                    {editableData.schemes.length === 0 ? (
                      <div className="text-xs text-gray-500 p-4 text-center">No specific schemes selected</div>
                    ) : (
                      editableData.schemes.map((scheme: string, index: number) => {
                        const schemeDesc = getSchemeDescription(scheme);
                        const benefitCategory = `Benefit - ${String.fromCharCode(65 + index)}`; // A, B, C, etc.
                        
                        return (
                          <div key={scheme} className="print-flex-table border-b border-black bg-white">
                            <div className="w-20 text-xs p-2 border-r border-black text-center font-bold bg-white">
                              {benefitCategory}
                            </div>
                            <div className="w-32 text-xs p-2 border-r border-black bg-white">
                              <span
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e: React.FocusEvent<HTMLSpanElement>) => {
                                  // Update scheme name in the schemes array
                                  const newSchemes = [...editableData.schemes];
                                  newSchemes[index] = e.target.textContent || scheme;
                                  handleFieldChange('schemes', newSchemes);
                                }}
                                className="pdf-input focus:outline-none focus:bg-blue-50 focus:border focus:border-blue-300 rounded px-1 py-0.5 pdf-input-min-height"
                              >
                                {schemeDesc?.title || scheme}
                              </span>
                            </div>
                            <div className="flex-1 text-xs p-2 border-r border-black bg-white">
                              <span
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={() => {
                                  // Store custom benefit details - this would need to be added to state
                                  // For now, we'll just update the display
                                }}
                                className="pdf-input focus:outline-none focus:bg-blue-50 focus:border focus:border-blue-300 rounded px-1 py-0.5 pdf-input-min-height"
                              >
                                {getBenefitDetails(scheme, editableData.category)}
                              </span>
                            </div>
                            <div className="w-20 text-xs p-2 border-r border-black text-center bg-white">
                              <span
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={() => {
                                  // Store custom duration - this would need to be added to state
                                  // For now, we'll just update the display
                                }}
                                className="pdf-input focus:outline-none focus:bg-blue-50 focus:border focus:border-blue-300 rounded px-1 py-0.5 pdf-input-min-height"
                              >
                                {getDuration(scheme, editableData.category)}
                              </span>
                            </div>
                            <div className="flex-1 text-xs p-2 text-center bg-white">
                              <span
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={() => {
                                  // Store custom application timeline - this would need to be added to state
                                  // For now, we'll just update the display
                                }}
                                className="pdf-input focus:outline-none focus:bg-blue-50 focus:border focus:border-blue-300 rounded px-1 py-0.5 pdf-input-min-height"
                              >
                                {getApplicationTimeline(scheme)}
                              </span>
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
                    <div className="text-xs font-bold mb-2">
                      <span
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e: React.FocusEvent<HTMLSpanElement>) => handleContentChange('sgstProcedureHeader', e.target.textContent || '')}
                        className="pdf-input focus:outline-none focus:bg-blue-50 focus:border focus:border-blue-300 rounded px-1 py-0.5 pdf-input-min-height"
                      >
                        SGST Application Procedure Stages
                      </span>
                    </div>
                    <div className="text-xs space-y-1">
                      <div className="flex items-center group">
                        <span
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e: React.FocusEvent<HTMLSpanElement>) => handleContentChange('sgstStage1', e.target.textContent || '')}
                          className="pdf-input focus:outline-none focus:bg-blue-50 focus:border focus:border-blue-300 rounded px-1 py-0.5 pdf-input-min-height flex-1"
                        >
                          Stage 1 Registration for FEC Certificate
                        </span>
                      </div>
                      <div className="flex items-center group">
                        <span
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e: React.FocusEvent<HTMLSpanElement>) => handleContentChange('sgstStage2', e.target.textContent || '')}
                          className="pdf-input focus:outline-none focus:bg-blue-50 focus:border focus:border-blue-300 rounded px-1 py-0.5 pdf-input-min-height flex-1"
                        >
                          Stage 2 Department issue FEC certificate.
                        </span>
                      </div>
                      <div className="flex items-center group">
                        <span
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e: React.FocusEvent<HTMLSpanElement>) => handleContentChange('sgstStage3', e.target.textContent || '')}
                          className="pdf-input focus:outline-none focus:bg-blue-50 focus:border focus:border-blue-300 rounded px-1 py-0.5 pdf-input-min-height flex-1"
                        >
                          Stage 3 Claims for benefits.
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Work Scope */}
                <div className="mb-4 work-scope-section">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-bold">WORK SCOPE</div>
                    <button
                      onClick={() => addListItem('workScope', '')}
                      className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors duration-200"
                    >
                      + Add Item
                    </button>
                  </div>
                  <div className="border border-black rounded bg-blue-100">
                    {/* Table Header */}
                    <div className="print-flex-table bg-blue-100 border-b border-black">
                      <div className="w-16 text-xs font-bold p-2 border-r border-black text-center">Sr. No</div>
                      <div className="w-[30%] text-xs font-bold p-2 border-r border-black text-center">Work description</div>
                      <div className="w-[70%] text-xs font-bold p-2 text-center">Work scope</div>
                    </div>
                    
                    {/* Table Row */}
                    <div className="print-flex-table border-b border-black bg-white">
                      <div className="w-16 text-xs p-2 border-r border-black text-center bg-white">1</div>
                      <div className="w-[30%] text-xs p-2 border-r border-black bg-white">
                        <span
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e: React.FocusEvent<HTMLSpanElement>) => handleContentChange('proposedBenefits', e.target.textContent || '')}
                          className="pdf-input focus:outline-none focus:bg-blue-50 focus:border focus:border-blue-300 rounded px-1 py-0.5 pdf-input-min-height"
                        >
                          {getDynamicWorkDescription}
                        </span>
                      </div>
                      <div className="w-[70%] text-xs p-2 bg-white">
                        <div className="space-y-1">
                          {editableContent.workScope.map((item, index) => (
                            <div key={index} className="flex items-center group">
                              <span
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e: React.FocusEvent<HTMLSpanElement>) => updateListItem('workScope', index, e.target.textContent || '')}
                                className="flex-1 pdf-input focus:outline-none focus:bg-blue-50 focus:border focus:border-blue-300 rounded px-1 py-0.5 pdf-input-min-height"
                              >
                                • {item}
                              </span>
                              <button
                                onClick={() => removeListItem('workScope', index)}
                                className="ml-2 opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-800 transition-all duration-200"
                                title="Remove item"
                                aria-label="Remove item"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
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
                      <table className="print-table w-full">
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
                              <tr key={scheme} className="bg-white">
                                <td className="text-xs p-2 border border-black bg-white">
                                  {index + 1}. {scheme}
                                </td>
                                <td className="text-xs p-2 border border-black text-right bg-white">
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
                  
                  {/* Additional Fees - Only show when there are additional fees */}
                  {((editableData.additionalFees && editableData.additionalFees.length > 0) || editableData.customFeeName) && (
                    <div className="mt-4 text-xs additional-fees-section">
                      <div className="font-bold mb-2">
                        <span
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e: React.FocusEvent<HTMLSpanElement>) => handleContentChange('additionalFeesHeader', e.target.textContent || '')}
                          className="pdf-input focus:outline-none focus:bg-blue-50 focus:border focus:border-blue-300 rounded px-1 py-0.5 pdf-input-min-height"
                        >
                          Additional Fees:
                        </span>
                      </div>
                      <div className="space-y-1 text-xs">
                        {editableData.additionalFees && editableData.additionalFees.map((fee, index) => {
                          const displayValue = fee.feeType === 'fee' ? fee.amount : fee.amount;
                          const displaySymbol = fee.feeType === 'fee' ? '₹' : '%';
                          
                          return (
                            <div key={fee.id} className="text-xs flex items-center group">
                              <span className="mr-2">{index + 1}.</span>
                              <span
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e: React.FocusEvent<HTMLSpanElement>) => {
                                  const newAdditionalFees = [...(editableData.additionalFees || [])];
                                  newAdditionalFees[index] = { ...fee, name: e.target.textContent || fee.name };
                                  handleFieldChange('additionalFees', newAdditionalFees);
                                }}
                                className="pdf-input focus:outline-none focus:bg-blue-50 focus:border focus:border-blue-300 rounded px-1 py-0.5 pdf-input-min-height flex-1"
                              >
                                {fee.name} {displayValue.toLocaleString('en-IN')}{displaySymbol}
                              </span>
                            </div>
                          );
                        })}
                        
                        {/* Custom Fee */}
                        {editableData.customFeeName && (
                          <div className="text-xs flex items-center group">
                            <span className="mr-2">{(editableData.additionalFees ? editableData.additionalFees.length : 0) + 1}.</span>
                            <span
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={(e: React.FocusEvent<HTMLSpanElement>) => handleFieldChange('customFeeName', e.target.textContent || '')}
                              className="pdf-input focus:outline-none focus:bg-blue-50 focus:border focus:border-blue-300 rounded px-1 py-0.5 pdf-input-min-height flex-1"
                            >
                              {editableData.customFeeName}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment Method */}
                {(editableData.applicationFees > 0 && editableData.sanctioningFees > 0) && (
                  <div className="mb-4 payment-method-section">
                    <div className="text-xs font-bold mb-2">
                      <span
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e: React.FocusEvent<HTMLSpanElement>) => handleContentChange('paymentMethodHeader', e.target.textContent || '')}
                        className="pdf-input focus:outline-none focus:bg-blue-50 focus:border focus:border-blue-300 rounded px-1 py-0.5 pdf-input-min-height"
                      >
                        PAYMENT METHOD
                      </span>
                    </div>
                    
                    <div className="text-xs">
                      <span
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e: React.FocusEvent<HTMLSpanElement>) => handleContentChange('paymentMethodText', e.target.textContent || '')}
                        className="pdf-input focus:outline-none focus:bg-blue-50 focus:border focus:border-blue-300 rounded px-1 py-0.5 pdf-input-min-height"
                      >
                      Processing fees application to sanctions of Rs.{editableData.applicationFees.toLocaleString('en-IN')}/- (non-adjustable) at the time of assignment finalization, Rs.{editableData.sanctioningFees.toLocaleString('en-IN')}/- (adjustable) against sanction of subsidy and rest against fund release.
                      </span>
                    </div>
                  </div>
                )}

                {/* Eligibility Criteria */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-bold">ELIGIBILITY CRITERIA</div>
                    <button
                      onClick={() => addListItem('eligibilityCriteria', '')}
                      className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors duration-200"
                    >
                      + Add Item
                    </button>
                  </div>
                  <div className="space-y-1 text-xs">
                    {editableContent.eligibilityCriteria.length > 0 ? (
                      editableContent.eligibilityCriteria.map((item, index) => (
                        <div key={index} className="flex items-center group">
                          <span className="mr-2">•</span>
                          <span
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e: React.FocusEvent<HTMLSpanElement>) => updateListItem('eligibilityCriteria', index, e.target.textContent || '')}
                            className="flex-1 pdf-input focus:outline-none focus:bg-blue-50 focus:border focus:border-blue-300 rounded px-1 py-0.5 pdf-input-min-height"
                          >
                            {item}
                          </span>
                          <button
                            onClick={() => removeListItem('eligibilityCriteria', index)}
                            className="ml-2 opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-800 transition-all duration-200"
                            title="Remove item"
                            aria-label="Remove item"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))
                    ) : (
                      getDynamicEligibilityCriteria.map((item: string, index: number) => (
                        <div
                          key={index}
                          className="pdf-input-min-height"
                          dangerouslySetInnerHTML={{ __html: item }}
                        />
                      ))
                    )}
                  </div>
                </div>

                {/* Duty Of Client */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-bold">DUTY OF CLIENT</div>
                    <button
                      onClick={() => addListItem('dutyOfClient', '')}
                      className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors duration-200"
                    >
                      + Add Item
                    </button>
                  </div>
                  <div className="space-y-1 text-xs">
                    {editableContent.dutyOfClient.map((item, index) => (
                      <div key={index} className="flex items-center group">
                        <span className="mr-2">{index + 1}.</span>
                        <span
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e: React.FocusEvent<HTMLSpanElement>) => updateListItem('dutyOfClient', index, e.target.textContent || '')}
                          className="flex-1 pdf-input focus:outline-none focus:bg-blue-50 focus:border focus:border-blue-300 rounded px-1 py-0.5 pdf-input-min-height"
                        >
                          {item}
                        </span>
                        <button
                          onClick={() => removeListItem('dutyOfClient', index)}
                          className="ml-2 opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-800 transition-all duration-200"
                          title="Remove item"
                          aria-label="Remove item"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Terms & Conditions */}
                <div className="mb-4 page-break-before">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-bold">TERMS & CONDITIONS</div>
                    <button
                      onClick={() => addListItem('termsAndConditions', '')}
                      className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors duration-200"
                    >
                      + Add Item
                    </button>
                  </div>
                  <div className="space-y-1 text-xs">
                    {editableContent.termsAndConditions.map((item, index) => (
                      <div key={index} className="flex items-center group">
                        <span className="mr-2">{index + 1}.</span>
                        <span
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e: React.FocusEvent<HTMLSpanElement>) => updateListItem('termsAndConditions', index, e.target.textContent || '')}
                          className="flex-1 pdf-input focus:outline-none focus:bg-blue-50 focus:border focus:border-blue-300 rounded px-1 py-0.5 pdf-input-min-height"
                        >
                          {item}
                        </span>
                        <button
                          onClick={() => removeListItem('termsAndConditions', index)}
                          className="ml-2 opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-800 transition-all duration-200"
                          title="Remove item"
                          aria-label="Remove item"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
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
                  <div className="text-xs font-bold">
                    <span
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e: React.FocusEvent<HTMLSpanElement>) => handleContentChange('footerText', e.target.textContent || '')}
                      className="pdf-input focus:outline-none focus:bg-blue-50 focus:border focus:border-blue-300 rounded px-1 py-0.5 pdf-input-min-height"
                    >
                      APPROVED & AUTHORIZED BY (Sign and Stamp)
                    </span>
                  </div>
                </div>
              </div>

              {/* Fixed Footer for Print/PDF */}
              <footer className="print-footer">
                <div className="text-center">
                  <div className="print-body text-gray-500">
                    Confidential – V4U Biz Solutions
                  </div>
                </div>
              </footer>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-sm text-red-700">{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="ml-auto text-red-400 hover:text-red-600"
                  title="Close error message"
                  aria-label="Close error message"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
          
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
                onClick={handlePrint}
                className="px-4 py-2 rounded-lg transition-colors duration-200 font-medium flex items-center bg-green-600 text-white hover:bg-green-700"
              >
                <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
                </svg>
                Print (Ctrl+P)
              </button>
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
                    <LoadingSpinner size="sm" text="" />
                    <span className="ml-2">Generating PDF...</span>
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
                    <LoadingSpinner size="sm" text="" />
                    <span className="ml-2">Generating Word...</span>
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
      </AccessibleModal>
    </ModalErrorBoundary>
  );
}
