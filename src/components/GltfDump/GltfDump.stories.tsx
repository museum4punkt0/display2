import type { Meta, StoryObj } from '@storybook/react';

import { GltfDump } from './GltfDump';

const meta: Meta<typeof GltfDump> = {
  title: 'GltfDump',
  component: GltfDump,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof GltfDump>;

/** Dump gltf file structure */
export const Lights: Story = {
  args: {
    src: 'test_lights.glb',
  },
};
