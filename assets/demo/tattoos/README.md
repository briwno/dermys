# Fotos de demonstração do Dermys

Oito imagens sintéticas criadas com a ferramenta integrada ImageGen, em 18/10/2026.
São exemplos visuais, não trabalhos reais dos artistas. Os registros no feed usam
o prefixo **Demonstração IA** e `disponivel = false`.

Os arquivos originais ficam nesta pasta. O manifesto associa cada imagem somente
a um dos oito perfis de demonstração já existentes. Nenhuma conta real é alterada.
Destino no Storage: `portfolios/demo/generated-v1/`.

## Prompts

Prompt comum, seguido do assunto específico abaixo:

> Create ONE vertical photorealistic portfolio photograph for a tattoo platform demo.
> Subject: [subject]. The tattoo must be the focal point and clearly visible, healed
> ink naturally integrated in real skin with pores. Close-up of only the body area,
> fully clothed outside tattoo area, adult subject, soft professional studio lighting,
> neutral dark blurred background, believable anatomy, editorial photography.
> Single photograph, not a collage. No text, logos, watermark, needles, blood or nudity.
> Style: [style].

| Arquivo | Estilo | Subject |
|---|---|---|
| fine-line.png | Fine Line | a delicate olive and lavender botanical branch fine-line tattoo on an adult forearm, precise very thin black lines |
| blackwork.png | Blackwork | a bold raven with peonies blackwork tattoo on an adult outer upper arm, saturated black shapes and stipple shading |
| aquarela.png | Aquarela | a hummingbird with tropical flowers watercolor tattoo on an adult shoulder, loose cyan magenta and purple watercolor ink washes within and around clear fine black outlines |
| oriental.png | Oriental | a Japanese koi fish with cherry blossoms and stylized waves tattoo on an adult calf, red and black traditional irezumi details |
| old-school.png | Old School | a traditional old school anchor with a red rose tattoo on an adult forearm, thick crisp black outlines solid red green and gold pigment |
| geek.png | Geek | an original cute astronaut cat with a small ringed planet tattoo on an adult forearm, colorful illustrative geek style, no existing franchises |
| realismo.png | Realismo | a realistic lion face black and gray tattoo on an adult upper arm, convincing fur and eyes with smooth ink shading |
| ornamental.png | Blackwork | an ornamental mandala geometric blackwork tattoo on an adult forearm, precise symmetrical concentric petals and dotwork |

## Reenvio

Na raiz do projeto, executar `node scripts/upload-demo-photos.cjs`.
O script utiliza a configuração pública do `.env`, não sobrescreve arquivos
existentes e verifica se os bytes retornados pela URL pública correspondem ao
arquivo local. Não altera políticas de acesso ou permissões.
