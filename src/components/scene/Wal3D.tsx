"use client";

import { PALETTE } from "@/components/scene/palette";
import { SceneBlock } from "@/components/scene/SceneBlock";
import { WAL_CENTER, WAL_SIZE, walRecordPos } from "@/components/scene/sceneLayout";
import type { SceneViewProps } from "@/components/scene/types";

/** The write-ahead log: one block per record, pale until flushed at COMMIT. */
export function Wal3D({ scene, onSelect, reduceMotion }: SceneViewProps) {
  const [x, , z] = WAL_CENTER;
  const select = () => onSelect("wal");
  const last = scene.wal.length - 1;
  return (
    <group>
      <mesh position={[x, 0.02, z]} onClick={(e) => { e.stopPropagation(); select(); }}>
        <boxGeometry args={[WAL_SIZE[0], 0.04, WAL_SIZE[1]]} />
        <meshStandardMaterial color={PALETTE.platformDisk} emissive={PALETTE.flow} emissiveIntensity={scene.active === "wal" ? 0.1 : 0} />
      </mesh>
      {scene.wal.map((w, i) => (
        <SceneBlock key={i} position={walRecordPos(i)} size={[1.2, w.flushed ? 0.34 : 0.2, 1.05]} reduceMotion={reduceMotion} onSelect={select}
          color={/ABORT/.test(w.record) ? PALETTE.walFailed : w.flushed ? PALETTE.walFlushed : PALETTE.walPending}
          active={i === last && scene.step?.wal !== undefined && scene.status !== "done"} />
      ))}
    </group>
  );
}
