"use client";

import { TABLE_PAGES } from "@/lib/sim/data";
import { PageTile } from "@/components/scene/PageTile";
import { usePalette } from "@/components/scene/palette";
import { DISK_CENTER, DISK_SIZE, diskPagePos } from "@/components/scene/sceneLayout";
import type { SceneViewProps } from "@/components/scene/types";

export function Disk3D({ scene, onSelect, reduceMotion }: SceneViewProps) {
  const PALETTE = usePalette();
  const [x, , z] = DISK_CENTER;
  const select = () => onSelect("disk");
  return (
    <group>
      <mesh position={[x, 0.02, z]} onClick={(e) => { e.stopPropagation(); select(); }}>
        <boxGeometry args={[DISK_SIZE[0], 0.04, DISK_SIZE[1]]} />
        <meshStandardMaterial color={PALETTE.platformDisk} />
      </mesh>
      {TABLE_PAGES.map((page, i) => (
        <PageTile key={page} position={diskPagePos(i)} focused={scene.diskReading.includes(page)} reduceMotion={reduceMotion} onSelect={select} />
      ))}
    </group>
  );
}
