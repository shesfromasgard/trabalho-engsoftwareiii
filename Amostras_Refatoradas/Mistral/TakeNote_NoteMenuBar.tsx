import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Eye,
  Edit,
  Star,
  Trash2,
  Download,
  RefreshCw,
  Loader,
  Settings,
  Sun,
  Moon,
  Clipboard as ClipboardIcon,
} from 'react-feather';

import { TestID } from '@resources/TestID';
import { LastSyncedNotification } from '@/components/LastSyncedNotification';
import { NoteItem, CategoryItem } from '@/types';
import {
  toggleSettingsModal,
  togglePreviewMarkdown,
  toggleDarkTheme,
  updateCodeMirrorOption,
} from '@/slices/settings';
import { toggleFavoriteNotes, toggleTrashNotes } from '@/slices/note';
import { getCategories, getNotes, getSync, getSettings } from '@/selectors';
import { downloadNotes, isDraftNote, getShortUuid, copyToClipboard } from '@/utils/helpers';
import { sync } from '@/slices/sync';

const COPY_SUCCESS_MESSAGE = 'Note copied!';
const COPY_TIMEOUT_MS = 3000;

export const NoteMenuBar: React.FC = () => {
  const { notes, activeNoteId } = useSelector(getNotes);
  const { categories } = useSelector(getCategories);
  const { syncing, lastSynced, pendingSync } = useSelector(getSync);
  const { darkTheme } = useSelector(getSettings);

  const activeNote = useMemo(
    () => notes.find((note) => note.id === activeNoteId),
    [notes, activeNoteId]
  );
  const shortNoteUuid = useMemo(() => getShortUuid(activeNoteId), [activeNoteId]);

  const [uuidCopiedText, setUuidCopiedText] = useState<string>('');
  const [isPreviewToggled, setIsPreviewToggled] = useState<boolean>(false);

  useEffect(() => {
    if (uuidCopiedText === COPY_SUCCESS_MESSAGE) {
      const timer = setTimeout(() => setUuidCopiedText(''), COPY_TIMEOUT_MS);
      return () => clearTimeout(timer);
    }
  }, [uuidCopiedText]);

  const dispatch = useDispatch();

  const togglePreviewMarkdownAction = useCallback(
    () => dispatch(togglePreviewMarkdown()),
    [dispatch]
  );
  const toggleTrashNotesAction = useCallback(
    (noteId: string) => dispatch(toggleTrashNotes(noteId)),
    [dispatch]
  );
  const toggleFavoriteNotesAction = useCallback(
    (noteId: string) => dispatch(toggleFavoriteNotes(noteId)),
    [dispatch]
  );
  const syncAction = useCallback(
    (notes: NoteItem[], categories: CategoryItem[]) => dispatch(sync({ notes, categories })),
    [dispatch]
  );
  const toggleSettingsModalAction = useCallback(
    () => dispatch(toggleSettingsModal()),
    [dispatch]
  );
  const toggleDarkThemeAction = useCallback(
    () => dispatch(toggleDarkTheme()),
    [dispatch]
  );
  const updateCodeMirrorOptionAction = useCallback(
    (key: string, value: unknown) => dispatch(updateCodeMirrorOption({ key, value })),
    [dispatch]
  );

  const handleDownloadNotes = useCallback(
    () => downloadNotes([activeNote], categories),
    [activeNote, categories]
  );
  const handleFavoriteNote = useCallback(
    () => toggleFavoriteNotesAction(activeNoteId),
    [activeNoteId, toggleFavoriteNotesAction]
  );
  const handleTrashNote = useCallback(
    () => toggleTrashNotesAction(activeNoteId),
    [activeNoteId, toggleTrashNotesAction]
  );
  const handleSyncNotes = useCallback(
    () => syncAction(notes, categories),
    [notes, categories, syncAction]
  );
  const handleSettings = useCallback(
    () => toggleSettingsModalAction(),
    [toggleSettingsModalAction]
  );
  const handleToggleDarkTheme = useCallback(() => {
    toggleDarkThemeAction();
    updateCodeMirrorOptionAction('theme', darkTheme ? 'base16-light' : 'new-moon');
  }, [darkTheme, toggleDarkThemeAction, updateCodeMirrorOptionAction]);
  const handleTogglePreview = useCallback(() => {
    setIsPreviewToggled((prev) => !prev);
    togglePreviewMarkdownAction();
  }, [togglePreviewMarkdownAction]);
  const handleCopyUuid = useCallback(() => {
    copyToClipboard(`{{${shortNoteUuid}}}`);
    setUuidCopiedText(COPY_SUCCESS_MESSAGE);
  }, [shortNoteUuid]);

  const renderPreviewButton = () => (
    <button
      className="note-menu-bar-button"
      onClick={handleTogglePreview}
      data-testid={TestID.PREVIEW_MODE}
    >
      {isPreviewToggled ? (
        <Edit aria-hidden="true" size={18} />
      ) : (
        <Eye aria-hidden="true" size={18} />
      )}
      <span className="sr-only">{isPreviewToggled ? 'Edit note' : 'Preview note'}</span>
    </button>
  );

  const renderNoteActionButtons = () => (
    <>
      {!activeNote?.scratchpad && (
        <>
          <button className="note-menu-bar-button" onClick={handleFavoriteNote}>
            <Star aria-hidden="true" size={18} />
            <span className="sr-only">Add note to favorites</span>
          </button>
          <button className="note-menu-bar-button trash" onClick={handleTrashNote}>
            <Trash2 aria-hidden="true" size={18} />
            <span className="sr-only">Delete note</span>
          </button>
        </>
      )}
      <button className="note-menu-bar-button">
        <Download aria-hidden="true" size={18} onClick={handleDownloadNotes} />
        <span className="sr-only">Download note</span>
      </button>
      <button
        className="note-menu-bar-button uuid"
        onClick={handleCopyUuid}
        data-testid={TestID.UUID_MENU_BAR_COPY_ICON}
      >
        <ClipboardIcon aria-hidden="true" focusable="false" size={18} />
        {uuidCopiedText && <span className="uuid-copied-text">{uuidCopiedText}</span>}
        <span className="sr-only">Copy note</span>
      </button>
    </>
  );

  const renderSyncButton = () => (
    <button
      className="note-menu-bar-button"
      onClick={handleSyncNotes}
      data-testid={TestID.TOPBAR_ACTION_SYNC_NOTES}
    >
      {syncing ? (
        <Loader aria-hidden="true" size={18} className="rotating-svg" />
      ) : (
        <RefreshCw aria-hidden="true" size={18} />
      )}
      <span className="sr-only">Sync notes</span>
    </button>
  );

  const renderThemeButton = () => (
    <button className="note-menu-bar-button" onClick={handleToggleDarkTheme}>
      {darkTheme ? (
        <Sun aria-hidden="true" size={18} />
      ) : (
        <Moon aria-hidden="true" size={18} />
      )}
      <span className="sr-only">Themes</span>
    </button>
  );

  const renderSettingsButton = () => (
    <button className="note-menu-bar-button" onClick={handleSettings}>
      <Settings aria-hidden="true" size={18} />
      <span className="sr-only">Settings</span>
    </button>
  );

  return (
    <section className="note-menu-bar">
      {activeNote && !isDraftNote(activeNote) ? (
        <nav>
          {renderPreviewButton()}
          {renderNoteActionButtons()}
        </nav>
      ) : (
        <div />
      )}
      <nav>
        <LastSyncedNotification
          datetime={lastSynced}
          pending={pendingSync}
          syncing={syncing}
        />
        {renderSyncButton()}
        {renderThemeButton()}
        {renderSettingsButton()}
      </nav>
    </section>
  );
};