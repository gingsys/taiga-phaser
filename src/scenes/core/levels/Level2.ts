// src/levels/Level2.ts
import Phaser from 'phaser';
import type { ILevel } from '../interface/ILevel';
import { Villano } from '../../../entities/Villano';
import PlatIzquierda from '../../../assets/plat_izq.png';
import PlatMedio from '../../../assets/plat_med.png';
import PlatDerecha from '../../../assets/plat_der.png';

let grupoVillanos: Phaser.Physics.Arcade.Group;
let proyectilesEnemigos: Phaser.Physics.Arcade.Group;
let jefeSpawneado = false;

export const level2: ILevel = {
  reliquiasTotales: 1, // En este nivel, la única reliquia importante es la del Jefe
  reliquiasRecolectadas: 0,
  id: 2,
  
  preload: () => {
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

    // DISEÑO DEL NIVEL 2 (Más plataformas, más desafiante)
    crearPlataformaFlotante(50, 220, 3, 2);
    crearPlataformaFlotante(400, 120, 3, 2);

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
            proyectil.setTint(0xffa500); 
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
      j.setTint(0xff0000); 
      
      // La empujamos hacia atrás dependiendo de dónde vino la piedra
      const empujeDir = j.x < (proyectil as Phaser.Physics.Arcade.Sprite).x ? -1 : 1;
      j.setVelocity(250 * empujeDir, -200); 
      
      scene.sound.play('hit_sound', {volume: 0.5});

      scene.time.delayedCall(400, () => {
        j.setData('golpeada', false);
        j.clearTint();
      });
    });

    // --- TAIGA VS VILLANOS (Igual que en Nivel 1) ---
    scene.physics.add.collider(player, grupoVillanos, (jugador, villano) => {
      const j = jugador as Phaser.Physics.Arcade.Sprite;
      const v = villano as Phaser.Physics.Arcade.Sprite;
      if (j.getData('golpeada')) return;

      j.setData('golpeada', true);
      j.setTint(0xff0000); 
      const empujeDir = j.x < v.x ? -1 : 1;
      j.setVelocity(300 * empujeDir, -250); 
      scene.time.delayedCall(400, () => { j.setData('golpeada', false); j.clearTint(); });
    });

    // --- COMBATE: PIEDRAS VS VILLANOS Y SPAWN DEL JEFE ---
    scene.physics.add.overlap(piedras, grupoVillanos, (piedra, villano) => {      
      const v = villano as Phaser.Physics.Arcade.Sprite;
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
          const itemVictoria = grupoItems.create(posX, posY, 'tumi');
          itemVictoria.anims.play('tumi_anim', true);
          itemVictoria.setVelocityY(-150);
        } else {
          // Si era un enemigo normal, comprobamos si ya no quedan más
          if (grupoVillanos.countActive(true) === 0 && !jefeSpawneado) {
            jefeSpawneado = true;
            
            // --- SPAWN DEL JEFE ---
            const jefe = new Villano({
              scene, x: 400, y: 50, minX: 100, maxX: 700, velocidad: 120
            });
            jefe.setScale(2.5).setImmovable(true).setPushable(false);
            jefe.setTint(0xff0000); // Color rojo furioso
            jefe.setData('hp', 3);  // Resistencia de 3 golpes
            jefe.setData('esJefe', true);
            grupoVillanos.add(jefe);
          }
        }
      } else {
        // Efecto visual de que el jefe recibió daño pero no murió
        v.setTint(0xffffff);
        scene.time.delayedCall(100, () => v.setTint(0xff0000));
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

  update: (scene, time, delta) => {
    if (grupoVillanos) {
      grupoVillanos.getChildren().forEach((v) => {
        v.update();
      });
    }
  }
};