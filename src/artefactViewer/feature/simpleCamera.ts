import { IFeature, IRenderer, ISceneManager, ISmbGltf } from '../interfaces';
import * as three from 'three';
import { Logger } from '../../simpleLog';
import { Vector3 } from 'three';

const log = new Logger('feature::camera');

/**
 * A simple camera system. Camera is initially placed to see the whole scene.
 * You can reset the rendering camera to this default one.
 */
export class SimpleCameraFeature implements IFeature {
  name = 'camera';
  // For every scene we add a default camera even if cameras are in scene.
  // This one is centered on the scene bbox.
  defaultCamera = new three.PerspectiveCamera(); // will be replaced on load
  renderer?: IRenderer;

  onSceneCreation(sceneManager: ISceneManager) {
    this.renderer = sceneManager.getRenderer();
    this.defaultCamera = this.makeDefaultCamera(this.renderer.getAspect());
    this.renderer.setCameraFrom(this.defaultCamera);
  }

  load(smbGltf: ISmbGltf) {
    if (!this.renderer) {
      log.warn('load called before onSceneCreation');
      return;
    }
    this._updateDefaultCamera(smbGltf);
    this.renderer.setCameraFrom(this.defaultCamera);
  }

  enableDebug(_debug: boolean): void {}

  preDraw(_deltaSeconds: number): void {}

  makeDefaultCamera(aspect: number) {
    const camera = new three.PerspectiveCamera(50, aspect, 0.1, 1000);

    // at distance 20, 20deg above equator, 30deg east
    const posSph = new three.Spherical(
      20,
      ((90 - 20) * Math.PI) / 180,
      (30 * Math.PI) / 180
    );
    camera.position.copy(new Vector3().setFromSpherical(posSph));
    camera.lookAt(new Vector3());
    return camera;
  }

  /** configure default camera so that the bounding cube fits into the view frustum */
  _updateDefaultCamera(smbGltf: ISmbGltf) {
    // hacky attempt to adapt to camera fov's in scene. Otherwise we get a fov induced camera jump.
    // if we find a camera in root we imitate it's fov.
    const cam = smbGltf.cameras[0];
    if (cam) {
      this.defaultCamera.fov = cam.fov;
    }

    const pos = SimpleCameraFeature.closestCameraPosition(
      this.defaultCamera.fov,
      smbGltf.boundingCubeDiagonal / 2
    );
    this.defaultCamera.position.copy(pos);
    // note we don't need to update matrices for cameras that are not rendered.
    // only the renderer's camera needs projection matrices
  }

  /** move away +z to have bounding sphere in frustum */
  static _cameraPositionOnZ(fov: number, bSphereRadius: number) {
    const zOffset = bSphereRadius / Math.sin((fov * Math.PI) / 360);
    return new Vector3(0, 0, zOffset);
  }

  /**
   * The position of a camera with the given fov that sees the whole root.
   * Positioned such that the bounding cube fits into the view frustum.
   * Camera is raise degrees above the equator and rotated azimuth degrees around the +y axis
   */
  static closestCameraPosition(
    fov: number,
    bSphereRadius: number,
    raise = 20,
    azimuth = 30
  ) {
    // camera position in polar coordinates
    const posSph = new three.Spherical(
      this._cameraPositionOnZ(fov, bSphereRadius).z,
      ((90 - raise) * Math.PI) / 180,
      (azimuth * Math.PI) / 180
    );
    const pos = new Vector3().setFromSpherical(posSph);
    return pos;
  }

  /** reset rendering camera to the default */
  selectCamera(_name: string) {
    this.renderer?.setCameraFrom(this.defaultCamera);
  }
}
