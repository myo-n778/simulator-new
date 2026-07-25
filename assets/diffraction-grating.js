(function(){
  const root=document.querySelector('[data-interference-kind="grating"]');if(!root)return;
  document.title='回折格子';window.PhysicsSimShell?.create({title:document.title,subtitle:'波の干渉・回折'});
  const COLORS=[
    {name:'赤',wavelength:650,color:'#ff5c5c'}, {name:'橙',wavelength:610,color:'#ff9d3d'},
    {name:'黄',wavelength:580,color:'#ffe96a'}, {name:'緑',wavelength:530,color:'#67e8a5'},
    {name:'青',wavelength:470,color:'#70b8ff'}, {name:'紫',wavelength:420,color:'#b99cff'}
  ];
  const SLIT_COUNT=10;
  const initial={spacing:6,observe:1,screen:'spherical',light:'single',color:'緑',wavelength:530},state={...initial};
  root.innerHTML=`<div class="interference-app"><div class="interference-layout"><aside class="interference-panel"><h1>回折格子</h1><p class="interference-lead">平面スクリーンと球面スクリーンを切り替え、主極大が現れる角度を比べます。</p><div class="interference-controls">${range('spacing','格子定数（格子間隔）d','μm',1.2,12,.1)}${range('observe','注目する次数 m','次',-30,30,1)}${select('screen','スクリーン','<option value="spherical">球面（上・下 ±90°）</option><option value="flat">平面</option>')}${select('light','入射光','<option value="single">単色光</option><option value="all">全色（可視光）</option>')}<div data-single-controls>${select('color','単色光の色',COLORS.map(c=>`<option value="${c.name}">${c.name}（${c.wavelength} nm）</option>`).join('')+'<option value="custom">任意指定</option>')}${wavelengthControl('wavelength','波長 λ','nm',380,780,1)}</div><div class="interference-actions"><button data-action="reset">初期値に戻す</button></div></div><p class="interference-note">常に、現在の条件で観測できるすべての次数を表示します。最大次数は <strong data-mmax></strong> 次です。</p></aside><main class="interference-stage"><header class="interference-stage-head"><div><h2 data-screen-title></h2><p data-screen-copy></p></div><div class="interference-readout" data-readout></div></header><div class="interference-canvas-wrap"><canvas class="interference-canvas" aria-label="回折格子とスクリーン上の主極大"></canvas></div><div class="interference-info"><section><h3>注目する次数</h3><p data-observe></p></section><section><h3>表示しているすべての次数</h3><p data-orders></p></section><section><h3>次数の上限</h3><p data-explain></p></section><details><summary>発展：スリット数と分解能</summary><p>スリット数は10本に固定しています。スリット数 N を増やすと主極大は細く鋭くなり、理想的な分解能の目安は R=mN です。この画面では位置の条件 d sinθ=mλ に焦点を絞っています。</p></details></div></main></div></div>`;
  function range(key,label,unit,min,max,step){return `<div class="interference-field"><label>${label}<output data-out="${key}"></output></label><input type="range" data-key="${key}" aria-label="${label}" min="${min}" max="${max}" step="${step}" value="${initial[key]}"></div>`;}
  function wavelengthControl(key,label,unit,min,max,step){return `<div class="interference-field"><label>${label}<output data-out="${key}"></output></label><input type="range" data-key="${key}" aria-label="${label}バー" min="${min}" max="${max}" step="${step}" value="${initial[key]}"><input type="number" data-key="${key}" aria-label="${label}（任意入力）" min="${min}" max="${max}" step="${step}" value="${initial[key]}"></div>`;}
  function select(key,label,options){return `<div class="interference-field"><label>${label}</label><select data-key="${key}" aria-label="${label}">${options}</select></div>`;}
  const canvas=root.querySelector('canvas'),ctx=canvas.getContext('2d'),inputs=[...root.querySelectorAll('[data-key]')];
  function spectralColor(wavelength){const w=Math.max(380,Math.min(780,wavelength));let r=0,g=0,b=0;if(w<440){r=-(w-440)/(440-380);b=1;}else if(w<490){g=(w-440)/(490-440);b=1;}else if(w<510){g=1;b=-(w-510)/(510-490);}else if(w<580){r=(w-510)/(580-510);g=1;}else if(w<645){r=1;g=-(w-645)/(645-580);}else r=1;const factor=w<420?.35+.65*(w-380)/40:w>700?.35+.65*(780-w)/80:1;return `rgb(${Math.round(255*r*factor)},${Math.round(255*g*factor)},${Math.round(255*b*factor)})`;}
  function singleSource(){if(state.color!=='custom')return COLORS.find(c=>c.name===state.color)||COLORS[3];return {name:'任意の単色光',wavelength:state.wavelength,color:spectralColor(state.wavelength)};}
  const wavelengths=()=>state.light==='all'?COLORS:[singleSource()];
  const maximum=()=>Math.floor(state.spacing*1000/Math.min(...wavelengths().map(c=>c.wavelength))+1e-9);
  function update(){
    const max=Math.min(30,maximum());state.observe=Math.max(-max,Math.min(state.observe,max));
    inputs.forEach(i=>{const k=i.dataset.key;if(k==='observe'){i.min=-max;i.max=max;}i.value=state[k];const unit={spacing:' μm',observe:' 次',wavelength:' nm'}[k];if(unit)root.querySelector(`[data-out="${k}"]`).textContent=state[k].toFixed(k==='spacing'?1:0)+unit;});
    root.querySelector('[data-single-controls]').hidden=state.light==='all';root.querySelector('[data-mmax]').textContent=max;
    root.querySelector('[data-screen-title]').textContent=state.screen==='spherical'?'球面スクリーン（上・下 ±90°）':'平面スクリーン';
    root.querySelector('[data-screen-copy]').textContent=state.screen==='spherical'?'格子中心からの角度 θ が、そのままスクリーン上の位置になります。':'中央からの高さが回折角 θ を表します。大きな角度ほど、平面スクリーン上では端へ大きく広がります。';
  }
  function applyControl(i){const key=i.dataset.key;if(key==='wavelength'){const value=Number(i.value);state.wavelength=Number.isFinite(value)?Math.max(380,Math.min(780,value)):state.wavelength;state.color='custom';}else state[key]=i.type==='range'?Number(i.value):i.value;if(key==='color'&&state.color!=='custom')state.wavelength=singleSource().wavelength;update();draw();}
  inputs.forEach(i=>{i.addEventListener('input',()=>applyControl(i));i.addEventListener('change',()=>applyControl(i));});
  root.querySelector('[data-action="reset"]').onclick=()=>{Object.assign(state,initial);update();draw();};
  function resize(){const r=canvas.getBoundingClientRect(),q=devicePixelRatio||1;canvas.width=Math.floor(r.width*q);canvas.height=Math.floor(r.height*q);ctx.setTransform(q,0,0,q,0,0);return {w:r.width,h:r.height};}
  function line(x1,y1,x2,y2,c,w=1,d=[]){ctx.save();ctx.setLineDash(d);ctx.strokeStyle=c;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.restore();}
  function text(s,x,y,c='#dbeafe',a='left'){ctx.fillStyle=c;ctx.font='700 12px system-ui';ctx.textAlign=a;ctx.fillText(s,x,y);}
  function incident(gx,gy){
    const beams=wavelengths();if(state.light==='all'){const bw=(gx-18)/beams.length;beams.forEach((c,i)=>{ctx.fillStyle=c.color+'33';ctx.fillRect(18+i*bw,gy-16,bw+1,32);line(18+i*bw,gy,gx,gy,c.color,2);});text('白色光（可視光）',28,gy-24,'#eaf6ff');}
    else {const c=beams[0];ctx.fillStyle=c.color+'33';ctx.fillRect(18,gy-16,gx-18,32);line(18,gy,gx,gy,c.color,2);text(`${c.name}の単色光（${c.wavelength} nm）`,28,gy-24,c.color);}
    for(let i=0;i<SLIT_COUNT;i++){const y=gy-58+i*116/(SLIT_COUNT-1);line(gx,y,gx,y+2,'#f7fbff',4);}text('回折格子',gx,gy+78,'#eaf6ff','center');
  }
  function draw(){
    const {w,h}=resize(),gx=w*.26,gy=h*.52,R=Math.min(w*.56,h*.43),shown=Math.min(30,maximum()),max=shown,beams=wavelengths();ctx.fillStyle='#06111d';ctx.fillRect(0,0,w,h);incident(gx,gy);
    let point;
    if(state.screen==='spherical'){
      ctx.strokeStyle='#bdd3e7';ctx.lineWidth=2;ctx.beginPath();ctx.arc(gx,gy,R,-Math.PI/2,Math.PI/2);ctx.stroke();[-90,90].forEach(deg=>{const a=deg*Math.PI/180,x=gx+R*Math.cos(a),y=gy+R*Math.sin(a);line(x,y,x+10*Math.cos(a),y+10*Math.sin(a),'#bdd3e7');text(`${deg}°`,x+14*Math.cos(a),y+16*Math.sin(a)+4,'#d8e7f5');});point=theta=>({x:gx+R*Math.cos(theta),y:gy+R*Math.sin(theta),visible:true});
    }else{
      const sx=w*.88,scale=Math.min(h*.43,w*.25),farthest=Math.max(...beams.map(c=>{const lambda=c.wavelength/1000,largest=Math.min(shown,Math.floor(state.spacing/lambda+1e-9));return Math.asin(Math.min(.999,largest*lambda/state.spacing));})),factor=scale*.86/Math.tan(Math.min(farthest,1.553));line(sx,gy-scale,sx,gy+scale,'#bdd3e7',3);[-60,-30,0,30,60].forEach(deg=>{const y=gy+Math.tan(deg*Math.PI/180)*factor;if(y>gy-scale&&y<gy+scale)line(sx-8,y,sx+8,y,'#bdd3e7');});text('平面スクリーン',sx,gy-scale-14,'#d8e7f5','center');point=theta=>({x:sx,y:gy+Math.tan(theta)*factor,visible:true});
    }
    const observed=singleSource(),observeLambda=observed.wavelength/1000,observeSin=state.observe*observeLambda/state.spacing,observeTheta=Math.abs(observeSin)<=1?Math.asin(observeSin):NaN;
    beams.forEach(c=>{const lambda=c.wavelength/1000;for(let m=-shown;m<=shown;m++){const s=m*lambda/state.spacing;if(Math.abs(s)>1)continue;const theta=Math.asin(s),p=point(theta);if(!p.visible)continue;const active=state.light==='single'&&m===state.observe,showCanvasLabel=state.light==='single'&&(state.screen==='spherical'||m===0||m===state.observe||Math.abs(m)===shown);line(gx,gy,p.x,p.y,active?c.color:'rgba(180,220,255,.18)',active?2.5:1);ctx.fillStyle=m===0?'#fff':c.color;ctx.beginPath();ctx.arc(p.x,p.y,active?7:state.light==='all'?3.5:5,0,Math.PI*2);ctx.fill();if(showCanvasLabel){const lx=state.screen==='flat'&&m===0?p.x-10:p.x+8,ly=state.screen==='flat'&&m===0?p.y-8:p.y+(m<0?-5:13),align=state.screen==='flat'&&m===0?'right':'left';text(`m=${m}`,lx,ly,'#eaf6ff',align);}}});
    const limit=Math.asin(Math.min(1,shown*observeLambda/state.spacing))*180/Math.PI;
    root.querySelector('[data-readout]').innerHTML=`表示: m = -${shown} 〜 +${shown}<br>全 ${shown*2+1} 個の主極大`;
    root.querySelector('[data-observe]').innerHTML=Number.isFinite(observeTheta)
      ? `m = ${state.observe} のとき、<strong>sin θ = ${observeSin.toFixed(4)}</strong>、<strong>θ = ${(observeTheta*180/Math.PI).toFixed(2)}°</strong> です。<br>d sin θ = mλ を満たします。`
      : `m = ${state.observe} は、現在の単色光では |sin θ|&gt;1 となるため、主極大は現れません。`;
    root.querySelector('[data-explain]').textContent=state.light==='all'
      ? `全色では波長ごとに角度が異なり、長波長の赤ほど外側へ現れます。最短波長 420 nm を基準に、最大 ${max} 次まで表示できます。`
      : `現在の ${observed.name}（${observed.wavelength} nm）では最大 ${max} 次まで存在します。表示している端の次数 m=±${shown} は θ=±${limit.toFixed(2)}°です。`;
    root.querySelector('[data-orders]').textContent=Array.from({length:shown*2+1},(_,i)=>`m=${i-shown}`).join('　');
  }
  update();draw();window.addEventListener('resize',draw);
})();
