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

// Block tower state
const blockTower = {
    x: 650, // world coordinate (not screen)
    y: 0,   // will be set based on ground
    width: 40,
    height: 120,
    fallen: false
};

// Bucket state
const bucket = {
    x: 900, // moved to the right
    y: 0, // set in updatePlayer
    width: 80, // twice the size
    height: 80, // twice the size
    fallen: false
};

// Parent turn state and timers
let blockTowerParentTurned = false;
let bucketParentTurned = false;

function scheduleParentTurn(parent) {
    // parent: 'block' or 'bucket'
    const minMs = 2000, maxMs = 8000;
    const nextInterval = Math.random() * (maxMs - minMs) + minMs;
    setTimeout(() => {
        if (parent === 'block') {
            blockTowerParentTurned = !blockTowerParentTurned;
            scheduleParentTurn('block');
        } else {
            bucketParentTurned = !bucketParentTurned;
            scheduleParentTurn('bucket');
        }
    }, nextInterval);
}
scheduleParentTurn('block');
scheduleParentTurn('bucket');

// Track if messes were made while parent was turned
let blockTowerMessValid = true;
let bucketMessValid = true;

function isMess() {
    return (blockTower.fallen && blockTowerMessValid) || (bucket.fallen && bucketMessValid);
}

function messCount() {
    let count = 0;
    if (blockTower.fallen && blockTowerMessValid) count++;
    if (bucket.fallen && bucketMessValid) count++;
    return count;
}

// BAD BABY message state
let badBabyMessageUntil = 0;

function showBadBabyMessage() {
    const duration = 1000 + Math.random() * 1000; // 1-2 seconds
    badBabyMessageUntil = performance.now() + duration;
}

// Load player images
const playerImages = [
    new Image(),
    new Image()
];
playerImages[0].src = 'babywalk1.png';
playerImages[1].src = 'babywalk2.png';

// Load parent images
const parentImages = [
    new Image(), // mama
    new Image()  // dada
];
parentImages[0].src = 'mama.png';
parentImages[1].src = 'dada.png';

// Randomly assign a parent to bucket and block tower (0: mama, 1: dada)
const blockTowerParentIdx = Math.random() < 0.5 ? 0 : 1;
const bucketParentIdx = Math.random() < 0.5 ? 0 : 1;

// Input handling
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    // Block tower interaction (spacebar, only on initial press and when overlapping)
    if ((e.key === ' ' || e.code === 'Space') && !blockTower.fallen && !keys._spaceHandled) {
        blockTower.y = canvas.height - GROUND_HEIGHT - blockTower.height;
        if (
            player.x + PLAYER_WIDTH > blockTower.x &&
            player.x < blockTower.x + blockTower.width &&
            player.y + PLAYER_HEIGHT > blockTower.y &&
            player.y < blockTower.y + blockTower.height
        ) {
            blockTower.fallen = true;
            blockTowerMessValid = !blockTowerParentTurned;
            if (!blockTowerMessValid) showBadBabyMessage();
        }
        keys._spaceHandled = true;
    }
    // Bucket interaction
    if ((e.key === ' ' || e.code === 'Space') && !bucket.fallen) {
        if (
            player.x + PLAYER_WIDTH > bucket.x &&
            player.x < bucket.x + bucket.width &&
            player.y + PLAYER_HEIGHT > bucket.y &&
            player.y < bucket.y + bucket.height
        ) {
            bucket.fallen = true;
            bucketMessValid = !bucketParentTurned;
            if (!bucketMessValid) showBadBabyMessage();
        }
    }
});
document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
    if (e.key === ' ' || e.code === 'Space') {
        keys._spaceHandled = false;
    }
});

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
    // Only ground collision
    if (player.y + PLAYER_HEIGHT >= canvas.height - GROUND_HEIGHT) {
        player.y = canvas.height - GROUND_HEIGHT - PLAYER_HEIGHT;
        player.vy = 0;
        player.onGround = true;
    } else {
        player.onGround = false;
    }
    // Block tower interaction: now handled in keydown event
    blockTower.y = canvas.height - GROUND_HEIGHT - blockTower.height;
    // Bucket position
    bucket.y = canvas.height - GROUND_HEIGHT - bucket.height;
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
    let drawWidth = PLAYER_WIDTH;
    let drawHeight = desiredHeight;
    let drawX = player.x - cameraX;
    let drawY = player.y - (desiredHeight - PLAYER_HEIGHT); // adjust Y so feet stay on ground
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
        ctx.fillRect(drawX, drawY, drawWidth, drawHeight);
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

    // Table (visual only, no ramp)
    const tableX = 350 * 2.5 - bgOffset;
    const tableWidth = 500;
    const tableTopY = groundY - 160;
    const tableHeight = 40;
    // Draw table top and legs only
    ctx.fillStyle = '#deb887';
    ctx.fillRect(tableX, tableTopY, tableWidth, tableHeight);
    ctx.fillStyle = '#a0522d';
    ctx.fillRect(tableX + 40, tableTopY + tableHeight, 30, 120); // left leg
    ctx.fillRect(tableX + tableWidth - 70, tableTopY + tableHeight, 30, 120); // right leg

    // Block tower (interactable)
    const towerScreenX = blockTower.x - bgOffset;
    const towerScreenY = blockTower.y;
    ctx.save();
    if (!blockTower.fallen) {
        // Upright tower: stack of blocks
        for (let i = 0; i < 4; i++) {
            ctx.fillStyle = i % 2 === 0 ? '#e3d36b' : '#b45f06';
            ctx.fillRect(towerScreenX, towerScreenY + i * 30, 40, 30);
            ctx.strokeStyle = '#333';
            ctx.strokeRect(towerScreenX, towerScreenY + i * 30, 40, 30);
        }
    } else {
        // Fallen: blocks lying horizontally
        for (let i = 0; i < 4; i++) {
            ctx.fillStyle = i % 2 === 0 ? '#e3d36b' : '#b45f06';
            ctx.fillRect(towerScreenX + i * 30, towerScreenY + 90, 30, 40);
            ctx.strokeStyle = '#333';
            ctx.strokeRect(towerScreenX + i * 30, towerScreenY + 90, 30, 40);
        }
    }
    // Draw parent image to the right of the block tower
    const parentImg1 = parentImages[blockTowerParentIdx];
    if (parentImg1.complete && parentImg1.naturalWidth && parentImg1.naturalHeight) {
        const parentHeight = 240; // at least 2x baby height
        const scale = parentHeight / parentImg1.naturalHeight;
        const imgW = parentImg1.naturalWidth * scale;
        if (blockTowerParentTurned) {
            ctx.save();
            ctx.scale(-1, 1);
            ctx.drawImage(parentImg1,
                -(towerScreenX + blockTower.width + 20 + imgW),
                canvas.height - GROUND_HEIGHT - parentHeight,
                imgW, parentHeight);
            ctx.restore();
        } else {
            ctx.drawImage(parentImg1, towerScreenX + blockTower.width + 20, canvas.height - GROUND_HEIGHT - parentHeight, imgW, parentHeight);
        }
    }
    ctx.restore();

    // Bucket (interactable)
    const bucketScreenX = bucket.x - bgOffset;
    const bucketScreenY = bucket.y;
    ctx.save();
    if (!bucket.fallen) {
        // Upright bucket
        ctx.fillStyle = '#b0c4de';
        ctx.beginPath();
        ctx.ellipse(bucketScreenX + 40, bucketScreenY + 60, 40, 20, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#4682b4';
        ctx.fillRect(bucketScreenX, bucketScreenY + 20, 80, 50);
        ctx.strokeStyle = '#333';
        ctx.strokeRect(bucketScreenX, bucketScreenY + 20, 80, 50);
        ctx.beginPath();
        ctx.ellipse(bucketScreenX + 40, bucketScreenY + 20, 40, 16, 0, 0, Math.PI * 2);
        ctx.stroke();
    } else {
        // Fallen bucket (tipped right) and water
        ctx.save();
        ctx.translate(bucketScreenX + 40, bucketScreenY + 80);
        ctx.rotate(-Math.PI / 4);
        ctx.fillStyle = '#b0c4de';
        ctx.beginPath();
        ctx.ellipse(0, 0, 40, 20, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#4682b4';
        ctx.fillRect(-40, -30, 80, 50);
        ctx.strokeStyle = '#333';
        ctx.strokeRect(-40, -30, 80, 50);
        ctx.beginPath();
        ctx.ellipse(0, -30, 40, 16, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        // Water puddle
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#00bfff';
        ctx.beginPath();
        ctx.ellipse(bucketScreenX + 80, bucketScreenY + bucket.height + 20, 60, 24, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.restore();
    }
    // Draw parent image to the right of the bucket
    const parentImg2 = parentImages[bucketParentIdx];
    if (parentImg2.complete && parentImg2.naturalWidth && parentImg2.naturalHeight) {
        const parentHeight = 240;
        const scale = parentHeight / parentImg2.naturalHeight;
        const imgW = parentImg2.naturalWidth * scale;
        if (bucketParentTurned) {
            ctx.save();
            ctx.scale(-1, 1);
            ctx.drawImage(parentImg2,
                -(bucketScreenX + bucket.width + 20 + imgW),
                bucketScreenY - (parentHeight - bucket.height),
                imgW, parentHeight);
            ctx.restore();
        } else {
            ctx.drawImage(parentImg2, bucketScreenX + bucket.width + 20, bucketScreenY - (parentHeight - bucket.height), imgW, parentHeight);
        }
    }
    ctx.restore();

    // Draw mess count text in top left
    ctx.save();
    ctx.font = '20px monospace';
    ctx.fillStyle = '#222';
    ctx.fillText(`Messes: ${messCount()}`, 28, 36);
    ctx.restore();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawKitchenBackground();
    drawGround();
    drawPlayer();
    // Draw BAD BABY message if needed
    if (performance.now() < badBabyMessageUntil) {
        ctx.save();
        ctx.font = 'bold 60px sans-serif';
        ctx.fillStyle = '#f44';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 10;
        ctx.fillText('BAD BABY', canvas.width / 2, canvas.height / 2);
        ctx.restore();
    }
}

function gameLoop() {
    updatePlayer();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
