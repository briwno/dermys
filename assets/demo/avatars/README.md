# Avatares das personas

Fotos originalmente usadas pelo seletor de perfis, hospedadas também no bucket
`avatars/demo/personas-v1/`. O manifesto mantém as URLs de origem e destino.
Inclui os oito artistas de demonstração e a cliente Mariana Costa.

Para reenviar: `node scripts/populate-demo-avatars.cjs`. O script não sobrescreve
arquivos existentes e gera `scripts/populate-demo-avatars.sql`, que atualiza somente
as fotos dos nove perfis. A execução inicial do SQL já foi feita no Dermys.

O catálogo visível no feed é definido em `src/dados/artistas-vitrine.ts`.
As outras contas continuam no banco com seus agendamentos, notas e mensagens.
