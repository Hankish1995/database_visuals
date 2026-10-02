"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { BTree3D } from "@/components/scene/BTree3D";
import { BufferPool3D } from "@/components/scene/BufferPool3D";
import { CameraRig } from "@/components/scene/CameraRig";
import { Disk3D } from "@/components/scene/Disk3D";
import { FlowPaths } from "@/components/scene/FlowPaths";
import { AnchorRegistry, LabelProjector } from "@/components/scene/labels/anchors";
import { FlowLabels } from "@/components/scene/labels/FlowLabels";
import { StorageLabels } from "@/components/scene/labels/StorageLabels";
import { QueryMarker } from "@/components/scene/QueryMarker";
import { usePalette } from "@/components/scene/palette";
import { markerPath } from "@/components/scene/sceneLayout";
import { Stages3D } from "@/components/scene/Stages3D";
import { Wal3D } from "@/components/scene/Wal3D";
import { WalLabels } from "@/components/scene/labels/WalLabels";
import type { SceneViewProps } from "@/components/scene/types";

interface Props extends SceneViewProps {
  cameraReset: number;
  onContextLost: () => void;
}

// Browser-only: loaded with next/dynamic and ssr: false. R3F disposes the
// geometries and materials it created when this unmounts.
export default function DatabaseScene({ cameraReset, onContextLost, ...view }: Props) {
  const palette = usePalette();
  const { sim, scene } = view;
  const [registry] = useState(() => new AnchorRegistry());
  // R3F forces a context loss when the canvas unmounts (e.g. switching to 2D); only a loss while mounted is a failure.
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  const stepKey = scene.step?.id ?? "idle";
  // Recomputed per step (not per pause/resume), so pausing never restarts the marker's trip.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const path = useMemo(() => markerPath(sim, scene), [sim, stepKey]);

  return (
    <div className="absolute inset-0">
      <Canvas
        orthographic
        dpr={[1, 2]}
        camera={{ position: [0, 13, 13], zoom: 30, near: 0.1, far: 200 }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener("webglcontextlost", (e) => {
            e.preventDefault();
            if (mounted.current) onContextLost();
          }, { once: true });
        }}
      >
        <color attach="background" args={[palette.background]} />
        <ambientLight intensity={palette.ambient} />
        <directionalLight position={[6, 14, 8]} intensity={palette.directional} />
        <hemisphereLight args={[palette.hemiSky, palette.hemiGround, 0.6]} />
        <CameraRig resetSignal={cameraReset} />
        <Stages3D {...view} />
        <BTree3D {...view} />
        <BufferPool3D {...view} />
        <Disk3D {...view} />
        <Wal3D {...view} />
        <FlowPaths sim={sim} scene={scene} />
        <QueryMarker path={path} reduceMotion={view.reduceMotion} dim={scene.status === "idle"} />
        <LabelProjector registry={registry} />
      </Canvas>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <FlowLabels registry={registry} {...view} />
        <StorageLabels registry={registry} {...view} />
        <WalLabels registry={registry} {...view} />
      </div>
    </div>
  );
}
