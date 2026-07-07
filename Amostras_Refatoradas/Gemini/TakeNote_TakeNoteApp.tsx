import React, { useEffect, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Helmet, HelmetProvider } from 'react-helmet-async'
import { DragDropContext, DropResult } from 'react-beautiful-dnd'
import SplitPane from 'react-split-pane'
import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'

import { AppSidebar } from '@/containers/AppSidebar'
import { KeyboardShortcuts } from '@/containers/KeyboardShortcuts'
import { NoteEditor } from '@/containers/NoteEditor'
import { NoteList } from '@/containers/NoteList'
import { SettingsModal } from '@/containers/SettingsModal'
import { TempStateProvider } from '@/contexts/TempStateContext'
import { useInterval, useBeforeUnload } from '@/utils/hooks'
import {
  getWebsiteTitle,
  determineAppClass,
  getActiveCategory,
  getDayJsLocale,
  getNoteBarConf,
} from '@/utils/helpers'
import { loadCategories, swapCategories } from '@/slices/category'
import { sync } from '@/slices/sync'
import { loadNotes } from '@/slices/note'
import { loadSettings } from '@/slices/settings'
import { getSettings, getNotes, getCategories, getSync } from '@/selectors'

dayjs.extend(localizedFormat)
dayjs.locale(getDayJsLocale(navigator.language))

export const TakeNoteApp: React.FC = () => {
  const dispatch = useDispatch()

  // ===========================================================================
  // Selectors & Derived State
  // ===========================================================================
  const { darkTheme, sidebarVisible } = useSelector(getSettings)
  const { activeFolder, activeCategoryId, notes } = useSelector(getNotes)
  const { categories } = useSelector(getCategories)
  const { pendingSync } = useSelector(getSync)

  const activeCategory = getActiveCategory(categories, activeCategoryId)

  // ===========================================================================
  // Handlers
  // ===========================================================================
  const handleDragEnd = useCallback(
    (result: DropResult) => {
      const { destination, source, type } = result

      if (!destination) return

      const hasMoved =
        destination.droppableId !== source.droppableId ||
        destination.index !== source.index

      if (!hasMoved) return

      if (type === 'CATEGORY') {
        dispatch(
          swapCategories({
            categoryId: source.index,
            destinationId: destination.index,
          })
        )
      }
    },
    [dispatch]
  )

  // ===========================================================================
  // Hooks & Side Effects
  // ===========================================================================
  useEffect(() => {
    dispatch(loadNotes())
    dispatch(loadCategories())
    dispatch(loadSettings())
  }, [dispatch])

  useInterval(() => {
    dispatch(sync({ notes, categories }))
  }, 50000)

  useBeforeUnload(
    useCallback(
      (event: BeforeUnloadEvent) => {
        if (pendingSync) {
          event.preventDefault()
        }
      },
      [pendingSync]
    )
  )

  return (
    <HelmetProvider>
      <Helmet>
        <meta charSet="utf-8" />
        <title>{getWebsiteTitle(activeFolder, activeCategory)}</title>
        <link rel="canonical" href="https://takenote.dev" />
      </Helmet>

      <TempStateProvider>
        <div className={determineAppClass(darkTheme, sidebarVisible, activeFolder)}>
          <DragDropContext onDragEnd={handleDragEnd}>
            <SplitPane split="vertical" minSize={150} maxSize={500} defaultSize={240}>
              <AppSidebar />
              <SplitPane split="vertical" {...getNoteBarConf(activeFolder)}>
                <NoteList />
                <NoteEditor />
              </SplitPane>
            </SplitPane>
          </DragDropContext>
          <KeyboardShortcuts />
          <SettingsModal />
        </div>
      </TempStateProvider>
    </HelmetProvider>
  )
}