import nodemailer from 'nodemailer';

export interface InvitationEmailInput {
  appUrl: string;
  businessName: string;
  inviteeEmail: string;
  inviteeFirstName: string;
  roleName: string;
  inviteUrl: string;
  expiresInDays?: number;
}

type SendInvitationEmailResult =
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

export function createInvitationEmailHtml({
  appUrl,
  businessName,
  inviteeFirstName,
  roleName,
  inviteUrl,
  expiresInDays = 7,
}: InvitationEmailInput) {
  const name = escapeHtml(inviteeFirstName.trim() || 'Ciao');
  const org = escapeHtml(businessName);
  const role = escapeHtml(roleName);
  const logoUrl = `${appUrl}/brand/rivo-logo.png`;

  return `<!doctype html>
<html lang="it">
  <body style="margin:0;padding:0;background:#09090b;font-family:Arial,Helvetica,sans-serif;color:#f4f4f5;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#09090b;padding:36px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background:#121214;border:1px solid #27272a;border-radius:20px;overflow:hidden;">
          <tr><td style="padding:32px 36px 24px;background:linear-gradient(135deg,#16161a 0%,#09090b 68%);border-bottom:1px solid #27272a;">
            <img src="${logoUrl}" width="136" alt="RIVO" style="display:block;width:136px;height:auto;border:0;" />
            <div style="margin-top:24px;width:44px;height:4px;background:#bfff00;border-radius:999px;"></div>
            <h1 style="margin:16px 0 0;font-size:26px;line-height:32px;letter-spacing:-.5px;color:#ffffff;">Sei stato invitato a far parte del team.</h1>
          </td></tr>
          <tr><td style="padding:32px 36px 12px;">
            <p style="margin:0 0 16px;font-size:16px;line-height:25px;color:#e4e4e7;">${name},</p>
            <p style="margin:0;font-size:15px;line-height:24px;color:#a1a1aa;">
              Sei stato invitato a entrare nel team operativo di <strong style="color:#ffffff;">${org}</strong> su <strong style="color:#bfff00;">RIVO</strong> con il ruolo di <strong style="color:#ffffff;">${role}</strong>.
            </p>
          </td></tr>
          <tr><td style="padding:20px 36px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#18181b;border:1px solid #303035;border-radius:14px;">
              <tr><td style="padding:18px 20px 10px;font-size:11px;font-weight:700;letter-spacing:1.2px;color:#bfff00;text-transform:uppercase;">Dettagli dell'invito</td></tr>
              <tr><td style="padding:0 20px 18px;">
                <p style="margin:0 0 4px;font-size:12px;color:#71717a;">Attività</p>
                <p style="margin:0 0 14px;font-size:15px;color:#ffffff;">${org}</p>
                <p style="margin:0 0 4px;font-size:12px;color:#71717a;">Ruolo assegnato</p>
                <p style="margin:0;font-size:15px;color:#ffffff;">${role}</p>
              </td></tr>
            </table>
          </td></tr>
          <tr><td align="center" style="padding:10px 36px 28px;">
            <a href="${inviteUrl}" style="display:inline-block;background:#bfff00;color:#0a0a0b;text-decoration:none;font-size:15px;font-weight:700;padding:15px 28px;border-radius:10px;">Accetta Invito e Attiva Account&nbsp; →</a>
            <p style="margin:16px 0 0;font-size:12px;line-height:18px;color:#71717a;">Questo invito è riservato e scadrà tra ${expiresInDays} giorni.</p>
          </td></tr>
          <tr><td style="padding:20px 36px 26px;border-top:1px solid #27272a;">
            <p style="margin:0;font-size:12px;line-height:18px;color:#71717a;">
              Se il pulsante non funziona, copia e incolla questo link nel browser:<br />
              <a href="${inviteUrl}" style="color:#a1a1aa;word-break:break-all;">${inviteUrl}</a>
            </p>
          </td></tr>
        </table>
        <p style="margin:18px 0 0;font-size:12px;color:#52525b;">RIVO · Floor Operations & Hospitality Management</p>
      </td></tr>
    </table>
  </body>
</html>`;
}

export async function sendStaffInvitationEmail(input: InvitationEmailInput): Promise<SendInvitationEmailResult> {
  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailAppPassword) {
    return {
      sent: false,
      reason: 'Configurazione SMTP non trovata: imposta GMAIL_USER e GMAIL_APP_PASSWORD.',
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
      to: [input.inviteeEmail],
      subject: `Invito a collaborare su RIVO - ${input.businessName}`,
      html: createInvitationEmailHtml(input),
    });

    return { sent: true };
  } catch (err) {
    console.error('[Email] Failed to send staff invitation:', err);
    return {
      sent: false,
      reason: 'Impossibile recapitare l’email al server di destinazione.',
    };
  }
}
