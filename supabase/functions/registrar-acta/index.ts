import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

import { ErrorFoto, esFotoActa, subirFotoActa } from '../_shared/fotos-actas.ts';

function responder(status: number, body: unknown): Response {
  return Response.json(body, { status, headers: corsHeaders });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== 'POST') return responder(405, { error: 'Método no permitido.' });

  const token = req.headers.get('Authorization')?.match(/^Bearer (\S+)$/i)?.[1];
  if (!token) return responder(401, { error: 'Inicia sesión para guardar el acta.' });
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: sesion, error: errorSesion } = await admin.auth.getUser(token);
  if (errorSesion || !sesion.user) return responder(401, { error: 'Tu sesión ya no es válida.' });

  const { data: perfil, error: errorPerfil } = await admin
    .from('perfiles')
    .select('rol, debe_cambiar_clave')
    .eq('id', sesion.user.id)
    .maybeSingle();
  if (errorPerfil) return responder(500, { error: 'No se pudo verificar tu perfil.' });
  if (perfil?.rol !== 'veedor' || perfil.debe_cambiar_clave) {
    return responder(403, { error: 'Tu perfil no puede registrar actas.' });
  }

  let acta: Record<string, unknown>;
  let foto: FormDataEntryValue | null;
  try {
    const formulario = await req.formData();
    const datos = formulario.get('acta');
    if (typeof datos !== 'string') throw new Error('Acta ausente');
    acta = JSON.parse(datos);
    foto = formulario.get('foto');
  } catch {
    return responder(400, { error: 'No se pudo leer el acta.' });
  }
  if (!acta || !Number.isSafeInteger(acta.mesa_id) || (acta.cargo !== 'alcalde' && acta.cargo !== 'prefecto')) {
    return responder(400, { error: 'Mesa o cargo inválido.' });
  }
  if (!esFotoActa(foto)) {
    return responder(400, { error: 'Adjunta una foto JPEG, PNG o WebP de hasta 6 MB.' });
  }

  const { gps_lat: latitud, gps_lng: longitud } = acta;
  if (
    typeof latitud !== 'number' ||
    !Number.isFinite(latitud) ||
    latitud < -90 ||
    latitud > 90 ||
    typeof longitud !== 'number' ||
    !Number.isFinite(longitud) ||
    longitud < -180 ||
    longitud > 180
  ) {
    return responder(400, { error: 'Obtén una ubicación válida antes de guardar el acta.' });
  }

  const { data: mesa, error: errorMesa } = await admin
    .from('mesas')
    .select('id')
    .eq('id', acta.mesa_id)
    .eq('veedor_id', sesion.user.id)
    .maybeSingle();
  if (errorMesa) return responder(500, { error: 'No se pudo verificar la mesa.' });
  if (!mesa) return responder(403, { error: 'Esta mesa no está asignada a tu cuenta.' });
  const { data: existente, error: errorConsulta } = await admin
    .from('actas')
    .select('id')
    .eq('mesa_id', mesa.id)
    .eq('cargo', acta.cargo)
    .maybeSingle();
  if (errorConsulta) return responder(500, { error: 'No se pudo comprobar el acta.' });
  if (existente) return responder(409, { error: 'Esta mesa ya tiene un acta para ese cargo.' });

  let subida: Awaited<ReturnType<typeof subirFotoActa>>;
  try {
    subida = await subirFotoActa(foto);
  } catch (error) {
    if (error instanceof ErrorFoto) return responder(error.estado, { error: error.message });
    return responder(502, { error: 'No se pudo guardar la fotografía.' });
  }
  const fotoUrl = subida.url;

  const { data: id, error } = await admin.rpc('registrar_acta_veedor', {
    p_veedor: sesion.user.id,
    p_acta: acta,
    p_foto_url: fotoUrl,
  });
  if (!error) return responder(201, { id });

  // Confirmar que la foto no quedó asociada a un acta antes de eliminarla.
  const { data: guardada, error: errorVerificar } = await admin
    .from('actas')
    .select('id')
    .eq('foto_url', fotoUrl)
    .maybeSingle();
  if (guardada) return responder(201, { id: guardada.id });
  if (!errorVerificar && error.code) await subida.retirar();
  if (error.code === '23505') return responder(409, { error: 'Esta mesa ya tiene un acta para ese cargo.' });
  if (error.code === '42501') return responder(403, { error: error.message });
  if (error.code === '23514') return responder(400, { error: error.message });
  return responder(500, { error: 'No se pudo guardar el acta. Actualiza tus mesas antes de reintentar.' });
});
