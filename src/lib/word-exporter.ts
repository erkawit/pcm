import { Quotation, Organization } from '@/types/quotation';

/**
 * Generates and triggers download of a fully-formatted Microsoft Word document (.doc / Word XML HTML MIME)
 * containing the complete quotation layout, line items, bank payment details, and signature block.
 * Fully compatible with Microsoft Word, LibreOffice, Apple Pages, and Google Docs.
 */
export function exportQuotationToWord(quotation: Quotation, org: Organization) {
  const formatMoney = (val: number) => {
    return val.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const rowsHtml = quotation.items
    .map(
      (item, idx) => `
    <tr style="border-bottom: 1px dashed #d1d5db;">
      <td style="padding: 10px 8px; text-align: center; color: #4b5563; font-size: 13px;">${idx + 1}</td>
      <td style="padding: 10px 8px; color: #111827; font-weight: 500; font-size: 14px;">${item.name}</td>
      <td style="padding: 10px 8px; text-align: center; color: #374151; font-size: 14px;">${item.quantity}</td>
      <td style="padding: 10px 8px; text-align: right; color: #374151; font-size: 14px;">${formatMoney(item.unitPrice)}.-</td>
      <td style="padding: 10px 8px; text-align: right; font-weight: 600; color: #111827; font-size: 14px;">${formatMoney(item.totalPrice)}.-</td>
    </tr>
  `
    )
    .join('');

  const signatureImageTag = quotation.signatureDataUrl
    ? `<div style="text-align: center; margin-bottom: 6px;"><img src="${quotation.signatureDataUrl}" alt="Signature" style="max-height: 55px; max-width: 180px; object-fit: contain;" /></div>`
    : `<div style="height: 45px;"></div>`;

  const wordHtml = `
  <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
  <head>
    <meta charset="utf-8">
    <title>ใบเสนอราคา - ${quotation.quotationNumber}</title>
    <!--[if gte mso 9]>
    <xml>
      <w:WordDocument>
        <w:View>Print</w:View>
        <w:Zoom>100</w:Zoom>
        <w:DoNotOptimizeForBrowser/>
      </w:WordDocument>
    </xml>
    <![endif]-->
    <style>
      @page {
        size: A4 portrait;
        margin: 1.8cm 1.8cm 1.8cm 1.8cm;
        mso-header-margin: 36pt;
        mso-footer-margin: 36pt;
        mso-paper-source: 0;
      }
      body {
        font-family: 'TH Sarabun New', 'Sarabun', 'Cordia New', Tahoma, sans-serif;
        color: #222222;
        background-color: #ffffff;
        margin: 0;
        padding: 0;
      }
      .page-container {
        width: 100%;
        max-width: 760px;
        margin: 0 auto;
        padding: 24px;
        background: #ffffff;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      .header-title {
        font-size: 26pt;
        font-weight: bold;
        color: #1e293b;
        line-height: 1.1;
        margin: 0;
      }
      .header-subtitle {
        font-size: 18pt;
        font-weight: 600;
        color: #334155;
        margin: 0;
      }
      .label-text {
        font-size: 13pt;
        color: #64748b;
      }
      .val-text {
        font-size: 13pt;
        color: #0f172a;
        font-weight: 600;
      }
      .total-pill {
        background-color: #bfdbfe;
        color: #1e3a8a;
        font-weight: bold;
        font-size: 14pt;
        padding: 6px 14px;
        border-radius: 9999px;
        display: inline-block;
      }
      .footer-bar {
        background-color: #fef3c7;
        padding: 14px 20px;
        border-radius: 8px;
        margin-top: 35px;
      }
    </style>
  </head>
  <body>
    <div class="page-container">
      <!-- TOP HEADER -->
      <table style="width: 100%; margin-bottom: 25px;">
        <tr>
          <td style="width: 50%; vertical-align: top;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <h2 style="margin: 0; color: #0284c7; font-size: 20pt; font-weight: 800; letter-spacing: -0.5px;">${org.name}</h2>
            </div>
            <p style="margin: 3px 0 0 0; color: #64748b; font-size: 11pt;">${org.tagline || 'Official Media & Gaming Organization'}</p>
          </td>
          <td style="width: 50%; text-align: right; vertical-align: top;">
            <h1 class="header-title">ใบเสนอราคา</h1>
            <h2 class="header-subtitle">Quotation</h2>
            <p style="margin: 4px 0 0 0; color: #0284c7; font-weight: bold; font-size: 12pt;">เลขที่: ${quotation.quotationNumber}</p>
          </td>
        </tr>
      </table>

      <!-- CUSTOMER & DATE SECTION (Image 1 Layout) -->
      <table style="width: 100%; margin-bottom: 25px; border-top: 2px solid #f1f5f9; padding-top: 15px;">
        <tr>
          <td style="width: 60%; vertical-align: top; line-height: 1.6;">
            <table style="width: 100%;">
              <tr>
                <td style="width: 110px; color: #64748b; font-size: 12pt;">ชื่อลูกค้า</td>
                <td style="color: #0f172a; font-weight: bold; font-size: 13pt;">${quotation.customerName}</td>
              </tr>
              <tr>
                <td style="color: #64748b; font-size: 12pt; vertical-align: top;">ที่อยู่</td>
                <td style="color: #334155; font-size: 12pt;">${quotation.customerAddress || '-'}</td>
              </tr>
              <tr>
                <td style="color: #64748b; font-size: 12pt;">เลขผู้เสียภาษี</td>
                <td style="color: #334155; font-size: 12pt;">${quotation.customerTaxId || '-'}</td>
              </tr>
              <tr>
                <td style="color: #64748b; font-size: 12pt;">เบอร์โทรศัพท์</td>
                <td style="color: #334155; font-size: 12pt;">${quotation.customerPhone || '-'}</td>
              </tr>
            </table>
          </td>
          <td style="width: 40%; vertical-align: top; text-align: right;">
            <p style="margin: 0; font-size: 13pt;">
              <span style="color: #64748b;">วันที่ </span>
              <strong style="color: #0f172a;">${quotation.issueDate}</strong>
            </p>
            ${
              quotation.validUntil
                ? `<p style="margin: 4px 0 0 0; font-size: 11pt; color: #64748b;">กำหนดยืนราคาถึง: ${quotation.validUntil}</p>`
                : ''
            }
          </td>
        </tr>
      </table>

      <!-- ITEMS TABLE (Matches image 1 column order) -->
      <table style="width: 100%; margin-bottom: 25px; border-collapse: collapse;">
        <thead>
          <tr style="border-bottom: 2px solid #334155;">
            <th style="padding: 10px 8px; text-align: center; color: #1e293b; font-size: 13pt; width: 8%;">ลำดับ</th>
            <th style="padding: 10px 8px; text-align: left; color: #1e293b; font-size: 13pt; width: 47%;">รายการสินค้า</th>
            <th style="padding: 10px 8px; text-align: center; color: #1e293b; font-size: 13pt; width: 12%;">จำนวน</th>
            <th style="padding: 10px 8px; text-align: right; color: #1e293b; font-size: 13pt; width: 16%;">ราคา/หน่วย</th>
            <th style="padding: 10px 8px; text-align: right; color: #1e293b; font-size: 13pt; width: 17%;">ราคารวม</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <!-- SUMMARY & PAYMENT SECTION (Matches image 1 bottom structure) -->
      <table style="width: 100%; margin-top: 15px; margin-bottom: 25px;">
        <tr>
          <!-- PAYMENT CHANNELS -->
          <td style="width: 52%; vertical-align: top;">
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px;">
              <h3 style="margin: 0 0 8px 0; font-size: 13pt; font-weight: bold; color: #1e293b;">ช่องทางการชำระเงิน</h3>
              <p style="margin: 3px 0; font-size: 12pt; color: #475569;">
                <strong>ธนาคาร:</strong> ${quotation.paymentBankName || org.bankName}
              </p>
              <p style="margin: 3px 0; font-size: 12pt; color: #475569;">
                <strong>ชื่อบัญชี:</strong> ${quotation.paymentAccountName || org.bankAccountName}
              </p>
              <p style="margin: 3px 0; font-size: 12pt; color: #475569;">
                <strong>เลขที่บัญชี:</strong> <span style="font-family: monospace; font-weight: bold; color: #0f172a; font-size: 13pt;">${quotation.paymentAccountNumber || org.bankAccountNumber}</span>
              </p>
            </div>
          </td>

          <!-- TOTALS CALCULATION -->
          <td style="width: 48%; vertical-align: top; text-align: right;">
            <table style="width: 100%; margin-left: auto;">
              <tr>
                <td style="text-align: right; padding: 3px 8px; color: #475569; font-size: 12pt;">ราคารวม</td>
                <td style="text-align: right; padding: 3px 8px; font-weight: 600; color: #1e293b; font-size: 13pt; width: 130px;">
                  ${formatMoney(quotation.subtotal)}.-
                </td>
              </tr>
              <tr>
                <td style="text-align: right; padding: 3px 8px; color: #475569; font-size: 12pt;">ภาษีมูลค่าเพิ่ม (${quotation.vatPercent}%)</td>
                <td style="text-align: right; padding: 3px 8px; font-weight: 600; color: #1e293b; font-size: 13pt;">
                  ${formatMoney(quotation.vatAmount)}.-
                </td>
              </tr>
              ${
                quotation.discount > 0
                  ? `
              <tr>
                <td style="text-align: right; padding: 3px 8px; color: #ef4444; font-size: 12pt;">ส่วนลด</td>
                <td style="text-align: right; padding: 3px 8px; font-weight: 600; color: #ef4444; font-size: 13pt;">
                  -${formatMoney(quotation.discount)}.-
                </td>
              </tr>
              `
                  : ''
              }
              <tr>
                <td colspan="2" style="padding-top: 10px; text-align: right;">
                  <table style="margin-left: auto; background-color: #dbeafe; border-radius: 9999px; padding: 6px 16px;">
                    <tr>
                      <td style="color: #1e40af; font-weight: bold; font-size: 13pt; padding-right: 12px;">จำนวนเงินรวมทั้งสิ้น</td>
                      <td style="color: #1e3a8a; font-weight: 800; font-size: 16pt;">${formatMoney(quotation.grandTotal)}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- SIGNATURE SECTION -->
      <table style="width: 100%; margin-top: 30px; margin-bottom: 25px;">
        <tr>
          <td style="width: 50%;"></td>
          <td style="width: 50%; text-align: center;">
            <div style="display: inline-block; min-width: 240px; text-align: center;">
              ${signatureImageTag}
              <div style="border-top: 1px dotted #64748b; margin-top: 4px; margin-bottom: 8px;"></div>
              <p style="margin: 0; font-size: 13pt; font-weight: bold; color: #0f172a;">
                (${quotation.signatoryName || 'อดิตรา มอนด์บีนี'})
              </p>
              <p style="margin: 2px 0 0 0; font-size: 12pt; color: #475569; font-weight: 600;">
                ${quotation.signatoryPosition || 'ผู้จัดการ'}
              </p>
              ${
                quotation.signedAt
                  ? `<p style="margin: 2px 0 0 0; font-size: 10pt; color: #16a34a;">ลงนามเมื่อ: ${new Date(quotation.signedAt).toLocaleDateString('th-TH')}</p>`
                  : ''
              }
            </div>
          </td>
        </tr>
      </table>

      <!-- BOTTOM FOOTER (Matching Image 1 Borcelle Footer Style) -->
      <table style="width: 100%; background-color: #fef9c3; border-radius: 8px; padding: 14px 18px; margin-top: 20px;">
        <tr>
          <td style="width: 30%; vertical-align: middle;">
            <strong style="font-size: 15pt; color: #1e293b;">${org.name}</strong>
          </td>
          <td style="width: 35%; vertical-align: middle; font-size: 11pt; color: #334155; line-height: 1.4;">
            <div>✉️ ${org.email}</div>
            <div>🌐 ${org.website}</div>
          </td>
          <td style="width: 35%; vertical-align: middle; font-size: 11pt; color: #334155; line-height: 1.4;">
            <div>📞 ${org.phone}</div>
            <div>📍 ${org.address}</div>
          </td>
        </tr>
      </table>
    </div>
  </body>
  </html>
  `;

  // Create Blob and trigger instant browser download as .doc file (native Word opens it with 100% styling!)
  const blob = new Blob(['\ufeff', wordHtml], {
    type: 'application/msword;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ใบเสนอราคา_${quotation.quotationNumber}_${quotation.customerName.replace(/[^a-zA-Z0-9ก-๙]/g, '_')}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
