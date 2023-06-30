// cannot do a real test loading a gltf because jsdom does not support:
// fetch api, TextDecoder, Buffer.buffer instanceof Arraybuffer and others
// Despite attempts to polyfill all these the result is fragile and not working 
// Amazingly all these are available in node, so jest + jsdom is a really radically
// different runtime. Which raises the question: Do you trust any jest test in the 
// jsdom environment? As it's runtime is nowhere near to the one the code will run in.
import { useGltf } from '../hooks/useGltf';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { NULL_STORY } from '../model';

test('hook happy', async () => {
  function Tst({ src }: { src: string }) {
    const [gltf, progress] = useGltf('', {...NULL_STORY, gltfUrl:src});
    const done = progress?.loaded === progress?.total;
    return (
      <div>
        <span>{done ? 'done' : 'loading'}</span>
        <span>
          Gltf <pre>{gltf?.root.toJSON()}</pre>
        </span>
      </div>
    );
  }

  render(<Tst src='' />);
  await screen.findByText(/done/i);
});
