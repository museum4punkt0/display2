import { Object3D } from 'three';
import * as three from 'three';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { Logger } from '../simpleLog';

const log = new Logger('KHRMaterialsVariantsParser');

export type KHRMeshVariantMappings = Array<{
  material: number;
  variants: number[];
}>;

/**
 * See: https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_variants
 * Adapted from https://github.com/mrdoob/three.js/blob/master/examples/webgl_loader_gltf_variants.html
 */
export class KHRMaterialsVariantsParser {
  variants: string[] = [];
  meshMappings: Array<[three.Mesh, KHRMeshVariantMappings]> = [];
  gltf: GLTF;

  constructor(gltf: GLTF) {
    this.gltf = gltf;

    type HeaderType = { variants: Array<{ name: string }> | undefined }; // dubious, here to make the linter happier
    const header = this._extensionBlock(gltf) as HeaderType | undefined;
    const variants = header?.variants;
    if (variants) {
      this.variants = variants.map(v => v.name);
      this._findMeshesWithExtensionUserData(gltf.scene);
      log.info('variants', this.variants);
      log.debug('meshMappings', this.meshMappings);
    } else {
      log.info('no KHR_materials_variants');
    }
  }

  /** The data associated by this extension with the obj */
  _extensionBlock(obj: { userData: any }): unknown {
    return obj.userData.gltfExtensions?.KHR_materials_variants;
  }

  /** return meshes that have KHR_materials_variants data */
  _findMeshesWithExtensionUserData(scene: Object3D) {
    scene.traverse(object => {
      if (!(object instanceof three.Mesh)) {
        return;
      }
      type MeshBlockType = { mappings: KHRMeshVariantMappings | undefined }; // dubious, here to make the linter happier
      const block = this._extensionBlock(object) as MeshBlockType | undefined;
      if (!(block && block.mappings)) {
        return;
      }
      this.meshMappings.push([object as three.Mesh, block.mappings]);
    });
  }

  _getVariantMaterialForMesh(variantName: string, mesh: three.Mesh) {
    const variantIndex = this.variants.indexOf(variantName);
    const meshMapping = this.meshMappings.find(m => m[0] === mesh);
    if (variantIndex === -1 || meshMapping === undefined) {
      return undefined;
    }
    const mappings = meshMapping[1];

    const mapping = mappings.find(m => m.variants.includes(variantIndex));
    return mapping?.material;
  }

  async selectVariant(variantName: string) {
    log.info('selecting variant', variantName);

    for (const [mesh, _] of this.meshMappings) {
      const maybeMatId = this._getVariantMaterialForMesh(variantName, mesh);

      // on first call remember the original material on the mesh
      if (!mesh.userData.originalMaterial) {
        mesh.userData.originalMaterial = mesh.material;
      }
      if (maybeMatId !== undefined) {
        // get the actual material referenced by this id
        // this undocumented api is needed because only the gltf parser knows
        // the mapping between the three materials it created and the material id's in the gltf file
        mesh.material = (await this.gltf.parser.getDependency(
          'material',
          maybeMatId
        )) as three.Material;
        // it seems that changing the material on mesh is not enough and we need this
        this.gltf.parser.assignFinalMaterial(mesh);
      } else {
        // variantName is not a variant. return to the original variant.
        if (!(mesh.userData.originalMaterial instanceof three.Material)) {
          log.warn('originalMaterial not a Material');
          return;
        }
        mesh.material = mesh.userData.originalMaterial;
      }
    }
  }
}
