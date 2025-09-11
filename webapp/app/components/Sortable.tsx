'use client';
import {useState, useRef} from 'react';
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import {SortableItem} from './SortableItem';


export function Sorta({}) {

    const list_symbol = {
        "A":['a', 'b', 'c'],
        "B":['d', 'e', 'f'],
        "C":['g', 'h', 'i']
    };

    const [fullData, SetFullData] = useState(list_symbol);
    const [activeWatchList, setActiveWatchList] = useState("B");
    const [watchArray, setWatchArray] = useState(Object.keys(fullData))
    const [itemList, setItemList] = useState(fullData[activeWatchList]);

  // Timer refs
  const dragStartTimeRef = useRef<number | null>(null);
  const lastActiveRef = useRef<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const TABS_DATA: Record<string, string> = {
    github: "GitHub",
    twitter: "Twitter",
    firede: "Firede's Profile",
    dndKit: "dnd kit"
  };


  function handleDragStart(event) {
    dragStartTimeRef.current = Date.now();

  }
  
  function handleDragEnd(event) {
    const {active, over} = event;
    
    
    // Timer logic
    const dragEndTime = Date.now();
    if (dragStartTimeRef.current) {
      const interval = (dragEndTime - dragStartTimeRef.current) / 1000;
      if (interval < 0.1 && event.active.id) {
        console.log("Clicked on:", activeWatchList, list_symbol[event.active.id]);
        setActiveWatchList(event.active.id);
        setItemList(list_symbol[event.active.id]);
      }
    }
    dragStartTimeRef.current = null;
    
    if (over && active.id !== over.id) {
      setWatchArray((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }
  
  function handleDragStartForSymbol(event) {


  }
  
  function handleDragEndForSymbol(event) {
    const {active, over} = event;
    
    
    
    if (over && active.id !== over.id) {
      setItemList((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        const NewData = fullData
        const newArray = arrayMove(items, oldIndex, newIndex)
        NewData[activeWatchList] = newArray
        console.log(NewData);
        
        SetFullData(NewData)
        return newArray;
      });
    }
  }


  return (
    <div className='stock-container'>
      <div className='stock-watchlists'>
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
            <SortableContext 
            items={watchArray}
            strategy={verticalListSortingStrategy}
            >
            {watchArray.map(id => <SortableItem key={id} id={id} />)}
            </SortableContext>
        </DndContext>
      </div>
      
      <div className='stock-symbols'>
          <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStartForSymbol}
          onDragEnd={handleDragEndForSymbol}
        >
          <SortableContext 
            items={fullData[activeWatchList]}
            strategy={verticalListSortingStrategy}
          >
            {fullData[activeWatchList].map(id => <SortableItem key={id} id={id} />)}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  )
}

