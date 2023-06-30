import { Matrix4, Object3D, Vector3, Quaternion, MathUtils } from 'three';
import { Logger } from '../../simpleLog';

const log = new Logger('Motion');

/**
 * Interpolates a motion representing a change from the position and orientation of
 * source to the ones of destination. The motion is linear, the orientation changes
 * smoothly on a sphere (slerp).
 * Use for generic object interpolation.
 */
export class Motion {
  // empty objects in world space. used just as containers for position and quaternion
  // we do NOT support SCALING!
  src: Object3D;
  dest: Object3D;
  target: Object3D;
  velocity: number;
  angularVelocity: number;

  /**
   * Motion from src to dest.
   * target is the object being updated when interpolate is called.
   * velocity in meters/second. Angular in radians/second. Vector3(1,0,0) considered 1m long.
   */
  constructor(
    src: Object3D,
    dest: Object3D,
    target: Object3D,
    velocity = 1,
    angularVelocity = 1
  ) {
    this.src = new Object3D();
    this.dest = new Object3D();
    src.getWorldPosition(this.src.position);
    src.getWorldQuaternion(this.src.quaternion);
    dest.getWorldPosition(this.dest.position);
    dest.getWorldQuaternion(this.dest.quaternion);
    this.target = target;
    this.velocity = velocity;
    this.angularVelocity = angularVelocity;
  }

  /**
   * Interpolates position and orientation.
   * Position is linearly interpolated and orientation is slerp-ed
   * Interpolation happens in world space.
   * t in [0..1]
   */
  interpolate(t: number) {
    const srcPos = this.src.position.clone();
    const srcQuat = this.src.quaternion.clone();
    // in world space
    const pos = srcPos.lerp(this.dest.position, t);
    const quat = srcQuat.slerp(this.dest.quaternion, t);
    this.positionTarget(pos, quat);
  }

  /**
   * Position target within it's parent.
   * The arguments are in World space and come from interpolation.
   */
  positionTarget(pos: Vector3, quat: Quaternion) {
    const localToWorld = new Matrix4().compose(pos, quat, this.target.scale);
    // set target position and orientation in local space
    let localToParent;
    if (this.target.parent) {
      this.target.parent.updateWorldMatrix(true, false);
      const fromWorldToParent = this.target.parent.matrixWorld.invert();
      localToParent = fromWorldToParent.multiply(localToWorld);
    } else {
      // target is detached from scene so in world space
      localToParent = localToWorld;
    }
    localToParent.decompose(
      this.target.position,
      this.target.quaternion,
      this.target.scale
    );
  }

  /** how long it will take to complete motion at the given speeds. */
  getDuration() {
    const distance = this.src.position.clone().sub(this.dest.position).length();
    const angle = this.src.quaternion.angleTo(this.dest.quaternion);
    return distance / this.velocity + angle / this.angularVelocity;
  }
}

/**
 * animates a sequence of motions.
 * Mimics three.js animation api, hoping that we can replace it with that
 */
export class MotionTrack {
  motions: Motion[];
  duration: number;
  time: number; // in seconds
  // at what this.time (in 0..1) does motion i start
  _startTimes = [0];
  _doneTriggered = false; // to edge trigger the done event

  /**
   * Called when the track is done interpolating all motions
   * Intended to be overwritten by clients.
   */
  onDone() {}

  constructor(motions: Motion[]) {
    this.motions = motions;
    this.duration = 0;
    for (const motion of motions) {
      this.duration += motion.getDuration();
    }
    this.time = this.duration; // we're stopped
    this._computeStartTimes();
  }

  /** Compute start time for each motion. */
  _computeStartTimes() {
    for (let i = 0; i < this.motions.length; i++) {
      const timeDelta = this.motions[i].getDuration() / this.duration;
      this._startTimes.push(this._startTimes[i] + timeDelta);
    }
    // just in case we get some rounding errors
    this._startTimes[this._startTimes.length - 1] = 1;
  }

  _motionIxActiveNow(t: number) {
    for (let i = 0; i < this._startTimes.length - 1; i++) {
      const tend = this._startTimes[i + 1];
      if (t < tend) {
        return i;
      }
    }
    return -1;
  }

  /** Call in a loop to advance the motion. deltaTime in seconds */
  update(deltaTime: number) {
    const time = this.time + deltaTime;
    const t = time / this.duration;
    if (t > 1) {
      if (!this._doneTriggered) {
        // place it at the end in case the last interpolate call did not receive
        // a tlocal close to 1 this can happen if deltaTime is not small
        // do this just once, thus the _doneTriggered check above
        this.motions[this.motions.length - 1].interpolate(1);
        this.stop();
      }
      return;
    }
    this.time = time;

    const ix = this._motionIxActiveNow(t);
    if (ix === -1) {
      // handle this just in case, so we won't break the app
      log.warn('assert fail: should find motions');
      return;
    }
    const tstart = this._startTimes[ix];
    const tend = this._startTimes[ix + 1];
    const tlocal = MathUtils.inverseLerp(tstart, tend, t);
    this.motions[ix].interpolate(tlocal);
  }

  start() {
    this.time = 0;
  }

  stop() {
    this.time = this.duration + 1;
    if (!this._doneTriggered) {
      this.onDone();
      this._doneTriggered = true;
    }
  }
}
