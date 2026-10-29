# Validação da E9 — 28/10/2026

- Build da distribuição autocontida executado com sucesso; modelos atuais e módulos incorporados.
- 149 testes da V2 passaram; 76 cenários da distribuição anterior passaram.
- Checks Edge executados: campanha, geral/offline/saves, combate, inimigos, horda, equipamentos,
  Grimório, magias, movimento, progressão e revisão de modelos. Logs nesta pasta.
- Campanha: quatro fases com abates controlados, primeiro prêmio, vila, missão lateral,
  retorno limpo e recarga na vila. Disparo real na cripta, interação G com Bram e mercador,
  compra e uso do Pergaminho passaram. Sem erros de página ou requisições HTTP.
- Capturas inspecionadas: cripta, vila em fundo claro/qualidade baixa; o percurso também
  produz introdução, mapa e vila em fundo escuro. Paredes baixas preservam a visão do jogador.
- Links locais da documentação conferidos e diff sem erros de espaço em branco.

Limites: o percurso injeta abates para testar estado/recompensas; não valida a dificuldade
por uma partida completa. Sem benchmark em outras máquinas ou controle físico. Vila com
NPCs existentes e cenário modular básico; casas, decoração e quadrinhos completos seguem
para acabamento. Campanha antiga continua preservada em legacy.data, sem conversão automática.

Reprodução: comandos no guia docs/v2-campanha.md. Os testes usam armazenamento isolado;
a chave pessoal necromancer_v2 não é alterada.
