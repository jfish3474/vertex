// js/parseSVG.js
console.log('parseSVG:', typeof parseSVG);
console.log('parseSVGPath:', typeof parseSVGPath);

// Function to parse the SVG and extract vertices and correct connections
async function parseSVG() {
    const response = await fetch('assets/Low Poly Apple with ID.svg');
    const svgText = await response.text();
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');

    const paths = svgDoc.querySelectorAll('path');
    const vertices = [];
    const vertexMap = new Map();
    const edgeSet = new Set();
    const correctConnections = new Set();
    const polygons = [];

    // Map to store unique connections for each vertex
    const vertexConnections = new Map();

    paths.forEach((pathElement) => {
        const pathData = pathElement.getAttribute('d');
        const fill = pathElement.getAttribute('fill');

        const { points } = extractPointsFromPathData(pathData);

        const pathVertices = points.map(point => {
            const key = `${point.x},${point.y}`;
            if (!vertexMap.has(key)) {
                const vertex = { x: point.x, y: point.y, count: 0 };
                vertexMap.set(key, vertex);
                vertices.push(vertex);
                vertexConnections.set(vertex, new Set());
            }
            return vertexMap.get(key);
        });

        const numVertices = pathVertices.length;

        for (let i = 0; i < numVertices; i++) {
            const startVertex = pathVertices[i];
            const endVertex = pathVertices[(i + 1) % numVertices];

            // Skip if start and end vertices are the same
            if (startVertex === endVertex) continue;

            const edgeKey = createEdgeKey(startVertex, endVertex);

            if (!edgeSet.has(edgeKey)) {
                edgeSet.add(edgeKey);
                correctConnections.add(edgeKey);

                // Add unique connections for each vertex
                vertexConnections.get(startVertex).add(endVertex);
                vertexConnections.get(endVertex).add(startVertex);
            }
        }

        polygons.push({ 
            id: pathElement.id, 
            vertices: pathVertices, 
            fill, 
            opacity: 0, 
            completed: false, 
            completedEdges: 0 
        });
    });

    // Set the correct count for each vertex
    vertices.forEach(vertex => {
        const connections = Array.from(vertexConnections.get(vertex));
        // Filter out self-connection
        const uniqueConnections = connections.filter(v => v !== vertex);
        vertex.count = uniqueConnections.length;
        vertex.remaining = vertex.count;
    });

    // Log information for vertex (16, 313.5)
    const targetVertex = vertices.find(v => v.x === 16 && v.y === 313.5);
    if (targetVertex) {
        console.log(`Vertex (16, 313.5) count: ${targetVertex.count}`);
        console.log('Connected to:');
        const connections = Array.from(vertexConnections.get(targetVertex));
        connections.filter(v => v !== targetVertex).forEach(connectedVertex => {
            console.log(`(${connectedVertex.x}, ${connectedVertex.y})`);
        });
    }

    return { vertices, edges: [], polygons, correctConnections };
}

// Helper function to create a consistent key for an edge
function createEdgeKey(vertexA, vertexB) {
    const keyA = `${vertexA.x},${vertexA.y}`;
    const keyB = `${vertexB.x},${vertexB.y}`;
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
            // Close the path by connecting to the starting point if necessary
            if (lastX !== startX || lastY !== startY) {
                points.push({ x: startX, y: startY });
            }
        }
        // Handle other commands if necessary
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

// Export any other functions you need