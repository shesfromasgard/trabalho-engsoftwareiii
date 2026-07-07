import React, { useEffect } from 'react'
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
import { NoteItem, CategoryItem } from '@/types'
import { loadNotes } from '@/slices/note'
import { loadSettings } from '@/slices/settings'
import { getSettings, getNotes, getCategories, getSync } from '@/selectors'

dayjs.extend(localizedFormat)
dayjs.locale(getDayJsLocale(navigator.language))

const useAppInitialization = () => {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(loadNotes())
    dispatch(loadCategories())
    dispatch(loadSettings())
  }, [dispatch])
}

const useAppSync = (notes: NoteItem[], categories: CategoryItem[], pendingSync: boolean) => {
  const dispatch = useDispatch()

  useInterval(() => {
    dispatch(sync({ notes, categories }))
  }, 50000)

  useBeforeUnload((event: BeforeUnloadEvent) => (pendingSync ? event.preventDefault() : null))
}

export const TakeNoteApp: React.FC = () => {
  const { darkTheme, sidebarVisible } = useSelector(getSettings)
  const { activeFolder, activeCategoryId, notes } = useSelector(getNotes)
  const { categories } = useSelector(getCategories)
  const { pendingSync } = useSelector(getSync)

  const activeCategory = getActiveCategory(categories, activeCategoryId)

  useAppInitialization()
  useAppSync(notes, categories, pendingSync)

  const dispatch = useDispatch()

  const onDragEnd = (result: DropResult) => {
    const { destination, source } = result

    if (!destination) return

    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    if (result.type === 'CATEGORY') {
      dispatch(swapCategories({ categoryId: source.index, destinationId: destination.index }))
    }
  }

  return (
    <HelmetProvider>
      <Helmet>
        <meta charSet="utf-8" />
        <title>{getWebsiteTitle(activeFolder, activeCategory)}</title>
        <link rel="canonical" href="https://takenote.dev" />
      </Helmet>

      <TempStateProvider>
        <div className={determineAppClass(darkTheme, sidebarVisible, activeFolder)}>
          <DragDropContext onDragEnd={onDragEnd}>
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