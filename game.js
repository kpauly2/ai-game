const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game constants
const GRAVITY = 0.7;
const GROUND_HEIGHT = 60;
const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 60;
const SCROLL_EDGE = 350;
const MOVE_SPEED = 5;

// Game state
let cameraX = 0;
const keys = {};

// Player animation state
let playerFrame = 0; // 0 or 1
let lastPlayerX = 100; // initial player x
let playerLastFrameSwitch = performance.now(); // last frame switch timestamp
const PLAYER_FRAME_INTERVAL = 500; // ms
let playerFacingLeft = false;

const player = {
    x: 100,
    y: canvas.height - GROUND_HEIGHT - PLAYER_HEIGHT,
    vx: 0,
    vy: 0,
    onGround: false
};

// Load player images
const playerImages = [
    new Image(),
    new Image()
];
playerImages[0].src = 'babywalk1.png';
playerImages[1].src = 'babywalk2.png';

// Input handling
window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

function updatePlayer() {
    // Horizontal movement
    let moved = false;
    if (keys['ArrowLeft']) {
        player.vx = -MOVE_SPEED;
        moved = true;
        playerFacingLeft = true;
    } else if (keys['ArrowRight']) {
        player.vx = MOVE_SPEED;
        moved = true;
        playerFacingLeft = false;
    } else {
        player.vx = 0;
    }
    // Apply gravity
    player.vy += GRAVITY;
    player.x += player.vx;
    player.y += player.vy;
    // Unpassable wall collision (left side)
    const WALL_WIDTH = 30;
    if (player.x < WALL_WIDTH) {
        player.x = WALL_WIDTH;
        if (player.vx < 0) player.vx = 0;
    }
    // Ground collision
    if (player.y + PLAYER_HEIGHT >= canvas.height - GROUND_HEIGHT) {
        player.y = canvas.height - GROUND_HEIGHT - PLAYER_HEIGHT;
        player.vy = 0;
        player.onGround = true;
    } else {
        player.onGround = false;
    }
    // Side-scrolling camera
    if (player.x > cameraX + SCROLL_EDGE) {
        cameraX = player.x - SCROLL_EDGE;
    } else if (player.x < cameraX + 100) {
        cameraX = Math.max(0, player.x - 100);
    }
    // Animation: toggle frame if player moved horizontally and interval passed
    if (moved) {
        const now = performance.now();
        if (now - playerLastFrameSwitch >= PLAYER_FRAME_INTERVAL) {
            playerFrame = 1 - playerFrame;
            playerLastFrameSwitch = now;
        }
    } else {
        playerFrame = 0; // idle frame (optional: always show frame 0 when not moving)
    }
    lastPlayerX = player.x;
}

function drawGround() {
    ctx.fillStyle = '#4b2';
    ctx.fillRect(-cameraX, canvas.height - GROUND_HEIGHT, 2000, GROUND_HEIGHT);
}

function drawPlayer() {
    // Draw animated player sprite with aspect ratio preserved and enlarged
    const img = playerImages[playerFrame];
    const desiredHeight = PLAYER_HEIGHT * 2; // Double the original height
    if (img.complete && img.naturalWidth && img.naturalHeight) {
        const scale = desiredHeight / img.naturalHeight;
        const drawWidth = img.naturalWidth * scale;
        ctx.imageSmoothingEnabled = false;
        if (playerFacingLeft) {
            ctx.save();
            ctx.scale(-1, 1);
            ctx.drawImage(
                img,
                -(player.x - cameraX + drawWidth),
                player.y - (desiredHeight - PLAYER_HEIGHT),
                drawWidth,
                desiredHeight
            );
            ctx.restore();
        } else {
            ctx.drawImage(
                img,
                player.x - cameraX,
                player.y - (desiredHeight - PLAYER_HEIGHT),
                drawWidth,
                desiredHeight
            );
        }
    } else {
        // fallback: draw a rectangle if image not loaded
        ctx.fillStyle = '#f44';
        ctx.fillRect(player.x - cameraX, player.y - PLAYER_HEIGHT, PLAYER_WIDTH, desiredHeight);
    }
}

// Draw a kitchen background (cartoon style, aligned with ground)
function drawKitchenBackground() {
    // Background wall (above ground)
    ctx.fillStyle = '#f5e6ca';
    ctx.fillRect(0, 0, canvas.width, canvas.height - GROUND_HEIGHT);

    // Parallax offset (background scrolls slower)
    const bgOffset = cameraX * 0.5;
    const groundY = canvas.height - GROUND_HEIGHT;

    // Unpassable wall (far left)
    ctx.fillStyle = '#888';
    ctx.fillRect(-bgOffset, groundY - 375, 75, 375);

    // Cabinets (bottom aligned with ground)
    for (let i = 0; i < 5; i++) {
        let cabHeight = 150;
        let cabY = groundY - cabHeight;
        let x = (100 + i * 130) * 2.5 - bgOffset;
        ctx.fillStyle = '#b87f4a';
        ctx.fillRect(x, cabY, 275, cabHeight);
        ctx.fillStyle = '#d2b48c';
        ctx.fillRect(x, cabY, 275, 37.5); // Top trim
        ctx.fillStyle = '#8b5a2b';
        ctx.fillRect(x + 125, cabY + 75, 25, 50); // Handle
    }

    // Fridge (bottom aligned with ground)
    let fridgeHeight = 300;
    let fridgeY = groundY - fridgeHeight;
    let fridgeX = 800 * 2.5 - bgOffset;
    ctx.fillStyle = '#e0e7ef';
    ctx.fillRect(fridgeX, fridgeY, 150, fridgeHeight);
    ctx.fillStyle = '#b0b8c0';
    ctx.fillRect(fridgeX, fridgeY, 150, 25); // Top
    ctx.fillStyle = '#a0a8b0';
    ctx.fillRect(fridgeX + 125, fridgeY + 50, 20, 87.5); // Handle

    // Stove (bottom aligned with ground)
    let stoveHeight = 150;
    let stoveY = groundY - stoveHeight;
    let stoveX = 600 * 2.5 - bgOffset;
    ctx.fillStyle = '#cccccc';
    ctx.fillRect(stoveX, stoveY, 150, stoveHeight);
    ctx.fillStyle = '#888';
    ctx.fillRect(stoveX, stoveY, 150, 25); // Top
    // Burners
    ctx.fillStyle = '#444';
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
        ctx.beginPath();
        ctx.arc(stoveX + 45 + i * 55, stoveY + 37.5 + j * 45, 15, 0, 2 * Math.PI);
        ctx.fill();
    }

    // Table (bottom aligned with ground)
    let tableX = 350 * 2.5 - bgOffset;
    ctx.fillStyle = '#deb887';
    ctx.fillRect(tableX, groundY - 100, 250, 25);
    ctx.fillStyle = '#a0522d';
    ctx.fillRect(tableX + 25, groundY - 75, 25, 75);
    ctx.fillRect(tableX + 200, groundY - 75, 25, 75);

    // Window (above ground, on wall)
    let windowHeight = 125;
    let windowY = groundY - 350;
    let windowX = 200 * 2.5 - bgOffset;
    ctx.fillStyle = '#bcdffb';
    ctx.fillRect(windowX, windowY, 175, windowHeight);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 10;
    ctx.strokeRect(windowX, windowY, 175, windowHeight);
    ctx.beginPath();
    ctx.moveTo(windowX + 87.5, windowY);
    ctx.lineTo(windowX + 87.5, windowY + windowHeight);
    ctx.moveTo(windowX, windowY + windowHeight / 2);
    ctx.lineTo(windowX + 175, windowY + windowHeight / 2);
    ctx.stroke();
    ctx.lineWidth = 1;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawKitchenBackground();
    drawGround();
    drawPlayer();
}

function gameLoop() {
    updatePlayer();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
