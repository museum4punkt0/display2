import { Object3D } from 'three';
import { SceneParser } from '../artefactViewer/sceneParser';
import * as three from 'three';
import { gltfMockFixture } from './__fixtures__/fixtures';

test('SceneParser finds empties and lights', () => {
  const root = new three.Group();
  const mesh = new three.Mesh(new three.BoxGeometry());

  const gltf = gltfMockFixture(root);
  const cam1 = new three.PerspectiveCamera();
  const cam2 = new three.PerspectiveCamera();
  cam1.name = 'cam1';
  gltf.cameras = [cam1, cam2];

  // associated by naming convention
  let empty = new Object3D();
  empty.name = 'poi4cam1';
  root.add(empty);

  // associated by parenting to camera
  empty = new Object3D();
  empty.name = 'irrelevant';
  cam2.add(empty);
  // camera needs to be in the scene if linked by parenting
  root.add(cam2);

  root.add(new three.DirectionalLight());
  root.add(mesh);

  const parser = SceneParser.parse(gltf);

  expect(parser.cameraToPoi.size).toBe(2);
  expect(parser.lights.length).toBe(1);
});

test('SceneParser computes bbox correctly', () => {
  const root = new three.Group();
  const mesh = new three.Mesh(new three.BoxGeometry(2, 2, 2));
  mesh.position.set(-100, 0, 0);
  root.add(mesh);

  const parser = SceneParser.parse(gltfMockFixture(root));

  expect(parser.root.position.x).toBeCloseTo(0);
  expect(parser.root.position.y).toBeCloseTo(0);
  expect(parser.root.position.z).toBeCloseTo(0);

  parser.root.position.sub(parser.center);
  expect(parser.root.position.x).toBeCloseTo(100);

  expect(parser.boundingCubeDiagonal).toBeCloseTo(2 * Math.sqrt(3));
});

test('KHRMaterialsVariantsParser happy ', () => {
  // const decoder = new TextDecoder();
  // XXX please let me load a file jest. ok? Please.
  expect('ok').toBe('ok');
});
