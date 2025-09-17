// Print utilities for PDF preview modal

// Print the preview container with proper styling
export const printPreview = async (): Promise<void> => {
  try {
    const element = document.getElementById("pdf-preview");
    if (!element) {
      throw new Error("PDF preview element not found");
    }

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error("Could not open print window");
    }

    // Get the HTML content
    const htmlContent = element.outerHTML;

    // Create the print document
    const printDocument = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Commercial Offer - Print</title>
        <style>
          /* Reset margins and padding */
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100%;
            height: 100%;
            font-family: Helvetica, Arial, sans-serif;
            font-size: 10px;
            line-height: 1.4;
            color: black;
            background-color: #E6F3FF;
          }

          /* Page setup */
          @page {
            size: A4 portrait;
            margin: 0;
          }

          /* Print container */
          .print-container {
            width: 210mm;
            min-height: 297mm;
            background-color: #E6F3FF;
            padding: 35mm 10mm 20mm 10mm;
            position: relative;
          }

          /* Fixed header */
          header {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 30mm;
            background-color: #E6F3FF;
            text-align: center;
            border-bottom: 1px solid #ccc;
            padding: 5mm 10mm;
            z-index: 1000;
          }

          /* Fixed footer */
          footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 15mm;
            background-color: #E6F3FF;
            text-align: center;
            border-top: 1px solid #ccc;
            padding: 2mm 10mm;
            z-index: 1000;
          }

          /* Main content area */
          main {
            margin-top: 35mm;
            margin-bottom: 20mm;
            background-color: #E6F3FF;
          }

          /* Ensure colors print */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Tailwind color overrides for print */
          .bg-blue-100 { background-color: #dbeafe !important; }
          .bg-blue-50 { background-color: #eff6ff !important; }
          .text-blue-600 { color: #2563eb !important; }
          .text-red-600 { color: #dc2626 !important; }
          .text-gray-800 { color: #1f2937 !important; }
          .text-gray-500 { color: #6b7280 !important; }
          .border-gray-300 { border-color: #d1d5db !important; }
          .border-black { border-color: #000000 !important; }

          /* Hide document header in print mode */
          .print\\:hidden {
            display: none !important;
          }

          /* Specifically hide the document header section in print */
          .pdf-content > div:first-child {
            display: none !important;
          }

          /* Hide document header by targeting the V4U logo section */
          .pdf-content .text-5xl.font-bold.text-blue-600 {
            display: none !important;
          }

          /* Hide the commercial offer header in document content */
          .pdf-content .pdf-commercial-offer-header {
            display: none !important;
          }

          /* Table styles */
          table {
            border-collapse: collapse !important;
            width: 100% !important;
            margin-bottom: 0.5rem !important;
            table-layout: fixed !important;
          }

          th, td {
            border: 1px solid #000 !important;
            padding: 6px !important;
            text-align: left !important;
            font-size: 10px !important;
            vertical-align: top !important;
          }

          th {
            background-color: #dbeafe !important;
            font-weight: bold !important;
          }

          td {
            background-color: #ffffff !important;
          }

          /* Flex-based table styling (for WORK SCOPE and PROPOSED BENEFITS) */
          .flex {
            display: flex !important;
          }

          .flex > div {
            border: 1px solid #000 !important;
            padding: 6px !important;
            font-size: 10px !important;
            vertical-align: top !important;
            box-sizing: border-box !important;
          }

          .flex.bg-blue-100 {
            background-color: #dbeafe !important;
          }

          .flex.bg-blue-100 > div {
            background-color: #dbeafe !important;
            font-weight: bold !important;
          }

          .flex:not(.bg-blue-100) > div {
            background-color: #ffffff !important;
          }

          /* Specific table styling for PROPOSED BENEFITS table */
          .border.border-black.rounded.bg-blue-100 .flex {
            border-left: none !important;
            border-right: none !important;
          }

          .border.border-black.rounded.bg-blue-100 .flex:first-child {
            border-top: none !important;
          }

          .border.border-black.rounded.bg-blue-100 .flex:last-child {
            border-bottom: none !important;
          }

          /* Ensure proper spacing and alignment for table cells */
          .border.border-black.rounded.bg-blue-100 .flex > div {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }

          .border.border-black.rounded.bg-blue-100 .flex > div.text-center {
            justify-content: center !important;
          }

          .border.border-black.rounded.bg-blue-100 .flex > div:not(.text-center) {
            justify-content: flex-start !important;
          }

          /* Force white background for data rows */
          .flex.bg-white {
            background-color: #ffffff !important;
          }

          .flex.bg-white > div {
            background-color: #ffffff !important;
          }

          /* Force white background for table data cells */
          td.bg-white {
            background-color: #ffffff !important;
          }

          tr.bg-white {
            background-color: #ffffff !important;
          }

          /* Border utilities for flex tables */
          .border-r {
            border-right: 1px solid #000 !important;
          }

          .border-b {
            border-bottom: 1px solid #000 !important;
          }

          .border-t {
            border-top: 1px solid #000 !important;
          }

          .border-l {
            border-left: 1px solid #000 !important;
          }

          /* Table container styling */
          .border.border-black.rounded.bg-blue-100 {
            background-color: #dbeafe !important;
            border: 1px solid #000 !important;
            border-radius: 4px !important;
            overflow: hidden !important;
          }

          /* Width utilities for table cells */
          .w-16 {
            width: 4rem !important;
            min-width: 4rem !important;
            max-width: 4rem !important;
          }

          .w-20 {
            width: 5rem !important;
            min-width: 5rem !important;
            max-width: 5rem !important;
          }

          .w-32 {
            width: 8rem !important;
            min-width: 8rem !important;
            max-width: 8rem !important;
          }

          .w-\\[30\\%\\] {
            width: 30% !important;
            min-width: 30% !important;
          }

          .w-\\[70\\%\\] {
            width: 70% !important;
            min-width: 70% !important;
          }

          .flex-1 {
            flex: 1 !important;
            min-width: 0 !important;
          }

          /* Text alignment utilities */
          .text-center {
            text-align: center !important;
          }

          .text-left {
            text-align: left !important;
          }

          .text-right {
            text-align: right !important;
          }

          /* Font weight utilities */
          .font-bold {
            font-weight: bold !important;
          }

          /* Text color utilities */
          .text-red-600 {
            color: #dc2626 !important;
          }

          /* Page breaks */
          .page-break-before { page-break-before: always !important; }
          .page-break-after { page-break-after: always !important; }
          .avoid-page-break { page-break-inside: avoid !important; }

          /* Compact spacing */
          .mb-4 { margin-bottom: 0.5rem !important; }
          .mb-2 { margin-bottom: 0.25rem !important; }
          .mb-3 { margin-bottom: 0.375rem !important; }
          .mb-6 { margin-bottom: 0.75rem !important; }

          /* Text styles */
          .text-xs { font-size: 10px !important; }
          .text-sm { font-size: 12px !important; }
          .text-base { font-size: 14px !important; }
          .text-lg { font-size: 16px !important; }
          .text-xl { font-size: 18px !important; }
          .text-2xl { font-size: 20px !important; }
          .text-5xl { font-size: 36px !important; }

          .font-bold { font-weight: bold !important; }
          .font-medium { font-weight: 500 !important; }

          .text-center { text-align: center !important; }
          .text-left { text-align: left !important; }
          .text-right { text-align: right !important; }

          /* Layout */
          .flex { display: flex !important; }
          .flex-col { flex-direction: column !important; }
          .items-center { align-items: center !important; }
          .justify-center { justify-content: center !important; }
          .w-full { width: 100% !important; }
          .h-full { height: 100% !important; }

          /* Borders */
          .border { border: 1px solid #000 !important; }
          .border-t { border-top: 1px solid #000 !important; }
          .border-b { border-bottom: 1px solid #000 !important; }
          .border-l { border-left: 1px solid #000 !important; }
          .border-r { border-right: 1px solid #000 !important; }

          .rounded { border-radius: 4px !important; }

          /* Padding and margins */
          .p-2 { padding: 0.5rem !important; }
          .p-4 { padding: 1rem !important; }
          .p-6 { padding: 1.5rem !important; }
          .p-8 { padding: 2rem !important; }

          .px-1 { padding-left: 0.25rem !important; padding-right: 0.25rem !important; }
          .px-2 { padding-left: 0.5rem !important; padding-right: 0.5rem !important; }
          .px-4 { padding-left: 1rem !important; padding-right: 1rem !important; }

          .py-0\.5 { padding-top: 0.125rem !important; padding-bottom: 0.125rem !important; }
          .py-2 { padding-top: 0.5rem !important; padding-bottom: 0.5rem !important; }

          .mt-2 { margin-top: 0.5rem !important; }
          .mt-4 { margin-top: 1rem !important; }
          .mt-6 { margin-top: 1.5rem !important; }

          .-mt-1 { margin-top: -0.25rem !important; }
          .-mt-2 { margin-top: -0.5rem !important; }
          .-mt-4 { margin-top: -1rem !important; }

          .-mx-8 { margin-left: -2rem !important; margin-right: -2rem !important; }

          /* Space utilities */
          .space-y-1 > * + * { margin-top: 0.25rem !important; }
          .space-y-2 > * + * { margin-top: 0.5rem !important; }

          /* Hide elements that shouldn't print */
          .hidden { display: none !important; }
          .print\\:block { display: block !important; }

          /* Input styles */
          .pdf-input-min-height {
            min-height: 1.2em !important;
          }

          /* Commercial offer header */
          .pdf-commercial-offer-header {
            background-color: #f3f4f6 !important;
            border: 1px solid #d1d5db !important;
            border-radius: 4px !important;
          }
        </style>
      </head>
      <body>
        <header>
          <div style="font-size: 24px; font-weight: bold; color: #2563eb; margin-bottom: 5px;">V4U</div>
          <div style="font-size: 14px; color: #2563eb; margin-bottom: 10px;">Biz Solutions</div>
          <div style="font-size: 16px; font-weight: bold; color: #1f2937;">Commercial Offer for Subsidy Work</div>
        </header>

        <main>
          <div class="print-container">
            ${htmlContent}
          </div>
        </main>

        <footer>
          <div style="font-size: 10px; color: #6b7280;">Confidential – V4U Biz Solutions</div>
        </footer>
      </body>
      </html>
    `;

    // Write content to print window
    printWindow.document.write(printDocument);
    printWindow.document.close();

    // Wait for content to load, then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    };

  } catch (error) {
    console.error("Print failed:", error);
    alert("Print failed. Please try again.");
  }
};

// Setup Ctrl+P keyboard shortcut
export const setupPrintShortcut = (): (() => void) => {
  const handleKeyDown = (event: KeyboardEvent) => {
    // Check for Ctrl+P (Windows/Linux) or Cmd+P (Mac)
    if ((event.ctrlKey || event.metaKey) && event.key === 'p') {
      event.preventDefault(); // Prevent default browser print
      printPreview();
    }
  };

  // Add event listener
  document.addEventListener('keydown', handleKeyDown);

  // Return cleanup function
  return (): void => {
    document.removeEventListener('keydown', handleKeyDown);
  };
};

// Cleanup function for print shortcut
export const cleanupPrintShortcut = (): void => {
  // This would be called when component unmounts
  // The actual cleanup is handled by the returned function from setupPrintShortcut
};