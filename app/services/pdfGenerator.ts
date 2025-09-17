import { MandateData, ConsultantInfo, EditableContent } from './pdfServiceSimple';
import { getSchemeDescription } from '../utils/schemeUtils';

export class PDFGenerator {
  private mandateData: MandateData;
  private _consultantInfo: ConsultantInfo; // TODO: Use in future implementations
  private editableContent: EditableContent;

  constructor(mandateData: MandateData, consultantInfo: ConsultantInfo, editableContent: EditableContent) {
    this.mandateData = mandateData;
    this._consultantInfo = consultantInfo;
    this.editableContent = editableContent;
  }

  // Format date helper
  private formatDate(): string {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${day}-${month}-${year}`;
  }

  // Roman numeral helper
  private toRomanNumeral(num: number): string {
    const romanNumerals = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
    return romanNumerals[num] || num.toString();
  }

  // Policy header helper
  private getPolicyHeaderText(): string {
    if (!this.mandateData.policy) return 'Work description';
    
    const policyText = `Under ${this.mandateData.policy}`;
    
    if (this.mandateData.policy === 'Atmanirbhar Gujarat Scheme MSMEs 2022' && this.mandateData.category) {
      const romanCategory = this.toRomanNumeral(parseInt(this.mandateData.category));
      return `${policyText} (Taluka Category ${romanCategory})`;
    }
    
    return policyText;
  }

  // Benefit details helper
  private getBenefitDetails(scheme: string, category: string): string {
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
  }

  // Duration helper
  private getDuration(scheme: string, category: string): string {
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
  }

  // Application timeline helper
  private getApplicationTimeline(scheme: string): string {
    if (scheme === 'Capital Subsidy' || scheme === 'Interest Subsidy') {
      return 'Within 1 year from DOCP or First disbursement';
    }

    if (scheme === 'Power Connection Charges') return 'Within 1 year from estimate payment receipt date to DISCOM';
    if (scheme === 'Electric Duty Exemption') return 'Within 90 days from Date of production or trail production';
    if (scheme === 'SGST Subsidy') return 'Within 1 year from DOCP';
    if (scheme === 'Rent') return 'Within one year from the date of Rent agreement/lease';
    if (scheme === 'Solar Subsidy') return 'Within 1 year from commissioning';
    
    return 'As per scheme guidelines';
  }

  // Dynamic work description helper
  private getDynamicWorkDescription(): string {
    if (this.mandateData.schemes.length === 0) {
      return 'MSME Various Applications as per above stated benefit & Issuance of Electric duty exemption certificate from concerned Dept.';
    }

    const benefitLetters = this.mandateData.schemes.map((_: string, index: number) => 
      String.fromCharCode(65 + index)
    ).join(', ');

    const hasElectricDutyExemption = this.mandateData.schemes.includes('Electric Duty Exemption');
    
    if (hasElectricDutyExemption) {
      return `MSME Various Applications as per above stated benefit ${benefitLetters} & Issuance of Electric duty exemption certificate from concerned Dept.`;
    } else {
      return `MSME Various Applications as per above stated benefit ${benefitLetters}`;
    }
  }

  // Generate PDF
  async generatePDF(): Promise<void> {
    const jsPDF = (await import('jspdf')).default;
    const doc = new jsPDF();
    let yPosition = 20;

    // Helper function to add text with word wrap
    const addText = (text: string, x: number, y: number, options: any = {}) => {
      const maxWidth = options.maxWidth || 180;
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, y);
      return y + (lines.length * (options.lineHeight || 7));
    };

    // Company Logo
    doc.setFontSize(24);
    doc.setTextColor(0, 0, 255);
    doc.text('V4U', 105, yPosition, { align: 'center' });
    doc.setFontSize(8);
    doc.text('Biz Solutions', 105, yPosition + 5, { align: 'center' });
    yPosition += 20;

    // Commercial Offer Header
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFillColor(200, 200, 255);
    doc.rect(15, yPosition, 180, 8, 'F');
    doc.text('Commercial Offer for Subsidy Work', 105, yPosition + 6, { align: 'center' });
    yPosition += 15;

    // Date
    doc.setFontSize(8);
    doc.text(`Date: ${this.formatDate()}`, 170, yPosition);
    yPosition += 10;

    // Client Details
    doc.setFillColor(200, 200, 255);
    doc.rect(15, yPosition, 90, 25, 'F');
    doc.setFontSize(8);
    doc.text('To,', 20, yPosition + 5);
    doc.setFontSize(8);
    doc.text(`M/S ${this.mandateData.company}`, 20, yPosition + 10);
    doc.text(`Address: ${this.mandateData.address}`, 20, yPosition + 15);
    yPosition += 35;

    // Subject Line
    doc.setFontSize(8);
    doc.text('Subject:', 15, yPosition);
    doc.text(this.editableContent.subjectLine, 30, yPosition);
    yPosition += 10;

    // Salutation
    doc.text('Dear Sir,', 15, yPosition);
    yPosition += 10;

    // Opening Paragraph
    yPosition = addText(`With reference to above said subject & as per discussion with Mr ${this.mandateData.clientName} sir hereby we are sending our commercial offer and scope of work.`, 15, yPosition, { maxWidth: 180 });
    yPosition += 10;

    // Case Details
    doc.setFontSize(8);
    doc.text('Details of Proposed Firm are as under:', 15, yPosition);
    yPosition += 10;

    doc.setFillColor(200, 200, 255);
    doc.rect(15, yPosition, 90, 30, 'F');
    doc.text(`Case name: M/S ${this.mandateData.company}`, 20, yPosition + 5);
    
    let detailY = yPosition + 10;
    if (this.mandateData.typeOfCase) {
      doc.text(`Type of Case: ${this.mandateData.typeOfCase}`, 20, detailY);
      detailY += 5;
    }
    if (this.mandateData.category) {
      doc.text(`Taluka Category: ${this.mandateData.category}`, 20, detailY);
      detailY += 5;
    }
    if (this.mandateData.projectCost) {
      doc.text(`Cost of Project: ₹. ${this.mandateData.projectCost} (Approx.)`, 20, detailY);
      detailY += 5;
    }
    yPosition += 40;

    // Benefits Table
    doc.setFontSize(8);
    doc.text('WORK DESCRIPTION & PROPOSED BENEFITS', 15, yPosition);
    yPosition += 10;

    // Table header
    doc.setFillColor(200, 200, 255);
    doc.rect(15, yPosition, 180, 8, 'F');
    doc.text(this.getPolicyHeaderText(), 105, yPosition + 6, { align: 'center' });
    yPosition += 15;

    // Table columns
    const colWidths = [20, 32, 60, 20, 48];
    const colPositions = [15, 35, 67, 127, 147];
    const headers = ['Benefits', 'Subsidy Name', 'Benefit Details', 'Duration', 'Application Time Line'];

    // Table headers
    doc.setFillColor(200, 200, 255);
    doc.rect(15, yPosition, 180, 8, 'F');
    headers.forEach((header, index) => {
      doc.text(header, colPositions[index] + 2, yPosition + 6);
    });
    yPosition += 15;

    // Table rows
    this.mandateData.schemes.forEach((scheme, index) => {
      const schemeDesc = getSchemeDescription(scheme);
      const benefitCategory = `Benefit - ${String.fromCharCode(65 + index)}`;
      
      doc.setFillColor(200, 200, 255);
      doc.rect(15, yPosition, 180, 8, 'F');
      
      doc.text(benefitCategory, colPositions[0] + 2, yPosition + 6);
      doc.text(schemeDesc?.title || scheme, colPositions[1] + 2, yPosition + 6);
      
      const benefitDetails = this.getBenefitDetails(scheme, this.mandateData.category);
      const detailsLines = doc.splitTextToSize(benefitDetails, colWidths[2] - 4);
      doc.text(detailsLines, colPositions[2] + 2, yPosition + 6);
      
      doc.text(this.getDuration(scheme, this.mandateData.category), colPositions[3] + 2, yPosition + 6);
      doc.text(this.getApplicationTimeline(scheme), colPositions[4] + 2, yPosition + 6);
      
      yPosition += 8;
    });

    // Note
    doc.setFillColor(200, 200, 255);
    doc.rect(15, yPosition, 180, 8, 'F');
    doc.setTextColor(255, 0, 0);
    doc.text('Note: - DOCP means Date of commercial production', 105, yPosition + 6, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    yPosition += 15;

    // Work Scope
    doc.setFontSize(8);
    doc.text('WORK SCOPE', 15, yPosition);
    yPosition += 10;

    // Work scope table
    doc.setFillColor(200, 200, 255);
    doc.rect(15, yPosition, 180, 8, 'F');
    doc.text('Sr. No', 20, yPosition + 6);
    doc.text('Work description', 50, yPosition + 6);
    doc.text('Work scope', 120, yPosition + 6);
    yPosition += 15;

    doc.setFillColor(200, 200, 255);
    doc.rect(15, yPosition, 180, 20, 'F');
    doc.text('1', 20, yPosition + 6);
    doc.text(this.getDynamicWorkDescription(), 50, yPosition + 6);
    
    const workScopeText = '• Basic doc\'s collection as per check list.\n• Check eligibility as per scheme norms.\n• Application to concern dept. online in Govt portal within stipulated time line.\n• Query solving & hearing support as and when required.\n• Liaison with dept. as and when required.\n• Support in inspection.\n• Exemption certificate issuance.';
    const workScopeLines = doc.splitTextToSize(workScopeText, 60);
    doc.text(workScopeLines, 120, yPosition + 6);
    yPosition += 30;

    // Our Fees
    doc.setFontSize(8);
    doc.text('OUR FEES', 15, yPosition);
    yPosition += 10;

    if (this.mandateData.schemes.length > 0) {
      // Fees table header
      doc.setFillColor(200, 200, 255);
      doc.rect(15, yPosition, 180, 8, 'F');
      doc.text('Scheme Name', 20, yPosition + 6);
      doc.text('Our Fees', 120, yPosition + 6);
      doc.text('Description', 150, yPosition + 6);
      yPosition += 15;

      // Fees table rows
      this.mandateData.schemes.forEach((scheme, index) => {
        const feeType = this.mandateData.feeTypes?.[scheme] || 'percentage';
        const fee = this.mandateData.fees[scheme] || 0;
        const percentage = this.mandateData.percentages?.[scheme] || 0;
        
        const displayValue = feeType === 'fee' ? fee : percentage;
        const displaySymbol = feeType === 'fee' ? '₹' : '%';
        const description = feeType === 'fee' ? 'One time' : 'Of subsidy amount';

        doc.setFillColor(200, 200, 255);
        doc.rect(15, yPosition, 180, 8, 'F');
        doc.text(`${index + 1}. ${scheme}`, 20, yPosition + 6);
        doc.text(`${displayValue.toLocaleString('en-IN')}${displaySymbol}`, 120, yPosition + 6);
        doc.text(description, 150, yPosition + 6);
        yPosition += 15;
      });
    }

    // Additional Fees (if any)
    if ((this.mandateData.additionalFees && this.mandateData.additionalFees.length > 0) || this.mandateData.customFeeName) {
      doc.setFontSize(8);
      doc.text('Additional Fees:', 15, yPosition);
      yPosition += 10;

      if (this.mandateData.additionalFees) {
        this.mandateData.additionalFees.forEach((fee, index) => {
          const displayValue = fee.feeType === 'fee' ? fee.amount : fee.amount;
          const displaySymbol = fee.feeType === 'fee' ? '₹' : '%';
          doc.text(`${index + 1}. ${fee.name} ${displayValue.toLocaleString('en-IN')}${displaySymbol}`, 20, yPosition);
          yPosition += 7;
        });
      }

      if (this.mandateData.customFeeName) {
        const feeIndex = this.mandateData.additionalFees ? this.mandateData.additionalFees.length : 0;
        doc.text(`${feeIndex + 1}. ${this.mandateData.customFeeName}`, 20, yPosition);
        yPosition += 7;
      }
    }

    // Payment Method (if applicable)
    if (this.mandateData.applicationFees > 0 && this.mandateData.sanctioningFees > 0) {
      yPosition += 10;
      doc.setFontSize(8);
      doc.text('PAYMENT METHOD', 15, yPosition);
      yPosition += 10;
      
      const paymentText = `Processing fees application to sanctions of Rs.${this.mandateData.applicationFees.toLocaleString('en-IN')}/- (non-adjustable) at the time of assignment finalization, Rs.${this.mandateData.sanctioningFees.toLocaleString('en-IN')}/- (adjustable) against sanction of subsidy and rest against fund release.`;
      yPosition = addText(paymentText, 15, yPosition, { maxWidth: 180 });
    }

    // Footer
    yPosition += 20;
    doc.setFontSize(8);
    doc.text('APPROVED & AUTHORIZED BY (Sign and Stamp)', 105, yPosition, { align: 'center' });

    // Download the PDF
    const fileName = `Commercial_Offer_${this.mandateData.company}_${this.formatDate()}.pdf`;
    doc.save(fileName);
  }
}
