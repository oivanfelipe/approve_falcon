/**
 * Helpers to turn a Google Drive share link into an embeddable preview URL.
 * Supports files, Google Docs/Sheets/Slides, and folders.
 */

export type DriveResourceType = "file" | "folder" | "document" | "spreadsheet" | "presentation";

export interface ParsedDriveLink {
  type: DriveResourceType;
  id: string;
  /** URL safe to put in an <iframe src> */
  embedUrl: string;
  /** URL to open the asset directly on drive.google.com */
  viewUrl: string;
}

const FILE_ID_PATTERNS = [
  /\/file\/d\/([a-zA-Z0-9_-]+)/, // /file/d/<id>/view
  /\/document\/d\/([a-zA-Z0-9_-]+)/,
  /\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/,
  /\/presentation\/d\/([a-zA-Z0-9_-]+)/,
  /[?&]id=([a-zA-Z0-9_-]+)/, // /open?id=<id> or /uc?id=<id>
];

const FOLDER_ID_PATTERN = /\/folders\/([a-zA-Z0-9_-]+)/;

/**
 * Returns true when the given string looks like a Google Drive / Docs URL
 * we know how to embed. Used for client + server validation.
 */
export function isGoogleDriveUrl(url: string): boolean {
  try {
    const parsed = new URL(url.trim());
    if (!/(^|\.)google\.com$/.test(parsed.hostname)) return false;
    return (
      parsed.hostname === "drive.google.com" ||
      parsed.hostname === "docs.google.com"
    );
  } catch {
    return false;
  }
}

/**
 * Parses a Google Drive/Docs share link and returns the info needed to embed
 * it (iframe src) and to link out to the original resource. Returns null if
 * the URL isn't a recognized Drive/Docs link or no id could be extracted.
 */
export function parseDriveLink(rawUrl: string): ParsedDriveLink | null {
  const url = rawUrl.trim();
  if (!isGoogleDriveUrl(url)) return null;

  const folderMatch = url.match(FOLDER_ID_PATTERN);
  if (folderMatch) {
    const id = folderMatch[1];
    return {
      type: "folder",
      id,
      embedUrl: `https://drive.google.com/embeddedfolderview?id=${id}#grid`,
      viewUrl: `https://drive.google.com/drive/folders/${id}`,
    };
  }

  if (/\/document\/d\//.test(url)) {
    const id = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/)?.[1];
    if (!id) return null;
    return {
      type: "document",
      id,
      embedUrl: `https://docs.google.com/document/d/${id}/preview`,
      viewUrl: `https://docs.google.com/document/d/${id}/edit`,
    };
  }

  if (/\/spreadsheets\/d\//.test(url)) {
    const id = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/)?.[1];
    if (!id) return null;
    return {
      type: "spreadsheet",
      id,
      embedUrl: `https://docs.google.com/spreadsheets/d/${id}/preview`,
      viewUrl: `https://docs.google.com/spreadsheets/d/${id}/edit`,
    };
  }

  if (/\/presentation\/d\//.test(url)) {
    const id = url.match(/\/presentation\/d\/([a-zA-Z0-9_-]+)/)?.[1];
    if (!id) return null;
    return {
      type: "presentation",
      id,
      embedUrl: `https://docs.google.com/presentation/d/${id}/embed`,
      viewUrl: `https://docs.google.com/presentation/d/${id}/edit`,
    };
  }

  for (const pattern of FILE_ID_PATTERNS) {
    const match = url.match(pattern);
    if (match) {
      const id = match[1];
      return {
        type: "file",
        id,
        embedUrl: `https://drive.google.com/file/d/${id}/preview`,
        viewUrl: `https://drive.google.com/file/d/${id}/view`,
      };
    }
  }

  return null;
}
