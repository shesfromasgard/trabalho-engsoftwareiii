import React from 'react'
import { Plus } from 'react-feather'
import { useDispatch, useSelector } from 'react-redux'

import { LabelText } from '@resources/LabelText'
import { TestID } from '@resources/TestID'
import { ActionButton } from '@/components/AppSidebar/ActionButton'
import { FolderOption } from '@/components/AppSidebar/FolderOption'
import { ScratchpadOption } from '@/components/AppSidebar/ScratchpadOption'
import { Folder, NotesSortKey } from '@/utils/enums'
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
  const { activeCategoryId, activeFolder, activeNoteId, notes } = useSelector(getNotes)
  const { previewMarkdown, notesSortKey } = useSelector(getSettings)

  const activeNote = getActiveNote(notes, activeNoteId)

  const dispatch = useDispatch()

  const handleAddNote = (note: NoteItem) => dispatch(addNote(note))
  const handleUpdateActiveNote = (noteId: string, multiSelect: boolean) =>
    dispatch(updateActiveNote({ noteId, multiSelect }))
  const handleUpdateSelectedNotes = (noteId: string, multiSelect: boolean) =>
    dispatch(updateSelectedNotes({ noteId, multiSelect }))
  const handleTogglePreviewMarkdown = () => dispatch(togglePreviewMarkdown())
  const handleAssignTrashToNotes = (noteId: string) => dispatch(assignTrashToNotes(noteId))
  const handleUnassignTrashFromNotes = (noteId: string) => dispatch(unassignTrashFromNotes(noteId))
  const handleAssignFavoriteToNotes = (noteId: string) => dispatch(assignFavoriteToNotes(noteId))
  const handleSwapFolder = (folder: Folder) =>
    dispatch(swapFolder({ folder, sortOrderKey: notesSortKey }))

  const newNoteHandler = () =>
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

  const folderOptions = [
    {
      folder: Folder.ALL,
      text: LabelText.NOTES,
      testID: TestID.FOLDER_NOTES,
      addNoteType: handleUnassignTrashFromNotes,
    },
    {
      folder: Folder.FAVORITES,
      text: LabelText.FAVORITES,
      testID: TestID.FOLDER_FAVORITES,
      addNoteType: handleAssignFavoriteToNotes,
    },
    {
      folder: Folder.TRASH,
      text: LabelText.TRASH,
      testID: TestID.FOLDER_TRASH,
      addNoteType: handleAssignTrashToNotes,
    },
  ]

  return (
    <aside className="app-sidebar">
      <ActionButton
        dataTestID={TestID.SIDEBAR_ACTION_CREATE_NEW_NOTE}
        handler={newNoteHandler}
        icon={Plus}
        label={LabelText.CREATE_NEW_NOTE}
        text={LabelText.NEW_NOTE}
      />
      <section className="app-sidebar-main">
        <ScratchpadOption
          active={activeFolder === Folder.SCRATCHPAD}
          swapFolder={handleSwapFolder}
        />
        {folderOptions.map(({ folder, text, testID, addNoteType }) => (
          <FolderOption
            key={folder}
            active={activeFolder === folder}
            swapFolder={handleSwapFolder}
            text={text}
            dataTestID={testID}
            folder={folder}
            addNoteType={addNoteType}
          />
        ))}
        <CategoryList />
      </section>
    </aside>
  )
}