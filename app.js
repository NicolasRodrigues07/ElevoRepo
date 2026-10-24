const $=id=>document.getElementById(id),R=(n,d=2)=>n.toFixed(d).replace('.',','),M=v=>'R$ '+R(v),
H=m=>{m=Math.round(m);return m>=60?Math.floor(m/60)+'h'+String(m%60).padStart(2,'0'):m+' min'},
li=(a,b)=>`<div class="li"><span>${a}</span><span>${b}</span></div>`,
kp=l=>l.map(([a,b])=>`<div class="kpi"><b>${b}</b><small>${a}</small></div>`).join('');
const Motor={
 preco:{lento:1.10,otimizado:1.17,rapido:1.45},PMAX:22,PLENTO:7.4,lim:22,cap:{lenta:7.4,media:11,rapida:22},
 nome:{lento:'Lento',otimizado:'Otimizado',rapido:'Rápido'},
 potencia(est,E,T,pref){return Math.min(this.lim,this.bruta(est,E,T,pref))},bruta(est,E,T,pref){if(est=='lento')return this.PLENTO;if(est=='rapido')return this.PMAX;
  return Math.min(this.cap[pref],Math.max(3.7,E/(Math.max(T,5)/60)*1.05))},
 plano(est,c){const P=this.potencia(est,c.E,c.T,c.pref),pr=this.preco[est];return{est,P,pr,tempo:c.E/P*60,custo:c.E*pr}},
 recomendar(c){return this.plano('otimizado',c).tempo<=c.T?'otimizado':'rapido'},
 alocar(vs,total){const n=vs.length,a=vs.map(()=>0);if(!n)return a;
  const need=v=>Math.min(v.max,v.rem/Math.max(v.saida,1)*60),fl=Math.min(1.4,total/n);
  vs.forEach((v,i)=>a[i]=Math.min(fl,v.max));
  let rest=total-a.reduce((x,y)=>x+y,0);
  vs.map((v,i)=>i).sort((i,j)=>vs[j].pri-vs[i].pri||need(vs[j])-need(vs[i])).forEach(i=>{const g=Math.max(0,Math.min(rest,need(vs[i])-a[i]));a[i]+=g;rest-=g});
  for(let k=0;k<20&&rest>1e-6;k++){const o=vs.map((v,i)=>i).filter(i=>a[i]<vs[i].max-1e-6);if(!o.length)break;
   const w=o.reduce((s,i)=>s+vs[i].pri,0);let u=0;o.forEach(i=>{const g=Math.min(rest*vs[i].pri/w,vs[i].max-a[i]);a[i]+=g;u+=g});rest-=u}
  return a}
};
const L={get d(){try{return JSON.parse(localStorage.elevo)||{u:[],c:[],r:[]}}catch(e){return{u:[],c:[],r:[]}}},set d(v){try{localStorage.elevo=JSON.stringify(v)}catch(e){}}};
function loc(m,u,b){if(/^\/(sessoes|busca|estatisticas|relatorio|demo)/.test(u))throw new Error('Inicie o backend Python: python server.py');const d=L.d,me=d.u.find(x=>x.id==Api.tk);
 if(u=='/registro'){if(d.u.some(x=>x.email==b.email))throw new Error('E-mail já cadastrado');const x={id:'u'+Date.now(),nome:b.nome,email:b.email,senha:b.senha};d.u.push(x);L.d=d;return{token:x.id,usuario:x}}
 if(u=='/login'){const x=d.u.find(x=>x.email==b.email&&x.senha==b.senha);if(!x)throw new Error('E-mail ou senha incorretos');return{token:x.id,usuario:x}}
 if(!me)throw new Error('Faça login');
 const k=u=='/carros'?'c':'r';
 if(m=='POST'){const x={...b,id:Date.now(),uid:me.id};d[k].push(x);L.d=d;return x}
 return d[k].filter(x=>x.uid==me.id)}
const Api={tk:null,async req(m,u,b){try{const r=await fetch('/api'+u,{method:m,headers:{'Content-Type':'application/json',Authorization:'Bearer '+Api.tk},body:b&&JSON.stringify(b)});
 if((r.headers.get('content-type')||'').includes('json')){const j=await r.json();if(!r.ok)throw new Error(j.erro);return j}}catch(e){if(e.name=='Error')throw e}
 return loc(m,u,b)}};
const Repo={async salvarSessao(s){if(!S.conta)return;try{s.srv=await Api.req('POST','/recargas',{kwh:s.kwh,recibo:s.rc,data:s.data,carro:S.carro?S.carro.modelo+' · '+S.carro.placa:null,energia:+s.e.toFixed(3),duracao_min:Math.round(s.seg/60),custo:+s.custo.toFixed(2),estrategia:s.usadas.join('+'),pagamento:S.pag,economia:+(s.cr-s.custo).toFixed(2)})}catch(e){}},lerMedicao(){return null}};
const newS=()=>({user:'Visitante',cfg:{E:20,T:90,B:50,soc:30,pref:'media'},est:'otimizado',pag:null,s:null,conta:null,carros:[],carro:null});
let S=newS();
function go(n){document.querySelectorAll('.scr').forEach(e=>e.classList.toggle('on',e.id=='s'+n));
 $('steps').innerHTML=[1,2,3,4,5,6,7].map(i=>`<i class="${i<n?'on':i==n?'cur':''}"></i>`).join('');
 if(n==3){$('iE').value=S.cfg.E;$('iT').value=S.cfg.T;$('iB').value=S.cfg.B;$('iS').value=S.cfg.soc;rcar();upd()}
 if(n==4)r4();if(n==5)r5();if(n==7)r7();scrollTo(0,0)}
const mo=h=>{$('m').innerHTML='<div class="card">'+h+'</div>';$('m').classList.remove('hide')},closeM=()=>$('m').classList.add('hide');
function reserva(){S.cfg={E:25,T:120,B:45,soc:25,pref:'media'};S.reserva=$('cod').value;go(2)}
function login(novo){mo(`<h2>${novo?'Criar conta':'Entrar na conta'}</h2>${novo?'<input id="nm" placeholder="Nome">':''}<input id="em" placeholder="E-mail"><input id="pw" type="password" placeholder="Senha"><p class="warn" id="er"></p><div class="row"><button class="btn" onclick="auth(${!!novo})">${novo?'Cadastrar':'Entrar'}</button><button class="btn sec" onclick="login(${!novo})">${novo?'Já tenho conta':'Criar conta'}</button><button class="btn sec" onclick="closeM()">Cancelar</button></div>`)}
async function auth(novo){try{const j=await Api.req('POST',novo?'/registro':'/login',{nome:novo?$('nm').value:null,email:$('em').value.trim().toLowerCase(),senha:$('pw').value});Api.tk=j.token;S.conta=j.usuario;S.user=j.usuario.nome;await carregarCarros();closeM();if($('s2').classList.contains('on'))go(3);else rcar()}catch(e){$('er').textContent=e.message}}
async function carregarCarros(){S.carros=await Api.req('GET','/carros');S.carro=S.carros[0]||null}
function qr(){let g='';for(let i=0;i<441;i++){const x=i%21,y=Math.floor(i/21),f=(x<7&&y<7)||(x>13&&y<7)||(x<7&&y>13);g+=`<i class="${(f?(x%6==0||y%6==0||(x%6>1&&x%6<5&&y%6>1&&y%6<5)||x==14||x==20)&&!((x%14==1||x%14==5)&&false):Math.random()<.5)?'':'w'}"></i>`}
 mo(`<h2>Lendo QR Code…</h2><div class="qr">${g}</div><p>Identificando usuário</p>`);
 setTimeout(()=>{S.user='Usuário QR';closeM();go(3)},2300)}
function pref(v){S.cfg.pref=v;upd()}
function upd(){const c=S.cfg,kw=S.carro?+S.carro.bateria:60;c.soc=+$('iS').value;$('iE').max=Math.max(5,Math.floor((1-c.soc/100)*kw/Bateria.ef));$('oS').textContent=c.soc+'%';c.E=+$('iE').value;c.T=+$('iT').value;c.B=+$('iB').value;
 $('oE').textContent=c.E+' kWh';$('oT').textContent=H(c.T);$('oB').textContent=M(c.B);
 document.querySelectorAll('#pref .chip').forEach(b=>b.classList.toggle('sel',b.dataset.v==c.pref));
 const rec=Motor.recomendar(c);S.est=rec;
 const pl=['lento','otimizado','rapido'].map(e=>Motor.plano(e,c)),p=pl.find(x=>x.est==rec),f=pl[2];
 let av='';if(f.tempo>c.T)av+='<p class="warn">⚠ O tempo informado é curto até no modo rápido.</p>';
 if(p.custo>c.B)av+=`<p class="warn">⚠ O orçamento cobre cerca de ${R(c.B/p.pr,1)} kWh dos ${c.E} kWh pedidos.</p>`;
 const why=rec=='otimizado'?`Entrega ${c.E} kWh em ${H(p.tempo)} usando ${R(p.P,1)} kW, a menor potência que cumpre o seu prazo. Isso evita a tarifa mais alta do modo rápido.`:'O prazo exige a potência máxima do carregador.';
 $('rec').innerHTML=`<span class="pill">★ Recomendado</span><h2 style="margin-top:8px">Modo ${Motor.nome[rec]}</h2>
 <div class="kpis">${kp([['Energia',c.E+' kWh'],['Tempo estimado',H(p.tempo)],['Potência',R(p.P,1)+' kW'],['Bateria prevista',Math.min(100,Math.round(c.soc+c.E*Bateria.ef/kw*100))+'%'],['Custo estimado',M(p.custo)],['Economia vs rápido',M(Math.max(0,f.custo-p.custo))]])}</div>
 <p>${why}</p>${av}
 <table><tr><th>Estratégia</th><th>Potência</th><th>Tempo</th><th>Custo</th></tr>${pl.map(q=>`<tr><td>${q.est==rec?'★ ':''}${Motor.nome[q.est]}</td><td>${R(q.P,1)} kW</td><td>${H(q.tempo)}</td><td>${M(q.custo)}</td></tr>`).join('')}</table>
 <small class="n">Estimativas calculadas com as premissas da simulação, sem garantia de economia. A simulação real considera eficiência de 92% e redução de potência após 80% da bateria.</small>`}
function r4(){const c=S.cfg,p=Motor.plano(S.est,c);
 $('sum').innerHTML=li('Energia desejada',c.E+' kWh')+li('Tempo estimado',H(p.tempo))+li('Potência prevista',R(p.P,1)+' kW')+li('Estratégia',Motor.nome[S.est])+li('Preço por kWh',M(p.pr))+li('Orçamento máximo',M(c.B))+li('Custo estimado',`<b>${M(p.custo)}</b>`)+li('Identificação',S.user);
 $('estr').innerHTML=['lento','otimizado','rapido'].map(e=>{const q=Motor.plano(e,c);return `<button class="opt ${e==S.est?'sel':''}" style="width:100%" onclick="S.est='${e}';r4()"><b>${Motor.nome[e]}${e==Motor.recomendar(c)?' ★':''}</b>${R(q.P,1)} kW · ${H(q.tempo)} · ${M(q.custo)}</button>`}).join('')}
function r5(){const p=Motor.plano(S.est,S.cfg);$('pv').textContent=M(p.custo);
 $('pmet').innerHTML=[['Pix','📲'],['Cartão','💳'],['Carteira digital','👛']].map(([n,i])=>`<button class="opt ${S.pag==n?'sel':''}" onclick="S.pag='${n}';r5()">${i}<b>${n}</b></button>`).join('');
 $('pay').disabled=!S.pag;$('pay').textContent='Pagar (simulado)';$('pay').classList.remove('hide');$('ok5').classList.add('hide')}
function pagar(){const b=$('pay');b.disabled=true;b.textContent='Processando…';setTimeout(()=>{b.classList.add('hide');$('ok5').classList.remove('hide')},1500)}
function iniciar(){const c=S.cfg;clearInterval(S.tm);
 S.s={e:0,custo:0,cr:0,seg:0,esc:60,pausa:false,fim:false,est:S.est,usadas:[S.est],kwh:{},P:0,V:380,I:0,bat:Bateria.criar(S.carro?+S.carro.bateria:60,c.soc/100),B:c.B,est0:Motor.plano(S.est,c).custo};
 S.tm=setInterval(tick,1000);go(6);r6()}
function tick(){const s=S.s,c=S.cfg;if(!s||s.pausa||s.fim)return;
 const x=Bateria.passo(s.bat,Motor.potencia(s.est,c.E-s.e,c.T-s.seg/60,c.pref),s.esc);s.P=x.P;s.V=x.V;s.I=x.I;const pr=Motor.preco[s.est];
 let dE=Math.min(s.P*s.esc/3600,c.E-s.e);const mx=Math.max(0,(s.B-s.custo)/pr);let estouro=dE>=mx&&mx<c.E-s.e;
 if(estouro)dE=mx;
 s.e+=dE;s.custo+=dE*pr;s.cr+=dE*Motor.preco.rapido;s.seg+=s.esc;s.kwh[s.est]=(s.kwh[s.est]||0)+dE;
 if(estouro){s.pausa=true;r6();return budget()}
 if(s.e>=c.E-1e-6||s.bat.soc>=0.995)return fim();r6()}
function budget(){mo(`<h2 class="warn">⚠ Orçamento atingido</h2><p>O limite de ${M(S.s.B)} foi alcançado com ${R(S.s.e)} kWh entregues. A recarga foi pausada.</p><div class="row"><button class="btn" onclick="closeM();fim()">Encerrar recarga</button><button class="btn sec" onclick="S.s.B+=10;S.s.pausa=false;closeM();r6()">+ R$ 10 e continuar</button></div>`)}
function alterar(){const s=S.s,c=S.cfg;mo(`<h2>Alterar estratégia</h2>`+['lento','otimizado','rapido'].map(e=>{const P=Motor.potencia(e,c.E-s.e,c.T-s.seg/60,c.pref);return `<button class="opt ${e==s.est?'sel':''}" style="width:100%;margin-bottom:8px" onclick="trocar('${e}')"><b>${Motor.nome[e]}</b>${R(P,1)} kW · ${M(Motor.preco[e])}/kWh</button>`}).join('')+`<button class="btn sec" onclick="closeM()">Fechar</button>`)}
function trocar(e){const s=S.s;s.est=e;if(!s.usadas.includes(e))s.usadas.push(e);closeM();r6()}
function r6(){const s=S.s,c=S.cfg,p=s.e/c.E,P=s.pausa?0:s.P,rt=s.P>0?(c.E-s.e)/s.P*60:0;
 $('rg').style.strokeDashoffset=339.3*(1-p);$('pc').textContent=Math.round(p*100)+'%';
 $('st6').textContent=(s.pausa?'⏸ Pausado':'● Em andamento')+' · Estratégia '+Motor.nome[s.est];
 $('k6').innerHTML=kp([['Energia consumida',R(s.e)+' / '+c.E+' kWh'],['Potência atual',R(P,1)+' kW'],['Tempo decorrido',H(s.seg/60)],['Tempo restante',H(rt)],['Custo acumulado',M(s.custo)],['Estimado / orçamento',M(s.est0)+' / '+M(s.B)],['Bateria (SoC)',Math.round(s.bat.soc*100)+'%'],['Rede',R(s.V,0)+' V · '+R(P>0?s.I:0,1)+' A'],['Temp. bateria',R(s.bat.temp,1)+' °C']]);
 $('cn6').textContent=`Preço atual: ${M(Motor.preco[s.est])}/kWh. Custo = energia × preço.`;
 $('bp').disabled=s.pausa;$('br').disabled=!s.pausa;$('ac').textContent=`⏩ Velocidade da simulação: ×${s.esc} (tocar para alternar)`}
function fim(){const s=S.s;if(!s||s.fim)return;s.fim=true;clearInterval(S.tm);s.rc=String(Math.floor(Math.random()*900000)+100000);s.data=new Date().toLocaleString('pt-BR');go(7);Repo.salvarSessao(s).then(()=>r7())}
function r7(){const s=S.s,eco=s.cr-s.custo,est=s.usadas.map(e=>Motor.nome[e]).join(' + '),pm=s.e>0?s.custo/s.e:0;
 $('f7').innerHTML=kp([['Energia total',R(s.e)+' kWh'],['Duração',H(s.seg/60)],['Custo total',M(s.custo)],['Estratégia',est]].concat(eco>0.01?[['Economia estimada vs rápido',M(eco)]]:[]));
 $('rc').innerHTML=`<h2>🧾 Recibo Elevo #${s.rc}</h2>`+li('Data',s.data)+li('Carregador','#001')+li('Cliente',S.user)+li('Veículo',S.carro?S.carro.modelo+' · '+S.carro.placa:'Não informado')+li('Pagamento',S.pag+' (simulado)')+li('Energia (medidor)',R(s.e)+' kWh')+li('Bateria',S.cfg.soc+'% → '+Math.round(s.bat.soc*100)+'%')+li('Preço médio',M(pm)+'/kWh')+li('Duração',H(s.seg/60))+li('Estratégia',est)+li('Estimado antes da recarga',M(s.est0))+li('Valor final',`<b>${M(s.custo)}</b>`)+(s.srv&&s.srv.custo!=null?li('Calculado pelo backend Python',M(s.srv.custo)):'')+'<small class="n">Documento de demonstração, sem valor fiscal.</small>'}
function nova(){clearInterval(S.tm);S.s=null;S.pag=null;go(3)}
function rcar(){Motor.lim=S.carro&&+S.carro.ac||22;$('car').innerHTML=!S.conta?'🚗 Visitante: carro e recargas não ficam salvos. <button class="chip" onclick="login(1)">Criar conta</button> <button class="chip" onclick="login()">Entrar</button>':`🚗 <select onchange="S.carro=S.carros.find(x=>x.id==this.value);rcar();upd()" style="padding:10px;border-radius:10px">${S.carros.map(x=>`<option value="${x.id}" ${S.carro&&S.carro.id==x.id?'selected':''}>${x.modelo} · ${x.placa} · ${x.bateria} kWh</option>`).join('')||'<option>Nenhum carro cadastrado</option>'}</select> <button class="chip" onclick="novoCarro()">＋ Novo carro</button>`}
function novoCarro(){mo(`<h2>Novo carro</h2><input id="cm" placeholder="Modelo"><input id="cp" placeholder="Placa"><label>Bateria (kWh)</label><input id="cb" type="number" value="60"><label>Carregador de bordo (kW)</label><input id="ca" type="number" value="11"><p class="warn" id="er"></p><div class="row"><button class="btn" onclick="salvarCarro()">Salvar</button><button class="btn sec" onclick="closeM()">Cancelar</button></div>`)}
async function salvarCarro(){const b={modelo:$('cm').value.trim(),placa:$('cp').value.trim().toUpperCase(),bateria:+$('cb').value,ac:+$('ca').value};if(!b.modelo||!b.placa||!(b.bateria>0)||!(b.ac>0))return $('er').textContent='Preencha todos os campos';try{const x=await Api.req('POST','/carros',b);S.carros.push(x);S.carro=x;closeM();rcar();upd()}catch(e){$('er').textContent=e.message}}
async function conta(){if(!S.conta)return mo('<h2>Minha conta</h2><p>Entre ou crie uma conta para salvar carros e recargas.</p><div class="row"><button class="btn" onclick="login()">Entrar</button><button class="btn sec" onclick="login(1)">Criar conta</button></div>');
 const r=await Api.req('GET','/recargas');mo(`<h2>👤 ${S.conta.nome}</h2><p>${S.conta.email}</p><b>Carros</b>${S.carros.map(x=>li(x.modelo+' · '+x.placa,x.bateria+' kWh')).join('')||'<p>Nenhum cadastrado.</p>'}<b style="display:block;margin-top:12px">Recargas (${r.length})</b>${r.slice(-8).reverse().map(x=>li(x.data+' · '+R(x.energia)+' kWh',M(x.custo))).join('')||'<p>Nenhuma ainda.</p>'}<div class="row"><button class="btn sec" onclick="closeM()">Fechar</button><button class="btn sec" onclick="sair()">Sair</button></div>`)}
function sair(){Api.tk=null;S.conta=null;S.carros=[];S.carro=null;S.user='Visitante';Motor.lim=22;closeM()}
function reiniciar(){clearInterval(S.tm);S=newS();Api.tk=null;Motor.lim=22;closeM();view(1);go(1)}
const BASE=()=>[{n:'BYD Dolphin',rem:12,saida:120,max:11,pri:2,c:0},{n:'Renault Zoe',rem:6,saida:60,max:11,pri:3,c:1},{n:'Nissan Leaf',rem:15,saida:240,max:7.4,pri:1,c:2},{n:'Tesla Model 3',rem:18,saida:180,max:11,pri:1,c:3},{n:'VW ID.4',rem:8,saida:120,max:11,pri:2,c:4}];
const COL=['#5c8aff','#5f26fd','#7aa2ff','#9b6bff','#3d6fe6'],PN=['','Baixa','Média','Alta'],ST=0.5;
let G={vs:BASE(),total:22,kwh:0,t:null};
function view(n){$('totem').classList.toggle('hide',n!=1);$('gestao').classList.toggle('hide',n!=2);$('sessoes').classList.toggle('hide',n!=3);[1,2,3].forEach(i=>$('n'+i).classList.toggle('on',i==n));clearInterval(G.t);if(n==2){G.t=setInterval(gtick,1000);rg()}if(n==3)ses()}
function setP(x){G.total=x;$('gP').value=x;rg()}
function pri(i){G.vs[i].pri=G.vs[i].pri%3+1;rg()}
function gtick(){const a=Motor.alocar(G.vs,G.total);G.vs.forEach((v,i)=>{const d=a[i]*ST/60;v.rem=Math.max(0,v.rem-d);v.saida-=ST;G.kwh+=d});
 G.vs=G.vs.filter(v=>v.rem>0.01&&v.saida>0);if(!G.vs.length)G.vs=BASE();rg()}
function rg(){const vs=G.vs,n=vs.length,a=Motor.alocar(vs,G.total),u=a.reduce((x,y)=>x+y,0),eq=vs.map(v=>Math.min(v.max,G.total/n));
 const okf=(v,x)=>x>0&&v.rem/x*60<=v.saida,o1=vs.filter((v,i)=>okf(v,a[i])).length,o2=vs.filter((v,i)=>okf(v,eq[i])).length;
 $('gPv').textContent=G.total+' kW';
 $('gk').innerHTML=kp([['Potência total',R(G.total,0)+' kW'],['Utilizada',R(u,1)+' kW'],['Restante',R(G.total-u,1)+' kW'],['Sessões ativas',n],['Energia entregue',R(G.kwh,1)+' kWh'],['Receita simulada',M(G.kwh*1.17)]]);
 $('gb').innerHTML=vs.map((v,i)=>`<i title="${v.n}" style="width:${a[i]/G.total*100}%;background:${COL[v.c]}"></i>`).join('');
 $('gr').innerHTML=vs.map((v,i)=>{const ok=okf(v,a[i]);return `<tr><td><b style="color:${COL[v.c]}">●</b> ${v.n}</td><td><button class="chip ${v.pri==3?'sel':''}" onclick="pri(${i})">${PN[v.pri]}</button></td><td>${H(v.saida)}</td><td>${R(v.rem,1)} kWh</td><td><div class="bar"><i style="width:${a[i]/v.max*100}%;background:${COL[v.c]}"></i></div></td><td><b>${R(a[i],1)} kW</b></td><td>${H(a[i]>0?v.rem/a[i]*60:999)}</td><td class="${ok?'ok':'warn'}">${ok?'✓ No prazo':'⚠ Em risco'}</td></tr>`}).join('');
 $('gc').innerHTML=`com gestão por prioridade e prazo, <b>${o1}/${n}</b> veículos cumprem o horário de saída; com divisão igual da potência, <b>${o2}/${n}</b>.`}

const linha=x=>`<tr><td>#${x.recibo}</td><td>${x.data}</td><td>${x.carro||'-'}</td><td>${R(x.energia)} kWh</td><td>${x.duracao_min} min</td><td>${x.estrategia}</td><td>${M(x.custo)}</td></tr>`;
async function ses(){try{const j=await Api.req('GET','/sessoes?ordenar='+$('so').value+'&ordem='+$('sd').value),e=await Api.req('GET','/estatisticas');
 $('sinfo').innerHTML=`Ordenado por <b>${$('so').selectedOptions[0].text}</b> com <b>${j.algoritmo}</b>: ${j.comparacoes} comparações para n = ${j.n} sessões.`;
 $('sk').innerHTML=kp([['Sessões',e.total],['Energia total',R(e.energia_total)+' kWh'],['Valor total',M(e.receita)],['Custo médio',M(e.custo_medio)],['Maior recarga',R(e.maior_energia)+' kWh'],['Estratégia mais usada',e.estrategia_top||'-']]);
 $('st').innerHTML=j.sessoes.map(linha).join('')||'<tr><td colspan="7">Nenhuma sessão. Entre na conta e conclua uma recarga, ou gere sessões de demonstração.</td></tr>'}catch(e){$('sinfo').textContent=e.message}}
async function busca(){const q=$('sq').value.trim();if(!q)return ses();try{const j=await Api.req('GET','/busca?recibo='+encodeURIComponent(q));
 $('sinfo').innerHTML=j.resultado?`Encontrada em <b>${j.comparacoes}</b> comparações (busca linear, n = ${j.n}).`:`Não encontrada após <b>${j.comparacoes}</b> comparações (n = ${j.n}).`;
 $('st').innerHTML=j.resultado?linha(j.resultado):'<tr><td colspan="7">Sem resultado.</td></tr>'}catch(e){$('sinfo').textContent=e.message}}
async function demo(){try{await Api.req('POST','/demo');ses()}catch(e){$('sinfo').textContent=e.message}}
async function rel(){try{const j=await Api.req('GET','/relatorio');mo(`<h2>Relatório final</h2><pre style="white-space:pre-wrap;font:inherit">${j.texto}</pre><button class="btn sec" onclick="closeM()">Fechar</button>`)}catch(e){$('sinfo').textContent=e.message}}
