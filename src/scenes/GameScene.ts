import Phaser from "phaser";
import { COLORS } from "./constants";
// import PauseScene from "./PauseScene";

export default class GameScene extends Phaser.Scene {
  private gameBoard!: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle;
  private controlsContainer!: Phaser.GameObjects.Container;

  // Constants
  private readonly MIN_SPEED = 80;
  private readonly MAX_SPEED = 500;
  private readonly DEFAULT_SPEED = 180;
  private readonly GRID_SIZE = 20;
  private readonly CELL_SIZE = 20;

  // Positioning constants (percentages)
  private readonly BOARD_Y_PERCENT = 0.25; // Board Y position as percentage of screen height
  private readonly TITLE_Y_PERCENT = 0.1; // Title Y position
  private readonly UI_Y_PERCENT = 0.2; // UI elements Y position

  private cellSize = 20;

  private isMobile: boolean = false;

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
  private snakeHead!: Phaser.GameObjects.Image;
  private snakeBody: Phaser.GameObjects.Image[] = [];
  // A container for all button elements
  //private buttonGroup: Phaser.GameObjects.Group | null = null;
  //private buttonGroup = this.add.group();

  private foodGraphics: Phaser.GameObjects.Text[] = [];
  private speedDownBtn!: Phaser.GameObjects.Text;
  private speedUpBtn!: Phaser.GameObjects.Text;
  private pauseBtn!: Phaser.GameObjects.Text;

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

    this.load.image("game-background", "images/game-background.png");
  }

  private readonly SNAKE_HEADS = {
    UP: "head_up",
    DOWN: "head_down",
    LEFT: "head_left",
    RIGHT: "head_right",
  };

  init() {
    // Reset the game state
    this.snake = [{ x: 12, y: 12 }]; // Initial position
    this.score = 0;
    this.bounceEatenFood = 0;
    this.foodItems = [];

    this.speed = this.registry.get("lastSpeed") || this.DEFAULT_SPEED;
    let selectedGameType = this.registry.get("gameType");
    if (!selectedGameType) {
      selectedGameType = this.registry.get("lastGameType");
    }
    this.gameType = selectedGameType || "classic";

    // Initial direction is randomly chosen
    const directions = ["UP", "DOWN", "LEFT", "RIGHT"];
    this.direction = directions[Math.floor(Math.random() * directions.length)];
    this.nextDirection = this.direction;
  }

  create() {
    const { width, height } = this.scale;

    // Calculate board dimensions
    const boardWidth = this.GRID_SIZE * this.CELL_SIZE;
    const boardHeight = this.GRID_SIZE * this.CELL_SIZE;
    const boardX = (width - boardWidth) / 2;
    const boardY = height * this.BOARD_Y_PERCENT;

    // Create game board with an image
    this.gameBoard = this.add
      .image(width * 0.5, boardY + boardHeight / 2, "game-background")
      .setDisplaySize(boardWidth, boardHeight);

    // Add a border
    // const border = this.add
    //   .rectangle(width * 0.5, boardY + boardHeight / 2, boardWidth, boardHeight)
    //   .setStrokeStyle(4, 0x1f2937)
    //   .setAlpha(1)
    //   .setName("border");

    this.setupSwipeArea();
    this.setupTouchPrevention();

    this.updateControlsVisibility();

    // Add title
    this.titleText = this.add
      .text(
        width * 0.5,
        height * this.TITLE_Y_PERCENT,
        `SNAKE ${
          this.gameType.charAt(0).toUpperCase() + this.gameType.slice(1)
        }`,
        { fontFamily: "Arial", fontSize: "48px", color: COLORS.WHITE }
      )
      .setOrigin(0.5);

    const uiFontSize = Math.min(16, Math.floor(width / 50));

    // Speed up button right next to speed down button
    this.speedUpBtn = this.add
      .text(boardX + width * 0.005, height * this.UI_Y_PERCENT, "◀", {
        fontFamily: "Arial",
        fontSize: `${uiFontSize}px`,
        color: COLORS.NORMAL,
        backgroundColor: COLORS.BUTTON_BG,
        padding: { x: 10, y: 5 },
      })
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        this.changeSpeed(+20);
        this.speedUpBtn.setBackgroundColor("0x007700"); // Darker green when pressed
      })
      .on("pointerup", () => {
        this.speedUpBtn.setBackgroundColor(COLORS.BUTTON_BG); // Back to normal
      })
      .on("pointerout", () => {
        this.speedUpBtn.setBackgroundColor(COLORS.BUTTON_BG); // Back to normal if pointer moves out
      });

    // Speed down button
    this.speedDownBtn = this.add
      .text(
        boardX + this.speedUpBtn.width + width * 0.015,
        //boardX + width * 0.005, // Small gap after "Delay:"
        height * this.UI_Y_PERCENT,
        "▶",
        {
          fontFamily: "Arial",
          fontSize: `${uiFontSize}px`,
          color: COLORS.NORMAL,
          backgroundColor: COLORS.BUTTON_BG,
          padding: { x: 10, y: 5 },
        }
      )
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        this.changeSpeed(-20);
        this.speedDownBtn.setBackgroundColor("0x007700"); // Darker green when pressed
      })
      .on("pointerup", () => {
        this.speedDownBtn.setBackgroundColor(COLORS.BUTTON_BG); // Back to normal
      })
      .on("pointerout", () => {
        this.speedDownBtn.setBackgroundColor(COLORS.BUTTON_BG); // Back to normal if pointer moves out
      });

    this.scoreText = this.add
      .text(width * 0.5, height * this.UI_Y_PERCENT, `${this.score}`, {
        fontFamily: "Arial",
        fontSize: `${uiFontSize}px`,
        color: COLORS.NORMAL,
        backgroundColor: COLORS.BUTTON_BG,
        padding: { x: 10, y: 5 },
      })
      .setOrigin(0.5)
      .setName("scoreText");

    // Set up pause button text (right aligned) - match font size with other UI elements
    this.pauseBtn = this.add
      .text(boardX + boardWidth, height * this.UI_Y_PERCENT, "Pause", {
        fontFamily: "Arial",
        fontSize: `${uiFontSize}px`,
        color: COLORS.NORMAL,
        backgroundColor: COLORS.BUTTON_BG,
        padding: { x: 10, y: 5 },
      })
      .setOrigin(1, 0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        this.togglePause();
        this.pauseBtn.setBackgroundColor("0x007700"); // Darker green when pressed
      })
      .on("pointerup", () => {
        this.pauseBtn.setBackgroundColor(COLORS.BUTTON_BG); // Back to normal
      })
      .on("pointerout", () => {
        this.pauseBtn.setBackgroundColor(COLORS.BUTTON_BG); // Back to normal if pointer moves out
      })
      .setName("pauseBtn");

    // Generate initial food
    if (this.gameType === "classic") {
      this.generateFood();
    } else {
      this.generateFoodTetra();
    }

    // Create the snake head
    this.snakeHead = this.add
      .image(
        boardX + this.snake[0].x * this.CELL_SIZE + this.CELL_SIZE / 2,
        boardY + this.snake[0].y * this.CELL_SIZE + this.CELL_SIZE / 2,
        this.SNAKE_HEADS[this.direction]
      )
      .setOrigin(0.5);

    //========== 2. Set up keyboard controls
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
      // Setup directional buttons
      this.setupMobileButtons();

      //========== 3. Mobiles processing
      this.isMobile =
        !this.sys.game.device.os.desktop ||
        // Don't use input.touch directly as it's causing an error
        this.sys.game.device.input.touch ||
        window.innerWidth < 800;

      this.scale.on("resize", this.resize, this);
      this.resize();
    }
  }

  //========== SWIPE processing
  private setupTouchPrevention(): void {
    try {
      // Get the canvas element
      const canvas = this.sys.game.canvas;

      // Prevent default touchmove behavior to stop screen scrolling/bouncing
      canvas.addEventListener(
        "touchmove",
        function (e) {
          e.preventDefault();
        },
        { passive: false }
      );

      // Also prevent touchstart default behavior
      canvas.addEventListener(
        "touchstart",
        function (e) {
          e.preventDefault();
        },
        { passive: false }
      );
    } catch (error) {
      console.warn("Could not set up touch prevention:", error);
    }
  }

  private setupSwipeArea(): void {
    // Create a swipe area over the entire game
    const swipeArea = this.add
      .rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0)
      .setOrigin(0)
      .setInteractive();

    // Simplified swipe logic with better parameters
    let startX = 0;
    let startY = 0;
    let isProcessingSwipe = false;

    // Adaptive swipe threshold based on screen size
    const swipeThreshold = 30; //Math.max(30,Math.min(this.scale.width, this.scale.height) * 0.05 );

    // On pointer down, record the start position
    swipeArea.on("pointerdown", (pointer) => {
      startX = pointer.x;
      startY = pointer.y;
      isProcessingSwipe = false;
    });

    // Track pointer move for swipe detection
    swipeArea.on("pointermove", (pointer) => {
      // Only process if we have valid start position and not already processed
      if (startX !== 0 && startY !== 0 && !isProcessingSwipe) {
        const swipeX = pointer.x - startX;
        const swipeY = pointer.y - startY;

        // Process if swipe is significant enough
        if (
          Math.abs(swipeX) > swipeThreshold ||
          Math.abs(swipeY) > swipeThreshold
        ) {
          isProcessingSwipe = true;

          // Determine swipe direction based on which axis has larger movement
          if (Math.abs(swipeX) > Math.abs(swipeY)) {
            // Horizontal swipe
            if (swipeX > 0) {
              if (this.direction !== "LEFT") this.nextDirection = "RIGHT";
            } else {
              if (this.direction !== "RIGHT") this.nextDirection = "LEFT";
            }
          } else {
            // Vertical swipe
            if (swipeY > 0) {
              if (this.direction !== "UP") this.nextDirection = "DOWN";
            } else {
              if (this.direction !== "DOWN") this.nextDirection = "UP";
            }
          }
        }
      }
    });

    // Reset on pointer up
    swipeArea.on("pointerup", () => {
      startX = 0;
      startY = 0;
      isProcessingSwipe = false;
    });

    // Reset on pointer out
    swipeArea.on("pointerout", () => {
      startX = 0;
      startY = 0;
      isProcessingSwipe = false;
    });

    // Prevent default behavior to avoid screen jerking
    this.input.on("pointermove", (pointer) => {
      if (pointer.isDown) {
        pointer.event.preventDefault();
      }
    });

    // Set up touch prevention for smoother mobile experience
    this.setupTouchPrevention();
  }

  private setupMobileButtons(): void {
    const { width, height } = this.scale;
    const boardWidth = this.GRID_SIZE * this.cellSize;
    const boardHeight = this.GRID_SIZE * this.cellSize;
    const boardX = (width - boardWidth) / 2;
    const boardY = height * this.BOARD_Y_PERCENT;

    // Use 18% of board width for button size instead of 10%
    const buttonSize = boardWidth * 0.18;
    const standardPadding = buttonSize * 0.2;
    const padding = standardPadding + 15;

    // Create container at the bottom-right corner of the game board
    this.controlsContainer = this.add.container(
      (boardX + boardWidth - buttonSize * 1.6) * 0.95,
      (boardY + boardHeight - buttonSize * 1.6) * 0.95
    );

    // Larger background circle
    const controlsBg = this.add.circle(
      0,
      0, // Center of container
      buttonSize * 2.2, // Larger radius
      0x000000,
      0.15
    );
    this.controlsContainer.add(controlsBg);

    // UP button
    const upButton = this.add
      .rectangle(
        0,
        -buttonSize - padding,
        buttonSize,
        buttonSize,
        0x558eda,
        0.5
      )
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        if (this.direction !== "DOWN") this.nextDirection = "UP";
      });

    // Larger text
    const upText = this.add
      .text(0, -buttonSize - padding, "↑", {
        fontSize: buttonSize * 2.0, // Larger text
        color: "#FFFFFF",
      })
      .setOrigin(0.5);

    // DOWN button (similar changes for other buttons)
    const downButton = this.add
      .rectangle(0, buttonSize + padding, buttonSize, buttonSize, 0x558eda, 0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        if (this.direction !== "UP") this.nextDirection = "DOWN";
      });

    const downText = this.add
      .text(0, buttonSize + padding, "↓", {
        fontSize: buttonSize * 2.0,
        color: "#FFFFFF",
      })
      .setOrigin(0.5);

    // LEFT button
    const leftButton = this.add
      .rectangle(
        -buttonSize - padding,
        0,
        buttonSize,
        buttonSize,
        0x558eda,
        0.5
      )
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        if (this.direction !== "RIGHT") this.nextDirection = "LEFT";
      });

    const leftText = this.add
      .text(-buttonSize - padding, 0, "←", {
        fontSize: buttonSize * 2.0,
        color: "#FFFFFF",
      })
      .setOrigin(0.5);

    // RIGHT button
    const rightButton = this.add
      .rectangle(
        buttonSize + padding + 20,
        0,
        buttonSize,
        buttonSize,
        0x558eda,
        0.5
      )
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        if (this.direction !== "LEFT") this.nextDirection = "RIGHT";
      });

    const rightText = this.add
      .text(buttonSize + padding + 20, 0, "→", {
        fontSize: buttonSize * 2.0,
        color: "#FFFFFF",
      })
      .setOrigin(0.5);

    // Add all elements to the container
    this.controlsContainer.add([
      upButton,
      upText,
      downButton,
      downText,
      leftButton,
      leftText,
      rightButton,
      rightText,
    ]);

    // Add visual feedback on press for each button
    [upButton, downButton, leftButton, rightButton].forEach((button) => {
      button.on("pointerdown", () => {
        button.setFillStyle(0x73f9a4, 0.9); // Darker green when pressed
      });
      button.on("pointerup", () => {
        button.setFillStyle(0x558eda, 0.5); // Back to normal
      });
      button.on("pointerout", () => {
        button.setFillStyle(0x558eda, 0.5); // Back to normal if pointer moves out
      });
    });

    // Make directional buttons more visible
    this.controlsContainer.setAlpha(0.2); // Opacity
  }

  private updateControlsVisibility(): void {
    // Determine if we're on a mobile device
    this.isMobile =
      !this.sys.game.device.os.desktop ||
      this.sys.game.device.input.touch ||
      window.innerWidth < 800;

    // Set container visibility (show for mobile, hide for desktop)
    if (this.controlsContainer) {
      // For testing - visible for all devices
      // this.controlsContainer.setVisible(true);
      this.controlsContainer.setVisible(this.isMobile);
    }
  }

  //========= Resizing
  private resize(): void {
    // Skip the resize function completely if we're in game over state
    if (this.isPaused) {
      return;
    }

    const { width, height } = this.scale;

    // Calculate responsive grid size
    this.cellSize = Math.floor(Math.min(width / 45, height / 45) * 1.0);
    let speedPauseFontSize = Math.max(28, Math.floor(width / 50));

    let boardWidth = this.GRID_SIZE * this.cellSize;

    const isMobile =
      !this.sys.game.device.os.desktop ||
      this.sys.game.device.input.touch ||
      window.innerWidth < 800;

    if (isMobile) {
      // For mobile, adjust cell size to make board take 95% of screen width
      const targetBoardWidth = width * 0.95;
      const newCellSize = targetBoardWidth / this.GRID_SIZE;
      this.cellSize = newCellSize;
      boardWidth = targetBoardWidth;
    }

    this.isMobile = isMobile;

    const boardHeight = this.GRID_SIZE * this.cellSize;
    const boardX = (width - boardWidth) / 2;
    const boardY = height * this.BOARD_Y_PERCENT;

    // Update board position and size
    if (this.gameBoard) {
      this.gameBoard.setPosition(width * 0.5, boardY + boardHeight * 0.5);
      this.gameBoard.setDisplaySize(boardWidth, boardHeight);
    }

    // Resize UI elements with percentage-based positioning
    if (this.titleText) {
      this.titleText.setPosition(width * 0.5, height * this.TITLE_Y_PERCENT);
      this.titleText.setFontSize(1.8 * speedPauseFontSize);
    }

    if (this.speedUpBtn) {
      this.speedUpBtn.setPosition(
        boardX + width * 0.005,
        height * this.UI_Y_PERCENT
      );
      this.speedUpBtn.setFontSize(speedPauseFontSize);

      if (this.speedDownBtn) {
        this.speedDownBtn.setPosition(
          //boardX + width * 0.005,
          boardX + this.speedUpBtn.width + width * 0.015,
          height * this.UI_Y_PERCENT
        );
        this.speedDownBtn.setFontSize(speedPauseFontSize);
      }

      if (this.scoreText) {
        this.scoreText.setPosition(width * 0.5, height * this.UI_Y_PERCENT);
        this.scoreText.setFontSize(speedPauseFontSize);
      }

      if (this.pauseBtn) {
        this.pauseBtn.setPosition(
          boardX + boardWidth,
          height * this.UI_Y_PERCENT
        );
        this.pauseBtn.setFontSize(speedPauseFontSize);
      }

      // MOBILE Arrow Keys
      if (this.controlsContainer) {
        //if (this.isMobile && this.controlsContainer) {
        const buttonSize = boardWidth * 0.18;
        const padding = 0; //buttonSize * 0.2;

        this.controlsContainer.setPosition(
          (boardX + boardWidth - buttonSize * 1.6) * 0.9,
          (boardY + boardHeight - buttonSize * 1.6) * 0.9
        );

        if (this.controlsContainer.length > 0) {
          // Background circle
          const controlsBg = this.controlsContainer.getAt(
            0
          ) as Phaser.GameObjects.Arc;
          if (controlsBg && typeof controlsBg.setRadius === "function") {
            // Make background larger to fit the larger buttons
            controlsBg.setRadius(buttonSize * 2.2);
            controlsBg.setAlpha(0.2);
          }

          // Update directional buttons and text with larger sizes
          if (this.controlsContainer.length > 1) {
            // UP button
            const upButton = this.controlsContainer.getAt(
              1
            ) as Phaser.GameObjects.Rectangle;
            if (upButton) {
              upButton.setSize(buttonSize, buttonSize);
              upButton.setPosition(0, -buttonSize - padding);
            }

            const upText = this.controlsContainer.getAt(
              2
            ) as Phaser.GameObjects.Text;
            if (upText) {
              // Make text larger
              upText.setFontSize(buttonSize * 1.2);
              upText.setPosition(0, -buttonSize - padding - 10);
            }

            // DOWN button
            const downButton = this.controlsContainer.getAt(
              3
            ) as Phaser.GameObjects.Rectangle;
            if (downButton) {
              downButton.setSize(buttonSize, buttonSize);
              downButton.setPosition(0, buttonSize + padding);
            }

            const downText = this.controlsContainer.getAt(
              4
            ) as Phaser.GameObjects.Text;
            if (downText) {
              downText.setFontSize(buttonSize * 1.2);
              downText.setPosition(0, buttonSize + padding - 10);
            }

            // LEFT button
            const leftButton = this.controlsContainer.getAt(
              5
            ) as Phaser.GameObjects.Rectangle;
            if (leftButton) {
              leftButton.setSize(buttonSize, buttonSize);
              leftButton.setPosition(-buttonSize - padding, 0);
            }

            const leftText = this.controlsContainer.getAt(
              6
            ) as Phaser.GameObjects.Text;
            if (leftText) {
              leftText.setFontSize(buttonSize * 1.2);
              leftText.setPosition(-buttonSize - padding, -10);
            }

            // RIGHT button
            const rightButton = this.controlsContainer.getAt(
              7
            ) as Phaser.GameObjects.Rectangle;
            if (rightButton) {
              rightButton.setSize(buttonSize, buttonSize);
              rightButton.setPosition(buttonSize + padding, 0);
            }

            const rightText = this.controlsContainer.getAt(
              8
            ) as Phaser.GameObjects.Text;
            if (rightText) {
              rightText.setFontSize(buttonSize * 1.2);
              rightText.setPosition(buttonSize + padding, -10);
            }
          }
        }
        this.updateControlsVisibility();
        this.controlsContainer.setAlpha(0.2); // Opacity
      }

      this.updateSnakeGraphics();
      this.updateFoodGraphics();
    }
  }

  private updateFoodGraphics(): void {
    const { width, height } = this.scale;
    const boardX = (width - this.GRID_SIZE * this.cellSize) / 2;
    const boardY = height * this.BOARD_Y_PERCENT;

    // Update food graphics positions
    this.foodGraphics.forEach((graphic, i) => {
      let foodX, foodY;

      if (this.gameType === "classic") {
        foodX = this.food.x;
        foodY = this.food.y;
      } else {
        foodX = this.foodItems[i]?.x || 0;
        foodY = this.foodItems[i]?.y || 0;
      }

      graphic.setPosition(
        boardX + foodX * this.cellSize + this.cellSize / 2,
        boardY + foodY * this.cellSize + this.cellSize / 2
      );

      // Scale food emoji based on cell size
      graphic.setFontSize(Math.max(16, this.cellSize * 1.0));
    });
  }

  //========= Speed, timer
  private boostSpeed(): void {
    // Store original speed
    const originalSpeed = this.speed;

    // Boost speed for 1 second
    this.changeSpeed(+20);

    // Restore original speed after 1 second
    this.time.delayedCall(1000, () => {
      this.speed = originalSpeed;
      // this.updateSpeedText();

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
        // this.updateSpeedText();
      },
    });
  }

  // private updateSpeedText(): void {
  //   const roundedSpeed = Math.round(this.speed);
  //   const speedValueText = this.children.getByName(
  //     "speedValueText"
  //   ) as Phaser.GameObjects.Text;
  //   if (speedValueText) {
  //     speedValueText.setText(`${roundedSpeed}ms`);
  //   }
  // }

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
    const { width, height } = this.scale;
    const boardX = (width - this.GRID_SIZE * this.cellSize) / 2;
    const boardY = height * this.BOARD_Y_PERCENT;

    const foodGraphic = this.add
      .text(
        boardX + this.food.x * this.cellSize + this.cellSize / 2,
        boardY + this.food.y * this.cellSize + this.cellSize / 2,
        this.food.emoji,
        { fontSize: Math.max(16, this.cellSize * 1.0) }
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
    const { width, height } = this.scale;
    const boardX = (width - this.GRID_SIZE * this.cellSize) / 2;
    const boardY = height * this.BOARD_Y_PERCENT;

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
              boardX + foodX * this.cellSize + this.cellSize / 2,
              boardY + foodY * this.cellSize + this.cellSize / 2,
              foodEmoji,
              { fontSize: Math.max(16, this.cellSize * 1.0) }
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

    // Check if food is eaten
    let foodEaten = false;

    if (this.gameType === "classic") {
      if (head.x === this.food.x && head.y === this.food.y) {
        foodEaten = true;
        this.score++;
        // Update score text - ensure it exists before updating
        if (this.scoreText) {
          this.scoreText.setText(`Score: ${this.score}`);
        }
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
        // Update score text - ensure it exists before updating
        if (this.scoreText) {
          this.scoreText.setText(`${this.score}`);
        }

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
    this.scale.off("resize", this.resize, this);

    // Save current game settings to registry for replay
    this.registry.set("lastSpeed", this.speed);
    this.registry.set("lastGameType", this.gameType);

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
    const { width, height } = this.scale;
    const boardX = (width - this.GRID_SIZE * this.cellSize) / 2;
    const boardY = height * this.BOARD_Y_PERCENT;
    const centerX = boardX + x * this.cellSize + this.cellSize / 2;
    const centerY = boardY + y * this.cellSize + this.cellSize / 2;

    // Create explosion center
    const explosion = this.add.circle(
      centerX,
      centerY,
      this.cellSize / 2,
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
      const distance = this.cellSize * 3;

      this.tweens.add({
        targets: ray,
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance,
        height: this.cellSize * 1.5,
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
    const { width, height } = this.scale;
    const boardX = (width - this.GRID_SIZE * this.cellSize) / 2;
    const boardY = height * this.BOARD_Y_PERCENT;

    // Update snake head texture and position
    this.snakeHead.setTexture(this.SNAKE_HEADS[this.direction]);
    this.snakeHead.setPosition(
      boardX + this.snake[0].x * this.cellSize + this.cellSize / 2,
      boardY + this.snake[0].y * this.cellSize + this.cellSize / 2
    );
    this.snakeHead.setScale(this.cellSize / 40); // Dynamic scaling based on cell size

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
          boardX + this.snake[i].x * this.cellSize + this.cellSize / 2,
          boardY + this.snake[i].y * this.cellSize + this.cellSize / 2,
          "body_horizontal"
        )
        .setOrigin(0.5)
        .setScale(this.cellSize / 40);

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
        boardX + this.snake[segmentIndex].x * this.cellSize + this.cellSize / 2,
        boardY + this.snake[segmentIndex].y * this.cellSize + this.cellSize / 2
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
        // Update scale for all segments to match the head
        this.snakeBody[i].setScale(this.cellSize / 40);
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

  private shutdown(): void {
    // Remove the resize event listener properly
    this.scale.off("resize", this.resize, this);

    // Clean up timers
    if (this.moveTimer) {
      this.moveTimer.remove();
    }

    // Don't call super.shutdown() as it doesn't exist
  }
}
