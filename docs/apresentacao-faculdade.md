# Dermys — demonstração e iPhone

## Abrir no Expo Go

O projeto usa **Expo SDK 58**, correspondente ao Expo Go informado no iPhone. PC e celular compartilham telas, regras e serviços. A moldura e a barra de desenvolvimento são exclusivas da visualização de computador.

1. No terminal da pasta do projeto, execute `npm run celular -- --clear`.
2. Conecte PC e iPhone ao mesmo Wi-Fi.
3. Leia o QR code com a câmera do iPhone e abra no Expo Go.
4. Se o Expo Go pedir uma conta Expo, entre com a mesma conta no computador e no aplicativo (`npx expo login` no PC).
5. Se o Wi-Fi da faculdade impedir a conexão entre aparelhos, use `npm run celular:tunnel`. O túnel precisa de internet e pode solicitar a instalação do auxiliar oficial do Expo.

Não é necessário gerar aplicativo de loja ou instalar Xcode para esta demonstração no Expo Go. A exportação iOS verifica o código JavaScript; a conferência de teclado, gestos, compartilhamento e aparência final ainda deve ser feita no iPhone.

## Acesso às ferramentas

- **PC:** botão Ferramentas de Teste na barra superior.
- **Celular:** ponto discreto na lateral direita, acima da navegação. Segure por aproximadamente um segundo para abrir. Também é possível tocar uma vez para revelar a chave e novamente para abrir. A chave recolhe após oito segundos e desaparece quando o teclado está aberto.
- A navegação inferior mantém apenas os ícones, com indicação discreta da aba ativa.

## Preparar a apresentação

Abra **Apresentar → Preparar apresentação**. Isso ativa um banco local exclusivo neste aparelho e seleciona Mariana, a cliente. O cenário inclui os nove perfis, três atendimentos concluídos, pagamentos, materiais, contas do estúdio, uma conversa e uma avaliação. A vitrine e o portfólio usam também as obras de demonstração já existentes.

As mesmas telas passam a operar sobre esses dados locais. Uma faixa identifica o modo e oferece a central de notificações. Nenhuma operação de dados desse modo usa o Supabase, provedores fiscais ou cobrança real. Autenticação e seleção de persona continuam separadas. Ao sair do modo, os serviços voltam a consultar o Supabase.

O banco local, as notificações e o passo atual são persistidos. Fotos servidas por URLs externas precisam de conexão ou cache. Os dados locais de PC e iPhone são independentes: prepare o cenário separadamente em cada um.

## Roteiro de 5 a 7 minutos

1. **Problema e descoberta:** mostre Mariana no Explore, estilos, artistas e portfólio. O Dermys reúne descoberta e organização do atendimento.
2. **Reserva:** volte ao painel e execute o próximo passo. Ele cria um pedido botânico de R$ 600 e cards de briefing/orçamento no chat. Abra a tela deste passo para ver o pedido.
3. **Sinal:** execute o próximo passo. R$ 180 entram em custódia e a reserva fica confirmada. Mostre a agenda de Camila. O sinal ainda não é receita na DRE.
4. **Atendimento:** avance. A sessão entra em andamento e ganha uma ficha de exemplo assinada. Todos os dados de saúde são fictícios.
5. **Quitação:** avance. Os R$ 420 restantes são liberados, a sessão é concluída e R$ 90 em materiais são registrados. A receita do serviço é contabilizada uma vez na DRE.
6. **Recibo e cuidados:** avance. Mariana encontra o documento demonstrativo nos agendamentos e os cuidados após a sessão. O chat também recebe um card de conclusão.
7. **Resultado do estúdio:** avance até Camila no financeiro. Abra a DRE e explique receita, custos, despesas e resultado. Os atendimentos anteriores compõem o total do período; o efeito desta jornada é R$ 600 em receita e R$ 90 em custos adicionais.

Cada ação do painel executa uma etapa; **Abrir tela deste passo** muda para o perfil e a aba correspondentes. A troca de perfil também pode ser feita livremente na aba Perfis. O roteiro pode ser compartilhado pelo próprio painel.

## Caminhos alternativos

- **Recusar sinal:** somente enquanto a reserva está pendente; permite demonstrar uma tentativa recusada e depois uma aprovada.
- **Aprovar sinal:** confirma a reserva pendente e mantém o roteiro na etapa correspondente.
- **Cancelar reserva:** antes do atendimento; cancela os pagamentos simulados e interrompe a sequência até restaurar o cenário.
- **Estornar R$ 150:** depois da conclusão; gera uma dedução na DRE. Uma segunda tentativa é bloqueada para evitar duplicação.
- **Gerar dados:** os 18 cenários existentes também funcionam localmente. Incluem PIX, cartão com taxa, pagamentos pendentes/cancelados, despesas, histórico trimestral, lucro, prejuízo e todas as categorias da DRE.
- **Cinco ciclos automáticos:** continuam disponíveis, sem sobreposição. Param ao fechar o painel, trocar de perfil ou concluir os cinco ciclos.

## Restaurar e sair

**Restaurar cenário inicial** pede confirmação e substitui somente os dados da apresentação local. Também remove as mudanças manuais feitas nesse ambiente durante os testes. Não altera tabelas ou registros do Supabase nem o cache de conversas/portfólio do ambiente conectado.

**Sair da apresentação local** retorna à entrada do app. Os dados da apresentação ficam guardados no aparelho até uma nova preparação. Para operar novamente no ambiente conectado, entre na conta habitual ou use as personas de teste já autorizadas.

## Validação

`npm test` cobre DRE, preservação da persona, os serviços de teste e a apresentação: jornada, custódia fora da receita, não duplicação do recibo, estorno, restauração, 18 cenários, idempotência, remoção de lotes, chat local, filtros/relações das consultas, falha de armazenamento e isolamento da rede.

`npm run typecheck` verifica os tipos. `npm run build:web` exporta a versão web. A exportação `npx expo export --platform ios --output-dir dist/ios-check` verifica o pacote iOS sem compilar um aplicativo de loja.
