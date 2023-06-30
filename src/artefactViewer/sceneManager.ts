import * as three from 'three';
import { SceneParser } from './sceneParser';
import { IFeature, IRenderer } from './interfaces';
import { Logger } from '../simpleLog';
import { disposeResourcesForTree, logSceneGraph } from './sceneUtils';
import {
  LightingFeature,
  ModelAnimationFeature,
  ReferenceGridFeature,
  SpriteFeature,
  CameraFeature,
} from './feature';
import { SimpleSceneManager } from './SimpleSceneManager';

const log = new Logger('SceneManager');

export class SceneManagerLoadInfo {
  interestPointNames: string[] = [];
  materialVariants: string[] = [];
  animationTrackNames: string[] = [];
  cameras: string[] = [];
  environments: string[] = [];
}

export interface ISceneManagerAssets {
  sprite: string;
  envTextures: [string, string][];
}
export const DEFAULT_ASSETS = { sprite: 'missing.png', envTextures: [] };

/**
 * Coordinates interaction between features.
 */
export class SceneManager extends SimpleSceneManager {
  sceneParser: SceneParser;
  debug = false; // upgrade to some debug_settings show_empties, show_wireframe, show_light_helpers etc
  lighting: LightingFeature;
  modelAnimation: ModelAnimationFeature;
  sprites: SpriteFeature;
  refGrid: ReferenceGridFeature;
  cameraFeature: CameraFeature;
  features: IFeature[];

  constructor(
    renderer: IRenderer,
    assets: ISceneManagerAssets = DEFAULT_ASSETS
  ) {
    super(renderer);
    this.sceneParser = new SceneParser();

    this.lighting = new LightingFeature(assets.envTextures);

    this.modelAnimation = new ModelAnimationFeature();
    this.sprites = new SpriteFeature();
    this.refGrid = new ReferenceGridFeature();
    this.cameraFeature = new CameraFeature();
    this.features = [
      this.lighting,
      this.modelAnimation,
      this.sprites,
      this.refGrid,
      this.cameraFeature,
    ];

    for (const feat of this.features) {
      feat.onSceneCreation(this);
    }

    this.renderer.setScene(this.scene);
    // subscribe to get _onPreDraw called before every draw call
    // needed for when we have to change the scene itself for every frame
    // like with three.js animations
    this.renderer.setOnPreDrawListener(this.preDraw.bind(this));
    log.info('init');
  }

  preDraw(deltaMs: number, _renderingCamera: three.PerspectiveCamera) {
    this.modelAnimation.preDraw(deltaMs / 1000);
    this.cameraFeature.preDraw(deltaMs / 1000);
  }

  // skip centering is temporary, for debugging camera issues
  load(smbGltf: SceneParser | null, center = true): SceneManagerLoadInfo {
    const loadInfo = new SceneManagerLoadInfo();

    disposeResourcesForTree(this.content);
    this.content.clear();
    this.content.position.set(0, 0, 0);
    this.content.rotation.set(0, 0, 0);

    if (smbGltf == null) {
      return loadInfo;
    }

    this.sceneParser = smbGltf;
    if (center) {
      this.content.position.sub(this.sceneParser.center);
    }

    this.sceneParser.root.name = '[gltfRoot]';
    this.content.add(this.sceneParser.root);

    if (this.sceneParser.khrMaterialVariantsParser?.variants.length) {
      loadInfo.materialVariants = [
        '',
        ...this.sceneParser.khrMaterialVariantsParser.variants,
      ];
    }

    const lightingInfo = this.lighting.load(this.sceneParser);
    loadInfo.environments = lightingInfo.environments;
    loadInfo.interestPointNames = this.sprites.load(this.sceneParser);
    loadInfo.animationTrackNames = this.modelAnimation.load(this.sceneParser);
    loadInfo.cameras = this.cameraFeature.load(this.sceneParser);
    this.refGrid.load(this.sceneParser);

    this.enableDebug(this.debug);
    // the upper limit is fine, the lower one will allow you to clip badly
    // but reasonable 'close up' cameras are close.
    // Could iterate cameras and get a range from them.
    this.renderer.configOrbitControls({
      minDistance: (this.sceneParser.boundingCubeDiagonal / 2) * 0.05,
      maxDistance: (this.sceneParser.boundingCubeDiagonal / 2) * 10,
      maxPolarAngle: Math.PI,
      target: new three.Vector3(),
      enabled: true,
    });

    return loadInfo;
  }

  dispose() {
    disposeResourcesForTree(this.scene);
  }

  /** Play the animations named. If empty will stop all animations. */
  playAnimations(animationNames: string[]) {
    this.modelAnimation.playAnimations(animationNames);
  }

  /**
   * Resets the camera to the named one.
   * The empty string resets to the default generated one.
   * Bad names do nothing.
   */
  selectCamera(name: string) {
    this.cameraFeature.selectCamera(name);
  }

  async selectMaterialVariant(variant: string) {
    if (this.sceneParser.khrMaterialVariantsParser?.variants.length) {
      await this.sceneParser.khrMaterialVariantsParser.selectVariant(variant);
    }
  }

  /**
   * Gets the interest points hit by the given raycaster.
   * To get an appropriate raycaster use the associated Renderer instance.
   */
  getInterestPointHitBy(raycaster: three.Raycaster) {
    return this.sprites.getInterestPointHitBy(raycaster);
  }

  enableDebug(debug: boolean) {
    this.debug = debug;

    for (const feat of this.features) {
      feat.enableDebug(debug);
    }
    // show it if content is empty. keep it as an indicator of empty scene
    this.refGrid.node.visible = debug || this.content.children.length === 0;

    if (this.debug) {
      logSceneGraph(this.scene);
    }
  }

  /** Enables a global environment map. Essential for nice looking pbr materials.
   * But if point lights are present it might overexpose the scene */
  selectEnvironment(name = '') {
    this.lighting.selectEnvironment(name);
  }

  /** show all sprites in group and make them click-able.
   * Group is a string id. Except 2 special values:
   *   group = '' hides all. and group = '*' shows all. */
  enableSpriteGroup(group: string) {
    this.sprites.enableSpriteGroup(group);
  }

  /** Called async when camera motion is done. */
  onCameraMotionDone(callback: (cameraId: string) => void) {
    // shedule it immediatly. Don't call it sync as we don't want to block the rendering loop.
    this.cameraFeature.onCameraMotionFinished = (cameraId: string) => {
      setTimeout(() => callback(cameraId));
    };
  }
}
