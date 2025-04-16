/**
 * High-Definition Mario-style Platformer Game
 */
class MarioGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.gameLoop = null;

        // Game state
        this.score = 0;
        this.lives = 3;
        this.level = 1;

        // Player properties
        this.playerX = 100;
        this.playerY = 300;
        this.playerWidth = 50;
        this.playerHeight = 70;
        this.playerVX = 0;
        this.playerVY = 0;
        this.playerSpeed = 5;
        this.playerJumpForce = 15;
        this.playerIsJumping = false;

        // Platform properties
        this.platforms = [
            { x: 0, y: 500, width: 800, height: 100 },
            { x: 300, y: 350, width: 200, height: 50 },
            { x: 600, y: 250, width: 200, height: 50 }
        ];

        // Setup controls
        this.setupControls();
    }

    /**
     * Load all game assets
     */
    loadAssets() {
        // Skip asset loading and initialize directly
        // In a real game, we would load actual assets here
        this.initialize();
    }

    /**
     * Initialize the game
     */
    initialize() {
        // Create player
        this.player = new Player(100, 300);

        // Create level
        this.createLevel();

        // Create background layers
        this.createBackgrounds();
    }

    /**
     * Create the level layout
     */
    createLevel() {
        // Create ground platforms
        for (let i = 0; i < 50; i++) {
            this.platforms.push(new Platform(i * 70, 500, 70, 70));
        }

        // Create some elevated platforms
        this.platforms.push(new Platform(300, 350, 210, 70));
        this.platforms.push(new Platform(700, 300, 210, 70));
        this.platforms.push(new Platform(1100, 250, 210, 70));

        // Add some coins
        for (let i = 0; i < 20; i++) {
            this.coins.push(new Coin(300 + i * 100, 200));
        }

        // Add some enemies
        this.enemies.push(new Enemy(500, 450, 'goomba'));
        this.enemies.push(new Enemy(800, 250, 'goomba'));
        this.enemies.push(new Enemy(1200, 450, 'goomba'));

        // Add power-ups
        this.powerUps.push(new PowerUp(600, 200));
    }

    /**
     * Create parallax background layers
     */
    createBackgrounds() {
        this.backgrounds = [
            { image: 'bg-sky', scrollFactor: 0.1 },
            { image: 'bg-mountains', scrollFactor: 0.3 },
            { image: 'bg-trees', scrollFactor: 0.6 }
        ];
    }

    /**
     * Set up keyboard and touch controls
     */
    setupControls() {
        this.keys = {
            left: false,
            right: false,
            up: false
        };

        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowLeft':
                    this.keys.left = true;
                    break;
                case 'ArrowRight':
                    this.keys.right = true;
                    break;
                case 'ArrowUp':
                case ' ':
                    this.keys.up = true;
                    break;
                case 'p':
                    this.togglePause();
                    break;
            }
        });

        document.addEventListener('keyup', (e) => {
            switch(e.key) {
                case 'ArrowLeft':
                    this.keys.left = false;
                    break;
                case 'ArrowRight':
                    this.keys.right = false;
                    break;
                case 'ArrowUp':
                case ' ':
                    this.keys.up = false;
                    break;
            }
        });

        // Touch controls for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            const x = touch.clientX;
            const y = touch.clientY;

            // Jump if top half of screen is touched
            if (y < this.canvas.height / 2) {
                this.keys.up = true;
            } else {
                // Move left or right based on which side was touched
                if (x < this.canvas.width / 2) {
                    this.keys.left = true;
                    this.keys.right = false;
                } else {
                    this.keys.right = true;
                    this.keys.left = false;
                }
            }
        });

        this.canvas.addEventListener('touchend', () => {
            this.keys.up = false;
            this.keys.left = false;
            this.keys.right = false;
        });
    }

    /**
     * Toggle game pause state
     */
    togglePause() {
        this.paused = !this.paused;
    }

    /**
     * Update game state
     * @param {number} dt - Delta time in seconds
     */
    update(dt) {
        if (this.paused || this.gameOver) return;

        // Update player
        this.player.update(dt, this.keys, this.gravity, this.friction);

        // Check collisions with platforms
        this.platforms.forEach(platform => {
            if (this.checkCollision(this.player, platform)) {
                this.resolveCollision(this.player, platform);
            }
        });

        // Check collisions with enemies
        this.enemies.forEach((enemy, index) => {
            enemy.update(dt, this.gravity, this.friction);

            // Check if player stomps on enemy
            if (this.checkCollision(this.player, enemy)) {
                if (this.player.vy > 0 && this.player.y < enemy.y - enemy.height / 2) {
                    // Player stomped on enemy
                    this.enemies.splice(index, 1);
                    this.player.vy = -600; // Bounce
                    this.score += 100;
                } else {
                    // Player hit by enemy
                    this.playerHit();
                }
            }

            // Check enemy collisions with platforms
            this.platforms.forEach(platform => {
                if (this.checkCollision(enemy, platform)) {
                    this.resolveCollision(enemy, platform);
                }
            });
        });

        // Check collisions with coins
        this.coins.forEach((coin, index) => {
            if (this.checkCollision(this.player, coin)) {
                this.coins.splice(index, 1);
                this.score += 10;
                // ASSETS.playSound('coin');
            }
        });

        // Check collisions with power-ups
        this.powerUps.forEach((powerUp, index) => {
            if (this.checkCollision(this.player, powerUp)) {
                this.powerUps.splice(index, 1);
                this.player.powerUp();
                this.score += 50;
                // ASSETS.playSound('powerup');
            }
        });

        // Update camera to follow player
        this.updateCamera();
    }

    /**
     * Update camera position to follow player
     */
    updateCamera() {
        // Center camera on player
        this.camera.x = this.player.x - this.canvas.width / 2;

        // Clamp camera to level bounds
        this.camera.x = Math.max(0, this.camera.x);
        this.camera.x = Math.min(3000 - this.canvas.width, this.camera.x);
    }

    /**
     * Check collision between two objects
     * @param {Object} a - First object
     * @param {Object} b - Second object
     * @returns {boolean} Whether the objects are colliding
     */
    checkCollision(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }

    /**
     * Resolve collision between player and platform
     * @param {Object} player - Player object
     * @param {Object} platform - Platform object
     */
    resolveCollision(player, platform) {
        // Calculate overlap on x axis
        const overlapX = Math.min(
            player.x + player.width - platform.x,
            platform.x + platform.width - player.x
        );

        // Calculate overlap on y axis
        const overlapY = Math.min(
            player.y + player.height - platform.y,
            platform.y + platform.height - player.y
        );

        // Resolve collision in the direction of least overlap
        if (overlapX < overlapY) {
            if (player.x < platform.x) {
                player.x = platform.x - player.width;
            } else {
                player.x = platform.x + platform.width;
            }
            player.vx = 0;
        } else {
            if (player.y < platform.y) {
                player.y = platform.y - player.height;
                player.vy = 0;
                player.grounded = true;
            } else {
                player.y = platform.y + platform.height;
                player.vy = 0;
            }
        }
    }

    /**
     * Handle player being hit by enemy
     */
    playerHit() {
        if (this.player.powered) {
            // If powered up, just lose the power-up
            this.player.powered = false;
        } else {
            // Lose a life
            this.lives--;
            if (this.lives <= 0) {
                this.gameOver = true;
                // ASSETS.playSound('death');
            } else {
                // Reset player position
                this.player.x = 100;
                this.player.y = 300;
                this.player.vx = 0;
                this.player.vy = 0;
            }
        }
    }

    /**
     * Draw the game
     */
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Save context for camera transformation
        this.ctx.save();

        // Apply camera transformation
        this.ctx.translate(-this.camera.x, 0);

        // Draw background layers with parallax effect
        this.drawBackgrounds();

        // Draw platforms
        this.platforms.forEach(platform => platform.draw(this.ctx));

        // Draw coins
        this.coins.forEach(coin => coin.draw(this.ctx));

        // Draw power-ups
        this.powerUps.forEach(powerUp => powerUp.draw(this.ctx));

        // Draw enemies
        this.enemies.forEach(enemy => enemy.draw(this.ctx));

        // Draw player
        this.player.draw(this.ctx);

        // Restore context
        this.ctx.restore();

        // Draw UI (score, lives, etc.)
        this.drawUI();

        // Draw game over or paused message if needed
        if (this.gameOver) {
            this.drawGameOver();
        } else if (this.paused) {
            this.drawPaused();
        }
    }

    /**
     * Draw background layers with parallax effect
     */
    drawBackgrounds() {
        this.backgrounds.forEach(bg => {
            // Calculate parallax position
            const x = -this.camera.x * bg.scrollFactor;

            // Draw the background image
            // In a real game, we'd use the actual loaded image
            this.ctx.fillStyle = bg.image === 'bg-sky' ? '#87CEEB' :
                                bg.image === 'bg-mountains' ? '#8B4513' : '#228B22';
            this.ctx.fillRect(x, 0, this.canvas.width, this.canvas.height);
        });
    }

    /**
     * Draw UI elements (score, lives, etc.)
     */
    drawUI() {
        this.ctx.fillStyle = 'white';
        this.ctx.font = '24px Arial';
        this.ctx.fillText(`Score: ${this.score}`, 20, 30);
        this.ctx.fillText(`Lives: ${this.lives}`, 20, 60);
        this.ctx.fillText(`Level: ${this.level}`, 20, 90);
    }

    /**
     * Draw game over message
     */
    drawGameOver() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = 'white';
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 40);

        this.ctx.font = '24px Arial';
        this.ctx.fillText(`Final Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
        this.ctx.fillText('Press any key to restart', this.canvas.width / 2, this.canvas.height / 2 + 60);

        this.ctx.textAlign = 'left';
    }

    /**
     * Draw paused message
     */
    drawPaused() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = 'white';
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.textAlign = 'left';
    }

    /**
     * Game loop
     * @param {number} timestamp - Current timestamp
     */
    loop(timestamp) {
        if (!this.lastTime) this.lastTime = timestamp;

        const frameTime = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        this.accumulator += frameTime;

        while (this.accumulator >= this.deltaTime) {
            this.update(this.deltaTime);
            this.accumulator -= this.deltaTime;
        }

        this.draw();

        this.gameLoop = requestAnimationFrame(this.loop.bind(this));
    }

    /**
     * Start the game
     */
    start() {
        this.gameLoop = requestAnimationFrame(this.loop.bind(this));
    }

    /**
     * Stop the game
     */
    stop() {
        cancelAnimationFrame(this.gameLoop);
    }
}

/**
 * Player class
 */
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 50;
        this.height = 70;
        this.vx = 0;
        this.vy = 0;
        this.speed = 400;
        this.jumpForce = 800;
        this.grounded = false;
        this.direction = 1; // 1 for right, -1 for left
        this.powered = false;
        this.state = 'idle'; // idle, running, jumping
        this.frameX = 0;
        this.frameY = 0;
        this.frameTimer = 0;
        this.frameInterval = 0.1; // 10 frames per second
    }

    /**
     * Update player state
     * @param {number} dt - Delta time in seconds
     * @param {Object} keys - Keyboard state
     * @param {number} gravity - Gravity force
     * @param {number} friction - Friction coefficient
     */
    update(dt, keys, gravity, friction) {
        // Apply horizontal movement
        if (keys.left) {
            this.vx = -this.speed;
            this.direction = -1;
            this.state = this.grounded ? 'running' : 'jumping';
        } else if (keys.right) {
            this.vx = this.speed;
            this.direction = 1;
            this.state = this.grounded ? 'running' : 'jumping';
        } else {
            this.vx *= friction;
            this.state = this.grounded ? 'idle' : 'jumping';
        }

        // Apply jumping
        if (keys.up && this.grounded) {
            this.vy = -this.jumpForce;
            this.grounded = false;
            this.state = 'jumping';
            // ASSETS.playSound('jump');
        }

        // Apply gravity
        this.vy += gravity * dt;

        // Update position
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Update animation frame
        this.updateAnimation(dt);

        // Reset grounded state (will be set to true if collision with ground is detected)
        this.grounded = false;
    }

    /**
     * Update animation frame
     * @param {number} dt - Delta time in seconds
     */
    updateAnimation(dt) {
        this.frameTimer += dt;

        if (this.frameTimer > this.frameInterval) {
            this.frameTimer = 0;

            // Update frame based on state
            if (this.state === 'idle') {
                this.frameX = (this.frameX + 1) % 4; // 4 frames for idle animation
                this.frameY = 0;
            } else if (this.state === 'running') {
                this.frameX = (this.frameX + 1) % 6; // 6 frames for running animation
                this.frameY = 1;
            } else if (this.state === 'jumping') {
                this.frameX = 0; // Single frame for jumping
                this.frameY = 2;
            }
        }
    }

    /**
     * Power up the player
     */
    powerUp() {
        this.powered = true;
        this.height = 90; // Make player taller when powered up
    }

    /**
     * Draw the player
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    draw(ctx) {
        // In a real game, we'd use sprite sheets
        // For now, just draw a colored rectangle
        ctx.fillStyle = this.powered ? '#FF0000' : '#3498db';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Draw eyes
        ctx.fillStyle = 'white';
        ctx.fillRect(this.x + (this.direction === 1 ? 30 : 10), this.y + 15, 10, 10);

        // Draw pupils
        ctx.fillStyle = 'black';
        ctx.fillRect(this.x + (this.direction === 1 ? 35 : 15), this.y + 18, 4, 4);
    }
}

/**
 * Platform class
 */
class Platform {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    /**
     * Draw the platform
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    draw(ctx) {
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Draw grass on top
        ctx.fillStyle = '#228B22';
        ctx.fillRect(this.x, this.y, this.width, 10);
    }
}

/**
 * Enemy class
 */
class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = 50;
        this.height = 50;
        this.vx = -100; // Move left by default
        this.vy = 0;
        this.direction = -1;
        this.grounded = false;
    }

    /**
     * Update enemy state
     * @param {number} dt - Delta time in seconds
     * @param {number} gravity - Gravity force
     * @param {number} friction - Friction coefficient
     */
    update(dt, gravity, friction) {
        // Apply gravity
        this.vy += gravity * dt;

        // Update position
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Reset grounded state (will be set to true if collision with ground is detected)
        this.grounded = false;
    }

    /**
     * Draw the enemy
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    draw(ctx) {
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Draw eyes
        ctx.fillStyle = 'white';
        ctx.fillRect(this.x + 10, this.y + 10, 10, 10);
        ctx.fillRect(this.x + 30, this.y + 10, 10, 10);

        // Draw pupils
        ctx.fillStyle = 'black';
        ctx.fillRect(this.x + 12, this.y + 12, 6, 6);
        ctx.fillRect(this.x + 32, this.y + 12, 6, 6);
    }
}

/**
 * Coin class
 */
class Coin {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.frameX = 0;
        this.frameTimer = 0;
        this.frameInterval = 0.1;
    }

    /**
     * Update coin animation
     * @param {number} dt - Delta time in seconds
     */
    update(dt) {
        this.frameTimer += dt;

        if (this.frameTimer > this.frameInterval) {
            this.frameTimer = 0;
            this.frameX = (this.frameX + 1) % 6; // 6 frames for coin animation
        }
    }

    /**
     * Draw the coin
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    draw(ctx) {
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
        ctx.fill();

        // Draw shine
        ctx.fillStyle = '#FFF8DC';
        ctx.beginPath();
        ctx.arc(this.x + this.width / 3, this.y + this.height / 3, this.width / 6, 0, Math.PI * 2);
        ctx.fill();
    }
}

/**
 * PowerUp class
 */
class PowerUp {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.vy = 0;
        this.frameX = 0;
        this.frameTimer = 0;
        this.frameInterval = 0.1;
    }

    /**
     * Update power-up animation
     * @param {number} dt - Delta time in seconds
     */
    update(dt) {
        this.frameTimer += dt;

        if (this.frameTimer > this.frameInterval) {
            this.frameTimer = 0;
            this.frameX = (this.frameX + 1) % 4; // 4 frames for power-up animation
        }
    }

    /**
     * Draw the power-up
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    draw(ctx) {
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Draw M letter
        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.fillText('M', this.x + 12, this.y + 28);
    }
}
