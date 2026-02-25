const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 1000; canvas.height = 450;

let gameState = "MENU";
const physics = { gravity: 0.5, friction: 0.88, accel: 0.75 };
let cameraX = 0, animTimer = 0, combo = 0, comboTimer = 0;

const arsenal = [
    { name: "FIST", icon: "👊", dmg: 25, range: 65, color: "#fff" },
    { name: "KATANA", icon: "⚔️", dmg: 60, range: 120, color: "#00f2ff" }
];
let currentWep = 0;

const player = { x: 100, y: 100, vx: 0, vy: 0, w: 35, h: 85, health: 100, dir: 1, action: 0, grounded: false };
let platforms = [], enemies = [], gore = [];

// CORE FUNCTION: START MISSION
window.startGame = function() {
    console.log("Mission Starting...");
    gameState = "PLAYING";
    player.health = 100;
    player.x = 100; 
    player.y = 100;
    cameraX = 0;
    platforms = [
        { x: 0, y: 380, w: 2000, h: 100 },
        { x: 2100, y: 300, w: 800, h: 100 }
    ];
    enemies = [{ x: 900, y: 100, health: 100, state: "ALIVE", vy: 0, hue: 45 }];
    document.getElementById('menu-screen').style.display = 'none';
    document.getElementById('ui').style.display = 'flex';
};

function switchWeapon(dir) {
    currentWep = (currentWep + dir + arsenal.length) % arsenal.length;
    document.getElementById('weapon-icon').innerText = arsenal[currentWep].icon;
    document.getElementById('weapon-name').innerText = arsenal[currentWep].name;
}

function drawProAthlete(x, y, dir, action, isEnemy, hue = 0) {
    ctx.save();
    if(isEnemy) ctx.filter = `hue-rotate(${hue}deg) brightness(0.6)`;
    
    let walk = Math.sin(animTimer * 2) * 12;

    // Athlete Legs (Yellow & Red) - Tapered muscle look
    ctx.fillStyle = "#ffd54f"; // Yellow
    ctx.beginPath(); ctx.roundRect(x + (dir>0?2:22), y + 55 + walk, 12, 30, 6); ctx.fill();
    ctx.fillStyle = "#e53935"; // Red
    ctx.beginPath(); ctx.roundRect(x + (dir>0?22:2), y + 55 - walk, 12, 30, 6); ctx.fill();

    // Muscle Torso (Athletic "V" Shape)
    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.moveTo(x-5, y+20); ctx.lineTo(x+40, y+20); // Wide shoulders
    ctx.lineTo(x+28, y+55); ctx.lineTo(x+7, y+55); ctx.closePath(); ctx.fill();

    // Chest Highlight (Orange from image)
    ctx.fillStyle = "#fb8c00";
    ctx.fillRect(x+10, y+25, 15, 18);

    // Pro Head (Cyan)
    ctx.fillStyle = "#4dd0e1";
    ctx.beginPath(); ctx.arc(x + 17.5, y + 5, 18, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "black";
    ctx.fillRect(x+10, y+2, 4, 3); ctx.fillRect(x+22, y+2, 4, 3);

    // Hit Animations
    if (action > 0) {
        ctx.strokeStyle = arsenal[currentWep].color;
        ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(x+17, y+30);
        ctx.lineTo(x+17 + (dir * 80), y+30 + (Math.sin(animTimer*10)*15));
        ctx.stroke();
    }
    ctx.restore();
}

function update() {
    if(gameState !== "PLAYING") return;
    animTimer += 0.15;
    if(comboTimer > 0) comboTimer--; else combo = 0;

    const keys = window.keys || {};
    if(keys['d']) { player.vx += physics.accel; player.dir = 1; }
    if(keys['a']) { player.vx -= physics.accel; player.dir = -1; }
    if(keys['w'] && player.grounded) { player.vy = -14; player.grounded = false; }

    player.vx *= physics.friction;
    player.vy += physics.gravity;
    cameraX += player.vx;
    player.y += player.vy;

    // Collision
    player.grounded = false;
    platforms.forEach(p => {
        let px = player.x + cameraX;
        if(px + player.w > p.x && px < p.x + p.w && player.y + player.h <= p.y && player.y + player.h + player.vy >= p.y) {
            player.vy = 0; player.y = p.y - player.h; player.grounded = true;
        }
    });

    // Gore & Enemies
    gore.forEach((p, i) => { p.x += p.vx; p.y += p.vy; p.l -= 0.02; if(p.l <= 0) gore.splice(i, 1); });
    
    player.action = Math.max(0, player.action - 1);
    if(player.y > 600) location.reload();

    // UI
    document.getElementById('health-bar').style.width = player.health + "%";
    document.getElementById('combo-count').innerText = combo;
    document.getElementById('combo-module').style.display = combo > 0 ? "block" : "none";
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Pro Background
    let sky = ctx.createLinearGradient(0,0,0,450);
    sky.addColorStop(0, "#050510"); sky.addColorStop(1, "#1a0a25");
    ctx.fillStyle = sky; ctx.fillRect(0,0,canvas.width, canvas.height);

    // World
    ctx.fillStyle = "#0a0a0a";
    platforms.forEach(p => {
        ctx.fillRect(p.x - cameraX, p.y, p.w, p.h);
        ctx.strokeStyle = "#00f2ff33"; ctx.strokeRect(p.x - cameraX, p.y, p.w, 2);
    });

    gore.forEach(p => { ctx.fillStyle = `rgba(255,0,50,${p.l})`; ctx.fillRect(p.x - cameraX, p.y, 4, 4); });

    // Entities
    drawProAthlete(player.x, player.y, player.dir, player.action, false);
    enemies.forEach(en => { if(en.state === "ALIVE") drawProAthlete(en.x - cameraX, en.y, -1, 0, true, en.hue); });

    requestAnimationFrame(draw);
}

canvas.addEventListener('mousedown', () => {
    if(gameState !== "PLAYING" || player.action > 0) return;
    player.action = 15;
    enemies.forEach(en => {
        let dist = Math.abs((player.x + cameraX) - en.x);
        if(dist < arsenal[currentWep].range && en.state === "ALIVE") {
            en.health -= arsenal[currentWep].dmg;
            for(let i=0; i<10; i++) gore.push({x: en.x, y: en.y+30, vx:(Math.random()-0.5)*10, vy:(Math.random()-0.5)*10, l:1});
            combo++; comboTimer = 100;
            if(en.health <= 0) en.state = "DEAD";
        }
    });
});

window.addEventListener('keydown', e => { window.keys = window.keys || {}; window.keys[e.key.toLowerCase()] = true; });
window.addEventListener('keyup', e => { window.keys[e.key.toLowerCase()] = false; });

setInterval(update, 1000/60);
draw();
