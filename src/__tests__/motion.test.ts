import { Object3D, Quaternion, Sphere, Vector3, Euler } from "three";
import { SphereMotion } from "../artefactViewer/feature/sphereMotion";
import { Motion, MotionTrack } from "../artefactViewer/feature/motion";
import { computeAxisAngle, pickAxesSubspaceMember, segmentOutsideSphere } from "../artefactViewer/feature/math";

interface Path {
  position: Vector3[];
  orientation: Quaternion[];
}

function makePath(motion: Motion) {
  const path: Path = { position: [], orientation: [] };
  const times = [0, 0.25, 0.5, 0.75, 1];

  for (const t of times) {
    motion.interpolate(t);
    path.position.push(motion.target.position.clone());
    path.orientation.push(motion.target.quaternion.clone());
  }
  return path;
}

function _arrayStr(v: number[], precision = 3) {
  const s = v.map(e => e.toFixed(precision)).join(', ');
  return `(${s})`;
}

function vectStr(v: Vector3) {
  return `vec3${_arrayStr(v.toArray())}`;
}

function eulerStr(e: Euler) {
  const exyz = [e.x, e.y, e.z];
  const s = exyz.map(a => {
    const api = (a / Math.PI).toFixed(2);
    return `${api} PI`;
  });
  return `euler(${s.join(', ')} , ${e.order})`;
}

function logPath(path: Path) {
  console.log('position');
  console.log('x, y, z');

  for (const p of path.position) {
    const vstr = p.toArray().join(', ');
    console.log(vstr);
  }

  console.log('orientation');
  console.log('Euler x y z');
  for (const q of path.orientation) {
    const euler = new Euler().setFromQuaternion(q);
    console.log(euler.toArray().join(', '));
  }
}

function expectArrayEqual(actual: number[], expected: number[], epsilon = 1e-8) {
  expect(expected.length).toEqual(actual.length);
  for (let i = 0; i < expected.length; i++) {
    if (Math.abs(expected[i] - actual[i]) > epsilon) {
      console.log('actual', actual);
      console.log('expected', expected);
      throw new Error(['expected !== actual got \n expected=', expected, '\n actual=', actual, '\n at index', i, 'delta=', (expected[i] - actual[i])].join(' '));
    }
  }
}

test('Motion interpolates position ok', ()=>{
  const src = new Object3D();
  const dest = new Object3D();
  const target = new Object3D();
  dest.position.set(1, 0, 0);

  const motion = new Motion(src, dest, target);

  const path = makePath(motion);
  const n = path.position.length;

  path.position.forEach((p, i) => {
    const t = i / (n - 1);
    expect(p.y).toBeCloseTo(0);
    expect(p.z).toBeCloseTo(0);
    expect(p.x).toBeCloseTo(t);
  });
})

test('Motion interpolates orientation ok', ()=>{
  const src = new Object3D();
  const dest = new Object3D();
  const target = new Object3D();
  dest.lookAt(new Vector3(0, 1, 0));

  const motion = new Motion(src, dest, target);

  const path = makePath(motion);
  const n = path.position.length;

  // the x orientation should be linear from 0 to -pi/2
  path.orientation.forEach((v, i) => {
    const euler = new Euler().setFromQuaternion(v);
    // rotation should be on x only, and euler is xyz so yz should be 0
    const t = i / (n - 1);
    expect(euler.y).toBeCloseTo(0);
    expect(euler.z).toBeCloseTo(0);
    expect(euler.x).toBeCloseTo(-Math.PI / 2 * t);
  });
})

test('motion positions target well', ()=>{
  const root = new Object3D();
  const parentTo = new Object3D();
  const parentTarget = new Object3D();
  root.add(parentTarget);
  root.add(parentTo);
  parentTo.position.set(1, 0, 0);
  parentTarget.rotateOnAxis(new Vector3(0, 0, 1), Math.PI/2);
  // parentTarget.translateZ(4);

  const from = new Object3D();
  const to = new Object3D();
  const target = new Object3D();

  parentTo.add(to);
  parentTarget.add(target);

  const motion = new Motion(from, to, target);

  const path = makePath(motion);
  const n = path.position.length;
  logPath(path);

  path.position.forEach((p, i) => {
    const t = i / (n - 1);
    expect(p.x).toBeCloseTo(0);
    expect(p.y).toBeCloseTo(-t);
    expect(p.z).toBeCloseTo(0);
  });

})

test('SphereMotion i to j sphere axis ok', () => {
  const from = new Object3D();
  const to = new Object3D();
  const target = new Object3D();

  from.position.set(1, 0, 0)
  to.position.set(0, 1, 0);

  const motion = new SphereMotion(new Sphere(), from, to, target);
  expectArrayEqual(motion.axis.toArray(), [0, 0, 1]);
  expect(motion.angle).toBeCloseTo(Math.PI / 2);
});

test('SphereMotion i to j sphere position interpolate', () => {
  const from = new Object3D();
  const to = new Object3D();
  const target = new Object3D();

  from.position.set(1, 0, 0)
  to.position.set(0, 1, 0);

  const motion = new SphereMotion(new Sphere(), from, to, target);

  const path = makePath(motion);
  const n = path.position.length;

  // rotation should be in the xy plane, no z component
  path.position.forEach((p, i) => {
    expect(p.z).toBeCloseTo(0);
  });

  path.position.forEach((p, i) => {
    const t = i / (n - 1);
    const phi = Math.PI / 2 * t;
    expectArrayEqual([p.x, p.y], [Math.cos(phi), Math.sin(phi)], 0.01);
  })
});

test('SphereMotion i to j sphere orientation interpolate', () => {
  const from = new Object3D();
  const to = new Object3D();
  const target = new Object3D();
  // the path should be a rotation along x 
  from.position.set(0, 0, 1)
  to.position.set(0, 1, 0);

  const motion = new SphereMotion(new Sphere(), from, to, target);
  const path = makePath(motion);
  const n = path.position.length;

  // for sphere motion orientation is towards center
  // ignoring all initial orientations of src an dest. 

  // rotation should be on x only, and euler is xyz so yz should be 0
  path.orientation.forEach((v, i) => {
    const euler = new Euler().setFromQuaternion(v);
    expectArrayEqual([euler.y, euler.z], [0, 0], 1e-4);
  });
  // the x orientation should be linear from 0 to -pi/2
  path.orientation.forEach((v, i) => {
    const euler = new Euler().setFromQuaternion(v);
    // rotation should be on x only, and euler is xyz so yz should be 0
    const t = i / (n - 1);
    expect(euler.x).toBeCloseTo(-Math.PI / 2 * t);
  });

});

test('choosing an axis of rotation given just a single direction', () => {
  const axis = pickAxesSubspaceMember(new Vector3(1, 1, 0));
  // -1, 1, 0 manually confirmed
  expectArrayEqual(axis.toArray(), new Vector3(-1, 1, 0).normalize().toArray());
});

test('compute axis angle', () =>{
  // i to j
  let {axis, angle} = computeAxisAngle(new Vector3(1, 0, 0), new Vector3(0, 1, 0));

  expectArrayEqual(axis.toArray(), [0, 0, 1]);
  expect(angle).toBeCloseTo(Math.PI/2);
  // more spatial
  ({axis, angle} = computeAxisAngle(new Vector3(0, 1, 1), new Vector3(1, 0, 1)));
  expectArrayEqual(axis.toArray(), new Vector3(1, 1, -1).normalize().toArray());
  expect(angle).toBeCloseTo(Math.PI/3);
  // degenerate, should pick close to +y, in this case exacly it
  ({axis, angle} = computeAxisAngle(new Vector3(1, 0, 0), new Vector3(-1, 0, 0)));
  expectArrayEqual(axis.toArray(), [0, 1, 0]);
  expect(angle).toBeCloseTo(Math.PI);
  // even more degenerate when close to +y is not possible, we should still get some axis
  ({axis, angle} = computeAxisAngle(new Vector3(0, 1, 0), new Vector3(0, -1, 0)));
  expectArrayEqual(axis.toArray(), [1, 0, 0]);
  expect(angle).toBeCloseTo(Math.PI);

})

test('segment outside sphere', () => {
  const ball = new Sphere(new Vector3(2, 0, 1), 1);  // |.o
  const src = new Vector3(1.5, 0, 4); // outside the sphere
  // dest is in the ball
  expect(segmentOutsideSphere(ball, src, new Vector3(2, 0, 0.5))).toBe(false);
  // dest is outside, but does not intersect
  expect(segmentOutsideSphere(ball, src, new Vector3(1.5, 0, 2))).toBe(true);
  // dest is outside but intersects
  expect(segmentOutsideSphere(ball, src, new Vector3(1.5, 0, -2))).toBe(false);
});

test('motion track computes proper start times', () =>{
  const src = new Object3D();
  const mid = new Object3D();
  const dest = new Object3D();
  const target = new Object3D();

  mid.position.set(1, 0, 0); // src-> mid 1 meter
  dest.position.set(4, 0, 0); // mid -> dest 3 meter

  const m1 = new Motion(src, mid, target);
  const m2 = new Motion(mid, dest, target);
  const track = new MotionTrack([m1, m2]);

  // first motion takes 1/4 meters second 3/4 meters so first ends at 1/4
  expectArrayEqual(track._startTimes, [0, 0.25, 1]);

})

test('motion track update ok', () =>{
  const src = new Object3D();
  const mid = new Object3D();
  const dest = new Object3D();
  const target = new Object3D();

  mid.position.set(1, 0, 0); // src-> mid 1 meter
  dest.position.set(4, 0, 0); // mid -> dest 3 meter

  const m1 = new Motion(src, mid, target);
  const m2 = new Motion(mid, dest, target);
  const track = new MotionTrack([m1, m2]);
  // times in seconds should be 0, 1, 4
  // test current motion for a time
  expect(track._motionIxActiveNow(0.5/4)).toBe(0);
  expect(track._motionIxActiveNow(1.5/4)).toBe(1);

  track.start();
  track.update(0.5);
  // after 0.5 sec the first motion should be in the middle of it's time
  // so x should be 0.5
  expectArrayEqual(target.position.toArray(), [0.5, 0, 0])
  track.update(1.5);
  // now after 2 sec in second modion in the middle
  expectArrayEqual(target.position.toArray(), [2, 0, 0])
  // advance until stop
  for(let i =0; i< 10; i++){
    track.update(0.2);  // do it in multiple steps or it skips the time window
  }
  expect(target.position.x).toBeCloseTo(4);
  // now it should be stopped
  track.update(5); // should be a nop
  expect(target.position.x).toBeCloseTo(4);

})