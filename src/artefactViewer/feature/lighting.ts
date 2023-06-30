import { IFeature, IRenderer, ISceneManager, ISmbGltf } from '../interfaces';
import * as three from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Logger } from '../../simpleLog';

const log = new Logger('feature::lighting');

export interface ILightingInfo {
  lights: three.Light[];
  environments: string[];
}

export class LightingFeature implements IFeature {
  name = 'lighting';
  clearColor: three.ColorRepresentation;
  envTextureNames: [string, string][];

  envMaps: three.Texture[] = [];

  // the parent node of default lights
  node: three.Group;

  // current scene if created
  scene?: three.Scene;

  // keep the selected one in case the textures are loading and we have to set it delayed
  _selectedEnvironment = '';

  constructor(
    envTextureNames: [string, string][] = [],
    clearColor: three.ColorRepresentation = 'hsl(240, 27%, 12%)'
  ) {
    this.node = new three.Group();
    this.node.name = '[defaultLights]';
    this._buildLights();
    this.envTextureNames = envTextureNames;
    this.clearColor = clearColor;
  }

  _buildLights() {
    // these lights point at the default target, the origin.
    let light = new three.DirectionalLight('#ffffff', 1.0);
    light.position.set(-0.2, 2, 1);
    light.name = '[keyLight]';
    this.node.add(light);

    light = new three.DirectionalLight('#ffffff', 0.5);
    light.position.set(1, 2, 0.5);
    light.name = '[fillLight]';
    this.node.add(light);
  }

  async _buildEnvironment(renderer: IRenderer) {
    // load env textures in parallel
    const texUrls = this.envTextureNames.map(([_name, url]) => url);
    const textures = await renderer.getLoader().loadTextures(texUrls);
    // create the envmaps
    for (let i = 0; i < this.envTextureNames.length; i++) {
      const tex = textures[i];
      // tex.colorSpace = three.SRGBColorSpace;
      const envmap = renderer.getPremGen().fromEquirectangular(tex).texture;
      envmap.name = this.envTextureNames[i][0];
      this.envMaps.push(envmap);
    }
    this.selectEnvironment(this._selectedEnvironment);
  }

  _enableShadowCasters(parent: three.Object3D) {
    // we are a bit greedy here , making all lights and meshes shadow.
    parent.traverse(obj => {
      if (
        obj instanceof three.DirectionalLight ||
        obj instanceof three.SpotLight
      ) {
        obj.castShadow = true;
        // obj.shadow.camera.near = ?
        // obj.shadow.camera.far = ?
        obj.shadow.bias = -0.01;
      } else if (obj instanceof three.Mesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
  }

  onSceneCreation(sceneManager: ISceneManager): void {
    this.scene = sceneManager.getScene();
    const renderer = sceneManager.getRenderer();
    // sets the env map for pbr shader
    const envmap = renderer
      .getPremGen()
      .fromScene(new RoomEnvironment()).texture;
    envmap.name = 'default';
    this.envMaps.push(envmap);
    void this._buildEnvironment(renderer);

    sceneManager.addSceneNode(this.node);
  }

  /** Enables a global environment map. Essential for nice looking pbr materials.
   * But if point lights are present it might overexpose the scene */
  selectEnvironment(name = '') {
    if (!this.scene) {
      log.warn('cannot select environment before scene load');
      return;
    }
    this._selectedEnvironment = name;
    const tex = this.envMaps.find(tex => tex.name === name);
    if (tex) {
      this.scene.background = tex;
      this.scene.environment = tex;
    } else {
      // if we can't find the env named or name is '' then no env map
      this.scene.environment = null;
      this.scene.background = new three.Color(this.clearColor);
    }
    this.scene.backgroundBlurriness = 0.1;
  }

  load(smbGltf: ISmbGltf): ILightingInfo {
    const lights = smbGltf.root.getObjectsByProperty('isLight', true);
    // if the scene has lights hide the default ones
    this.node.visible = lights.length === 0;
    this._enableShadowCasters(smbGltf.root);

    return {
      environments: ['', ...this.envMaps.map(tex => tex.name)],
      lights: lights as three.Light[],
    };
  }

  enableDebug(debug: boolean): void {
    const fillLight = this.node.getObjectByName('[fillLight]') as
      | three.Light
      | undefined;

    if (fillLight) {
      // make fill light pink in debug to indicate that default lights are used
      fillLight.color.set(debug ? '#ff00ff' : '#ffffff');
    }
  }

  preDraw(_deltaSeconds: number): void {}
}
