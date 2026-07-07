import React, { useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  X,
  Command,
  Settings,
  Archive,
  Edit2,
  Download,
  DownloadCloud,
  UploadCloud,
} from 'react-feather';

import {
  toggleSettingsModal,
  updateCodeMirrorOption,
  togglePreviewMarkdown,
  toggleDarkTheme,
  updateNotesSortStrategy,
} from '@/slices/settings';
import { updateNotes, importNotes } from '@/slices/note';
import { logout } from '@/slices/auth';
import { importCategories } from '@/slices/category';
import { shortcutMap, notesSortOptions, directionTextOptions } from '@/utils/constants';
import { CategoryItem, NoteItem, ReactMouseEvent } from '@/types';
import { getSettings, getAuth, getNotes, getCategories } from '@/selectors';
import { Option } from '@/components/SettingsModal/Option';
import { Shortcut } from '@/components/SettingsModal/Shortcut';
import { SelectOptions } from '@/components/SettingsModal/SelectOptions';
import { IconButton } from '@/components/SettingsModal/IconButton';
import { NotesSortKey } from '@/utils/enums';
import { backupNotes, downloadNotes } from '@/utils/helpers';
import { Tabs } from '@/components/Tabs/Tabs';
import { TabPanel } from '@/components/Tabs/TabPanel';
import { LabelText } from '@resources/LabelText';
import { TestID } from '@resources/TestID';
import { IconButtonUploader } from '@/components/SettingsModal/IconButtonUploader';

export const SettingsModal: React.FC = () => {
  // Selectors
  const { codeMirrorOptions, isOpen, previewMarkdown, darkTheme, notesSortKey } = useSelector(getSettings);
  const { currentUser } = useSelector(getAuth);
  const { notes, activeFolder, activeCategoryId } = useSelector(getNotes);
  const { categories } = useSelector(getCategories);

  // Dispatch
  const dispatch = useDispatch();

  const handleToggleSettingsModal = useCallback(() => dispatch(toggleSettingsModal()), [dispatch]);
  const handleTogglePreviewMarkdown = useCallback(() => dispatch(togglePreviewMarkdown()), [dispatch]);
  const handleToggleDarkTheme = useCallback(() => dispatch(toggleDarkTheme()), [dispatch]);
  const handleUpdateNotesSortStrategy = useCallback(
    (sortBy: NotesSortKey) => dispatch(updateNotesSortStrategy(sortBy)),
    [dispatch]
  );
  const handleUpdateCodeMirrorOption = useCallback(
    (key: string, value: unknown) => dispatch(updateCodeMirrorOption({ key, value })),
    [dispatch]
  );
  const handleUpdateNotes = useCallback(
    (sortOrderKey: NotesSortKey) =>
      dispatch(updateNotes({ notes, activeFolder, activeCategoryId, sortOrderKey })),
    [dispatch, notes, activeFolder, activeCategoryId]
  );
  const handleImportBackup = useCallback(
    (notes: NoteItem[], categories: CategoryItem[]) => {
      dispatch(importNotes(notes));
      dispatch(importCategories(categories));
    },
    [dispatch]
  );
  const handleLogout = useCallback(() => dispatch(logout()), [dispatch]);

  // Refs
  const modalRef = useRef<HTMLDivElement>(null);

  // Handlers
  const handleDomClick = useCallback(
    (event: ReactMouseEvent) => {
      event.stopPropagation();
      if (modalRef.current && !modalRef.current.contains(event.target as HTMLDivElement)) {
        handleToggleSettingsModal();
      }
    },
    [handleToggleSettingsModal]
  );

  const handleEscPress = useCallback(
    (event: KeyboardEvent) => {
      event.stopPropagation();
      if (event.key === 'Escape' && isOpen) {
        handleToggleSettingsModal();
      }
    },
    [isOpen, handleToggleSettingsModal]
  );

  const handleToggleLineHighlight = useCallback(
    () => handleUpdateCodeMirrorOption('styleActiveLine', !codeMirrorOptions.styleActiveLine),
    [handleUpdateCodeMirrorOption, codeMirrorOptions.styleActiveLine]
  );

  const handleToggleScrollPastEnd = useCallback(
    () => handleUpdateCodeMirrorOption('scrollPastEnd', !codeMirrorOptions.scrollPastEnd),
    [handleUpdateCodeMirrorOption, codeMirrorOptions.scrollPastEnd]
  );

  const handleToggleLineNumbers = useCallback(
    () => handleUpdateCodeMirrorOption('lineNumbers', !codeMirrorOptions.lineNumbers),
    [handleUpdateCodeMirrorOption, codeMirrorOptions.lineNumbers]
  );

  const handleToggleDarkThemeWithOption = useCallback(() => {
    handleToggleDarkTheme();
    handleUpdateCodeMirrorOption('theme', darkTheme ? 'base16-light' : 'new-moon');
  }, [handleToggleDarkTheme, handleUpdateCodeMirrorOption, darkTheme]);

  const handleUpdateNotesSortStrategyWithUpdate = useCallback(
    (selectedOption: { value: NotesSortKey }) => {
      handleUpdateNotesSortStrategy(selectedOption.value);
      handleUpdateNotes(selectedOption.value);
    },
    [handleUpdateNotesSortStrategy, handleUpdateNotes]
  );

  const handleUpdateNotesDirection = useCallback(
    (selectedOption: { value: string }) => {
      handleUpdateCodeMirrorOption('direction', selectedOption.value);
    },
    [handleUpdateCodeMirrorOption]
  );

  const handleDownloadNotes = useCallback(
    () => downloadNotes(notes, categories),
    [notes, categories]
  );

  const handleBackupNotes = useCallback(
    () => backupNotes(notes, categories),
    [notes, categories]
  );

  const handleImportBackup = useCallback(
    async (json: File) => {
      const content = await json.text();
      const { notes: importedNotes, categories: importedCategories } = JSON.parse(content) as {
        notes: NoteItem[];
        categories: CategoryItem[];
      };

      if (!importedNotes || !importedCategories) return;
      handleImportBackup(importedNotes, importedCategories);
    },
    [handleImportBackup]
  );

  // Effects
  useEffect(() => {
    document.addEventListener('mousedown', handleDomClick);
    document.addEventListener('keydown', handleEscPress);

    return () => {
      document.removeEventListener('mousedown', handleDomClick);
      document.removeEventListener('keydown', handleEscPress);
    };
  }, [handleDomClick, handleEscPress]);

  if (!isOpen) return null;

  return (
    <div className="dimmer">
      <aside ref={modalRef} className="settings-modal">
        <header className="settings-modal-header">
          <button className="close-button" onClick={handleToggleSettingsModal}>
            <X size={20} />
          </button>

          <section className="profile flex">
            <div>
              {currentUser.avatar_url && (
                <img src={currentUser.avatar_url} alt="Profile" className="profile-picture" />
              )}
            </div>
            <div className="profile-details">
              <h3>{currentUser.name}</h3>
              <div className="subtitle">{currentUser.bio}</div>
            </div>
            <button onClick={handleLogout}>Log out</button>
          </section>
        </header>

        <section className="settings-content">
          <Tabs>
            <TabPanel label="Preferences" icon={Settings}>
              <Option
                title="Active line highlight"
                description="Controls whether the editor should highlight the active line"
                toggle={handleToggleLineHighlight}
                checked={codeMirrorOptions.styleActiveLine}
                testId={TestID.ACTIVE_LINE_HIGHLIGHT_TOGGLE}
              />
              <Option
                title="Display line numbers"
                description="Controls whether the editor should display line numbers"
                toggle={handleToggleLineNumbers}
                checked={codeMirrorOptions.lineNumbers}
                testId={TestID.DISPLAY_LINE_NUMS_TOGGLE}
              />
              <Option
                title="Scroll past end"
                description="Controls whether the editor will add blank space to the end of all files"
                toggle={handleToggleScrollPastEnd}
                checked={codeMirrorOptions.scrollPastEnd}
                testId={TestID.SCROLL_PAST_END_TOGGLE}
              />
              <Option
                title="Markdown preview"
                description="Controls whether markdown preview mode is enabled"
                toggle={handleTogglePreviewMarkdown}
                checked={previewMarkdown}
                testId={TestID.MARKDOWN_PREVIEW_TOGGLE}
              />
              <Option
                title="Dark mode"
                description="Controls the theme of the application and editor"
                toggle={handleToggleDarkThemeWithOption}
                checked={darkTheme}
                testId={TestID.DARK_MODE_TOGGLE}
              />
              <SelectOptions
                title="Sort By"
                description="Controls the sort strategy of the notes"
                onChange={handleUpdateNotesSortStrategyWithUpdate}
                options={notesSortOptions}
                selectedValue={notesSortKey}
                testId={TestID.SORT_BY_DROPDOWN}
              />
              <SelectOptions
                title="Text direction"
                description="Controls the direction of the text"
                onChange={handleUpdateNotesDirection}
                options={directionTextOptions}
                selectedValue={codeMirrorOptions.direction}
                testId={TestID.TEXT_DIRECTION_DROPDOWN}
              />
            </TabPanel>
            <TabPanel label="Keyboard shortcuts" icon={Command}>
              {shortcutMap.map((shortcut) => (
                <Shortcut key={shortcut.key} action={shortcut.action} letter={shortcut.key} />
              ))}
            </TabPanel>
            <TabPanel label="Data management" icon={Archive}>
              <p>Download all notes as Markdown files in a zip.</p>
              <IconButton
                dataTestID={TestID.SETTINGS_MODAL_DOWNLOAD_NOTES}
                handler={handleDownloadNotes}
                icon={Download}
                text={LabelText.DOWNLOAD_ALL_NOTES}
              />
              <p>Export TakeNote data as JSON.</p>
              <IconButton
                handler={handleBackupNotes}
                icon={DownloadCloud}
                text={LabelText.BACKUP_ALL_NOTES}
              />
              <p>Import TakeNote JSON file.</p>
              <IconButtonUploader
                dataTestID={TestID.UPLOAD_SETTINGS_BACKUP}
                accept=".json"
                handler={handleImportBackup}
                icon={UploadCloud}
                text={LabelText.IMPORT_BACKUP}
              />
            </TabPanel>
            <TabPanel label="About TakeNote" icon={Edit2}>
              <p>
                TakeNote is a minimalist note-taking web app for developers. Write in plain text or
                Markdown in an IDE-like environment.
              </p>
              <p>
                This app has no tracking or analytics and does not retain any user data. Notes are
                persisted in local storage and can be downloaded as Markdown files from the data
                management tab.
              </p>
              <p>
                TakeNote was created by{' '}
                <a href="https://www.taniarascia.com" target="_blank" rel="noreferrer">
                  Tania Rascia
                </a>{' '}
                with the help of{' '}
                <a
                  href="https://github.com/taniarascia/takenote/graphs/contributors"
                  target="_blank"
                  rel="noreferrer"
                >
                  the open-source community
                </a>
                .
              </p>
              <p>
                <a
                  className="button"
                  href="https://github.com/taniarascia/takenote"
                  target="_blank"
                  rel="noreferrer"
                >
                  View source
                </a>
              </p>
            </TabPanel>
          </Tabs>
        </section>
      </aside>
    </div>
  );
};