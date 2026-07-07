import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import prettier from 'prettier/standalone'
import parserMarkdown from 'prettier/parser-markdown'

import { useTempState } from '@/contexts/TempStateContext'
import { Folder, Shortcuts } from '@/utils/enums'
import { downloadNotes, getActiveNote, newNoteHandlerHelper } from '@/utils/helpers'
import { useKey } from '@/utils/hooks'
import {
  addNote,
  swapFolder,
  toggleTrashNotes,
  updateActiveNote,
  updateSelectedNotes,
  updateNote,
} from '@/slices/note'
import { sync } from '@/slices/sync'
import { getCategories, getNotes, getSettings } from '@/selectors'
import { CategoryItem, NoteItem } from '@/types'
import { toggleDarkTheme, togglePreviewMarkdown, updateCodeMirrorOption } from '@/slices/settings'

function useKeyboardShortcuts() {
  const { categories } = useSelector(getCategories)
  const { activeCategoryId, activeFolder, activeNoteId, notes, selectedNotesIds } = useSelector(getNotes)
  const { darkTheme, previewMarkdown } = useSelector(getSettings)
  const activeNote = getActiveNote(notes, activeNoteId)

  const dispatch = useDispatch()
  const { addingTempCategory, setAddingTempCategory } = useTempState()

  const newNoteHandler = () =>
    newNoteHandlerHelper(
      activeFolder,
      previewMarkdown,
      activeNote,
      activeCategoryId,
      (folder: Folder) => dispatch(swapFolder({ folder })),
      () => dispatch(togglePreviewMarkdown()),
      (note: NoteItem) => dispatch(addNote(note)),
      (noteId: string, multiSelect: boolean) => dispatch(updateActiveNote({ noteId, multiSelect })),
      (noteId: string, multiSelect: boolean) => dispatch(updateSelectedNotes({ noteId, multiSelect }))
    )

  const newTempCategoryHandler = () => {
    if (!addingTempCategory) setAddingTempCategory(true)
  }

  const trashNoteHandler = () => dispatch(toggleTrashNotes(activeNote!.id))

  const syncNotesHandler = () => dispatch(sync({ notes, categories }))

  const downloadNotesHandler = () => {
    if (!activeNote || selectedNotesIds.length === 0) return
    const notesToDownload = selectedNotesIds.includes(activeNote.id)
      ? notes.filter((note) => selectedNotesIds.includes(note.id))
      : [activeNote]
    downloadNotes(notesToDownload, categories)
  }

  const togglePreviewMarkdownHandler = () => dispatch(togglePreviewMarkdown())

  const toggleDarkThemeHandler = () => {
    dispatch(toggleDarkTheme())
    dispatch(updateCodeMirrorOption({ key: 'theme', value: darkTheme ? 'base16-light' : 'new-moon' }))
  }

  const prettifyNoteHandler = () => {
    if (activeNote?.text) {
      const formattedText = prettier.format(activeNote.text, {
        parser: 'markdown',
        plugins: [parserMarkdown],
      })
      dispatch(updateNote({ ...activeNote, text: formattedText }))
    }
  }

  useKey(Shortcuts.NEW_NOTE, newNoteHandler)
  useKey(Shortcuts.NEW_CATEGORY, newTempCategoryHandler)
  useKey(Shortcuts.DELETE_NOTE, trashNoteHandler)
  useKey(Shortcuts.SYNC_NOTES, syncNotesHandler)
  useKey(Shortcuts.DOWNLOAD_NOTES, downloadNotesHandler)
  useKey(Shortcuts.PREVIEW, togglePreviewMarkdownHandler)
  useKey(Shortcuts.TOGGLE_THEME, toggleDarkThemeHandler)
  useKey(Shortcuts.PRETTIFY, prettifyNoteHandler)
}

export const KeyboardShortcuts: React.FC = () => {
  useKeyboardShortcuts()
  return null
}