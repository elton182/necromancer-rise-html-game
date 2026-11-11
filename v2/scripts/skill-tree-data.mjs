// Gerado de docs/habilidades/arvores.json por tools/build.cjs; edite no editor de árvores (tools/skill-tree-editor.html).
export default {
 "necromancer": {
  "name": "Necromante",
  "resource": "mana",
  "trees": [
   {
    "id": "minions",
    "name": "Minions",
    "branches": [
     {
      "id": "flesh",
      "name": "Carne",
      "motto": "Especializações: Colosso de Carne ou Horda Explosiva",
      "color": "#8fae5a",
      "nodes": [
       [
        "zombie",
        50,
        18
       ],
       [
        "vigor",
        24,
        122
       ],
       [
        "burst",
        76,
        122
       ],
       [
        "caoZumbi",
        16,
        226
       ],
       [
        "abom",
        50,
        226
       ],
       [
        "unstable",
        84,
        226
       ],
       [
        "cerberus",
        16,
        330
       ],
       [
        "colossus",
        50,
        330
       ],
       [
        "plague",
        84,
        330
       ]
      ]
     },
     {
      "id": "bone",
      "name": "Ossos",
      "motto": "Especializações: Guarda Sepulcral ou Legião de Arqueiros",
      "color": "#d8cfb0",
      "nodes": [
       [
        "skeleton",
        50,
        18
       ],
       [
        "armor",
        16,
        122
       ],
       [
        "archer",
        50,
        122
       ],
       [
        "mages",
        84,
        122
       ],
       [
        "blades",
        16,
        226
       ],
       [
        "shot",
        50,
        226
       ],
       [
        "raioNecrotico",
        84,
        226
       ],
       [
        "guard",
        16,
        330
       ],
       [
        "salvo",
        50,
        330
       ],
       [
        "rupturaNecrotica",
        84,
        330
       ]
      ]
     },
     {
      "id": "spirit",
      "name": "Espíritos",
      "motto": "Especializações: Drenagem Vital ou Cortejo Espectral",
      "color": "#8aa8e8",
      "nodes": [
       [
        "specter",
        50,
        18
       ],
       [
        "drain",
        24,
        122
       ],
       [
        "ethereal",
        76,
        122
       ],
       [
        "bond",
        24,
        226
       ],
       [
        "step",
        76,
        226
       ],
       [
        "vampire",
        24,
        330
       ],
       [
        "procession",
        76,
        330
       ]
      ]
     }
    ]
   },
   {
    "id": "spells",
    "name": "Profana",
    "branches": [
     {
      "id": "osso",
      "name": "Ossos",
      "motto": "Especializações: Lança Perfurante ou Tempestade Óssea",
      "color": "#c9b98a",
      "nodes": [
       [
        "bolt",
        50,
        18
       ],
       [
        "pierce",
        24,
        122
       ],
       [
        "rain",
        76,
        122
       ],
       [
        "shards",
        24,
        226
       ],
       [
        "wall",
        76,
        226
       ],
       [
        "lance",
        24,
        330
       ],
       [
        "storm",
        76,
        330
       ]
      ]
     },
     {
      "id": "blood",
      "name": "Sangue",
      "motto": "Especializações: Bastião de Carne ou Ritual de Detonação",
      "color": "#c0453a",
      "nodes": [
       [
        "shield",
        50,
        18
       ],
       [
        "vitality",
        24,
        122
       ],
       [
        "nova",
        76,
        122
       ],
       [
        "pact",
        24,
        226
       ],
       [
        "ritual",
        76,
        226
       ],
       [
        "bastion",
        24,
        330
       ],
       [
        "detonation",
        76,
        330
       ]
      ]
     },
     {
      "id": "shadow",
      "name": "Sombras",
      "motto": "Especializações: Caminhante do Véu ou Senhor da Horda",
      "color": "#8a6ac0",
      "nodes": [
       [
        "dash",
        50,
        18
       ],
       [
        "stride",
        24,
        122
       ],
       [
        "meditate",
        76,
        122
       ],
       [
        "veil",
        24,
        226
       ],
       [
        "curse",
        76,
        226
       ],
       [
        "walker",
        24,
        330
       ],
       [
        "aura",
        76,
        330
       ]
      ]
     }
    ]
   },
   {
    "id": "death",
    "name": "Morte",
    "branches": [
     {
      "id": "scythe",
      "name": "Foice",
      "motto": "Especializações: Ciclone da Morte ou Executor",
      "color": "#6fb0a8",
      "nodes": [
       [
        "lichform",
        50,
        18
       ],
       [
        "reach",
        24,
        122
       ],
       [
        "spinning",
        76,
        122
       ],
       [
        "triple",
        24,
        226
       ],
       [
        "arc",
        76,
        226
       ],
       [
        "cyclone",
        24,
        330
       ],
       [
        "executor",
        76,
        330
       ]
      ]
     },
     {
      "id": "harvest",
      "name": "Colheita",
      "motto": "Especializações: Ceifador de Almas ou Avatar da Morte",
      "color": "#9c7ad8",
      "nodes": [
       [
        "harvest",
        50,
        18
       ],
       [
        "hunger",
        24,
        122
       ],
       [
        "callspirit",
        76,
        122
       ],
       [
        "vessel",
        24,
        226
       ],
       [
        "wail",
        76,
        226
       ],
       [
        "reaper",
        24,
        330
       ],
       [
        "avatar",
        76,
        330
       ]
      ]
     }
    ]
   }
  ],
  "nodes": {
   "zombie": {
    "name": "Zumbis",
    "description": "Evoca 3 zumbis. Cada ponto dá +4% de dano e +3% de vida a Zumbis e Abominações.",
    "perRank": "",
    "icon": "☠",
    "effects": {
     "Dano de Zumbis e Abominações": 4,
     "Vida de Zumbis e Abominações": 3
    },
    "type": "evocação",
    "tree": "minions",
    "branch": "flesh",
    "max": 5,
    "level": 1,
    "requires": [],
    "excludes": []
   },
   "vigor": {
    "name": "Carne Reanimada",
    "description": "Aumenta a vida de Zumbis e Abominações.",
    "perRank": "",
    "icon": "♥",
    "effects": {
     "Vida de Zumbis e Abominações": 10
    },
    "type": "aperfeiçoamento",
    "tree": "minions",
    "branch": "flesh",
    "max": 5,
    "level": 6,
    "requires": [
     "zombie"
    ],
    "excludes": []
   },
   "burst": {
    "name": "Explosão Cadavérica",
    "description": "Desbloqueia a detonação e aumenta seu dano. Cada ponto investido também dá +4% ao Salto Devastador da Abominação.",
    "perRank": "",
    "icon": "✹",
    "effects": {
     "Dano da explosão de Zumbi": 12,
     "Dano do Salto Devastador": 4,
     "Tamanho da área de explosão": 3
    },
    "type": "aperfeiçoamento",
    "tree": "minions",
    "branch": "flesh",
    "max": 5,
    "level": 6,
    "requires": [
     "zombie"
    ],
    "excludes": []
   },
   "abom": {
    "name": "Abominação",
    "description": "Evocação própria: +10% de dano e +15% de vida por ponto. Cada ponto investido também dá +4% de dano e +6% de vida aos zumbis, fortalecendo seus ataques e explosões.",
    "perRank": "",
    "icon": "♜",
    "effects": {
     "Dano da Abominação": 10,
     "Vida da Abominação": 15,
     "Dano de Zumbis": 4,
     "Vida de Zumbis": 6
    },
    "type": "evocação",
    "tree": "minions",
    "branch": "flesh",
    "max": 5,
    "level": 12,
    "requires": [
     "vigor"
    ],
    "excludes": [
     "caoZumbi"
    ]
   },
   "unstable": {
    "name": "Carne Instável",
    "description": "Sinergia entre a explosão dos Zumbis e Explosão Necrótica da árvore Profana.",
    "perRank": "",
    "icon": "✷",
    "effects": {
     "Dano das explosões de Zumbi e Necrótica": 8,
     "Tamanho da área de explosão": 3
    },
    "type": "aperfeiçoamento",
    "tree": "minions",
    "branch": "flesh",
    "max": 5,
    "level": 12,
    "requires": [
     "burst"
    ],
    "excludes": []
   },
   "colossus": {
    "name": "Colosso de Carne",
    "description": "Especialização: Abominação ganha vida e o comando Salto Devastador. Exclui Horda Explosiva.",
    "perRank": "",
    "icon": "♜",
    "effects": {
     "Vida da Abominação": 60,
     "Dano do Salto Devastador": 40
    },
    "type": "especialização",
    "tree": "minions",
    "branch": "flesh",
    "max": 1,
    "level": 22,
    "requires": [
     "abom"
    ],
    "excludes": [
     "plague"
    ]
   },
   "plague": {
    "name": "Horda Explosiva",
    "description": "Especialização: +2 zumbis e explosões mais fortes. Exclui Colosso de Carne.",
    "perRank": "",
    "icon": "✹",
    "effects": {
     "Zumbis adicionais": 2,
     "Dano da explosão de Zumbi": 40
    },
    "type": "especialização",
    "tree": "minions",
    "branch": "flesh",
    "max": 1,
    "level": 22,
    "requires": [
     "unstable"
    ],
    "excludes": [
     "colossus"
    ]
   },
   "skeleton": {
    "name": "Esqueletos",
    "description": "Evoca 3 guerreiros. Pontos fortalecem guerreiros e arqueiros.",
    "perRank": "",
    "icon": "⚔",
    "effects": {
     "Dano de Esqueletos e Arqueiros": 4
    },
    "type": "evocação",
    "tree": "minions",
    "branch": "bone",
    "max": 5,
    "level": 1,
    "requires": [],
    "excludes": []
   },
   "armor": {
    "name": "Armadura Óssea",
    "description": "Aumenta a vida dos guerreiros e arqueiros.",
    "perRank": "",
    "icon": "⛨",
    "effects": {
     "Vida de Esqueletos e Arqueiros": 10
    },
    "type": "aperfeiçoamento",
    "tree": "minions",
    "branch": "bone",
    "max": 5,
    "level": 6,
    "requires": [
     "skeleton"
    ],
    "excludes": []
   },
   "archer": {
    "name": "Arqueiros",
    "description": "Desbloqueia 2 arqueiros e aprimora seu dano.",
    "perRank": "",
    "icon": "➶",
    "effects": {
     "Dano dos Arqueiros": 10
    },
    "type": "evocação",
    "tree": "minions",
    "branch": "bone",
    "max": 5,
    "level": 6,
    "requires": [
     "skeleton"
    ],
    "excludes": []
   },
   "blades": {
    "name": "Ossos Afiados",
    "description": "Aprimora ataques dos dois tipos de esqueletos.",
    "perRank": "",
    "icon": "⚔",
    "effects": {
     "Dano de Esqueletos e Arqueiros": 8
    },
    "type": "aperfeiçoamento",
    "tree": "minions",
    "branch": "bone",
    "max": 5,
    "level": 12,
    "requires": [
     "armor"
    ],
    "excludes": []
   },
   "shot": {
    "name": "Tiro Sepulcral",
    "description": "Desbloqueia o disparo comandado dos arqueiros.",
    "perRank": "",
    "icon": "➶",
    "effects": {
     "Dano do Tiro Sepulcral": 15
    },
    "type": "aperfeiçoamento",
    "tree": "minions",
    "branch": "bone",
    "max": 5,
    "level": 12,
    "requires": [
     "archer"
    ],
    "excludes": []
   },
   "guard": {
    "name": "Guarda Sepulcral",
    "description": "Especialização: guerreiros ganham resistência e +1 integrante. Exclui Salva Sepulcral.",
    "perRank": "",
    "icon": "⛨",
    "effects": {
     "Vida dos Guerreiros": 60,
     "Guerreiros adicionais": 1
    },
    "type": "especialização",
    "tree": "minions",
    "branch": "bone",
    "max": 1,
    "level": 22,
    "requires": [
     "blades"
    ],
    "excludes": [
     "salvo"
    ]
   },
   "salvo": {
    "name": "Salva Sepulcral",
    "description": "Especialização: +2 arqueiros e tiro comandado mais forte. Exclui Guarda Sepulcral.",
    "perRank": "",
    "icon": "➶",
    "effects": {
     "Arqueiros adicionais": 2,
     "Dano do Tiro Sepulcral": 40
    },
    "type": "especialização",
    "tree": "minions",
    "branch": "bone",
    "max": 1,
    "level": 22,
    "requires": [
     "shot"
    ],
    "excludes": [
     "guard"
    ]
   },
   "specter": {
    "name": "Espectros",
    "description": "Evoca 2 espectros e aumenta seu dano mágico.",
    "perRank": "",
    "icon": "♧",
    "effects": {
     "Dano dos Espectros": 8
    },
    "type": "evocação",
    "tree": "minions",
    "branch": "spirit",
    "max": 5,
    "level": 1,
    "requires": [],
    "excludes": []
   },
   "drain": {
    "name": "Drenar Vida",
    "description": "Ataques dos espectros recuperam uma porcentagem do dano como vida própria.",
    "perRank": "",
    "icon": "♥",
    "effects": {
     "Roubo de vida dos Espectros": 2
    },
    "type": "aperfeiçoamento",
    "tree": "minions",
    "branch": "spirit",
    "max": 5,
    "level": 6,
    "requires": [
     "specter"
    ],
    "excludes": []
   },
   "ethereal": {
    "name": "Essência Etérea",
    "description": "Aumenta a vida e o dano dos espectros.",
    "perRank": "",
    "icon": "◇",
    "effects": {
     "Vida dos Espectros": 8,
     "Dano dos Espectros": 5
    },
    "type": "aperfeiçoamento",
    "tree": "minions",
    "branch": "spirit",
    "max": 5,
    "level": 6,
    "requires": [
     "specter"
    ],
    "excludes": []
   },
   "bond": {
    "name": "Vínculo Vital",
    "description": "A cura produzida pelos espectros também ajuda Zephyr.",
    "perRank": "",
    "icon": "♥",
    "effects": {
     "Cura compartilhada com Zephyr": 3
    },
    "type": "aperfeiçoamento",
    "tree": "minions",
    "branch": "spirit",
    "max": 5,
    "level": 12,
    "requires": [
     "drain"
    ],
    "excludes": []
   },
   "step": {
    "name": "Passo Espectral",
    "description": "Desbloqueia o comando de reposicionamento e aumenta sua frequência.",
    "perRank": "",
    "icon": "➤",
    "effects": {
     "Recarga do Passo Espectral": -5
    },
    "type": "aperfeiçoamento",
    "tree": "minions",
    "branch": "spirit",
    "max": 5,
    "level": 12,
    "requires": [
     "ethereal"
    ],
    "excludes": []
   },
   "vampire": {
    "name": "Ceifadores Vitais",
    "description": "Especialização: amplia a drenagem de vida. Exclui Cortejo dos Mortos.",
    "perRank": "",
    "icon": "♥",
    "effects": {
     "Roubo de vida dos Espectros": 15
    },
    "type": "especialização",
    "tree": "minions",
    "branch": "spirit",
    "max": 1,
    "level": 22,
    "requires": [
     "bond"
    ],
    "excludes": [
     "procession"
    ]
   },
   "procession": {
    "name": "Cortejo dos Mortos",
    "description": "Especialização: +2 espectros e recuperação mais rápida. Exclui Ceifadores Vitais.",
    "perRank": "",
    "icon": "♧",
    "effects": {
     "Espectros adicionais": 2,
     "Tempo de renascimento dos Espectros": -25
    },
    "type": "especialização",
    "tree": "minions",
    "branch": "spirit",
    "max": 1,
    "level": 22,
    "requires": [
     "step"
    ],
    "excludes": [
     "vampire"
    ]
   },
   "bolt": {
    "name": "Tiro de Osso",
    "description": "Desbloqueia o projétil principal. Sinergia: +4% ao dano da Chuva por ponto direto.",
    "perRank": "",
    "icon": "➶",
    "effects": {
     "Dano do Tiro de Osso": 10,
     "Dano da Chuva de Ossos": 4
    },
    "type": "ativa",
    "tree": "spells",
    "branch": "osso",
    "max": 5,
    "level": 1,
    "requires": [],
    "excludes": []
   },
   "pierce": {
    "name": "Perfuração",
    "description": "Cada ponto permite atravessar um alvo adicional.",
    "perRank": "",
    "icon": "➳",
    "effects": {
     "Alvos perfurados adicionais": 1
    },
    "type": "aperfeiçoamento",
    "tree": "spells",
    "branch": "osso",
    "max": 5,
    "level": 6,
    "requires": [
     "bolt"
    ],
    "excludes": []
   },
   "rain": {
    "name": "Chuva de Ossos",
    "description": "Desbloqueia dano em área. Sinergia: +4% ao dano do Tiro por ponto direto.",
    "perRank": "",
    "icon": "☄",
    "effects": {
     "Dano da Chuva de Ossos": 10,
     "Dano do Tiro de Osso": 4
    },
    "type": "ativa",
    "tree": "spells",
    "branch": "osso",
    "max": 5,
    "level": 6,
    "requires": [
     "bolt"
    ],
    "excludes": []
   },
   "shards": {
    "name": "Estilhaços",
    "description": "Tiro de Osso dispara 3 estilhaços em leque, cobrindo uma área maior; cada inimigo é atingido uma vez por disparo. Melhora o dano de Tiro e Chuva de Ossos.",
    "perRank": "",
    "icon": "✧",
    "effects": {
     "Dano do Tiro de Osso": 6,
     "Dano da Chuva de Ossos": 6
    },
    "type": "aperfeiçoamento",
    "tree": "spells",
    "branch": "osso",
    "max": 5,
    "level": 12,
    "requires": [
     "pierce"
    ],
    "excludes": []
   },
   "wall": {
    "name": "Muralha de Corpos",
    "description": "Desbloqueia a muralha e amplia sua duração e resistência a projéteis.",
    "perRank": "",
    "icon": "▥",
    "effects": {
     "Duração da Muralha": 10,
     "Resistência da Muralha": 10
    },
    "type": "ativa",
    "tree": "spells",
    "branch": "osso",
    "max": 5,
    "level": 12,
    "requires": [
     "rain"
    ],
    "excludes": []
   },
   "lance": {
    "name": "Lança Sepulcral",
    "description": "Especialização: projétil de alto dano. Exclui Tempestade Óssea.",
    "perRank": "",
    "icon": "➳",
    "effects": {
     "Dano do Tiro de Osso": 60
    },
    "type": "especialização",
    "tree": "spells",
    "branch": "osso",
    "max": 1,
    "level": 22,
    "requires": [
     "shards"
    ],
    "excludes": [
     "storm"
    ]
   },
   "storm": {
    "name": "Tempestade Óssea",
    "description": "Especialização: amplia área e dano da Chuva. Exclui Lança Sepulcral.",
    "perRank": "",
    "icon": "☄",
    "effects": {
     "Área da Chuva de Ossos": 30,
     "Dano da Chuva de Ossos": 35
    },
    "type": "especialização",
    "tree": "spells",
    "branch": "osso",
    "max": 1,
    "level": 22,
    "requires": [
     "wall"
    ],
    "excludes": [
     "lance"
    ]
   },
   "shield": {
    "name": "Escudo de Carne",
    "description": "Sacrifica um zumbi para proteger Zephyr. Herda o HP do zumbi aprimorado por Carne Reanimada.",
    "perRank": "",
    "icon": "⛨",
    "effects": {
     "Absorção do Escudo de Carne": 8
    },
    "type": "ativa",
    "tree": "spells",
    "branch": "blood",
    "max": 5,
    "level": 1,
    "requires": [],
    "excludes": []
   },
   "vitality": {
    "name": "Vitalidade Profana",
    "description": "Aumenta a vida máxima de Zephyr.",
    "perRank": "",
    "icon": "♥",
    "effects": {
     "Vida de Zephyr": 8
    },
    "type": "aperfeiçoamento",
    "tree": "spells",
    "branch": "blood",
    "max": 5,
    "level": 6,
    "requires": [
     "shield"
    ],
    "excludes": []
   },
   "nova": {
    "name": "Explosão Necrótica",
    "description": "Desbloqueia explosão em área com mana, sem coleta de souls.",
    "perRank": "",
    "icon": "✹",
    "effects": {
     "Dano da Explosão Necrótica": 12
    },
    "type": "ativa",
    "tree": "spells",
    "branch": "blood",
    "max": 5,
    "level": 6,
    "requires": [
     "shield"
    ],
    "excludes": []
   },
   "pact": {
    "name": "Pacto de Sangue",
    "description": "Morte comum de aliado recupera vida de Zephyr. Não ativa em sacrifícios ou detonações.",
    "perRank": "",
    "icon": "♱",
    "effects": {
     "Vida máxima recuperada por morte de aliado": 1
    },
    "type": "aperfeiçoamento",
    "tree": "spells",
    "branch": "blood",
    "max": 5,
    "level": 12,
    "requires": [
     "vitality"
    ],
    "excludes": []
   },
   "ritual": {
    "name": "Ritual Instável",
    "description": "Melhora Explosão Necrótica e Explosão Cadavérica.",
    "perRank": "",
    "icon": "✷",
    "effects": {
     "Dano das explosões de Zumbi e Necrótica": 8
    },
    "type": "aperfeiçoamento",
    "tree": "spells",
    "branch": "blood",
    "max": 5,
    "level": 12,
    "requires": [
     "nova"
    ],
    "excludes": []
   },
   "bastion": {
    "name": "Bastião de Carne",
    "description": "Especialização: amplia a absorção do escudo. Exclui Detonação Profana.",
    "perRank": "",
    "icon": "⛨",
    "effects": {
     "Absorção do Escudo de Carne": 60
    },
    "type": "especialização",
    "tree": "spells",
    "branch": "blood",
    "max": 1,
    "level": 22,
    "requires": [
     "pact"
    ],
    "excludes": [
     "detonation"
    ]
   },
   "detonation": {
    "name": "Detonação Profana",
    "description": "Especialização: amplia as duas explosões. Exclui Bastião de Carne.",
    "perRank": "",
    "icon": "✹",
    "effects": {
     "Dano das explosões de Zumbi e Necrótica": 40
    },
    "type": "especialização",
    "tree": "spells",
    "branch": "blood",
    "max": 1,
    "level": 22,
    "requires": [
     "ritual"
    ],
    "excludes": [
     "bastion"
    ]
   },
   "dash": {
    "name": "Dash",
    "description": "Desbloqueia a evasão e reduz sua recarga.",
    "perRank": "",
    "icon": "➤",
    "effects": {
     "Recarga do Dash": -3
    },
    "type": "ativa",
    "tree": "spells",
    "branch": "shadow",
    "max": 5,
    "level": 1,
    "requires": [],
    "excludes": []
   },
   "stride": {
    "name": "Passo Prolongado",
    "description": "Aumenta a distância do Dash.",
    "perRank": "",
    "icon": "➤",
    "effects": {
     "Distância do Dash": 8
    },
    "type": "aperfeiçoamento",
    "tree": "spells",
    "branch": "shadow",
    "max": 5,
    "level": 6,
    "requires": [
     "dash"
    ],
    "excludes": []
   },
   "meditate": {
    "name": "Meditação Sombria",
    "description": "Aumenta reserva e regeneração de mana.",
    "perRank": "",
    "icon": "◈",
    "effects": {
     "Mana máxima": 8,
     "Regeneração de mana": 8
    },
    "type": "aperfeiçoamento",
    "tree": "spells",
    "branch": "shadow",
    "max": 5,
    "level": 6,
    "requires": [
     "dash"
    ],
    "excludes": []
   },
   "veil": {
    "name": "Véu Noturno",
    "description": "A evasão deixa uma proteção breve.",
    "perRank": "",
    "icon": "◇",
    "effects": {
     "Duração da proteção após Dash": 10
    },
    "type": "aperfeiçoamento",
    "tree": "spells",
    "branch": "shadow",
    "max": 5,
    "level": 12,
    "requires": [
     "stride"
    ],
    "excludes": []
   },
   "curse": {
    "name": "Maldição da Fraqueza",
    "description": "Desbloqueia maldição que reduz o dano dos inimigos afetados.",
    "perRank": "",
    "icon": "☽",
    "effects": {
     "Redução de dano da Maldição": 3
    },
    "type": "ativa",
    "tree": "spells",
    "branch": "shadow",
    "max": 5,
    "level": 12,
    "requires": [
     "meditate"
    ],
    "excludes": []
   },
   "walker": {
    "name": "Caminhante do Véu",
    "description": "Especialização: Dash mais frequente e longo. Exclui Aura das Sombras.",
    "perRank": "",
    "icon": "➤",
    "effects": {
     "Recarga do Dash": -25,
     "Distância do Dash": 25
    },
    "type": "especialização",
    "tree": "spells",
    "branch": "shadow",
    "max": 1,
    "level": 22,
    "requires": [
     "veil"
    ],
    "excludes": [
     "aura"
    ]
   },
   "aura": {
    "name": "Aura das Sombras",
    "description": "Especialização: aumenta o dano de toda a horda próxima. Exclui Caminhante do Véu.",
    "perRank": "",
    "icon": "☽",
    "effects": {
     "Dano da horda próxima": 30
    },
    "type": "especialização",
    "tree": "spells",
    "branch": "shadow",
    "max": 1,
    "level": 22,
    "requires": [
     "curse"
    ],
    "excludes": [
     "walker"
    ]
   },
   "lichform": {
    "name": "Forma da Morte",
    "description": "Libera a transformação em Lich, com barra de almas no lugar da mana, +25% de dano e +25% de defesa enquanto ativa. Cada ponto aumenta as almas máximas.",
    "perRank": "",
    "icon": "☠",
    "effects": {
     "Almas máximas": 5
    },
    "type": "ativa",
    "tree": "death",
    "branch": "scythe",
    "max": 5,
    "level": 1,
    "requires": [],
    "excludes": []
   },
   "reach": {
    "name": "Foice Longa",
    "description": "Aumenta o alcance dos golpes da foice e o dano da Ceifada.",
    "perRank": "",
    "icon": "⚔",
    "effects": {
     "Alcance da foice e dano da Ceifada": 6
    },
    "type": "aperfeiçoamento",
    "tree": "death",
    "branch": "scythe",
    "max": 5,
    "level": 6,
    "requires": [
     "lichform"
    ],
    "excludes": []
   },
   "spinning": {
    "name": "Foice Giratória",
    "description": "Libera o arremesso; cada passagem prolonga Ceifado em 1 s, até 4 s. Aumenta seu dano.",
    "perRank": "",
    "icon": "✧",
    "effects": {
     "Dano da Foice Giratória": 5
    },
    "type": "ativa",
    "tree": "death",
    "branch": "scythe",
    "max": 5,
    "level": 6,
    "requires": [
     "lichform"
    ],
    "excludes": []
   },
   "triple": {
    "name": "Colheita Tripla",
    "description": "Substitui o golpe do clique por três golpes gratuitos. O finalizador aplica Ceifado; aumenta seu dano.",
    "perRank": "",
    "icon": "⚔",
    "effects": {
     "Dano da Colheita Tripla": 5
    },
    "type": "ativa",
    "tree": "death",
    "branch": "scythe",
    "max": 5,
    "level": 12,
    "requires": [
     "reach"
    ],
    "excludes": []
   },
   "arc": {
    "name": "Gancho do Túmulo",
    "description": "Puxa inimigos na linha da mira; puxa mais os Ceifados. Chefes recebem lentidão. Aumenta seu dano.",
    "perRank": "",
    "icon": "⤶",
    "effects": {
     "Dano do Gancho do Túmulo": 5
    },
    "type": "ativa",
    "tree": "death",
    "branch": "scythe",
    "max": 5,
    "level": 12,
    "requires": [
     "spinning"
    ],
    "excludes": []
   },
   "cyclone": {
    "name": "Ciclone da Morte",
    "description": "Especialização: libera a órbita de 360°, que consome Ceifado para um impacto com +75% de dano por alvo. Exclui Executor.",
    "perRank": "",
    "icon": "✷",
    "effects": {
     "Dano do Ciclone da Morte": 10
    },
    "type": "especialização",
    "tree": "death",
    "branch": "scythe",
    "max": 1,
    "level": 22,
    "requires": [
     "triple"
    ],
    "excludes": [
     "executor"
    ]
   },
   "executor": {
    "name": "Executor",
    "description": "Especialização: o golpe final da Colheita causa dano extra em alvos com pouca vida e marca por mais tempo. Exclui Ciclone da Morte.",
    "perRank": "",
    "icon": "♱",
    "effects": {
     "Dano do golpe final em alvos fracos": 50
    },
    "type": "especialização",
    "tree": "death",
    "branch": "scythe",
    "max": 1,
    "level": 22,
    "requires": [
     "arc"
    ],
    "excludes": [
     "cyclone"
    ]
   },
   "harvest": {
    "name": "Colheita de Almas",
    "description": "Cada espírito absorvido rende mais almas.",
    "perRank": "",
    "icon": "◇",
    "effects": {
     "Almas por espírito": 8
    },
    "type": "ativa",
    "tree": "death",
    "branch": "harvest",
    "max": 5,
    "level": 1,
    "requires": [],
    "excludes": []
   },
   "hunger": {
    "name": "Fome Eterna",
    "description": "Reduz a drenagem passiva de almas.",
    "perRank": "",
    "icon": "◈",
    "effects": {
     "Drenagem de almas": -6
    },
    "type": "aperfeiçoamento",
    "tree": "death",
    "branch": "harvest",
    "max": 5,
    "level": 6,
    "requires": [
     "harvest"
    ],
    "excludes": []
   },
   "callspirit": {
    "name": "Chamado Espectral",
    "description": "Aumenta o raio em que os espíritos são absorvidos.",
    "perRank": "",
    "icon": "♧",
    "effects": {
     "Raio de absorção": 0.3
    },
    "type": "aperfeiçoamento",
    "tree": "death",
    "branch": "harvest",
    "max": 5,
    "level": 6,
    "requires": [
     "harvest"
    ],
    "excludes": []
   },
   "vessel": {
    "name": "Recipiente",
    "description": "Aumenta as almas máximas.",
    "perRank": "",
    "icon": "◈",
    "effects": {
     "Almas máximas": 4
    },
    "type": "aperfeiçoamento",
    "tree": "death",
    "branch": "harvest",
    "max": 5,
    "level": 12,
    "requires": [
     "hunger"
    ],
    "excludes": []
   },
   "wail": {
    "name": "Lamento",
    "description": "Absorver um espírito recupera uma parte da vida máxima.",
    "perRank": "",
    "icon": "♥",
    "effects": {
     "Vida máxima por espírito (%)": 0.5
    },
    "type": "aperfeiçoamento",
    "tree": "death",
    "branch": "harvest",
    "max": 5,
    "level": 12,
    "requires": [
     "callspirit"
    ],
    "excludes": []
   },
   "reaper": {
    "name": "Ceifador de Almas",
    "description": "Especialização: elites e chefes rendem o dobro de almas. Exclui Avatar da Morte.",
    "perRank": "",
    "icon": "☠",
    "effects": {
     "Almas de elites e chefes": 100
    },
    "type": "especialização",
    "tree": "death",
    "branch": "harvest",
    "max": 1,
    "level": 22,
    "requires": [
     "vessel"
    ],
    "excludes": [
     "avatar"
    ]
   },
   "avatar": {
    "name": "Avatar da Morte",
    "description": "Especialização: a forma reduz o dano recebido e a transformação é mais rápida. Exclui Ceifador de Almas.",
    "perRank": "",
    "icon": "⛨",
    "effects": {
     "Dano recebido na forma": -25,
     "Duração da transformação": -33
    },
    "type": "especialização",
    "tree": "death",
    "branch": "harvest",
    "max": 1,
    "level": 22,
    "requires": [
     "wail"
    ],
    "excludes": [
     "reaper"
    ]
   },
   "caoZumbi": {
    "name": "Cão Zumbi",
    "description": "Grupo permanente de 2 cães zumbis que ocupa uma vaga da horda. Mordem a cada 0,9 s e usam atributos próprios da horda, com escala por nível. Morrem, podem ser reanimados por 30 MP e renascem automaticamente. O slot comanda a Caçada: salto na mira com dano de 140% na aterrissagem. Exclui a Abominação.",
    "perRank": "+10% de dano e +5% de vida dos cães",
    "icon": "♞",
    "effects": {
     "Dano dos Cães Zumbis": 10,
     "Vida dos Cães Zumbis": 5
    },
    "type": "evocação",
    "tree": "minions",
    "branch": "flesh",
    "max": 5,
    "level": 12,
    "requires": [
     "vigor"
    ],
    "excludes": [
     "abom"
    ]
   },
   "cerberus": {
    "name": "Cerberus",
    "description": "Especialização do grupo permanente: um só cão, maior, com o triplo da vida e 160% do dano base de um cão. A Mordida Feroz automática atinge um cone de 100° até 1,9 u. Mantém morte, reanimação e save da horda.",
    "perRank": "",
    "icon": "♛",
    "effects": {},
    "type": "especialização",
    "tree": "minions",
    "branch": "flesh",
    "max": 1,
    "level": 22,
    "requires": [
     "caoZumbi"
    ],
    "excludes": []
   },
   "mages": {
    "name": "Magos",
    "description": "Grupo permanente de 2 esqueletos magos que ocupa uma vaga da horda. Lançam orbes sombrios a cada 1,6 s até 7,5 u, usando atributos próprios da horda, com escala por nível. Morrem, podem ser reanimados por 30 MP e renascem automaticamente. O slot comanda a Descarga Sombria.",
    "perRank": "+8% de dano e +5% de vida dos magos",
    "icon": "✦",
    "effects": {
     "Dano dos Magos": 8,
     "Vida dos Magos": 5
    },
    "type": "evocação",
    "tree": "minions",
    "branch": "bone",
    "max": 5,
    "level": 6,
    "requires": [
     "skeleton"
    ],
    "excludes": []
   },
   "raioNecrotico": {
    "name": "Raio Necrótico",
    "description": "Os magos trocam o orbe por um raio instantâneo que atravessa todos os inimigos numa linha de 8 u. Multiplica o dano do ataque por 1,375, mais 10% por ponto.",
    "perRank": "+10% de dano do raio por ponto",
    "icon": "⚡",
    "effects": {
     "Dano do Raio Necrótico": 10
    },
    "type": "aperfeiçoamento",
    "tree": "minions",
    "branch": "bone",
    "max": 3,
    "level": 12,
    "requires": [
     "mages"
    ],
    "excludes": []
   },
   "rupturaNecrotica": {
    "name": "Ruptura Necrótica",
    "description": "Especialização: inimigos mortos pelos magos explodem em raio 2, com 60% do dano mágico em quem estiver perto.",
    "perRank": "",
    "icon": "✺",
    "effects": {},
    "type": "especialização",
    "tree": "minions",
    "branch": "bone",
    "max": 1,
    "level": 22,
    "requires": [
     "raioNecrotico"
    ],
    "excludes": []
   }
  }
 },
 "warrior": {
  "name": "Guerreiro",
  "resource": "vigor",
  "trees": [
   {
    "id": "habilidades",
    "name": "Habilidades",
    "branches": [
     {
      "id": "sword",
      "name": "Espada",
      "motto": "Precisão e impacto",
      "color": "#d2553a",
      "nodes": [
       [
        "slash",
        16,
        18
       ],
       [
        "thrust",
        50,
        18
       ],
       [
        "tornado",
        84,
        18
       ],
       [
        "momentum",
        16,
        122
       ],
       [
        "impacto",
        50,
        122
       ],
       [
        "tornadoCyclone",
        84,
        122
       ],
       [
        "steelWave",
        16,
        226
       ],
       [
        "cadencia",
        50,
        226
       ],
       [
        "tornadoWhirl",
        84,
        226
       ],
       [
        "corteEspacial",
        16,
        330
       ],
       [
        "rastro",
        50,
        330
       ],
       [
        "tornado2",
        84,
        330
       ]
      ]
     },
     {
      "id": "shield",
      "name": "Escudo",
      "motto": "Guarda e retaliação",
      "color": "#4f86c6",
      "nodes": [
       [
        "bash",
        24,
        18
       ],
       [
        "shieldDefense",
        76,
        18
       ],
       [
        "shieldThrow",
        24,
        122
       ],
       [
        "riposte",
        76,
        122
       ],
       [
        "ricochet",
        24,
        226
       ],
       [
        "armaduraDeEspinhos",
        76,
        226
       ]
      ]
     },
     {
      "id": "passives",
      "name": "Passivas",
      "motto": "O corpo como fortaleza",
      "color": "#79a446",
      "nodes": [
       [
        "strength",
        16,
        18
       ],
       [
        "armor",
        50,
        18
       ],
       [
        "equipmentMastery",
        84,
        18
       ],
       [
        "vitality",
        24,
        122
       ],
       [
        "regeneration",
        76,
        122
       ]
      ]
     },
     {
      "id": "veteran",
      "name": "Veterano",
      "motto": "A experiência do campo",
      "color": "#9a63c4",
      "nodes": [
       [
        "stance",
        24,
        18
       ],
       [
        "warCry",
        76,
        18
       ]
      ]
     }
    ]
   }
  ],
  "nodes": {
   "slash": {
    "name": "Slash · Três cortes",
    "description": "+6% de dano dos cortes por ponto. O ataque básico já está disponível. Sinergia de Espada: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "sword",
    "max": 5,
    "level": 1,
    "requires": [],
    "excludes": []
   },
   "thrust": {
    "name": "Estocada",
    "description": "Libera a estocada (botão direito / 2): avança até 7 u na direção da mira e perfura até 3,4 u à frente, com 220% do dano. +10% de dano por ponto. Sinergia de Espada: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "sword",
    "max": 3,
    "level": 1,
    "requires": [],
    "excludes": []
   },
   "momentum": {
    "name": "Ímpeto",
    "description": "Completar os três cortes fortalece em 10% por ponto a próxima estocada, por 4 s. Sinergia de Espada: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "",
    "icon": "",
    "effects": {},
    "type": "sinergia",
    "tree": "habilidades",
    "branch": "sword",
    "max": 3,
    "level": 4,
    "requires": [
     "slash"
    ],
    "excludes": []
   },
   "tornado": {
    "name": "Corte Vendaval",
    "description": "Segure a tecla do slot: golpes circulares de 65% do dano a cada 0,3 s, raio 2,7 e movimento a 55%. Custa 5 de vigor ao iniciar e 12 por segundo. +10% de dano por ponto depois do primeiro. Evolui cumulativamente com Ciclone e Furacão. Sinergia de Espada: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "+10% de dano depois do primeiro ponto",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "sword",
    "max": 5,
    "level": 6,
    "requires": [],
    "excludes": []
   },
   "steelWave": {
    "name": "Onda de Aço",
    "description": "O terceiro corte lança uma onda de 7 u com 180% do dano, sem custo e com recarga de 8 s. Atravessa inimigos e para em paredes. +10% de dano por ponto depois do primeiro. Sinergia de Espada: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "+10% de dano depois do primeiro ponto",
    "icon": "",
    "effects": {},
    "type": "aperfeiçoamento",
    "tree": "habilidades",
    "branch": "sword",
    "max": 3,
    "level": 10,
    "requires": [
     "momentum"
    ],
    "excludes": []
   },
   "tornadoCyclone": {
    "name": "Ciclone",
    "description": "Evolui o Corte Vendaval: raio 3,7 e movimento a 40%. Cada ponto depois do primeiro acrescenta 0,25 u de raio e +8% de dano ao giro. Mantém os benefícios quando evolui para Furacão. Sinergia de Espada: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "+0,25 u de raio e +8% de dano depois do primeiro ponto",
    "icon": "",
    "effects": {},
    "type": "aperfeiçoamento",
    "tree": "habilidades",
    "branch": "sword",
    "max": 5,
    "level": 12,
    "requires": [
     "tornado"
    ],
    "excludes": []
   },
   "tornadoWhirl": {
    "name": "Furacão",
    "description": "Evolui o Ciclone: golpes a cada 0,2 s, mantendo a área e o movimento do Ciclone, por 16 vigor/s. Cada ponto depois do primeiro reduz o intervalo em 0,01 s, acrescenta +8% de dano ao giro e +1 vigor/s de consumo. Sinergia de Espada: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "−0,01 s entre golpes, +8% de dano e +1 vigor/s depois do primeiro ponto",
    "icon": "",
    "effects": {},
    "type": "aperfeiçoamento",
    "tree": "habilidades",
    "branch": "sword",
    "max": 5,
    "level": 18,
    "requires": [
     "tornadoCyclone"
    ],
    "excludes": []
   },
   "bash": {
    "name": "Golpe de escudo",
    "description": "Libera o golpe de escudo (3 / Q). +10% de dano por ponto. Sinergia de Escudo: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "shield",
    "max": 3,
    "level": 1,
    "requires": [],
    "excludes": []
   },
   "shieldDefense": {
    "name": "Guarda treinada",
    "description": "+3 pontos percentuais de bloqueio com escudo por ponto Sinergia de Escudo: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "",
    "icon": "",
    "effects": {},
    "type": "passiva",
    "tree": "habilidades",
    "branch": "shield",
    "max": 5,
    "level": 1,
    "requires": [],
    "excludes": []
   },
   "shieldThrow": {
    "name": "Arremesso de escudo",
    "description": "T/6: escudo atinge na ida e no retorno. Sem bloqueio enquanto está no ar. +10% do dano base por ponto depois do primeiro (até +40%). Sinergia de Escudo: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "+10% do dano base por ponto depois do primeiro (até +40%)",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "shield",
    "max": 5,
    "level": 6,
    "requires": [
     "bash"
    ],
    "excludes": []
   },
   "riposte": {
    "name": "Retaliação",
    "description": "Bloquear fortalece em 10% por ponto o próximo golpe de escudo, por 4 s. Sinergia de Escudo: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "",
    "icon": "",
    "effects": {},
    "type": "sinergia",
    "tree": "habilidades",
    "branch": "shield",
    "max": 3,
    "level": 6,
    "requires": [
     "shieldDefense"
    ],
    "excludes": []
   },
   "ricochet": {
    "name": "Ricochete",
    "description": "O Arremesso salta para o inimigo mais próximo em até 6 u: um salto por ponto, com 20% menos dano a cada salto. Mais saltos deixam você mais tempo sem escudo. Sinergia de Escudo: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "",
    "icon": "",
    "effects": {},
    "type": "sinergia",
    "tree": "habilidades",
    "branch": "shield",
    "max": 5,
    "level": 12,
    "requires": [
     "shieldThrow"
    ],
    "excludes": []
   },
   "strength": {
    "name": "Maestria da espada",
    "description": "+8% de dano por ponto",
    "perRank": "",
    "icon": "",
    "effects": {},
    "type": "passiva",
    "tree": "habilidades",
    "branch": "passives",
    "max": 5,
    "level": 1,
    "requires": [],
    "excludes": []
   },
   "vitality": {
    "name": "Vitalidade",
    "description": "+10% de vida máxima por ponto",
    "perRank": "",
    "icon": "",
    "effects": {},
    "type": "passiva",
    "tree": "habilidades",
    "branch": "passives",
    "max": 5,
    "level": 1,
    "requires": [],
    "excludes": []
   },
   "armor": {
    "name": "Disciplina defensiva",
    "description": "+4 de armadura por ponto",
    "perRank": "",
    "icon": "",
    "effects": {},
    "type": "passiva",
    "tree": "habilidades",
    "branch": "passives",
    "max": 5,
    "level": 1,
    "requires": [],
    "excludes": []
   },
   "regeneration": {
    "name": "Fôlego de batalha",
    "description": "+0,4 de vida por segundo por ponto",
    "perRank": "",
    "icon": "",
    "effects": {},
    "type": "passiva",
    "tree": "habilidades",
    "branch": "passives",
    "max": 5,
    "level": 1,
    "requires": [],
    "excludes": []
   },
   "equipmentMastery": {
    "name": "Domínio dos equipamentos",
    "description": "+8% ao dano da espada e à armadura dos itens por ponto",
    "perRank": "",
    "icon": "",
    "effects": {},
    "type": "passiva",
    "tree": "habilidades",
    "branch": "passives",
    "max": 5,
    "level": 1,
    "requires": [],
    "excludes": []
   },
   "stance": {
    "name": "Postura de Batalha",
    "description": "F: alterna entre Ofensiva e Defensiva, com só uma ativa e recarga de 6 s. Ofensiva: +20% de dano causado, +15% de dano recebido, -10 de bloqueio, cortes devolvem 2 de vigor. Defensiva: -15% de dano causado, -15% de dano recebido, +10 de bloqueio, vigor ×1,6, bloquear cura 2% da vida.",
    "perRank": "",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "veteran",
    "max": 1,
    "level": 10,
    "requires": [],
    "excludes": []
   },
   "warCry": {
    "name": "Brado de Guerra",
    "description": "Reduz em 30% a velocidade dos inimigos em raio de 6 por 4 s e dobra a recuperação de vigor por 6 s. Recarga de 18 s. Equipe em um slot da barra. +0,5 s de lentidão e de recuperação dobrada por ponto depois do primeiro.",
    "perRank": "+0,5 s de lentidão e de recuperação dobrada por ponto depois do primeiro",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "veteran",
    "max": 5,
    "level": 14,
    "requires": [],
    "excludes": []
   },
   "impacto": {
    "name": "Impacto",
    "description": "Cada etapa da Estocada que acertar causa uma onda de choque de raio 2,5 no primeiro inimigo atingido: 90% do dano físico. +15 pontos percentuais desse dano por ponto depois do primeiro. Uma onda por etapa. Sinergia de Espada: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "+15 pontos percentuais de dano depois do primeiro ponto",
    "icon": "",
    "effects": {},
    "type": "aperfeiçoamento",
    "tree": "habilidades",
    "branch": "sword",
    "max": 5,
    "level": 8,
    "requires": [
     "thrust"
    ],
    "excludes": []
   },
   "cadencia": {
    "name": "Cadência",
    "description": "Após acertar com a Estocada, avança automaticamente em até mais cinco presas diferentes, a até 6 u por etapa. Cada etapa mantém 60% do dano da anterior. Não atravessa paredes nem repete alvos; esquivar interrompe. +10% do dano dos avanços adicionais por ponto depois do primeiro; mantém cinco avanços no máximo. Sinergia de Espada: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "+10% do dano dos avanços adicionais por ponto depois do primeiro; mantém cinco avanços no máximo",
    "icon": "",
    "effects": {},
    "type": "aperfeiçoamento",
    "tree": "habilidades",
    "branch": "sword",
    "max": 5,
    "level": 8,
    "requires": [
     "impacto"
    ],
    "excludes": []
   },
   "corteEspacial": {
    "name": "Corte Espacial",
    "description": "Todo corte do ataque básico dispara uma onda em linha reta de 14 u com 230% do dano físico. Atravessa inimigos, para em paredes, sem custo nem recarga própria. Substitui o disparo da Onda de Aço. +10% do dano base por ponto depois do primeiro (até +40%). Sinergia de Espada: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "+10% do dano base por ponto depois do primeiro (até +40%)",
    "icon": "",
    "effects": {},
    "type": "aperfeiçoamento",
    "tree": "habilidades",
    "branch": "sword",
    "max": 5,
    "level": 22,
    "requires": [
     "steelWave"
    ],
    "excludes": []
   },
   "rastro": {
    "name": "Rastro",
    "description": "A Estocada e os avanços da Cadência deixam fogo no percurso por 3 s. Cada inimigo recebe 15% do dano físico como fogo a cada 0,5 s; +15% desse dano por ponto depois do primeiro. Trechos sobrepostos não somam dano. Sinergia de Espada: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "+15% de dano do rastro depois do primeiro ponto",
    "icon": "",
    "effects": {},
    "type": "aperfeiçoamento",
    "tree": "habilidades",
    "branch": "sword",
    "max": 5,
    "level": 22,
    "requires": [
     "cadencia"
    ],
    "excludes": []
   },
   "tornado2": {
    "name": "Tornado",
    "description": "Enquanto o Furacão gira, libera um pequeno tornado a cada 0,8 s na direção do golpe. Cada tornado avança 6 u e fere cada inimigo uma vez com 35% do dano físico. +10% de dano por ponto depois do primeiro. Para em paredes. Sinergia de Espada: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "+10% de dano depois do primeiro ponto",
    "icon": "",
    "effects": {},
    "type": "aperfeiçoamento",
    "tree": "habilidades",
    "branch": "sword",
    "max": 5,
    "level": 22,
    "requires": [
     "tornadoWhirl"
    ],
    "excludes": []
   },
   "armaduraDeEspinhos": {
    "name": "Armadura de Espinhos",
    "description": "Devolve ao atacante 8% por ponto da vida realmente perdida ao receber dano, até 40%. Golpes bloqueados ou absorvidos não refletem. Não cria ciclos de reflexão. Sinergia de Escudo: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "+8% de dano refletido",
    "icon": "",
    "effects": {},
    "type": "passiva",
    "tree": "habilidades",
    "branch": "shield",
    "max": 5,
    "level": 12,
    "requires": [
     "riposte"
    ],
    "excludes": []
   }
  }
 },
 "druid": {
  "name": "Druida",
  "resource": "mana",
  "trees": [
   {
    "id": "habilidades",
    "name": "Habilidades",
    "branches": [
     {
      "id": "storm",
      "name": "Tempestade",
      "motto": "O céu responde",
      "color": "#6fa8dc",
      "nodes": [
       [
        "spark",
        24,
        18
       ],
       [
        "turbilhao",
        76,
        18
       ],
       [
        "chain",
        24,
        122
       ],
       [
        "tornado",
        76,
        122
       ],
       [
        "storm",
        24,
        226
       ],
       [
        "furacao",
        76,
        226
       ],
       [
        "calamidade",
        50,
        330
       ]
      ]
     },
     {
      "id": "nature",
      "name": "Natureza",
      "motto": "Raízes que prendem",
      "color": "#79a446",
      "nodes": [
       [
        "roots",
        24,
        18
       ],
       [
        "lobo",
        76,
        18
       ],
       [
        "thornbind",
        16,
        122
       ],
       [
        "rejuvenate",
        50,
        122
       ],
       [
        "mordidaPesada",
        84,
        122
       ],
       [
        "plantaCarnivora",
        16,
        226
       ],
       [
        "escudoDeFolhas",
        50,
        226
       ],
       [
        "alcateia",
        84,
        226
       ],
       [
        "florestaTropical",
        24,
        330
       ],
       [
        "liderDaMatilha",
        76,
        330
       ]
      ]
     },
     {
      "id": "wild",
      "name": "Selvagem",
      "motto": "A fera sob a pele",
      "color": "#b07a45",
      "nodes": [
       [
        "wolf",
        50,
        18
       ],
       [
        "leap",
        24,
        122
       ],
       [
        "wildHeart",
        76,
        122
       ],
       [
        "corteSangrento",
        16,
        226
       ],
       [
        "garraDeGelo",
        50,
        226
       ],
       [
        "howl",
        84,
        226
       ]
      ]
     },
     {
      "id": "passives",
      "name": "Passivas",
      "motto": "A paciência da floresta",
      "color": "#9a63c4",
      "nodes": [
       [
        "vitality",
        16,
        18
       ],
       [
        "sap",
        50,
        18
       ],
       [
        "wisdom",
        84,
        18
       ],
       [
        "attunement",
        50,
        122
       ]
      ]
     }
    ]
   }
  ],
  "nodes": {
   "spark": {
    "name": "Faísca",
    "description": "Raio instantâneo no primeiro inimigo da linha. O ataque básico já está disponível. +6% de dano por ponto. Sinergia de Tempestade: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "storm",
    "max": 5,
    "level": 1,
    "requires": [],
    "excludes": []
   },
   "chain": {
    "name": "Corrente de Raios",
    "description": "Libera a Corrente: o raio salta entre inimigos próximos. Cada ponto acrescenta um salto. Sinergia de Tempestade: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "storm",
    "max": 3,
    "level": 1,
    "requires": [
     "spark"
    ],
    "excludes": []
   },
   "storm": {
    "name": "Tempestade",
    "description": "Nuvem fixa no ponto mirado que derruba raios nos inimigos dentro da área por 4 s. Saia da área ou fique nela: os raios só caem ali. +10% do dano base por ponto depois do primeiro (até +40%). Sinergia de Tempestade: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "+10% do dano base por ponto depois do primeiro (até +40%)",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "storm",
    "max": 5,
    "level": 6,
    "requires": [
     "chain"
    ],
    "excludes": []
   },
   "roots": {
    "name": "Raízes",
    "description": "Libera as Raízes: espinhos brotam no ponto mirado e prendem os inimigos no lugar. Presos ainda atacam quem estiver ao alcance. +10% de dano e +0,3 s de prisão por ponto. Sinergia de Natureza: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "nature",
    "max": 3,
    "level": 1,
    "requires": [],
    "excludes": []
   },
   "thornbind": {
    "name": "Casca de Espinhos",
    "description": "Inimigos presos pelas Raízes recebem +10% de dano por ponto, de qualquer fonte. Sinergia de Natureza: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "",
    "icon": "",
    "effects": {},
    "type": "sinergia",
    "tree": "habilidades",
    "branch": "nature",
    "max": 3,
    "level": 4,
    "requires": [
     "roots"
    ],
    "excludes": []
   },
   "rejuvenate": {
    "name": "Rejuvenescer",
    "description": "Brotos curam 30% da vida máxima ao longo de 5 s. Só na forma humana; transformar-se não interrompe a cura. +5 pontos percentuais de cura por ponto depois do primeiro (30% a 50% da vida máxima). Sinergia de Natureza: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "+5 pontos percentuais de cura por ponto depois do primeiro (30% a 50% da vida máxima)",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "nature",
    "max": 5,
    "level": 6,
    "requires": [
     "roots"
    ],
    "excludes": []
   },
   "wolf": {
    "name": "Forma de Lobo",
    "description": "F: transforma em lobisomem. Garras corpo a corpo, 20% menos dano recebido e 35% mais movimento, mas sem magias. A forma consome mana e cada golpe de garra devolve 3. +8% de dano das garras por ponto. Sinergia de Selvagem: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "wild",
    "max": 3,
    "level": 1,
    "requires": [],
    "excludes": []
   },
   "leap": {
    "name": "Salto Feroz",
    "description": "Na forma de lobo (botão direito / 2): salta até 6 u e atinge a área de pouso. +10% do dano base por ponto depois do primeiro (até +40%). Sinergia de Selvagem: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "+10% do dano base por ponto depois do primeiro (até +40%)",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "wild",
    "max": 5,
    "level": 4,
    "requires": [
     "wolf"
    ],
    "excludes": []
   },
   "wildHeart": {
    "name": "Coração Selvagem",
    "description": "A forma de lobo consome 1 mana por segundo a menos por ponto (de 4/s para até 1/s). Sinergia de Selvagem: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "",
    "icon": "",
    "effects": {},
    "type": "aperfeiçoamento",
    "tree": "habilidades",
    "branch": "wild",
    "max": 3,
    "level": 6,
    "requires": [
     "wolf"
    ],
    "excludes": []
   },
   "howl": {
    "name": "Uivo",
    "description": "Na forma de lobo (3 / Q): inimigos em 6 u ficam 35% mais lentos por 3 s e as garras causam +25% de dano por 6 s. +5 pontos percentuais ao bônus de dano por ponto depois do primeiro (+25% a +45%). Sinergia de Selvagem: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "+5 pontos percentuais ao bônus de dano por ponto depois do primeiro (+25% a +45%)",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "wild",
    "max": 5,
    "level": 8,
    "requires": [
     "leap"
    ],
    "excludes": []
   },
   "vitality": {
    "name": "Vigor da floresta",
    "description": "+10% de vida máxima por ponto.",
    "perRank": "",
    "icon": "",
    "effects": {},
    "type": "passiva",
    "tree": "habilidades",
    "branch": "passives",
    "max": 5,
    "level": 1,
    "requires": [],
    "excludes": []
   },
   "wisdom": {
    "name": "Sabedoria antiga",
    "description": "+10% de mana máxima por ponto.",
    "perRank": "",
    "icon": "",
    "effects": {},
    "type": "passiva",
    "tree": "habilidades",
    "branch": "passives",
    "max": 5,
    "level": 1,
    "requires": [],
    "excludes": []
   },
   "sap": {
    "name": "Seiva",
    "description": "+0,4 de vida por segundo por ponto.",
    "perRank": "",
    "icon": "",
    "effects": {},
    "type": "passiva",
    "tree": "habilidades",
    "branch": "passives",
    "max": 5,
    "level": 1,
    "requires": [],
    "excludes": []
   },
   "attunement": {
    "name": "Afinidade",
    "description": "+8% de dano de magias e garras por ponto.",
    "perRank": "",
    "icon": "",
    "effects": {},
    "type": "passiva",
    "tree": "habilidades",
    "branch": "passives",
    "max": 5,
    "level": 1,
    "requires": [],
    "excludes": []
   },
   "turbilhao": {
    "name": "Turbilhão",
    "description": "Lança um turbilhão que avança 9 u em linha reta a 10 u/s, atravessando inimigos: 60% do dano em cada um (uma vez) e empurrão de 0,6 u para os lados. Para em paredes. +8% de dano por ponto. Sinergia de Tempestade: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "+8% de dano por ponto",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "storm",
    "max": 5,
    "level": 2,
    "requires": [],
    "excludes": []
   },
   "tornado": {
    "name": "Tornado",
    "description": "Ergue um tornado no ponto mirado, até 10 u. Por 4 s ele anda devagar (1,2 u/s) na direção da mira, puxa para o centro quem estiver a até 1,8 u (chefes não) e causa 25% do dano a cada 0,4 s. Para em paredes. +10% do dano base por ponto depois do primeiro (até +40%). Sinergia de Tempestade: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "+10% do dano base por ponto depois do primeiro (até +40%)",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "storm",
    "max": 5,
    "level": 6,
    "requires": [
     "turbilhao"
    ],
    "excludes": []
   },
   "furacao": {
    "name": "Furacão",
    "description": "O Tornado vira Furacão: raio 2,7 e 6 s de duração. Ao terminar, explode com 120% do dano em raio 2,7 e empurra os inimigos 1,5 u para fora. +10% do dano base do Tornado e da explosão por ponto depois do primeiro; soma com os ranks do Tornado. Sinergia de Tempestade: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "+10% do dano base do Tornado e da explosão por ponto depois do primeiro; soma com os ranks do Tornado",
    "icon": "",
    "effects": {},
    "type": "aperfeiçoamento",
    "tree": "habilidades",
    "branch": "storm",
    "max": 5,
    "level": 12,
    "requires": [
     "tornado"
    ],
    "excludes": []
   },
   "garraDeGelo": {
    "name": "Garra de Gelo",
    "description": "Na forma de lobo (T / 6): garra gelada em cone estreito, até 3 u, com 130% do dano. Os atingidos ficam 50% mais lentos por 2,5 s; chefes recebem só o dano. +10% do dano base por ponto depois do primeiro (até +40%). Sinergia de Selvagem: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "+10% do dano base por ponto depois do primeiro (até +40%)",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "wild",
    "max": 5,
    "level": 8,
    "requires": [
     "leap"
    ],
    "excludes": []
   },
   "corteSangrento": {
    "name": "Corte Sangrento",
    "description": "Na forma de lobo: golpe em semicírculo de 180° até 4,6 u com 90% do dano. Os atingidos sangram: 15% a cada 0,5 s por 4 s. Um novo corte renova, sem somar. +10% do dano do golpe e do sangramento por ponto depois do primeiro. Sinergia de Selvagem: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "+10% do dano do golpe e do sangramento por ponto depois do primeiro",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "wild",
    "max": 5,
    "level": 6,
    "requires": [
     "leap"
    ],
    "excludes": []
   },
   "plantaCarnivora": {
    "name": "Planta Carnívora",
    "description": "Usar Raízes faz nascer uma planta carnívora no ponto mirado por 8 s. Ela tem 60% da vida máxima da Druida, ataca até 4,5 u a cada 1,4 s com 45% do dano mágico e pode ser destruída. Só uma planta por vez; não ocupa slot adicional. +10% de vida e dano da planta por ponto depois do primeiro. Sinergia de Natureza: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "+10% de vida e dano da planta por ponto depois do primeiro",
    "icon": "",
    "effects": {},
    "type": "aperfeiçoamento",
    "tree": "habilidades",
    "branch": "nature",
    "max": 5,
    "level": 4,
    "requires": [
     "thornbind"
    ],
    "excludes": []
   },
   "lobo": {
    "name": "Lobo",
    "description": "Evoca um lobo permanente, sem limite de duração, com 65% da vida máxima e 45% do dano mágico da Druida por mordida, a cada 1 s. +10% de vida e dano por ponto depois do primeiro. Nova conjuração repõe apenas mortos ou vagas novas da Alcateia; não cura lobos vivos. Sinergia de Natureza: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "+10% de vida e dano depois do primeiro ponto",
    "icon": "",
    "effects": {},
    "type": "evocação",
    "tree": "habilidades",
    "branch": "nature",
    "max": 5,
    "level": 1,
    "requires": [],
    "excludes": []
   },
   "mordidaPesada": {
    "name": "Mordida Pesada",
    "description": "A cada 6 s, o próximo ataque de cada lobo vira uma Mordida Pesada automática: 180% do dano da mordida, mais 20 pontos percentuais por ponto depois do primeiro, até 220%. Sinergia de Natureza: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "+20 pontos percentuais depois do primeiro ponto",
    "icon": "",
    "effects": {},
    "type": "passiva",
    "tree": "habilidades",
    "branch": "nature",
    "max": 3,
    "level": 6,
    "requires": [
     "lobo"
    ],
    "excludes": []
   },
   "alcateia": {
    "name": "Alcateia",
    "description": "Aumenta em um lobo por ponto o limite da evocação, até quatro lobos. Conjure Lobo para preencher as vagas novas. Todos recebem Mordida Pesada quando aprendida. Sinergia de Natureza: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "+1 lobo (até quatro no total)",
    "icon": "",
    "effects": {},
    "type": "aperfeiçoamento",
    "tree": "habilidades",
    "branch": "nature",
    "max": 3,
    "level": 12,
    "requires": [
     "mordidaPesada"
    ],
    "excludes": []
   },
   "calamidade": {
    "name": "Calamidade",
    "description": "Cria um grande furacão de raio 4, até 10 u, que avança lentamente por 8 s. Vento causa 30% do dano mágico a cada 0,5 s e puxa inimigos comuns; a cada 1 s, raios causam 65% a até duas presas dentro da área. Chefes recebem dano sem serem puxados. Paredes bloqueiam o efeito. Recebe a sinergia de Tempestade.",
    "perRank": "",
    "icon": "⛈",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "storm",
    "max": 1,
    "level": 18,
    "requires": [
     "storm",
     "furacao"
    ],
    "excludes": []
   },
   "florestaTropical": {
    "name": "Floresta Tropical",
    "description": "Evoca cinco plantas carnívoras por 10 s numa área de raio 4,5, até 10 u. Cada uma usa os atributos de Planta Carnívora: 60% da vida máxima, 45% do dano mágico, alcance 4,5 u e ataque a cada 1,4 s, com os pontos e sinergias dela. Podem ser destruídas. Uma nova Floresta substitui as cinco anteriores; a planta das Raízes tem limite separado. Sem espaço para cinco plantas visíveis fora de paredes, não gasta mana nem recarga.",
    "perRank": "",
    "icon": "🌳",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "nature",
    "max": 1,
    "level": 16,
    "requires": [
     "plantaCarnivora"
    ],
    "excludes": []
   },
   "escudoDeFolhas": {
    "name": "Escudo de Folhas",
    "description": "Folhas, terra e madeira formam uma proteção por 8 s, absorvendo até 35% da vida máxima em dano depois das defesas. O excedente atinge a vida. Folhas se desprendem conforme a resistência cai, e a barra mostra a absorção restante. Nova conjuração substitui a proteção, sem acumular. Transformar-se mantém o escudo; morte e troca de cena encerram.",
    "perRank": "",
    "icon": "🍃",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "nature",
    "max": 1,
    "level": 6,
    "requires": [
     "rejuvenate"
    ],
    "excludes": []
   },
   "liderDaMatilha": {
    "name": "Líder da Matilha",
    "description": "O lobo vivo de menor posição da alcateia torna-se o líder: maior, com anel dourado e +30% de dano. A ação marca por 6 s uma presa visível próxima da mira, até 12 u, e toda a alcateia passa a persegui-la. O primeiro ataque do líder nessa caçada usa garras de 160% do dano dele. Mantém alcance, deslocamento e recargas normais dos lobos; não teleporta nem ressuscita. Sem lobo vivo ou presa válida, não gasta mana nem recarga. Se o líder morrer, outro lobo vivo assume.",
    "perRank": "",
    "icon": "🐺",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "nature",
    "max": 1,
    "level": 12,
    "requires": [
     "alcateia"
    ],
    "excludes": []
   }
  }
 },
 "archer": {
  "name": "Arqueira",
  "resource": "foco",
  "trees": [
   {
    "id": "habilidades",
    "name": "Habilidades",
    "branches": [
     {
      "id": "bow",
      "name": "Arco",
      "motto": "Cada flecha conta",
      "color": "#8fbf5a",
      "nodes": [
       [
        "shot",
        50,
        18
       ],
       [
        "fan",
        16,
        122
       ],
       [
        "pierce",
        50,
        122
       ],
       [
        "fechadefogo",
        84,
        122
       ],
       [
        "saraivadaSeguidora",
        16,
        226
       ],
       [
        "rain",
        50,
        226
       ],
       [
        "flechaExplosiva",
        84,
        226
       ],
       [
        "saraivadaMultipla",
        16,
        330
       ],
       [
        "disparoPreciso",
        50,
        330
       ],
       [
        "chuvaDeFlechasExplosivas",
        84,
        330
       ]
      ]
     },
     {
      "id": "hunt",
      "name": "Caça",
      "motto": "Nunca onde esperam",
      "color": "#c49a52",
      "nodes": [
       [
        "leap",
        24,
        18
       ],
       [
        "falcon",
        76,
        18
       ],
       [
        "ambush",
        16,
        122
       ],
       [
        "impactoCeleste",
        50,
        122
       ],
       [
        "penasVoadoras",
        84,
        122
       ],
       [
        "marcaDoCacador",
        50,
        226
       ],
       [
        "emboscadaEmDupla",
        16,
        330
       ],
       [
        "impactoFeroz",
        50,
        330
       ],
       [
        "rasanteRelampago",
        84,
        330
       ]
      ]
     },
     {
      "id": "passives",
      "name": "Passivas",
      "motto": "Olho firme, passo leve",
      "color": "#9a63c4",
      "nodes": [
       [
        "precision",
        16,
        18
       ],
       [
        "focus",
        50,
        18
       ],
       [
        "regeneration",
        84,
        18
       ],
       [
        "vitality",
        24,
        122
       ],
       [
        "swift",
        76,
        122
       ]
      ]
     }
    ]
   }
  ],
  "nodes": {
   "shot": {
    "name": "Disparo",
    "description": "+6% de dano do Disparo por ponto. O ataque básico já está disponível. Sinergia de Arco: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "bow",
    "max": 5,
    "level": 1,
    "requires": [],
    "excludes": []
   },
   "pierce": {
    "name": "Flecha Perfurante",
    "description": "Libera a Flecha Perfurante: carrega 0,55 s, andando a metade da velocidade, e atravessa todos os inimigos da linha, com 200% do dano. +10% de dano por ponto. Sinergia de Arco: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "bow",
    "max": 3,
    "level": 1,
    "requires": [
     "shot"
    ],
    "excludes": []
   },
   "fan": {
    "name": "Tiro Seguidor",
    "description": "Cinco flechas em cone de 50°, com 70% do dano cada. Cada flecha curva em direção ao inimigo mais próximo à frente dela, até 6 u. Bom contra grupos espalhados. +10% do dano base por ponto depois do primeiro (até +40%). Sinergia de Arco: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "+10% do dano base por ponto depois do primeiro (até +40%)",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "bow",
    "max": 5,
    "level": 4,
    "requires": [
     "shot"
    ],
    "excludes": []
   },
   "rain": {
    "name": "Chuva de Flechas",
    "description": "Marca uma área de raio 3 no ponto mirado, até 12 u. Depois de 0,7 s caem cinco ondas, uma a cada 0,4 s, com 45% do dano em quem estiver dentro. +10% do dano base por ponto depois do primeiro (até +40%). Sinergia de Arco: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo. O raio cresce 0,3 u por ponto depois do primeiro: de 3 a 4,2 u.",
    "perRank": "+10% do dano base e +0,3 u de raio por ponto depois do primeiro",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "bow",
    "max": 5,
    "level": 12,
    "requires": [
     "pierce"
    ],
    "excludes": []
   },
   "leap": {
    "name": "Recuo",
    "description": "Libera o Recuo: salto de 5 u para trás, de frente para a mira. Inimigos a até 2,5 u do ponto de partida ficam 35% mais lentos por 2 s. −0,5 s de recarga por ponto. Sinergia de Caça: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "hunt",
    "max": 3,
    "level": 1,
    "requires": [],
    "excludes": []
   },
   "falcon": {
    "name": "Falcão",
    "description": "Um falcão acompanha a Arqueira. A cada 2,5 s ele mergulha no inimigo mais próximo dela, até 8 u, com 35% do dano. F: manda o falcão ao inimigo mais perto da mira (até 3,5 u da mira e 14 u de você), com 120% do dano; o alvo fica marcado por 4 s e recebe +15% de dano das flechas. Recarga de 8 s, 10 foco. +10% de dano do falcão por ponto. Sinergia de Caça: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "hunt",
    "max": 3,
    "level": 2,
    "requires": [],
    "excludes": []
   },
   "ambush": {
    "name": "Tiro de Emboscada",
    "description": "Depois do Recuo, o próximo Disparo, Flecha Perfurante ou Tiro Seguidor em até 3 s causa +15% de dano por ponto. Sinergia de Caça: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "",
    "icon": "",
    "effects": {},
    "type": "sinergia",
    "tree": "habilidades",
    "branch": "hunt",
    "max": 3,
    "level": 6,
    "requires": [
     "leap"
    ],
    "excludes": []
   },
   "precision": {
    "name": "Precisão",
    "description": "+8% de dano por ponto.",
    "perRank": "",
    "icon": "",
    "effects": {},
    "type": "passiva",
    "tree": "habilidades",
    "branch": "passives",
    "max": 5,
    "level": 1,
    "requires": [],
    "excludes": []
   },
   "vitality": {
    "name": "Vitalidade",
    "description": "+10% de vida máxima por ponto.",
    "perRank": "",
    "icon": "",
    "effects": {},
    "type": "passiva",
    "tree": "habilidades",
    "branch": "passives",
    "max": 5,
    "level": 1,
    "requires": [],
    "excludes": []
   },
   "focus": {
    "name": "Concentração",
    "description": "+10% de foco máximo por ponto.",
    "perRank": "",
    "icon": "",
    "effects": {},
    "type": "passiva",
    "tree": "habilidades",
    "branch": "passives",
    "max": 5,
    "level": 1,
    "requires": [],
    "excludes": []
   },
   "swift": {
    "name": "Passo leve",
    "description": "+3% de movimento por ponto.",
    "perRank": "",
    "icon": "",
    "effects": {},
    "type": "passiva",
    "tree": "habilidades",
    "branch": "passives",
    "max": 5,
    "level": 1,
    "requires": [],
    "excludes": []
   },
   "regeneration": {
    "name": "Fôlego",
    "description": "+0,4 de vida por segundo por ponto.",
    "perRank": "",
    "icon": "",
    "effects": {},
    "type": "passiva",
    "tree": "habilidades",
    "branch": "passives",
    "max": 5,
    "level": 1,
    "requires": [],
    "excludes": []
   },
   "saraivadaSeguidora": {
    "name": "Saraivada Seguidora",
    "description": "Trava no inimigo mais perto da mira (até 3,5 u dela e 13 u de você) e dispara cinco flechas em sequência, uma a cada 0,12 s, que perseguem esse alvo, com 45% do dano cada. Se ele cair, as restantes buscam o inimigo mais próximo. +10% do dano base por ponto depois do primeiro (até +40%). Sinergia de Arco: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "+10% do dano base por ponto depois do primeiro (até +40%)",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "bow",
    "max": 5,
    "level": 12,
    "requires": [
     "fan"
    ],
    "excludes": []
   },
   "impactoCeleste": {
    "name": "Impacto Celeste",
    "description": "Marca uma área de raio 4,5 no ponto mirado, até 12 u. O falcão mergulha e, após 0,9 s, causa 150% do dano e empurra 1 u. Durante o mergulho, não ataca nem lança penas. +10% do dano base por ponto depois do primeiro (até +40%). Sinergia de Caça: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "+10% do dano base por ponto depois do primeiro (até +40%)",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "hunt",
    "max": 5,
    "level": 8,
    "requires": [
     "falcon"
    ],
    "excludes": []
   },
   "penasVoadoras": {
    "name": "Penas Voadoras",
    "description": "Passiva do falcão: a cada 7 s com inimigos visíveis até 8 u da Arqueira, lança seis penas de 40% do dano, uma por alvo. Penas restantes seguem a mira. Sem custo e sem slot; espera o Impacto Celeste terminar. +10% do dano base por ponto depois do primeiro (até +40%). Sinergia de Caça: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "+10% do dano base por ponto depois do primeiro (até +40%)",
    "icon": "",
    "effects": {},
    "type": "passiva",
    "tree": "habilidades",
    "branch": "hunt",
    "max": 5,
    "level": 4,
    "requires": [
     "falcon"
    ],
    "excludes": []
   },
   "fechadefogo": {
    "name": "Flecha de Fogo",
    "description": "Dispara uma flecha com 100% do dano, alcance 13 u. O alvo queima por 4 s: 15% do dano a cada 0,5 s. Renovar não acumula queimaduras. +10% do dano do impacto e da queimadura por ponto depois do primeiro. Sinergia de Arco: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "+10% do dano do impacto e da queimadura por ponto depois do primeiro",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "bow",
    "max": 5,
    "level": 4,
    "requires": [
     "shot"
    ],
    "excludes": []
   },
   "flechaExplosiva": {
    "name": "Flecha Explosiva",
    "description": "Dispara uma flecha que explode ao tocar um inimigo, parede ou fim do alcance: 160% do dano em raio 2,5, até 13 u. Não deixa queimadura. +10% do dano base por ponto depois do primeiro (até +40%). Sinergia de Arco: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "+10% do dano base por ponto depois do primeiro (até +40%)",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "bow",
    "max": 5,
    "level": 12,
    "requires": [
     "fechadefogo"
    ],
    "excludes": []
   },
   "emboscadaEmDupla": {
    "name": "Emboscada em Dupla",
    "description": "O primeiro acerto do tiro fortalecido por Tiro de Emboscada chama um Impacto Celeste gratuito no ponto atingido, se o falcão estiver livre. Uma ativação por Recuo; o bônus de Emboscada original continua valendo, sem duplicação. +10% do dano desse Impacto por ponto depois do primeiro.",
    "perRank": "+10% do dano do Impacto automático por ponto depois do primeiro",
    "icon": "",
    "effects": {},
    "type": "sinergia",
    "tree": "habilidades",
    "branch": "hunt",
    "max": 5,
    "level": 12,
    "requires": [
     "ambush",
     "impactoCeleste"
    ],
    "excludes": []
   },
   "impactoFeroz": {
    "name": "Impacto Feroz",
    "description": "Após o Impacto Celeste, libera três rajadas circulares de seis penas cada, espaçadas por 0,2 s. Cada pena usa o dano de Penas Voadoras, fortalecido em +10% por ponto depois do primeiro neste aperfeiçoamento. Não chama novos Impactos.",
    "perRank": "+10% do dano das penas das rajadas por ponto depois do primeiro",
    "icon": "",
    "effects": {},
    "type": "aperfeiçoamento",
    "tree": "habilidades",
    "branch": "hunt",
    "max": 5,
    "level": 12,
    "requires": [
     "impactoCeleste",
     "penasVoadoras"
    ],
    "excludes": []
   },
   "chuvaDeFlechasExplosivas": {
    "name": "Chuva de Flechas Explosivas",
    "description": "Cinco ondas explosivas de 55% do dano em raio 3,6, mais 0,3 u por ponto de Chuva depois do primeiro (até 4,8 u). Cada onda renova um único campo de fogo até 2 s depois dela, com 30% do dano de uma onda a cada 0,5 s. Compartilha recarga e escala de dano com Chuva de Flechas.",
    "perRank": "",
    "icon": "",
    "effects": {},
    "type": "variante",
    "tree": "habilidades",
    "branch": "bow",
    "max": 1,
    "level": 20,
    "requires": [
     "rain",
     "flechaExplosiva"
    ],
    "excludes": []
   },
   "saraivadaMultipla": {
    "name": "Saraivada Múltipla",
    "description": "Seleciona até cinco inimigos visíveis perto da mira e dispara cinco ondas, com uma flecha por alvo em cada onda: até 25 flechas de 45% do dano. Um alvo sozinho recebe cinco. Sequências de alvos mortos podem passar para inimigos ainda não selecionados. Compartilha recarga com Saraivada Seguidora e usa seus pontos para dano.",
    "perRank": "",
    "icon": "",
    "effects": {},
    "type": "variante",
    "tree": "habilidades",
    "branch": "bow",
    "max": 1,
    "level": 12,
    "requires": [
     "saraivadaSeguidora"
    ],
    "excludes": []
   },
   "disparoPreciso": {
    "name": "Disparo Preciso",
    "description": "Prepara por 1,2 s, andando a 20% da velocidade, e lança uma flecha muito rápida de 500% do dano, alcance 24 u. Para no primeiro inimigo ou parede. Esquiva cancela a preparação, mantendo custo e recarga. +10% de dano por ponto depois do primeiro.",
    "perRank": "+10% do dano base por ponto depois do primeiro",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "bow",
    "max": 5,
    "level": 12,
    "requires": [
     "pierce"
    ],
    "excludes": []
   },
   "marcaDoCacador": {
    "name": "Marca do Caçador",
    "description": "Evolui o comando F: marca imediatamente uma presa visível por 8 s. Ela recebe +20% de todo dano e vira prioridade dos mergulhos automáticos do falcão enquanto estiver visível e até 8 u da Arqueira. Só uma marca; trocar de presa remove a anterior. O comando mantém seu mergulho e passa a ter 12 s de recarga. Não acumula com a marca antiga.",
    "perRank": "",
    "icon": "",
    "effects": {},
    "type": "aperfeiçoamento",
    "tree": "habilidades",
    "branch": "hunt",
    "max": 1,
    "level": 6,
    "requires": [
     "falcon"
    ],
    "excludes": []
   },
   "rasanteRelampago": {
    "name": "Rasante Relâmpago",
    "description": "O falcão executa seis rasantes em 1,5 s numa área de raio 4,5, até 12 u. Cada passagem causa 65% do dano a uma presa; prioriza a Marca do Caçador, depois inimigos ainda não atingidos. Pode repetir alvos. Durante os rasantes não usa comando F, Impacto Celeste, mergulhos automáticos nem Penas Voadoras. +10% de dano por ponto depois do primeiro.",
    "perRank": "+10% do dano base por ponto depois do primeiro",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "hunt",
    "max": 5,
    "level": 12,
    "requires": [
     "falcon"
    ],
    "excludes": []
   }
  }
 },
 "mercenary": {
  "name": "Mercenário",
  "resource": "vigor",
  "trees": [
   {
    "id": "habilidades",
    "name": "Habilidades",
    "branches": [
     {
      "id": "crossbow",
      "name": "Besta",
      "motto": "Peso e alcance",
      "color": "#c98a4a",
      "nodes": [
       [
        "quarrel",
        24,
        18
       ],
       [
        "volley",
        76,
        18
       ],
       [
        "breach",
        50,
        122
       ]
      ]
     },
     {
      "id": "powder",
      "name": "Pólvora e Armadilhas",
      "motto": "Pavio curto, problema longo",
      "color": "#d9622b",
      "nodes": [
       [
        "bomb",
        24,
        18
       ],
       [
        "redeDeCaca",
        76,
        18
       ],
       [
        "shrapnel",
        16,
        122
       ],
       [
        "firebomb",
        50,
        122
       ],
       [
        "mine",
        84,
        122
       ],
       [
        "armadilhaDeUrso",
        50,
        226
       ]
      ]
     },
     {
      "id": "passives",
      "name": "Passivas",
      "motto": "Contrato cumprido, couro inteiro",
      "color": "#9a63c4",
      "nodes": [
       [
        "caliber",
        16,
        18
       ],
       [
        "armor",
        50,
        18
       ],
       [
        "regeneration",
        84,
        18
       ],
       [
        "vitality",
        24,
        122
       ],
       [
        "stamina",
        76,
        122
       ]
      ]
     }
    ]
   }
  ],
  "nodes": {
   "quarrel": {
    "name": "Virote pesado",
    "description": "+6% de dano do Virote pesado por ponto. O ataque básico já está disponível. Sinergia de Besta: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "crossbow",
    "max": 5,
    "level": 1,
    "requires": [],
    "excludes": []
   },
   "volley": {
    "name": "Rajada",
    "description": "Libera a Rajada: três virotes em sequência, a cada 0,15 s, com 70% do dano cada e atravessando um inimigo. +10% de dano por ponto. Sinergia de Besta: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "crossbow",
    "max": 3,
    "level": 1,
    "requires": [],
    "excludes": []
   },
   "breach": {
    "name": "Perfuração",
    "description": "O Virote pesado atravessa +1 inimigo por ponto, ainda perdendo 25% a cada um. Sinergia de Besta: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "",
    "icon": "",
    "effects": {},
    "type": "sinergia",
    "tree": "habilidades",
    "branch": "crossbow",
    "max": 2,
    "level": 6,
    "requires": [
     "quarrel"
    ],
    "excludes": []
   },
   "bomb": {
    "name": "Bomba de fragmentação",
    "description": "Libera a Bomba: arremesso em arco até 9 u. O ponto de queda fica marcado no chão durante o voo; ao cair, explode em raio 2,6 com 160% do dano e empurra 1 u. +10% de dano por ponto. Sinergia de Pólvora e Armadilhas: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "powder",
    "max": 3,
    "level": 1,
    "requires": [],
    "excludes": []
   },
   "shrapnel": {
    "name": "Estilhaços",
    "description": "+12% de raio da Bomba e da Mina por ponto. Sinergia de Pólvora e Armadilhas: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "",
    "icon": "",
    "effects": {},
    "type": "sinergia",
    "tree": "habilidades",
    "branch": "powder",
    "max": 3,
    "level": 6,
    "requires": [
     "bomb"
    ],
    "excludes": []
   },
   "mine": {
    "name": "Mina de pólvora",
    "description": "Assenta uma mina aos pés. Arma em 1 s; um inimigo até 1,4 u dispara uma explosão de raio 6 com 220% do dano. Até duas minas, cada uma dura 25 s. Estilhaços também amplia o raio. +10% do dano base por ponto depois do primeiro (até +40%). Sinergia de Pólvora e Armadilhas: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "+10% do dano base por ponto depois do primeiro (até +40%)",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "powder",
    "max": 5,
    "level": 6,
    "requires": [
     "bomb"
    ],
    "excludes": []
   },
   "firebomb": {
    "name": "Molotov",
    "description": "Arremesso em arco até 9 u que incendeia o chão em raio 2,4 por 4 s. A cada 0,5 s, 30% do dano em quem estiver dentro. +10% do dano base por ponto depois do primeiro (até +40%). Sinergia de Pólvora e Armadilhas: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "+10% do dano base por ponto depois do primeiro (até +40%)",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "powder",
    "max": 5,
    "level": 6,
    "requires": [
     "bomb"
    ],
    "excludes": []
   },
   "caliber": {
    "name": "Calibre",
    "description": "+8% de dano por ponto.",
    "perRank": "",
    "icon": "",
    "effects": {},
    "type": "passiva",
    "tree": "habilidades",
    "branch": "passives",
    "max": 5,
    "level": 1,
    "requires": [],
    "excludes": []
   },
   "vitality": {
    "name": "Couro curtido",
    "description": "+10% de vida máxima por ponto.",
    "perRank": "",
    "icon": "",
    "effects": {},
    "type": "passiva",
    "tree": "habilidades",
    "branch": "passives",
    "max": 5,
    "level": 1,
    "requires": [],
    "excludes": []
   },
   "armor": {
    "name": "Gibão reforçado",
    "description": "+4 de armadura por ponto.",
    "perRank": "",
    "icon": "",
    "effects": {},
    "type": "passiva",
    "tree": "habilidades",
    "branch": "passives",
    "max": 5,
    "level": 1,
    "requires": [],
    "excludes": []
   },
   "stamina": {
    "name": "Resistência",
    "description": "+10% de vigor máximo por ponto.",
    "perRank": "",
    "icon": "",
    "effects": {},
    "type": "passiva",
    "tree": "habilidades",
    "branch": "passives",
    "max": 5,
    "level": 1,
    "requires": [],
    "excludes": []
   },
   "regeneration": {
    "name": "Fôlego",
    "description": "+0,4 de vida por segundo por ponto.",
    "perRank": "",
    "icon": "",
    "effects": {},
    "type": "passiva",
    "tree": "habilidades",
    "branch": "passives",
    "max": 5,
    "level": 1,
    "requires": [],
    "excludes": []
   },
   "redeDeCaca": {
    "name": "Rede de Caça",
    "description": "Arremesso em arco até 9 u. O ponto de queda fica marcado no chão; a rede cobre raio 2,4, causa 30% do dano e deixa os inimigos 50% mais lentos por 3 s (+0,5 s por ponto depois do primeiro). Chefes recebem o dano, mas não ficam lentos. Sinergia de Pólvora e Armadilhas: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "+0,5 s de lentidão por ponto depois do primeiro",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "powder",
    "max": 3,
    "level": 2,
    "requires": [],
    "excludes": []
   },
   "armadilhaDeUrso": {
    "name": "Armadilha de Urso",
    "description": "Assenta uma armadilha aos seus pés. Arma em 0,6 s e fecha quando um inimigo chega a 0,9 u: 120% do dano e o prende por 2 s (chefes ficam 50% mais lentos). Até duas armadilhas; cada uma dura 30 s. +10% do dano base por ponto depois do primeiro (até +40%). Sinergia de Pólvora e Armadilhas: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "+10% do dano base por ponto depois do primeiro (até +40%)",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "powder",
    "max": 5,
    "level": 6,
    "requires": [
     "redeDeCaca"
    ],
    "excludes": []
   }
  }
 },
 "mage": {
  "name": "Mago",
  "resource": "mana",
  "trees": [
   {
    "id": "habilidades",
    "name": "Habilidades",
    "branches": [
     {
      "id": "fire",
      "name": "Fogo",
      "motto": "Rápido e sem perdão",
      "color": "#e0603a",
      "nodes": [
       [
        "fireball",
        50,
        18
       ],
       [
        "combustion",
        24,
        122
       ],
       [
        "firewall",
        76,
        122
       ],
       [
        "imbuirFogo",
        24,
        226
       ],
       [
        "meteor",
        76,
        226
       ],
       [
        "familiarDeFogo",
        24,
        330
       ],
       [
        "chuvaDeFogo",
        76,
        330
       ]
      ]
     },
     {
      "id": "frost",
      "name": "Gelo",
      "motto": "Devagar, para sempre",
      "color": "#6fb8e0",
      "nodes": [
       [
        "frost",
        50,
        18
       ],
       [
        "icenova",
        24,
        122
       ],
       [
        "esferaDeGelo",
        76,
        122
       ],
       [
        "imbuirGelo",
        24,
        226
       ],
       [
        "golemDeGelo",
        76,
        226
       ],
       [
        "shatter",
        24,
        330
       ],
       [
        "avalanche",
        76,
        330
       ]
      ]
     },
     {
      "id": "arcane",
      "name": "Arcano",
      "motto": "O caminho mais curto",
      "color": "#9a72e0",
      "nodes": [
       [
        "bolt",
        24,
        18
       ],
       [
        "blink",
        76,
        18
       ],
       [
        "setasPerseguidoras",
        24,
        122
       ],
       [
        "echo",
        76,
        122
       ],
       [
        "lazerArcano",
        24,
        226
       ],
       [
        "escudoArcano",
        76,
        226
       ],
       [
        "bigBang",
        24,
        330
       ],
       [
        "clone",
        76,
        330
       ]
      ]
     },
     {
      "id": "passives",
      "name": "Passivas",
      "motto": "Estudo e paciência",
      "color": "#9a63c4",
      "nodes": [
       [
        "intellect",
        24,
        18
       ],
       [
        "vitality",
        76,
        18
       ],
       [
        "wisdom",
        24,
        122
       ],
       [
        "meditation",
        76,
        122
       ],
       [
        "regeneration",
        50,
        226
       ]
      ]
     }
    ]
   }
  ],
  "nodes": {
   "fireball": {
    "name": "Bola de Fogo",
    "description": "Libera a Bola de Fogo: explode ao tocar o primeiro inimigo, uma parede ou o fim do alcance, em raio 2,2, com 140% do dano. +10% de dano por ponto. Sinergia de Fogo: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "fire",
    "max": 3,
    "level": 1,
    "requires": [],
    "excludes": []
   },
   "combustion": {
    "name": "Combustão",
    "description": "A explosão da Bola de Fogo deixa o chão em chamas (raio 2), com 25% do dano a cada 0,5 s. Dura 1 s com 1 ponto e +0,5 s por ponto seguinte, até 3 s. Sinergia de Fogo: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "+0,5 s de chão em chamas (1 s no primeiro ponto)",
    "icon": "",
    "effects": {},
    "type": "sinergia",
    "tree": "habilidades",
    "branch": "fire",
    "max": 5,
    "level": 4,
    "requires": [
     "fireball"
    ],
    "excludes": []
   },
   "firewall": {
    "name": "Muralha de Fogo",
    "description": "Ergue uma muralha de chamas de 6 u, atravessada na direção da mira, no ponto mirado (até 10 u), por 5 s. Quem a atravessa ou fica nela recebe 30% do dano a cada 0,5 s e sai queimando: 10% do dano a cada 0,5 s por 2 s. Não bloqueia a passagem. Sinergia de Fogo: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "+10% de dano e +0,5 s de duração (a partir do segundo ponto)",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "fire",
    "max": 5,
    "level": 6,
    "requires": [
     "fireball"
    ],
    "excludes": []
   },
   "meteor": {
    "name": "Meteoro",
    "description": "Marca uma área de raio 2,8 no ponto mirado, até 12 u. Uma bola de fogo cai do céu e, depois de 1 s, causa 320% do dano em quem estiver dentro. O chão fica em chamas por 3 s (raio 2,4): 20% do dano a cada 0,5 s. Sinergia de Fogo: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "+10% de dano no impacto e no chão em chamas (a partir do segundo ponto)",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "fire",
    "max": 5,
    "level": 12,
    "requires": [
     "firewall"
    ],
    "excludes": []
   },
   "frost": {
    "name": "Rajada de Gelo",
    "description": "Libera a Rajada de Gelo: cone de 70° e 6 u à frente, com 110% do dano, que deixa os inimigos 40% mais lentos por 3 s. +10% de dano por ponto. Sinergia de Gelo: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "+10% de dano",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "frost",
    "max": 5,
    "level": 1,
    "requires": [],
    "excludes": []
   },
   "icenova": {
    "name": "Nova de Gelo",
    "description": "Variante da Rajada de Gelo: em vez do cone de 70° e 6 u, uma onda em volta do Mago, em raio 4,5, com 90% do dano e a mesma lentidão de 40% por 3 s. Custa 25 mana, recarrega em 8 s e divide a recarga com a Rajada.",
    "perRank": "Desbloqueio de variante; dano escala pelos pontos de Rajada de Gelo (+10% por ponto)",
    "icon": "",
    "effects": {},
    "type": "variante",
    "tree": "habilidades",
    "branch": "frost",
    "max": 1,
    "level": 6,
    "requires": [
     "frost"
    ],
    "excludes": []
   },
   "imbuirGelo": {
    "name": "Imbuir Gelo",
    "description": "Por 12 s, a Seta Arcana vira gelo: soma 15% do dano como gelo e deixa o alvo 25% mais lento por 1,5 s (conta para o Estilhaçar; chefes não ficam lentos). Usar Imbuir Fogo encerra este efeito. Sinergia de Gelo: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "+5% de dano de gelo na Seta e +1 s de duração (a partir do segundo ponto)",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "frost",
    "max": 5,
    "level": 8,
    "requires": [
     "icenova"
    ],
    "excludes": []
   },
   "shatter": {
    "name": "Estilhaçar",
    "description": "Inimigos lentos pelo gelo do Mago (Rajada, Nova, cristais da Esfera, Imbuir Gelo e Avalanche) recebem +6% por ponto do dano de fogo e arcano. Sinergia de Gelo: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "+6% de dano de fogo e arcano em inimigos lentos pelo gelo",
    "icon": "",
    "effects": {},
    "type": "sinergia",
    "tree": "habilidades",
    "branch": "frost",
    "max": 5,
    "level": 12,
    "requires": [
     "imbuirGelo"
    ],
    "excludes": []
   },
   "bolt": {
    "name": "Seta Arcana",
    "description": "+6% de dano da Seta Arcana por ponto. O ataque básico já está disponível. Sinergia de Arcano: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "arcane",
    "max": 5,
    "level": 1,
    "requires": [],
    "excludes": []
   },
   "blink": {
    "name": "Teleporte",
    "description": "Libera o Teleporte: salta até 7 u na direção da mira, sem atravessar paredes, e deixa no ponto de partida um eco arcano de raio 2,2 com 50% do dano. −1 s de recarga por ponto. Sinergia de Arcano: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "arcane",
    "max": 3,
    "level": 1,
    "requires": [],
    "excludes": []
   },
   "echo": {
    "name": "Eco Arcano",
    "description": "+25% de dano do eco do Teleporte por ponto. Sinergia de Arcano: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "",
    "icon": "",
    "effects": {},
    "type": "sinergia",
    "tree": "habilidades",
    "branch": "arcane",
    "max": 3,
    "level": 4,
    "requires": [
     "blink"
    ],
    "excludes": []
   },
   "intellect": {
    "name": "Intelecto",
    "description": "+8% de dano mágico por ponto.",
    "perRank": "",
    "icon": "",
    "effects": {},
    "type": "passiva",
    "tree": "habilidades",
    "branch": "passives",
    "max": 5,
    "level": 1,
    "requires": [],
    "excludes": []
   },
   "vitality": {
    "name": "Vitalidade",
    "description": "+10% de vida máxima por ponto.",
    "perRank": "",
    "icon": "",
    "effects": {},
    "type": "passiva",
    "tree": "habilidades",
    "branch": "passives",
    "max": 5,
    "level": 1,
    "requires": [],
    "excludes": []
   },
   "wisdom": {
    "name": "Sabedoria",
    "description": "+10% de mana máxima por ponto.",
    "perRank": "",
    "icon": "",
    "effects": {},
    "type": "passiva",
    "tree": "habilidades",
    "branch": "passives",
    "max": 5,
    "level": 1,
    "requires": [],
    "excludes": []
   },
   "meditation": {
    "name": "Meditação",
    "description": "+15% de regeneração de mana por ponto.",
    "perRank": "",
    "icon": "",
    "effects": {},
    "type": "passiva",
    "tree": "habilidades",
    "branch": "passives",
    "max": 5,
    "level": 1,
    "requires": [],
    "excludes": []
   },
   "regeneration": {
    "name": "Fôlego",
    "description": "+0,4 de vida por segundo por ponto.",
    "perRank": "",
    "icon": "",
    "effects": {},
    "type": "passiva",
    "tree": "habilidades",
    "branch": "passives",
    "max": 5,
    "level": 1,
    "requires": [],
    "excludes": []
   },
   "setasPerseguidoras": {
    "name": "Setas Perseguidoras",
    "description": "Cinco setas arcanas em leque de 70°, com 40% do dano cada. Cada seta vira até 6 rad/s em direção ao inimigo mais próximo à frente dela, até 7 u. Sinergia de Arcano: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "+10% de dano por seta (a partir do segundo ponto)",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "arcane",
    "max": 5,
    "level": 4,
    "requires": [
     "bolt"
    ],
    "excludes": []
   },
   "esferaDeGelo": {
    "name": "Esfera de Gelo",
    "description": "Lança um pequeno planeta de gelo com anéis, que atravessa o campo bem devagar (2 u/s) por até 10 u e para em paredes. Fere uma vez quem toca (50%) e, girando, solta dois cristais opostos a cada 0,15 s em espiral; os cristais curvam para inimigos a até 3 u, com 20% do dano e 20% de lentidão por 1 s (conta para o Estilhaçar). Sinergia de Gelo: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "+10% de dano no contato e nos cristais (a partir do segundo ponto)",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "frost",
    "max": 5,
    "level": 6,
    "requires": [
     "frost"
    ],
    "excludes": []
   },
   "imbuirFogo": {
    "name": "Imbuir Fogo",
    "description": "Por 12 s, a Seta Arcana vira fogo: soma 20% do dano como fogo e deixa o alvo queimando (10% do dano a cada 0,5 s por 2 s, sem acumular). Usar Imbuir Gelo encerra este efeito. Sinergia de Fogo: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "+5% de dano de fogo na Seta e +1 s de duração (a partir do segundo ponto)",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "fire",
    "max": 5,
    "level": 8,
    "requires": [
     "combustion"
    ],
    "excludes": []
   },
   "familiarDeFogo": {
    "name": "Familiar de Fogo",
    "description": "Invoca um espírito de fogo que acompanha o Mago por 20 s. A cada 1,2 s ele lança uma pequena bola de fogo no inimigo mais próximo do Mago, até 9 u, com 40% do dano e explosão de raio 1,2 (com a Combustão, o chão também queima). Lançar de novo renova o espírito. Sinergia de Fogo: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "+10% de dano das bolas de fogo (a partir do segundo ponto)",
    "icon": "",
    "effects": {},
    "type": "evocação",
    "tree": "habilidades",
    "branch": "fire",
    "max": 5,
    "level": 16,
    "requires": [
     "imbuirFogo"
    ],
    "excludes": []
   },
   "golemDeGelo": {
    "name": "Golem de Gelo",
    "description": "Invoca um golem de gelo ao lado do Mago por 25 s. Ele tem 120% da vida máxima do Mago, avança no inimigo mais próximo e golpeia a cada 1,4 s com 70% do dano mágico, deixando o alvo 30% mais lento por 1,5 s. Inimigos perto dele passam a atacá-lo. Só um golem por vez. Sinergia de Gelo: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "+10% de vida e de dano do golem (a partir do segundo ponto)",
    "icon": "",
    "effects": {},
    "type": "evocação",
    "tree": "habilidades",
    "branch": "frost",
    "max": 5,
    "level": 10,
    "requires": [
     "esferaDeGelo"
    ],
    "excludes": []
   },
   "chuvaDeFogo": {
    "name": "Chuva de Fogo",
    "description": "Variante do Meteoro: em vez de uma queda de 320%, a área marcada cresce para raio 4,5 e recebe 5 meteoros menores, um a cada 0,3 s, em pontos aleatórios. Cada um causa 130% do dano em raio 1,8 e deixa o chão em chamas por 1,5 s. Custa 55 mana, recarrega em 8 s e divide a recarga com o Meteoro.",
    "perRank": "Desbloqueio de variante; dano escala pelos pontos de Meteoro (+10% por ponto depois do primeiro)",
    "icon": "",
    "effects": {},
    "type": "variante",
    "tree": "habilidades",
    "branch": "fire",
    "max": 1,
    "level": 20,
    "requires": [
     "meteor"
    ],
    "excludes": []
   },
   "avalanche": {
    "name": "Avalanche",
    "description": "Marca uma área de raio 5 no ponto mirado (até 12 u). Durante 3 s caem 10 bolas de neve em pontos aleatórios dentro dela; cada uma causa 80% do dano em raio 1,4 e deixa 30% mais lento por 2 s (conta para o Estilhaçar; chefes não ficam lentos). Sinergia de Gelo: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "+1 bola de neve (a partir do segundo ponto, até 14)",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "frost",
    "max": 5,
    "level": 20,
    "requires": [
     "golemDeGelo"
    ],
    "excludes": []
   },
   "lazerArcano": {
    "name": "Raio Arcano",
    "description": "Canalizado: enquanto a tecla fica pressionada, o cajado dispara um raio de 12 u e 0,6 u de largura que atravessa inimigos e para em paredes, com 30% do dano a cada 0,2 s. Custa 10 mana ao começar e 12 mana por segundo, dura até 4 s e recarrega 8 s depois de soltar. O Mago anda a 30%. Sinergia de Arcano: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "+10% de dano (a partir do segundo ponto)",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "arcane",
    "max": 5,
    "level": 16,
    "requires": [
     "setasPerseguidoras"
    ],
    "excludes": []
   },
   "escudoArcano": {
    "name": "Escudo Arcano",
    "description": "Por 12 s, desvia para a mana 10% por ponto do dano recebido após as defesas, até 50% com cinco pontos. Cada ponto de dano desviado custa 1 MP. A parte não paga por falta de mana atinge a vida normalmente. Sinergia de Arcano: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "+10 pontos percentuais de dano desviado para mana (máximo 50%)",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "arcane",
    "max": 5,
    "level": 10,
    "requires": [
     "echo"
    ],
    "excludes": []
   },
   "clone": {
    "name": "Clone Arcano",
    "description": "Cria um clone no ponto mirado (até 7 u) por 12 s. Ele fica parado e repete, da própria posição e mirando o mesmo ponto, a Seta Arcana e cada feitiço que o Mago lança, com 50% do dano e sem custo. Tem 50% da vida máxima do Mago; inimigos a menos de 5 u passam a atacá-lo. Só um clone por vez. Sinergia de Arcano: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "+10 pontos percentuais do dano copiado depois do primeiro (50% a 90% antes das sinergias)",
    "icon": "",
    "effects": {},
    "type": "evocação",
    "tree": "habilidades",
    "branch": "arcane",
    "max": 5,
    "level": 16,
    "requires": [
     "escudoArcano"
    ],
    "excludes": []
   },
   "bigBang": {
    "name": "Big Bang",
    "description": "Lança uma esfera arcana lenta (7 u/s), até 14 u. Ao tocar inimigo, parede ou fim do alcance, explode em raio 4 com 360% do dano mágico. +10% de dano por ponto depois do primeiro. Sinergia de Arcano: cada ponto investido fortalece em +2% do dano base as outras habilidades de dano deste ramo.",
    "perRank": "+10% de dano depois do primeiro ponto",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "arcane",
    "max": 5,
    "level": 22,
    "requires": [
     "lazerArcano"
    ],
    "excludes": []
   }
  }
 }
};
