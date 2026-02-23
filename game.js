let gameState = "MENU";
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 1000;
canvas.height = 400;

// --- PHYSICS & ANIMATION CONSTANTS ---
const GRAVITY = 0.6;
const FRICTION = 0.85;
const ACCEL = 0.8;
let animTimer = 0; // For the breathing/running cycles

const keys = {};
const player = {
    x: 100, y: 100, vx: 0, vy: 0, w: 30, h: 60,
    grounded: false, dir: 1, health: 3,
    isSliding: false, isDodging: 0, 
    actionFrame: 0, actionType: null
};

let platforms = [
    { x: 0, y: 360, w: 5000, h: 200 }, // Massive floor
    { x: 300, y: 260, w: 200, h: 20 },
    { x: 600, y: 180, w: 200, h: 20 }
];

// --- INPUTS ---
canvas.addEventListener('mousedown', () => {
    if (gameState !== "PLAYING" || player.actionFrame > 0) return;
    player.actionType = Math.random() > 0.5 ? "PUNCH" : "KICK";
    player.actionFrame = 15;
});

window.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;
    if (e.key.toLowerCase() === "f") player.isDodging = 15;
});
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

function startGame(ch) {
    document.getElementById('menu-screen').style.display = 'none';
    document.getElementById('ui').style.display = 'flex';
    gameState = "PLAYING";
    player.y = 100;
    player.vx = 0;
    player.vy = 0;
}

// --- CORE ENGINE ---
function update() {
    animTimer += 0.1;

    // Movement Logic
    player.isSliding = keys['shift'] && player.grounded;
    let moveAccel = player.isSliding ? ACCEL * 1.2 : ACCEL;

    if (keys['d']) { player.vx += moveAccel; player.dir = 1; }
    if (keys['a']) { player.vx -= moveAccel; player.dir = -1; }
    if (keys['w'] && player.grounded && !player.isSliding) {
        player.vy = -14;
        player.grounded = false;
    }

    player.vx *= FRICTION;
    player.vy += GRAVITY;

    // --- NEW SOLID COLLISION CHECK ---
    let nextY = player.y + player.vy;
    player.grounded = false;

    platforms.forEach(p => {
        // Check if player is within X-bounds of platform
        if (player.x + player.w > p.x && player.x < p.x + p.w) {
            // Check if player's bottom is hitting the platform top
            if (player.y + player.h <= p.y && nextY + player.h >= p.y) {
                player.vy = 0;
                player.y = p.y - player.h;
                player.grounded = true;
            }
        }
    });

    if (!player.grounded) player.y += player.vy;
    player.x += player.vx;

    if (player.actionFrame > 0) player.actionFrame--;
    if (player.isDodging > 0) player.isDodging--;
}

// --- ANIMATED HUMANOID DRAWING ---
function drawPlayer() {
    const x = player.x;
    const y = player.y;
    const isMoving = Math.abs(player.vx) > 0.5;
    
    // 1. Breathing Effect (Idle)
    let breathe = (gameState === "PLAYING" && !isMoving && player.grounded) ? Math.sin(animTimer) * 2 : 0;
    
    // 2. Sliding Adjustment
    let bodyHeight = player.isSliding ? 20 : 30;
    let yOffset = player.isSliding ? 30 : 0;

    ctx.save();
    if (player.isDodging > 0) ctx.globalAlpha = 0.5;

    // --- LEGS (Jeans) ---
    ctx.fillStyle = "#4a4a4e";
    if (player.isSliding) {
        // Sliding: Legs kick out forward
        ctx.fillRect(x + (player.dir * 15), y + 45, 25, 10);
    } else if (!player.grounded) {
        // Jumping: Legs tuck in
        ctx.fillRect(x + 5, y + 35, 8, 15); 
        ctx.fillRect(x + 17, y + 35, 8, 15);
    } else if (isMoving) {
        // Running: Legs alternate
        let legSwing = Math.sin(animTimer * 2) * 10;
        ctx.fillRect(x + 5 + legSwing, y + 35, 8, 25);
        ctx.fillRect(x + 17 - legSwing, y + 35, 8, 25);
    } else {
        // Idle
        ctx.fillRect(x + 5, y + 35, 8, 25);
        ctx.fillRect(x + 17, y + 35, 8, 25);
    }

    // --- BODY (Black Hoodie) ---
    ctx.fillStyle = "#000";
    // Lean forward if running
    let lean = (isMoving && player.grounded) ? (player.dir * 5) : 0;
    ctx.fillRect(x + lean, y + 10 + yOffset - breathe, 30, bodyHeight + breathe);

    // --- HEAD ---
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(x + 15 + lean, y + 8 + yOffset - breathe, 12, 0, Math.PI * 2);
    ctx.fill();

    // --- FIGHTING ANIMATIONS ---
    if (player.actionFrame > 0) {
        ctx.fillStyle = "#f3d2b3"; // Skin tone
        if (player.actionType === "PUNCH") {
            let armX = player.dir === 1 ? x + 25 : x - 15;
            ctx.fillRect(armX, y + 15 + yOffset, 20, 8); // Arm extended
        } else if (player.actionType === "KICK") {
            let kickX = player.dir === 1 ? x + 25 : x - 20;
            ctx.fillRect(kickX, y + 35 + yOffset, 25, 10); // Leg extended
        }
    }

    ctx.restore();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // City Background (Dark)
    ctx.fillStyle = "#050010";
    ctx.fillRect(0,0, canvas.width, canvas.height);

    // Draw Platforms
    ctx.fillStyle = "#111";
    platforms.forEach(p => ctx.fillRect(p.x, p.y, p.w, p.h));

    drawPlayer();

    // Update Speed UI
    document.getElementById('speed').innerText = Math.round(Math.abs(player.vx));
}

function loop() {
    if (gameState === "PLAYING") { update(); draw(); }
    requestAnimationFrame(loop);
}
loop();
