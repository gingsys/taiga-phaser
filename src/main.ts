// src/main.ts
import './style.css';
import Phaser from 'phaser';
import { IntroScene } from './scenes/IntroScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/core/GameScene';
import { GameOverScene } from './scenes/GameOverScene';
import { StarScene } from './scenes/StartScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 640,
  height: 360,
  parent: 'game-container',
  pixelArt: true,
  physics:{
    default: 'arcade',    
    arcade:{
      gravity:{
        x: 0,
        y: 1200
      },
      debug: false
    }
  },
  backgroundColor: '#18181b', // zinc-900  
  scene: [StarScene, MenuScene, IntroScene, GameScene, GameOverScene]
};

document.fonts.load('10pt "PressStart2P"').then(() => {
  new Phaser.Game(config);
  console.log('Fuente cargada correctamente 🚀')
}).catch(() => {
  console.warn('La fuente no pudo cargar, iniciando juego de todas formas...');
  new Phaser.Game(config);
});