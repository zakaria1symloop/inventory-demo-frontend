/**
 * Print a tabular report via the browser's print dialog. Renders in a new
 * window using HTML so that Arabic / RTL text is shaped correctly using
 * system fonts — avoids the jsPDF Latin-only font issue.
 */
export interface PrintReportOptions {
  title: string;
  subtitle?: string;
  columns: string[];
  rows: (string | number)[][];
  meta?: Record<string, string | number | undefined>;
  orientation?: 'portrait' | 'landscape';
  // Pass 'rtl' for Arabic UI, 'ltr' for French.
  dir?: 'rtl' | 'ltr';
}

const escape = (s: unknown): string => String(s ?? '').replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c
));

export function printReport(opts: PrintReportOptions): void {
  const { title, subtitle, columns, rows, meta, orientation = 'landscape', dir = 'rtl' } = opts;

  const metaHtml = meta
    ? Object.entries(meta)
        .filter(([, v]) => v !== undefined && v !== '')
        .map(([k, v]) => `<div><span class="meta-label">${escape(k)}:</span> <span class="meta-value">${escape(v)}</span></div>`)
        .join('')
    : '';

  const headerHtml = columns.map((c) => `<th>${escape(c)}</th>`).join('');
  const bodyHtml = rows
    .map((r) => `<tr>${r.map((cell) => `<td>${escape(cell)}</td>`).join('')}</tr>`)
    .join('');

  const html = `<!doctype html>
<html lang="${dir === 'rtl' ? 'ar' : 'fr'}" dir="${dir}">
<head>
  <meta charset="utf-8" />
  <title>${escape(title)}</title>
  <style>
    @page { size: A4 ${orientation}; margin: 12mm; }
    * { box-sizing: border-box; }
    body { font-family: 'Tajawal', 'Cairo', 'Noto Sans Arabic', system-ui, -apple-system, 'Segoe UI', sans-serif; font-size: 11px; color: #111; margin: 0; padding: 0; }
    h1 { font-size: 18px; margin: 0 0 4px; }
    .subtitle { color: #555; font-size: 12px; margin-bottom: 10px; }
    .meta { display: flex; flex-wrap: wrap; gap: 12px; margin: 8px 0 14px; padding: 8px 10px; background: #f6f7f8; border-radius: 6px; font-size: 11px; }
    .meta-label { color: #777; }
    .meta-value { font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin-top: 4px; }
    th, td { border: 1px solid #d4d4d4; padding: 6px 8px; text-align: ${dir === 'rtl' ? 'right' : 'left'}; vertical-align: top; }
    thead th { background: #f0f2f4; font-weight: 700; }
    tbody tr:nth-child(even) { background: #fafbfc; }
    .footer { margin-top: 14px; font-size: 10px; color: #888; text-align: ${dir === 'rtl' ? 'left' : 'right'}; }
    @media print {
      thead { display: table-header-group; }
      tr { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <h1>${escape(title)}</h1>
  ${subtitle ? `<div class="subtitle">${escape(subtitle)}</div>` : ''}
  ${metaHtml ? `<div class="meta">${metaHtml}</div>` : ''}
  <table>
    <thead><tr>${headerHtml}</tr></thead>
    <tbody>${bodyHtml}</tbody>
  </table>
  <div class="footer">${escape(new Date().toLocaleString())}</div>
  <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 500); };</script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=1100,height=800');
  if (!win) {
    throw new Error('Popup blocked');
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}
