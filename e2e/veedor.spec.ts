import { expect, test } from '@playwright/test';

import { supabaseConfig } from '../src/environments/supabase.config';

test('registra un acta con foto y ubicación obligatoria', async ({ page, context }) => {
  const coordenadas = { latitude: -0.25, longitude: -78.5 };
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation(coordenadas);
  const usuario = { id: '00000000-0000-4000-8000-000000000001', aud: 'authenticated' };
  const actas = [{ cargo: 'alcalde' }];
  const proyecto = new URL(supabaseConfig.supabaseUrl).hostname.split('.')[0];
  await page.addInitScript(
    ({ key, user }) => {
      localStorage.setItem(
        key,
        JSON.stringify({
          access_token: 'token-de-prueba',
          refresh_token: 'renovacion-de-prueba',
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          user,
        }),
      );
    },
    { key: `sb-${proyecto}-auth-token`, user: usuario },
  );
  await page.route('**/rest/v1/perfiles?*', (route) =>
    route.fulfill({ json: { ...usuario, nombres: 'Ana', rol: 'veedor', debe_cambiar_clave: false } }),
  );
  await page.route('**/rest/v1/mesas?*', (route) => {
    expect(new URL(route.request().url()).searchParams.get('veedor_id')).toBe(`eq.${usuario.id}`);
    return route.fulfill({ json: [{ id: 42, numero: 3, actas }] });
  });
  await page.route('**/rest/v1/candidaturas?*', (route) => {
    expect(new URL(route.request().url()).searchParams.get('cargo')).toBe('eq.prefecto');
    return route.fulfill({ json: [{ id: 7, candidato: 'Lista de prueba' }] });
  });
  await page.route('**/functions/v1/registrar-acta', async (route) => {
    const peticion = route.request();
    const formulario = await new Response(Uint8Array.from(peticion.postDataBuffer() ?? []), {
      headers: { 'content-type': peticion.headers()['content-type'] },
    }).formData();
    expect(JSON.parse(String(formulario.get('acta')))).toEqual({
      mesa_id: 42,
      cargo: 'prefecto',
      sufragantes: 12,
      blancos: 1,
      nulos: 1,
      votos: [{ candidatura_id: 7, votos: 10 }],
      gps_lat: coordenadas.latitude,
      gps_lng: coordenadas.longitude,
    });
    expect(formulario.get('foto')).toMatchObject({ type: 'image/png' });
    actas.push({ cargo: 'prefecto' });
    await route.fulfill({ status: 201, json: { id: 123 } });
  });

  await page.goto('/');
  await expect(page).toHaveURL(/\/veedor$/);
  await expect(page.getByRole('heading', { name: 'Hola, Ana' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Mesa 3' })).toBeVisible();
  await expect(page.getByText('Alcalde: Registrada')).toBeVisible();
  await expect(page.getByText('Prefecto: Pendiente')).toBeVisible();
  await page.getByRole('button', { name: 'Registrar acta de prefecto' }).click();
  await page.getByLabel('Total de sufragantes').fill('13');
  await page.getByLabel('Votos blancos').fill('1');
  await page.getByLabel('Votos nulos').fill('1');
  await page.getByLabel('Lista de prueba').fill('10');
  const guardar = page.getByRole('button', { name: 'Guardar acta' });
  await guardar.click();
  await expect(page.getByRole('alert')).toContainText('deben sumar los sufragantes');

  await page.getByLabel('Total de sufragantes').fill('12');
  await guardar.click();
  await expect(page.getByRole('alert')).toContainText('una foto legible');
  await page.getByLabel('Fotografía del acta').setInputFiles({
    name: 'acta.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jVTsAAAAASUVORK5CYII=',
      'base64',
    ),
  });
  await expect(page.getByRole('img', { name: 'Vista previa de la fotografía del acta' })).toBeVisible();
  await expect(page.getByText('Tu ubicación actual se guardará junto con el acta.')).toBeVisible();
  await guardar.click();
  await expect(page.getByRole('alert')).toContainText('Obtén tu ubicación antes de guardar');
  await page.getByRole('button', { name: 'Obtener ubicación' }).click();
  await expect(page.getByRole('status')).toContainText('Ubicación añadida.');
  await guardar.click();
  await expect(page.getByText('Acta y fotografía guardadas.')).toBeVisible();
  await expect(page.getByText('Prefecto: Registrada')).toBeVisible();
});
