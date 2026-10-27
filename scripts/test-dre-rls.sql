-- Testes transacionais no ambiente Dermys: nenhum lançamento de teste é mantido.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','b57a566c-4a59-4f4d-86f6-a1dd792659ef',true);
do $$
declare teste uuid; encontrado integer;
begin
  if not public.financeiro_pode_acessar('11111111-1111-1111-1111-111111111111') then
    raise exception 'Conta de teste autorizada não consegue acessar a persona';
  end if;
  insert into public.financeiro_lancamentos(artista_id,competencia,categoria,descricao,valor)
    values ('11111111-1111-1111-1111-111111111111','2026-10-15','custos','Teste transacional DRE',12.34) returning id into teste;
  select count(*) into encontrado from public.listar_lancamentos_dre('11111111-1111-1111-1111-111111111111','2026-10-01','2026-11-01')
    where id=teste::text and valor=12.34 and editavel;
  if encontrado <> 1 then raise exception 'Lançamento não apareceu na DRE'; end if;
  update public.financeiro_lancamentos set valor=21.45 where id=teste;
  if not exists(select 1 from public.financeiro_lancamentos where id=teste and valor=21.45) then
    raise exception 'Edição falhou';
  end if;
  begin
    update public.financeiro_lancamentos set artista_id='22222222-2222-2222-2222-222222222222' where id=teste;
    raise exception 'Reatribuição de artista deveria ser bloqueada';
  exception when insufficient_privilege then null;
  end;
  delete from public.financeiro_lancamentos where id=teste;
  if exists(select 1 from public.financeiro_lancamentos where id=teste) then raise exception 'Exclusão falhou'; end if;
  insert into public.financeiro_lancamentos(artista_id,competencia,categoria,descricao,valor)
    values (auth.uid(),'2026-10-15','custos','Teste do próprio titular',1);
end $$;

select set_config('request.jwt.claim.sub','99999999-9999-9999-9999-999999999999',true);
do $$
begin
  if public.financeiro_pode_acessar('11111111-1111-1111-1111-111111111111') then raise exception 'Acesso indevido'; end if;
  if exists(select 1 from public.financeiro_lancamentos) then raise exception 'RLS vazou lançamentos'; end if;
  if exists(select 1 from public.listar_lancamentos_dre('11111111-1111-1111-1111-111111111111','2026-01-01','2027-01-01')) then raise exception 'RPC vazou dados'; end if;
  begin
    insert into public.financeiro_lancamentos(artista_id,competencia,categoria,descricao,valor)
      values ('11111111-1111-1111-1111-111111111111','2026-10-15','custos','Não autorizado',1);
    raise exception 'Inserção indevida deveria ser bloqueada';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.financeiro_acessos_teste values (auth.uid(),'11111111-1111-1111-1111-111111111111');
    raise exception 'Autoconcessão deveria ser bloqueada';
  exception when insufficient_privilege then null;
  end;
end $$;
set local role anon;
do $$
begin
  begin
    perform * from public.listar_lancamentos_dre('11111111-1111-1111-1111-111111111111','2026-01-01','2027-01-01');
    raise exception 'RPC anônima deveria ser bloqueada';
  exception when insufficient_privilege then null;
  end;
end $$;
rollback;
select 'DRE: CRUD, titular, delegação de teste, isolamento, autoria e acesso anônimo aprovados' as resultado;
