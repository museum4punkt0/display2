import { Matrix4, Object3D, Quaternion, Sphere, Vector3 } from 'three';
import * as three from 'three';
import { Motion, MotionTrack } from './motion';
import { Logger } from '../../simpleLog';
import { computeAxisAngle, segmentOutsideSphere } from './math';

const log = new Logger('sphereMotion');

/**
 * returns an object on the sphere looking towards the center
 * radially above the src point.
 */
function computePointOnSphere(src: Vector3, sphere: Sphere) {
  // src normalized relative to center
  const p = src.clone().sub(sphere.center).normalize();
  const dest = new Object3D();
  // look at p not at origin after translation. otherwise we end up flipped
  // remainder: default orientation is +z local
  // lookat aligns local +z with look at point
  // So if we end up at 1, 0, 0 a look at 0 will flip us to look at -z!
  dest.lookAt(p);
  // from normal to point on sphere
  p.multiplyScalar(sphere.radius).add(sphere.center);
  dest.position.copy(p);
  return dest;
}

/** move along a sphere. src and dest must be already on the sphere */
export class SphereMotion extends Motion {
  axis: Vector3;
  angle: number;
  srcRelativePos: Vector3;
  sphere: Sphere;

  constructor(
    sphere: Sphere,
    src: Object3D,
    dest: Object3D,
    target: Object3D,
    velocity = 1,
    angularVelocity = 1
  ) {
    super(src, dest, target, velocity, angularVelocity);
    this.sphere = sphere;
    // positions relative to center
    this.srcRelativePos = this.src.position.clone().sub(sphere.center);
    const destRelativePos = this.dest.position.clone().sub(sphere.center);

    const { angle, axis } = computeAxisAngle(
      this.srcRelativePos,
      destRelativePos
    );
    this.angle = angle;
    this.axis = axis;

    log.debug('SphereMotion', {
      axis: this.axis,
      angle: this.angle,
      srcRelativePos: this.srcRelativePos,
      destP: destRelativePos,
    });
  }

  interpolate(t: number): void {
    const currentRelativePos = this.srcRelativePos.clone();
    // position on the great arc
    currentRelativePos.applyAxisAngle(this.axis, t * this.angle);
    // orient towards the origin
    const m = new Matrix4().lookAt(
      new Vector3(0, 0, 0),
      currentRelativePos.clone().multiplyScalar(-1),
      new Vector3(0, 1, 0)
    );
    const pos = currentRelativePos.add(this.sphere.center);
    const quat = new Quaternion().setFromRotationMatrix(m);
    this.positionTarget(pos, quat);
  }

  getDuration() {
    const distance = this.sphere.radius * this.angle;
    // the second term is consistent with the linear Motion
    // It can be useful to compensate in case we have a tiny radius.
    // A very fast translation for tiny radius is not an issue, but we still may turn 180 degrees.
    // So the second term is correct here.
    return distance / this.velocity + this.angle / this.angularVelocity;
  }
}

/**
 * Transition from an object to another by moving along a bounding sphere.
 * Transition has 3 sub-motions
 * 1. from src position to the point on the bounding sphere above it.
 *    orientation from the src one to one aimed at the center of the sphere looking up +y
 * 2. a motion on a great arc on the bounding sphere.
 * 3. from the point on the bounding sphere above dest descend down to dest
 * Duration is in seconds
 */
export function makeBoundingSphereMotionTrack(
  sphere: Sphere,
  src: Object3D,
  dest: Object3D,
  target: Object3D,
  velocity: number,
  angularVelocity: number
) {
  // makes the orbit phase faster. Constant speed takes too much time in orbit.
  // and makes the other two, usually shorter motions, seem way faster.
  const fakeAccelerationBias = 4;
  const srcAbove = computePointOnSphere(
    src.getWorldPosition(new Vector3()),
    sphere
  );
  const destAbove = computePointOnSphere(
    dest.getWorldPosition(new Vector3()),
    sphere
  );
  // using the same velocities, to obtain a constant motion during all movements
  const raiseMotion = new Motion(
    src,
    srcAbove,
    target,
    velocity,
    angularVelocity
  );
  const orbitMotion = new SphereMotion(
    sphere,
    srcAbove,
    destAbove,
    target,
    velocity * fakeAccelerationBias,
    angularVelocity * fakeAccelerationBias
  );
  const descendMotion = new Motion(
    destAbove,
    dest,
    target,
    velocity,
    angularVelocity
  );
  return new MotionTrack([raiseMotion, orbitMotion, descendMotion]);
}

export function createMotionTrack(
  sphere: Sphere,
  src: Object3D,
  dest: Object3D,
  target: Object3D,
  velocity: number,
  angularVelocity: number
) {
  const srcPos = src.getWorldPosition(new three.Vector3());
  const destPos = dest.getWorldPosition(new three.Vector3());

  const wontHitSphere = segmentOutsideSphere(sphere, srcPos, destPos);
  // in radii
  const linearDistance = srcPos.clone().sub(destPos).length() / sphere.radius;
  const shortMotion = linearDistance < 1 / 2;

  log.debug(
    'motion heuristics: linearDistance in radii',
    linearDistance,
    'wontHitSphere',
    wontHitSphere
  );

  // For small motions that wont hit sphere go directly to dest, linearly.
  if (wontHitSphere && shortMotion) {
    log.debug('using direct motion');
    const linearMotion = new Motion(
      src,
      dest,
      target,
      velocity,
      angularVelocity
    );
    return new MotionTrack([linearMotion]);
  }
  // long linear motions while interpolating rotations
  // correctly won't keep the object in focus and are not natural
  // Such long motions are better done on great circles
  // We pick a sphere of average radius between src and dest
  if (wontHitSphere && !shortMotion) {
    log.debug('using sphere motion on intermediate sphere');
    const srcRelativePos = srcPos.clone().sub(sphere.center);
    const destRelativePos = destPos.clone().sub(sphere.center);
    const avgRadius = (srcRelativePos.length() + destRelativePos.length()) / 2;
    const motionSphere = new Sphere(sphere.center, avgRadius);
    return makeBoundingSphereMotionTrack(
      motionSphere,
      src,
      dest,
      target,
      velocity,
      angularVelocity
    );
  }

  log.debug('using bounding sphere motion');
  // by default do the motion on the bounding sphere
  return makeBoundingSphereMotionTrack(
    sphere,
    src,
    dest,
    target,
    velocity,
    angularVelocity
  );
}
