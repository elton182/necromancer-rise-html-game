# Acólito de Guerra — EN-02

Implementado em 25/10/2026. Suporte com cajado, túnica vermelha, estola marfim e
símbolo solar; modelo original, rig e seis ações reproduzíveis no Blender.

## Comportamento e integração

- Litania: preparação de 1 s, canal imóvel de 4 s, raio de 5,5 u, +30% de dano
  dos outros inimigos comuns. Recarga de 7 s; primeira tentativa após 2 s.
- Sem acúmulo entre fontes; não beneficia chefes, outros Acólitos ou dummies.
  O bônus depende da fonte viva e do alcance atual, sem alterar permanentemente
  o atributo base. Morte/reset/perda de alerta cancelam a contribuição.
- Arena: um na wave 6, dois na 7, até três depois; preserva total e Cães.
  Expedições: um no primeiro grupo da wave 6; quatro grupos a partir da 7.
  Campanha preservada; mapas de Conquista que reutilizam expedições herdam a regra.
- Sprite embutido no HTML: oito direções, seis ações, 240 quadros. Célula 224 px,
  46,6667 px/u, âncora (112, 156,1667); câmera ampliada para preservar o cajado na morte.

## Verificação executada

- `node game_check.js`: 76 cenários aprovados, cinco scripts com sintaxe válida.
- `node --test scripts/war-acolyte.test.js scripts/crypt-hound.test.js scripts/soul-warden.test.js scripts/expedition.test.js balance-simulator/model.test.js`: 40 testes aprovados.
- `python blender/scripts/pack_war_acolyte.py`: 240 quadros sem vazio ou recorte.
- `node scripts/war-acolyte-browser-check.js`: Edge isolado, dano real 8 → 10,
  cajado com dano 6, sobreposição sem acúmulo, saída da área, morte, reset e
  entrada da expedição com escala correta. Sem erros de página.
- `node scripts/war-acolyte-visual-check.js`: preparação, canal e interrupção,
  fundos claro/escuro, 32 inimigos e seis aliados, qualidade baixa a 24 px/u,
  miniaturas e cena isolada a 36 px/u. Capturas `war-acolyte-*.png` nesta pasta.
- Prancha de oito direções/seis ações: `../blender/previews/preview_war_acolyte.png`.
- Desktop e viewport de 390 × 844: `war-acolyte-game.png`, `war-acolyte-mobile.png`.
- Medição local em `war-acolyte-performance.json`: 120 amostras, 42 personagens
  por painel; P95 de 1,5 ms com litania e 1,6 ms com fonte eliminada. É tempo de
  despacho de desenho no CPU, exclui conclusão de GPU e update completo do jogo.

## Limites

Os números são iniciais, sem validação de balanceamento por sessões longas.
O simulador matemático compartilha composição e atributos básicos, mas ainda
não modela a aura posicional nem a pausa de ataques durante o canal. A hipótese
está explícita no relatório do adaptador; ele pode subestimar dano de grupos.
A simulação no motor real continua disponível para diagnóstico de combate.

A verificação ampliada também incluiu `scripts/endgame.test.js`. Na repetição
final, três casos de desbloqueio de rotas/influência falharam no modelo de
Conquista, alterado em paralelo durante esta entrega. Esse arquivo não foi
modificado pelo trabalho do Acólito. Os 40 testes dos sistemas afetados pelo
mob passaram; a suíte completa não é declarada limpa.
