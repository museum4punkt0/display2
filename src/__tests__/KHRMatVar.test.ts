/**
 * @jest-environment node
 */
import fs from 'fs';
import path from 'path';
import { KHRMaterialsVariantsParser } from '../artefactViewer/KHRMaterialsVariantsParser';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

test('khr loads variants', async () => {
  const pth = path.join(__dirname, 'data');
  // in node mode, even if textures are embedded three will use the self.URL browser global
  // to load the image in some blob. jest don't like that.
  // However in jsdom mode where self.URL is available the TextDecoder api is not.
  // Even if the thing is available both in node and browsers. There's a huge issue on jest github...
  // Anyway that is why we need a model without any images to not trigger any image loads.
  const filePth = path.join(pth, 'matVarNoImg.glb');
  const fr = await fs.promises.readFile(filePth);
  // node has a strange notion of a global buffer, to get to the data we need to offset
  const uint8arr = fr.buffer.slice(fr.byteOffset, fr.byteOffset + fr.byteLength);
  console.log(uint8arr);
  const loader = new GLTFLoader();
  const gltf = await loader.parseAsync(uint8arr, pth);
  const parser = new KHRMaterialsVariantsParser(gltf);
  expect(parser.variants).toEqual(['pink', 'green']);

  await parser.selectVariant('pink');
  await parser.selectVariant('green');
  await parser.selectVariant('');
});