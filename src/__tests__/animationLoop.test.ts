// for the record I tried the fake timers, it's a mess
import { AnimationLoop } from "../artefactViewer/animationLoop";

test('animation loop scheduling time aliasing', async () => {
  const onTick = jest.fn<void, [number, number], unknown>();
  const loop = new AnimationLoop(onTick, 30);
  loop.start();
  // jsdom seems to schedule requestAnimationFrame at 60 fps
  // we should have gotten 30 frames before this is done
  await new Promise(r => setTimeout(r, 500));
  // At the requested 10 fps loop we should have both hit and skipped ticks
  // due to time aliasing we won't hit 15 times but less
  // still in the worse case we should hit at least half
  expect(onTick.mock.calls.length).toBeLessThan(15);
  expect(onTick.mock.calls.length).toBeGreaterThan(15/2);
  loop.stop();
  onTick.mockReset();
  await new Promise(r => setTimeout(r, 200));
  // with the loop stopped we should not hit even though 3 frames elapsed
  expect(onTick.mock.calls.length).toBe(0);
  // Fragile test if jsdom requestAnimationFrame schedules at tiny fps like 5 fps
  // due to time aliasing effects
});