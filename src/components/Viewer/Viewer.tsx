import React, { useEffect, useRef, useState } from 'react';
import './View.css';
import { View3d, View3dMutRef } from '../View3d/View3d';
import { SceneManagerLoadInfo } from '../../artefactViewer';
import { Controls } from '../View3d/Controls';
import { Content } from '../Story/Content';
import { IStory, IStorySection, NULL_STORY } from '../../model';
import { Logger } from '../../simpleLog';
import { ISceneManagerAssets } from '../../artefactViewer/sceneManager';
import { useJson } from '../../hooks/useJson';

const log = new Logger('component::Viewer');
const viewerAssets: ISceneManagerAssets = {
  sprite: 'sprite.png',
  envTextures: [
    ['indoor', 'Indoor.jpg'],
    ['outdoor', 'Outdoor.jpg'],
    ['evening', 'OutdoorEvening.jpg'],
  ],
};

export function Viewer({
  src = '',
  baseResourceUrl = '',
}: {
  src: string;
  baseResourceUrl: string;
}) {
  const [camera, setCamera] = useState('');
  const [chapterId, setChapterId] = useState('');
  const [spritesVisible, setSpritesVisible] = useState(false);
  const [info, setInfo] = useState<SceneManagerLoadInfo | null>(null);
  const [animations, setAnimations] = useState<string[]>([]);
  const [material, setMaterial] = useState<string>('');
  const view3dref = useRef<View3dMutRef | null>(null);
  const [env, setEnv] = useState('evening');
  const [exposure, setExposure] = useState(1.0); // this one should probably be on a intermediate component
  const [shadows, setShadows] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [viewportOverlay, setViewportOverlay] = useState<string | null>(null);
  const story = useJson<IStory>(src, NULL_STORY);

  log.debug('component render');

  function getSectionByCamera(camera: string) {
    return story.content.find(section => section.camera === camera);
  }

  const section = getSectionByCamera(camera);

  function onPoiChanged(section: IStorySection) {
    // sync camera
    setCamera(section.camera);
    // disable overlay immediately dont wait for camera motion done
    setViewportOverlay(null);
  }

  function onModelLoaded(info: SceneManagerLoadInfo) {
    setInfo(info);
    if (!info) {
      return;
    }
    if (info.materialVariants.length) {
      // set first material as default
      setMaterial(info.materialVariants[0]);
    }
    // update current chapter id story loads
    onChapterChanged(story.chapters[0].id);
  }

  function onResetCamera() {
    const imperative = view3dref.current;
    if (!imperative) return;
    imperative.resetCamera();
  }

  function onCameraChange(camera: string) {
    setCamera(camera);
    const section = getSectionByCamera(camera);
    if (section) {
      onPoiChanged(section);
    } // else this camera has no poi in the story
    // note that the user can pick a camera without a poi from the dropdown.
  }

  function onSpriteClick(infoPointName: string) {
    const section = getSectionByCamera(infoPointName);
    if (section) {
      onPoiChanged(section);
    } else {
      log.warn(`poi ${infoPointName} from gltf is not present in json story`);
    }
  }

  function onChapterChanged(cid: string) {
    // go to the first camera in the chapter
    const chapter = story.chapters.find(chapter => cid === chapter.id);
    if (!chapter) {
      log.warn(`chapter ${chapter} not in the json`);
      return;
    }
    const camId = chapter.cameras[0];
    const section = getSectionByCamera(camId);
    if (!section) {
      log.warn(`chapter poi ${camId} not in the json content`);
      return;
    }
    setChapterId(cid);
    onPoiChanged(section);
  }

  function onCameraMotionFinished(cameraId: string): void {
    // TODO: syncronize this event with the last render?
    //       this may trigger with a no-longer current camera!
    // should I just cancel if the cameras don't agree?
    if (cameraId !== camera) {
      log.info(
        `camera ${cameraId} motion finished but current camera is ${camera}. Event ignored`
      );
      return;
    }

    const section = getSectionByCamera(cameraId);
    if (!section) {
      // note that the user can pick a camera from the drop-down that
      // has no poi associated with it. Common example is the default "" camera.
      // Cannot distinguish here between non-poi camera and missing poi in json...
      log.info(`poi ${cameraId} from gltf is not present in json story`);
      return;
    }

    // sync material. if not defined in json use the default '' material
    setMaterial(section.materialVariant || '');
    // // sync overlay
    setViewportOverlay(section.overlayHtml || null);
    // // sync animations
    setAnimations(section.animations || []);
    log.info('camera motion finished', cameraId);
  }

  function onToggleSound() {
    setSoundOn(!soundOn);
  }

  return (
    <div className='ViewerRoot'>
      <div className='Viewport'>
        <View3d
          story={story}
          environment={env}
          exposure={exposure}
          shadows={shadows}
          spriteGroup={spritesVisible ? chapterId : ''}
          materialVariant={material}
          camera={camera}
          animations={animations}
          onClick={onSpriteClick}
          onLoaded={onModelLoaded}
          onCameraMotionFinished={onCameraMotionFinished}
          ref={view3dref}
          baseResourceUrl={baseResourceUrl}
          viewerAssets={viewerAssets}
        />
        {info ? (
          <Controls
            info={info}
            material={material}
            camera={camera}
            exposure={exposure}
            env={env}
            spritesOn={spritesVisible}
            soundOn={soundOn}
            onMaterialChange={mat => setMaterial(mat)}
            onCameraChange={onCameraChange}
            onEnvChange={env => setEnv(env)}
            onToggleSprites={() => setSpritesVisible(!spritesVisible)}
            onResetCamera={onResetCamera}
            onExposureChange={ex => setExposure(ex)}
            onToggleShadow={() => setShadows(!shadows)}
            onToggleSound={onToggleSound}
          />
        ) : (
          <progress />
        )}
        {viewportOverlay ? (
          <>
            <button
              className='CloseOverlay'
              onClick={_e => setViewportOverlay(null)}
              title='close overlay'
            >
              🞭
            </button>
            <div
              className='Overlay'
              dangerouslySetInnerHTML={{ __html: viewportOverlay }}
            />
          </>
        ) : null}
      </div>
      {section?.audio ? (
        <audio src={section.audio} autoPlay muted={!soundOn} />
      ) : null}
      <Content
        story={story}
        camera={camera}
        chapterId={chapterId}
        onSectionClicked={onPoiChanged}
        onChapterIdChanged={onChapterChanged}
      />
    </div>
  );
}
