import Phaser from 'phaser';

import FondoJuego from '../assets/fondo.jpg';
import { voiceControl } from '../systems/VoiceControl';

export class ComandosScene extends Phaser.Scene {
  constructor() {
    super('ComandosScene');
  }

  preload() {
    this.load.image('fondo_comandos', FondoJuego);
  }

  create() {
    const { width, height } = this.scale;

    const fondo = this.add.image(width / 2, height / 2, 'fondo_comandos');
    fondo.setTint(0x333333);

    this.add.text(width / 2, height * 0.08, 'COMANDOS DE VOZ', {
      fontFamily: '"PressStart2P"',
      fontSize: '18px',
      color: '#fbbf24',
      stroke: '#000000',
      strokeThickness: 5
    }).setOrigin(0.5);

    const columnaIzquierda = [
      'MOVERSE',
      '"izquierda" / "derecha"',
      '"detente" / "quieto"',
      '',
      'SALTAR',
      '"salta" / "salto"',
      '',
      'ATACAR',
      '"ataca" / "piedra" / "lanza"',
    ];

    const columnaDerecha = [
      'MENUS',
      '"empezar" / "continuar"',
      '"reintentar" / "menu"',
      '',
      'EN LA HISTORIA',
      '"saltar presentacion"',
      '(te lleva directo al juego)',
      '',
      'TIP',
      'puedes decir varios',
      'comandos seguidos:',
      '"derecha salta piedra"',
    ];

    this.add.text(width * 0.27, height * 0.20, columnaIzquierda, {
      fontFamily: '"PressStart2P"',
      fontSize: '9px',
      color: '#e4e4e7',
      align: 'left',
      lineSpacing: 6,
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5, 0);

    this.add.text(width * 0.73, height * 0.20, columnaDerecha, {
      fontFamily: '"PressStart2P"',
      fontSize: '9px',
      color: '#e4e4e7',
      align: 'left',
      lineSpacing: 6,
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5, 0);

    const indicadorSiguiente = this.add.text(width / 2, height * 0.93, 'ESPACIO, CLIC o di "CONTINUAR"', {
      fontFamily: '"PressStart2P"',
      fontSize: '10px',
      color: '#34d399'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: indicadorSiguiente,
      alpha: 0,
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    this.input.keyboard!.on('keydown-SPACE', () => this.continuar());
    this.input.on('pointerdown', () => this.continuar());

    // --- COMANDO DE VOZ ---
    voiceControl.limpiarComandos();
    voiceControl.registrarComando(['continuar', 'listo', 'entendido'], () => this.continuar());
  }

  private continuar() {
    this.scene.start('IntroScene');
  }
}
