export interface IStorySection {
  title: string;
  html: string;
  // camera name is the id of a section and identifies the poi
  camera: string;
  materialVariant?: string;
  animations?: string[];
  overlayHtml?: string;
  sprite?: string;
  audio?: string;
}

/** a collection of Sections */
export interface IStoryChapter {
  id: string;
  title: string;
  cameras: string[];
}

export interface IStory {
  title: string;
  content: IStorySection[];
  gltfUrl: string;
  chapters: IStoryChapter[];
}

export const NULL_STORY: IStory = {
  title: 'No story loaded',
  gltfUrl: '',
  content: [
    {
      title: 'No story loaded',
      html: '<p> no story loaded </p>',
      camera: '',
    },
  ],
  chapters: [{ id: '', title: 'chapter', cameras: [''] }],
};
