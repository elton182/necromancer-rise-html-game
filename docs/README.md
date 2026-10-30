# Documentação

A **v2 (3D)** é o jogo principal: seus guias são os `v2-*.md` da seção *Implementação e ferramentas*, e o plano e estado estão em [../v2/README.md](../v2/README.md). As páginas de `mecanicas/` descrevem a versão legada (Canvas 2D) e as regras compartilhadas; onde divergirem da v2, vale o guia `v2-*.md`.

## Como o jogo funciona (versão legada e regras compartilhadas)

Guias de referência das mecânicas, em [`mecanicas/`](mecanicas/README.md):

- [Personagem e progressão](mecanicas/personagem-e-progressao.md)
- [Habilidades e slots](mecanicas/habilidades.md)
- [Grimório dos Mortos](mecanicas/grimorio.md)
- [Horda](mecanicas/horda.md)
- [Inimigos e chefes](mecanicas/inimigos-e-chefes.md)
- [Equipamentos e loot](mecanicas/equipamentos-e-loot.md)
- [Modos de jogo e mundo](mecanicas/modos-de-jogo.md)
- [Conquista de Valdoria](mecanicas/conquista-valdoria.md)
- [Interface, controles e saves](mecanicas/interface-e-saves.md)

## Implementação e ferramentas

| Documento | Conteúdo |
|---|---|
| [arvores-habilidades-implementacao.md](arvores-habilidades-implementacao.md) | Integração das árvores ao jogo, migração de saves e verificação |
| [guia-visual-combate.md](guia-visual-combate.md) | Escala, contraste e regras visuais dos efeitos; arena de comparação |
| [v2-saves.md](v2-saves.md) | Cenas, contrato de save da v2, importação preservada e limites da integração |
| [v2-movimento.md](v2-movimento.md) | Colisões, navegação, câmera/mira, poses e controle da v2 |
| [v2-combate.md](v2-combate.md) | E4: dano comum, Tiro de Osso, Dash, fontes compartilhadas e limites da integração |
| [v2-grimorio.md](v2-grimorio.md) | E6: investimento/devolução, maestrias, XP por abates, persistência e limites |
| [v2-horda.md](v2-horda.md) | E5: cinco tipos, grupos, seis slots, comandos, recuperação e persistência |
| [v2-progressao.md](v2-progressao.md) | E7: nível, XP, atributos, recompensa por abate, drops, equipamentos, consumíveis e saves |
| [v2-campanha.md](v2-campanha.md) | E9: Ato I, salas, ondas, trilhas, vila, missões e prêmios únicos |
| [v2-arena.md](v2-arena.md) | E10a: Arena Infinita (clássica), Pedra do Infinito, waves, recorde, mercador e limites |
| [v2-expedicoes.md](v2-expedicoes.md) | E10b: Expedições por bioma, encontros dormentes, boss (Rei Caído provisório) e portais |
| [v2-conquista.md](v2-conquista.md) | E10c: Conquista de Valdoria — rotas, influência, maldições, poças, Osso Carcomido e limites |
| [v2-interface.md](v2-interface.md) | HUD e Relicário da v2: fontes, abas, decisões e limites |
| [v2-inimigos.md](v2-inimigos.md) | E8: seis arquétipos, escala, elites, projéteis, composição e Rei Caído completo |
| [v2-morte-lich.md](v2-morte-lich.md) | Árvore Morte e Forma de Lich: design, assets, regras e integração (Grimório, slot, HUD de almas, Lich e foice no renderizador); balanceamento pendente |
| [v2-laboratorio.md](v2-laboratorio.md) | Laboratório in-game: visualizador de animações, boneco de madeira com medidor de DPS e testes cronometrados |
| [v2-efeitos-visuais.md](v2-efeitos-visuais.md) | Revisão de efeitos: runas de invocação, Tiro de Osso, golpes de inimigos e Rei Caído em duas fases |
| [v2-magias.md](v2-magias.md) | E6b: cinco magias equipáveis, validação atômica, recargas, encerramento e limites |
| [refactoring-baseline.md](refactoring-baseline.md) | Linha de base da refatoração: testes, fontes do HTML, dependências externas e problemas registrados |
| [character-regeneration-inventory.md](character-regeneration-inventory.md) | Inventário dos personagens para a regeneração low-poly: fontes, atlas, animações, contratos e pipelines |
| [character-regeneration-review.md](character-regeneration-review.md) | Revisão do Lote 1 (zumbi, arqueiro inimigo, Bram): metadados de impacto, testes, antes/depois e pendências |
| [../build-simulator/README.md](../build-simulator/README.md) | Simulador de builds (Grimório) |
| [../balance-simulator/README.md](../balance-simulator/README.md) | Simulador matemático de equipamentos e waves |

## Planejamento e histórico

Documentos de decisão e planos. Podem citar números ou regras que já mudaram;
o estado atual está nos guias de mecânicas.

| Documento | Conteúdo | Situação |
|---|---|---|
| [../v2/plano-migracao.md](../v2/plano-migracao.md) | Migração completa para modelos 3D: etapas, critérios, fontes e ponto de retomada | E9 concluída no fluxo funcional: Ato I, vila e missões; próxima etapa E10 |
| [plano-endgame-valdoria.md](plano-endgame-valdoria.md) | Conquista territorial, influência, maldições e pântano de decomposição | Primeira região jogável; expansão e alquimia planejadas |
| [roadmap-combate-visual.md](roadmap-combate-visual.md) | Roadmap de animações de skills e novos inimigos | Ativo: primeiro pacote concluído, próximo é SK-02 (Dash) |
| [plano-equipamentos-waves.md](plano-equipamentos-waves.md) | Plano de equipamentos, loot e waves | Primeira versão jogável implementada |
| [zephyr-habilidades-ato-1-revisao.md](zephyr-habilidades-ato-1-revisao.md) | Revisão das habilidades do Ato I | Histórico: a campanha não concede mais skills |
| [diagnostico-interface-e-zumbis.md](diagnostico-interface-e-zumbis.md) | Diagnóstico de interface e IA dos zumbis | Correções registradas no próprio documento |
| [concepts/skill-trees-proposal-v1.md](concepts/skill-trees-proposal-v1.md) | Proposta visual inicial das árvores | Histórico: o grafo final está no Grimório |

Imagens de conceito e evidências visuais ficam em [`concepts/`](concepts/).

- [Cerco ao Ritual — defesa de torres e progressão de endgame](v2-cerco.md)
