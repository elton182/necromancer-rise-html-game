# Validação do elenco da referência

- 8 fontes Blender e 8 GLB exportados/reimportados.
- UVs e pesos normalizados confirmados; 144 poses avaliadas.
- 1.944 quadros com verificação de cortes, conteúdo e movimento em oito direções.
- 784 extremos de animação decodificados pelo navegador.
- 76 cenários funcionais do jogo aprovados (`node game_check.js`).
- Testes de navegador de personagens, movimento, conversa com Bram e combate do Cão de Cripta aprovados.
- Tabelas de inimigos e definições de minions idênticas antes/depois de ativar variantes.

## Ensaio de desenho com 100 aliados

| Medida | Antes | Depois |
|---|---:|---:|
| Mediana de submissão por lote | 0.20 ms | 0.20 ms |
| Percentil 95 por lote | 0.60 ms | 0.50 ms |
| RGBA estimado dos quatro atlas principais | 208.25 MiB | 183.75 MiB |

Redução estimada de memória dos quatro atlas: 11.8%. Microbenchmark com cache aquecido, Chrome headless, 1200 × 850; não representa FPS completo, tempo de IA, memória total nem custo da GPU. As variantes opcionais consomem memória adicional somente quando suas imagens são carregadas.

## Capturas

- `reference-cast-models.png`: renderização da cena Blender com os oito GLB.
- `reference-animation-poses.png`: poses de Bram, Zephyr e guerreiro.
- `reference-village-primary.png`: integração principal na câmera de gameplay.
- `reference-village-variants.png`: demonstração pausada das variantes na vila, sem criar encontros.

As diferenças artísticas e os comandos de regeneração estão em `blender/reference/README.md`. Esqueleto mago, saqueador, corrompido e lobo são variantes opcionais de classes existentes; não foram adicionadas novas regras de combate.
