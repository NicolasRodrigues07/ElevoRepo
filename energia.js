const Bateria={
 ef:0.92,
 criar(kwh,soc){return{kwh,soc,temp:25}},
 aceita(b){
  let f=b.soc<0.8?1:Math.max(0.08,1-(b.soc-0.8)/0.2*0.92);
  if(b.temp>38)f*=Math.max(0.3,1-(b.temp-38)*0.1);
  return Math.min(Motor.lim,b.kwh*f)},
 passo(b,Pa,dt){
  const t=Date.now()/1000,V=380+4*Math.sin(t/7)+(Math.random()-.5)*2;
  const P=Math.min(Pa,this.aceita(b)),Pb=P*this.ef;
  b.soc=Math.min(1,b.soc+Pb*dt/3600/b.kwh);
  b.temp+=((P-Pb)*0.6-(b.temp-25)*0.05)*dt/60;
  return{P,V,I:P*1000/(Math.sqrt(3)*V*0.98),Vb:330+b.soc*90}}
};
