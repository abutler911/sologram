// client/src/components/posts/MediaGridSortable.jsx
import React, { useMemo } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export function SortableItem({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: "none",
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

export default function MediaGridSortable({
  items,
  onReorder,
  renderItem,
  AddMoreButton,
}) {
  const ids = useMemo(() => items.map((m) => m.id), [items]);

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragEnd={({ active, over }) => {
        if (over && active.id !== over.id) {
          const oldIndex = ids.indexOf(active.id);
          const newIndex = ids.indexOf(over.id);
          onReorder(oldIndex, newIndex);
        }
      }}
    >
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        {items.map((item, index) => (
          <SortableItem key={item.id} id={item.id}>
            {renderItem(item, index)}
          </SortableItem>
        ))}
        {AddMoreButton}
      </SortableContext>
    </DndContext>
  );
}
