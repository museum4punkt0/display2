import * as three from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { AnimationLoop } from './animationLoop';
import { Logger } from '../simpleLog';
import {
  IRenderPointerEvent,
  IRenderer,
  RendererPreDrawCallBack,
} from './interfaces';
import { ResourceLoader } from './resourceLoader';

const log = new Logger('Renderer');

// VERY GLOBAL configuration.
// cache textures and files.
three.Cache.enabled = true;
// automatically do linear sRGB conversions when possible
three.ColorManagement.enabled = true;

// try to have this be the only point we update the projection matrix
// because of aspect ratio of the viewport

/**
 * Interacts with the 3d context and the canvas element.
 * Should be the only one doing these.
 * Handles resizes (needs canvas el size), issues draw calls (talking to gpu)
 *
 * NOTE: as a user facing api this is a bad one:
 * Usage: make one to give to the SceneManager and to start and stop rendering loop.
 */
export class Renderer implements IRenderer {
  renderer: three.WebGLRenderer;
  // used to create environment maps that are needed by image based lighting
  pmremGenerator: three.PMREMGenerator;

  // The picture on the screen is from this camera's eyes
  camera: three.PerspectiveCamera;

  orbitControls: OrbitControls;

  loop: AnimationLoop;
  scene: three.Scene;
  resourceLoader: ResourceLoader;

  _onPreDraw(_delta: number, _renderingCamera: three.PerspectiveCamera) {}

  constructor(canvas: HTMLCanvasElement, baseResourceUrl = '') {
    this.renderer = new three.WebGLRenderer({
      canvas,
      antialias: true,
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    // these are *essential* for correct color output!
    this.renderer.outputEncoding = three.sRGBEncoding;
    this.renderer.useLegacyLights = false;
    // these are nice
    this.renderer.toneMapping = three.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    // end renderer color config

    this.loop = new AnimationLoop(this.draw.bind(this));

    this.renderer.setClearColor(0xbababa);

    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

    // meant to be configured later
    this.camera = new three.PerspectiveCamera();
    this.camera.name = '[renderCamera]';

    this.orbitControls = new OrbitControls(
      this.camera,
      this.renderer.domElement
    );

    this.configOrbitControls({});

    // PBR stuff
    this.pmremGenerator = new three.PMREMGenerator(this.renderer);
    this.pmremGenerator.compileEquirectangularShader();

    this.renderer.shadowMap.enabled = true;
    // this.renderer.shadowMap.type = three.PCFSoftShadowMap;

    // NOTE: meant to be configured later. Do NOT do anything with it here except draw.
    // we might move this property on the animationLoop
    this.scene = new three.Scene();
    this.resourceLoader = new ResourceLoader(baseResourceUrl);
    log.info('initialized');
  }

  _syncWithResize() {
    // relies on having an active animation loop. no need to respond to resize events
    const canvas = this.renderer.domElement;
    let [w, h] = [canvas.clientWidth, canvas.clientHeight];
    // if diff is larger than one pixel
    // Sometimes browser does a weird re-layout cascade.
    // On setting the canvas width to it's clientWidth will increase the clientWith by a pixel
    // That would lead to us incrementing width again and a unbound increase in size
    const deltaWidth = canvas.width - w;
    const deltaHeight = canvas.height - h;

    const needsResize = Math.abs(deltaWidth) > 8 || Math.abs(deltaHeight) > 8;

    if (!needsResize) {
      return;
    }

    // guard against huge sizes, they will allocate huge gpu buffers
    if (w > 4000 || h > 4000 || w < 2 || h < 2) {
      log.warn('resize out of bounds w,h=', w, h);
      [w, h] = [100, 100];
    }

    log.log({
      'canvas w/h ': [canvas.width, canvas.height],
      'client w/h': [w, h],
      'delta w/h': [deltaWidth, deltaHeight],
    });

    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // Because we touched it's parameters and this camera is actually used by rendering.
    this.camera.updateProjectionMatrix();
  }

  /** Call this before you remove the canvas. Frees the gpu resources. */
  dispose() {
    log.info('disposed');
    this.orbitControls.dispose();
    this.renderer.dispose();
  }

  _ensureCanvasAttached() {
    const canvas = this.renderer.domElement;
    if (!canvas.isConnected) {
      log.error(
        'Canvas is detached from dom. Shuting down render. Other resources will leak. You need to dispose properly before removing from dom.'
      );
      this.loop.stop();
      this.dispose();
      return false;
    }
    return true;
  }

  /** Call to draw the scene if you just want a frame and the loop is stopped */
  draw(t: number, delta: number) {
    if (!this._ensureCanvasAttached()) {
      return;
    }
    this._syncWithResize();
    this._onPreDraw(delta, this.camera);
    this.renderer.render(this.scene, this.camera);
  }

  /** Aspect ratio of the canvas */
  getAspect() {
    const size = this.renderer.getSize(new three.Vector2());
    return size.width / size.height;
  }

  /** copy the given camera settings to the unique rendering one */
  setCameraFrom(camera: three.PerspectiveCamera) {
    if (
      this.camera.parent &&
      !this.camera.parent.matrixWorld.equals(new three.Matrix4().identity())
    ) {
      log.error('Assumption that render camera is in world space is broken');
    }

    this.camera.copy(camera);
    this.camera.name = '[renderCamera]'; // it copied the name too ..
    // Move source camera in the same space as this.camera
    // Assumes this.camera is in word space. So all it's parents should have id matrices
    // no need to updateWorldMatrix for parents, these 2 do it for us.
    camera.getWorldPosition(this.camera.position);
    camera.getWorldQuaternion(this.camera.quaternion);
    // Adapt camera to the view aspect.
    this.camera.aspect = this.getAspect();
    this.camera.updateProjectionMatrix();

    log.debug('camera before orbitcontrols update', {
      pos: camera.position,
      rot: camera.rotation,
    });
    this.orbitControls.update();
    log.debug('camera after orbitcontrols update', {
      pos: this.camera.position,
      rot: this.camera.rotation,
    });
  }

  /**
   * Give a reference to the scene to the renderer to draw.
   * The renderer will not mutate it or do anything else but draw it.
   */
  setScene(scene: three.Scene) {
    this.scene = scene;
  }

  getPremGen() {
    return this.pmremGenerator;
  }

  getLoader() {
    return this.resourceLoader;
  }

  /** calculate pointer position in normalized device coordinates */
  pointerToNDC(event: IRenderPointerEvent) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const pointer = new three.Vector2();
    // (-1 to +1) for both components
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    return pointer;
  }

  /**
   * A Raycaster from the given click location un-projected
   * from the current camera's perspective
   */
  getRaycaster(event: IRenderPointerEvent) {
    const ndcCoords = this.pointerToNDC(event);
    const caster = new three.Raycaster();
    caster.setFromCamera(ndcCoords, this.camera);
    return caster;
  }

  setOnPreDrawListener(callback: RendererPreDrawCallBack) {
    this._onPreDraw = callback;
  }

  getRenderCamera() {
    return this.camera;
  }

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
  }) {
    if (target !== undefined) this.orbitControls.target.copy(target);
    if (maxDistance !== undefined) this.orbitControls.maxDistance = maxDistance;
    if (minDistance !== undefined) this.orbitControls.minDistance = minDistance;
    if (maxPolarAngle !== undefined) {
      this.orbitControls.maxPolarAngle = maxPolarAngle;
    }
    if (enabled !== undefined) this.orbitControls.enabled = enabled;
    this.orbitControls.enablePan = false;
  }

  // todo: consider moving these to the lighting feature despite their tight coupling to the renderer
  setExposure(to: number) {
    this.renderer.toneMappingExposure = three.MathUtils.clamp(to, 0, 1.5);
  }

  /** this is not cheap, it will recompile the shaders and all */
  enableShadows(enabled: boolean) {
    this.renderer.shadowMap.enabled = enabled;
    this.scene.traverse(obj => {
      if (obj instanceof three.Mesh) {
        (
          obj as three.Mesh<three.BufferGeometry, three.Material>
        ).material.needsUpdate = true;
      }
    });
  }

  logStats() {
    log.debug('render stats');
    log.debug('  memory  : ', this.renderer.info.memory);
    log.debug('  programs: ', this.renderer.info.programs);
    log.debug('  render: ', this.renderer.info.render);
  }
}
