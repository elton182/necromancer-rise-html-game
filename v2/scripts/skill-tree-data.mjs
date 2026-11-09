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
        24,
        18
       ],
       [
        "thrust",
        76,
        18
       ],
       [
        "momentum",
        16,
        122
       ],
       [
        "steelWave",
        50,
        122
       ],
       [
        "tornado",
        84,
        122
       ],
       [
        "tornadoCyclone",
        24,
        226
       ],
       [
        "tornadoWhirl",
        76,
        226
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
        50,
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
    "description": "+6% de dano dos cortes por ponto. O ataque básico já está disponível.",
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
    "description": "Libera a estocada (botão direito / 2): avança até 7 u na direção da mira e perfura até 3,4 u à frente, com 220% do dano. +10% de dano por ponto.",
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
    "description": "Completar os três cortes fortalece em 10% por ponto a próxima estocada, por 4 s.",
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
    "name": "Corte tornado",
    "description": "Segure R/5: golpes circulares com gasto contínuo de vigor.",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "sword",
    "max": 1,
    "level": 6,
    "requires": [
     "thrust"
    ],
    "excludes": []
   },
   "steelWave": {
    "name": "Onda de Aço",
    "description": "O terceiro corte do Slash lança uma onda em linha reta de 7 u, com 180% do dano. Atravessa inimigos e para em paredes. Sem custo; recarga própria de 8 s.",
    "icon": "",
    "effects": {},
    "type": "aperfeiçoamento",
    "tree": "habilidades",
    "branch": "sword",
    "max": 1,
    "level": 10,
    "requires": [
     "slash"
    ],
    "excludes": []
   },
   "tornadoCyclone": {
    "name": "Ciclone",
    "description": "Variante do Tornado: raio de 3,7 em vez de 2,7, mas movimento de 40% em vez de 55%. Só uma variante fica ativa.",
    "icon": "",
    "effects": {},
    "type": "variante",
    "tree": "habilidades",
    "branch": "sword",
    "max": 1,
    "level": 12,
    "requires": [
     "tornado"
    ],
    "excludes": []
   },
   "tornadoWhirl": {
    "name": "Turbilhão",
    "description": "Variante do Tornado: acerta a cada 0,2 s em vez de 0,3 s, mas gasta 16 vigor/s em vez de 12. Só uma variante fica ativa.",
    "icon": "",
    "effects": {},
    "type": "variante",
    "tree": "habilidades",
    "branch": "sword",
    "max": 1,
    "level": 12,
    "requires": [
     "tornado"
    ],
    "excludes": []
   },
   "bash": {
    "name": "Golpe de escudo",
    "description": "Libera o golpe de escudo (3 / Q). +10% de dano por ponto.",
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
    "description": "+3 pontos percentuais de bloqueio com escudo por ponto",
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
    "description": "T/6: escudo atinge na ida e no retorno. Sem bloqueio enquanto está no ar.",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "shield",
    "max": 1,
    "level": 6,
    "requires": [
     "bash"
    ],
    "excludes": []
   },
   "riposte": {
    "name": "Retaliação",
    "description": "Bloquear fortalece em 10% por ponto o próximo golpe de escudo, por 4 s.",
    "icon": "",
    "effects": {},
    "type": "sinergia",
    "tree": "habilidades",
    "branch": "shield",
    "max": 3,
    "level": 4,
    "requires": [
     "shieldDefense"
    ],
    "excludes": []
   },
   "ricochet": {
    "name": "Ricochete",
    "description": "O Arremesso salta para o inimigo mais próximo em até 6 u: um salto por ponto, com 20% menos dano a cada salto. Mais saltos deixam você mais tempo sem escudo.",
    "icon": "",
    "effects": {},
    "type": "sinergia",
    "tree": "habilidades",
    "branch": "shield",
    "max": 3,
    "level": 8,
    "requires": [
     "shieldThrow"
    ],
    "excludes": []
   },
   "strength": {
    "name": "Maestria da espada",
    "description": "+8% de dano por ponto",
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
    "description": "Reduz em 30% a velocidade dos inimigos em raio de 6 por 4 s e dobra a recuperação de vigor por 6 s. Recarga de 18 s. Equipe em um slot da barra.",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "veteran",
    "max": 1,
    "level": 14,
    "requires": [],
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
        50,
        18
       ],
       [
        "thornbind",
        24,
        122
       ],
       [
        "rejuvenate",
        76,
        122
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
    "description": "Raio instantâneo no primeiro inimigo da linha. O ataque básico já está disponível. +6% de dano por ponto.",
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
    "description": "Libera a Corrente: o raio salta entre inimigos próximos. Cada ponto acrescenta um salto.",
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
    "description": "Nuvem fixa no ponto mirado que derruba raios nos inimigos dentro da área por 4 s. Saia da área ou fique nela: os raios só caem ali.",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "storm",
    "max": 1,
    "level": 6,
    "requires": [
     "chain"
    ],
    "excludes": []
   },
   "roots": {
    "name": "Raízes",
    "description": "Libera as Raízes: espinhos brotam no ponto mirado e prendem os inimigos no lugar. Presos ainda atacam quem estiver ao alcance. +10% de dano e +0,3 s de prisão por ponto.",
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
    "description": "Inimigos presos pelas Raízes recebem +10% de dano por ponto, de qualquer fonte.",
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
    "description": "Brotos curam 30% da vida máxima ao longo de 5 s. Só na forma humana; transformar-se não interrompe a cura.",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "nature",
    "max": 1,
    "level": 6,
    "requires": [
     "roots"
    ],
    "excludes": []
   },
   "wolf": {
    "name": "Forma de Lobo",
    "description": "F: transforma em lobisomem. Garras corpo a corpo, 20% menos dano recebido e 35% mais movimento, mas sem magias. A forma consome mana e cada golpe de garra devolve 3. +8% de dano das garras por ponto.",
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
    "description": "Na forma de lobo (botão direito / 2): salta até 6 u e atinge a área de pouso.",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "wild",
    "max": 1,
    "level": 4,
    "requires": [
     "wolf"
    ],
    "excludes": []
   },
   "wildHeart": {
    "name": "Coração Selvagem",
    "description": "A forma de lobo consome 1 mana por segundo a menos por ponto (de 4/s para até 1/s).",
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
    "description": "Na forma de lobo (3 / Q): inimigos em 6 u ficam 35% mais lentos por 3 s e as garras causam +25% de dano por 6 s.",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "wild",
    "max": 1,
    "level": 8,
    "requires": [
     "leap"
    ],
    "excludes": []
   },
   "vitality": {
    "name": "Vigor da floresta",
    "description": "+10% de vida máxima por ponto.",
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
    "description": "Lança um turbilhão que avança 9 u em linha reta a 10 u/s, atravessando inimigos: 60% do dano em cada um (uma vez) e empurrão de 0,6 u para os lados. Para em paredes. +8% de dano por ponto.",
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
    "description": "Ergue um tornado no ponto mirado, até 10 u. Por 4 s ele anda devagar (1,2 u/s) na direção da mira, puxa para o centro quem estiver a até 1,8 u (chefes não) e causa 25% do dano a cada 0,4 s. Para em paredes.",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "storm",
    "max": 1,
    "level": 6,
    "requires": [
     "turbilhao"
    ],
    "excludes": []
   },
   "furacao": {
    "name": "Furacão",
    "description": "O Tornado vira Furacão: raio 2,7 e 6 s de duração. Ao terminar, explode com 120% do dano em raio 2,7 e empurra os inimigos 1,5 u para fora.",
    "icon": "",
    "effects": {},
    "type": "aperfeiçoamento",
    "tree": "habilidades",
    "branch": "storm",
    "max": 1,
    "level": 12,
    "requires": [
     "tornado"
    ],
    "excludes": []
   },
   "garraDeGelo": {
    "name": "Garra de Gelo",
    "description": "Na forma de lobo (T / 6): garra gelada em cone estreito, até 3 u, com 130% do dano. Os atingidos ficam 50% mais lentos por 2,5 s; chefes recebem só o dano.",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "wild",
    "max": 1,
    "level": 8,
    "requires": [
     "leap"
    ],
    "excludes": []
   },
   "corteSangrento": {
    "name": "Corte Sangrento",
    "description": "Na forma de lobo (R / 5): garra em arco à frente, até 2,6 u, com 90% do dano. Os atingidos sangram, perdendo 15% do dano a cada 0,5 s por 4 s. Um novo corte renova o sangramento, sem somar.",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "wild",
    "max": 1,
    "level": 6,
    "requires": [
     "leap"
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
        24,
        18
       ],
       [
        "pierce",
        76,
        18
       ],
       [
        "fan",
        24,
        122
       ],
       [
        "rain",
        76,
        122
       ],
       [
        "saraivadaSeguidora",
        50,
        226
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
    "description": "+6% de dano do Disparo por ponto. O ataque básico já está disponível.",
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
    "description": "Libera a Flecha Perfurante: carrega 0,55 s, andando a metade da velocidade, e atravessa todos os inimigos da linha, com 200% do dano. +10% de dano por ponto.",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "bow",
    "max": 3,
    "level": 1,
    "requires": [],
    "excludes": []
   },
   "fan": {
    "name": "Tiro Seguidor",
    "description": "Cinco flechas em cone de 50°, com 70% do dano cada. Cada flecha curva em direção ao inimigo mais próximo à frente dela, até 6 u. Bom contra grupos espalhados.",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "bow",
    "max": 1,
    "level": 4,
    "requires": [
     "shot"
    ],
    "excludes": []
   },
   "rain": {
    "name": "Chuva de Flechas",
    "description": "Marca uma área de raio 3 no ponto mirado, até 12 u. Depois de 0,7 s caem cinco ondas, uma a cada 0,4 s, com 45% do dano em quem estiver dentro.",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "bow",
    "max": 1,
    "level": 6,
    "requires": [
     "pierce"
    ],
    "excludes": []
   },
   "leap": {
    "name": "Recuo",
    "description": "Libera o Recuo: salto de 5 u para trás, de frente para a mira. Inimigos a até 2,5 u do ponto de partida ficam 35% mais lentos por 2 s. −0,5 s de recarga por ponto.",
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
    "description": "Um falcão acompanha a Arqueira. A cada 2,5 s ele mergulha no inimigo mais próximo dela, até 8 u, com 35% do dano. F: manda o falcão ao inimigo mais perto da mira (até 3,5 u da mira e 14 u de você), com 120% do dano; o alvo fica marcado por 4 s e recebe +15% de dano das flechas. Recarga de 8 s, 10 foco. +10% de dano do falcão por ponto.",
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
    "description": "Depois do Recuo, o próximo Disparo, Flecha Perfurante ou Tiro Seguidor em até 3 s causa +15% de dano por ponto.",
    "icon": "",
    "effects": {},
    "type": "sinergia",
    "tree": "habilidades",
    "branch": "hunt",
    "max": 3,
    "level": 4,
    "requires": [
     "leap"
    ],
    "excludes": []
   },
   "precision": {
    "name": "Precisão",
    "description": "+8% de dano por ponto.",
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
    "description": "Trava no inimigo mais perto da mira (até 3,5 u dela e 13 u de você) e dispara cinco flechas em sequência, uma a cada 0,12 s, que perseguem esse alvo, com 45% do dano cada. Se ele cair, as restantes buscam o inimigo mais próximo.",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "bow",
    "max": 1,
    "level": 8,
    "requires": [
     "fan"
    ],
    "excludes": []
   },
   "impactoCeleste": {
    "name": "Impacto Celeste",
    "description": "Marca uma área de raio 2,5 no ponto mirado, até 12 u. O falcão mergulha e, 0,9 s depois, atinge a área com 150% do dano e empurra os inimigos 1 u. Até o impacto, o falcão não ataca sozinho.",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "hunt",
    "max": 1,
    "level": 8,
    "requires": [
     "falcon"
    ],
    "excludes": []
   },
   "penasVoadoras": {
    "name": "Penas Voadoras",
    "description": "O falcão lança seis penas nos inimigos mais próximos da Arqueira, até 8 u, uma por alvo, com 40% do dano cada. Sem alvos suficientes, as penas restantes seguem a mira.",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "hunt",
    "max": 1,
    "level": 4,
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
    "description": "+6% de dano do Virote pesado por ponto. O ataque básico já está disponível.",
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
    "description": "Libera a Rajada: três virotes em sequência, a cada 0,15 s, com 70% do dano cada e atravessando um inimigo. +10% de dano por ponto.",
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
    "description": "O Virote pesado atravessa +1 inimigo por ponto, ainda perdendo 25% a cada um.",
    "icon": "",
    "effects": {},
    "type": "sinergia",
    "tree": "habilidades",
    "branch": "crossbow",
    "max": 2,
    "level": 4,
    "requires": [
     "quarrel"
    ],
    "excludes": []
   },
   "bomb": {
    "name": "Bomba de fragmentação",
    "description": "Libera a Bomba: arremesso em arco até 9 u. O ponto de queda fica marcado no chão durante o voo; ao cair, explode em raio 2,6 com 160% do dano e empurra 1 u. +10% de dano por ponto.",
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
    "description": "+12% de raio da Bomba e da Mina por ponto.",
    "icon": "",
    "effects": {},
    "type": "sinergia",
    "tree": "habilidades",
    "branch": "powder",
    "max": 3,
    "level": 4,
    "requires": [
     "bomb"
    ],
    "excludes": []
   },
   "mine": {
    "name": "Mina de pólvora",
    "description": "Assenta uma mina aos seus pés. Arma em 1 s e explode quando um inimigo chega a 1,4 u: raio 3 e 220% do dano. Até duas minas; cada uma dura 25 s.",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "powder",
    "max": 1,
    "level": 6,
    "requires": [
     "bomb"
    ],
    "excludes": []
   },
   "firebomb": {
    "name": "Molotov",
    "description": "Arremesso em arco até 9 u que incendeia o chão em raio 2,4 por 4 s. A cada 0,5 s, 30% do dano em quem estiver dentro.",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "powder",
    "max": 1,
    "level": 6,
    "requires": [
     "bomb"
    ],
    "excludes": []
   },
   "caliber": {
    "name": "Calibre",
    "description": "+8% de dano por ponto.",
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
    "description": "Arremesso em arco até 9 u. O ponto de queda fica marcado no chão; a rede cobre raio 2,4, causa 30% do dano e deixa os inimigos 50% mais lentos por 3 s (+0,5 s por ponto depois do primeiro). Chefes recebem o dano, mas não ficam lentos.",
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
    "description": "Assenta uma armadilha aos seus pés. Arma em 0,6 s e fecha quando um inimigo chega a 0,9 u: 120% do dano e o prende por 2 s (chefes ficam 50% mais lentos). Até duas armadilhas; cada uma dura 30 s.",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "powder",
    "max": 1,
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
        "meteor",
        76,
        122
       ],
       [
        "familiarDeFogo",
        50,
        226
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
        "shatter",
        24,
        122
       ],
       [
        "esferaDeGelo",
        76,
        122
       ],
       [
        "golemDeGelo",
        50,
        226
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
    "description": "Libera a Bola de Fogo: explode ao tocar o primeiro inimigo, uma parede ou o fim do alcance, em raio 2,2, com 140% do dano. +10% de dano por ponto.",
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
    "description": "A Bola de Fogo deixa o chão em chamas por 1 s por ponto, com 25% do dano a cada 0,5 s.",
    "icon": "",
    "effects": {},
    "type": "sinergia",
    "tree": "habilidades",
    "branch": "fire",
    "max": 3,
    "level": 4,
    "requires": [
     "fireball"
    ],
    "excludes": []
   },
   "meteor": {
    "name": "Meteoro",
    "description": "Marca uma área de raio 2,8 no ponto mirado, até 12 u. Uma bola de fogo cai do céu e, depois de 1 s, causa 320% do dano em quem estiver dentro. O chão fica em chamas por 3 s (raio 2,4): 20% do dano a cada 0,5 s.",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "fire",
    "max": 1,
    "level": 6,
    "requires": [
     "fireball"
    ],
    "excludes": []
   },
   "frost": {
    "name": "Rajada de Gelo",
    "description": "Libera a Rajada de Gelo: cone de 70° e 6 u à frente, com 110% do dano, que deixa os inimigos 40% mais lentos por 3 s. +10% de dano por ponto.",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "frost",
    "max": 3,
    "level": 1,
    "requires": [],
    "excludes": []
   },
   "shatter": {
    "name": "Estilhaçar",
    "description": "Inimigos lentos pela Rajada de Gelo recebem +10% de dano por ponto do fogo e do arcano.",
    "icon": "",
    "effects": {},
    "type": "sinergia",
    "tree": "habilidades",
    "branch": "frost",
    "max": 3,
    "level": 4,
    "requires": [
     "frost"
    ],
    "excludes": []
   },
   "bolt": {
    "name": "Seta Arcana",
    "description": "+6% de dano da Seta Arcana por ponto. O ataque básico já está disponível.",
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
    "description": "Libera o Teleporte: salta até 7 u na direção da mira, sem atravessar paredes, e deixa no ponto de partida um eco arcano de raio 2,2 com 50% do dano. −1 s de recarga por ponto.",
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
    "description": "+25% de dano do eco do Teleporte por ponto.",
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
    "description": "Cinco setas arcanas em leque de 70°, com 40% do dano cada. Cada seta vira até 6 rad/s em direção ao inimigo mais próximo à frente dela, até 7 u.",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "arcane",
    "max": 1,
    "level": 4,
    "requires": [
     "bolt"
    ],
    "excludes": []
   },
   "esferaDeGelo": {
    "name": "Esfera de Gelo",
    "description": "Lança um pequeno planeta de gelo com anéis, que atravessa o campo bem devagar (2 u/s) por até 10 u e para em paredes. Fere uma vez quem toca (50%) e, girando, solta dois cristais opostos a cada 0,15 s em espiral; os cristais curvam para inimigos a até 3 u, com 20% do dano e 20% de lentidão por 1 s (conta para o Estilhaçar).",
    "icon": "",
    "effects": {},
    "type": "ativa",
    "tree": "habilidades",
    "branch": "frost",
    "max": 1,
    "level": 6,
    "requires": [
     "frost"
    ],
    "excludes": []
   },
   "familiarDeFogo": {
    "name": "Familiar de Fogo",
    "description": "Invoca um espírito de fogo que acompanha o Mago por 20 s. A cada 1,2 s ele lança uma pequena bola de fogo no inimigo mais próximo do Mago, até 9 u, com 40% do dano e explosão de raio 1,2 (com a Combustão, o chão também queima). Lançar de novo renova o espírito.",
    "icon": "",
    "effects": {},
    "type": "evocação",
    "tree": "habilidades",
    "branch": "fire",
    "max": 1,
    "level": 8,
    "requires": [
     "combustion"
    ],
    "excludes": []
   },
   "golemDeGelo": {
    "name": "Golem de Gelo",
    "description": "Invoca um golem de gelo ao lado do Mago por 25 s. Ele tem 120% da vida máxima do Mago, avança no inimigo mais próximo e golpeia a cada 1,4 s com 70% do dano mágico, deixando o alvo 30% mais lento por 1,5 s. Inimigos perto dele passam a atacá-lo. Só um golem por vez.",
    "icon": "",
    "effects": {},
    "type": "evocação",
    "tree": "habilidades",
    "branch": "frost",
    "max": 1,
    "level": 10,
    "requires": [
     "esferaDeGelo"
    ],
    "excludes": []
   }
  }
 }
};
