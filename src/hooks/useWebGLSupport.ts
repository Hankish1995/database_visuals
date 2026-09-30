"use client";

import { useSyncExternalStore } from "react";

let supported: boolean | null = null;

function detect(): boolean {
  if (supported === null) {
    try {
      const canvas = document.createElement("canvas");
      supported = Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
    } catch {
      supported = false;
    }
  }
  return supported;
}

const noSubscribe = () => () => {};

/** null until checked on the client, then whether WebGL can be used at all. */
export function useWebGLSupport(): boolean | null {
  return useSyncExternalStore(noSubscribe, detect, () => null);
}
