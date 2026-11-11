# Ideias e revisões de habilidades — 09/11/2026

Implementadas as habilidades que estavam em `ideia` ou `revisar` no catálogo, preservando os ids e as outras mudanças locais. As sugestões novas de `docs/habilidades/avaliacao-e-expansao.md` não foram adicionadas.

## Decisões aplicadas

- Corte Espacial: ondas de 230% em todos os cortes, alcance 14, sem recarga própria.
- Corte Vendaval → Ciclone → Furacão: evolução cumulativa, com ganhos por rank explícitos.
- Escudo Arcano: 10% por rank, até 50% do dano restante nas defesas para a mana; 1 MP por dano desviado, excedente na vida quando falta mana.
- Lobos permanentes, Mordida Pesada automática e ferimentos/mortos preservados nos saves e entre mapas.
- Penas Voadoras periódicas, sem custo ou slot.
- Demais ideias: Impacto, Cadência, Rastro de fogo, tornados menores, Armadura de Espinhos, Planta Carnívora, Alcateia, Flecha de Fogo/Explosiva e Big Bang.
- Campos numéricos revisados sincronizados: Corte Sangrento (4,6 u e arco de 180°), Impacto Celeste (raio 4,5) e Mina (raio 6 antes de Estilhaços).

As definições e números completos ficam em [arvores.json](../../../docs/habilidades/arvores.json), com o [guia gerado](../../../docs/habilidades/arvores.md). Comportamentos atuais nos guias [Guerreiro](../../../docs/v2-guerreiro.md), [Druida](../../../docs/v2-druida.md), [Arqueira/Mercenário](../../../docs/v2-arqueira-mercenario.md), [Mago](../../../docs/v2-mago.md) e [saves](../../../docs/v2-saves.md).

## Verificações executadas

- Build final: `node v2/tools/build.cjs`, da raiz. HTML autocontido com 56 GLBs, incluindo a Planta Carnívora.
- 169 testes aprovados de habilidades, classes, combate, efeitos, barra, árvore gerada, progressão e saves; relatório em [tests.log](tests.log).
- Os 12 cenários de `v2/tests/skill-ideas-revision.test.mjs` cobrem as novas regras, paredes, interrupção, divisão de dano, mana insuficiente, não empilhamento, morte, troca de mapa e importação dos lobos.
- Edge/WebGL 2 em `file://`, perfis isolados: `node v2/tests/skill-ideas-revision-browser-check.cjs`, com cinco classes, árvores, ações e seletor. Resultado em [browser-result.json](browser-result.json): sem erros de página/console nem requisições HTTP(S).
- Após a sincronização final da ficha e do nome do Guerreiro, repetida a conferência dessa classe: `node v2/tests/skill-ideas-revision-browser-check.cjs warrior`; [resultado](browser-result-warrior.json).
- Capturas inspecionadas: planta atacando junto de quatro lobos em chão claro/escuro, escudo arcano e penas periódicas; giro em qualidade baixa e chão claro. Imagens nesta pasta. Esses registros verificam apresentação em campo de treino, não uma campanha inteira.
- GLB da planta gerado pelo Blender a partir de `blender/scripts/carnivorous_plant.py`: 920 triângulos, quatro materiais sólidos, rig e `idle`, `attack`, `death`; malha fechada e transformações validadas pelo gerador. Cena editável e export preservados nas pastas próprias. O build verificou os clipes, e o modelo foi carregado no navegador.

## Limites

Números sem especificação anterior são valores iniciais documentados. Não foi jogada uma campanha completa para medir equilíbrio entre builds. O simulador de balanceamento não modela as novas rotações das classes; testes matemáticos não foram usados como comprovação da IA. O lobo reutiliza o GLB animado `cryptHound` com tinta natural; a planta tem GLB próprio. O giro ainda usa o clipe já integrado (`slash_2`) e rotação do runtime.
