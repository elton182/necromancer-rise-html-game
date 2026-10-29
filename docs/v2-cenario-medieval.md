# Cenário medieval experimental da V2

O arquivo fornecido pelo usuário foi preservado em `blender/exports/v2_medieval_village.glb` e registrado em `v2/assets/models.json`. Origem externa: modelo fornecido pelo usuário, sem arquivo Blender fonte ou informação de licença neste lote.

O renderizador da V2 seleciona peças pelo nome original `tripo_part_*`, centraliza a base, ajusta a altura e monta casas, torre, árvores e ruínas na periferia do treino e da vila. O GLB contém 63 peças; pisos e algumas plantas têm pouca profundidade. Os pisos desse catálogo não foram usados como terreno.

Esta entrega é um ensaio de ambientação. As peças ficam fora do limite caminhável e não acrescentam colisões nem alteram navegação, dano ou progressão. O chão visual se estende além do limite para sustentar a decoração. A grade de treino fica oculta nessas duas cenas. A campanha e as missões conservam os cenários anteriores.

Para empacotar, na raiz: `node v2/tools/build.cjs`. O modelo fica incorporado no HTML, sem carregamento externo. Conferência: `node v2/tests/village-browser-check.cjs`, com Playwright e Edge. O teste usa contexto isolado e entrada na vila preparada em memória; não comprova o desbloqueio pela campanha. Evidências em `review/v2/village/`.

Atualização: a Vila de Eldrin agora tem mapa próprio com casas, ruas e colisões explícitas (ver [campanha da V2](v2-campanha.md#vila-de-eldrin-mapa)); as peças deste modelo seguem apenas como periferia. O treino mantém o ensaio descrito acima.

Próximo trabalho possível: separar um kit editável, ajustar materiais e orientação, criar ruas e integrar obstáculos com colisões explícitas. Não está incluído neste ensaio.
