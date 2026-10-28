# Documentação

## Como o jogo funciona

Guias de referência das mecânicas atuais, em [`mecanicas/`](mecanicas/README.md):

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
| [../v2/plano-migracao.md](../v2/plano-migracao.md) | Migração completa para modelos 3D: etapas, critérios, fontes e ponto de retomada | E3 concluída: movimento, câmera, colisões e animações; próxima etapa E4 |
| [plano-endgame-valdoria.md](plano-endgame-valdoria.md) | Conquista territorial, influência, maldições e pântano de decomposição | Primeira região jogável; expansão e alquimia planejadas |
| [roadmap-combate-visual.md](roadmap-combate-visual.md) | Roadmap de animações de skills e novos inimigos | Ativo: primeiro pacote concluído, próximo é SK-02 (Dash) |
| [plano-equipamentos-waves.md](plano-equipamentos-waves.md) | Plano de equipamentos, loot e waves | Primeira versão jogável implementada |
| [zephyr-habilidades-ato-1-revisao.md](zephyr-habilidades-ato-1-revisao.md) | Revisão das habilidades do Ato I | Histórico: a campanha não concede mais skills |
| [diagnostico-interface-e-zumbis.md](diagnostico-interface-e-zumbis.md) | Diagnóstico de interface e IA dos zumbis | Correções registradas no próprio documento |
| [concepts/skill-trees-proposal-v1.md](concepts/skill-trees-proposal-v1.md) | Proposta visual inicial das árvores | Histórico: o grafo final está no Grimório |

Imagens de conceito e evidências visuais ficam em [`concepts/`](concepts/).
