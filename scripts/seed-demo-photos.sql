-- Novas obras sintéticas somente para perfis de demonstração; execução idempotente.
with fotos(artista_id, titulo, imagem_url, estilo) as (values
('11111111-1111-1111-1111-111111111111'::uuid, 'Demonstração IA · Oliveira e lavanda', 'https://iklbyztvjvxfhgupmkvw.supabase.co/storage/v1/object/public/portfolios/demo/generated-v1/fine-line.png', 'Fine Line'),
('22222222-2222-2222-2222-222222222222'::uuid, 'Demonstração IA · Corvo e peônias', 'https://iklbyztvjvxfhgupmkvw.supabase.co/storage/v1/object/public/portfolios/demo/generated-v1/blackwork.png', 'Blackwork'),
('33333333-3333-3333-3333-333333333333'::uuid, 'Demonstração IA · Beija-flor tropical', 'https://iklbyztvjvxfhgupmkvw.supabase.co/storage/v1/object/public/portfolios/demo/generated-v1/aquarela.png', 'Aquarela'),
('44444444-4444-4444-4444-444444444444'::uuid, 'Demonstração IA · Carpa e cerejeiras', 'https://iklbyztvjvxfhgupmkvw.supabase.co/storage/v1/object/public/portfolios/demo/generated-v1/oriental.png', 'Oriental'),
('55555555-5555-5555-5555-555555555555'::uuid, 'Demonstração IA · Âncora e rosa', 'https://iklbyztvjvxfhgupmkvw.supabase.co/storage/v1/object/public/portfolios/demo/generated-v1/old-school.png', 'Old School'),
('66666666-6666-6666-6666-666666666666'::uuid, 'Demonstração IA · Gato astronauta', 'https://iklbyztvjvxfhgupmkvw.supabase.co/storage/v1/object/public/portfolios/demo/generated-v1/geek.png', 'Geek'),
('77777777-7777-7777-7777-777777777777'::uuid, 'Demonstração IA · Leão em preto e cinza', 'https://iklbyztvjvxfhgupmkvw.supabase.co/storage/v1/object/public/portfolios/demo/generated-v1/realismo.png', 'Realismo'),
('88888888-8888-8888-8888-888888888888'::uuid, 'Demonstração IA · Mandala ornamental', 'https://iklbyztvjvxfhgupmkvw.supabase.co/storage/v1/object/public/portfolios/demo/generated-v1/ornamental.png', 'Blackwork')
)
insert into public.flashes_portfolio (artista_id, titulo, imagem_url, estilo, disponivel)
select f.artista_id, f.titulo, f.imagem_url, f.estilo, false
from fotos f
join public.profiles p on p.id = f.artista_id and p.tipo_perfil = 'artista'
where not exists (select 1 from public.flashes_portfolio existente where existente.artista_id = f.artista_id and existente.imagem_url = f.imagem_url)
returning id, artista_id, titulo;

