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
    logging?: boolean;
    allowTaint?: boolean;
    backgroundColor?: string;
    removeContainer?: boolean;
    foreignObjectRendering?: boolean;
    height?: number;
    width?: number;
    scrollX?: number;
    scrollY?: number;
    windowWidth?: number;
    windowHeight?: number;
    ignoreElements?: (element: Element) => boolean;
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
  margin: [10, 10, 10, 10], // 10mm margins on all sides
  filename: "Commercial-Offer.pdf",
  image: {
    type: "jpeg",
    quality: 0.98
  },
  html2canvas: {
    scale: 2,
    useCORS: true,
    logging: false
  },
  jsPDF: {
    unit: "mm",
    format: "a4",
    orientation: "portrait"
  },
  pagebreak: {
    mode: ["avoid-all", "css", "legacy"]
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

// Check if document is too large for client-side generation
const checkDocumentSize = (element: HTMLElement): { isLarge: boolean; reason?: string } => {
  const rect = element.getBoundingClientRect();
  const height = rect.height;
  const width = rect.width;
  
  // Estimate document size (rough calculation)
  const estimatedSize = (height * width * 4) / (1024 * 1024); // MB estimate
  
  // Check for large documents
  if (estimatedSize > 10) {
    return { isLarge: true, reason: `Document is too large (${estimatedSize.toFixed(1)}MB estimated)` };
  }
  
  // Check for many pages (rough estimate: 297mm = A4 height)
  const estimatedPages = height / (297 * 3.78); // Convert mm to pixels
  if (estimatedPages > 20) {
    return { isLarge: true, reason: `Document has too many pages (${Math.ceil(estimatedPages)} estimated)` };
  }
  
  return { isLarge: false };
};

// Generate PDF with comprehensive options and size checking
export const generatePDF = async (
  _editableData: MandateData,
  _editableConsultantInfo: ConsultantInfo,
  _editableContent: EditableContent,
  customFilename?: string
): Promise<void> => {
  try {
    const element = document.getElementById("pdf-preview");
    if (!element) {
      throw new Error("PDF preview element not found");
    }

    // Verify element contains content
    const contentHeight = element.scrollHeight;
    const contentWidth = element.scrollWidth;
    console.log(`PDF Preview dimensions: ${contentWidth}x${contentHeight}px`);

    if (contentHeight < 100) {
      throw new Error("PDF preview element appears to be empty or too small");
    }

    // Check document size
    const sizeCheck = checkDocumentSize(element);
    if (sizeCheck.isLarge) {
      const useServer = confirm(
        `${sizeCheck.reason}. For large documents, please use server-generated PDF for better performance. Would you like to continue with client-side generation anyway?`
      );
      
      if (!useServer) {
        // Redirect to server PDF generation
        window.open('/api/pdf', '_blank');
        return;
      }
    }

    // Apply color fixes for html2canvas compatibility
    fixOKLCHColors();
    
    // Force box styling
    forceBoxStyling();

    // Ensure element is visible and properly styled for PDF generation
    element.style.display = 'block';
    element.style.position = 'static';
    element.style.width = '210mm';
    element.style.minHeight = '297mm';
    element.style.backgroundColor = '#E6F3FF';
    element.style.fontSize = '10px';
    element.style.lineHeight = '1.4';
    element.style.color = 'black';
    element.style.fontFamily = 'Helvetica, Arial, sans-serif';
    element.style.padding = '10mm';
    element.style.margin = '0';

    // Generate filename
    const filename = customFilename || `Commercial_Offer_${_editableData.company}_${formatDate()}.pdf`;

    // PDF options with enhanced settings
    const opt = {
      ...defaultPDFOptions,
      filename,
      margin: [10, 10, 10, 10], // 10mm margins on all sides
      html2canvas: {
        ...defaultPDFOptions.html2canvas,
        height: contentHeight,
        width: contentWidth,
        scrollX: 0,
        scrollY: 0,
        windowWidth: contentWidth,
        windowHeight: contentHeight
      }
    };

    console.log('Starting PDF generation with options:', opt);

    // Generate PDF
    await html2pdf()
      .set(opt)
      .from(element)
      .save();

    console.log('PDF generation completed successfully');

  } catch (error) {
    console.error("PDF generation failed:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    alert(`PDF generation failed: ${errorMessage}. Please try again.`);
  } finally {
    // Clean up color fixes
    cleanupColorFixes();
  }
};

// Generate PDF as Blob for reuse
export const generatePDFBlob = async (
  _editableData: MandateData,
  _editableConsultantInfo: ConsultantInfo,
  _editableContent: EditableContent
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
      margin: [10, 10, 10, 10], // 10mm margins on all sides
    };

    // Generate PDF as Blob
    const pdfBlob = await (html2pdf() as any)
      .set(opt)
      .from(element)
      .outputPdf('blob') as Promise<Blob>;

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

// Print preview function for Ctrl+P
export const printPreview = (): void => {
  try {
    const element = document.getElementById("pdf-preview");
    if (!element) {
      throw new Error("PDF preview element not found");
    }

    // Temporarily hide non-preview UI elements
    const elementsToHide = document.querySelectorAll('.no-print, nav, .sidebar, .navigation, .modal-overlay');
    const originalDisplay: (string | undefined)[] = [];
    
    elementsToHide.forEach((el, index) => {
      originalDisplay[index] = (el as HTMLElement).style.display || '';
      (el as HTMLElement).style.display = 'none';
    });

    // Ensure the preview element is visible and properly styled
    element.style.display = 'block';
    element.style.position = 'static';
    element.style.width = '100%';
    element.style.height = 'auto';
    element.style.margin = '0';
    element.style.padding = '10mm';
    element.style.backgroundColor = '#E6F3FF';
    element.style.fontSize = '10px';
    element.style.lineHeight = '1.4';
    element.style.color = 'black';
    element.style.fontFamily = 'Helvetica, Arial, sans-serif';

    // Add print-specific classes
    element.classList.add('print-container');

    // Trigger print dialog
    window.print();

    // Restore original display states after print dialog closes
    setTimeout(() => {
      elementsToHide.forEach((el, index) => {
        (el as HTMLElement).style.display = originalDisplay[index] || '';
      });
      
      // Remove print-specific classes
      element.classList.remove('print-container');
    }, 1000);

  } catch (error) {
    console.error("Print preview failed:", error);
    alert("Print preview failed. Please try again.");
  }
};

// Generate Word document
export const generateWord = async (
  _editableData: MandateData,
  _editableConsultantInfo: ConsultantInfo,
  _editableContent: EditableContent,
  customFilename?: string
): Promise<void> => {
  try {
    // Dynamic import for docx
    const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType } = await import('docx');

    // Create document
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          // Company Information
          new Paragraph({
            children: [
              new TextRun({
                text: `Company: ${_editableData.company}`,
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
                text: `Policy: ${_editableData.policy}`,
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
              ..._editableData.schemes.map((scheme: string) => {
                const feeType = _editableData.feeTypes?.[scheme] || 'percentage';
                const fee = _editableData.fees[scheme] || _editableData.percentages[scheme] || 0;
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
                text: `Name: ${_editableConsultantInfo.name}`,
                size: 11
              })
            ],
            spacing: { after: 100 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Address: ${_editableConsultantInfo.address}`,
                size: 11
              })
            ],
            spacing: { after: 100 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Phone: ${_editableConsultantInfo.phone}`,
                size: 11
              })
            ],
            spacing: { after: 100 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Email: ${_editableConsultantInfo.email}`,
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
                text: _editableContent.eligibilityCriteria.join('\n'),
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
                text: _editableContent.termsAndConditions.join('\n'),
                size: 11
              })
            ],
            spacing: { after: 200 }
          })
        ]
      }]
    });

    // Generate filename
    const filename = customFilename || `Commercial_Offer_${_editableData.company}_${formatDate()}.docx`;

    // Generate and download
    const buffer = await Packer.toBuffer(doc);
    const blob = new Blob([buffer as unknown as ArrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
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