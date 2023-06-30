import {
  IFeature,
  IResourceLoader,
  ISceneManager,
  ISmbGltf,
} from '../interfaces';
import * as three from 'three';
import { Logger } from '../../simpleLog';

const log = new Logger('feature::sprite');

export class SpriteFeature implements IFeature {
  name = 'sprite';

  // Child of content.root, holds sprites for points of interest.
  // in root not direct in content, cause in content we have helpers we don't want to ray cast with.
  node = new three.Group(); // will be replaced
  smbGltf?: ISmbGltf;
  sprites: three.Sprite[] = []; // the current sprites for the current smbGltf.
  defaultTexture = new three.Texture(); // should be replaced

  onSceneCreation(sceneManager: ISceneManager): void {
    // initiate default sprite texture load
    // todo: this will race with load
    void this._loadDefaultSprite(sceneManager.getRenderer().getLoader());
  }

  async _loadDefaultSprite(loader: IResourceLoader) {
    const [sprite] = await loader.loadSprites(['']);
    this.defaultTexture = sprite;
  }

  load(smbGltf: ISmbGltf) {
    // spriteNode is a child of the content which we expect the caller to
    // just have cleared and disposed. so add a new one
    // TODO: dispose the previous sprite materials !
    this.smbGltf = smbGltf;
    this.sprites = [];
    this.node = new three.Group();
    this.node.name = '[spriteNode]';
    this._createSprites(smbGltf);
    smbGltf.root.add(this.node);
    return [...smbGltf.cameraToPoi.keys()];
  }

  enableDebug(_debug: boolean): void {}

  preDraw(_deltaSeconds: number): void {}

  _createSprites(smbGltf: ISmbGltf) {
    for (const [cameraName, empty] of smbGltf.cameraToPoi) {
      const material = this._createMaterial(
        smbGltf.spriteIdToTexture.get(cameraName) || this.defaultTexture
      );
      const sprite = new three.Sprite(material);
      const pos = new three.Vector3();
      // WARN fetching the content node breaks abstraction boundary.
      //      this indirectly couples us to the centering transform
      const content = smbGltf.root.parent;
      empty.localToWorld(pos);
      content?.worldToLocal(pos);
      sprite.position.copy(pos);

      // Scale sprite based on scene.
      // The sprites will behave like objects in the scene
      // As the camera zooms out they get smaller.
      // const s = this.smbGltf.boundingCubeDiagonal / 120;
      // For screen based sprites just use a constant.
      const s = 1 / 16;
      sprite.scale.set(s, s, s);
      // store the name of the empty that created the sprite
      // on the sprite's userData. Used by picking.
      sprite.userData.fromCameraNamed = cameraName;
      // by default the sprites are hidden
      sprite.visible = false;
      this.sprites.push(sprite);
      this.node.add(sprite);
    }
  }

  _createMaterial(texture: three.Texture) {
    const spriteMaterial = new three.SpriteMaterial({
      map: texture,
      sizeAttenuation: false,
    });
    // EXPERIMENTAL: Make sprites close to camera fade out.
    // Altering src/renderers/shaders/ShaderLib/sprite.glsl.js
    // It is not clear how much does three.js guarantee backwards compatibility
    // of shaders. Attenuate opacity based on fragment depth.
    // gl_FragCoord.z is not distance to camera. So it's not quite right, but good enough.
    // To do this properly we need a varying or uniform with the distance to camera in
    // the shader. Note that in a perspective transform frag z is highly non-linear so the
    // shaping functions smoothstep below are hard to control and the constants are empirically chosen.
    spriteMaterial.onBeforeCompile = function (shader) {
      shader.fragmentShader = shader.fragmentShader.replace(
        'vec4 diffuseColor = vec4( diffuse, opacity );',
        [
          'float spriteOpacityAttenuation = gl_FragCoord.z;',
          'spriteOpacityAttenuation = smoothstep( 0.4, 0.9, spriteOpacityAttenuation);',
          'vec4 diffuseColor = vec4( diffuse.rgb, opacity * spriteOpacityAttenuation );',
        ].join('\n')
      );
    };
    return spriteMaterial;
    // XXX maybe traverse the sprite node and make sure sprite.material = this.spriteMaterial?
    // in case we have a race with the load method?
    // NOTE: if you enable size attenuation see _createSprites
  }

  getInterestPointHitBy(raycaster: three.Raycaster) {
    // todo: handle per sprite visibility in raycasting
    if (this.smbGltf === undefined) {
      log.warn('getInterestPointHitBy called before load');
      return;
    }
    // go through any helpers in scene, intersect only root.
    const intersections = raycaster.intersectObject(this.smbGltf.root);
    if (intersections.length) {
      // The first intersection, the closest object is all we need
      const hit = intersections[0].object;
      log.debug('pick ray hit', hit);
      // could do it with raycaster layers instead of spriteNode check
      if (hit instanceof three.Sprite && hit.visible) {
        // three will hit it even if not visible
        const cameraName = intersections[0].object.userData
          .fromCameraNamed as string;
        return cameraName;
      }
    }
  }

  /** show all sprites in group and make them click-able.
   * Group is a string id. Except 2 special values:
   *   group = '' hides all. and group = '*' shows all.
   */
  enableSpriteGroup(group: string) {
    if (this.smbGltf === undefined) {
      log.warn('enableSpriteGroup called before load');
      return;
    }

    if (group === '*') {
      this.sprites.forEach(s => (s.visible = true));
    } else if (group === '') {
      this.sprites.forEach(s => (s.visible = false));
    } else {
      const groupPois = this.smbGltf.poiGroups.get(group);

      if (!groupPois) {
        log.warn('unknown sprite group', group);
        return;
      }

      for (const sprite of this.sprites) {
        const poiId = sprite.userData.fromCameraNamed as string;
        sprite.visible = groupPois.includes(poiId);
      }
    }
  }
}
