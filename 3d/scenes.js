(() => {
  "use strict";
  const pi=Math.PI, tau=2*pi, deg=a=>a*pi/180;
  const blue="#1866a4", red="#c14938", teal="#007861", gold="#ad6900", violet="#8454a3", gray="#687e85";
  const param=(key,title,min,max,step,value,unit)=>({key,title,min,max,step,value,unit});
  const fmt=(n,d=2)=>Number(n.toFixed(d)).toLocaleString("ja-JP",{maximumFractionDigits:d});
  function circle(v,point,color,width=1.5){
    v.path(Array.from({length:65},(_,i)=>point(tau*i/64)),color,width);
  }
  const scenes={};
  scenes["doppler-effect"]={
    extent:6.2, duration:7, initialTime:4.7,
    params:[param("vs","音源の速度",-100,100,10,70,"m/s"),param("vo","観測者の速度",-60,60,10,-20,"m/s")],
    legend:[[red,"音源"],[blue,"観測者"],[teal,"放出時の位置を中心とする波面"],[gold,"受信した瞬間"]],
    guide:"速度は右向きが正です。まず観測者を静止させ、音源の速度を反転してください。濃緑の線分は隣り合う代表波面の間隔です。次に音源を静止させて観測者だけを動かすと、波面の間隔は一定のまま、届く間隔が変わります。",
    formula:"音速340 m/s、音源440 Hz。球は代表波面で、表示1秒に1枚放出します。波面間隔と受信頻度の比を保っています。",
    draw(v,s,t){
      const c=1.36, u=s.vs/250, w=s.vo/250;
      const source=a=>-3.2+u*a, observer=a=>2.4+w*a, arrival=i=>(5.6+(c-u)*i)/(c-w);
      v.line([-6,0,0],[5.8,0,0],gray,1);
      let count=0,last=-Infinity;
      for(let i=0;i<=Math.floor(t);i++){
        const r=c*(t-i),x=source(i), color=i===Math.floor(t)?teal:"#61a79d";
        if(r>.015){
          v.shell([x,0,0],r,color);
          circle(v,a=>[x+r*Math.cos(a),r*Math.sin(a),0],"#a6c9c4",.85);
        }
        if(arrival(i)<=t){count++;last=arrival(i);}
      }
      const newest=Math.floor(t);
      if(newest>=1){
        for(const direction of [-1,1]){
          const crest=i=>source(i)+direction*c*(t-i);
          const a=crest(newest),b=crest(newest-1),z=direction>0?.32:-.32;
          for(const x of [a,b]){v.ball([x,0,0],.045,teal);v.line([x,0,0],[x,0,z],teal,1);}
          v.line([a,0,z],[b,0,z],teal,2.6);
        }
      }
      const sx=source(t),ox=observer(t);
      v.ball([sx,0,0],.18,red);v.ball([ox,0,0],t-last<.23?.29:.18,t-last<.23?gold:blue);
      v.arrow([sx,0,.38],[sx+s.vs/90,0,.38],red);v.arrow([ox,0,.38],[ox+s.vo/90,0,.38],blue);
      v.tag([sx,0,-.45],"音源",red);v.tag([ox,0,-.45],"観測者",blue);
      return [["右側の波長",fmt((340-s.vs)/440,3)+" m"],["左側の波長",fmt((340+s.vs)/440,3)+" m"],["観測振動数",fmt(440*(340-s.vo)/(340-s.vs),1)+" Hz"],["代表波面の受信",count+" 回"]];
    }
  };
  scenes["conical-pendulum"]={
    extent:3.1,duration:12,initialTime:0,
    params:[param("length","糸の長さ",.6,2.4,.1,1.8,"m"),param("angle","鉛直からの角度",10,65,1,35,"°")],
    legend:[[blue,"おもりの水平軌道"],[teal,"張力"],[red,"重力"],[gold,"合力"]],
    guide:"真上からは水平な円が、正面からは糸の傾きが見えます。傾角を大きくし、張力の水平成分と円運動の周期の変化を比べてください。",
    formula:"質量1 kg、重力加速度9.8 m/s²。半径 r = L sinθ、角速度 ω = √(g / (L cosθ))。力の矢印は共通の縮尺です。",
    draw(v,s,t){
      const a=deg(s.angle),r=s.length*Math.sin(a),omega=Math.sqrt(9.8/(s.length*Math.cos(a)));
      const x=r*Math.cos(omega*t),y=r*Math.sin(omega*t),top=1.35,z=top-s.length*Math.cos(a);
      const p=[x,y,z], tension=9.8/Math.cos(a),f=.068,fx=-9.8*Math.tan(a)*Math.cos(omega*t)*f,fy=-9.8*Math.tan(a)*Math.sin(omega*t)*f;
      circle(v,k=>[r*Math.cos(k),r*Math.sin(k),z],blue);
      v.line([0,0,z-.3],[0,0,top],gray,1);v.line([0,0,top],p,gray,2.5);v.ball([0,0,top],.07,gray);
      v.arrow(p,[x+fx,y+fy,z+9.8*f],teal);v.arrow(p,[x,y,z-9.8*f],red);v.arrow(p,[x+fx,y+fy,z],gold);v.ball(p,.12,blue);
      return [["軌道半径",fmt(r)+" m"],["周期",fmt(tau/omega)+" s"],["張力",fmt(tension)+" N"]];
    }
  };
  function flightTime(s){
    const vertical=1.3*Math.cos(deg(s.angle)), horizontal=1.3*Math.sin(deg(s.angle));
    return Math.min(12,3.4/vertical,s.charge ? 2.5*tau/s.field : 3.2/horizontal);
  }
  scenes["magnetic-lorentz"]={
    extent:3.2,duration:12,end:flightTime,initialTime:2.5,
    params:[param("charge","電荷 q",-1,1,1,1,"C"),param("field","磁束密度",.8,2,.1,1.5,"T"),param("angle","速度と磁場の角度",0,90,5,75,"°")],
    legend:[[blue,"粒子の軌道"],[teal,"速度"],[red,"磁気力"],[violet,"磁場 B"]],
    guide:"真上から見ると磁場に垂直な運動、正面から見ると磁場に沿った移動が見えます。角度を0°や90°に変え、電荷の符号も反転してみてください。",
    formula:"質量1 kg、初速1.3 m/s、磁場は＋z向き。F = q v × B、r = mv⊥ / (|q|B)。灰色の線は最初の位置から先の軌道です。",
    draw(v,s,t){
      const speed=1.3,perp=speed*Math.sin(deg(s.angle)),parallel=speed*Math.cos(deg(s.angle)),w=s.charge*s.field;
      const point=a=>[w?perp*Math.sin(w*a)/w-.7:perp*a-.7,w?perp*(Math.cos(w*a)-1)/w:0,-1.7+parallel*a];
      const p=point(t),vx=perp*Math.cos(w*t),vy=-perp*Math.sin(w*t);
      v.path(Array.from({length:83},(_,i)=>point(flightTime(s)*i/82)),"#b6c6ce",1.5);
      v.path(Array.from({length:63},(_,i)=>point(t*i/62)),blue,3);
      v.arrow([-1.8,-.45,-1.7],[-1.8,-.45,-1.7+s.field],violet);
      v.arrow(p,[p[0]+vx*.65,p[1]+vy*.65,p[2]+parallel*.65],teal);
      v.arrow(p,[p[0]+w*vy*.55,p[1]-w*vx*.55,p[2]],red);v.ball(p,.115,blue);
      return [["円運動の半径",w&&perp>1e-9?fmt(perp/Math.abs(w))+" m":"直線運動"],["磁場方向の速度",fmt(parallel)+" m/s"],["磁気力の大きさ",fmt(Math.abs(w)*perp)+" N"]];
    }
  };
  scenes["electromagnetic-induction"]={
    extent:2.8,duration:8,initialTime:0,
    params:[param("field","磁束密度",.2,1,.1,.6,"T"),param("freq","回転の振動数",.25,1.5,.25,.5,"Hz"),param("area","コイルの面積",.5,3,.25,2,"m²")],
    legend:[[gold,"コイル（1巻き）"],[teal,"面の法線"],[violet,"磁場 B"]],
    guide:"正面と真上を切り替えて、コイル面の法線と磁場の角度を追ってください。法線が磁場と重なる瞬間と直角になる瞬間で、磁束と起電力を比べられます。",
    formula:"Φ = BA cos(2πft)、e = −dΦ/dt。面の向きは緑の法線で示します。",
    draw(v,s,t){
      const w=tau*s.freq,a=w*t,c=Math.cos(a),n=Math.sin(a),h=Math.sqrt(s.area)/2;
      const corners=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([k,z])=>[-n*k*h,c*k*h,z*h]);
      for(const y of [-1.2,1.2])for(const z of [-.6,.6]) v.arrow([-1.45,y,z],[-1.45+s.field*2.8,y,z],violet);
      v.face(corners,"rgba(219,165,68,.22)");v.path([...corners,corners[0]],gold,4);
      v.line([0,0,-1.35],[0,0,1.35],gray);v.arrow([0,0,0],[c*1.3,n*1.3,0],teal);
      return [["法線と磁場の角度",fmt(Math.acos(Math.max(-1,Math.min(1,c)))*180/pi,1)+"°"],["磁束 Φ",fmt(s.field*s.area*c)+" Wb"],["誘導起電力 e",fmt(s.field*s.area*w*n)+" V"],["起電力の最大値",fmt(s.field*s.area*w)+" V"]];
    }
  };
  scenes["magnetic-field-current"]={
    extent:2.6,params:[param("current","電流（上向きが正）",-8,8,1,4,"A"),param("radius","導線からの距離",.4,1.8,.1,1,"m")],
    legend:[[gold,"直線導線"],[red,"電流"],[blue,"観察点の磁場"]],
    guide:"真上から磁場の回り方を見て、電流を反転させてください。観察点を外側へ動かすと、磁場を表す青い矢印が短くなります。",
    formula:"十分に長い導線を仮定します。B = μ₀|I| / (2πr)。矢印は円周の接線方向を向きます。",
    draw(v,s){
      v.line([0,0,-1.65],[0,0,1.65],gold,5);
      v.arrow([0,0,0],[0,0,s.current*.19],red);
      const r=s.radius,b=.2*s.current/r;
      if(s.current){
        for(const z of [-.85,.85])circle(v,k=>[r*Math.cos(k),r*Math.sin(k),z],"#adbfc4",1);
        circle(v,k=>[r*Math.cos(k),r*Math.sin(k),0],blue);
        for(const k of [0,pi/2,pi,3*pi/2]){
          const x=r*Math.cos(k),y=r*Math.sin(k);
          v.arrow([x,y,0],[x-.39*b*Math.sin(k),y+.39*b*Math.cos(k),0],blue);
        }
      }
      v.line([0,0,0],[r,0,0],gray);v.ball([r,0,0],.075,teal);
      return [["磁束密度",fmt(Math.abs(b),3)+" μT"],["上から見た磁場",!s.current?"磁場なし":s.current>0?"反時計回り":"時計回り"]];
    }
  };
  scenes.polarization={
    extent:4.25,duration:6,initialTime:.3,
    params:[param("angle","透過軸の角度",0,90,5,40,"°"),param("amplitude","入射電場の振幅",.3,1.4,.1,1,"V/m")],
    legend:[[blue,"入射電場"],[teal,"透過電場"],[gold,"偏光板の透過軸"]],
    guide:"入射波と透過波はどちらも右へ進みます。斜めから偏光板の軸を回し、透過波の振動面と振幅を追ってください。",
    formula:"入射電場は鉛直方向。透過電場は透過軸への射影で、強度の比は I / I₀ = cos²θ です。波の進み方はスロー表示です。",
    draw(v,s,t){
      const a=deg(s.angle),c=Math.cos(a),n=Math.sin(a),amp=s.amplitude;
      const point=(x,out)=>{const z=amp*Math.cos(tau*(x/2-t));return out?[x,z*c*n,z*c*c]:[x,0,z];};
      v.face([[0,-1.35,-1.35],[0,1.35,-1.35],[0,1.35,1.35],[0,-1.35,1.35]],"rgba(184,149,70,.18)");
      v.line([0,-1.4*n,-1.4*c],[0,1.4*n,1.4*c],gold,4);
      v.arrow([-3.5,0,0],[3.55,0,0],gray,1.2);
      for(const out of [false,true]){
        const start=out?0:-3.4,color=out?teal:blue;
        v.path(Array.from({length:81},(_,i)=>point(start+3.4*i/80,out)),color,3);
        for(let j=1;j<=9;j++){const x=start+3.4*j/10;v.line([x,0,0],point(x,out),color,1);}
      }
      return [["透過電場の振幅",fmt(amp*c)+" V/m"],["透過強度の割合",fmt(100*c*c,1)+" %"]];
    }
  };
  scenes["xray-bragg"]={
    extent:3,params:[param("spacing","格子面間隔 d",.12,.32,.01,.2,"nm"),param("angle","格子面との角 θ",10,60,1,30,"°"),param("lambda","X線の波長 λ",.1,.32,.01,.2,"nm")],
    legend:[[blue,"格子面"],[gold,"上の面を通る光線"],[teal,"下の面を通る光線"],[violet,"余分に進む2区間"]],
    guide:"斜めから格子面の重なりを見て、正面で光路差を確認します。初期条件は1次の反射条件です。波長だけを変えると、光線の道筋は同じでも位相がずれます。",
    formula:"隣接面からの光路差 Δ = 2d sinθ。Δ/λ が整数のとき同位相になります。光線上の点は同じ位相を示し、間隔が1波長です。",
    draw(v,s){
      const a=deg(s.angle),sn=Math.sin(a),cs=Math.cos(a),d=s.spacing*5,z0=d/2;
      for(const z of [z0,-z0]){
        v.face([[-1.95,-.85,z],[1.95,-.85,z],[1.95,.85,z],[-1.95,.85,z]],"rgba(91,151,184,.12)");
        for(const x of [-1.8,-.9,0,.9,1.8])for(const y of [-.75,0,.75])v.ball([x,y,z],.048,blue);
      }
      const lambda=s.lambda*5,length=2.05;
      for(const lower of [false,true]){
        const z=lower?-z0:z0,color=lower?teal:gold;
        const hit=[0,0,z], source=[-length*cs,0,z+length*sn],end=[length*cs,0,z+length*sn];
        v.arrow(source,hit,color,2.5);v.arrow(hit,end,color,2.5);
        // Set a common incident plane-wave phase at both reflection sites.
        const phaseAtHit=lower?d*sn:0;
        for(let j=-18;j<=18;j++){
          const dist=j*lambda-phaseAtHit;
          if(Math.abs(dist)<=length)v.ball([dist*cs,0,z+Math.abs(dist)*sn],.055,color);
        }
      }
      const upper=[0,0,z0],lower=[0,0,-z0],extra=d*sn;
      const before=[-extra*cs,0,-z0+extra*sn],after=[extra*cs,0,-z0+extra*sn];
      v.line(upper,before,gray,1);v.line(upper,after,gray,1);
      v.path([before,lower,after],violet,3.5);
      const delta=2*s.spacing*sn, ratio=delta/s.lambda;
      return [["光路差 Δ",fmt(delta,3)+" nm"],["Δ / λ",fmt(ratio,3)],["位相差",fmt(360*ratio,1)+"°"]];
    }
  };
  window.physics3DScenes=scenes;
})();
