# 🖋️ DERMYS — Context & Agent Guidelines

## 1. O que é o Dermys?
O **Dermys** é uma plataforma multiplataforma (Web, iOS e Android) desenvolvida para unificar e simplificar o ecossistema da tatuagem, aproximando clientes, tatuadores e estúdios em um único lugar. Atua como um **hub regional e marketplace**, conectando quem quer tatuar com artistas da sua região de forma centralizada e sem atrito.

---

## 2. Pilares do Produto (🎯 O que o projeto pretende ser)

1. **Feed Visual de Descoberta:**
   - Vitrine centralizada onde clientes encontram tatuadores e artes com base em estilos específicos (*Blackwork*, *Fine Line*, *Realismo*, *Old School*, etc.) e localização regional.
   - Catálogo de flashes autorais disponíveis com valores e disponibilidade explícitos.

2. **Ponte Direta de Orçamento e Agendamento:**
   - Ferramenta que descomplica a comunicação entre cliente e artista.
   - Envio padronizado de briefings (referências visuais, local do corpo e dimensões em cm).
   - Alinhamento de datas, chat direto integrado e cobrança de sinal para confirmação de reserva.

3. **Painel de Gestão para Tatuadores:**
   - Solução prática para o artista organizar seu portfólio de trabalhos realizados.
   - Controle simplificado da agenda de atendimentos (aceitar, recusar e reagendar).
   - Disponibilização de flashes autorais para venda rápida.
   - Gerenciamento e assinatura digital de fichas de anamnese pré-procedimento.

---

## 3. Personas & Perfis (`tipo_perfil`)

* **Cliente:**
  - Explora o feed regional e perfis de tatuadores.
  - Filtra por estilo, cidade e preço inicial.
  - Envia solicitações de orçamento com briefings estruturados.
  - Reserva flashes disponíveis.
  - Preenche e assina a ficha de anamnese antes da sessão.

* **Artista (Tatuador):**
  - Mantém perfil público com bio, localização do estúdio, estilos de atuação e preço base.
  - Publica flashes autorais e atualiza portfólio.
  - Gerencia solicitações de agendamento na sua agenda.
  - Acessa as fichas de anamnese preenchidas pelos clientes.
  - Troca mensagens diretamente via chat interno.

---

## 4. Stack Tecnológica & Versões
* **Core Mobile:** React Native `0.81.5`
* **Plataforma & SDK:** Expo SDK `54.0.36`
* **Roteamento:** Expo Router `~6.0.24` (File-based routing em `app/`)
* **Linguagem:** TypeScript `5.9.2` (Strict Mode)
* **Backend as a Service (BaaS):** Supabase (`@supabase/supabase-js` `^2.112.3`)
  - **Auth:** Supabase Auth (`auth.users`)
  - **Database:** PostgreSQL Serverless
  - **Storage:** Supabase Storage (imagens de portfólio, flashes e avatares)
* **Persistência Local:** `@react-native-async-storage/async-storage` `^2.2.0`
* **UI & Animações:**
  - `react-native-reanimated` (`~4.1.1`)
  - `react-native-gesture-handler` (`~2.28.0`)
  - `react-native-screens` e `react-native-safe-area-context`
* **Design System:** Dark Mode nativo por padrão (paleta escura e minimalista).

---

## 5. Estrutura do Banco de Dados (Supabase Schema)

* **`profiles`** (Extensão 1:1 de `auth.users.id`):
  - `id` (uuid, PK/FK), `email`, `nome_exibicao`, `tipo_perfil` (`CLIENTE` | `TATUADOR`)
  - `telefone`, `foto_url`, `cidade`, `nome_estudio`, `endereco_estudio`
  - `biografia`, `estilo_principal`, `preco_inicial`, `curtidas`, timestamps.

* **`flashes_portfolio`** (Catálogo de flashes e artes):
  - `id` (uuid, PK), `artista_id` (FK -> `profiles.id`), `titulo`, `imagem_url`
  - `estilo`, `preco`, `disponivel` (bool), timestamps.

* **`agendamentos`** (Solicitações de sessões):
  - `id` (uuid, PK), `cliente_id` (FK -> `profiles.id`), `artista_id` (FK -> `profiles.id`)
  - `data_horario`, `estilo`, `descricao`, `valor_sinal`, `valor_total`
  - `status` (`PENDENTE` | `CONFIRMADO` | `CANCELADO` | `CONCLUIDO`), timestamps.

* **`mensagens`** (Chat interno):
  - `id` (uuid, PK), `remetente_id` (FK -> `profiles.id`), `destinatario_id` (FK -> `profiles.id`)
  - `conteudo`, `lida` (bool), timestamps.

* **`fichas_anamnese`** (Protocolo de saúde e consentimento):
  - `id` (uuid, PK), `cliente_id` (FK -> `profiles.id`), `artista_id` (FK -> `profiles.id`)
  - `alergias`, `doencas_cronicas`, `medicamentos`, `observacoes`, `assinado` (bool), timestamps.

---

## 6. Diretrizes para o Agente de Código
1. **Foco na Descoberta:** As telas iniciais do cliente devem priorizar feed visual, galeria de flashes e busca por estilo/região.
2. **Rotas em `app/`:** Siga rigorosamente a convenção do Expo Router com subpastas organizadas (ex: `(auth)`, `(tabs)`, rotas dinâmicas como `artist/[id]`).
3. **Tipagem Estrita:** Não use `any`. Sempre use interfaces/types alinhados com as tabelas do Supabase.
4. **Isolamento de Chamadas:** Mantenha queries e mutações em serviços ou custom hooks dedicados (`src/services/` ou `src/hooks/`).
5. **Cross-Platform:** Garanta que componentes e hooks funcionem de forma idêntica no Web, Android e iOS.