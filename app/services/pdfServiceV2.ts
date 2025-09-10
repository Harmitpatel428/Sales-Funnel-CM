import jsPDF from 'jspdf';
import 'jspdf-autotable';

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
  phone: string;
  kva: string;
  schemes: string[];
  typeOfCase: string;
  category: string;
  projectCost: string;
  industriesType: string;
  termLoanAmount: string;
  powerConnection: string;
}

export interface ConsultantInfo {
  name: string;
  address: string;
  email: string;
  phone: string;
}

// Predefined scheme descriptions matching the sample PDF
const SCHEME_DESCRIPTIONS: { [key: string]: any } = {
  'Interest Subsidy': {
    title: 'Interest Subsidy',
    description: [
      'Interest subsidy @ 6% per annum on term loan sanctioned by Bank/Financial Institution.',
      'Maximum subsidy amount: ₹25 Lakhs per unit.',
      'Subsidy will be provided for a maximum period of 5 years from the date of disbursement of term loan.',
      'The subsidy will be credited directly to the loan account of the beneficiary.'
    ]
  },
  'Power Connection Charges': {
    title: 'Power Connection Charges (PCC)',
    description: [
      'Reimbursement of 100% of the power connection charges paid to DISCOM.',
      'Maximum reimbursement amount: ₹10 Lakhs per unit.',
      'Applicable for new power connections of 11 KV and above.',
      'Reimbursement will be provided after successful connection and payment of charges.'
    ]
  },
  'Electric Duty Exemption': {
    title: 'Electric Duty Exemption (EDE)',
    description: [
      'Exemption from payment of electricity duty for a period of 5 years.',
      'Applicable for new industrial units with power connection of 11 KV and above.',
      'Exemption will be provided from the date of commencement of commercial production.',
      'Maximum exemption limit: ₹50 Lakhs per unit.'
    ]
  }
};

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
    
    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', fontStyle);
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

  private generateHeader(consultantInfo: ConsultantInfo) {
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

    // Subject Line
    this.addText('Subject: Consulting fees for government subsidy work for Interest Subsidy, Power Connection Charges benefits (PCC), and Electricity Duty Exemption (EDE) under the Atmanirbhar Gujarat Scheme 2022.', this.margin, this.currentY, { 
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

    (this.doc as any).autoTable({
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
        this.addText(`${index + 1}. ${scheme}`, this.margin, this.currentY, { 
          fontSize: 10, 
          fontStyle: 'bold' 
        });
        this.currentY += 4;
        
        const description = SCHEME_DESCRIPTIONS[scheme];
        if (description) {
          description.description.forEach((desc: string) => {
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

    (this.doc as any).autoTable({
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
    // Reset for new PDF
    this.doc = new jsPDF();
    this.currentY = 20;

    // Generate all sections
    this.generateHeader(consultantInfo);
    this.generateClientDetails(mandateData);
    this.generateCommercialOffer(mandateData);
    this.generateProposedBenefits(mandateData);
    this.generateWorkScope();
    this.generateEligibilityCriteria();
    this.generateFees(mandateData);
    this.generateTermsAndConditions();
    this.generateFooter();

    return this.doc;
  }

  public downloadPDF(mandateData: MandateData, consultantInfo: ConsultantInfo, filename?: string): void {
    if (typeof window === 'undefined') {
      console.error('PDF generation is only available in browser environment');
      return;
    }
    
    const pdf = this.generateMandatePDF(mandateData, consultantInfo);
    
    // Generate filename if not provided
    if (!filename) {
      const currentDate = this.formatDate();
      const cleanClientName = mandateData.clientName.replace(/[^a-zA-Z0-9]/g, '_');
      filename = `Mandate_${cleanClientName}_${currentDate}.pdf`;
    }
    
    pdf.save(filename);
  }
}

// Default consultant information
export const DEFAULT_CONSULTANT_INFO: ConsultantInfo = {
  name: 'Dr. Rajesh Kumar',
  address: '123 Business Center, Sector 17, Chandigarh, 160017',
  email: 'rajesh.kumar@consulting.com',
  phone: '+91-9876543210'
};

// Export singleton instance
export const pdfServiceV2 = new PDFServiceV2();
