"use client";

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { MarketIndexRecord } from '@/app/models/MarketIndex';

export interface IndexData extends MarketIndexRecord {
    lat: number;
    lon: number;
}

interface EarthProps {
    data: IndexData[];
}

const Earth: React.FC<EarthProps> = ({ data }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const labelsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Configuration
        const config = {
            radius: 3,
            detail: 64, // Higher detail for smooth shading
            rotationSpeed: 0.005
        };

        // --- 1. Texture Generation (Real-world based coords) ---
        function createWorldMapTexture() {
            const canvas = document.createElement('canvas');
            canvas.width = 2048;
            canvas.height = 1024;
            const ctx = canvas.getContext('2d');
            if (!ctx) return new THREE.Texture();

            const w = canvas.width;
            const h = canvas.height;

            ctx.fillStyle = '#4478daff';
            ctx.fillRect(0, 0, w, h);

            const mapPoint = (lat: number, lon: number) => {
                const x = ((lon + 180) / 360) * w;
                const y = ((90 - lat) / 180) * h;
                return [x, y];
            };

            const drawPolygon = (coords: number[][], fill: string) => {
                ctx.beginPath();
                const [startX, startY] = mapPoint(coords[0][0], coords[0][1]);
                ctx.moveTo(startX, startY);
                for (let i = 1; i < coords.length; i++) {
                    const [x, y] = mapPoint(coords[i][0], coords[i][1]);
                    ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.fillStyle = fill;
                ctx.fill();
                ctx.stroke();
            };

            ctx.strokeStyle = 'rgba(5, 20, 44, 0.65)';
            ctx.lineWidth = 1.5;

            const landFill = '#35c053ff';
            const desertFill = '#b0843c';
            const iceFill = '#d7f0ff';

            const continents: Array<{ coords: number[][]; fill: string }> = [
                {
                    fill: landFill,
                    coords: [
                        [72, -168], [70, -150], [67, -140], [63, -125], [58, -115],
                        [53, -105], [49, -96], [44, -90], [30, -88], [18, -90], [14, -105],
                        [17, -120], [25, -135], [32, -145], [40, -150], [50, -155], [65, -165]
                    ]
                },
                {
                    fill: landFill,
                    coords: [
                        [83, -50], [80, -30], [70, -20], [62, -40], [60, -55], [65, -60], [78, -50]
                    ]
                },
                {
                    fill: landFill,
                    coords: [
                        [12, -81], [8, -65], [-5, -45], [-15, -45], [-30, -55], [-40, -65],
                        [-50, -70], [-55, -65], [-45, -80], [-20, -78], [-5, -80]
                    ]
                },
                {
                    fill: landFill,
                    coords: [
                        [72, 25], [70, 40], [65, 55], [58, 55], [55, 35], [50, 25], [45, 10],
                        [40, 5], [36, -6], [43, -10], [50, -5], [60, -5], [65, 5]
                    ]
                },
                {
                    fill: landFill,
                    coords: [
                        [75, 30], [75, 180], [55, 170], [45, 150], [35, 125], [25, 110], [15, 105],
                        [5, 95], [10, 80], [20, 70], [25, 60], [30, 50], [40, 40], [45, 30], [60, 30]
                    ]
                },
                {
                    fill: landFill,
                    coords: [
                        [37, -10], [35, 35], [20, 50], [5, 48], [-10, 45], [-30, 35], [-35, 20],
                        [-30, 10], [-15, 0], [-5, -10], [15, -15], [30, -15]
                    ]
                },
                {
                    fill: landFill,
                    coords: [
                        [-10, 110], [-10, 155], [-25, 160], [-40, 150], [-40, 115]
                    ]
                },
                {
                    fill: iceFill,
                    coords: [
                        [-70, -180], [-70, 180], [-90, 180], [-90, -180]
                    ]
                }
            ];

            continents.forEach((continent) => drawPolygon(continent.coords, continent.fill));

            const ISLANDS: number[][][] = [
                [[58, -8], [58, 2], [50, 2], [50, -8]], // UK
                [[46, 140], [32, 130], [25, 140], [35, 150]], // Japan
                [[23, 120], [18, 122], [12, 118], [15, 115]], // Philippines
                [[-5, 140], [-10, 150], [-20, 150], [-17, 135]], // Papua
                [[20, -160], [18, -150], [10, -145], [8, -155]] // Hawaii
            ];

            ISLANDS.forEach((poly) => drawPolygon(poly, landFill));

            return new THREE.CanvasTexture(canvas);
        }

        // --- 2. Scene Setup ---
        const scene = new THREE.Scene();
        
        // Camera setup
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 100);
        camera.position.z = 5.5;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(window.devicePixelRatio);
        
        containerRef.current.appendChild(renderer.domElement);

        // --- 3. Earth Mesh ---
        const geometry = new THREE.IcosahedronGeometry(config.radius, config.detail);
        const material = new THREE.MeshPhongMaterial({
            map: createWorldMapTexture(),
            flatShading: false,
            shininess: 5,
            reflectivity: 1
        });
        const earth = new THREE.Mesh(geometry, material);
        
        // Align rotation:
        earth.rotation.y = -Math.PI / 2;

        scene.add(earth);

        // --- 4. City Markers (Real World Coordinates) ---
        const cityMarkers: THREE.Mesh[] = [];
        const labels: HTMLDivElement[] = [];
        
        function latLonToVector3(lat: number, lon: number, radius: number) {
            const phi = (90 - lat) * (Math.PI / 180);
            const theta = (lon + 180) * (Math.PI / 180);

            const x = -(radius * Math.sin(phi) * Math.cos(theta));
            const z = (radius * Math.sin(phi) * Math.sin(theta));
            const y = (radius * Math.cos(phi));

            return new THREE.Vector3(x, y, z);
        }

        const markerGeometry = new THREE.SphereGeometry(0.065, 24, 24);
        const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const clusterCounts = new Map<string, number>();
        const CLUSTER_BUCKET_SIZE = 5;
        const RING_CAPACITY = 8;

        const baseMarkerRadius = config.radius + 0.18;
        const ringSpacing = 0.25;

        function offsetMarkerPosition(position: THREE.Vector3, occurrenceIndex: number) {
            if (occurrenceIndex === 0) {
                return position.clone().normalize().multiplyScalar(baseMarkerRadius);
            }

            const normal = position.clone().normalize();
            let tangent = new THREE.Vector3(0, 1, 0).cross(normal);
            if (tangent.lengthSq() < 1e-4) {
                tangent = new THREE.Vector3(1, 0, 0).cross(normal);
            }
            tangent.normalize();
            const bitangent = normal.clone().cross(tangent).normalize();

            const ring = Math.floor(occurrenceIndex / RING_CAPACITY) + 1;
            const angle = (occurrenceIndex % RING_CAPACITY) * ((2 * Math.PI) / RING_CAPACITY);
            const spread = 0.26 * ring;

            const offset = tangent.clone().multiplyScalar(Math.cos(angle) * spread)
                .add(bitangent.clone().multiplyScalar(Math.sin(angle) * spread));

            const displaced = position.clone().add(offset);
            const radialBoost = baseMarkerRadius + ring * ringSpacing;
            return displaced.normalize().multiplyScalar(radialBoost);
        }

        // Create labels container if not exists (handled by React ref, but we need to append children)
        if (labelsRef.current) {
            labelsRef.current.innerHTML = ''; // Clear previous labels
        }

        data.forEach(item => {
            const marker = new THREE.Mesh(markerGeometry, markerMaterial);
            
            const basePosition = latLonToVector3(item.lat, item.lon, baseMarkerRadius);
            const clusterKey = `${Math.round(item.lat / CLUSTER_BUCKET_SIZE)}_${Math.round(item.lon / CLUSTER_BUCKET_SIZE)}`;
            const occurrenceIndex = clusterCounts.get(clusterKey) ?? 0;
            clusterCounts.set(clusterKey, occurrenceIndex + 1);

            const adjustedPosition = offsetMarkerPosition(basePosition, occurrenceIndex);
            marker.position.copy(adjustedPosition);
            marker.userData = { isCity: true, name: item.marketIndex };
            
            earth.add(marker);
            cityMarkers.push(marker);

            // Create Label
            if (labelsRef.current) {
                const normalizedChange = Number(item.change) || 0;
                const labelDiv = document.createElement('div');
                labelDiv.className = 'earth-label';
                labelDiv.style.position = 'absolute';
                labelDiv.style.padding = '4px 8px';
                labelDiv.style.borderRadius = '4px';
                labelDiv.style.backgroundColor = 'rgba(0,0,0,0.6)';
                labelDiv.style.color = normalizedChange >= 0 ? '#4caf50' : '#ff5252';
                labelDiv.style.fontSize = '12px';
                labelDiv.style.fontWeight = 'bold';
                labelDiv.style.pointerEvents = 'none';
                labelDiv.style.whiteSpace = 'nowrap';
                labelDiv.style.transition = 'opacity 0.2s';
                labelDiv.innerHTML = `
                    <div style="font-size: 10px; color: #ccc;">${item.marketIndex}</div>
                    <div>${normalizedChange > 0 ? '+' : ''}${normalizedChange.toFixed(2)}%</div>
                `;
                labelsRef.current.appendChild(labelDiv);
                labels.push(labelDiv);
            }
        });

        // --- 5. Lighting ---
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); 
        scene.add(ambientLight);

        const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
        mainLight.position.set(10, 10, 10);
        scene.add(mainLight);
        
        const backLight = new THREE.SpotLight(0x00aaff, 1);
        backLight.position.set(-10, 10, -10);
        backLight.lookAt(0,0,0);
        scene.add(backLight);

        // --- 6. Interaction ---
        const raycaster = new THREE.Raycaster();
        
        let isDragging = false;
        let userHasInteracted = false;
        let previousMousePosition = { x: 0, y: 0 };
        let rotationVelocity = { x: 0.002, y: 0.002 }; 
        let animationId: number;

        const onMouseDown = (e: MouseEvent) => {
            isDragging = true;
            userHasInteracted = true;
            previousMousePosition = { x: e.clientX, y: e.clientY };
        };

        const onMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                const deltaMove = {
                    x: e.clientX - previousMousePosition.x,
                    y: e.clientY - previousMousePosition.y
                };
                rotationVelocity.x = deltaMove.y * 0.005;
                rotationVelocity.y = deltaMove.x * 0.005;
                
                earth.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), rotationVelocity.y);
                earth.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), rotationVelocity.x);
                
                previousMousePosition = { x: e.clientX, y: e.clientY };
            } 
        };

        const onMouseUp = () => { isDragging = false; };

        const onTouchStart = (e: TouchEvent) => {
            isDragging = true;
            userHasInteracted = true;
            previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        };
        const onTouchMove = (e: TouchEvent) => {
            if(isDragging) {
                const deltaMove = {
                    x: e.touches[0].clientX - previousMousePosition.x,
                    y: e.touches[0].clientY - previousMousePosition.y
                };
                rotationVelocity.x = deltaMove.y * 0.005;
                rotationVelocity.y = deltaMove.x * 0.005;
                
                earth.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), rotationVelocity.y);
                earth.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), rotationVelocity.x);
                previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            }
        }
        const onTouchEnd = () => { isDragging = false; };

        // Attach events to the canvas/container
        const domElement = renderer.domElement;
        domElement.addEventListener('mousedown', onMouseDown);
        domElement.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp); 
        domElement.addEventListener('touchstart', onTouchStart, {passive: false});
        domElement.addEventListener('touchmove', onTouchMove, {passive: false});
        domElement.addEventListener('touchend', onTouchEnd);

        // --- 7. Animation Loop ---
        const tempV = new THREE.Vector3();

        function animate() {
            animationId = requestAnimationFrame(animate);

            if (!userHasInteracted && !isDragging) {
                earth.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), config.rotationSpeed);
            }

            renderer.render(scene, camera);

            // Update Labels
            if (labelsRef.current && containerRef.current) {
                const containerRect = containerRef.current.getBoundingClientRect();
                
                cityMarkers.forEach((marker, index) => {
                    const label = labels[index];
                    if (!label) return;

                    // Get world position of the marker
                    marker.getWorldPosition(tempV);

                    // Check occlusion
                    // Raycast from camera to marker position
                    // If it hits the earth first, it's occluded
                    const dir = tempV.clone().sub(camera.position).normalize();
                    raycaster.set(camera.position, dir);
                    const intersects = raycaster.intersectObject(earth);
                    
                    // Distance to marker
                    const distToMarker = camera.position.distanceTo(tempV);
                    
                    let isVisible = true;
                    if (intersects.length > 0) {
                        // If the intersection point is significantly closer than the marker, it's occluded
                        // Allow a small margin of error
                        if (intersects[0].distance < distToMarker - 0.1) {
                            isVisible = false;
                        }
                    }

                    if (isVisible) {
                        // Project to screen
                        tempV.project(camera);
                        
                        // Convert to CSS coordinates
                        // x, y are in range [-1, 1]
                        const x = (tempV.x * .5 + .5) * containerRect.width;
                        const y = (tempV.y * -.5 + .5) * containerRect.height;

                        label.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
                        label.style.opacity = '1';
                        label.style.zIndex = Math.floor((-tempV.z * .5 + .5) * 1000).toString(); // Sort by depth roughly
                    } else {
                        label.style.opacity = '0';
                    }
                });
            }
        }

        animate();

        // Handle Resize
        const handleResize = () => {
            if (!containerRef.current) return;
            const w = containerRef.current.clientWidth;
            const h = containerRef.current.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };

        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mouseup', onMouseUp);
            
            domElement.removeEventListener('mousedown', onMouseDown);
            domElement.removeEventListener('mousemove', onMouseMove);
            domElement.removeEventListener('touchstart', onTouchStart);
            domElement.removeEventListener('touchmove', onTouchMove);
            domElement.removeEventListener('touchend', onTouchEnd);
            
            cancelAnimationFrame(animationId);
            if (containerRef.current && containerRef.current.contains(renderer.domElement)) {
                containerRef.current.removeChild(renderer.domElement);
            }
            
            // Dispose resources
            geometry.dispose();
            if (material.map) material.map.dispose();
            material.dispose();
            markerGeometry.dispose();
            markerMaterial.dispose();
            cityMarkers.forEach(marker => {
                marker.geometry.dispose();
            });
            renderer.dispose();
        };
    }, [data]); // Re-run if data changes

    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
            <div 
                id="info" 
                style={{
                    position: 'absolute',
                    top: '20px',
                    width: '100%',
                    textAlign: 'center',
                    color: '#ffffff',
                    pointerEvents: 'none',
                    opacity: 0.8,
                    textTransform: 'uppercase',
                    letterSpacing: '2px',
                    fontSize: '0.8rem',
                    textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                    zIndex: 1
                }}
            >
                
            </div>
            <div ref={labelsRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
        </div>
    );
};

export default Earth;