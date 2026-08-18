export interface Business {
  id: string;
  nombre: string;
  tipo_negocio: "restaurante" | "tienda";
  moneda: string;
  horario: string;
  direccion: string;
  telefono: string;
  metodos_pago: string[];
  costo_domicilio: number;
  personalidad: string;
  /**
   * Como se ve una direccion COMPLETA para este negocio/pais. Se usa para que el
   * bot sepa que pedir cuando el cliente da una direccion a medias. Configurable
   * porque el formato cambia por pais (en Colombia hace falta la placa: #15-30).
   */
  formato_direccion?: string;
  /** Conocimiento adicional en texto libre que el bot debe usar (promos, politicas, etc.). */
  contexto?: string;
  /** Preguntas frecuentes con su respuesta, que el bot usa al responder. */
  qa?: { q: string; a: string }[];
  /** Instrucciones/reglas que el bot debe seguir (cada una activable). */
  instrucciones?: { text: string; on: boolean }[];
  /** Reglas de enrutamiento: cuando escalar la conversacion a un asesor humano. */
  reglas_escalamiento?: { text: string; on: boolean }[];
  /** Interruptor maestro del enrutamiento a asesor (por defecto activo). */
  escalamiento_on?: boolean;
  /** Paginas web indexadas: su URL y el texto extraido, que el bot usa como conocimiento. */
  paginas?: { url: string; texto: string }[];
  /** Documentos subidos (nombre + texto extraido) que el bot usa como conocimiento. */
  archivos?: { nombre: string; texto: string }[];
  /** Nombre con el que el bot se presenta (ej: "Bri"). */
  nombre_bot?: string;
  /** Saludo preferido para clientes nuevos. */
  bienvenida?: string;
  /** Tono de las respuestas (ej: Cercano, Formal). */
  tono?: string;
  /** Umbral (0-100) para marcar un lead como "Casi seguro". Por defecto 70. */
  umbral_hot?: number;
  /** Estilo de respuesta: "Conversacional" (por defecto) o "Formal". */
  estilo?: string;
  /** Idioma: "auto" | "es" | "en". Por defecto espanol. */
  idioma?: string;
  /** Si el bot puede enviar fotos de productos (por defecto true). */
  enviar_fotos?: boolean;
  /** Ofrecer pasar con un asesor cuando no sabe algo. */
  fallback_asesor?: boolean;
  /** Escalar a un asesor si el cliente esta molesto/frustrado. */
  escalar_frustrado?: boolean;
  /** Escalar a un asesor si no logra resolver tras varios intentos. */
  escalar_sin_respuesta?: boolean;
  /** Zona horaria IANA para saber si esta abierto ahora. Por defecto America/Bogota. */
  zona_horaria?: string;
  /**
   * Horario por dia de la semana. Clave: lun,mar,mie,jue,vie,sab,dom.
   * Valor: rangos "HH:MM-HH:MM" separados por coma, o "" (cerrado ese dia).
   * Ej: { "lun": "11:00-22:00", "dom": "" }
   */
  horarios?: Record<string, string>;
  /** ID del numero de WhatsApp (Meta) para enrutar mensajes a este negocio. */
  whatsapp_phone_number_id?: string;
}

const DIAS = ["dom", "lun", "mar", "mie", "jue", "vie", "sab"] as const;
const DIAS_LARGO = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];

/** Hora de pared (dia de semana y minutos desde medianoche) en una zona horaria. */
function horaEnZona(now: Date, tz: string): { diaIdx: number; minutos: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const diaIdx = map[get("weekday")] ?? 0;
  let hora = parseInt(get("hour"), 10);
  if (hora === 24) hora = 0;
  const minutos = hora * 60 + parseInt(get("minute"), 10);
  return { diaIdx, minutos };
}

function parseRangos(valor: string): [number, number][] {
  return (valor || "")
    .split(",")
    .map((r) => r.trim())
    .filter(Boolean)
    .map((r) => {
      const [a, b] = r.split("-").map((x) => x.trim());
      const min = (h: string) => {
        const [hh, mm] = h.split(":").map((n) => parseInt(n, 10));
        return (hh || 0) * 60 + (mm || 0);
      };
      return [min(a), min(b)] as [number, number];
    });
}

function fmtHora(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const ampm = h < 12 ? "a.m." : "p.m.";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export interface EstadoNegocio {
  abierto: boolean;
  ahora: string; // "miercoles, 3:45 p.m."
  horarioHoy: string; // "11:00 a.m. a 10:00 p.m." o "cerrado"
  proximaApertura?: string; // "abre manana a las 11:00 a.m."
}

/** Calcula si el negocio esta abierto ahora y datos de horario para el bot. */
export function estadoNegocio(business: Business, now: Date = new Date()): EstadoNegocio {
  const tz = business.zona_horaria || "America/Bogota";
  const { diaIdx, minutos } = horaEnZona(now, tz);
  const ahora = `${DIAS_LARGO[diaIdx]}, ${fmtHora(minutos)}`;

  if (!business.horarios) {
    // Sin horario configurado: no afirmamos nada, dejamos que responda con naturalidad.
    return { abierto: true, ahora, horarioHoy: business.horario || "" };
  }

  const rangosHoy = parseRangos(business.horarios[DIAS[diaIdx]] ?? "");
  const abierto = rangosHoy.some(([a, b]) => minutos >= a && minutos < b);
  const horarioHoy = rangosHoy.length
    ? rangosHoy.map(([a, b]) => `${fmtHora(a)} a ${fmtHora(b)}`).join(" y ")
    : "cerrado";

  let proximaApertura: string | undefined;
  if (!abierto) {
    // Hoy mas tarde?
    const masTarde = rangosHoy.find(([a]) => a > minutos);
    if (masTarde) {
      proximaApertura = `hoy a las ${fmtHora(masTarde[0])}`;
    } else {
      // Busca el proximo dia con horario.
      for (let i = 1; i <= 7; i++) {
        const d = (diaIdx + i) % 7;
        const r = parseRangos(business.horarios[DIAS[d]] ?? "");
        if (r.length) {
          const cuando = i === 1 ? "manana" : `el ${DIAS_LARGO[d]}`;
          proximaApertura = `${cuando} a las ${fmtHora(r[0][0])}`;
          break;
        }
      }
    }
  }

  return { abierto, ahora, horarioHoy, proximaApertura };
}

/** Formato de direccion por defecto (Colombia) si el negocio no define uno. */
export const FORMATO_DIRECCION_DEFAULT =
  "Via + numero + placa. Ejemplos validos: 'Calle 97 #15-30 apto 501', 'Carrera 15 #97-20 barrio Chico', 'Calle 97 con carrera 15'. Una via sola ('calle 97') NO sirve: falta la placa o con que via cruza.";

export interface MenuItem {
  nombre: string;
  precio: number;
  categoria: string;
  descripcion?: string;
  /** Foto del producto: URL http(s) publica, o un nombre de archivo local en data/tenants/<id>/img/ */
  imagen?: string;
}

/**
 * Resuelve la foto de un producto a una URL usable. Si es http(s) la usa tal cual;
 * si es un nombre de archivo, apunta a la ruta local /media/<tenantId>/<archivo>.
 */
export function resolveImageUrl(tenantId: string, imagen: string): string {
  if (/^https?:\/\//i.test(imagen)) return imagen;
  const safe = imagen.replace(/[^a-zA-Z0-9._-]/g, "");
  return `/media/${encodeURIComponent(tenantId)}/${safe}`;
}

/** Formatea un valor monetario, ej: 28000 -> "$28.000 COP" */
export function formatMoney(value: number, moneda: string): string {
  const formatted = new Intl.NumberFormat("es-CO").format(value);
  return `$${formatted} ${moneda}`;
}

/** Normaliza texto: minusculas, sin acentos, sin espacios sobrantes. */
function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

/** Busca un item dentro de un menu por nombre (sin distinguir mayusculas/acentos). */
export function findMenuItem(menu: MenuItem[], nombre: string): MenuItem | undefined {
  const target = norm(nombre);
  return (
    menu.find((m) => norm(m.nombre) === target) ||
    menu.find((m) => norm(m.nombre).includes(target) || target.includes(norm(m.nombre)))
  );
}
