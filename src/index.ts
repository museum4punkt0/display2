/**
 * The @smb/display package exports the Viewer component.
 * It displays and interacts with SMB 3d models.
 */
export { Viewer } from './components';
export { IStory, IStorySection } from './model';
export { createScene, disposeScene } from './sceneCreator';
export const VERSION = '2.0.0';
export { logConfig } from './simpleLog';
export { _glb2storyJson } from './glb2storyJson';

// consider exporting these in a development build
// export { View3d, View3dMutRef, IView3dProps } from './components/View3d/View3d';
// export * from './artefactViewer';
