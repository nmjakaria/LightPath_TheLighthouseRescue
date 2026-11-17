/*
 * Owns the ordered layer stack and the canvas transform. The device-pixel clear uses the identity
 * transform; all layers then draw in world units through the ViewTransform matrix from §12.1.
 */
import type { FrameStats } from "@/engine/core/GameLoop";
import type { ViewTransform } from "@/engine/core/ViewTransform";
import type { Layer } from "./Layer";

export class SceneRenderer {
  constructor(
    private readonly view: ViewTransform,
    private readonly layers: readonly Layer[],
  ) {}

  render(ctx: CanvasRenderingContext2D, stats: Readonly<FrameStats>): void {
    const { width, height } = this.view.getDeviceSize();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.setTransform(...this.view.getDeviceTransform());

    for (const layer of this.layers) {
      layer.draw({ ctx, view: this.view, stats });
    }
  }

  dispose(): void {
    for (const layer of this.layers) layer.dispose?.();
  }
}
