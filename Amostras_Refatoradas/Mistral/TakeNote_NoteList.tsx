import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { MoreHorizontal, Book, Star, Folder as FolderIcon } from 'react-feather';

import { TestID } from '@resources/TestID';
import { Folder, Shortcuts, ContextMenuEnum } from '@/utils/enums';
import { NoteListButton } from '@/components/NoteList/NoteListButton';
import { SearchBar } from '@/components/NoteList/SearchBar';
import { ContextMenu } from '@/containers/ContextMenu';
import {
  getNoteTitle,
  shouldOpenContextMenu,
  debounceEvent,
  isDraftNote,
} from '@/utils/helpers';
import { useKey } from '@/utils/hooks';
import {
  permanentlyEmptyTrash,
  pruneNotes,
  updateActiveNote,
  searchNotes,
  updateSelectedNotes,
} from '@/slices/note';
import { NoteItem, ReactDragEvent, ReactMouseEvent } from '@/types';
import { getNotes, getSettings, getCategories } from '@/selectors';
import { getNotesSorter } from '@/utils/notesSortStrategies';

const RIGHT_CLICK = 2;

interface NoteListProps {
  // Props can be added here if needed in the future
}

export const NoteList: React.FC<NoteListProps> = () => {
  // ===========================================================================
  // Selectors
  // ===========================================================================
  const { notesSortKey } = useSelector(getSettings);
  const { activeCategoryId, activeFolder, selectedNotesIds, notes, searchValue } =
    useSelector(getNotes);
  const { categories } = useSelector(getCategories);

  // ===========================================================================
  // Dispatch
  // ===========================================================================
  const dispatch = useDispatch();

  const handleUpdateSelectedNotes = useCallback(
    (noteId: string, multiSelect: boolean) => {
      dispatch(updateSelectedNotes({ noteId, multiSelect }));
    },
    [dispatch]
  );

  const handlePermanentlyEmptyTrash = useCallback(() => {
    dispatch(permanentlyEmptyTrash());
  }, [dispatch]);

  const handlePruneNotes = useCallback(() => {
    dispatch(pruneNotes());
  }, [dispatch]);

  const handleUpdateActiveNote = useCallback(
    (noteId: string, multiSelect: boolean) => {
      dispatch(updateActiveNote({ noteId, multiSelect }));
    },
    [dispatch]
  );

  const handleSearchNotes = useCallback(
    debounceEvent(
      (searchValue: string) => dispatch(searchNotes(searchValue)),
      100
    ),
    [dispatch]
  );

  // ===========================================================================
  // Refs
  // ===========================================================================
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // ===========================================================================
  // State
  // ===========================================================================
  const [optionsId, setOptionsId] = useState<string>('');
  const [optionsPosition, setOptionsPosition] = useState({ x: 0, y: 0 });

  // ===========================================================================
  // Derived Data
  // ===========================================================================
  const searchRegex = useMemo(
    () => new RegExp(searchValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
    [searchValue]
  );

  const isSearchMatch = useCallback(
    (result: NoteItem) => searchRegex.test(result.text),
    [searchRegex]
  );

  const noteFilters = useMemo(
    () => ({
      [Folder.CATEGORY]: (note: NoteItem) => !note.trash && note.category === activeCategoryId,
      [Folder.SCRATCHPAD]: (note: NoteItem) => !!note.scratchpad,
      [Folder.FAVORITES]: (note: NoteItem) => !note.trash && !!note.favorite,
      [Folder.TRASH]: (note: NoteItem) => !!note.trash,
      [Folder.ALL]: (note: NoteItem) => !note.trash && !note.scratchpad,
    }),
    [activeCategoryId]
  );

  const filteredNotes = useMemo(() => {
    return notes
      .filter(noteFilters[activeFolder])
      .filter(isSearchMatch)
      .sort(getNotesSorter(notesSortKey));
  }, [notes, noteFilters, activeFolder, isSearchMatch, notesSortKey]);

  const showEmptyTrash = activeFolder === Folder.TRASH && filteredNotes.length > 0;

  // ===========================================================================
  // Handlers
  // ===========================================================================
  const focusSearchHandler = useCallback(() => {
    searchRef.current?.focus();
  }, []);

  const handleDragStart = useCallback(
    (event: ReactDragEvent, noteId: string = '') => {
      event.stopPropagation();
      event.dataTransfer.setData('text/plain', noteId);
    },
    []
  );

  const handleNoteOptionsClick = useCallback(
    (event: ReactMouseEvent, noteId: string = '') => {
      const clicked = event.target as Element | null;
      if (!clicked) return;

      if (shouldOpenContextMenu(clicked)) {
        if ('pageX' in event && 'pageY' in event) {
          setOptionsPosition({ x: event.pageX, y: event.pageY });
        }
      }

      event.stopPropagation();

      if (
        !contextMenuRef.current ||
        !contextMenuRef.current.contains(clicked as HTMLDivElement)
      ) {
        setOptionsId((prevId) => (!prevId || prevId !== noteId ? noteId : ''));
      }
    },
    []
  );

  const handleNoteRightClick = useCallback(
    (event: ReactMouseEvent<HTMLDivElement, MouseEvent>, noteId: string = '') => {
      event.preventDefault();
      const clicked = event.target as Element | null;
      if (!clicked) return;

      if (event.ctrlKey) return;
      if (optionsId && event.button === RIGHT_CLICK) return;

      if ('clientX' in event && 'clientY' in event) {
        setOptionsPosition({ x: event.clientX, y: event.clientY });
      }

      event.stopPropagation();

      if (
        !contextMenuRef.current ||
        contextMenuRef.current.contains(clicked as HTMLDivElement)
      ) {
        setOptionsId((prevId) => (!prevId || prevId !== noteId ? noteId : ''));
      }
    },
    [optionsId]
  );

  // ===========================================================================
  // Hooks
  // ===========================================================================
  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      handleNoteOptionsClick(event as unknown as ReactMouseEvent, '');
    };

    document.addEventListener('mousedown', handleMouseDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [handleNoteOptionsClick]);

  useKey(Shortcuts.SEARCH, focusSearchHandler);

  // ===========================================================================
  // Render Helpers
  // ===========================================================================
  const renderNoteTitle = (note: NoteItem, index: number) => {
    let noteTitle: string | React.ReactElement = getNoteTitle(note.text);

    if (searchValue) {
      const highlightStart = noteTitle.toString().search(searchRegex);
      if (highlightStart !== -1) {
        const highlightEnd = highlightStart + searchValue.length;
        noteTitle = (
          <>
            {noteTitle.toString().slice(0, highlightStart)}
            <strong className="highlighted">
              {noteTitle.toString().slice(highlightStart, highlightEnd)}
            </strong>
            {noteTitle.toString().slice(highlightEnd)}
          </>
        );
      }
    }

    return (
      <div data-testid={`note-title-${index}`} className="note-title">
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
    );
  };

  const renderNoteOptions = (note: NoteItem, index: number) => {
    if (isDraftNote(note)) {
      return <div className="note-options">&nbsp;</div>;
    }

    return (
      <div
        data-testid={`${TestID.NOTE_OPTIONS_DIV}${index}`}
        className={optionsId === note.id ? 'note-options selected' : 'note-options'}
        onClick={(event) => handleNoteOptionsClick(event, note.id)}
      >
        <MoreHorizontal aria-hidden="true" size={15} className="context-menu-action" />
        <span className="sr-only">Note options</span>
      </div>
    );
  };

  const renderNoteCategory = (note: NoteItem) => {
    if (activeFolder !== Folder.ALL && activeFolder !== Folder.FAVORITES) return null;

    const noteCategory = categories.find((category) => category.id === note.category);
    return (
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
    );
  };

  const renderContextMenu = (note: NoteItem) => {
    if (optionsId !== note.id || isDraftNote(note)) return null;
    return (
      <ContextMenu
        contextMenuRef={contextMenuRef}
        item={note}
        optionsPosition={optionsPosition}
        setOptionsId={setOptionsId}
        type={ContextMenuEnum.NOTE}
      />
    );
  };

  // ===========================================================================
  // Render
  // ===========================================================================
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
        {filteredNotes.map((note: NoteItem, index: number) => (
          <div
            data-testid={`${TestID.NOTE_LIST_ITEM}${index}`}
            className={
              selectedNotesIds.includes(note.id) ? 'note-list-each selected' : 'note-list-each'
            }
            key={note.id}
            onClick={(event) => {
              event.stopPropagation();
              handleUpdateSelectedNotes(note.id, event.metaKey);
              handleUpdateActiveNote(note.id, event.metaKey);
              handlePruneNotes();
            }}
            onContextMenu={(event) => handleNoteRightClick(event, note.id)}
            draggable={note.text !== ''}
            onDragStart={(event) => handleDragStart(event, note.id)}
          >
            <div className="note-list-outer">
              {renderNoteTitle(note, index)}
              {renderNoteOptions(note, index)}
            </div>
            {renderNoteCategory(note)}
            {renderContextMenu(note)}
          </div>
        ))}
      </div>
    </aside>
  );
};