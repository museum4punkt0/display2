import type { Meta, StoryObj } from '@storybook/react';
import { Content } from './Content';

const meta: Meta<typeof Content> = {
  title: 'Content',
  component: Content,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Content>;

function blabla(nlines: number){
  let ret = [''];
  for(let i =0; i< nlines; i++){
    const bla = [];
    for(let _j = 0; _j < nlines *2; _j++){
      bla.push('bla')
    }
    ret.push(`<p> ${bla.join(' ')}</p>`)
  }
  return ret.join(' ')
}

const storyA = {
  title:'Story title', 
  gltfUrl: 'codemart.glb',
  content: [
    { title: 'poi Camera', html:'', camera:'Camera'},
    { title: 'poi Camera_top', html:'', camera:'Camera_top', sprite: 'sprite-color.png'},
    { title: 'poi Camera_animated_baked', html:'', camera:'Camera_animated_baked', sprite: 'sprite-red.png'},
    { title: 'poi Camera_front', html: blabla(8), camera:'Camera_front', sprite: 'sprite-green.png'},
    { title: 'poi Camera__back', html: blabla(18), camera:'Camera__back', sprite: 'sprite-green.png'},
  ],
  chapters: [
    {id: 'foo', title: 'foo', cameras: ['Camera', 'Camera_front']},
    {id: 'bar', title: 'bar', cameras: ['Camera', 'Camera_top', 'Camera_animated_baked']},
    {id: 'baz', title: 'baz', cameras: ['Camera_front', 'Camera__back']}
  ]
};

export const NullStory: Story = {
  args: {
    story: storyA,
    camera: 'Camera',
    chapterId: 'foo',
  },
};