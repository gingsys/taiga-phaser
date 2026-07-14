import Phaser from 'phaser';

// Importamos a Taiga y la reliquia principal para decorar
import Taiga from '../assets/taiga.png';
import Tumi from '../assets/Tumi.png';

export class VictoryScene extends Phaser.Scene {
  constructor() {
    super('VictoryScene');
  }

  preload() {
    // Nos aseguramos de que los assets estén en memoria por si acaso
    this.load.spritesheet('taiga_victory', Taiga, { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('tumi_victory', Tumi, { frameWidth: 18, frameHeight: 17 });
  }

  create() {
    const { width, height } = this.scale;

    // 1. FONDO DE CELEBRACIÓN
    // Un azul oscuro elegante que contraste con el dorado
    this.cameras.main.setBackgroundColor('#0f172a'); 

    // 2. TÍTULO TRIUNFAL
    const titulo = this.add.text(width / 2, height * 0.20, '¡LEGADO PROTEGIDO!', {
      fontFamily: '"PressStart2P"',
      fontSize: '32px',
      color: '#fbbf24', // Dorado
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);

    // Hacemos que el título flote suavemente
    this.tweens.add({
      targets: titulo,
      y: titulo.y - 10,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // 3. TEXTO TRIBUTO (El corazón del juego)
    const mensajeTributo = [
      "Taiga ha derrotado a los huaqueros",
      "y recuperado nuestras reliquias.",
      "",
      "Nuestra historia está a salvo",
      "gracias a su valentía."
    ];

    this.add.text(width / 2, height * 0.40, mensajeTributo, {
      fontFamily: '"PressStart2P"',
      fontSize: '12px',
      color: '#e4e4e7',
      align: 'center',
      lineSpacing: 10,
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    // 4. ANIMACIÓN DE TAIGA Y LAS RELIQUIAS
    // Colocamos a Taiga en el centro, orgullosa
    const taiga = this.add.sprite(width / 2, height * 0.65, 'taiga_victory');
    taiga.setScale(1.5);
    
    this.anims.create({
      key: 'victory_idle',
      frames: this.anims.generateFrameNumbers('taiga_victory', { start: 6, end: 11 }),
      frameRate: 8,
      repeat: -1
    });
    taiga.play('victory_idle');

    // Colocamos dos Tumis girando a los lados de Taiga para darle "jugosidad"
    const tumiIzq = this.add.sprite(width / 2 - 80, height * 0.65, 'tumi_victory').setScale(2);
    const tumiDer = this.add.sprite(width / 2 + 80, height * 0.65, 'tumi_victory').setScale(2);
    
    this.anims.create({
      key: 'tumi_spin',
      frames: this.anims.generateFrameNumbers('tumi_victory', { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1
    });
    tumiIzq.play('tumi_spin');
    tumiDer.play('tumi_spin');

    // Hacemos que los Tumis floten en direcciones opuestas
    this.tweens.add({
      targets: [tumiIzq, tumiDer],
      y: '-=15',
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: this.tweens.stagger(500) // Uno sube mientras el otro baja
    });

    // 5. BOTÓN PARA VOLVER AL MENÚ
    const menuBtn = this.add.text(width / 2, height * 0.88, 'VOLVER AL MENÚ', {
      fontFamily: '"PressStart2P"',
      fontSize: '18px',
      color: '#34d399'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    menuBtn.on('pointerover', () => {
      menuBtn.setColor('#10b981');
      menuBtn.setScale(1.1);
    });
    menuBtn.on('pointerout', () => {
      menuBtn.setColor('#34d399');
      menuBtn.setScale(1);
    });
    menuBtn.on('pointerdown', () => {
      // Reiniciamos el registro de niveles para que al jugar de nuevo, empiece en el Nivel 1
      this.registry.set('nivelActual', 1);
      this.scene.start('MenuScene');
    });
  }
}