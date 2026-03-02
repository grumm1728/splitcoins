import { describe, expect, it, vi } from "vitest";
import { createRenderScheduler } from "./renderScheduler";

describe("render scheduler", () => {
  it("coalesces repeated schedule calls into one frame", () => {
    const render = vi.fn();
    const queue: FrameRequestCallback[] = [];
    const scheduler = createRenderScheduler(
      render,
      (callback) => {
        queue.push(callback);
        return queue.length;
      },
      () => {},
    );

    scheduler.schedule();
    scheduler.schedule();
    scheduler.schedule();

    expect(queue).toHaveLength(1);
    queue[0](16);
    expect(render).toHaveBeenCalledTimes(1);
  });

  it("flushes immediately and cancels the pending frame", () => {
    const render = vi.fn();
    const cancel = vi.fn();
    const scheduler = createRenderScheduler(
      render,
      () => 99,
      cancel,
    );

    scheduler.schedule();
    scheduler.flush();

    expect(cancel).toHaveBeenCalledWith(99);
    expect(render).toHaveBeenCalledTimes(1);
  });
});
