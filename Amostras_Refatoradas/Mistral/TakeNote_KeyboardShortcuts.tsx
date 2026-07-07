import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import prettier from 'prettier/standalone';
import parserMarkdown from 'prettier/parser-markdown';

import { useTempState } from '@/contexts/TempStateContext';
import { Folder, Shortcuts } from '@/utils/enums';
import { downloadNotes, getActiveNote, newNoteHandlerHelper } from '@/utils/helpers';
import { useKey } from '@/utils/hooks';
import {
  addNote,
  swapFolder,
  toggleTrashNotes,
  updateActiveNote,
  updateSelectedNotes,
  updateNote,
} from '@/slices/note';
import { sync } from '@/slices/sync';
import { getCategories, getNotes, getSettings } from '@/selectors';
import { CategoryItem, NoteItem } from '@/types';
import {
  toggleDarkTheme,
  togglePreviewMarkdown,
  updateCodeMirrorOption,
} from '@/slices/settings';

// --- Constants ---
const MARKDOWN_PARSER_CONFIG = {
  parser: 'markdown',
  plugins: [parserMarkdown],
};

const THEME_OPTIONS = {
  dark: 'new-moon',
  light: 'base16-light',
} as const;

// --- Helper Functions ---
const formatNoteWithPrettier = (note: NoteItem): NoteItem => {
  if (!note.text) return note;
  
  const formattedText = prettier.format(note.text, MARKDOWN_PARSER_CONFIG);
  return { ...note, text: formattedText };
};

const getNotesToDownload = (
  activeNote: NoteItem | null,
  notes: NoteItem[],
  selectedNotesIds: string[]
): NoteItem[] => {
  if (!activeNote || selectedNotesIds.length === 0) return [];
  
  return selectedNotesIds.includes(activeNote.id)
    ? notes.filter((note) => selectedNotesIds.includes(note.id))
    : [activeNote];
};

// --- Action Dispatchers ---
const useNoteActions = () => {
  const dispatch = useDispatch();

  const addNote = (note: NoteItem) => dispatch(addNote(note));
  const updateActiveNote = (noteId: string, multiSelect: boolean) =>
    dispatch(updateActiveNote({ noteId, multiSelect }));
  const updateSelectedNotes = (noteId: string, multiSelect: boolean) =>
    dispatch(updateSelectedNotes({ noteId, multiSelect }));
  const swapFolder = (folder: Folder) => dispatch(swapFolder({ folder }));
  const toggleTrashNotes = (noteId: string) => dispatch(toggleTrashNotes(noteId));
  const syncNotes = (notes: NoteItem[], categories: CategoryItem[]) =>
    dispatch(sync({ notes, categories }));
  const togglePreviewMarkdown = () => dispatch(togglePreviewMarkdown());
  const toggleDarkTheme = () => dispatch(toggleDarkTheme());
  const updateCodeMirrorOption = (key: string, value: string) =>
    dispatch(updateCodeMirrorOption({ key, value }));

  return {
    addNote,
    updateActiveNote,
    updateSelectedNotes,
    swapFolder,
    toggleTrashNotes,
    syncNotes,
    togglePreviewMarkdown,
    toggleDarkTheme,
    updateCodeMirrorOption,
  };
};

// --- Handlers ---
const useKeyboardShortcutHandlers = (
  activeFolder: Folder,
  previewMarkdown: boolean,
  activeNote: NoteItem | null,
  activeCategoryId: string,
  notes: NoteItem[],
  categories: CategoryItem[],
  selectedNotesIds: string[],
  darkTheme: boolean,
  actions: ReturnType<typeof useNoteActions>,
  setAddingTempCategory: (value: boolean) => void
) => {
  const {
    addNote,
    updateActiveNote,
    updateSelectedNotes,
    swapFolder,
    toggleTrashNotes,
    syncNotes,
    togglePreviewMarkdown,
    toggleDarkTheme,
    updateCodeMirrorOption,
  } = actions;

  const newNoteHandler = () =>
    newNoteHandlerHelper(
      activeFolder,
      previewMarkdown,
      activeNote,
      activeCategoryId,
      swapFolder,
      togglePreviewMarkdown,
      addNote,
      updateActiveNote,
      updateSelectedNotes
    );

  const newTempCategoryHandler = () => setAddingTempCategory(true);

  const trashNoteHandler = () => {
    if (activeNote) toggleTrashNotes(activeNote.id);
  };

  const syncNotesHandler = () => syncNotes(notes, categories);

  const downloadNotesHandler = () => {
    const notesToDownload = getNotesToDownload(activeNote, notes, selectedNotesIds);
    if (notesToDownload.length > 0) downloadNotes(notesToDownload, categories);
  };

  const togglePreviewMarkdownHandler = () => togglePreviewMarkdown();

  const toggleDarkThemeHandler = () => {
    toggleDarkTheme();
    updateCodeMirrorOption('theme', darkTheme ? THEME_OPTIONS.light : THEME_OPTIONS.dark);
  };

  const prettifyNoteHandler = () => {
    if (activeNote) {
      const updatedNote = formatNoteWithPrettier(activeNote);
      dispatch(updateNote(updatedNote));
    }
  };

  return {
    newNoteHandler,
    newTempCategoryHandler,
    trashNoteHandler,
    syncNotesHandler,
    downloadNotesHandler,
    togglePreviewMarkdownHandler,
    toggleDarkThemeHandler,
    prettifyNoteHandler,
  };
};

export const KeyboardShortcuts: React.FC = () => {
  // --- State and Selectors ---
  const { categories } = useSelector(getCategories);
  const { activeCategoryId, activeFolder, activeNoteId, notes, selectedNotesIds } =
    useSelector(getNotes);
  const { darkTheme, previewMarkdown } = useSelector(getSettings);

  const activeNote = getActiveNote(notes, activeNoteId);
  const { setAddingTempCategory } = useTempState();

  // --- Actions and Handlers ---
  const actions = useNoteActions();
  const handlers = useKeyboardShortcutHandlers(
    activeFolder,
    previewMarkdown,
    activeNote,
    activeCategoryId,
    notes,
    categories,
    selectedNotesIds,
    darkTheme,
    actions,
    setAddingTempCategory
  );

  // --- Keyboard Shortcuts ---
  useKey(Shortcuts.NEW_NOTE, handlers.newNoteHandler);
  useKey(Shortcuts.NEW_CATEGORY, handlers.newTempCategoryHandler);
  useKey(Shortcuts.DELETE_NOTE, handlers.trashNoteHandler);
  useKey(Shortcuts.SYNC_NOTES, handlers.syncNotesHandler);
  useKey(Shortcuts.DOWNLOAD_NOTES, handlers.downloadNotesHandler);
  useKey(Shortcuts.PREVIEW, handlers.togglePreviewMarkdownHandler);
  useKey(Shortcuts.TOGGLE_THEME, handlers.toggleDarkThemeHandler);
  useKey(Shortcuts.PRETTIFY, handlers.prettifyNoteHandler);

  return null;
};