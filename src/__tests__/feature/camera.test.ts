import { SceneParser } from "../../artefactViewer";
import { SimpleSceneManager } from "../../artefactViewer/SimpleSceneManager";
import { CameraFeature } from "../../artefactViewer/feature";
import { TestRenderer, gltfSceneFixture } from "../__fixtures__/fixtures";

test('cameraFeature load', () => {
  const sm = new SimpleSceneManager(new TestRenderer());
  const gltf = gltfSceneFixture({});
  const parser = SceneParser.parse(gltf);
  const feat = new CameraFeature();
  // load before sceneCreation is a nop
  expect(feat.load(parser)).toEqual([]);

  feat.onSceneCreation(sm);
  // inserted debug node in scene
  expect(feat.debugNode.parent).toBe(sm.scene);

  const cameras = feat.load(parser);
  // found both cameras
  expect(cameras).toEqual(['', 'camera', 'lookCam']);
  // inserted debug helpers for 2 of them and the debug camera and it's helper
  expect(feat.debugNode.children.length).toBe(2 + 2);
  // no motion track active
  expect(feat.motionTrack).toBeFalsy();
});

test('select camera too early is a nop', () => {
  const sm = new SimpleSceneManager(new TestRenderer());
  const feat = new CameraFeature();
  feat.selectCamera('camera');
  expect(feat.selectedCamera).toBe(feat.defaultCamera);
  feat.onSceneCreation(sm);
  feat.selectCamera('camera');
  expect(feat.selectedCamera).toBe(feat.defaultCamera);
});

test('select camera', () => {
  const sm = new SimpleSceneManager(new TestRenderer());
  const gltf = gltfSceneFixture({});
  const parser = SceneParser.parse(gltf);
  const feat = new CameraFeature();
  feat.onSceneCreation(sm);
  feat.load(parser);
  // non-existing camera does nothing
  feat.selectCamera('Foo');
  expect(feat.selectedCamera).toBe(feat.defaultCamera);
  // selecting a camera
  feat.selectCamera('lookCam');
  expect(feat.selectedCamera).toBe(gltf.cameras[1]);
  expect(sm.renderer.getRenderCamera()).toBe(gltf.cameras[1]);
  // we should have a motion track started
  expect(feat.motionTrack).not.toBeFalsy();
  // selecting '' resets to defaults
  feat.selectCamera('');
  expect(feat.selectedCamera).toBe(feat.defaultCamera);
  expect(sm.renderer.getRenderCamera()).toBe(feat.defaultCamera);
  // advancing time should eventually finish the motion
  feat.preDraw(10);
  expect(feat.motionTrack).not.toBeFalsy();
  expect(feat.motionTrack!.time).toBeGreaterThan(feat.motionTrack!.duration);
});