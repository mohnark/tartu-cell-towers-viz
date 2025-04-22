import React, { useEffect, useState } from 'react';
import { Map, useControl, NavigationControl } from 'react-map-gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { WebMercatorViewport } from '@deck.gl/core';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const CELL_TOWERS_URL = '/tartu_city_celltowers_edu.geojson';

function getHeatmapLayers(cellTowers) {
    return [
        new HeatmapLayer({
            id: 'heatmap',
            data: cellTowers.features,
            getPosition: d => d.geometry.coordinates,
            getWeight: d => d.properties.area,
            intensity: 1,
            threshold: 0.1,
            aggregation: 'MEAN'
        })
    ];
}

function DeckGLOverlay({ layers, interleaved }) {
    const overlay = useControl(() => new MapboxOverlay({ layers, interleaved }));
    overlay.setProps({ layers, interleaved });
    return null;
}

export default function HeatMap() {
    const [viewState, setViewState] = useState({
        longitude: 26.76,
        latitude: 58.35,
        zoom: 10,
        pitch: 0,
        bearing: 0
    });
    const [cellTowers, setCellTowers] = useState(null);

    useEffect(() => {
        fetch(CELL_TOWERS_URL)
            .then(r => r.json())
            .then(setCellTowers)
            .catch(console.error);
    }, []);

    // useEffect(() => {
    //     if (!cellTowers) return;
    //
    //     const coords = cellTowers.features
    //         .filter(f => f.geometry.type === 'Point')
    //         .map(f => f.geometry.coordinates);
    //
    //     if (coords.length) {
    //         const lons = coords.map(c => c[0]);
    //         const lats = coords.map(c => c[1]);
    //         const vp = new WebMercatorViewport({
    //             width: window.innerWidth,
    //             height: window.innerHeight
    //         });
    //         const { longitude, latitude, zoom } = vp.fitBounds(
    //             [
    //                 [Math.min(...lons), Math.min(...lats)],
    //                 [Math.max(...lons), Math.max(...lats)]
    //             ],
    //             { padding: 20 }
    //         );
    //         setViewState({ longitude, latitude, zoom, pitch: 0, bearing: 0 });
    //     }
    // }, [cellTowers]);

    if (!cellTowers) {
        return <div>Loading towers…</div>;
    }

    const layers = getHeatmapLayers(cellTowers);
    console.log('Rerendered')
    return (
        <div style={{ position: 'relative', width: '100%', height: '85vh' }}>
            <Map
                mapboxAccessToken={MAPBOX_TOKEN}
                initialViewState={viewState}
                mapStyle="mapbox://styles/mapbox/dark-v11"
                style={{ width: '100%', height: '100%' }}
            >
                <NavigationControl position="top-left" />
                <DeckGLOverlay layers={layers} interleaved />
            </Map>
        </div>
    );
}
