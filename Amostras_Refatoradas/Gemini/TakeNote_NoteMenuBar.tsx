import React, { useEffect, useState } from 'react'
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

const SUCCESSFUL_COPY_MESSAGE = 'Note copied!'
const COPY_TIMEOUT_MS = 3000

export const NoteMenuBar = () => {
  const dispatch = useDispatch()

  // ===========================================================================
  // Selectors & State
  // ===========================================================================

  const { notes, activeNoteId } = useSelector(getNotes)
  const { categories } = useSelector(getCategories)
  const { syncing, lastSynced, pendingSync } = useSelector(getSync)
  const { darkTheme } = useSelector(getSettings)

  const [uuidCopiedText, setUuidCopiedText] = useState<string>('')
  const [isPreviewToggled, setIsPreviewToggled] = useState<boolean>(false)

  // ===========================================================================
  // Derived State
  // ===========================================================================

  const activeNote = notes.find((note) => note.id === activeNoteId)!
  const shortNoteUuid = getShortUuid(activeNoteId)
  const shouldRenderActiveNoteMenu = activeNote && !isDraftNote(activeNote)

  // ===========================================================================
  // Effects
  // ===========================================================================

  useEffect(() => {
    if (uuidCopiedText !== SUCCESSFUL_COPY_MESSAGE) return

    const timer = setTimeout(() => {
      setUuidCopiedText('')
    }, COPY_TIMEOUT_MS)

    return () => clearTimeout(timer)
  }, [uuidCopiedText])

  // ===========================================================================
  // Handlers
  // ===========================================================================

  const handleTogglePreview = () => {
    setIsPreviewToggled((prev) => !prev)
    dispatch(togglePreviewMarkdown())
  }

  const handleToggleFavorite = () => {
    dispatch(toggleFavoriteNotes(activeNoteId))
  }

  const handleToggleTrash = () => {
    dispatch(toggleTrashNotes(activeNoteId))
  }

  const handleDownloadNotes = () => {
    downloadNotes([activeNote], categories)
  }

  const handleCopyUuid = () => {
    copyToClipboard(`{{${shortNoteUuid}}}`)
    setUuidCopiedText(SUCCESSFUL_COPY_MESSAGE)
  }

  const handleSyncNotes = () => {
    dispatch(sync({ notes, categories }))
  }

  const handleToggleDarkTheme = () => {
    dispatch(toggleDarkTheme())
    dispatch(
      updateCodeMirrorOption({
        key: 'theme',
        value: darkTheme ? 'base16-light' : 'new-moon',
      })
    )
  }

  const handleToggleSettings = () => {
    dispatch(toggleSettingsModal())
  }

  return (
    <section className="note-menu-bar">
      {shouldRenderActiveNoteMenu ? (
        <nav>
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
            <span className="sr-only">
              {isPreviewToggled ? 'Edit note' : 'Preview note'}
            </span>
          </button>

          {!activeNote.scratchpad && (
                <>
              <button className="note-menu-bar-button" onClick={handleToggleFavorite}>
                <Star aria-hidden="true" size={18} />
                <span className="sr-only">Add note to favorites</span>
              </button>
              <button className="note-menu-bar-button trash" onClick={handleToggleTrash}>
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
            <ClipboardCmp aria-hidden="true" size={18} focusable="false" />
            {uuidCopiedText && <span className="uuid-copied-text">{uuidCopiedText}</span>}
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

        <button className="note-menu-bar-button" onClick={handleToggleDarkTheme}>
          {darkTheme ? (
            <Sun aria-hidden="true" size={18} />
          ) : (
            <Moon aria-hidden="true" size={18} />
          )}
          <span className="sr-only">Themes</span>
        </button>

        <button className="note-menu-bar-button" onClick={handleToggleSettings}>
          <Settings aria-hidden="true" size={18} />
          <span className="sr-only">Settings</span>
        </button>
      </nav>
    </section>
  )
}