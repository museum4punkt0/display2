import * as three from 'three';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';
import { Logger } from '../simpleLog';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { IResourceLoader } from './interfaces';
const log = new Logger('ResourceLoader');

/** texture loading.
 * todo: features should no longer load textures but receive them from callers that use this to fetch them
 */
export class ResourceLoader implements IResourceLoader {
  spriteTextureName: string;
  baseResourceUrl;
  textureLoader: three.TextureLoader;
  exrTextureLoader: EXRLoader;
  defaultTexture: three.Texture | null = null;
  gltfLoader: GLTFLoader;

  constructor(baseResourceUrl = '', spriteTextureName = 'sprite.png') {
    this.spriteTextureName = spriteTextureName;
    this.baseResourceUrl = baseResourceUrl;
    this.textureLoader = new three.TextureLoader();
    this.exrTextureLoader = new EXRLoader();
    this.gltfLoader = new GLTFLoader();
  }

  loadTexture(relativeUrl: string) {
    const url = this.baseResourceUrl + '/' + relativeUrl;
    let promise;
    if (relativeUrl.endsWith('.exr')) {
      promise = this.exrTextureLoader.loadAsync(url);
    } else {
      promise = this.textureLoader.loadAsync(url);
    }
    promise.catch(err => {
      log.warn('failed to load texture ', url, err);
    });
    return promise;
  }

  /** loads textures in parallel */
  async loadTextures(urls: string[]) {
    const promises = urls.map(async url => this.loadTexture(url));
    return await Promise.all(promises);
  }

  /** lazy-load if missing otherwise return cached */
  async _defaultSprite() {
    if (this.defaultTexture !== null) {
      return this.defaultTexture;
    }
    try {
      this.defaultTexture = await this.loadTexture(this.spriteTextureName);
      return this.defaultTexture;
    } catch {
      log.warn('default sprite texture failed to load', this.spriteTextureName);
      return new three.Texture();
    }
  }

  /** attempt to load a texture fall back to default one on failure or missing url */
  async _loadSprite(url?: string) {
    if (!url || url.trim() === '') {
      return await this._defaultSprite();
    }
    try {
      return await this.loadTexture(url);
    } catch {
      log.warn('could not load texture at', url, 'using default one');
      return await this._defaultSprite();
    }
  }

  /** loads sprites in parallel.  */
  async loadSprites(urls: (string | undefined)[]) {
    const promises = urls.map(async url => this._loadSprite(url));
    return await Promise.all(promises);
  }

  async loadGltf(
    url: string,
    onProgress: ((event: ProgressEvent<EventTarget>) => void) | undefined
  ) {
    return await this.gltfLoader.loadAsync(url, onProgress);
  }
}
