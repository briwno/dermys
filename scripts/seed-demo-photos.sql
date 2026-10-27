-- Gallery seed: update the original 8 URLs and add the remaining 24 works.
with photos(artist_id,title,url,style) as (values
('11111111-1111-1111-1111-111111111111'::uuid, 'Demonstração IA · Oliveira e lavanda', 'https://iklbyztvjvxfhgupmkvw.supabase.co/storage/v1/object/public/portfolios/demo/generated-v1/fine-line.jpg', 'Fine Line'),
('22222222-2222-2222-2222-222222222222'::uuid, 'Demonstração IA · Corvo e peônias', 'https://iklbyztvjvxfhgupmkvw.supabase.co/storage/v1/object/public/portfolios/demo/generated-v1/blackwork.jpg', 'Blackwork'),
('33333333-3333-3333-3333-333333333333'::uuid, 'Demonstração IA · Beija-flor tropical', 'https://iklbyztvjvxfhgupmkvw.supabase.co/storage/v1/object/public/portfolios/demo/generated-v1/aquarela.jpg', 'Aquarela'),
('44444444-4444-4444-4444-444444444444'::uuid, 'Demonstração IA · Carpa e cerejeiras', 'https://iklbyztvjvxfhgupmkvw.supabase.co/storage/v1/object/public/portfolios/demo/generated-v1/oriental.jpg', 'Oriental'),
('55555555-5555-5555-5555-555555555555'::uuid, 'Demonstração IA · Âncora e rosa', 'https://iklbyztvjvxfhgupmkvw.supabase.co/storage/v1/object/public/portfolios/demo/generated-v1/old-school.jpg', 'Old School'),
('66666666-6666-6666-6666-666666666666'::uuid, 'Demonstração IA · Gato astronauta', 'https://iklbyztvjvxfhgupmkvw.supabase.co/storage/v1/object/public/portfolios/demo/generated-v1/geek.jpg', 'Geek'),
('77777777-7777-7777-7777-777777777777'::uuid, 'Demonstração IA · Leão em preto e cinza', 'https://iklbyztvjvxfhgupmkvw.supabase.co/storage/v1/object/public/portfolios/demo/generated-v1/realismo.jpg', 'Realismo'),
('88888888-8888-8888-8888-888888888888'::uuid, 'Demonstração IA · Mandala ornamental', 'https://iklbyztvjvxfhgupmkvw.supabase.co/storage/v1/object/public/portfolios/demo/generated-v1/ornamental.jpg', 'Blackwork'),
('11111111-1111-1111-1111-111111111111'::uuid, 'Demonstração IA · Lavanda delicada', 'https://iklbyztvjvxfhgupmkvw.supabase.co/storage/v1/object/public/portfolios/demo/generated-v1/fine-line-2.jpg', 'Fine Line'),
('11111111-1111-1111-1111-111111111111'::uuid, 'Demonstração IA · Borboleta lunar', 'https://iklbyztvjvxfhgupmkvw.supabase.co/storage/v1/object/public/portfolios/demo/generated-v1/fine-line-3.jpg', 'Fine Line'),
('11111111-1111-1111-1111-111111111111'::uuid, 'Demonstração IA · Flores silvestres', 'https://iklbyztvjvxfhgupmkvw.supabase.co/storage/v1/object/public/portfolios/demo/generated-v1/fine-line-4.jpg', 'Fine Line'),
('22222222-2222-2222-2222-222222222222'::uuid, 'Demonstração IA · Serpente e peônias', 'https://iklbyztvjvxfhgupmkvw.supabase.co/storage/v1/object/public/portfolios/demo/generated-v1/blackwork-2.jpg', 'Blackwork'),
('22222222-2222-2222-2222-222222222222'::uuid, 'Demonstração IA · Mariposa noturna', 'https://iklbyztvjvxfhgupmkvw.supabase.co/storage/v1/object/public/portfolios/demo/generated-v1/blackwork-3.jpg', 'Blackwork'),
('22222222-2222-2222-2222-222222222222'::uuid, 'Demonstração IA · Lobo em gravura', 'https://iklbyztvjvxfhgupmkvw.supabase.co/storage/v1/object/public/portfolios/demo/generated-v1/blackwork-4.jpg', 'Blackwork'),
('33333333-3333-3333-3333-333333333333'::uuid, 'Demonstração IA · Raposa em aquarela', 'https://iklbyztvjvxfhgupmkvw.supabase.co/storage/v1/object/public/portfolios/demo/generated-v1/aquarela-2.jpg', 'Aquarela'),
('33333333-3333-3333-3333-333333333333'::uuid, 'Demonstração IA · Íris azul', 'https://iklbyztvjvxfhgupmkvw.supabase.co/storage/v1/object/public/portfolios/demo/generated-v1/aquarela-3.jpg', 'Aquarela'),
('33333333-3333-3333-3333-333333333333'::uuid, 'Demonstração IA · Borboleta em cores', 'https://iklbyztvjvxfhgupmkvw.supabase.co/storage/v1/object/public/portfolios/demo/generated-v1/aquarela-4.jpg', 'Aquarela'),
('44444444-4444-4444-4444-444444444444'::uuid, 'Demonstração IA · Dragão entre nuvens', 'https://iklbyztvjvxfhgupmkvw.supabase.co/storage/v1/object/public/portfolios/demo/generated-v1/oriental-2.jpg', 'Oriental'),
('44444444-4444-4444-4444-444444444444'::uuid, 'Demonstração IA · Crisântemo japonês', 'https://iklbyztvjvxfhgupmkvw.supabase.co/storage/v1/object/public/portfolios/demo/generated-v1/oriental-3.jpg', 'Oriental'),
('44444444-4444-4444-4444-444444444444'::uuid, 'Demonstração IA · Máscara Hannya', 'https://iklbyztvjvxfhgupmkvw.supabase.co/storage/v1/object/public/portfolios/demo/generated-v1/oriental-4.jpg', 'Oriental'),
('55555555-5555-5555-5555-555555555555'::uuid, 'Demonstração IA · Andorinha tradicional', 'https://iklbyztvjvxfhgupmkvw.supabase.co/storage/v1/object/public/portfolios/demo/generated-v1/old-school-2.jpg', 'Old School'),
('55555555-5555-5555-5555-555555555555'::uuid, 'Demonstração IA · Rosa e adaga', 'https://iklbyztvjvxfhgupmkvw.supabase.co/storage/v1/object/public/portfolios/demo/generated-v1/old-school-3.jpg', 'Old School'),
('55555555-5555-5555-5555-555555555555'::uuid, 'Demonstração IA · Farol náutico', 'https://iklbyztvjvxfhgupmkvw.supabase.co/storage/v1/object/public/portfolios/demo/generated-v1/old-school-4.jpg', 'Old School'),
('66666666-6666-6666-6666-666666666666'::uuid, 'Demonstração IA · Controle cósmico', 'https://iklbyztvjvxfhgupmkvw.supabase.co/storage/v1/object/public/portfolios/demo/generated-v1/geek-2.jpg', 'Geek'),
('66666666-6666-6666-6666-666666666666'::uuid, 'Demonstração IA · Dragão de bolso', 'https://iklbyztvjvxfhgupmkvw.supabase.co/storage/v1/object/public/portfolios/demo/generated-v1/geek-3.jpg', 'Geek'),
('66666666-6666-6666-6666-666666666666'::uuid, 'Demonstração IA · Robô e estrelas', 'https://iklbyztvjvxfhgupmkvw.supabase.co/storage/v1/object/public/portfolios/demo/generated-v1/geek-4.jpg', 'Geek'),
('77777777-7777-7777-7777-777777777777'::uuid, 'Demonstração IA · Olhar felino', 'https://iklbyztvjvxfhgupmkvw.supabase.co/storage/v1/object/public/portfolios/demo/generated-v1/realismo-2.jpg', 'Realismo'),
('77777777-7777-7777-7777-777777777777'::uuid, 'Demonstração IA · Retrato canino', 'https://iklbyztvjvxfhgupmkvw.supabase.co/storage/v1/object/public/portfolios/demo/generated-v1/realismo-3.jpg', 'Realismo'),
('77777777-7777-7777-7777-777777777777'::uuid, 'Demonstração IA · Rosa em preto e cinza', 'https://iklbyztvjvxfhgupmkvw.supabase.co/storage/v1/object/public/portfolios/demo/generated-v1/realismo-4.jpg', 'Realismo'),
('88888888-8888-8888-8888-888888888888'::uuid, 'Demonstração IA · Lótus ornamental', 'https://iklbyztvjvxfhgupmkvw.supabase.co/storage/v1/object/public/portfolios/demo/generated-v1/ornamental-2.jpg', 'Blackwork'),
('88888888-8888-8888-8888-888888888888'::uuid, 'Demonstração IA · Geometria sagrada', 'https://iklbyztvjvxfhgupmkvw.supabase.co/storage/v1/object/public/portfolios/demo/generated-v1/ornamental-3.jpg', 'Blackwork'),
('88888888-8888-8888-8888-888888888888'::uuid, 'Demonstração IA · Mandala floral', 'https://iklbyztvjvxfhgupmkvw.supabase.co/storage/v1/object/public/portfolios/demo/generated-v1/ornamental-4.jpg', 'Blackwork')
), updated as (
update public.flashes_portfolio f set imagem_url=p.url, estilo=p.style, disponivel=false
from photos p where f.artista_id=p.artist_id and f.titulo=p.title
and f.imagem_url like 'https://iklbyztvjvxfhgupmkvw.supabase.co/storage/v1/object/public/portfolios/demo/generated-v1/%'
returning f.id
), inserted as (
insert into public.flashes_portfolio(artista_id,titulo,imagem_url,estilo,disponivel)
select p.artist_id,p.title,p.url,p.style,false from photos p
join public.profiles artist on artist.id=p.artist_id and artist.tipo_perfil='artista'
where not exists(select 1 from public.flashes_portfolio f where f.artista_id=p.artist_id and f.titulo=p.title)
returning id
) select (select count(*) from updated) as updated, (select count(*) from inserted) as inserted;
