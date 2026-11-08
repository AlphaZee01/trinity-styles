-- Public wrappers stay so the service-role client can call rpc().
-- Default privileges also grant execute to anon and authenticated; revoke those explicitly.

revoke all on function public.decrement_stock_for_order(uuid) from public, anon, authenticated;
revoke all on function public.restore_stock_for_order(uuid) from public, anon, authenticated;

revoke all on function private.decrement_stock_for_order(uuid) from public, anon, authenticated;
revoke all on function private.restore_stock_for_order(uuid) from public, anon, authenticated;

grant execute on function public.decrement_stock_for_order(uuid) to service_role;
grant execute on function public.restore_stock_for_order(uuid) to service_role;
grant execute on function private.decrement_stock_for_order(uuid) to service_role;
grant execute on function private.restore_stock_for_order(uuid) to service_role;
