import Phaser from 'phaser';
import type { ILevel } from '../interface/ILevel';
import PlatIzquierda from '../../../assets/plat_izq.png'
import PlatMedio from '../../../assets/plat_med.png'
import PlatDerecha from '../../../assets/plat_der.png'
import { Villano } from '../../../entities/Villano';

let grupoVillanos: Phaser.Physics.Arcade.Group;

export const level1: ILevel = {
  reliquiasTotales: 0,
  reliquiasRecolectadas: 0,
  id: 1,
  preload: (scene) => {
    // Carga solo lo que el nivel 1 necesita
    scene.load.image('plat_izq', PlatIzquierda);
    scene.load.image('plat_med', PlatMedio);
    scene.load.image('plat_der', PlatDerecha);
  },

  create: (scene, player, piedras, piso) => {
    // 2. Crear un grupo estático de físicas para todas las plataformas del nivel
    level1.reliquiasTotales = 0;
    level1.reliquiasRecolectadas = 0;

    const plataformas = scene.physics.add.staticGroup();
    const grupoItems = scene.physics.add.group();
    
    grupoVillanos = scene.physics.add.group({
      classType: Villano,
      runChildUpdate: true
    })

    // 3. FUNCIÓN LOCAL PARA CONSTRUIR PLATAFORMAS DINÁMICAMENTE
    const crearPlataformaFlotante = (x: number, y: number, bloquesMedio: number, cantidadVillanos: number = 0) => {
      const anchoBloque = 32;

      plataformas.create(x, y, 'plat_izq').setOrigin(0, 0).refreshBody();
      
      let xActual = x + anchoBloque;
      for (let i = 0; i < bloquesMedio; i++) {
        plataformas.create(xActual, y, 'plat_med').setOrigin(0, 0).refreshBody();
        xActual += anchoBloque;
      }

      plataformas.create(xActual, y, 'plat_der').setOrigin(0, 0).refreshBody();

      // --- LÓGICA DEL SPAWN DEL VILLANO ---
      if (cantidadVillanos > 0) {
        level1.reliquiasTotales += cantidadVillanos;
        // Calculamos el ancho total: Bloque Izq + Bloques Medio + Bloque Der
        const anchoTotal = anchoBloque + (bloquesMedio * anchoBloque) + anchoBloque;
        
        // Margen de 15 píxeles en los bordes para que no se asome demasiado y caiga
        const limiteIzquierdo = x + 15;
        const limiteDerecho = (x + anchoTotal) - 15;

        for (let i = 0; i < cantidadVillanos; i++) {
          // Calculamos un spawnX ligeramente diferente para cada uno para que no nazcan encimados
          // Los distribuimos uniformemente a lo largo de la plataforma
          const fraccion = anchoTotal / (cantidadVillanos + 1);
          const spawnX = x + (fraccion * (i + 1));
          const spawnY = y - 40;

          // Hacemos que alternen su dirección inicial (uno arranca a la izquierda, el otro a la derecha)
          // Si 'i' es par van a una velocidad negativa, si es impar a una positiva
          const velocidadInicial = (i % 2 === 0) ? 80 : 60; 

          const nuevoVillano = new Villano({
            scene, 
            x: spawnX, 
            y: spawnY, 
            minX: limiteIzquierdo, 
            maxX: limiteDerecho, 
            velocidad: velocidadInicial
          });

          nuevoVillano.setScale(1.7)

          nuevoVillano.setImmovable(true);
          nuevoVillano.setPushable(false);

          if (i % 2 !== 0) {
            nuevoVillano.setVelocityX(velocidadInicial);
            nuevoVillano.anims.play('villano_derecha', true);
          }

          grupoVillanos.add(nuevoVillano);
        }
      }
    };

    // DIBUJO DE PLATAFORMAS
    crearPlataformaFlotante(0, 80, 7, 3);    
    crearPlataformaFlotante(150, 225, 2, 1);
    crearPlataformaFlotante(350, 150, 5, 1);
 
    // COLISIONES GLOBALES
    scene.physics.add.collider(grupoVillanos, plataformas);
    scene.physics.add.collider(grupoVillanos, piso)
    scene.physics.add.collider(player, plataformas);

    scene.physics.add.collider(player, grupoVillanos, (jugador, villano) => {
      const j = jugador as Phaser.Physics.Arcade.Sprite;
      const v = villano as Phaser.Physics.Arcade.Sprite;
      
      if (j.getData('golpeada')) return;

      j.setData('golpeada', true);
      
      const empujeDir = j.x < v.x ? -1 : 1;
      j.setVelocity(300 * empujeDir, -250); 
      
      // (Opcional) Puedes agregar un sonido de dolor para Taiga aquí si tienes uno
      scene.sound.play('hit_sound', {volume: 0.5});

      scene.time.delayedCall(400, () => {
        j.setData('golpeada', false);
        j.clearTint();
      });
    });

    // COLISIONES DE LOS VILLANOS CON LA PIEDRA
    scene.physics.add.overlap(piedras, grupoVillanos, (piedra, villano)=>{      
      // Casteamos a Sprite para leer las coordenadas
      const v = villano as Phaser.Physics.Arcade.Sprite;
      const posX = v.x;
      const posY = v.y;

      // Destruimos la piedra y al villano
      piedra.destroy();
      villano.destroy();
      scene.sound.play('hit_sound', {volume: 0.5})      

      // --- LÓGICA DE SPAWN DEL ÍTEM ---
      // Elegimos aleatoriamente entre 0 y 1 para decidir qué ítem soltar
      const esItem1 = Phaser.Math.Between(0, 1) === 0;
      const itemKey = esItem1 ? 'tumi' : 'naringera';
      const itemAnim = esItem1 ? 'tumi_anim' : 'naringera_anim';

      // Creamos el ítem exactamente donde murió el villano
      const nuevoItem = grupoItems.create(posX, posY, itemKey);
      
      // Reproducimos su animación
      nuevoItem.anims.play(itemAnim, true);

      
      nuevoItem.setVelocityY(-150);
    })

    scene.physics.add.overlap(player, grupoItems, (_, item) => {
      item.destroy();
      scene.sound.play('pick_sound', {volume: 0.5});

      // Sumamos y avisamos al UI
      level1.reliquiasRecolectadas++;
      (scene as any).actualizarContadorReliquias(level1.reliquiasRecolectadas, level1.reliquiasTotales);

      // Verificamos si ya ganamos
      if (level1.reliquiasRecolectadas >= level1.reliquiasTotales) {
        (scene as any).ganarNivel(); // pasa al nivel 2
      }
    });

    scene.physics.add.collider(grupoItems, plataformas)
    scene.physics.add.collider(grupoItems, piso)
  },

  update: (scene, time, delta) => {
    // Lógica específica del nivel (ej. mover plataformas móviles, spawnear lluvia, etc)
    if (grupoVillanos) {
      grupoVillanos.getChildren().forEach((v) => {
        v.update();
      });
    }
  }
};