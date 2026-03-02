type Raf = (callback: FrameRequestCallback) => number;
type CancelRaf = (handle: number) => void;

export type RenderScheduler = {
  schedule: () => void;
  flush: () => void;
  dispose: () => void;
};

export function createRenderScheduler(
  render: () => void,
  raf: Raf = window.requestAnimationFrame.bind(window),
  cancelRaf: CancelRaf = window.cancelAnimationFrame.bind(window),
): RenderScheduler {
  let frameHandle: number | null = null;

  const run = () => {
    frameHandle = null;
    render();
  };

  return {
    schedule: () => {
      if (frameHandle !== null) {
        return;
      }
      frameHandle = raf(() => run());
    },
    flush: () => {
      if (frameHandle !== null) {
        cancelRaf(frameHandle);
        frameHandle = null;
      }
      render();
    },
    dispose: () => {
      if (frameHandle !== null) {
        cancelRaf(frameHandle);
        frameHandle = null;
      }
    },
  };
}
