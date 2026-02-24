let gameState = "MENU";
let isPaused = false;
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 1000; canvas.height = 400;

// Physics
const GRAVITY = 0.5;
const FRICTION = 0.88;
const ACCEL = 0.75;
let cameraX = 0, animTimer = 0, combo = 0, comboTimer = 0;

const weapons = [
    { name: "FIST", icon: "👊", damage: 20, range: 60 },
    { name: "KICK", icon: "🦵", damage: 30, range: 75 },
    { name: "KATANA", icon: "⚔️", damage: 55, range: 110 }
];
let currentWeaponIdx = 0;

const player = { x: 100, y: 100, vx: 0, vy: 0, w: 30, h: 75, health: 100, grounded: false, dir: 1, actionFrame: 0 };
let platforms = [], buildings = [], enemies = [], particles = [], damageNumbers = [];

function togglePause() {
    isPaused = !isPaused;
    document.getElementById('pause-screen').style.display = isPaused ? 'flex' : 'none';
}

window.addEventListener('keydown', e => {
    if(e.key === "Escape") togglePause();
    window.keys = window.keys || {}; window.keys[e.key.toLowerCase()] = true;
});
window.addEventListener('keyup', e => { window.keys[e.key.toLowerCase()] = false; });

function switchWeapon(dir) {
    currentWeaponIdx = (currentWeaponIdx + dir + weapons.length) % weapons.length;
    document.getElementById('weapon-name').innerText = weapons[currentWeaponIdx].name;
    document.getElementById('weapon-icon').innerText = weapons[currentWeaponIdx].icon;
}

function spawnBlood(x, y, amount) {
    for(let i=0; i<amount; i++) {
        particles.push({
            x: x, y: y, vx: (Math.random()-0.5)*10, vy: (Math.random()-0.5)*10,
            size: Math.random()*4+2, life: 1, color: "#ff0022"
        });
    }
}

function startGame(ch) {
    gameState = "PLAYING";
    player.health = 100;
    platforms = [{ x: 0, y: 350, w: 2000, h: 100 }];
    enemies = [{ x: 800, y: 0, w: 30, h: 75, health: 100, state: "ALIVE", vy: 0 }];
    document.getElementById('menu-screen').style.display = 'none';
    document.getElementById('ui').style.display = 'flex';
}

canvas.addEventListener('mousedown', () => {
    if (gameState !== "PLAYING" || isPaused || player.actionFrame > 0) return;
    player.actionFrame = 20;
    
    enemies.forEach(en => {
        let dist = Math.abs((player.x + cameraX) - en.x);
        if (dist < weapons[currentWeaponIdx].range && en.state === "ALIVE") {
            en.health -= weapons[currentWeaponIdx].damage;
            spawnBlood(en.x - cameraX + 15, en.y + 30, 15);
            combo++; comboTimer = 120;
            if (en.health <= 0) en.state = "DEAD";
        }
    });
});

function drawHumanoid(x, y, dir, action, isEnemy, hue = 0) {
    ctx.save();
    if (isEnemy) ctx.filter = `hue-rotate(${hue}deg) brightness(0.7)`;
    
    let legCycle = Math.sin(animTimer*1.5) * 12;
    let chestBreathe = Math.sin(animTimer * 0.5) * 2;

    // Athlete Legs (Tapered)
    ctx.fillStyle = "#222"; 
    ctx.beginPath(); // L-Leg
    ctx.moveTo(x+10, y+45); ctx.lineTo(x+5+legCycle, y+75); ctx.lineTo(x+15+legCycle, y+75); ctx.fill();
    ctx.beginPath(); // R-Leg
    ctx.moveTo(x+20, y+45); ctx.lineTo(x+15-legCycle, y+75); ctx.lineTo(x+25-legCycle, y+75); ctx.fill();

    // V-Taper Torso (Athletic)
    ctx.fillStyle = isEnemy ? "#411" : "#111";
    ctx.beginPath();
    ctx.moveTo(x, y+20-chestBreathe); ctx.lineTo(x+30, y+20-chestBreathe);
    ctx.lineTo(x+20, y+45); ctx.lineTo(x+10, y+45); ctx.closePath(); ctx.fill();

    // Cyan Face (Reference Image Style)
    ctx.fillStyle = "#4dd0e1";
    ctx.beginPath(); ctx.roundRect(x+8, y+2, 14, 15, 4); ctx.fill();
    
    // Anime Eyes
    ctx.fillStyle = "#000"; ctx.fillRect(x+10, y+6, 3, 2); ctx.fillRect(x+17, y+6, 3, 2);

    // Combat Animations
    if (action > 0) {
        ctx.strokeStyle = weapons[currentWeaponIdx].name === "KATANA" ? "#00f2ff" : "#fff";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x+15, y+25);
        ctx.lineTo(x+15 + (dir * (action*2.5)), y+25 + (Math.sin(action)*10));
        ctx.stroke();
    }
    ctx.restore();
}

function update() {
    if(isPaused) return;
    animTimer += 0.15;
    if (comboTimer > 0) comboTimer--; else combo = 0;

    // Movement & Falling Logic
    if (player.y > canvas.height) { player.health = 0; location.reload(); }

    const keys = window.keys || {};
    if (keys['d']) { player.vx += ACCEL; player.dir = 1; }
    if (keys['a']) { player.vx -= ACCEL; player.dir = -1; }
    if (keys['w'] && player.grounded) { player.vy = -14; player.grounded = false; }

    player.vx *= FRICTION; player.vy += GRAVITY;
    cameraX += player.vx;

    // Platform Collision
    player.grounded = false;
    platforms.forEach(p => {
        let px = player.x + cameraX;
        if (px + player.w > p.x && px < p.x + p.w && player.y + player.h <= p.y && player.y + player.h + player.vy >= p.y) {
            player.vy = 0; player.y = p.y - player.h; player.grounded = true;
        }
    });
    player.y += player.vy;

    // Enemy Gravity Fix
    enemies.forEach(en => {
        en.vy += GRAVITY;
        platforms.forEach(p => {
            if (en.x + en.w > p.x && en.x < p.x + p.w && en.y + en.h <= p.y && en.y + en.h + en.vy >= p.y) {
                en.vy = 0; en.y = p.y - en.h;
            }
        });
        en.y += en.vy;
    });

    // Particle Update
    particles.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.life -= 0.02;
        if(p.life <= 0) particles.splice(i, 1);
    });

    player.actionFrame = Math.max(0, player.actionFrame - 1);
    document.getElementById('health-fill').style.width = player.health + "%";
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Detailed Anime Sky
    let bgGrad = ctx.createLinearGradient(0,0,0,400);
    bgGrad.addColorStop(0, "#050515"); bgGrad.addColorStop(1, "#201040");
    ctx.fillStyle = bgGrad; ctx.fillRect(0,0,1000,400);

    // Particles (Gore)
    particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fillRect(p.x - cameraX, p.y, p.size, p.size);
    });
    ctx.globalAlpha = 1;

    // Ground
    ctx.fillStyle = "#111";
    platforms.forEach(p => {
        ctx.fillRect(p.x - cameraX, p.y, p.w, p.h);
        ctx.strokeStyle = "#00f2ff"; ctx.strokeRect(p.x - cameraX, p.y, p.w, 3);
    });

    // Characters
    drawHumanoid(player.x, player.y, player.dir, player.actionFrame, false);
    enemies.forEach(en => { if(en.state === "ALIVE") drawHumanoid(en.x - cameraX, en.y, -1, 0, true, en.hue); });

    requestAnimationFrame(gameLoop);
}

function gameLoop() { update(); draw(); }
gameLoop();
