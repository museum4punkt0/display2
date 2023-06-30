// An exercise in jsdom and jest mocking. 
// XXX Is this worth it? Are we even testing anything here?
// XXX Keep it for reference for now.

import { Renderer } from "../artefactViewer";
import three from 'three'

class MockWebGLRenderer {
  w = 0
  h = 0
  setPixelRatio(value:number){}
  setSize(w: number, h: number, update: boolean) {
    this.w = w;
    this.h = h;
  }
  getSize(target: three.Vector2){ return target.set(this.w, this.h)}
  render(scene: three.Scene, camera:three.Camera){}
  setClearColor(c: three.ColorRepresentation) {}
  shadowMap = {}
  domElement: HTMLCanvasElement;

  constructor({canvas}:three.WebGLRendererParameters){
    this.domElement = canvas as HTMLCanvasElement
  }
}

class MockPMREM {
  compileEquirectangularShader(){}
}

jest.mock('three', () => {
  const originalModule = jest.requireActual('three');
  const mocked = {
      WebGLRenderer: (p: three.WebGLRendererParameters) => new MockWebGLRenderer(p),
      PMREMGenerator: () => new MockPMREM(),
  }
  return {
    __esModule: true,
    ...originalModule,
    ...mocked,
    default: {...originalModule, ...mocked},
  };
});

// just mocks dimensions
function mockedCanvas(size:{w: number, h:number}){
  const canvas = document.createElement('canvas');
  Object.defineProperty(canvas, 'clientWidth', {get: () => size.w});
  Object.defineProperty(canvas, 'clientHeight', {get: () => size.h});
  canvas.getBoundingClientRect = () => { 
    return {
      left:0, right: size.w, top:0, bottom: size.h, 
      width:size.w, height:size.h, x: 0, y: 0
    } as DOMRect
  };
  return canvas;
}

test('render camera positioning', () => {
  const canvas = mockedCanvas({w:40, h:30});
  const renderer = new Renderer(canvas);
  // test aspect
  expect(renderer.getAspect()).toBeCloseTo(4/3);
  // test render camera positioned in world space
  const cam = new three.PerspectiveCamera();
  cam.position.set(-44, 0, 10);
  const root = new three.Group();
  root.add(cam);
  root.position.set(44, 0, 0);
  renderer.setCameraFrom(cam);
  expect(renderer.getRenderCamera().position.x).toBeCloseTo(0);
});

test('render getRaycaster', () => {
  const canvas = mockedCanvas({w: 20, h:20});
  const renderer = new Renderer(canvas);

  const cam = new three.PerspectiveCamera();
  cam.position.set(0, 0, 10);
  renderer.setCameraFrom(cam);
  // 10px 10px should hit in the middle
  expect(
    renderer.pointerToNDC({clientX: 10, clientY: 10}).toArray()
  ).toEqual([0, 0]);

  const rc = renderer.getRaycaster({clientX: 10, clientY: 10});
  expect(rc.ray.origin.x).toBeCloseTo(0);
  expect(rc.ray.origin.y).toBeCloseTo(0);
  expect(rc.ray.origin.z).toBeCloseTo(10);
  expect(rc.ray.direction.x).toBeCloseTo(0);
  expect(rc.ray.direction.y).toBeCloseTo(0);
  expect(rc.ray.direction.z).toBeCloseTo(-1);
});

test('render resize updates render camera', () => {
  const size = {w:20, h:20};
  const canvas = mockedCanvas(size);
  const renderer = new Renderer(canvas);

  expect(renderer.getRenderCamera().aspect).toBeCloseTo(1);

  size.w = 300;
  size.h = 200;
  renderer._syncWithResize();
  expect(renderer.getRenderCamera().aspect).toBeCloseTo(3/2);

  // bad sizes fall back on defaults
  size.w = 0;
  size.h = 10000000;
  renderer._syncWithResize();
  expect(renderer.getRenderCamera().aspect).toBeCloseTo(1);
});

