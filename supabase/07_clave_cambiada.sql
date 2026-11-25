begin;

create function public.confirmar_cambio_clave()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.perfiles
  set debe_cambiar_clave = false
  where id = new.id and debe_cambiar_clave;
  return new;
end;
$$;

revoke execute on function public.confirmar_cambio_clave() from public, anon, authenticated;

create trigger trg_confirmar_cambio_clave
after update of encrypted_password on auth.users
for each row
when (old.encrypted_password is distinct from new.encrypted_password)
execute function public.confirmar_cambio_clave();

-- PUBLIC también concede EXECUTE de forma implícita si conserva el permiso.
revoke execute on function public.marcar_clave_cambiada() from public, anon, authenticated;

commit;
