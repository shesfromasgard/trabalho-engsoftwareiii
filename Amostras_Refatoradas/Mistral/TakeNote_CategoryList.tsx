import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { v4 as uuid } from 'uuid';
import { Droppable } from 'react-beautiful-dnd';

import { LabelText } from '@resources/LabelText';
import { TestID } from '@resources/TestID';
import { CategoryOption } from '@/containers/CategoryOption';
import { getCategories } from '@/selectors';
import { shouldOpenContextMenu } from '@/utils/helpers';
import { ReactMouseEvent, ReactSubmitEvent, CategoryItem } from '@/types';
import { useTempState } from '@/contexts/TempStateContext';
import { setCategoryEdit, updateCategory, addCategory } from '@/slices/category';
import { AddCategoryForm } from '@/components/AppSidebar/AddCategoryForm';
import { AddCategoryButton } from '@/components/AppSidebar/AddCategoryButton';
import { CollapseCategoryListButton } from '@/components/AppSidebar/CollapseCategoryButton';

interface ContextMenuPosition {
  x: number;
  y: number;
}

export const CategoryList: React.FC = () => {
  // ===========================================================================
  // Selectors
  // ===========================================================================
  const { categories, editingCategory } = useSelector(getCategories);
  const { id: editingCategoryId, tempName: tempCategoryName } = editingCategory;

  // ===========================================================================
  // Dispatch
  // ===========================================================================
  const dispatch = useDispatch();

  const handleSetCategoryEdit = useCallback(
    (categoryId: string, tempName: string) => {
      dispatch(setCategoryEdit({ id: categoryId, tempName }));
    },
    [dispatch]
  );

  const handleUpdateCategory = useCallback(
    (category: CategoryItem) => {
      dispatch(updateCategory(category));
    },
    [dispatch]
  );

  const handleAddCategory = useCallback(
    (category: CategoryItem) => {
      dispatch(addCategory(category));
    },
    [dispatch]
  );

  // ===========================================================================
  // Refs
  // ===========================================================================
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // ===========================================================================
  // State
  // ===========================================================================
  const [optionsId, setOptionsId] = useState('');
  const [optionsPosition, setOptionsPosition] = useState<ContextMenuPosition>({ x: 0, y: 0 });
  const [isCategoryListOpen, setCategoryListOpen] = useState(true);

  // ===========================================================================
  // Context
  // ===========================================================================
  const { addingTempCategory, setAddingTempCategory } = useTempState();

  // ===========================================================================
  // Handlers
  // ===========================================================================
  const handleAddCategoryClick = useCallback(() => {
    setCategoryListOpen(true);
    setAddingTempCategory(true);
  }, [setAddingTempCategory]);

  const handleCategoryMenuClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement, MouseEvent> | ReactMouseEvent, categoryId: string = '') => {
      const clicked = event.target as Element;
      if (!clicked) return;

      if (shouldOpenContextMenu(clicked)) {
        if ('clientX' in event && 'clientY' in event) {
          setOptionsPosition({ x: event.clientX, y: event.clientY });
        }
      }

      event.stopPropagation();

      if (!contextMenuRef.current?.contains(clicked)) {
        setOptionsId(prevId => (!prevId || prevId !== categoryId ? categoryId : ''));
      }
    },
    [contextMenuRef]
  );

  const handleCategoryRightClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement, MouseEvent> | ReactMouseEvent, categoryId: string = '') => {
      event.preventDefault();
      handleCategoryMenuClick(event, categoryId);
    },
    [handleCategoryMenuClick]
  );

  const resetTempCategory = useCallback(() => {
    setAddingTempCategory(false);
    handleSetCategoryEdit('', '');
  }, [setAddingTempCategory, handleSetCategoryEdit]);

  const handleSubmitUpdateCategory = useCallback(
    (event: ReactSubmitEvent) => {
      event.preventDefault();
      const category = { id: editingCategoryId, name: tempCategoryName.trim(), draggedOver: false };

      const isDuplicateOrEmpty = categories.some(cat => cat.name === category.name) || category.name === '';
      if (isDuplicateOrEmpty) {
        resetTempCategory();
        return;
      }
      handleUpdateCategory(category);
      resetTempCategory();
    },
    [editingCategoryId, tempCategoryName, categories, resetTempCategory, handleUpdateCategory]
  );

  const handleSubmitNewCategory = useCallback(
    (event: ReactSubmitEvent) => {
      event.preventDefault();
      const category = { id: uuid(), name: tempCategoryName.trim(), draggedOver: false };

      const isDuplicateOrEmpty = categories.some(cat => cat.name === category.name) || category.name === '';
      if (isDuplicateOrEmpty) {
        resetTempCategory();
        return;
      }
      handleAddCategory(category);
      resetTempCategory();
    },
    [tempCategoryName, categories, resetTempCategory, handleAddCategory]
  );

  // ===========================================================================
  // Hooks
  // ===========================================================================
  useEffect(() => {
    const handleDocumentMouseDown = (event: MouseEvent) => {
      handleCategoryMenuClick(event, '');
    };

    document.addEventListener('mousedown', handleDocumentMouseDown);
    return () => {
      document.removeEventListener('mousedown', handleDocumentMouseDown);
    };
  }, [handleCategoryMenuClick]);

  // ===========================================================================
  // Render
  // ===========================================================================
  return (
    <>
      <div className="category-title">
        <CollapseCategoryListButton
          dataTestID={TestID.CATEGORY_COLLAPSE_BUTTON}
          handler={() => setCategoryListOpen(prev => !prev)}
          label={LabelText.COLLAPSE_CATEGORY}
          isCategoryListOpen={isCategoryListOpen}
          showIcon={categories.length > 0}
        />
        <AddCategoryButton
          dataTestID={TestID.ADD_CATEGORY_BUTTON}
          handler={handleAddCategoryClick}
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
                    onSubmitUpdateCategory={handleSubmitUpdateCategory}
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
              submitHandler={handleSubmitNewCategory}
              changeHandler={handleSetCategoryEdit}
              resetHandler={resetTempCategory}
              editingCategoryId={editingCategoryId}
              tempCategoryName={tempCategoryName}
            />
          )}
        </>
      )}
    </>
  );
};