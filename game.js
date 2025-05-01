const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game constants
const GRAVITY = 0.7;
const GROUND_HEIGHT = 60;
const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 60;
const SCROLL_EDGE = 350;
const MOVE_SPEED = 5;
const JUMP_POWER = 13;

// Game state
let cameraX = 0;
const keys = {};

const player = {
    x: 100,
    y: canvas.height - GROUND_HEIGHT - PLAYER_HEIGHT,
    vx: 0,
    vy: 0,
    onGround: false
};

// Input handling
window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

function updatePlayer() {
    // Horizontal movement
    if (keys['ArrowLeft']) {
        player.vx = -MOVE_SPEED;
    } else if (keys['ArrowRight']) {
        player.vx = MOVE_SPEED;
    } else {
        player.vx = 0;
    }
    // Jump
    if (keys['ArrowUp'] && player.onGround) {
        player.vy = -JUMP_POWER;
        player.onGround = false;
    }
    // Apply gravity
    player.vy += GRAVITY;
    player.x += player.vx;
    player.y += player.vy;
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
}

function drawGround() {
    ctx.fillStyle = '#4b2';
    ctx.fillRect(-cameraX, canvas.height - GROUND_HEIGHT, 2000, GROUND_HEIGHT);
}

function drawPlayer() {
    ctx.fillStyle = '#f44';
    ctx.fillRect(player.x - cameraX, player.y, PLAYER_WIDTH, PLAYER_HEIGHT);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGround();
    drawPlayer();
}

function gameLoop() {
    updatePlayer();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
