/** the node independent part of the glb2json script.
 * Not part of the script as to not make the script need to
 * bundle everything or smb to expose internals like GLTFLoader
 */
import { SceneParser } from './artefactViewer';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { IStory } from './model';

export async function _glb2storyJson(
  uint8arr: ArrayBuffer,
  path: string,
  dirpath: string
) {
  const loader = new GLTFLoader();
  const gltf = await loader.parseAsync(uint8arr, dirpath);
  const parser = SceneParser.parse(gltf);
  const ret: IStory = {
    title: 'Story title',
    content: [],
    gltfUrl: path,
    chapters: [{ id: 'chapter', title: 'chap', cameras: [] }],
  };

  for (const [k, _v] of parser.cameraToPoi) {
    ret.content.push({
      title: `Title for camera ${k}`,
      html: '<p> some fancy description html </p>',
      camera: k,
      materialVariant:
        'pick a material variant or delete this line. Available variants: ' +
        parser.khrMaterialVariantsParser?.variants.join(),
      animations: gltf.animations.map(a => a.name),
      overlayHtml:
        '<p> some html to be shown on top of the 3d scene. Or delete this line </p>',
      sprite: 'url to a sprite texture or delete this line',
    });
    ret.chapters[0].cameras.push(k);
  }
  return JSON.stringify(ret, null, '  ');
}
