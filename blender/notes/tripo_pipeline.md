# Pipeline Tripo pelo terminal

Requer `tripo-cli >= 0.7.0`, Node >= 20 e login (`tripo doctor`). O script
usa o perfil existente; nao precisa informar chave no codigo. Nao altera a
politica de execucao do PowerShell. Se o Windows bloquear `.ps1`, resolva a
politica no seu ambiente antes de executar.

Salve a imagem escolhida em `blender/examples/marta-reference.png`.
Os caminhos relativos abaixo sao resolvidos a partir da raiz do projeto,
independentemente da pasta atual do terminal.

```powershell
# So planejar: nao acessa a API nem consome creditos.
./blender/scripts/tripo_pipeline.ps1 -Image blender/examples/marta-reference.png -Name marta_pbr -PlanOnly

# Gerar GLB texturizado PBR: estimativa de 30 creditos; pede SIM antes de gastar.
./blender/scripts/tripo_pipeline.ps1 -Image blender/examples/marta-reference.png -Name marta_pbr

# Opcional: rig e um clipe (65 creditos estimados = 30 + 25 + 10).
./blender/scripts/tripo_pipeline.ps1 -Image blender/examples/marta-reference.png -Name marta_rig -Rig -Animations idle

# Retomar tarefa existente depois de timeout/queda, sem cobrar nova geracao.
tripo task list --json
./blender/scripts/tripo_pipeline.ps1 -Name marta_pbr -ResumeTask ID_DA_TAREFA
```

Geracao usa H series `tripo-v3.1` (`v3.1-20260211`), textura padrao e PBR,
sem conversao FBX ou retexturizacao adicional. O dry run valida os parametros
e apresenta cada chamada, inclusive rig e retarget quando escolhidos.
Os valores sao estimativas; o resultado informa os creditos reais quando
retornados pelo CLI. O rig-check pode interromper a cadeia se nao for possivel
rigar o personagem. Sem rig, a pose depende da referencia; nao ha animacoes.

Arquivos originais ficam em `blender/exports/tripo-out/`; planos e resultados
em `blender/logs/tripo/<nome>/`. Uma guarda de submissao impede repetir o mesmo
nome depois de sucesso ou de falha incerta. Para outra versao, use outro nome.
Nao apague a guarda para tentar novamente antes de conferir tarefas e saldo.
Retomar baixa apenas a tarefa indicada; nao executa etapas pagas que faltaram
em uma cadeia interrompida, nem reune automaticamente os clipes anteriores.
Este script aceita no maximo um clipe por geracao: retargets sequenciais nao
podem consumir a saida de outro retarget. Para varios clipes, o CLI oferece
`tripo anim retarget ID_DO_RIG --animation preset:idle preset:walk`; planeje
essa chamada separadamente (10 creditos por clipe). Os clipes gerados em
tarefas distintas precisam ser reunidos no Blender.

A automacao termina na geracao e download. Inspecione frente, costas, maos,
texturas e articulacoes no Blender; salve a cena em `blender/models/`. Para
entrar na v2 ainda e necessario ajustar escala/orientacao e clipes ao contrato
do NPC, exportar o GLB, registrar em `v2/assets/models.json` e executar
`node v2/tools/build.cjs`. O preparador `joao_tripo.py` e especifico do Joao;
seus pesos espaciais nao devem ser aplicados a outro personagem sem ajuste.

Se `tripo doctor` retornar `fetch failed`, o CLI tambem esta sem acesso a API
naquele terminal. O script nao contorna restricoes de rede nem repete chamadas
pagas automaticamente. Rode no terminal local com acesso ao servico.
