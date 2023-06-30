import * as three from 'three';
import { GLTF, GLTFParser } from 'three/examples/jsm/loaders/GLTFLoader';
import { IRenderer, IResourceLoader } from '../../artefactViewer';

export function gltfMockFixture(gltfScene: three.Group) {
  const gltf: GLTF = {
    scene: gltfScene,
    scenes: [gltfScene],
    animations: [],
    cameras: [],
    asset: { version: '2.0' },
    // won't be used by calee, bypass typecheck
    parser: null as unknown as GLTFParser,
    userData: {},
  };
  return gltf;
}

class TestResourceLoader implements IResourceLoader{
  loadTexture(relativeUrl: string) {
    return Promise.resolve(new three.Texture());
  }
  loadTextures(urls: string[]){
    return Promise.resolve(urls.map(_u => new three.Texture()));
  }
  loadSprites(urls: (string | undefined)[]){
    return Promise.resolve(urls.map(_u => new three.Texture()));
  }
  loadGltf(url: string, onProgress: ((event: ProgressEvent<EventTarget>) => void) | undefined): Promise<GLTF>{
    throw new Error('Method not implemented.');
  }
}

export class TestRenderer implements IRenderer {
  camera = new three.PerspectiveCamera();
  configOrbitControls(): void {}
  setOnPreDrawListener(): void {}

  getRaycaster(): three.Raycaster {
    return new three.Raycaster();
  }

  getLoader() {
    return new TestResourceLoader();
  }

  setCameraFrom(camera: three.PerspectiveCamera){
    this.camera = camera;
  }

  getAspect() {
    return 1;
  }

  setScene(_scene: three.Scene): void {}

  getPremGen(): three.PMREMGenerator {
    return {
      fromScene(_scene, _sigma, _near, _far) {
        return new three.WebGLRenderTarget();
      },
      fromEquirectangular(_equirectangular, _renderTarget) {
        return new three.WebGLRenderTarget();
      },
      fromCubemap(_cubemap, _renderTarget) {
        return new three.WebGLRenderTarget();
      },
      compileCubemapShader() {},
      compileEquirectangularShader() {},
      dispose() {},
    };
  }
  getRenderCamera(): three.PerspectiveCamera {
    return this.camera;
  }
}

export function gltfSceneFixture({withMesh = true, withLights = true, withCameras = true, withPoi = true }) {
  const gltfScene = new three.Group();
  const gltf = gltfMockFixture(gltfScene);

  if (withMesh){
    const cube = new three.Mesh(
      new three.BoxGeometry(),
      new three.MeshStandardMaterial({ color: 0xffaaaa })
    );
    cube.name='cube';
    gltfScene.add(cube);
  }

  if (withLights) {
    gltfScene.add(new three.DirectionalLight());
  }

  if (withCameras) {
    const camera = new three.PerspectiveCamera();
    camera.name = 'camera';
    gltfScene.add(camera);
    gltf.cameras.push(camera);
  }

  if (withPoi) {
    const camera = new three.PerspectiveCamera();
    camera.name = 'lookCam';
    gltf.cameras.push(camera);
    gltfScene.add(camera);
    const empty = new three.Object3D();
    empty.name = 'poi4lookCam';
    gltfScene.add(empty);
  }
  return gltf;
}