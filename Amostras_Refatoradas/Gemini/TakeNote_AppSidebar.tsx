import React, { useCallback, useMemo } from 'react'
import { Plus } from 'react-feather'
import { useDispatch, useSelector } from 'react-redux'

import { LabelText } from '@resources/LabelText'
import { TestID } from '@resources/TestID'
import { ActionButton } from '@/components/AppSidebar/ActionButton'
import { FolderOption } from '@/components/AppSidebar/FolderOption'
import { ScratchpadOption } from '@/components/AppSidebar/ScratchpadOption'
import { Folder } from '@/utils/enums'
import { CategoryList } from '@/containers/CategoryList'
import {
  addNote,
  swapFolder,
  updateActiveNote,
  assignFavoriteToNotes,
  assignTrashToNotes,
  updateSelectedNotes,
  unassignTrashFromNotes,
} from '@/slices/note'
import { togglePreviewMarkdown } from '@/slices/settings'
import { getSettings, getNotes } from '@/selectors'
import { NoteItem } from '@/types'
import { newNoteHandlerHelper, getActiveNote } from '@/utils/helpers'

export const AppSidebar: React.FC = () => {
  const dispatch = useDispatch()

  // ===========================================================================
  // Selectors & Memoized State
  // ===========================================================================
  const { activeCategoryId, activeFolder, activeNoteId, notes } = useSelector(getNotes)
  const { previewMarkdown, notesSortKey } = useSelector(getSettings)

  const activeNote = useMemo(() => getActiveNote(notes, activeNoteId), [notes, activeNoteId])

  // ===========================================================================
  // Memoized Dispatch Handlers
  // ===========================================================================
  const handleAddNote = useCallback((note: NoteItem) => {
    dispatch(addNote(note))
  }, [dispatch])

  const handleUpdateActiveNote = useCallback((noteId: string, multiSelect: boolean) => {
    dispatch(updateActiveNote({ noteId, multiSelect }))
  }, [dispatch])

  const handleUpdateSelectedNotes = useCallback((noteId: string, multiSelect: boolean) => {
    dispatch(updateSelectedNotes({ noteId, multiSelect }))
  }, [dispatch])

  const handleTogglePreviewMarkdown = useCallback(() => {
    dispatch(togglePreviewMarkdown())
  }, [dispatch])

  const handleAssignTrashToNotes = useCallback((noteId: string) => {
    dispatch(assignTrashToNotes(noteId))
  }, [dispatch])

  const handleUnassignTrashFromNotes = useCallback((noteId: string) => {
    dispatch(unassignTrashFromNotes(noteId))
  }, [dispatch])

  const handleAssignFavoriteToNotes = useCallback((noteId: string) => {
    dispatch(assignFavoriteToNotes(noteId))
  }, [dispatch])

  const handleSwapFolder = useCallback((folder: Folder) => {
    dispatch(swapFolder({ folder, sortOrderKey: notesSortKey }))
  }, [dispatch, notesSortKey])

  // ===========================================================================
  // Business Logic Handlers
  // ===========================================================================
  const handleNewNote = useCallback(() => {
    newNoteHandlerHelper(
      activeFolder,
      previewMarkdown,
      activeNote,
      activeCategoryId,
      handleSwapFolder,
      handleTogglePreviewMarkdown,
      handleAddNote,
      handleUpdateActiveNote,
      handleUpdateSelectedNotes
    )
  }, [
    activeFolder,
    previewMarkdown,
    activeNote,
    activeCategoryId,
    handleSwapFolder,
    handleTogglePreviewMarkdown,
    handleAddNote,
    handleUpdateActiveNote,
    handleUpdateSelectedNotes,
  ])

  return (
    <aside className="app-sidebar">
      <ActionButton
        dataTestID={TestID.SIDEBAR_ACTION_CREATE_NEW_NOTE}
        handler={handleNewNote}
        icon={Plus}
        label={LabelText.CREATE_NEW_NOTE}
        text={LabelText.NEW_NOTE}
      />
      <section className="app-sidebar-main">
        <ScratchpadOption
          active={activeFolder === Folder.SCRATCHPAD}
          swapFolder={handleSwapFolder}
        />
        <FolderOption
          active={activeFolder === Folder.ALL}
          swapFolder={handleSwapFolder}
          text={LabelText.NOTES}
          dataTestID={TestID.FOLDER_NOTES}
          folder={Folder.ALL}
          addNoteType={handleUnassignTrashFromNotes}
        />
        <FolderOption
          active={activeFolder === Folder.FAVORITES}
          text={LabelText.FAVORITES}
          dataTestID={TestID.FOLDER_FAVORITES}
          folder={Folder.FAVORITES}
          swapFolder={handleSwapFolder}
          addNoteType={handleAssignFavoriteToNotes}
        />
        <FolderOption
          active={activeFolder === Folder.TRASH}
          text={LabelText.TRASH}
          dataTestID={TestID.FOLDER_TRASH}
          folder={Folder.TRASH}
          swapFolder={handleSwapFolder}
          addNoteType={handleAssignTrashToNotes}
        />
        <CategoryList />
      </section>
    </aside>
  )
}