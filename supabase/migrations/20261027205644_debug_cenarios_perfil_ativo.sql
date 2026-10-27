-- Geradores transacionais de fixtures. Não chamam provedores de pagamento, notas ou chat.
create schema if not exists dermys_debug;
revoke all on schema dermys_debug from public, anon;
grant usage on schema dermys_debug to authenticated;

create table dermys_debug.lotes (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid not null,
  artista_id uuid not null references public.profiles(id),
  cliente_id uuid not null references public.profiles(id),
  cenario text not null,
  data_base date not null,
  valor_base numeric(12,2) not null,
  quantidade integer not null,
  registros jsonb not null default '{"agendamentos":[],"transacoes":[],"despesas":[],"lancamentos":[]}',
  resultado jsonb,
  criado_em timestamptz not null default now(),
  removido_em timestamptz,
  unique(usuario_id,request_id)
);
create index debug_lotes_usuario_data_idx on dermys_debug.lotes(usuario_id,criado_em desc);
create index debug_lotes_artista_idx on dermys_debug.lotes(artista_id);
create index debug_lotes_cliente_idx on dermys_debug.lotes(cliente_id);
alter table dermys_debug.lotes enable row level security;
revoke all on dermys_debug.lotes from public,anon,authenticated;
grant select on dermys_debug.lotes to authenticated;
create policy debug_lotes_leitura_propria on dermys_debug.lotes for select to authenticated
  using(usuario_id=(select auth.uid()));

-- SECURITY DEFINER restrito ao schema não exposto: necessário para inserir fixtures
-- atômicas de personas autorizadas sem abrir as políticas das tabelas de negócio.
create function dermys_debug.gerar_cenario(
  p_artista_id uuid, p_cliente_id uuid, p_cenario text, p_data date,
  p_valor numeric, p_quantidade integer, p_request_id uuid
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
  v_usuario uuid := auth.uid(); v_lote dermys_debug.lotes%rowtype;
  v_passos jsonb := '[]'; v_passo jsonb; v_ids jsonb;
  v_i integer; v_data date; v_horario timestamptz; v_ag uuid; v_id uuid; v_despesa text;
  v_valor numeric; v_sinal numeric; v_taxa numeric; v_status text; v_pagamento text;
  v_marcador text; v_resultado jsonb;
begin
  if v_usuario is null or not exists(select 1 from auth.users where id=v_usuario)
    or not public.financeiro_pode_acessar(p_artista_id) then
    raise exception 'Sua conta não tem permissão para gerar testes neste artista.' using errcode='42501';
  end if;
  if p_cliente_id not in (v_usuario,'99999999-9999-9999-9999-999999999999'::uuid)
    or p_cliente_id=p_artista_id
    or not exists(select 1 from public.profiles where id=p_cliente_id and tipo_perfil='cliente')
    or not exists(select 1 from public.profiles where id=p_artista_id and tipo_perfil='artista') then
    raise exception 'Escolha um artista autorizado e o cliente de demonstração ou sua própria conta.';
  end if;
  if p_request_id is null or p_data is null or p_data < date '2000-01-01' or p_data > date '2100-12-01'
    or p_valor is null or p_valor < 1 or p_valor > 10000 or p_valor <> round(p_valor,2)
    or p_quantidade is null or p_quantidade not between 1 and 5 then
    raise exception 'Use uma data válida, valor de R$ 1 a R$ 10.000 e quantidade de 1 a 5.';
  end if;
  case p_cenario
    when 'reserva_pendente' then v_passos=jsonb_build_array(jsonb_build_object('tipo','sessao','status','pendente','pagamento','nenhum','valor',p_valor));
    when 'reserva_confirmada','sinal_custodia' then v_passos=jsonb_build_array(jsonb_build_object('tipo','sessao','status','confirmado','pagamento','CUSTODIA','valor',p_valor));
    when 'reserva_cancelada' then v_passos=jsonb_build_array(jsonb_build_object('tipo','sessao','status','cancelado','pagamento','nenhum','valor',p_valor));
    when 'sessao_concluida','pix_liberado' then v_passos=jsonb_build_array(jsonb_build_object('tipo','sessao','status','concluido','pagamento','LIBERADO','valor',p_valor));
    when 'cartao_aprovado' then v_passos=jsonb_build_array(jsonb_build_object('tipo','sessao','status','concluido','pagamento','APROVADO','metodo','cartao','valor',p_valor));
    when 'pagamento_pendente' then v_passos=jsonb_build_array(jsonb_build_object('tipo','sessao','status','pendente','pagamento','PENDENTE','valor',p_valor));
    when 'pagamento_cancelado' then v_passos=jsonb_build_array(jsonb_build_object('tipo','sessao','status','cancelado','pagamento','CANCELADO','valor',p_valor));
    when 'estorno_parcial' then v_passos=jsonb_build_array(jsonb_build_object('tipo','sessao','status','concluido','pagamento','LIBERADO','estorno',true,'valor',p_valor));
    when 'despesa_material' then v_passos=jsonb_build_array(jsonb_build_object('tipo','despesa','categoria','MATERIAIS_TATUAGEM','descricao','Materiais de tatuagem','valor',p_valor));
    when 'despesa_estudio' then v_passos=jsonb_build_array(jsonb_build_object('tipo','despesa','categoria','ESTUDIO_FIXO','descricao','Aluguel e contas do estúdio','recorrente',true,'valor',p_valor));
    when 'despesa_equipamento' then v_passos=jsonb_build_array(jsonb_build_object('tipo','despesa','categoria','EQUIPAMENTOS_MANUTENCAO','descricao','Manutenção de equipamento','valor',p_valor));
    when 'pacote_despesas' then v_passos=jsonb_build_array(
      jsonb_build_object('tipo','despesa','categoria','MATERIAIS_TATUAGEM','descricao','Agulhas e pigmentos','valor',round(p_valor*.3,2)),
      jsonb_build_object('tipo','despesa','categoria','LIMPEZA_BIOSSEGURANCA','descricao','Limpeza e descartáveis','valor',round(p_valor*.1,2)),
      jsonb_build_object('tipo','despesa','categoria','ESTUDIO_FIXO','descricao','Contas fixas','recorrente',true,'valor',round(p_valor*.4,2)),
      jsonb_build_object('tipo','despesa','categoria','EQUIPAMENTOS_MANUTENCAO','descricao','Manutenção','valor',round(p_valor*.15,2)),
      jsonb_build_object('tipo','despesa','categoria','OUTROS','descricao','Outras despesas','valor',round(p_valor*.05,2)));
    when 'mes_lucrativo','mes_prejuizo' then
      v_passos=jsonb_build_array(
        jsonb_build_object('tipo','sessao','status','concluido','pagamento','LIBERADO','valor',p_valor),
        jsonb_build_object('tipo','despesa','categoria','MATERIAIS_TATUAGEM','descricao','Custos do cenário','valor',round(p_valor*case when p_cenario='mes_prejuizo' then .8 else .2 end,2)),
        jsonb_build_object('tipo','despesa','categoria','ESTUDIO_FIXO','descricao','Despesas fixas do cenário','valor',round(p_valor*case when p_cenario='mes_prejuizo' then .7 else .15 end,2)));
    when 'historico_trimestral' then
      for v_i in -2..0 loop
        v_passos=v_passos || jsonb_build_array(
          jsonb_build_object('tipo','sessao','status','concluido','pagamento','LIBERADO','mes',v_i,'valor',round(p_valor*(1.2+v_i*.2),2)),
          jsonb_build_object('tipo','despesa','categoria','ESTUDIO_FIXO','descricao','Custo mensal do histórico','mes',v_i,'valor',round(p_valor*.25,2)));
      end loop;
    when 'dre_completa' then
      v_passos=jsonb_build_array(
        jsonb_build_object('tipo','sessao','status','concluido','pagamento','LIBERADO','valor',p_valor),
        jsonb_build_object('tipo','sessao','status','concluido','pagamento','APROVADO','metodo','cartao','valor',p_valor),
        jsonb_build_object('tipo','despesa','categoria','MATERIAIS_TATUAGEM','descricao','Materiais','valor',round(p_valor*.3,2)),
        jsonb_build_object('tipo','despesa','categoria','ESTUDIO_FIXO','descricao','Custos fixos','valor',round(p_valor*.2,2)),
        jsonb_build_object('tipo','lancamento','categoria','deducoes','descricao','Deduções simuladas','valor',round(p_valor*.05,2)),
        jsonb_build_object('tipo','lancamento','categoria','vendas','descricao','Divulgação simulada','valor',round(p_valor*.08,2)),
        jsonb_build_object('tipo','lancamento','categoria','depreciacao','descricao','Depreciação simulada','valor',round(p_valor*.03,2)),
        jsonb_build_object('tipo','lancamento','categoria','receitasFinanceiras','descricao','Receita financeira simulada','valor',round(p_valor*.01,2)),
        jsonb_build_object('tipo','lancamento','categoria','despesasFinanceiras','descricao','Juros simulados','valor',round(p_valor*.02,2)),
        jsonb_build_object('tipo','lancamento','categoria','tributosLucro','descricao','Tributos simulados, sem apuração fiscal','valor',round(p_valor*.04,2)));
    else raise exception 'Cenário de teste inválido.';
  end case;

  insert into dermys_debug.lotes(usuario_id,request_id,artista_id,cliente_id,cenario,data_base,valor_base,quantidade)
    values(v_usuario,p_request_id,p_artista_id,p_cliente_id,p_cenario,p_data,p_valor,p_quantidade)
    on conflict(usuario_id,request_id) do nothing returning * into v_lote;
  if not found then
    select * into v_lote from dermys_debug.lotes where usuario_id=v_usuario and request_id=p_request_id;
    if v_lote.artista_id<>p_artista_id or v_lote.cliente_id<>p_cliente_id or v_lote.cenario<>p_cenario
      or v_lote.data_base<>p_data or v_lote.valor_base<>p_valor or v_lote.quantidade<>p_quantidade then
      raise exception 'A solicitação já foi utilizada para outro cenário.';
    end if;
    if v_lote.removido_em is not null then raise exception 'Este lote já foi removido. Inicie um novo teste.'; end if;
    return v_lote.resultado;
  end if;
  if (select count(*) from dermys_debug.lotes where usuario_id=v_usuario and criado_em>now()-interval '1 hour')>50 then
    raise exception 'Limite de 50 lotes por hora atingido. Aguarde para gerar novos testes.';
  end if;
  v_ids=v_lote.registros;
  v_marcador='[DERMYS_TESTE:' || v_lote.id || '] ';
  for v_i in 1..p_quantidade loop
    for v_passo in select value from jsonb_array_elements(v_passos) loop
      v_data=(p_data+make_interval(months=>coalesce((v_passo->>'mes')::integer,0)))::date+(v_i-1);
      v_horario=(v_data+time '14:00') at time zone 'America/Sao_Paulo';
      v_valor=(v_passo->>'valor')::numeric;
      if v_passo->>'tipo'='sessao' then
        v_status=v_passo->>'status'; v_pagamento=v_passo->>'pagamento'; v_sinal=round(v_valor*.3,2);
        insert into public.agendamentos(artista_id,cliente_id,data_horario,estilo,descricao,valor_total,valor_sinal,valor_final,status,sinal_pago,concluido_em,forma_pagamento)
          values(p_artista_id,p_cliente_id,v_horario,'Teste autoral',v_marcador || p_cenario,v_valor,v_sinal,
            case when v_status='concluido' then v_valor-v_sinal else null end,v_status,
            v_pagamento in ('CUSTODIA','LIBERADO','APROVADO'),case when v_status='concluido' then v_horario else null end,coalesce(v_passo->>'metodo','pix')) returning id into v_ag;
        v_ids=jsonb_set(v_ids,'{agendamentos}',(v_ids->'agendamentos')||to_jsonb(v_ag));
        if v_pagamento<>'nenhum' then
          v_taxa=round(v_sinal*case when v_passo->>'metodo'='cartao' then .0499 else 0 end,2);
          insert into public.transacoes_financeiras(agendamento_id,artista_id,cliente_id,tipo,valor_bruto,taxa_mercado_pago,valor_liquido,status,forma_pagamento,descricao,criado_em)
            values(v_ag,p_artista_id,p_cliente_id,'SINAL',v_sinal,v_taxa,v_sinal-v_taxa,v_pagamento,coalesce(v_passo->>'metodo','pix'),v_marcador||'Sinal simulado',v_horario-interval '3 days') returning id into v_id;
          v_ids=jsonb_set(v_ids,'{transacoes}',(v_ids->'transacoes')||to_jsonb(v_id));
          if v_status='concluido' then
            v_taxa=round((v_valor-v_sinal)*case when v_passo->>'metodo'='cartao' then .0499 else 0 end,2);
            insert into public.transacoes_financeiras(agendamento_id,artista_id,cliente_id,tipo,valor_bruto,taxa_mercado_pago,valor_liquido,status,forma_pagamento,descricao,criado_em)
              values(v_ag,p_artista_id,p_cliente_id,'PAGAMENTO_FINAL',v_valor-v_sinal,v_taxa,v_valor-v_sinal-v_taxa,v_pagamento,coalesce(v_passo->>'metodo','pix'),v_marcador||'Pagamento final simulado',v_horario) returning id into v_id;
            v_ids=jsonb_set(v_ids,'{transacoes}',(v_ids->'transacoes')||to_jsonb(v_id));
          end if;
        end if;
        if coalesce((v_passo->>'estorno')::boolean,false) then
          insert into public.transacoes_financeiras(agendamento_id,artista_id,cliente_id,tipo,valor_bruto,taxa_mercado_pago,valor_liquido,status,forma_pagamento,descricao,criado_em)
            values(v_ag,p_artista_id,p_cliente_id,'ESTORNO',round(v_valor*.25,2),0,round(v_valor*.25,2),'LIBERADO','pix',v_marcador||'Estorno de 25% simulado',v_horario+interval '1 hour') returning id into v_id;
          v_ids=jsonb_set(v_ids,'{transacoes}',(v_ids->'transacoes')||to_jsonb(v_id));
        end if;
      elsif v_passo->>'tipo'='despesa' then
        v_despesa=gen_random_uuid()::text;
        insert into public.despesas_artista(id,artista_id,descricao,valor,categoria,data,recorrente,observacoes)
          values(v_despesa,p_artista_id,v_marcador||(v_passo->>'descricao'),v_valor,v_passo->>'categoria',v_data,coalesce((v_passo->>'recorrente')::boolean,false),'Gerado pelas ferramentas de teste; não representa despesa real.');
        v_ids=jsonb_set(v_ids,'{despesas}',(v_ids->'despesas')||to_jsonb(v_despesa));
      else
        insert into public.financeiro_lancamentos(artista_id,competencia,categoria,descricao,valor,criado_por)
          values(p_artista_id,v_data,v_passo->>'categoria',v_marcador||(v_passo->>'descricao'),v_valor,v_usuario) returning id into v_id;
        v_ids=jsonb_set(v_ids,'{lancamentos}',(v_ids->'lancamentos')||to_jsonb(v_id));
      end if;
    end loop;
  end loop;
  v_resultado=jsonb_build_object('loteId',v_lote.id,'agendamentos',jsonb_array_length(v_ids->'agendamentos'),
    'transacoes',jsonb_array_length(v_ids->'transacoes'),'despesas',jsonb_array_length(v_ids->'despesas'),'lancamentos',jsonb_array_length(v_ids->'lancamentos'));
  update dermys_debug.lotes set registros=v_ids,resultado=v_resultado where id=v_lote.id;
  return v_resultado;
end $$;
revoke all on function dermys_debug.gerar_cenario(uuid,uuid,text,date,numeric,integer,uuid) from public,anon;
grant execute on function dermys_debug.gerar_cenario(uuid,uuid,text,date,numeric,integer,uuid) to authenticated;

create function public.debug_gerar_cenario(p_artista_id uuid,p_cliente_id uuid,p_cenario text,p_data date,p_valor numeric,p_quantidade integer,p_request_id uuid)
returns jsonb language sql security invoker set search_path='' as $$
  select dermys_debug.gerar_cenario(p_artista_id,p_cliente_id,p_cenario,p_data,p_valor,p_quantidade,p_request_id);
$$;
revoke all on function public.debug_gerar_cenario(uuid,uuid,text,date,numeric,integer,uuid) from public,anon;
grant execute on function public.debug_gerar_cenario(uuid,uuid,text,date,numeric,integer,uuid) to authenticated;

create function public.debug_listar_lotes(p_perfil_id uuid)
returns table(id uuid,cenario text,criado_em timestamptz,data_base date,resultado jsonb,removido_em timestamptz)
language sql stable security invoker set search_path='' as $$
  select l.id,l.cenario,l.criado_em,l.data_base,l.resultado,l.removido_em from dermys_debug.lotes l
  where l.usuario_id=(select auth.uid()) and p_perfil_id in (l.artista_id,l.cliente_id)
  order by l.criado_em desc,l.id desc limit 15;
$$;
revoke all on function public.debug_listar_lotes(uuid) from public,anon;
grant execute on function public.debug_listar_lotes(uuid) to authenticated;

create function dermys_debug.remover_lote(p_lote_id uuid) returns boolean
language plpgsql security definer set search_path='' as $$
declare v_lote dermys_debug.lotes%rowtype;
begin
  if auth.uid() is null then raise exception 'Entre na sua conta.' using errcode='42501'; end if;
  select * into v_lote from dermys_debug.lotes where id=p_lote_id and usuario_id=auth.uid() for update;
  if not found then raise exception 'Lote não encontrado para sua conta.' using errcode='42501'; end if;
  if not public.financeiro_pode_acessar(v_lote.artista_id) then raise exception 'Acesso ao artista revogado.' using errcode='42501'; end if;
  if v_lote.removido_em is not null then return true; end if;
  -- Não apague registros que passaram a ser referenciados por dados fora do lote.
  if exists(select 1 from public.notas_fiscais where agendamento_id::text in(select jsonb_array_elements_text(v_lote.registros->'agendamentos')))
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
revoke all on function dermys_debug.remover_lote(uuid) from public,anon;
grant execute on function dermys_debug.remover_lote(uuid) to authenticated;
create function public.debug_remover_lote(p_lote_id uuid) returns boolean
language sql security invoker set search_path='' as $$ select dermys_debug.remover_lote(p_lote_id); $$;
revoke all on function public.debug_remover_lote(uuid) from public,anon;
grant execute on function public.debug_remover_lote(uuid) to authenticated;
