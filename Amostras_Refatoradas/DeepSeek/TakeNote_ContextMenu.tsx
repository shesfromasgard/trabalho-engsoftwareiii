import ReactDOM from 'react-dom'
import React, { useEffect, useState, useMemo, createContext, useContext } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { SelectCategory } from '@/components/NoteList/SelectCategory'
import { ContextMenuOptions } from '@/containers/ContextMenuOptions'
import { addCategoryToNote, updateActiveCategoryId, updateActiveNote } from '@/slices/note'
import { NoteItem, CategoryItem } from '@/types'
import { getNotes, getCategories, getSettings } from '@/selectors'
import { ContextMenuEnum } from '@/utils/enums'
import { isDraftNote } from '@/utils/helpers'

export const MenuUtilitiesContext = createContext({
  setOptionsId: (id: string) => {},
})

interface Position {
  x: number
  y: number
}

export interface ContextMenuProps {
  item: NoteItem | CategoryItem
  optionsPosition: Position
  contextMenuRef: React.RefObject<HTMLDivElement> | null
  setOptionsId: (id: string) => void
  type: ContextMenuEnum
}

// -----------------------------------------------------------------------------
// Custom hook – isolates positioning logic and dimension measurement
// -----------------------------------------------------------------------------
const useMenuPosition = (
  optionsPosition: Position,
  contextMenuRef: React.RefObject<HTMLDivElement> | null
) => {
  const [dimensions, setDimensions] = useState<{
    offsetHeight: number
    offsetWidth: number
  } | null>(null)

  useEffect(() => {
    if (contextMenuRef?.current) {
      const { offsetHeight, offsetWidth } = contextMenuRef.current
      setDimensions({ offsetHeight, offsetWidth })
    }
  }, [contextMenuRef])

  const isReady = dimensions !== null

  const yPosition = useMemo(() => {
    if (!dimensions) return 0
    const maxY = window.innerHeight
    const optionsSize = dimensions.offsetHeight
    return maxY - optionsPosition.y > optionsSize
      ? optionsPosition.y
      : optionsPosition.y - optionsSize
  }, [dimensions, optionsPosition.y])

  return { yPosition, isReady }
}

// -----------------------------------------------------------------------------
// ContextMenu – main exported component
// -----------------------------------------------------------------------------
export const ContextMenu: React.FC<ContextMenuProps> = ({
  item,
  optionsPosition,
  contextMenuRef,
  setOptionsId,
  type,
}) => {
  const { darkTheme } = useSelector(getSettings)
  const { yPosition, isReady } = useMenuPosition(optionsPosition, contextMenuRef)

  const contextValues = useMemo(() => ({ setOptionsId }), [setOptionsId])
  const isDarkMode = type === ContextMenuEnum.CATEGORY || darkTheme

  return ReactDOM.createPortal(
    <div className={isDarkMode ? 'dark' : ''}>
      <div
        ref={contextMenuRef}
        className="options-context-menu"
        style={{
          visibility: isReady ? 'visible' : 'hidden',
          position: 'absolute',
          top: `${yPosition}px`,
          left: `${optionsPosition.x}px`,
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <MenuUtilitiesContext.Provider value={contextValues}>
          {type === ContextMenuEnum.CATEGORY ? (
            <CategoryMenu category={item as CategoryItem} />
          ) : (
            <NotesMenu note={item as NoteItem} />
          )}
        </MenuUtilitiesContext.Provider>
      </div>
    </div>,
    document.getElementById('context-menu') as HTMLElement
  )
}

// -----------------------------------------------------------------------------
// Internal sub-components
// -----------------------------------------------------------------------------
interface CategoryMenuProps {
  category: CategoryItem
}

const CategoryMenu: React.FC<CategoryMenuProps> = ({ category }) => (
  <ContextMenuOptions clickedItem={category} type={ContextMenuEnum.CATEGORY} />
)

interface NotesMenuProps {
  note: NoteItem
}

const NotesMenu: React.FC<NotesMenuProps> = ({ note }) => {
  const { categories } = useSelector(getCategories)
  const { activeCategoryId } = useSelector(getNotes)
  const dispatch = useDispatch()
  const { setOptionsId } = useContext(MenuUtilitiesContext)

  if (isDraftNote(note)) return null
  if (note.scratchpad) {
    return <ContextMenuOptions type={ContextMenuEnum.NOTE} clickedItem={note} />
  }

  return (
    <>
      <SelectCategory
        onChange={(event) => {
          const categoryId = event.target.value

          dispatch(addCategoryToNote({ categoryId, noteId: note.id }))

          if (categoryId !== activeCategoryId) {
            dispatch(updateActiveCategoryId(categoryId))
            dispatch(updateActiveNote({ noteId: note.id, multiSelect: false }))
          }

          setOptionsId('')
        }}
        categories={categories}
        activeCategoryId={activeCategoryId}
        note={note}
      />
      <ContextMenuOptions type={ContextMenuEnum.NOTE} clickedItem={note} />
    </>
  )
}