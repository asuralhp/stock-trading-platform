"use client";

import { useEffect, useState } from "react";
import { socket } from "../../socket";
import DraggableRectangle from "../components/DraggableRectangle";

export default function Home() {
    const [isConnected, setIsConnected] = useState(false);
    const [transport, setTransport] = useState("N/A");

    useEffect(() => {
        if (socket.connected) {
            onConnect();
        }

        function onConnect() {
            setIsConnected(true);
            setTransport(socket.io.engine.transport.name);

            socket.io.engine.on("upgrade", (transport) => {
                setTransport(transport.name);
            });
        }

        function onDisconnect() {
            setIsConnected(false);
            setTransport("N/A");
        }

        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);

        return () => {
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
        };
    }, []);

    const sendMessage = () => {
        socket.emit('hello', 'world');
        console.log('Sent: hello world');
    };
    
    const sendPosition = (event: any) => {
        console.log('Sending position...');
        socket.emit('position', event);
        console.log('Sent: position', 'event');
    };

    return (
        <div>
            <p>Status: {isConnected ? "connected" : "disconnected"}</p>
            <p>Transport: {transport}</p>
            <h1>Socket.IO Example</h1>
            <button onClick={sendMessage}>Send 'hello world'</button>
            
            <DraggableRectangle onDrag={sendPosition}></DraggableRectangle>

        </div>
    );
}