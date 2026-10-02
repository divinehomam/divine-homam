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

-- Preserve existing catalog images as the first gallery image. Older pujas
-- use local /assets paths, while newer records may use Cloudinary URLs.
update public.pujas
set image_urls = jsonb_build_array(image_url)
where (image_url ~ '^https://res\.cloudinary\.com/[^/]+/image/upload/'
       or image_url ~ '^/assets/[A-Za-z0-9._-]+$')
  and image_urls = '[]'::jsonb;
