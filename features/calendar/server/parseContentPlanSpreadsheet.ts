import ExcelJS from "exceljs";
import { mapColumnsWithAI } from "./aiColumnMapper";

export interface ContentPlanEntry {
  sheet: string;
  row: number;
  planNumber: string | null;
  theme: string | null;
  format: string | null;
  product: string | null;
  weekHint: string | null; // "Data" column text that isn't a real calendar date (e.g. "1ª semana")
  scheduledDate: string | null; // "Data" column, when it's a real calendar date — ISO yyyy-mm-dd
  objective: string | null;
  postFunction: string | null; // "Função" — the post's role in the strategy
  artCopy: string | null;
  copyText: string | null;
}

export interface AiMappedColumn {
  sheet: string;
  header: string;
  mappedTo: keyof ContentPlanEntry;
}

export interface ParseResult {
  entries: ContentPlanEntry[];
  warnings: string[];
  aiMappedColumns: AiMappedColumn[];
}

// Matches the agency's content-plan template. Header names are normalized
// (trimmed, lowercased, accents stripped) before matching, so small template
// drift (extra spaces, accents) doesn't break the import. Columns that still
// don't match fall through to AI-assisted mapping (see aiColumnMapper.ts).
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
  "funcao": "postFunction",
  "copy da arte": "artCopy",
  "copy": "artCopy",
  "legenda e cta": "copyText",
  "legenda": "copyText",
  "cta": "copyText",
};

// Second deterministic pass for headers that don't match a full alias above
// but contain a recognizable word — e.g. "Legenda Completa" or "Roteiro /
// Texto dos Slides" (real headers from a client spreadsheet). This used to
// fall straight through to the AI fallback, which isn't guaranteed to
// classify the same header the same way on every import; a word match here
// is deterministic and only reached when no exact alias applies. Matched on
// whole words (not substrings) so e.g. "Sistema de postagem" doesn't match
// "tema".
const KEYWORD_ALIASES: Record<string, keyof ContentPlanEntry> = {
  legenda: "copyText",
  cta: "copyText",
  roteiro: "artCopy",
  copy: "artCopy",
  funcao: "postFunction",
  objetivo: "objective",
  pilar: "objective",
  formato: "format",
  produto: "product",
  tema: "theme",
};

function matchKeywordAlias(raw: string): keyof ContentPlanEntry | undefined {
  const words = normalizeHeader(raw).split(/[^a-z0-9]+/).filter(Boolean);
  for (const word of words) {
    const match = KEYWORD_ALIASES[word];
    if (match) return match;
  }
  return undefined;
}

const MAX_SHEETS = 50;
const MAX_ROWS_PER_SHEET = 500;
const MAX_CELL_LENGTH = 5000;
const MAX_HEADER_SCAN_ROWS = 15;
// Many real-world exports put a title/instructions banner above the actual
// header row (often as merged cells, which ExcelJS reports as the same text
// repeated across every column). Stop treating a blank run as "still inside
// the data" after this many consecutive empty rows, so a sheet whose
// formatting extends far past its real content doesn't trigger a bogus
// "too many rows" warning.
const MAX_CONSECUTIVE_EMPTY_ROWS = 25;

function normalizeHeader(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[º°]/g, ""); // strip ordinal indicators, e.g. "Nº" → "n"
}

// Parses "DD/MM/YYYY" (the common Brazilian date format) into an ISO
// yyyy-mm-dd string, or null if the text isn't an unambiguous real date
// (e.g. "1ª semana de setembro" — a fuzzy hint, not a calendar date).
function parseBrazilianDate(raw: string): string | null {
  const match = raw.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const roundTrip = new Date(`${iso}T00:00:00Z`);
  const isValidDate =
    roundTrip.getUTCFullYear() === year &&
    roundTrip.getUTCMonth() + 1 === month &&
    roundTrip.getUTCDate() === day;
  return isValidDate ? iso : null;
}

// A cell formatted as an Excel date is read back by ExcelJS as a JS Date
// (not text), so cellText() never sees it — check for that case separately.
function cellDateIso(value: ExcelJS.CellValue): string | null {
  if (!(value instanceof Date)) return null;
  const y = value.getUTCFullYear();
  const m = String(value.getUTCMonth() + 1).padStart(2, "0");
  const d = String(value.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
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

interface SheetHeaders {
  worksheet: ExcelJS.Worksheet;
  headerRowNumber: number;
  rawHeaders: (string | undefined)[]; // indexed by column number
  columnKeys: (keyof ContentPlanEntry | undefined)[]; // indexed by column number
}

function rowCellTexts(row: ExcelJS.Row): string[] {
  const texts: string[] = [];
  row.eachCell({ includeEmpty: true }, (cell) => {
    const text = cellText(cell.value).trim();
    if (text) texts.push(text);
  });
  return texts;
}

// A title/instructions banner above the real header row is usually either a
// single merged cell (so every column reports the same long sentence) or a
// near-empty row. A real header row has several short, distinct labels.
function looksLikeHeaderRow(cellTexts: string[]): boolean {
  if (cellTexts.length < 2) return false;
  const distinct = new Set(cellTexts.map((t) => t.toLowerCase()));
  if (distinct.size < 2) return false;
  const avgLength =
    cellTexts.reduce((sum, t) => sum + t.length, 0) / cellTexts.length;
  return avgLength <= 60;
}

function findHeaderRowNumber(worksheet: ExcelJS.Worksheet): number {
  const lastScanRow = Math.min(worksheet.rowCount, MAX_HEADER_SCAN_ROWS);
  for (let r = 1; r <= lastScanRow; r++) {
    if (looksLikeHeaderRow(rowCellTexts(worksheet.getRow(r)))) return r;
  }
  return 1; // no row looked like a header — fall back to the old assumption
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

  const warnings: string[] = [];
  const sheets = workbook.worksheets.slice(0, MAX_SHEETS);
  if (workbook.worksheets.length > MAX_SHEETS) {
    warnings.push(
      `A planilha tem mais de ${MAX_SHEETS} abas; só as ${MAX_SHEETS} primeiras foram lidas.`,
    );
  }

  // Pass 1: locate the header row (skipping any title/instructions banner
  // above it) and apply the deterministic alias match.
  const sheetHeaders: SheetHeaders[] = sheets.map((worksheet) => {
    const headerRowNumber = findHeaderRowNumber(worksheet);
    const headerRow = worksheet.getRow(headerRowNumber);
    const rawHeaders: (string | undefined)[] = [];
    const columnKeys: (keyof ContentPlanEntry | undefined)[] = [];
    headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const raw = cellText(cell.value).trim();
      if (!raw) return;
      rawHeaders[colNumber] = raw;
      columnKeys[colNumber] =
        FIELD_ALIASES[normalizeHeader(raw)] ?? matchKeywordAlias(raw);
    });
    return { worksheet, headerRowNumber, rawHeaders, columnKeys };
  });

  // Collect headers that stayed unmatched, across every sheet, for one
  // batched AI-mapping call (header text only — never cell content).
  const unmatchedHeaders = new Set<string>();
  for (const { rawHeaders, columnKeys } of sheetHeaders) {
    rawHeaders.forEach((raw, colNumber) => {
      if (raw && !columnKeys[colNumber]) unmatchedHeaders.add(raw);
    });
  }

  const aiMappedColumns: AiMappedColumn[] = [];
  if (unmatchedHeaders.size > 0) {
    const aiMapping = await mapColumnsWithAI(Array.from(unmatchedHeaders));
    if (aiMapping) {
      for (const sheet of sheetHeaders) {
        // More than one column can legitimately land on the same field —
        // e.g. a template that splits "Legenda e CTA" into separate
        // "Legenda Completa" and "CTA" columns. Row extraction (pass 2)
        // concatenates same-key columns instead of one overwriting the
        // other, so it's safe to let the AI claim a key a deterministic
        // alias already matched in this sheet.
        sheet.rawHeaders.forEach((raw, colNumber) => {
          if (!raw || sheet.columnKeys[colNumber]) return;
          const mapped = aiMapping[raw];
          if (mapped) {
            sheet.columnKeys[colNumber] = mapped;
            aiMappedColumns.push({
              sheet: sheet.worksheet.name,
              header: raw,
              mappedTo: mapped,
            });
          }
        });
      }
    }
  }

  // Pass 2: extract rows using the (possibly AI-augmented) column mapping.
  const entries: ContentPlanEntry[] = [];
  for (const { worksheet, headerRowNumber, columnKeys } of sheetHeaders) {
    const hasAnyKnownColumn = columnKeys.some((k) => k != null);
    if (!hasAnyKnownColumn) {
      warnings.push(
        `A aba "${worksheet.name}" não tem nenhuma coluna reconhecida e foi ignorada.`,
      );
      continue;
    }

    const lastScanRow = Math.min(
      worksheet.lastRow?.number ?? headerRowNumber,
      headerRowNumber + MAX_ROWS_PER_SHEET,
    );

    let consecutiveEmptyRows = 0;
    let lastDataRow = headerRowNumber;
    for (let r = headerRowNumber + 1; r <= lastScanRow; r++) {
      const row = worksheet.getRow(r);
      const entry: Partial<ContentPlanEntry> = {};
      let hasValue = false;

      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const key = columnKeys[colNumber];
        if (!key) return;
        const text = cellText(cell.value).trim().slice(0, MAX_CELL_LENGTH);

        if (key === "weekHint") {
          const iso = cellDateIso(cell.value) ?? (text ? parseBrazilianDate(text) : null);
          if (iso) {
            hasValue = true;
            entry.scheduledDate = iso;
            return; // a real date was found — no need to also keep the fuzzy hint
          }
        }

        if (!text) return;
        hasValue = true;
        // If a second column also maps to this field (see the AI-mapping
        // comment above), append rather than overwrite — nothing gets lost.
        const existing = (entry as Record<string, string | null>)[key];
        (entry as Record<string, string | null>)[key] = existing
          ? `${existing}\n\n${text}`
          : text;
      });

      if (!hasValue) {
        consecutiveEmptyRows++;
        // A sheet's formatting (borders, column width) often extends far
        // past its real content, inflating lastRow.number — stop once a
        // long blank run shows the real data has ended, rather than
        // scanning (and warning about) thousands of formatting-only rows.
        if (consecutiveEmptyRows >= MAX_CONSECUTIVE_EMPTY_ROWS) break;
        continue;
      }
      consecutiveEmptyRows = 0;
      lastDataRow = r;

      entries.push({
        sheet: worksheet.name,
        row: r,
        planNumber: entry.planNumber ?? null,
        theme: entry.theme ?? null,
        format: entry.format ?? null,
        product: entry.product ?? null,
        weekHint: entry.weekHint ?? null,
        scheduledDate: entry.scheduledDate ?? null,
        objective: entry.objective ?? null,
        postFunction: entry.postFunction ?? null,
        artCopy: entry.artCopy ?? null,
        copyText: entry.copyText ?? null,
      });
    }

    if (lastDataRow - headerRowNumber >= MAX_ROWS_PER_SHEET) {
      warnings.push(
        `A aba "${worksheet.name}" tem mais de ${MAX_ROWS_PER_SHEET} linhas; só as primeiras foram lidas.`,
      );
    }
  }

  return { entries, warnings, aiMappedColumns };
}
