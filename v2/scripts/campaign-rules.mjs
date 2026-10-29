// Gerado das fontes atuais; não editar.
export default {
  "stageBody": " const n=CAMP.stage||1; return {hp:1+(n-1)*.18+(player.level-1)*.02,dmg:1+(n-1)*.1}; ",
  "waveCountExpression": "Math.floor((4+wave*2+Math.floor(wave/3))*mult)",
  "stages": [
    null,
    {
      "n": 1,
      "kind": "rooms",
      "icon": "⚰️",
      "name": "A Cripta Esquecida",
      "type": "Exploração de salas",
      "pos": [
        15,
        70
      ],
      "grant": "raio",
      "grantName": "Tiro de Osso",
      "grantIcon": "⚡",
      "desc": "Zephyr desperta no fundo de uma cripta. Abra caminho por quatro salas seladas, derrotando quem guarda cada porta.",
      "rew": {
        "souls": 50,
        "gold": 30,
        "xp": 140,
        "sp": 1
      }
    },
    {
      "n": 2,
      "kind": "arena",
      "icon": "🌲",
      "name": "Floresta de Eldrin",
      "type": "Arena com ondas",
      "pos": [
        37,
        36
      ],
      "grant": "summon",
      "grantName": "Invocação de Mortos",
      "grantIcon": "🧟",
      "desc": "A Guarda Real patrulha a floresta. Aguente seis ondas e aprenda a erguer os mortos para lutar ao seu lado.",
      "rew": {
        "souls": 90,
        "gold": 60,
        "xp": 220,
        "sp": 1
      }
    },
    {
      "n": 3,
      "kind": "strip",
      "icon": "🍂",
      "name": "Trilha dos Vigias",
      "type": "Side-scroller 2.5D",
      "pos": [
        62,
        66
      ],
      "grant": "maos",
      "grantName": "Muralha de Corpos",
      "grantIcon": "🖐",
      "desc": "Siga a trilha para a direita. Em cada clareira, a tela trava até que todos os vigias caiam.",
      "rew": {
        "souls": 130,
        "gold": 90,
        "xp": 320,
        "sp": 1
      }
    },
    {
      "n": 4,
      "kind": "boss",
      "icon": "🛡️",
      "name": "Posto do Capitão",
      "type": "Chefe",
      "pos": [
        85,
        30
      ],
      "grant": "barreira",
      "grantName": "Escudo de Carne",
      "grantIcon": "🛡",
      "desc": "O Capitão da Guarda da Floresta bloqueia o caminho até o castelo. Ele não vai cair sem luta.",
      "rew": {
        "souls": 220,
        "gold": 150,
        "xp": 520,
        "sp": 2
      }
    }
  ],
  "doors": [
    {
      "x": 17,
      "y0": -1.9,
      "y1": 1.9,
      "w": 1.2,
      "open": false,
      "k": 0
    },
    {
      "x": 49,
      "y0": -1.9,
      "y1": 1.9,
      "w": 1.2,
      "open": false,
      "k": 0
    },
    {
      "x": 84,
      "y0": -1.9,
      "y1": 1.9,
      "w": 1.2,
      "open": false,
      "k": 0
    }
  ],
  "rooms": [
    {
      "id": "A",
      "x0": -10,
      "x1": 10,
      "y0": -6.5,
      "y1": 6.5,
      "waves": []
    },
    {
      "id": "B",
      "x0": 24,
      "x1": 42,
      "y0": -8.5,
      "y1": 8.5,
      "waves": [
        [
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          1,
          1,
          0
        ]
      ]
    },
    {
      "id": "C",
      "x0": 56,
      "x1": 77,
      "y0": -7.5,
      "y1": 7.5,
      "waves": [
        [
          0,
          0,
          1,
          1
        ],
        [
          0,
          1,
          2
        ],
        [
          0,
          0,
          1,
          3,
          1
        ]
      ]
    },
    {
      "id": "D",
      "x0": 91,
      "x1": 111,
      "y0": -9.5,
      "y1": 9.5,
      "waves": [
        [
          0,
          0,
          1,
          1,
          0,
          0
        ],
        [
          2,
          2,
          1,
          3
        ],
        [
          2,
          3,
          1,
          1,
          0
        ]
      ]
    }
  ],
  "corridors": [
    {
      "x0": 9.5,
      "x1": 24.5,
      "y0": -1.9,
      "y1": 1.9
    },
    {
      "x0": 41.5,
      "x1": 56.5,
      "y0": -1.9,
      "y1": 1.9
    },
    {
      "x0": 76.5,
      "x1": 91.5,
      "y0": -1.9,
      "y1": 1.9
    }
  ],
  "strip": [
    {
      "x": 24,
      "waves": [
        [
          0,
          0,
          0
        ],
        [
          0,
          1,
          0,
          0
        ]
      ],
      "done": false,
      "active": false,
      "wi": 0,
      "pend": 0
    },
    {
      "x": 50,
      "waves": [
        [
          0,
          1,
          1,
          0
        ],
        [
          2,
          0,
          1
        ]
      ],
      "done": false,
      "active": false,
      "wi": 0,
      "pend": 0
    },
    {
      "x": 78,
      "waves": [
        [
          1,
          1,
          0,
          0,
          1
        ],
        [
          2,
          3,
          0
        ]
      ],
      "done": false,
      "active": false,
      "wi": 0,
      "pend": 0
    },
    {
      "x": 108,
      "waves": [
        [
          2,
          0,
          3,
          1
        ],
        [
          0,
          0,
          1,
          1,
          2
        ],
        [
          2,
          2,
          3
        ]
      ],
      "done": false,
      "active": false,
      "wi": 0,
      "pend": 0
    }
  ],
  "route": [
    {
      "x": 24,
      "waves": [
        [
          0,
          0,
          1
        ],
        [
          0,
          3,
          1
        ]
      ],
      "done": false,
      "active": false,
      "wi": 0,
      "pend": 0
    },
    {
      "x": 65,
      "waves": [
        [
          0,
          2,
          1
        ],
        [
          1,
          3,
          0
        ]
      ],
      "done": false,
      "active": false,
      "wi": 0,
      "pend": 0
    },
    {
      "x": 110,
      "waves": [
        [
          2,
          1,
          3
        ],
        [
          "boss"
        ]
      ],
      "done": false,
      "active": false,
      "wi": 0,
      "pend": 0
    }
  ],
  "captain": {
    "name": "Capitão da Guarda",
    "col": 1718890,
    "hCol": 4886754,
    "hp": 20000,
    "dmg": 35.75,
    "spd": 2,
    "xp": 300,
    "souls": 160,
    "sc": 2.2,
    "isBoss": true
  },
  "npcs": {
    "bram": {
      "name": "Bram, o ferreiro",
      "icon": "🧔",
      "pos": [
        -11,
        1
      ],
      "sc": 1.05,
      "style": {
        "skin": "#c9966e",
        "cloth": "#6a4a2a",
        "dark": "#3a2410",
        "legCol": "#3a2a1a",
        "belt": "#2a1a10",
        "boot": "#2a1a10"
      },
      "kinds": [
        "ext",
        "horde",
        "elim"
      ],
      "say": [
        "Meu martelo não dá conta de tanto reparo... os mortos continuam rondando a mata.",
        "Limpe o que for preciso e eu garanto que a vila não esquece."
      ]
    },
    "lysa": {
      "name": "Lysa, a anciã",
      "icon": "👵",
      "pos": [
        11,
        1
      ],
      "sc": 0.95,
      "style": {
        "skin": "#d9b79c",
        "cloth": "#7a6a8a",
        "dark": "#4a3a5a",
        "robe": true,
        "head": "hood",
        "hoodCol": "#6a5a7a",
        "hoodDark": "#3a2a4a",
        "trim": "rgba(220,200,255,.5)",
        "belt": "#b9a15a"
      },
      "kinds": [
        "horde",
        "elim"
      ],
      "say": [
        "Sinto algo se agitando sob a terra, jovem mago.",
        "Os espíritos estão inquietos. Pode acalmá-los... do seu jeito?"
      ]
    },
    "tilda": {
      "name": "Tilda",
      "icon": "🧒",
      "pos": [
        -6,
        8
      ],
      "sc": 0.72,
      "style": {
        "skin": "#e0b090",
        "cloth": "#9a3a2a",
        "dark": "#5a1a10",
        "legCol": "#5a3a2a",
        "belt": "#d4af37"
      },
      "kinds": [
        "ext",
        "horde"
      ],
      "say": [
        "Você é o moço dos mortos? Que legal!",
        "Tem uns monstros perto do poço. Por favor, ajuda a gente?"
      ]
    },
    "vesper": {
      "name": "Vesper, o espírito guardião",
      "icon": "👻",
      "pos": [
        0,
        5.9
      ],
      "sc": 1,
      "style": {},
      "kinds": [
        "horde",
        "elim"
      ],
      "say": [
        "A névoa me prendeu a Eldrin. Toda criatura que você afasta torna esta praça um pouco mais viva.",
        "Não temo seus mortos, necromante. Eles obedecem a alguém que ainda escolhe proteger os vivos."
      ]
    }
  },
  "missions": [
    {
      "id": "ext",
      "icon": "⚔",
      "label": "Extermínio",
      "difficulty": 1,
      "wavesGoal": 4,
      "enemyMult": 1,
      "desc": "Sobreviva 4 waves e derrote o Guardião.",
      "rewardSouls": 60,
      "rewardExp": 200,
      "color": "#00ccaa",
      "boss": {
        "name": "Guardião dos Ossos",
        "col": 6693546,
        "hCol": 11158783,
        "hp": 350,
        "dmg": 19.5,
        "spd": 1.6,
        "xp": 100,
        "souls": 50,
        "sc": 2.4,
        "isBoss": true
      }
    },
    {
      "id": "horde",
      "icon": "💀",
      "label": "Horda Infernal",
      "difficulty": 2,
      "wavesGoal": 6,
      "enemyMult": 1.4,
      "desc": "6 waves densas + Lich Guerreiro.",
      "rewardSouls": 130,
      "rewardExp": 380,
      "color": "#ff8844",
      "boss": {
        "name": "Lich Guerreiro",
        "col": 11141154,
        "hCol": 16720452,
        "hp": 600,
        "dmg": 32.5,
        "spd": 2,
        "xp": 180,
        "souls": 90,
        "sc": 2.8,
        "isBoss": true
      }
    },
    {
      "id": "elim",
      "icon": "💥",
      "label": "Eliminação",
      "difficulty": 3,
      "wavesGoal": 3,
      "enemyMult": 1.8,
      "desc": "Apenas 3 waves, mas a Hidra é brutal.",
      "rewardSouls": 220,
      "rewardExp": 550,
      "color": "#ff4466",
      "boss": {
        "name": "Hidra Pútrida",
        "col": 14869,
        "hCol": 43588,
        "hp": 950,
        "dmg": 49.4,
        "spd": 1.3,
        "xp": 280,
        "souls": 150,
        "sc": 3.2,
        "isBoss": true
      }
    }
  ],
  "stories": {
    "camp_intro": [
      "Reino de Valdoria. Anos atrás...",
      "A ressurreição é a linha entre o saber e a ruína, Zephyr.",
      "Com ela, ninguém mais perderia quem ama, mestre.",
      "Zephyr ousou o impossível: a fórmula da ressurreição.",
      "Os sábios julgaram o ritual um fracasso. O rei nem quis ouvir.",
      "Magia proibida em meu reino? Prendam o aprendiz!",
      "Naquela mesma noite, a casa de Zephyr foi queimada. Sua família não sobreviveu.",
      "Na forca, sob a multidão, ele fez seu juramento.",
      "Eu juro... cada um que ergueu a mão contra os meus pagará!",
      "UM ANO DEPOIS...",
      "Ninguém voltou para buscar o corpo. A magia, porém, nunca parou de trabalhar.",
      "Funcionou... A fórmula funcionava. Eu estava certo.",
      "Preso nas profundezas da Cripta Esquecida, só resta uma saída: a que ele abrir à força.",
      "ATO I",
      "O DESPERTAR DE ZEPHYR"
    ],
    "camp_pre1": [
      "Quatro salas seladas. Cada porta só cede quando seus guardiões deixam de respirar.",
      "Meus ossos ainda lembram como se luta.",
      "Guie Zephyr pela cripta e aprenda o Tiro de Osso."
    ],
    "camp_post1": [
      "A lua. Pela primeira vez em um ano.",
      "A Floresta de Eldrin é o caminho para o castelo.",
      "Mas a floresta pertence à Guarda Real."
    ],
    "camp_pre2": [
      "Floresta de Eldrin. A Guarda Real patrulha cada trilha.",
      "Ordens do rei: nenhum necromante passa!",
      "Então os mortos lutarão por mim.",
      "Zephyr aprende a invocar os mortos: o primeiro zumbi se ergue."
    ],
    "camp_post2": [
      "A patrulha tombou. Um batedor fugiu pelas árvores.",
      "O Capitão precisa saber disso!",
      "Deixe-o ir. Eu quero que ele venha."
    ],
    "camp_pre3": [
      "Trilha dos Vigias. Em cada clareira, uma emboscada.",
      "Ao fim da trilha, o acampamento do Capitão.",
      "Um raio necrótico atravessa muitos de uma vez."
    ],
    "camp_post3": [
      "As fogueiras do acampamento ardiam. Ninguém dormia.",
      "Então é você... o aprendiz que não morreu."
    ],
    "camp_pre4": [
      "Capitão Dorian Valk, da Guarda Real da Floresta.",
      "Fui eu quem acendeu a pira da sua casa, garoto.",
      "Ótimo. Um nome para começar.",
      "Erga a Escudo de Carne. A investida do Capitão não perdoa."
    ],
    "camp_post4": [
      "O Capitão caiu de joelhos, a armadura rachada.",
      "O rei... não vai... parar...",
      "Ao longe, o Castelo de Valdoria.",
      "Eu também não.",
      "O primeiro nome da lista foi riscado. Faltam todos os outros."
    ],
    "camp_end": [
      "FIM DO ATO I",
      "O Ato II em breve — a vingança de Zephyr continua..."
    ]
  },
  "tutorials": {
    "1": [
      "Mova-se com W A S D",
      "Clique com o botão esquerdo para lançar o Tiro de Osso (20 MP). Destrua os 3 mortos-vivos de treino.",
      "Pressione ESC para abrir o menu: status, habilidades e upgrades.",
      "Siga pelo corredor. Cada sala só abre a próxima porta quando todos caírem."
    ],
    "2": [
      "Pressione Q e escolha Zumbi para invocar um minion.",
      "Shift + clique direito no chão para reunir os minions, ou em um inimigo para mandar atacar.",
      "Sobreviva às 6 ondas. Minions caídos ressuscitam sozinhos depois de alguns segundos."
    ],
    "3": [
      "Use o botão direito do mouse ou 2 para lançar Muralha de Corpos.",
      "Lance Muralha de Corpos (35 MP) para atrasar grupos. O botão esquerdo continua lançando o Raio.",
      "Avance para a direita. Quando a tela travar, derrote todos para seguir."
    ],
    "4": [
      "Pressione ESPAÇO para erguer o Escudo de Carne: 15 MP + um zumbi (recuperação de 20s). Sem zumbi, custa também 15% da vida máxima.",
      "Uma linha vermelha no chão avisa a investida do Capitão. Saia do caminho!",
      "Derrote o Capitão da Guarda. Ele chama reforços quando ferido."
    ]
  }
};
export function stageScale(stage,level){const CAMP={stage},player={level}; const n=CAMP.stage||1; return {hp:1+(n-1)*.18+(player.level-1)*.02,dmg:1+(n-1)*.1}; }
export function waveCount(wave,mult){return Math.floor((4+wave*2+Math.floor(wave/3))*mult);}
