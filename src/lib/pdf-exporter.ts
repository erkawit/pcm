import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * ส่งออกใบเสนอราคาเป็นไฟล์ PDF ขนาด A4 1 หน้ากระดาษโดยตรง
 * โดยไม่ผ่านฟังก์ชัน Print Dialog ของ Browser จึงไม่มีข้อมูล URL, วันที่ หรือหัวเว็บติดมา
 */
export async function exportQuotationToPdf(
  elementId: string,
  quotationNumber: string
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('ไม่พบข้อมูลเอกสารใบเสนอราคาสำหรับดาวน์โหลด');
  }

  // จับภาพ HTML Element เป็น Canvas ด้วยความละเอียดสูง (2.5x)
  const canvas = await html2canvas(element, {
    scale: 2.5,
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: '#ffffff',
  });

  const imgData = canvas.toDataURL('image/png', 1.0);

  // สร้างเอกสาร PDF ขนาดมาตรฐาน A4 แนวตั้ง (210 x 297 มม.)
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pdfWidth = 210;
  const pdfHeight = 297;
  const margin = 5; // ขอบกระดาษ 5 มม.

  const printableWidth = pdfWidth - margin * 2;
  const printableHeight = pdfHeight - margin * 2;

  const imgRatio = canvas.width / canvas.height;
  let renderWidth = printableWidth;
  let renderHeight = printableWidth / imgRatio;

  // หากความสูงเกินหน้ากระดาษ A4 ให้ปรับสเกลพอดีความสูงอัตโนมัติ (ห้ามเกิน 1 หน้า)
  if (renderHeight > printableHeight) {
    renderHeight = printableHeight;
    renderWidth = printableHeight * imgRatio;
  }

  const offsetX = (pdfWidth - renderWidth) / 2;
  const offsetY = (pdfHeight - renderHeight) / 2;

  pdf.addImage(imgData, 'PNG', offsetX, offsetY, renderWidth, renderHeight, undefined, 'FAST');
  pdf.save(`ใบเสนอราคา_${quotationNumber}.pdf`);
}
