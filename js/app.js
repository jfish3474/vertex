let canvas, context;
let gameState;
let selectedVertex = null;
let scale = 1;
let originX = 0;
let originY = 0;
let lastTouchDistance = 0;
let isPanning = false;
let lastPanPoint = { x: 0, y: 0 };
let isDragging = false;
let dragStartVertex = null;

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
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('touchstart', onTouchStart);
    canvas.addEventListener('touchmove', onTouchMove);
    canvas.addEventListener('touchend', onTouchEnd);
    const eraseButton = document.getElementById('eraseButton');
    eraseButton.addEventListener('click', eraseDrawing);

    console.log('Game initialized');
}

function onCanvasClick(event) {
    const clickedVertex = getVertexAtPoint(event.clientX, event.clientY);

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
            connectVertices(selectedVertex, clickedVertex);
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

    // Apply zoom and pan transformation
    context.save();
    context.translate(originX, originY);
    context.scale(scale, scale);

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
        drawLine(context, edge.start, edge.end, color, scale);
    });

    // Draw vertices
    console.log(`Drawing ${gameState.vertices.length} vertices`);
    gameState.vertices.forEach(vertex => {
        drawVertex(context, vertex, scale);
    });

    // Restore canvas state
    context.restore();
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

function onTouchStart(event) {
    if (event.touches.length === 1) {
        const touch = event.touches[0];
        const vertex = getVertexAtPoint(touch.clientX, touch.clientY);
        if (vertex) {
            isDragging = true;
            dragStartVertex = vertex;
        } else {
            onCanvasClick(event);
        }
    } else if (event.touches.length === 2) {
        event.preventDefault();
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        lastTouchDistance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
        isPanning = true;
        lastPanPoint = {
            x: (touch1.clientX + touch2.clientX) / 2,
            y: (touch1.clientY + touch2.clientY) / 2
        };
    }
}

function onTouchMove(event) {
    if (isDragging && event.touches.length === 1) {
        const touch = event.touches[0];
        drawGame();
        drawDragLine(dragStartVertex, { x: touch.clientX, y: touch.clientY });
    } else if (event.touches.length === 2) {
        event.preventDefault();
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        const currentDistance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch2.clientY);
        
        if (isPanning) {
            const currentPanPoint = {
                x: (touch1.clientX + touch2.clientX) / 2,
                y: (touch1.clientY + touch2.clientY) / 2
            };
            
            originX += (currentPanPoint.x - lastPanPoint.x) / scale;
            originY += (currentPanPoint.y - lastPanPoint.y) / scale;
            
            lastPanPoint = currentPanPoint;
        }
        
        const scaleDiff = currentDistance / lastTouchDistance;
        scale *= scaleDiff;
        scale = Math.min(Math.max(scale, 0.5), 3); // Limit zoom between 0.5x and 3x

        const centerX = (touch1.clientX + touch2.clientX) / 2;
        const centerY = (touch1.clientY + touch2.clientY) / 2;
        
        originX += (centerX - originX) * (1 - scaleDiff);
        originY += (centerY - originY) * (1 - scaleDiff);

        lastTouchDistance = currentDistance;
        drawGame();
    }
}

function onTouchEnd(event) {
    if (isDragging) {
        if (event.changedTouches.length === 1) {
            const touch = event.changedTouches[0];
            const endVertex = getVertexAtPoint(touch.clientX, touch.clientY);
            if (endVertex && endVertex !== dragStartVertex) {
                connectVertices(dragStartVertex, endVertex);
            }
        }
        isDragging = false;
        dragStartVertex = null;
        drawGame();
    }
    if (event.touches.length < 2) {
        lastTouchDistance = 0;
        isPanning = false;
    }
}

function onMouseDown(event) {
    const vertex = getVertexAtPoint(event.clientX, event.clientY);
    if (vertex) {
        isDragging = true;
        dragStartVertex = vertex;
    }
}

function onMouseMove(event) {
    if (isDragging) {
        drawGame();
        drawDragLine(dragStartVertex, { x: event.clientX, y: event.clientY });
    }
}

function onMouseUp(event) {
    if (isDragging) {
        const endVertex = getVertexAtPoint(event.clientX, event.clientY);
        if (endVertex && endVertex !== dragStartVertex) {
            connectVertices(dragStartVertex, endVertex);
        }
        isDragging = false;
        dragStartVertex = null;
        drawGame();
    }
}

function getVertexAtPoint(x, y) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = (x - rect.left - originX) / scale;
    const mouseY = (y - rect.top - originY) / scale;

    return gameState.vertices.find(vertex => {
        const dx = vertex.x + OFFSET_X - mouseX;
        const dy = vertex.y + OFFSET_Y - mouseY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= 15 / scale;
    });
}

function drawDragLine(startVertex, endPoint) {
    context.save();
    context.translate(originX, originY);
    context.scale(scale, scale);

    context.beginPath();
    context.moveTo(startVertex.x + OFFSET_X, startVertex.y + OFFSET_Y);
    context.lineTo((endPoint.x - originX) / scale, (endPoint.y - originY) / scale);
    context.strokeStyle = '#000';
    context.lineWidth = 1 / scale;
    context.stroke();

    context.restore();
}

function connectVertices(startVertex, endVertex) {
    const edgeKey = createEdgeKey(startVertex, endVertex);
    const isCorrect = gameState.correctConnections.has(edgeKey);
    
    if (!gameState.edges.some(edge => edge.key === edgeKey)) {
        gameState.edges.push({
            start: startVertex,
            end: endVertex,
            correct: isCorrect,
            key: edgeKey
        });
        if (isCorrect) {
            startVertex.remaining--;
            endVertex.remaining--;
            checkPolygonCompletion();
        }
        console.log(`Added edge: ${edgeKey}, Correct: ${isCorrect}`);
    } else {
        console.log(`Edge already exists: ${edgeKey}`);
    }
}

window.onload = initGame;