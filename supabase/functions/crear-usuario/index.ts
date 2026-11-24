import { createClient } from 'npm:@supabase/supabase-js@2';

const CLAVE_INICIAL = 'Ecuador2026';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function responder(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

// Misma validación que en la app: el servidor nunca confía en el cliente
function cedulaValida(c: string): boolean {
  if (!/^\d{10}$/.test(c)) return false;
  const provincia = parseInt(c.substring(0, 2), 10);
  if (provincia < 1 || (provincia > 24 && provincia !== 30)) return false;
  if (parseInt(c[2], 10) > 5) return false;
  let suma = 0;
  for (let i = 0; i < 9; i++) {
    let d = parseInt(c[i], 10);
    if (i % 2 === 0) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    suma += d;
  }
  return (10 - (suma % 10)) % 10 === parseInt(c[9], 10);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return responder(405, { error: 'Método no permitido.' });

  const url = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!; // solo existe aquí
  const admin = createClient(url, serviceKey);

  // 1. ¿Quién llama?
  const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
  if (!token) return responder(401, { error: 'Sesión no válida.' });
  const { data: sesion, error: errSesion } = await admin.auth.getUser(token);
  if (errSesion || !sesion.user) return responder(401, { error: 'Sesión no válida.' });

  const { data: llamador } = await admin
    .from('perfiles')
    .select('id, rol, recinto_id')
    .eq('id', sesion.user.id)
    .maybeSingle();
  if (!llamador) return responder(403, { error: 'No tienes permisos para esta acción.' });

  // 2. Validar los datos recibidos
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return responder(400, { error: 'Solicitud inválida.' });
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return responder(400, { error: 'Solicitud inválida.' });
  }
  const cedula = String(body.cedula ?? '').trim();
  const nombres = String(body.nombres ?? '').trim();
  const apellidos = String(body.apellidos ?? '').trim();
  const telefono = String(body.telefono ?? '').trim();
  const correo = String(body.correo ?? '')
    .trim()
    .toLowerCase();

  if (!cedulaValida(cedula)) return responder(400, { error: 'La cédula no es válida.' });
  if (nombres.length < 2 || apellidos.length < 2) {
    return responder(400, { error: 'Nombres y apellidos son obligatorios.' });
  }
  if (!/^\d{9,10}$/.test(telefono)) return responder(400, { error: 'El teléfono no es válido.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    return responder(400, { error: 'El correo no es válido.' });
  }

  // 3. Según el rol de quien llama, decidir qué se crea y dónde
  let rolNuevo: 'recinto' | 'veedor';
  let recintoId: number;

  if (llamador.rol === 'provincial') {
    rolNuevo = 'recinto';
    recintoId = Number(body.recinto_id);
    if (!Number.isInteger(recintoId)) return responder(400, { error: 'Recinto no válido.' });

    const { data: recinto } = await admin
      .from('recintos')
      .select('id, coordinador_id')
      .eq('id', recintoId)
      .maybeSingle();
    if (!recinto) return responder(404, { error: 'El recinto no existe.' });
    if (recinto.coordinador_id) {
      return responder(409, { error: 'Este recinto ya tiene coordinador.' });
    }
  } else if (llamador.rol === 'recinto' && llamador.recinto_id) {
    rolNuevo = 'veedor';
    recintoId = llamador.recinto_id; // siempre SU recinto, no el que diga el cliente
  } else {
    return responder(403, { error: 'No tienes permisos para esta acción.' });
  }

  // 4. Duplicados
  const { data: porCedula, error: errCedula } = await admin.from('perfiles').select('id').eq('cedula', cedula).limit(1);
  if (errCedula) return responder(500, { error: 'No se pudo verificar la cédula.' });
  if (porCedula && porCedula.length > 0) {
    return responder(409, { error: 'Ya existe un usuario con esa cédula.' });
  }
  const { data: porCorreo, error: errVerificarCorreo } = await admin
    .from('perfiles')
    .select('id')
    .eq('correo', correo)
    .limit(1);
  if (errVerificarCorreo) return responder(500, { error: 'No se pudo verificar el correo.' });
  if (porCorreo && porCorreo.length > 0) {
    return responder(409, { error: 'Ya existe un usuario con ese correo.' });
  }

  // 5. Crear la cuenta de acceso (sin confirmar: se confirma con el correo)
  const { data: creado, error: errCrear } = await admin.auth.admin.createUser({
    email: correo,
    password: CLAVE_INICIAL,
    email_confirm: false,
  });
  if (errCrear || !creado.user) {
    const yaExiste = errCrear?.message?.toLowerCase().includes('already');
    return responder(yaExiste ? 409 : 500, {
      error: yaExiste ? 'Ya existe una cuenta con ese correo.' : 'No se pudo crear la cuenta.',
    });
  }
  const nuevoId = creado.user.id;
  // Si algo falla a medias, borrar la cuenta para no dejar datos huérfanos
  const revertir = () => admin.auth.admin.deleteUser(nuevoId);

  // 6. Crear el perfil
  const { error: errPerfil } = await admin.from('perfiles').insert({
    id: nuevoId,
    cedula,
    nombres,
    apellidos,
    telefono,
    correo,
    rol: rolNuevo,
    recinto_id: recintoId,
    debe_cambiar_clave: true,
  });
  if (errPerfil) {
    await revertir();
    if (errPerfil.code === '23505') {
      return responder(409, { error: 'Ya existe un usuario con esa cédula.' });
    }
    return responder(500, { error: 'No se pudo crear el perfil.' });
  }

  // 7. Si es coordinador, asignarlo al recinto (solo si sigue libre)
  if (rolNuevo === 'recinto') {
    const { data: asignado, error: errAsignar } = await admin
      .from('recintos')
      .update({ coordinador_id: nuevoId })
      .eq('id', recintoId)
      .is('coordinador_id', null)
      .select('id');
    if (errAsignar || !asignado || asignado.length === 0) {
      await revertir(); // el borrado en cascada también elimina el perfil
      return responder(409, { error: 'Este recinto ya tiene coordinador.' });
    }
  }

  // 8. Correo de confirmación de cuenta (R2)
  const anon = createClient(url, anonKey);
  const { error: errCorreo } = await anon.auth.resend({ type: 'signup', email: correo });

  return responder(200, { id: nuevoId, correo_enviado: !errCorreo });
});
