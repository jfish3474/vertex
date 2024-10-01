// js/helpers.js

const OFFSET_X = 50; // Adjust as needed
const OFFSET_Y = 50;

function drawVertex(context, vertex, color = '#3575F0') {
    context.beginPath();
    context.arc(vertex.x + OFFSET_X, vertex.y + OFFSET_Y, 15, 0, Math.PI * 2);
    context.fillStyle = color;
    context.fill();
    context.stroke();

    // Draw the remaining connection count
    context.fillStyle = '#FFF';
    context.font = '15px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(vertex.remaining.toString(), vertex.x + OFFSET_X, vertex.y + OFFSET_Y);
}

function drawLine(context, start, end, color = '#000') {
    context.beginPath();
    context.moveTo(start.x + OFFSET_X, start.y + OFFSET_Y);
    context.lineTo(end.x + OFFSET_X, end.y + OFFSET_Y);
    context.strokeStyle = color;
    context.lineWidth = 2;
    context.stroke();
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