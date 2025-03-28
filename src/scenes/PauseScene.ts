import Phaser from "phaser";
import { COLORS } from "./constants";

export default class PauseScene extends Phaser.Scene {
  constructor() {
    super({ key: "PauseScene" });
  }

  create() {
    const { width, height } = this.scale;

    // Add semi-transparent background
    this.add
      .rectangle(0, 0, width, height, 0x000000, 0.7)
      .setOrigin(0)
      .setScrollFactor(0);

    // Pause text
    this.add
      .text(width / 2, height / 3, "GAME PAUSED", {
        fontFamily: "Arial",
        fontSize: "48px",
        color: COLORS.NORMAL,
      })
      .setOrigin(0.5);

    // Resume button
    const resumeButton = this.add
      .text(width / 2, height / 2, "Resume", {
        fontFamily: "Arial",
        fontSize: "32px",
        color: "#ffffff",
        backgroundColor: "#22c55e",
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5);

    resumeButton
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => {
        resumeButton.setStyle({ backgroundColor: "#6b238d" });
        resumeButton.setScale(1.05);
      })
      .on("pointerout", () => {
        resumeButton.setStyle({ backgroundColor: "#22c55e" });
        resumeButton.setScale(1);
      })
      .on("pointerdown", () => {
        this.resumeGame();
      });

    // Menu button
    const menuButton = this.add
      .text(width / 2, height / 2 + 80, "Main Menu", {
        fontFamily: "Arial",
        fontSize: "32px",
        color: "#ffffff",
        backgroundColor: "#22c55e",
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5);

    menuButton
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => {
        menuButton.setStyle({ backgroundColor: "#6b238d" });
        menuButton.setScale(1.05);
      })
      .on("pointerout", () => {
        menuButton.setStyle({ backgroundColor: "#22c55e" });
        menuButton.setScale(1);
      })
      .on("pointerdown", () => {
        this.returnToMenu();
      });

    // Add ESC key to resume - null check before accessing keyboard
    if (this.input && this.input.keyboard) {
      this.input.keyboard.once("keydown-ESC", () => {
        this.resumeGame();
      });
    }
    // Add ESC key to resume
    // this.input.keyboard.once("keydown-ESC", () => {
    //   this.resumeGame();
    // });
    //

    // 5. Update Resume button hover effect in PauseScene
    resumeButton
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => {
        resumeButton.setStyle({ backgroundColor: "#6b238d" });
        resumeButton.setColor("#FFBF00"); // Change text to gold on hover
        resumeButton.setScale(1.05);
      })
      .on("pointerout", () => {
        resumeButton.setStyle({ backgroundColor: "#22c55e" });
        resumeButton.setColor("#ffffff"); // Reset color
        resumeButton.setScale(1);
      })
      .on("pointerdown", () => {
        this.resumeGame();
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
