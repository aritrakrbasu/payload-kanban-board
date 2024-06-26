import React from "react";
import { Draggable, Droppable, DroppableProvided } from "react-beautiful-dnd";
import BoardCard from "../BoardCard/BoardCard";
import "./styles.scss";
import { CollectionConfig } from "payload/types";
import { PluginCollectionConfig } from "../..";

interface InnerListProps {
  dropProvided: DroppableProvided;
  contents: any[];
  collection: CollectionConfig;
}

function InnerList(props: InnerListProps) {
  const { dropProvided, contents, collection, ...rest } = props;
  return (
    <div className="board-card-list" ref={dropProvided.innerRef}>
      <div className="board-card-list-inner">
        {contents?.map((item, index) => (
          <Draggable key={item.id} draggableId={item.id} index={index}>
            {(dragProvided) => (
              //@ts-ignore
              <BoardCard
                key={item.id}
                data={item}
                collection={collection}
                ref={dragProvided.innerRef}
                {...dragProvided.draggableProps}
                {...dragProvided.dragHandleProps}
                {...rest}
              />
            )}
          </Draggable>
        ))}
      </div>
    </div>
  );
}

interface BoardCardListProps {
  listId: string;
  contents: any[];
  collection: CollectionConfig;
  dragEnabled: boolean;
}

const BoardCardList = (props: BoardCardListProps) => {
  const { listId, contents, collection, dragEnabled } = props;
  return (
    <Droppable
      droppableId={listId}
      type={"CONTENT"}
      isDropDisabled={!dragEnabled}
    >
      {(dropProvided) => (
        <div className="board-wrapper" {...dropProvided.droppableProps}>
          <div className="board-scrollContainer">
            <InnerList
              contents={contents}
              dropProvided={dropProvided}
              collection={collection}
            />
          </div>
          {dropProvided.placeholder}
        </div>
      )}
    </Droppable>
  );
};

export default BoardCardList;
