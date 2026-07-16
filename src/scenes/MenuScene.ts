import Phaser from 'phaser';

import Taiga from '../assets/taiga.png';
import FondoJuego from '../assets/fondo.jpg';
import MenuSound from '../assets/menu-bg.mp3'
import { voiceControl } from '../systems/VoiceControl';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  preload() {
    // Cargamos los assets aquí por si el menú es la primera pantalla que abre el jugador
    this.load.image('fondo_menu', FondoJuego);
    this.load.spritesheet('taiga_menu', Taiga, {
      frameWidth: 64,
      frameHeight: 64
    });

    this.load.audio('menu_sound', MenuSound)
  }

  create() {
    const { width, height } = this.scale;

    let musica = this.sound.get('menu_sound');

    if (!musica) {
      musica = this.sound.add('menu_sound', { 
        loop: true,   
        volume: 0.05
      });
    }

    if (!musica.isPlaying) {
      musica.play();
    } 

    // 1. FONDO OSCURECIDO    
    const fondo = this.add.image(width / 2, height / 2, 'fondo_menu');
    fondo.setTint(0x444444);

    // 2. EL PROTAGONISTA EN PANTALLA    
    const taigaDecorativa = this.add.sprite(width / 2, height * 0.40, 'taiga_menu');
    taigaDecorativa.setScale(2);
    
    this.anims.create({
      key: 'menu_idle',
      frames: this.anims.generateFrameNumbers('taiga_menu', { start: 6, end: 11 }),
      frameRate: 8,
      repeat: -1
    });
    taigaDecorativa.play('menu_idle');

    // 3. TÍTULO FLOTANTE
    const titulo = this.add.text(width / 2, height * 0.15, 'TAIGA:\nGUARDIANA DE RELIQUIAS', {
      fontFamily: '"PressStart2P"',
      fontSize: '26px',
      color: '#fbbf24',
      align: 'center',
      lineSpacing: 10,
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);

    // Hacemos que el título flote suavemente arriba y abajo
    this.tweens.add({
      targets: titulo,
      y: titulo.y + 10, // Se mueve 10 píxeles hacia abajo
      duration: 2000,   // Tarda 2 segundos en bajar
      ease: 'Sine.easeInOut',
      yoyo: true,       // Vuelve a subir automáticamente
      repeat: -1        // Bucle infinito
    });

    // 4. INSTRUCCIONES
    const instrucciones = [
      'CONTROLES:',
      '',
      'Flechas  - Moverse',
      'Espacio  - Saltar',
      'Tecla D  - Lanzar Piedra'
    ];

    this.add.text(width / 2, height * 0.65, instrucciones, {
      fontFamily: '"PressStart2P"',
      fontSize: '12px',
      color: '#e4e4e7',
      align: 'center',
      lineSpacing: 8,
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // 5. BOTÓN LATIENTE (PRESS START)
    const startButton = this.add.text(width / 2, height * 0.88, '¡EMPEZAR!', {
      fontFamily: '"PressStart2P"',
      fontSize: '22px',
      color: '#34d399',
      stroke: '#000000',
      strokeThickness: 5
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true }); 

    // Efecto de latido (crece y se encoge) para llamar la atención
    const latidoTween = this.tweens.add({
      targets: startButton,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Eventos del botón
    startButton.on('pointerdown', () => {
      // (Opcional) Puedes agregar un sonido de "Start" aquí antes de cambiar de escena
      this.sound.get('menu_sound').stop()
      this.scene.start('ComandosScene');
    });

    startButton.on('pointerover', () => {
      startButton.setColor('#10b981');
      latidoTween.pause(); // Pausamos el latido si le pone el mouse encima
      startButton.setScale(1.2); 
    });
    
    startButton.on('pointerout', () => {
      startButton.setColor('#34d399');
      startButton.setScale(1); // Reseteamos escala
      latidoTween.resume();    // Retomamos el latido
    });

    // --- COMANDO DE VOZ ---
    voiceControl.limpiarComandos();
    voiceControl.registrarComando(['empezar', 'iniciar', 'comenzar', 'jugar'], () => {
      startButton.emit('pointerdown');
    });
  }
}