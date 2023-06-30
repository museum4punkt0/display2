import { SceneParser } from "../../artefactViewer";
import { SimpleSceneManager } from "../../artefactViewer/SimpleSceneManager";
import { SpriteFeature } from "../../artefactViewer/feature";
import { TestRenderer, gltfSceneFixture } from "../__fixtures__/fixtures";
import * as three from 'three';


test('sprite on scene creation loads texture', async () => {
  const sm = new SimpleSceneManager(new TestRenderer());
  const feat = new SpriteFeature();
  feat.onSceneCreation(sm);
  // wait for current promises to finish. Might be fragile. If jest will mock nexTick then this breaks.
  // jest.runAllTicks(); // this does not work for some reason so do it explicitly
  await new Promise(process.nextTick);
  expect(feat.defaultTexture).not.toBeFalsy();
});

test('sprite load', () => {
  const feat = new SpriteFeature();
  const gltf = gltfSceneFixture({withPoi: true});
  const parser = SceneParser.parse(gltf);

  feat.load(parser);
  expect(feat.node.parent).toBe(parser.root);
});

test('sprites are created for empties', () => {
  const feat = new SpriteFeature();
  const gltf = gltfSceneFixture({withPoi:true});
  const parser = SceneParser.parse(gltf);

  feat.load(parser);

  expect(feat.node.children.length).toBe(1);
  expect(feat.node.children[0].userData.fromCameraNamed).toBe(
    'lookCam'
  );
});

test('sprite picking works for simple scene', () => {
  const feat = new SpriteFeature();
  // without mesh otherwise we hit the mesh
  const gltf = gltfSceneFixture({withPoi: true, withMesh: false});
  const parser = SceneParser.parse(gltf, undefined, new Map([['all', ['lookCam']]]));
  const caster = new three.Raycaster();
  // before load it's a nop
  expect(feat.getInterestPointHitBy(caster)).toBeUndefined();

  feat.load(parser);

  // from z+1 looking into the z- direction
  gltf.cameras[0].position.set(0, 0, 1);
  gltf.cameras[0].lookAt(new three.Vector3());
  (gltf.cameras[0] as three.PerspectiveCamera).updateProjectionMatrix();
  // need the sprites visible to hit them
  feat.enableSpriteGroup('all');

  // should squarely hit the center
  caster.setFromCamera(new three.Vector2(0, 0), gltf.cameras[0]);
  let hit = feat.getInterestPointHitBy(caster);
  expect(hit).toBe('lookCam');

  // this should be inside the very edge of the sprite which is by default of radius 1
  caster.setFromCamera(new three.Vector2(0.99, 0), gltf.cameras[0]);
  hit = feat.getInterestPointHitBy(caster);
  expect(hit).toBe('lookCam');

  // outside the edge
  caster.setFromCamera(new three.Vector2(1.1, 0), gltf.cameras[0]);
  hit = feat.getInterestPointHitBy(caster);
  expect(hit).toBeUndefined();

  // should make sprite invisible and not hit-able
  feat.enableSpriteGroup('');

  // should squarely hit the center
  caster.setFromCamera(new three.Vector2(0, 0), gltf.cameras[0]);
  hit = feat.getInterestPointHitBy(caster);
  expect(hit).toBe(undefined);
});