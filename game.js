let gameState = "MENU";
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 1000; canvas.height = 400;

// Physics Constants
const GRAVITY = 0.6;
const FRICTION = 0.85;
const ACCEL = 0.8;

// World & Camera State
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

// Procedural Terrain
let platforms = [{ x: 0, y: 350, w: 1200, h: 100 }];
let buildings = [];
for(let i=0; i<30; i++) {
    buildings.push({ 
        x: i * 300, 
        w: 100 + Math.random() * 150, 
        h: 200 + Math.random() * 200, 
        color: `rgba(20, 20, 40, ${0.5 + Math.random() * 0.5})` 
    });
}

let enemies = [{ x: 800, y: 290, w: 30, h: 60, health: 100, vx: -2, state: "ALIVE" }];

function startGame(ch) {
    currentChapter = ch;
    document.getElementById('menu-screen').style.display = 'none';
    document.getElementById('ui').style.display = 'flex';
    gameState = "PLAYING";
}

// Fight Input
canvas.addEventListener('mousedown', () => {
    if (gameState !== "PLAYING" || player.actionFrame > 0) return;
    player.actionType = Math.random() > 0.5 ? "PUNCH" : "KICK";
    player.actionFrame = 15;

    enemies.forEach(en => {
        let dist = Math.abs((player.x + cameraX) - en.x);
        if (dist < 70 && en.state === "ALIVE") {
            en.health -= 50;
            combo++;
            comboTimer = 120;
            damageNumbers.push({ x: en.x - cameraX, y: en.y, text: "-50", life: 30 });
            if (en.health <= 0) en.state = "DEAD";
            document.getElementById('combo-ui').style.display = 'block';
            document.getElementById('combo-count').innerText = combo;
        }
    });
});

window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

function update() {
    animTimer += 0.15;
    if (comboTimer > 0) comboTimer--; else { combo = 0; document.getElementById('combo-ui').style.display = 'none'; }

    // Procedural Terrain Generation
    let lastPlat = platforms[platforms.length - 1];
    if (lastPlat.x < cameraX + canvas.width + 500) {
        platforms.push({ 
            x: lastPlat.x + lastPlat.w + (Math.random() * 100 + 50), 
            y: 200 + Math.random() * 150, 
            w: 200 + Math.random() * 400, 
            h: 400 
        });
    }

    // Movement
    player.isSliding = keys['shift'] && player.grounded;
    if (keys['d']) { player.vx += ACCEL; player.dir = 1; }
    if (keys['a']) { player.vx -= ACCEL; player.dir = -1; }
    if (keys['w'] && player.grounded) { player.vy = -14; player.grounded = false; }

    player.vx *= FRICTION;
    player.vy += GRAVITY;
    cameraX += player.vx;

    // Ground Collision
    player.grounded = false;
    platforms.forEach(p => {
        let screenPos = player.x + cameraX;
        if (screenPos + player.w > p.x && screenPos < p.x + p.w) {
            if (player.y + player.h <= p.y && player.y + player.h + player.vy >= p.y) {
                player.vy = 0; player.y = p.y - player.h; player.grounded = true;
            }
        }
    });

    player.y += player.vy;
    if (player.actionFrame > 0) player.actionFrame--;
    damageNumbers.forEach((n, i) => { n.y -= 1; n.life--; if(n.life <= 0) damageNumbers.splice(i, 1); });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Parallax City
    buildings.forEach(b => {
        let px = (b.x - (cameraX * 0.3)) % 3000;
        ctx.fillStyle = b.color;
        ctx.fillRect(px, canvas.height - b.h, b.w, b.h);
    });

    // Ground
    ctx.fillStyle = "#111";
    platforms.forEach(p => ctx.fillRect(p.x - cameraX, p.y, p.w, p.h));

    // Player Humanoid
    drawCharacter(player.x, player.y, player.dir, player.isSliding, false);

    // Enemies
    enemies.forEach(en => { if (en.state === "ALIVE") drawCharacter(en.x - cameraX, en.y, -1, false, true); });

    // Floating Text
    damageNumbers.forEach(n => { ctx.fillStyle = "#ff0000"; ctx.font = "bold 20px monospace"; ctx.fillText(n.text, n.x, n.y); });

    document.getElementById('speed').innerText = Math.round(Math.abs(player.vx));
}

function drawCharacter(x, y, dir, sliding, isEnemy) {
    let breathe = Math.sin(animTimer) * 2;
    let yOff = sliding ? 30 : 0;
    ctx.fillStyle = isEnemy ? "#1a1a1a" : "#4a4a4e"; // Jeans
    ctx.fillRect(x + 5, y + 35 + yOff, 8, 25 - yOff); 
    ctx.fillRect(x + 17, y + 35 + yOff, 8, 25 - yOff);
    ctx.fillStyle = isEnemy ? "#220000" : "#000000"; // Hoodie
    ctx.fillRect(x, y + 10 + yOff - breathe, 30, (sliding ? 20 : 35) + breathe);
    ctx.beginPath(); ctx.arc(x + 15, y + 8 + yOff - breathe, 12, 0, Math.PI * 2); ctx.fill();
    
    // Action Visual
    if (player.actionFrame > 0 && !isEnemy) { 
        ctx.fillStyle = "#f3d2b3"; 
        ctx.fillRect(dir === 1 ? x + 30 : x - 15, y + 20 + yOff, 20, 10); 
    }
}

function gameLoop() { 
    if (gameState === "PLAYING") { update(); draw(); } 
    requestAnimationFrame(gameLoop); 
}
gameLoop(); // Corrected function call
