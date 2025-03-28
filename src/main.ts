import Phaser from "phaser";
import MainMenuScene from "./scenes/MainMenuScene";
import GameScene from "./scenes/GameScene";
import PauseScene from "./scenes/PauseScene";
import GameOverScene from "./scenes/GameOverScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 700,
  parent: "game",
  backgroundColor: "#000000",
  scene: [MainMenuScene, GameScene, PauseScene, GameOverScene],
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
};

new Phaser.Game(config);
