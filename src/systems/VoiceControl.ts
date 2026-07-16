// Wrapper de la Web Speech API. No conoce nada de Phaser ni del juego:
// solo escucha continuamente y dispara callbacks cuando el texto reconocido
// contiene alguna de las palabras clave registradas.

type Comando = {
  patrones: string[];
  accion: () => void;
};

type EstadoVoz = 'inactivo' | 'escuchando' | 'no-soportado' | 'permiso-denegado';

const DIACRITICOS = new RegExp('[̀-ͯ]', 'g');

function normalizar(texto: string): string {
  return texto.toLowerCase().normalize('NFD').replace(DIACRITICOS, '');
}

// Tiempo mínimo entre dos disparos del mismo comando. Con resultados parciales
// activados, el mismo comando puede "matchear" varias veces mientras el motor
// de reconocimiento sigue refinando la misma frase; esto evita, por ejemplo,
// que "empezar" dispare dos transiciones de escena por una sola palabra dicha.
const ENFRIAMIENTO_MS = 600;

class VoiceControlManager {
  private reconocimiento: SpeechRecognition | null = null;
  private comandos: Comando[] = [];
  private ultimaEjecucion: Map<Comando, number> = new Map();
  private activo: boolean = false;
  private estado: EstadoVoz;
  private listenersEstado: Array<(estado: EstadoVoz, ultimoTexto: string) => void> = [];

  public readonly soportado: boolean;

  constructor() {
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.soportado = !!SpeechRecognitionCtor;
    this.estado = this.soportado ? 'inactivo' : 'no-soportado';

    if (SpeechRecognitionCtor) {
      this.reconocimiento = new SpeechRecognitionCtor();
      this.reconocimiento.continuous = true;
      // interimResults=true: reaccionamos al resultado parcial apenas el motor
      // lo reconoce, en vez de esperar a que detecte una pausa de silencio
      // (~1s+). Es clave para comandos rápidos como "salta".
      this.reconocimiento.interimResults = true;
      this.reconocimiento.lang = 'es-PE';

      this.reconocimiento.onresult = (evento: SpeechRecognitionEvent) => {
        for (let i = evento.resultIndex; i < evento.results.length; i++) {
          const texto = normalizar(evento.results[i][0].transcript);
          this.procesarTexto(texto);
        }
      };

      this.reconocimiento.onerror = (evento: SpeechRecognitionErrorEvent) => {
        if (evento.error === 'not-allowed' || evento.error === 'service-not-allowed') {
          this.activo = false;
          this.cambiarEstado('permiso-denegado');
        }
        // Otros errores (ej. 'no-speech') se ignoran: onend se encarga de reiniciar.
      };

      this.reconocimiento.onend = () => {
        if (this.activo) {
          try {
            this.reconocimiento!.start();
          } catch {
            // Ignoramos errores de "ya estaba iniciado" por llamadas duplicadas.
          }
        }
      };
    }
  }

  private procesarTexto(texto: string) {
    const ahora = performance.now();
    for (const comando of this.comandos) {
      if (comando.patrones.some((patron) => texto.includes(patron))) {
        const ultimaVez = this.ultimaEjecucion.get(comando) ?? -Infinity;
        if (ahora - ultimaVez >= ENFRIAMIENTO_MS) {
          this.ultimaEjecucion.set(comando, ahora);
          comando.accion();
        }
      }
    }
    this.cambiarEstado(this.estado, texto);
  }

  private cambiarEstado(estado: EstadoVoz, ultimoTexto: string = '') {
    this.estado = estado;
    this.listenersEstado.forEach((cb) => cb(estado, ultimoTexto));
  }

  public onEstadoCambiado(cb: (estado: EstadoVoz, ultimoTexto: string) => void) {
    this.listenersEstado.push(cb);
  }

  public get estaActivo(): boolean {
    return this.activo;
  }

  public activar() {
    if (!this.soportado || this.activo) return;
    this.activo = true;
    try {
      this.reconocimiento!.start();
      this.cambiarEstado('escuchando');
    } catch {
      // start() puede lanzar si ya estaba iniciado; lo ignoramos.
    }
  }

  public desactivar() {
    if (!this.soportado) return;
    this.activo = false;
    this.reconocimiento?.stop();
    this.cambiarEstado('inactivo');
  }

  public registrarComando(patrones: string[], accion: () => void) {
    const patronesNormalizados = patrones.map(normalizar);
    this.comandos.push({ patrones: patronesNormalizados, accion });
  }

  public limpiarComandos() {
    this.comandos = [];
    this.ultimaEjecucion.clear();
  }
}

export const voiceControl = new VoiceControlManager();
export type { EstadoVoz };
