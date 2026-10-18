-- Apenas avatares dos nove perfis de demonstração.
with avatares(id, url) as (values
('99999999-9999-9999-9999-999999999999'::uuid, 'https://iklbyztvjvxfhgupmkvw.supabase.co/storage/v1/object/public/avatars/demo/personas-v1/99999999-9999-9999-9999-999999999999.jpg'),
('11111111-1111-1111-1111-111111111111'::uuid, 'https://iklbyztvjvxfhgupmkvw.supabase.co/storage/v1/object/public/avatars/demo/personas-v1/11111111-1111-1111-1111-111111111111.jpg'),
('22222222-2222-2222-2222-222222222222'::uuid, 'https://iklbyztvjvxfhgupmkvw.supabase.co/storage/v1/object/public/avatars/demo/personas-v1/22222222-2222-2222-2222-222222222222.jpg'),
('33333333-3333-3333-3333-333333333333'::uuid, 'https://iklbyztvjvxfhgupmkvw.supabase.co/storage/v1/object/public/avatars/demo/personas-v1/33333333-3333-3333-3333-333333333333.jpg'),
('44444444-4444-4444-4444-444444444444'::uuid, 'https://iklbyztvjvxfhgupmkvw.supabase.co/storage/v1/object/public/avatars/demo/personas-v1/44444444-4444-4444-4444-444444444444.jpg'),
('55555555-5555-5555-5555-555555555555'::uuid, 'https://iklbyztvjvxfhgupmkvw.supabase.co/storage/v1/object/public/avatars/demo/personas-v1/55555555-5555-5555-5555-555555555555.jpg'),
('66666666-6666-6666-6666-666666666666'::uuid, 'https://iklbyztvjvxfhgupmkvw.supabase.co/storage/v1/object/public/avatars/demo/personas-v1/66666666-6666-6666-6666-666666666666.jpg'),
('77777777-7777-7777-7777-777777777777'::uuid, 'https://iklbyztvjvxfhgupmkvw.supabase.co/storage/v1/object/public/avatars/demo/personas-v1/77777777-7777-7777-7777-777777777777.jpg'),
('88888888-8888-8888-8888-888888888888'::uuid, 'https://iklbyztvjvxfhgupmkvw.supabase.co/storage/v1/object/public/avatars/demo/personas-v1/88888888-8888-8888-8888-888888888888.jpg')
)
update public.profiles p set foto_url = a.url from avatares a where p.id = a.id
returning p.id, p.nome_exibicao;
