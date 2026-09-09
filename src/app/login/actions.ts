"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/auth";

export async function loginAction(formData: FormData): Promise<{ error?: string }> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/");

  if (!email || !password) {
    return { error: "Email dan password wajib diisi." };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { error: "Email atau password salah." };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { error: "Email atau password salah." };
  }

  await setSessionCookie({ userId: user.id, email: user.email });
  redirect(next.startsWith("/") ? next : "/");
}
