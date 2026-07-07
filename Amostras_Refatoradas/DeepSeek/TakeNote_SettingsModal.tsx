import React, { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  X,
  Command,
  Settings,
  Archive,
  Edit2,
  Download,
  DownloadCloud,
  UploadCloud,
} from 'react-feather'

import {
  toggleSettingsModal,
  updateCodeMirrorOption,
  togglePreviewMarkdown,
  toggleDarkTheme,
  updateNotesSortStrategy,
} from '@/slices/settings'
import { updateNotes, importNotes } from '@/slices/note'
import { logout } from '@/slices/auth'
import { importCategories } from '@/slices/category'
import { shortcutMap, notesSortOptions, directionTextOptions } from '@/utils/constants'
import { CategoryItem, NoteItem, ReactMouseEvent } from '@/types'
import { getSettings, getAuth, getNotes, getCategories } from '@/selectors'
import { Option } from '@/components/SettingsModal/Option'
import { Shortcut } from '@/components/SettingsModal/Shortcut'
import { SelectOptions } from '@/components/SettingsModal/SelectOptions'
import { IconButton } from '@/components/SettingsModal/IconButton'
import { NotesSortKey } from '@/utils/enums'
import { backupNotes, downloadNotes } from '@/utils/helpers'
import { Tabs } from '@/components/Tabs/Tabs'
import { TabPanel } from '@/components/Tabs/TabPanel'
import { LabelText } from '@resources/LabelText'
import { TestID } from '@resources/TestID'
import { IconButtonUploader } from '@/components/SettingsModal/IconButtonUploader'

function useSettingsModal() {
  const { codeMirrorOptions, isOpen, previewMarkdown, darkTheme, notesSortKey } =
    useSelector(getSettings)
  const { currentUser } = useSelector(getAuth)
  const { notes, activeFolder, activeCategoryId } = useSelector(getNotes)
  const { categories } = useSelector(getCategories)

  const dispatch = useDispatch()

  const _toggleSettingsModal = () => dispatch(toggleSettingsModal())
  const _togglePreviewMarkdown = () => dispatch(togglePreviewMarkdown())
  const _toggleDarkTheme = () => dispatch(toggleDarkTheme())
  const _updateCodeMirrorOption = (key: string, value: any) =>
    dispatch(updateCodeMirrorOption({ key, value }))
  const _updateNotesSortStrategy = (sortBy: NotesSortKey) =>
    dispatch(updateNotesSortStrategy(sortBy))
  const _updateNotes = (sortOrderKey: NotesSortKey) =>
    dispatch(updateNotes({ notes, activeFolder, activeCategoryId, sortOrderKey }))
  const _importBackup = (notes: NoteItem[], categories: CategoryItem[]) => {
    dispatch(importNotes(notes))
    dispatch(importCategories(categories))
  }
  const _logout = () => dispatch(logout())

  const nodeRef = useRef<HTMLDivElement>(null)

  const handleDomClick = (event: ReactMouseEvent) => {
    event.stopPropagation()
    if (nodeRef.current && nodeRef.current.contains(event.target as HTMLDivElement)) return
    if (isOpen) {
      _toggleSettingsModal()
    }
  }

  const handleEscPress = (event: KeyboardEvent) => {
    event.stopPropagation()
    if (event.key === 'Escape' && isOpen) {
      _toggleSettingsModal()
    }
  }

  useEffect(() => {
    document.addEventListener('mousedown', handleDomClick)
    document.addEventListener('keydown', handleEscPress)

    return () => {
      document.removeEventListener('mousedown', handleDomClick)
      document.removeEventListener('keydown', handleEscPress)
    }
  })

  const togglePreviewMarkdownHandler = () => _togglePreviewMarkdown()
  const toggleDarkThemeHandler = () => {
    _toggleDarkTheme()
    _updateCodeMirrorOption('theme', darkTheme ? 'base16-light' : 'new-moon')
  }
  const toggleLineHighlight = () =>
    _updateCodeMirrorOption('styleActiveLine', !codeMirrorOptions.styleActiveLine)
  const toggleScrollPastEnd = () =>
    _updateCodeMirrorOption('scrollPastEnd', !codeMirrorOptions.scrollPastEnd)
  const toggleLineNumbersHandler = () =>
    _updateCodeMirrorOption('lineNumbers', !codeMirrorOptions.lineNumbers)
  const updateNotesSortStrategyHandler = (selectedOption: any) => {
    _updateNotesSortStrategy(selectedOption.value)
    _updateNotes(selectedOption.value)
  }
  const updateNotesDirectionHandler = (selectedOption: any) => {
    _updateCodeMirrorOption('direction', selectedOption.value)
  }
  const downloadNotesHandler = () => downloadNotes(notes, categories)
  const backupHandler = () => backupNotes(notes, categories)
  const importBackupHandler = async (json: File) => {
    const content = await json.text()
    const { notes, categories } = JSON.parse(content) as {
      notes: NoteItem[]
      categories: CategoryItem[]
    }

    if (!notes || !categories) return

    _importBackup(notes, categories)
  }

  return {
    isOpen,
    currentUser,
    codeMirrorOptions,
    previewMarkdown,
    darkTheme,
    notesSortKey,
    nodeRef,
    handlers: {
      toggleSettingsModal: _toggleSettingsModal,
      togglePreviewMarkdownHandler,
      toggleDarkThemeHandler,
      toggleLineHighlight,
      toggleScrollPastEnd,
      toggleLineNumbersHandler,
      updateNotesSortStrategyHandler,
      updateNotesDirectionHandler,
      downloadNotesHandler,
      backupHandler,
      importBackupHandler,
      logout: _logout,
    },
  }
}

export const SettingsModal: React.FC = () => {
  const {
    isOpen,
    currentUser,
    codeMirrorOptions,
    previewMarkdown,
    darkTheme,
    notesSortKey,
    nodeRef,
    handlers,
  } = useSettingsModal()

  if (!isOpen) return null

  return (
    <div className="dimmer">
      <aside ref={nodeRef} className="settings-modal">
        <header className="settings-modal-header">
          <div className="close-button" onClick={handlers.toggleSettingsModal}>
            <X size={20} />
          </div>

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
            <button onClick={handlers.logout}>Log out</button>
          </section>
        </header>

        <section className="settings-content">
          <Tabs>
            <TabPanel label="Preferences" icon={Settings}>
              <Option
                title="Active line highlight"
                description="Controls whether the editor should highlight the active line"
                toggle={handlers.toggleLineHighlight}
                checked={codeMirrorOptions.styleActiveLine}
                testId={TestID.ACTIVE_LINE_HIGHLIGHT_TOGGLE}
              />
              <Option
                title="Display line numbers"
                description="Controls whether the editor should display line numbers"
                toggle={handlers.toggleLineNumbersHandler}
                checked={codeMirrorOptions.lineNumbers}
                testId={TestID.DISPLAY_LINE_NUMS_TOGGLE}
              />
              <Option
                title="Scroll past end"
                description="Controls whether the editor will add blank space to the end of all files"
                toggle={handlers.toggleScrollPastEnd}
                checked={codeMirrorOptions.scrollPastEnd}
                testId={TestID.SCROLL_PAST_END_TOGGLE}
              />
              <Option
                title="Markdown preview"
                description="Controls whether markdown preview mode is enabled"
                toggle={handlers.togglePreviewMarkdownHandler}
                checked={previewMarkdown}
                testId={TestID.MARKDOWN_PREVIEW_TOGGLE}
              />
              <Option
                title="Dark mode"
                description="Controls the theme of the application and editor"
                toggle={handlers.toggleDarkThemeHandler}
                checked={darkTheme}
                testId={TestID.DARK_MODE_TOGGLE}
              />
              <SelectOptions
                title="Sort By"
                description="Controls the sort strategy of the notes"
                onChange={handlers.updateNotesSortStrategyHandler}
                options={notesSortOptions}
                selectedValue={notesSortKey}
                testId={TestID.SORT_BY_DROPDOWN}
              />
              <SelectOptions
                title="Text direction"
                description="Controls the direction of the text"
                onChange={handlers.updateNotesDirectionHandler}
                options={directionTextOptions}
                selectedValue={codeMirrorOptions.direction}
                testId={TestID.TEXT_DIRECTION_DROPDOWN}
              />
            </TabPanel>
            <TabPanel label="Keyboard shortcuts" icon={Command}>
              {shortcutMap.map((shortcut) => (
                <Shortcut action={shortcut.action} letter={shortcut.key} key={shortcut.key} />
              ))}
            </TabPanel>
            <TabPanel label="Data management" icon={Archive}>
              <p>Download all notes as Markdown files in a zip.</p>
              <IconButton
                dataTestID={TestID.SETTINGS_MODAL_DOWNLOAD_NOTES}
                handler={handlers.downloadNotesHandler}
                icon={Download}
                text={LabelText.DOWNLOAD_ALL_NOTES}
              />
              <p>Export TakeNote data as JSON.</p>
              <IconButton
                handler={handlers.backupHandler}
                icon={DownloadCloud}
                text={LabelText.BACKUP_ALL_NOTES}
              />
              <p>Import TakeNote JSON file.</p>
              <IconButtonUploader
                dataTestID={TestID.UPLOAD_SETTINGS_BACKUP}
                accept=".json"
                handler={handlers.importBackupHandler}
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
  )
}