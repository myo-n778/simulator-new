(function () {
  "use strict";

  const TAU = Math.PI * 2;
  const G = 9.80665;
  const E_CHARGE = 1.602176634e-19;
  const PLANCK = 6.62607015e-34;
  const LIGHT = 299792458;
  const COULOMB = 8.9875517923e9;

  const range = (key, label, min, max, step, value, unit = "") => ({ type: "range", key, label, min, max, step, value, unit });
  const select = (key, label, value, options) => ({ type: "select", key, label, value, options });

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const rad = (degrees) => degrees * Math.PI / 180;
  const fmt = (value, digits = 3) => {
    if (!Number.isFinite(value)) return "—";
    const absolute = Math.abs(value);
    if ((absolute > 0 && absolute < 0.001) || absolute >= 100000) return value.toExponential(2);
    return value.toFixed(digits).replace(/\.0+$|(?<=\.[0-9]*?)0+$/g, "");
  };
  const metric = (label, value) => ({ label, value });

  function clearStage(ctx, width, height, tint = "#ffffff") {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = tint;
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "#edf1f6";
    ctx.lineWidth = 1;
    for (let x = 20; x < width; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 20; y < height; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }
  }

  function arrow(ctx, x1, y1, x2, y2, color = "#2364aa", width = 2) {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const size = 8 + width;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - size * Math.cos(angle - Math.PI / 6), y2 - size * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - size * Math.cos(angle + Math.PI / 6), y2 - size * Math.sin(angle + Math.PI / 6));
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function label(ctx, text, x, y, color = "#344054", size = 13, align = "left") {
    ctx.save();
    ctx.fillStyle = color;
    ctx.font = `600 ${size}px system-ui, sans-serif`;
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  function dot(ctx, x, y, radius, color, stroke = "#ffffff") {
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, radius, 0, TAU);
    ctx.fillStyle = color; ctx.fill();
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
    ctx.restore();
  }

  function plot(ctx, points, color = "#2364aa", width = 2) {
    if (!points.length) return;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    points.forEach((point, index) => index ? ctx.lineTo(point[0], point[1]) : ctx.moveTo(point[0], point[1]));
    ctx.stroke();
    ctx.restore();
  }

  function axes(ctx, left, top, width, height, xText = "x", yText = "y") {
    ctx.save();
    ctx.strokeStyle = "#98a2b3";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(left, top); ctx.lineTo(left, top + height); ctx.lineTo(left + width, top + height);
    ctx.stroke();
    label(ctx, xText, left + width, top + height + 18, "#667085", 11, "right");
    label(ctx, yText, left - 7, top - 8, "#667085", 11, "right");
    ctx.restore();
  }

  function electricFieldScenario() {
    return {
      title: "電場・電位",
      subtitle: "点電荷がつくる電場ベクトルと等電位の対応",
      lead: "2つの点電荷と観測点を動かし、電場はベクトル、電位はスカラーとして加わることを確かめます。",
      formula: "E = kq/r²\nV = kq/r\n重ね合わせ：E = ΣEᵢ,  V = ΣVᵢ",
      focus: "電場が0でも電位が0とは限らない位置を探します。",
      controls: [
        range("q1", "左の電荷 q₁", -5, 5, 0.5, 3, " μC"),
        range("q2", "右の電荷 q₂", -5, 5, 0.5, -3, " μC"),
        range("distance", "電荷間距離 d", 0.4, 2, 0.1, 1.2, " m"),
        range("probeX", "観測点 x", -1.2, 1.2, 0.05, 0, " m"),
        range("probeY", "観測点 y", -0.8, 0.8, 0.05, 0.45, " m")
      ],
      calc(s) {
        const charges = [{ q: s.q1 * 1e-6, x: -s.distance / 2 }, { q: s.q2 * 1e-6, x: s.distance / 2 }];
        let ex = 0, ey = 0, potential = 0;
        charges.forEach(({ q, x }) => {
          const dx = s.probeX - x, dy = s.probeY;
          const r = Math.max(0.04, Math.hypot(dx, dy));
          ex += COULOMB * q * dx / (r ** 3);
          ey += COULOMB * q * dy / (r ** 3);
          potential += COULOMB * q / r;
        });
        return { ex, ey, potential, magnitude: Math.hypot(ex, ey), metrics: [
          metric("電場の大きさ |E|", `${fmt(Math.hypot(ex, ey))} N/C`),
          metric("Eₓ", `${fmt(ex)} N/C`),
          metric("Eᵧ", `${fmt(ey)} N/C`),
          metric("電位 V", `${fmt(potential)} V`)
        ] };
      },
      draw(ctx, w, h, s, t, r) {
        clearStage(ctx, w, h, "#fbfdff");
        const cx = w / 2, cy = h / 2;
        const scale = Math.min(w / 3.1, h / 2.25);
        const chargeData = [{ q: s.q1, x: -s.distance / 2 }, { q: s.q2, x: s.distance / 2 }];
        for (let gx = -1.35; gx <= 1.35; gx += 0.23) {
          for (let gy = -0.85; gy <= 0.85; gy += 0.2) {
            let ex = 0, ey = 0;
            chargeData.forEach(ch => {
              const dx = gx - ch.x, dy = gy;
              const rr = Math.max(0.08, Math.hypot(dx, dy));
              ex += ch.q * dx / rr ** 3; ey += ch.q * dy / rr ** 3;
            });
            const mag = Math.hypot(ex, ey);
            if (mag > 0.02) {
              const length = 10;
              const px = cx + gx * scale, py = cy - gy * scale;
              arrow(ctx, px, py, px + ex / mag * length, py - ey / mag * length, "rgba(35,100,170,.48)", 1);
            }
          }
        }
        chargeData.forEach((ch, index) => {
          const x = cx + ch.x * scale;
          dot(ctx, x, cy, 18, ch.q >= 0 ? "#dc4c45" : "#2f6fbd");
          label(ctx, `${ch.q >= 0 ? "+" : "−"}${fmt(Math.abs(ch.q), 1)} μC`, x, cy + 32, "#344054", 12, "center");
          label(ctx, index ? "q₂" : "q₁", x, cy - 29, "#344054", 12, "center");
        });
        const px = cx + s.probeX * scale, py = cy - s.probeY * scale;
        dot(ctx, px, py, 7, "#111827");
        const visual = 52;
        if (r.magnitude > 0) arrow(ctx, px, py, px + r.ex / r.magnitude * visual, py - r.ey / r.magnitude * visual, "#7c3aed", 3);
        label(ctx, "観測点 P", px + 10, py - 12, "#111827", 12);
        label(ctx, "電場ベクトル E", 20, 24, "#7c3aed", 13);
      }
    };
  }

  function dcCircuitScenario() {
    return {
      title: "直流回路・キルヒホッフの法則",
      subtitle: "直列・並列回路の電流、電圧、電力",
      lead: "同じ電池と2つの抵抗を直列・並列につなぎ替え、電流保存と電圧降下を比較します。",
      formula: "直列：R = R₁ + R₂\n並列：1/R = 1/R₁ + 1/R₂\nI = V/R,  P = VI",
      focus: "分岐点では電流の和、閉回路では電圧変化の和が0になることを確認します。",
      controls: [
        select("mode", "接続", "series", [["series", "直列"], ["parallel", "並列"]]),
        range("voltage", "電池電圧 V", 1, 24, 0.5, 12, " V"),
        range("r1", "抵抗 R₁", 1, 50, 1, 10, " Ω"),
        range("r2", "抵抗 R₂", 1, 50, 1, 20, " Ω")
      ],
      calc(s) {
        const series = s.mode === "series";
        const req = series ? s.r1 + s.r2 : 1 / (1 / s.r1 + 1 / s.r2);
        const total = s.voltage / req;
        const i1 = series ? total : s.voltage / s.r1;
        const i2 = series ? total : s.voltage / s.r2;
        const v1 = i1 * s.r1, v2 = i2 * s.r2;
        return { req, total, i1, i2, v1, v2, metrics: [
          metric("合成抵抗", `${fmt(req)} Ω`), metric("電池電流", `${fmt(total)} A`),
          metric("R₁の電流", `${fmt(i1)} A`), metric("R₂の電流", `${fmt(i2)} A`),
          metric("R₁の電圧", `${fmt(v1)} V`), metric("全消費電力", `${fmt(s.voltage * total)} W`)
        ] };
      },
      draw(ctx, w, h, s, t, r) {
        clearStage(ctx, w, h);
        const left = 100, right = w - 100, top = 100, bottom = h - 110;
        ctx.strokeStyle = "#344054"; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(left, top); ctx.lineTo(right, top); ctx.stroke();
        if (s.mode === "series") {
          ctx.beginPath(); ctx.moveTo(right, top); ctx.lineTo(right, bottom); ctx.lineTo(left, bottom); ctx.lineTo(left, top); ctx.stroke();
          drawResistor(ctx, w * 0.43, top, "R₁", s.r1, true);
          drawResistor(ctx, w * 0.68, top, "R₂", s.r2, true);
          movingDots(ctx, [[left, top], [right, top], [right, bottom], [left, bottom], [left, top]], t, "#f59e0b");
        } else {
          const mid = (top + bottom) / 2;
          ctx.beginPath(); ctx.moveTo(right, top); ctx.lineTo(right, bottom); ctx.lineTo(left, bottom); ctx.lineTo(left, top); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(w * .34, top); ctx.lineTo(w * .34, mid); ctx.lineTo(w * .76, mid); ctx.lineTo(w * .76, top); ctx.stroke();
          drawResistor(ctx, w * .55, top, "R₁", s.r1, true);
          drawResistor(ctx, w * .55, mid, "R₂", s.r2, true);
          arrow(ctx, w * .43, top - 32, w * .64, top - 32, "#f59e0b", 2);
          arrow(ctx, w * .43, mid - 32, w * .64, mid - 32, "#7c3aed", 2);
        }
        drawBattery(ctx, left, (top + bottom) / 2, s.voltage);
        label(ctx, `I = ${fmt(r.total)} A`, right - 20, bottom + 38, "#2364aa", 14, "right");
        label(ctx, s.mode === "series" ? "電流はどこでも同じ" : "分岐前の電流 = 枝電流の和", w / 2, 42, "#344054", 15, "center");
      }
    };
  }

  function capacitorScenario() {
    return {
      title: "コンデンサーの接続と蓄積エネルギー",
      subtitle: "直列・並列の合成容量、電荷、電圧分配",
      lead: "2つのコンデンサーをつなぎ替え、同じになる量が電荷か電圧かを比較します。",
      formula: "並列：C = C₁ + C₂\n直列：1/C = 1/C₁ + 1/C₂\nQ = CV,  U = ½CV²",
      focus: "直列では各コンデンサーの電荷の大きさが等しくなることを確認します。",
      controls: [
        select("mode", "接続", "series", [["series", "直列"], ["parallel", "並列"]]),
        range("voltage", "電源電圧", 1, 24, 0.5, 12, " V"),
        range("c1", "電気容量 C₁", 1, 100, 1, 20, " μF"),
        range("c2", "電気容量 C₂", 1, 100, 1, 40, " μF")
      ],
      calc(s) {
        const series = s.mode === "series";
        const cEq = series ? s.c1 * s.c2 / (s.c1 + s.c2) : s.c1 + s.c2;
        const qTotal = cEq * s.voltage;
        const v1 = series ? qTotal / s.c1 : s.voltage;
        const v2 = series ? qTotal / s.c2 : s.voltage;
        const q1 = s.c1 * v1, q2 = s.c2 * v2;
        const energy = 0.5 * cEq * 1e-6 * s.voltage ** 2 * 1000;
        return { cEq, qTotal, v1, v2, q1, q2, energy, metrics: [
          metric("合成容量", `${fmt(cEq)} μF`), metric("電源からの電荷", `${fmt(qTotal)} μC`),
          metric("C₁の電圧", `${fmt(v1)} V`), metric("C₂の電圧", `${fmt(v2)} V`),
          metric("C₁の電荷", `${fmt(q1)} μC`), metric("全エネルギー", `${fmt(energy)} mJ`)
        ] };
      },
      draw(ctx, w, h, s, t, r) {
        clearStage(ctx, w, h, "#fbfdff");
        const y = h / 2;
        drawBattery(ctx, 95, y, s.voltage);
        ctx.strokeStyle = "#344054"; ctx.lineWidth = 3;
        if (s.mode === "series") {
          ctx.beginPath(); ctx.moveTo(95, y - 65); ctx.lineTo(w - 90, y - 65); ctx.lineTo(w - 90, y + 65); ctx.lineTo(95, y + 65); ctx.stroke();
          drawCapacitor(ctx, w * .42, y - 65, "C₁", r.v1, s.c1);
          drawCapacitor(ctx, w * .68, y - 65, "C₂", r.v2, s.c2);
        } else {
          ctx.beginPath(); ctx.moveTo(95, y - 105); ctx.lineTo(w - 90, y - 105); ctx.lineTo(w - 90, y + 105); ctx.lineTo(95, y + 105); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(w * .34, y - 105); ctx.lineTo(w * .34, y); ctx.lineTo(w * .75, y); ctx.lineTo(w * .75, y - 105); ctx.stroke();
          drawCapacitor(ctx, w * .54, y - 105, "C₁", r.v1, s.c1);
          drawCapacitor(ctx, w * .54, y, "C₂", r.v2, s.c2);
        }
        label(ctx, s.mode === "series" ? "同じ電荷 Q、電圧を分け合う" : "同じ電圧 V、電荷が加わる", w / 2, 42, "#344054", 15, "center");
      }
    };
  }

  function magneticScenario() {
    return {
      timeRelevant: true,
      title: "磁場とローレンツ力",
      subtitle: "荷電粒子の速度、磁場、円運動",
      lead: "速度と磁場のなす角を変え、ローレンツ力の向きと円運動の半径を確かめます。",
      formula: "F = qvB sinθ\nr = mv⊥/(|q|B)\nT = 2πm/(|q|B)",
      focus: "磁場は速さを変えず、速度の向きだけを変えることを確認します。",
      controls: [
        range("charge", "電荷 q", -5, 5, 0.5, 2, " μC"),
        range("mass", "質量 m", 0.5, 10, 0.5, 2, " g"),
        range("speed", "速さ v", 1, 30, 1, 12, " m/s"),
        range("field", "磁束密度 B", 0.05, 1, 0.05, 0.4, " T"),
        range("angle", "vとBの角度", 0, 90, 5, 90, "°")
      ],
      calc(s) {
        const q = s.charge * 1e-6, m = s.mass / 1000;
        const vPerp = s.speed * Math.sin(rad(s.angle));
        const force = q * s.speed * s.field * Math.sin(rad(s.angle));
        const radius = Math.abs(q) < 1e-12 ? Infinity : m * vPerp / (Math.abs(q) * s.field);
        const period = Math.abs(q) < 1e-12 ? Infinity : TAU * m / (Math.abs(q) * s.field);
        return { force, radius, period, vPerp, metrics: [
          metric("ローレンツ力", `${fmt(force)} N`), metric("垂直速度 v⊥", `${fmt(vPerp)} m/s`),
          metric("円運動半径", Number.isFinite(radius) ? `${fmt(radius)} m` : "直進"),
          metric("周期", Number.isFinite(period) ? `${fmt(period)} s` : "—"),
          metric("仕事率 F・v", "0 W")
        ] };
      },
      draw(ctx, w, h, s, t, r) {
        clearStage(ctx, w, h, "#f8fbff");
        for (let x = 35; x < w; x += 52) for (let y = 55; y < h; y += 52) {
          ctx.strokeStyle = "#7aa7d8"; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(x, y, 6, 0, TAU); ctx.stroke();
          dot(ctx, x, y, 1.5, "#7aa7d8", null);
        }
        const cx = w / 2, cy = h / 2;
        if (Math.abs(s.charge) < 1e-9 || r.vPerp < 1e-9) {
          const x = 55 + (t * 65 % Math.max(1, w - 110));
          dot(ctx, x, cy, 13, s.charge >= 0 ? "#dc4c45" : "#2f6fbd");
          arrow(ctx, x, cy, Math.min(w - 25, x + 72), cy, "#087f5b", 3);
          label(ctx, "v", Math.min(w - 18, x + 82), cy, "#087f5b", 14, "center");
          label(ctx, "F = 0：等速直線運動", w / 2, 38, "#344054", 16, "center");
          label(ctx, "・ は磁場が手前向き", 20, 25, "#667085", 12);
          return;
        }
        const radiusRatio = Math.sqrt(r.radius / 30000);
        const radius = Math.min(w, h) * .22 * clamp(radiusRatio, .55, 1.55);
        ctx.strokeStyle = "#98a2b3"; ctx.setLineDash([7, 6]); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, radius, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
        const direction = s.charge >= 0 ? 1 : -1;
        const phase = direction * t * 1.2;
        const x = cx + radius * Math.cos(phase), y = cy + radius * Math.sin(phase);
        dot(ctx, x, y, 13, s.charge >= 0 ? "#dc4c45" : "#2f6fbd");
        const tangent = phase + direction * Math.PI / 2;
        arrow(ctx, x, y, x + 65 * Math.cos(tangent), y + 65 * Math.sin(tangent), "#087f5b", 3);
        arrow(ctx, x, y, x + 52 * Math.cos(phase + Math.PI), y + 52 * Math.sin(phase + Math.PI), "#7c3aed", 3);
        label(ctx, "v", x + 72 * Math.cos(tangent), y + 72 * Math.sin(tangent), "#087f5b", 14, "center");
        label(ctx, "F", x + 61 * Math.cos(phase + Math.PI), y + 61 * Math.sin(phase + Math.PI), "#7c3aed", 14, "center");
        label(ctx, "・ は磁場が手前向き", 20, 25, "#667085", 12);
      }
    };
  }

  function inductionScenario() {
    return {
      timeRelevant: true,
      title: "電磁誘導と発電機",
      subtitle: "磁束の時間変化、誘導起電力、レンツの法則",
      lead: "回転コイルの磁束と誘導起電力を同じ時刻で追い、変化率が最大のとき起電力が最大になることを確認します。",
      formula: "Φ = NBA cos(ωt)\ne = −dΦ/dt = NBAω sin(ωt)",
      focus: "磁束そのものではなく、磁束の時間変化が起電力を生む点に注目します。",
      controls: [
        range("turns", "巻数 N", 10, 300, 10, 100, " 回"),
        range("area", "コイル面積 A", 20, 300, 10, 120, " cm²"),
        range("field", "磁束密度 B", 0.05, 1, 0.05, 0.4, " T"),
        range("frequency", "回転周波数 f", 0.1, 5, 0.1, 1, " Hz")
      ],
      calc(s, t) {
        const area = s.area * 1e-4, omega = TAU * s.frequency;
        const flux = s.turns * s.field * area * Math.cos(omega * t);
        const emf = s.turns * s.field * area * omega * Math.sin(omega * t);
        const max = s.turns * s.field * area * omega;
        return { flux, emf, max, omega, metrics: [
          metric("鎖交磁束 NΦ", `${fmt(flux)} Wb`), metric("誘導起電力 e", `${fmt(emf)} V`),
          metric("最大起電力", `${fmt(max)} V`), metric("角速度 ω", `${fmt(omega)} rad/s`)
        ] };
      },
      draw(ctx, w, h, s, t, r) {
        clearStage(ctx, w, h);
        const split = w * .48;
        ctx.fillStyle = "#e7f0fb"; ctx.fillRect(30, 70, split - 50, h - 130);
        label(ctx, "N", 58, 94, "#2f6fbd", 24, "center");
        label(ctx, "S", split - 58, 94, "#dc4c45", 24, "center");
        const cx = split / 2, cy = h / 2;
        const angle = r.omega * t;
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(angle);
        ctx.strokeStyle = "#b45309"; ctx.lineWidth = 7; ctx.strokeRect(-90, -42, 180, 84);
        ctx.restore();
        arrow(ctx, 85, cy, split - 85, cy, "#2364aa", 3);
        label(ctx, "B", split / 2, cy - 25, "#2364aa", 16, "center");
        const left = split + 50, top = 80, pw = w - left - 35, ph = h - 150;
        axes(ctx, left, top, pw, ph, "t", "e");
        const pts = [];
        for (let i = 0; i <= 160; i++) {
          const phase = i / 160 * TAU * 2;
          pts.push([left + i / 160 * pw, top + ph / 2 - Math.sin(phase) * ph * .38]);
        }
        plot(ctx, pts, "#7c3aed", 3);
        const markerX = left + ((s.frequency * t) % 2) / 2 * pw;
        ctx.strokeStyle = "#dc4c45"; ctx.beginPath(); ctx.moveTo(markerX, top); ctx.lineTo(markerX, top + ph); ctx.stroke();
        label(ctx, "回転コイル", cx, h - 40, "#344054", 14, "center");
      }
    };
  }

  function acScenario() {
    return {
      title: "交流回路と共振",
      subtitle: "RLC直列回路のリアクタンス、位相、電流",
      lead: "周波数を変えてコイルとコンデンサーのリアクタンスを比較し、共振で電流が最大になることを調べます。",
      formula: "Xᴸ = ωL,  Xᶜ = 1/(ωC)\nZ = √(R² + (Xᴸ−Xᶜ)²)\nI = V/Z",
      focus: "Xᴸ = Xᶜ の共振条件では、回路全体が抵抗だけのように振る舞います。",
      controls: [
        range("voltage", "実効電圧 V", 1, 120, 1, 24, " V"),
        range("resistance", "抵抗 R", 1, 100, 1, 20, " Ω"),
        range("inductance", "自己インダクタンス L", 10, 500, 10, 100, " mH"),
        range("capacitance", "電気容量 C", 1, 200, 1, 50, " μF"),
        range("frequency", "周波数 f", 5, 200, 1, 50, " Hz")
      ],
      calc(s) {
        const omega = TAU * s.frequency, L = s.inductance / 1000, C = s.capacitance * 1e-6;
        const xl = omega * L, xc = 1 / (omega * C);
        const z = Math.hypot(s.resistance, xl - xc);
        const current = s.voltage / z;
        const phase = Math.atan2(xl - xc, s.resistance);
        const resonance = 1 / (TAU * Math.sqrt(L * C));
        return { xl, xc, z, current, phase, resonance, metrics: [
          metric("コイル Xᴸ", `${fmt(xl)} Ω`), metric("コンデンサー Xᶜ", `${fmt(xc)} Ω`),
          metric("インピーダンス Z", `${fmt(z)} Ω`), metric("実効電流 I", `${fmt(current)} A`),
          metric("位相差", `${fmt(phase * 180 / Math.PI, 1)}°`), metric("共振周波数", `${fmt(resonance)} Hz`)
        ] };
      },
      draw(ctx, w, h, s, t, r) {
        clearStage(ctx, w, h, "#fbfdff");
        const cx = w * .28, cy = h * .5, scale = Math.min(120, w * .17);
        arrow(ctx, cx, cy, cx + scale, cy, "#344054", 3);
        arrow(ctx, cx, cy, cx, cy - scale * r.xl / Math.max(r.xl, r.xc, 1), "#dc4c45", 3);
        arrow(ctx, cx, cy, cx, cy + scale * r.xc / Math.max(r.xl, r.xc, 1), "#2f6fbd", 3);
        arrow(ctx, cx, cy, cx + scale * Math.cos(r.phase), cy - scale * Math.sin(r.phase), "#7c3aed", 4);
        label(ctx, "R", cx + scale + 15, cy, "#344054", 14);
        label(ctx, "Xᴸ", cx, cy - scale - 15, "#dc4c45", 14, "center");
        label(ctx, "Xᶜ", cx, cy + scale + 15, "#2f6fbd", 14, "center");
        label(ctx, "Z", cx + scale * Math.cos(r.phase) + 12, cy - scale * Math.sin(r.phase), "#7c3aed", 14);
        const left = w * .53, top = 80, pw = w * .42, ph = h - 150;
        axes(ctx, left, top, pw, ph, "t", "V, I");
        const vPts = [], iPts = [];
        for (let i = 0; i <= 180; i++) {
          const phase = i / 180 * TAU * 2;
          vPts.push([left + i / 180 * pw, top + ph / 2 - Math.sin(phase) * ph * .32]);
          iPts.push([left + i / 180 * pw, top + ph / 2 - Math.sin(phase - r.phase) * ph * .28]);
        }
        plot(ctx, vPts, "#dc4c45", 2.5); plot(ctx, iPts, "#2364aa", 2.5);
        label(ctx, "電圧", left + 15, top + 16, "#dc4c45", 12); label(ctx, "電流", left + 65, top + 16, "#2364aa", 12);
      }
    };
  }

  function photoelectricScenario() {
    return {
      title: "光電効果",
      subtitle: "振動数、仕事関数、最大運動エネルギー",
      lead: "光の振動数と強さを独立に変え、電子1個の最大運動エネルギーを決めるのは振動数であることを確認します。",
      formula: "hf = W + Kmax\nKmax = eVₛ\nf₀ = W/h",
      focus: "光を強くしても、限界振動数を下回ると電子は飛び出しません。",
      controls: [
        range("frequency", "光の振動数 f", 3, 12, 0.1, 7, " ×10¹⁴ Hz"),
        range("intensity", "光の強さ", 10, 100, 5, 60, "%"),
        range("work", "仕事関数 W", 1.5, 5, 0.1, 2.3, " eV")
      ],
      calc(s) {
        const photonEV = PLANCK * s.frequency * 1e14 / E_CHARGE;
        const kinetic = Math.max(0, photonEV - s.work);
        const threshold = s.work * E_CHARGE / PLANCK / 1e14;
        const wavelength = LIGHT / (s.frequency * 1e14) * 1e9;
        return { photonEV, kinetic, threshold, wavelength, emitted: kinetic > 0, metrics: [
          metric("光子エネルギー hf", `${fmt(photonEV)} eV`), metric("最大運動エネルギー", `${fmt(kinetic)} eV`),
          metric("停止電圧", `${fmt(kinetic)} V`), metric("限界振動数", `${fmt(threshold)} ×10¹⁴ Hz`),
          metric("波長", `${fmt(wavelength)} nm`), metric("電子放出", kinetic > 0 ? "あり" : "なし")
        ] };
      },
      draw(ctx, w, h, s, t, r) {
        clearStage(ctx, w, h, "#fbfdff");
        const plateX = w * .48;
        ctx.fillStyle = "#7b8794"; ctx.fillRect(plateX, 80, 28, h - 160);
        label(ctx, "金属", plateX + 14, h - 55, "#344054", 13, "center");
        for (let i = 0; i < 9; i++) {
          const y = 105 + i * (h - 210) / 8;
          arrow(ctx, 65, y - 24 * Math.sin(t * 2 + i), plateX - 12, y, wavelengthColor(r.wavelength), 2);
        }
        if (r.emitted) {
          const count = Math.round(s.intensity / 15);
          for (let i = 0; i < count; i++) {
            const phase = (t * (.25 + r.kinetic * .1) + i / count) % 1;
            const x = plateX + 28 + phase * (w - plateX - 80);
            const y = 115 + (i % 6) * (h - 230) / 5 + Math.sin(phase * TAU + i) * 18;
            dot(ctx, x, y, 5, "#2f6fbd");
          }
        }
        const gx = 55, gy = h - 100, gw = w * .33, gh = 180;
        axes(ctx, gx, gy - gh, gw, gh, "f", "Kmax");
        const x0 = gx + clamp((r.threshold - 3) / 9, 0, 1) * gw;
        ctx.strokeStyle = "#7c3aed"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(x0, gy); ctx.lineTo(gx + gw, gy - gh * .82); ctx.stroke();
        const px = gx + clamp((s.frequency - 3) / 9, 0, 1) * gw;
        const py = gy - clamp(r.kinetic / 3, 0, 1) * gh * .75;
        dot(ctx, px, py, 7, "#dc4c45");
        label(ctx, r.emitted ? "電子が放出される" : "限界振動数未満", w * .72, 50, r.emitted ? "#087f5b" : "#c2413b", 16, "center");
      }
    };
  }

  function atomicSpectrumScenario() {
    return {
      title: "ボーア模型と水素原子スペクトル",
      subtitle: "エネルギー準位の遷移と光の波長",
      lead: "電子の遷移する準位を選び、準位差が放出光のエネルギーと波長を決めることを確かめます。",
      formula: "Eₙ = −13.6/n² eV\nΔE = hf = hc/λ",
      focus: "連続的な任意の色ではなく、決まった線スペクトルだけが現れます。",
      controls: [
        select("upper", "遷移前 n", "4", [["2", "n=2"], ["3", "n=3"], ["4", "n=4"], ["5", "n=5"], ["6", "n=6"]]),
        select("lower", "遷移後 n", "2", [["1", "n=1"], ["2", "n=2"], ["3", "n=3"], ["4", "n=4"], ["5", "n=5"]])
      ],
      calc(s) {
        const upper = Number(s.upper), lower = Number(s.lower);
        const valid = upper > lower;
        const delta = valid ? 13.6 * (1 / lower ** 2 - 1 / upper ** 2) : 0;
        const wavelength = valid ? PLANCK * LIGHT / (delta * E_CHARGE) * 1e9 : Infinity;
        const series = lower === 1 ? "ライマン系列" : lower === 2 ? "バルマー系列" : lower === 3 ? "パッシェン系列" : "赤外系列";
        return { upper, lower, valid, delta, wavelength, series, metrics: [
          metric("準位差 ΔE", valid ? `${fmt(delta)} eV` : "遷移不可"),
          metric("光の波長 λ", valid ? `${fmt(wavelength)} nm` : "—"),
          metric("系列", valid ? series : "n前 > n後を選択"),
          metric("観測域", !valid ? "—" : wavelength < 380 ? "紫外線" : wavelength <= 780 ? "可視光" : "赤外線")
        ] };
      },
      draw(ctx, w, h, s, t, r) {
        clearStage(ctx, w, h, "#fbfdff");
        const left = 70, right = w * .56, top = 65, bottom = h - 65;
        for (let n = 1; n <= 6; n++) {
          const energy = -13.6 / n ** 2;
          const y = bottom - ((energy + 13.6) / 13.6) * (bottom - top);
          ctx.strokeStyle = n === r.upper || n === r.lower ? "#344054" : "#b8c2cf";
          ctx.lineWidth = n === r.upper || n === r.lower ? 3 : 1.5;
          ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(right, y); ctx.stroke();
          label(ctx, `n=${n}  ${fmt(energy)} eV`, left + 5, y - 11, "#667085", 11);
        }
        if (r.valid) {
          const yU = bottom - ((-13.6 / r.upper ** 2 + 13.6) / 13.6) * (bottom - top);
          const yL = bottom - ((-13.6 / r.lower ** 2 + 13.6) / 13.6) * (bottom - top);
          arrow(ctx, right - 35, yU, right - 35, yL + 4, "#7c3aed", 4);
        }
        const specLeft = w * .64, specRight = w - 45, specY = h * .54;
        const gradient = ctx.createLinearGradient(specLeft, 0, specRight, 0);
        gradient.addColorStop(0, "#5b21b6"); gradient.addColorStop(.2, "#2563eb"); gradient.addColorStop(.42, "#10b981"); gradient.addColorStop(.68, "#facc15"); gradient.addColorStop(.82, "#f97316"); gradient.addColorStop(1, "#dc2626");
        ctx.fillStyle = "#111827"; ctx.fillRect(specLeft, specY - 42, specRight - specLeft, 84);
        if (r.valid && r.wavelength >= 380 && r.wavelength <= 780) {
          const x = specLeft + (r.wavelength - 380) / 400 * (specRight - specLeft);
          ctx.strokeStyle = wavelengthColor(r.wavelength); ctx.lineWidth = 6;
          ctx.beginPath(); ctx.moveTo(x, specY - 36); ctx.lineTo(x, specY + 36); ctx.stroke();
        }
        ctx.fillStyle = gradient; ctx.fillRect(specLeft, specY + 60, specRight - specLeft, 12);
        label(ctx, r.valid ? `${fmt(r.wavelength)} nm` : "遷移条件を確認", (specLeft + specRight) / 2, specY - 65, "#344054", 15, "center");
      }
    };
  }

  function radioactiveScenario() {
    return {
      timeRelevant: true,
      title: "放射性崩壊と半減期",
      subtitle: "指数関数的減少、残存核数、放射能",
      lead: "初期核数、半減期、経過時間を変え、確率的崩壊の集団平均が指数関数になることを確認します。",
      formula: "N = N₀(1/2)^(t/T₁/₂)\nA = λN,  λ = ln2/T₁/₂",
      focus: "半減期が何回経過したかで、残る割合を読めるようにします。",
      controls: [
        range("initial", "初期核数 N₀", 50, 1000, 50, 400, " 個"),
        range("halfLife", "半減期 T₁/₂", 1, 30, 1, 8, " s"),
        range("elapsed", "経過時間 t", 0, 100, 1, 24, " s")
      ],
      calc(s, t) {
        const shownTime = s.elapsed + (t % Math.max(s.halfLife * 4, 1));
        const lambda = Math.log(2) / s.halfLife;
        const remaining = s.initial * Math.exp(-lambda * shownTime);
        const activity = lambda * remaining;
        return { shownTime, remaining, activity, lambda, metrics: [
          metric("表示時刻", `${fmt(shownTime)} s`), metric("残存核数", `${fmt(remaining, 1)} 個`),
          metric("残存割合", `${fmt(remaining / s.initial * 100, 1)} %`),
          metric("放射能 A", `${fmt(activity)} Bq`), metric("崩壊定数 λ", `${fmt(lambda)} s⁻¹`)
        ] };
      },
      draw(ctx, w, h, s, t, r) {
        clearStage(ctx, w, h);
        const left = 55, top = 55, pw = w * .58, ph = h - 120;
        axes(ctx, left, top, pw, ph, "t", "N/N₀");
        const maxT = s.halfLife * 5;
        const pts = [];
        for (let i = 0; i <= 160; i++) {
          const tt = i / 160 * maxT;
          pts.push([left + i / 160 * pw, top + ph - Math.pow(.5, tt / s.halfLife) * ph]);
        }
        plot(ctx, pts, "#2364aa", 3);
        const mx = left + clamp(r.shownTime / maxT, 0, 1) * pw;
        const my = top + ph - clamp(r.remaining / s.initial, 0, 1) * ph;
        dot(ctx, mx, my, 7, "#dc4c45");
        const gridX = w * .69, gridY = 80, cols = 10, rows = 10;
        const visible = Math.round(clamp(r.remaining / s.initial, 0, 1) * cols * rows);
        for (let i = 0; i < cols * rows; i++) {
          const x = gridX + (i % cols) * 22, y = gridY + Math.floor(i / cols) * 22;
          dot(ctx, x, y, 6, i < visible ? "#7c3aed" : "#d0d5dd", null);
        }
        label(ctx, "100個を代表表示", gridX + 100, gridY + 235, "#667085", 12, "center");
      }
    };
  }

  function nuclearScenario() {
    const reactions = {
      fusion: { name: "D + T → ⁴He + n", q: 17.6, left: ["²H", "³H"], right: ["⁴He", "n"] },
      fission: { name: "²³⁵U + n → 核分裂生成物", q: 200, left: ["²³⁵U", "n"], right: ["¹⁴¹Ba", "⁹²Kr", "3n"] },
      alpha: { name: "²³⁸U → ²³⁴Th + ⁴He", q: 4.27, left: ["²³⁸U"], right: ["²³⁴Th", "⁴He"] }
    };
    return {
      title: "核反応と結合エネルギー",
      subtitle: "質量欠損、放出エネルギー、核分裂・核融合",
      lead: "代表的な核反応を切り替え、わずかな質量差が大きなエネルギーへ変わることを比較します。",
      formula: "Q = Δmc²\n1 u c² = 931.5 MeV",
      focus: "反応前後で電荷数と質量数が保存されることを図で確認します。",
      controls: [
        select("reaction", "核反応", "fusion", [["fusion", "D-T核融合"], ["fission", "ウラン235核分裂"], ["alpha", "α崩壊"]]),
        range("events", "反応回数", 1, 100, 1, 10, " 回")
      ],
      calc(s) {
        const reaction = reactions[s.reaction];
        const total = reaction.q * s.events;
        const joule = total * 1e6 * E_CHARGE;
        const massDefect = reaction.q / 931.5;
        return { reaction, total, joule, massDefect, metrics: [
          metric("1反応のQ値", `${fmt(reaction.q)} MeV`), metric("質量欠損", `${fmt(massDefect)} u`),
          metric("合計エネルギー", `${fmt(total)} MeV`), metric("ジュール換算", `${fmt(joule)} J`)
        ] };
      },
      draw(ctx, w, h, s, t, r) {
        clearStage(ctx, w, h, "#fbfdff");
        label(ctx, r.reaction.name, w / 2, 48, "#17202a", 18, "center");
        const y = h * .48;
        r.reaction.left.forEach((name, index) => drawNucleus(ctx, w * .18 + index * 90, y, name, "#2f6fbd"));
        arrow(ctx, w * .39, y, w * .58, y, "#7c3aed", 5);
        r.reaction.right.forEach((name, index) => drawNucleus(ctx, w * .68 + index * 78, y + (index % 2 ? 52 : -18), name, "#dc4c45"));
        const rays = 14;
        for (let i = 0; i < rays; i++) {
          const a = i / rays * TAU + t * .2;
          arrow(ctx, w * .49, y, w * .49 + Math.cos(a) * 80, y + Math.sin(a) * 80, "rgba(245,158,11,.55)", 1);
        }
        label(ctx, `放出エネルギー ${fmt(r.reaction.q)} MeV`, w / 2, h - 48, "#b45309", 16, "center");
      }
    };
  }

  function calorimetryScenario() {
    return {
      title: "熱量保存・比熱・相変化",
      subtitle: "混合後の温度、氷の融解、潜熱",
      lead: "温水と冷水の混合、または温水と氷の熱交換を切り替え、熱量保存から最終状態を求めます。",
      formula: "Q = mcΔT\n融解熱：Q = mL\n外部との熱交換なし：ΣQ = 0",
      focus: "相変化中は熱を受け取っても温度が0℃に保たれる場合があります。",
      controls: [
        select("mode", "実験", "mix", [["mix", "温水と冷水"], ["ice", "温水と氷"]]),
        range("m1", "温水の質量", 50, 500, 10, 200, " g"),
        range("t1", "温水の温度", 10, 90, 1, 60, " ℃"),
        range("m2", "冷水／氷の質量", 20, 300, 10, 100, " g"),
        range("waterT", "冷水の初期温度", 0, 30, 1, 10, " ℃"),
        range("iceT", "氷の初期温度", -20, 0, 1, -10, " ℃")
      ],
      calc(s) {
        const cw = 4.18, ci = 2.1, latent = 334;
        let finalT = 0, melted = 0, frozenWater = 0, stateText = "液体の水", qTransfer = 0;
        if (s.mode === "mix") {
          finalT = (s.m1 * cw * s.t1 + s.m2 * cw * s.waterT) / ((s.m1 + s.m2) * cw);
          qTransfer = Math.abs(s.m1 * cw * (s.t1 - finalT));
        } else {
          const iceT = s.iceT;
          const available = s.m1 * cw * s.t1;
          const warmIce = s.m2 * ci * (0 - iceT);
          const balanceAtZero = available - warmIce;
          if (balanceAtZero < 0) {
            const freezingNeeded = -balanceAtZero;
            if (freezingNeeded <= s.m1 * latent) {
              frozenWater = freezingNeeded / latent;
              finalT = 0;
              stateText = `水が${fmt(frozenWater)} g凍結`;
            } else {
              frozenWater = s.m1;
              finalT = (balanceAtZero + s.m1 * latent) / ((s.m1 + s.m2) * ci);
              stateText = "すべて氷";
            }
          } else if (balanceAtZero < s.m2 * latent) {
            finalT = 0;
            melted = balanceAtZero / latent;
            stateText = "氷と水が共存";
          } else {
            melted = s.m2;
            finalT = (balanceAtZero - s.m2 * latent) / ((s.m1 + s.m2) * cw);
            stateText = "氷はすべて融解";
          }
          qTransfer = finalT < 0
            ? s.m1 * cw * s.t1 + s.m1 * latent + s.m1 * ci * (0 - finalT)
            : s.m1 * cw * (s.t1 - finalT) + frozenWater * latent;
        }
        return { finalT, melted: Math.max(0, melted), frozenWater, stateText, qTransfer: qTransfer / 1000, metrics: [
          metric("最終温度", `${fmt(finalT)} ℃`), metric("移動した熱量", `${fmt(qTransfer / 1000)} kJ`),
          metric("融けた氷", s.mode === "ice" ? `${fmt(Math.max(0, melted))} g` : "—"),
          metric("最終状態", stateText)
        ] };
      },
      draw(ctx, w, h, s, t, r) {
        clearStage(ctx, w, h);
        drawBeaker(ctx, w * .18, h * .56, 150, 210, "#ef8f6b", s.t1, "温水");
        drawBeaker(ctx, w * .49, h * .56, 150, 210, s.mode === "ice" ? "#b9d9f5" : "#6bb6e8", s.mode === "ice" ? s.iceT : s.waterT, s.mode === "ice" ? "氷" : "冷水");
        arrow(ctx, w * .66, h * .48, w * .76, h * .48, "#7c3aed", 4);
        drawBeaker(ctx, w * .77, h * .56, 160, 230, r.finalT > 20 ? "#e7a27f" : "#83bfe8", r.finalT, "混合後");
        label(ctx, `T = ${fmt(r.finalT)} ℃`, w * .85, h * .22, "#17202a", 17, "center");
      }
    };
  }

  function heatEngineScenario() {
    return {
      title: "熱機関とカルノー効率",
      subtitle: "吸熱、仕事、放熱、熱効率",
      lead: "高温熱源と低温熱源の温度を変え、どんな熱機関にも越えられないカルノー効率を確認します。",
      formula: "η = W/QH\nカルノー効率：ηmax = 1 − TC/TH\nQH = W + QC",
      focus: "受け取った熱をすべて仕事へ変換できない理由をエネルギー流で捉えます。",
      controls: [
        range("hot", "高温熱源 TH", 350, 1000, 10, 700, " K"),
        range("cold", "低温熱源 TC", 200, 340, 10, 300, " K"),
        range("heat", "吸収熱 QH", 100, 2000, 50, 1000, " J"),
        range("fraction", "カルノー効率に対する達成率", 20, 100, 5, 70, "%")
      ],
      calc(s) {
        const etaMax = Math.max(0, 1 - s.cold / s.hot);
        const eta = etaMax * s.fraction / 100;
        const work = s.heat * eta, rejected = s.heat - work;
        return { etaMax, eta, work, rejected, metrics: [
          metric("カルノー効率", `${fmt(etaMax * 100, 1)} %`), metric("実際の効率", `${fmt(eta * 100, 1)} %`),
          metric("仕事 W", `${fmt(work)} J`), metric("放出熱 QC", `${fmt(rejected)} J`),
          metric("エネルギー収支", `${fmt(s.heat)} = ${fmt(work)} + ${fmt(rejected)} J`)
        ] };
      },
      draw(ctx, w, h, s, t, r) {
        clearStage(ctx, w, h, "#fbfdff");
        const cx = w * .35;
        drawReservoir(ctx, cx, 80, 250, 70, "高温熱源", `${s.hot} K`, "#dc4c45");
        drawReservoir(ctx, cx, h - 110, 250, 70, "低温熱源", `${s.cold} K`, "#2f6fbd");
        ctx.fillStyle = "#7c3aed"; ctx.fillRect(cx - 85, h / 2 - 48, 170, 96);
        label(ctx, "熱機関", cx, h / 2, "#ffffff", 20, "center");
        arrow(ctx, cx, 150, cx, h / 2 - 55, "#dc4c45", 6);
        arrow(ctx, cx, h / 2 + 55, cx, h - 118, "#2f6fbd", 6);
        arrow(ctx, cx + 95, h / 2, w * .73, h / 2, "#087f5b", 7);
        label(ctx, `QH ${fmt(s.heat)} J`, cx + 18, 190, "#dc4c45", 13);
        label(ctx, `QC ${fmt(r.rejected)} J`, cx + 18, h - 180, "#2f6fbd", 13);
        label(ctx, `仕事 W ${fmt(r.work)} J`, w * .76, h / 2 - 25, "#087f5b", 16, "center");
        const gx = w * .68, gy = 120, gw = w * .24, gh = h - 240;
        axes(ctx, gx, gy, gw, gh, "V", "P");
        const cycle = [[.15,.75],[.72,.72],[.82,.28],[.3,.2],[.15,.75]].map(([x,y]) => [gx+x*gw, gy+y*gh]);
        plot(ctx, cycle, "#b45309", 4);
        label(ctx, "概念的なp–Vサイクル", gx + gw / 2, gy + gh + 30, "#667085", 12, "center");
      }
    };
  }

  function standingWaveScenario() {
    return {
      timeRelevant: true,
      title: "弦の定常波",
      subtitle: "両端固定弦の固有振動、節、腹",
      lead: "弦長、張力、線密度、振動モードを変え、固有振動数と節・腹の位置を確認します。",
      formula: "v = √(T/μ)\nfₙ = nv/(2L)\ny = A sin(nπx/L) cos(2πfₙt)",
      focus: "弦長の中に半波長が整数個入るときだけ定常波が成立します。",
      controls: [
        range("length", "弦長 L", 0.5, 3, 0.1, 1.5, " m"),
        range("tension", "張力 T", 10, 200, 5, 80, " N"),
        range("density", "線密度 μ", 1, 20, 1, 5, " g/m"),
        range("mode", "振動モード n", 1, 6, 1, 3, "")
      ],
      calc(s) {
        const speed = Math.sqrt(s.tension / (s.density / 1000));
        const frequency = s.mode * speed / (2 * s.length);
        const wavelength = 2 * s.length / s.mode;
        return { speed, frequency, wavelength, metrics: [
          metric("波の速さ", `${fmt(speed)} m/s`), metric("固有振動数", `${fmt(frequency)} Hz`),
          metric("波長", `${fmt(wavelength)} m`), metric("節の数", `${s.mode + 1}`), metric("腹の数", `${s.mode}`)
        ] };
      },
      draw(ctx, w, h, s, t, r) {
        clearStage(ctx, w, h);
        const left = 65, right = w - 65, cy = h / 2;
        ctx.strokeStyle = "#98a2b3"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(left, cy); ctx.lineTo(right, cy); ctx.stroke();
        const pts = [];
        for (let i = 0; i <= 260; i++) {
          const x = i / 260;
          const y = Math.sin(s.mode * Math.PI * x) * Math.cos(TAU * r.frequency * t * .08) * h * .27;
          pts.push([left + x * (right - left), cy - y]);
        }
        plot(ctx, pts, "#2364aa", 4);
        for (let n = 0; n <= s.mode; n++) {
          const x = left + n / s.mode * (right - left);
          dot(ctx, x, cy, 6, "#dc4c45");
          label(ctx, "節", x, cy + 24, "#c2413b", 11, "center");
        }
        ctx.fillStyle = "#344054"; ctx.fillRect(left - 10, cy - 42, 10, 84); ctx.fillRect(right, cy - 42, 10, 84);
        label(ctx, `n = ${s.mode}`, w / 2, 48, "#17202a", 18, "center");
      }
    };
  }

  function dopplerScenario() {
    return {
      timeRelevant: true,
      title: "ドップラー効果",
      subtitle: "動く音源・動く観測者・波面の受信",
      lead: "音源が出した波面が広がり、動く観測者に届くまでを追います。波面の間隔と受信の回数から、聞こえる高さの変化を読み取ります。",
      formula: "接近：f′ = f(v+vO)/(v−vS)\n遠ざかる：f′ = f(v−vO)/(v+vS)",
      focus: "音源の移動方向では波面が詰まり、反対側では広がります。緑の受信パルスが観測者に重なる回数が、観測振動数に対応します。",
      controls: [
        select("motion", "相対運動", "approach", [["approach", "互いに接近"], ["recede", "互いに遠ざかる"]]),
        range("frequency", "音源振動数", 200, 1000, 10, 440, " Hz"),
        range("sound", "音速", 300, 360, 1, 340, " m/s"),
        range("sourceSpeed", "音源の速さ", 0, 80, 2, 30, " m/s"),
        range("observerSpeed", "観測者の速さ", 0, 50, 2, 10, " m/s")
      ],
      calc(s) {
        const approach = s.motion === "approach";
        const observed = approach
          ? s.frequency * (s.sound + s.observerSpeed) / (s.sound - s.sourceSpeed)
          : s.frequency * (s.sound - s.observerSpeed) / (s.sound + s.sourceSpeed);
        const frontWave = (s.sound - s.sourceSpeed) / s.frequency;
        const backWave = (s.sound + s.sourceSpeed) / s.frequency;
        return { observed, frontWave, backWave, metrics: [
          metric("観測振動数", `${fmt(observed)} Hz`), metric("変化率", `${fmt((observed / s.frequency - 1) * 100, 1)} %`),
          metric("前方波長", `${fmt(frontWave)} m`), metric("後方波長", `${fmt(backWave)} m`)
        ] };
      },
      draw(ctx, w, h, s, t, r) {
        clearStage(ctx, w, h, "#fbfdff");
        const cy = h * .56, left = 34, right = w - 34, pixelsPerMeter = Math.min(27, (right - left) / 19);
        const toX = meters => left + meters * pixelsPerMeter;
        const approaching = s.motion === "approach";
        // 描画は実時間をスローモーション化する。速度・波長・受信の比は物理量のまま保持する。
        const sceneScale = .045;
        const sourceStart = approaching ? 5.2 : 12.8;
        const observerStart = approaching ? 14.8 : 6.2;
        const sourceDirection = 1;
        const observerDirection = -1;
        const available = approaching
          ? (observerStart - sourceStart) / Math.max(1, s.sourceSpeed + s.observerSpeed) * .82
          : Math.min((18.3 - sourceStart) / Math.max(1, s.sourceSpeed), observerStart / Math.max(1, s.observerSpeed)) * .82;
        const cycle = clamp(available, .06, .28);
        const sceneT = (t * sceneScale) % cycle;
        const sourceMeter = sourceStart + sourceDirection * s.sourceSpeed * sceneT;
        const observerMeter = observerStart + observerDirection * s.observerSpeed * sceneT;
        const sourceX = toX(sourceMeter), observerX = toX(observerMeter);
        const sourceAt = emitted => sourceStart + sourceDirection * s.sourceSpeed * emitted;
        // 実音は毎秒数百波面で、すべて描けば間隔を読めない。
        // 同位相の3周期ごとの波面だけを示すことで、前後の間隔比は保ったまま読み取れる大きさにする。
        const displayedCycles = 3;
        const representativePeriod = displayedCycles / s.frequency;
        const oldestEmission = Math.max(0, sceneT - Math.min(.09, cycle));
        const firstWave = Math.ceil(oldestEmission / representativePeriod);
        let closestArrival = Infinity;

        ctx.strokeStyle = "#98a2b3"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(left, cy); ctx.lineTo(right, cy); ctx.stroke();
        label(ctx, "音の進行の横断面（波面の位置）", left, 28, "#667085", 12, "left");
        label(ctx, `青線は${displayedCycles}周期ごとの代表波面（間の${displayedCycles - 1}波は省略）`, right, 28, "#667085", 12, "right");

        // 各青線は、同位相の代表波面が中央の横断面を通る位置。
        // 発音時点の音源位置を使うため、進行方向では3λ前、反対側では3λ後の間隔になる。
        for (let wave = firstWave; wave <= Math.floor(sceneT / representativePeriod); wave++) {
          const emitted = wave * representativePeriod;
          const age = sceneT - emitted;
          const radius = s.sound * age * pixelsPerMeter;
          if (radius < 2) continue;
          const originX = toX(sourceAt(emitted));
          const forwardX = originX + radius, backwardX = originX - radius;
          ctx.strokeStyle = "rgba(35,100,170,.72)"; ctx.lineWidth = 2.4;
          if (forwardX >= left && forwardX <= right) {
            ctx.beginPath(); ctx.moveTo(forwardX, cy - 58); ctx.lineTo(forwardX, cy + 58); ctx.stroke();
          }
          if (backwardX >= left && backwardX <= right) {
            ctx.beginPath(); ctx.moveTo(backwardX, cy - 58); ctx.lineTo(backwardX, cy + 58); ctx.stroke();
          }
          const separation = Math.abs(observerMeter - sourceAt(emitted));
          closestArrival = Math.min(closestArrival, Math.abs(separation - s.sound * age));
        }

        const towardObserver = observerMeter > sourceMeter ? 1 : -1;
        const frontLambda = r.frontWave * displayedCycles * pixelsPerMeter;
        const backLambda = r.backWave * displayedCycles * pixelsPerMeter;
        const frontY = cy - 76, backY = cy + 82;
        arrow(ctx, sourceX + 10 * towardObserver, frontY, sourceX + 10 * towardObserver + towardObserver * frontLambda, frontY, "#2364aa", 2);
        label(ctx, `観測者側：${displayedCycles}λ = ${fmt((towardObserver > 0 ? r.frontWave : r.backWave) * displayedCycles)} m`, sourceX + towardObserver * (frontLambda / 2 + 10), frontY - 10, "#2364aa", 12, "center");
        arrow(ctx, sourceX - 10 * towardObserver, backY, sourceX - 10 * towardObserver - towardObserver * backLambda, backY, "#64748b", 2);
        label(ctx, `反対側：${displayedCycles}λ = ${fmt((towardObserver > 0 ? r.backWave : r.frontWave) * displayedCycles)} m`, sourceX - towardObserver * (backLambda / 2 + 10), backY + 19, "#64748b", 12, "center");

        const arrivalThreshold = clamp(s.sound * representativePeriod * .12, .16, .45);
        const received = closestArrival < arrivalThreshold;
        if (received) {
          const pulse = 18 + (closestArrival / arrivalThreshold) * 20;
          ctx.strokeStyle = "rgba(8,127,91,.7)"; ctx.lineWidth = 4;
          ctx.beginPath(); ctx.arc(observerX, cy - 21, pulse, 0, TAU); ctx.stroke();
          label(ctx, "波面を受信！", observerX, cy - 76, "#087f5b", 14, "center");
        }

        dot(ctx, sourceX, cy, 19, "#dc4c45");
        ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(sourceX, cy, 6, 0, TAU); ctx.fill();
        label(ctx, "音源", sourceX, cy + 35, "#344054", 13, "center");
        arrow(ctx, sourceX - 32, cy - 42, sourceX + 32, cy - 42, "#dc4c45", 3);
        label(ctx, `${fmt(s.sourceSpeed)} m/s`, sourceX, cy - 52, "#c2413b", 12, "center");

        ctx.fillStyle = "#087f5b"; ctx.fillRect(observerX - 9, cy - 22, 18, 38); dot(ctx, observerX, cy - 32, 10, "#087f5b");
        label(ctx, "観測者", observerX, cy + 35, "#344054", 13, "center");
        arrow(ctx, observerX + 30, cy - 42, observerX - 30, cy - 42, "#087f5b", 3);
        label(ctx, `${fmt(s.observerSpeed)} m/s`, observerX, cy - 52, "#087f5b", 12, "center");

        const relation = approaching ? "近づく：受信間隔が短い" : "遠ざかる：受信間隔が長い";
        label(ctx, relation, w / 2, 52, "#7c3aed", 16, "center");
        label(ctx, `観測振動数 ${fmt(r.observed)} Hz`, w / 2, 76, "#7c3aed", 14, "center");
      }
    };
  }

  function beatsScenario() {
    return {
      timeRelevant: true,
      title: "うなり",
      subtitle: "近い2振動数の重ね合わせと振幅包絡線",
      lead: "2つの純音の振動数を近づけたり離したりして、うなりの回数が振動数差に一致することを確かめます。",
      formula: "y = A sin(2πf₁t) + A sin(2πf₂t)\nうなり振動数 fbeat = |f₁−f₂|",
      focus: "速い振動と、ゆっくり変わる包絡線を区別して読みます。",
      controls: [
        range("f1", "振動数 f₁", 200, 600, 1, 440, " Hz"),
        range("f2", "振動数 f₂", 200, 600, 1, 444, " Hz"),
        range("amplitude", "各波の振幅", 0.2, 1, 0.1, 0.7, "")
      ],
      calc(s) {
        const beat = Math.abs(s.f1 - s.f2), carrier = (s.f1 + s.f2) / 2;
        return { beat, carrier, metrics: [
          metric("うなり振動数", `${fmt(beat)} Hz`), metric("1秒間のうなり", `${fmt(beat)} 回`),
          metric("平均振動数", `${fmt(carrier)} Hz`), metric("うなり周期", beat ? `${fmt(1 / beat)} s` : "∞")
        ] };
      },
      draw(ctx, w, h, s, t, r) {
        clearStage(ctx, w, h);
        const left = 55, right = w - 35, cy = h / 2;
        ctx.strokeStyle = "#98a2b3"; ctx.beginPath(); ctx.moveTo(left, cy); ctx.lineTo(right, cy); ctx.stroke();
        const wave = [], upper = [], lower = [];
        for (let i = 0; i <= 420; i++) {
          const tt = i / 420 * 1.2;
          const fast = Math.sin(TAU * s.f1 * tt + t) + Math.sin(TAU * s.f2 * tt + t);
          const envelope = 2 * s.amplitude * Math.abs(Math.cos(Math.PI * (s.f1 - s.f2) * tt));
          const x = left + i / 420 * (right - left);
          wave.push([x, cy - fast * s.amplitude * h * .14]);
          upper.push([x, cy - envelope * h * .14]); lower.push([x, cy + envelope * h * .14]);
        }
        plot(ctx, upper, "#dc4c45", 2); plot(ctx, lower, "#dc4c45", 2); plot(ctx, wave, "#2364aa", 2);
        label(ctx, `|f₁−f₂| = ${fmt(r.beat)} Hz`, w / 2, 45, "#17202a", 17, "center");
      }
    };
  }

  function refractionScenario() {
    return {
      title: "光の屈折と全反射",
      subtitle: "スネルの法則、臨界角、光路",
      lead: "2つの媒質の屈折率と入射角を変え、屈折角または全反射への切り替わりを観察します。",
      formula: "n₁ sinθ₁ = n₂ sinθ₂\n臨界角：sinθc = n₂/n₁  (n₁>n₂)",
      focus: "屈折率の大きい媒質から小さい媒質へ進む場合だけ全反射が起こります。",
      controls: [
        range("n1", "上側媒質 n₁", 1, 2.5, 0.05, 1.5, ""),
        range("n2", "下側媒質 n₂", 1, 2.5, 0.05, 1, ""),
        range("angle", "入射角 θ₁", 0, 85, 1, 50, "°")
      ],
      calc(s) {
        const ratio = s.n1 / s.n2 * Math.sin(rad(s.angle));
        const tir = ratio > 1;
        const theta2 = tir ? NaN : Math.asin(ratio) * 180 / Math.PI;
        const critical = s.n1 > s.n2 ? Math.asin(s.n2 / s.n1) * 180 / Math.PI : NaN;
        return { tir, theta2, critical, metrics: [
          metric("屈折角 θ₂", tir ? "全反射" : `${fmt(theta2, 1)}°`),
          metric("臨界角 θc", Number.isFinite(critical) ? `${fmt(critical, 1)}°` : "なし"),
          metric("状態", tir ? "全反射" : s.angle === 0 ? "垂直入射" : "屈折"),
          metric("sinθ₂", tir ? "> 1（屈折不可）" : fmt(Math.sin(rad(theta2))))
        ] };
      },
      draw(ctx, w, h, s, t, r) {
        clearStage(ctx, w, h);
        const boundary = h / 2, cx = w / 2;
        ctx.fillStyle = "rgba(107,182,232,.16)"; ctx.fillRect(0, boundary, w, h - boundary);
        ctx.strokeStyle = "#344054"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, boundary); ctx.lineTo(w, boundary); ctx.stroke();
        ctx.setLineDash([6, 6]); ctx.strokeStyle = "#98a2b3"; ctx.beginPath(); ctx.moveTo(cx, 45); ctx.lineTo(cx, h - 45); ctx.stroke(); ctx.setLineDash([]);
        const length = Math.min(w, h) * .38;
        const inc = rad(s.angle);
        const sx = cx - Math.sin(inc) * length, sy = boundary - Math.cos(inc) * length;
        arrow(ctx, sx, sy, cx, boundary, "#dc4c45", 4);
        if (r.tir) {
          const ex = cx + Math.sin(inc) * length, ey = boundary - Math.cos(inc) * length;
          arrow(ctx, cx, boundary, ex, ey, "#7c3aed", 4);
        } else {
          const out = rad(r.theta2);
          const ex = cx + Math.sin(out) * length, ey = boundary + Math.cos(out) * length;
          arrow(ctx, cx, boundary, ex, ey, "#2364aa", 4);
          const rx = cx + Math.sin(inc) * length * .65, ry = boundary - Math.cos(inc) * length * .65;
          arrow(ctx, cx, boundary, rx, ry, "rgba(124,58,237,.55)", 2);
        }
        label(ctx, `n₁ = ${fmt(s.n1, 2)}`, 28, 35, "#344054", 14);
        label(ctx, `n₂ = ${fmt(s.n2, 2)}`, 28, boundary + 28, "#344054", 14);
        label(ctx, r.tir ? "全反射" : `θ₂ = ${fmt(r.theta2, 1)}°`, w - 35, 35, r.tir ? "#c2413b" : "#2364aa", 17, "right");
      }
    };
  }

  function forceMotionScenario() {
    return {
      timeRelevant: true,
      title: "力と運動方程式",
      subtitle: "自由物体図、合力、加速度、速度・位置",
      lead: "台車に働く力を変え、自由物体図と運動グラフを同じ時間軸で読みます。",
      formula: "ΣF = ma\nf = μmg\nv = v₀ + at,  x = x₀ + v₀t + ½at²",
      focus: "物体の進行方向ではなく、合力の方向が加速度の方向になります。",
      controls: [
        range("mass", "台車の質量", 0.5, 10, 0.5, 3, " kg"),
        range("force", "加える力", -50, 50, 1, 20, " N"),
        range("friction", "動摩擦係数", 0, 0.8, 0.05, 0.2, ""),
        range("v0", "初速度", -10, 10, 0.5, 0, " m/s")
      ],
      calc(s, t) {
        const frictionMag = s.friction * s.mass * G;
        const time = t % 8;
        const steps = Math.max(1, Math.ceil(time / .01));
        const dt = time / steps;
        let velocity = s.v0, position = 0;
        for (let i = 0; i < steps; i++) {
          const friction = Math.abs(velocity) < 1e-7
            ? -clamp(s.force, -frictionMag, frictionMag)
            : -Math.sign(velocity) * frictionMag;
          const acceleration = (s.force + friction) / s.mass;
          const nextVelocity = velocity + acceleration * dt;
          position += velocity * dt + .5 * acceleration * dt ** 2;
          if (velocity * nextVelocity < 0 && Math.abs(s.force) <= frictionMag) velocity = 0;
          else velocity = nextVelocity;
        }
        const friction = Math.abs(velocity) < 1e-7
          ? -clamp(s.force, -frictionMag, frictionMag)
          : -Math.sign(velocity) * frictionMag;
        const net = s.force + friction;
        const acceleration = net / s.mass;
        return { frictionMag, friction, net, acceleration, time, velocity, position, metrics: [
          metric("合力 ΣF", `${fmt(net)} N`), metric("加速度 a", `${fmt(acceleration)} m/s²`),
          metric("時刻", `${fmt(time)} s`), metric("速度", `${fmt(velocity)} m/s`),
          metric("位置変化", `${fmt(position)} m`), metric("摩擦力（符号付き）", `${fmt(friction)} N`)
        ] };
      },
      draw(ctx, w, h, s, t, r) {
        clearStage(ctx, w, h, "#fbfdff");
        const ground = h * .62;
        ctx.strokeStyle = "#667085"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(30, ground); ctx.lineTo(w - 30, ground); ctx.stroke();
        const x = w * .38 + clamp(r.position, -30, 30) / 30 * w * .24;
        ctx.fillStyle = "#2364aa"; ctx.fillRect(x - 65, ground - 70, 130, 52);
        dot(ctx, x - 42, ground - 10, 14, "#344054"); dot(ctx, x + 42, ground - 10, 14, "#344054");
        const forceScale = Math.min(120, Math.abs(s.force) * 3);
        arrow(ctx, x, ground - 85, x + Math.sign(s.force || 1) * forceScale, ground - 85, "#dc4c45", 4);
        const frictionScale = Math.min(100, Math.abs(r.friction) * 3);
        if (frictionScale > 0) arrow(ctx, x, ground - 35, x + Math.sign(r.friction) * frictionScale, ground - 35, "#b45309", 3);
        arrow(ctx, x, ground - 70, x, ground - 150, "#087f5b", 3);
        arrow(ctx, x, ground - 20, x, ground + 60, "#7c3aed", 3);
        label(ctx, "F", x + Math.sign(s.force || 1) * (forceScale + 15), ground - 85, "#dc4c45", 14, "center");
        label(ctx, "N", x + 14, ground - 150, "#087f5b", 14); label(ctx, "mg", x + 14, ground + 58, "#7c3aed", 14);
        label(ctx, `a = ${fmt(r.acceleration)} m/s²`, w / 2, 45, "#17202a", 17, "center");
      }
    };
  }

  function mechanicalEnergyScenario() {
    return {
      timeRelevant: true,
      title: "力学的エネルギーと摩擦",
      subtitle: "位置・運動エネルギー、仕事、散逸",
      lead: "斜面を下る物体について、位置エネルギーが運動エネルギーと摩擦による熱へ移る様子を追います。",
      formula: "E = K + U = ½mv² + mgh\n摩擦の仕事 Wf = −ΔEmechanical",
      focus: "摩擦がある場合も、熱を含めた全エネルギーは保存されます。",
      controls: [
        range("mass", "質量 m", 0.5, 10, 0.5, 2, " kg"),
        range("height", "初期高さ h", 0.5, 10, 0.5, 5, " m"),
        range("speed", "初速度 v₀", 0, 10, 0.5, 1, " m/s"),
        range("loss", "摩擦による損失率", 0, 80, 5, 20, "%")
      ],
      calc(s, t) {
        const initialK = .5 * s.mass * s.speed ** 2;
        const initialU = s.mass * G * s.height;
        const total = initialK + initialU;
        const lost = total * s.loss / 100;
        const bottomK = total - lost;
        const bottomV = Math.sqrt(Math.max(0, 2 * bottomK / s.mass));
        const progress = (1 - Math.cos((t % 6) / 6 * Math.PI)) / 2;
        const currentU = initialU * (1 - progress);
        const thermal = lost * progress;
        const currentK = total - currentU - thermal;
        return { initialK, initialU, total, lost, bottomK, bottomV, progress, currentU, currentK, thermal, metrics: [
          metric("初期全エネルギー", `${fmt(total)} J`), metric("現在の位置E", `${fmt(currentU)} J`),
          metric("現在の運動E", `${fmt(currentK)} J`), metric("熱への変換", `${fmt(thermal)} J`),
          metric("最下点の速さ", `${fmt(bottomV)} m/s`)
        ] };
      },
      draw(ctx, w, h, s, t, r) {
        clearStage(ctx, w, h);
        const x1 = 70, y1 = 85, x2 = w * .65, y2 = h * .68;
        ctx.strokeStyle = "#667085"; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(w - 40, y2); ctx.stroke();
        const x = x1 + (x2 - x1) * r.progress, y = y1 + (y2 - y1) * r.progress;
        ctx.save(); ctx.translate(x, y - 18); ctx.rotate(Math.atan2(y2 - y1, x2 - x1));
        ctx.fillStyle = "#2364aa"; ctx.fillRect(-28, -20, 56, 40); ctx.restore();
        const barX = w * .73, base = h * .78, maxH = h * .5, total = Math.max(r.total, 1);
        const values = [["位置", r.currentU, "#2f6fbd"], ["運動", r.currentK, "#087f5b"], ["熱", r.thermal, "#dc4c45"]];
        values.forEach(([name, value, color], i) => {
          const bh = value / total * maxH;
          ctx.fillStyle = color; ctx.fillRect(barX + i * 72, base - bh, 48, bh);
          label(ctx, name, barX + i * 72 + 24, base + 20, "#344054", 12, "center");
        });
        label(ctx, "エネルギーの移り変わり", barX + 96, 65, "#17202a", 15, "center");
      }
    };
  }

  function rigidRotationScenario() {
    const factors = { disk: ["円板", .5], ring: ["輪", 1], sphere: ["球", .4], rod: ["棒（中心軸）", 1 / 12] };
    return {
      timeRelevant: true,
      title: "剛体の回転運動",
      subtitle: "慣性モーメント、トルク、角加速度",
      lead: "同じ質量と大きさでも、質量分布によって回転しにくさが変わることを比較します。",
      formula: "τ = Iα\nI = kMR²\nω = ω₀ + αt",
      focus: "慣性モーメントは回転運動における質量の役割をします。",
      controls: [
        select("shape", "剛体", "disk", [["disk", "一様円板"], ["ring", "薄い輪"], ["sphere", "一様球"], ["rod", "棒（中心軸）"]]),
        range("mass", "質量 M", 0.5, 10, 0.5, 3, " kg"),
        range("radius", "半径／棒の長さ R", 0.2, 2, 0.1, 0.8, " m"),
        range("torque", "トルク τ", -20, 20, 1, 8, " N·m")
      ],
      calc(s, t) {
        const factor = factors[s.shape][1];
        const inertia = factor * s.mass * s.radius ** 2;
        const alpha = s.torque / inertia;
        const time = t % 8;
        const omega = alpha * time;
        const angle = .5 * alpha * time ** 2;
        return { factor, inertia, alpha, omega, angle, shapeName: factors[s.shape][0], metrics: [
          metric("慣性モーメント I", `${fmt(inertia)} kg·m²`), metric("角加速度 α", `${fmt(alpha)} rad/s²`),
          metric("角速度 ω", `${fmt(omega)} rad/s`), metric("回転角", `${fmt(angle)} rad`),
          metric("係数 k", fmt(factor))
        ] };
      },
      draw(ctx, w, h, s, t, r) {
        clearStage(ctx, w, h, "#fbfdff");
        const cx = w * .46, cy = h / 2, radius = Math.min(w, h) * .25;
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(r.angle * .12);
        if (s.shape === "rod") {
          ctx.fillStyle = "#2364aa"; ctx.fillRect(-radius, -18, radius * 2, 36);
        } else {
          ctx.beginPath(); ctx.arc(0, 0, radius, 0, TAU);
          ctx.fillStyle = s.shape === "ring" ? "transparent" : "rgba(35,100,170,.22)"; ctx.fill();
          ctx.strokeStyle = "#2364aa"; ctx.lineWidth = s.shape === "ring" ? 16 : 4; ctx.stroke();
          if (s.shape === "sphere") {
            ctx.strokeStyle = "rgba(35,100,170,.55)"; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.ellipse(0, 0, radius, radius * .35, 0, 0, TAU); ctx.stroke();
          }
        }
        ctx.strokeStyle = "#dc4c45"; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(radius * .85, 0); ctx.stroke();
        ctx.restore();
        dot(ctx, cx, cy, 8, "#17202a");
        ctx.strokeStyle = "#7c3aed"; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, cy, radius + 35, -1.1, 1.3, s.torque < 0); ctx.stroke();
        label(ctx, `τ = ${fmt(s.torque)} N·m`, w * .78, cy - 30, "#7c3aed", 17, "center");
        label(ctx, r.shapeName, cx, h - 42, "#344054", 15, "center");
      }
    };
  }

  function collision2DScenario() {
    return {
      timeRelevant: true,
      title: "二次元衝突",
      subtitle: "運動量ベクトル、反発係数、衝突後速度",
      lead: "2つの球の質量、速さ、ずれ、反発係数を変え、斜め衝突でも運動量ベクトルが保存されることを確認します。",
      formula: "m₁v₁ + m₂v₂ = m₁v₁′ + m₂v₂′\n法線方向：vrel′ = −e vrel",
      focus: "接触面の法線方向だけが衝撃力で変わり、接線方向は保たれます。",
      controls: [
        range("m1", "球1の質量", 0.5, 5, 0.5, 2, " kg"),
        range("m2", "球2の質量", 0.5, 5, 0.5, 1, " kg"),
        range("v1", "球1の速さ", 1, 10, 0.5, 6, " m/s"),
        range("v2", "球2の速さ", 0, 8, 0.5, 2, " m/s"),
        range("impact", "衝突のずれ", -0.8, 0.8, 0.1, 0.4, " R"),
        range("restitution", "反発係数 e", 0, 1, 0.05, 0.8, "")
      ],
      calc(s, t) {
        const nx = Math.sqrt(Math.max(0.01, 1 - s.impact ** 2)), ny = s.impact;
        const relDot = (s.v1 + s.v2) * nx;
        const impulse = -(1 + s.restitution) * relDot / (1 / s.m1 + 1 / s.m2);
        const a = { x: s.v1 + impulse * nx / s.m1, y: impulse * ny / s.m1 };
        const b = { x: -s.v2 - impulse * nx / s.m2, y: -impulse * ny / s.m2 };
        const pBefore = s.m1 * s.v1 - s.m2 * s.v2;
        const pAfterX = s.m1 * a.x + s.m2 * b.x;
        const pAfterY = s.m1 * a.y + s.m2 * b.y;
        const keBefore = .5 * s.m1 * s.v1 ** 2 + .5 * s.m2 * s.v2 ** 2;
        const keAfter = .5 * s.m1 * (a.x ** 2 + a.y ** 2) + .5 * s.m2 * (b.x ** 2 + b.y ** 2);
        return { nx, ny, impulse, a, b, pBefore, pAfterX, pAfterY, keBefore, keAfter, phase: (t % 8) / 8, metrics: [
          metric("球1の衝突後速度", `(${fmt(a.x)}, ${fmt(a.y)}) m/s`),
          metric("球2の衝突後速度", `(${fmt(b.x)}, ${fmt(b.y)}) m/s`),
          metric("衝突前の全運動量", `${fmt(pBefore)} kg·m/s`),
          metric("衝突後の全運動量", `(${fmt(pAfterX)}, ${fmt(pAfterY)}) kg·m/s`),
          metric("運動E比", `${fmt(keAfter / keBefore * 100, 1)} %`)
        ] };
      },
      draw(ctx, w, h, s, t, r) {
        clearStage(ctx, w, h);
        const cy = h / 2, collisionX = w / 2, radius = 28;
        let ax, ay, bx, by;
        if (r.phase < .5) {
          const p = r.phase / .5;
          ax = 70 + (collisionX - 55 - 70) * p; ay = cy - s.impact * 35;
          bx = w - 70 + (collisionX + 55 - (w - 70)) * p; by = cy + s.impact * 35;
        } else {
          const dt = (r.phase - .5) / .5;
          ax = collisionX - 55 + r.a.x * dt * 30; ay = cy - s.impact * 35 + r.a.y * dt * 30;
          bx = collisionX + 55 + r.b.x * dt * 30; by = cy + s.impact * 35 + r.b.y * dt * 30;
        }
        dot(ctx, ax, ay, radius, "#2f6fbd"); dot(ctx, bx, by, radius, "#dc4c45");
        label(ctx, `m₁=${fmt(s.m1)} kg`, ax, ay + 45, "#344054", 12, "center");
        label(ctx, `m₂=${fmt(s.m2)} kg`, bx, by + 45, "#344054", 12, "center");
        const va = r.phase < .5 ? {x:s.v1,y:0} : r.a, vb = r.phase < .5 ? {x:-s.v2,y:0} : r.b;
        arrow(ctx, ax, ay, ax + va.x * 16, ay + va.y * 16, "#087f5b", 3);
        arrow(ctx, bx, by, bx + vb.x * 16, by + vb.y * 16, "#7c3aed", 3);
        ctx.setLineDash([6, 5]); ctx.strokeStyle = "#98a2b3"; ctx.beginPath(); ctx.moveTo(collisionX - r.nx * 80, cy - r.ny * 80); ctx.lineTo(collisionX + r.nx * 80, cy + r.ny * 80); ctx.stroke(); ctx.setLineDash([]);
        label(ctx, r.phase < .5 ? "衝突前" : "衝突後", w / 2, 45, "#17202a", 18, "center");
      }
    };
  }

  function movingDots(ctx, points, time, color) {
    const segments = [];
    let total = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const length = Math.hypot(points[i + 1][0] - points[i][0], points[i + 1][1] - points[i][1]);
      segments.push({ a: points[i], b: points[i + 1], start: total, length }); total += length;
    }
    for (let n = 0; n < 10; n++) {
      let distance = (time * 70 + n / 10 * total) % total;
      const segment = segments.find(item => distance >= item.start && distance <= item.start + item.length) || segments[0];
      const p = (distance - segment.start) / segment.length;
      dot(ctx, segment.a[0] + (segment.b[0] - segment.a[0]) * p, segment.a[1] + (segment.b[1] - segment.a[1]) * p, 4, color, null);
    }
  }

  function drawResistor(ctx, x, y, name, resistance) {
    ctx.fillStyle = "#fff4d8"; ctx.strokeStyle = "#b45309"; ctx.lineWidth = 3;
    ctx.fillRect(x - 55, y - 20, 110, 40); ctx.strokeRect(x - 55, y - 20, 110, 40);
    label(ctx, `${name} ${fmt(resistance)}Ω`, x, y, "#7a3e00", 13, "center");
  }

  function drawBattery(ctx, x, y, voltage) {
    ctx.strokeStyle = "#344054"; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(x - 18, y - 30); ctx.lineTo(x - 18, y + 30); ctx.moveTo(x + 12, y - 48); ctx.lineTo(x + 12, y + 48); ctx.stroke();
    label(ctx, "+", x + 12, y - 62, "#dc4c45", 16, "center"); label(ctx, "−", x - 18, y - 46, "#2f6fbd", 16, "center");
    label(ctx, `${fmt(voltage)} V`, x, y + 68, "#344054", 12, "center");
  }

  function drawCapacitor(ctx, x, y, name, voltage, capacitance) {
    ctx.strokeStyle = "#344054"; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(x - 9, y - 35); ctx.lineTo(x - 9, y + 35); ctx.moveTo(x + 9, y - 35); ctx.lineTo(x + 9, y + 35); ctx.stroke();
    label(ctx, `${name} ${fmt(capacitance)}μF`, x, y - 52, "#344054", 12, "center");
    label(ctx, `${fmt(voltage)} V`, x, y + 54, "#7c3aed", 12, "center");
    for (let i = 0; i < 5; i++) { label(ctx, "+", x - 24, y - 28 + i * 14, "#dc4c45", 11, "center"); label(ctx, "−", x + 24, y - 28 + i * 14, "#2f6fbd", 11, "center"); }
  }

  function drawNucleus(ctx, x, y, name, color) {
    dot(ctx, x, y, name.length > 3 ? 31 : 25, color);
    label(ctx, name, x, y, "#ffffff", 13, "center");
  }

  function drawBeaker(ctx, x, y, width, height, color, temperature, name) {
    ctx.strokeStyle = "#667085"; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(x, y - height / 2); ctx.lineTo(x, y + height / 2); ctx.lineTo(x + width, y + height / 2); ctx.lineTo(x + width, y - height / 2); ctx.stroke();
    ctx.fillStyle = color; ctx.globalAlpha = .65; ctx.fillRect(x + 5, y - height * .15, width - 10, height * .62); ctx.globalAlpha = 1;
    label(ctx, name, x + width / 2, y + height / 2 + 24, "#344054", 13, "center");
    label(ctx, `${fmt(temperature)}℃`, x + width / 2, y, "#17202a", 16, "center");
  }

  function drawReservoir(ctx, x, y, width, height, title, value, color) {
    ctx.fillStyle = color; ctx.globalAlpha = .18; ctx.fillRect(x - width / 2, y - height / 2, width, height); ctx.globalAlpha = 1;
    ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.strokeRect(x - width / 2, y - height / 2, width, height);
    label(ctx, title, x, y - 10, color, 15, "center"); label(ctx, value, x, y + 16, "#17202a", 14, "center");
  }

  function wavelengthColor(nm) {
    if (nm < 380) return "#7c3aed";
    if (nm < 450) return "#5b21b6";
    if (nm < 495) return "#2563eb";
    if (nm < 570) return "#10b981";
    if (nm < 590) return "#eab308";
    if (nm < 620) return "#f97316";
    return "#dc2626";
  }

  const SCENARIOS = {
    "electric-field": electricFieldScenario(),
    "dc-circuit": dcCircuitScenario(),
    "capacitor": capacitorScenario(),
    "magnetic-lorentz": magneticScenario(),
    "electromagnetic-induction": inductionScenario(),
    "ac-circuit": acScenario(),
    "photoelectric-effect": photoelectricScenario(),
    "atomic-spectrum": atomicSpectrumScenario(),
    "radioactive-decay": radioactiveScenario(),
    "nuclear-reaction": nuclearScenario(),
    "calorimetry": calorimetryScenario(),
    "heat-engine": heatEngineScenario(),
    "string-standing-wave": standingWaveScenario(),
    "doppler-effect": dopplerScenario(),
    "beats": beatsScenario(),
    "refraction": refractionScenario(),
    "force-and-motion": forceMotionScenario(),
    "mechanical-energy": mechanicalEnergyScenario(),
    "rigid-body-rotation": rigidRotationScenario(),
    "collision-2d": collision2DScenario()
  };

  function launch() {
    const scenarioId = window.PHYSICS_LAB_ID;
    const scenario = SCENARIOS[scenarioId];
    const root = document.getElementById("physics-lab-root");
    if (!root || !scenario) {
      if (root) root.textContent = "シミュレータ設定を読み込めませんでした。";
      return;
    }

    const timeRelevant = scenario.timeRelevant === true;
    const actionsMarkup = timeRelevant
      ? `<div class="lab-actions"><button class="primary" type="button" data-action="play">再生</button><button type="button" data-action="step">0.2秒進める</button><button type="button" data-action="reset">初期状態</button></div><div class="lab-status" aria-live="polite">停止中</div>`
      : `<div class="lab-actions"><button type="button" data-action="reset">条件を初期値へ戻す</button></div><div class="lab-status" aria-live="polite">条件を変えると、図と結果が連動します。</div>`;

    root.className = "physics-lab";
    root.innerHTML = `
      <div class="lab-layout">
        <section class="lab-panel" aria-labelledby="lab-title">
          <h1 id="lab-title"></h1>
          <p class="lab-lead"></p>
          <div class="lab-controls" aria-label="物理条件"></div>
          ${actionsMarkup}
        </section>
        <section class="lab-stage" aria-labelledby="stage-title">
          <div class="lab-stage-head"><h2 id="stage-title">現象の可視化</h2><div class="lab-stage-note"></div></div>
          <div class="lab-canvas-wrap"><canvas class="lab-canvas" role="img"></canvas></div>
          <div class="lab-readouts" aria-label="計算結果"></div>
        </section>
      </div>
      <section class="lab-explanation">
        <h2>考え方と式</h2>
        <div class="lab-formula"></div>
        <p class="lab-focus"></p>
      </section>`;

    root.querySelector("#lab-title").textContent = scenario.title;
    root.querySelector(".lab-lead").textContent = scenario.lead;
    root.querySelector(".lab-stage-note").textContent = scenario.subtitle;
    root.querySelector(".lab-formula").textContent = scenario.formula;
    root.querySelector(".lab-focus").textContent = `観察の焦点：${scenario.focus}`;

    const controlsRoot = root.querySelector(".lab-controls");
    const state = {};
    const inputs = new Map();
    scenario.controls.forEach(control => {
      state[control.key] = control.type === "range" ? Number(control.value) : control.value;
      const field = document.createElement("label");
      field.className = "lab-field";
      const head = document.createElement("span"); head.className = "lab-field-head";
      const caption = document.createElement("span"); caption.textContent = control.label;
      const output = document.createElement("output");
      head.append(caption, output); field.append(head);
      let input;
      if (control.type === "select") {
        input = document.createElement("select");
        control.options.forEach(([value, text]) => {
          const option = document.createElement("option"); option.value = value; option.textContent = text; input.append(option);
        });
        input.value = control.value;
      } else {
        input = document.createElement("input"); input.type = "range";
        input.min = String(control.min); input.max = String(control.max); input.step = String(control.step); input.value = String(control.value);
      }
      field.append(input); controlsRoot.append(field); inputs.set(control.key, { input, output, control });
      const updateControl = () => {
        state[control.key] = control.type === "range" ? Number(input.value) : input.value;
        output.value = control.type === "range" ? `${fmt(Number(input.value), 2)}${control.unit}` : input.options[input.selectedIndex].textContent;
      };
      const handleControl = () => {
        updateControl();
        if (!timeRelevant) status.textContent = "条件を更新しました。図と結果を見比べてください。";
        render();
      };
      input.addEventListener("input", handleControl); input.addEventListener("change", handleControl); updateControl();
    });

    const canvas = root.querySelector("canvas");
    canvas.setAttribute("aria-label", `${scenario.title}の可視化キャンバス`);
    const ctx = canvas.getContext("2d");
    const readouts = root.querySelector(".lab-readouts");
    const playButton = root.querySelector('[data-action="play"]');
    const status = root.querySelector(".lab-status");
    let running = false, physicsTime = 0, visualTime = 0, last = performance.now();

    function reset() {
      scenario.controls.forEach(control => {
        const item = inputs.get(control.key);
        item.input.value = String(control.value);
        item.input.dispatchEvent(new Event("input"));
      });
      running = false; physicsTime = 0;
      if (playButton) playButton.textContent = "再生";
      status.textContent = timeRelevant ? "初期状態に戻しました" : "初期条件に戻しました。";
    }

    if (timeRelevant) {
      playButton.addEventListener("click", () => {
        running = !running;
        playButton.textContent = running ? "一時停止" : "再生";
        status.textContent = running ? "再生中" : "停止中";
      });
      root.querySelector('[data-action="step"]').addEventListener("click", () => { running = false; physicsTime += .2; playButton.textContent = "再生"; status.textContent = `時刻 ${fmt(physicsTime)} s`; render(); });
    }
    root.querySelector('[data-action="reset"]').addEventListener("click", reset);

    function fitCanvas() {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const width = Math.max(320, Math.round(rect.width));
      const height = Math.max(320, Math.round(rect.height));
      if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
        canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { width, height };
    }

    function render() {
      const displayTime = timeRelevant ? physicsTime : visualTime;
      const result = scenario.calc(state, displayTime);
      const size = fitCanvas();
      scenario.draw(ctx, size.width, size.height, state, displayTime, result);
      readouts.replaceChildren(...result.metrics.map(item => {
        const box = document.createElement("div"); box.className = "lab-readout";
        const name = document.createElement("span"); name.textContent = item.label;
        const value = document.createElement("strong"); value.textContent = item.value;
        box.append(name, value); return box;
      }));
    }

    function animate(now) {
      const delta = Math.min(.05, Math.max(0, (now - last) / 1000));
      last = now;
      visualTime += delta;
      if (running) physicsTime += delta;
      if (!timeRelevant || running) render();
      requestAnimationFrame(animate);
    }

    reset();
    requestAnimationFrame(animate);
  }

  launch();
})();
