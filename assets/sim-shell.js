(function () {
  function resolveBasePath() {
    // The common script is under /assets/, while each simulator page is two
    // levels below the catalog. Resolve from the page, not from this script.
    return new URL("../../", window.location.href).pathname;
  }

  function createShell(options) {
    const title = options?.title ?? document.title ?? "物理シミュレーター";
    const subtitle = options?.subtitle ?? "";
    const basePath = options?.basePath ?? resolveBasePath();

    const header = document.createElement("div");
    header.className = "sim-shell-header";

    const inner = document.createElement("div");
    inner.className = "sim-shell-inner";

    const home = document.createElement("a");
    home.className = "sim-shell-back";
    home.href = basePath;
    home.textContent = "一覧へ";

    const text = document.createElement("div");
    text.className = "sim-shell-title";

    const heading = document.createElement("div");
    heading.className = "sim-shell-heading";
    heading.textContent = title;
    text.append(heading);

    if (subtitle) {
      const note = document.createElement("div");
      note.className = "sim-shell-subtitle";
      note.textContent = subtitle;
      text.append(note);
    }

    inner.append(home, text);
    header.append(inner);
    document.body.prepend(header);
  }

  function conditionComparison(root, scenario, state, redraw) {
    const section = document.createElement("section");
    section.className = "lab-comparison";
    const button = document.createElement("button");
    button.type = "button"; button.textContent = "今の条件を比較の基準にする";
    const description = document.createElement("p");
    const drawings=document.createElement("details"), summary=document.createElement("summary");
    summary.textContent="基準と現在の図を並べる";
    const pair=document.createElement("div"); pair.className="lab-compare-pair";
    const previews=["基準の条件","現在の条件"].map(name=>{
      const figure=document.createElement("figure"), caption=document.createElement("figcaption"), canvas=document.createElement("canvas");
      canvas.setAttribute("aria-label",name+"の図"); caption.textContent=name;
      figure.append(caption,canvas); pair.append(figure); return canvas;
    });
    drawings.append(summary,pair);
    drawings.addEventListener("toggle",redraw);
    const rows = document.createElement("div");
    section.append(button, description, drawings, rows);
    root.querySelector(".lab-readouts").after(section);
    const initial={...state};
    const describe = saved => "棒の灰色は"+(saved?"記録した条件":"初期条件")+"、青色は現在の条件です。物理量ごとに同じ目盛りで比べます。"+(scenario.timeRelevant?"左右の図は同じ時刻を示します。":"");
    description.textContent=describe(false);
    let reference = { ...state }, lastSignature = "", active = false;
    root.querySelector("[data-action=reset]").addEventListener("click",()=>{
      reference={...initial}; lastSignature=""; active=false; rows.replaceChildren(); description.textContent=describe(false);
    });
    button.addEventListener("click", () => {
      reference = { ...state }; active = false; rows.replaceChildren(); lastSignature = "";
      description.textContent=describe(true); redraw();
    });
    return function update(result, time, width, height, draw) {
      const metrics=result.metrics;
      let referenceResult;
      if (drawings.open) {
        referenceResult=scenario.calc(reference,time);
        previews.forEach((canvas,index)=>{
          const pixels=Math.max(1,Math.round(canvas.clientWidth*(window.devicePixelRatio||1)));
          const targetH=Math.max(1,Math.round(pixels*height/width));
          if(canvas.width!==pixels || canvas.height!==targetH){canvas.width=pixels;canvas.height=targetH;}
          const ctx=canvas.getContext("2d"); ctx.save();ctx.setTransform(pixels/width,0,0,targetH/height,0,0);
          draw(ctx,width,height,index?state:reference,time,index?result:referenceResult); ctx.restore();
        });
      }
      const changed = Object.keys(reference).some(key => state[key] !== reference[key]);
      if (!changed) {
        if (active) rows.replaceChildren();
        active = false; lastSignature = ""; return;
      }
      active = true;
      const before = (referenceResult || scenario.calc(reference,time)).metrics;
      const entries = [];
      const scalar = /^([+−-]?(?:\d+(?:\.\d+)?|\.\d+)(?:e[+-]?\d+)?)\s*([^\d=,()]*)$/i;
      for (const item of metrics) {
        const previous = before.find(m => m.label === item.label);
        if (!previous || previous.value === item.value) continue;
        const old = String(previous.value).match(scalar), next = String(item.value).match(scalar);
        if (old && next && old[2] === next[2]) entries.push([item.label, previous.value, item.value, Number(old[1].replace("−","-")), Number(next[1].replace("−","-"))]);
      }
      const signature = JSON.stringify(entries);
      if (signature === lastSignature) return;
      lastSignature = signature; rows.replaceChildren();
      for (const [name, oldText, newText, old, current] of entries) {
        const row = document.createElement("div"); row.className = "lab-compare-row";
        const caption = document.createElement("span"); caption.textContent = name + "　" + oldText + " → " + newText;
        row.append(caption);
        const min = Math.min(0, old, current), max = Math.max(0, old, current);
        for (const [value,color] of [[old,"#8995a5"],[current,"#2364aa"]]) {
          const track = document.createElement("div"), bar = document.createElement("i");
          track.className = "lab-compare-track"; track.setAttribute("aria-hidden","true");
          const width = max - min || 1;
          bar.style.left = (Math.min(value,0)-min)/width*100+"%";
          bar.style.width = Math.abs(value)/width*100+"%"; bar.style.backgroundColor = color;
          track.append(bar); row.append(track);
        }
        rows.append(row);
      }
    };
  }

  window.PhysicsSimShell = { create: createShell, conditionComparison };
})();
