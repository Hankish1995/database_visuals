"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { usePalette } from "@/components/scene/palette";
import type { Vec3 } from "@/components/scene/sceneLayout";

const TRAVEL_SECONDS = 1.2;
const LIFT = 0.3;

function sample(points: Vec3[], lengths: number[], t: number): Vec3 {
  const total = lengths.at(-1) ?? 0;
  if (points.length === 1 || total === 0) return points.at(-1)!;
  const target = t * total;
  const i = Math.max(1, lengths.findIndex((l) => l >= target));
  const span = lengths[i] - lengths[i - 1] || 1;
  const f = (target - lengths[i - 1]) / span;
  const [a, b] = [points[i - 1], points[i]];
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
}

// The query itself: a small glowing marker that travels each step's route.
// Its position is written straight to the object in useFrame.
export function QueryMarker({ path, reduceMotion, dim }: { path: Vec3[]; reduceMotion: boolean; dim: boolean }) {
  const PALETTE = usePalette();
  const group = useRef<Group>(null);
  const progress = useRef(1);
  const lengths = useMemo(() => path.reduce<number[]>((acc, p, i) => {
    if (i === 0) return [0];
    const q = path[i - 1];
    return [...acc, acc[i - 1] + Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2])];
  }, []), [path]);

  useEffect(() => { progress.current = reduceMotion ? 1 : 0; }, [path, reduceMotion]);

  useFrame((_, delta) => {
    if (!group.current) return;
    progress.current = Math.min(1, progress.current + delta / TRAVEL_SECONDS);
    const t = 1 - (1 - progress.current) ** 3;
    const [x, y, z] = sample(path, lengths, t);
    group.current.position.set(x, y + LIFT, z);
  });

  return (
    <group ref={group}>
      <mesh>
        <sphereGeometry args={[0.26, 24, 24]} />
        <meshStandardMaterial color={PALETTE.flow} emissive={PALETTE.flow} emissiveIntensity={dim ? 0.2 : 0.9} transparent opacity={dim ? 0.5 : 1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -LIFT + 0.05, 0]}>
        <ringGeometry args={[0.35, 0.5, 32]} />
        <meshBasicMaterial color={PALETTE.flow} transparent opacity={dim ? 0.15 : 0.4} />
      </mesh>
    </group>
  );
}
