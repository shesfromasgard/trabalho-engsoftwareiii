import React, { useRef, useState, useEffect, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { v4 as uuid } from 'uuid'
import { Droppable } from 'react-beautiful-dnd'

import { LabelText } from '@resources/LabelText'
import { TestID } from '@resources/TestID'
import { CategoryOption } from '@/containers/CategoryOption'
import { getCategories } from '@/selectors'
import { shouldOpenContextMenu } from '@/utils/helpers'
import { ReactMouseEvent, ReactSubmitEvent, CategoryItem } from '@/types'
import { useTempState } from '@/contexts/TempStateContext'
import { setCategoryEdit, updateCategory, addCategory } from '@/slices/category'
import { AddCategoryForm } from '@/components/AppSidebar/AddCategoryForm'
import { AddCategoryButton } from '@/components/AppSidebar/AddCategoryButton'
import { CollapseCategoryListButton } from '@/components/AppSidebar/CollapseCategoryButton'

export const CategoryList: React.FC = () => {
  // ===========================================================================
  // Selectors & Dispatch
  // ===========================================================================
  const {
    categories,
    editingCategory: { id: editingCategoryId, tempName: tempCategoryName },
  } = useSelector(getCategories)

  const dispatch = useDispatch()

  // ===========================================================================
  // Refs & State
  // ===========================================================================
  const contextMenuRef = useRef<HTMLDivElement>(null)

  const [optionsId, setOptionsId] = useState('')
  const [optionsPosition, setOptionsPosition] = useState({ x: 0, y: 0 })
  const [isCategoryListOpen, setCategoryListOpen] = useState(true)

  // ===========================================================================
  // Context
  // ===========================================================================
  const { addingTempCategory, setAddingTempCategory } = useTempState()

  // ===========================================================================
  // Action Creators (Memoized)
  // ===========================================================================
  const _setCategoryEdit = useCallback(
    (categoryId: string, tempName: string) => {
      dispatch(setCategoryEdit({ id: categoryId, tempName }))
    },
    [dispatch]
  )

  const _updateCategory = useCallback(
    (category: CategoryItem) => {
      dispatch(updateCategory(category))
    },
    [dispatch]
  )

  const _addCategory = useCallback(
    (category: CategoryItem) => {
      dispatch(addCategory(category))
    },
    [dispatch]
  )

  // ===========================================================================
  // Helpers & Handlers
  // ===========================================================================
  const resetTempCategory = useCallback(() => {
    setAddingTempCategory(false)
    _setCategoryEdit('', '')
  }, [setAddingTempCategory, _setCategoryEdit])

  const validateAndExtractName = useCallback(
    (name: string): string | null => {
      const trimmedName = name.trim()
      if (!trimmedName) return null

      const isDuplicate = categories.some((cat) => cat.name === trimmedName)
      return isDuplicate ? null : trimmedName
    },
    [categories]
  )

  const onAddCategory = useCallback(
    (adding: boolean) => {
      setCategoryListOpen(true)
      setAddingTempCategory(adding)
    },
    [setAddingTempCategory]
  )

  const handleCategoryMenuClick = useCallback(
    (
      event: React.MouseEvent<HTMLDivElement, MouseEvent> | ReactMouseEvent,
      categoryId: string = ''
    ) => {
      const clicked = event.target as Element
      if (!clicked) return

      if (shouldOpenContextMenu(clicked) && 'clientX' in event && 'clientY' in event) {
        setOptionsPosition({ x: event.clientX, y: event.clientY })
      }

      event.stopPropagation()

      if (!contextMenuRef.current?.contains(clicked)) {
        setOptionsId((prevId) => (!prevId || prevId !== categoryId ? categoryId : ''))
      }
    },
    []
  )

  const handleCategoryRightClick = useCallback(
    (
      event: React.MouseEvent<HTMLDivElement, MouseEvent> | ReactMouseEvent,
      categoryId: string = ''
    ) => {
      event.preventDefault()
      handleCategoryMenuClick(event, categoryId)
    },
    [handleCategoryMenuClick]
  )

  const onSubmitUpdateCategory = useCallback(
    (event: ReactSubmitEvent): void => {
      event.preventDefault()
      const validName = validateAndExtractName(tempCategoryName)

      if (validName) {
        _updateCategory({ id: editingCategoryId, name: validName, draggedOver: false })
      }
      resetTempCategory()
    },
    [tempCategoryName, editingCategoryId, validateAndExtractName, _updateCategory, resetTempCategory]
  )

  const onSubmitNewCategory = useCallback(
    (event: ReactSubmitEvent): void => {
      event.preventDefault()
      const validName = validateAndExtractName(tempCategoryName)

      if (validName) {
        _addCategory({ id: uuid(), name: validName, draggedOver: false })
      }
      resetTempCategory()
    },
    [tempCategoryName, validateAndExtractName, _addCategory, resetTempCategory]
  )

  // ===========================================================================
  // Effects
  // ===========================================================================
  useEffect(() => {
    document.addEventListener('mousedown', handleCategoryMenuClick)
    return () => {
      document.removeEventListener('mousedown', handleCategoryMenuClick)
    }
  }, [handleCategoryMenuClick])

  // ===========================================================================
  // Render
  // ===========================================================================
  return (
    <>
      <div className="category-title">
        <CollapseCategoryListButton
          dataTestID={TestID.CATEGORY_COLLAPSE_BUTTON}
          handler={() => setCategoryListOpen(!isCategoryListOpen)}
          label={LabelText.COLLAPSE_CATEGORY}
          isCategoryListOpen={isCategoryListOpen}
          showIcon={categories.length > 0}
        />
        <AddCategoryButton
          dataTestID={TestID.ADD_CATEGORY_BUTTON}
          handler={onAddCategory}
          label={LabelText.ADD_CATEGORY}
        />
      </div>
      {isCategoryListOpen && (
        <>
          <Droppable type="CATEGORY" droppableId="Category list">
            {(droppableProvided) => (
              <div
                {...droppableProvided.droppableProps}
                ref={droppableProvided.innerRef}
                className="category-list"
                aria-label="Category list"
              >
                {categories.map((category, index) => (
                  <CategoryOption
                    key={category.id}
                    index={index}
                    category={category}
                    contextMenuRef={contextMenuRef}
                    handleCategoryMenuClick={handleCategoryMenuClick}
                    handleCategoryRightClick={handleCategoryRightClick}
                    onSubmitUpdateCategory={onSubmitUpdateCategory}
                    optionsId={optionsId}
                    setOptionsId={setOptionsId}
                    optionsPosition={optionsPosition}
                  />
                ))}
                {droppableProvided.placeholder}
              </div>
            )}
          </Droppable>
          {addingTempCategory && (
            <AddCategoryForm
              dataTestID={TestID.NEW_CATEGORY_FORM}
              submitHandler={onSubmitNewCategory}
              changeHandler={_setCategoryEdit}
              resetHandler={resetTempCategory}
              editingCategoryId={editingCategoryId}
              tempCategoryName={tempCategoryName}
            />
          )}
        </>
      )}
    </>
  )
}