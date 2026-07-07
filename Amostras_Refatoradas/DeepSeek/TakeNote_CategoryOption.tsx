import React, { useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Draggable } from 'react-beautiful-dnd'
import { Folder as FolderIcon, MoreHorizontal } from 'react-feather'

import { TestID } from '@resources/TestID'
import { CategoryItem, ReactDragEvent, ReactMouseEvent, ReactSubmitEvent } from '@/types'
import { determineCategoryClass } from '@/utils/helpers'
import { getNotes, getCategories, getSettings } from '@/selectors'
import {
  updateActiveCategoryId,
  updateActiveNote,
  updateSelectedNotes,
  addCategoryToNote,
} from '@/slices/note'
import { setCategoryEdit, categoryDragLeave, categoryDragEnter } from '@/slices/category'
import { iconColor } from '@/utils/constants'
import { ContextMenuEnum } from '@/utils/enums'
import { getNotesSorter } from '@/utils/notesSortStrategies'
import { ContextMenu } from '@/containers/ContextMenu'

interface CategoryOptionProps {
  category: CategoryItem
  index: number
  contextMenuRef: React.RefObject<HTMLDivElement>
  handleCategoryMenuClick: (
    event: React.MouseEvent<HTMLDivElement, MouseEvent> | ReactMouseEvent,
    categoryId?: string
  ) => void
  handleCategoryRightClick: (
    event: React.MouseEvent<HTMLDivElement, MouseEvent> | ReactMouseEvent,
    categoryId?: string
  ) => void
  onSubmitUpdateCategory: (event: ReactSubmitEvent) => void
  optionsPosition: { x: number; y: number }
  optionsId: string
  setOptionsId: React.Dispatch<React.SetStateAction<string>>
}

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
  const { activeCategoryId, notes } = useSelector(getNotes)
  const {
    editingCategory: { id: editingCategoryId, tempName: tempCategoryName },
  } = useSelector(getCategories)
  const { notesSortKey } = useSelector(getSettings)

  const dispatch = useDispatch()

  const dispatchSetActiveCategory = useCallback(
    (categoryId: string) => dispatch(updateActiveCategoryId(categoryId)),
    [dispatch]
  )
  const dispatchSetActiveNote = useCallback(
    (noteId: string, multiSelect: boolean) =>
      dispatch(updateActiveNote({ noteId, multiSelect })),
    [dispatch]
  )
  const dispatchSetSelectedNotes = useCallback(
    (noteId: string, multiSelect: boolean) =>
      dispatch(updateSelectedNotes({ noteId, multiSelect })),
    [dispatch]
  )
  const dispatchSetCategoryEdit = useCallback(
    (categoryId: string, tempName: string) =>
      dispatch(setCategoryEdit({ id: categoryId, tempName })),
    [dispatch]
  )
  const dispatchAddCategoryToNote = useCallback(
    (categoryId: string, noteId: string) =>
      dispatch(addCategoryToNote({ categoryId, noteId })),
    [dispatch]
  )
  const dispatchCategoryDragEnter = useCallback(
    (category: CategoryItem) => dispatch(categoryDragEnter(category)),
    [dispatch]
  )
  const dispatchCategoryDragLeave = useCallback(
    (category: CategoryItem) => dispatch(categoryDragLeave(category)),
    [dispatch]
  )

  const handleClick = useCallback(() => {
    const notesForNewCategory = notes
      .filter((note) => !note.trash && note.category === category.id)
      .sort(getNotesSorter(notesSortKey))

    const defaultActiveNoteId =
      notesForNewCategory.length > 0 ? notesForNewCategory[0].id : ''

    if (category.id !== activeCategoryId) {
      dispatchSetActiveCategory(category.id)
      dispatchSetActiveNote(defaultActiveNoteId, false)
      dispatchSetSelectedNotes(defaultActiveNoteId, false)
    }
  }, [
    notes,
    notesSortKey,
    category.id,
    activeCategoryId,
    dispatchSetActiveCategory,
    dispatchSetActiveNote,
    dispatchSetSelectedNotes,
  ])

  const handleDoubleClick = useCallback(() => {
    dispatchSetCategoryEdit(category.id, category.name)
  }, [category.id, category.name, dispatchSetCategoryEdit])

  const handleBlur = useCallback(() => {
    dispatchSetCategoryEdit('', '')
  }, [dispatchSetCategoryEdit])

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      dispatchAddCategoryToNote(category.id, event.dataTransfer.getData('text'))
      dispatchCategoryDragLeave(category)
    },
    [category, dispatchAddCategoryToNote, dispatchCategoryDragLeave]
  )

  const handleDragOver = useCallback((event: ReactDragEvent) => {
    event.preventDefault()
  }, [])

  const handleDragEnter = useCallback(() => {
    dispatchCategoryDragEnter(category)
  }, [category, dispatchCategoryDragEnter])

  const handleDragLeave = useCallback(() => {
    dispatchCategoryDragLeave(category)
  }, [category, dispatchCategoryDragLeave])

  const handleContextMenu = useCallback(
    (event: React.MouseEvent<HTMLDivElement, MouseEvent>) =>
      handleCategoryRightClick(event, category.id),
    [category.id, handleCategoryRightClick]
  )

  const handleFormSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault()
      dispatchSetCategoryEdit('', '')
      onSubmitUpdateCategory(event)
      if (optionsId) setOptionsId('')
    },
    [dispatchSetCategoryEdit, onSubmitUpdateCategory, optionsId, setOptionsId]
  )

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      dispatchSetCategoryEdit(editingCategoryId, event.target.value)
    },
    [editingCategoryId, dispatchSetCategoryEdit]
  )

  const handleInputBlur = useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      onSubmitUpdateCategory(event)
    },
    [onSubmitUpdateCategory]
  )

  const handleOptionsClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement, MouseEvent>) =>
      handleCategoryMenuClick(event, category.id),
    [category.id, handleCategoryMenuClick]
  )

  return (
    <Draggable draggableId={category.id} index={index}>
      {(draggableProvided, snapshot) => (
        <div
          {...draggableProvided.dragHandleProps}
          {...draggableProvided.draggableProps}
          ref={draggableProvided.innerRef}
          data-testid={TestID.CATEGORY_LIST_DIV}
          className={determineCategoryClass(category, snapshot.isDragging, activeCategoryId)}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          onBlur={handleBlur}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onContextMenu={handleContextMenu}
        >
          <form className="category-list-name" onSubmit={handleFormSubmit}>
            <FolderIcon size={15} className="app-sidebar-icon" color={iconColor} />
            {editingCategoryId === category.id ? (
              <input
                data-testid={TestID.CATEGORY_EDIT}
                className="category-edit"
                type="text"
                autoFocus
                maxLength={20}
                value={tempCategoryName}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
              />
            ) : (
              category.name
            )}
          </form>
          <div
            data-testid={TestID.MOVE_CATEGORY}
            className={
              optionsId === category.id ? 'category-options active' : 'category-options'
            }
            onClick={handleOptionsClick}
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
        </div>
      )}
    </Draggable>
  )
}