'use client';
import {useSortable} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import { useState } from 'react';
import Link from 'next/link';
import './Sortable.scss';
export function SortableItem(props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({id: props.id});
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  var cls = "general-container " + `${props.active ? "active-watchlist" :"" }`

  return (
    <div className={cls} ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <SymbolTab>{props.id} </SymbolTab>
    </div>
  );
}


export function SortableItemForSymbol(props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({id: props.id});
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const change_dir = props.change >= 0 ? '+' : '-'
  const change_rate = (((props.price - props.change)/props.price)*100).toFixed(2);
  
  return (
    <div className="general-container" ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <SymbolTab>
        <Link href={`/stock/${props.id}`}>
            {props.id}
        </Link>

      </SymbolTab>
      <SymbolTab>
        {props.price}
      </SymbolTab>
      <SymbolTab>
        {change_dir}{props.change} ({change_dir}{change_rate}%)
      </SymbolTab>
    </div>
  );
}

export function SymbolTab(props) {
  return (
    <div className='symboltab'>
      {props.children}    

    </div>
  )
}