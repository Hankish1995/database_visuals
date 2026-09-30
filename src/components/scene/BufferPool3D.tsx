"use client";

import { TABLE } from "@/lib/sim/data";
import { PageTile } from "@/components/scene/PageTile";
import { PALETTE } from "@/components/scene/palette";
import { BUFFER_CENTER, BUFFER_SIZE, bufferSlotPos } from "@/components/scene/sceneLayout";
import type { SceneViewProps } from "@/components/scene/types";

export function BufferPool3D({ scene, onSelect, reduceMotion }: SceneViewProps) {
  const [x, , z] = BUFFER_CENTER;
  const select = () => onSelect("bufferPool");
  return (
    <group>
      <mesh position={[x, 0.02, z]} onClick={(e) => { e.stopPropagation(); select(); }}>
        <boxGeometry args={[BUFFER_SIZE[0], 0.04, BUFFER_SIZE[1]]} />
        <meshStandardMaterial color={PALETTE.platformMemory} emissive={PALETTE.flow} emissiveIntensity={scene.active === "bufferPool" ? 0.12 : 0} />
      </mesh>
      {scene.buffer.map((page, slot) => {
        const users = page?.relation === TABLE;
        return (
          <PageTile key={slot} position={bufferSlotPos(slot)} reduceMotion={reduceMotion} onSelect={select} empty={!page} users={users}
            dirty={users && scene.dirtyPages.includes(page.page)}
            focused={users && scene.focusPages.includes(page.page) && scene.active !== "executor"} />
        );
      })}
    </group>
  );
}
