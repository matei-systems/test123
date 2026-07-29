// Transaktionale E-Mails (z. B. Team-Einladungen) über die Resend HTTP-API.
// Genau wie bei Google Wallet: der eigentliche Nutzen (der Einladungslink)
// funktioniert IMMER, unabhängig davon, ob das hier konfiguriert ist - eine
// Admin-Person kann den Link auch manuell kopieren und verschicken. E-Mail-
// Versand ist ein optionaler Zusatz, der aktiv wird, sobald RESEND_API_KEY
// und EMAIL_FROM gesetzt sind. Kein Neu-Deploy nötig, kein neues npm-Paket -
// ein einzelner fetch()-Aufruf reicht für die Resend-API.
export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export interface InvitationEmailInput {
  to: string;
  orgName: string;
  role: string;
  acceptUrl: string;
}

export async function sendInvitationEmail(input: InvitationEmailInput): Promise<{ ok: boolean; error?: string }> {
  if (!isEmailConfigured()) return { ok: false, error: "not_configured" };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: input.to,
        subject: `Einladung zu ${input.orgName} auf Matei Loyalty`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
            <h2 style="color:#111">Du wurdest eingeladen</h2>
            <p><strong>${input.orgName}</strong> lädt dich als <strong>${input.role}</strong> zu Matei Loyalty ein.</p>
            <p><a href="${input.acceptUrl}" style="display:inline-block;background:#E8B573;color:#241a0c;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600">Einladung annehmen</a></p>
            <p style="color:#666;font-size:13px">Falls der Button nicht funktioniert: ${input.acceptUrl}</p>
          </div>
        `,
      }),
    });
    if (!res.ok) return { ok: false, error: `resend_${res.status}` };
    return { ok: true };
  } catch {
    return { ok: false, error: "network_error" };
  }
}
