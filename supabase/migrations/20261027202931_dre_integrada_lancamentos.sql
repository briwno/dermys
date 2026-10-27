-- Acesso a personas de teste é concedido no servidor, nunca por metadados do usuário.
create table public.financeiro_acessos_teste (
  usuario_id uuid not null references auth.users(id) on delete cascade,
  artista_id uuid not null references public.profiles(id) on delete cascade,
  primary key (usuario_id, artista_id)
);
create index financeiro_acessos_teste_artista_idx on public.financeiro_acessos_teste(artista_id);
alter table public.financeiro_acessos_teste enable row level security;
revoke all on public.financeiro_acessos_teste from anon, authenticated;
grant select on public.financeiro_acessos_teste to authenticated;
create policy acesso_teste_proprio on public.financeiro_acessos_teste for select to authenticated
  using (usuario_id = (select auth.uid()));

create function public.financeiro_pode_acessar(p_artista_id uuid)
returns boolean language sql stable security invoker set search_path = '' as $$
  select (select auth.uid()) is not null and (
    p_artista_id = (select auth.uid()) or exists (
      select 1 from public.financeiro_acessos_teste a
      where a.usuario_id = (select auth.uid()) and a.artista_id = p_artista_id
    )
  );
$$;
revoke all on function public.financeiro_pode_acessar(uuid) from public, anon;
grant execute on function public.financeiro_pode_acessar(uuid) to authenticated;

create table public.financeiro_lancamentos (
  id uuid primary key default gen_random_uuid(),
  artista_id uuid not null references public.profiles(id) on delete cascade,
  competencia date not null,
  categoria text not null check (categoria in ('receitaBruta','deducoes','custos','vendas','administrativas','depreciacao','receitasFinanceiras','despesasFinanceiras','tributosLucro')),
  descricao text not null check (length(trim(descricao)) between 1 and 240),
  valor numeric(14,2) not null check (valor > 0 and valor <= 999999999.99),
  criado_por uuid not null default auth.uid() references auth.users(id),
  criado_em timestamptz not null default now()
);
create index financeiro_lancamentos_artista_competencia_idx on public.financeiro_lancamentos(artista_id, competencia);
create index financeiro_lancamentos_criado_por_idx on public.financeiro_lancamentos(criado_por);
alter table public.financeiro_lancamentos enable row level security;
revoke all on public.financeiro_lancamentos from anon, authenticated;
grant select, insert, update, delete on public.financeiro_lancamentos to authenticated;
create policy lancamentos_leitura on public.financeiro_lancamentos for select to authenticated
  using ((select public.financeiro_pode_acessar(artista_id)));
create policy lancamentos_insercao on public.financeiro_lancamentos for insert to authenticated
  with check ((select public.financeiro_pode_acessar(artista_id)) and criado_por = (select auth.uid()));
create policy lancamentos_edicao on public.financeiro_lancamentos for update to authenticated
  using ((select public.financeiro_pode_acessar(artista_id)))
  with check ((select public.financeiro_pode_acessar(artista_id)) and criado_por = (select auth.uid()));
create policy lancamentos_exclusao on public.financeiro_lancamentos for delete to authenticated
  using ((select public.financeiro_pode_acessar(artista_id)));

-- Fontes automáticas são consultadas ao vivo. Não copiar receitas de notas e pagamentos:
-- uma sessão concluída gera uma única receita, mesmo que tenha sinal e pagamento final.
create function public.listar_lancamentos_dre(p_artista_id uuid, p_inicio date, p_fim date)
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
revoke all on function public.listar_lancamentos_dre(uuid,date,date) from public, anon;
grant execute on function public.listar_lancamentos_dre(uuid,date,date) to authenticated;
