import Phaser from 'phaser';

export interface ILevel {
  reliquiasTotales: number;
  reliquiasRecolectadas: number;
  id: number;
  preload: (scene: Phaser.Scene) => void;  
  create: (scene: Phaser.Scene, player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody, piedras: Phaser.Physics.Arcade.Group, piso: Phaser.GameObjects.TileSprite) => void; 
  update: (scene: Phaser.Scene, time: number, delta: number) => void;
}