import { siteConfig } from "@/config/site";

const BRAND = "#17166F";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Shared table-based layout — email clients ignore most modern CSS, so
 * everything is inline and table-structured. */
function layout(title: string, bodyHtml: string): string {
  const logo = `${siteConfig.url}/logo.png`;
  return `<!doctype html>
<html lang="es">
<body style="margin:0;padding:0;background:#f5f6fa;font-family:Arial,Helvetica,sans-serif;color:#222222;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f6fa;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;">
        <tr><td align="center" style="padding:28px 24px 8px;">
          <img src="${logo}" alt="${escapeHtml(siteConfig.name)}" height="64" style="height:64px;width:auto;border:0;">
        </td></tr>
        <tr><td style="padding:16px 32px 32px;">
          <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:${BRAND};">${escapeHtml(title)}</h1>
          ${bodyHtml}
        </td></tr>
      </table>
      <p style="max-width:520px;margin:16px 0 0;font-size:12px;line-height:1.5;color:#666666;text-align:center;">
        Este es un mensaje automático de ${escapeHtml(siteConfig.name)}, por favor no lo respondas.
      </p>
    </td></tr>
  </table>
</body>
</html>`;
}

export function passwordResetEmail(input: { name: string; url: string; expiresInMinutes: number }) {
  const name = escapeHtml(input.name);
  const url = escapeHtml(input.url);
  const html = layout(
    "Restablecé tu contraseña",
    `<p style="margin:0 0 12px;font-size:15px;line-height:1.6;">Hola ${name},</p>
     <p style="margin:0 0 24px;font-size:15px;line-height:1.6;">Recibimos un pedido para cambiar la contraseña de tu cuenta. Tocá el botón para elegir una nueva:</p>
     <p style="margin:0 0 24px;text-align:center;">
       <a href="${url}" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;font-weight:bold;font-size:15px;padding:14px 28px;border-radius:999px;">Restablecer contraseña</a>
     </p>
     <p style="margin:0 0 12px;font-size:13px;line-height:1.6;color:#666666;">El enlace vence en ${input.expiresInMinutes} minutos y solo se puede usar una vez.</p>
     <p style="margin:0 0 12px;font-size:13px;line-height:1.6;color:#666666;">Si el botón no funciona, copiá y pegá esta dirección en tu navegador:<br><a href="${url}" style="color:${BRAND};word-break:break-all;">${url}</a></p>
     <p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:#666666;">¿No pediste este cambio? Ignorá este correo: tu contraseña actual sigue funcionando.</p>`,
  );
  const text = `Hola ${input.name},

Recibimos un pedido para cambiar la contraseña de tu cuenta. Abrí este enlace para elegir una nueva:

${input.url}

El enlace vence en ${input.expiresInMinutes} minutos y solo se puede usar una vez.
¿No pediste este cambio? Ignorá este correo: tu contraseña actual sigue funcionando.`;
  return { subject: `Restablecé tu contraseña de ${siteConfig.name}`, html, text };
}

export function passwordChangedEmail(input: { name: string }) {
  const name = escapeHtml(input.name);
  const recoverUrl = `${siteConfig.url}/cuenta/recuperar`;
  const html = layout(
    "Cambiaste tu contraseña",
    `<p style="margin:0 0 12px;font-size:15px;line-height:1.6;">Hola ${name},</p>
     <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">Te avisamos que la contraseña de tu cuenta se cambió hace un momento.</p>
     <p style="margin:0;font-size:13px;line-height:1.6;color:#666666;">¿No fuiste vos? <a href="${escapeHtml(recoverUrl)}" style="color:${BRAND};">Restablecé tu contraseña ahora</a> para volver a proteger tu cuenta.</p>`,
  );
  const text = `Hola ${input.name},

Te avisamos que la contraseña de tu cuenta se cambió hace un momento.

¿No fuiste vos? Restablecela ahora: ${recoverUrl}`;
  return { subject: "Cambiaste tu contraseña", html, text };
}
