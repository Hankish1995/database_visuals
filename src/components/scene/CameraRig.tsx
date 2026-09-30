"use client";

import { useEffect, useRef, type ComponentRef } from "react";
import { useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

const CAMERA_POS: [number, number, number] = [0, 13, 13];
const TARGET: [number, number, number] = [0, 0, 0];
// World extent the default view must fit (x span, projected z span).
const FIT_WIDTH = 22;
const FIT_HEIGHT = 12.4;

// Fits the orthographic view to the canvas and keeps orbit/pan/zoom gentle
// and bounded. `resetSignal` changing puts the camera back to the default view.
export function CameraRig({ resetSignal }: { resetSignal: number }) {
  const size = useThree((s) => s.size);
  const get = useThree((s) => s.get);
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const fit = Math.min(size.width / FIT_WIDTH, size.height / FIT_HEIGHT);

  useEffect(() => {
    const { camera } = get();
    camera.position.set(...CAMERA_POS);
    camera.zoom = fit;
    camera.updateProjectionMatrix();
    controls.current?.target.set(...TARGET);
    controls.current?.update();
  }, [get, fit, resetSignal]);

  return (
    <OrbitControls ref={controls} makeDefault target={TARGET} enableDamping dampingFactor={0.12}
      minZoom={fit * 0.7} maxZoom={fit * 3} minPolarAngle={0.2} maxPolarAngle={1.15}
      minAzimuthAngle={-0.7} maxAzimuthAngle={0.7} screenSpacePanning />
  );
}
