import nodemailer from 'nodemailer';

type WelcomeEmailInput = {
  appUrl: string;
  businessName: string;
  ownerEmail: string;
  ownerFirstName: string;
  ownerPassword: string;
  onboardingLink: string;
};

type SendWelcomeEmailResult =
  | { sent: true }
  | { sent: false; reason: string };

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;',
    };

    return entities[character];
  });
}

function createWelcomeEmailHtml({
  appUrl,
  businessName,
  ownerEmail,
  ownerFirstName,
  ownerPassword,
  onboardingLink,
}: WelcomeEmailInput) {
  const name = escapeHtml(ownerFirstName.trim() || 'Ciao');
  const organization = escapeHtml(businessName);
  const email = escapeHtml(ownerEmail);
  const password = escapeHtml(ownerPassword);
  const logoUrl = `${appUrl}/brand/rivo-logo.png`;

  return `<!doctype html>
<html lang="it">
  <body style="margin:0;padding:0;background:#09090b;font-family:Arial,Helvetica,sans-serif;color:#f4f4f5;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#09090b;padding:36px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background:#121214;border:1px solid #27272a;border-radius:20px;overflow:hidden;">
          <tr><td style="padding:30px 36px 24px;background:linear-gradient(135deg,#16161a 0%,#09090b 68%);border-bottom:1px solid #27272a;">
            <img src="${logoUrl}" width="136" alt="RIVO" style="display:block;width:136px;height:auto;border:0;" />
            <div style="margin-top:26px;width:44px;height:4px;background:#bfff00;border-radius:999px;"></div>
            <h1 style="margin:16px 0 0;font-size:28px;line-height:34px;letter-spacing:-.5px;color:#ffffff;">La tua dashboard è pronta.</h1>
          </td></tr>
          <tr><td style="padding:32px 36px 10px;">
            <p style="margin:0 0 16px;font-size:16px;line-height:25px;color:#e4e4e7;">${name}, benvenuto in RIVO.</p>
            <p style="margin:0;font-size:15px;line-height:24px;color:#a1a1aa;">Abbiamo attivato lo spazio di <strong style="color:#ffffff;">${organization}</strong>. Da qui puoi gestire i tuoi dispositivi NFC e QR, le sedi e le interazioni.</p>
          </td></tr>
          <tr><td style="padding:24px 36px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#18181b;border:1px solid #303035;border-radius:14px;">
              <tr><td style="padding:18px 20px 10px;font-size:11px;font-weight:700;letter-spacing:1.2px;color:#bfff00;text-transform:uppercase;">Le tue credenziali</td></tr>
              <tr><td style="padding:0 20px 18px;">
                <p style="margin:0 0 5px;font-size:12px;color:#71717a;">Email di accesso</p>
                <p style="margin:0 0 16px;font-size:15px;color:#ffffff;word-break:break-word;">${email}</p>
                <p style="margin:0 0 5px;font-size:12px;color:#71717a;">Password provvisoria</p>
                <p style="margin:0;font-family:Consolas,Monaco,monospace;font-size:15px;color:#ffffff;letter-spacing:.4px;">${password}</p>
              </td></tr>
            </table>
          </td></tr>
          <tr><td align="center" style="padding:4px 36px 28px;">
            <a href="${onboardingLink}" style="display:inline-block;background:#bfff00;color:#0a0a0b;text-decoration:none;font-size:15px;font-weight:700;padding:15px 24px;border-radius:10px;">Accedi alla mia dashboard&nbsp; →</a>
            <p style="margin:14px 0 0;font-size:12px;line-height:18px;color:#71717a;">Questo è il tuo link personale di accesso. Per sicurezza, usalo una sola volta.</p>
          </td></tr>
          <tr><td style="padding:20px 36px 30px;border-top:1px solid #27272a;">
            <p style="margin:0;font-size:13px;line-height:20px;color:#a1a1aa;"><strong style="color:#ffffff;">Un ultimo passaggio importante:</strong> dopo l’accesso vai su <span style="color:#bfff00;">Impostazioni</span> e sostituisci la password provvisoria con una personale e riservata.</p>
          </td></tr>
        </table>
        <p style="margin:18px 0 0;font-size:12px;color:#52525b;">RIVO · Tecnologia che porta le persone dove conta.</p>
      </td></tr>
    </table>
  </body>
</html>`;
}

export async function sendWelcomeEmail(input: WelcomeEmailInput): Promise<SendWelcomeEmailResult> {
  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailAppPassword) {
    return {
      sent: false,
      reason: 'Email non inviata: configura GMAIL_USER e GMAIL_APP_PASSWORD sul server.',
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    });

    await transporter.sendMail({
      from: `RIVO <${gmailUser}>`,
      to: [input.ownerEmail],
      subject: `Benvenuto in RIVO, ${input.businessName}`,
      html: createWelcomeEmailHtml(input),
    });

    return { sent: true };
  } catch {
    return {
      sent: false,
      reason: 'Email non inviata: Gmail ha rifiutato l’autenticazione o il messaggio.',
    };
  }
}
