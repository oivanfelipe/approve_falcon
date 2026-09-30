import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listTeam } from "@/features/team/actions/team";
import TeamPageClient from "./TeamPageClient";

export const metadata: Metadata = {
  title: "Time — Approve Falcon",
};

export default async function TeamPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const data = await listTeam();
  if (!data) redirect("/login");

  return (
    <TeamPageClient
      owner={data.owner}
      members={data.members}
      invites={data.invites}
      currentUserId={data.currentUserId}
    />
  );
}
