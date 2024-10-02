// js/helpers.js

const OFFSET_X = 50; // Adjust as needed
const OFFSET_Y = 50;

function drawVertex(context, vertex, scale) {
    const vertexRadius = 15 / scale; // Adjust radius based on scale
    context.beginPath();
    context.arc(vertex.x + OFFSET_X, vertex.y + OFFSET_Y, vertexRadius, 0, Math.PI * 2);
    context.fillStyle = vertex.isSelected ? '#FFFF00' : '#3575F0';
    context.fill();
    context.strokeStyle = '#000';
    context.lineWidth = 1 / scale; // Adjust line width based on scale
    context.stroke();

    // Draw the remaining count as text
    context.fillStyle = '#FFF';
    context.font = `${12 / scale}px Arial`; // Adjust font size based on scale
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    const text = vertex.remaining.toString();
    context.fillText(text, vertex.x + OFFSET_X, vertex.y + OFFSET_Y);
}

function drawLine(context, start, end, color, scale) {
    context.beginPath();
    context.moveTo(start.x + OFFSET_X, start.y + OFFSET_Y);
    context.lineTo(end.x + OFFSET_X, end.y + OFFSET_Y);
    context.strokeStyle = color;
    context.lineWidth = 1 / scale; // Adjust line width based on scale
    context.stroke();
    console.log(`Drew line from (${start.x}, ${start.y}) to (${end.x}, ${end.y}) in color ${color}`);
}

function drawPolygon(context, polygon) {
    context.beginPath();
    context.moveTo(polygon.vertices[0].x + OFFSET_X, polygon.vertices[0].y + OFFSET_Y);

    for (let i = 1; i < polygon.vertices.length; i++) {
        context.lineTo(polygon.vertices[i].x + OFFSET_X, polygon.vertices[i].y + OFFSET_Y);
    }

    context.closePath();

    // Use the polygon's current opacity
    context.fillStyle = hexToRGBA(polygon.fill, polygon.opacity);
    context.fill();

    // Draw edges
    for (let i = 0; i < polygon.vertices.length; i++) {
        const start = polygon.vertices[i];
        const end = polygon.vertices[(i + 1) % polygon.vertices.length];
        const edgeKey = createEdgeKey(start, end);
        const edge = gameState.edges.find(e => e.key === edgeKey);
        if (edge && edge.correct) {
            context.beginPath();
            context.moveTo(start.x + OFFSET_X, start.y + OFFSET_Y);
            context.lineTo(end.x + OFFSET_X, end.y + OFFSET_Y);
            context.strokeStyle = '#000';
            context.lineWidth = 1;
            context.stroke();
        }
    }

    // Log information about Vector 33
    if (polygon.id === "Vector 33") {
        console.log(`Vector 33 - Vertices: ${polygon.vertices.length}`);
        console.log(`Vector 33 - Completed edges: ${polygon.completedEdges}`);
        console.log(`Vector 33 - Total edges: ${polygon.vertices.length}`);
        console.log(`Vector 33 - Remaining edges: ${polygon.vertices.length - polygon.completedEdges}`);
        
        console.log("Vector 33 - Edge status:");
        for (let i = 0; i < polygon.vertices.length; i++) {
            const start = polygon.vertices[i];
            const end = polygon.vertices[(i + 1) % polygon.vertices.length];
            const edgeKey = createEdgeKey(start, end);
            const edge = gameState.edges.find(e => e.key === edgeKey);
            console.log(`Edge ${i}: ${edgeKey}, Status: ${edge ? (edge.correct ? 'Correct' : 'Incorrect') : 'Not drawn'}`);
        }
    }
}

function hexToRGBA(hex, opacity) {
    let r = 0, g = 0, b = 0;

    // Remove '#' if present
    hex = hex.replace('#', '');

    if (hex.length === 3) {
        // 3-digit hex
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
        // 6-digit hex
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
    }

    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function createEdgeKey(vertexA, vertexB) {
    const round = (num) => Math.round(num * 100) / 100; // Round to 2 decimal places
    const keyA = `${round(vertexA.x)},${round(vertexA.y)}`;
    const keyB = `${round(vertexB.x)},${round(vertexB.y)}`;
    return keyA < keyB ? `${keyA}-${keyB}` : `${keyB}-${keyA}`;
}

// Example of logging vertex counts
// vertices.forEach(vertex => {
//     console.log(`Vertex (${vertex.x}, ${vertex.y}): count = ${vertex.count}`);
// });

// Example of logging total unique edges
// console.log(`Total unique edges: ${edgeSet.size}`);