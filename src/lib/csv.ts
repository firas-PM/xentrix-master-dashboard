/** Escape a single CSV cell (RFC 4180-ish): wrap in double quotes and
 *  double any embedded quotes. */
export function csvCell(value: unknown): string {
  const s =
    value == null
      ? ""
      : value instanceof Date
        ? value.toISOString()
        : String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function csvLine(cells: unknown[]): string {
  return cells.map(csvCell).join(",");
}

export function csvFromRows(headers: string[], rows: unknown[][]): string {
  const lines = [csvLine(headers), ...rows.map(csvLine)];
  return lines.join("\n") + "\n";
}
