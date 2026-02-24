let gameState = "MENU";
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 1000; canvas.height = 400;

const GRAVITY = 0.5;
const FRICTION = 0.88;
const ACCEL = 0.75;
let cameraX = 0, animTimer = 0, combo = 0, comboTimer = 0, currentChapter = 1;

const weapons = [
    { name: "FIST", icon: "👊", damage: 25 },
    { name: "KICK", icon: "🦵", damage: 35 },
    { name: "KATANA", icon: "⚔️", damage: 50 }
];
let currentWeaponIdx = 0;

const player = {
    x: 100, y: 100, vx: 0, vy: 0, w: 40, h: 70, health: 100,
    grounded: false, dir: 1, actionFrame: 0
};

let platforms = [];
let buildings = [];
let enemies = [];
let damageNumbers = [];

function switchWeapon(dir) {
    currentWeaponIdx = (currentWeaponIdx + dir + weapons.length) % weapons.length;
    document.getElementById('weapon-name').innerText = weapons[currentWeaponIdx].name;
    document.getElementById('weapon-icon').innerText = weapons[currentWeaponIdx].icon;
}

function startGame(ch) {
    currentChapter = ch;
    gameState = "PLAYING";
    player.health = 100;
    player.x = 100; player.y = 100; cameraX = 0;
    platforms = [{ x: 0, y: 340, w: 1500, h: 100 }];
    buildings = []; enemies = [];
    for(let i=0; i<15; i++) buildings.push({ x: i * 400, w: 200, h: 200 + Math.random()*200, hue: Math.random()*360 });
    document.getElementById('menu-screen').style.display = 'none';
    document.getElementById('ui').style.display = 'flex';
}

canvas.addEventListener('mousedown', () => {
    if (gameState !== "PLAYING" || player.actionFrame > 0) return;
    player.actionFrame = 15;
    
    enemies.forEach(en => {
        let dist = Math.abs((player.x + cameraX) - en.x);
        if (dist < 90 && en.state === "ALIVE") {
            let dmg = weapons[currentWeaponIdx].damage;
            en.health -= dmg;
            combo++; comboTimer = 100;
            damageNumbers.push({ x: en.x - cameraX, y: en.y, text: dmg, life: 30, color: '#00f2ff' });
            if (en.health <= 0) en.state = "DEAD";
            updateUI();
        }
    });
});

function updateUI() {
    document.getElementById('health-fill').style.width = player.health + "%";
    if (combo > 0) {
        let comboUI = document.getElementById('combo-ui');
        comboUI.style.display = 'block';
        comboUI.style.color = `hsl(${combo * 45}, 100%, 70%)`;
        document.getElementById('combo-count').innerText = combo;
    }
}

function update() {
    animTimer += 0.15;
    if (comboTimer > 0) comboTimer--; else { combo = 0; document.getElementById('combo-ui').style.display = 'none'; }

    // Death Check
    if (player.y > canvas.height + 50 || player.health <= 0) {
        gameState = "MENU";
        document.getElementById('menu-screen').style.display = 'flex';
        return;
    }

    // Controls
    const keys = window.keys || {};
    if (keys['d']) { player.vx += ACCEL; player.dir = 1; }
    if (keys['a']) { player.vx -= ACCEL; player.dir = -1; }
    if (keys['w'] && player.grounded) { player.vy = -13; player.grounded = false; }

    player.vx *= FRICTION;
    player.vy += GRAVITY;
    cameraX += player.vx;

    // Collision
    player.grounded = false;
    platforms.forEach(p => {
        let px = player.x + cameraX;
        if (px + player.w > p.x && px < p.x + p.w && player.y + player.h <= p.y && player.y + player.h + player.vy >= p.y) {
            player.vy = 0; player.y = p.y - player.h; player.grounded = true;
        }
    });
    player.y += player.vy;

    // Infinite World
    let lastP = platforms[platforms.length-1];
    if (lastP.x < cameraX + 1200) {
        let gap = 100 + Math.random() * 150;
        platforms.push({ x: lastP.x + lastP.w + gap, y: 220 + Math.random() * 100, w: 500, h: 200 });
        enemies.push({ x: lastP.x + lastP.w + gap + 200, y: 100, w: 40, h: 70, health: 100, state: "ALIVE", hue: Math.random()*360 });
    }
    
    player.actionFrame = Math.max(0, player.actionFrame - 1);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Anime City Sky
    let grad = ctx.createLinearGradient(0,0,0,canvas.height);
    grad.addColorStop(0, "#050510"); grad.addColorStop(1, "#1a0a2e");
    ctx.fillStyle = grad; ctx.fillRect(0,0,canvas.width, canvas.height);

    // Parallax Neon Buildings
    buildings.forEach(b => {
        let x = (b.x - cameraX * 0.3) % 4000;
        ctx.fillStyle = `hsla(${b.hue}, 70%, 20%, 0.8)`;
        ctx.fillRect(x, canvas.height - b.h, b.w, b.h);
        ctx.strokeStyle = `hsla(${b.hue}, 100%, 50%, 0.5)`;
        ctx.strokeRect(x, canvas.height - b.h, b.w, b.h);
    });

    // Platforms
    ctx.fillStyle = "#111";
    platforms.forEach(p => {
        ctx.fillRect(p.x - cameraX, p.y, p.w, p.h);
        ctx.strokeStyle = "#00f2ff"; ctx.lineWidth = 2;
        ctx.strokeRect(p.x - cameraX, p.y, p.w, 2);
    });

    // Draw Characters
    drawAnimeHumanoid(player.x, player.y, player.dir, player.actionFrame, false);
    enemies.forEach(en => {
        if (en.state === "ALIVE") drawAnimeHumanoid(en.x - cameraX, en.y, -1, 0, true, en.hue);
    });

    // Floating Dmg
    damageNumbers.forEach((d, i) => {
        ctx.fillStyle = d.color; ctx.font = "bold 20px Arial"; ctx.fillText(d.text, d.x, d.y);
        d.y -= 1; d.life--; if(d.life <= 0) damageNumbers.splice(i,1);
    });
}

function drawAnimeHumanoid(x, y, dir, action, isEnemy, hue = 0) {
    ctx.save();
    if (isEnemy) ctx.filter = `hue-rotate(${hue}deg)`;
    
    let legMove = Math.sin(animTimer*2) * 15;
    
    // Exact Image Colors & Shapes
    // Left Leg
    ctx.fillStyle = "#ffd54f"; // Yellow
    ctx.fillRect(x + (dir > 0 ? 5 : 25), y + 45 + legMove, 10, 25);
    // Right Leg
    ctx.fillStyle = "#e53935"; // Red
    ctx.fillRect(x + (dir > 0 ? 25 : 5), y + 45 - legMove, 10, 25);
    // Torso
    ctx.fillStyle = "#fb8c00"; // Orange
    ctx.fillRect(x + 5, y + 20, 30, 30);
    // Arms
    ctx.fillStyle = "#8bc34a"; // Green
    ctx.fillRect(x - 5 + (action*dir), y + 25, 12, 12);
    ctx.fillStyle = "#ab47bc"; // Purple
    ctx.fillRect(x + 33 - (action*dir), y + 25, 12, 12);
    // Cyan Head
    ctx.fillStyle = "#4dd0e1";
    ctx.beginPath(); ctx.arc(x + 20, y + 5, 18, 0, Math.PI*2); ctx.fill();
    
    ctx.restore();
}

window.addEventListener('keydown', e => { window.keys = window.keys || {}; window.keys[e.key.toLowerCase()] = true; });
window.addEventListener('keyup', e => { window.keys[e.key.toLowerCase()] = false; });

function gameLoop() {
    if (gameState === "PLAYING") { update(); draw(); }
    requestAnimationFrame(gameLoop);
}
gameLoop();
