# Padrão visual Dermys

A base compartilhada está em `src/theme/design-system.ts`, exportada como `ds`. Login, telas de cliente e artista, agenda, perfis, chat, reservas e modais fiscais usam essa base.

- Cores: fundo, superfície, camada elevada, interação, borda, texto principal/secundário/suave e destaque Dermys.
- Tipografia: títulos de tela em 28 px, modais em 22 px, seções em 18 px, subtítulos em 16 px e leitura em 14 px. Entradas usam 16 px. Legendas têm 12 px e etiquetas compactas 11 px.
- Formas: cartões de 20 px, modais de 24 px e controles/campos de 12 px de raio.
- Interação: controles principais com pelo menos 48 px; controles compactos com 44 px. Rótulos podem quebrar linha para acomodar celulares menores.
- Hierarquia: use `CabecalhoTela` nas telas internas. O cabeçalho editorial do Explorar e a navegação inferior somente com ícones são mantidos.

Use `createThemedStyles` para estilos e `tc` para cores passadas diretamente a ícones. Os tokens representam o tema escuro; a conversão existente gera o tema claro. Cores semânticas opacas têm variantes mais escuras no tema claro para preservar contraste. Fundos translúcidos continuam suaves.

Fotografias e suas sobreposições usam cores próprias quando necessário. A folha do documento fiscal permanece branca e preserva sua tipografia; somente os controles ao redor dela seguem o tema do aplicativo.
