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
import category, { setCategoryEdit, deleteCategory } from '@/slices/category'
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

const useCategoryOptions = (clickedCategory: CategoryItem) => {
  const dispatch = useDispatch()
  const { setOptionsId } = useContext(MenuUtilitiesContext)

  const handleRename = () => {
    dispatch(setCategoryEdit({ id: clickedCategory.id, tempName: clickedCategory.name }))
    setOptionsId('')
  }

  const handleRemove = () => {
    dispatch(deleteCategory(clickedCategory.id))
    dispatch(removeCategoryFromNotes(clickedCategory.id))
    dispatch(swapFolder({ folder: Folder.ALL }))
  }

  return { handleRename, handleRemove }
}

const CategoryOptions: React.FC<CategoryOptionsProps> = ({ clickedCategory }) => {
  const { handleRename, handleRemove } = useCategoryOptions(clickedCategory)

  return (
    <nav className="options-nav" data-testid={TestID.CATEGORY_OPTIONS_NAV}>
      <ContextMenuOption
        dataTestID={TestID.CATEGORY_OPTION_RENAME}
        handler={handleRename}
        icon={Edit2}
        text={LabelText.RENAME}
      />
      <ContextMenuOption
        dataTestID={TestID.CATEGORY_OPTION_DELETE_PERMANENTLY}
        handler={handleRemove}
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

const useNotesOptions = (clickedNote: NoteItem) => {
  const dispatch = useDispatch()
  const { selectedNotesIds, notes } = useSelector(getNotes)
  const { categories } = useSelector(getCategories)

  const selectedNotes = notes.filter((note) => selectedNotesIds.includes(note.id))
  
  const isSelectedNotesDiffFavor = Boolean(
    selectedNotes.find((note) => note.favorite) && selectedNotes.find((note) => !note.favorite)
  )

  const getFavoriteLabel = (): string => {
    if (isSelectedNotesDiffFavor) return LabelText.TOGGLE_FAVORITE
    return clickedNote.favorite ? LabelText.REMOVE_FAVORITE : LabelText.MARK_AS_FAVORITE
  }

  const handleDeleteNotes = () => {
    dispatch(deleteNotes(selectedNotesIds))
  }

  const handleDownloadNotes = () => {
    const targetNotes = selectedNotesIds.includes(clickedNote.id) ? selectedNotes : [clickedNote]
    downloadNotes(targetNotes, categories)
  }

  const handleToggleFavorite = () => {
    dispatch(toggleFavoriteNotes(clickedNote.id))
  }

  const handleToggleTrash = () => {
    dispatch(toggleTrashNotes(clickedNote.id))
  }

  const handleRemoveCategory = () => {
    dispatch(addCategoryToNote({ categoryId: '', noteId: clickedNote.id }))
    dispatch(updateActiveNote({ noteId: clickedNote.id, multiSelect: false }))
  }

  const handleCopyLinkedNoteMarkdown = (e: React.SyntheticEvent) => {
    e.preventDefault()
    const shortNoteUuid = getShortUuid(clickedNote.id)
    copyToClipboard(`{{${shortNoteUuid}}}`)
  }

  return {
    favoriteLabel: getFavoriteLabel(),
    handleDeleteNotes,
    handleDownloadNotes,
    handleToggleFavorite,
    handleToggleTrash,
    handleRemoveCategory,
    handleCopyLinkedNoteMarkdown,
  }
}

const NotesOptions: React.FC<NotesOptionsProps> = ({ clickedNote }) => {
  const {
    favoriteLabel,
    handleDeleteNotes,
    handleDownloadNotes,
    handleToggleFavorite,
    handleToggleTrash,
    handleRemoveCategory,
    handleCopyLinkedNoteMarkdown,
  } = useNotesOptions(clickedNote)

  if (isDraftNote(clickedNote)) {
    return null
  }

  return (
    <nav className="options-nav" data-testid={TestID.NOTE_OPTIONS_NAV}>
      {clickedNote.trash && (
        <>
          <ContextMenuOption
            dataTestID={TestID.NOTE_OPTION_DELETE_PERMANENTLY}
            handler={handleDeleteNotes}
            icon={X}
            text={LabelText.DELETE_PERMANENTLY}
            optionType="delete"
          />
          <ContextMenuOption
            dataTestID={TestID.NOTE_OPTION_RESTORE_FROM_TRASH}
            handler={handleToggleTrash}
            icon={ArrowUp}
            text={LabelText.RESTORE_FROM_TRASH}
          />
        </>
      )}

      {!clickedNote.scratchpad && !clickedNote.trash && (
        <>
          <ContextMenuOption
            dataTestID={TestID.NOTE_OPTION_FAVORITE}
            handler={handleToggleFavorite}
            icon={Star}
            text={favoriteLabel}
          />
          <ContextMenuOption
            dataTestID={TestID.NOTE_OPTION_TRASH}
            handler={handleToggleTrash}
            icon={Trash}
            text={LabelText.MOVE_TO_TRASH}
            optionType="delete"
          />
        </>
      )}

      {clickedNote.category && !clickedNote.trash && (
        <ContextMenuOption
          dataTestID={TestID.NOTE_OPTION_REMOVE_CATEGORY}
          handler={handleRemoveCategory}
          icon={X}
          text={LabelText.REMOVE_CATEGORY}
        />
      )}

      <ContextMenuOption
        dataTestID={TestID.NOTE_OPTION_DOWNLOAD}
        handler={handleDownloadNotes}
        icon={Download}
        text={LabelText.DOWNLOAD}
      />

      <ContextMenuOption
        dataTestID={TestID.COPY_REFERENCE_TO_NOTE}
        handler={handleCopyLinkedNoteMarkdown}
        icon={Clipboard}
        text={LabelText.COPY_REFERENCE_TO_NOTE}
      />
    </nav>
  )
}