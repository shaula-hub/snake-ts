import Phaser from "phaser";
import GameScene from "./GameScene";
import { COLORS } from "./constants";

export default class MainMenuScene extends Phaser.Scene {
  private gameTypes: string[] = ["classic", "tetra", "bounce"];
  private selectedType: number = 0;
  private title!: Phaser.GameObjects.Text;
  private instructions!: Phaser.GameObjects.Text;
  private gameTypeTexts: Phaser.GameObjects.Text[] = [];
  private startButton!: Phaser.GameObjects.Text;

  constructor() {
    super("MainMenuScene");
  }

  preload() {
    // If you're using any images like buttons or backgrounds
    // this.load.image('button-bg', 'images/button.png');

    // This is a good place to preload any assets needed for the menu
    console.log("MainMenuScene preloading assets...");
  }

  init(data) {
    // Reset arrays
    this.gameTypeTexts = [];
    this.selectedType = 0;

    console.log("MainMenuScene initialized", data);
  }

  create() {
    const { width, height } = this.scale;

    // Title
    this.title = this.add
      .text(width / 2, height * 0.15, "SNAKE GAME", {
        fontFamily: "Arial",
        fontSize: "52px",
        color: COLORS.WHITE,
      })
      .setOrigin(0.5);

    //Game type selection
    this.add
      .text(width / 2, height * 0.3, "Game Type:", {
        fontFamily: "Arial",
        fontSize: "40px",
        color: COLORS.HIGHLIGHT,
        // fontStyle: "bold",
        // font: "bold 40px Arial"
      })
      .setOrigin(0.5);

    // this.add
    //   .text(width / 2 - 80, height * 0.4, ">", {
    //     fontFamily: "Arial",
    //     fontSize: "32px",
    //     color: COLORS.HIGHLIGHT,
    //   })
    //   .setOrigin(0.5);

    // Create game type options
    this.gameTypes.forEach((type, index) => {
      const y = (height * 2) / 5 + index * 40;
      const text = this.add
        .text(width / 2, y, type.charAt(0).toUpperCase() + type.slice(1), {
          fontSize: "40px",
          color: COLORS.HIGHLIGHT,
          // fontStyle: "bold",
          // font: "bold 40px Arial"
        })
        .setOrigin(0.5);

      // Make text interactive
      text
        .setInteractive({ useHandCursor: true })
        .on("pointerover", () => this.onTypeOver(index))
        .on("pointerout", () => this.onTypeOut(index))
        .on("pointerdown", () => this.onTypeSelected(index));

      this.gameTypeTexts.push(text);
    });

    // Update the initially selected type
    //this.updateTypeSelection();
    setTimeout(() => {
      this.updateTypeSelection();
    }, 100);

    // Start button
    this.startButton = this.add
      .text(width / 2, (height * 3) / 5, "Start Game", {
        fontFamily: "Arial",
        fontSize: "32px",
        color: COLORS.WHITE,
        backgroundColor: COLORS.BUTTON_BG,
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5);

    // Make button interactive
    this.startButton
      .setInteractive({ useHandCursor: true })
      .on("pointerover", this.onButtonOver, this)
      .on("pointerout", this.onButtonOut, this)
      .on("pointerdown", this.startGame, this);

    // // Controls instructions
    // this.add
    //   .text(width / 2, height * 0.7, "Controls:", {
    //     fontFamily: "Arial",
    //     fontSize: "40px",
    //     // fontStyle: "bold",
    //     color: COLORS.HIGHLIGHT,
    //   })
    //   .setOrigin(0.5);

    // const isMobile = this.sys.game.device.input.touch;
    // const controlsText = isMobile
    //   ? "\nSwipe to change direction"
    //   : "\nArrow Keys: Move\n+/-: Speed\nESC: Pause";

    // this.instructions = this.add
    //   .text(width / 2, height * 0.8, controlsText, {
    //     fontFamily: "Arial",
    //     fontSize: "26px",
    //     color: COLORS.WHITE,
    //     align: "center",
    //   })
    //   .setOrigin(0.5);

    if (this.input && this.input.keyboard) {
      this.input.keyboard.on("keydown-UP", () => {
        this.selectedType =
          (this.selectedType - 1 + this.gameTypes.length) %
          this.gameTypes.length;
        this.updateTypeSelection();
      });

      this.input.keyboard.on("keydown-DOWN", () => {
        this.selectedType = (this.selectedType + 1) % this.gameTypes.length;
        this.updateTypeSelection();
      });

      this.input.keyboard.on("keydown-ENTER", () => {
        this.startGame();
      });

      this.input.keyboard.on("keydown-SPACE", () => {
        this.startGame();
      });
    }
  }

  private onTypeOver(index: number): void {
    this.gameTypeTexts[index].setStyle({
      color: COLORS.HIGHLIGHT,
    });
  }

  private onTypeOut(index: number): void {
    if (index !== this.selectedType) {
      this.gameTypeTexts[index].setStyle({
        color: COLORS.WHITE,
      });
    }
  }

  private onTypeSelected(index: number): void {
    this.selectedType = index;
    this.updateTypeSelection();
  }

  private updateTypeSelection(): void {
    // Add null check to ensure gameTypeTexts are available
    if (!this.gameTypeTexts || this.gameTypeTexts.length === 0) {
      console.log("Game type texts not initialized yet");
      return;
    }

    this.gameTypeTexts.forEach((text, index) => {
      if (!text) {
        console.log(`Text object at index ${index} is null`);
        return;
      }

      if (index === this.selectedType) {
        text.setStyle({
          color: COLORS.HIGHLIGHT,
        });
        // Add selection indicator
        text.setText(
          `> ${
            this.gameTypes[index].charAt(0).toUpperCase() +
            this.gameTypes[index].slice(1)
          } <`
        );
      } else {
        text.setStyle({
          color: COLORS.WHITE,
        });
        text.setText(
          this.gameTypes[index].charAt(0).toUpperCase() +
            this.gameTypes[index].slice(1)
        );
      }
    });
  }

  private onButtonOver(): void {
    this.startButton.setStyle({
      backgroundColor: COLORS.BUTTON_HOVER_BG, // Purple on hover, matching your React implementation
    });
    this.startButton.setScale(1.05);
  }

  private onButtonOut(): void {
    this.startButton.setStyle({
      backgroundColor: COLORS.BUTTON_BG, // Green
    });
    this.startButton.setScale(1);
  }

  private startGame(): void {
    // Communicate the selected game type using registry (global data store)
    this.registry.set("gameType", this.gameTypes[this.selectedType]);

    // Start the GameScene
    this.scene.start("GameScene");
  }
}
