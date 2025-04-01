import Phaser from "phaser";
import { COLORS } from "./constants";

export default class PauseScene extends Phaser.Scene {
  private resumeButton!: Phaser.GameObjects.Text;
  private menuButton!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: "PauseScene" });
  }

  create() {
    const { width, height } = this.scale;

    // Add semi-transparent background
    const overlay = this.add
      .rectangle(0, 0, width, height, 0x000000, 0.7)
      .setOrigin(0)
      .setScrollFactor(0)
      .setInteractive() // Make overlay interactive
      .on("pointerdown", () => {
        // Resume game when clicking anywhere on the overlay (except menu button)
        this.resumeGame();
      });

    // Pause text
    this.add
      .text(width / 2, height / 3, "GAME PAUSED", {
        fontFamily: "Arial",
        fontSize: "32px",
        color: COLORS.NORMAL,
      })
      .setOrigin(0.5);

    // Resume button
    this.resumeButton = this.add
      .text(width / 2, height / 2, "Resume", {
        fontFamily: "Arial",
        fontSize: "24px",
        color: "#ffffff",
        backgroundColor: "#6b238d", // Start with hover state
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5)
      .setScale(1.05); // Start with hover scale

    this.resumeButton
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => {
        this.resumeButton.setStyle({ backgroundColor: "#6b238d" });
        this.resumeButton.setColor("#FFBF00"); // Change text to gold on hover
        this.resumeButton.setScale(1.05);
      })
      .on("pointerout", () => {
        // Keep resume button always in hover state
        this.resumeButton.setStyle({ backgroundColor: "#6b238d" });
        this.resumeButton.setColor("#FFBF00");
        this.resumeButton.setScale(1.05);
      })
      .on("pointerdown", () => {
        this.resumeGame();
      });

    // Set initial state of resume button as hovered
    this.resumeButton.setColor("#FFBF00");

    // Menu button
    this.menuButton = this.add
      .text(width / 2, height / 2 + 80, "Main Menu", {
        fontFamily: "Arial",
        fontSize: "24px",
        color: "#ffffff",
        backgroundColor: "#22c55e",
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5);

    this.menuButton
      .setInteractive({ useHandCursor: true, stopPropagation: true }) // Stop propagation to prevent overlay click
      .on("pointerover", () => {
        this.menuButton.setStyle({ backgroundColor: "#6b238d" });
        this.menuButton.setScale(1.05);
      })
      .on("pointerout", () => {
        this.menuButton.setStyle({ backgroundColor: "#22c55e" });
        this.menuButton.setScale(1);
      })
      .on("pointerdown", (pointer: Phaser.Input.Pointer) => {
        pointer.event.stopPropagation(); // Prevent the click from reaching the overlay
        this.returnToMenu();
      });

    // Add keyboard controls
    if (this.input && this.input.keyboard) {
      // ESC to resume
      this.input.keyboard.on("keydown-ESC", () => {
        this.resumeGame();
      });

      // ENTER to resume
      this.input.keyboard.on("keydown-ENTER", () => {
        this.resumeGame();
      });

      // SPACE to resume
      this.input.keyboard.on("keydown-SPACE", () => {
        this.resumeGame();
      });

      // Up/Down to navigate between buttons
      this.input.keyboard.on("keydown-DOWN", () => {
        // Move focus to menu button
        this.resumeButton.setStyle({ backgroundColor: "#22c55e" });
        this.resumeButton.setColor("#ffffff");
        this.resumeButton.setScale(1);

        this.menuButton.setStyle({ backgroundColor: "#6b238d" });
        this.menuButton.setScale(1.05);
      });

      this.input.keyboard.on("keydown-UP", () => {
        // Move focus back to resume button
        this.menuButton.setStyle({ backgroundColor: "#22c55e" });
        this.menuButton.setScale(1);

        this.resumeButton.setStyle({ backgroundColor: "#6b238d" });
        this.resumeButton.setColor("#FFBF00");
        this.resumeButton.setScale(1.05);
      });
    }

    // To ensure the resume button gets focus even after any repaints
    this.time.delayedCall(50, () => {
      if (this.resumeButton) {
        this.resumeButton.setStyle({ backgroundColor: "#6b238d" });
        this.resumeButton.setColor("#FFBF00");
        this.resumeButton.setScale(1.05);
      }
    });
  }

  private resumeGame(): void {
    this.scene.stop();
    this.scene.resume("GameScene");
  }

  private returnToMenu(): void {
    this.scene.stop();
    this.scene.stop("GameScene");
    this.scene.start("MainMenuScene");
  }
}
