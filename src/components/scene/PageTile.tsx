"use client";

import { SceneBlock } from "@/components/scene/SceneBlock";
import { usePalette } from "@/components/scene/palette";
import type { Vec3 } from "@/components/scene/sceneLayout";

interface Props { position: Vec3; users?: boolean; dirty?: boolean; focused?: boolean; empty?: boolean; reduceMotion: boolean; onSelect: () => void }

/** One 8 KB page: a buffer slot or a page on the disk shelf. Its caption lives in the label overlay. */
export function PageTile({ position, users, dirty, focused, empty, reduceMotion, onSelect }: Props) {
  const PALETTE = usePalette();
  return (
    <SceneBlock position={position} size={[1.5, empty ? 0.06 : 0.3, 1.05]} dimmed={empty}
      color={empty ? PALETTE.pageEmpty : dirty ? PALETTE.pageDirty : users ? PALETTE.pageUsers : PALETTE.pageIdle}
      active={focused} reduceMotion={reduceMotion} onSelect={onSelect} />
  );
}
