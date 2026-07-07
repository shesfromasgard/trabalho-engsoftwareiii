import React, { useEffect, useRef, useCallback } from 'react'
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

export const SettingsModal: React.FC = () => {
  const dispatch = useDispatch()
  const node = useRef<HTMLDivElement>(null)

  // ===========================================================================
  // Selectors
  // ===========================================================================
  const { codeMirrorOptions, isOpen, previewMarkdown, darkTheme, notesSortKey } = useSelector(
    getSettings
  )
  const { currentUser } = useSelector(getAuth)
  const { notes, activeFolder, activeCategoryId } = useSelector(getNotes)
  const { categories } = useSelector(getCategories)

  // ===========================================================================
  // Handlers
  // ===========================================================================
  const handleCloseSettings = useCallback(() => {
    if (isOpen) {
      dispatch(toggleSettingsModal())
    }
  }, [isOpen, dispatch])

  const handleLogout = useCallback(() => {
    dispatch(logout())
  }, [dispatch])

  const handleDomClick = useCallback(
    (event: ReactMouseEvent) => {
      event.stopPropagation()

      if (node.current && node.current.contains(event.target as HTMLDivElement)) {
        return
      }

      if (isOpen) {
        dispatch(toggleSettingsModal())
      }
    },
    [isOpen, dispatch]
  )

  const handleEscPress = useCallback(
    (event: KeyboardEvent) => {
      event.stopPropagation()
      if (event.key === 'Escape' && isOpen) {
        dispatch(toggleSettingsModal())
      }
    },
    [isOpen, dispatch]
  )

  const togglePreviewMarkdownHandler = useCallback(() => {
    dispatch(togglePreviewMarkdown())
  }, [dispatch])

  const toggleDarkThemeHandler = useCallback(() => {
    dispatch(toggleDarkTheme())
    dispatch(
      updateCodeMirrorOption({
        key: 'theme',
        value: darkTheme ? 'base16-light' : 'new-moon',
      })
    )
  }, [dispatch, darkTheme])

  const toggleLineHighlight = useCallback(() => {
    dispatch(
      updateCodeMirrorOption({
        key: 'styleActiveLine',
        value: !codeMirrorOptions.styleActiveLine,
      })
    )
  }, [dispatch, codeMirrorOptions.styleActiveLine])

  const toggleScrollPastEnd = useCallback(() => {
    dispatch(
      updateCodeMirrorOption({
        key: 'scrollPastEnd',
        value: !codeMirrorOptions.scrollPastEnd,
      })
    )
  }, [dispatch, codeMirrorOptions.scrollPastEnd])

  const toggleLineNumbersHandler = useCallback(() => {
    dispatch(
      updateCodeMirrorOption({
        key: 'lineNumbers',
        value: !codeMirrorOptions.lineNumbers,
      })
    )
  }, [dispatch, codeMirrorOptions.lineNumbers])

  const updateNotesSortStrategyHandler = useCallback(
    (selectedOption: { value: NotesSortKey }) => {
      dispatch(updateNotesSortStrategy(selectedOption.value))
      dispatch(
        updateNotes({
          notes,
          activeFolder,
          activeCategoryId,
          sortOrderKey: selectedOption.value,
        })
      )
    },
    [dispatch, notes, activeFolder, activeCategoryId]
  )

  const updateNotesDirectionHandler = useCallback(
    (selectedOption: { value: string }) => {
      dispatch(
        updateCodeMirrorOption({
          key: 'direction',
          value: selectedOption.value,
        })
      )
    },
    [dispatch]
  )

  const downloadNotesHandler = useCallback(() => {
    downloadNotes(notes, categories)
  }, [notes, categories])

  const backupHandler = useCallback(() => {
    backupNotes(notes, categories)
  }, [notes, categories])

  const importBackupHandler = useCallback(
    async (json: File) => {
      const content = await json.text()
      const { notes: importedNotes, categories: importedCategories } = JSON.parse(content) as {
        notes: NoteItem[]
        categories: CategoryItem[]
      }

      if (!importedNotes || !importedCategories) return

      dispatch(importNotes(importedNotes))
      dispatch(importCategories(importedCategories))
    },
    [dispatch]
  )

  // ===========================================================================
  // Hooks
  // ===========================================================================
  useEffect(() => {
    const nativeDomClickHandler = handleDomClick as unknown as EventListener

    document.addEventListener('mousedown', nativeDomClickHandler)
    document.addEventListener('keydown', handleEscPress)

    return () => {
      document.removeEventListener('mousedown', nativeDomClickHandler)
      document.removeEventListener('keydown', handleEscPress)
    }
  }, [handleDomClick, handleEscPress])

  if (!isOpen) return null

  return (
    <div className="dimmer">
      <aside ref={node} className="settings-modal">
        <header className="settings-modal-header">
          <div className="close-button" onClick={handleCloseSettings}>
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
            <button onClick={handleLogout}>Log out</button>
          </section>
        </header>

        <section className="settings-content">
          <Tabs>
            <TabPanel label="Preferences" icon={Settings}>
              <Option
                title="Active line highlight"
                description="Controls whether the editor should highlight the active line"
                toggle={toggleLineHighlight}
                checked={codeMirrorOptions.styleActiveLine}
                testId={TestID.ACTIVE_LINE_HIGHLIGHT_TOGGLE}
              />
              <Option
                title="Display line numbers"
                description="Controls whether the editor should display line numbers"
                toggle={toggleLineNumbersHandler}
                checked={codeMirrorOptions.lineNumbers}
                testId={TestID.DISPLAY_LINE_NUMS_TOGGLE}
              />
              <Option
                title="Scroll past end"
                description="Controls whether the editor will add blank space to the end of all files"
                toggle={toggleScrollPastEnd}
                checked={codeMirrorOptions.scrollPastEnd}
                testId={TestID.SCROLL_PAST_END_TOGGLE}
              />
              <Option
                title="Markdown preview"
                description="Controls whether markdown preview mode is enabled"
                toggle={togglePreviewMarkdownHandler}
                checked={previewMarkdown}
                testId={TestID.MARKDOWN_PREVIEW_TOGGLE}
              />
              <Option
                title="Dark mode"
                description="Controls the theme of the application and editor"
                toggle={toggleDarkThemeHandler}
                checked={darkTheme}
                testId={TestID.DARK_MODE_TOGGLE}
              />
              <SelectOptions
                title="Sort By"
                description="Controls the sort strategy of the notes"
                onChange={updateNotesSortStrategyHandler}
                options={notesSortOptions}
                selectedValue={notesSortKey}
                testId={TestID.SORT_BY_DROPDOWN}
              />
              <SelectOptions
                title="Text direction"
                description="Controls the direction of the text"
                onChange={updateNotesDirectionHandler}
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
                handler={downloadNotesHandler}
                icon={Download}
                text={LabelText.DOWNLOAD_ALL_NOTES}
              />
              <p>Export TakeNote data as JSON.</p>
              <IconButton
                handler={backupHandler}
                icon={DownloadCloud}
                text={LabelText.BACKUP_ALL_NOTES}
              />
              <p>Import TakeNote JSON file.</p>
              <IconButtonUploader
                dataTestID={TestID.UPLOAD_SETTINGS_BACKUP}
                accept=".json"
                handler={importBackupHandler}
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