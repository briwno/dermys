# Dermys — vídeo de apresentação

Versão de contingência para a faculdade. Duração planejada: **5 minutos**. Três slides, intercalados com capturas reais do projeto e do aplicativo. Formato horizontal 16:9, com identidade preta e amarela.

## Sequência de edição

| Tempo | Imagem | Objetivo |
|---|---|---|
| 00:00–00:20 | Slide 1 — Dermys | Apresentar o projeto e os dois públicos. |
| 00:20–00:40 | Slide 2 — Projeto e tecnologias | Explicar a organização e a base técnica. |
| 00:40–01:00 | Confluence: introdução e requisitos | Mostrar o processo fora do app. |
| 01:00–01:20 | Jira: quadro e uma história de usuário | Mostrar organização, critérios e commit vinculado. |
| 01:20–01:35 | Repositório: telas, serviços e histórico | Relacionar planejamento e implementação. |
| 01:35–01:55 | Slide 3 — Problema e solução | Preparar o contexto da demonstração. |
| 01:55–02:30 | App: Explore e perfil de Camila | Mostrar a jornada de descoberta da cliente Mariana. |
| 02:30–03:10 | App: briefing, orçamento, reserva e sinal | Mostrar a organização do pedido e a confirmação simulada. |
| 03:10–03:45 | App: agenda e anamnese de Camila | Mostrar a visão do tatuador e o atendimento. |
| 03:45–04:20 | App: quitação, financeiro e DRE | Explicar o resultado financeiro do atendimento. |
| 04:20–04:40 | App: recibo e cuidados da cliente | Concluir a jornada do cliente. |
| 04:40–05:00 | Retorno ao slide 1 | Encerrar retomando a proposta do Dermys. |

Os retornos à capa usam o mesmo slide; a apresentação continua tendo exatamente três slides. Os clipes de tela não são slides adicionais.

## Texto dos três slides

### Slide 1 — Apresentação

**DERMYS**

Arte na pele. Histórias pra levar.

Uma plataforma para conectar clientes a tatuadores e organizar a rotina do estúdio.

Rodapé discreto: Projeto acadêmico · demonstração do MVP

Direção visual: fundo #08080A, nome DERMYS em amarelo #F3C21A, título grande e poucos elementos. Uma imagem de tatuagem do acervo do projeto pode ocupar a lateral direita, mantendo a leitura do título. Não inventar integrantes ou instituição.

### Slide 2 — Projeto e tecnologias

**Como construímos o Dermys**

Documentação e requisitos no Confluence

Histórias de usuário e entregas no Jira

React Native + Expo · TypeScript

Supabase · PostgreSQL · GitHub

Direção visual: composição tipográfica simples. Destacar a relação entre planejamento e implementação. Não apresentar Figma como ferramenta inspecionada: temos uma página com protótipos documentados, mas não um arquivo editável verificado.

### Slide 3 — Problema e solução

**O atendimento organizado em um só lugar**

Comunicação dispersa → conversa ligada ao pedido

Agenda separada → reserva e acompanhamento da sessão

Pouca visão financeira → receitas, despesas e DRE

Rodapé discreto: No vídeo, pagamentos e documentos fiscais são simulados.

Direção visual: problema à esquerda em cinza claro; solução à direita em branco e amarelo. Texto grande, sem parágrafos longos.

## Narração

### 00:00–00:20 — Apresentação

“Este é o Dermys, uma plataforma desenvolvida para aproximar quem quer se tatuar de quem transforma ideias em arte. O projeto atende dois públicos: o cliente, que procura um artista e organiza seu pedido, e o tatuador, que acompanha a rotina e os resultados do estúdio.”

### 00:20–00:40 — Projeto e tecnologias

“O desenvolvimento reúne planejamento e implementação. A documentação apresenta o problema e os requisitos. No Jira, as funcionalidades são organizadas em histórias de usuário e critérios de aceite. O aplicativo utiliza React Native com Expo e TypeScript, com serviços de autenticação e persistência no Supabase.”

### 00:40–01:00 — Documentação

“No Confluence, a introdução descreve o contexto do projeto e as jornadas de cliente e tatuador. O levantamento de requisitos organiza funções como cadastro, portfólio, busca, agendamento e controle financeiro. Essas referências ajudam a relacionar o que o usuário precisa com as funcionalidades apresentadas no aplicativo.”

### 01:00–01:20 — Jira

“No Jira, cada entrega tem uma história de usuário, um escopo e critérios de aceite. As funcionalidades implementadas estão concluídas, enquanto as próximas evoluções ficam no planejamento. Os itens também apontam para arquivos e commits existentes, permitindo acompanhar a relação entre a tarefa e o código.”

### 01:20–01:35 — Código

“No repositório, as telas representam as jornadas do usuário, e os serviços concentram as operações e regras do sistema. A mesma base atende o computador e o celular. O histórico de commits registra as entregas já versionadas.”

### 01:35–01:55 — Problema e solução

“O Dermys busca reunir atividades que costumam ficar dispersas: descobrir o artista, conversar sobre a ideia, combinar o atendimento e acompanhar os valores. A proposta é manter essas informações relacionadas, facilitando a experiência do cliente e dando ao tatuador uma visão mais organizada do seu trabalho.”

### 01:55–02:30 — Descoberta

“A demonstração começa com Mariana no Explore. Ela pode pesquisar artistas, filtrar estilos e escolher uma região. O feed apresenta as obras em mosaico ou em uma visualização por postagem. Ao abrir o perfil de Camila, Mariana encontra informações do estúdio e trabalhos do portfólio. Ela também pode salvar o artista para reencontrá-lo depois. A navegação foi adaptada ao celular, com controles compactos e mais espaço para as imagens.”

### 02:30–03:10 — Pedido e reserva

“Depois de escolher o artista, Mariana descreve sua ideia. O briefing reúne referências, tamanho e região do corpo, ajudando a contextualizar a conversa. No chat, a proposta fica ligada ao pedido. Para este exemplo, o projeto custa seiscentos reais, com sinal de cento e oitenta. A aprovação do sinal é simulada para a apresentação. Quando confirmada, a reserva muda de estado e pode ser acompanhada tanto pela cliente quanto pela tatuadora.”

### 03:10–03:45 — Atendimento

“Ao trocar para o perfil de Camila, vemos a agenda do estúdio. A artista acompanha solicitações pendentes e sessões confirmadas, inicia o atendimento e registra sua conclusão. A ficha de anamnese fica vinculada à sessão, com indicação de preenchimento e alertas. Nesta apresentação, todas as informações são fictícias. A mudança de perfil permite mostrar os dois lados do mesmo atendimento sem perder o contexto da jornada.”

### 03:45–04:20 — Financeiro

“Após concluir a sessão, simulamos a quitação dos quatrocentos e vinte reais restantes. O financeiro apresenta as movimentações e distingue valores em custódia dos liberados. Na DRE gerencial, a receita do serviço é reconhecida uma vez, junto aos custos e às despesas do período. O exemplo também registra noventa reais de materiais. Assim, a artista consegue observar como um atendimento participa do resultado do estúdio.”

### 04:20–04:40 — Recibo e cuidados

“De volta à cliente, o histórico apresenta o atendimento concluído e o recibo demonstrativo. Mariana também encontra as orientações de cuidado após a sessão. Com isso, a experiência continua depois do agendamento, mantendo o histórico e as informações do atendimento acessíveis.”

### 04:40–05:00 — Encerramento

“O Dermys conecta a descoberta da arte à organização do atendimento e à gestão do estúdio. Esta versão demonstra as jornadas e as regras do MVP acadêmico, com pagamentos e documentos simulados. O resultado é uma experiência compartilhada entre cliente e tatuador, acompanhando a ideia até a conclusão da sessão.”

## Lista de capturas

### Fluxo com código correspondente

Use o [guia de fluxo, arquivos e código](fluxo-codigo-apresentacao.md) para intercalar cada ação do aplicativo com sua implementação. O guia traz sete etapas, caminhos, linhas e trechos extraídos dos arquivos locais. As inserções de código ocupam parte dos mesmos blocos de tempo: o vídeo continua planejado para cinco minutos e três slides.

Mostre a tela do produto antes do trecho de código. O arquivo de preparação do cenário fica identificado separadamente dos serviços e telas usados no fluxo do aplicativo.

### Fora do aplicativo

- Confluence: Introdução, sem editar a página.
- Confluence: Levantamento de Requisitos, com um trecho legível.
- Jira: quadro da sprint com os estados visíveis.
- Jira: abrir SCRUM-30, mostrar a história da DRE, critérios e link do commit 6790885.
- GitHub ou editor: estrutura `src/telas`, `src/services` e histórico de commits. Evitar abrir arquivos de ambiente ou credenciais.

### Dentro do aplicativo

- Preparar o cenário local e restaurá-lo antes da gravação.
- Mariana: Explore, filtro, obra e perfil de Camila.
- Briefing e conversa com proposta de R$ 600.
- Reserva com aprovação simulada do sinal de R$ 180.
- Camila: agenda, ficha fictícia e início da sessão.
- Conclusão e quitação simulada de R$ 420.
- Financeiro e DRE, mantendo os valores legíveis.
- Mariana: recibo demonstrativo e orientações de cuidado.

O roteiro integrado das ferramentas de apresentação pode preparar os estados entre as capturas. A gravação deve mostrar telas e dados reais do aplicativo, sem representar animações de mockups como se fossem cliques executados.

## Montagem

- Cortes diretos entre as capturas e transições suaves nos três slides.
- Gravar cada trecho separadamente para permitir refazer apenas o necessário.
- Manter pausas curtas sobre valores, critérios e mudanças de estado.
- Usar aproximação para a tela do telefone; evitar texto ilegível dentro de uma captura de desktop inteira.
- Mostrar a identificação “Simulação acadêmica” nos trechos de pagamentos e documentos.
- A narração é um texto para gravação, não um áudio já produzido. Ajustar as pausas após ouvir a primeira leitura.
- Exportar a montagem final como MP4 horizontal e testar a reprodução antes da apresentação.

## Materiais de referência

- Jira: https://dermyss.atlassian.net/jira/software/projects/SCRUM/boards/1
- Introdução: https://dermyss.atlassian.net/wiki/spaces/Dermys/pages/5013505/Introdu+o
- Requisitos: https://dermyss.atlassian.net/wiki/spaces/Dermys/pages/5275660/Levantamento+de+Requisitos
- Código: https://github.com/briwno/dermys
- Tarefa do vídeo: https://dermyss.atlassian.net/browse/SCRUM-37

## Apresentação no Canva

- Apresentação criada: **DERMYS — Apresentação acadêmica**
- Link: https://canva.link/8ewnj22bne75885
- Identificador: `DAHZ5UzCBuM`
- Formato confirmado: 1920 × 1080, exatamente três páginas.
- Conteúdo consultado pela integração: apresentação, projeto e tecnologias atuais, problema e solução; aviso de simulação no terceiro slide.
- A apresentação antiga permanece preservada. A inspeção pela integração não alterou os slides.

Status: roteiro e três slides editáveis criados. As gravações reais, a narração em áudio e a montagem/exportação do MP4 de cinco minutos ainda estão pendentes. A integração do Canva disponível nesta sessão não gera nem monta vídeos.
