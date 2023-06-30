import { ISceneManager, ISmbGltf } from '../interfaces';
import * as three from 'three';
import { Logger } from '../../simpleLog';
import { MotionTrack } from './motion';
import { createMotionTrack } from './sphereMotion';
import { SimpleCameraFeature } from './simpleCamera';

const log = new Logger('feature::camera');

export class CameraFeature extends SimpleCameraFeature {
  name = 'camera';
  // We need to special case camera helpers because they must be children of the scene. see three.js docs.
  // At least we can group them if we keep this node's matrix 1.
  debugNode = new three.Group();
  // the render camera is tracked by the orbitcontrols.
  // while the we have a concept of a current selected camera.
  selectedCamera = this.defaultCamera; // will be replaced
  // used to view camera motion from third person perspective
  _debugCamera = new three.PerspectiveCamera();
  _debug = false;

  motionTrack?: MotionTrack;
  duration = 3;
  smbGltf?: ISmbGltf;

  /** Called sync with draw tick, when camera motion is done.
   * Intended to be overwritten by client.
   * @param cameraId the current selected camera id.
   * Upgrade to a proper eventlistener / observer api if you need more listeners */
  onCameraMotionFinished(cameraId: string) {}

  constructor() {
    super();
    this.debugNode.name = '[cameraHelpersNode]';
    this.debugNode.visible = false;
    this._debugCamera.name = '[debugMotionCamera]';
    this._debugCamera.fov = 6; // small so we can pinpoint where it's looking
    this._debugCamera.updateProjectionMatrix();
  }

  onSceneCreation(sceneManager: ISceneManager) {
    this.renderer = sceneManager.getRenderer();
    this.defaultCamera = this.makeDefaultCamera(this.renderer.getAspect());
    this.selectedCamera = this.defaultCamera;
    this._updateDebugCamera(this.selectedCamera);
    this.renderer.setCameraFrom(this.selectedCamera);
    sceneManager.addSceneNode(this.debugNode);
  }

  load(smbGltf: ISmbGltf) {
    if (!this.renderer) {
      log.warn('load called before onSceneCreation');
      return [];
    }
    this.smbGltf = smbGltf;
    this._updateDefaultCamera(smbGltf);
    this.selectedCamera = this.defaultCamera;
    this.renderer.setCameraFrom(this.selectedCamera);
    // CameraHelper must be a child of the scene see docs.
    // So these helpers are a special case...
    // we clear, because we don't expect the caller to do so.
    this.debugNode.clear();
    this._makeCameraHelpers(smbGltf, true);

    this.motionTrack?.stop();

    return ['', ...smbGltf.cameras.map(c => c.name)];
  }

  enableDebug(debug: boolean) {
    this._debug = debug;
    this.debugNode.visible = debug;
  }

  preDraw(deltaSeconds: number) {
    if (this.motionTrack) {
      this.motionTrack.update(deltaSeconds);
    }
  }

  _updateDebugCamera(camFrom: three.Object3D) {
    this._debugCamera.position.copy(camFrom.position);
    this._debugCamera.quaternion.copy(camFrom.quaternion);
  }

  _makeCameraHelpers(smbGltf: ISmbGltf, showAllCameraHelpers = false) {
    if (showAllCameraHelpers) {
      smbGltf.cameras.forEach(cam => {
        const helper = new three.CameraHelper(cam);
        this.debugNode.add(helper);
      });
    }

    this.debugNode.add(this._debugCamera); // needed for camerahelper
    const debugCamHelper = new three.CameraHelper(this._debugCamera);
    debugCamHelper.name = '[debugCameraHelper]';

    debugCamHelper.setColors(
      new three.Color(0x0faabb),
      new three.Color(0xff00bb),
      new three.Color(0x00aaff),
      new three.Color(0xffffff),
      new three.Color(0x333333)
    );
    this.debugNode.add(debugCamHelper);
  }

  /**
   * Resets the camera to the named one.
   * The empty string resets to the default generated one.
   * Bad names do nothing.
   */
  selectCamera(name: string) {
    if (!this.renderer) {
      log.warn('selectCamera called before onSceneCreation');
      return;
    }
    if (!this.smbGltf) {
      log.warn('selectCamera called before load');
      return;
    }

    let camera: three.PerspectiveCamera;
    if (name === '') {
      camera = this.defaultCamera;
    } else {
      const maybeCamera = this.smbGltf.cameras.find(c => c.name === name);
      if (maybeCamera === undefined) {
        log.warn('no camera named', name);
        return;
      }
      camera = maybeCamera;
    }
    if (this._debug) {
      this._startCameraMotion(this.selectedCamera, camera);
    } else {
      // FIXME: does this race with the setCamera below? This targets the current renderCamera. But then we just update that below!
      this._startCameraMotion(this.renderer.getRenderCamera(), camera);
    }
    this.selectedCamera = camera;
    // skip setting the render camera in debug mode: want to see the test one move
    if (!this._debug) {
      this.renderer.setCameraFrom(this.selectedCamera);
    }
  }

  _startCameraMotion(camFrom: three.Object3D, camTo: three.Object3D) {
    if (!this.renderer || !this.smbGltf) {
      throw Error('assert');
    }
    this._updateDebugCamera(camFrom);

    const sphere = new three.Sphere(
      new three.Vector3(),
      // this.sceneParser.center, // if the thing was not centered
      this.smbGltf.boundingCubeDiagonal / 2
    );

    if (this.motionTrack) {
      this.motionTrack.stop();
    }
    const target = this._debug
      ? this._debugCamera
      : this.renderer.getRenderCamera();

    // adapt speed to the size of the scene.
    const timeToTraverseWholeBBox = 2; // seconds
    const speed = this.smbGltf.boundingCubeDiagonal / timeToTraverseWholeBBox;
    const angularSpeed = Math.PI / 4; // 45degrees per second
    this.motionTrack = createMotionTrack(
      sphere,
      camFrom,
      camTo,
      target,
      speed,
      angularSpeed
    );
    this.motionTrack.onDone = this._onCameraMotionDone.bind(this);
    this.motionTrack.start();
    log.debug('camera motion started');

    if (!this._debug) {
      // center orbitcontrols on target poi, disable it during motion
      const empty = this.smbGltf.cameraToPoi.get(camTo.name);
      const target = new three.Vector3();
      if (!empty) {
        log.debug('no poi for target camera', camTo.name, 'targeting origin');
      } else {
        empty.getWorldPosition(target);
      }
      this.renderer.configOrbitControls({ target, enabled: false });
    }
  }

  _onCameraMotionDone() {
    if (!this.renderer) throw Error('assert');
    log.debug('camera motion done');
    this.renderer.configOrbitControls({ enabled: true });
    this.onCameraMotionFinished(this.selectedCamera.name);
  }
}
