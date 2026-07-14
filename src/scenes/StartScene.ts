import Phaser from 'phaser';
import LogoUTP from '../assets/gdutp-logo.png'

export class StarScene extends Phaser.Scene {
  constructor() {
    super('StartScene'); 
  }

  preload(){
    this.load.image('logo_uni', LogoUTP);
  }

  create() {
    const { width, height } = this.scale;

    const logo = this.add.image(width / 2, height / 2 - 50, 'logo_uni').setOrigin(0.5);
    logo.setScale(0.1)
    
    this.add.text(width / 2, height / 2 + 50, 'DESARROLLADO POR:\n\nGiovanni Herrera\nLuis Quintana', {
      fontFamily: '"PressStart2P"',
      fontSize: '12px',
      color: '#ffffff',
      align: 'center',
      lineSpacing: 8
    }).setOrigin(0.5);

    //this.scene.start('GameScene');

    this.time.delayedCall(5000, () => {
      this.scene.start('MenuScene');
    });
  }
}