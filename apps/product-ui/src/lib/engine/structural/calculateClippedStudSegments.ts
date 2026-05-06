export interface OpeningLike {
  id: string;
  type: "door" | "window";
  positionMm: number;
  widthMm: number;
  heightMm: number;
  sillHeightMm?: number;
}

export interface ClippedStudSegment {
  yStartMm: number;
  yEndMm: number;
}

export function calculateClippedStudSegments(input: {
  studXmm: number;
  wallHeightMm: number;
  openings: OpeningLike[];
}): ClippedStudSegment[] {
  const { studXmm, wallHeightMm, openings } = input;

  const opening = openings.find(op => {
    const margin = 5;
    return (
      studXmm > op.positionMm + margin &&
      studXmm < op.positionMm + op.widthMm - margin
    );
  });

  if (!opening) {
    return [{ yStartMm: 0, yEndMm: wallHeightMm }];
  }

  const sill = opening.type === "door" ? 0 : opening.sillHeightMm ?? 900;
  const headerBottom = sill + opening.heightMm;

  const segments: ClippedStudSegment[] = [];

  if (opening.type === "window" && sill > 0) {
    segments.push({
      yStartMm: 0,
      yEndMm: sill,
    });
  }

  if (headerBottom < wallHeightMm) {
    segments.push({
      yStartMm: headerBottom,
      yEndMm: wallHeightMm,
    });
  }

  return segments.filter(s => s.yEndMm > s.yStartMm);
}
