import React, { useState, useCallback } from 'react';
import { Book, Star, Trash2 } from 'react-feather';

import { Folder } from '@/utils/enums';
import { iconColor } from '@/utils/constants';
import { ReactDragEvent } from '@/types';

export interface FolderOptionProps {
  text: string;
  active: boolean;
  dataTestID: string;
  folder: Folder;
  swapFolder: (folder: Folder) => void;
  addNoteType: (noteId: string) => void;
}

const ICON_MAP: Record<Folder, React.ReactNode> = {
  [Folder.ALL]: <Book size={15} className="app-sidebar-icon" color={iconColor} />,
  [Folder.FAVORITES]: <Star size={15} className="app-sidebar-icon" color={iconColor} />,
  [Folder.SCRATCHPAD]: <Book size={15} className="app-sidebar-icon" color={iconColor} />,
  [Folder.TRASH]: <Trash2 size={15} className="app-sidebar-icon" color={iconColor} />,
  [Folder.CATEGORY]: <Book size={15} className="app-sidebar-icon" color={iconColor} />,
};

const INITIAL_DRAG_STATE: Record<Folder, boolean> = {
  [Folder.ALL]: false,
  [Folder.FAVORITES]: false,
  [Folder.SCRATCHPAD]: false,
  [Folder.TRASH]: false,
  [Folder.CATEGORY]: false,
};

export const FolderOption: React.FC<FolderOptionProps> = ({
  text,
  active,
  dataTestID,
  folder,
  swapFolder,
  addNoteType,
}) => {
  const [mainSectionDragState, setMainSectionDragState] = useState<Record<Folder, boolean>>(
    INITIAL_DRAG_STATE
  );

  const handleDragEnter = useCallback(() => {
    setMainSectionDragState((prevState) => ({
      ...prevState,
      [folder]: true,
    }));
  }, [folder]);

  const handleDragLeave = useCallback(() => {
    setMainSectionDragState((prevState) => ({
      ...prevState,
      [folder]: false,
    }));
  }, [folder]);

  const handleDrop = useCallback(
    (event: ReactDragEvent) => {
      event.preventDefault();
      addNoteType(event.dataTransfer.getData('text'));
      handleDragLeave();
    },
    [addNoteType, handleDragLeave]
  );

  const handleDragOver = useCallback((event: ReactDragEvent) => {
    event.preventDefault();
  }, []);

  const getClassName = (): string => {
    if (active) {
      return 'app-sidebar-link active';
    }
    if (mainSectionDragState[folder]) {
      return 'app-sidebar-link dragged-over';
    }
    return 'app-sidebar-link';
  };

  const handleClick = useCallback(() => {
    swapFolder(folder);
  }, [folder, swapFolder]);

  return (
    <button onClick={handleClick} className="app-sidebar-wrapper">
      <div
        data-testid={dataTestID}
        className={getClassName()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
      >
        {ICON_MAP[folder]}
        {text}
      </div>
    </button>
  );
};