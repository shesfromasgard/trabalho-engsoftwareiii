import React from 'react';
import ReactMarkdown from 'react-markdown';
import { useDispatch } from 'react-redux';

import { Folder } from '@/utils/enums';
import { updateActiveNote, updateSelectedNotes, pruneNotes, swapFolder } from '@/slices/note';
import { NoteItem } from '@/types';

import { uuidPlugin } from '../../utils/reactMarkdownPlugins';
import NoteLink from './NoteLink';

export interface PreviewEditorProps {
  noteText: string;
  directionText: string;
  notes: NoteItem[];
}

const useNoteDispatch = () => {
  const dispatch = useDispatch();

  const updateSelectedNotes = (noteId: string, multiSelect: boolean) => {
    dispatch(updateSelectedNotes({ noteId, multiSelect }));
  };

  const updateActiveNote = (noteId: string, multiSelect: boolean) => {
    dispatch(updateActiveNote({ noteId, multiSelect }));
  };

  const pruneNotes = () => {
    dispatch(pruneNotes());
  };

  const swapFolder = (folder: Folder) => {
    dispatch(swapFolder({ folder }));
  };

  return {
    updateSelectedNotes,
    updateActiveNote,
    pruneNotes,
    swapFolder,
  };
};

const useNoteLinkHandler = (
  updateActiveNote: (noteId: string, multiSelect: boolean) => void,
  updateSelectedNotes: (noteId: string, multiSelect: boolean) => void,
  pruneNotes: () => void,
  swapFolder: (folder: Folder) => void
) => {
  const handleNoteLinkClick = (e: React.SyntheticEvent, note: NoteItem) => {
    e.preventDefault();

    if (!note) return;

    updateActiveNote(note.id, false);
    updateSelectedNotes(note.id, false);
    pruneNotes();

    const folderMap = {
      [Folder.FAVORITES]: note.favorite,
      [Folder.SCRATCHPAD]: note.scratchpad,
      [Folder.TRASH]: note.trash,
      [Folder.ALL]: true,
    };

    const targetFolder = Object.entries(folderMap).find(([_, condition]) => condition)?.[0];
    if (targetFolder) {
      swapFolder(targetFolder as Folder);
    }
  };

  return { handleNoteLinkClick };
};

const NoteLinkRenderer: React.FC<{ value: string; notes: NoteItem[]; handleNoteLinkClick: (e: React.SyntheticEvent, note: NoteItem) => void }> = (
  { value, notes, handleNoteLinkClick }
) => {
  return <NoteLink uuid={value} notes={notes} handleNoteLinkClick={handleNoteLinkClick} />;
};

export const PreviewEditor: React.FC<PreviewEditorProps> = ({ noteText, directionText, notes }) => {
  const { updateSelectedNotes, updateActiveNote, pruneNotes, swapFolder } = useNoteDispatch();
  const { handleNoteLinkClick } = useNoteLinkHandler(updateActiveNote, updateSelectedNotes, pruneNotes, swapFolder);

  return (
    <ReactMarkdown
      plugins={[uuidPlugin]}
      renderers={{
        uuid: ({ value }) => (
          <NoteLinkRenderer value={value} notes={notes} handleNoteLinkClick={handleNoteLinkClick} />
        ),
      }}
      linkTarget="_blank"
      className={`previewer previewer_direction-${directionText}`}
      source={noteText}
    />
  );
};