import {
    DndContext,
    useDraggable,
    useDroppable,
    closestCenter,
  } from '@dnd-kit/core';

  export const DraggableWrapper = ({ id, children }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });

    const style = {
      transform: transform
        ? `translate(${transform.x}px, ${transform.y}px)`
        : undefined,
      zIndex: isDragging ? 1000 : 'auto',
      position: 'relative',
    };

    return (
      <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
        {children}
      </div>
    );
  };
