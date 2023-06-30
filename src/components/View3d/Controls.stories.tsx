import type { Meta, StoryObj } from '@storybook/react';

import { Controls } from './Controls';
import { SceneManagerLoadInfo } from '../../artefactViewer/sceneManager';

const meta: Meta<typeof Controls> = {
  title: 'Controls',
  component: Controls,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Controls>;

const loadInfo = new SceneManagerLoadInfo();
loadInfo.cameras = ['cam1', 'cam2', 'cam3'];
loadInfo.animationTrackNames = ['anim1', 'anim2'];
loadInfo.environments = ['env1', 'env2'];
loadInfo.interestPointNames = ['cam1', 'cam2'];
loadInfo.materialVariants = ['', 'uv'];

export const Default: Story = {
  args: {
    info: loadInfo,
    material: 'uv',
    camera:'cam1',
    exposure: 1,
    env: 'env2',
  },
};
