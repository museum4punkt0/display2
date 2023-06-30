import type { Meta, StoryObj } from '@storybook/react';
import { ModalImage3D } from './tstUnmount'

const meta: Meta<typeof ModalImage3D> = {
  title: 'ModalImage3D',
  component: ModalImage3D,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof ModalImage3D>;
/** A complex scene */
export const ComplexScene: Story = {
  args: {
    src: 'codemart.json',
  },
};