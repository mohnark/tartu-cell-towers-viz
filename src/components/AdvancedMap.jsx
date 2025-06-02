import React, { useEffect, useRef, useState } from 'react';
import { Map, Source, Layer, NavigationControl } from 'react-map-gl';
import { Box, Typography, FormGroup, FormControlLabel, Switch, Paper, IconButton, Tooltip } from '@mui/material';
import { Layers, Info, Home } from '@mui/icons-material';
import { TARTU_CELL_TOWERS } from '../constants';
import * as turfUtils from '../utils/turfUtils';
import * as turf from '@turf/turf';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const DEFAULT_VIEW = {
    longitude: 26.76,
    latitude: 58.35,
    zoom: 10,
    bounds: [
        [26.5, 58.2],  // Southwest coordinates
        [27.0, 58.5]   // Northeast coordinates
    ]
};

const WMS_LAYERS = {
  rescue_commands:
    'https://landscape-geoinformatics.ut.ee/geoserver/pa2023/wms?' +
    'SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&LAYERS=komandod_prognoosimudelile_db' +
    '&STYLES=&FORMAT=image/png&TRANSPARENT=TRUE&SRS=EPSG:3857&BBOX={bbox-epsg-3857}' +
    '&WIDTH=256&HEIGHT=256&TILED=true',

  five_minute_areas:
    'https://landscape-geoinformatics.ut.ee/geoserver/pa2023/wms?' +
    'SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&LAYERS=rpk_5min_ala_db' +
    '&STYLES=&FORMAT=image/png&TRANSPARENT=TRUE&SRS=EPSG:3857&BBOX={bbox-epsg-3857}' +
    '&WIDTH=256&HEIGHT=256&TILED=true',

  ten_minute_areas:
    'https://landscape-geoinformatics.ut.ee/geoserver/pa2023/wms?' +
    'SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&LAYERS=rpk_10min_ala_db' +
    '&STYLES=&FORMAT=image/png&TRANSPARENT=TRUE&SRS=EPSG:3857&BBOX={bbox-epsg-3857}' +
    '&WIDTH=256&HEIGHT=256&TILED=true'
};

export default function AdvancedMap() {
  const mapRef = useRef();
  const [cellTowers, setCellTowers] = useState(null);
  const [convexHull, setConvexHull] = useState(null);
  const [selectedPoints, setSelectedPoints] = useState([]);
  const [nearestPoint, setNearestPoint] = useState(null);
  const [showLayerControl, setShowLayerControl] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [viewState, setViewState] = useState(DEFAULT_VIEW);

  // Layer visibility states
  const [layerVisibility, setLayerVisibility] = useState({
    rescue_commands: true,
    five_minute_areas: true,
    ten_minute_areas: true,
    cell_towers: true,
    convex_hull: true,
    selected_points: true,
    nearest_point: true
  });

  // Handle layer visibility toggle
  const handleLayerToggle = (layerId) => {
    setLayerVisibility(prev => ({
      ...prev,
      [layerId]: !prev[layerId]
    }));
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Load TARTU_CELL_TOWERS GeoJSON and compute convex hull via Turf.js
  useEffect(() => {
    fetch(TARTU_CELL_TOWERS)
      .then((r) => r.json())
      .then((data) => {
        setCellTowers(data);
        // Demonstrate Turf: create a convex hull around all tower points
        const hull = turfUtils.createConvexHull(data);
        setConvexHull(hull);
      })
      .catch(console.error);
  }, []);

  // ───────────────────────────────────────────────────────────────────────────
  // On map click: find the nearest tower, store clicked point, optionally draw a line
  const handleMapClick = (e) => {
    if (!cellTowers) return;

    const clickedPoint = turf.point([e.lngLat.lng, e.lngLat.lat]);
    const points = turf.featureCollection(
      cellTowers.features.map((f) => f.geometry)
    );

    // (1) Find nearest tower point
    const nearest = turfUtils.findNearestPoint(points, clickedPoint);
    setNearestPoint(nearest);

    // (2) Add this click to the "selectedPoints" array
    setSelectedPoints((prev) => [...prev, clickedPoint]);

    // (3) If exactly two points selected, draw a line between them
    if (selectedPoints.length === 1) {
      turfUtils.createLine(selectedPoints[0], clickedPoint);
      // (You could choose to add that line to the map here if desired.)
    }
  };

  const handleResetView = () => {
    setViewState(DEFAULT_VIEW);
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Build an array of Mapbox "raster" layer configs for these three WMS endpoints
  const wmsLayers = [
    {
      id: 'ten_minute_areas',
      type: 'raster',
      source: {
        type: 'raster',
        tiles: [WMS_LAYERS.ten_minute_areas],
        tileSize: 256,
        attribution: '© Estonian Rescue Board'
      },
      paint: { 'raster-opacity': 0.8 },
      layout: { visibility: layerVisibility.ten_minute_areas ? 'visible' : 'none' },
      zIndex: 1
    },
    {
      id: 'five_minute_areas',
      type: 'raster',
      source: {
        type: 'raster',
        tiles: [WMS_LAYERS.five_minute_areas],
        tileSize: 256,
        attribution: '© Estonian Rescue Board'
      },
      paint: { 'raster-opacity': 0.8 },
      layout: { visibility: layerVisibility.five_minute_areas ? 'visible' : 'none' },
      zIndex: 2
    },
    {
      id: 'rescue_commands',
      type: 'raster',
      source: {
        type: 'raster',
        tiles: [WMS_LAYERS.rescue_commands],
        tileSize: 256,
        attribution: '© Estonian Rescue Board'
      },
      paint: { 'raster-opacity': 1 },
      layout: { visibility: layerVisibility.rescue_commands ? 'visible' : 'none' },
      zIndex: 3
    }
  ];

  // If towers data hasn't loaded yet, show a simple placeholder
  if (!cellTowers) return <div>Loading...</div>;

  return (
    <Box sx={{ height: '85vh', position: 'relative' }}>
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        maxBounds={DEFAULT_VIEW.bounds}
        mapStyle="mapbox://styles/mapbox/light-v11"
        onClick={handleMapClick}
      >
        <NavigationControl position="top-left" />
        <Tooltip title="Reset to Default View">
          <IconButton
            onClick={handleResetView}
            sx={{
              position: 'absolute',
              top: 10,
              left: 72,
              bgcolor: 'white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              '&:hover': { 
                bgcolor: 'white',
                boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
              },
              width: 40,
              height: 40,
              zIndex: 1
            }}
          >
            <Home sx={{ color: '#333' }} />
          </IconButton>
        </Tooltip>

        {/* WMS layers with transparency */}
        {wmsLayers.map((layer) => (
          <Source key={layer.id} {...layer.source}>
            <Layer 
              {...layer} 
              paint={{
                ...layer.paint,
                'raster-opacity': layer.paint['raster-opacity'] * 0.7  // Reduce opacity
              }}
            />
          </Source>
        ))}

        {/* Cell Towers with transparency */}
        <Source id="cellTowers" type="geojson" data={cellTowers}>
          <Layer
            id="towers"
            type="circle"
            paint={{
              'circle-radius': 4,
              'circle-color': '#ff0000',
              'circle-opacity': 0.7
            }}
            layout={{ visibility: layerVisibility.cell_towers ? 'visible' : 'none' }}
          />
        </Source>

        {/* Convex Hull with transparency */}
        {convexHull && (
          <Source id="convexHull" type="geojson" data={convexHull}>
            <Layer
              id="hull"
              type="fill"
              paint={{
                'fill-color': '#00ff00',
                'fill-opacity': 0.15
              }}
              layout={{ visibility: layerVisibility.convex_hull ? 'visible' : 'none' }}
            />
          </Source>
        )}

        {/* Selected Points with transparency */}
        {selectedPoints.length > 0 && (
          <Source
            id="selectedPoints"
            type="geojson"
            data={turf.featureCollection(selectedPoints)}
          >
            <Layer
              id="selected"
              type="circle"
              paint={{
                'circle-radius': 6,
                'circle-color': '#0000ff',
                'circle-opacity': 0.7
              }}
              layout={{ visibility: layerVisibility.selected_points ? 'visible' : 'none' }}
            />
          </Source>
        )}

        {/* Nearest Point with transparency */}
        {nearestPoint && (
          <Source id="nearestPoint" type="geojson" data={nearestPoint}>
            <Layer
              id="nearest"
              type="circle"
              paint={{
                'circle-radius': 8,
                'circle-color': '#ffff00',
                'circle-opacity': 0.7
              }}
              layout={{ visibility: layerVisibility.nearest_point ? 'visible' : 'none' }}
            />
          </Source>
        )}
      </Map>

      {/* Control Buttons */}
      <Box
        sx={{
          position: 'absolute',
          top: 12,
          right: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          zIndex: 1
        }}
      >
        <Tooltip title="Layer Control">
          <IconButton
            onClick={() => setShowLayerControl(!showLayerControl)}
            sx={{
              bgcolor: 'white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              '&:hover': { 
                bgcolor: 'white',
                boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
              },
              width: 40,
              height: 40
            }}
          >
            <Layers sx={{ color: '#333' }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Legend">
          <IconButton
            onClick={() => setShowLegend(!showLegend)}
            sx={{
              bgcolor: 'white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              '&:hover': { 
                bgcolor: 'white',
                boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
              },
              width: 40,
              height: 40
            }}
          >
            <Info sx={{ color: '#333' }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Layer Control Panel */}
      {showLayerControl && (
        <Paper
          elevation={3}
          sx={{
            position: 'absolute',
            top: 12,
            right: 60,
            p: 2,
            bgcolor: 'rgba(255,255,255,0.95)',
            borderRadius: 1,
            minWidth: '200px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
        >
          <Typography 
            variant="subtitle1" 
            sx={{ 
              mb: 2, 
              fontWeight: 'bold',
              color: '#333',
              borderBottom: '1px solid #eee',
              pb: 1
            }}
          >
            Layer Control
          </Typography>
          <FormGroup>
            <Typography variant="subtitle2" sx={{ color: '#666', mb: 1 }}>WMS Layers</Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={layerVisibility.rescue_commands}
                  onChange={() => handleLayerToggle('rescue_commands')}
                  size="small"
                  color="primary"
                />
              }
              label={
                <Typography variant="body2" sx={{ color: '#333' }}>
                  Rescue Commands
                </Typography>
              }
            />
            <FormControlLabel
              control={
                <Switch
                  checked={layerVisibility.five_minute_areas}
                  onChange={() => handleLayerToggle('five_minute_areas')}
                  size="small"
                  color="primary"
                />
              }
              label={
                <Typography variant="body2" sx={{ color: '#333' }}>
                  5 Minute Areas
                </Typography>
              }
            />
            <FormControlLabel
              control={
                <Switch
                  checked={layerVisibility.ten_minute_areas}
                  onChange={() => handleLayerToggle('ten_minute_areas')}
                  size="small"
                  color="primary"
                />
              }
              label={
                <Typography variant="body2" sx={{ color: '#333' }}>
                  10 Minute Areas
                </Typography>
              }
            />
            
            <Typography variant="subtitle2" sx={{ color: '#666', mt: 2, mb: 1 }}>Vector Layers</Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={layerVisibility.cell_towers}
                  onChange={() => handleLayerToggle('cell_towers')}
                  size="small"
                  color="primary"
                />
              }
              label={
                <Typography variant="body2" sx={{ color: '#333' }}>
                  Cell Towers
                </Typography>
              }
            />
            <FormControlLabel
              control={
                <Switch
                  checked={layerVisibility.convex_hull}
                  onChange={() => handleLayerToggle('convex_hull')}
                  size="small"
                  color="primary"
                />
              }
              label={
                <Typography variant="body2" sx={{ color: '#333' }}>
                  Convex Hull
                </Typography>
              }
            />
            <FormControlLabel
              control={
                <Switch
                  checked={layerVisibility.selected_points}
                  onChange={() => handleLayerToggle('selected_points')}
                  size="small"
                  color="primary"
                />
              }
              label={
                <Typography variant="body2" sx={{ color: '#333' }}>
                  Selected Points
                </Typography>
              }
            />
            <FormControlLabel
              control={
                <Switch
                  checked={layerVisibility.nearest_point}
                  onChange={() => handleLayerToggle('nearest_point')}
                  size="small"
                  color="primary"
                />
              }
              label={
                <Typography variant="body2" sx={{ color: '#333' }}>
                  Nearest Point
                </Typography>
              }
            />
          </FormGroup>
        </Paper>
      )}

      {/* Legend */}
      {showLegend && (
        <Paper
          elevation={3}
          sx={{
            position: 'absolute',
            bottom: 12,
            right: 12,
            p: 2,
            bgcolor: 'rgba(255,255,255,0.95)',
            borderRadius: 1,
            minWidth: '200px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
        >
          <Typography 
            variant="subtitle1" 
            sx={{ 
              mb: 2, 
              fontWeight: 'bold',
              color: '#333',
              borderBottom: '1px solid #eee',
              pb: 1
            }}
          >
            Legend
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="subtitle2" sx={{ color: '#666', mb: 1 }}>WMS Layers</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box 
                sx={{ 
                  width: 16, 
                  height: 16, 
                  bgcolor: '#ff4444', 
                  mr: 1.5, 
                  opacity: 0.9,
                  borderRadius: '2px'
                }} 
              />
              <Typography variant="body2" sx={{ color: '#333' }}>
                Rescue Commands
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box 
                sx={{ 
                  width: 16, 
                  height: 16, 
                  bgcolor: '#44aa44', 
                  mr: 1.5, 
                  opacity: 0.6,
                  borderRadius: '2px'
                }} 
              />
              <Typography variant="body2" sx={{ color: '#333' }}>
                5 Minute Areas
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box 
                sx={{ 
                  width: 16, 
                  height: 16, 
                  bgcolor: '#4444ff', 
                  mr: 1.5, 
                  opacity: 0.5,
                  borderRadius: '2px'
                }} 
              />
              <Typography variant="body2" sx={{ color: '#333' }}>
                10 Minute Areas
              </Typography>
            </Box>

            <Typography variant="subtitle2" sx={{ color: '#666', mt: 2, mb: 1 }}>Vector Layers</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box 
                sx={{ 
                  width: 16, 
                  height: 16, 
                  bgcolor: '#ff0000', 
                  mr: 1.5, 
                  borderRadius: '50%'
                }} 
              />
              <Typography variant="body2" sx={{ color: '#333' }}>
                Cell Towers
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box 
                sx={{ 
                  width: 16, 
                  height: 16, 
                  bgcolor: '#00ff00', 
                  mr: 1.5, 
                  opacity: 0.2,
                  borderRadius: '2px'
                }} 
              />
              <Typography variant="body2" sx={{ color: '#333' }}>
                Convex Hull
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box 
                sx={{ 
                  width: 16, 
                  height: 16, 
                  bgcolor: '#0000ff', 
                  mr: 1.5, 
                  borderRadius: '50%'
                }} 
              />
              <Typography variant="body2" sx={{ color: '#333' }}>
                Selected Points
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box 
                sx={{ 
                  width: 16, 
                  height: 16, 
                  bgcolor: '#ffff00', 
                  mr: 1.5, 
                  borderRadius: '50%'
                }} 
              />
              <Typography variant="body2" sx={{ color: '#333' }}>
                Nearest Point
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}
    </Box>
  );
}
