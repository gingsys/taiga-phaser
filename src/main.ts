// src/main.ts
import './style.css';
import Phaser from 'phaser';
import { IntroScene } from './scenes/IntroScene';
import { MenuScene } from './scenes/MenuScene';
import { ComandosScene } from './scenes/ComandosScene';
import { GameScene } from './scenes/core/GameScene';
import { GameOverScene } from './scenes/GameOverScene';
import { StarScene } from './scenes/StartScene';
import { VictoryScene } from './scenes/VictoryScene';
import { voiceControl } from './systems/VoiceControl';
import IconoTeclado from './assets/teclado.png';
import IconoMicrofono from './assets/microfono.png';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 640,
  height: 360,
  zoom: 1.5,
  parent: 'game-container',
  pixelArt: true,
  physics:{
    default: 'arcade',    
    arcade:{
      gravity:{
        x: 0,
        y: 1200
      },
      debug: false
    }
  },
  backgroundColor: '#18181b', // zinc-900  
  scene: [StarScene, MenuScene, ComandosScene, IntroScene, GameScene, GameOverScene, VictoryScene]
};

document.fonts.load('10pt "PressStart2P"').then(() => {
  new Phaser.Game(config);
  console.log('Fuente cargada correctamente')
}).catch(() => {
  console.warn('La fuente no pudo cargar, iniciando juego de todas formas...');
  new Phaser.Game(config);
});

// --- BOTÓN DE CONTROL POR VOZ / TECLADO (persiste fuera del canvas, entre todas las escenas) ---
// El teclado SIEMPRE funciona en el juego; este botón es un toggle visual que
// activa o desactiva el reconocimiento de voz como entrada adicional, para que
// el jugador pueda volver al teclado en cualquier momento si la voz le falla.
const botonVoz = document.getElementById('voice-toggle-btn') as HTMLButtonElement;
const iconoVoz = document.getElementById('voice-toggle-icon') as HTMLImageElement;
const estadoVoz = document.getElementById('voice-status') as HTMLSpanElement;

iconoVoz.src = IconoTeclado;

if (!voiceControl.soportado) {
  botonVoz.disabled = true;
  botonVoz.title = 'Tu navegador no soporta control por voz (usa Chrome o Edge)';
  estadoVoz.textContent = 'Voz no soportada';
} else {
  botonVoz.addEventListener('click', () => {
    if (voiceControl.estaActivo) {
      voiceControl.desactivar();
    } else {
      voiceControl.activar();
    }
  });

  voiceControl.onEstadoCambiado((estado, ultimoTexto) => {
    if (estado === 'escuchando') {
      iconoVoz.src = IconoMicrofono;
      
      botonVoz.classList.add('escuchando');
      botonVoz.title = 'Modo voz activo - clic para volver al teclado';
      estadoVoz.textContent = ultimoTexto ? `"${ultimoTexto}"` : 'Escuchando...';
    } else if (estado === 'permiso-denegado') {
      iconoVoz.src = IconoTeclado;
      botonVoz.classList.remove('escuchando');
      botonVoz.title = 'Permiso de micrófono denegado';
      estadoVoz.textContent = 'Permiso de micrófono denegado';
    } else {
      iconoVoz.src = IconoTeclado;
      botonVoz.classList.remove('escuchando');
      botonVoz.title = 'Modo teclado - clic para activar la voz';
      estadoVoz.textContent = '';
    }
  });
}