import { Object3D, Vector3, Box3 } from 'three';
import * as three from 'three';
import { getBoundingCube } from '../artefactViewer/sceneParser';

test('bbox of a node takes into acount only meshes not empties or lights', () => {
  const offCenterCubeGeom = new three.BoxGeometry(2, 2, 2);
  offCenterCubeGeom.translate(0, 0, 3);

  const offCenterCube = new three.Mesh(offCenterCubeGeom);

  let cubeBox = new Box3();
  cubeBox.setFromObject(offCenterCube);
  let center = cubeBox.getCenter(new Vector3());
  let size = cubeBox.getSize(new Vector3());
  let diag = size.length();
  expect(center.x).toBeCloseTo(0);
  expect(center.y).toBeCloseTo(0);
  expect(center.z).toBeCloseTo(3);
  expect(diag).toBeCloseTo(2 * Math.sqrt(3));

  const objLeft = new Object3D();
  objLeft.position.set(-10, 0, 0);

  const root = new Object3D();
  root.position.set(2, 0, 0);

  root.add(offCenterCube);
  root.add(objLeft);

  // expect the bbox of cube not to care about parenting
  cubeBox = new Box3();
  cubeBox.setFromObject(offCenterCube);
  center = cubeBox.getCenter(new Vector3());
  expect(center.x).toBeCloseTo(0);
  expect(center.y).toBeCloseTo(0);
  expect(center.z).toBeCloseTo(3);

  const rootBox = new Box3();
  rootBox.setFromObject(root);
  center = rootBox.getCenter(new Vector3());
  size = rootBox.getSize(new Vector3());
  diag = size.length();

  // expect only the mesh to count and not the objLeft
  expect(diag).toBeCloseTo(2 * Math.sqrt(3));
  // center should be translated by roots position
  expect(center.x).toBeCloseTo(2);
  expect(center.y).toBeCloseTo(0);
  expect(center.z).toBeCloseTo(3);

  const light = new three.DirectionalLight();
  light.position.set(-20, 0, 0);
  root.add(light);

  // expect the light did not influence the bbox
  rootBox.setFromObject(root);
  center = rootBox.getCenter(new Vector3());
  size = rootBox.getSize(new Vector3());
  diag = size.length();

  expect(diag).toBeCloseTo(2 * Math.sqrt(3));
  expect(center.x).toBeCloseTo(2);
  expect(center.y).toBeCloseTo(0);
  expect(center.z).toBeCloseTo(3);

  const camera = new three.PerspectiveCamera();
  camera.position.set(0, 0, 100);
  root.add(camera);

  // expect the camera did not influence the bbox
  rootBox.setFromObject(root);
  expect(diag).toBeCloseTo(2 * Math.sqrt(3));
  expect(center.x).toBeCloseTo(2);
  expect(center.y).toBeCloseTo(0);
  expect(center.z).toBeCloseTo(3);
});

test('get bounding cube', () => {
  const offCenterCubeGeom = new three.BoxGeometry(2, 2, 2);
  offCenterCubeGeom.translate(0, 0, 3);
  const offCenterCube = new three.Mesh(offCenterCubeGeom);
  offCenterCube.position.set(-1, 0, 1);
  // the bbox for this off center geometry in a translated mesh
  // should be [-2, -1, 3] --> [0, 1, 5]

  const largeCubeGeom = new three.BoxGeometry();
  const largeCube = new three.Mesh(largeCubeGeom);
  largeCube.scale.set(12, 12, 12);
  largeCube.position.set(8, 8, 0);
  // bbox for this [2, 2, -6] --> [14, 14, 6]
  // common bbox [-2, -1, -6] max[14, 14, 6]

  const objEmptyLeft = new Object3D();
  objEmptyLeft.position.set(-10, 0, 0);

  const root = new Object3D();
  root.position.set(2, 0, 0);
  // x+2 common bbox [0, -1, -6]..[16 14 6]

  root.add(offCenterCube);
  root.add(largeCube);
  root.add(objEmptyLeft);

  const light = new three.DirectionalLight();
  light.position.set(-20, 0, 0);
  root.add(light);

  const camera = new three.PerspectiveCamera();
  camera.position.set(0, 0, 100);
  root.add(camera);

  const rootBox = new Box3();
  rootBox.setFromObject(root);
  expect(rootBox.min.x).toBeCloseTo(0);
  expect(rootBox.min.y).toBeCloseTo(-1);
  expect(rootBox.min.z).toBeCloseTo(-6);
  expect(rootBox.max.x).toBeCloseTo(16);
  expect(rootBox.max.y).toBeCloseTo(14);
  expect(rootBox.max.z).toBeCloseTo(6);

  const [center, diag] = getBoundingCube(root);
  expect(diag).toBeCloseTo(rootBox.getSize(new Vector3()).length());
  expect(center.x).toBeCloseTo(8);
  expect(center.y).toBeCloseTo(13 / 2);
  expect(center.z).toBeCloseTo(0);
});
