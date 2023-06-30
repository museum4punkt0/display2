import type { Meta, StoryObj } from '@storybook/react';

import { View3d } from './View3d';
import { ISceneManagerAssets } from '../../artefactViewer/sceneManager';
import { NULL_STORY } from '../../model';

const meta: Meta<typeof View3d> = {
  title: 'View3d',
  component: View3d,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof View3d>;

const commonArgs: {baseResourceUrl: string, viewerAssets: ISceneManagerAssets} = {
  baseResourceUrl : '',
  viewerAssets : {
    sprite: 'sprite.png',
    envTextures: [
      ['indoor', 'Indoor.jpg'],
      ['outdoor', 'Outdoor.jpg'],
      ['evening', 'OutdoorEvening.jpg'] 
    ]
  },
}
/** If source is empty the component renders the default scene in debug mode */
export const Empty: Story = {
  args: {
    ... commonArgs,
    story: NULL_STORY
  },
};

/** The simplest gltf file */
export const ABox: Story = {
  args: {
    ... commonArgs,
    story: {...NULL_STORY, gltfUrl:'Box.glb'} 
  },
};

/** Off-center geometry will show in center. Debug enabled */
export const OffCenter: Story = {
  args: {
    ... commonArgs,
    story: {...NULL_STORY, gltfUrl: 'off_center_cubes.glb'},
    debug: true,
  },
};

/** Tiny geometry. The camera will zoom in on it. Debug enabled */
export const OffCenterOffScale: Story = {
  args: {
    ... commonArgs,
    story: {...NULL_STORY, gltfUrl: 'off_center_off_scale_cubes.glb'},
    debug: true,
  },
};

/** Loading lights from gltf */
export const Lights: Story = {
  args: {
    ... commonArgs,
    story: {...NULL_STORY, gltfUrl: 'test_lights.glb'},
    environment: ''
  },
};

/**
 * Showcases image based lighting with a physically based rendering setup.
 * Notice reflections of the environment map on shiny materials and soft illumination.
 */
export const MaterialsAndPbr: Story = {
  args: {
    ... commonArgs,
    story: {...NULL_STORY, gltfUrl: 'materials.glb'},
    environment: 'outdoor',
  },
};

/** Contrast point lighting with pbr one */
export const MaterialsNoPbr: Story = {
  args: {
    ... commonArgs,
    story: {...NULL_STORY, gltfUrl: 'materials.glb'},
  },
};

/** The reference example */
export const Vase: Story = {
  args: {
    ... commonArgs,
    story: {...NULL_STORY, gltfUrl: 'vase.glb'},
    environment: 'indoor',
  },
};

const complexSceneArgTypes = {
  camera: {
    options: ['', 'Camera', 'Camera_top', 'Camera_animated_baked', 'Camera_front'],
    control: { type: 'radio' },
  },
  materialVariant: { options: ['uv', 'plastic-C'], control: { type: 'radio' } },
  animations: {
    options: [
      'text-CAction',
      'text-OAction',
      'text-DAction',
      'text-EAction',
      'text-MAction',
      'text-AAction',
      'text-RAction',
      'text-TAction',
    ],
    control: { type: 'check' },
  },
  exposure: {control: {type: 'range', min:0, max:1.5, step:0.1}}
};

/**
 * A complex scene containing
 *   * multiple materials, cameras and lights
 *   * geometry animations, an animated camera
 *   * a material variant for the floor mesh.
 * Also used to compare to high quality reference rendering in blender.
 */
export const ComplexScene: Story = {
  args: {
    ... commonArgs,
    story: {...NULL_STORY, gltfUrl: 'codemart.glb'},
    environment: 'evening',
  },
  argTypes: complexSceneArgTypes,
};

/** A complex scene with interest points sprites visible */
export const ComplexSceneSprites: Story = {
  args: {
    ... commonArgs,
    story: {
      title:'', 
      gltfUrl: 'codemart.glb',
      content: [
        { title: '', html:'', camera:'Camera'},
        { title: '', html:'', camera:'Camera_top', sprite: 'sprite-color.png'},
        { title: '', html:'', camera:'Camera_animated_baked', sprite: 'sprite-red.png'},
        { title: '', html:'', camera:'Camera_front', sprite: 'sprite-green.png'},
        { title: '', html:'', camera:'Camera__back', sprite: 'sprite-green.png'},
      ],
      chapters: [
        {id: 'foo', title: '', cameras: ['Camera', 'Camera_front']},
        {id: 'bar', title: '', cameras: ['Camera', 'Camera_top', 'Camera_animated_baked']},
        {id: 'baz', title: '', cameras: ['Camera_front', 'Camera__back']}
      ]
    },
    environment: '',
    spriteGroup: '*',
  },
  argTypes: complexSceneArgTypes,
};

/** A material variant for the complex scene */
export const ComplexSceneMaterialVariant: Story = {
  args: {
    ... commonArgs,
    story: {...NULL_STORY, gltfUrl: 'codemart.glb'},
    environment: '',
    materialVariant: 'uv',
  },
  argTypes: complexSceneArgTypes,
};

/** Animated objects in the complex scene */
export const ComplexSceneAnimated: Story = {
  args: {
    ... commonArgs,
    story: {...NULL_STORY, gltfUrl: 'codemart.glb'},
    environment: '',
    camera: 'Camera_front',
    animations: [
      'text-CAction',
      'text-OAction',
      'text-DAction',
      'text-EAction',
      'text-MAction',
      'text-AAction',
      'text-RAction',
      'text-TAction',
    ],
  },
  argTypes: complexSceneArgTypes,
};

/** the complex scene from a built in camera perspective */
export const ComplexSceneAnimatedTopCamera: Story = {
  args: {
    ... commonArgs,
    story: {...NULL_STORY, gltfUrl: 'codemart.glb'},
    environment: '',
    camera: 'Camera_top',
    animations: [
      'text-CAction',
      'text-OAction',
      'text-DAction',
      'text-EAction',
      'text-MAction',
      'text-AAction',
      'text-RAction',
      'text-TAction',
    ],
  },
  argTypes: complexSceneArgTypes,
};

/** for testing camera interpolation */
export const OrientedSphere: Story = {
  args: {
    ... commonArgs,
    story: {...NULL_STORY, gltfUrl: 'oriented-sphere.glb'},
    debug: true,
    materialVariant: 'default',
    spriteGroup: '*',
    environment: 'default'
  },
  argTypes: {
    camera: {
      options: [
        '',
        'cam-interior',
        'cam-interior2',
        'cam-non-normal',
        'cam-sphx',
        'cam-sphx-',
        'cam-sphy',
        'cam-sphy-tilted',
        'cam-sphymid',
        'cam-sphz',
        'cam-sphz-',
      ],
      control: { type: 'radio' },
    },
    materialVariant: { options: ['uv', 'default'], control: { type: 'radio' } },
  }
};
