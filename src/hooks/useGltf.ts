import { useEffect, useRef, useState } from 'react';
import { Logger } from '../simpleLog';
import { ResourceLoader } from '../artefactViewer/resourceLoader';
import { IStory } from '../model';
import { SceneParser } from '../artefactViewer';

const log = new Logger('hook::useGltf');

/**
 * Loads a gltf file. Creates 2 react states.
 * One will be set to the GLTF once the load finishes.
 * The other will be set to the progress of the loading process.
 * @param src url pointing to the gltf file
 * @returns the gltf and gltfProgress states
 */
export function useGltf(
  baseResourceUrl: string,
  story: IStory
): [SceneParser | null, ProgressEvent | null] {
  const loaderRef = useRef(new ResourceLoader(baseResourceUrl));
  const [gltf, setGltf] = useState<SceneParser | null>(null);
  const [gltfProgress, setGltfProgress] = useState<ProgressEvent | null>(null);

  // sync src with gltf state
  useEffect(() => {
    const src = story.gltfUrl;
    log.info('hook useGltf src=', src);

    // set by teardown to signal that the completed request should be ignored
    let canceled = false;

    async function load() {
      try {
        const gltfPromise = loaderRef.current.loadGltf(src, p =>
          setGltfProgress(p)
        );
        const spriteUrls = story.content.map(s => s.sprite);
        const spritesPromise = loaderRef.current.loadSprites(spriteUrls);

        const [gltf, sprites] = await Promise.all([
          gltfPromise,
          spritesPromise,
        ]);

        if (canceled) {
          return;
        }

        const spriteIdToTexture = new Map(
          story.content.map((s, i) => [s.camera, sprites[i]])
        );
        // todo: create a validating parser for IStory
        const poiGroups = new Map(
          story.chapters.map(ch => [ch.id, ch.cameras])
        );
        const sceneParser = SceneParser.parse(
          gltf,
          spriteIdToTexture,
          poiGroups
        );

        setGltf(sceneParser);
        log.info('hook useGltf loaded', gltf);
      } catch (err) {
        setGltf(null);
        log.warn(err);
      }
    }

    if (src.trim() !== '') {
      void load();
    }

    return () => {
      log.info('hook useGltf teardown', src);
      // if this gets resolved then do a proper cancel of the fetch
      // https://github.com/mrdoob/three.js/issues/20705
      // Alternative is for us do do the fetch into buffers and use loader.parse
      canceled = true;
    };
  }, [story]);

  return [gltf, gltfProgress];
}
