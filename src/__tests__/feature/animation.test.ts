import { SceneParser } from "../../artefactViewer";
import { SimpleSceneManager } from "../../artefactViewer/SimpleSceneManager";
import { ModelAnimationFeature } from "../../artefactViewer/feature";
import { TestRenderer, gltfSceneFixture } from "../__fixtures__/fixtures";
import * as three from 'three';


test('loads animations and plays them correctly', async () => {
  const sm = new SimpleSceneManager(new TestRenderer());
  const feat = new ModelAnimationFeature();
  feat.onSceneCreation(sm);
  const gltf = gltfSceneFixture({});
  const cube = gltf.scene.getObjectByName('cube');
  if(!cube) fail('test bug');

  // from 0sec at origin to 1sec at 111 of the object.position property
  const positionTrack = new three.VectorKeyframeTrack('cube.position', [0, 1], [0, 0, 0, 1, 1, 1]);
  const clip1 = new three.AnimationClip('clip1', 1, [positionTrack]);
  const clip2 = new three.AnimationClip('clip2', 1, [positionTrack]);

  gltf.animations = [clip1, clip2];

  const parser = SceneParser.parse(gltf);
  const animations = feat.load(parser);

  expect(animations).toEqual(['clip1', 'clip2']);

  feat.playAnimations(['clip1']);

  feat.preDraw(0.5);
  expect(cube.position.toArray()).toEqual([0.5, 0.5, 0.5]);

});