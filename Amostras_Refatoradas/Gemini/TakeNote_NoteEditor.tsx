import dayjs from 'dayjs'
import React, { useCallback } from 'react'
import { Controlled as CodeMirror } from 'react-codemirror2'
import { useDispatch, useSelector } from 'react-redux'
import { Editor } from 'codemirror'

import { getActiveNote } from '@/utils/helpers'
import { updateNote } from '@/slices/note'
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

const setEditorOverlay = (editor: Editor): void => {
  const query = /\{\{[^}]*}}/g
  
  editor.addOverlay({
    token: (stream: any) => {
      query.lastIndex = stream.pos
      const match = query.exec(stream.string)

      if (match && match.index === stream.pos) {
        stream.pos += match[0].length || 1
        return 'notelink'
      }

      if (match) {
        stream.pos = match.index
      } else {
        stream.skipToEnd()
      }
      
      return undefined
    },
  })
}

export const NoteEditor: React.FC = () => {
  const dispatch = useDispatch()

  const { pendingSync } = useSelector(getSync)
  const { activeNoteId, loading, notes } = useSelector(getNotes)
  const { codeMirrorOptions, previewMarkdown } = useSelector(getSettings)

  const activeNote = getActiveNote(notes, activeNoteId)

  const handleEditorDidMount = useCallback((editor: Editor) => {
    setTimeout(() => {
      editor.focus()
    }, 0)
    editor.setCursor(0)
    setEditorOverlay(editor)
  }, [])

  const handleBeforeChange = useCallback(
    (editor: Editor, data: any, value: string) => {
      if (!activeNote) return

      if (!pendingSync) {
        dispatch(setPendingSync())
      }

      dispatch(
        updateNote({
          id: activeNote.id,
          text: value,
          created: activeNote.created,
          lastUpdated: dayjs().format(),
        })
      )
    },
    [activeNote, pendingSync, dispatch]
  )

  const handleChange = useCallback((editor: Editor, data: any, value: string) => {
    if (!value) {
      editor.focus()
    }
  }, [])

  const handlePaste = useCallback((editor: Editor, event: any) => {
    if (!event.clipboardData?.items?.[0]) return

    event.clipboardData.items[0].getAsString((pasted: string) => {
      if (editor.getSelection() !== pasted) return

      const [{ anchor, head }] = editor.listSelections()
      
      editor.setCursor({
        line: Math.max(anchor.line, head.line),
        ch: Math.max(anchor.ch, head.ch),
      })
    })
  }, [])

  const renderContent = () => {
    if (loading) {
      return <div className="empty-editor v-center">Loading...</div>
    }

    if (!activeNote) {
      return <EmptyEditor />
    }

    if (previewMarkdown) {
      return (
        <PreviewEditor
          directionText={codeMirrorOptions.direction}
          noteText={activeNote.text}
          notes={notes}
        />
      )
    }

    return (
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
    )
  }

  return (
    <main className="note-editor">
      <NoteMenuBar />
      {renderContent()}
    </main>
  )
}