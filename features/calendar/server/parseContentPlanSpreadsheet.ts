import ExcelJS from "exceljs";

export interface ContentPlanEntry {
  sheet: string;
  row: number;
  planNumber: string | null;
  theme: string | null;
  format: string | null;
  product: string | null;
  weekHint: string | null; // "Data" column — a fuzzy week label, not a real date
  objective: string | null;
  artCopy: string | null;
  copyText: string | null;
}

export interface ParseResult {
  entries: ContentPlanEntry[];
  warnings: string[];
}

// Matches the agency's content-plan template. Header names are normalized
// (trimmed, lowercased, accents stripped) before matching, so small template
// drift (extra spaces, accents) doesn't break the import.
const FIELD_ALIASES: Record<string, keyof ContentPlanEntry> = {
  "no": "planNumber",
  "n": "planNumber",
  "numero": "planNumber",
  "tema": "theme",
  "formato": "format",
  "produto": "product",
  "data": "weekHint",
  "objetivo / pilar": "objective",
  "objetivo/pilar": "objective",
  "objetivo": "objective",
  "pilar": "objective",
  "copy da arte": "artCopy",
  "copy": "artCopy",
  "legenda e cta": "copyText",
  "legenda": "copyText",
  "cta": "copyText",
};

const MAX_SHEETS = 50;
const MAX_ROWS_PER_SHEET = 500;
const MAX_CELL_LENGTH = 5000;

function normalizeHeader(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .replace(/[º°]/g, ""); // strip ordinal indicators, e.g. "Nº" → "n"
}

function cellText(value: ExcelJS.CellValue): string {
  if (value == null) return "";
  if (typeof value === "object" && "richText" in value) {
    return value.richText.map((t) => t.text).join("");
  }
  if (typeof value === "object" && "text" in value) {
    return String((value as { text: unknown }).text ?? "");
  }
  return String(value);
}

export async function parseContentPlanSpreadsheet(
  buffer: Buffer,
): Promise<ParseResult> {
  const workbook = new ExcelJS.Workbook();
  // The project's lib/@types/node combo gives Buffer two incompatible
  // structural shapes here (resizable-ArrayBuffer members); exceljs's `load`
  // only cares that this is a real Buffer at runtime.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await workbook.xlsx.load(buffer as any);

  const entries: ContentPlanEntry[] = [];
  const warnings: string[] = [];

  const sheets = workbook.worksheets.slice(0, MAX_SHEETS);
  if (workbook.worksheets.length > MAX_SHEETS) {
    warnings.push(
      `A planilha tem mais de ${MAX_SHEETS} abas; só as ${MAX_SHEETS} primeiras foram lidas.`,
    );
  }

  for (const worksheet of sheets) {
    const headerRow = worksheet.getRow(1);
    const columnKeys: (keyof ContentPlanEntry | undefined)[] = [];
    headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const normalized = normalizeHeader(cellText(cell.value));
      columnKeys[colNumber] = FIELD_ALIASES[normalized];
    });

    const hasAnyKnownColumn = columnKeys.some((k) => k != null);
    if (!hasAnyKnownColumn) {
      warnings.push(
        `A aba "${worksheet.name}" não tem nenhuma coluna reconhecida e foi ignorada.`,
      );
      continue;
    }

    const lastRowNumber = Math.min(
      worksheet.lastRow?.number ?? 1,
      MAX_ROWS_PER_SHEET + 1,
    );
    if ((worksheet.lastRow?.number ?? 1) > MAX_ROWS_PER_SHEET + 1) {
      warnings.push(
        `A aba "${worksheet.name}" tem mais de ${MAX_ROWS_PER_SHEET} linhas; só as primeiras foram lidas.`,
      );
    }

    for (let r = 2; r <= lastRowNumber; r++) {
      const row = worksheet.getRow(r);
      const entry: Partial<ContentPlanEntry> = {};
      let hasValue = false;

      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const key = columnKeys[colNumber];
        if (!key) return;
        const text = cellText(cell.value).trim().slice(0, MAX_CELL_LENGTH);
        if (text) hasValue = true;
        (entry as Record<string, string | null>)[key] = text || null;
      });

      if (!hasValue) continue;

      entries.push({
        sheet: worksheet.name,
        row: r,
        planNumber: entry.planNumber ?? null,
        theme: entry.theme ?? null,
        format: entry.format ?? null,
        product: entry.product ?? null,
        weekHint: entry.weekHint ?? null,
        objective: entry.objective ?? null,
        artCopy: entry.artCopy ?? null,
        copyText: entry.copyText ?? null,
      });
    }
  }

  return { entries, warnings };
}
