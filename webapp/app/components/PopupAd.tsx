"use client";

import { useEffect, useState } from 'react';
import { getPosterPath, getImageUrl } from '../api/poster/client';

export default function PopupAd() {
    const [isOpen, setIsOpen] = useState(false);
    const [posterPath, setPosterPath] = useState<string | null>(null);

    useEffect(() => {
        const fetchPosterPath = async () => {
            try {
                const path = await getPosterPath();
                console.log('Fetched poster path:', path);
                if (path) {
                    setPosterPath(path);
                    setIsOpen(true);
                }
            } catch (error) {
                console.error('Failed to fetch poster path:', error);
            }
        };

        fetchPosterPath();
    }, []);

    if (!isOpen || !posterPath) {
        return null;
    }

    const imageUrl = getImageUrl(posterPath);
    console.log('Loading ad image from:', imageUrl);

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 9999,
            }}
            onClick={() => setIsOpen(false)}
        >
            <div
                style={{
                    position: 'relative',
                    maxWidth: '90vw',
                    maxHeight: '90vh',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={() => setIsOpen(false)}
                    style={{
                        position: 'absolute',
                        top: '-15px',
                        right: '-15px',
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: '#fff',
                        border: '2px solid #333',
                        fontSize: '20px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 10000,
                    }}
                >
                    ✕
                </button>
                <img
                    src={imageUrl}
                    alt="Advertisement"
                    style={{
                        maxWidth: '100%',
                        maxHeight: '85vh',
                        borderRadius: '8px',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                    }}
                    onError={(e) => {
                        console.error('Failed to load ad image from:', imageUrl);
                        setIsOpen(false);
                    }}
                />
            </div>
        </div>
    );
}
