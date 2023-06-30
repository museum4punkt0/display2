import React, { useState } from 'react';
import { SceneManagerLoadInfo } from '../../artefactViewer';
import './Controls.css';

function SelectStr({
  options,
  initial,
  title,
  onChange,
}: {
  options: string[];
  initial: string;
  title: string;
  onChange: (val: string) => void;
}) {
  if (!options.length) {
    return null;
  }
  const opts = options.map(opt => (
    <option key={opt} value={opt}>
      {opt === '' ? '[default]' : opt}
    </option>
  ));

  return (
    <select
      value={initial}
      onChange={e => onChange(e.target.value)}
      title={title}
    >
      {opts}
    </select>
  );
}

export function Controls({
  info,
  material,
  camera,
  exposure,
  env,
  soundOn,
  spritesOn,
  onMaterialChange,
  onCameraChange,
  onEnvChange,
  onToggleSprites,
  onToggleSound,
  onResetCamera,
  onExposureChange,
  onToggleShadow,
}: {
  info: SceneManagerLoadInfo;
  material: string;
  camera: string;
  exposure: number;
  env: string;
  soundOn: boolean;
  spritesOn: boolean;
  onMaterialChange: (mat: string) => void;
  onCameraChange: (cam: string) => void;
  onEnvChange: (env: string) => void;
  onToggleSprites: () => void;
  onToggleSound: () => void;
  onResetCamera: () => void;
  onToggleShadow: () => void;
  onExposureChange: (ex: number) => void;
}) {
  const [extrasVisible, setExtrasVisible] = useState(false);

  return (
    <>
      {extrasVisible ? (
        <div className='extraControls Controls'>
          <SelectStr
            options={info.materialVariants}
            initial={material}
            title='pick a skin'
            onChange={onMaterialChange}
          />
          <SelectStr
            options={info.cameras}
            initial={camera}
            title={'look through camera'}
            onChange={onCameraChange}
          />
          <SelectStr
            options={info.environments}
            initial={env}
            title={'environment'}
            onChange={onEnvChange}
          />
          <input
            type='range'
            min={0}
            max={1}
            step={0.05}
            value={exposure}
            title='exposure'
            onChange={e => onExposureChange(parseFloat(e.target.value))}
          />
          <button onClick={onToggleShadow} title='shadows'>
            ◪
          </button>
        </div>
      ) : null}

      <div className='mainControls Controls'>
        <button onClick={_e => setExtrasVisible(!extrasVisible)} title='more' className={extrasVisible? 'on': 'off'}>
          ...
        </button>
        <button onClick={onToggleSound} title='toggle sound' className={soundOn? 'on': 'off'}>
          {soundOn ? '🔊' : '🔇'}
        </button>
        <button onClick={onToggleSprites} title='view points of interest' className={spritesOn? 'on': 'off'}>
          {spritesOn ? '👁' : '👁'}
        </button>
        <button onClick={onResetCamera} title='reset camera'>
          🧭
        </button>
      </div>
    </>
  );
}
