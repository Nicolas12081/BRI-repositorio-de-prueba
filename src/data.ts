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
  /** ID del numero de WhatsApp (Meta) para enrutar mensajes a este negocio. */
  whatsapp_phone_number_id?: string;
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
