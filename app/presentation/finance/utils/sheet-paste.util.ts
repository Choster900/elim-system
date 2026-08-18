// Pegado desde Excel: el portapapeles llega como filas separadas por saltos de línea
// y columnas por tabuladores.

export function normalizePastedNumber(value: string) {
    const cleaned = value.replace(/[$\s]/g, '')
    // Una sola coma sin punto es separador decimal; con punto presente, es de miles.
    const normalized =
        cleaned.includes(',') && !cleaned.includes('.')
            ? cleaned.replace(',', '.')
            : cleaned.replace(/,/g, '')
    const number = Number(normalized)
    return Number.isFinite(number) ? Math.max(0, number) : null
}

export function parseClipboardMatrix(clipboard: string) {
    return clipboard
        .trimEnd()
        .split(/\r?\n/)
        .map((line) => line.split('\t'))
}
