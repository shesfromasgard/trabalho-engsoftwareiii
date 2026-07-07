import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Draggable } from 'react-beautiful-dnd';
import { Folder as FolderIcon, MoreHorizontal } from 'react-feather';

import { TestID } from '@resources/TestID';
import { CategoryItem, ReactDragEvent, ReactMouseEvent, ReactSubmitEvent } from '@/types';
import { determineCategoryClass } from '@/utils/helpers';
import { getNotes, getCategories, getSettings } from '@/selectors';
import {
  updateActiveCategoryId,
  updateActiveNote,
  updateSelectedNotes,
  addCategoryToNote,
} from '@/slices/note';
import { setCategoryEdit, categoryDragLeave, categoryDragEnter } from '@/slices/category';
import { iconColor } from '@/utils/constants';
import { ContextMenuEnum } from '@/utils/enums';
import { getNotesSorter } from '@/utils/notesSortStrategies';
import { ContextMenu } from '@/containers/ContextMenu';

interface CategoryOptionProps {
  category: CategoryItem;
  index: number;
  contextMenuRef: React.RefObject<HTMLDivElement>;
  handleCategoryMenuClick: (
    event: React.MouseEvent<HTMLDivElement, MouseEvent> | ReactMouseEvent,
    categoryId?: string
  ) => void;
  handleCategoryRightClick: (
    event: React.MouseEvent<HTMLDivElement, MouseEvent> | ReactMouseEvent,
    categoryId?: string
  ) => void;
  onSubmitUpdateCategory: (event: ReactSubmitEvent) => void;
  optionsPosition: { x: number; y: number };
  optionsId: string;
  setOptionsId: React.Dispatch<React.SetStateAction<string>>;
}

const useCategoryActions = () => {
  const dispatch = useDispatch();

  const updateActiveCategoryId = (categoryId: string) =>
    dispatch(updateActiveCategoryId(categoryId));

  const updateActiveNote = (noteId: string, multiSelect: boolean) =>
    dispatch(updateActiveNote({ noteId, multiSelect }));

  const updateSelectedNotes = (noteId: string, multiSelect: boolean) =>
    dispatch(updateSelectedNotes({ noteId, multiSelect }));

  const setCategoryEditAction = (categoryId: string, tempName: string) =>
    dispatch(setCategoryEdit({ id: categoryId, tempName }));

  const addCategoryToNoteAction = (categoryId: string, noteId: string) =>
    dispatch(addCategoryToNote({ categoryId, noteId }));

  const categoryDragEnterAction = (category: CategoryItem) =>
    dispatch(categoryDragEnter(category));

  const categoryDragLeaveAction = (category: CategoryItem) =>
    dispatch(categoryDragLeave(category));

  return {
    updateActiveCategoryId,
    updateActiveNote,
    updateSelectedNotes,
    setCategoryEditAction,
    addCategoryToNoteAction,
    categoryDragEnterAction,
    categoryDragLeaveAction,
  };
};

const useCategorySelectors = () => {
  const { activeCategoryId, notes } = useSelector(getNotes);
  const { editingCategory } = useSelector(getCategories);
  const { notesSortKey } = useSelector(getSettings);

  return {
    activeCategoryId,
    notes,
    editingCategory,
    notesSortKey,
  };
};

const getDefaultActiveNoteId = (notes: Array<{ id: string; trash: boolean; category: string }>, categoryId: string, notesSortKey: string): string => {
  const notesForNewCategory = notes
    .filter((note) => !note.trash && note.category === categoryId)
    .sort(getNotesSorter(notesSortKey));

  return notesForNewCategory.length > 0 ? notesForNewCategory[0].id : '';
};

const handleCategoryClick = (
  categoryId: string,
  activeCategoryId: string,
  defaultActiveNoteId: string,
  actions: ReturnType<typeof useCategoryActions>
) => {
  if (categoryId !== activeCategoryId) {
    actions.updateActiveCategoryId(categoryId);
    actions.updateActiveNote(defaultActiveNoteId, false);
    actions.updateSelectedNotes(defaultActiveNoteId, false);
  }
};

const handleDragDrop = (
  event: React.DragEvent,
  category: CategoryItem,
  actions: ReturnType<typeof useCategoryActions>
) => {
  event.preventDefault();
  const noteId = event.dataTransfer.getData('text');
  actions.addCategoryToNoteAction(category.id, noteId);
  actions.categoryDragLeaveAction(category);
};

const handleFormSubmit = (
  event: ReactSubmitEvent,
  setOptionsId: React.Dispatch<React.SetStateAction<string>>,
  onSubmitUpdateCategory: (event: ReactSubmitEvent) => void,
  actions: ReturnType<typeof useCategoryActions>
) => {
  event.preventDefault();
  actions.setCategoryEditAction('', '');
  onSubmitUpdateCategory(event);
  setOptionsId('');
};

const renderCategoryContent = (
  category: CategoryItem,
  editingCategory: { id: string; tempName: string },
  actions: ReturnType<typeof useCategoryActions>,
  onSubmitUpdateCategory: (event: ReactSubmitEvent) => void,
  setOptionsId: React.Dispatch<React.SetStateAction<string>>,
  optionsId: string
) => (
  <>
    <form
      className="category-list-name"
      onSubmit={(event) =>
        handleFormSubmit(event, setOptionsId, onSubmitUpdateCategory, actions)
      }
    >
      <FolderIcon size={15} className="app-sidebar-icon" color={iconColor} />
      {editingCategory.id === category.id ? (
        <input
          data-testid={TestID.CATEGORY_EDIT}
          className="category-edit"
          type="text"
          autoFocus
          maxLength={20}
          value={editingCategory.tempName}
          onChange={(event) => {
            actions.setCategoryEditAction(editingCategory.id, event.target.value);
          }}
          onBlur={onSubmitUpdateCategory}
        />
      ) : (
        category.name
      )}
    </form>
    <div
      data-testid={TestID.MOVE_CATEGORY}
      className={optionsId === category.id ? 'category-options active' : 'category-options'}
      onClick={(event) => handleCategoryMenuClick(event, category.id)}
    >
      <MoreHorizontal size={15} className="context-menu-action" />
    </div>
    {optionsId === category.id && (
      <ContextMenu
        contextMenuRef={contextMenuRef}
        item={category}
        optionsPosition={optionsPosition}
        setOptionsId={setOptionsId}
        type={ContextMenuEnum.CATEGORY}
      />
    )}
  </>
);

export const CategoryOption: React.FC<CategoryOptionProps> = ({
  category,
  index,
  contextMenuRef,
  handleCategoryMenuClick,
  handleCategoryRightClick,
  onSubmitUpdateCategory,
  optionsPosition,
  optionsId,
  setOptionsId,
}) => {
  const { activeCategoryId, notes, editingCategory, notesSortKey } =
    useCategorySelectors();
  const actions = useCategoryActions();

  const defaultActiveNoteId = getDefaultActiveNoteId(
    notes,
    category.id,
    notesSortKey
  );

  return (
    <Draggable draggableId={category.id} index={index}>
      {(draggableProvided, snapshot) => (
        <div
          {...draggableProvided.dragHandleProps}
          {...draggableProvided.draggableProps}
          ref={draggableProvided.innerRef}
          data-testid={TestID.CATEGORY_LIST_DIV}
          className={determineCategoryClass(
            category,
            snapshot.isDragging,
            activeCategoryId
          )}
          onClick={() =>
            handleCategoryClick(
              category.id,
              activeCategoryId,
              defaultActiveNoteId,
              actions
            )
          }
          onDoubleClick={() =>
            actions.setCategoryEditAction(category.id, category.name)
          }
          onBlur={() => actions.setCategoryEditAction('', '')}
          onDrop={(event) => handleDragDrop(event, category, actions)}
          onDragOver={(event: ReactDragEvent) => event.preventDefault()}
          onDragEnter={() => actions.categoryDragEnterAction(category)}
          onDragLeave={() => actions.categoryDragLeaveAction(category)}
          onContextMenu={(event) =>
            handleCategoryRightClick(event, category.id)
          }
        >
          {renderCategoryContent(
            category,
            editingCategory,
            actions,
            onSubmitUpdateCategory,
            setOptionsId,
            optionsId
          )}
        </div>
      )}
    </Draggable>
  );
};