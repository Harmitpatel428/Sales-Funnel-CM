import jsPDF from 'jspdf';

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

// Predefined scheme descriptions
const SCHEME_DESCRIPTIONS: { [key: string]: string } = {
  'Interest Subsidy': 'Interest subsidy scheme provides financial assistance by reducing the interest rate on loans for eligible projects, making them more affordable for businesses.',
  'PCC': 'Power Cost Capital (PCC) scheme offers capital assistance for power infrastructure development and cost reduction initiatives.',
  'EDE': 'Energy Development and Efficiency (EDE) scheme focuses on promoting energy-efficient technologies and sustainable development practices.',
  'Capital Subsidy': 'Capital subsidy provides direct financial support for capital investments in eligible projects and infrastructure development.',
  'Technology Upgradation': 'Technology upgradation scheme supports businesses in adopting modern technologies and improving operational efficiency.',
  'Infrastructure Development': 'Infrastructure development scheme provides assistance for building and improving industrial infrastructure and facilities.',
  'Export Promotion': 'Export promotion scheme offers incentives and support for businesses looking to expand their export capabilities.',
  'Skill Development': 'Skill development scheme focuses on training and development of human resources to enhance productivity and employability.'
};

export class PDFService {
  private doc: jsPDF;
  private currentY: number = 20;
  private pageHeight: number = 280;
  private margin: number = 20;
  private pageWidth: number = 210;

  constructor() {
    this.doc = new jsPDF();
    this.setupFonts();
  }

  private setupFonts() {
    // Set default font
    this.doc.setFont('helvetica');
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

  private addLine(x1: number, y1: number, x2: number, y2: number, color: string = '#000000') {
    this.doc.setDrawColor(color);
    this.doc.line(x1, y1, x2, y2);
  }

  private checkPageBreak(requiredSpace: number = 10): boolean {
    if (this.currentY + requiredSpace > this.pageHeight) {
      this.doc.addPage();
      this.currentY = 20;
      return true;
    }
    return false;
  }

  private formatDate(): string {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${day}-${month}-${year}`;
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
    this.addText('Subject: Consulting fees for government subsidy work', this.margin, this.currentY, { 
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
      this.currentY += 4;
    }
    
    if (mandateData.phone) {
      this.addText(`Phone: ${mandateData.phone}`, this.margin, this.currentY, { fontSize: 10 });
      this.currentY += 6;
    }
  }

  private generateCommercialOffer(mandateData: MandateData) {
    this.addText('Commercial Offer', this.margin, this.currentY, { 
      fontSize: 12, 
      fontStyle: 'bold' 
    });
    this.currentY += 6;

    // Commercial offer details in table format
    const offerData = [
      ['Type of Case:', mandateData.typeOfCase || 'Not specified'],
      ['Project Cost:', mandateData.projectCost || 'Not specified'],
      ['Industry:', mandateData.industriesType || 'Not specified'],
      ['Term Loan Amount:', mandateData.termLoanAmount || 'Not specified'],
      ['Power Connection:', mandateData.powerConnection || 'Not specified'],
      ['KVA:', mandateData.kva || 'Not specified']
    ];

    offerData.forEach(([label, value]) => {
      this.checkPageBreak(6);
      this.addText(label, this.margin, this.currentY, { fontSize: 10, fontStyle: 'bold' });
      this.addText(value, this.margin + 60, this.currentY, { fontSize: 10 });
      this.currentY += 5;
    });

    this.currentY += 5;
  }

  private generateProposedBenefits(mandateData: MandateData) {
    this.addText('Proposed Benefits', this.margin, this.currentY, { 
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
        
        const description = SCHEME_DESCRIPTIONS[scheme] || 'Detailed description for this scheme will be provided during consultation.';
        this.addText(description, this.margin + 5, this.currentY, { fontSize: 9 });
        this.currentY += 6;
      });
    }

    this.currentY += 5;
  }

  private generateWorkScope() {
    this.addText('Work Scope', this.margin, this.currentY, { 
      fontSize: 12, 
      fontStyle: 'bold' 
    });
    this.currentY += 6;

    const workScopeItems = [
      'Assessment of eligibility for various government subsidy schemes',
      'Documentation preparation and submission assistance',
      'Liaison with government departments and agencies',
      'Follow-up on application status and approvals',
      'Guidance on compliance requirements and procedures',
      'Support for any additional documentation or clarifications'
    ];

    workScopeItems.forEach((item, index) => {
      this.checkPageBreak(5);
      this.addText(`${index + 1}. ${item}`, this.margin, this.currentY, { fontSize: 10 });
      this.currentY += 4;
    });

    this.currentY += 5;
  }

  private generateEligibilityCriteria() {
    this.addText('Eligibility Criteria', this.margin, this.currentY, { 
      fontSize: 12, 
      fontStyle: 'bold' 
    });
    this.currentY += 6;

    const eligibilityItems = [
      'Business must be registered and operational',
      'Compliance with all applicable laws and regulations',
      'Valid business registration and necessary licenses',
      'Financial statements and project documentation',
      'Meeting minimum investment and employment criteria',
      'Adherence to environmental and safety standards'
    ];

    eligibilityItems.forEach((item, index) => {
      this.checkPageBreak(5);
      this.addText(`${index + 1}. ${item}`, this.margin, this.currentY, { fontSize: 10 });
      this.currentY += 4;
    });

    this.currentY += 5;
  }

  private generateFees() {
    this.addText('Fees', this.margin, this.currentY, { 
      fontSize: 12, 
      fontStyle: 'bold' 
    });
    this.currentY += 6;

    const feesText = 'Our consulting fees will be based on the complexity of the case and the services required. A detailed fee structure will be provided after initial assessment and discussion of your specific requirements.';
    
    this.addText(feesText, this.margin, this.currentY, { fontSize: 10 });
    this.currentY += 8;
  }

  private generateTermsAndConditions() {
    this.addText('Terms & Conditions', this.margin, this.currentY, { 
      fontSize: 12, 
      fontStyle: 'bold' 
    });
    this.currentY += 6;

    const termsItems = [
      'All services are subject to client cooperation and timely provision of required documents',
      'Fees are payable as per agreed terms and conditions',
      'We reserve the right to modify our services based on changing government policies',
      'Confidentiality of client information is maintained at all times',
      'Any additional services beyond the scope will be charged separately',
      'This mandate is valid for 90 days from the date of signing'
    ];

    termsItems.forEach((item, index) => {
      this.checkPageBreak(5);
      this.addText(`${index + 1}. ${item}`, this.margin, this.currentY, { fontSize: 10 });
      this.currentY += 4;
    });

    this.currentY += 8;
  }

  private generateSignature() {
    this.addText('Approved & Authorized By', this.margin, this.currentY, { 
      fontSize: 10, 
      fontStyle: 'bold' 
    });
    this.currentY += 15;
    
    this.addText('_________________________', this.margin, this.currentY, { fontSize: 10 });
    this.currentY += 4;
    
    this.addText('Signature', this.margin, this.currentY, { fontSize: 9 });
    this.currentY += 8;
    
    this.addText('_________________________', this.margin, this.currentY, { fontSize: 10 });
    this.currentY += 4;
    
    this.addText('Date', this.margin, this.currentY, { fontSize: 9 });
  }

  public generateMandatePDF(mandateData: MandateData, consultantInfo: ConsultantInfo): jsPDF {
    // Reset for new PDF
    this.doc = new jsPDF();
    this.currentY = 20;
    this.setupFonts();

    // Generate all sections
    this.generateHeader(consultantInfo);
    this.generateClientDetails(mandateData);
    this.generateCommercialOffer(mandateData);
    this.generateProposedBenefits(mandateData);
    this.generateWorkScope();
    this.generateEligibilityCriteria();
    this.generateFees();
    this.generateTermsAndConditions();
    this.generateSignature();

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
  name: 'Consultant Name',
  address: 'Consultant Address, City, State, PIN Code',
  email: 'consultant@email.com',
  phone: '+91-XXXXXXXXXX'
};

// Export singleton instance
export const pdfService = new PDFService();
