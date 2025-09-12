import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatSubjectLine, getSchemeDescription } from '../utils/schemeUtils';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface MandateData {
  clientName: string;
  company: string;
  address: string;
  kva: string;
  schemes: string[];
  typeOfCase: string;
  category: string;
  projectCost: string;
  industriesType: string;
  termLoanAmount: string;
  powerConnection: string;
  fees: { [schemeName: string]: number };
  percentages: { [schemeName: string]: number };
}

export interface ConsultantInfo {
  name: string;
  address: string;
  email: string;
  phone: string;
}

// Note: Scheme descriptions are now imported from utils/schemeUtils.ts

export class PDFServiceV2 {
  private doc: jsPDF;
  private currentY: number = 20;
  private pageHeight: number = 280;
  private margin: number = 20;
  private pageWidth: number = 210;

  constructor() {
    this.doc = new jsPDF();
  }

  private formatDate(): string {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${day}-${month}-${year}`;
  }

  private addText(text: string, x: number, y: number, options: any = {}) {
    const { fontSize = 10, fontStyle = 'normal', color = '#000000', align = 'left' } = options;
    
    // Set font first, then font size for proper bold support
    if (fontStyle === 'bold') {
      this.doc.setFont('helvetica', 'bold');
    } else if (fontStyle === 'italic') {
      this.doc.setFont('helvetica', 'italic');
    } else {
      this.doc.setFont('helvetica', 'normal');
    }
    
    this.doc.setFontSize(fontSize);
    this.doc.setTextColor(color);
    
    if (align === 'center') {
      this.doc.text(text, this.pageWidth / 2, y, { align: 'center' });
    } else if (align === 'right') {
      this.doc.text(text, this.pageWidth - this.margin, y, { align: 'right' });
    } else {
      this.doc.text(text, x, y);
    }
  }

  private checkPageBreak(requiredSpace: number = 10): boolean {
    if (this.currentY + requiredSpace > this.pageHeight) {
      this.doc.addPage();
      this.currentY = 20;
      return true;
    }
    return false;
  }

  private generateHeader(consultantInfo: ConsultantInfo, mandateData: MandateData) {
    // Consultant Address (Top Left)
    this.addText(consultantInfo.name, this.margin, this.currentY, { fontSize: 12, fontStyle: 'bold' });
    this.currentY += 5;
    
    this.addText(consultantInfo.address, this.margin, this.currentY, { fontSize: 10 });
    this.currentY += 4;
    
    this.addText(`Email: ${consultantInfo.email}`, this.margin, this.currentY, { fontSize: 10 });
    this.currentY += 4;
    
    this.addText(`Phone: ${consultantInfo.phone}`, this.margin, this.currentY, { fontSize: 10 });
    this.currentY += 8;

    // Date (Top Right)
    const currentDate = this.formatDate();
    this.addText(`Date: ${currentDate}`, this.margin, this.currentY, { fontSize: 10, align: 'right' });
    this.currentY += 8;

    // Subject Line - Dynamic based on selected schemes using utility function
    const subjectText = formatSubjectLine(mandateData.schemes);
    
    this.addText(subjectText, this.margin, this.currentY, { 
      fontSize: 12, 
      fontStyle: 'bold' 
    });
    this.currentY += 8;
  }

  private generateClientDetails(mandateData: MandateData) {
    this.addText('To,', this.margin, this.currentY, { fontSize: 10, fontStyle: 'bold' });
    this.currentY += 5;
    
    this.addText(mandateData.clientName, this.margin, this.currentY, { fontSize: 10, fontStyle: 'bold' });
    this.currentY += 4;
    
    this.addText(mandateData.company, this.margin, this.currentY, { fontSize: 10 });
    this.currentY += 4;
    
    if (mandateData.address) {
      this.addText(mandateData.address, this.margin, this.currentY, { fontSize: 10 });
      this.currentY += 6;
    }
  }

  private generateCommercialOffer(mandateData: MandateData) {
    this.addText('COMMERCIAL OFFER', this.margin, this.currentY, { 
      fontSize: 12, 
      fontStyle: 'bold' 
    });
    this.currentY += 6;

    // Commercial offer details in table format
    const offerData = [
      ['Case Name:', mandateData.clientName],
      ['Type of Case:', mandateData.typeOfCase || 'Not specified'],
      ['Project Cost:', mandateData.projectCost || 'Not specified'],
      ['Industry:', mandateData.industriesType || 'Not specified'],
      ['Term Loan Amount:', mandateData.termLoanAmount || 'Not specified'],
      ['Power Connection:', mandateData.powerConnection || 'Not specified'],
      ['KVA:', mandateData.kva || 'Not specified']
    ];

    try {
      this.doc.autoTable({
        startY: this.currentY,
        head: [],
        body: offerData,
        theme: 'plain',
        styles: { fontSize: 10 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 60 },
          1: { cellWidth: 120 }
        },
        margin: { left: this.margin },
        tableWidth: 'wrap'
      });

      this.currentY = (this.doc as any).lastAutoTable.finalY + 10;
    } catch (error) {
      console.error('Error in autoTable:', error);
      // Fallback to simple text if autoTable fails
      offerData.forEach(([label, value]) => {
        this.addText(`${label} ${value}`, this.margin, this.currentY, { fontSize: 10 });
        this.currentY += 5;
      });
    }
  }

  private generateProposedBenefits(mandateData: MandateData) {
    this.addText('PROPOSED BENEFITS', this.margin, this.currentY, { 
      fontSize: 12, 
      fontStyle: 'bold' 
    });
    this.currentY += 6;

    if (mandateData.schemes.length === 0) {
      this.addText('No specific schemes selected', this.margin, this.currentY, { fontSize: 10 });
      this.currentY += 5;
    } else {
      mandateData.schemes.forEach((scheme, index) => {
        this.checkPageBreak(8);
        
        // Get scheme description using utility function
        const schemeDesc = getSchemeDescription(scheme);
        const schemeTitle = schemeDesc?.title || scheme;
        
        this.addText(`${index + 1}. ${schemeTitle}`, this.margin, this.currentY, { 
          fontSize: 10, 
          fontStyle: 'bold' 
        });
        this.currentY += 4;
        
        if (schemeDesc) {
          schemeDesc.description.forEach((desc: string) => {
            this.addText(`• ${desc}`, this.margin + 5, this.currentY, { fontSize: 9 });
            this.currentY += 4;
          });
        }
        this.currentY += 2;
      });
    }

    this.currentY += 5;
  }

  private generateWorkScope() {
    this.addText('WORK SCOPE', this.margin, this.currentY, { 
      fontSize: 12, 
      fontStyle: 'bold' 
    });
    this.currentY += 6;

    const workScopeItems = [
      'Assessment of eligibility for various government subsidy schemes under Atmanirbhar Gujarat Scheme 2022.',
      'Preparation and submission of all required documents and applications.',
      'Liaison with concerned government departments and agencies.',
      'Follow-up on application status and expedite approvals.',
      'Guidance on compliance requirements and procedures.',
      'Support for any additional documentation or clarifications required.',
      'Regular updates on the progress of applications.'
    ];

    workScopeItems.forEach((item, index) => {
      this.checkPageBreak(5);
      this.addText(`${index + 1}. ${item}`, this.margin, this.currentY, { fontSize: 10 });
      this.currentY += 4;
    });

    this.currentY += 5;
  }

  private generateEligibilityCriteria() {
    this.addText('ELIGIBILITY CRITERIA', this.margin, this.currentY, { 
      fontSize: 12, 
      fontStyle: 'bold' 
    });
    this.currentY += 6;

    const eligibilityItems = [
      'The unit should be registered under the Companies Act, 2013 or Partnership Act, 1932 or any other relevant Act.',
      'The unit should be operational and engaged in manufacturing or service activities.',
      'The unit should have valid business registration and necessary licenses.',
      'The unit should comply with all applicable laws and regulations.',
      'The unit should have proper financial statements and project documentation.',
      'The unit should meet the minimum investment and employment criteria as specified in the scheme.',
      'The unit should adhere to environmental and safety standards.'
    ];

    eligibilityItems.forEach((item, index) => {
      this.checkPageBreak(5);
      this.addText(`${index + 1}. ${item}`, this.margin, this.currentY, { fontSize: 10 });
      this.currentY += 4;
    });

    this.currentY += 5;
  }

  private generateFees(mandateData: MandateData) {
    this.addText('OUR FEES', this.margin, this.currentY, { 
      fontSize: 12, 
      fontStyle: 'bold' 
    });
    this.currentY += 6;

    this.addText('Our consulting fees are structured as follows:', this.margin, this.currentY, { fontSize: 10 });
    this.currentY += 8;

    // Create fees table
    const feesData = [
      ['Service', 'Fee Structure', 'Amount']
    ];

    mandateData.schemes.forEach((scheme) => {
      let feeAmount = '';
      let feeStructure = '';
      
      switch (scheme) {
        case 'Interest Subsidy':
          feeAmount = '₹25,000';
          feeStructure = 'Fixed Fee';
          break;
        case 'Power Connection Charges':
          feeAmount = '₹15,000';
          feeStructure = 'Fixed Fee';
          break;
        case 'Electric Duty Exemption':
          feeAmount = '₹20,000';
          feeStructure = 'Fixed Fee';
          break;
        default:
          feeAmount = '₹10,000';
          feeStructure = 'Fixed Fee';
      }
      
      feesData.push([scheme, feeStructure, feeAmount]);
    });

    // Add total row
    const totalAmount = mandateData.schemes.length * 15000; // Average fee
    feesData.push(['Total', '', `₹${totalAmount.toLocaleString()}`]);

    this.doc.autoTable({
      startY: this.currentY,
      head: [feesData[0]],
      body: feesData.slice(1),
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 60 },
        2: { cellWidth: 50 }
      },
      margin: { left: this.margin }
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 10;
  }

  private generateTermsAndConditions() {
    this.addText('TERMS & CONDITIONS', this.margin, this.currentY, { 
      fontSize: 12, 
      fontStyle: 'bold' 
    });
    this.currentY += 6;

    const termsItems = [
      'All services are subject to client cooperation and timely provision of required documents.',
      'Fees are payable as per agreed terms and conditions.',
      'We reserve the right to modify our services based on changing government policies.',
      'Confidentiality of client information is maintained at all times.',
      'Any additional services beyond the scope will be charged separately.',
      'This mandate is valid for 90 days from the date of signing.',
      'Payment terms: 50% advance, 50% on completion of work.',
      'We are not responsible for delays caused by government departments or policy changes.'
    ];

    termsItems.forEach((item, index) => {
      this.checkPageBreak(5);
      this.addText(`${index + 1}. ${item}`, this.margin, this.currentY, { fontSize: 10 });
      this.currentY += 4;
    });

    this.currentY += 8;
  }

  private generateFooter() {
    this.addText('APPROVED & AUTHORIZED BY (Sign and Stamp)', this.margin, this.currentY, { 
      fontSize: 10, 
      fontStyle: 'bold',
      align: 'center'
    });
  }

  public generateMandatePDF(mandateData: MandateData, consultantInfo: ConsultantInfo): jsPDF {
    try {
      // Reset for new PDF
      this.doc = new jsPDF();
      this.currentY = 20;

      console.log('Starting PDF generation...');
      console.log('Mandate data:', mandateData);
      console.log('Consultant info:', consultantInfo);

      // Generate all sections
      this.generateHeader(consultantInfo, mandateData);
      console.log('Header generated');
      
      this.generateClientDetails(mandateData);
      console.log('Client details generated');
      
      this.generateCommercialOffer(mandateData);
      console.log('Commercial offer generated');
      
      this.generateProposedBenefits(mandateData);
      console.log('Proposed benefits generated');
      
      this.generateWorkScope();
      console.log('Work scope generated');
      
      this.generateEligibilityCriteria();
      console.log('Eligibility criteria generated');
      
      this.generateFees(mandateData);
      console.log('Fees generated');
      
      this.generateTermsAndConditions();
      console.log('Terms and conditions generated');
      
      this.generateFooter();
      console.log('Footer generated');

      console.log('PDF generation completed successfully');
      return this.doc;
    } catch (error) {
      console.error('Error in generateMandatePDF:', error);
      throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public generateSimpleMandatePDF(mandateData: MandateData, consultantInfo: ConsultantInfo): jsPDF {
    try {
      // Reset for new PDF
      this.doc = new jsPDF();
      this.currentY = 20;

      console.log('Starting simple PDF generation...');

      // Generate header
      this.generateHeader(consultantInfo, mandateData);
      
      // Generate client details
      this.generateClientDetails(mandateData);
      
      // Generate simple commercial offer without autoTable
      this.addText('COMMERCIAL OFFER', this.margin, this.currentY, { 
        fontSize: 12, 
        fontStyle: 'bold' 
      });
      this.currentY += 6;

      const offerData = [
        ['Case Name:', mandateData.clientName],
        ['Type of Case:', mandateData.typeOfCase || 'Not specified'],
        ['Project Cost:', mandateData.projectCost || 'Not specified'],
        ['Industry:', mandateData.industriesType || 'Not specified'],
        ['Term Loan Amount:', mandateData.termLoanAmount || 'Not specified'],
        ['Power Connection:', mandateData.powerConnection || 'Not specified'],
        ['KVA:', mandateData.kva || 'Not specified']
      ];

      offerData.forEach(([label, value]) => {
        this.addText(`${label} ${value}`, this.margin, this.currentY, { fontSize: 10 });
        this.currentY += 5;
      });

      // Generate other sections without autoTable
      this.generateSimpleProposedBenefits(mandateData);
      this.generateSimpleWorkScope();
      this.generateSimpleEligibilityCriteria();
      this.generateSimpleFees(mandateData);
      this.generateSimpleTermsAndConditions();
      this.generateFooter();

      console.log('Simple PDF generation completed successfully');
      return this.doc;
    } catch (error) {
      console.error('Error in generateSimpleMandatePDF:', error);
      throw new Error(`Simple PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private generateSimpleProposedBenefits(mandateData: MandateData) {
    this.addText('PROPOSED BENEFITS', this.margin, this.currentY, { 
      fontSize: 12, 
      fontStyle: 'bold' 
    });
    this.currentY += 6;

    if (mandateData.schemes.length === 0) {
      this.addText('No specific schemes selected', this.margin, this.currentY, { fontSize: 10 });
      this.currentY += 5;
    } else {
      mandateData.schemes.forEach((scheme, index) => {
        this.checkPageBreak(8);
        this.addText(`${index + 1}. ${scheme}`, this.margin, this.currentY, { 
          fontSize: 10, 
          fontStyle: 'bold' 
        });
        this.currentY += 5;
      });
    }
    this.currentY += 5;
  }

  private generateSimpleWorkScope() {
    this.addText('WORK SCOPE', this.margin, this.currentY, { 
      fontSize: 12, 
      fontStyle: 'bold' 
    });
    this.currentY += 6;

    const workItems = [
      'Documentation preparation and submission',
      'Liaison with government departments',
      'Follow-up and status updates',
      'Compliance verification',
      'Final documentation delivery'
    ];

    workItems.forEach((item, index) => {
      this.checkPageBreak(6);
      this.addText(`${index + 1}. ${item}`, this.margin, this.currentY, { fontSize: 10 });
      this.currentY += 5;
    });
    this.currentY += 5;
  }

  private generateSimpleEligibilityCriteria() {
    this.addText('ELIGIBILITY CRITERIA', this.margin, this.currentY, { 
      fontSize: 12, 
      fontStyle: 'bold' 
    });
    this.currentY += 6;

    const criteria = [
      'Valid business registration',
      'Minimum investment threshold met',
      'Compliance with environmental norms',
      'Employment generation targets',
      'Project completion timeline'
    ];

    criteria.forEach((criterion, index) => {
      this.checkPageBreak(6);
      this.addText(`${index + 1}. ${criterion}`, this.margin, this.currentY, { fontSize: 10 });
      this.currentY += 5;
    });
    this.currentY += 5;
  }

  private generateSimpleFees(_mandateData: MandateData) {
    this.addText('CONSULTANCY FEES', this.margin, this.currentY, { 
      fontSize: 12, 
      fontStyle: 'bold' 
    });
    this.currentY += 6;

    this.addText('Service Fee: ₹25,000 (Non-refundable)', this.margin, this.currentY, { fontSize: 10 });
    this.currentY += 5;
    this.addText('Success Fee: 2% of total subsidy amount received', this.margin, this.currentY, { fontSize: 10 });
    this.currentY += 5;
    this.addText('Payment Terms: 50% advance, 50% on completion', this.margin, this.currentY, { fontSize: 10 });
    this.currentY += 5;
  }

  private generateSimpleTermsAndConditions() {
    this.addText('TERMS AND CONDITIONS', this.margin, this.currentY, { 
      fontSize: 12, 
      fontStyle: 'bold' 
    });
    this.currentY += 6;

    const terms = [
      'All fees are non-refundable once work commences',
      'Client to provide all necessary documents',
      'Timeline: 30-45 working days',
      'Success not guaranteed, depends on client compliance',
      'Additional charges for extra documentation'
    ];

    terms.forEach((term, index) => {
      this.checkPageBreak(6);
      this.addText(`${index + 1}. ${term}`, this.margin, this.currentY, { fontSize: 10 });
      this.currentY += 5;
    });
    this.currentY += 5;
  }

  public downloadPDF(mandateData: MandateData, consultantInfo: ConsultantInfo, filename?: string): void {
    try {
      if (typeof window === 'undefined') {
        console.error('PDF generation is only available in browser environment');
        return;
      }
      
      console.log('Starting PDF generation...');
      const pdf = this.generateMandatePDF(mandateData, consultantInfo);
      
      // Generate filename if not provided
      if (!filename) {
        const currentDate = this.formatDate();
        const cleanClientName = mandateData.clientName.replace(/[^a-zA-Z0-9]/g, '_');
        filename = `Mandate_${cleanClientName}_${currentDate}.pdf`;
      }
      
      console.log('Saving PDF with filename:', filename);
      pdf.save(filename);
      console.log('PDF saved successfully');
    } catch (error) {
      console.error('Error in downloadPDF:', error);
      throw error;
    }
  }
}

// Default consultant information
export const DEFAULT_CONSULTANT_INFO: ConsultantInfo = {
  name: 'V4UBiz Solution Ahmedabad',
  address: 'Ahmedabad, Gujarat',
  email: 'v4ubizsolution.com',
  phone: '+91 7016876812'
};

// Export singleton instance
export const pdfServiceV2 = new PDFServiceV2();
