// Gerado; fontes canônicas em scripts e HTML atual.
export default {
  "types": [
    "zombie",
    "skeleton",
    "archer",
    "specter",
    "abom"
  ],
  "defs": {
    "zombie": {
      "emoji": "🧟",
      "name": "Zumbi",
      "hp": 130,
      "dmg": 11,
      "spd": 3.4,
      "atkR": 1.5,
      "atkRate": 1.2,
      "col": 2972187,
      "unlockLv": 1,
      "spCost": 20
    },
    "skeleton": {
      "emoji": "💀",
      "name": "Esqueleto",
      "hp": 50,
      "dmg": 14,
      "spd": 3.8,
      "atkR": 1.6,
      "atkRate": 0.9,
      "col": 13944992,
      "unlockLv": 3,
      "spCost": 35
    },
    "archer": {
      "emoji": "🏹",
      "name": "Arqueiro Ósseo",
      "hp": 40,
      "dmg": 13,
      "spd": 3.2,
      "atkR": 7.5,
      "atkRate": 1.1,
      "col": 13221792,
      "unlockLv": 4,
      "spCost": 30
    },
    "specter": {
      "emoji": "👻",
      "name": "Espectro",
      "hp": 35,
      "dmg": 22,
      "spd": 4.6,
      "atkR": 2,
      "atkRate": 0.7,
      "col": 8956671,
      "unlockLv": 6,
      "spCost": 55
    },
    "abom": {
      "emoji": "👹",
      "name": "Abominação",
      "hp": 400,
      "dmg": 30,
      "spd": 2.7,
      "atkR": 2.1,
      "atkRate": 1.25,
      "col": 5602625,
      "unlockLv": 1,
      "spCost": 40,
      "fuse": true
    }
  },
  "costs": {
    "zombie": 20,
    "skeleton": 30,
    "archer": 30,
    "specter": 45,
    "abom": 25
  },
  "tuning": {
    "boltMultiplier": 0.5,
    "zombieBurstMultiplier": 3.5,
    "zombieBurstRadius": 3.5,
    "minionHpMultiplier": 1.5,
    "minionHpPerLevel": 6,
    "minionRegen": 0.01,
    "frontlineDamageTaken": 0.8,
    "manualReviveHealth": 0.6,
    "autoReviveHealth": 0.5,
    "enemySpeed": 1.15,
    "meleeInterval": 1.1,
    "rangedInterval": 1.3,
    "specialDelayMin": 0.75,
    "specialDelayMax": 1.25,
    "gearChance": 0.16,
    "orbChance": 0.16,
    "hpOrbShare": 0.25,
    "specials": {
      "Guerreiro": {
        "windup": 0.5,
        "cooldown": 5
      },
      "Arqueiro": {
        "windup": 0.65,
        "cooldown": 5
      },
      "Mago Vivo": {
        "windup": 0.75,
        "cooldown": 6.5
      },
      "Bruto": {
        "windup": 0.65,
        "cooldown": 6
      }
    }
  },
  "commands": {
    "zombie": {
      "name": "Zumbis",
      "icon": "🧟",
      "summon": true,
      "passive": "zombie_burst",
      "ability": "Explosão",
      "cooldown": 1.2
    },
    "skeleton": {
      "name": "Esqueletos Guerreiros",
      "icon": "⚔",
      "summon": true,
      "passive": "skeleton",
      "ability": "Reunir",
      "cooldown": 4
    },
    "archer": {
      "name": "Esqueletos arqueiros",
      "icon": "🏹",
      "summon": true,
      "passive": "archer_power",
      "ability": "Tiro forte",
      "cooldown": 7
    },
    "specter": {
      "name": "Espectros",
      "icon": "👻",
      "summon": true,
      "passive": "step",
      "ability": "Passo Espectral",
      "cooldown": 8
    },
    "abom": {
      "name": "Abominação",
      "icon": "👹",
      "summon": true,
      "passive": "abom_slam",
      "ability": "Salto com impacto",
      "cooldown": 8
    }
  },
  "passives": {
    "zombie_burst": "burst",
    "archer_power": "shot",
    "abom_slam": "colossus",
    "aura": "aura"
  },
  "abilities": {
    "zombie": {
      "name": "Mordida Pútrida",
      "icon": "🦷",
      "cooldown": 7,
      "color": "#9dbf68",
      "desc": "Morde o alvo: 150% de dano e 35% de lentidão por 3 s (chefes não ficam lentos)."
    },
    "skeleton": {
      "name": "Golpe Giratório",
      "icon": "⚔",
      "cooldown": 6,
      "color": "#e5d397",
      "desc": "Gira a lâmina: 130% de dano em todos os inimigos a até 2,2 u."
    },
    "archer": {
      "name": "Rajada Tripla",
      "icon": "🏹",
      "cooldown": 8,
      "color": "#e8e0c0",
      "desc": "Dispara 3 flechas de 90% de dano em até 3 alvos diferentes."
    },
    "specter": {
      "name": "Investida Fantasma",
      "icon": "👻",
      "cooldown": 9,
      "color": "#b6c4ec",
      "desc": "Atravessa o alvo a até 5 u e reaparece atrás dele: 200% de dano."
    },
    "abom": {
      "name": "Rugido Pútrido",
      "icon": "👹",
      "cooldown": 10,
      "color": "#aac679",
      "desc": "Ruge contra quem está perto: 100% de dano a até 3 u e 35% de lentidão por 2 s (chefes só sofrem o dano)."
    }
  },
  "revive": 12
};
