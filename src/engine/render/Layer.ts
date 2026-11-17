import type { FrameStats } from "@/engine/core/GameLoop";
import type { ViewTransform } from "@/engine/core/ViewTransform";

export interface FrameContext {
  ctx: CanvasRenderingContext2D;
  view: ViewTransform;
  stats: Readonly<FrameStats>;
}

/* One render pass. Layers are drawn in array order after the renderer applies the view transform. */
export interface Layer {
  readonly name: string;
  draw(context: FrameContext): void;
  dispose?(): void;
}
