import React, {useEffect, useRef, useState} from 'react';
import {Map, Source, Layer, NavigationControl} from 'react-map-gl';
import {TARTU_CELL_TOWERS} from "../constants.js";

const MAPBOX_TOKEN =  import.meta.env.VITE_MAPBOX_TOKEN;
const heatmapLayer = {
    id: 'cell-tower-heat',
    type: 'heatmap',
    source: 'cellTowers',
    maxzoom: 15,
    paint: {
        'heatmap-weight': [
            'interpolate', ['linear'], ['get', 'area'],
            0,   0,
            100, 1
        ],
        'heatmap-radius': [
            'interpolate', ['linear'], ['zoom'],
            0,   2,
            12,  20,
            15,  30
        ],

        'heatmap-intensity': [
            'interpolate', ['linear'], ['zoom'],
            0, 1,
            15, 3
        ],
        'heatmap-opacity': [
            'interpolate', ['linear'], ['zoom'],
            13, 1,
            15, 0
        ],
        'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0,  'rgba(0,0,0,0)',
            0.1,'#132553',
            0.3,'#3065f7',
            0.5,'#21a0ff',
            0.7,'#ffdc00',
            1,  '#ff5500'
        ]
    }
};

function Legend() {
    return (
        <div
            style={{
                position: 'absolute',
                bottom: '50px',
                right: '12px',
                padding: '8px 10px',
                background: 'rgba(0,0,0,0.6)',
                borderRadius: '4px',
                fontFamily: 'system-ui, sans-serif',
                fontSize: '12px',
                color: '#fff',
                lineHeight: 1.2,
                pointerEvents: 'none'
            }}
        >
            <div style={{marginBottom: '4px', textAlign: 'center'}}>Density</div>

            {/* gradient bar */}
            <div
                style={{
                    width: '140px',
                    height: '10px',
                    background:
                        'linear-gradient(to right,' +
                        'rgba(0,0,0,0) 0%,' +
                        '#132553 10%,' +
                        '#3065f7 30%,' +
                        '#21a0ff 50%,' +
                        '#ffdc00 70%,' +
                        '#ff5500 100%)',
                    borderRadius: '2px'
                }}
            />

            {/* labels under the bar */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '2px'
                }}
            >
                <span>Low</span>
                <span>High</span>
            </div>
        </div>
    );
}


export default function HeatMap() {
    const mapRef = useRef();
    const [cellTowers, setCellTowers] = useState(null);

    useEffect(() => {
        fetch(TARTU_CELL_TOWERS)
            .then(r => r.json())
            .then(setCellTowers)
            .catch(console.error);
    }, []);

    useEffect(() => {
        if (!mapRef.current || !cellTowers) return;

        const coords = cellTowers.features
            .filter(f => f.geometry.type === 'Point')
            .map(f => f.geometry.coordinates);

        if (!coords.length) return;

        const lons = coords.map(c => c[0]);
        const lats = coords.map(c => c[1]);

        mapRef.current.fitBounds(
            [
                [Math.min(...lons), Math.min(...lats)],
                [Math.max(...lons), Math.max(...lats)]
            ],
            {padding: 20, duration: 0}
        );
    }, [cellTowers]);

    if (!cellTowers) return <div style={{position:'relative', width:'100%', height:'85vh'}}>Loading towers…</div>;

    return (
        <div style={{position: 'relative', width:'100%', height:'85vh'}}>
            <Map
                ref={mapRef}
                mapboxAccessToken={MAPBOX_TOKEN}
                initialViewState={{longitude:26.76, latitude:58.35, zoom:10}}
                maxZoom={14}
                mapStyle="mapbox://styles/mapbox/dark-v11"
                style={{width:'100%', height:'100%'}}
            >
                <NavigationControl position="top-left" />

                <Source id="cellTowers" type="geojson" data={cellTowers}>
                    <Layer {...heatmapLayer} />
                </Source>
                <Legend />
            </Map>
        </div>
    );
}
