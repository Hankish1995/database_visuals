"use client";

import { TABLE, TABLE_PAGES } from "@/lib/sim/data";
import { CacheBadge } from "@/components/scene/CacheBadge";
import { Anchored, type AnchorRegistry } from "@/components/scene/labels/anchors";
import { SceneTag } from "@/components/scene/SceneTag";
import { BUFFER_CENTER, BUFFER_SIZE, DISK_CENTER, DISK_SIZE, bufferSlotPos, diskPagePos } from "@/components/scene/sceneLayout";
import type { SceneViewProps } from "@/components/scene/types";
import type { ComponentId } from "@/lib/sim/types";
import { useMessages } from "@/i18n";

type Props = SceneViewProps & { registry: AnchorRegistry };

function PageCaption({ title, detail, strong, muted }: { title: string; detail?: string; strong?: boolean; muted?: boolean }) {
  return (
    <span className={`pointer-events-none block text-center leading-tight ${muted ? "text-muted" : "text-ink"}`}>
      <span className={`block text-[10px] ${strong ? "font-bold" : "font-medium"}`}>{title}</span>
      {detail && <span className="block text-[9px] text-muted">{detail}</span>}
    </span>
  );
}

/** Captions for the buffer pool slots, the disk shelf and the cache result. */
export function StorageLabels({ registry, scene, selected, onSelect }: Props) {
  const m = useMessages().scene;
  const state = (id: ComponentId) => (scene.active === id ? "active" : scene.visited.has(id) ? "done" : null);
  const bufferBottom = BUFFER_CENTER[2] + BUFFER_SIZE[1] / 2;
  return (
    <>
      {scene.buffer.map((page, slot) => (
        <Anchored key={slot} registry={registry} id={`slot-${slot}`} position={[bufferSlotPos(slot)[0], 0.3, bufferSlotPos(slot)[2]]}>
          {page ? <PageCaption title={m.page(page.page)} detail={page.relation === TABLE && scene.dirtyPages.includes(page.page) ? `users · ${m.dirty}` : page.relation} strong={page.relation === TABLE && scene.focusPages.includes(page.page)} />
            : <PageCaption title={m.free} muted />}
        </Anchored>
      ))}
      <Anchored registry={registry} id="buffer-tag" position={[BUFFER_CENTER[0] + 2.4, 0, BUFFER_CENTER[2] - BUFFER_SIZE[1] / 2 - 0.75]}>
        <SceneTag title={m.bufferPool} subtitle={m.sharedMemory} state={state("bufferPool")} selected={selected === "bufferPool"} onSelect={() => onSelect("bufferPool")} />
      </Anchored>
      {scene.cacheResult && (
        <Anchored registry={registry} id="cache" position={[BUFFER_CENTER[0] + BUFFER_SIZE[0] / 2 - 2.2, 0, bufferBottom + 0.8]}>
          <CacheBadge result={scene.cacheResult} selected={selected === "cache"} onSelect={() => onSelect("cache")} />
        </Anchored>
      )}
      {TABLE_PAGES.map((page, i) => (
        <Anchored key={page} registry={registry} id={`disk-${page}`} position={[diskPagePos(i)[0], 0.3, diskPagePos(i)[2]]}>
          <PageCaption title={m.page(page)} strong={scene.diskReading.includes(page)} detail={scene.diskReading.includes(page) ? m.reading : undefined} />
        </Anchored>
      ))}
      <Anchored registry={registry} id="disk-tag" position={[DISK_CENTER[0], 0, DISK_CENTER[2] + DISK_SIZE[1] / 2 + 0.75]}>
        <SceneTag title={m.diskPages} subtitle={m.diskSubtitle} state={state("disk")} selected={selected === "disk"} onSelect={() => onSelect("disk")} />
      </Anchored>
    </>
  );
}
