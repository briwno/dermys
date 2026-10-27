# Gerar dados de teste

Abra **Ferramentas de teste → Gerar dados**. O painel mantém visível o perfil ativo e permite escolher a outra pessoa envolvida, valor base, data e uma, três ou cinco repetições.

Para artista ativo, as receitas, despesas e a DRE pertencem a ele. Para cliente ativo, reservas e pagamentos usam esse cliente; despesas e DRE pertencem ao artista de demonstração escolhido explicitamente no painel.

## Cenários

- Pagamentos: sinal em custódia, PIX liberado, cartão aprovado com taxa de 4,99%, pagamento pendente, cancelado e estorno parcial de 25%.
- Despesas: materiais, contas fixas, manutenção e pacote com as cinco categorias existentes.
- Agenda: reserva pendente, confirmada, sessão concluída e cancelamento.
- Pacotes: mês lucrativo, mês com prejuízo, histórico de três meses e todas as nove categorias da DRE.

Os pacotes acrescentam registros sem substituir dados existentes. Seu efeito deve ser somado às outras movimentações do período. Com valor base de R$ 600 e uma repetição, os pacotes de lucro e prejuízo acrescentam resultados de R$ 390 e R$ −300, respectivamente.

## Simulação automática

Executa cinco ciclos: PIX, material, cartão, despesa fixa e estorno. O primeiro é imediato; os demais ocorrem a cada dez segundos, sem sobrepor uma requisição em andamento. A simulação termina ao fechar o painel, mudar de perfil, ocorrer um erro ou concluir os cinco ciclos. A ação já enviada ao banco termina normalmente. Não existe agendamento ou processo de fundo persistente.

## Persistência e segurança

Os registros são reais no banco e identificados com `[DERMYS_TESTE:<lote>]`. Nenhum provedor de pagamentos, emissor fiscal ou envio de mensagens é chamado. Os botões antigos que apenas exibiam alertas ou usavam status incompatíveis com o banco foram substituídos.

Cada solicitação usa um identificador de idempotência. Em caso de falha de conexão, **Tentar novamente** repete esse identificador e não duplica um lote já concluído. As telas são recarregadas após a geração, preservando a persona e a aba escolhida. A agenda passou a receber o artista ativo em vez de consultar o ID da sessão original.

As funções públicas usam `SECURITY INVOKER`. As funções que criam e removem fixtures são `SECURITY DEFINER` em `dermys_debug`, schema não exposto pela Data API, com `search_path` vazio, execução anônima revogada e validação explícita de `auth.uid()`, titularidade/concessão e participantes permitidos. Isso permite cenários transacionais para personas sem ampliar as políticas de escrita das tabelas de negócio.

O registro de lotes usa RLS e só permite leitura ao criador. Valores são limitados a R$ 1–10.000, até cinco repetições e cinquenta lotes por hora. O schema `dermys_debug` deve permanecer fora dos schemas expostos na Data API.

## Limpeza

**Histórico** mostra os últimos quinze lotes do perfil criados pela conta autenticada. A remoção exige confirmação e só afeta IDs registrados naquele lote. Lotes de outra conta e registros fora do lote não podem ser removidos por essa ação. Se um lote ganhou notas, anamnese ou transações externas, sua remoção é bloqueada; as linhas são bloqueadas durante a checagem para evitar corridas com novas referências.

## Verificações

```sh
npx tsc --noEmit
node scripts/test-debug-service.cjs
node scripts/test-persona-dre-service.cjs
npm run build:web
```

`scripts/test-debug-cenarios.sql` testa os dezoito cenários, os efeitos na DRE, idempotência, quantidade, cliente ativo, isolamento de histórico, limpeza seletiva, dependências externas e bloqueio anônimo. Toda fixture desse teste é revertida com `ROLLBACK`.
