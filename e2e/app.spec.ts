import { expect, test } from '@playwright/test';

test('visits the app root url', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();

  await page.goto('/home');
  await expect(page).toHaveURL(/\/acceso$/);
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
});

test('pide confirmar el correo y protege la pantalla provincial', async ({ page }) => {
  await page.route('**/rest/v1/rpc/email_por_cedula', (route) => route.fulfill({ json: 'coord@example.test' }));
  await page.route('**/auth/v1/token?grant_type=password', (route) =>
    route.fulfill({
      status: 400,
      headers: {
        'access-control-expose-headers': 'X-Supabase-Api-Version',
        'x-supabase-api-version': '2024-01-01',
      },
      json: { code: 'email_not_confirmed', msg: 'Email not confirmed' },
    }),
  );

  await page.goto('/provincial');
  await expect(page).toHaveURL(/\/acceso$/);
  await page.getByLabel('Cédula').fill('1712345675');
  await page.getByLabel('Clave', { exact: true }).fill('clave-de-prueba');
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page.getByRole('alert')).toHaveText('Debes confirmar tu cuenta con el enlace que enviamos a tu correo.');
});
