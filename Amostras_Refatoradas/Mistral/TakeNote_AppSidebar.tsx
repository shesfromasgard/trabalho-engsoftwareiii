import React from 'react';
import { Plus } from 'react-feather';
import { useDispatch, useSelector } from 'react-redux';

import { LabelText } from '@resources/LabelText';
import { TestID } from '@resources/TestID';
import { ActionButton } from '@/components/AppSidebar/ActionButton';
import { FolderOption } from '@/components/AppSidebar/FolderOption';
import { ScratchpadOption } from '@/components/AppSidebar/ScratchpadOption';
import { Folder, NotesSortKey } from '@/utils/enums';
import { CategoryList } from '@/containers/CategoryList';
import {
  addNote,
  swapFolder,
  updateActiveNote,
  assignFavoriteToNotes,
  assignTrashToNotes,
  updateSelectedNotes,
  unassignTrashFromNotes,
} from '@/slices/note';
import { togglePreviewMarkdown } from '@/slices/settings';
import { getSettings, getNotes } from '@/selectors';
import { NoteItem } from '@/types';
import { newNoteHandlerHelper, getActiveNote } from '@/utils/helpers';

// ===========================================================================
// Types
// ===========================================================================

type DispatchActions = {
  addNote: (note: NoteItem) => void;
  updateActiveNote: (noteId: string, multiSelect: boolean) => void;
  updateSelectedNotes: (noteId: string, multiSelect: boolean) => void;
  swapFolder: (folder: Folder, sortOrderKey: NotesSortKey) => void;
  togglePreviewMarkdown: () => void;
  assignTrashToNotes: (noteId: string) => void;
  unassignTrashFromNotes: (noteId: string) => void;
  assignFavoriteToNotes: (noteId: string) => void;
};

type Selectors = {
  activeCategoryId: string;
  activeFolder: Folder;
  activeNoteId: string;
  notes: NoteItem[];
  previewMarkdown: boolean;
  notesSortKey: NotesSortKey;
};

// ===========================================================================
// Hooks
// ===========================================================================

const useAppSidebarSelectors = (): Selectors => {
  const { activeCategoryId, activeFolder, activeNoteId, notes } = useSelector(getNotes);
  const { previewMarkdown, notesSortKey } = useSelector(getSettings);
  return {
    activeCategoryId,
    activeFolder,
    activeNoteId,
    notes,
    previewMarkdown,
    notesSortKey,
  };
};

const useAppSidebarDispatch = (): DispatchActions => {
  const dispatch = useDispatch();

  return {
    addNote: (note: NoteItem) => dispatch(addNote(note)),
    updateActiveNote: (noteId: string, multiSelect: boolean) =>
      dispatch(updateActiveNote({ noteId, multiSelect })),
    updateSelectedNotes: (noteId: string, multiSelect: boolean) =>
      dispatch(updateSelectedNotes({ noteId, multiSelect })),
    swapFolder: (folder: Folder, sortOrderKey: NotesSortKey) =>
      dispatch(swapFolder({ folder, sortOrderKey })),
    togglePreviewMarkdown: () => dispatch(togglePreviewMarkdown()),
    assignTrashToNotes: (noteId: string) => dispatch(assignTrashToNotes(noteId)),
    unassignTrashFromNotes: (noteId: string) => dispatch(unassignTrashFromNotes(noteId)),
    assignFavoriteToNotes: (noteId: string) => dispatch(assignFavoriteToNotes(noteId)),
  };
};

// ===========================================================================
// Handlers
// ===========================================================================

const useAppSidebarHandlers = (
  selectors: Selectors,
  dispatchActions: DispatchActions
) => {
  const { activeFolder, previewMarkdown, activeNote, activeCategoryId, notesSortKey } = selectors;

  const swapFolderHandler = (folder: Folder) => {
    dispatchActions.swapFolder(folder, notesSortKey);
  };

  const newNoteHandler = () => {
    newNoteHandlerHelper(
      activeFolder,
      previewMarkdown,
      getActiveNote(notes, activeNoteId),
      activeCategoryId,
      swapFolderHandler,
      dispatchActions.togglePreviewMarkdown,
      dispatchActions.addNote,
      dispatchActions.updateActiveNote,
      dispatchActions.updateSelectedNotes
    );
  };

  return {
    newNoteHandler,
    swapFolderHandler,
  };
};

// ===========================================================================
// Folder Options Configuration
// ===========================================================================

const FOLDER_OPTIONS = [
  {
    folder: Folder.SCRATCHPAD,
    component: ScratchpadOption,
  },
  {
    folder: Folder.ALL,
    component: FolderOption,
    props: {
      text: LabelText.NOTES,
      dataTestID: TestID.FOLDER_NOTES,
      addNoteType: (noteId: string) => dispatch(unassignTrashFromNotes(noteId)),
    },
  },
  {
    folder: Folder.FAVORITES,
    component: FolderOption,
    props: {
      text: LabelText.FAVORITES,
      dataTestID: TestID.FOLDER_FAVORITES,
      addNoteType: (noteId: string) => dispatch(assignFavoriteToNotes(noteId)),
    },
  },
  {
    folder: Folder.TRASH,
    component: FolderOption,
    props: {
      text: LabelText.TRASH,
      dataTestID: TestID.FOLDER_TRASH,
      addNoteType: (noteId: string) => dispatch(assignTrashToNotes(noteId)),
    },
  },
];

// ===========================================================================
// Component
// ===========================================================================

export const AppSidebar: React.FC = () => {
  const selectors = useAppSidebarSelectors();
  const dispatchActions = useAppSidebarDispatch();
  const { newNoteHandler, swapFolderHandler } = useAppSidebarHandlers(
    selectors,
    dispatchActions
  );

  return (
    <aside className="app-sidebar">
      <ActionButton
        dataTestID={TestID.SIDEBAR_ACTION_CREATE_NEW_NOTE}
        handler={newNoteHandler}
        icon={Plus}
        label={LabelText.CREATE_NEW_NOTE}
        text={LabelText.NEW_NOTE}
      />
      <section className="app-sidebar-main">
        {FOLDER_OPTIONS.map((option) => {
          const { folder, component: Component, props = {} } = option;
          const isActive = selectors.activeFolder === folder;
          return (
            <Component
              key={folder}
              active={isActive}
              swapFolder={swapFolderHandler}
              folder={folder}
              {...props}
            />
          );
        })}
        <CategoryList />
      </section>
    </aside>
  );
};