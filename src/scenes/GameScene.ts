import Phaser from "phaser";
import { COLORS } from "./constants";
// import PauseScene from "./PauseScene";

export default class GameScene extends Phaser.Scene {
  // Constants
  private readonly GRID_SIZE = 25;
  private readonly CELL_SIZE = 20;
  private readonly MIN_SPEED = 80;
  private readonly MAX_SPEED = 500;
  private readonly DEFAULT_SPEED = 180;

  // Snake food constants
  private readonly SNAKE_FOOD = [
    "🐁",
    "🐀",
    "🐇",
    "🦎",
    "🐸",
    "🐹",
    "🦗",
    "🐜",
    "🐛",
    "🐢",
  ];

  // Game state
  private snake: { x: number; y: number }[] = [];
  private food: { x: number; y: number; emoji: string } = {
    x: 15,
    y: 15,
    emoji: "🐁",
  };
  private direction: string = "RIGHT";
  private nextDirection: string = "RIGHT"; // To prevent rapid direction changes
  private score: number = 0;
  private speed: number = this.DEFAULT_SPEED;
  private gameType: string = "classic";
  private moveTimer!: Phaser.Time.TimerEvent;
  private isPaused: boolean = false;

  // For Tetra and Bounce modes
  private foodItems: { x: number; y: number; emoji: string; id?: string }[] =
    [];
  private bounceEatenFood: number = 0;

  // UI elements
  private scoreText!: Phaser.GameObjects.Text;
  private speedText!: Phaser.GameObjects.Text;
  private titleText!: Phaser.GameObjects.Text;

  // Graphics
  private gameBoard!: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle;
  private snakeHead!: Phaser.GameObjects.Image;
  private snakeBody: Phaser.GameObjects.Image[] = [];

  private foodGraphics: Phaser.GameObjects.Text[] = [];

  constructor() {
    super("GameScene");
    this.snakeBody = [];
    this.foodGraphics = [];
  }

  preload() {
    // Snake head images
    this.load.image("head_up", "images/head_up.png");
    this.load.image("head_down", "images/head_down.png");
    this.load.image("head_left", "images/head_left.png");
    this.load.image("head_right", "images/head_right.png");

    // Body segment images
    this.load.image("body_vertical", "images/body_vertical.png");
    this.load.image("body_horizontal", "images/body_horizontal.png");
    this.load.image("body_upleft", "images/body_upleft.png");
    this.load.image("body_upright", "images/body_upright.png");
    this.load.image("body_downleft", "images/body_downleft.png");
    this.load.image("body_downright", "images/body_downright.png");

    // Tail images
    this.load.image("tail_up", "images/tail_up.png");
    this.load.image("tail_down", "images/tail_down.png");
    this.load.image("tail_left", "images/tail_left.png");
    this.load.image("tail_right", "images/tail_right.png");

    this.load.image("game-background", "images/game-background.jpg");
  }

  private readonly SNAKE_HEADS = {
    UP: "head_up",
    DOWN: "head_down",
    LEFT: "head_left",
    RIGHT: "head_right",
  };

  init() {
    // Reset the game state
    this.snake = [{ x: 5, y: 5 }]; // Initial position
    this.score = 0;
    this.speed = this.DEFAULT_SPEED;
    this.bounceEatenFood = 0;
    this.foodItems = [];

    // Get the selected game type from registry
    this.gameType = this.registry.get("gameType") || "classic";

    // Initial direction is randomly chosen
    const directions = ["UP", "DOWN", "LEFT", "RIGHT"];
    this.direction = directions[Math.floor(Math.random() * directions.length)];
    this.nextDirection = this.direction;
  }

  create() {
    const { width, height } = this.scale;
    const boardWidth = this.GRID_SIZE * this.CELL_SIZE;
    const boardHeight = this.GRID_SIZE * this.CELL_SIZE;
    const boardX = (width - boardWidth) / 2;
    const boardY = height * 0.2;

    // Create game board
    // this.gameBoard = this.add
    //   .rectangle(
    //     boardX + boardWidth / 2,
    //     boardY + boardHeight / 2,
    //     boardWidth,
    //     boardHeight,
    //     0xfff8dc
    //   )
    //   .setStrokeStyle(4, 0x1f2937);

    // Replace the plain rectangle with an image
    this.gameBoard = this.add
      .image(
        boardX + boardWidth / 2,
        boardY + boardHeight / 2,
        "game-background"
      )
      .setDisplaySize(boardWidth, boardHeight);

    // Add a border if needed
    const border = this.add
      .rectangle(
        boardX + boardWidth / 2,
        boardY + boardHeight / 2,
        boardWidth,
        boardHeight
      )
      .setStrokeStyle(4, 0x1f2937)
      .setAlpha(1);

    // Add title
    this.titleText = this.add
      .text(
        width / 2,
        boardY - 60,
        `SNAKE ${
          this.gameType.charAt(0).toUpperCase() + this.gameType.slice(1)
        }`,
        {
          fontFamily: "Arial",
          fontSize: "32px",
          color: COLORS.WHITE,
        }
      )
      .setOrigin(0.5);

    // Add UI elements
    this.scoreText = this.add
      .text(width * 0.75, boardY - 30, `Score: ${this.score}`, {
        fontFamily: "Arial",
        fontSize: "20px",
        color: COLORS.NORMAL,
      })
      .setOrigin(0.5);

    this.speedText = this.add
      .text(width * 0.25, boardY - 30, `Delay (+ -): ${this.speed}ms`, {
        fontFamily: "Arial",
        fontSize: "20px",
        color: COLORS.WHITE,
      })
      .setOrigin(0.5);

    // Set up pause button text
    const pauseButton = this.add
      .text(width - 80, 60, "Pause", {
        fontFamily: "Arial",
        fontSize: "16px",
        color: COLORS.NORMAL,
        backgroundColor: COLORS.BUTTON_BG,
        padding: { x: 10, y: 5 },
      })
      .setOrigin(0.5);

    pauseButton
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.togglePause());

    // Generate initial food
    if (this.gameType === "classic") {
      this.generateFood();
    } else {
      this.generateFoodTetra();
    }

    // Create the snake head
    this.snakeHead = this.add
      .image(
        //  .text(
        boardX + this.snake[0].x * this.CELL_SIZE + this.CELL_SIZE / 2,
        boardY + this.snake[0].y * this.CELL_SIZE + this.CELL_SIZE / 2,
        this.SNAKE_HEADS[this.direction]
        // { fontSize: "20px" }
      )
      .setOrigin(0.5);

    // Set up keyboard controls
    // this.input.keyboard.on('keydown-UP', () => {
    //   if (this.direction !== "DOWN") this.nextDirection = "UP";
    // });

    if (this.input && this.input.keyboard) {
      this.input.keyboard.on("keydown-UP", () => {
        if (this.direction !== "DOWN") this.nextDirection = "UP";
      });

      this.input.keyboard.on("keydown-DOWN", () => {
        if (this.direction !== "UP") this.nextDirection = "DOWN";
      });

      this.input.keyboard.on("keydown-LEFT", () => {
        if (this.direction !== "RIGHT") this.nextDirection = "LEFT";
      });

      this.input.keyboard.on("keydown-RIGHT", () => {
        if (this.direction !== "LEFT") this.nextDirection = "RIGHT";
      });

      this.input.keyboard.on("keydown-ESC", () => {
        this.togglePause();
      });

      this.input.keyboard.on("keydown-PLUS", () => {
        this.changeSpeed(+20); // Faster
      });

      this.input.keyboard.on("keydown-MINUS", () => {
        this.changeSpeed(-20); // Slower
      });

      // Check the moveTimer setup in create():
      this.moveTimer = this.time.addEvent({
        delay: this.speed,
        callback: this.updateSnakePosition, // Make sure this points to the right method
        callbackScope: this,
        loop: true,
      });

      // Add mobile controls if on mobile device
      if (this.sys.game.device.input.touch) {
        this.setupMobileControls();
      }
    }
  }

  private setupMobileControls(): void {
    // Create a larger swipe area over the entire game
    const swipeArea = this.add
      .rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0)
      .setOrigin(0)
      .setInteractive();

    let startX = 0;
    let startY = 0;

    swipeArea.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      startX = pointer.x;
      startY = pointer.y;
    });

    swipeArea.on("pointerup", (pointer: Phaser.Input.Pointer) => {
      const dx = pointer.x - startX;
      const dy = pointer.y - startY;

      // If it's a tap (small movement), boost speed temporarily
      if (Math.abs(dx) < 20 && Math.abs(dy) < 20) {
        this.boostSpeed();
        return;
      }

      // Determine swipe direction
      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal swipe
        if (dx > 0 && this.direction !== "LEFT") {
          this.nextDirection = "RIGHT";
        } else if (dx < 0 && this.direction !== "RIGHT") {
          this.nextDirection = "LEFT";
        }
      } else {
        // Vertical swipe
        if (dy > 0 && this.direction !== "UP") {
          this.nextDirection = "DOWN";
        } else if (dy < 0 && this.direction !== "DOWN") {
          this.nextDirection = "UP";
        }
      }
    });
  }

  private boostSpeed(): void {
    // Store original speed
    const originalSpeed = this.speed;

    // Boost speed for 1 second
    this.changeSpeed(+20);

    // Restore original speed after 1 second
    this.time.delayedCall(1000, () => {
      this.speed = originalSpeed;
      this.updateSpeedText();

      // Update the move timer
      if (this.moveTimer) {
        this.moveTimer.remove();
        this.moveTimer = this.time.addEvent({
          delay: this.speed,
          callback: this.updateSnakePosition,
          callbackScope: this,
          loop: true,
        });
      }
    });
  }

  private changeSpeed(amount: number): void {
    const targetSpeed = Phaser.Math.Clamp(
      this.speed + amount,
      this.MIN_SPEED,
      this.MAX_SPEED
    );

    // Only proceed if there's an actual change
    if (targetSpeed === this.speed) return;

    // Create a tween for smooth speed transition
    this.tweens.add({
      targets: this,
      speed: targetSpeed,
      duration: 200, // 200ms transition
      ease: "Sine.easeInOut",
      onUpdate: () => {
        // Update the move timer and text on each tween update
        if (this.moveTimer) {
          this.moveTimer.remove();
          this.moveTimer = this.time.addEvent({
            delay: this.speed,
            callback: this.updateSnakePosition,
            callbackScope: this,
            loop: true,
          });
        }
        this.updateSpeedText();
      },
    });
  }

  private updateSpeedText(): void {
    const roundedSpeed = Math.round(this.speed);
    this.speedText.setText(`Delay (+ -): ${roundedSpeed}ms`);
  }

  private togglePause(): void {
    this.isPaused = !this.isPaused;

    if (this.isPaused) {
      // Pause the timer
      this.moveTimer.paused = true;

      // Show pause dialog
      this.scene.launch("PauseScene");
      this.scene.pause();
    } else {
      // Resume the timer
      this.moveTimer.paused = false;
    }
  }

  private generateFood(): void {
    // Remove current food graphic
    this.clearFoodGraphics();

    // Generate food position that's not on the snake
    let validPosition = false;
    while (!validPosition) {
      // +1 and -2 to keep food away from the edges
      this.food = {
        x: Math.floor(Math.random() * (this.GRID_SIZE - 2)) + 1,
        y: Math.floor(Math.random() * (this.GRID_SIZE - 2)) + 1,
        emoji:
          this.SNAKE_FOOD[Math.floor(Math.random() * this.SNAKE_FOOD.length)],
      };

      // Check if food is on snake
      validPosition = !this.snake.some(
        (segment) => segment.x === this.food.x && segment.y === this.food.y
      );
    }

    // Create food graphic
    const boardX = (this.scale.width - this.GRID_SIZE * this.CELL_SIZE) / 2;
    const boardY = this.scale.height * 0.2;

    const foodGraphic = this.add
      .text(
        boardX + this.food.x * this.CELL_SIZE + this.CELL_SIZE / 2,
        boardY + this.food.y * this.CELL_SIZE + this.CELL_SIZE / 2,
        this.food.emoji,
        { fontSize: "20px" }
      )
      .setOrigin(0.5);

    this.foodGraphics.push(foodGraphic);
  }

  // TETROMINO SHAPES for Tetra mode
  private readonly TETROMINO_SHAPES = {
    I: [[1, 1, 1, 1]],
    J: [
      [1, 0, 0],
      [1, 1, 1],
    ],
    L: [
      [0, 0, 1],
      [1, 1, 1],
    ],
    O: [
      [1, 1],
      [1, 1],
    ],
    S: [
      [0, 1, 1],
      [1, 1, 0],
    ],
    T: [
      [0, 1, 0],
      [1, 1, 1],
    ],
    Z: [
      [1, 1, 0],
      [0, 1, 1],
    ],
  };

  private rotateShape(shape: number[][], times: number = 1): number[][] {
    let rotated = [...shape];
    for (let i = 0; i < times; i++) {
      rotated = rotated[0].map((_, colIndex) =>
        rotated.map((row) => row[colIndex]).reverse()
      );
    }
    return rotated;
  }

  private generateFoodTetra(): void {
    // Clear any existing food
    this.clearFoodGraphics();

    // Get random tetromino shape
    const shapeKeys = Object.keys(this.TETROMINO_SHAPES);
    const randomShapeKey =
      shapeKeys[Math.floor(Math.random() * shapeKeys.length)];
    const originalShape = this.TETROMINO_SHAPES[randomShapeKey];

    // Rotate the shape randomly 0-3 times
    const rotationCount = Math.floor(Math.random() * 4);
    const rotatedShape = this.rotateShape(originalShape, rotationCount);
    const foodEmoji =
      this.SNAKE_FOOD[Math.floor(Math.random() * this.SNAKE_FOOD.length)];

    // Initial position (keep away from borders)
    let posX =
      Math.floor(
        Math.random() * (this.GRID_SIZE - rotatedShape[0].length - 4)
      ) + 2;
    let posY =
      Math.floor(Math.random() * (this.GRID_SIZE - rotatedShape.length - 4)) +
      2;

    // Adjust position if needed to avoid snake
    let isOverlapping = true;
    let attempts = 0;
    const maxAttempts = 10;

    while (isOverlapping && attempts < maxAttempts) {
      isOverlapping = false;

      // Check each cell of the shape
      for (let y = 0; y < rotatedShape.length; y++) {
        for (let x = 0; x < rotatedShape[y].length; x++) {
          if (rotatedShape[y][x]) {
            const foodX = posX + x;
            const foodY = posY + y;

            // Check if position is valid
            if (
              foodX < 0 ||
              foodX >= this.GRID_SIZE ||
              foodY < 0 ||
              foodY >= this.GRID_SIZE ||
              this.snake.some(
                (segment) => segment.x === foodX && segment.y === foodY
              )
            ) {
              isOverlapping = true;
              posX =
                Math.floor(
                  Math.random() * (this.GRID_SIZE - rotatedShape[0].length - 4)
                ) + 2;
              posY =
                Math.floor(
                  Math.random() * (this.GRID_SIZE - rotatedShape.length - 4)
                ) + 2;
              break;
            }
          }
        }
        if (isOverlapping) break;
      }

      attempts++;
    }

    // Create food items array and graphics
    this.foodItems = [];
    const boardX = (this.scale.width - this.GRID_SIZE * this.CELL_SIZE) / 2;
    const boardY = this.scale.height * 0.2;

    for (let y = 0; y < rotatedShape.length; y++) {
      for (let x = 0; x < rotatedShape[y].length; x++) {
        if (rotatedShape[y][x]) {
          const foodX = posX + x;
          const foodY = posY + y;

          // Add to food items array
          this.foodItems.push({
            x: foodX,
            y: foodY,
            emoji: foodEmoji,
            id: `food-${foodX}-${foodY}-${Date.now()}`,
          });

          // Create food graphic
          const foodGraphic = this.add
            .text(
              boardX + foodX * this.CELL_SIZE + this.CELL_SIZE / 2,
              boardY + foodY * this.CELL_SIZE + this.CELL_SIZE / 2,
              foodEmoji,
              { fontSize: "20px" }
            )
            .setOrigin(0.5);

          this.foodGraphics.push(foodGraphic);
        }
      }
    }
  }

  private clearFoodGraphics(): void {
    this.foodGraphics.forEach((graphic) => graphic.destroy());
    this.foodGraphics = [];
  }

  private updateSnakePosition(): void {
    // Apply buffered direction change
    this.direction = this.nextDirection;

    // Calculate new head position
    const head = { ...this.snake[0] };

    switch (this.direction) {
      case "UP":
        head.y -= 1;
        break;
      case "DOWN":
        head.y += 1;
        break;
      case "LEFT":
        head.x -= 1;
        break;
      case "RIGHT":
        head.x += 1;
        break;
    }

    // Check for collisions
    if (this.checkCollision(head)) {
      this.handleGameOver(head);
      return;
    }

    // Add new head to snake
    this.snake.unshift(head);
    // console.log("================ Snake length = ", this.snake.length);

    // Check if food is eaten
    let foodEaten = false;

    if (this.gameType === "classic") {
      if (head.x === this.food.x && head.y === this.food.y) {
        foodEaten = true;
        this.score++;
        this.scoreText.setText(`Score: ${this.score}`);
        this.generateFood();
      }
    } else {
      // For tetra and bounce modes
      const eatenFoodIndex = this.foodItems.findIndex(
        (foodItem) => foodItem.x === head.x && foodItem.y === head.y
      );

      if (eatenFoodIndex !== -1) {
        // Bounce mode special rules
        if (this.gameType === "bounce" && this.bounceEatenFood >= 1) {
          this.handleGameOver(head, "consecutive-food");
          return;
        }

        foodEaten = true;
        this.score++;
        this.scoreText.setText(`Score: ${this.score}`);

        // Remove eaten food from arrays and graphics
        this.foodItems.splice(eatenFoodIndex, 1);
        if (this.foodGraphics[eatenFoodIndex]) {
          this.foodGraphics[eatenFoodIndex].destroy();
          this.foodGraphics.splice(eatenFoodIndex, 1);
        }

        this.bounceEatenFood = this.gameType === "bounce" ? 1 : 0;

        // Generate new tetromino if all food is eaten
        if (this.foodItems.length === 0) {
          this.generateFoodTetra();
        }
      } else {
        this.bounceEatenFood = 0;
      }
    }

    // If no food eaten, remove the tail
    if (!foodEaten) {
      this.snake.pop();
    }

    // Update snake visuals
    this.updateSnakeGraphics();
  }

  private checkCollision(head: { x: number; y: number }): boolean {
    // Check boundary collision
    if (
      head.x < 0 ||
      head.x >= this.GRID_SIZE ||
      head.y < 0 ||
      head.y >= this.GRID_SIZE
    ) {
      return true;
    }

    // Check self-collision (skip the tail which will be removed)
    for (let i = 0; i < this.snake.length - 1; i++) {
      if (this.snake[i].x === head.x && this.snake[i].y === head.y) {
        return true;
      }
    }

    return false;
  }

  private handleGameOver(
    head: { x: number; y: number },
    reason: string = "collision"
  ): void {
    // Stop the game loop
    if (this.moveTimer) {
      this.moveTimer.remove();
    }

    // Create explosion effect at collision point
    this.createExplosionEffect(head.x, head.y);

    // Wait for explosion animation, then show game over
    this.time.delayedCall(1500, () => {
      // Store the final score in registry to pass to GameOverScene
      this.registry.set("score", this.score);

      // Switch to game over scene
      this.scene.start("GameOverScene");
    });
  }

  private createExplosionEffect(x: number, y: number): void {
    const boardX = (this.scale.width - this.GRID_SIZE * this.CELL_SIZE) / 2;
    const boardY = this.scale.height * 0.2;
    const centerX = boardX + x * this.CELL_SIZE + this.CELL_SIZE / 2;
    const centerY = boardY + y * this.CELL_SIZE + this.CELL_SIZE / 2;

    // Create explosion center
    const explosion = this.add.circle(
      centerX,
      centerY,
      this.CELL_SIZE / 2,
      0xff4500
    );

    // Create rays
    const rays: Phaser.GameObjects.Rectangle[] = [];
    const rayCount = 8;

    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2;
      const ray = this.add.rectangle(centerX, centerY, 4, 0, 0xff4500);
      ray.setAngle(angle * (180 / Math.PI));
      rays.push(ray);
    }

    // Animate explosion
    this.tweens.add({
      targets: explosion,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 1500,
      ease: "Power2",
    });

    // Animate rays
    rays.forEach((ray, i) => {
      const angle = (i / rayCount) * Math.PI * 2;
      const distance = this.CELL_SIZE * 3;

      this.tweens.add({
        targets: ray,
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance,
        height: this.CELL_SIZE * 1.5,
        alpha: 0,
        duration: 1500,
        ease: "Power2",
      });
    });
  }

  update(time: number, delta: number): void {
    // Skip if paused or game over
    if (this.isPaused) {
      return;
    }
  }

  private updateSnakeGraphics(): void {
    const boardX = (this.scale.width - this.GRID_SIZE * this.CELL_SIZE) / 2;
    const boardY = this.scale.height * 0.2;

    // Update snake head texture and position
    this.snakeHead.setTexture(this.SNAKE_HEADS[this.direction]);
    this.snakeHead.setPosition(
      boardX + this.snake[0].x * this.CELL_SIZE + this.CELL_SIZE / 2,
      boardY + this.snake[0].y * this.CELL_SIZE + this.CELL_SIZE / 2
    );
    this.snakeHead.setScale(0.5);

    // 1. First, adjust the number of body segments as needed
    let snakeChanged = false;

    // Remove extra segments if the snake got shorter
    while (this.snakeBody.length > this.snake.length - 1) {
      const segment = this.snakeBody.pop();
      if (segment) segment.destroy();
      snakeChanged = true;
    }

    // Add new segments if needed
    while (this.snakeBody.length < this.snake.length - 1) {
      const i = this.snakeBody.length + 1; // +1 because index 0 is the head
      // Default to horizontal body segment
      const segment = this.add
        .image(
          boardX + this.snake[i].x * this.CELL_SIZE + this.CELL_SIZE / 2,
          boardY + this.snake[i].y * this.CELL_SIZE + this.CELL_SIZE / 2,
          "body_horizontal"
        )
        .setOrigin(0.5)
        .setScale(0.5);

      this.snakeBody.push(segment);
      snakeChanged = true;
    }

    // 2. Update positions and store each segment's current texture
    const currentTextures: string[] = [];
    for (let i = 0; i < this.snakeBody.length; i++) {
      const segmentIndex = i + 1;

      // Store current texture before updating
      currentTextures[i] = this.snakeBody[i].texture.key as string;

      // Update position
      this.snakeBody[i].setPosition(
        boardX +
          this.snake[segmentIndex].x * this.CELL_SIZE +
          this.CELL_SIZE / 2,
        boardY +
          this.snake[segmentIndex].y * this.CELL_SIZE +
          this.CELL_SIZE / 2
      );
    }

    // 3. Calculate new textures for all segments
    const newTextures: string[] = [];

    // Calculate all segment textures
    for (let i = 0; i < this.snakeBody.length; i++) {
      const segmentIndex = i + 1;

      if (i === this.snakeBody.length - 1) {
        // This is the tail
        newTextures[i] = this.getTailTexture(segmentIndex);
      } else {
        // This is a body segment
        newTextures[i] = this.getBodyTexture(segmentIndex);
      }
    }

    // 4. Only apply texture changes when necessary to avoid flickering
    for (let i = 0; i < this.snakeBody.length; i++) {
      // Always update textures if the snake changed length or
      // if the texture needs to change
      if (snakeChanged || currentTextures[i] !== newTextures[i]) {
        this.snakeBody[i].setTexture(newTextures[i]);
      }
    }
  }
  // Helper method to determine tail texture
  private getTailTexture(bodyIndex: number): string {
    // For a tail, we need to look at the segment before it
    const tailPos = this.snake[bodyIndex];
    const beforeTailPos = this.snake[bodyIndex - 1];

    // Determine direction based on how the tail connects to the segment before it
    if (beforeTailPos.x < tailPos.x) {
      return "tail_right";
    }
    if (beforeTailPos.x > tailPos.x) {
      return "tail_left";
    }
    if (beforeTailPos.y < tailPos.y) {
      return "tail_down";
    }

    return "tail_up";
  }

  private getBodyTexture(segmentIndex: number): string {
    // We need at least 3 segments to calculate this properly (current segment, one before, one after)
    if (segmentIndex === 0 || segmentIndex >= this.snake.length - 1) {
      return "body_horizontal"; // Default fallback texture
    }

    const deltaX =
      this.snake[segmentIndex - 1].x - this.snake[segmentIndex + 1].x;
    const deltaY =
      this.snake[segmentIndex - 1].y - this.snake[segmentIndex + 1].y;
    // const deltaY3 = this.snake[segmentIndex].y - this.snake[segmentIndex + 1].y;
    // const deltaY2 = this.snake[segmentIndex - 1].y - this.snake[segmentIndex].y;

    if (deltaX === 0) {
      return "body_vertical";
    } else if (deltaX === -2 || deltaX === 2) {
      return "body_horizontal";
    } else {
      // deltaX === +-1
      const deltaY2 =
        this.snake[segmentIndex - 1].y - this.snake[segmentIndex].y;
      // ========= deltaX === 1  =========
      if (deltaX === 1) {
        if (deltaY === 1) {
          if (deltaY2 === 0) {
            return "body_downleft";
          } else {
            return "body_upright";
          }
        } else if (deltaY === -1) {
          if (deltaY2 === 0) {
            return "body_upleft";
          } else {
            return "body_downright";
          }
        } else {
          // Fallback (should not happen if snake movement is valid)
          return "body_horizontal";
        }
        // ========= deltaX === -1  =========
      } else if (deltaX === -1) {
        if (deltaY === 1) {
          if (deltaY2 === 0) {
            return "body_downright";
          } else {
            return "body_upleft";
          }
        } else if (deltaY === -1) {
          if (deltaY2 === 0) {
            return "body_upright";
          } else {
            // deltaX = -1, deltaY = -1, deltaY2 = 0
            return "body_downleft";
          }
        } else {
          // Fallback (should not happen if snake movement is valid)
          return "body_horizontal";
        }
      }
      return "body_horizontal"; // Final fallback
    } // deltaX === -1
  }
}
