import * as three from 'three';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

export interface ISmbGltf {
  lights: three.Light[];
  cameras: three.PerspectiveCamera[];
  boundingCubeDiagonal: number;
  center: three.Vector3;
  root: three.Group;
  // feature specific data. maybe should live on feature not parser?
  // consider retiring the parser idea in favor of feature specific parsing.
  cameraToPoi: Map<string, three.Object3D>;
  // used to toggle groups of sprites visibility
  // chapter id => cameras/pois in group
  poiGroups: Map<string, string[]>;
  // note that sprites are identified by the associated camera name
  spriteIdToTexture: Map<string, three.Texture>;
  animations: Map<string, three.AnimationClip | undefined>;
}

export type RendererPreDrawCallBack = (
  delta: number,
  renderingCamera: three.PerspectiveCamera
) => void;

// here to decouple from react
export interface IRenderPointerEvent {
  clientX: number;
  clientY: number;
}

export interface IResourceLoader {
  loadTexture(relativeUrl: string): Promise<three.Texture>;
  loadTextures(urls: string[]): Promise<three.Texture[]>;
  loadSprites(urls: (string | undefined)[]): Promise<three.Texture[]>;
  loadGltf(
    url: string,
    onProgress: ((event: ProgressEvent<EventTarget>) => void) | undefined
  ): Promise<GLTF>;
}

/** Parts of the WebGlRenderer needed by the SceneManager. */
export interface IRenderer {
  setCameraFrom(camera: three.PerspectiveCamera): void;
  getAspect(): number;
  setScene(scene: three.Scene): void;
  getPremGen(): three.PMREMGenerator;
  getLoader(): IResourceLoader;
  getRaycaster(event: IRenderPointerEvent): three.Raycaster;
  setOnPreDrawListener(callback: RendererPreDrawCallBack): void;
  getRenderCamera(): three.PerspectiveCamera;
  configOrbitControls({
    target,
    minDistance,
    maxDistance,
    maxPolarAngle,
    enabled,
  }: {
    target?: three.Vector3;
    minDistance?: number;
    maxDistance?: number;
    maxPolarAngle?: number;
    enabled?: boolean;
  }): void;
}

export interface ISceneManager {
  getRenderer(): IRenderer;
  getScene(): three.Scene;
  addContentNode(node: three.Object3D): void;
  addSceneNode(node: three.Object3D): void;
}

export interface IFeature {
  name: string;
  // called after scene creation. Happens once in lifetime of object.
  onSceneCreation(sceneManager: ISceneManager): void;
  // called when new model is loaded
  load(smbGltf: ISmbGltf): unknown;
  enableDebug(debug: boolean): void;
  // called every frame
  preDraw(deltaSeconds: number): void;
}
