create or replace function dermys_debug.remover_lote(p_lote_id uuid) returns boolean
language plpgsql security definer set search_path='' as $$
declare v_lote dermys_debug.lotes%rowtype;
begin
  if auth.uid() is null then raise exception 'Entre na sua conta.' using errcode='42501'; end if;
  select * into v_lote from dermys_debug.lotes where id=p_lote_id and usuario_id=auth.uid() for update;
  if not found then raise exception 'Lote não encontrado para sua conta.' using errcode='42501'; end if;
  if not public.financeiro_pode_acessar(v_lote.artista_id) then raise exception 'Acesso ao artista revogado.' using errcode='42501'; end if;
  if v_lote.removido_em is not null then return true; end if;
  -- Bloqueia as linhas antes da checagem para impedir novas referências durante a limpeza.
  perform 1 from public.agendamentos where id in(select value::uuid from jsonb_array_elements_text(v_lote.registros->'agendamentos')) for update;
  perform 1 from public.transacoes_financeiras where id in(select value::uuid from jsonb_array_elements_text(v_lote.registros->'transacoes')) for update;
  -- Não apague registros que passaram a ser referenciados por dados fora do lote.
  if exists(select 1 from public.notas_fiscais where agendamento_id::text in(select jsonb_array_elements_text(v_lote.registros->'agendamentos'))
      or transacao_id::text in(select jsonb_array_elements_text(v_lote.registros->'transacoes')))
    or exists(select 1 from public.fichas_anamnese where agendamento_id::text in(select jsonb_array_elements_text(v_lote.registros->'agendamentos')))
    or exists(select 1 from public.transacoes_financeiras where agendamento_id::text in(select jsonb_array_elements_text(v_lote.registros->'agendamentos')) and id::text not in(select jsonb_array_elements_text(v_lote.registros->'transacoes'))) then
    raise exception 'Este lote foi utilizado em outros registros. A remoção foi cancelada para preservá-los.';
  end if;
  delete from public.financeiro_lancamentos where artista_id=v_lote.artista_id and id::text in(select jsonb_array_elements_text(v_lote.registros->'lancamentos'));
  delete from public.despesas_artista where artista_id=v_lote.artista_id and id in(select jsonb_array_elements_text(v_lote.registros->'despesas'));
  delete from public.transacoes_financeiras where artista_id=v_lote.artista_id and id::text in(select jsonb_array_elements_text(v_lote.registros->'transacoes'));
  delete from public.agendamentos where artista_id=v_lote.artista_id and id::text in(select jsonb_array_elements_text(v_lote.registros->'agendamentos'));
  update dermys_debug.lotes set removido_em=now() where id=p_lote_id;
  return true;
end $$;
