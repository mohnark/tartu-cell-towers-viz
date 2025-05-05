import React, {useEffect, useRef, useState} from 'react';
import {Map, Source, Layer, NavigationControl, Popup} from 'react-map-gl';
import {Box} from '@mui/material';
import 'mapbox-gl/dist/mapbox-gl.css';
import {TARTU_CITY_DISTRICTS} from '../constants.js';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const COLOR_PALETTE = [
    '#f2f0f7', '#dadaeb', '#bcbddc', '#9e9ac8',
    '#807dba', '#6a51a3', '#54278f', '#3f007d'
];

export default function ChoroplethMap() {
    const mapRef = useRef();
    const [districts, setDistricts] = useState(null);
    const [popupInfo, setPopupInfo] = useState(null);
    const [mapLoaded, setMapLoaded] = useState(false);

    // Fetch districts
    useEffect(() => {
        fetch(TARTU_CITY_DISTRICTS)
            .then(res => res.json())
            .then(setDistricts)
            .catch(console.error);
    }, []);

    // Fit bounds when ready
    useEffect(() => {
        if (!mapLoaded || !mapRef.current || !districts) return;
        const bbox = districts.bbox
            ? [districts.bbox.slice(0, 2), districts.bbox.slice(2)]
            : (() => {
                const coords = districts.features.flatMap(f =>
                    f.geometry.type === 'MultiPolygon'
                        ? f.geometry.coordinates.flat(2)
                        : []
                );
                const lons = coords.map(c => c[0]);
                const lats = coords.map(c => c[1]);
                return [
                    [Math.min(...lons), Math.min(...lats)],
                    [Math.max(...lons), Math.max(...lats)]
                ];
            })();
        mapRef.current.fitBounds(bbox, {padding: 20, duration: 0});
    }, [mapLoaded, districts]);

    if (!districts) {
        return (
            <Box sx={{height: '85vh', display: 'grid', placeItems: 'center'}}>
                Loading districts…
            </Box>
        );
    }

    // Compute thresholds and step expression
    const counts = districts.features.map(f => f.properties.TOWERS);
    const minVal = Math.min(...counts);
    const maxVal = Math.max(...counts);
    const binCount = COLOR_PALETTE.length;
    const thresholds = Array.from({length: binCount - 1}, (_, i) =>
        minVal + ((i + 1) * (maxVal - minVal)) / binCount
    );
    const stepExp = ['step', ['get', 'TOWERS'], COLOR_PALETTE[0],
        ...thresholds.flatMap((t, i) => [t, COLOR_PALETTE[i + 1]])
    ];

    const fillLayer = {
        id: 'district-fill',
        type: 'fill',
        source: 'districts',
        paint: {
            'fill-color': stepExp,
            'fill-opacity': 0.7
        }
    };

    const outlineLayer = {
        id: 'district-outline',
        type: 'line',
        source: 'districts',
        paint: {
            'line-color': '#444',
            'line-width': 1
        }
    };

    function Legend() {
        return (
            <Box
                sx={{
                    position: 'absolute', bottom: 12, right: 12,
                    p: 2, bgcolor: 'rgba(0,0,0,0.6)', borderRadius: 1,
                    pointerEvents: 'none', fontSize: 12, color: '#fff',
                    fontFamily: 'system-ui, sans-serif'
                }}
            >
                <Box sx={{textAlign: 'center', mb: 1}}>Cell‑tower count</Box>
                {COLOR_PALETTE.map((colour, i) => {
                    const label =
                        i === 0
                            ? `${minVal.toFixed(0)}–${thresholds[0].toFixed(0)}`
                            : i === binCount - 1
                                ? `${thresholds[thresholds.length - 1].toFixed(0)}+`
                                : `${thresholds[i - 1].toFixed(0)}–${thresholds[i].toFixed(0)}`;
                    return (
                        <Box key={i} sx={{display: 'flex', alignItems: 'center', mb: 0.5}}>
                            <Box sx={{width: 14, height: 14, bgcolor: colour, mr: 1, border: '1px solid #777'}} />
                            {label}
                        </Box>
                    );
                })}
            </Box>
        );
    }

    return (
        <Box sx={{height: '85vh', position: 'relative'}}>
            <Map
                ref={mapRef}
                mapboxAccessToken={MAPBOX_TOKEN}
                mapStyle="mapbox://styles/mapbox/dark-v11"
                interactiveLayerIds={['district-fill']}
                style={{width: '100%', height: '100%'}}
                initialViewState={{longitude: 26.72, latitude: 58.38, zoom: 11}}
                onLoad={() => setMapLoaded(true)}
                onClick={e => {
                    const f = e.features && e.features[0];
                    if (!f) return;
                    const {lng, lat} = e.lngLat;
                    setPopupInfo({lng, lat, name: f.properties.NIMI, towers: f.properties.TOWERS});
                }}
            >
                <NavigationControl position="top-left" />

                <Source id="districts" type="geojson" data={districts}>
                    <Layer {...fillLayer} />
                    <Layer {...outlineLayer} />
                </Source>

                {popupInfo && (
                    <Popup
                        longitude={popupInfo.lng}
                        latitude={popupInfo.lat}
                        offset={8}
                        closeButton={false}
                        closeOnClick={false}
                        onClose={() => setPopupInfo(null)}
                        style={{
                            background: 'rgba(255,255,255,0.0)',
                            padding: '4px',
                            borderRadius: '4px'
                        }}
                    >
                        <div style={{
                            fontFamily: 'system-ui, sans-serif',
                            fontSize: 14,
                            color: '#000'
                        }}>
                            <strong>{popupInfo.name}</strong><br />
                            Towers: {popupInfo.towers}
                        </div>
                    </Popup>
                )}

                <Legend />
            </Map>
        </Box>
    );
}
