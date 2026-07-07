import React, { useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import SplitPane from 'react-split-pane';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';

import { AppSidebar } from '@/containers/AppSidebar';
import { KeyboardShortcuts } from '@/containers/KeyboardShortcuts';
import { NoteEditor } from '@/containers/NoteEditor';
import { NoteList } from '@/containers/NoteList';
import { SettingsModal } from '@/containers/SettingsModal';
import { TempStateProvider } from '@/contexts/TempStateContext';
import { useInterval, useBeforeUnload } from '@/utils/hooks';
import {
  getWebsiteTitle,
  determineAppClass,
  getActiveCategory,
  getDayJsLocale,
  getNoteBarConf,
} from '@/utils/helpers';
import { loadCategories, swapCategories } from '@/slices/category';
import { sync } from '@/slices/sync';
import { NoteItem, CategoryItem } from '@/types';
import { loadNotes } from '@/slices/note';
import { loadSettings } from '@/slices/settings';
import { getSettings, getNotes, getCategories, getSync } from '@/selectors';

dayjs.extend(localizedFormat);
dayjs.locale(getDayJsLocale(navigator.language));

const useAppDispatch = () => {
  const dispatch = useDispatch();

  const loadNotes = useCallback(() => dispatch(loadNotes()), [dispatch]);
  const loadCategories = useCallback(() => dispatch(loadCategories()), [dispatch]);
  const loadSettings = useCallback(() => dispatch(loadSettings()), [dispatch]);
  const swapCategories = useCallback(
    (categoryId: number, destinationId: number) =>
      dispatch(swapCategories({ categoryId, destinationId })),
    [dispatch]
  );
  const syncData = useCallback(
    (notes: NoteItem[], categories: CategoryItem[]) =>
      dispatch(sync({ notes, categories })),
    [dispatch]
  );

  return { loadNotes, loadCategories, loadSettings, swapCategories, syncData };
};

const useAppSelectors = () => {
  const { darkTheme, sidebarVisible } = useSelector(getSettings);
  const { activeFolder, activeCategoryId, notes } = useSelector(getNotes);
  const { categories } = useSelector(getCategories);
  const { pendingSync } = useSelector(getSync);

  const activeCategory = useMemo(
    () => getActiveCategory(categories, activeCategoryId),
    [categories, activeCategoryId]
  );

  return {
    darkTheme,
    sidebarVisible,
    activeFolder,
    activeCategoryId,
    notes,
    categories,
    pendingSync,
    activeCategory,
  };
};

const useDragEndHandler = (swapCategories: (categoryId: number, destinationId: number) => void) => {
  const onDragEnd = useCallback(
    (result: DropResult) => {
      const { destination, source } = result;
      if (!destination) return;
      if (destination.droppableId === source.droppableId && destination.index === source.index) return;
      if (result.type === 'CATEGORY') {
        swapCategories(source.index, destination.index);
      }
    },
    [swapCategories]
  );

  return { onDragEnd };
};

export const TakeNoteApp: React.FC = () => {
  const {
    darkTheme,
    sidebarVisible,
    activeFolder,
    activeCategory,
    notes,
    categories,
    pendingSync,
  } = useAppSelectors();

  const { loadNotes, loadCategories, loadSettings, swapCategories, syncData } = useAppDispatch();
  const { onDragEnd } = useDragEndHandler(swapCategories);

  useEffect(() => {
    loadNotes();
    loadCategories();
    loadSettings();
  }, [loadNotes, loadCategories, loadSettings]);

  useInterval(() => {
    syncData(notes, categories);
  }, 50000);

  useBeforeUnload((event: BeforeUnloadEvent) => {
    if (pendingSync) event.preventDefault();
  });

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
  );
};