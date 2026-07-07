import React from 'react'
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
  const dispatch = useDispatch()

  // ===========================================================================
  // Selectors
  // ===========================================================================
  const { activeCategoryId, notes } = useSelector(getNotes)
  const { notesSortKey } = useSelector(getSettings)
  const {
    editingCategory: { id: editingCategoryId, tempName: tempCategoryName },
  } = useSelector(getCategories)

  // ===========================================================================
  // Computed States
  // ===========================================================================
  const isEditing = editingCategoryId === category.id
  const isOptionsActive = optionsId === category.id
  const optionsClassName = `category-options ${isOptionsActive ? 'active' : ''}`.trim()

  // ===========================================================================
  // Handlers
  // ===========================================================================
  const handleCategoryClick = () => {
    const notesForNewCategory = notes
      .filter((note) => !note.trash && note.category === category.id)
      .sort(getNotesSorter(notesSortKey))

    const defaultActiveNoteId = notesForNewCategory.length > 0 ? notesForNewCategory[0].id : ''

    if (category.id !== activeCategoryId) {
      dispatch(updateActiveCategoryId(category.id))
      dispatch(updateActiveNote({ noteId: defaultActiveNoteId, multiSelect: false }))
      dispatch(updateSelectedNotes({ noteId: defaultActiveNoteId, multiSelect: false }))
    }
  }

  const handleCategoryDoubleClick = () => {
    dispatch(setCategoryEdit({ id: category.id, tempName: category.name }))
  }

  const handleCategoryBlur = () => {
    dispatch(setCategoryEdit({ id: '', tempName: '' }))
  }

  const handleCategoryDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    dispatch(addCategoryToNote({ categoryId: category.id, noteId: event.dataTransfer.getData('text') }))
    dispatch(categoryDragLeave(category))
  }

  const handleFormSubmit = (event: ReactSubmitEvent) => {
    event.preventDefault()
    dispatch(setCategoryEdit({ id: '', tempName: '' }))
    onSubmitUpdateCategory(event)

    if (optionsId) {
      setOptionsId('')
    }
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setCategoryEdit({ id: editingCategoryId, tempName: event.target.value }))
  }

  return (
    <Draggable draggableId={category.id} index={index}>
      {(draggableProvided, snapshot) => (
        <div
          {...draggableProvided.dragHandleProps}
          {...draggableProvided.draggableProps}
          ref={draggableProvided.innerRef}
          data-testid={TestID.CATEGORY_LIST_DIV}
          className={determineCategoryClass(category, snapshot.isDragging, activeCategoryId)}
          onClick={handleCategoryClick}
          onDoubleClick={handleCategoryDoubleClick}
          onBlur={handleCategoryBlur}
          onDrop={handleCategoryDrop}
          onDragOver={(event: ReactDragEvent) => event.preventDefault()}
          onDragEnter={() => dispatch(categoryDragEnter(category))}
          onDragLeave={() => dispatch(categoryDragLeave(category))}
          onContextMenu={(event) => handleCategoryRightClick(event, category.id)}
        >
          <form className="category-list-name" onSubmit={handleFormSubmit}>
            <FolderIcon size={15} className="app-sidebar-icon" color={iconColor} />
            {isEditing ? (
              <input
                data-testid={TestID.CATEGORY_EDIT}
                className="category-edit"
                type="text"
                autoFocus
                maxLength={20}
                value={tempCategoryName}
                onChange={handleInputChange}
                onBlur={(event) => onSubmitUpdateCategory(event as any)}
              />
            ) : (
              category.name
            )}
          </form>

          <div
            data-testid={TestID.MOVE_CATEGORY}
            className={optionsClassName}
            onClick={(event) => handleCategoryMenuClick(event, category.id)}
          >
            <MoreHorizontal size={15} className="context-menu-action" />
          </div>

          {isOptionsActive && (
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