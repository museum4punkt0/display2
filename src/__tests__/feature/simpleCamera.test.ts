import { SceneParser } from "../../artefactViewer";
import { SimpleSceneManager } from "../../artefactViewer/SimpleSceneManager";
import { SimpleCameraFeature } from "../../artefactViewer/feature/simpleCamera";
import { TestRenderer, gltfMockFixture } from "../__fixtures__/fixtures";
import * as three from 'three';

test('A 120 deg fov camera looking tightly at a 2x2x2 cube will be at z=2', () => {
  const radius = Math.sqrt(3);
  // the extreme fov makes the math clean and easy to check manually
  let cameraPos = SimpleCameraFeature._cameraPositionOnZ(120, radius);
  expect(cameraPos.z).toBeCloseTo(2);
  // the rotated camera view also along nice angles
  cameraPos = SimpleCameraFeature.closestCameraPosition(120, radius, 30, 60);
  expect(cameraPos.y).toBeCloseTo(1);
  expect(cameraPos.z).toBeCloseTo(Math.sqrt(3) / 2);
  expect(cameraPos.x).toBeCloseTo(3 / 2);
});

test('SimpleCameraFeature load positions default camera well and steals fov', () => {
  const sm = new SimpleSceneManager(new TestRenderer());
  const feat = new SimpleCameraFeature();

  feat.onSceneCreation(sm);
  expect(feat.defaultCamera.fov).toBe(50);

  const root = new three.Group();
  const mesh = new three.Mesh(new three.BoxGeometry(2, 2, 2));
  root.add(mesh);

  const gltf = gltfMockFixture(root);
  gltf.cameras = [new three.PerspectiveCamera(120)];

  const parser = SceneParser.parse(gltf);
  feat.load(parser);
  // steals fov from scene camera
  expect(feat.defaultCamera.fov).toBe(120);

  const camPos = feat.defaultCamera.position;
  expect(camPos.length()).toBeCloseTo(2);
});

test('load before onSceneCreation is a nop', () => {
  const feat = new SimpleCameraFeature();
  const root = new three.Group();
  const gltf = gltfMockFixture(root);
  const parser = SceneParser.parse(gltf);
  feat.load(parser);
});
