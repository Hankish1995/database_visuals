"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Edges, RoundedBox, useCursor } from "@react-three/drei";
import type { Mesh, MeshStandardMaterial } from "three";
import { usePalette } from "@/components/scene/palette";
import type { Vec3 } from "@/components/scene/sceneLayout";

export interface BlockProps {
  position: Vec3;
  size: Vec3;
  color: string;
  active?: boolean;
  lit?: boolean;
  selected?: boolean;
  dimmed?: boolean;
  reduceMotion: boolean;
  onSelect?: () => void;
  glow?: string;
}

// One solid object in the scene. The active one lifts and glows; the lift
// eases in useFrame on the mesh itself, so React never re-renders per frame.
export function SceneBlock({ position, size, color, active, lit, selected, dimmed, reduceMotion, onSelect, glow }: BlockProps) {
  const PALETTE = usePalette();
  const glowColor = glow ?? PALETTE.flow;
  const mesh = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  useCursor(hovered && Boolean(onSelect));
  const lift = active ? 0.35 : 0;

  useFrame((_, delta) => {
    const m = mesh.current;
    if (!m) return;
    const targetY = position[1] + size[1] / 2 + lift;
    m.position.y = reduceMotion ? targetY : m.position.y + (targetY - m.position.y) * Math.min(1, delta * 8);
    const material = m.material as MeshStandardMaterial;
    const targetGlow = active ? 0.55 : lit ? 0.18 : 0;
    material.emissiveIntensity = reduceMotion ? targetGlow : material.emissiveIntensity + (targetGlow - material.emissiveIntensity) * Math.min(1, delta * 6);
  });

  return (
    <RoundedBox
      ref={mesh}
      args={size}
      radius={Math.min(0.14, size[1] / 3)}
      smoothness={3}
      position={[position[0], position[1] + size[1] / 2, position[2]]}
      onClick={onSelect ? (e) => { e.stopPropagation(); onSelect(); } : undefined}
      onPointerOver={onSelect ? (e) => { e.stopPropagation(); setHovered(true); } : undefined}
      onPointerOut={onSelect ? () => setHovered(false) : undefined}
    >
      <meshStandardMaterial color={color} emissive={glowColor} emissiveIntensity={0} roughness={0.45} metalness={0.05} transparent={dimmed} opacity={dimmed ? 0.45 : 1} />
      {(selected || hovered) && <Edges threshold={30} color={selected ? PALETTE.selected : PALETTE.flowDeep} />}
    </RoundedBox>
  );
}
