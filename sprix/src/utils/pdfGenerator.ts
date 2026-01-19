import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const downloadPDF = async (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id '${elementId}' not found`);
    return;
  }

  try {
    // 1. Capture the "Race Kit" element
    // We use scale 2 for good print quality without crashing the browser
    const canvas = await html2canvas(element, {
      scale: 2, 
      useCORS: true,
      backgroundColor: '#ffffff', // Force white background
    });

    const imgData = canvas.toDataURL('image/png');
    
    // 2. Create PDF (A4 size)
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // 3. Print the image full-size (A4 is 210mm x 297mm)
    // Since we designed the HTML to be A4 proportions, this fits perfectly.
    pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
    pdf.save(filename);

  } catch (err) {
    console.error("PDF generation failed:", err);
  }
};