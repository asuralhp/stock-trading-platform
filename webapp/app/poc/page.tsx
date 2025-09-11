'use client';


import {Sorta} from '../components/Sortable';

export default function POC() {
  const items = ['1', '2', '3'];


  return (
    <div>
        <div>POC</div>
        <Sorta itemList={['a','d','c']}/>
        <Sorta itemList={['121','32','212']}/>

    </div>
  );
}