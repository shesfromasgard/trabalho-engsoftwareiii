import React, { useState, useCallback } from 'react'
import { Book, Star, Trash2 } from 'react-feather'

import { Folder } from '@/utils/enums'
import { iconColor } from '@/utils/constants'
import { ReactDragEvent } from '@/types'

export interface FolderOptionProps {
  text: string
  active: boolean
  dataTestID: string
  folder: Folder
  swapFolder: (folder: Folder) => void
  addNoteType: (noteId: string) => void
}

export const FolderOption: React.FC<FolderOptionProps> = ({
  text,
  active,
  dataTestID,
  folder,
  swapFolder,
  addNoteType,
}) => {
  const [dragOverState, setDragOverState] = useState<Record<Folder, boolean>>({
    [Folder.ALL]: false,
    [Folder.FAVORITES]: false,
    [Folder.SCRATCHPAD]: false,
    [Folder.TRASH]: false,
    [Folder.CATEGORY]: false,
  })

  const dragEnterHandler = useCallback(() => {
    setDragOverState(prevState => ({ ...prevState, [folder]: true }))
  }, [folder])

  const dragLeaveHandler = useCallback(() => {
    setDragOverState(prevState => ({ ...prevState, [folder]: false }))
  }, [folder])

  const noteHandler = useCallback(
    (event: ReactDragEvent) => {
      event.preventDefault()
      addNoteType(event.dataTransfer.getData('text'))
      setDragOverState(prevState => ({ ...prevState, [folder]: false }))
    },
    [addNoteType, folder]
  )

  const handleClick = useCallback(() => {
    swapFolder(folder)
  }, [swapFolder, folder])

  const className = `app-sidebar-link${active ? ' active' : dragOverState[folder] ? ' dragged-over' : ''}`

  const renderIcon = () => {
    switch (folder) {
      case Folder.FAVORITES:
        return <Star size={15} className="app-sidebar-icon" color={iconColor} />
      case Folder.ALL:
        return <Book size={15} className="app-sidebar-icon" color={iconColor} />
      default:
        return <Trash2 size={15} className="app-sidebar-icon" color={iconColor} />
    }
  }

  return (
    <button onClick={handleClick} className="app-sidebar-wrapper">
      <div
        data-testid={dataTestID}
        className={className}
        onDrop={noteHandler}
        onDragOver={(event: ReactDragEvent) => event.preventDefault()}
        onDragEnter={dragEnterHandler}
        onDragLeave={dragLeaveHandler}
      >
        {renderIcon()}
        {text}
      </div>
    </button>
  )
}