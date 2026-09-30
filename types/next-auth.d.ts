// Extend NextAuth session types to include user.id and team/org fields
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      /** The organization owner's User.id — same as `id` for an account owner,
       *  or the account owner's id for an invited team member. */
      ownerId: string;
      /** ADMIN can manage the team; EDITOR has full content access but not team management. */
      role: "ADMIN" | "EDITOR";
    } & DefaultSession["user"];
  }
}

// NOTE: we don't augment `@auth/core/jwt`'s `JWT` interface here because
// next-auth@5 beta ships its own nested copy of @auth/core (a different
// resolved module than the top-level one), so declaration merging silently
// doesn't reach the JWT type next-auth's callbacks actually use. auth.ts
// casts the token locally to a type carrying these fields instead.
export type AppJWT = {
  ownerId?: string;
  role?: "ADMIN" | "EDITOR";
};
