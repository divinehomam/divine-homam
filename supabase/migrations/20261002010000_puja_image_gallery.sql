alter table public.pujas
  add column if not exists image_urls jsonb not null default '[]'::jsonb;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'pujas_image_urls_max_five'
      and conrelid = 'public.pujas'::regclass
  ) then
    alter table public.pujas
      add constraint pujas_image_urls_max_five
      check (jsonb_typeof(image_urls) = 'array' and jsonb_array_length(image_urls) <= 5);
  end if;
end $$;

-- Preserve an earlier Cloudinary upload as the first gallery image.
update public.pujas
set image_urls = jsonb_build_array(image_url)
where image_url ~ '^https://res\.cloudinary\.com/[^/]+/image/upload/'
  and image_urls = '[]'::jsonb;
