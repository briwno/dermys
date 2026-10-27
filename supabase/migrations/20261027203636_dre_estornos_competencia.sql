create or replace function public.listar_lancamentos_dre(p_artista_id uuid, p_inicio date, p_fim date)
returns table(id text, categoria text, descricao text, valor numeric, competencia date, origem text, editavel boolean)
language sql stable security invoker set search_path = '' as $$
  with movimentos as (
    select l.id::text, l.categoria, l.descricao, l.valor, l.competencia, 'manual'::text as origem, true as editavel
    from public.financeiro_lancamentos l where l.artista_id = p_artista_id
    union all
    select 'agendamento:' || a.id, 'receitaBruta', 'Serviço concluído · ' || coalesce(a.estilo, 'Tatuagem'),
      a.valor_total, (coalesce(a.concluido_em, a.data_horario) at time zone 'America/Sao_Paulo')::date,
      'servico', false
    from public.agendamentos a
    where a.artista_id = p_artista_id and lower(a.status) = 'concluido' and a.valor_total > 0
    union all
    select 'despesa:' || d.id,
      case when d.categoria in ('LIMPEZA_BIOSSEGURANCA','MATERIAIS_TATUAGEM') then 'custos' else 'administrativas' end,
      d.descricao, d.valor, d.data, 'despesa', false
    from public.despesas_artista d where d.artista_id = p_artista_id and d.valor > 0
    union all
    select 'estorno:' || t.id, 'deducoes', 'Estorno de serviço concluído',
      t.valor_bruto, (t.criado_em at time zone 'America/Sao_Paulo')::date, 'estorno', false
    from public.transacoes_financeiras t
    join public.agendamentos a on a.id = t.agendamento_id and a.artista_id = t.artista_id
    where t.artista_id = p_artista_id and t.tipo = 'ESTORNO'
      and t.status in ('APROVADO','LIBERADO') and lower(a.status) = 'concluido'
    union all
    select 'taxa:' || t.id, 'despesasFinanceiras', 'Taxa de pagamento · ' || t.tipo,
      case when t.tipo = 'TAXA_PLATAFORMA' then t.valor_bruto else t.taxa_mercado_pago end,
      (coalesce(a.concluido_em, a.data_horario, t.criado_em) at time zone 'America/Sao_Paulo')::date,
      'taxa', false
    from public.transacoes_financeiras t
    left join public.agendamentos a on a.id = t.agendamento_id and a.artista_id = t.artista_id
    where t.artista_id = p_artista_id and t.status in ('APROVADO','LIBERADO')
      and t.tipo in ('SINAL','PAGAMENTO_FINAL','TAXA_PLATAFORMA')
      and (t.agendamento_id is null or lower(a.status) = 'concluido')
  )
  select m.* from movimentos m
  where (select public.financeiro_pode_acessar(p_artista_id))
    and p_fim > p_inicio and p_fim <= p_inicio + 366
    and m.competencia >= p_inicio and m.competencia < p_fim and m.valor > 0
  order by m.competencia desc, m.id;
$$;

