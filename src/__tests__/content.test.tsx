import { render, screen, within } from '@testing-library/react';
import React from 'react';
import { Content } from '../components/Story/Content';
import { IStory, IStorySection } from '../model';

test('controls interaction', async () => {

  const sections: IStorySection[] = [
      {
        title: 'section1',
        html: '<p> section1 </p>',
        camera: 'cam1',
      },
      {
        title: 'section with overlay',
        html: '<p> section </p>',
        camera: 'cam3',
        overlayHtml: '<i> aaa </i>'
      }
    ]
  
    const story: IStory = {
      title: 'test',
      content: sections,
      gltfUrl: '',
      chapters: [{id:'ch1', cameras:['cam1', 'cam3'], title:'ch1'}]
    }

  const onSectionClicked = jest.fn()

  render(<Content story={story} camera={'cam3'} onSectionClicked={onSectionClicked} chapterId='ch1' onChapterIdChanged={chapterId=> undefined} />);

  const nextbtn = await screen.findByTitle('next point of interest');
  expect(nextbtn.parentElement).not.toBeNull();
  await nextbtn.click();
  expect(onSectionClicked).toBeCalled();

  const chapBtn = await screen.findByText('ch1');
  expect(chapBtn.parentElement).not.toBeNull();
  await chapBtn.click();
  expect(onSectionClicked).toBeCalled();
});