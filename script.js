const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

let player = { x: canvas.width / 2, y: canvas.height / 2, size: 20, speed: 5, health: 3 };
let enemies = [];
let bullets = [];
let keys = {};
let gameOver = false;
let timeElapsed = 0;
let baseEnemySpeed = 3; // Initial speed is now 3 times the original
let speedIncreaseInterval = 5000; // Increase speed every 5 seconds
let lastFireTime = 0; // Track the last time a bullet was fired
let lastEnemySpawnTime = 0; // Track the last time an enemy was spawned
let startTime = null; // Track the start time of the game
let isPhone = false; // Determine if the game is played on a phone
let shootDirection = { x: 1, y: 0 }; // Default shooting direction

const joystick = document.getElementById('joystick');
const joystickHandle = document.getElementById('joystick-handle');
const shootJoystick = document.getElementById('shoot-joystick');
const shootJoystickHandle = document.getElementById('shoot-joystick-handle');
let joystickActive = false;
let joystickStartX, joystickStartY;
let shootJoystickActive = false;
let shootJoystickStartX, shootJoystickStartY;

function initializeGame() {
    const device = prompt("Are you playing on a phone or pc? (Enter 'ph' for phone or 'pc')");
    if (device.toLowerCase() === 'ph') {
        isPhone = true;
        shootJoystick.style.display = "block";
    } else {
        isPhone = false;
        shootJoystick.style.display = "none";
    }
}

document.addEventListener('keydown', (e) => { keys[e.key] = true; });
document.addEventListener('keyup', (e) => { keys[e.key] = false; });

if (isPhone) {
    joystick.addEventListener('touchstart', (e) => {
        joystickActive = true;
        const touch = e.touches[0];
        joystickStartX = touch.clientX;
        joystickStartY = touch.clientY;
    });

    joystick.addEventListener('touchmove', (e) => {
        if (!joystickActive) return;
        const touch = e.touches[0];
        const dx = touch.clientX - joystickStartX;
        const dy = touch.clientY - joystickStartY;
        const distance = Math.min(Math.sqrt(dx * dx + dy * dy), 40);
        const angle = Math.atan2(dy, dx);
        const offsetX = Math.cos(angle) * distance;
        const offsetY = Math.sin(angle) * distance;
        joystickHandle.style.transform = `translate(${offsetX}px, ${offsetY}px)`;

        player.x += Math.cos(angle) * player.speed;
        player.y += Math.sin(angle) * player.speed;

        // Clamp player position to canvas bounds
        player.x = Math.max(player.size / 2, Math.min(canvas.width - player.size / 2, player.x));
        player.y = Math.max(player.size / 2, Math.min(canvas.height - player.size / 2, player.y));
    });

    joystick.addEventListener('touchend', () => {
        joystickActive = false;
        joystickHandle.style.transform = 'translate(-50%, -50%)';
    });

    shootJoystick.addEventListener('touchstart', (e) => {
        shootJoystickActive = true;
        const touch = e.touches[0];
        shootJoystickStartX = touch.clientX;
        shootJoystickStartY = touch.clientY;
    });

    shootJoystick.addEventListener('touchmove', (e) => {
        if (!shootJoystickActive) return;
        const touch = e.touches[0];
        const dx = touch.clientX - shootJoystickStartX;
        const dy = touch.clientY - shootJoystickStartY;
        const distance = Math.min(Math.sqrt(dx * dx + dy * dy), 40);
        const angle = Math.atan2(dy, dx);
        const offsetX = Math.cos(angle) * distance;
        const offsetY = Math.sin(angle) * distance;
        shootJoystickHandle.style.transform = `translate(${offsetX}px, ${offsetY}px)`;

        shootDirection = { x: Math.cos(angle), y: Math.sin(angle) };
    });

    shootJoystick.addEventListener('touchend', () => {
        shootJoystickActive = false;
        shootJoystickHandle.style.transform = 'translate(-50%, -50%)';
    });
} else {
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const dx = mouseX - player.x;
        const dy = mouseY - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        shootDirection = { x: dx / distance, y: dy / distance };
    });
}

function fireBullet() {
    const currentTime = Date.now();
    if (!startTime) {
        startTime = currentTime;
    }
    const elapsedTime = (currentTime - startTime) / 1000; // in seconds
    const maxInterval = 500; // 0.5 seconds
    const minInterval = 250; // 0.25 seconds
    const maxTime = 60; // 60 seconds to reach the minimum interval

    // Calculate the current interval
    const currentInterval = Math.max(minInterval, maxInterval - ((maxInterval - minInterval) * Math.min(elapsedTime / maxTime, 1)));

    if (currentTime - lastFireTime < currentInterval) {
        return; // Limit firing rate based on the current interval
    }
    lastFireTime = currentTime;

    let bulletSpeed = 7;
    bullets.push({
        x: player.x + player.size / 4,
        y: player.y + player.size / 4,
        size: 5,
        speedX: shootDirection.x * bulletSpeed,
        speedY: shootDirection.y * bulletSpeed,
    });
    bullets.push({
        x: player.x - player.size / 4,
        y: player.y - player.size / 4,
        size: 5,
        speedX: shootDirection.x * bulletSpeed,
        speedY: shootDirection.y * bulletSpeed,
    });
}

function update() {
    if (gameOver) return;

    const currentTime = Date.now();
    if (!startTime) {
        startTime = currentTime;
    }
    const elapsedTime = (currentTime - startTime) / 1000; // in seconds
    const maxEnemySpawnInterval = 1000; // 1 second
    const minEnemySpawnInterval = 100; // 0.1 seconds
    const maxTimeForSpawnRate = 60; // 60 seconds to reach the minimum interval

    // Calculate the current enemy spawn interval
    const currentEnemySpawnInterval = Math.max(minEnemySpawnInterval, maxEnemySpawnInterval - ((maxEnemySpawnInterval - minEnemySpawnInterval) * Math.min(elapsedTime / maxTimeForSpawnRate, 1)));

    // Increase time elapsed
    timeElapsed += 16.67; // Assuming 60 frames per second

    // Update time display
    document.getElementById('time').textContent = `Time: ${(timeElapsed / 1000).toFixed(1)}s`;

    // Calculate enemy speed multiplier based on time elapsed
    let speedMultiplier = 1 + Math.floor(timeElapsed / speedIncreaseInterval) * 0.1;

    // Player movement with keyboard (optional)
    if (keys['ArrowUp'] && player.y > 0) { player.y -= player.speed; }
    if (keys['ArrowDown'] && player.y < canvas.height - player.size) { player.y += player.speed; }
    if (keys['ArrowLeft'] && player.x > 0) { player.x -= player.speed; }
    if (keys['ArrowRight'] && player.x < canvas.width - player.size) { player.x += player.speed; }

    // Update bullets
    bullets.forEach((bullet, index) => {
        bullet.x += bullet.speedX;
        bullet.y += bullet.speedY;

        // Remove bullets that go off-screen
        if (bullet.x < 0 || bullet.x > canvas.width || bullet.y < 0 || bullet.y > canvas.height) {
            bullets.splice(index, 1);
        }
    });

    // Generate enemies based on the current spawn interval
    if (currentTime - lastEnemySpawnTime >= currentEnemySpawnInterval) {
        let size = Math.random() * 20 + 10;
        let x = Math.random() < 0.5 ? 0 : canvas.width;
        let y = Math.random() * canvas.height;
        enemies.push({ x, y, size, speed: baseEnemySpeed * speedMultiplier });
        lastEnemySpawnTime = currentTime;
    }

    // Update enemies
    enemies.forEach((enemy, enemyIndex) => {
        let dx = player.x - enemy.x;
        let dy = player.y - enemy.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        enemy.x += (dx / distance) * enemy.speed;
        enemy.y += (dy / distance) * enemy.speed;

        // Check collision with player
        if (distance < player.size / 2 + enemy.size / 2) {
            player.health--;
            enemies.splice(enemyIndex, 1);
            if (player.health <= 0) {
                gameOver = true;
                alert('Game Over');
                document.getElementById('health').textContent = 'Game Over';
            }
        }

        // Check collision with bullets
        bullets.forEach((bullet, bulletIndex) => {
            let bdx = bullet.x - enemy.x;
            let bdy = bullet.y - enemy.y;
            let bDistance = Math.sqrt(bdx * bdx + bdy * bdy);
            if (bDistance < bullet.size / 2 + enemy.size / 2) {
                enemies.splice(enemyIndex, 1);
                bullets.splice(bulletIndex, 1);
            }
        });
    });

    draw();
    requestAnimationFrame(update);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw player
    ctx.fillStyle = 'blue';
    ctx.fillRect(player.x - player.size / 2, player.y - player.size / 2, player.size, player.size);

    // Draw bullets
    bullets.forEach(bullet => {
        ctx.fillStyle = 'yellow';
        ctx.fillRect(bullet.x - bullet.size / 2, bullet.y - bullet.size / 2, bullet.size, bullet.size);
    });

    // Draw enemies
    enemies.forEach(enemy => {
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.size / 2, 0, Math.PI * 2);
        ctx.fill();
    });

    // Update health display
    document.getElementById('health').textContent = '❤️'.repeat(player.health);
}

function getNearestEnemy(player, enemies) {
    let nearestEnemy = null;
    let minDistance = Infinity;
    enemies.forEach(enemy => {
        let dx = player.x - enemy.x;
        let dy = player.y - enemy.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < minDistance) {
            minDistance = distance;
            nearestEnemy = enemy;
        }
    });
    return nearestEnemy;
}

// Initialize the game and start the update loop
initializeGame();
update();
setInterval(fireBullet, 500); // Automatically fire bullets every 0.5 seconds initially
