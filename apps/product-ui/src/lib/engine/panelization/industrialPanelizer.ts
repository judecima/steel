export interface IndustrialPanelSegment {
  id: string;
  wallId: string;
  index: number;
  xStartMm: number;
  xEndMm: number;
  widthMm: number;
}

export interface IndustrialPanelJoint {
  id: string;
  wallId: string;
  positionMm: number;
  leftPanelId: string;
  rightPanelId: string;
}

export function panelizeWallIndustrial(input: {
  wallId: string;
  wallLengthMm: number;
  preferredPanelMm?: number;
  maxPanelMm?: number;
}): {
  panels: IndustrialPanelSegment[];
  joints: IndustrialPanelJoint[];
} {
  const preferred = input.preferredPanelMm ?? 3000;
  const max = input.maxPanelMm ?? 4000;

  if (input.wallLengthMm <= 0) {
    return { panels: [], joints: [] };
  }

  const estimatedCount = Math.max(
    1,
    Math.ceil(input.wallLengthMm / preferred)
  );

  let count = estimatedCount;

  while (input.wallLengthMm / count > max) {
    count += 1;
  }

  const baseWidth = input.wallLengthMm / count;

  const panels: IndustrialPanelSegment[] = [];

  let cursor = 0;

  for (let i = 0; i < count; i++) {
    const remaining = input.wallLengthMm - cursor;
    const panelsLeft = count - i;
    const width = i === count - 1 ? remaining : Math.min(max, remaining / panelsLeft);

    const xStart = cursor;
    const xEnd = i === count - 1 ? input.wallLengthMm : cursor + width;

    panels.push({
      id: `${input.wallId}_panel_${i + 1}`,
      wallId: input.wallId,
      index: i + 1,
      xStartMm: Math.round(xStart),
      xEndMm: Math.round(xEnd),
      widthMm: Math.round(xEnd - xStart),
    });

    cursor = xEnd;
  }

  const joints: IndustrialPanelJoint[] = [];

  for (let i = 1; i < panels.length; i++) {
    joints.push({
      id: `${input.wallId}_joint_${i}`,
      wallId: input.wallId,
      positionMm: panels[i].xStartMm,
      leftPanelId: panels[i - 1].id,
      rightPanelId: panels[i].id,
    });
  }

  return { panels, joints };
}
