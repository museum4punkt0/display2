import React, { useEffect, useState } from 'react';
import { createScene } from '../../sceneCreator';
import { createRoot } from 'react-dom/client';
import { Viewer } from '../Viewer/Viewer';

// this sometimes fails
function Image3D({ fileName }: { fileName: string }) {
  return (
    <div id='test'>
      <Viewer src={fileName} baseResourceUrl={''} />;
    </div>
  );
}

// this reliably fails to dispose.
function Image3Dcreatescene({ fileName }: { fileName: string }) {
  function render3D(ref: Element) {
    return ref ? createScene(ref, `${fileName}`) : null;
  }
  return <div id='test' ref={(ref: HTMLDivElement) => render3D(ref)} />;
}

// never fails ...
function TestEffectDisposal({ fileName }: { fileName: string }) {
  const [foo, setFoo] = useState(0);
  useEffect(() => {
    console.log('effect called', fileName, foo);
    return () => {
      console.log('effect dispose called', fileName, foo);
    };
  }, [fileName, foo]);
  return (
    <div id='test'>
      {fileName}
      <button onClick={() => setFoo(foo + 1)}> foo : {foo}</button>
    </div>
  );
}

function TestEffectDisposalcreatescene({ fileName }: { fileName: string }) {
  function render(ref: Element) {
    if (!ref) return null;
    const reactRoot = createRoot(ref);
    reactRoot.render(<TestEffectDisposal fileName={fileName} />);
    return reactRoot;
  }

  return <div id='test' ref={(ref: HTMLDivElement) => render(ref)} />;
}

export const ModalImage3D = ({
  src = '',
  strict = false,
}: {
  src: string;
  strict: boolean;
}) => {
  const [show, setShow] = useState(0);

  const ret = (
    <div>
      <button
        onClick={() => {
          setShow(1);
        }}
      >
        show TestEffectDisposal
      </button>
      <button
        onClick={() => {
          setShow(2);
        }}
      >
        show TestEffectDisposal createscene
      </button>
      <button
        onClick={() => {
          setShow(3);
        }}
      >
        show Image3d
      </button>
      <button
        onClick={() => {
          setShow(4);
        }}
      >
        show Image3d createscene
      </button>
      <button
        onClick={() => {
          setShow(0);
        }}
      >
        hide
      </button>
      {show === 1 && <TestEffectDisposal fileName={src} />}
      {show === 2 && <TestEffectDisposalcreatescene fileName={src} />}
      {show === 3 && <Image3D fileName={src} />}
      {show === 4 && <Image3Dcreatescene fileName={src} />}
    </div>
  );

  if (strict) {
    return <React.StrictMode>{ret}</React.StrictMode>;
  } else {
    return ret;
  }
};
