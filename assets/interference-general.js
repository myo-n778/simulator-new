(function () {
  const root = document.querySelector('[data-interference-kind="general"]');
  if (!root) return;
  document.title = '2波源の一般的な干渉';
  window.PhysicsSimShell?.create({ title: document.title, subtitle: '波の干渉・回折' });

  const initial = { gap: 2, lambda: .55, frequency: 4, phase: 0, playback: 1 };
  const state = { ...initial, time: 0, playing: true, point: { x: .76, y: .5 } };
  root.innerHTML = `
    <div class="interference-app"><div class="interference-layout">
      <aside class="interference-panel"><h1>2波源の一般的な干渉</h1>
        <p class="interference-lead">A波（赤）とB波（青）を別々に見て、選んだ点での二つの正弦波と合成波を比べます。</p>
        <div class="interference-controls">
          ${field('gap','波源間隔 d','m',.4,4,.1)}
          ${field('lambda','波長 λ','m',.15,1.2,.05)}
          ${field('frequency','振動数 f','Hz',1,12,.5)}
          ${field('phase','B波の初期位相差','°',0,360,5)}
          ${field('playback','再生倍率','×',.25,3,.25)}
          <div class="interference-actions"><button data-action="play">一時停止</button><button data-action="step">0.1秒進む</button><button data-action="reset">リセット</button></div>
        </div>
        <p class="interference-note">A・Bの各波源は同じ振動数です。波の速さは <strong data-speed></strong> m/s（v = fλ）。合成波は y = y<sub>A</sub> + y<sub>B</sub> です。</p>
      </aside>
      <main class="interference-stage"><header class="interference-stage-head"><div><h2>A・B・合成波</h2><p>合成図の白い点をクリックすると観測点を移動できます。</p></div><div class="interference-readout" data-readout></div></header>
        <div class="interference-canvas-wrap"><canvas class="interference-canvas" aria-label="A波、B波、合成波と観測点の正弦波"></canvas></div>
        <div class="interference-info"><section><h3>色の意味</h3><p><span style="color:#ef4444;font-weight:800">赤＝A波</span>、<span style="color:#3b82f6;font-weight:800">青＝B波</span>、<span style="color:#a855f7;font-weight:800">紫＝合成波</span>。濃いほど振幅の絶対値が大きいことを示します。</p></section><section><h3>観測点の計算</h3><p data-explain></p></section><details><summary>発展：重ね合わせの式</summary><p>y<sub>A</sub> = sin(ωt − 2πr<sub>A</sub>/λ)、y<sub>B</sub> = sin(ωt − 2πr<sub>B</sub>/λ + φ<sub>0</sub>) とし、同じ場所・同じ時刻の変位を加えます。</p></details></div>
      </main>
    </div></div>`;

  function field(key, label, unit, min, max, step) {
    return `<div class="interference-field"><label>${label}<output data-out="${key}"></output></label><input type="range" data-key="${key}" aria-label="${label}" min="${min}" max="${max}" step="${step}" value="${initial[key]}"></div>`;
  }
  const canvas = root.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const inputs = [...root.querySelectorAll('[data-key]')];
  const fmt = (n, k) => k === 'phase' ? `${n.toFixed(0)} °` : `${n.toFixed(k === 'frequency' ? 1 : 2).replace(/\.00$/,'')} ${({gap:'m',lambda:'m',frequency:'Hz',playback:'×'})[k]}`;
  function updateControls() {
    inputs.forEach(input => { input.value = state[input.dataset.key]; root.querySelector(`[data-out="${input.dataset.key}"]`).textContent = fmt(state[input.dataset.key], input.dataset.key); });
    root.querySelector('[data-speed]').textContent = (state.lambda * state.frequency).toFixed(2);
  }
  inputs.forEach(input => input.addEventListener('input', () => { state[input.dataset.key] = Number(input.value); updateControls(); draw(); }));
  root.querySelector('[data-action="play"]').addEventListener('click', event => { state.playing = !state.playing; event.currentTarget.textContent = state.playing ? '一時停止' : '再生'; });
  root.querySelector('[data-action="step"]').addEventListener('click', () => { state.time += .1; draw(); });
  root.querySelector('[data-action="reset"]').addEventListener('click', () => { Object.assign(state, initial, { time: 0, playing: true, point: { x: .76, y: .5 } }); root.querySelector('[data-action="play"]').textContent = '一時停止'; updateControls(); draw(); });

  function size() { const r = canvas.getBoundingClientRect(), dpr = devicePixelRatio || 1; canvas.width = Math.floor(r.width * dpr); canvas.height = Math.floor(r.height * dpr); ctx.setTransform(dpr,0,0,dpr,0,0); return { w:r.width, h:r.height }; }
  function sourcePositions(box) { const gap = state.gap / 4 * box.h * .46; return [{x:box.x + box.w*.25, y:box.y + box.h*.5 - gap/2}, {x:box.x + box.w*.25, y:box.y + box.h*.5 + gap/2}]; }
  function wave(r, extra = 0) { return Math.sin(2*Math.PI*(r/(state.lambda*1.45) - state.time*state.frequency) + extra); }
  function ring(x,y,r,color,alpha) { ctx.globalAlpha=alpha; ctx.strokeStyle=color; ctx.lineWidth=1.2; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.stroke(); ctx.globalAlpha=1; }
  function label(text,x,y,color) { ctx.fillStyle=color; ctx.font='700 12px system-ui'; ctx.fillText(text,x,y); }
  function drawField(box, mode) {
    ctx.fillStyle='#091a2b'; ctx.fillRect(box.x,box.y,box.w,box.h); ctx.strokeStyle='#39536c'; ctx.strokeRect(box.x,box.y,box.w,box.h);
    const [a,b] = sourcePositions(box), scale = box.h / 4.4, phase = state.phase*Math.PI/180;
    const max = Math.hypot(box.w,box.h);
    if (mode !== 'sum') { const s = mode === 'a' ? a : b, color = mode === 'a' ? '#ef4444' : '#3b82f6', p = mode === 'a' ? 0 : phase; for (let r=10; r<max; r+=state.lambda*scale) ring(s.x,s.y,r + (state.time*state.frequency*state.lambda*scale)% (state.lambda*scale),color,.48); ctx.fillStyle=color;ctx.beginPath();ctx.arc(s.x,s.y,6,0,Math.PI*2);ctx.fill(); label(mode==='a'?'A波':'B波',box.x+10,box.y+18,color); return; }
    for(let y=box.y+3;y<box.y+box.h-3;y+=4) for(let x=box.x+3;x<box.x+box.w-3;x+=4) { const ya=wave(Math.hypot(x-a.x,y-a.y)/scale), yb=wave(Math.hypot(x-b.x,y-b.y)/scale,phase), amp=(ya+yb)/2, v=Math.round(25+210*Math.abs(amp)); ctx.fillStyle=amp>=0?`rgb(${v},80,255)`:`rgb(80,${v},255)`; ctx.fillRect(x,y,4,4); }
    ctx.fillStyle='#ef4444';ctx.beginPath();ctx.arc(a.x,a.y,5,0,Math.PI*2);ctx.fill();ctx.fillStyle='#3b82f6';ctx.beginPath();ctx.arc(b.x,b.y,5,0,Math.PI*2);ctx.fill();label('合成 y = A + B',box.x+10,box.y+18,'#c084fc');
    const p={x:box.x+state.point.x*box.w,y:box.y+state.point.y*box.h}; ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,7,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(p.x-11,p.y);ctx.lineTo(p.x+11,p.y);ctx.moveTo(p.x,p.y-11);ctx.lineTo(p.x,p.y+11);ctx.stroke();
  }
  function drawGraph(box, sample) { ctx.fillStyle='#071423';ctx.fillRect(box.x,box.y,box.w,box.h);ctx.strokeStyle='#39536c';ctx.strokeRect(box.x,box.y,box.w,box.h); const mid=box.y+box.h*.54;ctx.strokeStyle='#50667f';ctx.beginPath();ctx.moveTo(box.x+42,mid);ctx.lineTo(box.x+box.w-12,mid);ctx.stroke(); const [a,b]=sourcePositions(sample), p={x:sample.x+state.point.x*sample.w,y:sample.y+state.point.y*sample.h}, ra=Math.hypot(p.x-a.x,p.y-a.y)/(sample.h/4.4),rb=Math.hypot(p.x-b.x,p.y-b.y)/(sample.h/4.4),phase=state.phase*Math.PI/180; const curves=[['A波','#ef4444',t=>wave(ra,t*0)],['B波','#3b82f6',t=>wave(rb,phase)],['合成波','#c084fc',t=>wave(ra)+wave(rb,phase)]];
    curves.forEach(([name,color,fn],index)=>{ctx.strokeStyle=color;ctx.lineWidth=index===2?2.4:1.5;ctx.beginPath();for(let i=0;i<=box.w-58;i++){const tau=state.time+(i/(box.w-58)-.5)/state.frequency*2;const ya=Math.sin(2*Math.PI*(-tau*state.frequency-ra/(state.lambda*1.45)));const yb=Math.sin(2*Math.PI*(-tau*state.frequency-rb/(state.lambda*1.45))+phase);const val=index===0?ya:index===1?yb:ya+yb;const x=box.x+42+i,y=mid-val*(index===2?box.h*.18:box.h*.11);i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();label(name,box.x+8,box.y+18+index*16,color);});
    const ya=wave(ra),yb=wave(rb,phase); return {ra,rb,ya,yb};
  }
  function draw() { const {w,h}=size();ctx.fillStyle='#06111d';ctx.fillRect(0,0,w,h);const margin=12, topH=h*.54, gap=10, pw=(w-margin*2-gap*2)/3;const boxes=[0,1,2].map(i=>({x:margin+i*(pw+gap),y:margin,w:pw,h:topH-margin}));drawField(boxes[0],'a');drawField(boxes[1],'b');drawField(boxes[2],'sum');const graph={x:margin,y:topH+8,w:w-margin*2,h:h-topH-20}; const data=drawGraph(graph,boxes[2]);const dr=data.ra-data.rb,dp=2*Math.PI*dr/state.lambda+state.phase*Math.PI/180;root.querySelector('[data-readout]').innerHTML=`観測点 Δr = ${dr.toFixed(2)} m<br>位相差 Δφ = ${(dp*180/Math.PI).toFixed(0)}°`;root.querySelector('[data-explain]').innerHTML=`y<sub>A</sub> = ${data.ya.toFixed(2)}、y<sub>B</sub> = ${data.yb.toFixed(2)}、<strong>y = ${(data.ya+data.yb).toFixed(2)}</strong>。二つの波の同時の変位を足しています。`; }
  canvas.addEventListener('pointerdown', event => { const rect=canvas.getBoundingClientRect(), x=event.clientX-rect.left,y=event.clientY-rect.top; if(y < rect.height*.54 && x > rect.width*2/3) { const margin=12,gap=10,pw=(rect.width-margin*2-gap*2)/3,box={x:margin+2*(pw+gap),y:margin,w:pw,h:rect.height*.54-margin};state.point={x:Math.max(0,Math.min(1,(x-box.x)/box.w)),y:Math.max(0,Math.min(1,(y-box.y)/box.h))};draw(); } });
  let last=performance.now(); function frame(now) { const dt=(now-last)/1000;last=now;if(state.playing)state.time+=dt*state.playback;draw();requestAnimationFrame(frame); } updateControls();requestAnimationFrame(frame);window.addEventListener('resize',draw);
})();
