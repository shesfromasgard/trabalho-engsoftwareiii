import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { MoreHorizontal, Book, Star, Folder as FolderIcon } from 'react-feather'

import { TestID } from '@resources/TestID'
import { Folder, Shortcuts, ContextMenuEnum } from '@/utils/enums'
import { NoteListButton } from '@/components/NoteList/NoteListButton'
import { SearchBar } from '@/components/NoteList/SearchBar'
import { ContextMenu } from '@/containers/ContextMenu'
import { getNoteTitle, shouldOpenContextMenu, debounceEvent, isDraftNote } from '@/utils/helpers'
import { useKey } from '@/utils/hooks'
import {
  permanentlyEmptyTrash,
  pruneNotes,
  updateActiveNote,
  searchNotes,
  updateSelectedNotes,
} from '@/slices/note'
import { NoteItem, ReactDragEvent, ReactMouseEvent } from '@/types'
import { getNotes, getSettings, getCategories } from '@/selectors'
import { getNotesSorter } from '@/utils/notesSortStrategies'

// ===========================================================================
// Sub-components (Internal to NoteList Module)
// ===========================================================================

interface NoteTitleProps {
  text: string;
  searchValue: string;
}

const NoteTitle: React.FC<NoteTitleProps> = ({ text, searchValue }) => {
  const noteTitle = getNoteTitle(text)

  if (!searchValue || typeof noteTitle !== 'string') {
    return <>{noteTitle}</>
  }

  const escapedSearch = searchValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(escapedSearch, 'i')
  const highlightStart = noteTitle.search(regex)

  if (highlightStart === -1) {
    return <>{noteTitle}</>
  }

  const highlightEnd = highlightStart + searchValue.length

  return (
    <>
      {noteTitle.slice(0, highlightStart)}
      <strong className="highlighted">
        {noteTitle.slice(highlightStart, highlightEnd)}
      </strong>
      {noteTitle.slice(highlightEnd)}
    </>
  )
}

interface NoteListItemProps {
  note: NoteItem
  index: number
  searchValue: string
  isSelected: boolean
  activeFolder: Folder
  noteCategory: any
  optionsId: string
  optionsPosition: { x: number; y: number }
  contextMenuRef: React.RefObject<HTMLDivElement | null>
  setOptionsId: React.Dispatch<React.SetStateAction<string>>
  onSelect: (noteId: string, metaKey: boolean) => void
  onContextMenu: (event: React.MouseEvent<HTMLDivElement, MouseEvent>, noteId: string) => void
  onOptionsClick: (event: ReactMouseEvent, noteId: string) => void
  onDragStart: (event: ReactDragEvent, noteId: string) => void
}

const NoteListItem: React.FC<NoteListItemProps> = ({
  note,
  index,
  searchValue,
  isSelected,
  activeFolder,
  noteCategory,
  optionsId,
  optionsPosition,
  contextMenuRef,
  setOptionsId,
  onSelect,
  onContextMenu,
  onOptionsClick,
  onDragStart,
}) => {
  const isDraft = isDraftNote(note)
  const isMenuOpen = optionsId === note.id
  const showCategoryInfo = activeFolder === Folder.ALL || activeFolder === Folder.FAVORITES

  return (
    <div
      data-testid={TestID.NOTE_LIST_ITEM + index}
      className={isSelected ? 'note-list-each selected' : 'note-list-each'}
      onClick={(event) => {
        event.stopPropagation()
        onSelect(note.id, event.metaKey)
      }}
      onContextMenu={(event) => onContextMenu(event, note.id)}
      draggable={note.text !== ''}
      onDragStart={(event) => onDragStart(event, note.id)}
    >
      <div className="note-list-outer">
        <div data-testid={`note-title-${index}`} className="note-title">
          {note.favorite ? (
            <>
              <div className="icon">
                <Star aria-hidden="true" className="note-favorite" size={12} />
                <span className="sr-only">Favorite note</span>
              </div>
              <div className="truncate-text">
                <NoteTitle text={note.text} searchValue={searchValue} />
              </div>
            </>
          ) : (
            <>
              <div className="icon" />
              <div className="truncate-text">
                <NoteTitle text={note.text} searchValue={searchValue} />
              </div>
            </>
          )}
        </div>

        {!isDraft ? (
          <div
            data-testid={TestID.NOTE_OPTIONS_DIV + index}
            className={isMenuOpen ? 'note-options selected' : 'note-options'}
            onClick={(event) => onOptionsClick(event, note.id)}
          >
            <MoreHorizontal aria-hidden="true" size={15} className="context-menu-action" />
            <span className="sr-only">Note options</span>
          </div>
        ) : (
          <div className="note-options">&nbsp;</div>
        )}
      </div>

      {showCategoryInfo && (
        <div className="note-category">
          {noteCategory ? (
            <>
              <FolderIcon size={12} className="context-menu-action" />
              {noteCategory.name}
            </>
          ) : (
            <>
              <Book size={12} className="context-menu-action" />
              Notes
            </>
          )}
        </div>
      )}

      {isMenuOpen && !isDraft && (
        <ContextMenu
          contextMenuRef={contextMenuRef}
          item={note}
          optionsPosition={optionsPosition}
          setOptionsId={setOptionsId}
          type={ContextMenuEnum.NOTE}
        />
      )}
    </div>
  )
}

// ===========================================================================
// Main Component
// ===========================================================================

export const NoteList: React.FC = () => {
  const dispatch = useDispatch()

  // Selectors
  const { notesSortKey } = useSelector(getSettings)
  const { activeCategoryId, activeFolder, selectedNotesIds, notes, searchValue } = useSelector(getNotes)
  const { categories } = useSelector(getCategories)

  // Refs
  const contextMenuRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // State
  const [optionsId, setOptionsId] = useState('')
  const [optionsPosition, setOptionsPosition] = useState({ x: 0, y: 0 })

  // Memoized Filtered Notes
  const filteredNotes = useMemo(() => {
    const escapedSearch = searchValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const searchRegex = new RegExp(escapedSearch, 'i')

    const folderFilters: Record<Folder, (note: NoteItem) => boolean> = {
      [Folder.CATEGORY]: (note) => !note.trash && note.category === activeCategoryId,
      [Folder.SCRATCHPAD]: (note) => !!note.scratchpad,
      [Folder.FAVORITES]: (note) => !note.trash && !!note.favorite,
      [Folder.TRASH]: (note) => !!note.trash,
      [Folder.ALL]: (note) => !note.trash && !note.scratchpad,
    }

    return notes
      .filter(folderFilters[activeFolder])
      .filter((note) => searchRegex.test(note.text))
      .sort(getNotesSorter(notesSortKey))
  }, [notes, activeFolder, activeCategoryId, searchValue, notesSortKey])

  const showEmptyTrash = activeFolder === Folder.TRASH && filteredNotes.length > 0

  // Callback Handlers
  const focusSearchHandler = useCallback(() => {
    searchRef.current?.focus()
  }, [])

  const handleSearchNotes = useMemo(() => {
    return debounceEvent((value: string) => dispatch(searchNotes(value)), 100)
  }, [dispatch])

  const handlePermanentlyEmptyTrash = useCallback(() => {
    dispatch(permanentlyEmptyTrash())
  }, [dispatch])

  const handleNoteSelect = useCallback((noteId: string, metaKey: boolean) => {
    dispatch(updateSelectedNotes({ noteId, multiSelect: metaKey }))
    dispatch(updateActiveNote({ noteId, multiSelect: metaKey }))
    dispatch(pruneNotes())
  }, [dispatch])

  const handleDragStart = useCallback((event: ReactDragEvent, noteId: string = '') => {
    event.stopPropagation()
    event.dataTransfer.setData('text/plain', noteId)
  }, [])

  const handleNoteOptionsClick = useCallback((event: ReactMouseEvent | MouseEvent, noteId: string = '') => {
    const clicked = event.target as Element
    if (!clicked) return

    if (shouldOpenContextMenu(clicked) && 'pageX' in event && 'pageY' in event) {
      setOptionsPosition({ x: event.pageX, y: event.pageY })
    }

    event.stopPropagation()

    if (!contextMenuRef.current || !contextMenuRef.current.contains(clicked)) {
      setOptionsId((prevId) => (!prevId || prevId !== noteId ? noteId : ''))
    }
  }, [])

  const handleNoteRightClick = useCallback((
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
    noteId: string = ''
  ) => {
    event.preventDefault()
    const clicked = event.target as Element
    const RIGHT_CLICK = 2

    if (!clicked || event.ctrlKey) return
    if (optionsId && event.button === RIGHT_CLICK) return

    if ('clientX' in event && 'clientY' in event) {
      setOptionsPosition({ x: event.clientX, y: event.clientY })
    }

    event.stopPropagation()

    if (!contextMenuRef.current || !contextMenuRef.current.contains(clicked)) {
      setOptionsId((prevId) => (!prevId || prevId !== noteId ? noteId : ''))
    }
  }, [optionsId])

  // Effects & Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalMouseDown = (event: MouseEvent) => handleNoteOptionsClick(event)
    document.addEventListener('mousedown', handleGlobalMouseDown)

    return () => {
      document.removeEventListener('mousedown', handleGlobalMouseDown)
    }
  }, [handleNoteOptionsClick])

  useKey(Shortcuts.SEARCH, focusSearchHandler)

  return (
    <aside className="note-sidebar">
      <div className="note-sidebar-header">
        <SearchBar searchRef={searchRef} searchNotes={handleSearchNotes} />
        {showEmptyTrash && (
          <NoteListButton
            dataTestID={TestID.EMPTY_TRASH_BUTTON}
            label="Empty"
            handler={handlePermanentlyEmptyTrash}
          >
            Empty Trash
          </NoteListButton>
        )}
      </div>
      <div data-testid={TestID.NOTE_LIST} className="note-list">
        {filteredNotes.map((note, index) => (
          <NoteListItem
            key={note.id}
            note={note}
            index={index}
            searchValue={searchValue}
            isSelected={selectedNotesIds.includes(note.id)}
            activeFolder={activeFolder}
            noteCategory={categories.find((category) => category.id === note.category)}
            optionsId={optionsId}
            optionsPosition={optionsPosition}
            contextMenuRef={contextMenuRef}
            setOptionsId={setOptionsId}
            onSelect={handleNoteSelect}
            onContextMenu={handleNoteRightClick}
            onOptionsClick={handleNoteOptionsClick}
            onDragStart={handleDragStart}
          />
        ))}
      </div>
    </aside>
  )
}