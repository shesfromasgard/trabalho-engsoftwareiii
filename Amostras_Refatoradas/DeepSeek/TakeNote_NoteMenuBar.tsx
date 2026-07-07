import React, { useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
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
  Clipboard as ClipboardCmp,
} from 'react-feather'

import { TestID } from '@resources/TestID'
import { LastSyncedNotification } from '@/components/LastSyncedNotification'
import { NoteItem, CategoryItem } from '@/types'
import {
  toggleSettingsModal,
  togglePreviewMarkdown,
  toggleDarkTheme,
  updateCodeMirrorOption,
} from '@/slices/settings'
import { toggleFavoriteNotes, toggleTrashNotes } from '@/slices/note'
import { getCategories, getNotes, getSync, getSettings } from '@/selectors'
import { downloadNotes, isDraftNote, getShortUuid, copyToClipboard } from '@/utils/helpers'
import { sync } from '@/slices/sync'

const LIGHT_THEME = 'base16-light'
const DARK_THEME = 'new-moon'
const SUCCESS_COPY_MESSAGE = 'Note copied!'

const CopyIcon = <ClipboardCmp size={18} aria-hidden="true" focusable="false" />

const useCopyFeedback = () => {
  const [copiedText, setCopiedText] = useState('')

  const handleCopy = useCallback((text: string) => {
    copyToClipboard(text)
    setCopiedText(SUCCESS_COPY_MESSAGE)
  }, [])

  useEffect(() => {
    if (copiedText) {
      const timer = setTimeout(() => setCopiedText(''), 3000)
      return () => clearTimeout(timer)
    }
  }, [copiedText])

  return { copiedText, handleCopy }
}

export const NoteMenuBar = () => {
  // Redux state
  const { notes, activeNoteId } = useSelector(getNotes)
  const { categories } = useSelector(getCategories)
  const { syncing, lastSynced, pendingSync } = useSelector(getSync)
  const { darkTheme } = useSelector(getSettings)

  // Derived data
  const activeNote = notes.find((note) => note.id === activeNoteId)
  const shortNoteUuid = getShortUuid(activeNoteId)

  // Local UI state
  const [isPreviewActive, setIsPreviewActive] = useState(false)
  const { copiedText, handleCopy } = useCopyFeedback()

  // Dispatch helpers
  const dispatch = useDispatch()

  const handleTogglePreviewMarkdown = () => dispatch(togglePreviewMarkdown())
  const handleToggleTrashNotes = (noteId: string) => dispatch(toggleTrashNotes(noteId))
  const handleToggleFavorite = (noteId: string) => dispatch(toggleFavoriteNotes(noteId))
  const handleSync = () => dispatch(sync({ notes, categories }))
  const handleToggleSettingsModal = () => dispatch(toggleSettingsModal())
  const handleToggleDarkTheme = () => dispatch(toggleDarkTheme())
  const handleUpdateCodeMirrorOption = (key: string, value: any) =>
    dispatch(updateCodeMirrorOption({ key, value }))

  // Event handlers
  const downloadNotesHandler = () => downloadNotes([activeNote!], categories)

  const favoriteNoteHandler = () => handleToggleFavorite(activeNoteId)

  const trashNoteHandler = () => handleToggleTrashNotes(activeNoteId)

  const syncNotesHandler = handleSync

  const settingsHandler = handleToggleSettingsModal

  const toggleDarkThemeHandler = () => {
    handleToggleDarkTheme()
    handleUpdateCodeMirrorOption('theme', darkTheme ? LIGHT_THEME : DARK_THEME)
  }

  const togglePreviewHandler = () => {
    setIsPreviewActive((prev) => !prev)
    handleTogglePreviewMarkdown()
  }

  const copyUuidHandler = () => handleCopy(`{{${shortNoteUuid}}}`)

  return (
    <section className="note-menu-bar">
      {activeNote && !isDraftNote(activeNote) ? (
        <nav>
          <button
            className="note-menu-bar-button"
            onClick={togglePreviewHandler}
            data-testid={TestID.PREVIEW_MODE}
          >
            {isPreviewActive ? (
              <Edit aria-hidden="true" size={18} />
            ) : (
              <Eye aria-hidden="true" size={18} />
            )}
            <span className="sr-only">
              {isPreviewActive ? 'Edit note' : 'Preview note'}
            </span>
          </button>
          {!activeNote.scratchpad && (
            <>
              <button className="note-menu-bar-button" onClick={favoriteNoteHandler}>
                <Star aria-hidden="true" size={18} />
                <span className="sr-only">Add note to favorites</span>
              </button>
              <button className="note-menu-bar-button trash" onClick={trashNoteHandler}>
                <Trash2 aria-hidden="true" size={18} />
                <span className="sr-only">Delete note</span>
              </button>
            </>
          )}
          <button className="note-menu-bar-button">
            <Download
              aria-hidden="true"
              size={18}
              onClick={downloadNotesHandler}
            />
            <span className="sr-only">Download note</span>
          </button>
          <button
            className="note-menu-bar-button uuid"
            onClick={copyUuidHandler}
            data-testid={TestID.UUID_MENU_BAR_COPY_ICON}
          >
            {CopyIcon}
            {copiedText && <span className="uuid-copied-text">{copiedText}</span>}
            <span className="sr-only">Copy note</span>
          </button>
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
        <button
          className="note-menu-bar-button"
          onClick={syncNotesHandler}
          data-testid={TestID.TOPBAR_ACTION_SYNC_NOTES}
        >
          {syncing ? (
            <Loader aria-hidden="true" size={18} className="rotating-svg" />
          ) : (
            <RefreshCw aria-hidden="true" size={18} />
          )}
          <span className="sr-only">Sync notes</span>
        </button>
        <button className="note-menu-bar-button" onClick={toggleDarkThemeHandler}>
          {darkTheme ? (
            <Sun aria-hidden="true" size={18} />
          ) : (
            <Moon aria-hidden="true" size={18} />
          )}
          <span className="sr-only">Themes</span>
        </button>
        <button className="note-menu-bar-button" onClick={settingsHandler}>
          <Settings aria-hidden="true" size={18} />
          <span className="sr-only">Settings</span>
        </button>
      </nav>
    </section>
  )
}