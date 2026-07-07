import React, { useCallback } from 'react'
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

export const KeyboardShortcuts: React.FC = () => {
  const dispatch = useDispatch()

  // ===========================================================================
  // Selectors & Context
  // ===========================================================================
  const { categories } = useSelector(getCategories)
  const { activeCategoryId, activeFolder, activeNoteId, notes, selectedNotesIds } = useSelector(getNotes)
  const { darkTheme, previewMarkdown } = useSelector(getSettings)
  const { addingTempCategory, setAddingTempCategory } = useTempState()

  const activeNote = getActiveNote(notes, activeNoteId)

  // ===========================================================================
  // Memoized Action Dispatchers (Required for helper integration)
  // ===========================================================================
  const _addNote = useCallback((note: NoteItem) => dispatch(addNote(note)), [dispatch])
  
  const _updateActiveNote = useCallback(
    (noteId: string, multiSelect: boolean) => dispatch(updateActiveNote({ noteId, multiSelect })),
    [dispatch]
  )
  
  const _updateSelectedNotes = useCallback(
    (noteId: string, multiSelect: boolean) => dispatch(updateSelectedNotes({ noteId, multiSelect })),
    [dispatch]
  )
  
  const _swapFolder = useCallback((folder: Folder) => dispatch(swapFolder({ folder })), [dispatch])
  
  const _togglePreviewMarkdown = useCallback(() => dispatch(togglePreviewMarkdown()), [dispatch])

  // ===========================================================================
  // Handlers
  // ===========================================================================
  const handleNewNote = useCallback(() => {
    newNoteHandlerHelper(
      activeFolder,
      previewMarkdown,
      activeNote,
      activeCategoryId,
      _swapFolder,
      _togglePreviewMarkdown,
      _addNote,
      _updateActiveNote,
      _updateSelectedNotes
    )
  }, [
    activeFolder,
    previewMarkdown,
    activeNote,
    activeCategoryId,
    _swapFolder,
    _togglePreviewMarkdown,
    _addNote,
    _updateActiveNote,
    _updateSelectedNotes,
  ])

  const handleNewTempCategory = useCallback(() => {
    if (!addingTempCategory) {
      setAddingTempCategory(true)
    }
  }, [addingTempCategory, setAddingTempCategory])

  const handleTrashNote = useCallback(() => {
    if (activeNote) {
      dispatch(toggleTrashNotes(activeNote.id))
    }
  }, [activeNote, dispatch])

  const handleSyncNotes = useCallback(() => {
    dispatch(sync({ notes, categories }))
  }, [dispatch, notes, categories])

  const handleDownloadNotes = useCallback(() => {
    if (!activeNote || selectedNotesIds.length === 0) return

    const notesToDownload = selectedNotesIds.includes(activeNote.id)
      ? notes.filter((note) => selectedNotesIds.includes(note.id))
      : [activeNote]

    downloadNotes(notesToDownload, categories)
  }, [activeNote, selectedNotesIds, notes, categories])

  const handleTogglePreviewMarkdown = useCallback(() => {
    dispatch(togglePreviewMarkdown())
  }, [dispatch])

  const handleToggleDarkTheme = useCallback(() => {
    dispatch(toggleDarkTheme())
    dispatch(
      updateCodeMirrorOption({
        key: 'theme',
        value: darkTheme ? 'base16-light' : 'new-moon',
      })
    )
  }, [dispatch, darkTheme])

  const handlePrettifyNote = useCallback(() => {
    if (!activeNote?.text) return

    const formattedText = prettier.format(activeNote.text, {
      parser: 'markdown',
      plugins: [parserMarkdown],
    })

    dispatch(updateNote({ ...activeNote, text: formattedText }))
  }, [activeNote, dispatch])

  // ===========================================================================
  // Shortcut Hooks Configuration
  // ===========================================================================
  useKey(Shortcuts.NEW_NOTE, handleNewNote)
  useKey(Shortcuts.NEW_CATEGORY, handleNewTempCategory)
  useKey(Shortcuts.DELETE_NOTE, handleTrashNote)
  useKey(Shortcuts.SYNC_NOTES, handleSyncNotes)
  useKey(Shortcuts.DOWNLOAD_NOTES, handleDownloadNotes)
  useKey(Shortcuts.PREVIEW, handleTogglePreviewMarkdown)
  useKey(Shortcuts.TOGGLE_THEME, handleToggleDarkTheme)
  useKey(Shortcuts.PRETTIFY, handlePrettifyNote)

  return null
}