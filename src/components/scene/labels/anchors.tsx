"use client";

import type { ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3 } from "three";
import type { Vec3 } from "@/components/scene/sceneLayout";

// Scene labels are ordinary DOM elements in one overlay above the canvas
// (so they're real, focusable buttons in normal tab order). Each registers
// its element and 3D anchor here; the projector moves them every frame by
// writing style.transform directly -- no React renders per frame.
export class AnchorRegistry {
  private anchors = new Map<string, { position: Vec3; el: HTMLElement }>();

  ref(id: string, position: Vec3) {
    return (el: HTMLElement | null) => {
      if (!el) return;
      this.anchors.set(id, { position, el });
      return () => { this.anchors.delete(id); };
    };
  }

  forEach(fn: (position: Vec3, el: HTMLElement) => void) {
    this.anchors.forEach(({ position, el }) => fn(position, el));
  }
}

const v = new Vector3();

export function LabelProjector({ registry }: { registry: AnchorRegistry }) {
  useFrame(({ camera, size }) => {
    registry.forEach((position, el) => {
      v.set(...position).project(camera);
      const x = ((v.x + 1) / 2) * size.width;
      const y = ((1 - v.y) / 2) * size.height;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`;
      el.style.visibility = "visible";
    });
  });
  return null;
}

interface AnchoredProps { registry: AnchorRegistry; id: string; position: Vec3; children: ReactNode }

/** A label pinned to a scene position. Hidden until the projector has placed it. */
export function Anchored({ registry, id, position, children }: AnchoredProps) {
  return (
    <div ref={registry.ref(id, position)} className="absolute top-0 left-0 whitespace-nowrap" style={{ visibility: "hidden" }}>
      {children}
    </div>
  );
}
