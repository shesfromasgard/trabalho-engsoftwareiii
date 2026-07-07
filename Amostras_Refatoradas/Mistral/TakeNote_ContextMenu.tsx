import React, { useEffect, useState, createContext, useMemo, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';

import { SelectCategory } from '@/components/NoteList/SelectCategory';
import { ContextMenuOptions } from '@/containers/ContextMenuOptions';
import { addCategoryToNote, updateActiveCategoryId, updateActiveNote } from '@/slices/note';
import { NoteItem, CategoryItem } from '@/types';
import { getNotes, getCategories, getSettings } from '@/selectors';
import { ContextMenuEnum } from '@/utils/enums';
import { isDraftNote } from '@/utils/helpers';

// ===========================================================================
// Context
// ===========================================================================

interface MenuUtilitiesContextValue {
  setOptionsId: (id: string) => void;
}

export const MenuUtilitiesContext = createContext<MenuUtilitiesContextValue>({
  setOptionsId: () => {},
});

// ===========================================================================
// Types
// ===========================================================================

interface Position {
  x: number;
  y: number;
}

export interface ContextMenuProps {
  item: NoteItem | CategoryItem;
  optionsPosition: Position;
  contextMenuRef: React.RefObject<HTMLDivElement> | null;
  setOptionsId: (id: string) => void;
  type: ContextMenuEnum;
}

interface CategoryMenuProps {
  category: CategoryItem;
}

interface NotesMenuProps {
  note: NoteItem;
  setOptionsId: (id: string) => void;
}

// ===========================================================================
// Helpers
// ===========================================================================

const calculateOptionsYPosition = (
  elementDimensions: { offsetHeight: number | null; offsetWidth: number | null },
  optionsPosition: Position
): number => {
  if (!elementDimensions.offsetHeight || !elementDimensions.offsetWidth) {
    return 0;
  }

  const maxY = window.innerHeight;
  const optionsSize = elementDimensions.offsetHeight;

  return maxY - optionsPosition.y > optionsSize
    ? optionsPosition.y
    : optionsPosition.y - optionsSize;
};

// ===========================================================================
// Components
// ===========================================================================

const CategoryMenu: React.FC<CategoryMenuProps> = ({ category }) => (
  <ContextMenuOptions clickedItem={category} type={ContextMenuEnum.CATEGORY} />
);

const NotesMenu: React.FC<NotesMenuProps> = ({ note, setOptionsId }) => {
  const { categories } = useSelector(getCategories);
  const { activeCategoryId } = useSelector(getNotes);
  const dispatch = useDispatch();

  const handleAddCategoryToNote = useCallback(
    (categoryId: string, noteId: string) => {
      dispatch(addCategoryToNote({ categoryId, noteId }));
    },
    [dispatch]
  );

  const handleUpdateActiveNote = useCallback(
    (noteId: string, multiSelect: boolean) => {
      dispatch(updateActiveNote({ noteId, multiSelect }));
    },
    [dispatch]
  );

  const handleUpdateActiveCategoryId = useCallback(
    (categoryId: string) => {
      dispatch(updateActiveCategoryId(categoryId));
    },
    [dispatch]
  );

  const handleCategoryChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const categoryId = event.target.value;
      handleAddCategoryToNote(categoryId, note.id);

      if (categoryId !== activeCategoryId) {
        handleUpdateActiveCategoryId(categoryId);
        handleUpdateActiveNote(note.id, false);
      }

      setOptionsId('');
    },
    [handleAddCategoryToNote, handleUpdateActiveCategoryId, handleUpdateActiveNote, note, activeCategoryId, setOptionsId]
  );

  if (isDraftNote(note)) {
    return null;
  }

  return (
    <>
      {!note.scratchpad && (
        <SelectCategory
          onChange={handleCategoryChange}
          categories={categories}
          activeCategoryId={activeCategoryId}
          note={note}
        />
      )}
      <ContextMenuOptions type={ContextMenuEnum.NOTE} clickedItem={note} />
    </>
  );
};

export const ContextMenu: React.FC<ContextMenuProps> = ({
  item,
  optionsPosition,
  contextMenuRef,
  setOptionsId,
  type,
}) => {
  const { darkTheme } = useSelector(getSettings);

  const [elementDimensions, setElementDimensions] = useState<{
    offsetHeight: number | null;
    offsetWidth: number | null;
  }>({ offsetHeight: null, offsetWidth: null });

  const contextValues = useMemo(
    () => ({ setOptionsId }),
    [setOptionsId]
  );

  useEffect(() => {
    if (contextMenuRef?.current) {
      const { offsetHeight, offsetWidth } = contextMenuRef.current;
      setElementDimensions({ offsetHeight, offsetWidth });
    }
  }, [contextMenuRef]);

  const optionsYPosition = calculateOptionsYPosition(elementDimensions, optionsPosition);

  const shouldRender = optionsYPosition !== 0;

  return ReactDOM.createPortal(
    <div className={type === ContextMenuEnum.CATEGORY || darkTheme ? 'dark' : ''}>
      <div
        ref={contextMenuRef}
        className="options-context-menu"
        style={{
          visibility: shouldRender ? 'visible' : 'hidden',
          position: 'absolute',
          top: `${optionsYPosition}px`,
          left: `${optionsPosition.x}px`,
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <MenuUtilitiesContext.Provider value={contextValues}>
          {type === ContextMenuEnum.CATEGORY ? (
            <CategoryMenu category={item as CategoryItem} />
          ) : (
            <NotesMenu note={item as NoteItem} setOptionsId={setOptionsId} />
          )}
        </MenuUtilitiesContext.Provider>
      </div>
    </div>,
    document.getElementById('context-menu') as HTMLElement
  );
};