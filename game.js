let gameState = "MENU", isPaused = false;
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 1000; canvas.height = 400;

// Physics & Performance
const GRAVITY = 0.5, FRICTION = 0.88, ACCEL = 0.75;
let cameraX = 0, animTimer = 0, combo = 0, comboTimer = 0;

const weapons = [
    { name: "FIST", icon: "👊", damage: 25, range: 65 },
    { name: "KATANA", icon: "⚔️", damage: 60, range: 120 }
];
let currentWeaponIdx = 0;

const player = { x: 100, y: 100, vx: 0, vy: 0, w: 30, h: 75, health: 100, grounded: false, dir: 1, actionFrame: 0 };
let platforms = [], buildings = [], enemies = [], particles = [];

function togglePause() {
    isPaused = !isPaused;
    document.getElementById('pause-screen').style.display = isPaused ? 'flex' : 'none';
}

function switchWeapon(dir) {
    currentWeaponIdx = (currentWeaponIdx + dir + weapons.length) % weapons.length;
    document.getElementById('weapon-name').innerText = weapons[currentWeaponIdx].name;
    document.getElementById('weapon-icon').innerText = weapons[currentWeaponIdx].icon;
}

function startGame(ch) {
    gameState = "PLAYING";
    player.health = 100; player.x = 100; player.y = 100; cameraX = 0;
    platforms = [{ x: 0, y: 350, w: 2000, h: 100 }];
    enemies = [];
    buildings = Array.from({length: 20}, (_, i) => ({ x: i * 400, w: 200, h: 200 + Math.random()*200, hue: Math.random()*360 }));
    document.getElementById('menu-screen').style.display = 'none';
    document.getElementById('ui').style.display = 'flex';
}

canvas.addEventListener('mousedown', () => {
    if (gameState !== "PLAYING" || isPaused || player.actionFrame > 0) return;
    player.actionFrame = 15;
    enemies.forEach(en => {
        let dist = Math.abs((player.x + cameraX) - en.x);
        if (dist < weapons[currentWeaponIdx].range && en.state === "ALIVE") {
            en.health -= weapons[currentWeaponIdx].damage;
            spawnGore(en.x - cameraX + 15, en.y + 30);
            combo++; comboTimer = 100;
            if (en.health <= 0) en.state = "DEAD";
        }
    });
});

function spawnGore(x, y) {
    for(let i=0; i<8; i++) {
        particles.push({ x, y, vx: (Math.random()-0.5)*8, vy: (Math.random()-0.5)*8, s: Math.random()*4+2, l: 1 });
    }
}

function drawHumanoid(x, y, dir, action, isEnemy, hue = 0) {
    ctx.save();
    if (isEnemy) ctx.filter = `hue-rotate(${hue}deg)`;
    let leg = Math.sin(animTimer*2) * 12;

    // Athlete Legs (Image Colors: Yellow & Red)
    ctx.fillStyle = "#ffd54f"; ctx.fillRect(x + (dir > 0 ? 5 : 20), y + 45 + leg, 10, 30);
    ctx.fillStyle = "#e53935"; ctx.fillRect(x + (dir > 0 ? 20 : 5), y + 45 - leg, 10, 30);

    // V-Taper Torso (Image Color: Orange/Black)
    ctx.fillStyle = "#111"; // Hoodie Base
    ctx.beginPath(); ctx.moveTo(x, y+20); ctx.lineTo(x+30, y+20); ctx.lineTo(x+22, y+45); ctx.lineTo(x+8, y+45); ctx.fill();
    ctx.fillStyle = "#fb8c00"; // Chest Highlight
    ctx.fillRect(x+10, y+25, 10, 15);

    // Cyan Face (Exactly from image)
    ctx.fillStyle = "#4dd0e1";
    ctx.beginPath(); ctx.arc(x + 15, y + 5, 16, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "black"; // Anime Eyes
    ctx.fillRect(x+10, y+2, 3, 2); ctx.fillRect(x+18, y+2, 3, 2);

    // Weapon Slash
    if (action > 0 && weapons[currentWeaponIdx].name === "KATANA") {
        ctx.strokeStyle = "#00f2ff"; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(x+15, y+25); ctx.lineTo(x+15+dir*80, y+25); ctx.stroke();
    }
    ctx.restore();
}

function update() {
    if(isPaused) return;
    animTimer += 0.15;
    if (comboTimer > 0) comboTimer--; else combo = 0;

    const keys = window.keys || {};
    if (keys['d']) { player.vx += ACCEL; player.dir = 1; }
    if (keys['a']) { player.vx -= ACCEL; player.dir = -1; }
    if (keys['w'] && player.grounded) { player.vy = -14; player.grounded = false; }

    player.vx *= FRICTION; player.vy += GRAVITY;
    cameraX += player.vx;

    // Collision & Death
    player.grounded = false;
    platforms.forEach(p => {
        let px = player.x + cameraX;
        if (px + player.w > p.x && px < p.x + p.w && player.y + player.h <= p.y && player.y + player.h + player.vy >= p.y) {
            player.vy = 0; player.y = p.y - player.h; player.grounded = true;
        }
    });
    if (player.y > canvas.height + 100) { gameState = "MENU"; document.getElementById('menu-screen').style.display = 'flex'; }

    // Spawn Enemies
    if (Math.random() < 0.01 && platforms.length > 0) {
        enemies.push({ x: cameraX + 1100, y: 0, w: 30, h: 75, health: 100, state: "ALIVE", vy: 0, hue: Math.random()*360 });
    }

    // Enemy Physics
    enemies.forEach(en => {
        en.vy += GRAVITY;
        platforms.forEach(p => { if (en.x > p.x && en.x < p.x+p.w && en.y+en.h <= p.y && en.y+en.h+en.vy >= p.y) { en.vy = 0; en.y = p.y-en.h; } });
        en.y += en.vy;
    });

    particles.forEach((p, i) => { p.x += p.vx; p.y += p.vy; p.l -= 0.02; if(p.l <= 0) particles.splice(i, 1); });
    player.actionFrame = Math.max(0, player.actionFrame - 1);
    player.y += player.vy;
    
    document.getElementById('health-fill').style.width = player.health + "%";
    document.getElementById('combo-count').innerText = combo;
    document.getElementById('combo-ui').style.display = combo > 0 ? "block" : "none";
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Background restored
    let grad = ctx.createLinearGradient(0,0,0,400); grad.addColorStop(0, "#050515"); grad.addColorStop(1, "#1a0a2e");
    ctx.fillStyle = grad; ctx.fillRect(0,0,1000,400);

    buildings.forEach(b => {
        let x = (b.x - cameraX * 0.2) % 4000;
        ctx.fillStyle = `hsla(${b.hue}, 50%, 15%, 0.8)`; ctx.fillRect(x, 400-b.h, b.w, b.h);
        ctx.strokeStyle = `hsla(${b.hue}, 100%, 50%, 0.3)`; ctx.strokeRect(x, 400-b.h, b.w, b.h);
    });

    platforms.forEach(p => { ctx.fillStyle = "#111"; ctx.fillRect(p.x - cameraX, p.y, p.w, p.h); });
    particles.forEach(p => { ctx.fillStyle = `rgba(255,0,0,${p.l})`; ctx.fillRect(p.x - cameraX, p.y, p.s, p.s); });

    drawHumanoid(player.x, player.y, player.dir, player.actionFrame, false);
    enemies.forEach(en => { if(en.state === "ALIVE") drawHumanoid(en.x - cameraX, en.y, -1, 0, true, en.hue); });
}

function gameLoop() { update(); draw(); requestAnimationFrame(gameLoop); }
window.addEventListener('keydown', e => { if(e.key === "Escape") togglePause(); window.keys = window.keys || {}; window.keys[e.key.toLowerCase()] = true; });
window.addEventListener('keyup', e => { window.keys[e.key.toLowerCase()] = false; });
gameLoop();
