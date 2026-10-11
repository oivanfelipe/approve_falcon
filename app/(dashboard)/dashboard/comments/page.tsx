import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { loadCommentsInboxData } from "@/features/comments/server/loadCommentsInboxData";
import CommentsInboxClient from "./CommentsInboxClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Comentários — Approve Falcon",
};

export default async function CommentsInboxPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const deliveries = await loadCommentsInboxData(session.user.ownerId);

  return (
    <CommentsInboxClient
      initialDeliveries={deliveries}
      freelancerName={session.user.name ?? session.user.email ?? "Equipe"}
    />
  );
}
