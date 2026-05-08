export interface PdfPoint {
  x: number;
  y: number;
}

export function readPdfPoint(value: any): PdfPoint | null {
  if (!value) return null;

  if (Number.isFinite(value.x) && Number.isFinite(value.y)) {
    return { x: value.x, y: value.y };
  }

  if (Number.isFinite(value.x) && Number.isFinite(value.z)) {
    return { x: value.x, y: value.z };
  }

  if (Number.isFinite(value.xMm) && Number.isFinite(value.yMm)) {
    return { x: value.xMm / 1000, y: value.yMm / 1000 };
  }

  if (Number.isFinite(value.xMm) && Number.isFinite(value.zMm)) {
    return { x: value.xMm / 1000, y: value.zMm / 1000 };
  }

  return null;
}

export function readPdfLine(entity: any): { start: PdfPoint; end: PdfPoint } | null {
  const start =
    readPdfPoint(entity?.start) ||
    readPdfPoint(entity?.from) ||
    readPdfPoint(entity?.points?.[0]);

  const end =
    readPdfPoint(entity?.end) ||
    readPdfPoint(entity?.to) ||
    readPdfPoint(entity?.points?.[1]);

  if (!start || !end) {
    return null;
  }

  return { start, end };
}
