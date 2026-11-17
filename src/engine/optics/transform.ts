/*
 * Local-to-world geometry. A mirror lives in local space as (-L/2,0)..(+L/2,0); rotating that
 * segment by θ about its centre and translating gives exactly the endpoints the renderer draws.
 * The boundary rectangle and source housing origins are produced here too, so optics and drawing
 * always share one geometry definition.
 */
import { gameConfig } from "@/config/gameConfig";
import { degToRad } from "@/lib/math/angles";
import { BOUNDARY } from "@/lib/math/constants";
import { add, rotate, scale } from "@/lib/math/vec2";
import type { GateConfig, LightSourceConfig, MirrorConfig } from "@/types/optics";
import type { Vec2 } from "@/types/vec2";

export function isFinitePoint(point: Vec2): boolean {
  return Number.isFinite(point.x) && Number.isFinite(point.y);
}

/** PRD §12.1: A = c + R(θ)(-L/2,0), B = c + R(θ)(+L/2,0). */
export function getMirrorEndpoints(mirror: MirrorConfig): [Vec2, Vec2] {
  const length = mirror.length ?? gameConfig.interaction.mirrorLength;
  const angle = degToRad(mirror.angleDeg);
  const half = rotate({ x: length / 2, y: 0 }, angle);
  return [add(mirror.center, scale(half, -1)), add(mirror.center, half)];
}

/** Equilateral prism: vertices at orientation, orientation+120°, orientation+240°. */
export function getPrismVertices(prism: {
  center: Vec2;
  circumradius: number;
  orientationDeg: number;
}): [Vec2, Vec2, Vec2] {
  const vertices: Vec2[] = [];
  for (let index = 0; index < 3; index += 1) {
    const angle = degToRad(prism.orientationDeg + index * 120);
    vertices.push(
      add(prism.center, {
        x: Math.cos(angle) * prism.circumradius,
        y: Math.sin(angle) * prism.circumradius,
      }),
    );
  }
  return [vertices[0], vertices[1], vertices[2]];
}

export function getGateSegment(gate: GateConfig): [Vec2, Vec2] {
  return [gate.a, gate.b];
}

/** Clockwise rectangle of the playfield; every cast ends here if nothing else absorbs it. */
export function getBoundarySegments(): [Vec2, Vec2][] {
  const { x0, y0, x1, y1 } = BOUNDARY;
  const corners: Vec2[] = [
    { x: x0, y: y0 },
    { x: x1, y: y0 },
    { x: x1, y: y1 },
    { x: x0, y: y1 },
  ];
  return corners.map((corner, index): [Vec2, Vec2] => [corner, corners[(index + 1) % corners.length]]);
}

/** The beam starts just outside the lamp housing so it cannot hit its own lamp on frame one. */
export function getSourceOrigin(source: LightSourceConfig): Vec2 {
  const radius = source.housingRadius ?? gameConfig.optics.lampHousingRadius;
  const angle = degToRad(source.headingDeg);
  return {
    x: source.position.x + Math.cos(angle) * radius,
    y: source.position.y + Math.sin(angle) * radius,
  };
}
