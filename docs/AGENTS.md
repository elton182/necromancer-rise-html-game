# Documentação do jogo

Estas regras complementam o `AGENTS.md` da raiz para arquivos em `docs/`.

## Fontes e tipos de documento

- A v2 é o jogo principal: os `docs/v2-*.md` descrevem o comportamento implementado nela e têm precedência. Atualize o guia da área ao mudar a v2 e registre entregas de etapa em `../v2/plano-migracao.md`.
- `mecanicas/` descreve a versão legada e as regras compartilhadas. Confirme fórmulas, nomes, custos, controles e condições nas fontes atuais antes de atualizar e indique quando a v2 diverge.
- Planos e roadmaps descrevem intenção e histórico. Identifique o que está proposto, em produção, validado ou pendente; não transforme uma proposta em regra atual.
- `guia-visual-combate.md` registra convenções visuais; o pipeline reproduzível de assets fica em `../blender/README.md` e `../blender/AGENTS.md`.
- Use `docs/README.md` como índice. Ao adicionar um guia, inclua-o ali e confira os links pertinentes no README da raiz e em `../v2/README.md`; guias da versão legada também entram em `mecanicas/README.md`.
- Evidências de navegador e validação ficam normalmente em `../review/` (`../review/v2/` para a v2); conceitos e algumas evidências históricas estão em `concepts/`. Preserve os destinos usados pelos scripts existentes.

## Como escrever

- Escreva em português, com nomes que o jogador reconheça. Identificadores internos e caminhos devem ser exatos.
- Explique gatilho, efeito, limites e encerramento da regra. Em combate, inclua aviso e resposta possível do jogador.
- Separe mudança visual de mudança de balanceamento. Quando alterar uma fórmula, diga de onde vêm os valores e o que eles afetam.
- Prefira referências às fontes a cópias extensas de código. Evite contagens de testes ou linhas que ficam desatualizadas sem agregar informação.
- Comandos devem indicar diretório de execução, dependências e arquivos produzidos quando isso não for evidente. Não invente flags, testes ou caminhos.
- Registre somente verificações executadas. Captura de uma pose não comprova todas as animações; simulação matemática não comprova colisão e IA no jogo.
- Use links relativos entre arquivos do repositório e confira que os destinos existem. Não inclua caminhos pessoais absolutos como instrução universal.

## Manutenção dos AGENTS.md

- Orientações comuns ficam na raiz; regras específicas ficam no `AGENTS.md` da pasta correspondente. Evite duplicar longas instruções em vários arquivos.
- Descreva padrões duráveis, fontes e critérios de validação. Estado temporário de uma tarefa pertence ao plano ou relatório, não às instruções permanentes.
- Mudanças apenas documentais exigem revisão de coerência e caminhos; não rode geradores, empacotadores ou sincronizadores que modifiquem assets ou o jogo sem necessidade.
