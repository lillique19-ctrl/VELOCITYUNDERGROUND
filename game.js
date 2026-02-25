const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 1000; canvas.height = 450;

// Optimized Game State
let gameState = "MENU", isPaused = false;
const physics = { gravity: 0.5, friction: 0.88, accel: 0.75 };
let cameraX = 0, animTimer = 0, combo = 0, comboTimer = 0;

// Weapons System
const arsenal = [
    { name: "FIST", icon: "👊", dmg: 25, range: 60, color: "#fff" },
    { name: "KATANA", icon: "⚔️", dmg: 55, range: 110, color: "#00f2ff" }
];
let currentWep = 0;

// Entity Factory
const player = {
    x: 100, y: 100, vx: 0, vy: 0, w: 35, h: 80, 
    health: 100, dir: 1, action: 0, grounded: false
};
let platforms = [], enemies = [], gore = [];

function togglePause() {
    isPaused = !isPaused;
    document.getElementById('pause-menu').style.display = isPaused ? 'flex' : 'none';
}

function switchWeapon(dir) {
    currentWep = (currentWep + dir + arsenal.length) % arsenal.length;
    document.getElementById('weapon-icon').innerText = arsenal[currentWep].icon;
    document.getElementById('weapon-name').innerText = arsenal[currentWep].name;
}

function startGame() {
    gameState = "PLAYING";
    player.health = 100; player.y = 100; cameraX = 0;
    platforms = [{ x: 0, y: 380, w: 2000, h: 200 }, { x: 2200, y: 300, w: 800, h: 200 }];
    enemies = [{ x: 800, y: 100, health: 100, state: "ALIVE", vy: 0, hue: 0 }];
    document.getElementById('menu-screen').style.display = 'none';
    document.getElementById('ui').style.display = 'flex';
}

// Athletic Humanoid Drawing (Reference Image Accuracy)
function drawAthlete(x, y, dir, action, isEnemy, hue = 0) {
    ctx.save();
    if(isEnemy) ctx.filter = `hue-rotate(${hue}deg) brightness(0.6)`;
    
    const walk = Math.sin(animTimer * 2) * 15;
    
    // 1. Athletic Legs (Yellow & Red from Image)
    ctx.fillStyle = "#ffd54f"; // Left
    ctx.beginPath(); ctx.roundRect(x + (dir>0?5:22), y + 50 + walk, 10, 30, 5); ctx.fill();
    ctx.fillStyle = "#e53935"; // Right
    ctx.beginPath(); ctx.roundRect(x + (dir>0?22:5), y + 50 - walk, 10, 30, 5); ctx.fill();

    // 2. V-Taper Athletic Torso
    ctx.fillStyle = "#111"; // Black Hoodie
    ctx.beginPath();
    ctx.moveTo(x, y+20); ctx.lineTo(x+35, y+20); 
    ctx.lineTo(x+25, y+50); ctx.lineTo(x+10, y+50); ctx.closePath(); ctx.fill();
    
    // 3. Orange Chest Detail
    ctx.fillStyle = "#fb8c00";
    ctx.fillRect(x+12, y+25, 11, 15);

    // 4. Cyan Head (Proportional)
    ctx.fillStyle = "#4dd0e1";
    ctx.beginPath(); ctx.arc(x + 17.5, y + 5, 18, 0, Math.PI*2); ctx.fill();
    
    // 5. Eyes
    ctx.fillStyle = "#000";
    ctx.fillRect(x+12, y+2, 4, 3); ctx.fillRect(x+22, y+2, 4, 3);

    // 6. Combat FX
    if (action > 0) {
        ctx.strokeStyle = arsenal[currentWep].color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x+17, y+30);
        ctx.lineTo(x+17 + (dir * 70), y+30 + (Math.sin(animTimer*10)*20));
        ctx.stroke();
    }
    ctx.restore();
}

function update() {
    if(isPaused || gameState !== "PLAYING") return;
    animTimer += 0.15;
    if(comboTimer > 0) comboTimer--; else combo = 0;

    // Movement
    const keys = window.keys || {};
    if(keys['d']) { player.vx += physics.accel; player.dir = 1; }
    if(keys['a']) { player.vx -= physics.accel; player.dir = -1; }
    if(keys['w'] && player.grounded) { player.vy = -14; player.grounded = false; }

    player.vx *= physics.friction;
    player.vy += physics.gravity;
    cameraX += player.vx;
    player.y += player.vy;

    // Fixed Collision Logic
    player.grounded = false;
    platforms.forEach(p => {
        let px = player.x + cameraX;
        if(px + player.w > p.x && px < p.x + p.w && player.y + player.h <= p.y && player.y + player.h + player.vy >= p.y) {
            player.vy = 0; player.y = p.y - player.h; player.grounded = true;
        }
    });

    // Enemy/Gore Updates
    enemies.forEach(en => {
        en.vy += physics.gravity;
        platforms.forEach(p => { if(en.x > p.x && en.x < p.x+p.w && en.y+en.h <= p.y && en.y+en.h+en.vy >= p.y) en.vy = 0; });
        en.y += en.vy;
    });

    gore.forEach((p, i) => { 
        p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.l -= 0.02; 
        if(p.l <= 0) gore.splice(i, 1); 
    });

    if (player.y > canvas.height + 200) restartGame();
    player.action = Math.max(0, player.action - 1);
    updateUI();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Professional Gradient Sky
    let sky = ctx.createLinearGradient(0,0,0,canvas.height);
    sky.addColorStop(0, "#050510"); sky.addColorStop(1, "#150a25");
    ctx.fillStyle = sky; ctx.fillRect(0,0,canvas.width, canvas.height);

    // Platforms
    ctx.fillStyle = "#0a0a0a";
    platforms.forEach(p => {
        ctx.fillRect(p.x - cameraX, p.y, p.w, p.h);
        ctx.strokeStyle = "#00f2ff33"; ctx.strokeRect(p.x - cameraX, p.y, p.w, 2);
    });

    // Gore
    gore.forEach(p => { ctx.fillStyle = `rgba(255,0,50,${p.l})`; ctx.fillRect(p.x - cameraX, p.y, p.s, p.s); });

    // Entities
    drawAthlete(player.x, player.y, player.dir, player.action, false);
    enemies.forEach(en => { if(en.state === "ALIVE") drawAthlete(en.x - cameraX, en.y, -1, 0, true, en.hue); });

    requestAnimationFrame(draw);
}

function updateUI() {
    document.getElementById('health-bar').style.width = player.health + "%";
    document.getElementById('combo-count').innerText = combo;
    document.getElementById('combo-module').style.display = combo > 0 ? "block" : "none";
}

function restartGame() { gameState = "MENU"; document.getElementById('menu-screen').style.display = 'flex'; }

canvas.addEventListener('mousedown', () => {
    if(isPaused || player.action > 0) return;
    player.action = 15;
    enemies.forEach(en => {
        let dist = Math.abs((player.x + cameraX) - en.x);
        if(dist < arsenal[currentWep].range && en.state === "ALIVE") {
            en.health -= arsenal[currentWep].dmg;
            for(let i=0; i<10; i++) gore.push({x: en.x, y: en.y+30, vx: (Math.random()-0.5)*10, vy: (Math.random()-0.5)*10, s: Math.random()*4+2, l: 1});
            combo++; comboTimer = 100;
            if(en.health <= 0) en.state = "DEAD";
        }
    });
});

window.addEventListener('keydown', e => { if(e.key === "Escape") togglePause(); window.keys = window.keys || {}; window.keys[e.key.toLowerCase()] = true; });
window.addEventListener('keyup', e => { window.keys[e.key.toLowerCase()] = false; });

setInterval(update, 1000/60); // Independent logic loop
draw(); // Visual loop
