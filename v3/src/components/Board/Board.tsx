'use client'

import { LexoRank } from 'lexorank'
import { useEffect, useState } from 'react'
import { DragDropContext, DropResult } from 'react-beautiful-dnd'

import { toast, useAuth, useConfig } from '@payloadcms/ui'
import { ClientCollectionConfig, SelectField } from 'payload'
import BoardColumn from '../BoardColumn/BoardColumn.js'
import {
  sortAndFilterDocumentsForStatus,
  sortAndFilterDocumentsWithoutStatus,
} from '../utils/documents.util.js'
import './styles.scss'

interface BoardInterface {
  collection: ClientCollectionConfig
  statusDefinition: SelectField
  hideNoStatusColumn?: boolean
  documents: any[]
  dragEnabled: Boolean
  collectionSlug: string
  onDocumentkanbanStatusChange: (
    documentId: string,
    kanbanStatus: string,
    orderRank: string,
  ) => Promise<number> // Modified to return a Promise with status code
}

const Board = (props: BoardInterface) => {
  const {
    statusDefinition,
    documents: initDocuments,
    hideNoStatusColumn,
    onDocumentkanbanStatusChange,
    collection,
    dragEnabled,
    collectionSlug,
  } = props

  const { user } = useAuth()
  const [documents, setDocuments] = useState(initDocuments ?? [])
  const {
    getEntityConfig,
    config: {
      serverURL,
      routes: { api },
    },
  } = useConfig()

  useEffect(() => {
    setDocuments(initDocuments)
  }, [initDocuments])

  const updateDocument = async (
    documentId: string,
    destinationStatus: string,
    orderRank: string,
  ) => {
    try {
      // Call the status change function and wait for the status code
      const statusCode = await onDocumentkanbanStatusChange(
        documentId,
        destinationStatus,
        orderRank,
      )

      // Only update the local state if the status code is 200
      if (statusCode === 200) {
        setDocuments((prev) => {
          const updatedDocumentIndex = prev.findIndex((_doc) => _doc.id === documentId)

          if (updatedDocumentIndex === -1) {
            return prev
          }

          const newDocuments = [...prev]
          newDocuments[updatedDocumentIndex] = {
            ...newDocuments[updatedDocumentIndex],
            kanbanStatus: destinationStatus,
            kanbanOrderRank: orderRank,
          }

          return newDocuments
        })
        return true
      } else {
        toast.error('You are not authorised update document status')
        return false
      }
    } catch (error) {
      console.error('Error updating document:', error)
      toast.error('Something went wrong')
      return false
    }
  }

  const onDragEnd = async (result: DropResult) => {
    if (!dragEnabled) {
      toast.error('You are not authorized to perform this action')
      return
    }

    if (!result.destination) {
      return
    }

    const source = result.source
    const destination = result.destination

    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return
    }

    const documentId = result.draggableId
    const sourceStatus = source.droppableId
    const destinationStatus = destination.droppableId
    const destinationIndex = destination.index

    const url = `/api/${collectionSlug}/${documentId}`

    const response = await fetch(url)

    try {
      const destinationStatusGroup = sortAndFilterDocumentsForStatus(documents, destinationStatus)
      const minOrderRank = documents[0]?.kanbanOrderRank ?? LexoRank.min().toString()
      const maxOrderRank =
        documents[documents.length - 1]?.kanbanOrderRank ?? LexoRank.max().toString()

      // First in entire collection when added to empty group
      if (
        destinationStatusGroup.length === 0 &&
        documents.findIndex((_doc) => _doc.id === documentId) === 0
      ) {
        return updateDocument(documentId, destinationStatus, LexoRank.min().toString())
      }

      // First in list on empty group
      if (destinationStatusGroup.length === 0 && destinationIndex === 0) {
        return updateDocument(documentId, destinationStatus, LexoRank.min().genNext().toString())
      }

      // First in list
      if (destinationIndex === 0) {
        const previousFirstDoc = [...destinationStatusGroup].shift()

        // If the value has not been set, set a default value
        if (!(typeof previousFirstDoc?.kanbanOrderRank === 'string')) {
          const updatedOrderRank = LexoRank.parse(minOrderRank).between(LexoRank.max()).toString()
          return updateDocument(documentId, destinationStatus, updatedOrderRank)
        }

        const updatedOrderRank = LexoRank.parse(previousFirstDoc.kanbanOrderRank).genPrev()
        return updateDocument(documentId, destinationStatus, updatedOrderRank.toString())
      }

      // Last in the list
      if (
        (sourceStatus === destinationStatus &&
          destinationIndex + 1 === destinationStatusGroup.length) ||
        (sourceStatus !== destinationStatus && destinationIndex === destinationStatusGroup.length)
      ) {
        const previousLastDoc = [...destinationStatusGroup].pop()

        // If the value has not been set, set a default value
        if (!(typeof previousLastDoc?.kanbanOrderRank === 'string')) {
          const updatedOrderRank = LexoRank.parse(maxOrderRank).between(LexoRank.min()).toString()
          return updateDocument(documentId, destinationStatus, updatedOrderRank)
        }

        const updatedOrderRank = LexoRank.parse(previousLastDoc.kanbanOrderRank).genNext()
        return updateDocument(documentId, destinationStatus, updatedOrderRank.toString())
      }

      // Between 2 documents
      let documentBefore = destinationStatusGroup[destinationIndex - 1]
      let documentAfter = destinationStatusGroup[destinationIndex]

      // Within the same list re-ordering to the bottom, switch the document before and after
      if (sourceStatus === destinationStatus && source.index < destinationIndex) {
        documentBefore = destinationStatusGroup[destinationIndex]
        documentAfter = destinationStatusGroup[destinationIndex + 1]
      }

      const documentBeforeRank = LexoRank.parse(documentBefore.kanbanOrderRank)
      const documentAfterRank = LexoRank.parse(documentAfter.kanbanOrderRank)

      // Status change accepted
      return updateDocument(
        documentId,
        destinationStatus,
        documentBeforeRank.between(documentAfterRank).toString(),
      )
    } catch (error) {
      console.error('Error updating document:', error)
      toast.error('Something went wrong')
    }
  }

  return (
    <DragDropContext onDragEnd={(result) => onDragEnd(result)}>
      <div className="scrumboard">
        <div className="scrumboard-body">
          {hideNoStatusColumn ? (
            <></>
          ) : (
            <BoardColumn
              collection={collection}
              title={'No status'}
              identifier={'null'}
              contents={sortAndFilterDocumentsWithoutStatus(documents)}
              collapsible={true}
              dragEnabled={dragEnabled}
            />
          )}

          {statusDefinition?.options.map((status: any) => (
            <BoardColumn
              collection={collection}
              key={status.value}
              title={status.label}
              identifier={status.value}
              dragEnabled={dragEnabled}
              contents={sortAndFilterDocumentsForStatus(documents, status.value)}
            />
          ))}
        </div>
      </div>
    </DragDropContext>
  )
}

export { Board }
