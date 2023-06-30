/**
 * The module implements the specific subset of the scenegraph format we use.
 *
 * For example we have a notion, not present in gltf or three,
 * of a default camera centered on the mesh bbox.
 * We might interpret some empty nodes, or cameras as points of interest.
 *
 * This module should only operate on scenegraphs it creates
 * not with the current displayed scene.
 * code that does not need to interact with the current displayed scene
 */

import { Object3D, Vector3, Box3 } from 'three';
import * as three from 'three';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { Logger } from '../simpleLog';
import { ISmbGltf } from './interfaces';
import { KHRMaterialsVariantsParser } from './KHRMaterialsVariantsParser';

const log = new Logger('Parser');

/** return center and diagonal of bounding cube */
export function getBoundingCube(node: Object3D): [Vector3, number] {
  const box = new Box3().setFromObject(node);
  // diagonal size
  const size = box.getSize(new Vector3()).length();
  const center = box.getCenter(new Vector3());
  return [center, size];
}

/**
 * Parse loaded scene for points of interest and other custom
 * semantics we lay on top of the gltf format
 */
export class SceneParser implements ISmbGltf {
  // TODO: rename this to a SmbGltf, it contains a representation not much parsing state
  lights: three.Light[] = [];
  center = new three.Vector3();
  boundingCubeDiagonal = 0;
  root = new three.Group();
  // from camera name to point of interest
  cameraToPoi: Map<string, Object3D> = new Map();
  // from sprite id (camera name) to texture url
  spriteIdToTexture: Map<string, three.Texture> = new Map();
  khrMaterialVariantsParser?: KHRMaterialsVariantsParser;
  // map from animation clip name to the clip. Assumes names are unique
  animations: Map<string, three.AnimationClip | undefined> = new Map();
  cameras: three.PerspectiveCamera[] = [];
  POI_PREFIX = 'poi4';
  // used to toggle groups of sprites visibility
  // chapter id => cameras/pois in group
  poiGroups: Map<string, string[]> = new Map();

  /** find empties representing points of interest and their associated cameras */
  _parsePointsOfInterest() {
    // can only be a poi if empty and named
    const namedEmpties: Object3D[] = [];

    this.root.traverse(c => {
      const isEmpty = c.type === 'Object3D' && c.children.length === 0;
      if (isEmpty && c.name !== '') {
        namedEmpties.push(c);
      }
    });
    log.info(namedEmpties);

    namedEmpties.forEach(c => {
      const parentIsCamera = c.parent instanceof three.Camera;
      const specialName = c.name.startsWith(this.POI_PREFIX);

      if (parentIsCamera) {
        // direct parent is a camera we take it as the poi's camera
        this.cameraToPoi.set(c.parent!.name, c); // it's instanceof Camera typescript!, linter shush, I like naming my conditions, I won't inline parentIsCamera out of spite now
      } else if (specialName) {
        // else find a camera named c.name without the poi4 prefix
        const camName = c.name.slice('poi4'.length);
        const foundCamera = this.cameras.some(c => c.name === camName);
        if (foundCamera) {
          this.cameraToPoi.set(camName, c);
        } else {
          log.warn('no camera found for possible poi', c.name);
        }
      } // else this empty is not a poi
    });
  }

  _parseFrom(gltf: GLTF) {
    this.root = gltf.scene;
    this.lights = this.root.getObjectsByProperty(
      'isLight',
      true
    ) as three.Light[];
    [this.center, this.boundingCubeDiagonal] = getBoundingCube(this.root);

    this.khrMaterialVariantsParser = new KHRMaterialsVariantsParser(gltf);

    for (const an of gltf.animations) {
      this.animations.set(an.name, an);
    }

    // we don't support other camera types.
    this.cameras = gltf.cameras.filter(
      cam => cam instanceof three.PerspectiveCamera
    ) as three.PerspectiveCamera[];

    const fovs = this.cameras.map(cam => cam.fov);
    if (fovs.length) {
      if (!fovs.every(f => f === fovs[0])) {
        log.warn(
          'imported cameras do not have the same field of view. This will cause navigation jumps'
        );
      }
    }

    this._parsePointsOfInterest();
  }

  static parse(
    gltf: GLTF,
    spriteIdToTexture?: Map<string, three.Texture>,
    poiGroups?: Map<string, string[]>
  ) {
    const ret = new SceneParser();
    ret._parseFrom(gltf);
    if (spriteIdToTexture) {
      ret.spriteIdToTexture = spriteIdToTexture;
    }
    if (poiGroups) {
      ret.poiGroups = poiGroups;
    }
    return ret;
  }
}
