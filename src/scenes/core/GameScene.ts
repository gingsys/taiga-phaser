import Phaser from 'phaser';
import type { ILevel } from './interface/ILevel';
import { level1 } from './levels/Level1';

// ========================== ASSETS ==========================
// IMÁGENES
import Taiga from "../../assets/taiga.png";
import TaigaAtaque from '../../assets/taiga-ataque.png'
import Villano from '../../assets/villano.png'
import FondoJuego from '../../assets/fondo.jpg'
import SueloAsset from '../../assets/suelo.png'
import Piedra from '../../assets/piedra.png'
import Tumi from '../../assets/Tumi.png'
import Naringera from '../../assets/naringera.png'

// SONIDOS
import SoundBG from '../../assets/bg_sound.mp3'
import PickSound from '../../assets/coin.wav'
import JumpSound from '../../assets/jump.wav'
import AttackSound from '../../assets/tap.wav'
import HitSound from '../../assets/hurt.wav'
// ============================================================

export class GameScene extends Phaser.Scene {
  private currentLevelConfig!: ILevel;
  private jugador!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private teclas!: Phaser.Types.Input.Keyboard.CursorKeys;
  private piedras!: Phaser.Physics.Arcade.Group;
  public piso!: Phaser.GameObjects.TileSprite | any;
  
  private teclaAtaque!: Phaser.Input.Keyboard.Key;
  private atacando: boolean = false;
  private mirandoDerecha: boolean = true;

  private tiempoRestante: number = 15; // 60 segundos
  private textoTiempo!: Phaser.GameObjects.Text;
  private textoReliquias!: Phaser.GameObjects.Text;
  private temporizadorEvento!: Phaser.Time.TimerEvent;

  constructor() {
    super('GameScene');
  }

  init(){
    const levelId = this.registry.get('nivelActual') || 1;
    this.currentLevelConfig = levelId === 1 ? level1: level1;

    // --- RESETEO DE VALORES AL REINICIAR LA ESCENA ---
    this.tiempoRestante = 15;
    this.atacando = false;
    this.mirandoDerecha = true;
  }

  preload(){
    this.load.spritesheet('taiga', Taiga,{
      frameWidth: 64,
      frameHeight: 64
    });

    this.load.spritesheet('taigaAtaque', TaigaAtaque,{
      frameWidth: 64,
      frameHeight: 64
    });

    this.load.spritesheet('villano', Villano, { 
      frameWidth: 40, 
      frameHeight: 40 
    });

    this.load.spritesheet('tumi', Tumi, { 
      frameWidth: 18, 
      frameHeight: 17 
    });

    this.load.spritesheet('naringera', Naringera, { 
      frameWidth: 29, 
      frameHeight: 37 
    });


    this.load.image('fondo_juego',FondoJuego)
    this.load.image('suelo_32', SueloAsset)
    this.load.image('piedra', Piedra)
    this.load.audio('bg_music', SoundBG)
    this.load.audio('jump_sound', JumpSound)
    this.load.audio('attack_sound', AttackSound)
    this.load.audio('hit_sound', HitSound)
    this.load.audio('pick_sound', PickSound)

    this.currentLevelConfig.preload(this);
  }

  create() {
    const { width, height } = this.scale;

    const fondo = this.add.image(width/2, height/2,'fondo_juego')
    fondo.setDepth(-1)

    // --- SISTEMA DE MÚSICA DE FONDO ---
    // Comprobamos si el motor de audio ya tiene registrada esta canción.
    // Si NO existe, la creamos y la reproducimos. Así evitamos que se superponga al reiniciar.
    let musica = this.sound.get('bg_music');

    if (!musica) {
      musica = this.sound.add('bg_music', { 
        loop: true,   
        volume: 0.05
      });
    }

    if (!musica.isPlaying) {
      musica.play();
    }

    // --- TEXTOS DEL HUD EN PANTALLA ---
    this.textoTiempo = this.add.text(16, 5, `TIEMPO: ${this.tiempoRestante}`, {
      fontFamily: '"PressStart2P"', fontSize: '14px', color: '#ef4444', stroke: '#000000', strokeThickness: 4
    }).setDepth(10); // Aseguramos que se dibuje por encima de todo

    this.textoReliquias = this.add.text(width - 220, 5, `RELIQUIAS: 0/0`, {
      fontFamily: '"PressStart2P"', fontSize: '14px', color: '#fbbf24', stroke: '#000000', strokeThickness: 4
    }).setDepth(10);

    // --- TEMPORIZADOR ---
    this.temporizadorEvento = this.time.addEvent({
      delay: 1000, 
      callback: this.bajarSegundo,
      callbackScope: this,
      loop: true
    });

    this.piso = this.add.tileSprite(0, 335, width, 32, 'suelo_32').setOrigin(0, 0);
    this.physics.add.existing(this.piso, true);
    
    // this.input.on('pointerdown', () => {
    //   this.scene.start('GameOverScene', { score: 1500 }); // Podemos pasar datos entre escenas
    // });

    this.teclas = this.input.keyboard!.createCursorKeys();
    this.teclaAtaque = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D);

    this.jugador = this.physics.add.sprite(0,307,'taiga');
    this.jugador.body.setSize(30, 50);
    this.jugador.body.setOffset(17, 14);
    this.jugador.setCollideWorldBounds(true);
    this.physics.add.collider(this.jugador, this.piso);
    

    this.anims.create({
      key: 'jugador_derecha',
      frames: this.anims.generateFrameNumbers('taiga',{ start: 6, end: 11 }),
      frameRate: 10,
      repeat: -1
    })

    this.anims.create({
      key: 'jugador_izquierda',
      frames: this.anims.generateFrameNumbers('taiga',{ start: 12, end: 17 }),
      frameRate: 10,
      repeat: -1
    })

    this.anims.create({
      key: 'ataque_derecha',
      frames: this.anims.generateFrameNumbers('taigaAtaque', { start: 0, end: 2 }),
      frameRate: 10,
      repeat: 0
    });

    this.anims.create({
      key: 'ataque_izquierda',
      frames: this.anims.generateFrameNumbers('taigaAtaque', { start: 3, end: 5 }),
      frameRate: 10,
      repeat: 0
    });

    this.anims.create({
      key: 'villano_derecha',
      frames: this.anims.generateFrameNumbers('villano', { start: 6, end: 11 }),
      frameRate: 10,
      repeat: -1
    });

    this.anims.create({
      key: 'villano_izquierda',
      frames: this.anims.generateFrameNumbers('villano', { start: 12, end: 17 }),
      frameRate: 10,
      repeat: -1
    });

    this.anims.create({
      key: 'tumi_anim',
      frames: this.anims.generateFrameNumbers('tumi', { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1
    });

    this.anims.create({
      key: 'naringera_anim',
      frames: this.anims.generateFrameNumbers('naringera', { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1
    });

    this.piedras = this.physics.add.group();

    // ATAQUE Y DIRECCIÓN DE ATAQUE
    this.jugador.on('animationupdate', (anim: Phaser.Animations.Animation, frame: Phaser.Animations.AnimationFrame) => {
      if (anim.key === 'ataque_derecha' || anim.key === 'ataque_izquierda') {
        
        if (frame.index === 2) {
          const direccionX = this.mirandoDerecha ? 1 : -1;
          const spawnX = this.jugador.x + (30 * direccionX);
          const spawnY = this.jugador.y;

          const piedra = this.piedras.create(spawnX, spawnY, 'piedra');
          piedra.setScale(0.7);
          piedra.setVelocityX(400 * direccionX);
          piedra.body.setAllowGravity(false);
          this.sound.play('attack_sound', { volume: 0.4 });
        }
      }
    });

    this.jugador.on('animationcomplete', (anim: Phaser.Animations.Animation) => {
      if (anim.key === 'ataque_derecha' || anim.key === 'ataque_izquierda') {
        this.atacando = false;
        this.jugador.setTexture('taiga'); 
      }
    });

    this.currentLevelConfig.create(this, this.jugador, this.piedras, this.piso)
  }

  update(time: number, delta: number): void {
    if (this.jugador.getData('golpeada')) {
      this.jugador.update();
      this.currentLevelConfig.update(this, time, delta);
      return; // El 'return' hace que el código de abajo (teclas) no se ejecute en este frame
    }
    
    if (Phaser.Input.Keyboard.JustDown(this.teclaAtaque) && !this.atacando) {
      this.atacando = true;
      if (this.mirandoDerecha) {
        this.jugador.anims.play('ataque_derecha', true);
      } else {
        this.jugador.anims.play('ataque_izquierda', true);
      }
    }

    if (this.teclas.right.isDown) {
      this.jugador.setVelocityX(160)
      this.mirandoDerecha = true;
      if (!this.atacando) {
        this.jugador.anims.play('jugador_derecha', true);
      }
    }else if (this.teclas.left.isDown) {
      this.jugador.setVelocityX(-160)
      this.mirandoDerecha = false;
      if (!this.atacando) {
        this.jugador.anims.play('jugador_izquierda', true);
      }
    }else {
      this.jugador.setVelocityX(0);
      if (!this.atacando) {
        this.jugador.anims.stop();
        this.jugador.setTexture('taiga');
      }
    }

    const enElSuelo = this.jugador.body.blocked.down || this.jugador.body.touching.down;    

    // SALTO
    if (Phaser.Input.Keyboard.JustDown(this.teclas.space) && enElSuelo) {
      this.jugador.setVelocityY(-550);
      this.sound.play('jump_sound', {volume: 0.5})  
    }

    // SALTO VARIABLE
    // if (this.teclas.space.isUp && this.jugador.body.velocity.y < 0) {
    //   this.jugador.setVelocityY(this.jugador.body.velocity.y * 0.5);
    // }

    this.jugador.update();
    this.currentLevelConfig.update(this, time, delta)
  }

  private bajarSegundo() {
    this.tiempoRestante--;
    this.textoTiempo.setText(`TIEMPO: ${this.tiempoRestante}`);

    // Añadimos un aviso de parpadeo cuando quedan menos de 10 segundos
    if (this.tiempoRestante <= 10) {
      this.textoTiempo.setColor(this.tiempoRestante % 2 === 0 ? '#ef4444' : '#ffffff');
    }

    if (this.tiempoRestante <= 0) {
      this.temporizadorEvento.destroy();
      this.perderPorTiempo();
    }
  }

  public actualizarContadorReliquias(recolectadas: number, totales: number) {
    this.textoReliquias.setText(`RELIQUIAS: ${recolectadas}/${totales}`);
  }

  private perderPorTiempo() {
    this.sound.stopAll();    
    
    // Pasamos los datos al iniciar la escena
    this.scene.start('GameOverScene', { 
      recolectadas: level1.reliquiasRecolectadas, 
      totales: level1.reliquiasTotales 
    });
  }

  public ganarNivel() {
    this.temporizadorEvento.destroy();
    //this.sound.destroy();
    // Transición limpia
    this.cameras.main.fadeOut(1500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.sound.get('bg_music').stop()
      this.scene.start('MenuScene'); 
    });
  }
}