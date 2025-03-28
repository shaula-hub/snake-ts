import Phaser from "phaser";
import { COLORS } from "./constants";

export default class GameOverScene extends Phaser.Scene {
  private score: number = 0;
  private playAgainButton!: Phaser.GameObjects.Text;
  private settingsButton!: Phaser.GameObjects.Text;
  private selectedButton: number = 0; // 0 = Play Again, 1 = Settings

  constructor() {
    super({ key: "GameOverScene" });
  }

  init() {
    // Get the final score from registry
    this.score = this.registry.get("score") || 0;
    // Always start with Play Again selected
    this.selectedButton = 0;
  }

  create() {
    const { width, height } = this.scale;

    // Add game over title
    this.add
      .text(width / 2, height / 3, "GAME OVER!", {
        fontFamily: "Arial",
        fontSize: "60px",
        color: COLORS.WHITE,
      })
      .setOrigin(0.5);

    // Add score text
    this.add
      .text(width / 2, height * 0.45, `Your final score: ${this.score}`, {
        fontFamily: "Arial",
        fontSize: "40px",
        color: COLORS.WHITE,
      })
      .setOrigin(0.5);

    // Play again button
    this.playAgainButton = this.add
      .text(width / 2, height * 0.65, "Play Again", {
        fontFamily: "Arial",
        fontSize: "32px",
        color: COLORS.WHITE,
        backgroundColor: COLORS.BUTTON_HOVER_BG, // Start with highlighted color
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5)
      .setScale(1.05); // Start slightly scaled up to show focus

    this.playAgainButton
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => {
        this.selectedButton = 0;
        this.updateButtonFocus();
      })
      .on("pointerdown", () => {
        this.restartGame();
      });

    // Settings button
    this.settingsButton = this.add
      .text(width / 2, height * 0.75, "Settings", {
        fontFamily: "Arial",
        fontSize: "32px",
        color: COLORS.WHITE,
        backgroundColor: COLORS.BUTTON_BG, // Normal color
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5);

    this.settingsButton
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => {
        this.selectedButton = 1;
        this.updateButtonFocus();
      })
      .on("pointerdown", () => {
        this.returnToMenu();
      });

    // Set up keyboard navigation
    if (this.input && this.input.keyboard) {
      // Up/Down to navigate between buttons
      this.input.keyboard.on("keydown-UP", () => {
        this.selectedButton = 0; // Play Again
        this.updateButtonFocus();
      });

      this.input.keyboard.on("keydown-DOWN", () => {
        this.selectedButton = 1; // Settings
        this.updateButtonFocus();
      });

      // Enter to select the focused button
      this.input.keyboard.on("keydown-ENTER", () => {
        if (this.selectedButton === 0) {
          this.restartGame();
        } else {
          this.returnToMenu();
        }
      });

      // Space to select (alternative)
      this.input.keyboard.on("keydown-SPACE", () => {
        if (this.selectedButton === 0) {
          this.restartGame();
        } else {
          this.returnToMenu();
        }
      });
    }

    // Initial focus setup - Play Again is focused by default
    this.updateButtonFocus();
  }

  private updateButtonFocus(): void {
    // Update Play Again button
    if (this.selectedButton === 0) {
      this.playAgainButton.setStyle({
        backgroundColor: COLORS.BUTTON_HOVER_BG,
      });
      this.playAgainButton.setScale(1.05);
    } else {
      this.playAgainButton.setStyle({ backgroundColor: COLORS.BUTTON_BG });
      this.playAgainButton.setScale(1);
    }

    // Update Settings button
    if (this.selectedButton === 1) {
      this.settingsButton.setStyle({ backgroundColor: COLORS.BUTTON_HOVER_BG });
      this.settingsButton.setScale(1.05);
    } else {
      this.settingsButton.setStyle({ backgroundColor: COLORS.BUTTON_BG });
      this.settingsButton.setScale(1);
    }
  }

  private restartGame(): void {
    this.scene.start("GameScene");
  }

  private returnToMenu(): void {
    // Explicitly destroy this scene to avoid lingering objects
    this.scene.stop("GameOverScene");

    // Restart the menu scene (this will re-run all initialization)
    this.scene.start("MainMenuScene", { fromGameOver: true });
  }
}
