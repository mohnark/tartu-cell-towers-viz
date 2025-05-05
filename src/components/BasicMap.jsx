import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { TARTU_CELL_TOWERS, TARTU_CITY_DISTRICTS } from '../constants';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

export default function BasicMap() {
    const mapContainer = useRef(null);
    const mapRef = useRef(null);
    const [showDistricts, setShowDistricts] = useState(true);
    const [showCellTowers, setShowCellTowers] = useState(true);

    useEffect(() => {
        if (mapRef.current) return;
        mapRef.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/dark-v11',
            center: [26.76, 58.35],
            zoom: 10
        });

        mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-left');

        mapRef.current.on('load', () => {
            mapRef.current.addSource('districts', {
                type: 'geojson',
                data: TARTU_CITY_DISTRICTS
            });
            mapRef.current.addLayer({
                id: 'districts-fill',
                type: 'fill',
                source: 'districts',
                paint: {
                    'fill-color': 'rgba(255,0,0,0.3)'
                }
            });
            mapRef.current.addLayer({
                id: 'districts-outline',
                type: 'line',
                source: 'districts',
                paint: {
                    'line-color': 'rgb(200,0,0)',
                    'line-width': 1
                }
            });

            mapRef.current.addSource('cellTowers', {
                type: 'geojson',
                data: TARTU_CELL_TOWERS,
                cluster: true,
                clusterMaxZoom: 16,
                clusterRadius: 50
            });

            mapRef.current.addLayer({
                id: 'clusters',
                type: 'circle',
                source: 'cellTowers',
                filter: ['has', 'point_count'],
                paint: {
                    'circle-color': [
                        'step', ['get', 'point_count'],
                        '#90EE90', // light green
                        10, '#FFA500', // orange
                        30, '#FF0000'  // red
                    ],
                    'circle-radius': [
                        'step', ['get', 'point_count'],
                        15,
                        10, 20,
                        30, 25
                    ]
                }
            });

            // Cluster count labels
            mapRef.current.addLayer({
                id: 'cluster-count',
                type: 'symbol',
                source: 'cellTowers',
                filter: ['has', 'point_count'],
                layout: {
                    'text-field': '{point_count_abbreviated}',
                    'text-font': ['DIN Offc Pro Medium','Arial Unicode MS Bold'],
                    'text-size': 12
                }
            });

            // Unclustered points
            mapRef.current.addLayer({
                id: 'unclustered-point',
                type: 'circle',
                source: 'cellTowers',
                filter: ['!', ['has', 'point_count']],
                paint: {
                    'circle-color': '#11b4da',
                    'circle-radius': 5,
                    'circle-stroke-width': 1,
                    'circle-stroke-color': '#fff'
                }
            });

            mapRef.current.setLayoutProperty('districts-fill', 'visibility', showDistricts ? 'visible' : 'none');
            mapRef.current.setLayoutProperty('districts-outline', 'visibility', showDistricts ? 'visible' : 'none');
            ['clusters', 'cluster-count', 'unclustered-point'].forEach(id =>
                mapRef.current.setLayoutProperty(id, 'visibility', showCellTowers ? 'visible' : 'none')
            );

            mapRef.current.on('click', 'unclustered-point', (e) => {
                const props = e.features[0].properties;
                const {
                    radio = '—',
                    mcc   = '—',
                    net   = '—',
                    area  = '—',
                    cell  = '—',
                    range = '—',
                    samples = '—',
                    lat   = '—',
                    lon   = '—',
                } = props;
                const html = `
                        <div style="
                          font-family: system-ui, sans-serif;
                          color:#000;
                          max-width:240px;
                          line-height:1.35;
                        ">
                          <h3 style="
                            margin:0 0 .25rem 0;
                            font-size:1rem;
                            font-weight:600;
                          ">
                            ${radio || 'Tower'}
                          </h3>
                          <ul style="list-style:none;padding:0;margin:0">
                            <li><strong>MCC</strong>: ${mcc}</li>
                            <li><strong>Net</strong>: ${net}</li>
                            <li><strong>Area</strong>: ${area}</li>
                            <li><strong>Cell</strong>: ${cell}</li>
                            <li><strong>Range</strong>: ${range}m</li>
                            <li><strong>Samples</strong>: ${samples}</li>
                            <li><strong>Lat/Lon</strong>: ${(+lat).toFixed(6)}, ${(+lon).toFixed(6)}</li>
                          </ul>
                        </div>
                      `;

                new mapboxgl.Popup({ closeButton: false })
                    .setLngLat([+lon, +lat])
                    .setHTML(html)
                    .addTo(mapRef.current);
            });
            mapRef.current.on('click', 'clusters', (e) => {
                const features = mapRef.current.queryRenderedFeatures(e.point, { layers: ['clusters'] });
                const clusterId = features[0].properties.cluster_id;
                mapRef.current.getSource('cellTowers').getClusterExpansionZoom(clusterId, (err, zoom) => {
                    if (err) return;
                    mapRef.current.easeTo({ center: features[0].geometry.coordinates, zoom });
                });
            });
        });
    }, []);

    useEffect(() => {
        if (!mapRef.current) return;
        const applyDistrictVisibility = () => {
            mapRef.current.setLayoutProperty('districts-fill', 'visibility', showDistricts ? 'visible' : 'none');
            mapRef.current.setLayoutProperty('districts-outline', 'visibility', showDistricts ? 'visible' : 'none');
        };
        if (mapRef.current.isStyleLoaded()) {
            applyDistrictVisibility();
        } else {
            mapRef.current.once('load', applyDistrictVisibility);
        }
    }, [showDistricts]);

    useEffect(() => {
        if (!mapRef.current) return;
        const applyTowerVisibility = () => {
            ['clusters', 'cluster-count', 'unclustered-point'].forEach(id =>
                mapRef.current.setLayoutProperty(id, 'visibility', showCellTowers ? 'visible' : 'none')
            );
        };
        if (mapRef.current.isStyleLoaded()) {
            applyTowerVisibility();
        } else {
            mapRef.current.once('load', applyTowerVisibility);
        }
    }, [showCellTowers]);

    return (
        <div style={{ position: 'relative', height: '85vh' }}>
            <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
            <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.8)', padding: '8px', color: '#fff', borderRadius: '4px' }}>
                <label>
                    <input type="checkbox" checked={showDistricts} onChange={() => setShowDistricts(!showDistricts)} /> Districts
                </label>
                <label style={{ display: 'block', marginTop: 4 }}>
                    <input type="checkbox" checked={showCellTowers} onChange={() => setShowCellTowers(!showCellTowers)} /> Cell Towers
                </label>
            </div>
        </div>
    );
}
