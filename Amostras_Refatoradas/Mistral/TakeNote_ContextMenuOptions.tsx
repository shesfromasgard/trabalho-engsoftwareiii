import React, { useContext, useMemo } from 'react';
import { ArrowUp, Download, Star, Trash, X, Edit2, Clipboard } from 'react-feather';
import { useDispatch, useSelector } from 'react-redux';

import { LabelText } from '@resources/LabelText';
import { TestID } from '@resources/TestID';
import { ContextMenuOption } from '@/components/NoteList/ContextMenuOption';
import {
  downloadNotes,
  isDraftNote,
  getShortUuid,
  copyToClipboard,
} from '@/utils/helpers';
import {
  deleteNotes,
  toggleFavoriteNotes,
  toggleTrashNotes,
  addCategoryToNote,
  updateActiveNote,
  swapFolder,
  removeCategoryFromNotes,
} from '@/slices/note';
import { getCategories, getNotes } from '@/selectors';
import { Folder, ContextMenuEnum } from '@/utils/enums';
import { CategoryItem, NoteItem } from '@/types';
import { setCategoryEdit, deleteCategory } from '@/slices/category';
import { MenuUtilitiesContext } from '@/containers/ContextMenu';

// ===========================================================================
// Types
// ===========================================================================

export interface ContextMenuOptionsProps {
  clickedItem: NoteItem | CategoryItem;
  type: ContextMenuEnum;
}

interface CategoryOptionsProps {
  clickedCategory: CategoryItem;
}

interface NotesOptionsProps {
  clickedNote: NoteItem;
}

// ===========================================================================
// Category Options Component
// ===========================================================================

const CategoryOptions: React.FC<CategoryOptionsProps> = ({ clickedCategory }) => {
  const dispatch = useDispatch();
  const { setOptionsId } = useContext(MenuUtilitiesContext);

  const handleRename = () => {
    dispatch(setCategoryEdit({ id: clickedCategory.id, tempName: clickedCategory.name }));
    setOptionsId('');
  };

  const handleDelete = () => {
    dispatch(deleteCategory(clickedCategory.id));
    dispatch(removeCategoryFromNotes(clickedCategory.id));
    dispatch(swapFolder({ folder: Folder.ALL }));
  };

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
        handler={handleDelete}
        icon={X}
        text={LabelText.DELETE_PERMANENTLY}
        optionType="delete"
      />
    </nav>
  );
};

// ===========================================================================
// Notes Options Component
// ===========================================================================

const NotesOptions: React.FC<NotesOptionsProps> = ({ clickedNote }) => {
  const dispatch = useDispatch();
  const { selectedNotesIds, notes } = useSelector(getNotes);
  const { categories } = useSelector(getCategories);

  const selectedNotes = useMemo(
    () => notes.filter((note) => selectedNotesIds.includes(note.id)),
    [notes, selectedNotesIds]
  );

  const isSelectedNotesDiffFavor = useMemo(
    () =>
      selectedNotes.some((note) => note.favorite) &&
      selectedNotes.some((note) => !note.favorite),
    [selectedNotes]
  );

  const handleDeleteNotes = () => dispatch(deleteNotes(selectedNotesIds));

  const handleDownloadNotes = () => {
    const notesToDownload = selectedNotesIds.includes(clickedNote.id)
      ? selectedNotes
      : [clickedNote];
    downloadNotes(notesToDownload, categories);
  };

  const handleFavoriteNote = () => dispatch(toggleFavoriteNotes(clickedNote.id));

  const handleTrashNote = () => dispatch(toggleTrashNotes(clickedNote.id));

  const handleRemoveCategoryFromNote = () => {
    dispatch(addCategoryToNote({ categoryId: '', noteId: clickedNote.id }));
    dispatch(updateActiveNote({ noteId: clickedNote.id, multiSelect: false }));
  };

  const handleCopyLinkedNoteMarkdown = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const shortNoteUuid = getShortUuid(clickedNote.id);
    copyToClipboard(`{{${shortNoteUuid}}}`);
  };

  const getFavoriteButtonText = (): string => {
    if (isSelectedNotesDiffFavor) return LabelText.TOGGLE_FAVORITE;
    return clickedNote.favorite ? LabelText.REMOVE_FAVORITE : LabelText.MARK_AS_FAVORITE;
  };

  if (isDraftNote(clickedNote)) return null;

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
            handler={handleTrashNote}
            icon={ArrowUp}
            text={LabelText.RESTORE_FROM_TRASH}
          />
        </>
      )}

      {!clickedNote.scratchpad && !clickedNote.trash && (
        <>
          <ContextMenuOption
            dataTestID={TestID.NOTE_OPTION_FAVORITE}
            handler={handleFavoriteNote}
            icon={Star}
            text={getFavoriteButtonText()}
          />
          <ContextMenuOption
            dataTestID={TestID.NOTE_OPTION_TRASH}
            handler={handleTrashNote}
            icon={Trash}
            text={LabelText.MOVE_TO_TRASH}
            optionType="delete"
          />
        </>
      )}

      {clickedNote.category && !clickedNote.trash && (
        <ContextMenuOption
          dataTestID={TestID.NOTE_OPTION_REMOVE_CATEGORY}
          handler={handleRemoveCategoryFromNote}
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
  );
};

// ===========================================================================
// Main Component
// ===========================================================================

export const ContextMenuOptions: React.FC<ContextMenuOptionsProps> = ({ clickedItem, type }) => {
  return type === ContextMenuEnum.CATEGORY ? (
    <CategoryOptions clickedCategory={clickedItem as CategoryItem} />
  ) : (
    <NotesOptions clickedNote={clickedItem as NoteItem} />
  );
};