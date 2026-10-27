-- Exercita os cenários reais com RLS. Tudo é revertido, incluindo lotes e fixtures.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','b57a566c-4a59-4f4d-86f6-a1dd792659ef',true);
select set_config('request.jwt.claim.role','authenticated',true);
do $$
declare
  codigo text; resultado jsonb; repetido jsonb; pedido uuid; lote uuid; sentinela uuid;
  artista uuid := '11111111-1111-1111-1111-111111111111';
  cliente uuid := '99999999-9999-9999-9999-999999999999';
  total integer := 0;
  registros jsonb; saldo numeric; categorias integer;
begin
  insert into public.financeiro_lancamentos(artista_id,competencia,categoria,descricao,valor)
    values(artista,'2026-10-15','custos','Sentinela fora dos lotes',7.89) returning id into sentinela;
  foreach codigo in array array[
    'sinal_custodia','pix_liberado','cartao_aprovado','pagamento_pendente','pagamento_cancelado','estorno_parcial',
    'despesa_material','despesa_estudio','despesa_equipamento','pacote_despesas',
    'reserva_pendente','reserva_confirmada','sessao_concluida','reserva_cancelada',
    'mes_lucrativo','mes_prejuizo','historico_trimestral','dre_completa'
  ] loop
    pedido=gen_random_uuid();
    resultado=public.debug_gerar_cenario(artista,cliente,codigo,'2026-10-15',600,1,pedido);
    repetido=public.debug_gerar_cenario(artista,cliente,codigo,'2026-10-15',600,1,pedido);
    if resultado is distinct from repetido then raise exception 'Idempotência falhou para %',codigo; end if;
    lote=(resultado->>'loteId')::uuid;
    if total<15 and not exists(select 1 from public.debug_listar_lotes(artista) where id=lote) then raise exception 'Histórico não inclui %',codigo; end if;
    if codigo='pacote_despesas' and (resultado->>'despesas')::integer<>5 then raise exception 'Pacote incompleto'; end if;
    if codigo='dre_completa' and ((resultado->>'agendamentos')::integer<>2 or (resultado->>'transacoes')::integer<>4 or (resultado->>'lancamentos')::integer<>6) then raise exception 'DRE completa incompleta'; end if;
    if codigo='historico_trimestral' and (resultado->>'agendamentos')::integer<>3 then raise exception 'Histórico não gerou três meses'; end if;
    select l.registros into registros from dermys_debug.lotes l where l.id=lote;
    select sum(case when categoria in ('receitaBruta','receitasFinanceiras') then valor else -valor end),count(distinct categoria)
      into saldo,categorias from public.listar_lancamentos_dre(artista,'2026-08-01','2026-11-01') m
      where regexp_replace(m.id,'^[^:]+:','') in(select e.value from jsonb_each(registros) j cross join lateral jsonb_array_elements_text(j.value) e);
    if codigo='mes_lucrativo' and saldo is distinct from 390::numeric then raise exception 'Pacote lucrativo não produz lucro esperado: %',saldo; end if;
    if codigo='mes_prejuizo' and saldo is distinct from -300::numeric then raise exception 'Pacote de prejuízo não produz perda esperada: %',saldo; end if;
    if codigo='estorno_parcial' and saldo is distinct from 450::numeric then raise exception 'Estorno não deduz corretamente'; end if;
    if codigo='dre_completa' and categorias<>9 then raise exception 'Categorias incompletas: %',categorias; end if;
    if codigo in ('sinal_custodia','pagamento_pendente','pagamento_cancelado','reserva_pendente','reserva_confirmada','reserva_cancelada') and saldo is not null then raise exception 'Movimento não realizado afetou a DRE: %',codigo; end if;
    if exists(select 1 from public.agendamentos a where a.descricao like '[DERMYS_TESTE:'||lote||']%' and (a.artista_id<>artista or a.cliente_id<>cliente)) then raise exception 'Dados criados no perfil errado'; end if;
    if not public.debug_remover_lote(lote) then raise exception 'Remoção falhou'; end if;
    if not public.debug_remover_lote(lote) then raise exception 'Remoção repetida falhou'; end if;
    if exists(select 1 from public.agendamentos where descricao like '[DERMYS_TESTE:'||lote||']%')
      or exists(select 1 from public.despesas_artista where descricao like '[DERMYS_TESTE:'||lote||']%')
      or exists(select 1 from public.financeiro_lancamentos where descricao like '[DERMYS_TESTE:'||lote||']%')
      or exists(select 1 from public.transacoes_financeiras where descricao like '[DERMYS_TESTE:'||lote||']%') then raise exception 'Lote não foi limpo integralmente: %',codigo; end if;
    if not exists(select 1 from public.financeiro_lancamentos where id=sentinela) then raise exception 'A limpeza apagou dados fora do lote'; end if;
    total=total+1;
  end loop;
  if total<>18 then raise exception 'Cenários faltantes'; end if;
  begin
    perform public.debug_gerar_cenario(artista,cliente,'codigo_invalido','2026-10-15',600,1,gen_random_uuid());
    raise exception 'Cenário inválido foi aceito' using errcode='23514';
  exception when raise_exception then null;
  end;
  begin
    perform public.debug_gerar_cenario(artista,cliente,'pix_liberado','2026-10-15',-1,1,gen_random_uuid());
    raise exception 'Valor inválido foi aceito' using errcode='23514';
  exception when raise_exception then null;
  end;
  resultado=public.debug_gerar_cenario(artista,auth.uid(),'reserva_pendente','2026-10-15',600,3,gen_random_uuid());
  perform set_config('dermys_debug.lote_teste',resultado->>'loteId',true);
  if (resultado->>'agendamentos')::integer<>3 then raise exception 'Quantidade não respeitada'; end if;
  if (select count(*) from public.agendamentos where descricao like '[DERMYS_TESTE:'||(resultado->>'loteId')||']%' and cliente_id=auth.uid())<>3 then raise exception 'Cliente ativo não respeitado'; end if;
end $$;

select set_config('request.jwt.claim.sub','99999999-9999-9999-9999-999999999999',true);
do $$
begin
  if exists(select 1 from public.debug_listar_lotes('11111111-1111-1111-1111-111111111111')) then raise exception 'Histórico de outra conta vazou'; end if;
  begin
    perform public.debug_gerar_cenario('11111111-1111-1111-1111-111111111111',auth.uid(),'pix_liberado','2026-10-15',600,1,gen_random_uuid());
    raise exception 'Geração indevida deveria ser bloqueada';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.debug_remover_lote(current_setting('dermys_debug.lote_teste')::uuid);
    raise exception 'Remoção de outra conta deveria ser bloqueada';
  exception when insufficient_privilege then null;
  end;
end $$;
set local role anon;
do $$
begin
  begin
    perform public.debug_listar_lotes('11111111-1111-1111-1111-111111111111');
    raise exception 'Acesso anônimo deveria ser bloqueado';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
select set_config('request.jwt.claim.sub','b57a566c-4a59-4f4d-86f6-a1dd792659ef',true);
do $$
declare resultado jsonb; lote uuid; ag uuid; extra uuid;
begin
  resultado=public.debug_gerar_cenario('11111111-1111-1111-1111-111111111111','99999999-9999-9999-9999-999999999999','pix_liberado','2026-10-15',600,1,gen_random_uuid());
  lote=(resultado->>'loteId')::uuid;
  select (registros->'agendamentos'->>0)::uuid into ag from dermys_debug.lotes where id=lote;
  insert into public.transacoes_financeiras(agendamento_id,artista_id,cliente_id,tipo,valor_bruto,valor_liquido,status)
    values(ag,'11111111-1111-1111-1111-111111111111','99999999-9999-9999-9999-999999999999','PAGAMENTO_FINAL',1,1,'PENDENTE') returning id into extra;
  begin
    perform public.debug_remover_lote(lote);
    raise exception 'Deveria preservar o lote que ganhou dependências externas' using errcode='23514';
  exception when raise_exception then null;
  end;
  if not exists(select 1 from public.agendamentos where id=ag) or not exists(select 1 from public.transacoes_financeiras where id=extra) then
    raise exception 'Dados externos foram removidos';
  end if;
  delete from public.transacoes_financeiras where id=extra;
  perform public.debug_remover_lote(lote);
end $$;
rollback;
select 'Debug: 18 cenários, idempotência, perfil ativo, lotes, limpeza seletiva e permissões aprovados' as resultado;
