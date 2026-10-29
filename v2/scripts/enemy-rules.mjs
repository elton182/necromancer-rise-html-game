// Gerado das fontes atuais.
export default {
  "basic": {
    "rangedInterval": 1.9,
    "hound": {
      "range": 1,
      "interval": 1.2,
      "initial": 2
    },
    "acolyte": {
      "range": 1.3,
      "interval": 1.5
    }
  },
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
  },
  "abilities": {
    "Cão de Cripta": {
      "kind": "charge",
      "name": "Investida da Cripta",
      "windup": 0.75,
      "cooldown": 7,
      "range": 7,
      "minRange": 2.5,
      "distance": 6,
      "speed": 12,
      "width": 1,
      "recovery": 1,
      "mult": 1.6,
      "color": "#e4ad64"
    },
    "Guerreiro": {
      "kind": "heavy",
      "name": "Golpe pesado",
      "windup": 0.5,
      "cooldown": 5,
      "range": 2.2,
      "radius": 2.1,
      "mult": 1.6,
      "color": "#e4b477"
    },
    "Arqueiro": {
      "kind": "powerShot",
      "name": "Tiro forte",
      "windup": 0.65,
      "cooldown": 5,
      "range": 12,
      "mult": 1.9,
      "color": "#edce77"
    },
    "Mago Vivo": {
      "kind": "fire",
      "name": "Erupção de fogo",
      "windup": 0.75,
      "cooldown": 6.5,
      "range": 9,
      "radius": 2.2,
      "mult": 1.2,
      "color": "#ff8951"
    },
    "Bruto": {
      "kind": "leap",
      "name": "Salto devastador",
      "windup": 0.65,
      "cooldown": 6,
      "range": 7,
      "minRange": 2.5,
      "radius": 2.6,
      "mult": 2,
      "color": "#ec9f73"
    }
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
  "ranged": {
    "Arqueiro": 7.5,
    "Mago Vivo": 6.5
  }
};
