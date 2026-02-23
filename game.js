let gameState = "MENU";
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 1000; canvas.height = 400;

// --- PHYSICS & WORLD SETTINGS ---
const GRAVITY = 0.6;
const FRICTION = 0.85;
const ACCEL = 0.8;

let cameraX = 0; // The "Camera" that follows the player
let animTimer = 0;
let combo = 0;
let comboTimer = 0;
let damageNumbers = [];

const keys = {};
const player = {
    x: 100, y: 100, vx: 0, vy: 0, w: 30, h: 65,
    grounded: false, dir: 1, health: 3,
    isSliding: false, actionFrame: 0, actionType: null
};

// --- CITY & TERRAIN GENERATION ---
let platforms = [
    { x: 0, y: 350, w: 1200, h: 100 } // Starting Floor
];

// Simple "Cityscape" background objects
let buildings = [];
for(let i=0; i<20; i++) {
    buildings.push({
        x: i * 300, 
        w: 100 + Math.random() * 150, 
        h: 200 + Math.random() * 200,
        color: `rgba(20, 20, 40, ${0.5 + Math.random() * 0.5})`
    });
}

let enemies = [
    { x: 800, y: 290, w: 30, h: 60, health: 100, vx: -2, state: "ALIVE" }
];

// --- GENERATION ENGINE (Minecraft Style) ---
function generateTerrain() {
    let lastPlat = platforms[platforms.length - 1];
    // If the last platform is near the camera, make a new one further out
    if (lastPlat.x < cameraX + canvas.width + 500) {
        let gap = 50 + Math.random() * 100;
        let newW = 200 + Math.random() * 400;
        let newY = 200 + Math.random() * 150; // Random heights
        platforms.push({
            x: lastPlat.x + lastPlat.w + gap,
            y: newY,
            w: newW,
            h: 400
        });
    }
}

function startGame(ch) {
    document.getElementById('menu-screen').style.display = 'none';
    document.getElementById('ui').style.display = 'flex';
    gameState = "PLAYING";
}

// --- INPUTS & COMBAT ---
canvas.addEventListener('mousedown', () => {
    if (gameState !== "PLAYING" || player.actionFrame > 0) return;
    player.actionType = Math.random() > 0.5 ? "PUNCH" : "KICK";
    player.actionFrame = 15;

    // Only add combo/damage if hitting an enemy
    enemies.forEach(en => {
        let dist = Math.abs((player.x + cameraX) - en.x);
        if (dist < 60 && en.state === "ALIVE") {
            en.health -= 50;
            combo++;
            comboTimer = 120;
            spawnDamageNumber(en.x - cameraX, en.y, "-50");
            if (en.health <= 0) en.state = "DEAD";
            
            // UI Update
            const ui = document.getElementById('combo-ui');
            ui.style.display = 'block';
            document.getElementById('combo-count').innerText = combo;
        }
    });
});

function spawnDamageNumber(x, y, text) {
    damageNumbers.push({ x, y, text, life: 30 });
}

window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

// --- UPDATE LOGIC ---
function update() {
    animTimer += 0.15;
    generateTerrain();

    if (comboTimer > 0) comboTimer--;
    else { combo = 0; document.getElementById('combo-ui').style.display = 'none'; }

    // Movement
    player.isSliding = keys['shift'] && player.grounded;
    if (keys['d']) { player.vx += ACCEL; player.dir = 1; }
    if (keys['a']) { player.vx -= ACCEL; player.dir = -1; }
    if (keys['w'] && player.grounded) { player.vy = -14; player.grounded = false; }

    player.vx *= FRICTION;
    player.vy += GRAVITY;

    // Horizontal Movement affects Camera
    cameraX += player.vx;

    // Floor Collision
    player.grounded = false;
    platforms.forEach(p => {
        let screenX = player.x + cameraX;
        if (screenX + player.w > p.x && screenX < p.x + p.w) {
            if (player.y + player.h <= p.y && player.y + player.h + player.vy >= p.y) {
                player.vy = 0; player.y = p.y - player.h; player.grounded = true;
            }
        }
    });

    player.y += player.vy;
    if (player.actionFrame > 0) player.actionFrame--;

    // Enemy AI
    enemies.forEach(en => {
        if (en.state === "ALIVE") {
            en.x += en.vx;
            if (Math.abs(en.x - (player.x + cameraX)) < 20 && player.isDodging === 0) {
               // Player hit logic would go here
            }
        }
    });

    damageNumbers.forEach((n, i) => { n.y -= 1; n.life--; if(n.life <= 0) damageNumbers.splice(i,1); });
}

// --- DRAWING ---
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw City (Parallax - moves slower than the ground)
    buildings.forEach(b => {
        let parallaxX = (b.x - (cameraX * 0.3)) % 2000;
        if (parallaxX < -200) parallaxX += 2000;
        ctx.fillStyle = b.color;
        ctx.fillRect(parallaxX, canvas.height - b.h, b.w, b.h);
        
        // Window details
        ctx.fillStyle = "rgba(255, 255, 100, 0.3)";
        ctx.fillRect(parallaxX + 20, canvas.height - b.h + 40, 10, 10);
    });

    // 2. Draw Ground
    ctx.fillStyle = "#111";
    platforms.forEach(p => {
        ctx.fillRect(p.x - cameraX, p.y, p.w, p.h);
        // Concrete edge
        ctx.fillStyle = "#222";
        ctx.fillRect(p.x - cameraX, p.y, p.w, 5);
    });

    // 3. Draw Humanoid Player
    drawHumanoid(player.x, player.y, player.dir, player.isSliding, false);

    // 4. Draw Enemies
    enemies.forEach(en => {
        if (en.state === "ALIVE") drawHumanoid(en.x - cameraX, en.y, -1, false, true);
    });

    // 5. Damage Numbers
    damageNumbers.forEach(n => {
        ctx.fillStyle = "#ff0000"; ctx.font = "bold 20px monospace";
        ctx.fillText(n.text, n.x, n.y);
    });

    document.getElementById('speed').innerText = Math.round(Math.abs(player.vx));
}

function drawHumanoid(x, y, dir, sliding, isEnemy) {
    let breathe = Math.sin(animTimer) * 2;
    let yOff = sliding ? 30 : 0;

    // Jeans
    ctx.fillStyle = isEnemy ? "#1a1a1a" : "#4a4a4e";
    ctx.fillRect(x + 5, y + 35 + yOff, 8, 25 - yOff);
    ctx.fillRect(x + 17, y + 35 + yOff, 8, 25 - yOff);
    // Hoodie
    ctx.fillStyle = isEnemy ? "#330000" : "#000";
    ctx.fillRect(x, y + 10 + yOff - breathe, 30, (sliding ? 20 : 35) + breathe);
    // Head
    ctx.beginPath();
    ctx.arc(x + 15, y + 8 + yOff - breathe, 12, 0, Math.PI * 2);
    ctx.fill();

    // Combat visual
    if (player.actionFrame > 0 && !isEnemy) {
        ctx.fillStyle = "#f3d2b3";
        let attX = dir === 1 ? x + 30 : x - 15;
        ctx.fillRect(attX, y + 20 + yOff, 20, 10);
    }
}

function loop() { if (gameState === "PLAYING") { update(); draw(); } requestAnimationFrame(loop); }
loop();
