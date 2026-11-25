import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { ErrorFoto, esFotoActa, subirFotoActa } from '../_shared/fotos-actas.ts';

function responder(status: number, body: unknown): Response {
  return Response.json(body, { status, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== 'POST') return responder(405, { error: 'Método no permitido.' });
  const token = req.headers.get('Authorization')?.match(/^Bearer (\S+)$/i)?.[1];
  if (!token) return responder(401, { error: 'Inicia sesión para consultar el acta.' });

  try {
    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: sesion, error: errorSesion } = await sb.auth.getUser(token);
    if (errorSesion || !sesion.user) return responder(401, { error: 'Tu sesión ya no es válida.' });

    const form = await req.formData().catch(() => null);
    const actaId = Number(form?.get('acta_id'));
    if (!form || !Number.isSafeInteger(actaId) || actaId < 1) {
      return responder(400, { error: 'Selecciona un acta válida.' });
    }

    const { data: perfil, error: errorPerfil } = await sb.from('perfiles').select('rol, recinto_id')
      .eq('id', sesion.user.id).maybeSingle();
    if (errorPerfil) return responder(500, { error: 'No se pudo verificar tu perfil.' });
    const prohibido = { error: 'Solo puedes corregir actas de tu recinto.' };
    if (perfil?.rol !== 'recinto' || !perfil.recinto_id) return responder(403, prohibido);

    const { data: acta, error: errorActa } = await sb.from('actas').select('id, mesas!inner(recinto_id)')
      .eq('id', actaId).eq('mesas.recinto_id', perfil.recinto_id).maybeSingle();
    if (errorActa) return responder(500, { error: 'No se pudo consultar el acta.' });
    if (!acta) return responder(403, prohibido);

    const foto = form.get('foto');
    if (!esFotoActa(foto)) return responder(400, { error: 'Adjunta una foto JPEG, PNG o WebP de hasta 6 MB.' });
    const correccion = JSON.parse(String(form.get('correccion') ?? 'null'));
    if (!correccion || typeof correccion !== 'object' || Array.isArray(correccion)) {
      return responder(400, { error: 'Revisa los datos de la corrección.' });
    }

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const subida = await subirFotoActa(foto, `actas/${actaId}`);
    const { error: errorFoto } = await admin.from('fotos_correccion_acta').insert({
      foto_url: subida.url, acta_id: actaId, usuario_id: sesion.user.id,
    });
    if (errorFoto) {
      await subida.retirar();
      return responder(500, { error: 'No se pudo preparar la fotografía para guardar el acta.' });
    }
    const { error } = await sb.rpc('corregir_acta', {
      p_acta_id: actaId,
      p_nulos: correccion.nulos,
      p_blancos: correccion.blancos,
      p_sufragantes: correccion.sufragantes,
      p_votos: correccion.votos,
      p_foto_url: subida.url,
    });
    if (!error) return responder(200, { guardada: true });

    // Un SQLSTATE de error confirma que la transacción no guardó la foto.
    if (['42501', '23514', '22P02', '22003'].includes(error.code)) {
      await admin.from('fotos_correccion_acta').delete().eq('foto_url', subida.url);
      await subida.retirar();
    }
    if (error.code === '42501') return responder(403, prohibido);
    if (error.code === '23514') return responder(400, { error: error.message });
    return responder(500, { error: 'No se pudo corregir el acta. Actualiza la mesa antes de reintentar.' });
  } catch (error) {
    if (error instanceof ErrorFoto) return responder(error.estado, { error: error.message });
    if (error instanceof SyntaxError) return responder(400, { error: 'Revisa los datos de la corrección.' });
    return responder(500, { error: 'No se pudo completar la operación del acta. Inténtalo de nuevo.' });
  }
});
