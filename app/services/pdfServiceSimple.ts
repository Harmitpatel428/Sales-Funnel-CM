import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatSubjectLine, getSchemeDescription } from '../utils/schemeUtils';

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
  policy: string;
  fees: { [schemeName: string]: number };
  percentages: { [schemeName: string]: number };
  feeTypes: { [schemeName: string]: 'fee' | 'percentage' };
}

export interface EditableContent {
  subjectLine?: string;
  workScope?: string[];
  eligibilityCriteria?: string[];
  termsAndConditions?: string[];
}

export interface ConsultantInfo {
  name: string;
  address: string;
  email: string;
  phone: string;
}

export class PDFServiceSimple {
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
      console.log('🔍 Setting bold font for text:', text.substring(0, 50) + '...');
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

  private generateHeader(consultantInfo: ConsultantInfo, mandateData: MandateData, editableContent?: EditableContent) {
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

    // Subject Line - Use editable content if available, otherwise generate from schemes
    const subjectText = editableContent?.subjectLine || formatSubjectLine(mandateData.schemes, mandateData.policy, mandateData.typeOfCase);
    
    console.log('🔍 Generating subject line with bold formatting:', subjectText);
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

    // Commercial offer details in simple text format
    const offerItems = [
      `Case Name: ${mandateData.clientName}`,
      `Type of Case: ${mandateData.typeOfCase || 'Not specified'}`,
      `Project Cost: ${mandateData.projectCost || 'Not specified'}`,
      `Industry: ${mandateData.industriesType || 'Not specified'}`,
      `Term Loan Amount: ${mandateData.termLoanAmount || 'Not specified'}`,
      `Power Connection: ${mandateData.powerConnection || 'Not specified'}`,
      `KVA: ${mandateData.kva || 'Not specified'}`
    ];

    offerItems.forEach((item) => {
      this.checkPageBreak(5);
      this.addText(item, this.margin, this.currentY, { fontSize: 10 });
      this.currentY += 4;
    });

    this.currentY += 5;
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
          schemeDesc.description.forEach((desc) => {
            this.addText(`• ${desc}`, this.margin + 5, this.currentY, { fontSize: 9 });
            this.currentY += 4;
          });
        }
        this.currentY += 2;
      });
    }

    this.currentY += 5;
  }

  private generateWorkScope(editableContent?: EditableContent) {
    this.addText('WORK SCOPE', this.margin, this.currentY, { 
      fontSize: 12, 
      fontStyle: 'bold' 
    });
    this.currentY += 6;

    const workScopeItems = editableContent?.workScope || [
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

  private generateEligibilityCriteria(editableContent?: EditableContent) {
    this.addText('ELIGIBILITY CRITERIA', this.margin, this.currentY, { 
      fontSize: 12, 
      fontStyle: 'bold' 
    });
    this.currentY += 6;

    const eligibilityItems = editableContent?.eligibilityCriteria || [
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
    this.currentY += 4;

    if (mandateData.schemes.length === 0) {
      this.addText('No specific schemes selected', this.margin, this.currentY, { fontSize: 10 });
      this.currentY += 5;
    } else {
      // Create fees table
      const tableData = mandateData.schemes.map((scheme, index) => {
        const feeType = mandateData.feeTypes?.[scheme] || 'percentage';
        const fee = mandateData.fees[scheme] || 0;
        const percentage = mandateData.percentages?.[scheme] || 0;
        
        // Use the selected fee type to determine what to show
        const displayValue = feeType === 'fee' ? fee : percentage;
        const displaySymbol = feeType === 'fee' ? '₹' : '%';
        const description = feeType === 'fee' ? 'One time' : 'of subsidy amount';
        
        return [
          `${index + 1}. ${scheme}`,
          `${displayValue.toLocaleString()}${displaySymbol}`,
          description
        ];
      });

      // Generate table
      autoTable(this.doc, {
        startY: this.currentY,
        head: [['Scheme Name', 'Our Fees', 'Description']],
        body: tableData,
        theme: 'grid',
        headStyles: { 
          fillColor: [240, 240, 240], 
          textColor: [0, 0, 0], 
          fontStyle: 'bold',
          fontSize: 10,
          lineColor: [0, 0, 0],
          lineWidth: 1.0
        },
        bodyStyles: { 
          fontSize: 10,
          textColor: [0, 0, 0],
          lineColor: [0, 0, 0],
          lineWidth: 1.0
        },
        styles: {
          lineColor: [0, 0, 0],
          lineWidth: 1.0
        },
        columnStyles: {
          0: { cellWidth: 120 }, // Scheme Name column
          1: { cellWidth: 60, halign: 'right' } // Fee column
        },
        margin: { left: this.margin, right: this.margin },
        tableWidth: 'wrap'
      });

      // Update current Y position after table
      this.currentY = (this.doc as any).lastAutoTable.finalY + 5;
    }

    this.currentY += 5;
  }

  private generateTermsAndConditions(editableContent?: EditableContent) {
    this.addText('TERMS & CONDITIONS', this.margin, this.currentY, { 
      fontSize: 12, 
      fontStyle: 'bold' 
    });
    this.currentY += 6;

    const termsItems = editableContent?.termsAndConditions || [
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

  public generateMandatePDF(mandateData: MandateData, consultantInfo: ConsultantInfo, editableContent?: EditableContent): jsPDF {
    // Reset for new PDF
    this.doc = new jsPDF();
    this.currentY = 20;

    // Generate all sections
    this.generateHeader(consultantInfo, mandateData, editableContent);
    this.generateClientDetails(mandateData);
    this.generateCommercialOffer(mandateData);
    this.generateProposedBenefits(mandateData);
    this.generateWorkScope(editableContent);
    this.generateEligibilityCriteria(editableContent);
    this.generateFees(mandateData);
    this.generateTermsAndConditions(editableContent);
    this.generateFooter();

    return this.doc;
  }

  public downloadPDF(mandateData: MandateData, consultantInfo: ConsultantInfo, filename?: string, editableContent?: EditableContent): void {
    try {
      if (typeof window === 'undefined') {
        console.error('PDF generation is only available in browser environment');
        return;
      }
      
      console.log('Starting PDF generation...');
      const pdf = this.generateMandatePDF(mandateData, consultantInfo, editableContent);
      
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
export const pdfServiceSimple = new PDFServiceSimple();
