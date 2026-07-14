import Phaser from 'phaser';

interface IVillanoConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  minX: number;
  maxX: number;
  velocidad?: number; // Opcional, por defecto será 100
}

export class Villano extends Phaser.Physics.Arcade.Sprite {
  private velocidadPatrulla: number;
  private minX: number;
  private maxX: number;

  constructor(config: IVillanoConfig) {
    super(config.scene, config.x, config.y, 'villano');
    
    config.scene.add.existing(this);
    config.scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    
    this.velocidadPatrulla = config.velocidad ?? 100;
    this.minX = config.minX;
    this.maxX = config.maxX;

    this.body!.setSize(15, 30);
    this.body!.setOffset(10, 9);

    this.setVelocityX(-this.velocidadPatrulla);
    this.anims.play('villano_izquierda', true);
  }

  update() {
    // 1. EL SEGURO: Si Phaser nos borró la velocidad al meternos al grupo, la forzamos.
    if (this.body && this.body.velocity.x === 0) {
      // Usamos la animación actual para saber hacia dónde empujarlo
      const direccion = this.anims.currentAnim?.key === 'villano_derecha' ? 1 : -1;
      this.setVelocityX(this.velocidadPatrulla * direccion);
    }

    // 2. Lógica de patrullaje normal
    if (this.x <= this.minX && this.body!.velocity.x < 0) {
      this.setVelocityX(this.velocidadPatrulla);
      this.anims.play('villano_derecha', true);
    } 
    else if (this.x >= this.maxX && this.body!.velocity.x > 0) {
      this.setVelocityX(-this.velocidadPatrulla);
      this.anims.play('villano_izquierda', true);
    }
  }
}