import React, { useEffect, useState, createContext, useMemo } from 'react'
import ReactDOM from 'react-dom'
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

export const ContextMenu: React.FC<ContextMenuProps> = ({
  item,
  optionsPosition,
  contextMenuRef,
  setOptionsId,
  type,
}) => {
  const { darkTheme } = useSelector(getSettings)

  const [elementDimensions, setElementDimensions] = useState<{
    offsetHeight: number | null
    offsetWidth: number | null
  }>({ offsetHeight: null, offsetWidth: null })

  useEffect(() => {
    if (contextMenuRef?.current) {
      const { offsetHeight, offsetWidth } = contextMenuRef.current
      setElementDimensions({ offsetHeight, offsetWidth })
    }
  }, [contextMenuRef])

  const contextValues = useMemo(() => ({ setOptionsId }), [setOptionsId])

  const getOptionsYPosition = (): number => {
    const { offsetHeight, offsetWidth } = elementDimensions
    if (!offsetHeight && !offsetWidth) {
      return 0
    }

    const maxY = window.innerHeight
    const optionsSize = offsetHeight as number
    const hasSpaceBelow = maxY - optionsPosition.y > optionsSize

    return hasSpaceBelow ? optionsPosition.y : optionsPosition.y - optionsSize
  }

  const yPosition = getOptionsYPosition()
  const isVisible = yPosition !== 0
  const isCategoryType = type === ContextMenuEnum.CATEGORY
  const containerClassName = isCategoryType || darkTheme ? 'dark' : ''

  return ReactDOM.createPortal(
    <div className={containerClassName}>
      <div
        ref={contextMenuRef}
        className="options-context-menu"
        style={{
          visibility: isVisible ? 'visible' : 'hidden',
          position: 'absolute',
          top: `${yPosition}px`,
          left: `${optionsPosition.x}px`,
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <MenuUtilitiesContext.Provider value={contextValues}>
          {isCategoryType ? (
            <CategoryMenu category={item as CategoryItem} />
          ) : (
            <NotesMenu note={item as NoteItem} setOptionsId={setOptionsId} />
          )}
        </MenuUtilitiesContext.Provider>
      </div>
    </div>,
    document.getElementById('context-menu') as HTMLElement
  )
}

interface CategoryMenuProps {
  category: CategoryItem
}

const CategoryMenu: React.FC<CategoryMenuProps> = ({ category }) => (
  <ContextMenuOptions clickedItem={category} type={ContextMenuEnum.CATEGORY} />
)

interface NotesMenuProps {
  note: NoteItem
  setOptionsId: (id: string) => void
}

const NotesMenu: React.FC<NotesMenuProps> = ({ note, setOptionsId }) => {
  const { categories } = useSelector(getCategories)
  const { activeCategoryId } = useSelector(getNotes)
  const dispatch = useDispatch()

  if (isDraftNote(note)) {
    return null
  }

  const handleCategoryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const targetCategoryId = event.target.value

    dispatch(addCategoryToNote({ categoryId: targetCategoryId, noteId: note.id }))

    if (targetCategoryId !== activeCategoryId) {
      dispatch(updateActiveCategoryId(targetCategoryId))
      dispatch(updateActiveNote({ noteId: note.id, multiSelect: false }))
    }

    setOptionsId('')
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
  )
}