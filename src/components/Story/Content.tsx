import React from 'react';
import { IStory, IStoryChapter, IStorySection } from '../../model';
import { Logger } from '../../simpleLog';
import './Content.css';

const log = new Logger('component::Content');

function ContentSection({ section }: { section: IStorySection }) {
  return (
    <section data-cam={section.camera} key={section.camera}>
      <p className='title'>
        <span>{section.title}</span>
      </p>
      <p dangerouslySetInnerHTML={{ __html: section.html }} />
    </section>
  );
}

function ChaptersNav({
  chapters,
  activeId,
  onChanged,
}: {
  chapters: IStoryChapter[];
  activeId: string;
  onChanged: (chapterId: string) => void;
}) {
  const chapBtn = chapters.map(chapter => (
    <button
      key={chapter.id}
      title='go to chapter'
      className={chapter.id === activeId ? 'active' : ''}
      onClick={_ev => onChanged(chapter.id)}
    >
      {chapter.title}
    </button>
  ));
  return <div className='chaptersNav'>{chapBtn}</div>;
}

/** Renders description text for sections of the story
 * camera determines the visible slide, and chapter the visible chapter
 * if slide is not part of the chapter will show nothing
 */
export function Content({
  story,
  camera,
  chapterId,
  onSectionClicked,
  onChapterIdChanged,
}: {
  story: IStory;
  camera: string;
  chapterId: string;
  onSectionClicked: (section: IStorySection) => void;
  onChapterIdChanged: (chapterId: string) => void;
}) {
  const chapter = story.chapters.find(chapter => chapter.id === chapterId);
  if (!chapter) {
    return null;
  }
  const section = story.content.find(section => section.camera === camera);
  const slideIx = chapter.cameras.indexOf(camera);

  let content;
  if (!section || slideIx === -1) {
    log.warn(
      `requested section ${camera} is not part of the requested chapter ${chapterId}`
    );
    content = null;
  } else {
    content = <ContentSection section={section} />;
  }

  /** modulo function cause js is insane and -1 % 2 == -1 */
  function mod(a: number, b: number) {
    return ((a % b) + b) % b;
  }

  function navSlide(delta: number) {
    if (!chapter) {
      log.warn('assert fail: no chapter');
      return;
    }
    log.info(`navigate to chapter ${chapterId} section ${camera}`);
    const newIx = mod(slideIx + delta, chapter.cameras.length);
    const newCamId = chapter.cameras[newIx];
    const newSection = story.content.find(
      section => section.camera === newCamId
    );
    if (!newSection) {
      log.warn(
        'assert fail no poi for chapter camera',
        newCamId,
        'chapter cameras',
        chapter.cameras
      );
      return;
    }
    onSectionClicked(newSection);
  }

  return (
    <div className='View3dContent'>
      <div className='header'>
        <button title='previous point of interest' onClick={_ev => navSlide(-1)} className="button-previous"> 🡨 </button>
        <p className='storyTitle'>{story.title}</p>
        <button title='next point of interest' onClick={_ev => navSlide(+1)} className="button-next"> 🡪 </button>
      </div>
      <article>{content}</article>
      <ChaptersNav
        chapters={story.chapters}
        activeId={chapter.id}
        onChanged={onChapterIdChanged}
      />
    </div>
  );
}
