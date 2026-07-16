// src/levels/Level2.ts
import Phaser from 'phaser';
import type { ILevel } from '../interface/ILevel';
import { Villano } from '../../../entities/Villano';
import ItemLlama from '../../../assets/llama.png'

let grupoVillanos: Phaser.Physics.Arcade.Group;
let proyectilesEnemigos: Phaser.Physics.Arcade.Group;
let jefeSpawneado = false;

export const level2: ILevel = {
  reliquiasTotales: 1, // En este nivel, la única reliquia importante es la del Jefe
  reliquiasRecolectadas: 0,
  id: 2,
  
  preload: (scene) => {
    scene.load.spritesheet('item_llama', ItemLlama, { 
      frameWidth: 71, 
      frameHeight: 91 
    });
  },

  create: (scene, player, piedras, piso) => {
    level2.reliquiasRecolectadas = 0;
    jefeSpawneado = false;

    const plataformas = scene.physics.add.staticGroup();
    const grupoItems = scene.physics.add.group();
    proyectilesEnemigos = scene.physics.add.group();
    
    grupoVillanos = scene.physics.add.group({
      classType: Villano,
      runChildUpdate: true
    });

    scene.anims.create({
      key: 'llama_anim',
      frames: scene.anims.generateFrameNumbers('item_llama', { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1
    });

    // --- FUNCIÓN DE CREACIÓN DE PLATAFORMAS (Igual que en Nivel 1) ---
    const crearPlataformaFlotante = (x: number, y: number, bloquesMedio: number, cantidadVillanos: number = 0) => {
      const anchoBloque = 32;

      plataformas.create(x, y, 'plat_izq').setOrigin(0, 0).refreshBody();
      let xActual = x + anchoBloque;
      for (let i = 0; i < bloquesMedio; i++) {
        plataformas.create(xActual, y, 'plat_med').setOrigin(0, 0).refreshBody();
        xActual += anchoBloque;
      }
      plataformas.create(xActual, y, 'plat_der').setOrigin(0, 0).refreshBody();

      if (cantidadVillanos > 0) {
        const anchoTotal = anchoBloque + (bloquesMedio * anchoBloque) + anchoBloque;
        const limiteIzquierdo = x + 15;
        const limiteDerecho = (x + anchoTotal) - 15;

        for (let i = 0; i < cantidadVillanos; i++) {
          const fraccion = anchoTotal / (cantidadVillanos + 1);
          const spawnX = x + (fraccion * (i + 1));
          
          const nuevoVillano = new Villano({
            scene, x: spawnX, y: y - 40, minX: limiteIzquierdo, maxX: limiteDerecho, velocidad: 70
          });
          nuevoVillano.setScale(1.7).setImmovable(true).setPushable(false);
          
          // Le damos 1 punto de vida a los normales
          nuevoVillano.setData('hp', 1);
          grupoVillanos.add(nuevoVillano);
        }
      }
    };

    // DISEÑO DEL NIVEL 2: alturas y anchos irregulares (sin patrón de zigzag), cada plataforma
    // con su propio rango de x (ninguna queda apilada encima de otra, así nunca bloquea el
    // salto), y un arena abierta al final (x~850-1350) para la pelea contra el jefe.
    crearPlataformaFlotante(90, 250, 1, 1);
    crearPlataformaFlotante(220, 170, 2, 1);
    crearPlataformaFlotante(400, 230, 1, 1);
    crearPlataformaFlotante(530, 110, 3, 1);
    crearPlataformaFlotante(740, 180, 2, 1);
    crearPlataformaFlotante(910, 90, 3, 0); // plataforma decorativa del arena del jefe, sin villano

    // --- CINEMÁTICA DE APARICIÓN DEL JEFE ---
    // Congela la acción, sacude la pantalla y muestra un aviso antes de que el jefe entre en escena.
    const iniciarAparicionJefe = () => {
      const { width } = scene.scale;

      scene.physics.pause();
      scene.cameras.main.shake(1200, 0.015);

      // El texto de aviso va fijo en pantalla (scrollFactor 0), no en coordenadas del mundo
      const aviso = scene.add.text(width / 2, 70, '¡EL JEFE HA DESPERTADO!', {
        fontFamily: '"PressStart2P"', fontSize: '12px', color: '#ff0000', stroke: '#000000', strokeThickness: 4
      }).setOrigin(0.5).setDepth(20).setScrollFactor(0);

      scene.time.delayedCall(1200, () => {
        aviso.destroy();
        scene.physics.resume();

        // El jefe aparece en el arena final del nivel (x~980-1300), no en la pantalla inicial
        const jefe = new Villano({ scene, x: 1100, y: 50, minX: 850, maxX: 1350, velocidad: 120 });
        jefe.setImmovable(true).setPushable(false).setScale(0);
        jefe.setTint(0xff0000); // Color rojo furioso
        jefe.setData('hp', 12); // Resistencia de 12 golpes
        jefe.setData('esJefe', true);
        grupoVillanos.add(jefe);

        scene.tweens.add({ targets: jefe, scale: 2.5, duration: 400, ease: 'Back.Out' });
      });
    };

    // --- LÓGICA DE DISPARO ENEMIGO ---
    scene.time.addEvent({
      delay: 2500, // Cada 2.5 segundos
      callback: () => {
        grupoVillanos.getChildren().forEach((v) => {
          const villano = v as Phaser.Physics.Arcade.Sprite;
          // Solo dispara si está en pantalla y vivo
          if (villano.active) {
            // Calculamos hacia dónde mira según su velocidad
            const direccion = villano.body!.velocity.x > 0 ? 1 : -1;
            const proyectil = proyectilesEnemigos.create(villano.x, villano.y, 'piedra'); // Reemplaza 'piedra' si tienes otro sprite
            proyectil.body.setAllowGravity(false);
            proyectil.setVelocityX(200 * direccion);
            
            // Si quieres que la piedra enemiga se vea distinta, puedes pintarla de rojo:
            proyectil.setTint(0xff0000); 
          }
        });
      },
      loop: true
    });

    // --- COLISIONES GLOBALES ---
    scene.physics.add.collider(grupoVillanos, plataformas);
    scene.physics.add.collider(grupoVillanos, piso);

    scene.physics.add.collider(player, plataformas);

    scene.physics.add.collider(grupoItems, plataformas);
    scene.physics.add.collider(grupoItems, piso);

    // --- NUEVO: TAIGA VS PROYECTILES ENEMIGOS ---
    scene.physics.add.overlap(player, proyectilesEnemigos, (jugador, proyectil) => {
      const j = jugador as Phaser.Physics.Arcade.Sprite;
      proyectil.destroy(); // El proyectil desaparece al chocar
      
      if (j.getData('golpeada')) return;

      j.setData('golpeada', true);
      //j.setTint(0xff0000);
      
      // La empujamos hacia atrás dependiendo de dónde vino la piedra
      const empujeDir = j.x < (proyectil as Phaser.Physics.Arcade.Sprite).x ? -1 : 1;
      j.setVelocity(250 * empujeDir, -200); 
      
      scene.sound.play('hit_sound', {volume: 0.5});

      scene.time.delayedCall(400, () => {
        j.setData('golpeada', false);
        j.clearTint();
      });
    });

    // --- TAIGA VS VILLANOS (Igual que en Nivel 1, pero el jefe empuja más fuerte) ---
    scene.physics.add.collider(player, grupoVillanos, (jugador, villano) => {
      const j = jugador as Phaser.Physics.Arcade.Sprite;
      const v = villano as Phaser.Physics.Arcade.Sprite;
      if (j.getData('golpeada')) return;

      j.setData('golpeada', true);
      //j.setTint(0xff0000);
      const empujeDir = j.x < v.x ? -1 : 1;
      const esJefe = v.getData('esJefe');
      j.setVelocity(esJefe ? 500 * empujeDir : 300 * empujeDir, esJefe ? -400 : -250);
      scene.time.delayedCall(400, () => { j.setData('golpeada', false); j.clearTint(); });
    });

    // El jefe contraataca lanzando una piedra propia hacia el jugador, con una pequeña
    // demora para que se sienta como una reacción (no instantánea/injusta).
    const jefeContraataca = (jefe: Phaser.Physics.Arcade.Sprite) => {
      scene.time.delayedCall(150, () => {
        if (!jefe.active) return;
        const direccion = player.x < jefe.x ? -1 : 1;
        const proyectil = proyectilesEnemigos.create(jefe.x, jefe.y, 'piedra');
        proyectil.body.setAllowGravity(false);
        proyectil.setVelocityX(220 * direccion);
        proyectil.setTint(0xff0000);
      });
    };

    // --- COMBATE: PIEDRAS VS VILLANOS Y SPAWN DEL JEFE ---
    scene.physics.add.overlap(piedras, grupoVillanos, (piedra, villano) => {
      const v = villano as Phaser.Physics.Arcade.Sprite;

      // Dificultad media para el jefe: a veces esquiva el golpe, a veces rebota la piedra
      // devuelta como su propio ataque, y en un golpe normal siempre contraataca rápido.
      // No es invencible: la mayoría de las veces igual recibe el daño.
      if (v.getData('esJefe')) {
        const suerte = Math.random();

        if (suerte < 0.15) {
          // Rebote: la piedra del jugador se convierte en un contraataque inmediato
          piedra.destroy();
          jefeContraataca(v);
          return;
        }

        if (suerte < 0.4) {
          // Esquiva: salta para evitar el golpe y no recibe daño, pero contraataca igual
          piedra.destroy();
          v.setVelocityY(-300);
          jefeContraataca(v);
          return;
        }
      }

      piedra.destroy();
      scene.sound.play('hit_sound', {volume: 0.5});

      // Restamos vida
      let hp = v.getData('hp') - 1;
      v.setData('hp', hp);

      if (hp <= 0) {
        const posX = v.x;
        const posY = v.y;
        const eraJefe = v.getData('esJefe');
        v.destroy();

        if (eraJefe) {
          // Si era el jefe, soltamos el Ítem de la Victoria
          const itemVictoria = grupoItems.create(posX, posY, 'item_llama');
          itemVictoria.setScale(0.5)
          itemVictoria.anims.play('llama_anim', true);
          itemVictoria.setVelocityY(-150);
        } else {
          // Si era un enemigo normal, comprobamos si ya no quedan más
          if (grupoVillanos.countActive(true) === 0 && !jefeSpawneado) {
            jefeSpawneado = true;
            iniciarAparicionJefe();
          }
        }
      } else {
        // Efecto visual de que el jefe recibió daño pero no murió
        v.setTint(0xffffff);
        scene.time.delayedCall(100, () => v.setTint(0xff0000));
        if (v.getData('esJefe')) jefeContraataca(v);
      }
    });

    // --- RECOLECTAR RELIQUIA FINAL ---
    scene.physics.add.overlap(player, grupoItems, (_, item) => {
      item.destroy();
      scene.sound.play('pick_sound', {volume: 0.5});
      level2.reliquiasRecolectadas++;
      (scene as any).actualizarContadorReliquias(level2.reliquiasRecolectadas, level2.reliquiasTotales);

      if (level2.reliquiasRecolectadas >= level2.reliquiasTotales) {
        (scene as any).ganarNivel();
      }
    });
  },

  update: () => {
    if (grupoVillanos) {
      grupoVillanos.getChildren().forEach((v) => {
        v.update();
      });
    }
  }
};