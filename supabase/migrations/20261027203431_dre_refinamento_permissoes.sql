-- A autoria e o artista não podem ser alterados por uma edição de lançamento.
revoke update on public.financeiro_lancamentos from authenticated;
grant update (competencia,categoria,descricao,valor) on public.financeiro_lancamentos to authenticated;
alter policy lancamentos_edicao on public.financeiro_lancamentos
  using ((select public.financeiro_pode_acessar(artista_id)))
  with check ((select public.financeiro_pode_acessar(artista_id)));

create index if not exists transacoes_financeiras_artista_agendamento_idx
  on public.transacoes_financeiras(artista_id,agendamento_id);
create index if not exists transacoes_financeiras_agendamento_idx
  on public.transacoes_financeiras(agendamento_id);
