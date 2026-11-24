import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {impactProgress} from '../scripts/locomotion.mjs';
import {marksmanActions} from '../scripts/marksman-model.mjs';

const models=JSON.parse(readFileSync(new URL('../assets/models.json',import.meta.url),'utf8'));
const mage=models.mageHero;
// Duração natural dos clipes no GLB (frames-1)/30, conferida em blender/previews/mage_anim_review/validation.json.
const CLIP={cast:.5,cast_up:.7};
const near=(a,b,e=1e-6)=>assert.ok(Math.abs(a-b)<e,a+' ≠ '+b);

test('impacto registrado coincide com os frames de disparo do gerador (8/16 e 15/22)',()=>{
 near(mage.impact.cast,7/15,1e-4);near(mage.impact.cast_up,14/21,1e-4);
});

test('cada feitiço do Mago mostra o quadro de impacto no instante do release',()=>{
 const spells=marksmanActions('mage').filter(d=>CLIP[d.clip]);
 assert.ok(spells.length>=15);
 for(const d of spells){
  const k=mage.impact[d.clip],at=t=>impactProgress(t,d.release,d.duration,CLIP[d.clip],k);
  near(at(d.release),k);near(at(0),0);near(at(d.duration),1);
  let last=-1;for(let i=0;i<=200;i++){const u=at(d.duration*i/200);assert.ok(u>=last-1e-9,d.id+' volta no tempo');last=u;}
  // Antes do release a pose nunca passa do impacto; depois, nunca fica antes dele.
  assert.ok(at(d.release*.99)<k&&at(d.release+1e-3)>=k,d.id);
 }
});

test('Raio Arcano sustenta a pose de mira durante o canal e só recupera no fim',()=>{
 const beam=marksmanActions('mage').find(d=>d.id==='lazerArcano'),k=mage.impact.cast;
 const at=t=>impactProgress(t,beam.release,beam.duration,CLIP.cast,k);
 for(const t of [.3,1,2,3.5])near(at(t),k);
 const recovery=(1-k)*CLIP.cast;near(at(beam.duration-recovery/2),k+(1-k)/2);
});

test('sem impacto registrado a ação continua linear (outras classes inalteradas)',()=>{
 near(impactProgress(.25,.26,.5,.5,undefined),.5);
 for(const key of ['archerHero','mercenary','druid'])assert.equal(models[key]?.impact,undefined,key);
});
