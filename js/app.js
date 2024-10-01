// js/app.js

let canvas, context;
let gameState;
let selectedVertex = null;

function initGame() {
    canvas = document.getElementById('gameCanvas');
    context = canvas.getContext('2d');

    // Set canvas dimensions
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Load the SVG and initialize game state
    parseSVG().then(state => {
        gameState = state;
        drawGame();
    });

    // Add event listeners
    canvas.addEventListener('click', onCanvasClick);
    const eraseButton = document.getElementById('eraseButton');
    eraseButton.addEventListener('click', eraseDrawing);
}

function onCanvasClick(event) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const clickedVertex = gameState.vertices.find(vertex => {
        const dx = vertex.x + OFFSET_X - mouseX;
        const dy = vertex.y + OFFSET_Y - mouseY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= 15;
    });

    if (clickedVertex) {
        if (selectedVertex === null) {
            selectedVertex = clickedVertex;
        } else if (selectedVertex === clickedVertex) {
            selectedVertex = null;
        } else {
            const connectionKey = `${selectedVertex.x},${selectedVertex.y}-${clickedVertex.x},${clickedVertex.y}`;
            const isCorrect = gameState.correctConnections.has(connectionKey);
            
            gameState.edges.push({ 
                start: selectedVertex, 
                end: clickedVertex, 
                correct: isCorrect 
            });

            if (isCorrect) {
                selectedVertex.remaining--;
                clickedVertex.remaining--;
                checkPolygonCompletion();
            }

            selectedVertex = null;
        }
        drawGame();
    } else if (selectedVertex !== null) {
        selectedVertex = null;
        drawGame();
    }
}

function checkPolygonCompletion() {
    gameState.polygons.forEach(polygon => {
        if (!polygon.completed) {
            // Build all correct connection keys for this polygon
            const polygonEdges = [];
            const vertices = polygon.vertices;
            for (let i = 0; i < vertices.length; i++) {
                const startVertex = vertices[i];
                const endVertex = vertices[(i + 1) % vertices.length];
                const key = `${startVertex.x},${startVertex.y}-${endVertex.x},${endVertex.y}`;
                const reverseKey = `${endVertex.x},${endVertex.y}-${startVertex.x},${startVertex.y}`;
                polygonEdges.push(key);
                polygonEdges.push(reverseKey);
            }

            // Check if all edges are in gameState.edges and are correct
            const allEdgesCompleted = polygonEdges.every(edgeKey => {
                return gameState.edges.some(edge => {
                    const key = `${edge.start.x},${edge.start.y}-${edge.end.x},${edge.end.y}`;
                    const reverseKey = `${edge.end.x},${edge.end.y}-${edge.start.x},${edge.start.y}`;
                    return (key === edgeKey || reverseKey === edgeKey) && edge.correct;
                });
            });

            if (allEdgesCompleted) {
                polygon.completed = true;
                polygon.opacity = 1; // Set opacity to 100%
            }
        }
    });
}

function drawGame() {
    // Clear the canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Draw polygons with their current opacity
    gameState.polygons.forEach(polygon => {
        if (polygon.opacity > 0) {
            drawPolygon(context, polygon);
        }
    });

    // Draw edges drawn by the user
    gameState.edges.forEach(edge => {
        const color = edge.correct ? '#000' : '#FF0000'; // Black if correct, red if incorrect
        drawLine(context, edge.start, edge.end, color);
    });

    // Draw vertices
    gameState.vertices.forEach(vertex => {
        const color = vertex === selectedVertex ? '#FFD700' : '#3575F0'; // Highlight selected vertex
        drawVertex(context, vertex, color);
    });
}

function eraseDrawing() {
    gameState.edges = [];
    gameState.vertices.forEach(vertex => {
        vertex.remaining = vertex.count;
    });
    gameState.polygons.forEach(polygon => {
        polygon.completed = false;
        polygon.opacity = 0; // Reset opacity to 0%
    });
    drawGame();
}

window.onload = initGame;