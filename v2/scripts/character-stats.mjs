// Apoio de apresentação comum ao Inventário e à aba Personagem: ícones dos atributos,
// rótulos por classe e o índice Poder de Combate. Sem DOM persistente e sem regras de jogo.
// Ícones pequenos dos atributos e botões (grade 24×24).
export const GLYPHS={person:'M12 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM5 20c0-4 3-7 7-7s7 3 7 7',book:'M4 5c3-1 6-1 8 1 2-2 5-2 8-1v14c-3-1-6-1-8 1-2-2-5-2-8-1ZM12 6v14',gear:'M8 6h8l2 4-6 10-6-10ZM6 10h12',hp:'M12 20C4 14 3 9 6 6.5 8.5 4.5 11 5.5 12 8c1-2.5 3.5-3.5 6-1.5 3 2.5 2 7.5-6 13.5Z',mp:'M12 3C9 8 6 11 6 14.5a6 6 0 0 0 12 0C18 11 15 8 12 3Z',vigor:'M7 11V7a2 2 0 0 1 4 0v3-5a2 2 0 0 1 4 0v5-3a2 2 0 0 1 4 0v6c0 4-3 7-7 7s-6-2-7-5l-2-4a2 2 0 0 1 3-2l1 2',damage:'M4 20 15 9M15 9l5-5v4l-4 4M7 14l3 3M4 17l3 3',spell:'M12 3v5M12 16v5M3 12h5M16 12h5M6 6l3 3M15 15l3 3M18 6l-3 3M9 15l-3 3',defense:'M12 3 19 6v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6Z',blockChance:'M12 3 19 6v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6ZM9 12l2 2 4-4',defenseMitigation:'M12 3 19 6v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6ZM12 6v13',hpRegen:'M12 20C4 14 3 9 6 6.5 8.5 4.5 11 5.5 12 8c1-2.5 3.5-3.5 6-1.5 3 2.5 2 7.5-6 13.5ZM12 10v5M9.5 12.5h5',regen:'M13 3 6 13h5l-1 8 7-10h-5Z',move:'M9 3h5v8l5 3v4H6V3ZM6 14h13',cooldown:'M7 3h10M7 21h10M8 3c0 5 8 6 8 9s-8 4-8 9M16 3c0 5-8 6-8 9s8 4 8 9',hordeHp:'M12 3c-4.5 0-7 3-7 7 0 2.5 1.2 4 2.5 5v3h9v-3c1.3-1 2.5-2.5 2.5-5 0-4-2.5-7-7-7ZM9 11h.01M15 11h.01M10 18v2M14 18v2',hordeRegen:'M12 3c-4.5 0-7 3-7 7 0 2.5 1.2 4 2.5 5v3h9v-3c1.3-1 2.5-2.5 2.5-5 0-4-2.5-7-7-7ZM9 11h.01M15 11h.01M19 17v4M17 19h4',hordeDps:'M12 3c-4.5 0-7 3-7 7 0 2.5 1.2 4 2.5 5v3h9v-3c1.3-1 2.5-2.5 2.5-5 0-4-2.5-7-7-7ZM9 11h.01M15 11h.01M3 21l5-5',equip:'M5 19 14 10M14 10l4-5 1 1-5 4M19 19 10 10M10 10 6 5 5 6l5 4M4 16l4 4M20 16l-4 4',compare:'M12 4v16M6 20h12M4 8h16M4 8l-2 6a3 3 0 0 0 4 0L4 8M20 8l-2 6a3 3 0 0 0 4 0l-2-6',sell:'M5 9h14l-2 11H7ZM9 9V6a3 3 0 0 1 6 0v3',discard:'M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13',unequip:'M4 12h12M12 7l5 5-5 5M20 4v16',power:'M5 19 14 10M14 10l4-5 1 1-5 4M19 19 10 10M10 10 6 5 5 6l5 4M4 16l4 4M20 16l-4 4',list:'M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01',coin:'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16ZM12 8v8M9.5 10c0-1 1-2 2.5-2s2.5.8 2.5 1.8',all:'M4 4h7v7H4ZM13 4h7v7h-7ZM4 13h7v7H4ZM13 13h7v7h-7Z',warrior:'M4 20 15 9M15 9l5-5v4l-4 4M20 20 9 9M9 9 4 4v4l4 4M6 15l3 3M18 15l-3 3',druid:'M4 20C4 10 11 4 20 4c0 9-7 16-16 16ZM4 20 15 9M9 16l-4-1M12 13l-1-4',archer:'M7 3c7 2 11 8 11 18M7 3v18M7 21h11M4 12h15M16 9l3 3-3 3',mage:'M7 21 15 6M14 3l4 1 1 4-3 2-3-2ZM5 17l4 1M3 13l3 3M19 13c1 2 0 4-2 5',mercenary:'M3 9c5-4 13-4 18 0M12 6v14M9 20h6M3 9l9 4 9-4M12 3l-2 3h4Z',necromancer:'M12 3c-4.5 0-7 3-7 7 0 2.5 1.2 4 2.5 5v3h9v-3c1.3-1 2.5-2.5 2.5-5 0-4-2.5-7-7-7ZM9 11h.01M15 11h.01M10 18v2M14 18v2'};
export const glyph=id=>'<svg class="inv-glyph" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="'+(GLYPHS[id]||GLYPHS.defense)+'"/></svg>';
// Índice só de exibição: resume ataque, vida efetiva e sustentação para comparar trocas. Não entra em nenhuma regra.
export function combatPower(a,warrior){
 const offense=warrior?a.damage:a.spell,mitigation=Math.min(.7,(a.defenseMitigation||0)/100),ehp=a.hp/(1-mitigation);
 return Math.round((offense||0)*4+ehp*.6+((a.hpRegen||0)+(a.regen||0))*6+(a.move||0)*10+(a.cooldown||0)*6+(a.blockChance||0)*6+(a.hordeDps||0)*2+(a.hordeHp||0)*.05);
}
// Atributos por classe: [chave, nome, unidade, ícone, descrição do efeito no jogo].
const COMMON={
 hp:['hp','Vida máxima','','hp','Quanto dano o personagem aguenta antes de cair. Equipamentos e passivas aumentam a base do nível.'],
 hpRegen:['hpRegen','Regeneração de vida','/s','hpRegen','Vida recuperada por segundo, também durante o combate.'],
 defense:['defense','Defesa','','defense','Armadura somada dos equipamentos. Vira redução de dano conforme o nível do monstro, até 70%.'],
 move:['move','Movimento','','move','Velocidade de deslocamento, em unidades por segundo.'],
 cooldown:['cooldown','Redução de recarga','%','cooldown','Encurta a recarga das habilidades. Vem dos equipamentos, até 50%.'],
};
export const CLASS_STATS={
 warrior:{
  hp:COMMON.hp,mp:['mp','Vigor máximo','','vigor','Recurso gasto pela Estocada, pelo Golpe de escudo e pelos demais golpes especiais.'],
  power:['damage','Dano','','damage','Base de todos os golpes de espada e escudo; cada golpe multiplica este valor.'],
  regen:['regen','Recuperação de vigor','/s','regen','Vigor recuperado por segundo.'],
  hpRegen:COMMON.hpRegen,defense:COMMON.defense,move:COMMON.move,cooldown:COMMON.cooldown,
  block:['blockChance','Defesa de escudo','%','blockChance','Chance de anular um ataque com o escudo erguido. Só existe com escudo equipado.'],
  mitigation:['defenseMitigation','Redução por armadura','%','defenseMitigation','Parte do dano que a Defesa absorve contra um monstro do seu nível (máximo 70%).'],
 },
 archer:{
  hp:COMMON.hp,mp:['mp','Foco máximo','','vigor','Recurso das habilidades especiais. Nesta etapa o tiro básico não custa foco.'],
  power:['damage','Dano','','damage','Base do Disparo; cada flecha multiplica este valor.'],
  regen:['regen','Recuperação de foco','/s','regen','Foco recuperado por segundo.'],
  hpRegen:COMMON.hpRegen,defense:COMMON.defense,move:COMMON.move,cooldown:COMMON.cooldown,
  mitigation:['defenseMitigation','Redução por armadura','%','defenseMitigation','Parte do dano que a Defesa absorve contra um monstro do seu nível (máximo 70%).'],
 },
 mercenary:{
  hp:COMMON.hp,mp:['mp','Vigor máximo','','vigor','Recurso das habilidades especiais. Nesta etapa o tiro básico não custa vigor.'],
  power:['damage','Dano','','damage','Base do Virote pesado; cada virote multiplica este valor e perde força a cada inimigo atravessado.'],
  regen:['regen','Recuperação de vigor','/s','regen','Vigor recuperado por segundo.'],
  hpRegen:COMMON.hpRegen,defense:COMMON.defense,move:COMMON.move,cooldown:COMMON.cooldown,
  mitigation:['defenseMitigation','Redução por armadura','%','defenseMitigation','Parte do dano que a Defesa absorve contra um monstro do seu nível (máximo 70%).'],
 },
 mage:{
  hp:COMMON.hp,mp:['mp','Mana máxima','','mp','Recurso dos feitiços. A Seta Arcana não custa mana.'],
  power:['spell','Dano mágico','','spell','Base da Seta Arcana, da Bola de Fogo, da Rajada de Gelo, do Teleporte e do Meteoro; cada feitiço multiplica este valor.'],
  regen:['regen','Regeneração de mana','/s','regen','Mana recuperada por segundo.'],
  hpRegen:COMMON.hpRegen,defense:COMMON.defense,move:COMMON.move,cooldown:COMMON.cooldown,
  mitigation:['defenseMitigation','Mitigação','%','defenseMitigation','Parte do dano que a Defesa absorve contra um monstro do seu nível (máximo 70%).'],
 },
 druid:{
  hp:COMMON.hp,mp:['mp','Mana máxima','','mp','Recurso das magias. Na forma de lobo é consumida aos poucos e as garras a devolvem.'],
  power:['spell','Poder natural','','spell','Base dos raios, das raízes e das garras do lobo; cada habilidade multiplica este valor.'],
  regen:['regen','Regeneração de mana','/s','regen','Mana recuperada por segundo na forma humana. Na forma de lobo não há regeneração.'],
  hpRegen:COMMON.hpRegen,defense:COMMON.defense,move:COMMON.move,cooldown:COMMON.cooldown,
  mitigation:['defenseMitigation','Mitigação','%','defenseMitigation','Parte do dano que a Defesa absorve contra um monstro do seu nível (máximo 70%).'],
 },
 necromancer:{
  hp:COMMON.hp,mp:['mp','Mana máxima','','mp','Recurso gasto pelas magias e pelas invocações da horda.'],
  power:['spell','Dano mágico','','spell','Base do Tiro de Osso e das demais magias; cada magia multiplica este valor.'],
  regen:['regen','Regeneração de mana','/s','regen','Mana recuperada por segundo.'],
  hpRegen:COMMON.hpRegen,defense:COMMON.defense,move:COMMON.move,cooldown:COMMON.cooldown,
  mitigation:['defenseMitigation','Mitigação','%','defenseMitigation','Parte do dano que a Defesa absorve contra um monstro do seu nível (máximo 70%).'],
  hordeHp:['hordeHp','Vida da horda','','hordeHp','Vida somada dos integrantes da horda equipada.'],
  hordeRegen:['hordeRegen','Regeneração da horda','/s','hordeRegen','Vida que a horda equipada recupera por segundo.'],
  hordeDps:['hordeDps','DPS básico da horda','','hordeDps','Dano por segundo dos ataques básicos da horda equipada.'],
 },
};
export const numberText=n=>n===null||n===undefined?'—':Number(n).toLocaleString('pt-BR',{maximumFractionDigits:2});
