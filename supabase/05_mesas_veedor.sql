-- Limitar la consulta de mesas y sus actas a la asignación del veedor.
alter policy "ver mesas" on public.mesas
using (
  public.rol_actual() = 'provincial'
  or (public.rol_actual() = 'recinto' and recinto_id = public.recinto_actual())
  or (public.rol_actual() = 'veedor' and veedor_id = (select auth.uid()))
);
