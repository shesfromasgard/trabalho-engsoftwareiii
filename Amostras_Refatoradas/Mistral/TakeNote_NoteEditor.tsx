import dayjs from 'dayjs';
import React from 'react';
import { Controlled as CodeMirror } from 'react-codemirror2';
import { useDispatch, useSelector } from 'react-redux';
import { Editor } from 'codemirror';

import { getActiveNote } from '@/utils/helpers';
import { updateNote } from '@/slices/note';
import { NoteItem } from '@/types';
import { NoteMenuBar } from '@/containers/NoteMenuBar';
import { EmptyEditor } from '@/components/Editor/EmptyEditor';
import { PreviewEditor } from '@/components/Editor/PreviewEditor';
import { getNotes, getSettings, getSync } from '@/selectors';
import { setPendingSync } from '@/slices/sync';

import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/base16-light.css';
import 'codemirror/mode/gfm/gfm';
import 'codemirror/addon/selection/active-line';
import 'codemirror/addon/scroll/scrollpastend';

const applyEditorOverlay = (editor: Editor): void => {
  const query = /\{\{[^}]*\}\}/g;
  editor.addOverlay({
    token: (stream: { pos: number; string: string; skipToEnd: () => void }) => {
      query.lastIndex = stream.pos;
      const match = query.exec(stream.string);
      
      if (match && match.index === stream.pos) {
        stream.pos += match[0].length || 1;
        return 'notelink';
      } else if (match) {
        stream.pos = match.index;
      } else {
        stream.skipToEnd();
      }
    },
  });
};

const useNoteEditorLogic = () => {
  const dispatch = useDispatch();
  const { pendingSync } = useSelector(getSync);
  const { activeNoteId, loading, notes } = useSelector(getNotes);
  const { codeMirrorOptions, previewMarkdown } = useSelector(getSettings);

  const activeNote = getActiveNote(notes, activeNoteId);

  const handleUpdateNote = (note: NoteItem): void => {
    if (!pendingSync) {
      dispatch(setPendingSync());
    }
    dispatch(updateNote(note));
  };

  const handlePaste = (editor: Editor, event: ClipboardEvent): void => {
    if (!event.clipboardData?.items?.[0]) return;
    
    event.clipboardData.items[0].getAsString((pasted: string) => {
      if (editor.getSelection() !== pasted) return;
      const { anchor, head } = editor.listSelections()[0];
      editor.setCursor({
        line: Math.max(anchor.line, head.line),
        ch: Math.max(anchor.ch, head.ch),
      });
    });
  };

  const handleEditorMount = (editor: Editor): void => {
    setTimeout(() => editor.focus(), 0);
    editor.setCursor(0);
    applyEditorOverlay(editor);
  };

  const handleBeforeChange = (editor: Editor, data: unknown, value: string): void => {
    if (!activeNote) return;
    
    handleUpdateNote({
      id: activeNote.id,
      text: value,
      created: activeNote.created,
      lastUpdated: dayjs().format(),
    });
  };

  const handleChange = (editor: Editor, data: unknown, value: string): void => {
    if (!value) {
      editor.focus();
    }
  };

  return {
    loading,
    activeNote,
    previewMarkdown,
    codeMirrorOptions,
    handleEditorMount,
    handleBeforeChange,
    handleChange,
    handlePaste,
  };
};

const EditorLoader: React.FC = () => {
  const { loading, activeNote, previewMarkdown, codeMirrorOptions, handleEditorMount, handleBeforeChange, handleChange, handlePaste } = useNoteEditorLogic();

  if (loading) {
    return <div className="empty-editor v-center">Loading...</div>;
  }

  if (!activeNote) {
    return <EmptyEditor />;
  }

  if (previewMarkdown) {
    return (
      <PreviewEditor
        directionText={codeMirrorOptions.direction}
        noteText={activeNote.text}
        notes={[]}
      />
    );
  }

  return (
    <CodeMirror
      data-testid="codemirror-editor"
      className="editor mousetrap"
      value={activeNote.text}
      options={codeMirrorOptions}
      editorDidMount={handleEditorMount}
      onBeforeChange={handleBeforeChange}
      onChange={handleChange}
      onPaste={handlePaste}
    />
  );
};

export const NoteEditor: React.FC = () => (
  <main className="note-editor">
    <NoteMenuBar />
    <EditorLoader />
  </main>
);