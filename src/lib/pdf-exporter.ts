import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

/**
 * ส่งออกใบเสนอราคาเป็นไฟล์ PDF ขนาด A4 1 หน้ากระดาษโดยตรง
 * - เริ่มแสดงผลจากด้านบน ห่างจากขอบบน 1 นิ้ว (25.4 มม.)
 * - ตัดเส้นขอบ Card และเงาออก เพื่อให้เนียนไปกับหน้ากระดาษ A4 เหมือนเอกสารพิมพ์จริง
 * - ปรับสเกลให้อยู่ใน 1 หน้า A4 เสมอ (ห้ามเกิน 1 หน้า)
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
  // พร้อมปลดกรอบมนและเงาของ Card บนหน้าเว็บออกในตอนส่งออก PDF
  const canvas = await html2canvas(element, {
    scale: 2.5,
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: '#ffffff',
    onclone: (clonedDoc) => {
      const clonedEl = clonedDoc.getElementById(elementId);
      if (clonedEl) {
        clonedEl.style.border = 'none';
        clonedEl.style.boxShadow = 'none';
        clonedEl.style.borderRadius = '0';
        clonedEl.style.padding = '0';
      }
    },
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

  // กำหนดขอบกระดาษ: ด้านบน 1 นิ้ว (25.4 มม.), ด้านข้าง 12 มม., ด้านล่าง 15 มม.
  const marginTop = 25.4; // 1 นิ้วจากขอบบนตามที่กำหนด
  const marginSide = 12;  // ขอบซ้าย-ขวา
  const marginBottom = 15;

  const printableWidth = pdfWidth - marginSide * 2;
  const maxPrintableHeight = pdfHeight - marginTop - marginBottom;

  const imgRatio = canvas.width / canvas.height;
  let renderWidth = printableWidth;
  let renderHeight = printableWidth / imgRatio;

  // หากความสูงเกินพื้นที่หน้ากระดาษ ให้ปรับสเกลพอดีพื้นที่เพื่อล็อกให้อยู่ใน 1 หน้า A4 เสมอ
  if (renderHeight > maxPrintableHeight) {
    renderHeight = maxPrintableHeight;
    renderWidth = maxPrintableHeight * imgRatio;
  }

  // จัดกึ่งกลางแนวนอน (ซ้าย-ขวาเท่ากัน) และเริ่มจากขอบบน 1 นิ้ว
  const offsetX = (pdfWidth - renderWidth) / 2;
  const offsetY = marginTop;

  pdf.addImage(imgData, 'PNG', offsetX, offsetY, renderWidth, renderHeight, undefined, 'FAST');
  pdf.save(`ใบเสนอราคา_${quotationNumber}.pdf`);
}
