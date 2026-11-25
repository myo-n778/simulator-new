(function () {
  "use strict";

  const TAU = Math.PI * 2;
  const G = 9.80665;
  const KB = 1.380649e-23;
  const H = 6.62607015e-34;
  const C = 299792458;
  const E = 1.602176634e-19;
  const AMU = 1.66053906660e-27;
  const MU0 = 4e-7 * Math.PI;
  const EPS0 = 8.8541878128e-12;
  const KCOULOMB = 1 / (4 * Math.PI * EPS0);
  const scenarios = {};

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const rad = degrees => degrees * Math.PI / 180;
  const deg = radians => radians * 180 / Math.PI;
  const range = (key, label, min, max, step, value, unit = "") => ({ type: "range", key, label, min, max, step, value, unit });
  const select = (key, label, value, options) => ({ type: "select", key, label, value, options });
  const metric = (label, value) => ({ label, value });
  const curve = (count, fn) => Array.from({ length: count + 1 }, (_, index) => {
    const x = index / count;
    return [x, clamp(fn(x), 0, 1)];
  });
  const fmt = (value, digits = 3) => {
    if (!Number.isFinite(value)) return "—";
    const absolute = Math.abs(value);
    if ((absolute > 0 && absolute < 0.001) || absolute >= 100000) return value.toExponential(2);
    return value.toFixed(digits).replace(/\.0+$|(?<=\.[0-9]*?)0+$/g, "");
  };

  function add(id, definition) {
    scenarios[id] = definition;
  }

  function label(ctx, text, x, y, color = "#344054", size = 13, align = "left") {
    ctx.save();
    ctx.fillStyle = color;
    ctx.font = `600 ${size}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    ctx.fillText(String(text), x, y);
    ctx.restore();
  }

  function arrow(ctx, x1, y1, x2, y2, color = "#2364aa", width = 3) {
    if (Math.hypot(x2-x1,y2-y1)<1e-6) return;
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const size = 8 + width;
    ctx.save();
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = width;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - size * Math.cos(angle - Math.PI / 6), y2 - size * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - size * Math.cos(angle + Math.PI / 6), y2 - size * Math.sin(angle + Math.PI / 6));
    ctx.closePath(); ctx.fill(); ctx.restore();
  }

  function dot(ctx, x, y, radius, color, stroke = "#ffffff") {
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, radius, 0, TAU); ctx.fillStyle = color; ctx.fill();
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
    ctx.restore();
  }

  function plot(ctx, points, left, top, width, height, color, lineWidth = 3, dashed = false) {
    if (!points?.length) return;
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = lineWidth;
    if (dashed) ctx.setLineDash([7, 6]);
    ctx.beginPath();
    points.forEach(([x, y], index) => {
      const px = left + x * width, py = top + (1 - y) * height;
      if (index) ctx.lineTo(px, py); else ctx.moveTo(px, py);
    });
    ctx.stroke(); ctx.restore();
  }

  function drawGrid(ctx, width, height, tint = "#fbfdff") {
    ctx.fillStyle = tint; ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "#edf1f6"; ctx.lineWidth = 1;
    for (let x = 20; x < width; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
    for (let y = 20; y < height; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }
  }

  function drawGraph(ctx, width, height, visual) {
    drawGrid(ctx, width, height, visual.background);
    const left = 58, top = 68, graphW = width - 92, graphH = height - 132;
    ctx.strokeStyle = "#98a2b3"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(left, top); ctx.lineTo(left, top + graphH); ctx.lineTo(left + graphW, top + graphH); ctx.stroke();
    label(ctx, visual.xLabel || "x", left + graphW, top + graphH + 22, "#667085", 12, "right");
    label(ctx, visual.yLabel || "y", 8, top+9, "#667085", 11, "left");
    (visual.curves || []).forEach(item => plot(ctx, item.points, left, top, graphW, graphH, item.color || "#2364aa", item.width || 3, item.dashed));
    if (Number.isFinite(visual.markerX)) {
      const x = left + clamp(visual.markerX, 0, 1) * graphW;
      ctx.strokeStyle = "#dc4c45"; ctx.lineWidth = 2; ctx.setLineDash([6, 5]);
      ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, top + graphH); ctx.stroke(); ctx.setLineDash([]);
      if (Number.isFinite(visual.markerY)) dot(ctx,x,top+(1-clamp(visual.markerY,0,1))*graphH,5,"#c2413b");
    }
    (visual.legend || []).forEach((item, index) => label(ctx, item.label, left + index * Math.min(130,(width-65)/Math.max(1,visual.legend.length)), 46, item.color, 12));
    if (visual.title) label(ctx, visual.title, width / 2, 28, "#17202a", 16, "center");
  }

  function pointX(width, value) { return value * width; }
  function pointY(height, value) { return value * height; }

  function drawDiagram(ctx, width, height, visual) {
    drawGrid(ctx, width, height, visual.background);
    for (const region of visual.regions || []) {
      ctx.fillStyle = region.color; ctx.fillRect(pointX(width, region.x), pointY(height, region.y), pointX(width, region.w), pointY(height, region.h));
    }
    for (const line of visual.lines || []) {
      ctx.save(); ctx.strokeStyle = line.color || "#667085"; ctx.lineWidth = line.width || 3;
      if (line.dashed) ctx.setLineDash([7, 6]);
      ctx.beginPath(); ctx.moveTo(pointX(width, line.a[0]), pointY(height, line.a[1])); ctx.lineTo(pointX(width, line.b[0]), pointY(height, line.b[1])); ctx.stroke(); ctx.restore();
    }
    for (const poly of visual.polylines || []) {
      ctx.save(); ctx.strokeStyle = poly.color || "#2364aa"; ctx.lineWidth = poly.width || 3;
      if (poly.dashed) ctx.setLineDash([7, 6]);
      ctx.beginPath();
      poly.points.forEach((point, index) => index
        ? ctx.lineTo(pointX(width, point[0]), pointY(height, point[1]))
        : ctx.moveTo(pointX(width, point[0]), pointY(height, point[1])));
      if (poly.closed) ctx.closePath();
      if (poly.fill) { ctx.fillStyle = poly.fill; ctx.fill(); }
      ctx.stroke(); ctx.restore();
    }
    for (const rect of visual.rects || []) {
      ctx.save(); ctx.fillStyle = rect.fill || "#e8f1fb"; ctx.strokeStyle = rect.stroke || "#2364aa"; ctx.lineWidth = rect.width || 2;
      const x = pointX(width, rect.x), y = pointY(height, rect.y), w = pointX(width, rect.w), h = pointY(height, rect.h);
      ctx.fillRect(x, y, w, h); ctx.strokeRect(x, y, w, h); ctx.restore();
    }
    for (const circle of visual.circles || []) {
      dot(ctx, pointX(width, circle.x), pointY(height, circle.y), circle.r || 14, circle.color || "#2364aa", circle.stroke === false ? null : "#ffffff");
    }
    for (const item of visual.arrows || []) {
      arrow(ctx, pointX(width, item.a[0]), pointY(height, item.a[1]), pointX(width, item.b[0]), pointY(height, item.b[1]), item.color, item.width);
    }
    for (const text of visual.texts || []) {
      label(ctx, text.text, pointX(width, text.x), pointY(height, text.y), text.color || "#344054", text.size || 13, text.align || "center");
    }
    if (visual.title) label(ctx, visual.title, width / 2, 28, "#17202a", 16, "center");
  }

  function drawBars(ctx, width, height, visual) {
    drawGrid(ctx, width, height, visual.background);
    const bars = visual.bars || [];
    const max = Math.max(1e-12, visual.max || Math.max(...bars.map(item => Math.abs(item.value)), 1));
    const signed = bars.some(item=>item.value<0);
    const base=height*(signed?.49:.8), chartH=height*(signed?.28:.58);
    const slot = (width - 80) / Math.max(1, bars.length);
    bars.forEach((item, index) => {
      const barH = Math.abs(item.value) / max * chartH;
      const x = 50 + index * slot + slot * .18;
      ctx.fillStyle = item.color || "#2364aa"; ctx.fillRect(x,item.value<0?base:base-barH,slot*.64,barH);
      label(ctx, item.label, x + slot * .32, signed?height*.91:base+22, "#344054", 12, "center");
      label(ctx, item.display ?? fmt(item.value), x + slot * .32, item.value<0?base+barH+15:base-barH-15, item.color || "#2364aa", 12, "center");
    });
    ctx.strokeStyle = "#98a2b3"; ctx.beginPath(); ctx.moveTo(35, base); ctx.lineTo(width - 25, base); ctx.stroke();
    if (visual.title) label(ctx, visual.title, width / 2, 30, "#17202a", 16, "center");
  }

  function segment(ctx, x1, y1, x2, y2, color, width = 2) {
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2);
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
  }

  function drawBrownian(ctx, w, h, v) {
    drawGrid(ctx,w,h);
    const cx = w/2, cy = h/2, diffusionScale = Math.sqrt(2*v.diffusion)*1e6;
    // Choose one scale for the full observation, including the reference path.
    const referenceScale = Math.sqrt(2 * KB * 300 / (6*Math.PI*1e-3*.5e-6))*1e6;
    const largestScale = Math.max(referenceScale,diffusionScale);
    const reach = largestScale*brownianReach[Math.ceil(v.duration/brownianStep)];
    const halfSpan = 4*2**Math.max(0,Math.ceil(Math.log2(Math.max(1,reach/4))));
    const px = Math.min(w*.43,h*.34)/halfSpan, barLength=halfSpan/4;
    const point = ([x,y],scale) => [cx+x*scale*px,cy+y*scale*px];
    label(ctx,"青い円は二乗平均平方根の変位",w/2,21,"#2364aa",14,"center");
    label(ctx,"灰色の軌跡は初期条件での比較用",w/2,42,"#667085",12,"center");
    ctx.beginPath(); ctx.arc(cx,cy,v.rms*px,0,TAU); ctx.strokeStyle="#2364aa"; ctx.lineWidth=2; ctx.stroke();
    for(const [scale,color] of [[referenceScale,"#8995a5"],[diffusionScale,"#c2413b"]]) {
      ctx.beginPath(); v.path.forEach((p,i) => i ? ctx.lineTo(...point(p,scale)) : ctx.moveTo(...point(p,scale)));
      ctx.strokeStyle=color; ctx.lineWidth=1.8; ctx.stroke();
    }
    dot(ctx,cx,cy,3,"#344054"); dot(ctx,...point(v.path[v.path.length-1],diffusionScale),4,"#c2413b");
    segment(ctx,18,h-35,18+barLength*px,h-35,"#344054",3);
    label(ctx,fmt(barLength)+" μm",18,h-18); label(ctx,"赤は同じ乱数で追った1粒子",w-12,h-18,"#c2413b",12,"right");
  }

  function drawBragg(ctx,w,h,v) {
    drawGrid(ctx,w,h);
    const x=w*.5, y=h*.40, gap=v.spacing*Math.min(h*.47,w*.48);
    for (let py=y; py<h*.88; py+=gap) segment(ctx,w*.07,py,w*.93,py,"#a4b0c2",2);
    if (!Number.isFinite(v.theta)) {
      label(ctx,"nλ が 2d を超えるため、この次数の反射は生じない",x,28,"#9a3412",12,"center");
      return;
    }
    const sin=Math.sin(v.theta), cos=Math.cos(v.theta);
    const length=Math.min((w*.43)/Math.max(.001,cos),(y-42)/Math.max(.001,sin));
    const extra=gap*sin;
    for (const [plane,origin,color] of [["lower",y+gap,"#7c3aed"],["upper",y,"#2364aa"]]) {
      if (v.planes!=="both" && v.planes!==plane) continue;
      arrow(ctx,x-length*cos,origin-length*sin,x-length*.48*cos,origin-length*.48*sin,color,2);
      segment(ctx,x-length*cos,origin-length*sin,x,origin,color);
      segment(ctx,x,origin,x+length*cos,origin-length*sin,color);
      arrow(ctx,x+length*.55*cos,origin-length*.55*sin,x+length*cos,origin-length*sin,color,2);
    }
    for (const sign of v.planes==="both" ? [-1,1] : []) {
      const footX=x+sign*extra*cos, footY=y+gap-extra*sin;
      ctx.setLineDash([4,4]); segment(ctx,x,y,footX,footY,"#667085",1.5); ctx.setLineDash([]);
      segment(ctx,x,y+gap,footX,footY,"#c2410c",4);
    }
    ctx.beginPath(); ctx.arc(x,v.planes==="lower" ? y+gap : y,Math.min(32,length*.32),-v.theta,0); ctx.strokeStyle="#2364aa"; ctx.lineWidth=2; ctx.stroke();
    label(ctx,"結晶面との角度 θ = "+fmt(deg(v.theta),1)+"°",x,22,"#2364aa",14,"center");
    if (Math.abs(cos)<1e-7) label(ctx,"入射と反射の光路が重なる",x,h-48,"#667085",12,"center");
    if (v.planes==="both") label(ctx,"橙の2区間の和　2d sinθ = "+fmt(v.pathDifference)+" nm",x,h-24,"#9a3412",13,"center");
    else label(ctx,v.planes==="upper" ? "上の格子面で反射する光線" : "下の格子面で反射する光線",x,h-24,"#475467",13,"center");
  }

  function drawCircuit(ctx,w,h,v) {
    drawGrid(ctx,w,h);
    const rc=v.device==="RC", x=w*.5, y=h*.18, span=Math.min(66,w*.18);
    const blue="#2364aa", red="#b23c32", green="#087f5b";
    const magnitude=Math.abs(v.current);
    const arrowLen=span*(1-Math.exp(-magnitude/(rc ? .25 : .5)));
    if (arrowLen>1) {
      const dir=v.current<0 ? -1 : 1;
      arrow(ctx,x-span*.6-dir*arrowLen/2,y-30,x-span*.6+dir*arrowLen/2,y-30,green,2);
    }
    label(ctx,"I = "+fmt(v.current)+(rc?" mA":" A"),x,y-54,green,14,"center");
    if (rc) {
      for (const side of [-1,1]) {
        segment(ctx,x+side*12,y-18,x+side*12,y+23,blue,4);
        segment(ctx,x+side*12,y,x+side*(span+20),y,blue);
      }
      if (v.charge > 0) { label(ctx,"+",x-24,y+12,red); label(ctx,"−",x+18,y+12,blue); }
      label(ctx,"極板の電荷　"+fmt(v.charge)+" μC（"+fmt(100*v.fraction,1)+"%）",x,y+42,blue,13,"center");
      const start=x-span, fill=v.fraction;
      ctx.fillStyle="#e0e9f3"; ctx.fillRect(start,y+55,2*span,7);
      ctx.fillStyle=blue; ctx.fillRect(start,y+55,2*span*fill,7);
    } else {
      ctx.strokeStyle=blue; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(x-span-15,y);
      for(let i=0;i<5;i++) ctx.arc(x-span+(2*i+1)*span/5,y,span/5,Math.PI,0);
      ctx.lineTo(x+span+15,y); ctx.stroke();
      const emfLen=span*(1-Math.exp(-v.voltage/8));
      if(emfLen>1) arrow(ctx,x+emfLen/2,y+18,x-emfLen/2,y+18,red,2);
      label(ctx,"自己誘導起電力　"+fmt(-v.voltage)+" V",x,y+42,red,13,"center");
    }
    const top=h*.47, bottom=h-82, left=40, right=w-22, gh=bottom-top;
    const at=(u,level)=>[left+u*(right-left),bottom-level*gh];
    const fraction=u=> rc && v.discharge ? Math.exp(-5*u) : 1-Math.exp(-5*u);
    segment(ctx,left,top,left,bottom,"#94a3b8"); segment(ctx,left,bottom,right,bottom,"#94a3b8");
    for(let i=0;i<=5;i++) {
      label(ctx,String(i)+"τ",left+(right-left)*i/5,bottom+14,"#475467",11,"center");
      label(ctx,fmt(i*v.tau,3)+" s",left+(right-left)*i/5,bottom+32,"#475467",10,"center");
    }
    label(ctx,"1",left-12,top); label(ctx,"0",left-12,bottom);
    for (const [fn,color] of [[fraction,blue],...(rc ? [] : [[u=>Math.exp(-5*u),red]])]) {
      plot(ctx,curve(100,fn),left,top,right-left,gh,color,2.5);
      dot(ctx,...at(v.ratio/5,fn(v.ratio/5)),5,color);
    }
    label(ctx,rc ? "青　コンデンサー電圧 / 初期または電源電圧" : "青　I / I∞　　 赤　コイル電圧 / 電源電圧",x,h-18,blue,12,"center");
  }

  function drawVisual(ctx, width, height, visual) {
    if (visual?.draw) { drawGrid(ctx,width,height); visual.draw(ctx,width,height); return; }
    if (!visual || visual.kind === "diagram") drawDiagram(ctx, width, height, visual || {});
    else if (visual.kind === "brownian") drawBrownian(ctx,width,height,visual);
    else if (visual.kind === "bragg") drawBragg(ctx,width,height,visual);
    else if (visual.kind === "circuit") drawCircuit(ctx,width,height,visual);
    else if (visual.kind === "graph") drawGraph(ctx, width, height, visual);
    else if (visual.kind === "bars") drawBars(ctx, width, height, visual);
  }

  function diagram(parts = {}) { return { kind: "diagram", ...parts }; }
  function graph(parts = {}) { return { kind: "graph", ...parts }; }
  function bars(parts = {}) { return { kind: "bars", ...parts }; }

  add("air-resistance", {
    timeRelevant: true,
    title: "空気抵抗と終端速度", subtitle: "抗力を受ける落下速度と終端速度", lead: "速度に比例する空気抵抗を受ける物体について、速度が一定値へ近づく過程を追います。",
    formula: "m dv/dt = mg − bv\nv(t) = v∞(1−e^(−t/τ))\nv∞ = mg/b,  τ = m/b", focus: "加速度が0になるのは重力と空気抵抗がつり合ったときです。",
    controls: [range("mass", "質量 m", .1, 10, .1, 2, " kg"), range("drag", "抗力係数 b", .1, 8, .1, 1.5, " N·s/m"), range("time", "観察時間", 1, 30, .5, 12, " s")],
    duration: s => s.time,
    calc(s, t) {
      const terminal = s.mass * G / s.drag, tau = s.mass / s.drag, time = Math.min(s.time,t);
      const velocity = terminal * (1 - Math.exp(-time / tau));
      const distance = terminal * time - terminal * tau * (1 - Math.exp(-time / tau));
      return { metrics: [metric("終端速度", `${fmt(terminal)} m/s`), metric("時定数", `${fmt(tau)} s`), metric("現在の速度", `${fmt(velocity)} m/s`), metric("落下距離", `${fmt(distance)} m`)], visual: graph({ title: "速度は終端速度へ漸近する", xLabel: "t", yLabel: "v/v∞", curves: [{ color: "#2364aa", points: curve(100, x => 1 - Math.exp(-(x * s.time) / tau)) }, { color: "#dc4c45", dashed: true, points: [[0, 1], [1, 1]] }], markerX: time / s.time, legend: [{ label: "速度", color: "#2364aa" }, { label: "終端速度", color: "#dc4c45" }] }) };
    }
  });

  add("coupled-pulley-dynamics", {
    timeRelevant: true,
    title: "連結物体と滑車の運動", subtitle: "アトウッドの装置の加速度と張力", lead: "軽い糸と摩擦のない滑車でつながれた2物体の運動を、2本の運動方程式から調べます。",
    formula: "m₂g−T = m₂a\nT−m₁g = m₁a\na = (m₂−m₁)g/(m₁+m₂)", focus: "2物体の加速度の大きさは、伸びない糸の条件により等しくなります。",
    controls: [range("m1", "左の質量 m₁", .5, 10, .5, 3, " kg"), range("m2", "右の質量 m₂", .5, 10, .5, 6, " kg"), range("height", "移動可能距離", .5, 3, .1, 1.5, " m")],
    duration(s) {
      const a = G * Math.abs(s.m2 - s.m1) / (s.m1 + s.m2);
      return a ? Math.sqrt(2 * s.height / a) : 0;
    },
    calc(s, t) {
      const a = G * (s.m2 - s.m1) / (s.m1 + s.m2);
      const tension = 2 * G * s.m1 * s.m2 / (s.m1 + s.m2);
      const distance = Math.min(s.height, Math.abs(a) * t * t / 2);
      const shift = Math.sign(a) * distance * .075;
      const objects = [
        { x: .36, y: .56 - shift, mass: s.m1, name: "m₁", fill: "#dbeafe" },
        { x: .64, y: .56 + shift, mass: s.m2, name: "m₂", fill: "#fee2e2" }
      ];
      const rope = Array.from({ length: 41 }, (_, i) => {
        const angle = Math.PI * i / 40;
        return [.5 - .14 * Math.cos(angle), .22 - .1 * Math.sin(angle)];
      });
      const visual = diagram({
        title: a === 0 ? "質量が等しいので静止" : a > 0 ? "右のおもりが下がる" : "左のおもりが下がる",
        polylines: [{ points: rope, fill: "#e2e8f0", color: "#475467" }],
        lines: [{ a: [.15, .56], b: [.85, .56], dashed: true, color: "#94a3b8", width: 1 },
          ...objects.map(o => ({ a: [o.x,.22], b: [o.x,o.y] }))],
        rects: objects.map(o => ({ x: o.x-.095, y: o.y-.04, w: .19, h: .08, fill: o.fill })),
        texts: objects.map(o => ({ text: o.name+" "+fmt(o.mass)+" kg", x:o.x, y:o.y })),
        arrows: objects.flatMap(o => [
          { a:[o.x-.055,o.y-.04], b:[o.x-.055,o.y-.04-.00135*tension], color:"#087f5b" },
          { a:[o.x+.055,o.y+.04], b:[o.x+.055,o.y+.04+.00135*o.mass*G], color:"#7c3aed" }
        ])
      });
      visual.texts.push({text:"緑 ↑ 張力　 紫 ↓ 重力　 破線は出発点", x:.5, y:.97});
      return { metrics: [metric("加速度（右のおもりの下向きが正）", fmt(a)+" m/s²"),
        metric("運動中の張力", fmt(tension)+" N"), metric("各おもりの移動距離", fmt(distance)+" m"),
        metric("観察時刻", fmt(t)+" s")], visual };
    }
  });

  add("conical-pendulum", {
    timeRelevant: true,
    title: "円錐振り子", subtitle: "張力の成分と水平円運動", lead: "糸が鉛直となす角度を変え、張力の鉛直成分と水平成分の役割を分けて考えます。",
    formula: "T cosθ = mg\nT sinθ = mω²r\nr = L sinθ,  ω = √(g/(L cosθ))", focus: "高さ方向はつり合い、水平方向の合力は向心力になります。",
    controls: [range("mass", "質量 m", .1, 5, .1, 1, " kg"), range("length", "糸の長さ L", .3, 3, .1, 1.2, " m"), range("angle", "鉛直からの角度 θ", 5, 70, 1, 35, "°")],
    calc(s, t) {
      const theta = rad(s.angle), radius = s.length * Math.sin(theta), tension = s.mass * G / Math.cos(theta), omega = Math.sqrt(G / (s.length * Math.cos(theta))), period = TAU / omega;
      const phase = omega * t;
      const figure = {draw(ctx,w,h) {
        const scale=Math.min(w*.42,h*.6)/3, cx=w/2, pivot=h*.17;
        const rx=radius*scale, plane=pivot+s.length*Math.cos(theta)*scale;
        const x=cx+rx*Math.cos(phase), y=plane+rx*.24*Math.sin(phase);
        ctx.strokeStyle="#94a3b8"; ctx.beginPath();ctx.ellipse(cx,plane,rx,rx*.24,0,0,TAU);ctx.stroke();
        segment(ctx,cx,pivot,x,y,"#475467"); dot(ctx,x,y,5+2*Math.sqrt(s.mass),"#2364aa");
        const weight=Math.min(w,h)*.12*(s.mass/2)/(1+s.mass/2);
        const inward=-weight*Math.tan(theta);
        arrow(ctx,x,y,x,y+weight,"#7c3aed");
        arrow(ctx,x,y,x+inward*Math.cos(phase),y-weight+inward*.24*Math.sin(phase),"#087f5b");
        label(ctx,"緑は張力　紫は重力",cx,h-23,"#344054",13,"center");
      }};
      return { metrics: [metric("回転半径 r", `${fmt(radius)} m`), metric("張力 T", `${fmt(tension)} N`), metric("角速度 ω", `${fmt(omega)} rad/s`), metric("周期", `${fmt(period)} s`)], visual: figure };
    }
  });

  add("non-inertial-frame", {
    title: "非慣性系と見かけの力", subtitle: "加速する車内の有効重力", lead: "水平加速度をもつ乗り物の中で、慣性力を導入したつり合いを考えます。",
    formula: "F慣性 = −ma₀\ng_eff = √(g²+a₀²)\ntanθ = a₀/g", focus: "見かけの力は、加速する座標系で運動方程式を使うために導入します。",
    controls: [range("acceleration", "乗り物の加速度 a₀", -12, 12, .5, 4, " m/s²"), range("mass", "物体の質量", .2, 5, .1, 1, " kg"), select("mode", "表示", "pendulum", [["pendulum", "振り子"], ["block", "床上の物体"]])],
    calc(s) {
      const theta = Math.atan2(s.acceleration, G), geff = Math.hypot(G, s.acceleration), inertial = -s.mass * s.acceleration;
      const bx = .5 - .28 * Math.sin(theta), by = .2 + .28 * Math.cos(theta);
      return { metrics: [metric("傾き θ", `${fmt(deg(theta), 1)}°`), metric("有効重力", `${fmt(geff)} m/s²`), metric("慣性力", `${fmt(inertial)} N`), metric("重力", `${fmt(s.mass * G)} N`)], visual: diagram({ title: "加速系では重力と慣性力を合成する", rects: [{ x: .12, y: .72, w: .76, h: .12, fill: "#eef4fa", stroke: "#667085" }], lines: s.mode === "pendulum" ? [{ a: [.5, .2], b: [bx, by], width: 4 }] : [], circles: s.mode === "pendulum" ? [{ x: bx, y: by, r: 17, color: "#2364aa" }] : [], arrows: [{ a: [.5, .46], b: [.5, .46+s.mass*G/165], color: "#7c3aed" }, { a: [.5, .46], b: [.5 - s.mass*s.acceleration / 165, .46], color: "#dc4c45" }, { a: [.5, .46], b: [.5 - s.mass*s.acceleration / 165, .46+s.mass*G/165], color: "#087f5b" }, { a: [.18, .88], b: [.18 + s.acceleration/60, .88], color: "#2364aa" }], texts: [{ text: "mg", x: .54, y: .68, color: "#7c3aed" }, { text: "−ma₀", x: .5 - s.acceleration / 60, y: .42, color: "#dc4c45" }, { text: "合力", x: .5 - s.acceleration / 60 + .04, y: .62, color: "#087f5b" }, { text: "車の加速度", x: .3, y: .88, color: "#2364aa" }] }) };
    }
  });

  add("banked-curve", {
    title: "バンクした道路と円運動", subtitle: "傾斜角・設計速度・摩擦限界", lead: "傾いた道路で法線力と摩擦力を分解し、曲がれる条件を調べます。",
    formula: "摩擦なし：tanθ = v²/(rg)\nN = m(g cosθ + v² sinθ/r)\nf = m(v² cosθ/r − g sinθ)", focus: "設計速度では摩擦力が不要になり、法線力の水平成分だけで曲がれます。",
    controls: [range("radius", "カーブ半径 r", 10, 300, 5, 80, " m"), range("angle", "バンク角 θ", 0, 35, 1, 12, "°"), range("speed", "走行速度 v", 1, 45, .5, 18, " m/s"), range("mu", "静止摩擦係数", 0, .8, .05, .3, "")],
    calc(s) {
      const th = rad(s.angle), design = Math.sqrt(s.radius * G * Math.tan(th));
      const normal = G * Math.cos(th) + s.speed ** 2 / s.radius * Math.sin(th);
      const friction = s.speed ** 2 / s.radius * Math.cos(th) - G * Math.sin(th), ratio = Math.abs(friction) / normal;
      const figure = {draw(ctx,w,h) {
        const cx=w*.5, cy=h*.53, len=Math.min(w*.41,h*.45);
        const dx=Math.cos(th),dy=-Math.sin(th);
        segment(ctx,cx-len*dx,cy-len*dy,cx+len*dx,cy+len*dy,"#667085",6);
        ctx.save();ctx.translate(cx,cy);ctx.rotate(-th);ctx.fillStyle=ratio<=s.mu?"#2364aa":"#c2413b";ctx.fillRect(-21,-19,42,18);ctx.restore();
        const basis=Math.min(w*.32,h*.29)/Math.max(G,normal,Math.abs(friction));
        arrow(ctx,cx,cy,cx,cy+basis*G,"#7c3aed");
        arrow(ctx,cx,cy,cx-basis*normal*Math.sin(th),cy-basis*normal*Math.cos(th),"#087f5b");
        if(Math.abs(friction)>.002) arrow(ctx,cx,cy,cx-basis*friction*dx,cy-basis*friction*dy,"#c2413b");
        label(ctx,ratio<=s.mu?"摩擦限界内":"必要な摩擦力が限界を超える",cx,24,"#344054",15,"center");
        label(ctx,"中心は左　緑は垂直抗力、赤は必要な摩擦力",cx,h-24,"#344054",12,"center");
      }};
      return { metrics: [metric("設計速度", `${fmt(design)} m/s`), metric("必要な摩擦/質量", `${fmt(friction)} N/kg`), metric("|f|/N", fmt(ratio)), metric("走行判定", ratio <= s.mu ? "摩擦限界内" : "滑り出す")], visual: figure };
    }
  });

  add("rolling-motion", {
    timeRelevant: true,
    duration: s => Math.sqrt(2*s.height*(1+({sphere:.4,disk:.5,ring:1})[s.shape])/G)/Math.sin(rad(s.angle)),
    title: "転がり運動", subtitle: "並進と回転へのエネルギー分配", lead: "同じ高さから転がした物体でも、慣性モーメントによって加速度が変わります。",
    formula: "I = kmR²\na = g sinθ/(1+k)\nv = √(2gh/(1+k))", focus: "回転に多くのエネルギーを使う形ほど、重心の速さは小さくなります。",
    controls: [select("shape", "形状", "sphere", [["sphere", "中実球"], ["disk", "円板"], ["ring", "輪"]]), range("height", "高さ h", .2, 8, .2, 3, " m"), range("angle", "斜面角 θ", 5, 45, 1, 25, "°"), range("mass", "質量 m", .2, 5, .1, 1, " kg")],
    calc(s,t) {
      const factors = { sphere: .4, disk: .5, ring: 1 }, k = factors[s.shape];
      const acceleration = G * Math.sin(rad(s.angle)) / (1 + k), speed = Math.sqrt(2 * G * s.height / (1 + k));
      const total = s.mass * G * s.height, translation = total / (1 + k), rotation = total - translation;
      const length=s.height/Math.sin(rad(s.angle)), distance=Math.min(length,.5*acceleration*t*t);
      const portion=distance/length, nowSpeed=Math.sqrt(2*acceleration*distance);
      const visual = { draw(ctx,w,h) {
        const angle=rad(s.angle), run=Math.min(w*.64, h*.43/Math.tan(angle));
        const endX=w*.82, endY=h*.57, startX=endX-run, startY=endY-run*Math.tan(angle);
        const radius=12+3*Math.sqrt(s.mass);
        segment(ctx,startX,startY,endX,endY,"#475467",3);
        const cx=startX+run*portion+radius*Math.sin(angle);
        const cy=startY+(endY-startY)*portion-radius*Math.cos(angle);
        dot(ctx,cx,cy,radius,s.shape==="ring"?"white":s.shape==="sphere"?"#2364aa":"#7c3aed","#344054");
        const spin=Math.hypot(run,endY-startY)*portion/radius;
        segment(ctx,cx,cy,cx+radius*.9*Math.cos(spin),cy+radius*.9*Math.sin(spin),s.shape==="ring"?"#344054":"#fff",2);
        if(s.shape==="sphere") {ctx.beginPath();ctx.ellipse(cx,cy,radius*.45,radius,0,0,TAU);ctx.strokeStyle="#bfdbfe";ctx.stroke();}
        label(ctx,fmt(s.angle,0)+"°",endX-12,endY+17,"#344054",12,"right");
        const left=w*.12, width=w*.76, y=h*.78;
        ctx.fillStyle="#dbe2eb";ctx.fillRect(left,y,width,14);
        ctx.fillStyle="#2364aa";ctx.fillRect(left,y,width*translation/total*portion,14);
        ctx.fillStyle="#7c3aed";ctx.fillRect(left+width*translation/total*portion,y,width*rotation/total*portion,14);
        label(ctx,"並進 "+fmt(translation*portion)+" J",left,y+32,"#2364aa",12);
        label(ctx,"回転 "+fmt(rotation*portion)+" J",left+width,y+32,"#7c3aed",12,"right");
        label(ctx,"高さ "+fmt(s.height)+" m から転がす",w/2,26,"#344054",15,"center");
      }};
      return { metrics: [metric("現在の速さ",fmt(nowSpeed)+" m/s"), metric("慣性係数 k", fmt(k)), metric("加速度", `${fmt(acceleration)} m/s²`), metric("最下点の速さ", `${fmt(speed)} m/s`), metric("全エネルギー", `${fmt(total)} J`)], visual };
    }
  });

  add("angular-momentum", {
    timeRelevant: true,
    title: "角運動量保存", subtitle: "慣性モーメントと角速度の交換", lead: "外力のモーメントがない回転系で、回転半径を変えたときの角速度を調べます。",
    formula: "L = Iω = 一定\nI₁ω₁ = I₂ω₂\nK = L²/(2I)", focus: "腕を縮めて慣性モーメントを小さくすると、角速度と回転エネルギーが増えます。",
    controls: [range("mass", "回転質量", 20, 100, 5, 60, " kg"), range("radius1", "初めの回転半径", .4, 1.5, .05, 1, " m"), range("radius2", "後の回転半径", .2, 1.5, .05, .5, " m"), range("omega", "初めの角速度", .2, 5, .1, 1.5, " rad/s")],
    calc(s,t) {
      const i1 = s.mass * s.radius1 ** 2, i2 = s.mass * s.radius2 ** 2, momentum = i1 * s.omega, omega2 = momentum / i2;
      const k1 = .5 * i1 * s.omega ** 2, k2 = .5 * i2 * omega2 ** 2;
      const visual={draw(ctx,w,h){
        const scale=Math.min(w*.14,h*.18), cy=h*.5, spot=4+Math.sqrt(s.mass)*.55;
        for(const [cx,radius,omega,color,caption] of [
          [w*.25,s.radius1,s.omega,"#2364aa","初めの半径"],[w*.75,s.radius2,omega2,"#7c3aed","変更後の半径"]
        ]){
          const r=radius*scale, a=omega*t;
          ctx.strokeStyle="#9ca8b6";ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(cx,cy,r,0,TAU);ctx.stroke();
          const dx=r*Math.cos(a),dy=-r*Math.sin(a);
          segment(ctx,cx-dx,cy-dy,cx+dx,cy+dy,color,3);
          dot(ctx,cx+dx,cy+dy,spot,color);dot(ctx,cx-dx,cy-dy,spot,color);dot(ctx,cx,cy,3,"#344054");
          label(ctx,caption,cx,h*.19,color,14,"center");
          label(ctx,fmt(omega)+" rad/s",cx,h*.8,color,13,"center");
        }
        label(ctx,"同じ時間で回転角を比較",w*.5,25,"#344054",15,"center");
      }};
      return { metrics: [metric("角運動量 L", `${fmt(momentum)} kg·m²/s`), metric("後の角速度", `${fmt(omega2)} rad/s`), metric("初めの回転E", `${fmt(k1)} J`), metric("後の回転E", `${fmt(k2)} J`)], visual };
    }
  });

  add("rigid-equilibrium", {
    title: "剛体のつり合い", subtitle: "梁の荷重位置と支点反力", lead: "水平な梁に置く荷重を動かし、力とモーメントのつり合いから支点反力を求めます。",
    formula: "ΣFᵧ = 0\nΣτ = 0\nRᴮL = Mg(L/2) + mgx", focus: "モーメントをとる支点を選ぶと、未知の反力を1つ消して計算できます。",
    controls: [range("length", "梁の長さ L", 2, 10, .5, 6, " m"), range("beamMass", "梁の質量 M", 1, 30, 1, 8, " kg"), range("loadMass", "荷重 m", 1, 50, 1, 20, " kg"), range("position", "左端からの位置 x", .2, 5.8, .1, 4.2, " m")],
    calc(s) {
      const x = clamp(s.position, 0, s.length), total = (s.beamMass + s.loadMass) * G;
      const rb = (s.beamMass * G * s.length / 2 + s.loadMass * G * x) / s.length, ra = total - rb;
      const nx = .18 + .64*x/s.length;
      return { metrics: [metric("左支点反力 Rᴬ", `${fmt(ra)} N`), metric("右支点反力 Rᴮ", `${fmt(rb)} N`), metric("全重量", `${fmt(total)} N`), metric("反力の和", `${fmt(ra + rb)} N`)], visual: diagram({ title: "力とモーメントが同時につり合う", lines: [{ a: [.12, .55], b: [.88, .55], width: 12, color: "#667085" }], polylines: [{ points: [[.18, .56], [.12, .72], [.24, .72]], closed: true, color: "#2364aa", fill: "#dbeafe" }, { points: [[.82, .56], [.76, .72], [.88, .72]], closed: true, color: "#2364aa", fill: "#dbeafe" }], rects: [{ x: nx - .05, y: .39, w: .1, h: .15, fill: "#fee2e2", stroke: "#dc4c45" }], arrows: [{ a: [.18, .72], b: [.18, .72-ra/1800], color: "#087f5b" }, { a: [.82, .72], b: [.82, .72-rb/1800], color: "#087f5b" }, { a: [nx, .39], b: [nx, .39+s.loadMass*G/1800], color: "#dc4c45" }, { a: [.5, .55], b: [.5, .55+s.beamMass*G/1800], color: "#7c3aed" }], texts: [{ text: "Rᴬ", x: .14, y: .38, color: "#087f5b" }, { text: "Rᴮ", x: .86, y: .38, color: "#087f5b" }, { text: "荷重", x: nx, y: .34, color: "#dc4c45" }, { text: "梁の重力", x: .56, y: .76, color: "#7c3aed" }] }) };
    }
  });

  add("kepler-orbit", {
    timeRelevant: true,
    title: "ケプラー運動と人工衛星", subtitle: "楕円軌道・速度・面積速度", lead: "軌道の長半径と離心率を変え、中心天体からの距離と速度の変化を追います。",
    formula: "r = a(1−e²)/(1+e cosν)\nv² = μ(2/r−1/a)\nT² ∝ a³", focus: "近日点では速く、遠日点では遅くても、面積速度は一定です。",
    controls: [range("axis", "長半径 a", .5, 5, .1, 1.5, " AU"), range("ecc", "離心率 e", 0, .85, .05, .45, ""), range("anomaly", "真近点角 ν", 0, 360, 2, 45, "°")],
    calc(s, t) {
      const e=s.ecc, period=s.axis**1.5, bRatio=Math.sqrt(1-e*e);
      const initial=rad(s.anomaly);
      const startE=Math.atan2(bRatio*Math.sin(initial),e+Math.cos(initial));
      const mean=startE-e*Math.sin(startE)+TAU*t/(12*period);
      function eccentricAnomaly(m) {
        m %= TAU;
        let angle=m;
        for(let i=0;i<12;i++) angle-=(angle-e*Math.sin(angle)-m)/(1-e*Math.cos(angle));
        return angle;
      }
      const angle=eccentricAnomaly(mean), radius=s.axis*(1-e*Math.cos(angle));
      const speed=29.7847*Math.sqrt(2/radius-1/s.axis);
      const visual={draw(ctx,w,h) {
        const cx=w*.5, cy=h*.5, scale=Math.min(w*.40,h*.33)/5, a=scale*s.axis;
        const point=E=>[cx+a*Math.cos(E),cy-a*bRatio*Math.sin(E)];
        const sun=[cx+a*e,cy], body=point(angle);
        ctx.strokeStyle="#2364aa";ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(cx,cy,a,a*bRatio,0,0,TAU);ctx.stroke();
        ctx.beginPath();ctx.moveTo(...sun);
        for(let i=0;i<=32;i++)ctx.lineTo(...point(eccentricAnomaly(mean-(1-i/32)*.24/period)));
        ctx.closePath();ctx.fillStyle="rgba(245,158,11,.25)";ctx.fill();ctx.strokeStyle="#b45309";ctx.stroke();
        dot(ctx,...sun,8,"#e29a12");dot(ctx,...body,6,"#2364aa");
        const vector=Math.min(w,h)*.055/Math.sqrt(s.axis)/(1-e*Math.cos(angle));
        arrow(ctx,...body,body[0]-vector*Math.sin(angle),body[1]-vector*bRatio*Math.cos(angle),"#087f5b");
        label(ctx,"橙は直前の一定時間に掃いた面積",cx,25,"#344054",14,"center");
        label(ctx,"緑は速度　表示12秒が1年",cx,h-22,"#087f5b",12,"center");
      }};
      return {metrics:[metric("中心からの距離 r",fmt(radius)+" AU"),metric("軌道速度",fmt(speed)+" km/s"),
        metric("公転周期",fmt(period)+" 年"),metric("近日点距離",fmt(s.axis*(1-e))+" AU")],visual};
    }
  });

  add("thermal-conduction", {
    title: "熱伝導", subtitle: "複合壁の温度分布と熱流率", lead: "熱伝導率と厚さが異なる2層を通る定常熱流を比較します。",
    formula: "Q̇ = kAΔT/L\nRth = L/(kA)\nQ̇ = (TH−TC)/(R₁+R₂)", focus: "定常状態では各層を流れる熱量は同じで、温度勾配が材料ごとに変わります。",
    controls: [range("hot", "高温側 TH", 40, 200, 5, 120, " ℃"), range("cold", "低温側 TC", -20, 35, 5, 20, " ℃"), range("k1", "材料1の熱伝導率", .1, 20, .1, 1, " W/(m·K)"), range("k2", "材料2の熱伝導率", .1, 20, .1, 5, " W/(m·K)"), range("l1", "材料1の厚さ", 1, 20, 1, 10, " cm"), range("l2", "材料2の厚さ", 1, 20, 1, 10, " cm")],
    calc(s) {
      const r1 = s.l1 / 100 / s.k1, r2 = s.l2 / 100 / s.k2, flow = (s.hot - s.cold) / (r1 + r2), inter = s.hot - flow * r1, fraction = s.l1 / (s.l1 + s.l2);
      return { metrics: [metric("熱流率/面積", `${fmt(flow)} W/m²`), metric("境界温度", `${fmt(inter)} ℃`), metric("材料1の熱抵抗", `${fmt(r1)} m²K/W`), metric("材料2の熱抵抗", `${fmt(r2)} m²K/W`)], visual: graph({ title: "熱伝導率が小さい層ほど温度勾配が大きい", xLabel: "位置", yLabel: "℃", curves: [{ color: "#dc4c45", points: [[0, (s.hot+20)/220], [fraction, (inter+20)/220], [1, (s.cold+20)/220]] }], markerX: fraction, legend: [{ label: "−20 ～ 200 ℃", color: "#dc4c45" }] }) };
    }
  });

  add("newton-cooling", {
    timeRelevant: true,
    title: "ニュートンの冷却則", subtitle: "温度差の指数関数的減少", lead: "物体と周囲の温度差に比例して熱が逃げるモデルを観察します。",
    formula: "dT/dt = −k(T−Ta)\nT = Ta + (T₀−Ta)e^(−kt)", focus: "一定時間ごとに、周囲温度との差が同じ割合だけ小さくなります。",
    controls: [range("initial", "初期温度 T₀", 30, 150, 5, 90, " ℃"), range("ambient", "周囲温度 Ta", -10, 35, 1, 20, " ℃"), range("rate", "冷却定数 k", .02, .5, .01, .12, " s⁻¹"), range("time", "表示時間", 5, 60, 1, 30, " s")],
    duration: s => s.time,
    calc(s, t) {
      const time = Math.min(s.time,t), temp = s.ambient + (s.initial - s.ambient) * Math.exp(-s.rate * time), tau = 1 / s.rate;
      return { metrics: [metric("現在温度", `${fmt(temp)} ℃`), metric("温度差", `${fmt(temp - s.ambient)} K`), metric("時定数", `${fmt(tau)} s`), metric("半減時間", `${fmt(Math.log(2) / s.rate)} s`)], visual: graph({ title: "周囲温度へ指数関数的に近づく", xLabel: "t", yLabel: "℃", curves: [{ color: "#2364aa", points: curve(100, x => (s.ambient+10+(s.initial-s.ambient)*Math.exp(-s.rate*s.time*x))/160) }], markerX: time / s.time, legend: [{ label: "−10 ～ 150 ℃", color: "#2364aa" }] }) };
    }
  });

  add("thermal-expansion", {
    title: "熱膨張とバイメタル", subtitle: "線膨張と膨張率差による曲がり", lead: "温度変化による棒の伸びと、2金属の膨張率差が生む曲がりを比較します。",
    formula: "ΔL = αL₀ΔT\n曲率 κ ≈ (α₂−α₁)ΔT/d", focus: "長さの変化は小さくても、2材料を貼り合わせると曲がりとして拡大できます。",
    controls: [range("length", "初期長さ L₀", .2, 3, .1, 1, " m"), range("deltaT", "温度変化 ΔT", -100, 200, 5, 80, " K"), range("alpha1", "材料1 α₁", 5, 30, 1, 12, " ×10⁻⁶/K"), range("alpha2", "材料2 α₂", 5, 30, 1, 22, " ×10⁻⁶/K"), range("thickness", "全厚さ d", .5, 5, .1, 2, " mm")],
    calc(s) {
      const dl1 = s.alpha1 * 1e-6 * s.length * s.deltaT, dl2 = s.alpha2 * 1e-6 * s.length * s.deltaT;
      const curvature = (s.alpha2 - s.alpha1) * 1e-6 * s.deltaT / (s.thickness / 1000), radius = Math.abs(curvature) > 1e-12 ? 1 / Math.abs(curvature) : Infinity;
      const bend = clamp(curvature * s.length * .08, -.22, .22);
      const upper = Array.from({ length: 61 }, (_, i) => { const x = i / 60; return [.08 + (.26+.2*s.length)*x, .48 - bend * Math.sin(Math.PI * x)]; });
      const lower = upper.map(([x, y]) => [x, y + .035]);
      return { metrics: [metric("材料1の伸び", `${fmt(dl1 * 1000)} mm`), metric("材料2の伸び", `${fmt(dl2 * 1000)} mm`), metric("曲率", `${fmt(curvature)} m⁻¹`), metric("曲率半径", Number.isFinite(radius) ? `${fmt(radius)} m` : "∞")], visual: diagram({ title: "膨張率の大きい側が外側になる", polylines: [{ points: upper, color: "#dc4c45", width: 9 }, { points: lower, color: "#2364aa", width: 9 }], texts: [{ text: "材料2", x: .18, y: upper[2][1] - .06, color: "#dc4c45" }, { text: "材料1", x: .18, y: lower[2][1] + .07, color: "#2364aa" }, { text: `ΔT=${s.deltaT} K`, x: .5, y: .78 }] }) };
    }
  });

  add("phase-diagram", {
    title: "相図と相変化", subtitle: "温度・圧力と物質の状態", lead: "水を簡略化した相図上で温度と圧力を動かし、相境界をまたぐ変化を調べます。",
    formula: "相境界では2相の化学ポテンシャルが等しい\n三重点：3相が共存\n臨界点より上：超臨界流体", focus: "圧力を変えると沸点・融点が変わり、低圧では液体が存在できません。",
    controls: [range("temperature", "温度", -80, 450, 5, 25, " ℃"), range("logPressure", "圧力 log₁₀(P/atm)", -3, 2.5, .1, 0, "" )],
    calc(s) {
      const pressure = 10 ** s.logPressure, tripleP = .006, criticalP = 218, criticalT = 374;
      const boilK = 373.15 / (1 - (8.314 * 373.15 / 40650) * Math.log(Math.max(pressure, .0001))), boil = boilK - 273.15;
      const melt = -.0074 * (pressure - 1);
      let phase;
      if (s.temperature >= criticalT && pressure >= criticalP) phase = "超臨界流体";
      else if (pressure < tripleP) phase = s.temperature < -35 + 18 * Math.log10(pressure / .001) ? "固体" : "気体";
      else if (s.temperature < melt) phase = "固体";
      else if (s.temperature < boil) phase = "液体";
      else phase = "気体";
      const px = clamp((s.temperature + 80) / 530, .04, .96), py = 1 - clamp((s.logPressure + 3) / 5.5, .05, .95);
      return { metrics: [metric("圧力", `${fmt(pressure)} atm`), metric("状態", phase), metric("推定沸点", `${fmt(boil, 1)} ℃`), metric("推定融点", `${fmt(melt, 2)} ℃`)], visual: diagram({ title: "水の簡略相図（対数圧力）", regions: [{ x: .08, y: .12, w: .84, h: .76, color: "rgba(219,234,254,.22)" }], polylines: [{ points: [[.09,.72],[.24,.59],[.4,.51],[.55,.42],[.72,.25]], color: "#dc4c45", width: 3 }, { points: [[.24,.59],[.23,.18]], color: "#2364aa", width: 3 }, { points: [[.24,.59],[.13,.82]], color: "#7c3aed", width: 3 }], circles: [{ x: .08 + .84 * px, y: .12 + .76 * py, r: 9, color: "#111827" }, { x: .24, y: .59, r: 7, color: "#f59e0b" }, { x: .72, y: .25, r: 7, color: "#dc4c45" }], texts: [{ text: "固体", x: .18, y: .3, color: "#2364aa" }, { text: "液体", x: .45, y: .37, color: "#087f5b" }, { text: "気体", x: .64, y: .7, color: "#7c3aed" }, { text: "三重点", x: .28, y: .64, color: "#b45309" }, { text: "臨界点", x: .76, y: .2, color: "#c2413b" }] }) };
    }
  });

  // Independent Gaussian increments at fixed simulated intervals; reuse the same
  // realization when comparing D so that random variation does not mask the effect.
  const brownianStep = .1;
  const brownianPath = (() => {
    let seed = 2749;
    const uniform = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return (seed + .5) / 4294967296;
    };
    const points = [[0, 0]];
    for (let i = 0; i < 600; i++) {
      const length = Math.sqrt(-2 * brownianStep * Math.log(uniform()));
      const angle = TAU * uniform(), [x, y] = points[i];
      points.push([x + length * Math.cos(angle), y + length * Math.sin(angle)]);
    }
    return points;
  })();

  const brownianReach = [];
  brownianPath.forEach(([x,y],i) => {
    brownianReach.push(Math.max(brownianReach[i-1] || 0, Math.hypot(x,y), Math.sqrt(2*i*brownianStep)));
  });

  add("brownian-diffusion", {
    timeRelevant: true,
    title: "ブラウン運動と拡散", subtitle: "熱運動と平均二乗変位", lead: "液体分子の熱運動による微粒子の不規則運動を、拡散係数と結び付けます。",
    formula: "D = kBT/(6πηr)\n2次元：⟨r²⟩ = 4Dt", focus: "個々の軌跡は予測できなくても、平均二乗変位には規則性があります。",
    controls: [range("temperature", "温度 T", 250, 400, 5, 300, " K"), range("radius", "粒子半径 r", .05, 2, .05, .5, " μm"), range("viscosity", "粘性率 η", .2, 5, .1, 1, " mPa·s"), range("time", "観察時間", 1, 60, 1, 20, " s")],
    duration: s => s.time,
    calc(s, t) {
      const diffusion = KB * s.temperature / (6 * Math.PI * s.viscosity * 1e-3 * s.radius * 1e-6);
      const time = Math.min(s.time, t), msd = 4 * diffusion * time;
      const steps = Math.min(600, time / brownianStep), i = Math.floor(steps);
      const path = brownianPath.slice(0, i + 1);
      if (i < 600) path.push(path[i].map((v, j) => v + (steps-i)*(brownianPath[i+1][j]-v)));
      return { metrics: [metric("拡散係数 D", fmt(diffusion)+" m²/s"), metric("平均二乗変位（理論値）", fmt(msd)+" m²"),
        metric("二乗平均平方根の変位", fmt(Math.sqrt(msd)*1e6)+" μm"), metric("観察時刻", fmt(time)+" s")],
        visual: { kind:"brownian", path, diffusion, duration:s.time, rms: Math.sqrt(msd)*1e6 } };
    }
  });

  add("entropy-process", {
    title: "エントロピーと不可逆過程", subtitle: "熱平衡へ向かう自発変化", lead: "異なる温度の2物体を接触させ、全エントロピー変化を計算します。",
    formula: "Tf = (m₁T₁+m₂T₂)/(m₁+m₂)\nΔS = mc ln(Tf/Ti)\nΔS全体 > 0", focus: "高温側のエントロピーは減っても、低温側の増加が上回ります。",
    controls: [range("m1", "高温物体の質量", .1, 5, .1, 1, " kg"), range("t1", "高温側 T₁", 320, 700, 10, 500, " K"), range("m2", "低温物体の質量", .1, 5, .1, 1, " kg"), range("t2", "低温側 T₂", 200, 310, 5, 280, " K"), range("heatCapacity", "比熱 c", 100, 2000, 50, 500, " J/(kg·K)")],
    calc(s) {
      const finalT = (s.m1 * s.t1 + s.m2 * s.t2) / (s.m1 + s.m2);
      const ds1 = s.m1 * s.heatCapacity * Math.log(finalT / s.t1), ds2 = s.m2 * s.heatCapacity * Math.log(finalT / s.t2), total = ds1 + ds2;
      return { metrics: [metric("平衡温度", `${fmt(finalT)} K`), metric("高温側 ΔS", `${fmt(ds1)} J/K`), metric("低温側 ΔS", `${fmt(ds2)} J/K`), metric("全体 ΔS", `${fmt(total)} J/K`)], visual: bars({ title: "全体のエントロピーは増加", max: Math.max(Math.abs(ds1), Math.abs(ds2)), bars: [{ label: "高温側", value: ds1, display: fmt(ds1), color: "#dc4c45" }, { label: "低温側", value: Math.abs(ds2), display: `+${fmt(ds2)}`, color: "#2364aa" }, { label: "全体", value: Math.abs(total), display: `+${fmt(total)}`, color: "#087f5b" }] }) };
    }
  });

  function opticalFigure(f,u,height,v,mirror) {
    return { draw(ctx,w,h) {
      const origin=mirror?w*.61:w*.5, axis=h*.52, sign=mirror?-1:1;
      const scale=Math.min(w*(mirror?.55:.44)/100,h*.24/10);
      const ox=origin-u*scale, oy=axis-height*scale, imageX=origin+sign*v*scale;
      const imageY=axis+height*v/u*scale;
      segment(ctx,12,axis,w-12,axis,"#94a3b8",1);
      segment(ctx,origin,h*.15,origin,h*.84,"#2364aa",4);
      const focus=origin+sign*f*scale;
      dot(ctx,focus,axis,4,"#344054"); label(ctx,"F",focus,axis+15,"#344054",12,"center");
      if(!mirror) dot(ctx,origin-f*scale,axis,4,"#344054");
      arrow(ctx,ox,axis,ox,oy,"#c2413b");
      const rayEnd=sign>0?w-10:10, travel=(rayEnd-origin)*sign;
      const rays=[[oy,height/f,"#b45309"],[axis,height/u,"#7c3aed"]];
      for(const [start,slope,color] of rays){
        segment(ctx,ox,oy,origin,start,color,2);
        segment(ctx,origin,start,rayEnd,start+travel*slope,color,2);
        if(v<0){ctx.setLineDash([4,4]);segment(ctx,origin,start,imageX,imageY,color,1.5);ctx.setLineDash([]);}
      }
      const visible=Number.isFinite(v)&&imageX>8&&imageX<w-8&&imageY>42&&imageY<h-30;
      if(visible) arrow(ctx,imageX,axis,imageX,imageY,v>0?"#087f5b":"#7c3aed");
      label(ctx,!Number.isFinite(v)?"光線は平行・像は無限遠":(v>0?"倒立実像":"正立虚像")+(visible?"":"（表示範囲外）"),w/2,22,"#344054",15,"center");
      label(ctx,"赤は物体　破線は光線の延長",w/2,h-20,"#475467",12,"center");
    } };
  }

  add("convex-lens", {
    title: "凸レンズの像", subtitle: "焦点距離・物体距離・像の性質", lead: "物体を光軸上で動かし、代表光線の交点と薄レンズの式から像を求めます。",
    formula: "1/f = 1/u + 1/v\nm = −v/u", focus: "物体が焦点の内側に入ると、像距離が負になり正立拡大の虚像になります。",
    controls: [range("focus", "焦点距離 f", 5, 30, 1, 15, " cm"), range("object", "物体距離 u", 3, 100, 1, 40, " cm"), range("height", "物体の高さ", 1, 10, .5, 5, " cm")],
    calc(s) {
      const denominator = 1 / s.focus - 1 / s.object, image = Math.abs(denominator) < 1e-9 ? Infinity : 1 / denominator, magnification = -image / s.object, imageHeight = magnification * s.height;
      const real = image > 0;
      const figure=opticalFigure(s.focus,s.object,s.height,image,false);
      return { metrics: [metric("像距離 v", Number.isFinite(image) ? `${fmt(image)} cm` : "∞"), metric("倍率 m", Number.isFinite(magnification) ? fmt(magnification) : "—"), metric("像の高さ", Number.isFinite(imageHeight) ? `${fmt(imageHeight)} cm` : "—"), metric("像の性質", !Number.isFinite(image) ? "無限遠" : real ? "倒立実像" : "正立虚像")], visual: figure };
    }
  });

  add("spherical-mirror", {
    title: "球面鏡の像", subtitle: "凹面鏡・凸面鏡の光線作図", lead: "鏡の種類と物体距離を変え、焦点を通る光線と光軸に平行な光線から像を作図します。",
    formula: "1/f = 1/u + 1/v\nm = −v/u\n凸面鏡では f < 0", focus: "凹面鏡は条件により実像・虚像を作り、凸面鏡は常に正立縮小の虚像を作ります。",
    controls: [select("mirror", "鏡", "concave", [["concave","凹面鏡"],["convex","凸面鏡"]]), range("focus", "焦点距離の大きさ", 5, 30, 1, 15, " cm"), range("object", "物体距離 u", 3, 100, 1, 45, " cm")],
    calc(s) {
      const focus = s.mirror === "concave" ? s.focus : -s.focus, denominator = 1 / focus - 1 / s.object;
      const image = Math.abs(denominator) < 1e-9 ? Infinity : 1 / denominator, magnification = -image / s.object, real = image > 0;
      const figure=opticalFigure(focus,s.object,5,image,true);
      return { metrics: [metric("像距離 v", Number.isFinite(image) ? `${fmt(image)} cm` : "∞"), metric("倍率", Number.isFinite(magnification) ? fmt(magnification) : "—"), metric("像の性質", !Number.isFinite(image) ? "無限遠" : real ? "倒立実像" : "正立虚像"), metric("焦点距離 f", `${fmt(focus)} cm`)], visual: figure };
    }
  });

  add("prism-dispersion", {
    title: "プリズムと光の分散", subtitle: "波長による屈折率と偏角の違い", lead: "透明物質の屈折率が波長によって異なるため、白色光が色ごとに分かれる様子を調べます。",
    formula: "n(λ) ≈ A + B/λ²\n最小偏角 δ = 2sin⁻¹(n sin(Ap/2)) − Ap", focus: "一般に短波長の紫ほど屈折率が大きく、偏角も大きくなります。",
    controls: [range("apex", "プリズム頂角", 20, 70, 1, 45, "°"), range("wavelength", "注目する波長", 400, 700, 5, 550, " nm"), range("dispersion", "分散の強さ", .5, 2, .1, 1, "")],
    calc(s) {
      const lambda = s.wavelength / 1000, n = 1.5046 + .0042 * s.dispersion / (lambda ** 2), apex = rad(s.apex);
      const delta = 2 * Math.asin(clamp(n * Math.sin(apex / 2), -1, 1)) - apex;
      const colors = [["#7c3aed",400],["#2563eb",460],["#10b981",530],["#facc15",580],["#f97316",620],["#dc2626",700]];
      const rays = colors.map(([color, wavelength], index) => { const l = wavelength / 1000, ni = 1.5046 + .0042 * s.dispersion / l ** 2, d = 2 * Math.asin(clamp(ni * Math.sin(apex / 2),-1,1)) - apex; return { points: [[.55,.5],[.88,.5 + .22 * deg(d) / 40]], color, width: 3 }; });
      return { metrics: [metric("屈折率 n", fmt(n, 4)), metric("最小偏角", `${fmt(deg(delta), 2)}°`), metric("注目波長", `${s.wavelength} nm`), metric("色域", s.wavelength < 450 ? "紫" : s.wavelength < 500 ? "青" : s.wavelength < 570 ? "緑" : s.wavelength < 590 ? "黄" : s.wavelength < 630 ? "橙" : "赤")], visual: diagram({ title: "白色光を波長ごとに分離", polylines: [{ points: [[.38,.2],[.58,.75],[.72,.2]], closed: true, color: "#667085", fill: "rgba(219,234,254,.45)", width: 4 }, { points: [[.08,.5],[.48,.5]], color: "#344054", width: 6 }, ...rays, {points:[[.55,.5],[.88,.5+.22*deg(delta)/40]],color:"#17202a",width:1.5,dashed:true}], texts: [{ text: "白色光", x: .18, y: .44 }, { text: "紫", x: .9, y: rays[0].points[1][1], color: "#7c3aed" }, { text: "赤", x: .9, y: rays.at(-1).points[1][1], color: "#dc2626" }] }) };
    }
  });

  add("polarization", {
    title: "光の偏光", subtitle: "偏光板とマリュスの法則", lead: "偏光板と検光子の透過軸の角度を変え、透過光強度を測ります。",
    formula: "I = I₀ cos²θ\nE = E₀ cosθ", focus: "2枚の透過軸が直交すると理想的には光が透過しません。",
    controls: [range("intensity", "入射光強度 I₀", 10, 100, 5, 80, "%"), range("angle", "偏光板間の角度 θ", 0, 180, 1, 45, "°")],
    calc(s) {
      const transmission = Math.cos(rad(s.angle)) ** 2, intensity = s.intensity * transmission, amplitude = Math.cos(rad(s.angle));
      const axis2 = rad(s.angle), dx = .13 * Math.sin(axis2), dy = .18 * Math.cos(axis2);
      return { metrics: [metric("透過率", `${fmt(transmission * 100, 1)} %`), metric("透過光強度", `${fmt(intensity, 1)} %`), metric("電場振幅比", fmt(amplitude)), metric("検光子角", `${s.angle}°`)], visual: diagram({ title: "透過軸への射影が振幅を決める", rects: [{ x: .28, y: .23, w: .05, h: .54, fill: "rgba(35,100,170,.18)" }, { x: .65, y: .23, w: .05, h: .54, fill: "rgba(124,58,237,.18)", stroke: "#7c3aed" }], polylines: [{ points: Array.from({length:70},(_,i)=>{const x=.06+i/69*.2;return [x,.5+.13*Math.sqrt(s.intensity/100)*Math.sin(i/69*TAU*4)];}), color: "#f59e0b", width: 2 }, { points: Array.from({length:70},(_,i)=>{const x=.72+i/69*.22;return [x,.5+.13*Math.sqrt(s.intensity/100)*amplitude*Math.sin(i/69*TAU*4)];}), color: "#2364aa", width: 2 }], lines: [{ a: [.305,.3], b: [.305,.7], color: "#2364aa", width: 4 }, { a: [.675-dx,.5+dy], b: [.675+dx,.5-dy], color: "#7c3aed", width: 4 }], arrows: [{ a: [.34,.5], b: [.62,.5], color: "#f59e0b" }], texts: [{ text: "偏光板", x: .305, y: .84, color: "#2364aa" }, { text: "検光子", x: .675, y: .84, color: "#7c3aed" }, { text: `${fmt(intensity,1)}%`, x: .84, y: .28, color: "#087f5b", size: 18 }] }) };
    }
  });

  add("sound-intensity", {
    title: "音の強さとデシベル", subtitle: "逆二乗則と対数尺度", lead: "音源のパワー、距離、音源数を変え、音の強さと音圧レベルの違いを確かめます。",
    formula: "I = NP/(4πr²)\nL = 10 log₁₀(I/I₀),  I₀=10⁻¹² W/m²", focus: "距離が2倍になると強さは1/4になり、レベルは約6 dB下がります。",
    controls: [range("powerExp", "音源パワー log₁₀(P/W)", -6, 1, .1, -2, ""), range("distance", "音源からの距離", .5, 100, .5, 10, " m"), range("sources", "同じ音源の数", 1, 16, 1, 1, " 個")],
    calc(s) {
      const power = 10 ** s.powerExp, intensity = s.sources * power / (4 * Math.PI * s.distance ** 2), level = 10 * Math.log10(intensity / 1e-12);
      const listener=.32+.57*Math.log(s.distance/.5)/Math.log(200);
      return { metrics: [metric("音の強さ I", `${fmt(intensity)} W/m²`), metric("音圧レベル", `${fmt(level, 1)} dB`), metric("音源パワー", `${fmt(power)} W`), metric("距離を2倍にした差", "−6.02 dB")], visual: diagram({ title: "球面上へエネルギーが広がる", circles: [{x:.25,y:.52,r:18,color:"#dc4c45"},{x:listener,y:.52,r:9,color:"#087f5b"}], polylines: Array.from({length:7},(_,i)=>{const rr=.06+i*.055;return {points:Array.from({length:61},(_,j)=>{const a=-Math.PI/2+j/60*Math.PI;return [.25+rr*Math.cos(a),.52+rr*Math.sin(a)];}),color:`rgba(35,100,170,${.7-i*.08})`,width:1+(s.powerExp+6)*.25+Math.log2(s.sources)*.35};}), arrows:[{a:[.25,.52],b:[listener,.52],color:"#f59e0b"}], texts:[{text:"音源",x:.25,y:.62,color:"#dc4c45"},{text:"観測点",x:listener,y:.62,color:"#087f5b"},{text:`r=${fmt(s.distance)} m（対数目盛）`,x:.55,y:.46}] }) };
    }
  });

  add("forced-resonance", {
    title: "強制振動と共振", subtitle: "共振曲線・減衰・位相差", lead: "外力の振動数を固有振動数の前後で変え、定常振幅と位相差を調べます。",
    formula: "A = (F₀/m)/√((ω₀²−ω²)²+(2ζω₀ω)²)\ntanφ = 2ζω₀ω/(ω₀²−ω²)", focus: "減衰が小さいほど共振曲線は高く鋭くなります。",
    controls: [range("natural", "固有振動数 f₀", .5, 10, .1, 3, " Hz"), range("drive", "外力の振動数 f", .1, 15, .1, 3, " Hz"), range("damping", "減衰比 ζ", .02, .8, .02, .15, ""), range("force", "F₀/m", .1, 20, .1, 5, " m/s²")],
    calc(s) {
      const w0 = TAU*s.natural, w=TAU*s.drive, denominator=Math.hypot(w0*w0-w*w,2*s.damping*w0*w), amplitude=s.force/denominator, phase=Math.atan2(2*s.damping*w0*w,w0*w0-w*w);
      const maxF=Math.max(15,s.natural*3), response=x=>{const ww=TAU*x*maxF;return s.force/Math.hypot(w0*w0-ww*ww,2*s.damping*w0*ww);};
      const samples=Array.from({length:121},(_,i)=>response(i/120)), max=Math.max(...samples,1e-9)*20/s.force;
      return { metrics: [metric("定常振幅", `${fmt(amplitude)} m`), metric("位相差", `${fmt(deg(phase),1)}°`), metric("振動数比 f/f₀", fmt(s.drive/s.natural)), metric("共振の鋭さ Q", fmt(1/(2*s.damping)))], visual: graph({title:"振幅の周波数応答",xLabel:"f (0–"+fmt(maxF)+" Hz)",yLabel:"A (m)",curves:[{color:"#7c3aed",points:samples.map((value,i)=>[i/120,value/max])}],markerX:clamp(s.drive/maxF,0,1),legend:[{label:"縦軸上端 "+fmt(max)+" m",color:"#7c3aed"}]}) };
    }
  });

  add("wave-packet", {
    timeRelevant: true,
    title: "波束と群速度", subtitle: "位相速度と包絡線の移動", lead: "近い波数をもつ2つの波を重ね、細かい波と包絡線が異なる速度で進む様子を観察します。",
    formula: "y = cos(k₁x−ω₁t)+cos(k₂x−ω₂t)\nvₚ=ω/k,  v_g=Δω/Δk", focus: "情報やエネルギーのまとまりは、一般に群速度で移動します。",
    controls: [range("k1", "波数 k₁", 2, 20, .5, 8, " rad/m"), range("k2", "波数 k₂", 2.5, 22, .5, 10, " rad/m"), range("speed", "基準速度 c", .2, 5, .1, 1.5, " m/s"), range("dispersion", "分散係数 β", 0, .3, .01, .08, " m²/s")],
    calc(s,t) {
      const w1=s.speed*s.k1+s.dispersion*s.k1**2,w2=s.speed*s.k2+s.dispersion*s.k2**2, vp=(w1/s.k1+w2/s.k2)/2, vg=(w2-w1)/(s.k2-s.k1);
      const points=Array.from({length:241},(_,i)=>{const x=i/240*12;const y=(Math.cos(s.k1*x-w1*t)+Math.cos(s.k2*x-w2*t))/2;return [i/240,.5+.42*y];});
      const envelope=Array.from({length:241},(_,i)=>{const x=i/240*12;const a=Math.abs(Math.cos((s.k2-s.k1)*x/2-(w2-w1)*t/2));return [i/240,.5+.42*a];});
      return { metrics:[metric("位相速度",`${fmt(vp)} m/s`),metric("群速度",`${fmt(vg)} m/s`),metric("Δk",`${fmt(s.k2-s.k1)} rad/m`),metric("Δω",`${fmt(w2-w1)} rad/s`)],visual:graph({title:"内部波と包絡線",xLabel:"x",yLabel:"振幅",curves:[{color:"#2364aa",points},{color:"#dc4c45",points:envelope,dashed:true}],legend:[{label:"合成波",color:"#2364aa"},{label:"包絡線",color:"#dc4c45"}]})};
    }
  });

  add("wave-transmission", {
    timeRelevant: true,
    title: "境界面での反射と透過", subtitle: "波のインピーダンスとエネルギー分配", lead: "異なる波動インピーダンスをもつ媒質の境界で、反射波と透過波を比較します。",
    formula: "r = (Z₁−Z₂)/(Z₁+Z₂)\nR = r²\nT = 4Z₁Z₂/(Z₁+Z₂)²", focus: "反射振幅の符号は位相反転を表し、エネルギーではR+T=1になります。",
    controls: [range("z1", "媒質1のZ₁", .2, 10, .1, 2, ""), range("z2", "媒質2のZ₂", .2, 10, .1, 6, ""), range("amplitude", "入射振幅", .2, 1, .05, .8, "")],
    calc(s,t) {
      const reflection=(s.z1-s.z2)/(s.z1+s.z2),transmission=2*s.z1/(s.z1+s.z2),energyR=reflection**2,energyT=4*s.z1*s.z2/(s.z1+s.z2)**2;
      const incident=Array.from({length:100},(_,i)=>{const x=.05+i/99*.43;return [x,.5-.18*s.amplitude*Math.sin((x*18-t*1.5)*TAU)];});
      const reflected=Array.from({length:100},(_,i)=>{const x=.05+i/99*.43;return [x,.5-.18*s.amplitude*reflection*Math.sin(((1-x)*18-t*1.5)*TAU)];});
      const transmitted=Array.from({length:120},(_,i)=>{const x=.52+i/119*.43;return [x,.5-.18*s.amplitude*transmission*Math.sin((x*18-t*1.5)*TAU)];});
      return {metrics:[metric("反射振幅係数 r",fmt(reflection)),metric("反射率 R",`${fmt(energyR*100,1)} %`),metric("透過率 T",`${fmt(energyT*100,1)} %`),metric("R+T",fmt(energyR+energyT))],visual:diagram({title:reflection<0?"反射波は位相反転":"反射波は同位相",regions:[{x:0,y:0,w:.5,h:1,color:"rgba(219,234,254,.24)"},{x:.5,y:0,w:.5,h:1,color:"rgba(237,233,254,.24)"}],lines:[{a:[.5,.1],b:[.5,.9],color:"#667085",width:4}],polylines:[{points:incident,color:"#2364aa",width:3},{points:reflected,color:"#dc4c45",width:2},{points:transmitted,color:"#7c3aed",width:3}],texts:[{text:`Z₁=${fmt(s.z1)}`,x:.25,y:.15},{text:`Z₂=${fmt(s.z2)}`,x:.75,y:.15},{text:"入射",x:.22,y:.74,color:"#2364aa"},{text:"反射",x:.35,y:.8,color:"#dc4c45"},{text:"透過",x:.72,y:.74,color:"#7c3aed"}]})};
    }
  });

  add("rc-circuit", {
    timeRelevant: true,
    title: "RC回路の充電と放電", subtitle: "コンデンサー電圧・電流・時定数", lead: "抵抗とコンデンサーを直列につなぎ、スイッチ操作後の指数関数的変化を追います。",
    formula: "τ = RC\n充電：VC=V(1−e^(−t/τ)), I=(V/R)e^(−t/τ)\n放電：VC=V₀e^(−t/τ)", focus: "1時定数後には充電で約63%、放電で約37%になります。",
    controls: [select("mode","動作","charge",[["charge","充電"],["discharge","放電"]]),range("voltage","電源／初期電圧",1,24,.5,12," V"),range("resistance","抵抗 R",1,200,1,50," kΩ"),range("capacitance","容量 C",1,500,1,100," μF"),range("ratio","観察時刻 t/τ",0,5,.01,0,"")],
    tau: s => s.resistance*s.capacitance/1000,
    duration(s) { return 5 * this.tau(s); },
    calc(s, t) {
      const tau = this.tau(s), ratio = t / tau, decay = Math.exp(-ratio);
      const discharge = s.mode === "discharge", fraction = discharge ? decay : 1-decay;
      const voltage = s.voltage*fraction, current = (discharge ? -1 : 1)*s.voltage/s.resistance*decay;
      const charge = s.capacitance*voltage;
      const metrics = [metric("時定数 τ",fmt(tau)+" s"), metric("コンデンサー電圧",fmt(voltage)+" V"),
        metric("回路電流",fmt(current)+" mA"), metric("電荷",fmt(charge)+" μC"),
        metric("静電エネルギー",fmt(.0005*s.capacitance*voltage**2)+" mJ")];
      const visual = {kind:"circuit", device:"RC", discharge, fraction, current, voltage, charge};
      metrics.push(metric("観察時刻",fmt(t)+" s"));
      return { metrics, visual: {...visual, ratio, tau, decay} };
    }
  });

  add("lr-circuit", {
    timeRelevant: true,
    title: "LR回路と自己誘導", subtitle: "コイル電流と逆起電力", lead: "抵抗とコイルを直列につなぎ、スイッチ投入後に電流がゆっくり増える様子を調べます。",
    formula: "τ = L/R\nI = (V/R)(1−e^(−t/τ))\nVL = Ve^(−t/τ)", focus: "自己誘導起電力は電流の変化を妨げ、定常状態では0になります。",
    controls:[range("voltage","電源電圧",1,48,1,12," V"),range("resistance","抵抗 R",1,100,1,20," Ω"),range("inductance","自己インダクタンス L",10,2000,10,500," mH"),range("ratio","観察時刻 t/τ",0,5,.01,0,"")],
    tau: s => s.inductance/1000/s.resistance,
    duration(s) { return 5 * this.tau(s); },
    calc(s, t) {
      const tau = this.tau(s), ratio = t / tau, decay = Math.exp(-ratio);
      const fraction = 1-decay, current = s.voltage/s.resistance*fraction, voltage = s.voltage*decay;
      const metrics = [metric("時定数 τ",fmt(tau)+" s"), metric("電流 I",fmt(current)+" A"),
        metric("コイル電圧",fmt(voltage)+" V"), metric("自己誘導起電力",fmt(-voltage)+" V"),
        metric("磁気エネルギー",fmt(.0005*s.inductance*current**2)+" J")];
      const visual = {kind:"circuit", device:"LR", fraction, current, voltage};
      metrics.push(metric("観察時刻",fmt(t)+" s"));
      return { metrics, visual: {...visual, ratio, tau, decay} };
    }
  });

  add("transformer", {
    title:"変圧器",subtitle:"巻数比・電圧・電流・電力",lead:"理想変圧器を基準に、巻数比と効率から二次側の電圧・電流を求めます。",
    formula:"V₂/V₁ = N₂/N₁\n理想：V₁I₁ = V₂I₂\nPout = ηPin",focus:"昇圧すると同じ電力では電流が小さくなります。",
    controls:[range("n1","一次巻数 N₁",50,1000,10,400," 回"),range("n2","二次巻数 N₂",50,2000,10,800," 回"),range("v1","一次電圧 V₁",10,240,5,100," V"),range("load","負荷抵抗",1,500,1,100," Ω"),range("efficiency","効率",50,100,1,95,"%")],
    calc(s,t){const ratio=s.n2/s.n1,v2=s.v1*ratio,i2=v2/s.load,pout=v2*i2,pin=pout/(s.efficiency/100),i1=pin/s.v1;const flow=(t*.25)%1;return{metrics:[metric("巻数比 N₂/N₁",fmt(ratio)),metric("二次電圧 V₂",`${fmt(v2)} V`),metric("二次電流 I₂",`${fmt(i2)} A`),metric("一次電流 I₁",`${fmt(i1)} A`),metric("出力電力",`${fmt(pout)} W`)],visual:diagram({title:ratio>=1?"昇圧変圧器":"降圧変圧器",lines:[{a:[.18,.25],b:[.18,.78],color:"#344054",width:7},{a:[.82,.25],b:[.82,.78],color:"#344054",width:7},{a:[.47,.18],b:[.47,.82],color:"#667085",width:8},{a:[.53,.18],b:[.53,.82],color:"#667085",width:8}],polylines:[{points:Array.from({length:61},(_,i)=>[.2+i/60*.24,.5+.18*Math.sin(i/60*TAU*(2+s.n1/80))]),color:"#2364aa",width:4},{points:Array.from({length:61},(_,i)=>[.56+i/60*.24,.5+.18*Math.sin(i/60*TAU*(2+s.n2/80))]),color:"#7c3aed",width:4}],arrows:[{a:[.1,.5],b:[.1+.12*i1/(i1+1),.5],color:"#f59e0b"},{a:[.83,.5],b:[.83+.13*i2/(i2+1),.5],color:"#087f5b"}],texts:[{text:`N₁=${s.n1}`,x:.31,y:.83,color:"#2364aa"},{text:`N₂=${s.n2}`,x:.69,y:.83,color:"#7c3aed"},{text:`${fmt(s.v1)} V`,x:.12,y:.42},{text:`${fmt(v2)} V`,x:.88,y:.42}]})};}
  });

  add("magnetic-field-current", {
    title:"電流がつくる磁場",subtitle:"直線電流・円形電流・ソレノイド",lead:"導線の形を切り替え、電流と距離・巻数による磁場の大きさを比較します。",
    formula:"直線：B=μ₀I/(2πr)\n円形：B=μ₀I/(2R)\nソレノイド：B=μ₀nI",focus:"右ねじの法則で、電流の向きから磁場の向きを判断します。",
    controls:[select("shape","導線","wire",[["wire","直線電流"],["loop","円形コイル"],["solenoid","ソレノイド"]]),range("current","電流 I",-20,20,.5,8," A"),range("size","距離／半径",1,50,1,10," cm"),range("turnDensity","単位長さ当たり巻数 n",100,3000,50,1000," 回/m")],
    calc(s){const absI=Math.abs(s.current),r=s.size/100;let field,labelText;if(s.shape==="wire"){field=MU0*absI/(2*Math.PI*r);labelText="同心円状";}else if(s.shape==="loop"){field=MU0*absI/(2*r);labelText="中心軸方向";}else{field=MU0*s.turnDensity*absI;labelText="内部でほぼ一様";}const direction=s.current===0?"磁場なし":s.current>0?"正方向":"負方向";const sign=Math.sign(s.current), size=.09+.22*s.size/50, amplitude=.18*field/(field+.00004);
      const lines=[], paths=[], arrows=[], texts=[];
      if(s.shape==="wire" || s.shape==="loop"){
        paths.push({points:Array.from({length:81},(_,i)=>[.5+size*Math.cos(TAU*i/80),.5+size*Math.sin(TAU*i/80)]),
          color:s.shape==="wire"?"#5795bf":"#b45309",width:s.shape==="wire"?2:5});
        if(s.shape==="wire") {
          texts.push({text:sign>0?"⊙":sign<0?"⊗":"○",x:.5,y:.5,size:27});
          if(sign) arrows.push({a:[.5+size,.5],b:[.5+size,.5-amplitude*sign],color:"#087f5b"});
        } else {
          if(sign) arrows.push({a:[.5+size,.5+.05*sign],b:[.5+size,.5-.05*sign],color:"#b45309"});
          texts.push({text:sign>0?"⊙ B":sign<0?"⊗ B":"B = 0",x:.5,y:.5,size:18});
        }
      } else {
        paths.push({points:Array.from({length:181},(_,i)=>[.15+.7*i/180,.5+.14*Math.sin(TAU*(3+s.turnDensity/170)*i/180)]),color:"#b45309",width:3});
        if(sign) arrows.push({a:[.5-amplitude*sign,.5],b:[.5+amplitude*sign,.5],color:"#087f5b"});
      }
      texts.push({text:sign===0?"電流がゼロのため磁場は生じない":"⊙ 手前向き　⊗ 奥向き",x:.5,y:.86});
      const figure=diagram({title:labelText+"の磁場",lines,polylines:paths,arrows,texts});
      return{metrics:[metric("磁束密度 B",`${fmt(field)} T`),metric("μT表示",`${fmt(field*1e6)} μT`),metric("磁場の形",labelText),metric("向き",direction)],visual: figure};}
  });

  add("parallel-current-force", {
    title:"平行電流間の力",subtitle:"電流の向きと導線間距離",lead:"2本の長い平行導線に流す電流の向きを変え、引力・斥力を確認します。",
    formula:"F/L = μ₀I₁I₂/(2πd)",focus:"同方向の電流は引き合い、逆方向の電流は反発します。",
    controls:[range("i1","電流 I₁",1,50,1,10," A"),range("i2","電流 I₂",1,50,1,15," A"),range("distance","導線間距離 d",1,100,1,20," cm"),range("length","導線の長さ L",.1,10,.1,2," m"),select("direction","電流の向き","same",[["same","同方向"],["opposite","逆方向"]])],
    calc(s){const perLength=MU0*s.i1*s.i2/(2*Math.PI*(s.distance/100)),force=perLength*s.length,attract=s.direction==="same";const gap=.13+.3*s.distance/100, left=.5-gap, right=.5+gap;
      const top=.43-.23*s.length/10, bottom=1-top;
      const span=(attract ? 1 : -1)*Math.min(attract?gap*.9:.96-right,.17)*force/(force+.0002);
      const figure=diagram({title:attract?"同方向の電流は引き合う":"逆方向の電流は反発する",
        lines:[{a:[left,top],b:[left,bottom],color:"#2364aa",width:6},{a:[right,top],b:[right,bottom],color:"#dc4c45",width:6}],
        arrows:[{a:[left,.5],b:[left+span,.5],color:"#087f5b"},{a:[right,.5],b:[right-span,.5],color:"#087f5b"},
          {a:[left,bottom],b:[left,top],color:"#b45309"},{a:[right,attract?bottom:top],b:[right,attract?top:bottom],color:"#b45309"}],
        texts:[{text:"電流 I₁",x:left,y:bottom+.07},{text:"電流 I₂",x:right,y:bottom+.07},{text:"緑の矢印は導線にはたらく力",x:.5,y:.91}]});
      return{metrics:[metric("単位長さ当たりの力",`${fmt(perLength)} N/m`),metric("導線に働く力",`${fmt(force)} N`),metric("作用",attract?"引力":"斥力"),metric("作用反作用", "大きさ等しく逆向き")],visual: figure};}
  });

  add("motional-emf", {
    timeRelevant: true,
    title:"導体棒の電磁誘導",subtitle:"運動起電力・誘導電流・磁気抵抗力",lead:"一様磁場中のレール上を導体棒が動くときの起電力と力を求めます。",
    formula:"e = BLv\nI = e/R\nF = BIL\nP機械 = Pジュール",focus:"誘導電流による力は運動を妨げる向きに働きます。",
    controls:[range("field","磁束密度 B",.05,2,.05,.5," T"),range("length","棒の長さ L",.1,2,.1,.8," m"),range("speed","棒の速さ v",.1,20,.1,5," m/s"),range("resistance","回路抵抗 R",.1,20,.1,4," Ω")],
    calc(s,t){const emf=s.field*s.length*s.speed,current=emf/s.resistance,force=s.field*current*s.length,power=emf*current,x=.3+(t*s.speed*.025%1)*.45;return{metrics:[metric("運動起電力",`${fmt(emf)} V`),metric("誘導電流",`${fmt(current)} A`),metric("磁気抵抗力",`${fmt(force)} N`),metric("ジュール電力",`${fmt(power)} W`)],visual:diagram({title:"レンツの法則により運動を妨げる",lines:[{a:[.15,.5-(.08+.07*s.length)],b:[.85,.5-(.08+.07*s.length)],color:"#667085",width:5},{a:[.15,.5+(.08+.07*s.length)],b:[.85,.5+(.08+.07*s.length)],color:"#667085",width:5},{a:[.15,.5-(.08+.07*s.length)],b:[.15,.5+(.08+.07*s.length)],color:"#344054",width:7},{a:[x,.5-(.08+.07*s.length)],b:[x,.5+(.08+.07*s.length)],color:"#b45309",width:10}],circles:Array.from({length:36},(_,i)=>({x:.2+(i%9)*.075,y:.35+Math.floor(i/9)*.1,r:1+2*s.field,color:"#2364aa",stroke:false})),arrows:[{a:[x,.2],b:[x+.16*s.speed/20,.2],color:"#dc4c45"},{a:[x,.8],b:[x-.2*force/(force+.4),.8],color:"#087f5b"}],texts:[{text:"v",x:x+.2,y:.2,color:"#dc4c45"},{text:"F",x:x-.16,y:.8,color:"#087f5b"},{text:"× 磁場は奥向き",x:.5,y:.9,color:"#2364aa"}]})};}
  });

  add("velocity-selector", {
    title:"速度選別器",subtitle:"電気力と磁気力のつり合い",lead:"互いに垂直な電場と磁場を重ね、特定の速さの荷電粒子だけを直進させます。",
    formula:"qE = qvB\nv = E/B\nF = q(E−vB)",focus:"直進条件は粒子の質量や電荷量によらず、E/Bだけで決まります。",
    controls:[range("electric","電場 E",1,100,1,20," kV/m"),range("field","磁束密度 B",.02,1,.01,.2," T"),range("speed","粒子速度 v",10,1000,10,100," km/s"),range("charge","電荷 q",-3,3,1,1," e")],
    calc(s){const selectSpeed=s.electric*1000/s.field,velocity=s.speed*1000,force=s.charge*E*(s.electric*1000-velocity*s.field),curvature=clamp(force/1e-13,-.28,.28);const path=Array.from({length:100},(_,i)=>{const x=.12+i/99*.76;return[x,.5+curvature*(i/99)**2];});return{metrics:[metric("選別速度 E/B",`${fmt(selectSpeed/1000)} km/s`),metric("合力",`${fmt(force)} N`),metric("速度差",`${fmt((velocity-selectSpeed)/1000)} km/s`),metric("軌道",Math.abs(force)<1e-18?"直進":"偏向")],visual:diagram({title:Math.abs(force)<1e-18?"電気力と磁気力がつり合う":"力の差により偏向",regions:[{x:.08,y:.18,w:.84,h:.64,color:"rgba(219,234,254,.22)"}],lines:[{a:[.08,.18],b:[.92,.18],color:"#dc4c45",width:7},{a:[.08,.82],b:[.92,.82],color:"#2364aa",width:7}],polylines:[{points:path,color:"#7c3aed",width:4}],circles:[{x:.12,y:.5,r:10,color:s.charge>=0?"#dc4c45":"#2f6fbd"}],arrows:[{a:[.48,.5],b:[.48,.5+.2*Math.tanh(s.charge*s.electric/100)],color:"#dc4c45"},{a:[.52,.5],b:[.52,.5-.2*Math.tanh(s.charge*s.speed*s.field/100)],color:"#087f5b"}],texts:[{text:"qE",x:.43,y:.3,color:"#dc4c45"},{text:"qvB",x:.58,y:.69,color:"#087f5b"},{text:"＋",x:.5,y:.14,color:"#dc4c45"},{text:"−",x:.5,y:.86,color:"#2364aa"}]})};}
  });

  add("mass-spectrometer", {
    title:"質量分析器",subtitle:"加速電圧と磁場中の軌道半径",lead:"同じ電荷をもつ粒子を電圧で加速し、磁場中の円運動から質量を分けます。",
    formula:"qV = ½mv²\nr = mv/(qB) = √(2mV/q)/B",focus:"同じ電荷なら重い同位体ほど軌道半径が大きくなります。",
    controls:[range("mass","質量 m",1,250,1,40," u"),range("charge","電荷数 z",1,3,1,1," e"),range("voltage","加速電圧",100,10000,100,2000," V"),range("field","磁束密度 B",.05,2,.05,.5," T")],
    calc(s) {
      const mass=s.mass*AMU, q=s.charge*E, speed=Math.sqrt(2*q*s.voltage/mass);
      const radius=mass*speed/(q*s.field), diameter=2*radius;
      return {metrics:[metric("粒子速度",fmt(speed)+" m/s"),metric("軌道半径",fmt(radius)+" m"),
        metric("検出位置 2r",fmt(diameter)+" m"),metric("質量電荷比",fmt(s.mass/s.charge)+" u/e")],
        visual:{draw(ctx,w,h){
          const x=w*.12, baseline=h*.67, available=Math.min(w*.38,h*.41);
          const fullScale=.1*2**Math.max(0,Math.ceil(Math.log2(radius/.1))), r=available*radius/fullScale;
          segment(ctx,x,baseline,x+2*available,baseline,"#64748b",3);
          ctx.strokeStyle="#7c3aed";ctx.lineWidth=3;ctx.beginPath();ctx.arc(x+r,baseline,r,Math.PI,TAU);ctx.stroke();
          arrow(ctx,x,baseline+25,x,baseline-2,"#b45309",2);dot(ctx,x+2*r,baseline,5,"#087f5b");
          label(ctx,"入射",x,baseline+42,"#b45309",12,"center");
          label(ctx,"検出",x+2*r,baseline-12,"#087f5b",12,"center");
          label(ctx,"⊙ 磁場は手前向き",w*.5,28,"#2364aa",14,"center");
          label(ctx,"横軸の長さ "+fmt(2*fullScale*100)+" cm",w*.5,h-22,"#475467",12,"center");
        }}};
    }
  });

  function cyclotronStart(s) {
    const mass=s.mass*AMU, q=s.charge*E, frequency=q*s.field/(TAU*mass);
    const firstRadius=Math.sqrt(2*mass*q*s.gapVoltage)/(q*s.field);
    let gapY=0, maxPasses=16;
    for(let i=0;i<16;i++){
      const side=i%2?-1:1, r=firstRadius*Math.sqrt(i+1);
      const center=gapY-side*r, end=gapY-2*side*r;
      if(Math.abs(end)>=s.radius){
        const cosine=(s.radius**2-center**2-r**2)/(2*center*side*r);
        maxPasses=i+Math.acos(clamp(cosine,-1,1))/Math.PI;
        break;
      }
      gapY=end;
    }
    return {mass,q,frequency,firstRadius,maxPasses};
  }

  add("cyclotron", {
    timeRelevant: true,
    title:"サイクロトロン",subtitle:"高周波加速とらせん状軌道",lead:"荷電粒子がD形電極のすき間を通るたびに加速され、軌道半径が広がる様子を追います。",
    formula:"f = qB/(2πm)\nr = mv/(qB)\nKmax = q²B²R²/(2m)",focus:"入射直後の最大16半周をスロー表示します。電極半径での速度が光速の1割を超える条件では、古典式による最大値の表示を止めます。",
    controls:[range("mass","粒子質量",1,20,.5,2," u"),range("charge","電荷数",1,3,1,1," e"),range("field","磁束密度 B",.1,3,.1,1," T"),range("radius","電極半径 R",.1,2,.1,.6," m"),range("gapVoltage","すき間電圧",100,10000,100,1000," V")],
    duration(s) {
      const {frequency, maxPasses}=cyclotronStart(s);
      return maxPasses*8e6/frequency;
    },
    calc(s,t) {
      const {mass,q,frequency,firstRadius,maxPasses}=cyclotronStart(s);
      const vmax=q*s.field*s.radius/mass, energy=.5*mass*vmax**2, turns=energy/(2*q*s.gapVoltage);
      const classical=vmax<=.1*C && maxPasses>=1;
      const outside=maxPasses<1?"初回の半周前に電極外":"非相対論近似の範囲外";
      const passes=Math.min(maxPasses,t*frequency/8e6);
      const visual={draw(ctx,w,h){
        const cx=w*.5, cy=h*.51, size=Math.min(w*.39,h*.32);
        const fieldWidth=.035*2**Math.max(0,Math.ceil(Math.log2(2*firstRadius*Math.sqrt(maxPasses)/.035)));
        const scale=size/fieldWidth;
        const electrodeRadius=Math.min(s.radius*scale,Math.hypot(w,h));
        ctx.save();ctx.beginPath();ctx.rect(8,42,w-16,h-98);ctx.clip();
        ctx.fillStyle="#e8eff6";ctx.beginPath();ctx.arc(cx,cy,electrodeRadius,0,TAU);ctx.fill();
        segment(ctx,cx,42,cx,h-52,"#fff",5);
        let gapY=cy, px=cx, py=cy;
        ctx.strokeStyle="#7c3aed";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(px,py);
        for(let pass=0;pass<Math.ceil(passes);pass++){
          const side=pass%2 ? -1 : 1;
          const radius=firstRadius*Math.sqrt(pass+1)*scale;
          const fraction=Math.min(1,passes-pass);
          for(let i=1;i<=32;i++){
            const phase=Math.PI*fraction*i/32;
            px=cx+side*radius*Math.sin(phase);py=gapY+side*radius*(Math.cos(phase)-1);ctx.lineTo(px,py);
          }
          gapY=py;
        }
        ctx.stroke();dot(ctx,px,py,6,"#dc4c45");ctx.restore();
        segment(ctx,cx-size*.25,h-42,cx+size*.25,h-42,"#087f5b",3);
        label(ctx,"入射直後の軌道　表示1秒＝62.5 ns",cx,24,"#344054",15,"center");
        label(ctx,"緑の目盛り "+fmt(fieldWidth*50)+" cm",cx,h-24,"#475467",12,"center");
      }};
      return {metrics:[metric("高周波周波数",fmt(frequency)+" Hz"),metric("最大速度",classical?fmt(vmax)+" m/s":outside),
        metric("最大運動E",classical?fmt(energy/E/1e6)+" MeV":outside),metric("概算周回数",classical?fmt(turns):outside),metric("最初の半径",fmt(firstRadius*100)+" cm"),metric("粒子の経過時間",fmt(passes/(2*frequency)*1e9)+" ns")],visual};}
  });

  add("hall-effect", {
    title:"ホール効果",subtitle:"キャリア符号・密度・ホール電圧",lead:"電流を流した試料へ垂直に磁場を加え、横方向に現れる電圧を計算します。",
    formula:"VH = BI/(nqt)\nRH = 1/(nq)",focus:"ホール電圧の符号から、主な電荷キャリアが正か負かを判定できます。",
    controls:[range("current","電流 I",.01,10,.01,1," A"),range("field","磁束密度 B",-.8,.8,.05,.4," T"),range("density","キャリア密度 n",.1,10,.1,2," ×10²⁸ m⁻³"),range("thickness","試料厚さ t",.1,5,.1,1," mm"),select("carrier","キャリア","electron",[["electron","電子"],["positive","正孔"]])],
    calc(s){const q=s.carrier==="electron"?-E:E,n=s.density*1e28,t=s.thickness/1000,voltage=s.field*s.current/(n*q*t),rh=1/(n*q),topPositive=voltage>0;return{metrics:[metric("ホール電圧",`${fmt(voltage)} V`),metric("μV表示",`${fmt(voltage*1e6)} μV`),metric("ホール係数",`${fmt(rh)} m³/C`),metric("上側電位",voltage===0?"同電位":topPositive?"＋":"−")],visual:diagram({title:"磁気力でキャリアが横へ偏る",rects:[{x:.16,y:.3,w:.68,h:.4,fill:"rgba(219,234,254,.5)",stroke:"#2364aa"}],circles:Array.from({length:24},(_,i)=>({x:.2+(i%8)*.085,y:.36+Math.floor(i/8)*.14-.065*Math.tanh(s.field*s.current/s.density/s.thickness),r:6,color:s.carrier==="electron"?"#2f6fbd":"#dc4c45"})),arrows:[{a:[.08,.5],b:[.16+.7*s.current/10,.5],color:"#087f5b"},{a:[.5,.5],b:[.5,.5-.18*Math.tanh(voltage*1e6)],color:"#7c3aed"}],texts:[{text:"電流 I",x:.84,y:.44,color:"#087f5b"},{text:voltage===0?"同電位":topPositive?"＋":"−",x:.5,y:.23,color:topPositive?"#dc4c45":"#2f6fbd",size:22},{text:voltage===0?"":topPositive?"−":"＋",x:.5,y:.77,color:topPositive?"#2f6fbd":"#dc4c45",size:22},{text:"B：紙面に垂直",x:.5,y:.88,color:"#7c3aed"}]})};}
  });

  add("internal-resistance", {
    title:"電池の内部抵抗",subtitle:"端子電圧・負荷電力・最大電力",lead:"電池を起電力と内部抵抗の直列回路として扱い、負荷抵抗による変化を調べます。",
    formula:"I = E/(R+r)\nV端子 = E−Ir\nP負荷 = I²R",focus:"負荷電力はR=rで最大ですが、そのとき効率は50%です。",
    controls:[range("emf","起電力 E",1,24,.5,12," V"),range("internal","内部抵抗 r",.1,20,.1,2," Ω"),range("load","負荷抵抗 R",.1,100,.1,8," Ω")],
    calc(s){const current=s.emf/(s.load+s.internal),terminal=current*s.load,power=current**2*s.load,loss=current**2*s.internal,maxPower=s.emf**2/(4*s.internal),efficiency=s.load/(s.load+s.internal);const maxR=Math.max(100,s.internal*5);const samples=Array.from({length:121},(_,i)=>{const r=.1+i/120*maxR;return current===Infinity?0:(s.emf/(r+s.internal))**2*r;});const peak=24**2/(4*s.internal);return{metrics:[metric("回路電流",`${fmt(current)} A`),metric("端子電圧",`${fmt(terminal)} V`),metric("負荷電力",`${fmt(power)} W`),metric("内部損失",`${fmt(loss)} W`),metric("効率",`${fmt(efficiency*100,1)} %`),metric("理論最大電力",`${fmt(maxPower)} W`)],visual:graph({title:"負荷抵抗と取り出せる電力",xLabel:"R (Ω)",yLabel:"P (W)",curves:[{color:"#087f5b",points:samples.map((p,i)=>[i/120,p/peak])}],markerX:clamp((s.load-.1)/maxR,0,1),legend:[{label:"縦軸上端 "+fmt(peak)+" W",color:"#087f5b"}]})};}
  });

  add("wheatstone-bridge", {
    title:"ホイートストンブリッジ",subtitle:"電位差と平衡条件",lead:"4つの抵抗で橋形回路を作り、中点間の電位差が0になる抵抗比を探します。",
    formula:"平衡条件：R₁/R₂ = R₃/Rx\nRx = R₂R₃/R₁",focus:"平衡時は検流計に電流が流れず、電源電圧に依存せず抵抗比だけで決まります。",
    controls:[range("r1","抵抗 R₁",1,100,1,20," Ω"),range("r2","抵抗 R₂",1,100,1,40," Ω"),range("r3","抵抗 R₃",1,100,1,30," Ω"),range("rx","未知抵抗 Rx",1,200,1,60," Ω"),range("voltage","電源電圧",1,24,.5,6," V")],
    calc(s){const left=s.voltage*s.r2/(s.r1+s.r2),right=s.voltage*s.rx/(s.r3+s.rx),delta=left-right,balance=s.r2*s.r3/s.r1;return{metrics:[metric("左中点電位",`${fmt(left)} V`),metric("右中点電位",`${fmt(right)} V`),metric("検流計電位差",`${fmt(delta)} V`),metric("平衡となるRx",`${fmt(balance)} Ω`),metric("判定",Math.abs(delta)<1e-10?"平衡":"不平衡")],visual:diagram({title:Math.abs(delta)<1e-10?"検流計電流は0":"検流計に電流が流れる",polylines:[{points:[[.5,.12],[.18,.5],[.5,.88],[.82,.5],[.5,.12]],color:"#344054",width:4}],rects:[{x:.29,y:.25,w:.13,h:.08,fill:"#fff4d8",stroke:"#b45309"},{x:.29,y:.68,w:.13,h:.08,fill:"#fff4d8",stroke:"#b45309"},{x:.58,y:.25,w:.13,h:.08,fill:"#fff4d8",stroke:"#b45309"},{x:.58,y:.68,w:.13,h:.08,fill:"#fff4d8",stroke:"#b45309"}],lines:[{a:[.18,.5],b:[.82,.5],color:Math.abs(delta)<1e-10?"#087f5b":"#dc4c45",width:4}],circles:[{x:.5,y:.5,r:23,color:Math.abs(delta)<1e-10?"#087f5b":"#dc4c45"}],arrows:Math.abs(delta)<1e-10?[]:[{a:[.5,.47],b:[.5+.24*Math.tanh(delta/2),.47],color:"#f59e0b"}],texts:[{text:`R₁ ${s.r1}Ω`,x:.35,y:.22},{text:`R₂ ${s.r2}Ω`,x:.35,y:.79},{text:`R₃ ${s.r3}Ω`,x:.65,y:.22},{text:`Rx ${s.rx}Ω`,x:.65,y:.79},{text:"G",x:.5,y:.5,color:"#ffffff",size:18}]})};}
  });

  add("rutherford-scattering", {
    title:"ラザフォード散乱",subtitle:"衝突径数と散乱角",lead:"正に帯電した原子核へα粒子を入射し、クーロン反発による軌道の曲がりを調べます。",
    formula:"b = [kZze²/(2E)] cot(θ/2)\nθ = 2tan⁻¹[kZze²/(2Eb)]",focus:"大部分は小角散乱ですが、原子核近くを通る少数の粒子は大きく曲がります。",
    controls:[range("atomicNumber","原子番号 Z",10,92,1,79,""),range("energy","α粒子エネルギー",1,10,.1,5," MeV"),range("impact","衝突径数 b",1,100,1,20," fm")],
    calc(s){const kinetic=s.energy*1e6*E,b=s.impact*1e-15,a=KCOULOMB*s.atomicNumber*2*E*E/(2*kinetic),theta=2*Math.atan(a/b),closest=2*a;const eccentricity=Math.hypot(1,b/a);
      const visual={draw(ctx,w,h) {
        const ox=w*.58, oy=h*.63, px=Math.min(w*.38,h*.36)/(160e-15);
        const alongX=-1/eccentricity, alongY=(b/a)/eccentricity;
        ctx.save(); ctx.beginPath();ctx.rect(0,42,w,h-95);ctx.clip();
        ctx.setLineDash([4,5]);segment(ctx,0,oy-b*px,w,oy-b*px,"#94a3b8",1);ctx.setLineDash([]);
        ctx.beginPath();
        for(let i=0;i<=240;i++){
          const u=-6+i/20, along=a*(eccentricity+Math.cosh(u)), across=b*Math.sinh(u);
          const x=ox+px*(along*alongX+across*alongY),y=oy-px*(along*alongY-across*alongX);
          if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);
        }
        ctx.lineWidth=3;ctx.strokeStyle="#7c3aed";ctx.stroke();
        arrow(ctx,w*.12,oy-b*px,w*.22,oy-b*px,"#2364aa");dot(ctx,ox,oy,7,"#f59e0b");ctx.restore();
        label(ctx,"散乱角 "+fmt(deg(theta),1)+"°",w/2,24,"#344054",15,"center");
        label(ctx,"破線は入射方向　橙の点は原子核",w/2,h-22,"#475467",12,"center");
      }};
      return {metrics:[metric("散乱角 θ",fmt(deg(theta),2)+"°"),metric("クーロン長 a",fmt(a*1e15)+" fm"),
        metric("正面衝突の最近接距離",fmt(closest*1e15)+" fm"),metric("散乱の強さ",theta>Math.PI/2?"大角散乱":"小角散乱")],visual};}
  });

  add("electron-diffraction", {
    title:"物質波と電子回折",subtitle:"加速電圧・ド・ブロイ波長・回折環",lead:"電圧で加速した電子の波長を求め、結晶による回折環の大きさへ結び付けます。",
    formula:"λ = h/p\np = √[2meV(1+eV/(2mc²))]\n2d sinθ = nλ",focus:"加速電圧を高くすると電子の運動量が増し、物質波の波長は短くなります。",
    controls:[range("voltage","加速電圧 V",20,20000,20,2000," V"),range("spacing","格子面間隔 d",.05,.5,.01,.2," nm"),range("order","回折次数 n",1,3,1,1,""),range("camera","カメラ長 L",5,100,1,30," cm")],
    calc(s){const me=9.1093837139e-31,voltageEnergy=E*s.voltage,momentum=Math.sqrt(2*me*voltageEnergy*(1+voltageEnergy/(2*me*C*C))),lambda=H/momentum,ratio=s.order*lambda/(2*s.spacing*1e-9),valid=ratio<=1,theta=valid?Math.asin(ratio):NaN,ring=valid&&2*theta<Math.PI/2-1e-10?s.camera/100*Math.tan(2*theta):NaN;const onScreen=Number.isFinite(ring),rr=onScreen?135*ring/(ring+.035):0;return{metrics:[metric("ド・ブロイ波長",`${fmt(lambda*1e9)} nm`),metric("ブラッグ角",valid?`${fmt(deg(theta),2)}°`:"成立しない"),metric("回折環半径",onScreen?`${fmt(ring*1000)} mm`:"—"),metric("電子運動量",`${fmt(momentum)} kg·m/s`)],visual:diagram({title:onScreen?"結晶で電子波が回折する":valid?"前方の蛍光面には届かない":"この次数の回折条件は成立しない",regions:[{x:.55,y:.12,w:.37,h:.76,color:"#111827"}],circles:onScreen?Array.from({length:60},(_,i)=>{const a=i/60*TAU;return{x:.735+rr/700*Math.cos(a),y:.5+rr/460*Math.sin(a),r:3,color:"#60a5fa",stroke:false};}):[],polylines:[{points:Array.from({length:100},(_,i)=>[.06+i/99*.36,.5+.06*Math.sin(i/99*TAU*8)]),color:"#7c3aed",width:3}],rects:[{x:.45,y:.25,w:.04,h:.5,fill:"#d1d5db",stroke:"#667085"}],arrows:[{a:[.08,.5],b:[.43,.5],color:"#f59e0b"}],texts:[{text:"電子線",x:.22,y:.39,color:"#7c3aed"},{text:"結晶",x:.47,y:.8},{text:"蛍光面",x:.735,y:.86,color:"#60a5fa"}]})};}
  });

  add("xray-bragg", {
    title:"X線とブラッグ反射",subtitle:"結晶格子と強め合いの条件",lead:"平行な結晶面で反射したX線の光路差を調べ、回折ピークの角度を求めます。",
    formula:"2d sinθ = nλ",focus:"隣り合う面からの反射波の光路差が波長の整数倍になると強め合います。",
    controls:[range("wavelength","X線波長 λ",.03,.3,.005,.1," nm"),range("spacing","格子面間隔 d",.08,.6,.01,.25," nm"),range("order","回折次数 n",1,5,1,1,""),
      select("planes","表示する光路","both",[["both","両方の光路と光路差"],["upper","上の面だけ"],["lower","下の面だけ"]])],
    calc(s) {
      const pathDifference = s.order * s.wavelength;
      const ratio = pathDifference / (2 * s.spacing);
      const valid = ratio <= 1 + 1e-12;
      const theta = valid ? Math.asin(Math.min(ratio, 1)) : NaN;
      return { metrics: [metric("ブラッグ角 θ", valid ? fmt(deg(theta),2)+"°" : "成立しない"),
        metric("光路差",valid ? fmt(pathDifference)+" nm" : "—"), metric("nλ",fmt(pathDifference)+" nm"),
        metric("回折条件", valid ? "強め合い" : "この次数は不可")],
        visual: {kind:"bragg", theta, planes:s.planes, spacing:s.spacing, pathDifference} };
    }
  });

  add("compton-scattering", {
    title:"コンプトン効果",subtitle:"光子の運動量と波長変化",lead:"X線光子が電子と衝突したとき、散乱角に応じて波長が長くなることを確認します。",
    formula:"Δλ = h/(mec)(1−cosθ)\nEγ = hc/λ",focus:"波長変化は入射波長ではなく散乱角だけで決まり、光子が運動量をもつ証拠になります。",
    controls:[range("wavelength","入射X線波長",10,200,1,70," pm"),range("angle","光子の散乱角",0,180,1,90,"°")],
    calc(s){const me=9.1093837139e-31,compton=H/(me*C),shift=compton*(1-Math.cos(rad(s.angle))),out=s.wavelength*1e-12+shift,ein=H*C/(s.wavelength*1e-12),eout=H*C/out,recoil=ein-eout;const a=rad(s.angle),end=[.5+.34*Math.cos(a),.5-.34*Math.sin(a)],electronAngle=Math.atan2(Math.sin(a)*eout/C,ein/C-Math.cos(a)*eout/C);return{metrics:[metric("波長変化 Δλ",`${fmt(shift*1e12)} pm`),metric("散乱後波長",`${fmt(out*1e12)} pm`),metric("反跳電子の運動E",`${fmt(recoil/E/1000)} keV`),metric("コンプトン波長",`${fmt(compton*1e12)} pm`)],visual:diagram({title:"エネルギーと運動量を電子へ渡す",lines:[{a:[.08,.5],b:[.5,.5],color:"#2364aa",width:5}],arrows:[{a:[.5,.5],b:end,color:"#7c3aed",width:4},{a:[.5,.5],b:[.5+.28*Math.cos(electronAngle),.5+.28*Math.sin(electronAngle)],color:"#dc4c45",width:4}],circles:[{x:.5,y:.5,r:13,color:"#2f6fbd"}],texts:[{text:"入射光子",x:.23,y:.43,color:"#2364aa"},{text:"散乱光子",x:end[0],y:end[1]-.06,color:"#7c3aed"},{text:"反跳電子",x:.5+.3*Math.cos(electronAngle),y:.5+.3*Math.sin(electronAngle)+.06,color:"#dc4c45"}]})};}
  });

  add("binding-energy-curve", {
    title:"原子核の結合エネルギー曲線",subtitle:"質量欠損と核分裂・核融合",lead:"半経験的質量公式で核子当たり結合エネルギーを見積もり、安定性の傾向を調べます。",
    formula:"B = avA−asA^(2/3)−acZ(Z−1)/A^(1/3)−aa(A−2Z)²/A+δ",focus:"軽い核の融合と重い核の分裂は、どちらも鉄付近へ近づくことでエネルギーを放出します。",
    controls:[range("massNumber","質量数 A",2,250,1,56,""),range("atomicNumber","原子番号 Z",1,100,1,26,"")],
    calc(s){const binding=(A,Z)=>{const av=15.75,as=17.8,ac=.711,aa=23.7;let delta=0;if(A%2===0){if(Z%2===0&&Math.round(A-Z)%2===0)delta=34/A**.75;else if(Z%2===1&&Math.round(A-Z)%2===1)delta=-34/A**.75;}return av*A-as*A**(2/3)-ac*Z*(Z-1)/A**(1/3)-aa*(A-2*Z)**2/A+delta;};const A=Math.round(s.massNumber),Z=clamp(Math.round(s.atomicNumber),1,A-1),total=binding(A,Z),per=total/A,defect=total/931.494;const points=[];let max=0;for(let a=2;a<=250;a+=2){const z=clamp(Math.round(a/(2+.015*a**(2/3))),1,a-1),v=Math.max(0,binding(a,z)/a);points.push([(a-2)/248,v/9]);max=Math.max(max,v);}return{metrics:[metric("全結合エネルギー",`${fmt(total)} MeV`),metric("核子当たり",`${fmt(per)} MeV`),metric("質量欠損",`${fmt(defect)} u`),metric("安定性の目安",per>8?"比較的強く結合":"結合が弱い")],visual:graph({title:"鉄付近で核子当たり結合Eが最大",xLabel:"質量数 A",yLabel:"B/A",curves:[{color:"#2364aa",points}],markerX:(A-2)/248,markerY:per/9,legend:[{label:per<0?"赤点は下端外（未結合）":"赤点は選択した核種",color:"#2364aa"}]})};}
  });

  add("fission-chain-reaction", {
    timeRelevant: true,
    title:"核分裂連鎖反応",subtitle:"中性子増倍率と臨界",lead:"1世代の中性子が次世代に何個の核分裂を起こすかを増倍率kで表します。",
    formula:"Nₙ = N₀kⁿ\nk<1：未臨界, k=1：臨界, k>1：超臨界",focus:"制御棒は余分な中性子を吸収し、実効増倍率を1付近に保ちます。",
    controls:[range("initial","初期中性子数 N₀",1,20,1,4," 個"),range("factor","増倍率 k",.3,1.6,.05,1,""),range("generations","世代数",1,20,1,10," 世代")],
    calc(s,t){const g=Math.min(s.generations,Math.floor(t*1.5)% (s.generations+1)),current=s.initial*s.factor**g,total=Math.abs(s.factor-1)<1e-9?s.initial*(g+1):s.initial*(s.factor**(g+1)-1)/(s.factor-1),end=s.initial*s.factor**s.generations,max=Math.max(s.initial,end,1);const points=Array.from({length:s.generations+1},(_,i)=>[i/s.generations,clamp((s.initial*s.factor**i)/max,0,1)]);const state=s.factor<.975?"未臨界":s.factor>1.025?"超臨界":"臨界";return{metrics:[metric("現在世代",`${g}`),metric("現在の中性子数",fmt(current)),metric("累積反応の目安",fmt(total)),metric("状態",state)],visual:graph({title:`${state}：世代ごとの中性子数`,xLabel:"世代",yLabel:"相対数",curves:[{color:state==="臨界"?"#087f5b":state==="超臨界"?"#dc4c45":"#2364aa",points}],markerX:g/s.generations,legend:[{label:"中性子数",color:state==="超臨界"?"#dc4c45":"#2364aa"}]})};}
  });

  add("radiation-shielding", {
    title:"放射線の透過と遮蔽",subtitle:"吸収係数・半価層・透過率",lead:"放射線の種類と遮蔽材を選び、厚さによる強度の指数減衰を比較します。",
    formula:"I = I₀e^(−μx)\n半価層 x₁/₂ = ln2/μ",focus:"遮蔽効果は材質だけでなく、放射線の種類とエネルギーにも強く依存します。",
    controls:[select("radiation","放射線","gamma",[["gamma","γ線"],["xray","X線"],["neutron","中性子"]]),select("material","遮蔽材","lead",[["lead","鉛"],["concrete","コンクリート"],["aluminum","アルミニウム"],["polyethylene","ポリエチレン"]]),range("thickness","遮蔽厚さ x",0,50,.5,5," cm")],
    calc(s){const table={gamma:{lead:1.25,concrete:.12,aluminum:.15,polyethylene:.08},xray:{lead:5,concrete:.35,aluminum:.5,polyethylene:.12},neutron:{lead:.02,concrete:.08,aluminum:.03,polyethylene:.12}},mu=table[s.radiation][s.material],trans=Math.exp(-mu*s.thickness),hvl=Math.log(2)/mu;const particles=Array.from({length:36},(_,i)=>{const y=.2+(i%12)*.055,x=.08+Math.floor(i/12)*.09;return{x,y,r:3,color:"#7c3aed",stroke:false};});const passed=Math.round(36*trans);return{metrics:[metric("線減弱係数 μ",`${fmt(mu)} cm⁻¹`),metric("半価層",`${fmt(hvl)} cm`),metric("透過率",`${fmt(trans*100,2)} %`),metric("減弱率",`${fmt((1-trans)*100,2)} %`)],visual:diagram({title:"厚さとともに指数関数的に減衰",rects:[{x:.38,y:.12,w:clamp(s.thickness/50*.28,.01,.28),h:.76,fill:s.material==="lead"?"#9ca3af":s.material==="concrete"?"#d6d3d1":s.material==="aluminum"?"#dbeafe":"#dcfce7",stroke:"#667085"}],circles:[...particles,...Array.from({length:passed},(_,i)=>({x:.72+(i%9)*.025,y:.28+Math.floor(i/9)*.11,r:3,color:"#087f5b",stroke:false}))],arrows:[{a:[.08,.5],b:[.36,.5],color:"#7c3aed"},{a:[.68,.5],b:[.9,.5],color:"#087f5b"}],texts:[{text:"入射放射線",x:.2,y:.12,color:"#7c3aed"},{text:`遮蔽材 ${s.thickness} cm`,x:.52,y:.92},{text:`透過 ${fmt(trans*100,1)}%`,x:.8,y:.15,color:"#087f5b"}]})};}
  });

  // DOMAIN_SCENARIOS

  function launch() {
    const scenario = scenarios[window.PHYSICS_LAB_ID];
    const root = document.getElementById("physics-lab-root");
    if (!root || !scenario) {
      if (root) root.textContent = "シミュレータ設定を読み込めませんでした。";
      return;
    }

    const style = document.createElement("style");
    style.textContent = `
      .lab-view-tools{display:flex;align-items:center;flex-wrap:wrap;gap:6px;margin-left:auto}
      .lab-view-tools button{min-height:30px;padding:0 9px;border:1px solid #c8d3e4;border-radius:7px;background:#fff;color:#17202a;font-size:12px;font-weight:700;cursor:pointer}
      .lab-view-tools output{min-width:48px;color:#344054;font-size:12px;font-weight:700;text-align:center}
      .lab-canvas[data-pannable="true"]{cursor:grab;touch-action:none}
      .lab-canvas[data-dragging="true"]{cursor:grabbing}
      @media(max-width:600px){.lab-view-tools{margin-left:0}}
    `;
    document.head.append(style);

    const timeRelevant = scenario.timeRelevant === true;
    const actionsMarkup = timeRelevant
      ? `<div class="lab-actions"><button class="primary" type="button" data-action="play">再生</button><button type="button" data-action="step">0.2秒進める</button><button type="button" data-action="reset">初期状態</button></div><div class="lab-status" aria-live="polite">停止中</div>`
      : `<div class="lab-actions"><button type="button" data-action="reset">条件を初期値へ戻す</button></div><div class="lab-status" aria-live="polite"></div>`;

    root.className = "physics-lab";
    root.innerHTML = `
      <div class="lab-layout">
        <section class="lab-panel" aria-labelledby="lab-title">
          <h1 id="lab-title"></h1><p class="lab-lead"></p>
          <div class="lab-controls" aria-label="物理条件"></div>
          ${actionsMarkup}
        </section>
        <section class="lab-stage" aria-labelledby="stage-title">
          <div class="lab-stage-head"><div><h2 id="stage-title">現象の可視化</h2><div class="lab-stage-note"></div></div><div class="lab-view-tools" aria-label="表示倍率"><button type="button" data-fit>自動</button><button type="button" data-zoom-out aria-label="縮小">−</button><output data-zoom-label>100%</output><button type="button" data-zoom-in aria-label="拡大">＋</button></div></div>
          <div class="lab-canvas-wrap"><canvas class="lab-canvas" role="img"></canvas></div>
          <div class="lab-readouts" aria-label="計算結果"></div>
        </section>
      </div>
      <section class="lab-explanation"><h2>考え方と式</h2><div class="lab-formula"></div><p class="lab-focus"></p></section>`;

    root.querySelector("#lab-title").textContent = scenario.title;
    root.querySelector(".lab-lead").textContent = scenario.lead;
    root.querySelector(".lab-stage-note").textContent = scenario.subtitle;
    root.querySelector(".lab-formula").textContent = scenario.formula;
    root.querySelector(".lab-focus").textContent = `観察の焦点：${scenario.focus}`;

    const state = {};
    const inputs = new Map();
    const controlsRoot = root.querySelector(".lab-controls");
    for (const control of scenario.controls) {
      state[control.key] = control.type === "range" ? Number(control.value) : control.value;
      const field = document.createElement("label"); field.className = "lab-field";
      const head = document.createElement("span"); head.className = "lab-field-head";
      const caption = document.createElement("span"); caption.textContent = control.label;
      const output = document.createElement("output"); head.append(caption, output); field.append(head);
      const input = document.createElement(control.type === "select" ? "select" : "input");
      if (control.type === "select") {
        for (const [value, text] of control.options) { const option = document.createElement("option"); option.value = value; option.textContent = text; input.append(option); }
        input.value = control.value;
      } else {
        input.type = "range"; input.min = control.min; input.max = control.max; input.step = control.step; input.value = control.value;
      }
      input.setAttribute("aria-label", control.label); field.append(input); controlsRoot.append(field);
      inputs.set(control.key, { input, output, control });
      input.addEventListener("input", () => {
        state[control.key] = control.type === "range" ? Number(input.value) : input.value;
        if (scenario.tau && control.key === "ratio") elapsed = state.ratio * scenario.tau(state);
        if (scenario.duration) {
          const end = scenario.duration(state);
          elapsed = Math.min(elapsed, end);
          if (elapsed >= end) playing = false;
          playButton.textContent = playing ? "一時停止" : elapsed >= end ? "もう一度再生" : "再生";
          status.textContent = playing ? "再生中" : "時刻 "+fmt(elapsed)+" s";
        }
        if (!timeRelevant) status.textContent = "条件を更新しました。図と結果を見比べてください。";
        updateOutputs(); render();
      });
    }

    const compareConditions = ["coupled-pulley-dynamics", "rc-circuit", "lr-circuit", "xray-bragg", "brownian-diffusion", "fission-chain-reaction"].includes(window.PHYSICS_LAB_ID)
      ? null : window.PhysicsSimShell.conditionComparison?.(root, scenario, state, render);
    const canvas = root.querySelector("canvas");
    const ctx = canvas.getContext("2d");
    const metricsRoot = root.querySelector(".lab-readouts");
    const playButton = root.querySelector("[data-action=play]");
    const status = root.querySelector(".lab-status");
    const zoomLabel = root.querySelector("[data-zoom-label]");
    let playing = false, elapsed = 0, visualTime = 0, lastFrame = performance.now(), metricSignature = "";
    const view = { zoom: 1, panX: 0, panY: 0, auto: true, dragging: false, pointerX: 0, pointerY: 0 };

    function updateOutputs() {
      for (const { input, output, control } of inputs.values()) {
        if (control.type === "select") output.textContent = input.options[input.selectedIndex]?.textContent || input.value;
        else output.textContent = `${fmt(Number(input.value), 3)}${control.unit}`;
      }
    }

    function ensureCanvas() {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const width = Math.max(1, Math.round(rect.width * dpr)), height = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
      return { width: rect.width, height: rect.height, dpr };
    }

    function updateMetrics(metrics) {
      const signature = metrics.map(item => item.label).join("|");
      if (signature !== metricSignature) {
        metricsRoot.innerHTML = metrics.map(item => `<div class="lab-readout"><span></span><strong></strong></div>`).join("");
        metricSignature = signature;
      }
      [...metricsRoot.children].forEach((node, index) => {
        node.querySelector("span").textContent = metrics[index].label;
        node.querySelector("strong").textContent = metrics[index].value;
      });
    }

    function clampPan(width, height) {
      const maxX = Math.max(0, (view.zoom - 1) * width / 2);
      const maxY = Math.max(0, (view.zoom - 1) * height / 2);
      view.panX = clamp(view.panX, -maxX, maxX); view.panY = clamp(view.panY, -maxY, maxY);
    }

    function setZoom(next, auto = false) {
      view.zoom = clamp(next, 1, 2.5); view.auto = auto;
      if (auto || view.zoom === 1) { view.panX = 0; view.panY = 0; }
      canvas.dataset.pannable = view.zoom > 1 ? "true" : "false";
      zoomLabel.textContent = `${Math.round(view.zoom * 100)}%`;
      render();
    }

    function render() {
      const size = ensureCanvas();
      if (scenario.tau) {
        const {input,output} = inputs.get("ratio");
        state.ratio = elapsed / scenario.tau(state);
        input.value = state.ratio; output.textContent = fmt(state.ratio,2);
      }
      const result = scenario.calc(state, timeRelevant ? elapsed : visualTime);
      updateMetrics(result.metrics);
      compareConditions?.(result,timeRelevant?elapsed:visualTime,size.width,size.height,
        (context,w,h,conditions,t,model)=>drawVisual(context,w,h,model.visual));
      ctx.setTransform(size.dpr, 0, 0, size.dpr, 0, 0);
      ctx.clearRect(0, 0, size.width, size.height);
      ctx.fillStyle = "#fbfdff"; ctx.fillRect(0, 0, size.width, size.height);
      clampPan(size.width, size.height);
      ctx.save();
      ctx.translate(size.width / 2 + view.panX, size.height / 2 + view.panY);
      ctx.scale(view.zoom, view.zoom);
      ctx.translate(-size.width / 2, -size.height / 2);
      drawVisual(ctx, size.width, size.height, result.visual);
      ctx.restore();
    }

    function reset() {
      playing = false; elapsed = 0;
      if (playButton) playButton.textContent = "再生";
      status.textContent = timeRelevant ? "停止中" : "初期条件に戻しました。";
      for (const { input, control } of inputs.values()) { input.value = control.value; state[control.key] = control.type === "range" ? Number(control.value) : control.value; }
      updateOutputs(); setZoom(1, true); render();
    }

    let advancePlayback;
    if (timeRelevant) {
      const stepButton = root.querySelector("[data-action=step]");
      if (scenario.tau) stepButton.textContent = "0.2τ 進める";
      const limit = () => scenario.duration ? scenario.duration(state) : Infinity;
      function advance(delta) {
        elapsed = Math.min(elapsed + delta, limit());
        if (elapsed >= limit()) {
          playing = false; playButton.textContent = "もう一度再生";
          status.textContent = "観察終了　"+fmt(elapsed)+" s";
        }
        render();
      }
      playButton.addEventListener("click", () => {
        if (!playing && elapsed >= limit()) elapsed = 0;
        playing = !playing; playButton.textContent = playing ? "一時停止" : "再生";
        status.textContent = playing ? "再生中" : "停止中"; lastFrame = performance.now();
      });
      stepButton.addEventListener("click", () => {
        playing = false; playButton.textContent = "再生";
        const step = scenario.tau ? .2*scenario.tau(state) : .2;
        status.textContent = "時刻 "+fmt(Math.min(limit(),elapsed+step))+" s"; advance(step);
      });
      advancePlayback = delta => {
        const rate = scenario.tau ? clamp(scenario === scenarios["lr-circuit"] ? .01 : 1, scenario.tau(state)*.18, scenario.tau(state)) : 1;
        advance(delta*rate);
      };
    }
    root.querySelector("[data-action=reset]").addEventListener("click", reset);
    root.querySelector("[data-fit]").addEventListener("click", () => setZoom(1, true));
    root.querySelector("[data-zoom-in]").addEventListener("click", () => setZoom(view.zoom + .25));
    root.querySelector("[data-zoom-out]").addEventListener("click", () => setZoom(view.zoom - .25));
    canvas.addEventListener("wheel", event => { if (!event.ctrlKey && !event.metaKey) return; event.preventDefault(); setZoom(view.zoom + (event.deltaY < 0 ? .15 : -.15)); }, { passive: false });
    canvas.addEventListener("pointerdown", event => { if (view.zoom <= 1) return; view.dragging = true; view.pointerX = event.clientX; view.pointerY = event.clientY; canvas.dataset.dragging = "true"; canvas.setPointerCapture(event.pointerId); });
    canvas.addEventListener("pointermove", event => { if (!view.dragging) return; view.panX += event.clientX - view.pointerX; view.panY += event.clientY - view.pointerY; view.pointerX = event.clientX; view.pointerY = event.clientY; render(); });
    const endDrag = () => { view.dragging = false; canvas.dataset.dragging = "false"; };
    canvas.addEventListener("pointerup", endDrag); canvas.addEventListener("pointercancel", endDrag);
    new ResizeObserver(render).observe(canvas);
    window.addEventListener("keydown", event => {
      if (event.key === "+" && (event.ctrlKey || event.metaKey)) { event.preventDefault(); setZoom(view.zoom + .25); }
      if (event.key === "-" && (event.ctrlKey || event.metaKey)) { event.preventDefault(); setZoom(view.zoom - .25); }
      if (event.key === "0" && (event.ctrlKey || event.metaKey)) { event.preventDefault(); setZoom(1, true); }
    });

    function animate(now) {
      const delta = Math.min(.05, Math.max(0, (now - lastFrame) / 1000));
      visualTime += delta;
      if (playing) advancePlayback(delta);
      else if (!timeRelevant && scenario !== scenarios["xray-bragg"]) render();
      lastFrame = now; requestAnimationFrame(animate);
    }
    updateOutputs(); reset(); requestAnimationFrame(animate);
  }

  launch();
})();
