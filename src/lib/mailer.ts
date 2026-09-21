import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

import { siteConfig } from "@/config/site";

/**
 * Transactional email over SMTP. Works with any provider (Hostinger mailbox,
 * Gmail app password, Resend/SES SMTP, ...) — configured only through env:
 *
 *   SMTP_HOST, SMTP_PORT (default 465), SMTP_SECURE ("true"/"false", default
 *   true on 465), SMTP_USER, SMTP_PASS, MAIL_FROM (optional; defaults to
 *   "<site name> <SMTP_USER>").
 *
 * Never throws: callers treat email as best-effort and must not leak
 * whether a send happened (account-enumeration), so failures are logged
 * server-side and reported as `false`.
 */
export interface MailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export function isMailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

let cachedTransport: Transporter | null = null;

function getTransport(): Transporter {
  if (cachedTransport) return cachedTransport;
  const port = Number(process.env.SMTP_PORT ?? 465);
  const secure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465;
  cachedTransport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return cachedTransport;
}

export async function sendMail(input: MailInput): Promise<boolean> {
  if (!isMailConfigured()) {
    console.error(
      "[mail] SMTP no configurado (faltan SMTP_HOST / SMTP_USER / SMTP_PASS): no se envió el correo a",
      input.to,
    );
    return false;
  }

  try {
    await getTransport().sendMail({
      from: process.env.MAIL_FROM || `${siteConfig.name} <${process.env.SMTP_USER}>`,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
    return true;
  } catch (error) {
    console.error("[mail] falló el envío a", input.to, error);
    return false;
  }
}
