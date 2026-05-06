import * as THREE from "three";

export interface WallLikeForLocalFrame {
  x: number;
  z: number;
  rotation?: number;
}

export interface WallLocalFrame {
  origin: THREE.Vector3;
  axisX: THREE.Vector3;
  axisY: THREE.Vector3;
  axisZ: THREE.Vector3;
}

export interface LocalPoint2D {
  x: number;
  y: number;
}

export function buildWallLocalFrame(wall: WallLikeForLocalFrame): WallLocalFrame {
  const angle = THREE.MathUtils.degToRad(wall.rotation || 0);

  const axisX = new THREE.Vector3(
    Math.cos(angle),
    0,
    Math.sin(angle)
  ).normalize();

  const axisY = new THREE.Vector3(0, 1, 0);
  const axisZ = new THREE.Vector3().crossVectors(axisX, axisY).normalize();

  return {
    origin: new THREE.Vector3(wall.x, 0, wall.z),
    axisX,
    axisY,
    axisZ,
  };
}

export function worldToWallLocal(
  point: THREE.Vector3,
  frame: WallLocalFrame
): LocalPoint2D {
  const rel = new THREE.Vector3().subVectors(point, frame.origin);

  return {
    x: rel.dot(frame.axisX),
    y: rel.dot(frame.axisY),
  };
}

export function wallLocalToWorld(
  point: LocalPoint2D,
  frame: WallLocalFrame,
  zOffset = 0
): THREE.Vector3 {
  const worldPos = frame.origin.clone();
  worldPos.add(frame.axisX.clone().multiplyScalar(point.x));
  worldPos.add(frame.axisY.clone().multiplyScalar(point.y));
  worldPos.add(frame.axisZ.clone().multiplyScalar(zOffset));
  return worldPos;
}
