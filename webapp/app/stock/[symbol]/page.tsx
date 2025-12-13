'use client';
import { postOrder } from '@/app/api/stocks/[symbol]/crud'; 

import { useEffect, useState, use } from 'react';
import { getOrders, getTickerInfo } from '@/app/api/stocks/[symbol]/crud'; // Adjust the import path as needed
import D3SCGraph from '@/app/components/D3SCGraph';
import tickerData from "@/app/data/ticker.json"; 
import RiskIndexCard from '@/app/components/RiskIndexCard';
import { useTickSocket } from '@/app/hooks/useTickSocket';
import TickLivePanel from '@/app/components/TickLivePanel';


interface StockProps {
    params: Promise<{ symbol: string }>; // <-- params is now a Promise
}
const riskIndex = 0.7; // test

export default function Stock(props: StockProps) {
    const { symbol } = use(props.params); // <-- unwrap params with use()



    const [orders, setOrders] = useState<any[]>([]);
    const [tickerInfo, setTickerInfo] = useState<any | null>(null);

    // Move fetchOrders outside useEffect so it can be reused
    async function fetchOrders() {
        const data = await getOrders(symbol);
        data.sort((a, b) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime());
        setOrders(data);
    }

    async function fetchTickerInfo() {
        try {
            const info = await getTickerInfo(symbol);
            setTickerInfo(info);
        } catch (err) {
            console.error('Failed to load ticker info', err);
            setTickerInfo(null);
        }
    }

    useEffect(() => {
        fetchOrders();
        fetchTickerInfo();
    }, [symbol]);

    // Realtime ticks via websocket (Kafka -> WS server)
    const { connected: tickConnected, latest: latestTick, ticks: tickList } = useTickSocket(symbol, { url: 'ws://localhost:3009' });

    // Log incoming tick and tick list size for debugging
    useEffect(() => {
        console.debug('[stock page] latestTick', latestTick);
    }, [latestTick]);

    useEffect(() => {
        console.debug('[stock page] tickList length', tickList?.length ?? 0);
    }, [tickList]);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
        const action = submitter?.value ?? '';
        let formData = new FormData(e.currentTarget);
        formData.append('action', action);
        const result = await postOrder(formData);
        console.log(result.message);
        await fetchOrders(); // Refresh orders after submitting
    }

    function OrderForm() {
        return (
            <form style={{ marginTop: '2rem' }} onSubmit={handleSubmit}>
                <h2>Buy/Sell Stock</h2>
                <label>
                    Symbol:
                    <span style={{ marginLeft: '0.5rem', fontWeight: 'bold' }}>
                        {symbol}
                    </span>
                    <input type="hidden" name="symbol" value={symbol} />
                </label>
                <br />
                <label>
                    Order Type:
                    <select name="order_type" defaultValue="limit" style={{ marginLeft: '0.5rem' }}>
                        <option value="limit">Limit</option>
                        <option value="market">Market</option>
                    </select>
                </label>
                <br />
                <label>
                    Amount:
                    <input type="number" name="amount" min="1" defaultValue="1" style={{ marginLeft: '0.5rem' }} />
                </label>
                <br />
                <label>
                    Price:
                    <input type="number" name="price" min="0" step="0.01" placeholder="Price (for limit orders)" style={{ marginLeft: '0.5rem' }} />
                </label>
                <br />
                <label>
                    Session:
                    <select name="session" defaultValue="regular" style={{ marginLeft: '0.5rem' }}>
                        <option value="regular">Regular</option>
                        <option value="after-hours">After-hours</option>
                    </select>
                </label>
                <br />
                <label>
                    Time in Force:
                    <select name="time_in_force" defaultValue="DAY" style={{ marginLeft: '0.5rem' }}>
                        <option value="DAY">DAY</option>
                        <option value="GTC">GTC</option>
                        <option value="FOK">FOK</option>
                        <option value="IOC">IOC</option>
                    </select>
                </label>
                <br />
                <button type="submit" name="action" value="buy" style={{ marginRight: '1rem' }}>
                    Buy
                </button>
                <button type="submit" name="action" value="sell">
                    Sell
                </button>
            </form>
        );
    }

    function OrderHistoryTable({ orders }: { orders: any[] }) {
        return (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        {/* <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>Order ID</th> */}
                        <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>Type</th>
                        <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>Amount</th>
                        <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>Price</th>
                        <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map((order) => (
                        <tr key={order.id}>
                            {/* <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>{order.id}</td> */}
                            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>{order.action}</td>
                            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>{order.amount}</td>
                            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>{order.price}</td>
                            <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>{order.status}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    }

    function CompanyInfoSection({ info }: { info: any | null }) {
        if (!info) return (
            <div style={{ marginTop: '2rem' }}>
                <h2>Company Info</h2>
                <div>No company information available.</div>
            </div>
        );

        const marketCap = info.marketCap && typeof info.marketCap === 'object' && ('$numberLong' in info.marketCap)
            ? Number(info.marketCap.$numberLong)
            : info.marketCap;

        return (
            <div style={{ marginTop: '2rem' }}>
                <h2>Company Info</h2>
                <div><strong>{info.longName || info.displayName || info.shortName || info.name}</strong> ({info.symbol})</div>
                <div style={{ marginTop: '0.5rem' }}>{info.longBusinessSummary}</div>
                <div style={{ marginTop: '0.5rem' }}>
                    <span style={{ marginRight: '1rem' }}>Industry: {info.industry || '-'}</span>
                    <span style={{ marginRight: '1rem' }}>Sector: {info.sector || '-'}</span>
                    <span style={{ marginRight: '1rem' }}>Employees: {info.fullTimeEmployees ?? '-'}</span>
                </div>
                <div style={{ marginTop: '0.5rem' }}>
                    <span style={{ marginRight: '1rem' }}>Market Cap: {marketCap ? marketCap.toLocaleString() : '-'}</span>
                    <span style={{ marginRight: '1rem' }}>PE (TTM): {info.trailingPE ?? '-'}</span>
                    <span style={{ marginRight: '1rem' }}>Forward PE: {info.forwardPE ?? '-'}</span>
                    <span style={{ marginRight: '1rem' }}>Dividend Yield: {info.dividendYield ?? '-'}</span>
                </div>
                {info.website ? (
                    <div style={{ marginTop: '0.5rem' }}>Website: <a href={info.website} target="_blank" rel="noreferrer">{info.website}</a></div>
                ) : null}
                <div style={{ marginTop: '0.5rem' }}>{info.address1 ? `${info.address1}, ${info.city ?? ''} ${info.state ?? ''} ${info.zip ?? ''}, ${info.country ?? ''}` : null}</div>
            </div>
        );
    }

    const [activeTab, setActiveTab] = useState<'chart' | 'live'>('chart');

    const tabButtonStyle = (tab: 'chart' | 'live') => ({
        padding: '0.5rem 0.9rem',
        border: '1px solid #ccc',
        borderBottom: activeTab === tab ? '2px solid #111' : '1px solid #ccc',
        background: activeTab === tab ? '#f7f7f7' : '#fff',
        cursor: 'pointer',
        fontWeight: activeTab === tab ? 600 : 400,
    });

    return (
        <div>
            <h1><RiskIndexCard symbol={symbol} riskIndex={riskIndex} /> </h1>

            <div style={{ marginTop: '1rem' }}>
                <div style={{ display: 'inline-flex', gap: '0.5rem', borderBottom: '1px solid #ccc', paddingBottom: '0.25rem' }}>
                    <button style={tabButtonStyle('chart')} onClick={() => setActiveTab('chart')}>Chart</button>
                    <button style={tabButtonStyle('live')} onClick={() => setActiveTab('live')}>Live Ticks</button>
                </div>

                <div style={{ marginTop: '0.75rem' }}>
                    {activeTab === 'chart' ? (
                        <D3SCGraph symbol={symbol} tickerData={tickerData} />
                    ) : (
                        <TickLivePanel
                            latestTick={latestTick}
                            tickConnected={tickConnected}
                            tickList={tickList}
                        />
                    )}
                </div>
            </div>

            <CompanyInfoSection info={tickerInfo} />
            {/* <OrderForm /> */}
            
            <div style={{ marginTop: '2rem' }}>
                <h2>Order History</h2>
                {orders.length === 0 ? (
                    <div>No orders found.</div>
                ) : (
                    <OrderHistoryTable orders={orders} />
                )}
            </div>
        </div>
    );
}
