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
            const edgeKey = createEdgeKey(selectedVertex, clickedVertex);
            const isCorrect = gameState.correctConnections.has(edgeKey);

            // Avoid duplicate edges
            const edgeExists = gameState.edges.some(edge => {
                const existingEdgeKey = createEdgeKey(edge.start, edge.end);
                return existingEdgeKey === edgeKey;
            });

            if (!edgeExists) {
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
            }

            selectedVertex = null;
            drawGame();
        }
    } else {
        selectedVertex = null;
        drawGame();
    }
}

function checkPolygonCompletion() {
    gameState.polygons.forEach(polygon => {
        if (!polygon.completed) {
            // Build edge keys for all edges in the polygon
            const polygonEdgeKeys = [];
            const vertices = polygon.vertices;
            const numVertices = vertices.length;

            for (let i = 0; i < numVertices; i++) {
                const startVertex = vertices[i];
                const endVertex = vertices[(i + 1) % numVertices]; // Loop back to start
                const edgeKey = createEdgeKey(startVertex, endVertex);
                polygonEdgeKeys.push(edgeKey);
            }

            // Check if all edges are in gameState.edges and are correct
            const allEdgesCompleted = polygonEdgeKeys.every(edgeKey => {
                return gameState.edges.some(edge => {
                    const existingEdgeKey = createEdgeKey(edge.start, edge.end);
                    return existingEdgeKey === edgeKey && edge.correct;
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
    // Remove only incorrect edges
    const incorrectEdges = gameState.edges.filter(edge => !edge.correct);

    // Update remaining counts for vertices connected by incorrect edges
    incorrectEdges.forEach(edge => {
        // No need to adjust remaining counts since we didn't decrement them for incorrect edges
    });

    // Keep only correct edges
    gameState.edges = gameState.edges.filter(edge => edge.correct);

    // Redraw the game state
    drawGame();
}

// Ensure createEdgeKey is available in app.js
function createEdgeKey(vertexA, vertexB) {
    const keyA = `${vertexA.x},${vertexA.y}`;
    const keyB = `${vertexB.x},${vertexB.y}`;
    return keyA < keyB ? `${keyA}-${keyB}` : `${keyB}-${keyA}`;
}

window.onload = initGame;