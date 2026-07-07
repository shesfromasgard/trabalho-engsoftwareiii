import React, { useContext } from 'react'
import { ArrowUp, Download, Star, Trash, X, Edit2, Clipboard } from 'react-feather'
import { useDispatch, useSelector } from 'react-redux'

import { LabelText } from '@resources/LabelText'
import { TestID } from '@resources/TestID'
import { ContextMenuOption } from '@/components/NoteList/ContextMenuOption'
import { downloadNotes, isDraftNote, getShortUuid, copyToClipboard } from '@/utils/helpers'
import {
  deleteNotes,
  toggleFavoriteNotes,
  toggleTrashNotes,
  addCategoryToNote,
  updateActiveNote,
  swapFolder,
  removeCategoryFromNotes,
} from '@/slices/note'
import { getCategories, getNotes } from '@/selectors'
import { Folder, ContextMenuEnum } from '@/utils/enums'
import { CategoryItem, NoteItem } from '@/types'
import { setCategoryEdit, deleteCategory } from '@/slices/category'
import { MenuUtilitiesContext } from '@/containers/ContextMenu'

export interface ContextMenuOptionsProps {
  clickedItem: NoteItem | CategoryItem
  type: ContextMenuEnum
}

export const ContextMenuOptions: React.FC<ContextMenuOptionsProps> = ({ clickedItem, type }) => {
  if (type === 'CATEGORY') {
    return <CategoryOptions clickedCategory={clickedItem as CategoryItem} />
  }
  return <NotesOptions clickedNote={clickedItem as NoteItem} />
}

interface CategoryOptionsProps {
  clickedCategory: CategoryItem
}

const CategoryOptions: React.FC<CategoryOptionsProps> = ({ clickedCategory }) => {
  const dispatch = useDispatch()
  const { setOptionsId } = useContext(MenuUtilitiesContext)

  const startRenameHandler = () => {
    dispatch(setCategoryEdit({ id: clickedCategory.id, tempName: clickedCategory.name }))
    setOptionsId('')
  }

  const removeCategoryHandler = () => {
    dispatch(deleteCategory(clickedCategory.id))
    dispatch(removeCategoryFromNotes(clickedCategory.id))
    dispatch(swapFolder({ folder: Folder.ALL }))
  }

  return (
    <nav className="options-nav" data-testid={TestID.CATEGORY_OPTIONS_NAV}>
      <ContextMenuOption
        dataTestID={TestID.CATEGORY_OPTION_RENAME}
        handler={startRenameHandler}
        icon={Edit2}
        text={LabelText.RENAME}
      />
      <ContextMenuOption
        dataTestID={TestID.CATEGORY_OPTION_DELETE_PERMANENTLY}
        handler={removeCategoryHandler}
        icon={X}
        text={LabelText.DELETE_PERMANENTLY}
        optionType="delete"
      />
    </nav>
  )
}

interface NotesOptionsProps {
  clickedNote: NoteItem
}

interface NoteMenuItemsProps {
  clickedNote: NoteItem
  deleteNotesHandler: () => void
  downloadNotesHandler: () => void
  favoriteNoteHandler: () => void
  trashNoteHandler: () => void
  removeCategoryFromNoteHandler: () => void
  copyLinkedNoteMarkdownHandler: (e: React.SyntheticEvent) => void
  isSelectedNotesDiffFavor: boolean
}

const NoteMenuItems: React.FC<NoteMenuItemsProps> = ({
  clickedNote,
  deleteNotesHandler,
  downloadNotesHandler,
  favoriteNoteHandler,
  trashNoteHandler,
  removeCategoryFromNoteHandler,
  copyLinkedNoteMarkdownHandler,
  isSelectedNotesDiffFavor,
}) => {
  return (
    <nav className="options-nav" data-testid={TestID.NOTE_OPTIONS_NAV}>
      {clickedNote.trash && (
        <>
          <ContextMenuOption
            dataTestID={TestID.NOTE_OPTION_DELETE_PERMANENTLY}
            handler={deleteNotesHandler}
            icon={X}
            text={LabelText.DELETE_PERMANENTLY}
            optionType="delete"
          />
          <ContextMenuOption
            dataTestID={TestID.NOTE_OPTION_RESTORE_FROM_TRASH}
            handler={trashNoteHandler}
            icon={ArrowUp}
            text={LabelText.RESTORE_FROM_TRASH}
          />
        </>
      )}
      {!clickedNote.scratchpad && !clickedNote.trash && (
        <>
          <ContextMenuOption
            dataTestID={TestID.NOTE_OPTION_FAVORITE}
            handler={favoriteNoteHandler}
            icon={Star}
            text={
              isSelectedNotesDiffFavor
                ? LabelText.TOGGLE_FAVORITE
                : clickedNote.favorite
                ? LabelText.REMOVE_FAVORITE
                : LabelText.MARK_AS_FAVORITE
            }
          />
          <ContextMenuOption
            dataTestID={TestID.NOTE_OPTION_TRASH}
            handler={trashNoteHandler}
            icon={Trash}
            text={LabelText.MOVE_TO_TRASH}
            optionType="delete"
          />
        </>
      )}
      {clickedNote.category && !clickedNote.trash && (
        <ContextMenuOption
          dataTestID={TestID.NOTE_OPTION_REMOVE_CATEGORY}
          handler={removeCategoryFromNoteHandler}
          icon={X}
          text={LabelText.REMOVE_CATEGORY}
        />
      )}
      <ContextMenuOption
        dataTestID={TestID.NOTE_OPTION_DOWNLOAD}
        handler={downloadNotesHandler}
        icon={Download}
        text={LabelText.DOWNLOAD}
      />
      <ContextMenuOption
        dataTestID={TestID.COPY_REFERENCE_TO_NOTE}
        handler={copyLinkedNoteMarkdownHandler}
        icon={Clipboard}
        text={LabelText.COPY_REFERENCE_TO_NOTE}
      />
    </nav>
  )
}

const NotesOptions: React.FC<NotesOptionsProps> = ({ clickedNote }) => {
  const { selectedNotesIds, notes } = useSelector(getNotes)
  const { categories } = useSelector(getCategories)

  const selectedNotes = notes.filter((note) => selectedNotesIds.includes(note.id))
  const isSelectedNotesDiffFavor = Boolean(
    selectedNotes.find((note) => note.favorite) && selectedNotes.find((note) => !note.favorite)
  )

  const dispatch = useDispatch()

  const deleteNotesHandler = () => dispatch(deleteNotes(selectedNotesIds))
  const downloadNotesHandler = () =>
    downloadNotes(
      selectedNotesIds.includes(clickedNote.id) ? selectedNotes : [clickedNote],
      categories
    )
  const favoriteNoteHandler = () => dispatch(toggleFavoriteNotes(clickedNote.id))
  const trashNoteHandler = () => dispatch(toggleTrashNotes(clickedNote.id))
  const removeCategoryFromNoteHandler = () => {
    dispatch(addCategoryToNote({ categoryId: '', noteId: clickedNote.id }))
    dispatch(updateActiveNote({ noteId: clickedNote.id, multiSelect: false }))
  }
  const copyLinkedNoteMarkdownHandler = (e: React.SyntheticEvent) => {
    e.preventDefault()
    const shortNoteUuid = getShortUuid(clickedNote.id)
    copyToClipboard(`{{${shortNoteUuid}}}`)
  }

  if (isDraftNote(clickedNote)) {
    return null
  }

  return (
    <NoteMenuItems
      clickedNote={clickedNote}
      deleteNotesHandler={deleteNotesHandler}
      downloadNotesHandler={downloadNotesHandler}
      favoriteNoteHandler={favoriteNoteHandler}
      trashNoteHandler={trashNoteHandler}
      removeCategoryFromNoteHandler={removeCategoryFromNoteHandler}
      copyLinkedNoteMarkdownHandler={copyLinkedNoteMarkdownHandler}
      isSelectedNotesDiffFavor={isSelectedNotesDiffFavor}
    />
  )
}