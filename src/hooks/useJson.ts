import { useEffect, useState } from 'react';
import { Logger } from '../simpleLog';

const log = new Logger('hook::useJson');

/**
 * Loads a json from the src url.
 * Creates a json react state and returns it.
 * Note: this will cast to T *without* checking that the json is compatible with T
 * Note: on error will fall back to fallback
 */
export function useJson<T>(src: string, fallback: T) {
  const [json, setJson] = useState<T>(fallback);

  useEffect(() => {
    let canceled = false;
    async function load() {
      try {
        const res = await fetch(src);

        if (canceled) return;

        if (
          !res.ok ||
          !res.headers.get('content-type')?.includes('application/json')
        ) {
          setJson(fallback);
          log.warn(`'can not load json from ${src}`);
          return;
        }
        const json = (await res.json()) as T;
        setJson(json);
      } catch (err) {
        setJson(fallback);
        log.warn(err);
      }
    }
    if (src.trim() !== '') {
      void load();
    }
    return () => {
      canceled = true;
    };
  }, [src, fallback]);

  return json;
}
