const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 1000; canvas.height = 450;

// Engine Constants
let gameState = "MENU", isPaused = false;
const GRAVITY = 0.45, FRICTION = 0.88, ACCEL = 0.7;
let cameraX = 0, animTimer = 0, combo = 0, comboTimer = 0;

// Assets Definition
const weapons = [
    { name: "FIST", icon: "👊", damage: 20, range: 60, color: "#fff" },
    { name: "KATANA", icon: "⚔️", damage: 45, range: 110, color: "#00f2ff" }
];
let currentWep = 0;

// Entity Factory
const player = {
    x: 100, y: 100, vx: 0, vy: 0, w: 35, h: 80, health: 100,
    dir: 1, action: 0, grounded: false
};
let enemies = [], platforms = [], particles = [], debris = [];

function togglePause() {
    isPaused = !isPaused;
    document.getElementById('pause-menu').style.display = isPaused ? 'flex' : 'none';
}

function switchWeapon(dir) {
    currentWep = (currentWep + dir + weapons.length) % weapons.length;
    document.getElementById('weapon-icon').innerText = weapons[currentWep].icon;
    document.getElementById('weapon-name').innerText = weapons[currentWep].name;
}

function startGame(ch) {
    gameState = "PLAYING";
    player.health = 100; player.x = 100; cameraX = 0;
    platforms = [{ x: 0, y: 380, w: 2500, h: 100 }];
    enemies = [];
    document.getElementById('menu-screen').style.display = 'none';
    document.getElementById('ui').style.display = 'flex';
}

// Particle System
function spawnBlood(x, y, color = "#ff0044") {
    for(let i=0; i<10; i++) {
        particles.push({
            x, y, vx: (Math.random()-0.5)*12, vy: (Math.random()-0.5)*12,
            size: Math.random()*4+1, life: 1, color
        });
    }
}

// Humanoid Render (Reference Image Accurate + Athletic)
function drawHuman(x, y, dir, action, isEnemy, hue = 0) {
    ctx.save();
    if(isEnemy) ctx.filter = `hue-rotate(${hue}deg) brightness(0.6)`;
    
    let legCycle = Math.sin(animTimer * 1.8) * 14;
    
    // Detailed Athletic Legs
    ctx.fillStyle = "#ffd54f"; // Yellow Leg
    ctx.beginPath(); ctx.roundRect(x + (dir>0?5:20), y + 50 + legCycle, 10, 30, 5); ctx.fill();
    ctx.fillStyle = "#e53935"; // Red Leg
    ctx.beginPath(); ctx.roundRect(x + (dir>0?20:5), y + 50 - legCycle, 10, 30, 5); ctx.fill();

    // V-Taper Torso
    ctx.fillStyle = "#111"; 
    ctx.beginPath();
    ctx.moveTo(x, y+20); ctx.lineTo(x+30, y+20); ctx.lineTo(x+22, y+50); ctx.lineTo(x+8, y+50); ctx.fill();
    
    // Cyan Face (Smooth)
    ctx.fillStyle = "#4dd0e1";
    ctx.beginPath(); ctx.arc(x + 15, y + 5, 18, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#000"; // Eyes
    ctx.fillRect(x+10, y+2, 3, 2); ctx.fillRect(x+18, y+2, 3, 2);

    // Combat Visuals
    if (action > 0) {
        ctx.strokeStyle = weapons[currentWep].color;
        ctx.lineWidth = 6;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x+15, y+30);
        ctx.lineTo(x+15 + (dir * action * 5), y + 30 + (Math.sin(action)*15));
        ctx.stroke();
    }
    ctx.restore();
}

function update() {
    if(isPaused) return;
    animTimer += 0.12;
    if(comboTimer > 0) comboTimer--; else combo = 0;

    // Movement Physics
    const keys = window.keys || {};
    if(keys['d']) { player.vx += ACCEL; player.dir = 1; }
    if(keys['a']) { player.vx -= ACCEL; player.dir = -1; }
    if(keys['w'] && player.grounded) { player.vy = -14; player.grounded = false; }

    player.vx *= FRICTION; player.vy += GRAVITY;
    cameraX += player.vx;
    player.y += player.vy;

    // Pro Collision
    player.grounded = false;
    platforms.forEach(p => {
        let px = player.x + cameraX;
        if(px + player.w > p.x && px < p.x + p.w && player.y + player.h <= p.y && player.y + player.h + player.vy >= p.y) {
            player.vy = 0; player.y = p.y - player.h; player.grounded = true;
        }
    });

    // Enemy AI & Combat Logic
    if(Math.random() < 0.01) {
        enemies.push({ x: cameraX + 1100, y: 0, health: 100, state: "ALIVE", vy: 0, hue: Math.random()*360 });
    }

    enemies.forEach(en => {
        en.vy += GRAVITY;
        platforms.forEach(p => { if(en.x > p.x && en.x < p.x + p.w && en.y + en.h <= p.y && en.y + en.h + en.vy >= p.y) en.vy = 0; });
        en.y += en.vy;
        
        // Simple Chase
        let dist = (player.x + cameraX) - en.x;
        if(Math.abs(dist) < 400 && en.state === "ALIVE") en.x += dist > 0 ? 2 : -2;
    });

    // Particle/Action Cleanup
    particles.forEach((p, i) => { 
        p.x += p.vx; p.y += p.vy; p.life -= 0.02; 
        if(p.life <= 0) particles.splice(i, 1); 
    });
    player.action = Math.max(0, player.action - 1);

    // Dynamic UI Update
    document.getElementById('health-bar').style.width = player.health + "%";
    document.getElementById('combo-module').style.display = combo > 0 ? "block" : "none";
    document.getElementById('combo-count').innerText = combo;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Cinematic Parallax Background
    let bg = ctx.createLinearGradient(0,0,0,canvas.height);
    bg.addColorStop(0, "#050510"); bg.addColorStop(1, "#100a20");
    ctx.fillStyle = bg; ctx.fillRect(0,0,canvas.width, canvas.height);

    // Glowing Platforms
    platforms.forEach(p => {
        ctx.fillStyle = "#0a0a0a"; ctx.fillRect(p.x - cameraX, p.y, p.w, p.h);
        ctx.strokeStyle = "#00f2ff22"; ctx.lineWidth = 1; ctx.strokeRect(p.x - cameraX, p.y, p.w, 3);
    });

    // Particles
    particles.forEach(p => {
        ctx.globalAlpha = p.life; ctx.fillStyle = p.color;
        ctx.fillRect(p.x - cameraX, p.y, p.size, p.size);
    });
    ctx.globalAlpha = 1;

    // Entities
    drawHuman(player.x, player.y, player.dir, player.action, false);
    enemies.forEach(en => { if(en.state === "ALIVE") drawHuman(en.x - cameraX, en.y, -1, 0, true, en.hue); });
}

// Input Bridge
canvas.addEventListener('mousedown', () => {
    if(gameState !== "PLAYING" || isPaused || player.action > 0) return;
    player.action = 15;
    enemies.forEach(en => {
        let dist = Math.abs((player.x + cameraX) - en.x);
        if(dist < weapons[currentWep].range && en.state === "ALIVE") {
            en.health -= weapons[currentWep].damage;
            spawnBlood(en.x - cameraX + 15, en.y + 30);
            combo++; comboTimer = 100;
            if(en.health <= 0) en.state = "DEAD";
        }
    });
});

window.addEventListener('keydown', e => { if(e.key === "Escape") togglePause(); window.keys = window.keys || {}; window.keys[e.key.toLowerCase()] = true; });
window.addEventListener('keyup', e => { window.keys[e.key.toLowerCase()] = false; });

function loop() { update(); draw(); requestAnimationFrame(loop); }
loop();
