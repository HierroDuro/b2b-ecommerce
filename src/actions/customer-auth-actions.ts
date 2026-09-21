"use server";

import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/config/site";
import { sendMail } from "@/lib/mailer";
import { passwordChangedEmail, passwordResetEmail } from "@/lib/email-templates";
import {
  RESET_COOLDOWN_MS,
  RESET_TOKEN_TTL_MS,
  hashResetToken,
  maskEmail,
} from "@/lib/password-reset";
import {
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  type RegisterInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
} from "@/lib/validations/customer-auth.schema";

const BCRYPT_ROUNDS = 12;

export type CustomerAuthResult =
  | { success: true; message: string; maskedEmail?: string }
  | { success: false; message: string; fieldErrors?: Record<string, string[]> };

/** Creates a customer account. The caller signs the session in afterward client-side. */
export async function registerCustomer(input: RegisterInput): Promise<CustomerAuthResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: "Revisá los campos marcados en el formulario.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { name, email, password } = parsed.data;
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  try {
    await prisma.user.create({
      data: { name, email: email.toLowerCase(), passwordHash },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { success: false, message: "Ya existe una cuenta con ese email." };
    }
    throw error;
  }

  return { success: true, message: "Cuenta creada correctamente." };
}

/**
 * Starts a password reset by emailing a one-time link.
 *
 * Deliberately answers the same way whether or not the email belongs to an
 * account (no "no encontramos esa cuenta"), so this endpoint can't be used
 * to discover which emails are registered. The link is NEVER returned to
 * the browser — it only travels by email. The send is fire-and-forget so
 * response time doesn't differ between existing and unknown emails.
 */
export async function requestPasswordReset(
  input: ForgotPasswordInput,
): Promise<CustomerAuthResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Ingresá un email válido." };
  }

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    const recent = await prisma.passwordResetToken.findFirst({
      where: {
        userId: user.id,
        usedAt: null,
        createdAt: { gt: new Date(Date.now() - RESET_COOLDOWN_MS) },
      },
    });

    // Within the cooldown a mail was just sent — don't spam the inbox.
    if (!recent) {
      // Only the newest link works: drop any earlier unused ones.
      await prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });

      const token = randomBytes(32).toString("hex");
      const hashed = hashResetToken(token);
      await prisma.passwordResetToken.create({
        data: {
          token: hashed,
          userId: user.id,
          expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
        },
      });

      const mail = passwordResetEmail({
        name: user.name,
        url: `${siteConfig.url}/cuenta/restablecer?token=${token}`,
        expiresInMinutes: RESET_TOKEN_TTL_MS / 60000,
      });

      void sendMail({ to: user.email, ...mail }).then(async (sent) => {
        // Nothing reached the user: free the cooldown so they can retry.
        if (!sent) await prisma.passwordResetToken.deleteMany({ where: { token: hashed } });
      });
    }
  }

  return {
    success: true,
    message: "Si el email está registrado, te enviamos un correo con las instrucciones.",
    maskedEmail: maskEmail(email),
  };
}

export async function resetPassword(input: ResetPasswordInput): Promise<CustomerAuthResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: "Revisá los campos marcados en el formulario.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { token, password } = parsed.data;

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token: hashResetToken(token) },
    include: { user: { select: { name: true, email: true } } },
  });
  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    return { success: false, message: "El enlace de recuperación no es válido o ya expiró." };
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  await prisma.$transaction([
    prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash } }),
    // Burn every outstanding link for this account, not just the one used.
    prisma.passwordResetToken.deleteMany({ where: { userId: resetToken.userId } }),
  ]);

  // Security notice ("was this you?") — best effort, never blocks the reset.
  void sendMail({ to: resetToken.user.email, ...passwordChangedEmail({ name: resetToken.user.name }) });

  return { success: true, message: "Contraseña actualizada. Ya podés iniciar sesión." };
}
