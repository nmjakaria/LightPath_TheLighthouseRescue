"use client";

/* React owns the canvas element and all listeners; the engine owns the loop, view and layers.
 * Every listener, observer and frame request is released on unmount, so Strict Mode double-mounts
 * are safe. Components never import the engine directly except through this hook boundary. */
import { useCallback, useEffect, useMemo, useRef, type PointerEvent, type RefObject } from "react";
import { GameLoop } from "@/engine/core/GameLoop";
import { ViewTransform } from "@/engine/core/ViewTransform";
import { SceneRenderer } from "@/engine/render/SceneRenderer";
import { BackgroundLayer } from "@/engine/render/layers/BackgroundLayer";
import {
  hitTestPreview,
  PlaceholderSceneLayer,
  type PlaceholderSceneState,
} from "@/engine/render/layers/PlaceholderSceneLayer";
import { readPalette } from "@/engine/render/palette";
import type { Vec2 } from "@/types/vec2";

export interface CanvasRuntime {
  containerRef: RefObject<HTMLDivElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  pointerWorld(event: PointerEvent<HTMLCanvasElement>): Vec2;
  setPointer(point: Vec2 | null): void;
  getStats(): { fps: number; frameMs: number };
}

export function useCanvasRuntime(reducedMotion: boolean): CanvasRuntime {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const loopRef = useRef<GameLoop | null>(null);
  const viewRef = useRef<ViewTransform | null>(null);
  const reducedMotionRef = useRef(reducedMotion);
  const sceneState = useRef<PlaceholderSceneState>({ pointer: null, hoveredId: null, timeSec: 0 });

  useEffect(() => {
    reducedMotionRef.current = reducedMotion;
  }, [reducedMotion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const ctx = canvas?.getContext("2d", { alpha: false });
    if (!canvas || !container || !ctx) return;

    const palette = readPalette(getComputedStyle(document.documentElement));
    const view = new ViewTransform();
    const renderer = new SceneRenderer(view, [
      new BackgroundLayer(palette),
      new PlaceholderSceneLayer(palette, sceneState.current),
    ]);
    viewRef.current = view;

    const resize = (): void => {
      const rect = container.getBoundingClientRect();
      view.resize(rect.width, rect.height, window.devicePixelRatio);
      const size = view.getDeviceSize();
      if (canvas.width !== size.width) canvas.width = size.width;
      if (canvas.height !== size.height) canvas.height = size.height;
    };

    const loop = new GameLoop({
      processInput: () => {},
      update: (dt) => {
        if (!reducedMotionRef.current) sceneState.current.timeSec += dt;
        sceneState.current.hoveredId = hitTestPreview(sceneState.current.pointer);
      },
      render: (stats) => renderer.render(ctx, stats),
    });
    loopRef.current = loop;

    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(resize);
    observer?.observe(container);
    window.addEventListener("resize", resize);
    const onVisibility = (): void => {
      if (document.hidden) loop.suspend();
      else loop.resume();
    };
    document.addEventListener("visibilitychange", onVisibility);

    resize();
    loop.start();
    return () => {
      loop.stop();
      observer?.disconnect();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
      renderer.dispose();
      loopRef.current = null;
      viewRef.current = null;
    };
  }, []);

  const pointerWorld = useCallback((event: PointerEvent<HTMLCanvasElement>): Vec2 => {
    const rect = event.currentTarget.getBoundingClientRect();
    return (
      viewRef.current?.toWorld({ x: event.clientX - rect.left, y: event.clientY - rect.top }) ?? {
        x: 0,
        y: 0,
      }
    );
  }, []);

  const setPointer = useCallback((point: Vec2 | null): void => {
    sceneState.current.pointer = point;
    sceneState.current.hoveredId = hitTestPreview(point);
  }, []);

  const getStats = useCallback((): { fps: number; frameMs: number } => {
    const stats = loopRef.current?.stats;
    return { fps: stats?.fps ?? 0, frameMs: stats?.frameMs ?? 0 };
  }, []);

  return useMemo(
    () => ({ containerRef, canvasRef, pointerWorld, setPointer, getStats }),
    [pointerWorld, setPointer, getStats],
  );
}
