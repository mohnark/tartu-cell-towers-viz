import React, { useEffect, useState, useMemo } from 'react';
import { Map, NavigationControl } from 'react-map-gl';
import { GeoJsonLayer, ScatterplotLayer } from '@deck.gl/layers';
import { WebMercatorViewport } from '@deck.gl/core';
import 'mapbox-gl/dist/mapbox-gl.css';
import {DeckGLOverlay} from "./utils.js";
import {TARTU_CELL_TOWERS, TARTU_CITY_DISTRICTS} from "../constants.js";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const DISTRICTS_URL = TARTU_CITY_DISTRICTS;
const CELL_TOWERS_URL = TARTU_CELL_TOWERS;


export default function BasicMap() {
    const [viewState, setViewState] = useState({
        longitude: 26.76,
        latitude: 58.35,
        zoom: 10,
        pitch: 0,
        bearing: 0
    });
    const [districts, setDistricts] = useState(null);
    const [cellTowers, setCellTowers] = useState(null);
    const [showDistricts, setShowDistricts] = useState(true);
    const [showCellTowers, setShowCellTowers] = useState(true);

    // fetch the GeoJSONs
    useEffect(() => {
        fetch(DISTRICTS_URL)
            .then(r => r.json())
            .then(setDistricts)
            .catch(console.error);

        fetch(CELL_TOWERS_URL)
            .then(r => r.json())
            .then(setCellTowers)
            .catch(console.error);
    }, []);

    useEffect(() => {
        if (!districts && !cellTowers) return;

        const features = [
            ...(districts?.features || []),
            ...(cellTowers?.features || [])
        ];
        const coords = features.flatMap(f => {
            const g = f.geometry;
            if (!g) return [];
            const c = g.coordinates;
            switch (g.type) {
                case 'Point': return [c];
                case 'MultiPoint':
                case 'LineString': return c;
                case 'Polygon':
                case 'MultiLineString': return c.flat();
                case 'MultiPolygon': return c.flat(2);
                default: return [];
            }
        });

        if (coords.length) {
            const lons = coords.map(c => c[0]);
            const lats = coords.map(c => c[1]);
            const viewport = new WebMercatorViewport({
                width: window.innerWidth,
                height: window.innerHeight
            });
            const { longitude, latitude, zoom } = viewport.fitBounds(
                [
                    [Math.min(...lons), Math.min(...lats)],
                    [Math.max(...lons), Math.max(...lats)]
                ],
                { padding: 20 }
            );
            setViewState({ longitude, latitude, zoom, pitch: 0, bearing: 0 });
        }
    }, [districts, cellTowers]);

    const layers = useMemo(() => {
        const out = [];
        if (showDistricts && districts) {
            out.push(
                new GeoJsonLayer({
                    id: 'districts',
                    data: districts,
                    pickable: true,
                    stroked: true,
                    filled: true,
                    getLineColor: [200, 0, 0],
                    getFillColor: [255, 0, 0, 100],
                    lineWidthMinPixels: 1,
                    getTooltip: ({ object }) =>
                        object && `District: ${object.properties?.name}`
                })
            );
        }
        if (showCellTowers && cellTowers) {
            const points = cellTowers.features
                .filter(f => f.geometry.type === 'Point')
                .map(f => ({
                    position: f.geometry.coordinates,
                    name: f.properties?.name
                }));
            out.push(
                new ScatterplotLayer({
                    id: 'cellTowers',
                    data: points,
                    pickable: true,
                    radiusMinPixels: 5,
                    getFillColor: [0, 128, 255],
                    getRadius: 50,
                    onHover: info => {
                        if (info.object) {
                            // you could integrate a tooltip library here
                            console.log(info.object);
                        }
                    }
                })
            );
        }
        return out;
    }, [districts, cellTowers, showDistricts, showCellTowers]);

    if (!districts || !cellTowers) {
        return <div>Loading GeoJSON...</div>;
    }

    return (
        <div style={{ position: 'relative', width: '100%', height: '85vh' }}>
            <Map
                mapboxAccessToken={MAPBOX_TOKEN}
                initialViewState={viewState}
                mapStyle="mapbox://styles/mapbox/light-v11"
                style={{ width: '100%', height: '100%' }}
                onMove={evt => setViewState(evt.viewState)}
            >
                <NavigationControl position="top-left" />
                <DeckGLOverlay layers={layers} interleaved />
            </Map>

            <div
                style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    background: 'rgba(0,0,0,0.8)',
                    color: '#fff',
                    padding: '8px',
                    borderRadius: '4px'
                }}
            >
                <label style={{ display: 'block' }}>
                    <input
                        type="checkbox"
                        checked={showDistricts}
                        onChange={() => setShowDistricts(!showDistricts)}
                    />{' '}
                    Districts
                </label>
                <label style={{ display: 'block', marginTop: '4px' }}>
                    <input
                        type="checkbox"
                        checked={showCellTowers}
                        onChange={() => setShowCellTowers(!showCellTowers)}
                    />{' '}
                    Cell Towers
                </label>
            </div>
        </div>
    );
}
