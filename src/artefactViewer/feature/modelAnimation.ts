import { Logger } from '../../simpleLog';
import { IFeature, ISceneManager, ISmbGltf } from '../interfaces';
import * as three from 'three';

const log = new Logger('feature::animation');

export class ModelAnimationFeature implements IFeature {
  name = 'animation';
  animationMixer?: three.AnimationMixer;
  animations: Map<string, three.AnimationClip | undefined> = new Map();

  onSceneCreation(_sceneManager: ISceneManager): void {}

  load(smbGltf: ISmbGltf) {
    this.animationMixer?.stopAllAction();
    this.animationMixer = new three.AnimationMixer(smbGltf.root);
    this.animations = smbGltf.animations;
    return [...smbGltf.animations.keys()];
  }

  enableDebug(_debug: boolean): void {}

  preDraw(deltaSeconds: number): void {
    if (this.animationMixer) {
      this.animationMixer.update(deltaSeconds);
    }
  }

  _getClipsNamed(animationNames: string[]) {
    const clipsToPlay = [];

    for (const name of animationNames) {
      const clip = this.animations.get(name);
      if (clip !== undefined) {
        clipsToPlay.push(clip);
      } else {
        log.warn(`clip ${name} does not exist`);
      }
    }
    return clipsToPlay;
  }

  /** Play the animations named. If empty will stop all animations. */
  playAnimations(animationNames: string[]) {
    if (this.animationMixer === undefined) {
      log.warn('requested to play an animation before loading a model');
      return;
    }
    // note if we need a pause method, do it by this.animationMixer.timeScale = 0
    this.animationMixer.stopAllAction();

    for (const clip of this._getClipsNamed(animationNames)) {
      this.animationMixer.clipAction(clip).play();
    }
  }
}
