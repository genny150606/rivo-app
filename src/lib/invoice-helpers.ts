/**
 * Utility helpers for Italian Electronic Invoicing (Fattura Elettronica B2B / Agenzia delle Entrate)
 */

export interface InvoiceData {
  companyName: string;
  vatNumber: string;
  sdiCode: string;
  pec: string;
  address?: string;
}

/**
 * Parses raw text or XML string from an Agenzia delle Entrate QR Code
 */
export function parseAdeQrCode(rawText: string): Partial<InvoiceData> {
  const text = rawText.trim();
  const result: Partial<InvoiceData> = {};

  if (!text) return result;

  // 1. Check for XML format from Agenzia delle Entrate
  if (text.includes('<DatiFatturazione') || text.includes('<Denominazione>') || text.includes('<PartitaIVA>')) {
    const getTag = (tag: string) => {
      const match = text.match(new RegExp(`<${tag}[^>]*>([^<]+)<\/${tag}>`, 'i'));
      return match ? match[1].trim() : '';
    };

    const denominazione = getTag('Denominazione') || getTag('RagioneSociale') || getTag('Cognome') + ' ' + getTag('Nome');
    const piva = getTag('PartitaIVA') || getTag('CodiceFiscale');
    const sdi = getTag('CodiceDestinatario') || getTag('CodiceSDI');
    const pec = getTag('PEC') || getTag('Email');
    const via = getTag('Indirizzo');
    const cap = getTag('CAP');
    const comune = getTag('Comune');
    const prov = getTag('Provincia');

    if (denominazione) result.companyName = denominazione.trim();
    if (piva) result.vatNumber = piva.trim();
    if (sdi) result.sdiCode = sdi.trim().toUpperCase();
    if (pec) result.pec = pec.trim();
    const addressParts = [via, cap, comune, prov].filter(Boolean);
    if (addressParts.length > 0) result.address = addressParts.join(', ');

    return result;
  }

  // 2. Check for semicolon or newline delimited key-value pairs (e.g. PI:12345;CF:...;RA:...;)
  const patterns: Array<{ key: keyof InvoiceData; regexes: RegExp[] }> = [
    {
      key: 'vatNumber',
      regexes: [
        /(?:PI|PIVA|P\.IVA|Partita\s*IVA|CF|Codice\s*Fiscale)[:=\s]+([A-Z0-9]{11,16})/i,
        /\b([0-9]{11})\b/,
      ],
    },
    {
      key: 'companyName',
      regexes: [
        /(?:RA|RS|Ragione\s*Sociale|Denominazione|Nome)[:=\s]+([^;\n\r]+)/i,
        /(?:Company|Azienda)[:=\s]+([^;\n\r]+)/i,
      ],
    },
    {
      key: 'sdiCode',
      regexes: [
        /(?:CD|SDI|Codice\s*Destinatario|Codice\s*SDI)[:=\s]+([A-Z0-9]{7})/i,
        /\b([A-Z0-9]{7})\b/i,
      ],
    },
    {
      key: 'pec',
      regexes: [
        /(?:PC|PEC|Email)[:=\s]+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
        /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/,
      ],
    },
    {
      key: 'address',
      regexes: [
        /(?:IN|Indirizzo|Sede|Via)[:=\s]+([^;\n\r]+)/i,
      ],
    },
  ];

  for (const item of patterns) {
    for (const rx of item.regexes) {
      const match = text.match(rx);
      if (match && match[1]) {
        const val = match[1].trim();
        if (item.key === 'sdiCode') {
          result.sdiCode = val.toUpperCase();
        } else {
          result[item.key] = val;
        }
        break;
      }
    }
  }

  return result;
}

/**
 * Formats invoice data into a clean, ready-to-paste text block for the cashier / RT
 */
export function formatInvoiceForCashier(opts: {
  invoice?: {
    companyName?: string;
    vatNumber?: string;
    sdiCode?: string;
    pec?: string;
    address?: string;
  } | null;
  tableLabel?: string;
  total?: string;
  splitCount?: number;
  splitQuota?: string;
  paymentMethod?: string;
}): string {
  const lines: string[] = [];
  lines.push('=== DATI FATTURA ELETTRONICA - RIVO ===');

  if (opts.invoice?.companyName) {
    lines.push(`RAGIONE SOCIALE: ${opts.invoice.companyName}`);
  }
  if (opts.invoice?.vatNumber) {
    lines.push(`P.IVA / CF: ${opts.invoice.vatNumber}`);
  }
  if (opts.invoice?.sdiCode) {
    lines.push(`CODICE DESTINATARIO (SDI): ${opts.invoice.sdiCode.toUpperCase()}`);
  }
  if (opts.invoice?.pec) {
    lines.push(`PEC: ${opts.invoice.pec}`);
  }
  if (opts.invoice?.address) {
    lines.push(`INDIRIZZO: ${opts.invoice.address}`);
  }

  lines.push('----------------------------------------');
  if (opts.tableLabel) {
    lines.push(`TAVOLO: ${opts.tableLabel}`);
  }
  if (opts.total) {
    lines.push(`TOTALE: ${opts.total}`);
  }
  if (opts.splitCount && opts.splitCount > 1) {
    lines.push(`CONTO DIVISO (ALLA ROMANA): ${opts.splitCount} quote da ${opts.splitQuota || 'N/D'}`);
  }
  if (opts.paymentMethod) {
    lines.push(`METODO PAGAMENTO: ${opts.paymentMethod.toUpperCase() === 'POS' ? 'POS / CARTA' : 'CONTANTI'}`);
  }
  lines.push('========================================');

  return lines.join('\n');
}
