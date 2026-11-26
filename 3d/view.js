(() => {
  "use strict";
  const byId=id=>document.getElementById(id), canvas=byId("world"), ctx=canvas.getContext("2d");
  const topics=window.physics3DTopics, scenes=window.physics3DScenes, tau=2*Math.PI;
  const cameras={oblique:[-.43,.40],front:[0,0],above:[0,Math.PI/2],side:[Math.PI/2,0]};
  let yaw,pitch,zoom,activeCamera,scene,state,time,playing=false,frame=0,last=0,pointer=null;
  const readings=[];
  const choice=document.createElement("select");
  for(const [id,name] of topics)choice.add(new Option(name,id));
  choice.id="topic";byId("topic-slot").append(choice);
  choice.onchange=()=>{location.hash=choice.value;};
  function makeView(width,height){
    const cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
    const scale=zoom*.91*Math.min(width/(2*scene.extent),height/(1.2*scene.extent));
    const commands=[],tags=[];
    function project([x,y,z]){
      return [width/2+scale*(cy*x+sy*y),height/2-scale*(-sy*sp*x+cy*sp*y+cp*z),sy*cp*x-cy*cp*y+sp*z];
    }
    function stroke(a,b,color,weight,tip){
      const p=project(a),q=project(b);
      commands.push({depth:(p[2]+q[2])/2,draw(){
        const dx=q[0]-p[0],dy=q[1]-p[1],length=Math.hypot(dx,dy);
        if(length<.35)return;
        ctx.strokeStyle=color;ctx.lineWidth=weight;ctx.beginPath();ctx.moveTo(p[0],p[1]);ctx.lineTo(q[0],q[1]);ctx.stroke();
        if(tip){
          const ux=dx/length,uy=dy/length,h=Math.min(9,length*.48);
          ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(q[0],q[1]);
          ctx.lineTo(q[0]-h*ux-.43*h*uy,q[1]-h*uy+.43*h*ux);
          ctx.lineTo(q[0]-h*ux+.43*h*uy,q[1]-h*uy-.43*h*ux);ctx.closePath();ctx.fill();
        }
      }});
    }
    return {
      line:(a,b,color,w=1.4)=>stroke(a,b,color,w,false),
      arrow:(a,b,color,w=2.4)=>stroke(a,b,color,w,true),
      path(points,color,w=1.6){for(let i=1;i<points.length;i++)stroke(points[i-1],points[i],color,w,false);},
      face(points,color){
        const pts=points.map(project);
        commands.push({depth:pts.reduce((s,p)=>s+p[2],0)/pts.length,draw(){
          ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
          ctx.closePath();ctx.fillStyle=color;ctx.fill();
        }});
      },
      shell(pos,r,color){
        const [x,y,depth]=project(pos),radius=r*scale;
        commands.push({depth:depth-radius/scale,draw(){
          const glow=ctx.createRadialGradient(x,y,radius*.87,x,y,radius);
          glow.addColorStop(0,"rgba(32,140,126,0)");glow.addColorStop(1,"rgba(32,140,126,.065)");
          ctx.beginPath();ctx.arc(x,y,radius,0,tau);ctx.fillStyle=glow;ctx.fill();ctx.strokeStyle=color;ctx.lineWidth=1.4;ctx.stroke();
        }});
      },
      ball(pos,r,color){
        const [x,y,d]=project(pos),radius=Math.max(2,r*scale);
        commands.push({depth:d,draw(){
          const g=ctx.createRadialGradient(x-radius*.31,y-radius*.34,0,x,y,radius);
          g.addColorStop(0,"#f7ffff");g.addColorStop(.5,color);g.addColorStop(1,color);
          ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,radius,0,tau);ctx.fill();
        }});
      },
      tag(pos,text,color){const [x,y]=project(pos);tags.push(()=>{ctx.font="600 13px system-ui";ctx.textAlign="center";ctx.lineWidth=3;ctx.strokeStyle="#f1f7f6";ctx.strokeText(text,x,y);ctx.fillStyle=color;ctx.fillText(text,x,y);});},
      paint(){
        ctx.fillStyle="#f1f7f6";ctx.fillRect(0,0,width,height);
        ctx.lineJoin="round";ctx.lineCap="round";
        commands.sort((a,b)=>a.depth-b.depth);for(const cmd of commands)cmd.draw();for(const tag of tags)tag();
        const origin=project([0,0,0]);
        for(const [p,txt,col] of [[[1,0,0],"x","#9d4840"],[[0,1,0],"y","#437650"],[[0,0,1],"z","#336191"]]){
          const [x,y]=project(p),dx=(x-origin[0])/scale,dy=(y-origin[1])/scale;
          if(Math.hypot(dx,dy)<.04)continue;
          const ox=35,oy=height-35;ctx.strokeStyle=col;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(ox,oy);ctx.lineTo(ox+20*dx,oy+20*dy);ctx.stroke();
          ctx.textAlign="center";ctx.fillStyle=col;ctx.font="12px system-ui";ctx.fillText(txt,ox+28*dx,oy+28*dy+3);
        }
      }
    };
  }
  function endTime(){return scene.end ? scene.end(state) : scene.duration;}
  function render(){
    const {width,height}=canvas.getBoundingClientRect();if(!width||!height)return;
    const dpr=Math.min(2,devicePixelRatio||1),w=Math.round(width*dpr),h=Math.round(height*dpr);
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
    ctx.setTransform(w/width,0,0,h/height,0,0);
    const view=makeView(width,height),values=scene.draw(view,state,time);view.paint();
    for(let i=0;i<values.length;i++){
      if(!readings[i]){
        const box=document.createElement("div"),label=document.createElement("span"),out=document.createElement("strong");
        box.append(label,out);byId("metrics").append(box);readings.push([label,out]);
      }
      const [label,out]=readings[i];
      if(label.textContent!==values[i][0])label.textContent=values[i][0];
      if(out.textContent!==values[i][1])out.textContent=values[i][1];
    }
    if(scene.duration){
      byId("time").max=endTime();byId("time").value=time;byId("clock").textContent=time.toFixed(2)+" s";
      byId("play").textContent=playing?"一時停止":time>=endTime()?"最初から再生":"再生";
      byId("step").disabled=time>=endTime();
    }
    byId("zoom").textContent=Math.round(zoom*100)+"%";byId("smaller").disabled=zoom<=.6;byId("larger").disabled=zoom>=2;
    for(const btn of document.querySelectorAll("[data-camera]"))btn.setAttribute("aria-pressed",String(btn.dataset.camera===activeCamera));
  }
  function stop(){playing=false;cancelAnimationFrame(frame);frame=0;}
  function tick(now){
    if(!playing)return;
    time=Math.min(endTime(),time+Math.max(0,now-last)/1000);last=now;
    if(time>=endTime())stop();
    render();if(playing)frame=requestAnimationFrame(tick);
  }
  function load(){
    const requested=location.hash.slice(1);
    const [id,name,cat]=topics.find(([key])=>key===requested)||topics[0];
    stop();scene=scenes[id];choice.value=id;state={};readings.length=0;
    byId("controls").replaceChildren();byId("metrics").replaceChildren();byId("legend").replaceChildren();
    byId("title").textContent=name;document.title=name+"｜物理シミュレーター 3D版";
    byId("category").textContent=cat+" / 3D版";byId("original").href="../simulators/"+id+"/index.html";
    byId("guide").textContent=scene.guide;byId("formula").textContent=scene.formula;
    for(const [color,text] of scene.legend){const item=document.createElement("span"),dot=document.createElement("i");dot.style.background=color;item.append(dot,document.createTextNode(text));byId("legend").append(item);}
    for(const p of scene.params){
      const row=document.createElement("div"),label=document.createElement("label"),input=document.createElement("input"),out=document.createElement("output");
      row.className="field";input.id="input-"+p.key;label.htmlFor=input.id;label.append(document.createTextNode(p.title),out);
      Object.assign(input,{type:"range",min:p.min,max:p.max,step:p.step,value:p.value});
      function update(){state[p.key]=Number(input.value);out.textContent=input.value+(p.unit?" "+p.unit:"");}
      input.oninput=()=>{update();if(scene.duration){time=Math.min(time,endTime());if(time>=endTime())stop();}render();};update();
      row.append(label,input);byId("controls").append(row);
    }
    byId("transport").hidden=!scene.duration;byId("time").max=scene.duration||1;
    [yaw,pitch]=cameras.oblique;activeCamera="oblique";zoom=1;time=scene.initialTime||0;render();
  }
  byId("play").onclick=()=>{
    if(playing){stop();render();return;}
    if(time>=endTime())time=0;
    playing=true;last=performance.now();frame=requestAnimationFrame(tick);render();
  };
  byId("step").onclick=()=>{stop();time=Math.min(endTime(),time+.1);render();};
  byId("time").oninput=e=>{stop();time=Number(e.target.value);render();};
  byId("reset").onclick=()=>load();
  document.addEventListener("visibilitychange",()=>{if(document.hidden&&playing){stop();render();}});
  for(const btn of document.querySelectorAll("[data-camera]"))btn.onclick=()=>{activeCamera=btn.dataset.camera;[yaw,pitch]=cameras[activeCamera];render();};
  function rotate(dx,dy){activeCamera="";yaw+=dx;pitch=Math.max(-Math.PI/2,Math.min(Math.PI/2,pitch+dy));render();}
  canvas.onpointerdown=e=>{if(pointer)return;pointer={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);};
  canvas.onpointermove=e=>{if(pointer?.id!==e.pointerId)return;rotate((pointer.x-e.clientX)*.009,(e.clientY-pointer.y)*.009);pointer.x=e.clientX;pointer.y=e.clientY;};
  canvas.onlostpointercapture=()=>{pointer=null;};
  canvas.onkeydown=e=>{const d={ArrowLeft:[-.12,0],ArrowRight:[.12,0],ArrowUp:[0,.12],ArrowDown:[0,-.12]}[e.key];if(d){e.preventDefault();rotate(...d);}};
  byId("smaller").onclick=()=>{zoom=Math.max(.6,Math.round((zoom-.2)*10)/10);render();};
  byId("larger").onclick=()=>{zoom=Math.min(2,Math.round((zoom+.2)*10)/10);render();};
  window.addEventListener("hashchange",load);load();new ResizeObserver(render).observe(canvas);
})();
