import * as three from 'three';
import { Logger } from '../simpleLog';
const log = new Logger('scene');

export function logSceneGraph(scene: three.Object3D) {
  interface IWalk {
    name: string;
    type: string;
    position: three.Vector3;
    rotation: three.Euler;
    children: IWalk[];
  }

  function walk(node: three.Object3D): IWalk {
    return {
      name: node.name,
      type: node.type,
      position: node.position,
      rotation: node.rotation,
      children: node.children.map(c => walk(c)),
    };
  }
  log.debug('current scene', walk(scene));
}

function _disposeResource(
  resource: { dispose: () => void; name: string } & object
) {
  const resType = resource.constructor.name;
  log.debug('dispose', resType, resource.name);
  resource.dispose();
}

function _disposeMaterial(mat: three.Material) {
  // generically get all textures
  const textures = Object.values(mat).filter(
    v => v instanceof three.Texture
  ) as three.Texture[];
  textures.forEach(tex => _disposeResource(tex));
  _disposeResource(mat);
}

export function disposeResourcesForTree(parent: three.Object3D) {
  // not exhaustive, will still leak gpu resources. Better than nothing.
  log.info('disposing gpu resources');
  parent.traverse(obj => {
    if (obj instanceof three.Mesh) {
      const mesh = obj as three.Mesh;
      log.debug('dispose resources linked to mesh', mesh.name);
      const mats = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];
      mats.forEach(_disposeMaterial);
      _disposeResource(mesh.geometry);
    }
    if (obj instanceof three.Sprite) {
      log.debug('dispose resources linked to sprite', obj.name);
      _disposeMaterial(obj.material);
    }
  });
}
