import Phaser from "phaser";
import { COLORS } from "./constants";

export default class GameOverScene extends Phaser.Scene {
  private score: number = 0;
  private playAgainButton!: Phaser.GameObjects.Text;
  private settingsButton!: Phaser.GameObjects.Text;
  private selectedButton: number = 0; // 0 = Play Again, 1 = Settings
  private isMobile: boolean = false;

  constructor() {
    super({ key: "GameOverScene" });
  }

  init() {
    // Get the final score from registry
    this.score = this.registry.get("score") || 0;
    // Always start with Play Again selected
    this.selectedButton = 0;

    // Detect if we're on a mobile device
    this.isMobile =
      !this.sys.game.device.os.desktop ||
      this.sys.game.device.input.touch ||
      window.innerWidth < 800;
  }

  create() {
    const { width, height } = this.scale;

    // Calculate responsive font sizes
    const titleSize = this.isMobile
      ? Math.min(60, Math.floor(width / 5))
      : "64px";

    const scoreSize = 52;
    // const scoreSize = this.isMobile
    // ? Math.min(36, Math.floor(width / 20))
    // : "36px";

    const buttonSize = 40;
    // const buttonSize = this.isMobile
    // ? Math.min(20, Math.floor(width / 25))
    // : "30px";

    // Add game over title
    this.add
      .text(width / 2, height / 3, "GAME OVER!", {
        fontFamily: "Arial",
        fontSize: titleSize,
        color: COLORS.WHITE,
      })
      .setOrigin(0.5);

    // Add score text
    this.add
      .text(width / 2, height * 0.4, `Your final score: ${this.score}`, {
        fontFamily: "Arial",
        fontSize: scoreSize,
        color: COLORS.WHITE,
      })
      .setOrigin(0.5);

    // Calculate button padding based on screen size
    const buttonPadding = this.isMobile ? { x: 15, y: 8 } : { x: 20, y: 10 };

    // Play again button
    this.playAgainButton = this.add
      .text(width / 2, height * 0.5, "Play Again", {
        fontFamily: "Arial",
        fontSize: buttonSize,
        color: COLORS.WHITE,
        backgroundColor: COLORS.BUTTON_HOVER_BG, // Start with highlighted color
        padding: buttonPadding,
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
      .text(width / 2, height * 0.6, "Settings", {
        fontFamily: "Arial",
        fontSize: buttonSize,
        color: COLORS.WHITE,
        backgroundColor: COLORS.BUTTON_BG, // Normal color
        padding: buttonPadding,
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

    // Add resize handler
    this.scale.on("resize", this.resize, this);
    this.resize();
  }

  private resize(): void {
    const { width, height } = this.scale;

    // Update mobile detection
    this.isMobile =
      !this.sys.game.device.os.desktop ||
      this.sys.game.device.input.touch ||
      window.innerWidth < 800;

    // Calculate responsive font sizes again
    const titleSize = 52;
    // const titleSize = this.isMobile
    //   ? Math.min(32, Math.floor(width / 15))
    //   : "48px";

    const scoreSize = 40;
    // const scoreSize = this.isMobile
    //   ? Math.min(24, Math.floor(width / 20))
    //   : "36px";

    const buttonSize = 36;
    // const buttonSize = this.isMobile
    //   ? Math.min(20, Math.floor(width / 25))
    //   : "30px";

    // Recalculate button padding based on screen size
    const buttonPadding = this.isMobile ? { x: 3, y: 2 } : { x: 20, y: 10 };

    // Get and update title text
    const titleText = this.children.list.find(
      (child) =>
        child instanceof Phaser.GameObjects.Text &&
        (child as Phaser.GameObjects.Text).text === "GAME OVER!"
    ) as Phaser.GameObjects.Text;

    if (titleText) {
      titleText.setPosition(width / 2, height / 25);
      titleText.setFontSize(titleSize);
    }

    // Get and update score text
    const scoreText = this.children.list.find(
      (child) =>
        child instanceof Phaser.GameObjects.Text &&
        (child as Phaser.GameObjects.Text).text.includes("Your final score")
    ) as Phaser.GameObjects.Text;

    if (scoreText) {
      scoreText.setPosition(width / 2, height * 0.38);
      scoreText.setFontSize(scoreSize);
    }

    // Update Play Again button
    if (this.playAgainButton) {
      this.playAgainButton.setPosition(width / 2, height * 0.5);
      this.playAgainButton.setFontSize(buttonSize);
      this.playAgainButton.setPadding(buttonPadding);
    }

    // Update Settings button
    if (this.settingsButton) {
      this.settingsButton.setPosition(width / 2, height * 0.73);
      this.settingsButton.setFontSize(buttonSize);
      this.settingsButton.setPadding(buttonPadding);
    }

    // Make sure focus is correctly shown
    this.updateButtonFocus();
  }

  private updateButtonFocus(): void {
    // Calculate scale factor based on device
    const focusScale = this.isMobile ? 1.03 : 1.05;

    // Update Play Again button
    if (this.selectedButton === 0) {
      this.playAgainButton.setStyle({
        backgroundColor: COLORS.BUTTON_HOVER_BG,
      });
      this.playAgainButton.setScale(focusScale);
    } else {
      this.playAgainButton.setStyle({ backgroundColor: COLORS.BUTTON_BG });
      this.playAgainButton.setScale(1);
    }

    // Update Settings button
    if (this.selectedButton === 1) {
      this.settingsButton.setStyle({ backgroundColor: COLORS.BUTTON_HOVER_BG });
      this.settingsButton.setScale(focusScale);
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
