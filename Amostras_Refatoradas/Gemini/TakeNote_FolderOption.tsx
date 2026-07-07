import React, { useState } from 'react'
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

const FOLDER_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string; color?: string }>> = {
  [Folder.FAVORITES]: Star,
  [Folder.ALL]: Book,
}

export const FolderOption: React.FC<FolderOptionProps> = ({
  text,
  active,
  dataTestID,
  folder,
  swapFolder,
  addNoteType,
}) => {
  const [isDraggedOver, setIsDraggedOver] = useState(false)

  const handleDragEnter = () => setIsDraggedOver(true)
  const handleDragLeave = () => setIsDraggedOver(false)

  const handleDragOver = (event: ReactDragEvent) => {
    event.preventDefault()
  }

  const handleDrop = (event: ReactDragEvent) => {
    event.preventDefault()
    addNoteType(event.dataTransfer.getData('text'))
    handleDragLeave()
  }

  const handleClick = () => {
    swapFolder(folder)
  }

  const getClassName = () => {
    if (active) return 'app-sidebar-link active'
    if (isDraggedOver) return 'app-sidebar-link dragged-over'
    return 'app-sidebar-link'
  }

  const IconComponent = FOLDER_ICONS[folder] || Trash2

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
        <IconComponent size={15} className="app-sidebar-icon" color={iconColor} />
        {text}
      </div>
    </button>
  )
}