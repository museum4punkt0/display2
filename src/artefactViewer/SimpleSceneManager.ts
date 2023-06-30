import * as three from 'three';
import { Object3D, Group } from 'three';
import { IRenderer, ISceneManager } from './interfaces';

/** Basic implementation. Just creates the standard graph node structure */
export class SimpleSceneManager implements ISceneManager {
  renderer: IRenderer;
  scene: three.Scene;
  // The root node of the loaded gltf scene and scene-dependent dynamically created
  // nodes, like sprites and helpers.
  // This node will be .clear() -ed on gltf change, and it will be hunted by the disposed functions.
  content: Group;

  constructor(renderer: IRenderer) {
    this.renderer = renderer;
    this.content = new Group();
    this.content.name = '[contentNode]';
    this.scene = new three.Scene();
    this.scene.name = '[scene]';
    this.scene.add(this.content);
  }

  getRenderer() {
    return this.renderer;
  }

  getScene() {
    return this.scene;
  }

  addContentNode(node: Object3D) {
    this.content.add(node);
  }

  addSceneNode(node: Object3D) {
    this.scene.add(node);
  }
}
