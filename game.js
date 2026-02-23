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
    isSliding: false, actionFrame: 0, actionType: null,
    hasWeapon: true // Restored weapon status
};

// Procedural Terrain & World Design
let platforms = [{ x: 0, y: 350, w: 1200, h: 100 }];
let buildings = [];
let enemies = [];

function generateWorldStyle(ch) {
    buildings = [];
    enemies = [];
    platforms = [{ x: 0, y: 350, w: 1200, h: 100 }];
    
    // Generate initial enemies
    for(let i=1; i<5; i++) {
        enemies.push({ x: i * 800, y: 200, w: 30, h: 60, health: 100, vx: -1, state: "ALIVE" });
    }

    for(let i=0; i<30; i++) {
        let color = ch === 1 ? `rgba(100, 150, 200, 0.4)` : ch === 2 ? `rgba(255, 150, 50, 0.4)` : `rgba(30, 30, 60, 0.6)`;
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

// Combat Logic - Restored Punch/Kicks
canvas.addEventListener('mousedown', () => {
    if (gameState !== "PLAYING" || player.actionFrame > 0) return;
    player.actionType = Math.random() > 0.5 ? "PUNCH" : "KICK";
    player.actionFrame = 15;

    enemies.forEach(en => {
        let screenEnX = en.x - cameraX;
        let dist = Math.abs(player.x - screenEnX);
        if (dist < 80 && en.state === "ALIVE") {
            en.health -= 50;
            combo++;
            comboTimer = 120;
            damageNumbers.push({ x: screenEnX, y: en.y - 20, text: "-50", life: 30 });
            if (en.health <= 0) en.state = "DEAD";
            document.getElementById('combo-ui').style.display = 'block';
            document.getElementById('combo-count').innerText = combo;
        }
    });
});

window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

function update() {
    animTimer += 0.18;
    if (comboTimer > 0) comboTimer--; else { combo = 0; document.getElementById('combo-ui').style.display = 'none'; }

    // Infinite World Generation
    let lastPlat = platforms[platforms.length - 1];
    if (lastPlat.x < cameraX + canvas.width + 500) {
        let gap = Math.random() * 100 + 50;
        platforms.push({ x: lastPlat.x + lastPlat.w + gap, y: 200 + Math.random() * 150, w: 400, h: 400 });
        // Spawn more enemies on new platforms
        enemies.push({ x: lastPlat.x + lastPlat.w + gap + 100, y: 0, w: 30, h: 60, health: 100, vx: -1, state: "ALIVE" });
    }

    // Movement
    player.isSliding = keys['shift'] && player.grounded;
    if (keys['d']) { player.vx += ACCEL; player.dir = 1; }
    if (keys['a']) { player.vx -= ACCEL; player.dir = -1; }
    if (keys['w'] && player.grounded) { player.vy = -14; player.grounded = false; }

    player.vx *= FRICTION;
    player.vy += GRAVITY;
    cameraX += player.vx;

    // Platform Collision
    player.grounded = false;
    platforms.forEach(p => {
        let sp = player.x + cameraX;
        if (sp + player.w > p.x && sp < p.x + p.w && player.y + player.h <= p.y && player.y + player.h + player.vy >= p.y) {
            player.vy = 0; player.y = p.y - player.h; player.grounded = true;
        }
    });

    player.y += player.vy;
    if (player.actionFrame > 0) player.actionFrame--;

    // Enemy AI - Simple Patrol
    enemies.forEach(en => {
        if (en.state === "ALIVE") {
            en.x += en.vx;
            // Basic floor snapping for enemies
            platforms.forEach(p => {
                if (en.x > p.x && en.x < p.x + p.w) en.y = p.y - en.h;
            });
        }
    });

    damageNumbers.forEach((n, i) => { n.y -= 1; n.life--; if(n.life <= 0) damageNumbers.splice(i, 1); });
}

function drawCharacter(x, y, dir, sliding, isMoving, isEnemy) {
    let legCycle = isMoving ? Math.sin(animTimer) * 12 : 0;
    let breathe = !isMoving ? Math.sin(animTimer * 0.5) * 2 : 0;
    let yOff = sliding ? 30 : 0;

    // Legs (Matching Image Colors)
    ctx.fillStyle = isEnemy ? "#7c3f3f" : "#5a88a8"; 
    ctx.fillRect(x + 5 + (dir * legCycle), y + 35 + yOff, 8, 25 - yOff); 
    ctx.fillRect(x + 17 - (dir * legCycle), y + 35 + yOff, 8, 25 - yOff);

    // Torso (Black Hoodie)
    ctx.fillStyle = isEnemy ? "#331111" : "#1a1a1a";
    ctx.fillRect(x, y + 10 + yOff - breathe, 30, (sliding ? 20 : 35) + breathe);
    
    // Drawstrings
    if (!isEnemy) {
        ctx.fillStyle = "white";
        ctx.fillRect(x + 12, y + 20 + yOff - breathe, 2, 8);
        ctx.fillRect(x + 16, y + 20 + yOff - breathe, 2, 8);
    }

    // Cyan Face (Matching Image Exactly)
    ctx.fillStyle = isEnemy ? "#ff6666" : "#66ccff"; 
    ctx.fillRect(x + 6, y - 2 + yOff - breathe, 18, 16);
    
    // Facial Features
    ctx.fillStyle = "black";
    ctx.fillRect(x + 9, y + 3 + yOff - breathe, 4, 2); // Left Eye
    ctx.fillRect(x + 17, y + 3 + yOff - breathe, 4, 2); // Right Eye
    ctx.fillRect(x + 11, y + 9 + yOff - breathe, 8, 2); // Mouth

    // Fight/Weapon Visual
    if (player.actionFrame > 0 && !isEnemy) { 
        ctx.fillStyle = "#f3d2b3"; 
        let attackX = dir === 1 ? x + 30 : x - 20;
        if (player.actionType === "PUNCH") ctx.fillRect(attackX, y + 20 + yOff, 20, 10);
        else ctx.fillRect(attackX, y + 35 + yOff, 25, 12); // Kick
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Background
    let sky = currentChapter === 1 ? "#aaccff" : currentChapter === 2 ? "#ffaa88" : "#050010";
    ctx.fillStyle = sky; ctx.fillRect(0,0, canvas.width, canvas.height);

    // Parallax City
    buildings.forEach(b => {
        let px = (b.x - (cameraX * 0.25)) % 4000;
        ctx.fillStyle = b.color;
        ctx.fillRect(px, canvas.height - b.h, b.w, b.h);
    });

    // Platforms
    ctx.fillStyle = "#222";
    platforms.forEach(p => ctx.fillRect(p.x - cameraX, p.y, p.w, p.h));

    // Player
    drawCharacter(player.x, player.y, player.dir, player.isSliding, Math.abs(player.vx) > 0.5, false);

    // Enemies
    enemies.forEach(en => { if (en.state === "ALIVE") drawCharacter(en.x - cameraX, en.y, -1, false, true, true); });

    // Floating Text
    damageNumbers.forEach(n => { ctx.fillStyle = "#ff0000"; ctx.font = "bold 20px monospace"; ctx.fillText(n.text, n.x, n.y); });

    document.getElementById('speed').innerText = Math.round(Math.abs(player.vx));
    requestAnimationFrame(gameLoop);
}

function gameLoop() { if (gameState === "PLAYING") { update(); draw(); } else { requestAnimationFrame(gameLoop); } }
gameLoop();
