/* Shared NPC conversations: independent of missions, inventory and rendering. */
(function(global){
 'use strict';
 const lines={
  bram:[
   'O segredo de uma boa lâmina não é bater mais forte. É saber a hora de tirar o ferro do fogo.',
   'Meu pai dizia que uma forja acesa mantém a vila viva. Enquanto eu tiver braços, esta não vai apagar.',
   'Não me assusto com seus esqueletos, Zephyr. Só não deixe nenhum deles mexer nas minhas ferramentas.',
   'Esse avental já viu mais invernos do que muito soldado por aí. Cada marca conta uma história.',
   'Às vezes sinto falta do barulho da feira. Agora, quando o martelo para, o silêncio pesa.',
   'Se encontrar um pedaço de aço bom na estrada, guarde. Até metal quebrado pode ganhar outra vida.',
   'Força ajuda a erguer o martelo. Mas é a paciência que faz de alguém um ferreiro.'
  ],
  lysa:[
   'As raízes de Eldrin são antigas, menino. Elas se lembram de passos que nós já esquecemos.',
   'Não confunda silêncio com paz. Até os pássaros se calam quando algo espreita na mata.',
   'Já vi muitos jovens partirem procurando poder. Os que voltam mais sábios costumam procurar um lar.',
   'Faço chá ao cair da tarde. Se seus mortos souberem esperar lá fora, há sempre uma cadeira para você.',
   'Este cajado era da minha mãe. Madeira velha também sabe sustentar quem ainda tem caminho pela frente.',
   'Tilda enche a vila de perguntas. Que ela nunca perca essa coragem de querer entender o mundo.',
   'Os espíritos não falam todos com raiva. Alguns só precisam que alguém se lembre de seus nomes.'
  ],
  tilda:[
   'Você dá nome para os seus esqueletos? Eu chamaria um deles de Graveto!',
   'Bram disse que eu só posso ajudar na forja quando alcançar a bancada. Estou crescendo todo dia!',
   'A dona Lysa conhece uma história para cada estrela. Eu sempre durmo antes de ouvir a última.',
   'Deixei uma flor perto do poço. É para a vila ficar bonita quando todo mundo voltar.',
   'Se um zumbi perder a bota, ele percebe? Ou continua andando com um pé descalço mesmo?',
   'Queria ver o mundo além da mata. Mas primeiro preciso aprender a não me perder entre as casas.',
   'Quando você sai, eu fico de olho no portão. Alguém precisa dar boas-vindas aos heróis!'
  ],
  vesper:[
   'Meu nome foi quase levado pela névoa. Vesper basta; é o nome que escolhi guardar.',
   'Não pertenço à sua horda, Zephyr. Fico porque esta vila ainda tem pessoas para proteger.',
   'A água do poço lembra cada rosto que se inclina sobre ela. Por isso sua luz nunca se apaga.',
   'O portal não é mau por si só. É uma porta — e portas precisam de quem vigie os dois lados.',
   'Quando as lanternas de Eldrin voltarem a ficar acesas até tarde, talvez eu consiga descansar.',
   'Se encontrar espíritos perdidos na estrada, diga que há um lugar seguro aqui. Eles entenderão.',
   'Sua magia chama os mortos. A sua escolha de defender os vivos é o que a torna diferente.'
  ],
  merchant:[
   'Já negociei em castelos e encruzilhadas. Uma conversa honesta abre mais portas que uma bolsa cheia.',
   'A estrada anda perigosa. Por isso conto cada roda da carroça antes de sair e depois de chegar.',
   'Couro bom, costura firme e provisões secas. A aventura costuma depender de coisas bem pequenas.',
   'Um cliente me pagou com uma moeda de um reino que não existe mais. Guardei pela história.',
   'Não vendo coragem engarrafada. Mas um aventureiro preparado costuma precisar de menos dela.',
   'Gosto de Eldrin. Bram conserta minhas ferragens e Lysa sempre sabe quando a chuva vem.',
   'Se ouvir rumores na estrada, venha me contar. Notícias também são mercadoria, mas entre amigos saem de graça.'
  ]
 };
 const active=new WeakMap(),visits={};
 const style=document.createElement('style');style.textContent=`
 .npc-conversation .say,.npc-conversation .dialog-quote{min-height:4.5em;cursor:pointer;white-space:pre-wrap;line-height:1.65;font-size:16px;color:#eee1c8;outline-offset:5px}
 .npc-conversation [hidden]{display:none!important}
 .npc-conversation .dialogue-controls{display:flex;gap:10px;flex-wrap:wrap;margin:12px 0}
 .npc-conversation .dialogue-hint{display:block;font-size:12px;color:#c7af7f;margin:8px 0;letter-spacing:.04em}
 .npc-conversation[data-typing="true"] .say::after,.npc-conversation[data-typing="true"] .dialog-quote::after{content:'▍';color:#dbb76d}
 #npc-dialog.npc-conversation .dialog-shell{max-height:90dvh;overflow:auto;background:linear-gradient(135deg,#241b13,#100e0d);border-color:#9d7138}#npc-dialog.npc-conversation .portrait{object-fit:cover;object-position:center 22%;width:160px;height:195px;border-color:#9d7138}#npc-dialog.npc-conversation .dialogue-controls button{padding:10px 14px;background:#302216;color:#eee1c8;border:1px solid #9d7138;cursor:pointer} @media(max-width:520px){#npc-dialog.npc-conversation .portrait{width:100px;height:130px}}
 #vil-modal.npc-conversation .vc{background:linear-gradient(135deg,#241b13,#100e0d);border:1px solid #826035;border-top:3px solid #c99949;box-sizing:border-box}
 #vil-modal.npc-conversation .npc-portrait{width:210px;height:250px;object-fit:cover;object-position:center 22%;border:2px solid #9d7138;box-shadow:0 0 0 3px #21170f,0 6px 20px #0008}
 #vil-modal.npc-conversation .offer{background:#9a703214;border-color:#826035}
 #vil-modal.npc-conversation button{background:#2b2118;border-color:#806039;color:#eadbc1}
 #vil-modal.npc-conversation button:hover,#vil-modal.npc-conversation button:focus-visible{border-color:#e1b660;color:#fff1cf}
 #vil-modal.npc-conversation button.pri{background:#51391e;border-color:#c99949}
 @media(max-width:520px){#vil-modal.npc-conversation .npc-portrait{width:128px;height:165px}.npc-conversation .say{font-size:15px}#vil-modal.npc-conversation .vh{gap:12px}}

 /* Bottom conversation panel: portrait and speech keep separate columns. */
 #vil-modal.npc-conversation,#npc-dialog.npc-conversation{align-items:flex-end;justify-content:center;padding:16px 18px max(18px,env(safe-area-inset-bottom));box-sizing:border-box;background:linear-gradient(transparent 35%,#08060455);backdrop-filter:none}
 #vil-modal.npc-conversation .vc,#npc-dialog.npc-conversation .dialog-shell{display:grid;grid-template-columns:180px minmax(0,1fr);gap:22px;width:min(1100px,100%);max-height:65dvh;overflow:auto;padding:18px;box-sizing:border-box;border-radius:5px}
 .npc-conversation .dialogue-portrait-pane{min-width:0;align-self:start}
 #vil-modal.npc-conversation .npc-portrait,#npc-dialog.npc-conversation .portrait{display:block;width:100%;height:230px;margin:0;object-fit:cover;object-position:center 20%;border-radius:3px;box-sizing:border-box}
 .npc-conversation .dialogue-content{min-width:0}
 #vil-modal.npc-conversation .vh,#npc-dialog.npc-conversation .dialog-top{padding:0 0 10px;margin:0 0 8px;border-bottom:1px solid #9d713844;background:none}
 #vil-modal.npc-conversation .vh small{display:block;margin-top:5px;color:#bcaa88;font-size:10px}
 #npc-dialog.npc-conversation .dialog-body{padding:0}
 #npc-dialog.npc-conversation .dialog-actions{padding:0;justify-content:flex-start}
 #vil-modal.npc-conversation .say,#npc-dialog.npc-conversation .dialog-quote{min-height:3.3em;margin:8px 0;line-height:1.6;font-size:17px}
 .npc-conversation .dialogue-controls{margin:10px 0;gap:8px}
 .npc-conversation .dialogue-hint{margin:6px 0}
 @media(max-width:600px){
  #vil-modal.npc-conversation,#npc-dialog.npc-conversation{padding:8px 8px max(10px,env(safe-area-inset-bottom))}
  #vil-modal.npc-conversation .vc,#npc-dialog.npc-conversation .dialog-shell{grid-template-columns:90px minmax(0,1fr);gap:12px;padding:12px;max-height:74dvh}
  #vil-modal.npc-conversation .npc-portrait,#npc-dialog.npc-conversation .portrait{width:90px;height:136px}
  #vil-modal.npc-conversation .vh b,#npc-dialog.npc-conversation .npc-name{font-size:16px;letter-spacing:.03em}
  #vil-modal.npc-conversation .say,#npc-dialog.npc-conversation .dialog-quote{font-size:14px;min-height:5em}
  #vil-modal.npc-conversation button,#npc-dialog.npc-conversation button{font-size:10px;letter-spacing:.04em;padding:9px 10px;min-height:34px;white-space:normal}
  #npc-dialog.npc-conversation .dialog-actions{flex-wrap:wrap}
 }
 @media(max-height:480px){#vil-modal.npc-conversation .vc,#npc-dialog.npc-conversation .dialog-shell{max-height:90dvh;grid-template-columns:100px minmax(0,1fr)}#vil-modal.npc-conversation .npc-portrait,#npc-dialog.npc-conversation .portrait{height:145px}}
 `;document.head.appendChild(style);
 function dispose(root){const state=active.get(root);if(state){clearInterval(state.timer);state.cancelled=true;active.delete(root);}root.classList.remove('npc-conversation');delete root.dataset.typing;delete root.dataset.dialoguePhase;}
 function mount(root,id,options={}){
  dispose(root);if(!lines[id])return;
  const quote=root.querySelector('.say,.dialog-quote');if(!quote)return;
  root.classList.add('npc-conversation');
  const shell=root.querySelector('.vc,.dialog-shell');
  if(shell&&!shell.querySelector('.dialogue-content')){
   const portrait=shell.querySelector('.npc-portrait,.portrait');
   const left=document.createElement('aside');left.className='dialogue-portrait-pane';
   if(portrait)left.append(portrait);
   const right=document.createElement('section');right.className='dialogue-content';
   while(shell.firstChild)right.append(shell.firstChild);
   shell.append(left,right);
  }
  const quest=quote.textContent.replace(/^[“”]|[“”]$/g,'');
  const offers=[...root.querySelectorAll('.offer,.mission-card')];
  const actions=[...root.querySelectorAll('.vb button,.dialog-actions button')].filter(b=>b.id!=='vm-x'&&!b.textContent.match(/fechar/i));
  const hint=document.createElement('small');hint.className='dialogue-hint';quote.after(hint);
  quote.setAttribute('role','button');quote.setAttribute('tabindex','0');quote.setAttribute('aria-label','Completar a fala ou continuar a conversa');
  // Announce whole sentences, never one screen-reader update per character.
  const announcement=document.createElement('span');announcement.setAttribute('aria-live','polite');announcement.style.cssText='position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)';quote.after(announcement);
  const start=(visits[id]||0)%lines[id].length;visits[id]=(visits[id]||0)+1;
  const state={timer:null,phase:'ambient',typing:false,text:'',cancelled:false};active.set(root,state);
  function conceal(value){offers.concat(actions).forEach(el=>el.hidden=value);}
  const hasFollowup=options.hasQuest!==false&&(offers.length>0||id==='merchant');
  function finish(){
   clearInterval(state.timer);state.timer=null;state.typing=false;quote.textContent=state.text;root.dataset.typing='false';
   hint.textContent=state.phase==='ambient'?(hasFollowup?(id==='merchant'?'Clique na fala para ver as mercadorias.':'Clique na fala para ver o pedido.'):'Clique na fala para encerrar.'):(id==='merchant'?'Escolha se deseja abrir a loja.':'Escolha se deseja aceitar este pedido.');
  }
  function type(text){
   clearInterval(state.timer);state.text=text;state.typing=true;root.dataset.typing='true';root.dataset.dialoguePhase=state.phase;quote.textContent='';announcement.textContent=text;
   hint.textContent='Clique na fala para completar o texto.';
   let count=0;const chars=Array.from(text);
   state.timer=setInterval(()=>{if(state.cancelled)return;count++;quote.textContent=chars.slice(0,count).join('');if(count>=chars.length)finish();},28);
  }
  function showFollowup(){state.phase='ready';conceal(false);type(quest);}
  function advance(){
   if(state.cancelled)return;
   if(state.typing){finish();return;}
   if(state.phase==='ambient'){
    if(hasFollowup)showFollowup();
    else root.querySelector('#vm-x,.dialog-btn.secondary')?.click();
   }
  }
  state.advance=advance;quote.onclick=advance;quote.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();advance();}};
  conceal(true);if(options.questOnly&&hasFollowup)showFollowup();else type(lines[id][start]);quote.focus();
 }
 global.NpcDialogue={lines,mount,dispose,advance(root){active.get(root)?.advance();}};
})(window);
