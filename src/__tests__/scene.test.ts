/**
 * @jest-environment node
 */

import { SceneManager, SceneParser } from '../artefactViewer';
import { TestRenderer, gltfSceneFixture } from './__fixtures__/fixtures';

test('can construct SceneManager', () => {
  const mockRenderer = new TestRenderer();
  const sceneMgr = new SceneManager(mockRenderer);
  expect(sceneMgr.scene.children.length).toBeGreaterThan(1);
});


test('can apply gltf scene to the scene', () => {
  const mockRenderer = new TestRenderer();
  const sceneMgr = new SceneManager(mockRenderer);

  const gltf = gltfSceneFixture({});
  sceneMgr.load(SceneParser.parse(gltf));
  expect(sceneMgr.content.children.length).toBeGreaterThan(0);
});

test('default lights are used only if none in scene', () => {
  const mockRenderer = new TestRenderer();
  const sceneMgr = new SceneManager(mockRenderer);

  let gltf = gltfSceneFixture({});
  sceneMgr.load(SceneParser.parse(gltf));
  expect(sceneMgr.lighting.node.visible).toBe(false);

  gltf = gltfSceneFixture({ withLights: false });
  sceneMgr.load(SceneParser.parse(gltf));
  expect(sceneMgr.lighting.node.visible).toBe(true);
  expect(sceneMgr.lighting.node.children.length).toBe(2);
});

test('debug mode toggles debug nodes in scene', () => {
  const mockRenderer = new TestRenderer();
  const sceneMgr = new SceneManager(mockRenderer);

  const gltf = gltfSceneFixture({});
  sceneMgr.load(SceneParser.parse(gltf));
  
  sceneMgr.enableDebug(true);
  expect(sceneMgr.refGrid.node.visible).toBe(true);
  expect(sceneMgr.refGrid.helpersDebugNode.visible).toBe(true);
  expect(sceneMgr.cameraFeature.debugNode.visible).toBe(true);
  sceneMgr.enableDebug(false);
  expect(sceneMgr.refGrid.node.visible).toBe(false);
  expect(sceneMgr.refGrid.helpersDebugNode.visible).toBe(false);
  expect(sceneMgr.cameraFeature.debugNode.visible).toBe(false);
});

// more documentation than test. maybe too fragile
test('static top level scene structure', () => {
  const mockRenderer = new TestRenderer();
  const sceneMgr = new SceneManager(mockRenderer);

  const gltf = gltfSceneFixture({withLights: false});
  sceneMgr.load(SceneParser.parse(gltf));

  expect(sceneMgr.cameraFeature.debugNode.parent).toBe(sceneMgr.scene);
  expect(sceneMgr.refGrid.node.parent).toBe(sceneMgr.scene);
  expect(sceneMgr.content.parent).toBe(sceneMgr.scene);
  expect(sceneMgr.lighting.node.parent).toBe(sceneMgr.scene);

  expect(sceneMgr.sceneParser.root.parent).toBe(sceneMgr.content);
  expect(sceneMgr.sprites.node.parent).toBe(sceneMgr.sceneParser.root);
  expect(sceneMgr.refGrid.helpersDebugNode.parent).toBe(sceneMgr.content);
});

