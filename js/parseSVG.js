// js/parseSVG.js
console.log('parseSVG:', typeof parseSVG);
console.log('parseSVGPath:', typeof parseSVGPath);

// Function to parse the SVG and extract vertices and correct connections
async function parseSVG() {
    const response = await fetch('assets/Low Poly Apple with ID.svg'); // Adjust path if necessary
    const svgText = await response.text();
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');

    const paths = svgDoc.querySelectorAll('path');
    const vertices = [];
    const vertexMap = new Map();
    const edgeSet = new Set(); // Global set of unique edges
    const correctConnections = new Set();
    const polygons = [];

    // Map to store edges connected to each vertex to avoid double-counting
    const vertexEdgeMap = new Map();

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

        const numVertices = pathVertices.length;

        // Create correct connections between consecutive points
        for (let i = 0; i < numVertices; i++) {
            const startVertex = pathVertices[i];
            const endVertex = pathVertices[(i + 1) % numVertices]; // Loop back to start

            const edgeKey = createEdgeKey(startVertex, endVertex);

            // Only process if the edge hasn't been added yet globally
            if (!edgeSet.has(edgeKey)) {
                edgeSet.add(edgeKey);
                correctConnections.add(edgeKey);

                // Initialize vertex edge maps if not already done
                if (!vertexEdgeMap.has(startVertex)) {
                    vertexEdgeMap.set(startVertex, new Set());
                }
                if (!vertexEdgeMap.has(endVertex)) {
                    vertexEdgeMap.set(endVertex, new Set());
                }

                // Increment counts if the edge hasn't been counted for this vertex
                if (!vertexEdgeMap.get(startVertex).has(edgeKey)) {
                    vertexEdgeMap.get(startVertex).add(edgeKey);
                    startVertex.count++;
                }
                if (!vertexEdgeMap.get(endVertex).has(edgeKey)) {
                    vertexEdgeMap.get(endVertex).add(edgeKey);
                    endVertex.count++;
                }
            }
        }

        // Store the polygon with its vertices, fill color, and initial opacity
        polygons.push({ vertices: pathVertices, fill, opacity: 0, completed: false });
    });

    // Initialize remaining counts
    vertices.forEach(vertex => {
        vertex.remaining = vertex.count;
    });

    return { vertices, edges: [], polygons, correctConnections };
}

// Helper function to create a consistent key for an edge
function createEdgeKey(vertexA, vertexB) {
    const keyA = `${vertexA.x},${vertexA.y}`;
    const keyB = `${vertexB.x},${vertexB.y}`;
    // Ensure the key is ordered to avoid duplicates in reverse
    return keyA < keyB ? `${keyA}-${keyB}` : `${keyB}-${keyA}`;
}

// Function to extract points from path data
function extractPointsFromPathData(pathData) {
    const commands = pathData.match(/[a-zA-Z][^a-zA-Z]*/g);
    const points = [];
    let startX = null;
    let startY = null;
    let lastX = null;
    let lastY = null;

    commands.forEach(command => {
        const type = command[0];
        const args = command.slice(1).trim().split(/[\s,]+/).map(parseFloat);

        if (type === 'M' || type === 'L') {
            for (let i = 0; i < args.length; i += 2) {
                const x = args[i];
                const y = args[i + 1];
                points.push({ x, y });
                if (startX === null) {
                    startX = x;
                    startY = y;
                }
                lastX = x;
                lastY = y;
            }
        } else if (type === 'Z' || type === 'z') {
            // Close the path by connecting the last point to the starting point
            if (lastX !== startX || lastY !== startY) {
                // Only add the closing point if it's not already the same as the start point
                points.push({ x: startX, y: startY });
            }
        } else {
            // Handle other path commands if necessary
        }
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