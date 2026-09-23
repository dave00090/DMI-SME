export interface PrintReceiptData {
  storeName: string;
  storeLocation: string;
  storePhone: string;
  storeTill: string;
  storePaybill: string;
  storeAccount?: string;
  taxPin?: string;
  cashierName?: string;
  receiptTitle: string;
  receiptNumber: string;
  dateStr: string;
  customerName: string;
  customerPhone?: string;
  items: Array<{
    productName: string;
    quantity: number;
    sellingPrice: number;
    discount?: number;
    total: number;
  }>;
  subtotal: number;
  totalDiscount: number;
  grandTotal: number;
  paymentMethod: string;
  paymentStatus?: string;
  autoPrinted?: boolean;
  mpesaCode?: string;
  creditDueDate?: string;
  notes?: string;
  receiptFooterMessage?: string;
  receiptReturnPolicy?: string;
  format?: 'thermal80' | 'a4';
}

/**
 * Builds printable HTML for 80mm POS Thermal printers or A4 Invoices
 */
export function generateReceiptHtml(data: PrintReceiptData): string {
  const isA4 = data.format === 'a4';

  if (isA4) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${data.receiptTitle} - ${data.receiptNumber}</title>
          <style>
            @page { size: A4 portrait; margin: 15mm; }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              color: #1e293b;
              background: #fff;
              font-size: 13px;
              line-height: 1.5;
              padding: 20px;
            }
            .header-table { width: 100%; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 20px; }
            .store-name { font-size: 24px; font-weight: 800; color: #0f172a; text-transform: uppercase; }
            .store-sub { font-size: 13px; color: #475569; margin-top: 2px; }
            .receipt-badge { text-align: right; }
            .receipt-title { font-size: 18px; font-weight: 800; color: #1d4ed8; text-transform: uppercase; }
            .receipt-no { font-size: 14px; font-weight: bold; font-family: monospace; color: #334155; margin-top: 4px; }
            
            .meta-grid { display: flex; justify-content: space-between; margin-bottom: 24px; padding: 14px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
            .meta-col { flex: 1; }
            .meta-label { font-size: 11px; text-transform: uppercase; font-weight: bold; color: #64748b; margin-bottom: 2px; }
            .meta-val { font-weight: 600; color: #0f172a; }

            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
            .items-table th { background: #f1f5f9; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; font-weight: 700; color: #475569; border-bottom: 2px solid #cbd5e1; }
            .items-table td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }

            .summary-table { width: 340px; margin-left: auto; margin-bottom: 24px; }
            .summary-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; color: #475569; }
            .grand-total-row { display: flex; justify-content: space-between; padding: 10px 0; font-size: 18px; font-weight: 800; color: #0f172a; border-top: 2px solid #0f172a; border-bottom: 2px solid #0f172a; margin-top: 6px; }

            .payment-card { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; }
            .payment-title { font-weight: 700; color: #166534; font-size: 12px; text-transform: uppercase; margin-bottom: 4px; }
            .payment-detail { font-size: 13px; color: #14532d; }

            .footer-notes { border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center; font-size: 11px; color: #64748b; line-height: 1.6; }
            .footer-thanks { font-size: 13px; font-weight: 700; color: #1e293b; margin-bottom: 4px; text-transform: uppercase; }
          </style>
        </head>
        <body>
          <table class="header-table">
            <tr>
              <td style="vertical-align: top;">
                <div class="store-name">${data.storeName}</div>
                <div class="store-sub">${data.storeLocation}</div>
                <div class="store-sub">Tel: ${data.storePhone} | Till: ${data.storeTill} | Paybill: ${data.storePaybill}${data.storeAccount ? ` (Acc: ${data.storeAccount})` : ''}</div>
                ${data.taxPin ? `<div class="store-sub">KRA PIN: ${data.taxPin}</div>` : ''}
              </td>
              <td class="receipt-badge" style="vertical-align: top;">
                <div class="receipt-title">${data.receiptTitle}</div>
                <div class="receipt-no">${data.receiptNumber}</div>
                <div class="store-sub" style="margin-top: 4px;">Date: ${data.dateStr}</div>
              </td>
            </tr>
          </table>

          <div class="meta-grid">
            <div class="meta-col">
              <div class="meta-label">Billed To / Customer</div>
              <div class="meta-val">${data.customerName || 'Cash Customer'}</div>
              ${data.customerPhone ? `<div style="font-size: 12px; color: #64748b;">${data.customerPhone}</div>` : ''}
            </div>
            <div class="meta-col">
              <div class="meta-label">Payment Method</div>
              <div class="meta-val" style="text-transform: uppercase;">${data.paymentMethod}</div>
              ${data.mpesaCode ? `<div style="font-size: 12px; color: #166534; font-family: monospace; font-weight: bold;">Ref: ${data.mpesaCode}</div>` : ''}
              ${data.paymentStatus ? `<div style="margin-top: 4px;"><span style="background: #dcfce7; color: #166534; font-weight: 800; padding: 2px 7px; border-radius: 4px; font-size: 11px; border: 1px solid #bbf7d0;">STATUS: ${data.paymentStatus.toUpperCase()} ✓</span></div>` : ''}
            </div>
            <div class="meta-col">
              <div class="meta-label">Served By</div>
              <div class="meta-val">${data.cashierName || 'Attendant'}</div>
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 45%;">Item Description</th>
                <th class="text-center" style="width: 15%;">Qty</th>
                <th class="text-right" style="width: 20%;">Unit Price (KSh)</th>
                <th class="text-right" style="width: 20%;">Total (KSh)</th>
              </tr>
            </thead>
            <tbody>
              ${(data.items || []).map((item) => `
                <tr>
                  <td>
                    <div style="font-weight: 600; color: #0f172a;">${item.productName}</div>
                    ${item.discount ? `<div style="font-size: 11px; color: #16a34a;">Discount applied: -KSh ${(item.discount || 0).toLocaleString()}</div>` : ''}
                  </td>
                  <td class="text-center font-bold">${item.quantity}</td>
                  <td class="text-right">${(item.sellingPrice || 0).toLocaleString()}</td>
                  <td class="text-right" style="font-weight: 700;">${(item.total || 0).toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="summary-table">
            <div class="summary-row">
              <span>Subtotal:</span>
              <span>KSh ${(data.subtotal || 0).toLocaleString()}</span>
            </div>
            ${(data.totalDiscount || 0) > 0 ? `
              <div class="summary-row" style="color: #16a34a; font-weight: 600;">
                <span>Total Discount:</span>
                <span>-KSh ${(data.totalDiscount || 0).toLocaleString()}</span>
              </div>
            ` : ''}
            <div class="grand-total-row">
              <span>TOTAL DUE:</span>
              <span>KSh ${(data.grandTotal || 0).toLocaleString()}</span>
            </div>
          </div>

          ${data.notes ? `
            <div style="padding: 10px 14px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 6px; font-size: 12px; margin-bottom: 20px;">
              <span style="font-weight: bold; color: #92400e;">Note / Remarks:</span> ${data.notes}
            </div>
          ` : ''}

          <div class="footer-notes">
            <div class="footer-thanks">${data.receiptFooterMessage || 'Asante sana kwa Biashara! Karibu Tena.'}</div>
            <div>${data.receiptReturnPolicy || 'Goods once sold in good order are not returnable without this original receipt.'}</div>
            <div style="margin-top: 6px; font-size: 10px; color: #94a3b8;">Computer Generated Receipt • DMi Business Hardware Edition</div>
          </div>
        </body>
      </html>
    `;
  }

  // 80mm POS Thermal Receipt Format
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${data.receiptNumber}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: 'Courier New', Courier, Monaco, monospace;
            font-size: 12px;
            line-height: 1.35;
            color: #000;
            background: #fff;
            padding: 12px 10px;
            width: 78mm;
            max-width: 300px;
            margin: 0 auto;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .bold { font-weight: bold; }
          
          .store-title {
            font-size: 15px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 3px;
          }
          .store-contact {
            font-size: 11px;
            margin-bottom: 2px;
          }
          .divider {
            border-top: 1px dashed #000;
            margin: 6px 0;
          }
          .double-divider {
            border-top: 2px solid #000;
            margin: 6px 0;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            margin-bottom: 2px;
          }
          .items-header {
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            border-bottom: 1px dashed #000;
            padding-bottom: 3px;
            margin-bottom: 4px;
          }
          .item-row {
            margin-bottom: 5px;
            font-size: 11px;
          }
          .item-top {
            display: flex;
            justify-content: space-between;
            font-weight: bold;
          }
          .item-sub {
            font-size: 10px;
            color: #333;
            padding-left: 2px;
          }
          .totals-block {
            margin-top: 4px;
          }
          .grand-total-row {
            display: flex;
            justify-content: space-between;
            font-size: 14px;
            font-weight: 900;
            border-top: 1px solid #000;
            border-bottom: 1px solid #000;
            padding: 4px 0;
            margin: 4px 0;
          }
          .mpesa-badge {
            border: 1px dashed #000;
            padding: 4px 6px;
            margin: 5px 0;
            text-align: center;
            font-size: 11px;
          }
          .footer-text {
            text-align: center;
            font-size: 10px;
            line-height: 1.4;
            margin-top: 8px;
            padding-top: 6px;
            border-top: 1px dashed #000;
          }
          @media print {
            body {
              width: 100%;
              max-width: 100%;
              padding: 2mm 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="text-center">
          <div class="store-title">${data.storeName}</div>
          <div class="store-contact">${data.storeLocation}</div>
          <div class="store-contact">Tel: ${data.storePhone}</div>
          <div class="store-contact bold">Till: ${data.storeTill} | Paybill: ${data.storePaybill}${data.storeAccount ? ` (Acc: ${data.storeAccount})` : ''}</div>
          ${data.taxPin ? `<div class="store-contact">PIN: ${data.taxPin}</div>` : ''}
          <div class="divider"></div>
          <div class="bold" style="font-size: 12px; letter-spacing: 0.5px;">${data.receiptTitle}</div>
        </div>

        <div class="divider"></div>

        <div class="info-row">
          <span>Receipt No:</span>
          <span class="bold">${data.receiptNumber}</span>
        </div>
        <div class="info-row">
          <span>Date/Time:</span>
          <span>${data.dateStr}</span>
        </div>
        <div class="info-row">
          <span>Customer:</span>
          <span class="bold">${data.customerName || 'Cash Customer'}</span>
        </div>
        ${data.cashierName ? `
          <div class="info-row">
            <span>Served by:</span>
            <span>${data.cashierName}</span>
          </div>
        ` : ''}

        <div class="divider"></div>

        <div class="items-header">
          <span>Item & Qty</span>
          <span>Total (KSh)</span>
        </div>

        <div>
          ${(data.items || []).map((item) => `
            <div class="item-row">
              <div class="item-top">
                <span>${item.productName}</span>
                <span>KSh ${(item.total || 0).toLocaleString()}</span>
              </div>
              <div class="item-sub">
                ${item.quantity} x KSh ${(item.sellingPrice || 0).toLocaleString()}
                ${item.discount ? ` (-KSh ${(item.discount || 0).toLocaleString()} disc)` : ''}
              </div>
            </div>
          `).join('')}
        </div>

        <div class="divider"></div>

        <div class="totals-block">
          <div class="info-row">
            <span>Subtotal:</span>
            <span>KSh ${(data.subtotal || 0).toLocaleString()}</span>
          </div>
          ${(data.totalDiscount || 0) > 0 ? `
            <div class="info-row">
              <span>Discount:</span>
              <span>-KSh ${(data.totalDiscount || 0).toLocaleString()}</span>
            </div>
          ` : ''}
          <div class="grand-total-row">
            <span>TOTAL:</span>
            <span>KSh ${(data.grandTotal || 0).toLocaleString()}</span>
          </div>
        </div>

        <div class="info-row" style="margin-top: 4px;">
          <span>Payment Mode:</span>
          <span class="bold" style="text-transform: uppercase;">${data.paymentMethod}</span>
        </div>

        ${data.paymentStatus ? `
          <div class="info-row" style="margin-top: 2px;">
            <span>Order Status:</span>
            <span class="bold" style="border: 1px solid #000; padding: 1px 4px; font-size: 10px;">${data.paymentStatus.toUpperCase()} ✓</span>
          </div>
        ` : ''}

        ${data.mpesaCode ? `
          <div class="mpesa-badge">
            <span class="bold">M-PESA CONFIRMED</span><br/>
            Ref: <span class="bold">${data.mpesaCode}</span>
          </div>
        ` : ''}

        ${data.creditDueDate ? `
          <div class="info-row" style="margin-top: 2px;">
            <span>Credit Due:</span>
            <span class="bold">${data.creditDueDate}</span>
          </div>
        ` : ''}

        ${data.notes ? `
          <div class="item-sub" style="margin-top: 4px; font-style: italic;">
            Note: ${data.notes}
          </div>
        ` : ''}

        <div class="footer-text">
          <div class="bold">${data.receiptFooterMessage || 'Asante sana kwa Biashara! Karibu Tena.'}</div>
          <div style="margin-top: 3px;">${data.receiptReturnPolicy || 'Goods once sold in good order are not returnable without original receipt.'}</div>
          <div style="margin-top: 5px; color: #555; font-size: 9px;">• Digital Record • DMi Business OS •</div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Executes high-reliability printing using an isolated hidden iframe
 * with automatic fallback to window.print().
 */
export function executePrintReceipt(data: PrintReceiptData): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const htmlContent = generateReceiptHtml(data);

      // Create an invisible iframe
      const printIframe = document.createElement('iframe');
      printIframe.name = `print-frame-${Date.now()}`;
      printIframe.style.position = 'fixed';
      printIframe.style.right = '0';
      printIframe.style.bottom = '0';
      printIframe.style.width = '0';
      printIframe.style.height = '0';
      printIframe.style.border = '0';
      printIframe.style.zIndex = '-9999';
      document.body.appendChild(printIframe);

      const frameDoc = printIframe.contentDocument || printIframe.contentWindow?.document;
      if (!frameDoc) {
        console.warn('Cannot access iframe document, executing window.print fallback');
        window.print();
        resolve(true);
        return;
      }

      frameDoc.open();
      frameDoc.write(htmlContent);
      frameDoc.close();

      // Ensure styles and DOM are fully processed before triggering print
      setTimeout(() => {
        try {
          const win = printIframe.contentWindow;
          if (win) {
            win.focus();
            win.print();
            resolve(true);
          } else {
            window.print();
            resolve(true);
          }
        } catch (err) {
          console.error('Print execution via iframe error, falling back:', err);
          window.print();
          resolve(true);
        } finally {
          // Clean up DOM iframe after 3 seconds
          setTimeout(() => {
            if (document.body.contains(printIframe)) {
              document.body.removeChild(printIframe);
            }
          }, 3000);
        }
      }, 300);
    } catch (e) {
      console.error('Print failed completely, triggering native window.print():', e);
      try {
        window.print();
      } catch (err) {
        console.error('window.print failed:', err);
      }
      resolve(false);
    }
  });
}

/**
 * Utility to download the receipt as an HTML file as an offline backup
 */
export function downloadReceiptHtml(data: PrintReceiptData, fileName = `Receipt-${data.receiptNumber}.html`): void {
  const html = generateReceiptHtml(data);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
