'use client'

import { ChevronIcon } from '@payloadcms/ui/icons/Chevron'
import { useState } from 'react'
import BoardCardList from './../BoardCardList/BoardCardList.js'

import { type ClientCollectionConfig } from 'payload'
import './styles.scss'

const baseClass = 'board-column'

interface BoardColumProps {
  collection: ClientCollectionConfig
  title: string
  identifier: string
  contents: any[]
  collapsible?: Boolean
  dragEnabled: Boolean
}

const BoardColumn = (props: BoardColumProps) => {
  const { title, identifier, contents, collection, collapsible, dragEnabled } = props

  const [isCollapsed, setCollapsed] = useState(!!collapsible)
  return (
    <div className={`${baseClass}__wrapper ${isCollapsed ? `${baseClass}__collapsed` : ''}`}>
      <div
        className={`${baseClass}__header ${isCollapsed ? `${baseClass}__header_collapsed` : ''}`}
      >
        <h4>
          {title} <span>{contents?.length}</span>
        </h4>
        {collapsible && (
          <div onClick={() => setCollapsed(!isCollapsed)} className={`${baseClass}__collapse`}>
            <ChevronIcon />
          </div>
        )}
      </div>

      {!isCollapsed && (
        <BoardCardList
          listId={identifier}
          contents={contents}
          collection={collection}
          dragEnabled={dragEnabled}
        />
      )}
    </div>
  )
}

export default BoardColumn
