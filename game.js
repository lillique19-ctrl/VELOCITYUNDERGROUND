let gameState = "MENU";
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const heatEl = document.getElementById('heat');
const speedEl = document.getElementById('speed');

canvas.width = 1000;
canvas.height = 400;

// --- PHYSICS CONSTANTS ---
const GRAVITY = 0.5;
const FRICTION = 0.94;
const ACCEL = 0.8;
const JUMP_FORCE = -12;

// --- GAME VARIABLES ---
let skyTime = 0;
let heat = 0;
const keys = {};

const SKY_COLORS = {
    day: { r: 135, g: 206, b: 235 },
    sunset: { r: 255, g: 95, b: 109 },
    night: { r: 10, g: 10, b: 35 }
};

const player = {
    x: 100, y: 300, vx: 0, vy: 0, w: 25, h: 40,
    grounded: false, color: '#00ffcc',
    grappling: false, anchor: null
};

let platforms = [
    { x: 0, y: 380, w: 1000, h: 40 },
    { x: 300, y: 220, w: 150, h: 20 },
    { x: 600, y: 150, w: 150, h: 20 },
    { x: 850, y: 250, w: 100, h: 20 }
];

let currentLevel = { skyCol: SKY_COLORS.day, platColor: "#222" };

// --- MENU LOGIC ---
function startGame(chapter) {
    document.getElementById('menu-screen').style.display = 'none';
    document.getElementById('ui').style.display = 'flex';
    initLevel(chapter);
    gameState = "PLAYING";
}

function initLevel(ch) {
    document.getElementById('current-chapter').innerText = "ZONE: " + ch;
    if (ch === 1) skyTime = 0;    // Start at Day
    if (ch === 2) skyTime = 0.8;  // Start at Sunset
    if (ch === 3) skyTime = 1.2;  // Start at Night
}

// --- CONTROLS ---
window.addEventListener('keydown', e => { 
    keys[e.key.toLowerCase()] = true; 
    if (e.key.toLowerCase() === 'e') startGrapple();
});
window.addEventListener('keyup', e => { 
    keys[e.key.toLowerCase()] = false; 
    if (e.key.toLowerCase() === 'e') player.grappling = false;
});

function startGrapple() {
    let closest = null;
    let minDist = 300;
    platforms.forEach(p => {
        let dx = (p.x + p.w/2) - player.x;
        let dy = p.y - player.y;
        let dist = Math.sqrt(dx*dx + dy*dy);
        if (dy < 0 && dist < minDist) {
            minDist = dist;
            closest = { x: p.x + p.w/2, y: p.y };
        }
    });
    if (closest) {
        player.anchor = closest;
        player.grappling = true;
        heat += 2;
    }
}

function lerpColor(c1, c2, f) {
    const r = Math.round(c1.r + (c2.r - c1.r) * f);
    const g = Math.round(c1.g + (c2.g - c1.g) * f);
    const b = Math.round(c1.b + (c2.b - c1.b) * f);
    return `rgb(${r}, ${g}, ${b})`;
}

// --- ENGINE ---
function update() {
    // Movement
    if (!player.grappling) {
        if (keys['d']) player.vx += ACCEL;
        if (keys['a']) player.vx -= ACCEL;
        if (keys['w'] && player.grounded) {
            player.vy = JUMP_FORCE;
            player.grounded = false;
        }
    } else {
        let dx = player.anchor.x - player.x;
        let dy = player.anchor.y - player.y;
        player.vx += dx * 0.01;
        player.vy += dy * 0.01;
        player.vx *= 0.98;
    }

    player.vx *= FRICTION;
    player.vy += GRAVITY;
    player.x += player.vx;
    player.y += player.vy;

    // Platform Collision
    player.grounded = false;
    platforms.forEach(plat => {
        if (player.x < plat.x + plat.w && player.x + player.w > plat.x &&
            player.y + player.h <= plat.y && player.y + player.h + player.vy >= plat.y) {
                player.vy = 0;
                player.y = plat.y - player.h;
                player.grounded = true;
        }
    });

    // Heat Recovery
    if (heat > 0) heat -= 0.01;
}

function draw() {
    // 1. Sky Logic
    skyTime += 0.0005; 
    if (skyTime > 2) skyTime = 0;
    let skyCol = skyTime <= 1 ? lerpColor(SKY_COLORS.day, SKY_COLORS.sunset, skyTime) 
                             : lerpColor(SKY_COLORS.sunset, SKY_COLORS.night, skyTime - 1);
    
    ctx.fillStyle = skyCol;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Grapple Line
    if (player.grappling) {
        ctx.strokeStyle = '#ff00ff';
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(player.x + player.w/2, player.y);
        ctx.lineTo(player.anchor.x, player.anchor.y);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    // 3. Platforms
    ctx.fillStyle = '#1a1a1a';
    platforms.forEach(p => {
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.strokeStyle = '#333';
        ctx.strokeRect(p.x, p.y, p.w, p.h);
    });

    // 4. Player
    ctx.fillStyle = player.color;
    ctx.shadowBlur = 15;
    ctx.shadowColor = player.color;
    ctx.fillRect(player.x, player.y, player.w, player.h);
    ctx.shadowBlur = 0;

    // 5. Update UI
    heatEl.innerText = Math.floor(heat);
    speedEl.innerText = Math.round(Math.abs(player.vx));
}

function gameLoop() {
    if (gameState === "PLAYING") {
        update();
        draw();
    }
    requestAnimationFrame(gameLoop);
}

gameLoop();