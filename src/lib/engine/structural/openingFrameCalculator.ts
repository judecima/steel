export type OpeningType = "door" | "window";

export interface OpeningFrameInput {
  openingId: string;
  type: OpeningType;
  widthMm: number;
  heightMm: number;
  sillHeightMm?: number;
  wallHeightMm: number;
  positionMm: number;
  studSpacingMm: number;
}

export interface OpeningFrameResult {
  openingId: string;
  headerProfileId: string;
  jackProfileId: string;
  kingProfileId: string;
  sillProfileId?: string;
  kingCountLeft: number;
  kingCountRight: number;
  jackCountLeft: number;
  jackCountRight: number;
  crippleStudsTop: number;
  crippleStudsBottom: number;
  status: "OK" | "WARNING" | "FAIL";
  warnings: string[];
}

export function calculateOpeningFrame(
  input: OpeningFrameInput
): OpeningFrameResult {
  const warnings: string[] = [];

  const sill =
    input.type === "door" ? 0 : input.sillHeightMm ?? 900;

  const headerBottom = sill + input.heightMm;

  let jackCount = 1;
  let headerProfileId = "PGC-100-0.9";
  let jackProfileId = "PGC-100-0.9";
  let status: "OK" | "WARNING" | "FAIL" = "OK";

  if (input.widthMm > 900 && input.widthMm <= 1800) {
    jackCount = 2;
    headerProfileId = "PGC-100-1.25";
  }

  if (input.widthMm > 1800) {
    jackCount = 2;
    headerProfileId = "TRUSS-HEADER-100";
    jackProfileId = "PGC-100-1.25";
    status = "WARNING";
    warnings.push(
      "Abertura mayor a 1800 mm: usar dintel reforzado/reticulado preliminar."
    );
  }

  if (headerBottom >= input.wallHeightMm) {
    status = "FAIL";
    warnings.push(
      "La abertura supera o alcanza la altura disponible del muro."
    );
  }

  const topHeight = Math.max(0, input.wallHeightMm - headerBottom);
  const bottomHeight = input.type === "window" ? sill : 0;

  const crippleStudsTop =
    topHeight > 100 ? Math.max(1, Math.floor(input.widthMm / input.studSpacingMm)) : 0;

  const crippleStudsBottom =
    bottomHeight > 100 ? Math.max(1, Math.floor(input.widthMm / input.studSpacingMm)) : 0;

  return {
    openingId: input.openingId,
    headerProfileId,
    jackProfileId,
    kingProfileId: "PGC-100-0.9",
    sillProfileId: input.type === "window" ? "PGU-100-0.9" : undefined,
    kingCountLeft: 1,
    kingCountRight: 1,
    jackCountLeft: jackCount,
    jackCountRight: jackCount,
    crippleStudsTop,
    crippleStudsBottom,
    status,
    warnings,
  };
}

export interface OpeningFrameMember {
  id: string;
  openingId: string;
  memberType:
    | "header"
    | "sill"
    | "jack"
    | "king"
    | "cripple";
  profileId: string;
  xStartMm: number;
  yStartMm: number;
  xEndMm: number;
  yEndMm: number;
}

export function buildOpeningFrameMembers(input: {
  openingId: string;
  type: "door" | "window";
  positionMm: number;
  widthMm: number;
  heightMm: number;
  sillHeightMm?: number;
  wallHeightMm: number;
  frame: OpeningFrameResult;
}): OpeningFrameMember[] {
  const members: OpeningFrameMember[] = [];

  const sillY = input.type === "door" ? 0 : input.sillHeightMm ?? 900;
  const headerY = sillY + input.heightMm;
  const xStart = input.positionMm;
  const xEnd = input.positionMm + input.widthMm;

  members.push({
    id: `${input.openingId}_header`,
    openingId: input.openingId,
    memberType: "header",
    profileId: input.frame.headerProfileId,
    xStartMm: xStart,
    yStartMm: headerY,
    xEndMm: xEnd,
    yEndMm: headerY,
  });

  if (input.type === "window") {
    members.push({
      id: `${input.openingId}_sill`,
      openingId: input.openingId,
      memberType: "sill",
      profileId: input.frame.sillProfileId ?? "PGU-100-0.9",
      xStartMm: xStart,
      yStartMm: sillY,
      xEndMm: xEnd,
      yEndMm: sillY,
    });
  }

  for (let i = 0; i < input.frame.jackCountLeft; i++) {
    members.push({
      id: `${input.openingId}_jack_left_${i + 1}`,
      openingId: input.openingId,
      memberType: "jack",
      profileId: input.frame.jackProfileId,
      xStartMm: xStart - i * 15,
      yStartMm: 0,
      xEndMm: xStart - i * 15,
      yEndMm: headerY,
    });
  }

  for (let i = 0; i < input.frame.jackCountRight; i++) {
    members.push({
      id: `${input.openingId}_jack_right_${i + 1}`,
      openingId: input.openingId,
      memberType: "jack",
      profileId: input.frame.jackProfileId,
      xStartMm: xEnd + i * 15,
      yStartMm: 0,
      xEndMm: xEnd + i * 15,
      yEndMm: headerY,
    });
  }

  members.push({
    id: `${input.openingId}_king_left`,
    openingId: input.openingId,
    memberType: "king",
    profileId: input.frame.kingProfileId,
    xStartMm: xStart - 40,
    yStartMm: 0,
    xEndMm: xStart - 40,
    yEndMm: input.wallHeightMm,
  });

  members.push({
    id: `${input.openingId}_king_right`,
    openingId: input.openingId,
    memberType: "king",
    profileId: input.frame.kingProfileId,
    xStartMm: xEnd + 40,
    yStartMm: 0,
    xEndMm: xEnd + 40,
    yEndMm: input.wallHeightMm,
  });

  return members;
}
