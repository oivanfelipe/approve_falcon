export type DeliveryStageStatus = "PENDING" | "APPROVED" | "CHANGES_REQUESTED";

export interface PendingStageBadge {
  /** Drives the badge color/dot — the status of whichever stage is active. */
  status: DeliveryStageStatus;
  label: string;
}

interface PendingStageInput {
  copyStatus: DeliveryStageStatus;
  artStatus: DeliveryStageStatus;
  hasFile: boolean;
  hasCopyContent: boolean;
  agencyLabel: string;
  /** Set once the team confirms the post actually went live. */
  published?: boolean;
}

// Same "whose turn is it, and on what" signal for both the client and the
// team calendars — copy is reviewed first, then the art, mirroring the
// client's own two-stage reveal in CalendarClientShell.
export function getPendingStageBadge({
  copyStatus,
  artStatus,
  hasFile,
  hasCopyContent,
  agencyLabel,
  published = false,
}: PendingStageInput): PendingStageBadge {
  const copyStageActive = hasCopyContent && copyStatus !== "APPROVED";

  if (copyStageActive) {
    const label =
      copyStatus === "CHANGES_REQUESTED"
        ? `Pendente (${agencyLabel})`
        : "Pendente (Cliente)";
    return { status: copyStatus, label: `${label} · Copy` };
  }

  if (artStatus === "APPROVED") {
    return { status: "APPROVED", label: published ? "Publicado" : "Ok" };
  }

  const label =
    artStatus === "CHANGES_REQUESTED" || !hasFile
      ? `Pendente (${agencyLabel})`
      : "Pendente (Cliente)";
  return { status: artStatus, label: `${label} · Arte` };
}
