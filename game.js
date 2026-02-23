let gameState = "MENU";
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 1000; canvas.height = 400;

// Physics & Animation
const GRAVITY = 0.6;
const FRICTION = 0.85;
const ACCEL = 0.8;
let cameraX = 0;
let animTimer = 0;
let combo = 0;
let comboTimer = 0;
let damageNumbers = [];
let currentChapter = 1;

const keys = {};
const player = {
    x: 100, y: 100, vx: 0, vy: 0, w: 30, h: 65,
    grounded: false, dir: 1, health: 3,
    isSliding: false, actionFrame: 0, actionType: null
};

// Procedural Terrain & World Design
let platforms = [{ x: 0, y: 350, w: 1200, h: 100 }];
let buildings = [];

function generateWorldStyle(ch) {
    buildings = [];
    platforms = [{ x: 0, y: 350, w: 1200, h: 100 }];
    for(let i=0; i<30; i++) {
        let color;
        if (ch === 1) color = `rgba(100, 100, 150, ${0.3 + Math.random() * 0.2})`; // Day
        else if (ch === 2) color = `rgba(200, 100, 50, ${0.4 + Math.random() * 0.3})`; // Sunset
        else color = `rgba(20, 20, 40, ${0.6 + Math.random() * 0.4})`; // Night
        
        buildings.push({ x: i * 350, w: 120 + Math.random() * 200, h: 150 + Math.random() * 250, color: color });
    }
}

function startGame(ch) {
    currentChapter = ch;
    generateWorldStyle(ch);
    document.getElementById('menu-screen').style.display = 'none';
    document.getElementById('ui').style.display = 'flex';
    document.getElementById('current-chapter').innerText = "ZONE: " + ch;
    gameState = "PLAYING";
}

// Combat Logic
canvas.addEventListener('mousedown', () => {
    if (gameState !== "PLAYING" || player.actionFrame > 0) return;
    player.actionType = Math.random() > 0.5 ? "PUNCH" : "KICK";
    player.actionFrame = 15;
    // Check hits... (Logic remains same)
});

window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

function update() {
    animTimer += 0.18; // Speed of walk animation
    if (comboTimer > 0) comboTimer--; else { combo = 0; document.getElementById('combo-ui').style.display = 'none'; }

    // Procedural Generation - Different for Chapters
    let lastPlat = platforms[platforms.length - 1];
    if (lastPlat.x < cameraX + canvas.width + 500) {
        let gap = currentChapter === 3 ? (Math.random() * 150 + 100) : (Math.random() * 100 + 50);
        let yPos = currentChapter === 1 ? 350 : (200 + Math.random() * 150);
        platforms.push({ x: lastPlat.x + lastPlat.w + gap, y: yPos, w: 300 + Math.random() * 400, h: 400 });
    }

    player.isSliding = keys['shift'] && player.grounded;
    if (keys['d']) { player.vx += ACCEL; player.dir = 1; }
    if (keys['a']) { player.vx -= ACCEL; player.dir = -1; }
    if (keys['w'] && player.grounded) { player.vy = -14; player.grounded = false; }

    player.vx *= FRICTION;
    player.vy += GRAVITY;
    cameraX += player.vx;

    // Collision
    player.grounded = false;
    platforms.forEach(p => {
        let sp = player.x + cameraX;
        if (sp + player.w > p.x && sp < p.x + p.w && player.y + player.h <= p.y && player.y + player.h + player.vy >= p.y) {
            player.vy = 0; player.y = p.y - player.h; player.grounded = true;
        }
    });
    player.y += player.vy;
    if (player.actionFrame > 0) player.actionFrame--;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Chapter Backgrounds
    if (currentChapter === 1) ctx.fillStyle = "#aaccff";
    else if (currentChapter === 2) ctx.fillStyle = "#ffaa88";
    else ctx.fillStyle = "#050010";
    ctx.fillRect(0,0, canvas.width, canvas.height);

    // Parallax City
    buildings.forEach(b => {
        let px = (b.x - (cameraX * 0.25)) % 4000;
        ctx.fillStyle = b.color;
        ctx.fillRect(px, canvas.height - b.h, b.w, b.h);
    });

    // Ground
    ctx.fillStyle = currentChapter === 3 ? "#000" : "#222";
    platforms.forEach(p => ctx.fillRect(p.x - cameraX, p.y, p.w, p.h));

    // Player Humanoid (Updated to Match Image)
    drawCharacter(player.x, player.y, player.dir, player.isSliding, Math.abs(player.vx) > 0.5);

    document.getElementById('speed').innerText = Math.round(Math.abs(player.vx));
}

function drawCharacter(x, y, dir, sliding, isMoving) {
    let legCycle = isMoving ? Math.sin(animTimer) * 12 : 0;
    let breathe = !isMoving ? Math.sin(animTimer * 0.5) * 2 : 0;
    let yOff = sliding ? 30 : 0;

    // Legs (Blue Jeans)
    ctx.fillStyle = "#5a88a8"; 
    ctx.fillRect(x + 5 + (dir * legCycle), y + 35 + yOff, 8, 25 - yOff); 
    ctx.fillRect(x + 17 - (dir * legCycle), y + 35 + yOff, 8, 25 - yOff);

    // Torso (Black Hoodie)
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(x, y + 10 + yOff - breathe, 30, (sliding ? 20 : 35) + breathe);
    
    // Drawstrings (White)
    ctx.fillStyle = "white";
    ctx.fillRect(x + 12, y + 20 + yOff - breathe, 2, 8);
    ctx.fillRect(x + 16, y + 20 + yOff - breathe, 2, 8);

    // Head (Hood + Blue Face)
    ctx.fillStyle = "#1a1a1a"; // Outer Hood
    ctx.beginPath(); ctx.arc(x + 15, y + 8 + yOff - breathe, 14, 0, Math.PI * 2); ctx.fill();
    
    ctx.fillStyle = "#66ccff"; // Blue Face from Image
    ctx.fillRect(x + 6, y - 2 + yOff - breathe, 18, 16);
    
    // Eyes
    ctx.fillStyle = "black";
    ctx.fillRect(x + 9, y + 3 + yOff - breathe, 4, 2);
    ctx.fillRect(x + 17, y + 3 + yOff - breathe, 4, 2);
    ctx.fillRect(x + 11, y + 9 + yOff - breathe, 8, 2); // Mouth
}

function gameLoop() { 
    if (gameState === "PLAYING") { update(); draw(); } 
    requestAnimationFrame(gameLoop); 
}
gameLoop();
