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

import './Sortable.scss';
import {SortableItem, SortableItemForSymbol, SymbolTab} from './SortableItem';


export function Sorta({}) {

const list_symbol = {
    "Technology": ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'FB', 'QQQ'],
    "Healthcare": ['JNJ', 'PFE', 'MRK', 'UNH', 'ABT'],
    "Financials": ['JPM', 'BAC', 'V', 'WFC', 'GS'],
    "Consumer": ['AMZN', 'TSLA', 'NKE', 'DIS', 'HD'],
    "Energy": ['XOM', 'CVX', 'VDE', 'SLB', 'BP'],
    "Utilities": ['NEE', 'DUK', 'XLU', 'SO', 'D'],
    "Real Estate": ['SPG', 'PLD', 'O', 'VNQ'],
    "Materials": ['BHP', 'NEM', 'FCX', 'XLB'],
    "Industrials": ['BA', 'CAT', 'GE', 'XLI'],
    "Telecommunications": ['T', 'VZ', 'TMUS'],
    "IT": ['INTC', 'CSCO', 'ORCL']
};

const info_symbol = {
  'AAPL': {
    "price": 104,
    "change": 5
  },
  'MSFT': {
    "price": 300,
    "change": 3
  },
  'NVDA': {
    "price": 450,
    "change": 4
  },
  'GOOGL': {
    "price": 2800,
    "change": 15
  },
  'FB': {
    "price": 350,
    "change": 2
  },
  'QQQ': {
    "price": 370,
    "change": 1
  },
  'JNJ': {
    "price": 165,
    "change": 1.5
  },
  'PFE': {
    "price": 45,
    "change": 0.5
  },
  'MRK': {
    "price": 80,
    "change": 1
  },
  'UNH': {
    "price": 490,
    "change": 8
  },
  'ABT': {
    "price": 130,
    "change": 2
  },
  'JPM': {
    "price": 160,
    "change": 2
  },
  'BAC': {
    "price": 40,
    "change": 0.5
  },
  'V': {
    "price": 220,
    "change": 1
  },
  'WFC': {
    "price": 50,
    "change": 0.8
  },
  'GS': {
    "price": 350,
    "change": 3
  },
  'AMZN': {
    "price": 3300,
    "change": 20
  },
  'TSLA': {
    "price": 750,
    "change": 10
  },
  'NKE': {
    "price": 150,
    "change": 1.5
  },
  'DIS': {
    "price": 180,
    "change": 2
  },
  'HD': {
    "price": 320,
    "change": 5
  },
  'XOM': {
    "price": 85,
    "change": 1.2
  },
  'CVX': {
    "price": 170,
    "change": 2
  },
  'VDE': {
    "price": 130,
    "change": 1
  },
  'SLB': {
    "price": 40,
    "change": 0.7
  },
  'BP': {
    "price": 35,
    "change": 0.5
  },
  'NEE': {
    "price": 75,
    "change": 1
  },
  'DUK': {
    "price": 100,
    "change": 1.5
  },
  'XLU': {
    "price": 65,
    "change": 0.5
  },
  'SO': {
    "price": 75,
    "change": 0.8
  },
  'D': {
    "price": 30,
    "change": 0.3
  },
  'SPG': {
    "price": 120,
    "change": 1
  },
  'PLD': {
    "price": 200,
    "change": 2
  },
  'O': {
    "price": 60,
    "change": 0.5
  },
  'VNQ': {
    "price": 100,
    "change": 1
  },
  'BHP': {
    "price": 70,
    "change": 1
  },
  'NEM': {
    "price": 60,
    "change": 0.5
  },
  'FCX': {
    "price": 40,
    "change": 0.6
  },
  'XLB': {
    "price": 80,
    "change": 1
  },
  'BA': {
    "price": 210,
    "change": 2
  },
  'CAT': {
    "price": 230,
    "change": 3
  },
  'GE': {
    "price": 110,
    "change": 1
  },
  'XLI': {
    "price": 100,
    "change": 1
  },
  'T': {
    "price": 25,
    "change": 0.2
  },
  'VZ': {
    "price": 35,
    "change": 0.3
  },
  'TMUS': {
    "price": 140,
    "change": 1.5
  },
  'INTC': {
    "price": 50,
    "change": 0.5
  },
  'CSCO': {
    "price": 55,
    "change": 0.5
  },
  'ORCL': {
    "price": 90,
    "change": 1
  }
};

    const [fullData, SetFullData] = useState(list_symbol);
    const [activeWatchList, setActiveWatchList] = useState(Object.keys(fullData)[0]);
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

        SetFullData(NewData)
        return newArray;
      });
    }
  }


  return (
    <div className='stock-container'>
      <div className='stock-watchlists'>
          <div className="general-container" >
            <SymbolTab>
              Watchlist
            </SymbolTab>
            
          </div>
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
            {watchArray.map(id => <SortableItem 
            key={id} 
            id={id} 
            active={activeWatchList===id} 
            />)}

            </SortableContext>
        </DndContext>
      </div>
      <div className='stock-spacer'></div>
      <div className='stock-symbols'>
          <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStartForSymbol}
          onDragEnd={handleDragEndForSymbol}
        >
          <div className="general-container" >
            <SymbolTab>
              Symbol
            </SymbolTab>
            <SymbolTab>
              Price
            </SymbolTab>
            <SymbolTab>
             Change
            </SymbolTab>
          </div>
          <SortableContext 
            items={fullData[activeWatchList]}
            strategy={verticalListSortingStrategy}
          >
            {fullData[activeWatchList].map(
              id => 
            <SortableItemForSymbol 
              key={id} 
              id={id} 
              price={info_symbol[id]?.price || 100}
              change={info_symbol[id]?.change || 1}
              />
            )}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  )
}

