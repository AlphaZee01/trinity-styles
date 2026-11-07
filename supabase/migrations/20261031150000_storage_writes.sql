create policy "user_photos_owner_insert"
on storage.objects for insert
with check (
  bucket_id = 'user-photos'
  and (
    private.is_admin()
    or split_part(name, '/', 1) = auth.uid()::text
  )
);

create policy "try_on_results_owner_insert"
on storage.objects for insert
with check (
  bucket_id = 'try-on-results'
  and (
    private.is_admin()
    or split_part(name, '/', 1) = auth.uid()::text
  )
);
