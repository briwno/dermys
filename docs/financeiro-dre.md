# Financeiro e DRE

A aba Financeiro abre na DRE. Notas reúne documentos e o limite MEI; Extrato reúne cobranças e configurações de recebimento. A DRE consulta o Supabase e não depende dos totais manuais que a versão anterior guardava no dispositivo.

## Fontes e competência

- Serviços concluídos: `agendamentos.valor_total`, uma vez por agendamento. Competência em `concluido_em`, com fallback para `data_horario`, no fuso de São Paulo. Sinais de serviços futuros não geram receita.
- Despesas existentes: materiais e biossegurança entram em custos; demais categorias existentes entram em despesas administrativas. Revise a classificação de equipamentos conforme a apuração do estúdio.
- Taxas: pagamentos aprovados/liberados vinculados a serviços concluídos seguem a competência do serviço. Taxas avulsas seguem a data da transação. Custódia, pagamentos pendentes e cancelados ficam fora.
- Estornos aprovados/liberados de serviços concluídos entram em deduções na data do estorno.
- Notas e recibos não geram uma segunda receita. Tributos estimados não são tratados como impostos efetivamente apurados.
- Complementos manuais: receitas externas, deduções, custos, vendas, administração, depreciação, receitas/despesas financeiras e IRPJ/CSLL. Informe valores ainda não presentes nas fontes automáticas. Os valores manuais antigos continuam no armazenamento local; não são importados automaticamente, para evitar duplicação com as fontes integradas.

Os lançamentos manuais permitem criar, editar e excluir com confirmação. Fontes automáticas são corrigidas no registro de origem. A tela oferece mês/ano, comparação com o período anterior, margens sobre a receita líquida e CSV com resumo e lançamentos. No aplicativo nativo, o conteúdo é encaminhado à folha de compartilhamento.

## Acesso

`financeiro_lancamentos` usa RLS. O titular acessa seus registros; acesso às personas de demonstração depende de concessão explícita em `financeiro_acessos_teste`. O cliente não pode conceder acesso, mudar autoria ou reatribuir um lançamento. As funções são `SECURITY INVOKER` e não permitem execução anônima. Nenhuma chave privilegiada foi adicionada ao aplicativo.

No projeto remoto Dermys, a conta Bruno recebeu acesso financeiro às oito personas de artista já existentes nas ferramentas de teste. Essa concessão de ambiente não faz parte das migrations e não concede acesso a artistas reais.

As três migrations desta implementação já foram aplicadas ao projeto remoto; os arquivos locais usam as versões registradas no servidor. O projeto remoto também possui migrations anteriores que não estavam neste checkout: não execute um reset remoto a partir desta pasta.

## Sessão de teste

A seleção da persona é persistida separadamente da sessão Supabase. Renovação do token e eventos repetidos de login não recarregam o dashboard. Respostas antigas são invalidadas ao trocar persona; cada usuário tem sua árvore de dashboard remontada para não reutilizar estado de outra conta. Sair ou concluir um login normal limpa a seleção de teste.

## Verificações

```sh
npx tsc --noEmit
node scripts/test-dre.cjs
node scripts/test-persona-dre-service.cjs
npm run build:web
```

Os testes SQL `scripts/test-dre-rls.sql` e `scripts/test-dre-fontes.sql` usam fixtures específicas do ambiente de demonstração e revertem todas as alterações com `ROLLBACK`. Cobrem CRUD, isolamento entre contas, bloqueio de autoconcessão e anonimato, competência, fuso, sinais, taxas, despesas e estornos.

## Pendências anteriores à alteração

O advisor remoto já indicava RLS desativada em `public.profiles`. Outras tabelas legadas também têm políticas públicas de demonstração. A proteção dos novos lançamentos não substitui uma revisão dessas permissões antes de usar dados reais. [Orientação do Supabase](https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public).

A compilação e os testes foram executados; a inspeção visual no navegador não foi possível porque o controle de navegador/computador não estava disponível nesta sessão.
