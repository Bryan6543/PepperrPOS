type BillVars = Record<string, string>;

export function applyTemplate(template: string, vars: BillVars): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => vars[key] ?? "");
}

export const defaultBillHtml = `<!-- Editable in Settings → Bill (print) -->
<div style="font-family:system-ui,sans-serif;max-width:420px;margin:0 auto;padding:16px;">
  {{logo_block}}
  <h1 style="margin:0 0 4px;font-size:22px;">{{company_name}}</h1>
  <p style="margin:0 0 12px;white-space:pre-line;color:#444;font-size:13px;">{{company_address}}</p>
  <p style="margin:0 0 16px;font-size:13px;">{{company_phone}}</p>
  <hr/>
  <p><strong>Order</strong> #{{order_number}} · {{created_at}}</p>
  <p>Order: {{order_type}} · Pay: {{payment_method}}</p>
  <p>Customer: {{customer_line}}</p>
  {{scheduled_block}}
  <table style="width:100%;border-collapse:collapse;margin-top:12px;font-size:14px;">
    <thead><tr><th align="left">Item</th><th align="right">Qty</th><th align="right">Amt</th></tr></thead>
    <tbody>{{line_rows}}</tbody>
  </table>
  <p style="text-align:right;margin-top:12px;font-size:16px;"><strong>Total {{total_lkr}}</strong></p>
  <p style="font-size:12px;color:#666;">Thank you for dining at Pepperr.</p>
</div>`;

export const defaultEmailBill = `Subject: Your Pepperr order #{{order_number}}

Hello{{customer_name}},

Thanks for your order ({{order_type}}, {{payment_method}}).

{{lines_text}}

Total: {{total_lkr}}

{{company_name}}
{{company_address}}
{{company_phone}}
`;

export const defaultSmsBill = `Pepperr: Order #{{order_number}} Total {{total_lkr}}. {{order_type}}. Thanks!`;

export const defaultSmsReady = `Pepperr: Hi{{customer_name}}, your order #{{order_number}} is ready for pickup.`;
