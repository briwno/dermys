-- Fontes e competência: fixtures são revertidas no fim da transação.
begin;
select set_config('request.jwt.claim.sub','b57a566c-4a59-4f4d-86f6-a1dd792659ef',true);
do $$
declare
  artista uuid := '11111111-1111-1111-1111-111111111111';
  cliente uuid := '99999999-9999-9999-9999-999999999999';
  concluido uuid; futuro uuid; estorno uuid; sinal uuid; final uuid; custodia uuid;
  valor_teste numeric; despesa_id text := gen_random_uuid()::text;
begin
  insert into public.agendamentos(artista_id,cliente_id,data_horario,concluido_em,status,valor_total,valor_sinal,estilo)
    values(artista,cliente,'2026-10-01 02:30:00Z','2026-10-01 02:30:00Z','concluido',100,30,'Teste DRE') returning id into concluido;
  insert into public.agendamentos(artista_id,cliente_id,data_horario,status,valor_total,valor_sinal,estilo)
    values(artista,cliente,'2026-10-15 15:00:00Z','confirmado',100,30,'Teste futuro DRE') returning id into futuro;
  insert into public.transacoes_financeiras(artista_id,cliente_id,agendamento_id,tipo,valor_bruto,taxa_mercado_pago,valor_liquido,status,forma_pagamento,criado_em)
    values(artista,cliente,concluido,'SINAL',30,3,27,'APROVADO','pix','2026-08-01 12:00Z') returning id into sinal;
  insert into public.transacoes_financeiras(artista_id,cliente_id,agendamento_id,tipo,valor_bruto,taxa_mercado_pago,valor_liquido,status,forma_pagamento)
    values(artista,cliente,concluido,'PAGAMENTO_FINAL',70,5,65,'LIBERADO','pix') returning id into final;
  insert into public.transacoes_financeiras(artista_id,cliente_id,agendamento_id,tipo,valor_bruto,taxa_mercado_pago,valor_liquido,status,forma_pagamento)
    values(artista,cliente,futuro,'SINAL',30,3,27,'CUSTODIA','pix') returning id into custodia;
  insert into public.transacoes_financeiras(artista_id,cliente_id,agendamento_id,tipo,valor_bruto,taxa_mercado_pago,valor_liquido,status,forma_pagamento,criado_em)
    values(artista,cliente,concluido,'ESTORNO',25,0,25,'LIBERADO','pix','2026-10-02 12:00Z') returning id into estorno;

  select sum(valor) into valor_teste from public.listar_lancamentos_dre(artista,'2026-09-01','2026-10-01') where id='agendamento:' || concluido;
  if valor_teste is distinct from 100::numeric then raise exception 'Receita de competência incorreta ou duplicada'; end if;
  if exists(select 1 from public.listar_lancamentos_dre(artista,'2026-10-01','2026-11-01') where id in ('agendamento:' || concluido,'agendamento:' || futuro,'taxa:' || custodia)) then
    raise exception 'Fuso horário ou sinal futuro incorreto';
  end if;
  select sum(valor) into valor_teste from public.listar_lancamentos_dre(artista,'2026-09-01','2026-10-01') where id in ('taxa:' || sinal,'taxa:' || final);
  if valor_teste is distinct from 8::numeric then raise exception 'Taxas por competência incorretas'; end if;
  select sum(valor) into valor_teste from public.listar_lancamentos_dre(artista,'2026-10-01','2026-11-01') where id='estorno:' || estorno and categoria='deducoes';
  if valor_teste is distinct from 25::numeric then raise exception 'Estorno confirmado não deduzido'; end if;
  insert into public.despesas_artista(id,artista_id,descricao,valor,categoria,data)
    values(despesa_id,artista,'Teste de material',10,'MATERIAIS_TATUAGEM','2026-10-15');
  if not exists(select 1 from public.listar_lancamentos_dre(artista,'2026-10-01','2026-11-01') where id='despesa:' || despesa_id and categoria='custos' and valor=10) then
    raise exception 'Despesa não classificada como custo';
  end if;
end $$;
rollback;
select 'DRE: competência, fuso, sinais, receita sem duplicação, taxas, despesas e estornos aprovados' as resultado;
