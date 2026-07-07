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

interface NoteListItemProps {
  note: NoteItem
  index: number
  searchValue: string
  re: RegExp
  activeFolder: Folder
  categories: any[]
  optionsId: string
  selectedNotesIds: string[]
  contextMenuRef: React.RefObject<HTMLDivElement>
  optionsPosition: { x: number; y: number }
  setOptionsId: React.Dispatch<React.SetStateAction<string>>
  handleNoteOptionsClick: (event: ReactMouseEvent, noteId?: string) => void
  handleNoteRightClick: (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
    noteId?: string
  ) => void
  handleDragStart: (event: ReactDragEvent, noteId?: string) => void
  updateSelectedNotes: (noteId: string, multiSelect: boolean) => void
  updateActiveNote: (noteId: string, multiSelect: boolean) => void
  pruneNotes: () => void
}

const NoteListItem: React.FC<NoteListItemProps> = ({
  note,
  index,
  searchValue,
  re,
  activeFolder,
  categories,
  optionsId,
  selectedNotesIds,
  contextMenuRef,
  optionsPosition,
  setOptionsId,
  handleNoteOptionsClick,
  handleNoteRightClick,
  handleDragStart,
  updateSelectedNotes,
  updateActiveNote,
  pruneNotes,
}) => {
  let noteTitle: string | React.ReactElement = getNoteTitle(note.text)
  const noteCategory = categories.find((category: any) => category.id === note.category)

  if (searchValue) {
    const highlightStart = noteTitle.search(re)

    if (highlightStart !== -1) {
      const highlightEnd = highlightStart + searchValue.length

      noteTitle = (
        <>
          {noteTitle.slice(0, highlightStart)}
          <strong className="highlighted">
            {noteTitle.slice(highlightStart, highlightEnd)}
          </strong>
          {noteTitle.slice(highlightEnd)}
        </>
      )
    }
  }

  return (
    <div
      data-testid={TestID.NOTE_LIST_ITEM + index}
      className={
        selectedNotesIds.includes(note.id) ? 'note-list-each selected' : 'note-list-each'
      }
      onClick={(event) => {
        event.stopPropagation()
        updateSelectedNotes(note.id, event.metaKey)
        updateActiveNote(note.id, event.metaKey)
        pruneNotes()
      }}
      onContextMenu={(event) => handleNoteRightClick(event, note.id)}
      draggable={note.text !== ''}
      onDragStart={(event) => handleDragStart(event, note.id)}
    >
      <div className="note-list-outer">
        <div data-testid={'note-title-' + index} className="note-title">
          {note.favorite ? (
            <>
              <div className="icon">
                <Star aria-hidden="true" className="note-favorite" size={12} />
                <span className="sr-only">Favorite note</span>
              </div>
              <div className="truncate-text">{noteTitle}</div>
            </>
          ) : (
            <>
              <div className="icon" />
              <div className="truncate-text"> {noteTitle}</div>
            </>
          )}
        </div>
        {!isDraftNote(note) ? (
          <div
            data-testid={TestID.NOTE_OPTIONS_DIV + index}
            className={optionsId === note.id ? 'note-options selected' : 'note-options'}
            onClick={(event) => handleNoteOptionsClick(event, note.id)}
          >
            <MoreHorizontal aria-hidden="true" size={15} className="context-menu-action" />
            <span className="sr-only">Note options</span>
          </div>
        ) : (
          <div className="note-options">&nbsp;</div>
        )}
      </div>
      {(activeFolder === Folder.ALL || activeFolder === Folder.FAVORITES) && (
        <div className="note-category">
          {!!noteCategory ? (
            <>
              <FolderIcon size={12} className="context-menu-action" />
              {noteCategory?.name}
            </>
          ) : (
            <>
              <Book size={12} className="context-menu-action" />
              Notes
            </>
          )}
        </div>
      )}
      {optionsId === note.id && !isDraftNote(note) && (
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

export const NoteList: React.FC = () => {
  const { notesSortKey } = useSelector(getSettings)
  const { activeCategoryId, activeFolder, selectedNotesIds, notes, searchValue } =
    useSelector(getNotes)
  const { categories } = useSelector(getCategories)

  const dispatch = useDispatch()

  const _updateSelectedNotes = (noteId: string, multiSelect: boolean) =>
    dispatch(updateSelectedNotes({ noteId, multiSelect }))
  const _permanentlyEmptyTrash = () => dispatch(permanentlyEmptyTrash())
  const _pruneNotes = () => dispatch(pruneNotes())
  const _updateActiveNote = (noteId: string, multiSelect: boolean) =>
    dispatch(updateActiveNote({ noteId, multiSelect }))
  const _searchNotes = debounceEvent(
    (searchValue: string) => dispatch(searchNotes(searchValue)),
    100
  )

  const contextMenuRef = useRef<HTMLDivElement>(null)
  const searchRef = React.useRef() as React.MutableRefObject<HTMLInputElement>

  const [optionsId, setOptionsId] = useState('')
  const [optionsPosition, setOptionsPosition] = useState({ x: 0, y: 0 })

  const re = useMemo(
    () => new RegExp(searchValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
    [searchValue]
  )
  const isMatch = useCallback((note: NoteItem) => re.test(note.text), [re])

  const filteredNotes: NoteItem[] = useMemo(() => {
    const filter: Record<Folder, (note: NoteItem) => boolean> = {
      [Folder.CATEGORY]: (note) => !note.trash && note.category === activeCategoryId,
      [Folder.SCRATCHPAD]: (note) => !!note.scratchpad,
      [Folder.FAVORITES]: (note) => !note.trash && !!note.favorite,
      [Folder.TRASH]: (note) => !!note.trash,
      [Folder.ALL]: (note) => !note.trash && !note.scratchpad,
    }

    return notes
      .filter(filter[activeFolder])
      .filter(isMatch)
      .sort(getNotesSorter(notesSortKey))
  }, [notes, activeFolder, activeCategoryId, isMatch, notesSortKey])

  const focusSearchHandler = () => searchRef.current.focus()

  const handleDragStart = (event: ReactDragEvent, noteId: string = '') => {
    event.stopPropagation()
    event.dataTransfer.setData('text/plain', noteId)
  }

  const handleNoteOptionsClick = (event: ReactMouseEvent, noteId: string = '') => {
    const clicked = event.target

    if (!clicked) return

    if (shouldOpenContextMenu(clicked as Element)) {
      if ('pageX' in event && 'pageY' in event) {
        setOptionsPosition({ x: event.pageX, y: event.pageY })
      }
    }

    event.stopPropagation()

    if (!contextMenuRef.current || !contextMenuRef.current.contains(clicked as HTMLDivElement)) {
      setOptionsId(!optionsId || optionsId !== noteId ? noteId : '')
    }
  }

  const handleNoteRightClick = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
    noteId: string = ''
  ) => {
    event.preventDefault()
    const clicked = event.target
    const RIGHT_CLICK = 2

    if (!clicked) return

    if (event.ctrlKey) return

    if (optionsId && event.button == RIGHT_CLICK) return

    if ('clientX' in event && 'clientY' in event) {
      setOptionsPosition({ x: event.clientX, y: event.clientY })
    }

    event.stopPropagation()

    if (!contextMenuRef.current || contextMenuRef.current.contains(clicked as HTMLDivElement)) {
      setOptionsId(!optionsId || optionsId !== noteId ? noteId : '')
    }
  }

  const showEmptyTrash = activeFolder === Folder.TRASH && filteredNotes.length > 0

  useEffect(() => {
    document.addEventListener('mousedown', handleNoteOptionsClick)

    return () => {
      document.removeEventListener('mousedown', handleNoteOptionsClick)
    }
  })

  useKey(Shortcuts.SEARCH, () => focusSearchHandler())

  return (
    <aside className="note-sidebar">
      <div className="note-sidebar-header">
        <SearchBar searchRef={searchRef} searchNotes={_searchNotes} />
        {showEmptyTrash && (
          <NoteListButton
            dataTestID={TestID.EMPTY_TRASH_BUTTON}
            label="Empty"
            handler={() => _permanentlyEmptyTrash()}
          >
            Empty Trash
          </NoteListButton>
        )}
      </div>
      <div data-testid={TestID.NOTE_LIST} className="note-list">
        {filteredNotes.map((note: NoteItem, index: number) => (
          <NoteListItem
            key={note.id}
            note={note}
            index={index}
            searchValue={searchValue}
            re={re}
            activeFolder={activeFolder}
            categories={categories}
            optionsId={optionsId}
            selectedNotesIds={selectedNotesIds}
            contextMenuRef={contextMenuRef}
            optionsPosition={optionsPosition}
            setOptionsId={setOptionsId}
            handleNoteOptionsClick={handleNoteOptionsClick}
            handleNoteRightClick={handleNoteRightClick}
            handleDragStart={handleDragStart}
            updateSelectedNotes={_updateSelectedNotes}
            updateActiveNote={_updateActiveNote}
            pruneNotes={_pruneNotes}
          />
        ))}
      </div>
    </aside>
  )
}