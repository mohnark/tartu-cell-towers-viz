import * as turf from '@turf/turf';

// Function to create a buffer around points
export const createBuffer = (points, radius) => {
    return turf.buffer(points, radius, { units: 'meters' });
};

// Function to find points within a polygon
export const pointsInPolygon = (points, polygon) => {
    return turf.pointsWithinPolygon(points, polygon);
};

// Function to calculate the nearest point to a reference point
export const findNearestPoint = (points, referencePoint) => {
    return turf.nearestPoint(referencePoint, points);
};

// New function: Calculate the convex hull of a set of points
// This creates a polygon that encompasses all points in the set
export const createConvexHull = (points) => {
    return turf.convex(points);
};

// Function to create a line between two points
export const createLine = (startPoint, endPoint) => {
    return turf.lineString([startPoint.geometry.coordinates, endPoint.geometry.coordinates]);
};

// Function to calculate the area of a polygon
export const calculateArea = (polygon) => {
    return turf.area(polygon);
}; 