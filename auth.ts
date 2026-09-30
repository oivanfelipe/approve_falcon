import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma/client";
import { authConfig } from "@/auth.config";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { AppJWT } from "@/types/next-auth";

// ─── Credentials schema ───────────────────────────────────────────────────────

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// ─── Full NextAuth config (Node.js runtime only) ─────────────────────────────

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
          select: { id: true, name: true, email: true, password: true },
        });

        if (!user?.password) return null;

        const isValid = await bcrypt.compare(
          parsed.data.password,
          user.password,
        );
        if (!isValid) return null;

        return { id: user.id, name: user.name, email: user.email };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user?.id) token.id = user.id;
      const appToken = token as typeof token & AppJWT;

      // Resolve the org owner + role once per sign-in (or if a token from
      // before this field existed is seen); cached on the JWT after that so
      // we don't hit the DB on every request. A role/removal change by an
      // admin takes effect the next time the member signs in.
      if (user?.id || !appToken.ownerId) {
        const userId = (token.id as string) ?? user?.id;
        if (userId) {
          const membership = await prisma.teamMembership.findFirst({
            where: { userId },
            select: { ownerId: true, role: true },
          });
          appToken.ownerId = membership?.ownerId ?? userId;
          appToken.role = membership?.role ?? "ADMIN";
        }
      }

      return token;
    },
    session({ session, token }) {
      const appToken = token as typeof token & AppJWT;
      if (token.id) session.user.id = token.id as string;
      if (appToken.ownerId) session.user.ownerId = appToken.ownerId;
      if (appToken.role) session.user.role = appToken.role;
      return session;
    },
  },
});
