"use client";

import { useEffect, useState } from "react";
import { socket } from "../../socket";
import DraggableRectangle from "../components/DraggableRectangle";
import { generatePoster, setPosterPath, getImageUrl } from "../api/poster/client";

export default function Admin() {
    const [isConnected, setIsConnected] = useState(false);
    const [transport, setTransport] = useState("N/A");
    const [positivePrompt, setPositivePrompt] = useState("");
    const [slogan, setSlogan] = useState("");
    const [imagePath, setImagePath] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [confirmed, setConfirmed] = useState(false);

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

    const handleGeneratePoster = async () => {
        if (!positivePrompt || !slogan) {
            setError("Please fill in both fields");
            return;
        }

        setLoading(true);
        setError("");
        setImagePath("");

        try {
            const response = await generatePoster(positivePrompt, slogan);
            console.log("Poster response:", response);
            
            if (response.copied_path) {
                setImagePath(response.copied_path);
                setConfirmed(false);
            } else {
                setError("No image path in response");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to generate poster");
            console.error("Error generating poster:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmPath = async () => {
        if (!imagePath) return;
        
        try {
            await setPosterPath(imagePath);
            setConfirmed(true);
        } catch (err) {
            setError("Failed to set poster path");
            console.error("Error setting poster path:", err);
        }
    };

    return (
        <div>
            {/* <p>Status: {isConnected ? "connected" : "disconnected"}</p>
            <p>Transport: {transport}</p>
            <h1>Socket.IO Example</h1>
            <button onClick={sendMessage}>Send 'hello world'</button>
            
            <DraggableRectangle onDrag={sendPosition}></DraggableRectangle> */}

            <div style={{ marginTop: '40px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
                <h2>Poster Generator</h2>
                
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>
                        Positive Prompt:
                    </label>
                    <input
                        type="text"
                        value={positivePrompt}
                        onChange={(e) => setPositivePrompt(e.target.value)}
                        placeholder="e.g., Circle Internet Group, stable coin, fintech..."
                        style={{ 
                            width: '100%', 
                            padding: '10px', 
                            fontSize: '14px',
                            borderRadius: '4px',
                            border: '1px solid #ddd'
                        }}
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>
                        Slogan:
                    </label>
                    <input
                        type="text"
                        value={slogan}
                        onChange={(e) => setSlogan(e.target.value)}
                        placeholder="e.g., Test slogan for CRCL IPO"
                        style={{ 
                            width: '100%', 
                            padding: '10px', 
                            fontSize: '14px',
                            borderRadius: '4px',
                            border: '1px solid #ddd'
                        }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button
                        onClick={handleGeneratePoster}
                        disabled={loading}
                        style={{
                            padding: '10px 20px',
                            fontSize: '16px',
                            backgroundColor: loading ? '#ccc' : '#0070f3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: loading ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {loading ? 'Generating...' : 'Generate Poster'}
                    </button>

                    {imagePath && (
                        <button
                            onClick={handleConfirmPath}
                            disabled={confirmed}
                            style={{
                                padding: '10px 20px',
                                fontSize: '16px',
                                backgroundColor: confirmed ? '#4caf50' : '#ff9800',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: confirmed ? 'default' : 'pointer'
                            }}
                        >
                            {confirmed ? '✓ Confirmed as Ad' : 'Confirm as Home Page Ad'}
                        </button>
                    )}
                </div>

                {error && (
                    <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#ffebee', color: '#c62828', borderRadius: '4px' }}>
                        {error}
                    </div>
                )}

                {imagePath && (
                    <div style={{ marginTop: '20px' }}>
                        <h3>Generated Poster:</h3>
                        <p style={{ fontSize: '12px', color: '#666', wordBreak: 'break-all' }}>
                            Path: {imagePath}
                        </p>
                        <img 
                            src={`/api/poster/image?path=${encodeURIComponent(imagePath)}`} 
                            alt="Generated Poster"
                            style={{ 
                                maxWidth: '100%', 
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                marginTop: '10px'
                            }}
                            onError={(e) => {
                                console.error("Image failed to load:", imagePath);
                            }}
                        />
                    </div>
                )}
            </div>

        </div>
    );
}