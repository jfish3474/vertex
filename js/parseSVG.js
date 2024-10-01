// js/parseSVG.js
console.log('parseSVG:', typeof parseSVG);
console.log('parseSVGPath:', typeof parseSVGPath);

// Function to parse the SVG and extract vertices and correct connections
async function parseSVG() {
    const response = await fetch('assets/triangle.svg'); // Update this path as needed
    const svgText = await response.text();
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');

    const paths = svgDoc.querySelectorAll('path');
    const vertices = [];
    const vertexMap = new Map();
    const correctConnections = new Set();
    const polygons = [];

    paths.forEach((pathElement) => {
        const pathData = pathElement.getAttribute('d');
        const fill = pathElement.getAttribute('fill');

        const { points } = extractPointsFromPathData(pathData);

        // Map vertices and ensure uniqueness
        const pathVertices = points.map(point => {
            const key = `${point.x},${point.y}`;
            if (!vertexMap.has(key)) {
                const vertex = { x: point.x, y: point.y, count: 0 };
                vertexMap.set(key, vertex);
                vertices.push(vertex);
            }
            return vertexMap.get(key);
        });

        // Create correct connections between consecutive points
        for (let i = 0; i < pathVertices.length - 1; i++) {
            const startVertex = pathVertices[i];
            const endVertex = pathVertices[i + 1];

            // Increment counts
            startVertex.count++;
            endVertex.count++;

            // Store the correct connection
            const connectionKey1 = `${startVertex.x},${startVertex.y}-${endVertex.x},${endVertex.y}`;
            const connectionKey2 = `${endVertex.x},${endVertex.y}-${startVertex.x},${startVertex.y}`;
            correctConnections.add(connectionKey1);
            correctConnections.add(connectionKey2);
        }

        // Handle the closing connection if 'Z' is present
        if (/Z|z/.test(pathData)) {
            const firstVertex = pathVertices[0];
            const lastVertex = pathVertices[pathVertices.length - 1];

            if (firstVertex !== lastVertex) {
                // Increment counts
                firstVertex.count++;
                lastVertex.count++;

                // Store the closing correct connection
                const connectionKey1 = `${lastVertex.x},${lastVertex.y}-${firstVertex.x},${firstVertex.y}`;
                const connectionKey2 = `${firstVertex.x},${firstVertex.y}-${lastVertex.x},${lastVertex.y}`;
                correctConnections.add(connectionKey1);
                correctConnections.add(connectionKey2);
            }
        }

        // Store the polygon with its vertices, fill color, and initial opacity
        polygons.push({ vertices: pathVertices, fill, opacity: 0, completed: false });
    });

    // Initialize remaining connections
    vertices.forEach(vertex => {
        vertex.remaining = vertex.count;
    });

    // Return edges as an empty array, since the user hasn't drawn any edges yet
    return { vertices, edges: [], polygons, correctConnections };
}

// Function to extract points from path data
function extractPointsFromPathData(pathData) {
    const commands = pathData.match(/[a-zA-Z][^a-zA-Z]*/g);
    const points = [];
    let startPoint = null;

    commands.forEach(command => {
        const type = command[0];
        const coords = command.slice(1).trim().split(/[\s,]+/).map(Number);

        if (type === 'M') {
            // Move to command
            const x = coords[0];
            const y = coords[1];
            startPoint = { x, y };
            points.push(startPoint);
        } else if (type === 'L') {
            // Line to command
            for (let i = 0; i < coords.length; i += 2) {
                const x = coords[i];
                const y = coords[i + 1];
                points.push({ x, y });
            }
        }
        // No need to handle 'Z'; the closing edge is handled in parseSVG
    });

    return { points };
}

// Helper function to compare points with tolerance
function pointsEqual(p1, p2, tolerance = 0.01) {
    return (
        Math.abs(p1.x - p2.x) <= tolerance &&
        Math.abs(p1.y - p2.y) <= tolerance
    );
}