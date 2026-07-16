import Phaser from 'phaser';

import Taiga from '../assets/taiga.png';
import FondoJuego from '../assets/fondo.jpg';
import IntroSound from '../assets/intro-bg.mp3'
import { voiceControl } from '../systems/VoiceControl';

export class IntroScene extends Phaser.Scene {
  private textosHistoria: string[] = [
    "En las profundidades de las antiguas ruinas peruanas,\nel eco de nuestro pasado corre peligro...",
    "Los huaqueros, saqueadores sin escrúpulos,\nhan invadido los templos sagrados para robar\nnuestras reliquias ancestrales.",
    "Pero una leyenda se alza desde las sombras...",
    "Taiga, la gata guardiana, usará su agilidad\ny valentía para detener el saqueo y preservar\nla memoria de nuestra cultura.",
    "¡Es hora de recuperar el legado de los ancestros!"
  ];

  private indiceTextoActual: number = 0;
  private textoPantalla!: Phaser.GameObjects.Text;
  private textoCompleto: string = "";
  private caracterActual: number = 0;
  private eventoEscritura?: Phaser.Time.TimerEvent;

  constructor() {
    super('IntroScene');
  }
  init(){
    this.indiceTextoActual = 0
    this.textoCompleto = ""
    this.caracterActual = 0
  }

  preload() {
    this.load.image('fondo_intro', FondoJuego);
    this.load.spritesheet('taiga_intro', Taiga, {
      frameWidth: 64,
      frameHeight: 64
    });

    this.load.audio('intro_sound', IntroSound)
  }

  create() {
    const { width, height } = this.scale;

    let musica = this.sound.get('intro_sound');

    if (!musica) {
      musica = this.sound.add('intro_sound', { 
        loop: true,   
        volume: 0.05
      });
    }

    if (!musica.isPlaying) {
      musica.play();
    }
    
    // Fondo oscurecido para ambiente misterioso
    const fondo = this.add.image(width / 2, height / 2, 'fondo_intro');
    fondo.setTint(0x222222);

    // Taiga animada en posición de guardia en el centro
    const taiga = this.add.sprite(width / 2, height * 0.35, 'taiga_intro');
    taiga.setScale(2.5);
    
    if (!this.anims.exists('intro_idle')) {
      this.anims.create({
        key: 'intro_idle',
        frames: this.anims.generateFrameNumbers('taiga_intro', { start: 6, end: 11 }),
        frameRate: 6,
        repeat: -1
      });
    }
    taiga.play('intro_idle');

    // Inicializar el objeto de texto en pantalla
    this.textoPantalla = this.add.text(width / 2, height * 0.65, '', {
      fontFamily: '"PressStart2P"',
      fontSize: '12px',
      color: '#e4e4e7',
      align: 'center',
      lineSpacing: 10,
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Texto de instrucción abajo estático
    const indicadorSiguiente = this.add.text(width / 2, height * 0.90, 'Presiona ESPACIO o CLIC para continuar', {
      fontFamily: '"PressStart2P"',
      fontSize: '10px',
      color: '#fbbf24'
    }).setOrigin(0.5);

    // Efecto parpadeo para el indicador de abajo
    this.tweens.add({
      targets: indicadorSiguiente,
      alpha: 0,
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    // Registrar inputs para avanzar en la historia
    this.input.keyboard!.on('keydown-SPACE', () => this.avanzarHistoria());
    this.input.on('pointerdown', () => this.avanzarHistoria());

    // --- COMANDOS DE VOZ ---
    voiceControl.limpiarComandos();
    voiceControl.registrarComando(['continuar', 'siguiente', 'avanzar'], () => this.avanzarHistoria());
    voiceControl.registrarComando(
      ['saltar presentacion', 'saltar la presentacion', 'saltar intro', 'saltar introduccion'],
      () => this.iniciarJuego()
    );

    // Comenzar a escribir el primer bloque de texto
    this.mostrarSiguienteTexto();
  }

  private mostrarSiguienteTexto() {
    // Si ya no hay más fragmentos de historia, pasamos al juego
    if (this.indiceTextoActual >= this.textosHistoria.length) {
      this.iniciarJuego();
      return;
    }

    // Configurar variables para el efecto máquina de escribir
    this.textoCompleto = this.textosHistoria[this.indiceTextoActual];
    this.textoPantalla.setText('');
    this.caracterActual = 0;

    // Limpiar evento anterior si existiera
    if (this.eventoEscritura) {
      this.eventoEscritura.destroy();
    }

    // Evento de tiempo que agrega una letra cada 40 milisegundos
    this.eventoEscritura = this.time.addEvent({
      delay: 40,
      callback: () => {
        this.caracterActual++;
        this.textoPantalla.setText(this.textoCompleto.substring(0, this.caracterActual));
        
        // Si terminó de escribir todo el bloque actual, detenemos el evento
        if (this.caracterActual >= this.textoCompleto.length) {
          this.eventoEscritura?.destroy();
        }
      },
      callbackScope: this,
      loop: true
    });
  }

  private avanzarHistoria() {
    // SEGURO: Si el jugador presiona avanzar mientras el texto se está escribiendo,
    // forzamos a que aparezca completo de inmediato en vez de saltar de página.
    if (this.caracterActual < this.textoCompleto.length) {
      this.eventoEscritura?.destroy();
      this.textoPantalla.setText(this.textoCompleto);
      this.caracterActual = this.textoCompleto.length;
    } else {
      // Si el texto ya estaba completo, avanzamos al siguiente bloque
      this.indiceTextoActual++;
      this.mostrarSiguienteTexto();
    }
  }

  private iniciarJuego() {
    // Transición suave de salida a negro para conectar con el nivel
    this.cameras.main.fadeOut(1000, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.sound.get('intro_sound').stop()
      this.scene.start('GameScene');
    });
  }
}