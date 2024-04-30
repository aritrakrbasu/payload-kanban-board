import React, { useEffect, useState } from "react";
import { DragDropContext, Droppable, DropResult } from "react-beautiful-dnd";
import BoardColumn from "./../BoardColumn/BoardColumn";
import { CollectionConfig, SelectField } from "payload/types";
import { LexoRank } from "lexorank";
import {
  sortAndFilterDocumentsForStatus,
  sortAndFilterDocumentsWithoutStatus,
} from "../../utils/documents.util";
import { toast } from "react-toastify";
import "./styles.scss";
import { PluginCollectionConfig } from "../..";
import { useAuth } from "payload/components/utilities";

interface BoardInterface {
  collection: CollectionConfig;
  statusDefinition: SelectField;
  hideNoStatusColumn?: boolean;
  documents: any[];
  dragEnabled: boolean;
  config: PluginCollectionConfig;
  onDocumentkanbanStatusChange: (
    documentId: string,
    kanbanStatus: string,
    orderRank: string
  ) => void;
}

const Board = (props: BoardInterface) => {
  const {
    statusDefinition,
    documents: initDocuments,
    hideNoStatusColumn,
    onDocumentkanbanStatusChange,
    collection,
    dragEnabled,
    config,
  } = props;

  const { user } = useAuth();
  const [documents, setDocuments] = useState(initDocuments ?? []);

  useEffect(() => {
    setDocuments(initDocuments);
  }, [initDocuments]);

  const updateDocument = (
    documentId: string,
    destinationStatus: string,
    orderRank: string
  ) => {
    setDocuments((prev) => {
      const updatedDocumentIndex = prev.findIndex(
        (_doc) => _doc.id === documentId
      );

      if (updatedDocumentIndex === -1) {
        return prev;
      }

      prev[updatedDocumentIndex].kanbanStatus = destinationStatus;
      prev[updatedDocumentIndex].kanbanOrderRank = orderRank;

      return [...prev];
    });

    onDocumentkanbanStatusChange(documentId, destinationStatus, orderRank);
  };

  const onDragEnd = (result: DropResult) => {
    if (!dragEnabled) {
      toast.error("You are not authorised to perform this action");
      return;
    }
    if (!result.destination) {
      return;
    }

    const source = result.source;
    const destination = result.destination;

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const statuses = config.statuses;

    const destinationStatusConfig = statuses.filter(
      (status) => status.value === destination.droppableId
    );

    const documentId = result.draggableId;
    const sourceStatus = source.droppableId;
    const destinationStatus = destination.droppableId;
    const destinationIndex = destination.index;

    const destinationStatusGroup = sortAndFilterDocumentsForStatus(
      documents,
      destinationStatus
    );

    const cardData = documents.filter((_doc) => _doc.id === documentId);
    try {
      if (
        destinationStatusConfig &&
        Array.isArray(destinationStatusConfig) &&
        destinationStatusConfig.length > 0 &&
        "dropValidation" in destinationStatusConfig[0]
      ) {
        const { dropValidation } = destinationStatusConfig[0];
        if (dropValidation) {
          var { dropAble, message = null } = dropValidation({
            data: cardData.length > 0 ? cardData[0] : {},
            user,
          });

          if (!dropAble) {
            if (message && message != null) {
              toast.error(message);
            }
            return;
          }
        }
      }

      const minOrderRank =
        documents[0]?.kanbanOrderRank ?? LexoRank.min().toString();
      const maxOrderRank =
        documents[documents.length - 1].kanbanOrderRank ??
        LexoRank.max().toString();

      const updatedDocumentIndex = documents.findIndex(
        (_doc) => _doc.id === result.draggableId
      );

      //first in entire collection when added to empty group.
      if (destinationStatusGroup.length === 0 && updatedDocumentIndex === 0) {
        if (message && message != null) {
          toast.success(message);
        }
        return updateDocument(
          documentId,
          destinationStatus,
          LexoRank.min().toString()
        );
      }

      //first in list on empty group.
      if (destinationStatusGroup.length === 0 && destinationIndex === 0) {
        if (message && message != null) {
          toast.success(message);
        }
        return updateDocument(
          documentId,
          destinationStatus,
          LexoRank.min().genNext().toString()
        );
      }

      //first in list
      if (destinationIndex === 0) {
        const previousFirstDoc = [...destinationStatusGroup].shift();

        // if the value has not been set, set a default value.
        if (!(typeof previousFirstDoc.kanbanOrderRank === "string")) {
          const updatedOrderRank = LexoRank.parse(minOrderRank)
            .between(LexoRank.max())
            .toString();
          if (message && message != null) {
            toast.success(message);
          }
          return updateDocument(
            documentId,
            destinationStatus,
            updatedOrderRank.toString()
          );
        }

        const updatedOrderRank = LexoRank.parse(
          previousFirstDoc.kanbanOrderRank
        ).genPrev();
        if (message && message != null) {
          toast.success(message);
        }
        return updateDocument(
          documentId,
          destinationStatus,
          updatedOrderRank.toString()
        );
      }

      //last in the list
      if (
        (sourceStatus === destinationStatus &&
          destinationIndex + 1 === destinationStatusGroup.length) ||
        (sourceStatus !== destinationStatus &&
          destinationIndex === destinationStatusGroup.length)
      ) {
        const previousLastDoc = [...destinationStatusGroup].pop();

        // if the value has not been set, set a default value.
        if (!(typeof previousLastDoc.kanbanOrderRank === "string")) {
          const updatedOrderRank = LexoRank.parse(maxOrderRank)
            .between(LexoRank.min())
            .toString();
          if (message && message != null) {
            toast.success(message);
          }
          return updateDocument(
            documentId,
            destinationStatus,
            updatedOrderRank.toString()
          );
        }

        const updatedOrderRank = LexoRank.parse(
          previousLastDoc.kanbanOrderRank
        ).genNext();
        if (message && message != null) {
          toast.success(message);
        }
        return updateDocument(
          documentId,
          destinationStatus,
          updatedOrderRank.toString()
        );
      }

      //between 2 documents
      let documentBefore = destinationStatusGroup[destinationIndex - 1];
      let documentAfter = destinationStatusGroup[destinationIndex];

      // within the same list re-ordering to the bottom, switch the document before and after.
      if (
        sourceStatus === destinationStatus &&
        source.index < destinationIndex
      ) {
        documentBefore = destinationStatusGroup[destinationIndex];
        documentAfter = destinationStatusGroup[destinationIndex + 1];
      }

      const documentBeforeRank = LexoRank.parse(documentBefore.kanbanOrderRank);
      const documentAfterRank = LexoRank.parse(documentAfter.kanbanOrderRank);

      if (message && message != null) {
        toast.success(message);
      }

      return updateDocument(
        documentId,
        destinationStatus,
        documentBeforeRank.between(documentAfterRank).toString()
      );
    } catch (error) {
      toast.error("something went wrong");
    }
  };

  return (
    <DragDropContext onDragEnd={(result) => onDragEnd(result)}>
      <Droppable droppableId="board" type="COLUMN" direction="horizontal">
        {(provided) => (
          <div
            className="scrumboard"
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            <div className="scrumboard-body">
              {!hideNoStatusColumn && (
                <BoardColumn
                  collection={collection}
                  title={"No status"}
                  identifier={"null"}
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
                  contents={sortAndFilterDocumentsForStatus(
                    documents,
                    status.value
                  )}
                />
              ))}
              {provided.placeholder}
            </div>
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default Board;
