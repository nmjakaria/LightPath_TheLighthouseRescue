"use client";

/* React owns the canvas element and its listeners; the engine owns state, input queue, loop and
 * layers. Only a low-rate HUD snapshot crosses back into React, so pointer moves never re-render.
 * All listeners, observers and frames are released on unmount for Strict Mode safety. */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
  type PointerEvent,
  type RefObject,
} from "react";
import { uiConfig } from "@/config/uiConfig";
import { GameLoop } from "@/engine/core/GameLoop";
import { GameState, type HudSnapshot } from "@/engine/core/GameState";
import { InputController, commandForKey } from "@/engine/core/InputController";
import { ViewTransform } from "@/engine/core/ViewTransform";
import { SceneRenderer } from "@/engine/render/SceneRenderer";
import { BeamLayer } from "@/engine/render/layers/BeamLayer";
import { BackgroundLayer } from "@/engine/render/layers/BackgroundLayer";
import { ComponentsLayer } from "@/engine/render/layers/ComponentsLayer";
import { readPalette } from "@/engine/render/palette";
import { pickMirror, pointerAngle } from "@/game/picking";
import { createStore } from "@/lib/store/createStore";
import type { InputCommand } from "@/types/input";
import type { LevelConfig } from "@/types/level";
import type { Vec2 } from "@/types/vec2";

export interface GameRuntime {
  containerRef: RefObject<HTMLDivElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  snapshot: HudSnapshot;
  dispatch(command: InputCommand): void;
  pointerWorld(event: PointerEvent<HTMLCanvasElement>): Vec2;
  onPointerDown(event: PointerEvent<HTMLCanvasElement>): void;
  onPointerMove(event: PointerEvent<HTMLCanvasElement>): void;
  onPointerUp(event: PointerEvent<HTMLCanvasElement>): void;
  onPointerLeave(): void;
  getStats(): { fps: number; frameMs: number };
}

export function useGameRuntime(
  level: LevelConfig,
  reducedMotion: boolean,
  rotationStepDeg: number,
): GameRuntime {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<GameState | null>(null);
  const inputRef = useRef<InputController | null>(null);
  const viewRef = useRef<ViewTransform | null>(null);
  const loopRef = useRef<GameLoop | null>(null);
  const dragIdRef = useRef<string | null>(null);
  const reducedMotionRef = useRef(reducedMotion);
  const rotationStepRef = useRef(rotationStepDeg);
  const store = useMemo(() => createStore(new GameState(level).snapshot()), [level]);
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);

  useEffect(() => {
    reducedMotionRef.current = reducedMotion;
  }, [reducedMotion]);
  useEffect(() => {
    rotationStepRef.current = rotationStepDeg;
  }, [rotationStepDeg]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const ctx = canvas?.getContext("2d", { alpha: false });
    if (!canvas || !container || !ctx) return;

    const palette = readPalette(getComputedStyle(document.documentElement));
    const view = new ViewTransform();
    const state = new GameState(level, rotationStepRef.current);
    const input = new InputController();
    const renderer = new SceneRenderer(view, [
      new BackgroundLayer(palette),
      new ComponentsLayer(palette, state),
      new BeamLayer(palette, state),
    ]);
    stateRef.current = state;
    inputRef.current = input;
    viewRef.current = view;
    store.set(state.snapshot());

    const resize = (): void => {
      const rect = container.getBoundingClientRect();
      view.resize(rect.width, rect.height, window.devicePixelRatio);
      const size = view.getDeviceSize();
      if (canvas.width !== size.width) canvas.width = size.width;
      if (canvas.height !== size.height) canvas.height = size.height;
    };

    let sincePublishMs = 0;
    const loop = new GameLoop({
      processInput: () => {
        state.rotationStepDeg = rotationStepRef.current;
        for (const command of input.drain()) state.apply(command);
      },
      update: (dt) => {
        sincePublishMs += dt * 1000;
        state.tick(dt);
        if (sincePublishMs >= uiConfig.hudRefreshMs) {
          sincePublishMs = 0;
          store.set(state.snapshot());
        }
      },
      render: (stats) => renderer.render(ctx, stats),
    });
    loopRef.current = loop;

    const onKeyDown = (event: KeyboardEvent): void => {
      const target = event.target;
      if (target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      const command = commandForKey(event.key, event.shiftKey);
      if (!command) return;
      event.preventDefault();
      input.enqueue(command);
    };
    const onVisibility = (): void => {
      if (document.hidden) loop.suspend();
      else loop.resume();
    };
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(resize);
    observer?.observe(container);
    window.addEventListener("resize", resize);
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("visibilitychange", onVisibility);

    resize();
    loop.start();
    return () => {
      loop.stop();
      observer?.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("visibilitychange", onVisibility);
      renderer.dispose();
      stateRef.current = null;
      inputRef.current = null;
      viewRef.current = null;
      loopRef.current = null;
    };
  }, [level, store]);

  const pointerWorld = useCallback((event: PointerEvent<HTMLCanvasElement>): Vec2 => {
    const rect = event.currentTarget.getBoundingClientRect();
    return (
      viewRef.current?.toWorld({ x: event.clientX - rect.left, y: event.clientY - rect.top }) ?? {
        x: 0,
        y: 0,
      }
    );
  }, []);

  const dispatch = useCallback((command: InputCommand): void => {
    inputRef.current?.enqueue(command);
  }, []);

  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLCanvasElement>) => {
      const state = stateRef.current;
      const input = inputRef.current;
      if (!state || !input) return;
      const point = pointerWorld(event);
      const id = pickMirror(point, state.mirrors);
      input.enqueue({ type: "hover", id });
      input.enqueue({ type: "select", id });
      if (id) {
        dragIdRef.current = id;
        input.enqueue({ type: "beginRotate", id });
      }
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [pointerWorld],
  );

  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLCanvasElement>) => {
      const state = stateRef.current;
      const input = inputRef.current;
      if (!state || !input) return;
      const point = pointerWorld(event);
      input.enqueue({ type: "hover", id: pickMirror(point, state.mirrors) });
      const id = state.dragId ?? dragIdRef.current;
      const mirror = state.mirrors.find((candidate) => candidate.id === id);
      if (id && mirror) input.enqueue({ type: "rotateTo", id, angleDeg: pointerAngle(point, mirror.center) });
    },
    [pointerWorld],
  );

  const onPointerUp = useCallback((event: PointerEvent<HTMLCanvasElement>) => {
    const input = inputRef.current;
    const id = stateRef.current?.dragId ?? dragIdRef.current;
    if (input && id) input.enqueue({ type: "endRotate", id });
    dragIdRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  const onPointerLeave = useCallback(() => {
    inputRef.current?.enqueue({ type: "hover", id: null });
  }, []);

  const getStats = useCallback((): { fps: number; frameMs: number } => {
    const stats = loopRef.current?.stats;
    return { fps: stats?.fps ?? 0, frameMs: stats?.frameMs ?? 0 };
  }, []);

  return useMemo(
    () => ({
      containerRef,
      canvasRef,
      snapshot,
      dispatch,
      pointerWorld,
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerLeave,
      getStats,
    }),
    [
      snapshot,
      dispatch,
      pointerWorld,
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerLeave,
      getStats,
    ],
  );
}
