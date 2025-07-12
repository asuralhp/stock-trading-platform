'use client';
import Link from 'next/link';
import { WatchList } from '@/app/models/WatchList';
import { useEffect, useState } from 'react';

import { addToWatchList, removeFromWatchList, updateWatchName, getWatchList as getWatchListApi, addWatch } from '@/app/api/stocks/crud';
import { getSession } from 'next-auth/react'; // or your auth provider

export default function Stock() {
    const [userUid, setUserUid] = useState("");
    const [watchList, setWatchList] = useState<WatchList | null>(null);
    const [symbolInput, setSymbolInput] = useState("");
    const [nameInput, setNameInput] = useState("");
    const [removeSymbolInput, setRemoveSymbolInput] = useState("");
    const [watchlistResult, setWatchlistResult] = useState<any>(null);
    const [removeWatchIndex, setRemoveWatchIndex] = useState(0);
    const [updateWatchIndex, setUpdateWatchIndex] = useState(0);
    const [newWatchName, setNewWatchName] = useState("");
    const [newWatchNameInput, setNewWatchNameInput] = useState("");
    const [selectedWatchName, setSelectedWatchName] = useState("");
    const [removeWatchName, setRemoveWatchName] = useState("");
    const [updateOldWatchName, setUpdateOldWatchName] = useState("");
    const [updateNewWatchName, setUpdateNewWatchName] = useState("");

    // Get userUid from session on mount
    useEffect(() => {
        async function fetchSession() {
            const session = await getSession();
            if (session?.user?.userUid) {
                setUserUid(session.user.userUid);
            }
        }
        fetchSession();
    }, []);

    // Client-side getWatchList wrapper to ensure plain object and remove _id
    const getWatchList = async (userUid: string) => {
        const data = await getWatchListApi(userUid);
        if (data && typeof data === "object") {
            const plain = JSON.parse(JSON.stringify(data));
            if ("_id" in plain) {
                const { _id, ...rest } = plain;
                return rest as WatchList;
            }
            return plain;
        }
        return data;
    };

    // Fetch watchlist from DB when userUid changes
    useEffect(() => {
        if (!userUid) return;
        getWatchList(userUid).then(setWatchList);
    }, [userUid, watchlistResult]); // also refetch on watchlistResult change

    // Handlers for watchlist actions
    const handleAdd = async () => {
        if (!userUid || !selectedWatchName || !symbolInput) return;
        const res = await addToWatchList(userUid, selectedWatchName, symbolInput);
        setWatchlistResult(res);
    };
    const handleRemove = async () => {
        if (!userUid || !removeWatchName || !removeSymbolInput) return;
        const res = await removeFromWatchList(userUid, removeWatchName, removeSymbolInput);
        setWatchlistResult(res);
    };
    const handleUpdate = async () => {
        if (!userUid || !updateOldWatchName || !updateNewWatchName) return;
        const res = await updateWatchName(userUid, updateOldWatchName, updateNewWatchName);
        setWatchlistResult(res);
    };
    const handleGet = async () => {
        if (!userUid) return;
        const res = await getWatchList(userUid);
        setWatchlistResult(res);
    };
    // Handler for adding a new watch
    const handleAddWatch = async () => {
        if (!userUid || !newWatchNameInput) return;
        const res = await addWatch(userUid, newWatchNameInput);
        setWatchlistResult(res);
        setNewWatchNameInput("");
    };

    return (
        <div>
            <h1>Stock Page</h1>
            <h2>Watchlist</h2>
            <ul>
                {watchList?.watchlist.map((watch, index) => (
                    <li key={index}>
                        <strong>{watch.name}</strong>
                        <ul>
                            {watch.stocks.map((stock, stockIndex) => (
                                <li key={stockIndex}>
                                    <Link href={`/stock/${stock.symbol}`}>
                                        {stock.symbol}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </li>
                ))}
            </ul>

            <h2>Watchlist Actions (DB)</h2>
            <div>
                <label>User UID: </label>
                <span>{userUid ? userUid : "Loading..."}</span>
            </div>
            <div>
                <h4>Add New Watch</h4>
                <input
                    value={newWatchNameInput}
                    onChange={e => setNewWatchNameInput(e.target.value)}
                    placeholder="watch name"
                />
                <button onClick={handleAddWatch}>Add Watch</button>
            </div>
            <div>
                <h4>Add to Watchlist</h4>
                <input value={symbolInput} onChange={e => setSymbolInput(e.target.value)} placeholder="symbol" />
                <select value={selectedWatchName} onChange={e => setSelectedWatchName(e.target.value)}>
                    <option value="">Select watch</option>
                    {watchList?.watchlist.map((watch, idx) => (
                        <option key={idx} value={watch.name}>{watch.name}</option>
                    ))}
                </select>
                <button onClick={handleAdd}>Add</button>
            </div>
            <div>
                <h4>Remove from Watchlist</h4>
                <input value={removeSymbolInput} onChange={e => setRemoveSymbolInput(e.target.value)} placeholder="symbol" />
                <select value={removeWatchName} onChange={e => setRemoveWatchName(e.target.value)}>
                    <option value="">Select watch</option>
                    {watchList?.watchlist.map((watch, idx) => (
                        <option key={idx} value={watch.name}>{watch.name}</option>
                    ))}
                </select>
                <button onClick={handleRemove}>Remove</button>
            </div>
            <div>
                <h4>Update Watch Name</h4>
                <select value={updateOldWatchName} onChange={e => setUpdateOldWatchName(e.target.value)}>
                    <option value="">Select watch</option>
                    {watchList?.watchlist.map((watch, idx) => (
                        <option key={idx} value={watch.name}>{watch.name}</option>
                    ))}
                </select>
                <input value={updateNewWatchName} onChange={e => setUpdateNewWatchName(e.target.value)} placeholder="new watch name" />
                <button onClick={handleUpdate}>Update</button>
            </div>
        </div>
    );
}