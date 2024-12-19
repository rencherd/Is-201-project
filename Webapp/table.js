const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Adjust canvas size
canvas.width = window.innerWidth * 0.8;
canvas.height = 500;

let isDragging = false;
let currentWood = null;
let offsetX = 0;  // Offset of the mouse relative to the wood piece
let offsetY = 0;  // Offset of the mouse relative to the wood piece
let woods = [];

// Snap tolerance for snapping pieces into place
const snapTolerance = 10; // Reduced from 50px to 10px for tighter snap

// 2x4 Piece object (with positions and type)
class Wood {
  constructor(x, y, width, height, type) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type;  // type = 'leg', 'support', 'seat', 'top'
    this.connected = false;  // Whether it's connected to another piece
  }

  draw() {
    if (this.type === 'leg') {
      ctx.fillStyle = "#8B4513";  // Brown wood color
    } else if (this.type === 'support') {
      ctx.fillStyle = "#A0522D";  // Darker brown color
    } else if (this.type === 'pot') {
      ctx.fillStyle = "#6B8E23";  // Pot color
    } else if (this.type === 'top') {
      ctx.fillStyle = "#D2691E";  // Table top color
    }

    ctx.fillRect(this.x, this.y, this.width, this.height);
  }

  // Check if the piece is close enough to a snap target
  snapTo(targetX, targetY) {
    const deltaX = Math.abs(this.x - targetX);
    const deltaY = Math.abs(this.y - targetY);
    if (deltaX < snapTolerance && deltaY < snapTolerance) {
      this.x = targetX;
      this.y = targetY;
      this.connected = true;  // Mark as snapped
    }
  }
}

// Initialize wood pieces with starting positions on the left
function createWoodPieces() {
  const legWidth = 20;
  const legHeight = 100;
  const tableTopWidth = 250;
  const tableTopHeight = 20;
  const potWidth = 40;
  const potHeight = 60;

  woods = [
    // Two vertical legs (start on the left)
    new Wood(50, 150, legWidth, legHeight, 'leg'), // Left leg
    new Wood(50, 200, legWidth, legHeight, 'leg'), // Right leg

    // Table top (start on the left)
    new Wood(50, 50, tableTopWidth, tableTopHeight, 'top'),  // Table top

    // Flower pot (start on the left)
    new Wood(50, 300, potWidth, potHeight, 'pot')  // Flower pot
  ];
}

// Draw the outline of the finished picnic table (with updates)
function drawTableOutline() {
  const tableWidth = 250;
  const tableHeight = 200;
  
  // Calculate positions dynamically based on the wood pieces' positions
  const tableX = (canvas.width - tableWidth) / 2;
  const tableY = (canvas.height - tableHeight) / 2;

  const legWidth = 20;
  const legHeight = 100;

  // Draw the legs as vertical rectangles
  ctx.fillStyle = "rgba(50, 50, 50, 0.2)";  // Semi-opaque grey for the outline
  ctx.fillRect(tableX + tableWidth * 0.1, tableY + tableHeight, legWidth, legHeight);  // Left leg
  ctx.fillRect(tableX + tableWidth * 0.9 - legWidth, tableY + tableHeight, legWidth, legHeight);  // Right leg

  // Draw the table top (further down now, touching the legs)
  const topWidth = 250;
  const topHeight = 20;
  ctx.fillRect(tableX, tableY + 180, topWidth, topHeight);  // Table top is now lower, no gap

  // Draw the flower pot on top of the table (positioned directly above)
  const potWidth = 40;
  const potHeight = 60;
  ctx.fillStyle = "rgba(50, 50, 50, 0.2)";
  ctx.fillRect(tableX + topWidth / 2 - potWidth / 2, tableY + 120, potWidth, potHeight);  // Flower pot sits directly above
}

// Handle mouse events
canvas.addEventListener('mousedown', (e) => {
  const { clientX, clientY } = e;
  const canvasX = clientX - canvas.getBoundingClientRect().left;  // Adjust for canvas position on screen
  const canvasY = clientY - canvas.getBoundingClientRect().top;

  if (e.button === 0) {  // Left-click (dragging)
    ctx.beginPath();
    // ctx.arc(canvasX, canvasY, 5, 0, Math.PI * 2);
    ctx.arc(clientX, clientY, 5, 0, Math.PI * 2);
    ctx.fill()
    // Check if any piece of wood is clicked
    for (let wood of woods) {
      if (canvasX >= wood.x && canvasX <= wood.x + wood.width &&
          canvasY >= wood.y && canvasY <= wood.y + wood.height && !wood.connected) {
        currentWood = wood;
        isDragging = true;
        // Calculate the offset between the mouse cursor and the wood piece's top-left corner
        offsetX = canvasX - wood.x;  // Correct offset calculation
        offsetY = canvasY - wood.y;  // Correct offset calculation
        break;
      }
    }
  }

  e.preventDefault();  // Prevent right-click menu from showing
});

canvas.addEventListener('mousemove', (e) => {
    if (isDragging && currentWood) {
      const { clientX, clientY } = e;
      const canvasX = clientX - canvas.getBoundingClientRect().left;
      const canvasY = clientY - canvas.getBoundingClientRect().top;
  
      // Now use the offset to correctly position the wood
      currentWood.x = canvasX - offsetX;
      currentWood.y = canvasY - offsetY;
  
      draw();
    }
  });

canvas.addEventListener('mouseup', () => {
  isDragging = false;

  // Snap the wood to the table outline
  if (currentWood) {
    const tableX = (canvas.width - 250) / 2;
    const tableY = (canvas.height - 200) / 2;

    if (currentWood.type === 'leg') {
      // Snap legs to bottom corners of the table
      currentWood.snapTo(tableX + 25, tableY + 200);  // Left leg
      currentWood.snapTo(tableX + 205, tableY + 200);  // Right leg
    } else if (currentWood.type === 'top') {
      // Snap top to lower center, touching the legs directly
      currentWood.snapTo(tableX, tableY + 180); // New final position for the table top
    } else if (currentWood.type === 'pot') {
      // Snap flower pot to directly above the table top
      currentWood.snapTo(tableX + 105, tableY + 120);  // Flower pot sits directly above
    }
  }

  currentWood = null;
  draw();  // Redraw after snapping
});

// Draw everything
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawTableOutline();  // Draw table outline (semi-opaque)

  // Draw all wood pieces
  woods.forEach(wood => wood.draw());

  // Check if everything is snapped into place to draw the flower
  if (isEverythingInPlace()) {
    drawFlowerOnPot();
  }
}

// Check if all pieces are snapped into place
function isEverythingInPlace() {
  const tableX = (canvas.width - 250) / 2;
  const tableY = (canvas.height - 200) / 2;

  // Check if the pot is correctly positioned
  const pot = woods.find(wood => wood.type === 'pot');
  if (pot && pot.connected) {
    return true;  // Flower can be drawn once the pot is in place
  }
  return false;  // If the pot is not in place, the flower won't appear
}

// Function to draw a red flower and green stem on the flower pot
function drawFlowerOnPot() {
    const flowerX = 614; // Centered horizontally on the pot
    const flowerY = 220; // Positioned on top of the pot
    const flowerRadius = 20; // Flower size
    const stemWidth = 5; // Width of the stem
    const stemHeight = 40; // Height of the stem
  
    // Draw flower stem (green rectangle)
    ctx.fillStyle = "green";
    ctx.fillRect(flowerX - stemWidth / 2, flowerY + flowerRadius, stemWidth, stemHeight);
  
    // Draw flower petals (red circle)
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(flowerX, flowerY, flowerRadius, 0, Math.PI * 2);
    ctx.fill();
  }
  

createWoodPieces();
draw();
