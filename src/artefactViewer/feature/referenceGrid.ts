import { IFeature, ISceneManager, ISmbGltf } from '../interfaces';
import * as three from 'three';

/** Shows grid, axes and bounding sphere in debug mode. No effect outside debug */
export class ReferenceGridFeature implements IFeature {
  name = 'ReferenceGrid';
  // the default scene. Direct child of scene. In world space.
  node = new three.Group();
  // Child of content, dynamic helpers like the bounding sphere, the grid and axes are in the defaultNode.
  helpersDebugNode = new three.Group(); // will be replaced
  sceneManager?: ISceneManager;

  constructor() {
    this._buildNode();
    this.node.visible = false;
    this.node.name = '[defaultNode]';
  }

  onSceneCreation(sceneManager: ISceneManager) {
    this.sceneManager = sceneManager;
    sceneManager.addSceneNode(this.node);
  }

  load(smbGltf: ISmbGltf) {
    if (!this.sceneManager) {
      return;
    }
    this.helpersDebugNode = this._makeHelpers(smbGltf);
    this.helpersDebugNode.visible = false;
    this.sceneManager.addContentNode(this.helpersDebugNode);
  }

  enableDebug(debug: boolean): void {
    this.node.visible = debug;
    this.helpersDebugNode.visible = debug;
  }

  preDraw(_deltaSeconds: number) {}

  _buildNode() {
    const axes = new three.AxesHelper(40);
    axes.name = '[axes]';
    this.node.add(axes);

    // one division is 1 meter
    const grid = new three.GridHelper(40, 40);
    grid.position.y -= 0.001;
    grid.name = '[grid]';
    this.node.add(grid);
  }

  _makeHelpers(smbGltf: ISmbGltf) {
    const helpersNode = new three.Group();
    helpersNode.name = '[helpersNode]';
    const boundingSphereGeom = new three.SphereGeometry(
      smbGltf.boundingCubeDiagonal / 2
    );
    const boundingSphereHelper = new three.Mesh(
      boundingSphereGeom,
      new three.MeshStandardMaterial({ wireframe: true, color: 0xff22ff })
    );
    boundingSphereHelper.position.copy(smbGltf.center);
    helpersNode.add(boundingSphereHelper);
    return helpersNode;
  }
}
