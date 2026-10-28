import Phaser from 'phaser';
import { GAME_H, GAME_W } from './config';
import { BootScene } from './scenes/BootScene';
import { LocationScene } from './scenes/LocationScene';
import { HudScene } from './scenes/HudScene';
import { TitleScene } from './scenes/TitleScene';
import { EndScene } from './scenes/EndScene';
import { GameState } from './systems/GameState';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_W,
  height: GAME_H,
  backgroundColor: '#0b1020',
  pixelArt: true,
  physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 } } },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, TitleScene, LocationScene, HudScene, EndScene],
});

// Add ?debug to the URL to poke at the game from the browser console.
if (new URLSearchParams(location.search).has('debug')) {
  Object.assign(window, { __game: game, __state: GameState });
}
