import Phaser from 'phaser';

export class GameOverScene extends Phaser.Scene {
  private recolectadas: number = 0;
  private totales: number = 0;

  constructor() {
    super('GameOverScene');
  }

  // Recibimos los datos exactos desde GameScene al perder
  init(data: { recolectadas: number, totales: number }) {
    this.recolectadas = data.recolectadas || 0;
    this.totales = data.totales || 0;
  }

  create() {
    const { width, height } = this.scale;

    // Fondo completamente oscuro para dar la sensación de derrota
    this.cameras.main.setBackgroundColor('#18181b'); // Gris muy oscuro

    // 1. TÍTULO PRINCIPAL
    const titulo = this.add.text(width / 2, height * 0.25, '¡TIEMPO AGOTADO!', {
      fontFamily: '"PressStart2P"',
      fontSize: '36px',
      color: '#ef4444', // Rojo
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);

    // Animación sutil de caída para el título
    this.tweens.add({
      targets: titulo,
      y: titulo.y + 5,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // 2. TEXTO NARRATIVO
    this.add.text(width / 2, height * 0.40, 'Los huaqueros escaparon\ncon el patrimonio...', {
      fontFamily: '"PressStart2P"',
      fontSize: '14px',
      color: '#a1a1aa',
      align: 'center',
      lineSpacing: 8
    }).setOrigin(0.5);

    // 3. ESTADÍSTICAS DEL INTENTO
    this.add.text(width / 2, height * 0.55, `Reliquias salvadas: ${this.recolectadas} de ${this.totales}`, {
      fontFamily: '"PressStart2P"',
      fontSize: '16px',
      color: '#fbbf24', // Dorado
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // 4. BOTONES INTERACTIVOS
    const restartBtn = this.add.text(width / 2, height * 0.75, 'REINTENTAR', {
      fontFamily: '"PressStart2P"',
      fontSize: '20px',
      color: '#e4e4e7'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    const menuBtn = this.add.text(width / 2, height * 0.85, 'SALIR AL MENÚ', {
      fontFamily: '"PressStart2P"',
      fontSize: '20px',
      color: '#e4e4e7'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    // --- EFECTOS HOVER Y CLICS PARA "REINTENTAR" ---
    restartBtn.on('pointerover', () => {
      restartBtn.setColor('#34d399'); // Se pone verde al pasar el mouse
      restartBtn.setScale(1.1);
    });
    restartBtn.on('pointerout', () => {
      restartBtn.setColor('#e4e4e7');
      restartBtn.setScale(1);
    });
    restartBtn.on('pointerdown', () => {
      this.scene.start('GameScene');
    });

    // --- EFECTOS HOVER Y CLICS PARA "SALIR AL MENÚ" ---
    menuBtn.on('pointerover', () => {
      menuBtn.setColor('#fbbf24'); // Se pone amarillo al pasar el mouse
      menuBtn.setScale(1.1);
    });
    menuBtn.on('pointerout', () => {
      menuBtn.setColor('#e4e4e7');
      menuBtn.setScale(1);
    });
    menuBtn.on('pointerdown', () => {
      this.scene.start('MenuScene');
    });
  }
}