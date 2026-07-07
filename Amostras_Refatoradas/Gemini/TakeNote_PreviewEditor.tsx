import React, { useCallback, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import { useDispatch } from 'react-redux'

import { Folder } from '@/utils/enums'
import { updateActiveNote, updateSelectedNotes, pruneNotes, swapFolder } from '@/slices/note'
import { NoteItem } from '@/types'

import { uuidPlugin } from '../../utils/reactMarkdownPlugins'

import NoteLink from './NoteLink'

export interface PreviewEditorProps {
  noteText: string
  directionText: string
  notes: NoteItem[]
}

const MARKDOWN_PLUGINS = [uuidPlugin]

/**
 * Strategy to determine the target folder destination based on note attributes.
 * Extracted outside the component to adhere to the Single Responsibility Principle (SRP)
 * and prevent redundant function recreations on re-renders.
 */
const resolveTargetFolder = (note: NoteItem): Folder => {
  if (note.favorite) return Folder.FAVORITES
  if (note.scratchpad) return Folder.SCRATCHPAD
  if (note.trash) return Folder.TRASH
  
  return Folder.ALL
}

export const PreviewEditor: React.FC<PreviewEditorProps> = ({ noteText, directionText, notes }) => {
  const dispatch = useDispatch()

  // Memoizing the click handler ensures referential stability when passed down to child components
  const handleNoteLinkClick = useCallback((e: React.SyntheticEvent, note: NoteItem) => {
    e.preventDefault()

    if (!note) return

    dispatch(updateActiveNote({ noteId: note.id, multiSelect: false }))
    dispatch(updateSelectedNotes({ noteId: note.id, multiSelect: false }))
    dispatch(pruneNotes())
    dispatch(swapFolder({ folder: resolveTargetFolder(note) }))
  }, [dispatch])

  // Memoizing renderers to prevent unnecessary re-renders of the ReactMarkdown node tree
  const renderers = useMemo(() => ({
    uuid: ({ value }: { value: string }) => (
      <NoteLink 
        uuid={value} 
        notes={notes} 
        handleNoteLinkClick={handleNoteLinkClick} 
      />
    ),
  }), [notes, handleNoteLinkClick])

  const componentClassName = useMemo(() => {
    return `previewer previewer_direction-${directionText}`
  }, [directionText])

  return (
    <ReactMarkdown
      plugins={MARKDOWN_PLUGINS}
      renderers={renderers}
      linkTarget="_blank"
      className={componentClassName}
      source={noteText}
    />
  )
}