import type { ValidatorFn } from '@angular/forms';

export function esCedulaValida(cedula: string): boolean {
  if (!/^\d{10}$/.test(cedula)) return false;
  const provincia = Number(cedula.slice(0, 2));
  if (provincia < 1 || (provincia > 24 && provincia !== 30) || Number(cedula[2]) > 5) {
    return false;
  }

  let suma = 0;
  for (const [indice, digito] of [...cedula.slice(0, 9)].entries()) {
    const valor = Number(digito) * (indice % 2 === 0 ? 2 : 1);
    suma += valor > 9 ? valor - 9 : valor;
  }
  return (10 - (suma % 10)) % 10 === Number(cedula[9]);
}

export const cedulaValidator: ValidatorFn = ({ value }) =>
  typeof value === 'string' && esCedulaValida(value) ? null : { cedula: true };
