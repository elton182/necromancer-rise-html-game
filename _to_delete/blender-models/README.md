# Modelos retirados das pastas atuais

Versões substituídas e estudos retirados de `blender/models/` e `blender/exports/`
durante a organização solicitada em 2026-11-08. Os arquivos foram movidos, sem
alterar seus bytes. Esta pasta não é entrada do jogo atual.

- `models/`: cenas anteriores e estudos sem consumo atual identificado.
- `exports/`: exports substituídos ou sem registro atual.

O inventário com origem, destino, motivo, tamanho e SHA-256 está em
[`blender/notes/model_catalog.json`](../../blender/notes/model_catalog.json).
O índice legível está em [model_catalog.md](../../blender/notes/model_catalog.md).
As fontes ainda necessárias para regenerar o jogo ficaram em `blender/models/sources/`
e `blender/exports/sources/`; as fontes Canvas 2D ficaram em `legacy/`.

Os geradores antigos continuam consultando o catálogo por `asset_paths.py`, de
modo que um estudo regenerado volta para esta pasta. Excluir esta pasta
definitivamente também descarta essas versões e o acesso a elas pelos geradores antigos.
