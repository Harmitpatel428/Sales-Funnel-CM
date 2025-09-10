import PdfPrinter from 'pdfmake/src/printer';

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

// Font definitions for pdfmake
const fonts = {
  Roboto: {
    normal: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf',
    bold: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Medium.ttf',
    italics: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Italic.ttf',
    bolditalics: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-MediumItalic.ttf'
  }
};

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

export class PDFMakeService {
  private formatDate(): string {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${day}-${month}-${year}`;
  }

  private generateHeader(consultantInfo: ConsultantInfo): any {
    return [
      {
        columns: [
          {
            width: '*',
            text: [
              { text: consultantInfo.name, bold: true, fontSize: 12 },
              '\n',
              { text: consultantInfo.address, fontSize: 10 },
              '\n',
              { text: `Email: ${consultantInfo.email}`, fontSize: 10 },
              '\n',
              { text: `Phone: ${consultantInfo.phone}`, fontSize: 10 }
            ]
          },
          {
            width: 'auto',
            text: `Date: ${this.formatDate()}`,
            fontSize: 10,
            alignment: 'right'
          }
        ]
      },
      { text: '', margin: [0, 10] }
    ];
  }

  private generateSubject(): any {
    return [
      {
        text: 'Subject: Consulting fees for government subsidy work for Interest Subsidy, Power Connection Charges benefits (PCC), and Electricity Duty Exemption (EDE) under the Atmanirbhar Gujarat Scheme 2022.',
        fontSize: 12,
        bold: true,
        margin: [0, 0, 0, 15]
      }
    ];
  }

  private generateClientDetails(mandateData: MandateData): any {
    return [
      {
        text: [
          { text: 'To,', bold: true, fontSize: 10 },
          '\n',
          { text: mandateData.clientName, bold: true, fontSize: 10 },
          '\n',
          { text: mandateData.company, fontSize: 10 },
          '\n',
          { text: mandateData.address, fontSize: 10 }
        ],
        margin: [0, 0, 0, 15]
      }
    ];
  }

  private generateCommercialOffer(mandateData: MandateData): any {
    return [
      {
        text: 'COMMERCIAL OFFER',
        fontSize: 12,
        bold: true,
        margin: [0, 0, 0, 10]
      },
      {
        table: {
          widths: ['*', '*'],
          body: [
            [
              { text: 'Case Name:', bold: true, fontSize: 10 },
              { text: mandateData.clientName, fontSize: 10 }
            ],
            [
              { text: 'Type of Case:', bold: true, fontSize: 10 },
              { text: mandateData.typeOfCase || 'Not specified', fontSize: 10 }
            ],
            [
              { text: 'Project Cost:', bold: true, fontSize: 10 },
              { text: mandateData.projectCost || 'Not specified', fontSize: 10 }
            ],
            [
              { text: 'Industry:', bold: true, fontSize: 10 },
              { text: mandateData.industriesType || 'Not specified', fontSize: 10 }
            ],
            [
              { text: 'Term Loan Amount:', bold: true, fontSize: 10 },
              { text: mandateData.termLoanAmount || 'Not specified', fontSize: 10 }
            ],
            [
              { text: 'Power Connection:', bold: true, fontSize: 10 },
              { text: mandateData.powerConnection || 'Not specified', fontSize: 10 }
            ],
            [
              { text: 'KVA:', bold: true, fontSize: 10 },
              { text: mandateData.kva || 'Not specified', fontSize: 10 }
            ]
          ]
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 15]
      }
    ];
  }

  private generateProposedBenefits(mandateData: MandateData): any {
    const benefitsContent: any[] = [
      {
        text: 'PROPOSED BENEFITS',
        fontSize: 12,
        bold: true,
        margin: [0, 0, 0, 10]
      }
    ];

    if (mandateData.schemes.length === 0) {
      benefitsContent.push({
        text: 'No specific schemes selected',
        fontSize: 10,
        margin: [0, 0, 0, 10]
      });
    } else {
      mandateData.schemes.forEach((scheme, index) => {
        const schemeInfo = SCHEME_DESCRIPTIONS[scheme];
        if (schemeInfo) {
          benefitsContent.push({
            text: `${index + 1}. ${schemeInfo.title}`,
            fontSize: 10,
            bold: true,
            margin: [0, 0, 0, 5]
          });
          
          schemeInfo.description.forEach((desc: string) => {
            benefitsContent.push({
              text: `• ${desc}`,
              fontSize: 9,
              margin: [10, 0, 0, 2]
            });
          });
          
          benefitsContent.push({ text: '', margin: [0, 0, 0, 5] });
        }
      });
    }

    return benefitsContent;
  }

  private generateWorkScope(): any {
    return [
      {
        text: 'WORK SCOPE',
        fontSize: 12,
        bold: true,
        margin: [0, 0, 0, 10]
      },
      {
        text: [
          'We will provide comprehensive consulting services for the following:',
          '\n\n',
          '1. Assessment of eligibility for various government subsidy schemes under Atmanirbhar Gujarat Scheme 2022.',
          '\n',
          '2. Preparation and submission of all required documents and applications.',
          '\n',
          '3. Liaison with concerned government departments and agencies.',
          '\n',
          '4. Follow-up on application status and expedite approvals.',
          '\n',
          '5. Guidance on compliance requirements and procedures.',
          '\n',
          '6. Support for any additional documentation or clarifications required.',
          '\n',
          '7. Regular updates on the progress of applications.'
        ],
        fontSize: 10,
        margin: [0, 0, 0, 15]
      }
    ];
  }

  private generateEligibilityCriteria(): any {
    return [
      {
        text: 'ELIGIBILITY CRITERIA',
        fontSize: 12,
        bold: true,
        margin: [0, 0, 0, 10]
      },
      {
        text: [
          'The following eligibility criteria must be met:',
          '\n\n',
          '1. The unit should be registered under the Companies Act, 2013 or Partnership Act, 1932 or any other relevant Act.',
          '\n',
          '2. The unit should be operational and engaged in manufacturing or service activities.',
          '\n',
          '3. The unit should have valid business registration and necessary licenses.',
          '\n',
          '4. The unit should comply with all applicable laws and regulations.',
          '\n',
          '5. The unit should have proper financial statements and project documentation.',
          '\n',
          '6. The unit should meet the minimum investment and employment criteria as specified in the scheme.',
          '\n',
          '7. The unit should adhere to environmental and safety standards.'
        ],
        fontSize: 10,
        margin: [0, 0, 0, 15]
      }
    ];
  }

  private generateFees(mandateData: MandateData): any {
    const feesContent: any[] = [
      {
        text: 'OUR FEES',
        fontSize: 12,
        bold: true,
        margin: [0, 0, 0, 10]
      },
      {
        text: 'Our consulting fees are structured as follows:',
        fontSize: 10,
        margin: [0, 0, 0, 10]
      }
    ];

    // Create fees table based on selected schemes
    const feesTableBody: any[] = [
      [
        { text: 'Service', bold: true, fontSize: 10 },
        { text: 'Fee Structure', bold: true, fontSize: 10 },
        { text: 'Amount', bold: true, fontSize: 10 }
      ]
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
      
      feesTableBody.push([
        { text: scheme, fontSize: 10 },
        { text: feeStructure, fontSize: 10 },
        { text: feeAmount, fontSize: 10 }
      ]);
    });

    // Add total row
    const totalAmount = mandateData.schemes.length * 15000; // Average fee
    feesTableBody.push([
      { text: 'Total', bold: true, fontSize: 10 },
      { text: '', fontSize: 10 },
      { text: `₹${totalAmount.toLocaleString()}`, bold: true, fontSize: 10 }
    ]);

    feesContent.push({
      table: {
        widths: ['*', '*', '*'],
        body: feesTableBody
      },
      layout: {
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => '#000000',
        vLineColor: () => '#000000'
      },
      margin: [0, 0, 0, 15]
    });

    return feesContent;
  }

  private generateTermsAndConditions(): any {
    return [
      {
        text: 'TERMS & CONDITIONS',
        fontSize: 12,
        bold: true,
        margin: [0, 0, 0, 10]
      },
      {
        text: [
          '1. All services are subject to client cooperation and timely provision of required documents.',
          '\n',
          '2. Fees are payable as per agreed terms and conditions.',
          '\n',
          '3. We reserve the right to modify our services based on changing government policies.',
          '\n',
          '4. Confidentiality of client information is maintained at all times.',
          '\n',
          '5. Any additional services beyond the scope will be charged separately.',
          '\n',
          '6. This mandate is valid for 90 days from the date of signing.',
          '\n',
          '7. Payment terms: 50% advance, 50% on completion of work.',
          '\n',
          '8. We are not responsible for delays caused by government departments or policy changes.'
        ],
        fontSize: 10,
        margin: [0, 0, 0, 15]
      }
    ];
  }

  private generateFooter(): any {
    return [
      {
        text: 'APPROVED & AUTHORIZED BY (Sign and Stamp)',
        fontSize: 10,
        bold: true,
        alignment: 'center',
        margin: [0, 30, 0, 0]
      }
    ];
  }

  public generateMandatePDF(mandateData: MandateData, consultantInfo: ConsultantInfo): any {
    const docDefinition = {
      pageSize: 'A4',
      pageMargins: [40, 60, 40, 60],
      content: [
        ...this.generateHeader(consultantInfo),
        ...this.generateSubject(),
        ...this.generateClientDetails(mandateData),
        ...this.generateCommercialOffer(mandateData),
        ...this.generateProposedBenefits(mandateData),
        ...this.generateWorkScope(),
        ...this.generateEligibilityCriteria(),
        ...this.generateFees(mandateData),
        ...this.generateTermsAndConditions(),
        ...this.generateFooter()
      ],
      styles: {
        header: {
          fontSize: 12,
          bold: true
        },
        subheader: {
          fontSize: 10,
          bold: true
        },
        normal: {
          fontSize: 10
        }
      }
    };

    return docDefinition;
  }

  public downloadPDF(mandateData: MandateData, consultantInfo: ConsultantInfo, filename?: string): void {
    if (typeof window === 'undefined') {
      console.error('PDF generation is only available in browser environment');
      return;
    }

    try {
      const docDefinition = this.generateMandatePDF(mandateData, consultantInfo);
      
      // Generate filename if not provided
      if (!filename) {
        const currentDate = this.formatDate();
        const cleanClientName = mandateData.clientName.replace(/[^a-zA-Z0-9]/g, '_');
        filename = `Mandate_${cleanClientName}_${currentDate}.pdf`;
      }

      // Create PDF
      const printer = new PdfPrinter(fonts);
      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      
      // Download the PDF
      pdfDoc.pipe(
        new (window as any).BlobStream()
      ).on('finish', () => {
        const blob = pdfDoc.toBlob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
      });
      
      pdfDoc.end();
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
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
export const pdfMakeService = new PDFMakeService();
