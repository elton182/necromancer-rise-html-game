// Gerado das fontes atuais por tools/build.cjs.
export default {
  "consumables": [
    {
      "id": "potion_hp",
      "name": "Poção de Vida",
      "icon": "❤️",
      "desc": "Restaura 50 HP imediatamente.",
      "cost": 30,
      "maxStack": 5
    },
    {
      "id": "potion_mp",
      "name": "Poção de Mana",
      "icon": "💙",
      "desc": "Restaura 40 MP imediatamente.",
      "cost": 25,
      "maxStack": 5
    },
    {
      "id": "bone_shield",
      "name": "Escudo de Ossos",
      "icon": "🛡",
      "desc": "Absorve o próximo golpe recebido.",
      "cost": 45,
      "maxStack": 3
    },
    {
      "id": "soul_bomb",
      "name": "Bomba de Almas",
      "icon": "💣",
      "desc": "Explode causando 80 dano em área ao redor.",
      "cost": 55,
      "maxStack": 3
    },
    {
      "id": "recall_scroll",
      "name": "Pergaminho",
      "icon": "📜",
      "desc": "Teleporta ao portal instantaneamente.",
      "cost": 20,
      "maxStack": 5
    }
  ],
  "consumableEffects": {
    "hp": 50,
    "mp": 40,
    "bombDamage": 80,
    "bombRadius": 5
  },
  "xp": {
    "base": 100,
    "growth": 1.4,
    "maxLevel": 60
  },
  "levelUp": {
    "hp": 20,
    "mp": 5
  },
  "gold": {
    "min": 2,
    "factor": 0.35,
    "boss": 3,
    "life": 45,
    "pickup": 1.8
  },
  "orbs": {
    "chance": 0.16,
    "hpShare": 0.25,
    "life": 22,
    "spread": 0.6,
    "pickup": 1.3416407864998738,
    "hpRestore": 0.3,
    "mpRestore": 0.4
  },
  "gear": {
    "chance": 0.16,
    "pickup": 1.8
  }
};
