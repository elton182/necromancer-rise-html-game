import test from 'node:test';
import assert from 'node:assert/strict';
import {createSession,transition,equipSession,snapshot,activateSlot,stepSession} from '../scripts/session.mjs';
import {normalizeSave} from '../scripts/save-model.mjs';
import {Build,changeRank,resetRanks} from '../scripts/grimoire.mjs';
import {TEST_PROFILE,setProfile} from '../scripts/horde.mjs';
import {available,actionName} from '../scripts/actions.mjs';
import {points} from '../scripts/progression.mjs';
import {DEATH_NODES} from '../scripts/death-tree.mjs';
import {castLich} from '../scripts/lich-model.mjs';
import {dealDamage} from '../scripts/training-model.mjs';

function fixture(){const s=createSession();setProfile(s.world,TEST_PROFILE);equipSession(s,0,'raio');equipSession(s,2,'dash');s.save.character.gold=2000;return s;}
const invest=(s,id,times=1)=>{for(let i=0;i<times;i++){const r=changeRank(s,id);assert.equal(r.ok,true,id+': '+r.message);}};
const advance=(s,seconds)=>{for(let left=seconds;left>1e-9;left-=.25)stepSession(s,Math.min(.25,left),{x:0,y:0});};

test('Grimório estendido aceita a árvore Morte, mantém as árvores antigas e rejeita ids desconhecidos',()=>{
 assert.equal(Build.nodes.length,Build.nodes.filter(n=>n.tree!=='death').length+DEATH_NODES.length);
 assert.deepEqual([...new Set(Build.schools.map(s=>s.tree))],['minions','spells','death']);
 assert.equal(Build.byId.zombie.tree,'minions');assert.equal(Build.byId.lichform.tree,'death');
 const profile={version:1,level:30,ranks:{lichform:2,reach:2,spinning:2,arc:2}};assert.deepEqual(Build.validate(profile).ranks,profile.ranks);
 assert.throws(()=>Build.validate({version:1,level:30,ranks:{lichform:1,ghost:1}}));
 assert.throws(()=>Build.validate({version:1,level:30,ranks:{cyclone:1}}),/Requer/);
 assert.ok(Build.effects({lichform:2})['Almas máximas']===10);assert.equal(Build.effects({zombie:2})['Dano de Zumbis e Abominações'],8,'efeitos antigos intactos');
});

test('investir e devolver pontos da Morte usa orçamento, nível, exclusividade e 20 de ouro por ponto',()=>{
 const s=fixture(),before=points(24,s.world.army.profile.ranks);
 invest(s,'lichform');assert.equal(s.world.lich.stats.learned,true,'setLichRanks é chamado ao investir');assert.equal(points(24,s.world.army.profile.ranks),before-1);
 assert.equal(changeRank(s,'reach').ok,false,'precisa de 2 pontos em Forma da Morte');invest(s,'lichform');invest(s,'reach',2);
 invest(s,'spinning');invest(s,'spinning');invest(s,'triple');invest(s,'triple');
 assert.equal(s.world.lich.stats.unlocked.giratoria,true);assert.equal(s.world.lich.stats.unlocked.arco,false);
 const gold=s.save.character.gold,ranksBefore=Build.spent(s.world.army.profile.ranks);
 assert.equal(changeRank(s,'lichform',{refund:true}).ok,true);assert.equal(s.world.army.profile.ranks.lichform,1);
 assert.equal(s.world.army.profile.ranks.reach,undefined,'dependentes saem junto');assert.equal(s.world.army.profile.ranks.spinning,undefined);
 assert.equal(s.save.character.gold,gold-(ranksBefore-Build.spent(s.world.army.profile.ranks))*20);
 assert.equal(resetRanks(s).ok,true);assert.equal(s.world.lich.stats.learned,false);
});

test('a Forma da Morte só equipa depois de aprendida; o nome e o slot aparecem como evocação normal',()=>{
 const s=fixture();assert.equal(available(s.world.army,'lich'),false);assert.equal(equipSession(s,3,'lich').ok,false);
 invest(s,'lichform');assert.equal(available(s.world.army,'lich'),true);assert.equal(actionName('lich'),'Forma da Morte');
 assert.equal(equipSession(s,3,'lich').ok,true);assert.equal(s.world.army.loadout[3],'lich');
 resetRanks(s);assert.equal(s.world.army.loadout[3],'empty','desaprender remove o slot');
});

test('o slot entra na forma e passa a ativar a barra da foice; Libertar Forma devolve a barra normal',()=>{
 const s=fixture();invest(s,'lichform',2);invest(s,'spinning',2);equipSession(s,3,'lich');transition(s,'training');s.world.paused=false;
 const w=s.world,p=w.player;w.actors=w.actors.filter(a=>a===p||a.groupType);p.hp=p.maxHp=1000;w.aim={x:p.x+9,y:p.y};
 assert.equal(activateSlot(s,3),true);assert.equal(w.lich.form,'transform');assert.equal(p.model,'lich');assert.equal(activateSlot(s,0),false,'transformando não lança nada');
 advance(s,1);assert.equal(w.lich.form,'lich');
 const foe={id:w.nextId++,model:'zombie',team:'enemy',x:p.x+2.5,y:p.y,hp:10000,maxHp:10000,radius:.3,animation:'idle',animationTime:0,timer:0,walkDistance:0,angle:0,actionId:0};w.actors.push(foe);
 assert.equal(activateSlot(s,0),true,'slot 1 vira a Ceifada');advance(s,.6);assert.ok(foe.hp<10000);
 assert.equal(activateSlot(s,2),false,'Colheita Tripla ainda não aprendida');assert.equal(w.army.loadout[0],'raio','barra normal preservada');
 const souls=w.lich.souls;assert.equal(activateSlot(s,1),true);assert.ok(w.lich.souls<souls);
 assert.equal(activateSlot(s,5),true);assert.equal(w.lich.form,'none');assert.equal(p.model,'player');assert.equal(w.lich.scythe,null);
 assert.equal(w.army.loadout[3],'lich');
});

test('pontos da árvore Morte sobrevivem a salvar/carregar e a pose do Lich chega ao ator',()=>{
 const s=fixture();invest(s,'lichform',2);invest(s,'spinning');const saved=JSON.parse(JSON.stringify(snapshot(s)));
 const loaded=normalizeSave(saved);assert.equal(loaded.horde.profile.ranks.lichform,2);assert.equal(loaded.horde.profile.ranks.spinning,1);
 assert.throws(()=>normalizeSave({...saved,horde:{...saved.horde,profile:{...saved.horde.profile,ranks:{...saved.horde.profile.ranks,cyclone:1}}}}),'ranks inválidos continuam rejeitados');
 equipSession(s,3,'lich');transition(s,'training');s.world.paused=false;s.world.aim={x:9,y:0};const w=s.world;w.actors=w.actors.filter(a=>a===w.player||a.groupType);
 activateSlot(s,3);advance(s,.3);assert.equal(w.player.pose?.anim,'transform');assert.ok(w.player.pose.progress>0&&w.player.pose.progress<1);
 advance(s,1);castLich(w,'ceifada');advance(s,.1);assert.equal(w.player.pose.anim,'slash');
});

test('morte do jogador na forma limpa tudo; ao reviver o modelo volta a ser o de Zephyr',()=>{
 const s=fixture();invest(s,'lichform',2);equipSession(s,3,'lich');transition(s,'training');s.world.paused=false;const w=s.world;
 w.actors=w.actors.filter(a=>a===w.player||a.groupType);activateSlot(s,3);advance(s,1);assert.equal(w.lich.form,'lich');w.spirits.push({id:777,x:5,y:5,value:4,age:0,ttl:8});
 const killer={id:w.nextId++,model:'warrior',team:'enemy',x:9,y:9,hp:10,maxHp:10,radius:.3};w.actors.push(killer);
 dealDamage(w,w.player,99999,killer);assert.equal(w.player.hp,0);assert.equal(w.lich.form,'none');assert.equal(w.spirits.length,0);assert.equal(w.lich.entryCooldown,0);assert.equal(w.player.model,'lich','o Lich cai como Lich');
 w.player.hp=50;advance(s,.1);assert.equal(w.player.model,'player');assert.equal(w.player.mpRegen>0,true,'a regeneração de mana foi restaurada');
});

test('na campanha (perfil com habilidades concedidas) a Forma da Morte também equipa depois de aprendida',()=>{
 const s=fixture();invest(s,'lichform');
 s.world.army.profile={...s.world.army.profile,campaign:true,grants:['raio','summon']};
 assert.equal(available(s.world.army,'lich'),true);assert.equal(equipSession(s,3,'lich').ok,true);
 resetRanks(s);assert.equal(available(s.world.army,'lich'),false,'sem o ponto continua indisponível');
 s.world.army.profile={...s.world.army.profile,campaign:true,grants:['raio']};assert.equal(available(s.world.army,'chuva'),false,'outras magias seguem concedidas pela campanha');
});

test('Colheita desbloqueada substitui o clique e continua combo gratuitamente',()=>{
 const s=fixture();invest(s,'lichform',2);invest(s,'reach',2);invest(s,'triple');equipSession(s,3,'lich');transition(s,'training');const w=s.world;w.paused=false;w.actors=[w.player];w.aim={x:9,y:0};activateSlot(s,3);advance(s,1);const souls=w.lich.souls,mp=w.player.mp;assert.ok(activateSlot(s,0));assert.equal(w.lich.action.id,'colheita');assert.equal(w.lich.souls,souls);advance(s,.61);assert.ok(activateSlot(s,0));assert.equal(w.lich.action.step,1);assert.equal(w.player.mp,mp);
});
