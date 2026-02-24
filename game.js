let gameState = "MENU";
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 1000; canvas.height = 400;

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
    grounded: false, dir: 1, health: 100,
    isSliding: false, actionFrame: 0, actionType: null,
    lastY: 0 // For fall damage
};

let platforms = [{ x: 0, y: 350, w: 1200, h: 100 }];
let buildings = [];
let props = []; // City aesthetics
let enemies = [];

function generateCityProps(xRange) {
    const types = ["POSTER", "GRAFFITI", "VENT", "TRASH"];
    for(let i=0; i<5; i++) {
        props.push({
            x: xRange + Math.random() * 500,
            y: 300 + Math.random() * 50,
            type: types[Math.floor(Math.random() * types.length)],
            color: `hsl(${Math.random() * 360}, 50%, 50%)`
        });
    }
}

function startGame(ch) {
    currentChapter = ch;
    generateWorldStyle(ch);
    document.getElementById('menu-screen').style.display = 'none';
    document.getElementById('ui').style.display = 'flex';
    gameState = "PLAYING";
}

function generateWorldStyle(ch) {
    buildings = []; enemies = []; props = [];
    platforms = [{ x: 0, y: 350, w: 1200, h: 100 }];
    generateCityProps(0);
}

canvas.addEventListener('mousedown', () => {
    if (gameState !== "PLAYING" || player.actionFrame > 0) return;
    player.actionType = Math.random() > 0.5 ? "PUNCH" : "KICK";
    player.actionFrame = 20;

    enemies.forEach(en => {
        let dist = Math.abs((player.x + cameraX) - en.x);
        if (dist < 85 && en.state === "ALIVE") {
            en.health -= 25;
            en.vx = player.dir * 5; // Knockback
            combo++;
            comboTimer = 120;
            spawnDamage(en.x - cameraX, en.y, "-25", "#ff00ff");
            if (en.health <= 0) en.state = "DEAD";
            updateComboUI();
        }
    });
});

function spawnDamage(x, y, text, color) {
    damageNumbers.push({ x, y, text, color, life: 40 });
}

function updateComboUI() {
    const ui = document.getElementById('combo-ui');
    ui.style.display = 'block';
    ui.style.color = `hsl(${combo * 40}, 100%, 60%)`; // Changes color every hit
    ui.style.textShadow = `0 0 15px hsl(${combo * 40}, 100%, 60%)`;
    document.getElementById('combo-count').innerText = combo;
}

window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

function update() {
    animTimer += 0.15;
    if (comboTimer > 0) comboTimer--; else { combo = 0; document.getElementById('combo-ui').style.display = 'none'; }

    // Fall to Death Logic
    if (player.y > canvas.height + 100) {
        player.health = 0;
        location.reload(); // Simple reset on death
    }

    // Procedural Generation
    let lastPlat = platforms[platforms.length - 1];
    if (lastPlat.x < cameraX + canvas.width + 600) {
        let gap = 80 + Math.random() * 120;
        let newX = lastPlat.x + lastPlat.w + gap;
        platforms.push({ x: newX, y: 200 + Math.random() * 150, w: 400 + Math.random() * 400, h: 400 });
        generateCityProps(newX);
        // Spawn unique enemy
        enemies.push({ 
            x: newX + 100, y: 0, w: 30, h: 65, health: 100, 
            vx: 0, state: "ALIVE", 
            hue: Math.random() * 360, 
            actionFrame: 0 
        });
    }

    // Player Movement
    if (keys['d']) player.vx += ACCEL;
    if (keys['a']) player.vx -= ACCEL;
    if (keys['w'] && player.grounded) {
        player.vy = -14;
        player.grounded = false;
        player.lastY = player.y; // Track height for fall damage
    }

    player.vx *= FRICTION;
    player.vy += GRAVITY;
    cameraX += player.vx;

    // Collision & Fall Damage
    let wasGrounded = player.grounded;
    player.grounded = false;
    platforms.forEach(p => {
        let sp = player.x + cameraX;
        if (sp + player.w > p.x && sp < p.x + p.w) {
            if (player.y + player.h <= p.y && player.y + player.h + player.vy >= p.y) {
                // Check height diff for fall damage
                let fallDist = player.y - player.lastY;
                if (fallDist > 200) {
                    player.health -= 20;
                    spawnDamage(player.x, player.y, "CRUNCH!", "red");
                }
                player.vy = 0; player.y = p.y - player.h; player.grounded = true;
                player.lastY = player.y;
            }
        }
    });

    player.y += player.vy;
    if (player.actionFrame > 0) player.actionFrame--;

    // Enemy AI: Attack & Move
    enemies.forEach(en => {
        if (en.state === "ALIVE") {
            let dist = (player.x + cameraX) - en.x;
            if (Math.abs(dist) < 300) en.vx = dist > 0 ? 2 : -2; // Chase
            if (Math.abs(dist) < 60 && Math.random() < 0.05 && en.actionFrame === 0) {
                en.actionFrame = 20; // Enemy Attack
                player.health -= 5;
                spawnDamage(player.x, player.y, "-5", "red");
            }
            en.x += en.vx;
            en.vx *= FRICTION;
            if (en.actionFrame > 0) en.actionFrame--;
            // Enemy Grounding
            platforms.forEach(p => {
                if (en.x > p.x && en.x < p.x + p.w) en.y = p.y - en.h;
            });
        }
    });

    damageNumbers.forEach((n, i) => { n.y -= 1; n.life--; if(n.life <= 0) damageNumbers.splice(i, 1); });
}

function drawHumanoid(x, y, dir, sliding, actionFrame, isEnemy, hue = 0) {
    let cycle = Math.sin(animTimer) * 10;
    let yOff = sliding ? 30 : 0;
    
    ctx.save();
    if (isEnemy) ctx.filter = `hue-rotate(${hue}deg)`;

    // Rounded Legs
    ctx.fillStyle = "#333";
    ctx.beginPath(); ctx.roundRect(x + 5 + cycle, y + 40 + yOff, 10, 25 - yOff, 5); ctx.fill();
    ctx.beginPath(); ctx.roundRect(x + 15 - cycle, y + 40 + yOff, 10, 25 - yOff, 5); ctx.fill();

    // Smoother Hoodie
    ctx.fillStyle = isEnemy ? "#400" : "#111";
    ctx.beginPath(); ctx.roundRect(x, y + 15 + yOff, 30, 35, 10); ctx.fill();

    // Head & Cyan Face
    ctx.fillStyle = "#111";
    ctx.beginPath(); ctx.arc(x + 15, y + 10 + yOff, 15, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#00f2ff";
    ctx.beginPath(); ctx.roundRect(x + 7, y + 2 + yOff, 16, 14, 4); ctx.fill();

    // Face Detail
    ctx.fillStyle = "black";
    ctx.fillRect(x + 10, y + 6 + yOff, 3, 2); ctx.fillRect(x + 17, y + 6 + yOff, 3, 2);
    ctx.fillRect(x + 11, y + 12 + yOff, 8, 1);

    // Dynamic Attack Animation
    if (actionFrame > 0) {
        ctx.strokeStyle = "white"; ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x + 15, y + 25);
        ctx.lineTo(x + 15 + (dir * 40), y + 25 + (Math.sin(animTimer*5)*10));
        ctx.stroke();
    }
    ctx.restore();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // BG
    ctx.fillStyle = "#050010"; ctx.fillRect(0,0, canvas.width, canvas.height);

    // City Aesthetics
    props.forEach(p => {
        ctx.fillStyle = p.color;
        if (p.type === "POSTER") ctx.fillRect(p.x - cameraX, p.y, 20, 30);
        else if (p.type === "GRAFFITI") ctx.fillText("NEON", p.x - cameraX, p.y);
    });

    // Platforms
    ctx.fillStyle = "#1a1a1a";
    platforms.forEach(p => ctx.fillRect(p.x - cameraX, p.y, p.w, p.h));

    // Entities
    drawHumanoid(player.x, player.y, player.dir, player.isSliding, player.actionFrame, false);
    enemies.forEach(en => {
        if (en.state === "ALIVE") drawHumanoid(en.x - cameraX, en.y, en.vx > 0 ? 1 : -1, false, en.actionFrame, true, en.hue);
    });

    // UI & Damage
    damageNumbers.forEach(n => { ctx.fillStyle = n.color; ctx.fillText(n.text, n.x, n.y); });
    document.getElementById('speed').innerText = Math.round(Math.abs(player.vx));
    
    requestAnimationFrame(gameLoop);
}

function gameLoop() { if (gameState === "PLAYING") { update(); draw(); } else { requestAnimationFrame(gameLoop); } }
gameLoop();
