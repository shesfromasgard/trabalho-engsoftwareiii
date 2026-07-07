import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Controlled as CodeMirror } from 'react-codemirror2'
import dayjs from 'dayjs'
import { Editor } from 'codemirror'

import { getActiveNote } from '@/utils/helpers'
import { updateNote } from '@/slices/note'
import { NoteItem } from '@/types'
import { NoteMenuBar } from '@/containers/NoteMenuBar'
import { EmptyEditor } from '@/components/Editor/EmptyEditor'
import { PreviewEditor } from '@/components/Editor/PreviewEditor'
import { getNotes, getSettings, getSync } from '@/selectors'
import { setPendingSync } from '@/slices/sync'

import 'codemirror/lib/codemirror.css'
import 'codemirror/theme/base16-light.css'
import 'codemirror/mode/gfm/gfm'
import 'codemirror/addon/selection/active-line'
import 'codemirror/addon/scroll/scrollpastend'

const useNoteEditor = () => {
  const dispatch = useDispatch()
  const { pendingSync } = useSelector(getSync)
  const { activeNoteId, loading, notes } = useSelector(getNotes)
  const { codeMirrorOptions, previewMarkdown } = useSelector(getSettings)

  const activeNote = getActiveNote(notes, activeNoteId)

  const updateActiveNote = (text: string) => {
    if (!pendingSync) {
      dispatch(setPendingSync())
    }

    dispatch(
      updateNote({
        id: activeNote.id,
        text,
        created: activeNote.created,
        lastUpdated: dayjs().format(),
      })
    )
  }

  const handleEditorDidMount = (editor: Editor) => {
    setTimeout(() => {
      editor.focus()
    }, 0)
    editor.setCursor(0)

    const query = /\{\{[^}]*}}/g
    editor.addOverlay({
      token: function (stream: any) {
        query.lastIndex = stream.pos
        const match = query.exec(stream.string)

        if (match && match.index === stream.pos) {
          stream.pos += match[0].length || 1
          return 'notelink'
        } else if (match) {
          stream.pos = match.index
        } else {
          stream.skipToEnd()
        }
      },
    })
  }

  const handleBeforeChange = (editor: any, data: any, value: string) => {
    updateActiveNote(value)
  }

  const handleChange = (editor: any, data: any, value: string) => {
    if (!value) {
      editor.focus()
    }
  }

  const handlePaste = (editor: any, event: any) => {
    if (!event.clipboardData || !event.clipboardData.items || !event.clipboardData.items[0]) {
      return
    }

    event.clipboardData.items[0].getAsString((pasted: string) => {
      if (editor.getSelection() !== pasted) return

      const { anchor, head } = editor.listSelections()[0]
      editor.setCursor({
        line: Math.max(anchor.line, head.line),
        ch: Math.max(anchor.ch, head.ch),
      })
    })
  }

  return {
    loading,
    activeNote,
    previewMarkdown,
    codeMirrorOptions,
    notes,
    handleEditorDidMount,
    handleBeforeChange,
    handleChange,
    handlePaste,
  }
}

export const NoteEditor: React.FC = () => {
  const {
    loading,
    activeNote,
    previewMarkdown,
    codeMirrorOptions,
    notes,
    handleEditorDidMount,
    handleBeforeChange,
    handleChange,
    handlePaste,
  } = useNoteEditor()

  if (loading) {
    return (
      <main className="note-editor">
        <NoteMenuBar />
        <div className="empty-editor v-center">Loading...</div>
      </main>
    )
  }

  if (!activeNote) {
    return (
      <main className="note-editor">
        <NoteMenuBar />
        <EmptyEditor />
      </main>
    )
  }

  if (previewMarkdown) {
    return (
      <main className="note-editor">
        <NoteMenuBar />
        <PreviewEditor
          directionText={codeMirrorOptions.direction}
          noteText={activeNote.text}
          notes={notes}
        />
      </main>
    )
  }

  return (
    <main className="note-editor">
      <NoteMenuBar />
      <CodeMirror
        data-testid="codemirror-editor"
        className="editor mousetrap"
        value={activeNote.text}
        options={codeMirrorOptions}
        editorDidMount={handleEditorDidMount}
        onBeforeChange={handleBeforeChange}
        onChange={handleChange}
        onPaste={handlePaste}
      />
    </main>
  )
}