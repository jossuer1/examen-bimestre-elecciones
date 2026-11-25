const formatos = ['image/jpeg', 'image/png', 'image/webp'];
const maxFoto = 6 * 1024 * 1024;
const tipo = 'authenticated';
const vigenciaEnlace = 300;

export function esFotoActa(foto: FormDataEntryValue | null): foto is File {
  return foto instanceof File && formatos.includes(foto.type) && foto.size > 0 && foto.size <= maxFoto;
}

export class ErrorFoto extends Error {
  constructor(readonly estado: number, mensaje: string) {
    super(mensaje);
  }
}

function configuracion() {
  const cloud = Deno.env.get('CLOUDINARY_CLOUD_NAME');
  const key = Deno.env.get('CLOUDINARY_API_KEY');
  const secret = Deno.env.get('CLOUDINARY_API_SECRET');
  if (!cloud || !key || !secret) throw new ErrorFoto(503, 'El servicio de fotografías aún no está configurado.');
  return { cloud, key, secret, endpoint: `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloud)}/image` };
}

export async function subirFotoActa(foto: File, carpeta = 'actas') {
  const { cloud, key, secret, endpoint } = configuracion();
  const publicId = `${carpeta}/${crypto.randomUUID()}`;
  const headers = { Authorization: `Basic ${btoa(`${key}:${secret}`)}` };
  const imagen = new FormData();
  imagen.set('file', foto);
  imagen.set('public_id', publicId);
  imagen.set('type', tipo);
  let url: string;
  try {
    const subida = await fetch(`${endpoint}/upload`, { method: 'POST', headers, body: imagen });
    const resultado = await subida.json();
    if (!subida.ok || typeof resultado.secure_url !== 'string') {
      throw new ErrorFoto(502, 'No se pudo guardar la fotografía. Inténtalo de nuevo.');
    }
    const referencia = new URL(resultado.secure_url);
    const prefijo = `/${cloud}/image/authenticated/`;
    if (referencia.origin !== 'https://res.cloudinary.com' || !referencia.pathname.startsWith(prefijo)) {
      throw new ErrorFoto(502, 'No se pudo obtener una referencia segura para la fotografía.');
    }
    const ruta = referencia.pathname.slice(prefijo.length).replace(/^s--[A-Za-z0-9_-]+--\//, '');
    url = `${referencia.origin}${prefijo}${ruta}`;
  } catch (error) {
    if (error instanceof ErrorFoto) throw error;
    throw new ErrorFoto(502, 'No se pudo conectar con el servicio de fotografías.');
  }

  return {
    url,
    async retirar(): Promise<void> {
      const body = new FormData();
      body.set('public_id', publicId);
      body.set('type', tipo);
      try {
        const respuesta = await fetch(`${endpoint}/destroy`, { method: 'POST', headers, body });
        const datos = await respuesta.json();
        if (!respuesta.ok || !['ok', 'not found'].includes(datos.result)) {
          console.error('No se pudo retirar la fotografía', publicId);
        }
      } catch {
        console.error('No se pudo retirar la fotografía', publicId);
      }
    },
  };
}

export async function enlaceTemporalFotoActa(fotoUrl: string, actaId: number): Promise<string> {
  const { cloud, key, secret, endpoint } = configuracion();
  let url: URL;
  try {
    url = new URL(fotoUrl);
  } catch {
    throw new ErrorFoto(422, 'La foto de esta acta no está disponible.');
  }
  const prefijo = `/${cloud}/image/authenticated/`;
  const ruta = url.pathname.startsWith(prefijo) ? url.pathname.slice(prefijo.length) : '';
  const asset = ruta.match(/^(?:s--[A-Za-z0-9_-]+--\/)?(?:v\d+\/)?(actas\/(?:(\d+)\/)?[0-9a-f-]{36})\.(jpg|jpeg|png|webp)$/);
  if (url.origin !== 'https://res.cloudinary.com' || !asset || (asset[2] && asset[2] !== String(actaId))) {
    throw new ErrorFoto(422, 'La foto de esta acta no está disponible.');
  }

  const ahora = Math.floor(Date.now() / 1000);
  const parametros = new URLSearchParams({
    public_id: asset[1],
    format: asset[3],
    type: tipo,
    timestamp: String(ahora),
    expires_at: String(ahora + vigenciaEnlace),
  });
  parametros.sort();
  const entradaFirma = Array.from(parametros, ([nombre, valor]) => `${nombre}=${valor}`).join('&');
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(entradaFirma + secret));
  const firma = Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('');
  parametros.set('api_key', key);
  parametros.set('signature', firma);
  return `${endpoint}/download?${parametros}`;
}
