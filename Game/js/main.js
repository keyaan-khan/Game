class GameManager {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.currentGame = null;
        this.games = {};

        this.initializeCanvas();
        this.setupEventListeners();
    }

    initializeCanvas() {
        this.canvas.width = 800;
        this.canvas.height = 600;
    }

    setupEventListeners() {
        const buttons = document.querySelectorAll('.game-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const gameName = btn.dataset.game;
                this.loadGame(gameName);
            });
        });
    }

    loadGame(gameName) {
        if (this.currentGame) {
            this.currentGame.stop();
        }

        switch(gameName) {
            case 'snake':
                this.currentGame = new SnakeGame(this.canvas, this.ctx);
                break;
            case 'pong':
                this.currentGame = new PongGame(this.canvas, this.ctx);
                break;
            case 'memory':
                this.currentGame = new MemoryGame(this.canvas, this.ctx);
                break;
            case 'mario':
                this.currentGame = new MarioGame(this.canvas, this.ctx);
                break;
        }

        if (this.currentGame) {
            this.currentGame.start();
        }
    }
}

// Initialize the game manager when the page loads
window.addEventListener('load', () => {
    const gameManager = new GameManager();
});