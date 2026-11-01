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
  // Once the art is attached the client reviews art + caption together and
  // approves the post once — the copy-only stage only exists before that.
  const copyStageActive =
    hasCopyContent && copyStatus !== "APPROVED" && !hasFile;

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
  // With the art attached it's one post under review — no "· Arte" suffix.
  // Without it, "(agência) · Arte" still tells the team the upload is theirs.
  return { status: artStatus, label: hasFile ? label : `${label} · Arte` };
}
