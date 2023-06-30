import type { Meta, StoryObj } from '@storybook/react';
import { Viewer } from './Viewer';

const meta: Meta<typeof Viewer> = {
  title: 'Viewer',
  component: Viewer,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Viewer>;
/** A complex scene */
export const ComplexScene: Story = {
  args: {
    src: 'codemart.json',
  },
};

export const ComplexSceneWithArmatures: Story = {
  args: {
    src: 'codemart3.glb.json',
  },
};

/** Testbed for camera motion */
export const OrientedSphere: Story = {
  args: {
    src: 'oriented-sphere.json',
  },
};