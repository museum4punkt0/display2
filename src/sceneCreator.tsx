import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { Viewer } from './components';

/**
 * Create a 3d scene inside a provided dom node
 * descriptionFileUrl points to a description file that contains at least a url to the gltf file.
 */
export function createScene(
  root: Element | DocumentFragment,
  descriptionFileUrl: string,
  baseResourceUrl = ''
): Root {
  const reactRoot = createRoot(root);
  reactRoot.render(
    <Viewer src={descriptionFileUrl} baseResourceUrl={baseResourceUrl} />
  );
  return reactRoot;
}

/** Disposes the scene. You must call this before you remove the associated Element form the dom. */
export function disposeScene(root: Root) {
  root.unmount();
}
