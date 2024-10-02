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
        console.log('Game state initialized:', gameState);
        drawGame();
    });

    // Add event listeners
    canvas.addEventListener('click', onCanvasClick);
    canvas.addEventListener('touchstart', onCanvasClick);
    const eraseButton = document.getElementById('eraseButton');
    eraseButton.addEventListener('click', eraseDrawing);

    console.log('Game initialized');
}

function onCanvasClick(event) {
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    let mouseX, mouseY;

    if (event.type === 'touchstart') {
        mouseX = event.touches[0].clientX - rect.left;
        mouseY = event.touches[0].clientY - rect.top;
    } else {
        mouseX = event.clientX - rect.left;
        mouseY = event.clientY - rect.top;
    }

    // Adjust mouse coordinates according to canvas scaling
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    mouseX *= scaleX;
    mouseY *= scaleY;

    console.log(`Click at (${mouseX}, ${mouseY})`);

    const clickedVertex = gameState.vertices.find(vertex => {
        const dx = (vertex.x + OFFSET_X) - mouseX;
        const dy = (vertex.y + OFFSET_Y) - mouseY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        console.log(`Vertex at (${vertex.x + OFFSET_X}, ${vertex.y + OFFSET_Y}), Distance: ${distance}`);
        return distance <= 25; // Increased from 15 to 25
    });

    if (clickedVertex) {
        console.log(`Clicked on vertex at (${clickedVertex.x}, ${clickedVertex.y})`);
        if (selectedVertex === null) {
            selectedVertex = clickedVertex;
            clickedVertex.isSelected = true;
            console.log('First vertex selected:', selectedVertex);
        } else if (selectedVertex === clickedVertex) {
            selectedVertex.isSelected = false;
            selectedVertex = null;
            console.log('Deselected vertex');
        } else {
            console.log('Second vertex clicked. Attempting to draw edge...');
            const edgeKey = createEdgeKey(selectedVertex, clickedVertex);
            const isCorrect = gameState.correctConnections.has(edgeKey);
            
            if (!gameState.edges.some(edge => edge.key === edgeKey)) {
                gameState.edges.push({
                    start: selectedVertex,
                    end: clickedVertex,
                    correct: isCorrect,
                    key: edgeKey
                });
                console.log(`Added edge: ${edgeKey}, Correct: ${isCorrect}`);
                
                if (isCorrect) {
                    selectedVertex.remaining--;
                    clickedVertex.remaining--;
                    checkPolygonCompletion();
                }
                
                // Debug information for Vector 33
                const vector33 = gameState.polygons.find(p => p.id === "Vector 33");
                if (vector33) {
                    console.log(`Vector 33 - Total vertices: ${vector33.vertices.length}`);
                    console.log(`Vector 33 - Total edges: ${vector33.vertices.length}`);
                    console.log(`Vector 33 - Completed edges: ${vector33.completedEdges}`);
                    const remainingEdges = vector33.vertices.length - vector33.completedEdges;
                    console.log(`Vector 33 remaining edges: ${remainingEdges}`);
                }
            } else {
                console.log(`Edge already exists: ${edgeKey}`);
            }
            selectedVertex.isSelected = false;
            selectedVertex = null;
        }
        drawGame();
    } else {
        console.log('No vertex clicked');
        if (selectedVertex) {
            selectedVertex.isSelected = false;
            selectedVertex = null;
            drawGame();
        }
    }
}

function checkPolygonCompletion() {
    gameState.polygons.forEach(polygon => {
        if (!polygon.completed) {
            const polygonEdgeKeys = [];
            const vertices = polygon.vertices;
            const numVertices = vertices.length;

            for (let i = 0; i < numVertices; i++) {
                const startVertex = vertices[i];
                const endVertex = vertices[(i + 1) % numVertices];

                // Skip if start and end vertices are the same
                if (startVertex === endVertex) continue;

                const edgeKey = createEdgeKey(startVertex, endVertex);
                polygonEdgeKeys.push(edgeKey);
            }

            // Check if all edges are present and correct
            const completedEdges = polygonEdgeKeys.filter(edgeKey => {
                return gameState.edges.some(edge => {
                    const existingEdgeKey = createEdgeKey(edge.start, edge.end);
                    return existingEdgeKey === edgeKey && edge.correct;
                });
            });

            polygon.completedEdges = completedEdges.length;

            if (completedEdges.length === polygonEdgeKeys.length) {
                polygon.completed = true;
                polygon.opacity = 1; // Fully opaque when completed
                console.log(`Polygon ${polygon.id} completed!`);
            }

            if (polygon.id === "Vector 33") {
                console.log(`Vector 33 - Total edges: ${polygonEdgeKeys.length}`);
                console.log(`Vector 33 - Completed edges: ${completedEdges.length}`);
                const remainingEdges = polygonEdgeKeys.length - completedEdges.length;
                console.log(`Vector 33 - Remaining edges: ${remainingEdges}`);
                console.log("Vector 33 - Remaining edge keys:");
                polygonEdgeKeys.forEach(edgeKey => {
                    if (!completedEdges.includes(edgeKey)) {
                        console.log(edgeKey);
                    }
                });
            }
        }
    });
}

function drawGame() {
    console.log('Drawing game...');
    // Clear the canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Draw polygons
    gameState.polygons.forEach(polygon => {
        if (polygon.opacity > 0) {
            drawPolygon(context, polygon);
        }
    });

    // Draw edges drawn by the user
    console.log(`Drawing ${gameState.edges.length} edges`);
    gameState.edges.forEach(edge => {
        console.log(`Drawing edge from (${edge.start.x}, ${edge.start.y}) to (${edge.end.x}, ${edge.end.y}), Correct: ${edge.correct}`);
        const color = edge.correct ? '#000' : '#FF0000'; // Black if correct, red if incorrect
        drawLine(context, edge.start, edge.end, color);
    });

    // Draw vertices
    console.log(`Drawing ${gameState.vertices.length} vertices`);
    gameState.vertices.forEach(vertex => {
        drawVertex(context, vertex);
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