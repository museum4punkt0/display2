import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { Controls } from '../components/View3d/Controls';
import { SceneManagerLoadInfo } from '../artefactViewer';

test('controls interaction', async () => {

  const info = new SceneManagerLoadInfo();
  info.interestPointNames = ['poi1', 'poi2'];
  info.materialVariants = ['mv1', 'mv2'];
  info.animationTrackNames =['anim'];
  info.cameras = ['cam1', 'cam2', 'cam3'];
  info.environments = ['env'];

  const onCameraChange = jest.fn()
  const onCameraReset = jest.fn()
  const onPoiToggle = jest.fn()
  const onSomething = jest.fn();

  render(<Controls 
    info={info}
    material={'mv1'}
    camera={'cam2'}
    exposure={1}
    env={'env'}
    soundOn={false} 
    spritesOn={false} 
    onMaterialChange={onSomething}
    onCameraChange={onCameraChange}
    onEnvChange={onSomething}
    onToggleSprites={onPoiToggle}
    onResetCamera={onCameraReset}
    onToggleShadow={onSomething}
    onExposureChange={onSomething} 
    onToggleSound={onSomething}
    />);

  let el = await screen.findByTitle('view points of interest');
  act( () => el.click());
  expect(onPoiToggle).toBeCalled();
  el = await screen.findByTitle('reset camera');
  act(() => el.click());

  expect(onCameraReset).toBeCalled();

  el = await screen.findByTitle('more');
  act(() => el.click());
  const sel = await screen.findByTitle('look through camera') as HTMLSelectElement;
  expect(sel.value).toBe('cam2');
  act (() => fireEvent.change(sel, {target: {value: 'cam3'}}));
  expect(onCameraChange).toBeCalledWith('cam3');
});
