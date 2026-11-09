# Catálogo de modelos

Organização de 2026-11-08. Modelos atuais permanecem diretamente em `blender/models/` e `blender/exports/`. Fontes de geração ficam em `sources/`, e fontes Canvas 2D em `legacy/`. Versões substituídas saíram das pastas atuais.

Todos os arquivos transferidos foram conferidos por SHA-256. Nenhum asset mudou de conteúdo durante a organização; registros e modelos de `blender/reference/`, sprites e evidências foram preservados.

| Grupo | Arquivos | Tamanho |
|---|---:|---:|
| Atuais — jogo v2 e HUD | 102 | 185.1 MiB |
| Fontes necessárias — geradores e laboratório | 13 | 77.6 MiB |
| Fontes da versão Canvas 2D | 14 | 11.7 MiB |
| Versões retiradas — _to_delete | 32 | 88.0 MiB |
| Blocking de autoria — backups | 4 | 29.8 MiB |
| Backups automáticos | 56 | 200.1 MiB |

## Conferência

Na raiz do projeto:

```powershell
python blender/scripts/organize_models.py --check
blender --background --python-exit-code 1 --python blender/scripts/organize_models.py -- --check --blender
node v2/tools/build.cjs
node tools/3d-lab/build.cjs
```

O primeiro comando verifica os caminhos do catálogo, o registro da v2 e a sintaxe dos scripts. O segundo abre as sete fontes `.blend` e confere suas imagens. Os empacotamentos verificam os 55 GLBs do jogo e os arquivos do laboratório. A organização não exige regenerar modelos, renderizar novamente ou substituir capturas antigas.

O resolver `blender/scripts/asset_paths.py` preserva o acesso dos geradores aos caminhos anteriores e encaminha saídas antigas para o local correspondente. O catálogo JSON é parte desse contrato; não deve ser apagado isoladamente. `organize_models.py` sem argumentos mostra o plano existente; `--refresh` reaplica a adaptação dos consumidores sem mover os arquivos outra vez.

## Atuais — jogo v2 e HUD

| Arquivo | Local atual |
|---|---|
| `arandu_caravan_horse.blend` | [blender/models/arandu_caravan_horse.blend](../models/arandu_caravan_horse.blend) |
| `arandu_caravan_kit.blend` | [blender/models/arandu_caravan_kit.blend](../models/arandu_caravan_kit.blend) |
| `arandu_cave_fall.blend` | [blender/models/arandu_cave_fall.blend](../models/arandu_cave_fall.blend) |
| `arandu_cave_hideout.blend` | [blender/models/arandu_cave_hideout.blend](../models/arandu_cave_hideout.blend) |
| `arandu_necromancer_fall.blend` | [blender/models/arandu_necromancer_fall.blend](../models/arandu_necromancer_fall.blend) |
| `archer_hero.blend` | [blender/models/archer_hero.blend](../models/archer_hero.blend) |
| `bone_shard.blend` | [blender/models/bone_shard.blend](../models/bone_shard.blend) |
| `boss_fallenKing_v4.blend` | [blender/models/boss_fallenKing_v4.blend](../models/boss_fallenKing_v4.blend) |
| `bran.blend` | [blender/models/bran.blend](../models/bran.blend) |
| `falcon.blend` | [blender/models/falcon.blend](../models/falcon.blend) |
| `flora_human_revised.blend` | [blender/models/flora_human_revised.blend](../models/flora_human_revised.blend) |
| `flora_wolf_dynamic.blend` | [blender/models/flora_wolf_dynamic.blend](../models/flora_wolf_dynamic.blend) |
| `hud_orb_frame.blend` | [blender/models/hud_orb_frame.blend](../models/hud_orb_frame.blend) |
| `lowpoly_earcher.blend` | [blender/models/lowpoly_earcher.blend](../models/lowpoly_earcher.blend) |
| `lowpoly_zombie.blend` | [blender/models/lowpoly_zombie.blend](../models/lowpoly_zombie.blend) |
| `mage_hero_t.blend` | [blender/models/mage_hero_t.blend](../models/mage_hero_t.blend) |
| `mercenary.blend` | [blender/models/mercenary.blend](../models/mercenary.blend) |
| `mob_specter.blend` | [blender/models/mob_specter.blend](../models/mob_specter.blend) |
| `mob_warAcolyte.blend` | [blender/models/mob_warAcolyte.blend](../models/mob_warAcolyte.blend) |
| `siege_bone.blend` | [blender/models/siege_bone.blend](../models/siege_bone.blend) |
| `siege_core.blend` | [blender/models/siege_core.blend](../models/siege_core.blend) |
| `siege_crypt.blend` | [blender/models/siege_crypt.blend](../models/siege_crypt.blend) |
| `siege_frost.blend` | [blender/models/siege_frost.blend](../models/siege_frost.blend) |
| `siege_plague.blend` | [blender/models/siege_plague.blend](../models/siege_plague.blend) |
| `stylized_bram.blend` | [blender/models/stylized_bram.blend](../models/stylized_bram.blend) |
| `stylized_lysa.blend` | [blender/models/stylized_lysa.blend](../models/stylized_lysa.blend) |
| `stylized_merchant.blend` | [blender/models/stylized_merchant.blend](../models/stylized_merchant.blend) |
| `stylized_tilda.blend` | [blender/models/stylized_tilda.blend](../models/stylized_tilda.blend) |
| `v2_abomination.blend` | [blender/models/v2_abomination.blend](../models/v2_abomination.blend) |
| `v2_bone.blend` | [blender/models/v2_bone.blend](../models/v2_bone.blend) |
| `v2_crypt_architecture.blend` | [blender/models/v2_crypt_architecture.blend](../models/v2_crypt_architecture.blend) |
| `v2_enemy_griffin.blend` | [blender/models/v2_enemy_griffin.blend](../models/v2_enemy_griffin.blend) |
| `v2_enemy_knight.blend` | [blender/models/v2_enemy_knight.blend](../models/v2_enemy_knight.blend) |
| `v2_enemy_mage.blend` | [blender/models/v2_enemy_mage.blend](../models/v2_enemy_mage.blend) |
| `v2_enemy_orc.blend` | [blender/models/v2_enemy_orc.blend](../models/v2_enemy_orc.blend) |
| `v2_enemy_rogue.blend` | [blender/models/v2_enemy_rogue.blend](../models/v2_enemy_rogue.blend) |
| `v2_enemy_spider.blend` | [blender/models/v2_enemy_spider.blend](../models/v2_enemy_spider.blend) |
| `v2_enemy_thief.blend` | [blender/models/v2_enemy_thief.blend](../models/v2_enemy_thief.blend) |
| `v2_enemy_wolf.blend` | [blender/models/v2_enemy_wolf.blend](../models/v2_enemy_wolf.blend) |
| `v2_flesh_shield.blend` | [blender/models/v2_flesh_shield.blend](../models/v2_flesh_shield.blend) |
| `v2_fort_kit.blend` | [blender/models/v2_fort_kit.blend](../models/v2_fort_kit.blend) |
| `v2_harpy_feather.blend` | [blender/models/v2_harpy_feather.blend](../models/v2_harpy_feather.blend) |
| `v2_lich.blend` | [blender/models/v2_lich.blend](../models/v2_lich.blend) |
| `v2_map_kit.blend` | [blender/models/v2_map_kit.blend](../models/v2_map_kit.blend) |
| `v2_nature_kit.blend` | [blender/models/v2_nature_kit.blend](../models/v2_nature_kit.blend) |
| `v2_necromancer.blend` | [blender/models/v2_necromancer.blend](../models/v2_necromancer.blend) |
| `v2_ruined_village_kit.blend` | [blender/models/v2_ruined_village_kit.blend](../models/v2_ruined_village_kit.blend) |
| `v2_swamp_kit.blend` | [blender/models/v2_swamp_kit.blend](../models/v2_swamp_kit.blend) |
| `v2_village_kit.blend` | [blender/models/v2_village_kit.blend](../models/v2_village_kit.blend) |
| `warrior.blend` | [blender/models/warrior.blend](../models/warrior.blend) |
| `arandu_caravan_horse.glb` | [blender/exports/arandu_caravan_horse.glb](../exports/arandu_caravan_horse.glb) |
| `arandu_caravan_kit.glb` | [blender/exports/arandu_caravan_kit.glb](../exports/arandu_caravan_kit.glb) |
| `arandu_cave_fall.glb` | [blender/exports/arandu_cave_fall.glb](../exports/arandu_cave_fall.glb) |
| `arandu_cave_hideout.glb` | [blender/exports/arandu_cave_hideout.glb](../exports/arandu_cave_hideout.glb) |
| `arandu_necromancer_fall.glb` | [blender/exports/arandu_necromancer_fall.glb](../exports/arandu_necromancer_fall.glb) |
| `archer_hero.glb` | [blender/exports/archer_hero.glb](../exports/archer_hero.glb) |
| `bone_shard.glb` | [blender/exports/bone_shard.glb](../exports/bone_shard.glb) |
| `bran.glb` | [blender/exports/bran.glb](../exports/bran.glb) |
| `falcon.glb` | [blender/exports/falcon.glb](../exports/falcon.glb) |
| `flora_human_revised.glb` | [blender/exports/flora_human_revised.glb](../exports/flora_human_revised.glb) |
| `flora_wolf_dynamic.glb` | [blender/exports/flora_wolf_dynamic.glb](../exports/flora_wolf_dynamic.glb) |
| `lab_fallen_king_v4.glb` | [blender/exports/lab_fallen_king_v4.glb](../exports/lab_fallen_king_v4.glb) |
| `lowpoly_earcher.glb` | [blender/exports/lowpoly_earcher.glb](../exports/lowpoly_earcher.glb) |
| `lowpoly_zombie.glb` | [blender/exports/lowpoly_zombie.glb](../exports/lowpoly_zombie.glb) |
| `mage_hero_t.glb` | [blender/exports/mage_hero_t.glb](../exports/mage_hero_t.glb) |
| `mercenary.glb` | [blender/exports/mercenary.glb](../exports/mercenary.glb) |
| `mob_specter.glb` | [blender/exports/mob_specter.glb](../exports/mob_specter.glb) |
| `mob_warAcolyte.glb` | [blender/exports/mob_warAcolyte.glb](../exports/mob_warAcolyte.glb) |
| `siege_bone.glb` | [blender/exports/siege_bone.glb](../exports/siege_bone.glb) |
| `siege_core.glb` | [blender/exports/siege_core.glb](../exports/siege_core.glb) |
| `siege_crypt.glb` | [blender/exports/siege_crypt.glb](../exports/siege_crypt.glb) |
| `siege_frost.glb` | [blender/exports/siege_frost.glb](../exports/siege_frost.glb) |
| `siege_plague.glb` | [blender/exports/siege_plague.glb](../exports/siege_plague.glb) |
| `stylized_bram.glb` | [blender/exports/stylized_bram.glb](../exports/stylized_bram.glb) |
| `stylized_lysa.glb` | [blender/exports/stylized_lysa.glb](../exports/stylized_lysa.glb) |
| `stylized_merchant.glb` | [blender/exports/stylized_merchant.glb](../exports/stylized_merchant.glb) |
| `stylized_tilda.glb` | [blender/exports/stylized_tilda.glb](../exports/stylized_tilda.glb) |
| `v2_abomination.glb` | [blender/exports/v2_abomination.glb](../exports/v2_abomination.glb) |
| `v2_bone.glb` | [blender/exports/v2_bone.glb](../exports/v2_bone.glb) |
| `v2_crypt_architecture.glb` | [blender/exports/v2_crypt_architecture.glb](../exports/v2_crypt_architecture.glb) |
| `v2_enemy_griffin.glb` | [blender/exports/v2_enemy_griffin.glb](../exports/v2_enemy_griffin.glb) |
| `v2_enemy_knight.glb` | [blender/exports/v2_enemy_knight.glb](../exports/v2_enemy_knight.glb) |
| `v2_enemy_mage.glb` | [blender/exports/v2_enemy_mage.glb](../exports/v2_enemy_mage.glb) |
| `v2_enemy_orc.glb` | [blender/exports/v2_enemy_orc.glb](../exports/v2_enemy_orc.glb) |
| `v2_enemy_rogue.glb` | [blender/exports/v2_enemy_rogue.glb](../exports/v2_enemy_rogue.glb) |
| `v2_enemy_spider.glb` | [blender/exports/v2_enemy_spider.glb](../exports/v2_enemy_spider.glb) |
| `v2_enemy_thief.glb` | [blender/exports/v2_enemy_thief.glb](../exports/v2_enemy_thief.glb) |
| `v2_enemy_wolf.glb` | [blender/exports/v2_enemy_wolf.glb](../exports/v2_enemy_wolf.glb) |
| `v2_flesh_shield.glb` | [blender/exports/v2_flesh_shield.glb](../exports/v2_flesh_shield.glb) |
| `v2_fort_kit.glb` | [blender/exports/v2_fort_kit.glb](../exports/v2_fort_kit.glb) |
| `v2_harpy_feather.glb` | [blender/exports/v2_harpy_feather.glb](../exports/v2_harpy_feather.glb) |
| `v2_lich.glb` | [blender/exports/v2_lich.glb](../exports/v2_lich.glb) |
| `v2_lich_scythe.glb` | [blender/exports/v2_lich_scythe.glb](../exports/v2_lich_scythe.glb) |
| `v2_map_kit.glb` | [blender/exports/v2_map_kit.glb](../exports/v2_map_kit.glb) |
| `v2_medieval_village.glb` | [blender/exports/v2_medieval_village.glb](../exports/v2_medieval_village.glb) |
| `v2_nature_kit.glb` | [blender/exports/v2_nature_kit.glb](../exports/v2_nature_kit.glb) |
| `v2_necromancer.glb` | [blender/exports/v2_necromancer.glb](../exports/v2_necromancer.glb) |
| `v2_ruined_village_kit.glb` | [blender/exports/v2_ruined_village_kit.glb](../exports/v2_ruined_village_kit.glb) |
| `v2_swamp_kit.glb` | [blender/exports/v2_swamp_kit.glb](../exports/v2_swamp_kit.glb) |
| `v2_village_kit.glb` | [blender/exports/v2_village_kit.glb](../exports/v2_village_kit.glb) |
| `warrior.glb` | [blender/exports/warrior.glb](../exports/warrior.glb) |
| `warrior_shield.glb` | [blender/exports/warrior_shield.glb](../exports/warrior_shield.glb) |

## Fontes necessárias — geradores e laboratório

| Arquivo | Local atual |
|---|---|
| `boss_fallenKing_v3_teste.blend` | [blender/models/sources/boss_fallenKing_v3_teste.blend](../models/sources/boss_fallenKing_v3_teste.blend) |
| `flora_tripo_druid_t.blend` | [blender/models/sources/flora_tripo_druid_t.blend](../models/sources/flora_tripo_druid_t.blend) |
| `flora_tripo_wolf.blend` | [blender/models/sources/flora_tripo_wolf.blend](../models/sources/flora_tripo_wolf.blend) |
| `mage_hero.blend` | [blender/models/sources/mage_hero.blend](../models/sources/mage_hero.blend) |
| `mage_hero_t_source.blend` | [blender/models/sources/mage_hero_t_source.blend](../models/sources/mage_hero_t_source.blend) |
| `rigged_player.blend` | [blender/models/sources/rigged_player.blend](../models/sources/rigged_player.blend) |
| `v2_imported_enemies_review.blend` | [blender/models/sources/v2_imported_enemies_review.blend](../models/sources/v2_imported_enemies_review.blend) |
| `fallen_king_model_v2.glb` | [blender/exports/sources/fallen_king_model_v2.glb](../exports/sources/fallen_king_model_v2.glb) |
| `fallen_king_source.glb` | [blender/exports/sources/fallen_king_source.glb](../exports/sources/fallen_king_source.glb) |
| `fallen_king_sword_v2.glb` | [blender/exports/sources/fallen_king_sword_v2.glb](../exports/sources/fallen_king_sword_v2.glb) |
| `lab_player_current.glb` | [blender/exports/sources/lab_player_current.glb](../exports/sources/lab_player_current.glb) |
| `necromancer_1.glb` | [blender/exports/sources/necromancer_1.glb](../exports/sources/necromancer_1.glb) |
| `purple_hooded_mage.glb` | [blender/exports/sources/purple_hooded_mage.glb](../exports/sources/purple_hooded_mage.glb) |

## Fontes da versão Canvas 2D

| Arquivo | Local atual |
|---|---|
| `boss_soulWarden.blend` | [blender/models/legacy/boss_soulWarden.blend](../models/legacy/boss_soulWarden.blend) |
| `mob_archer.blend` | [blender/models/legacy/mob_archer.blend](../models/legacy/mob_archer.blend) |
| `mob_cryptHound.blend` | [blender/models/legacy/mob_cryptHound.blend](../models/legacy/mob_cryptHound.blend) |
| `mob_skeleton.blend` | [blender/models/legacy/mob_skeleton.blend](../models/legacy/mob_skeleton.blend) |
| `mob_zombie.blend` | [blender/models/legacy/mob_zombie.blend](../models/legacy/mob_zombie.blend) |
| `necromante.blend` | [blender/models/legacy/necromante.blend](../models/legacy/necromante.blend) |
| `necromante_art.blend` | [blender/models/legacy/necromante_art.blend](../models/legacy/necromante_art.blend) |
| `village_eldrin.blend` | [blender/models/legacy/village_eldrin.blend](../models/legacy/village_eldrin.blend) |
| `boss_soulWarden.glb` | [blender/exports/legacy/boss_soulWarden.glb](../exports/legacy/boss_soulWarden.glb) |
| `mob_archer.glb` | [blender/exports/legacy/mob_archer.glb](../exports/legacy/mob_archer.glb) |
| `mob_cryptHound.glb` | [blender/exports/legacy/mob_cryptHound.glb](../exports/legacy/mob_cryptHound.glb) |
| `mob_skeleton.glb` | [blender/exports/legacy/mob_skeleton.glb](../exports/legacy/mob_skeleton.glb) |
| `mob_zombie.glb` | [blender/exports/legacy/mob_zombie.glb](../exports/legacy/mob_zombie.glb) |
| `necromante.glb` | [blender/exports/legacy/necromante.glb](../exports/legacy/necromante.glb) |

## Versões retiradas — _to_delete

| Arquivo | Local atual |
|---|---|
| `boss_fallenKing.blend` | [_to_delete/blender-models/models/boss_fallenKing.blend](../../_to_delete/blender-models/models/boss_fallenKing.blend) |
| `boss_fallenKing_v2.blend` | [_to_delete/blender-models/models/boss_fallenKing_v2.blend](../../_to_delete/blender-models/models/boss_fallenKing_v2.blend) |
| `boss_fallenKing_v3.blend` | [_to_delete/blender-models/models/boss_fallenKing_v3.blend](../../_to_delete/blender-models/models/boss_fallenKing_v3.blend) |
| `boss_fallenKing_walk.blend` | [_to_delete/blender-models/models/boss_fallenKing_walk.blend](../../_to_delete/blender-models/models/boss_fallenKing_walk.blend) |
| `flora_druid.blend` | [_to_delete/blender-models/models/flora_druid.blend](../../_to_delete/blender-models/models/flora_druid.blend) |
| `flora_werewolf.blend` | [_to_delete/blender-models/models/flora_werewolf.blend](../../_to_delete/blender-models/models/flora_werewolf.blend) |
| `flora_wolf_revised.blend` | [_to_delete/blender-models/models/flora_wolf_revised.blend](../../_to_delete/blender-models/models/flora_wolf_revised.blend) |
| `imported_player.blend` | [_to_delete/blender-models/models/imported_player.blend](../../_to_delete/blender-models/models/imported_player.blend) |
| `lowpoly_bram.blend` | [_to_delete/blender-models/models/lowpoly_bram.blend](../../_to_delete/blender-models/models/lowpoly_bram.blend) |
| `mage.blend` | [_to_delete/blender-models/models/mage.blend](../../_to_delete/blender-models/models/mage.blend) |
| `npc_bram.blend` | [_to_delete/blender-models/models/npc_bram.blend](../../_to_delete/blender-models/models/npc_bram.blend) |
| `npc_lysa.blend` | [_to_delete/blender-models/models/npc_lysa.blend](../../_to_delete/blender-models/models/npc_lysa.blend) |
| `npc_merchant.blend` | [_to_delete/blender-models/models/npc_merchant.blend](../../_to_delete/blender-models/models/npc_merchant.blend) |
| `npc_tilda.blend` | [_to_delete/blender-models/models/npc_tilda.blend](../../_to_delete/blender-models/models/npc_tilda.blend) |
| `stylized_zephyr.blend` | [_to_delete/blender-models/models/stylized_zephyr.blend](../../_to_delete/blender-models/models/stylized_zephyr.blend) |
| `villager_bram.blend` | [_to_delete/blender-models/models/villager_bram.blend](../../_to_delete/blender-models/models/villager_bram.blend) |
| `villager_lysa.blend` | [_to_delete/blender-models/models/villager_lysa.blend](../../_to_delete/blender-models/models/villager_lysa.blend) |
| `villager_merchant.blend` | [_to_delete/blender-models/models/villager_merchant.blend](../../_to_delete/blender-models/models/villager_merchant.blend) |
| `villager_tilda.blend` | [_to_delete/blender-models/models/villager_tilda.blend](../../_to_delete/blender-models/models/villager_tilda.blend) |
| `flora_druid.glb` | [_to_delete/blender-models/exports/flora_druid.glb](../../_to_delete/blender-models/exports/flora_druid.glb) |
| `flora_tripo_druid.glb` | [_to_delete/blender-models/exports/flora_tripo_druid.glb](../../_to_delete/blender-models/exports/flora_tripo_druid.glb) |
| `flora_tripo_druid_t.glb` | [_to_delete/blender-models/exports/flora_tripo_druid_t.glb](../../_to_delete/blender-models/exports/flora_tripo_druid_t.glb) |
| `flora_tripo_wolf.glb` | [_to_delete/blender-models/exports/flora_tripo_wolf.glb](../../_to_delete/blender-models/exports/flora_tripo_wolf.glb) |
| `flora_werewolf.glb` | [_to_delete/blender-models/exports/flora_werewolf.glb](../../_to_delete/blender-models/exports/flora_werewolf.glb) |
| `flora_wolf_revised.glb` | [_to_delete/blender-models/exports/flora_wolf_revised.glb](../../_to_delete/blender-models/exports/flora_wolf_revised.glb) |
| `lowpoly_bram.glb` | [_to_delete/blender-models/exports/lowpoly_bram.glb](../../_to_delete/blender-models/exports/lowpoly_bram.glb) |
| `mage_hero.glb` | [_to_delete/blender-models/exports/mage_hero.glb](../../_to_delete/blender-models/exports/mage_hero.glb) |
| `stylized_zephyr.glb` | [_to_delete/blender-models/exports/stylized_zephyr.glb](../../_to_delete/blender-models/exports/stylized_zephyr.glb) |
| `villager_bram.glb` | [_to_delete/blender-models/exports/villager_bram.glb](../../_to_delete/blender-models/exports/villager_bram.glb) |
| `villager_lysa.glb` | [_to_delete/blender-models/exports/villager_lysa.glb](../../_to_delete/blender-models/exports/villager_lysa.glb) |
| `villager_merchant.glb` | [_to_delete/blender-models/exports/villager_merchant.glb](../../_to_delete/blender-models/exports/villager_merchant.glb) |
| `villager_tilda.glb` | [_to_delete/blender-models/exports/villager_tilda.glb](../../_to_delete/blender-models/exports/villager_tilda.glb) |

## Blocking de autoria — backups

| Arquivo | Local atual |
|---|---|
| `flora_human_blocking.blend` | [blender/backups/blocking/flora_human_blocking.blend](../backups/blocking/flora_human_blocking.blend) |
| `flora_wolf_blocking.blend` | [blender/backups/blocking/flora_wolf_blocking.blend](../backups/blocking/flora_wolf_blocking.blend) |
| `flora_wolf_dynamic_blocking.blend` | [blender/backups/blocking/flora_wolf_dynamic_blocking.blend](../backups/blocking/flora_wolf_dynamic_blocking.blend) |
| `mage_hero_t_blocking.blend` | [blender/backups/blocking/mage_hero_t_blocking.blend](../backups/blocking/mage_hero_t_blocking.blend) |
