import React from 'react'
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

const getTargetFolder = (note: NoteItem): Folder => {
  if (note.favorite) return Folder.FAVORITES
  if (note.scratchpad) return Folder.SCRATCHPAD
  if (note.trash) return Folder.TRASH
  return Folder.ALL
}

export const PreviewEditor: React.FC<PreviewEditorProps> = ({ noteText, directionText, notes }) => {
  const dispatch = useDispatch()

  const handleNoteLinkClick = (e: React.SyntheticEvent, note: NoteItem) => {
    e.preventDefault()

    if (!note) return

    dispatch(updateActiveNote({ noteId: note.id, multiSelect: false }))
    dispatch(updateSelectedNotes({ noteId: note.id, multiSelect: false }))
    dispatch(pruneNotes())
    dispatch(swapFolder({ folder: getTargetFolder(note) }))
  }

  return (
    <ReactMarkdown
      plugins={[uuidPlugin]}
      renderers={{
        uuid: ({ value }: { value: string }) => (
          <NoteLink uuid={value} notes={notes} handleNoteLinkClick={handleNoteLinkClick} />
        ),
      }}
      linkTarget="_blank"
      className={`previewer previewer_direction-${directionText}`}
      source={noteText}
    />
  )
}