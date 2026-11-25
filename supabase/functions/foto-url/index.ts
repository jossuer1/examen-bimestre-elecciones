import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { enlaceTemporalFotoActa, ErrorFoto } from '../_shared/fotos-actas.ts';

function responder(status: number, body: unknown): Response {
  return Response.json(body, { status, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== 'POST') return responder(405, { error: 'Método no permitido.' });

  const token = req.headers.get('Authorization')?.match(/^Bearer (\S+)$/i)?.[1];
  if (!token) return responder(401, { error: 'Inicia sesión para ver la fotografía.' });

  const body = await req.json().catch(() => null);
  const actaId: unknown = body?.acta_id;
  if (typeof actaId !== 'number' || !Number.isSafeInteger(actaId) || actaId < 1) {
    return responder(400, { error: 'Selecciona un acta válida.' });
  }

  try {
    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: sesion, error: errorSesion } = await sb.auth.getUser(token);
    if (errorSesion || !sesion.user) return responder(401, { error: 'Tu sesión ya no es válida.' });

    // El cliente usa el JWT del usuario. RLS determina qué acta puede leer.
    const { data: acta, error } = await sb.from('actas').select('foto_url').eq('id', actaId).maybeSingle();
    if (error) return responder(500, { error: 'No se pudo consultar la fotografía. Inténtalo de nuevo.' });
    if (!acta) return responder(404, { error: 'La fotografía no está disponible para tu cuenta.' });

    return responder(200, { url: await enlaceTemporalFotoActa(acta.foto_url, actaId) });
  } catch (error) {
    if (error instanceof ErrorFoto) return responder(error.estado, { error: error.message });
    return responder(500, { error: 'No se pudo obtener la fotografía. Inténtalo de nuevo.' });
  }
});
