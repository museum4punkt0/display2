import React, {
  useEffect,
  useRef,
  PointerEvent,
  forwardRef,
  useImperativeHandle,
} from 'react';

import {
  SceneManager,
  Renderer,
  SceneManagerLoadInfo,
} from '../../artefactViewer';
import { useGltf } from '../../hooks/useGltf';

import { GltfDump } from '../GltfDump/GltfDump';
import './View3d.css';
import { usePrevious } from '../../hooks/usePrev';
import { Logger } from '../../simpleLog';
import {
  DEFAULT_ASSETS,
  ISceneManagerAssets,
} from '../../artefactViewer/sceneManager';
import { IStory, NULL_STORY } from '../../model';

const log = new Logger('component::View3d');

// View3d synchronizes react props and state with the artefactViewer.
// It should not directly interact with any 3d API's

export interface IView3dProps {
  story: IStory;
  debug?: boolean;
  environment: string;
  exposure: number;
  shadows: boolean;
  spriteGroup: string;
  materialVariant: string;
  camera: string;
  animations: string[];
  onLoaded?: (info: SceneManagerLoadInfo) => void;
  onClick?: (infoPointName: string) => void;
  onCameraMotionFinished?: (cameraId: string) => void;
  baseResourceUrl?: string;
  viewerAssets?: ISceneManagerAssets;
}

export class View3dMutRef {
  sceneManager: SceneManager;
  constructor(sceneManager: SceneManager) {
    this.sceneManager = sceneManager;
  }

  resetCamera() {
    this.sceneManager.selectCamera('');
  }
}

/**
 * The View3d component displays and interacts with SMB 3d models.
 * @param props.src url pointing to a glb or gltf file.
 *     Note that for gltf files the loader needs to read sibling files.
 * @param props.debug flag enabling debug features
 * @param props.imageBasedLighting flag enabling physical based rendering
 */
export const View3d = forwardRef(function (
  {
    story = NULL_STORY,
    debug = false, // move these rarely changed settings to an object
    environment = '',
    exposure = 1.0,
    shadows = false,
    spriteGroup = '',
    materialVariant = '',
    camera = '',
    animations = [],
    onLoaded,
    onClick,
    onCameraMotionFinished,
    baseResourceUrl = '',
    viewerAssets = DEFAULT_ASSETS,
  }: IView3dProps,
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<SceneManager | null>(null);
  const [gltf, _gltfProgress] = useGltf(baseResourceUrl, story);
  const prevGltf = usePrevious(gltf);
  const prevCamera = usePrevious(camera);
  const prevAnimations = usePrevious(animations);
  const prevShadows = usePrevious(shadows);

  // On mount create the SceneManager associated with this component instance
  // Did not abstract the renderer away as it handles animation at the moment
  useEffect(() => {
    const renderer = new Renderer(canvasRef.current!, baseResourceUrl);
    const sceneManager = new SceneManager(renderer, viewerAssets);
    sceneRef.current = sceneManager;

    renderer.loop.start();

    return () => {
      renderer.loop.stop();
      sceneManager.dispose();
      renderer.dispose();
    };
  }, [baseResourceUrl, viewerAssets]);

  // Synchronizes the GLTF object held in state with the SceneManager.
  // Reiniting the sceneManager on materialVariant change is wasteful.
  // However a separate effect triggered just by materialVariant races with gltf load.
  // We keep prev value and manually diff here to detect if gltf actually changed.
  // NOTE: could be solved by the very new useEffectEvent
  useEffect(() => {
    // note this gets called 69 times for initial load! How react, how?
    log.info('synchronize effect called.', gltf ? 'has gltf' : 'no gltf');
    if (sceneRef.current === null) {
      log.error('assert fail: null SceneManager');
      return;
    }
    const sceneManager = sceneRef.current;

    if (gltf !== prevGltf) {
      log.log('gltf changed');
      const loadInfo = sceneManager.load(gltf);
      (sceneManager.renderer as Renderer).logStats();

      // these have to be initialized for a new scene even if they have not changed
      // see the manual diff below that happens even if the gltf did not change
      if (gltf !== null) {
        sceneManager.playAnimations(animations);
        sceneManager.selectCamera(camera);
        (sceneManager.renderer as Renderer).enableShadows(shadows);
      }
      if (onLoaded) {
        onLoaded(loadInfo);
      }
    }

    if (gltf !== null) {
      log.log('sync other props with sceneManager');
      // void indicates we intentionally not await this promise.
      void sceneManager.selectMaterialVariant(materialVariant);
      sceneManager.enableSpriteGroup(spriteGroup);
      sceneManager.selectEnvironment(environment);
      // todo : deal with these casts
      (sceneManager.renderer as Renderer).setExposure(exposure);

      // these below are triggered only on change
      if (shadows !== prevShadows) {
        // need to diff cause this is very expensive, and should not happen if a camera changes.
        (sceneManager.renderer as Renderer).enableShadows(shadows);
      }
      if (animations !== prevAnimations) {
        log.debug('animation change');
        // need to diff cause this has the side-effect of resetting the animations to time 0
        sceneManager.playAnimations(animations);
      }
      if (camera !== prevCamera) {
        log.debug('camera change');
        // need to diff cause this has side-effect of resetting the rendering camera to the given one
        sceneManager.selectCamera(camera);
      }
      if (onCameraMotionFinished) {
        sceneManager.onCameraMotionDone(onCameraMotionFinished);
      }
    }
  }, [gltf, prevGltf, onLoaded, materialVariant, camera, prevCamera, animations, prevAnimations, spriteGroup, environment, exposure, shadows, prevShadows, onCameraMotionFinished]);

  // sync flags
  useEffect(() => {
    sceneRef.current?.enableDebug(debug);
  }, [debug]);

  useImperativeHandle(
    ref,
    () => {
      if (sceneRef.current) {
        // used for the side effect, unconditionally
        return new View3dMutRef(sceneRef.current);
      }
      return null;
    },
    [gltf] // i need to recreate the handle on gltf change. So why the complaint? What is the proper way to do this?
  );

  function onPointerDown(e: PointerEvent<HTMLCanvasElement>) {
    const sceneManager = sceneRef.current!;
    const rayCaster = sceneManager.renderer.getRaycaster(e);
    const name = sceneManager.getInterestPointHitBy(rayCaster);
    if (name !== undefined) {
      log.info('picked', name);
      onClick?.(name);
    }
  }

  // Note: the sizes below are just some defaults. If you want to size the
  // canvas size it's parent  .View3d  via css
  return (
    <div className='View3d'>
      <canvas
        width={100}
        height={100}
        ref={canvasRef}
        onPointerDown={onPointerDown}
      />
      {debug ? (
        <GltfDump src={story.gltfUrl} baseResourceUrl={baseResourceUrl} />
      ) : null}
    </div>
  );
});
