import html2pdf from 'html2pdf.js';

// Types for the PDF generation
interface PDFOptions {
  margin?: number[];
  filename?: string;
  image?: {
    type: string;
    quality: number;
  };
  html2canvas?: {
    scale: number;
    useCORS: boolean;
  };
  jsPDF?: {
    unit: string;
    format: string;
    orientation: string;
  };
  pagebreak?: {
    mode: string[];
  };
}

interface MandateData {
  company: string;
  policy: string;
  category: string;
  schemes: string[];
  fees: Record<string, number>;
  percentages: Record<string, number>;
  feeTypes: Record<string, string>;
  applicationFees: number;
  sanctioningFees: number;
  additionalFees?: Array<{
    id: string;
    name: string;
    amount: number;
    feeType: string;
  }>;
  customFeeName?: string;
}

interface ConsultantInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
}

interface EditableContent {
  subjectLine: string;
  salutation: string;
  openingParagraph: string;
  detailsHeader: string;
  benefitsHeader: string;
  policyHeader: string;
  benefitsColumnHeader: string;
  subsidyNameColumnHeader: string;
  benefitDetailsColumnHeader: string;
  durationColumnHeader: string;
  applicationTimelineColumnHeader: string;
  workScope: string[];
  eligibilityCriteria: string[];
  termsAndConditions: string[];
  dutyOfClient: string[];
  proposedBenefits: string;
}

// Default PDF options
const defaultPDFOptions: PDFOptions = {
  margin: [15, 10, 15, 10], // balanced margins for proper spacing
  filename: "Commercial-Offer.pdf",
  image: {
    type: "jpeg",
    quality: 0.98
  },
  html2canvas: {
    scale: 2,
    useCORS: true
  },
  jsPDF: {
    unit: "mm",
    format: "a4",
    orientation: "portrait"
  },
  pagebreak: {
    mode: ["css", "legacy"]
  }
};

// Fix OKLCH colors for html2canvas compatibility
const fixOKLCHColors = () => {
  const style = document.createElement('style');
  style.id = 'oklch-color-fix';
  style.textContent = `
    /* Override OKLCH colors with RGB equivalents for html2canvas */
    .bg-blue-100 { background-color: #dbeafe !important; }
    .bg-blue-50 { background-color: #eff6ff !important; }
    .text-blue-600 { color: #2563eb !important; }
    .text-red-600 { color: #dc2626 !important; }
    .text-gray-800 { color: #1f2937 !important; }
    .text-gray-500 { color: #6b7280 !important; }
    .border-gray-300 { border-color: #d1d5db !important; }
    .border-black { border-color: #000000 !important; }
    .border-blue-300 { border-color: #93c5fd !important; }
    .rounded-lg { border-radius: 8px !important; }
    .shadow-lg { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important; }
  `;
  document.head.appendChild(style);
};

// Force box styling for PDF generation
const forceBoxStyling = () => {
  const boxes = document.querySelectorAll('#pdf-preview .bg-blue-100.rounded-lg');
  boxes.forEach((box: Element) => {
    const htmlBox = box as HTMLElement;
    htmlBox.style.backgroundColor = '#dbeafe';
    htmlBox.style.borderRadius = '8px';
    htmlBox.style.border = '1px solid #93c5fd';
    htmlBox.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
    htmlBox.style.padding = '16px';
  });
};

const cleanupColorFixes = () => {
  const existingStyle = document.getElementById('oklch-color-fix');
  if (existingStyle) {
    existingStyle.remove();
  }
};

// Generate PDF with comprehensive options
export const generatePDF = async (
  editableData: MandateData,
  editableConsultantInfo: ConsultantInfo,
  editableContent: EditableContent,
  customFilename?: string
): Promise<void> => {
  try {
    const element = document.getElementById("pdf-preview");
    if (!element) {
      throw new Error("PDF preview element not found");
    }

    // Apply color fixes for html2canvas compatibility
    fixOKLCHColors();
    
    // Force box styling
    forceBoxStyling();

    // Generate filename
    const filename = customFilename || `Commercial_Offer_${editableData.company}_${formatDate()}.pdf`;

    // PDF options
    const opt = {
      ...defaultPDFOptions,
      filename,
      margin: [15, 10, 15, 10], // balanced margins for proper spacing
    };

    // Generate PDF
    await html2pdf()
      .set(opt)
      .from(element)
      .save();

  } catch (error) {
    console.error("PDF generation failed:", error);
    alert("PDF generation failed. Please try again.");
  } finally {
    // Clean up color fixes
    cleanupColorFixes();
  }
};

// Generate PDF as Blob for reuse
export const generatePDFBlob = async (
  editableData: MandateData,
  editableConsultantInfo: ConsultantInfo,
  editableContent: EditableContent
): Promise<Blob | null> => {
  try {
    const element = document.getElementById("pdf-preview");
    if (!element) {
      throw new Error("PDF preview element not found");
    }

    // Apply color fixes for html2canvas compatibility
    fixOKLCHColors();
    
    // Force box styling
    forceBoxStyling();

    // PDF options
    const opt = {
      ...defaultPDFOptions,
      margin: [15, 10, 15, 10], // balanced margins for proper spacing
    };

    // Generate PDF as Blob
    const pdfBlob = await html2pdf()
      .set(opt)
      .from(element)
      .outputPdf('blob');

    return pdfBlob;

  } catch (error) {
    console.error("PDF blob generation failed:", error);
    return null;
  } finally {
    // Clean up color fixes
    cleanupColorFixes();
  }
};

// Format date for filename
const formatDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Generate Word document
export const generateWord = async (
  editableData: MandateData,
  editableConsultantInfo: ConsultantInfo,
  editableContent: EditableContent,
  customFilename?: string
): Promise<void> => {
  try {
    // Dynamic import for docx
    const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel } = await import('docx');

    // Create document
    const doc = new Document({
      sections: [{
        properties: {},
        headers: {
          default: new Paragraph({
            children: [
              new TextRun({
                text: "V4U Biz Solutions",
                bold: true,
                size: 24,
                color: "2563eb"
              }),
              new TextRun({
                text: "\nCommercial Offer for Subsidy Work",
                size: 16,
                color: "1f2937"
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 }
          })
        },
        footers: {
          default: new Paragraph({
            children: [
              new TextRun({
                text: "Confidential – V4U Biz Solutions",
                size: 10,
                color: "6b7280"
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 200 }
          })
        },
        children: [
          // Company Information
          new Paragraph({
            children: [
              new TextRun({
                text: `Company: ${editableData.company}`,
                bold: true,
                size: 12
              })
            ],
            spacing: { after: 200 }
          }),

          // Policy Information
          new Paragraph({
            children: [
              new TextRun({
                text: `Policy: ${editableData.policy}`,
                size: 11
              })
            ],
            spacing: { after: 200 }
          }),

          // Schemes Table
          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph("Scheme Name")],
                    width: { size: 30, type: WidthType.PERCENTAGE }
                  }),
                  new TableCell({
                    children: [new Paragraph("Fee")],
                    width: { size: 20, type: WidthType.PERCENTAGE }
                  }),
                  new TableCell({
                    children: [new Paragraph("Type")],
                    width: { size: 20, type: WidthType.PERCENTAGE }
                  }),
                  new TableCell({
                    children: [new Paragraph("Description")],
                    width: { size: 30, type: WidthType.PERCENTAGE }
                  })
                ]
              }),
              ...editableData.schemes.map(scheme => {
                const feeType = editableData.feeTypes?.[scheme] || 'percentage';
                const fee = editableData.fees[scheme] || editableData.percentages[scheme] || 0;
                const displayValue = feeType === 'fee' ? `₹${fee.toLocaleString('en-IN')}` : `${fee}%`;
                
                return new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph(scheme)]
                    }),
                    new TableCell({
                      children: [new Paragraph(displayValue)]
                    }),
                    new TableCell({
                      children: [new Paragraph(feeType === 'fee' ? 'One time' : 'Of subsidy amount')]
                    }),
                    new TableCell({
                      children: [new Paragraph("Service fee")]
                    })
                  ]
                });
              })
            ]
          }),

          // Consultant Information
          new Paragraph({
            children: [
              new TextRun({
                text: "Consultant Information",
                bold: true,
                size: 12
              })
            ],
            spacing: { before: 400, after: 200 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Name: ${editableConsultantInfo.name}`,
                size: 11
              })
            ],
            spacing: { after: 100 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Address: ${editableConsultantInfo.address}`,
                size: 11
              })
            ],
            spacing: { after: 100 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Phone: ${editableConsultantInfo.phone}`,
                size: 11
              })
            ],
            spacing: { after: 100 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Email: ${editableConsultantInfo.email}`,
                size: 11
              })
            ],
            spacing: { after: 200 }
          }),

          // Eligibility Criteria
          new Paragraph({
            children: [
              new TextRun({
                text: "Eligibility Criteria",
                bold: true,
                size: 12
              })
            ],
            spacing: { before: 400, after: 200 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: editableContent.eligibilityCriteria.join('\n'),
                size: 11
              })
            ],
            spacing: { after: 200 }
          }),

          // Terms and Conditions
          new Paragraph({
            children: [
              new TextRun({
                text: "Terms & Conditions",
                bold: true,
                size: 12
              })
            ],
            spacing: { before: 400, after: 200 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: editableContent.termsAndConditions.join('\n'),
                size: 11
              })
            ],
            spacing: { after: 200 }
          })
        ]
      }]
    });

    // Generate filename
    const filename = customFilename || `Commercial_Offer_${editableData.company}_${formatDate()}.docx`;

    // Generate and download
    const buffer = await Packer.toBuffer(doc);
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

  } catch (error) {
    console.error("Word generation failed:", error);
    alert("Word document generation failed. Please try again.");
  }
};