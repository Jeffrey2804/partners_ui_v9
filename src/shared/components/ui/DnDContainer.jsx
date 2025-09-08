import { DndContext, closestCenter } from '@dnd-kit/core';
import { useState } from 'react';
import { DraggableWrapper } from './DraggableWrapper';

const initialItems = [
  { id: 'card-1', content: 'Task A' },
  { id: 'card-2', content: 'Task B' },
  { id: 'card-3', content: 'Task C' },
];

const DnDContainer = () => {
  const [items, setItems] = useState(initialItems);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active?.id !== over?.id) {
      const oldIndex = items.findIndex(item => item.id === active.id);
      const newIndex = items.findIndex(item => item.id === over.id);
      const newItems = [...items];
      const [movedItem] = newItems.splice(oldIndex, 1);
      newItems.splice(newIndex, 0, movedItem);
      setItems(newItems);
    }
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(item => (
          <DraggableWrapper key={item.id} id={item.id}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
              <p className="text-gray-800 dark:text-white font-medium">{item.content}</p>
            </div>
          </DraggableWrapper>
        ))}
      </div>
    </DndContext>
  );
};

export default DnDContainer;
