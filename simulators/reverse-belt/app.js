const canvas = document.querySelector('#simulation');
const ctx = canvas.getContext('2d');
const paceInput = document.querySelector('#pace');
const paceDownButton = document.querySelector('#pace-down');
const paceUpButton = document.querySelector('#pace-up');
const startRankInput = document.querySelector('#start-rank');
const totalCompetitorsInput = document.querySelector('#total-competitors');
const deviationToggle = document.querySelector('#show-deviation');
const playButton = document.querySelector('#toggle-play');
const resetButtons = [document.querySelector('#reset'), document.querySelector('#reset-top')];
const rankEl = document.querySelector('#rank');
const paceValue = document.querySelector('#pace-value');
const topPaceValue = document.querySelector('#top-pace-value');
const beltValue = document.querySelector('#belt-value');
const deviationValue = document.querySelector('#deviation-value');
const deviationStat = document.querySelector('#deviation-stat');
const deviationNote = document.querySelector('#deviation-note');
const message = document.querySelector('#message');
const beltCaption = document.querySelector('#belt-caption');
const movementIndicator = document.querySelector('#movement-indicator');
const beltKey = document.querySelector('#belt-key');
const scaleExplanation = document.querySelector('#scale-explanation');
const gradeButtons = [...document.querySelectorAll('[data-grade]')];
const rankStartOptions = [1_000_000, 500_000, 100_000, 50_000, 10_000, 5_000, 1_000, 500, 100, 50, 10, 1];
const deviationStartOptions = [25, 30, 35, 40, 45, 50, 55, 60, 65, 67, 70];

const grades = { 1: .55, 2: .75, 3: .95 };
const ACTUAL_EXAMINEE_COUNT = 464_090;
const field = { left: 95, right: 1035, bottom: 438, top: 235 };
const runners = [
  { name: 'あなた', color: '#ff6656', progress: .29, you: true, phase: 0 },
  { color: '#6a42c7', progress: .06, phase: 1 }, { color: '#296dd8', progress: .16, phase: 2 },
  { color: '#1abcc4', progress: .27, phase: 3 }, { color: '#18aa70', progress: .42, phase: 4 },
  { color: '#f0ac00', progress: .57, phase: 5 }, { color: '#ee8200', progress: .69, phase: 6 },
  { color: '#2861d9', progress: .80, phase: 7 }, { color: '#8753e7', progress: .90, phase: 8 }
];
let grade = 2;
let playing = false;
let beltPhase = 0;
let lastTime = performance.now();
let elapsed = 0;
let movement = 'stay';
let showDeviation = false;
let totalCompetitors = Number(totalCompetitorsInput.value);

function progressToPoint(progress) {
  return {
    x: field.left + (field.right - field.left) * progress,
    y: field.bottom + (field.top - field.bottom) * progress
  };
}
function beltSpeedAt(progress) {
  const eliteBarrier = progress > .77 ? 1.55 * Math.pow((progress - .77) / .23, 1.8) : 0;
  const timePressure = 1 + Math.min(.65, elapsed * .018);
  return grades[grade] * (1 + 2.2 * Math.pow(progress, 2.1) + eliteBarrier) * timePressure;
}
function rankFromProgress(progress) {
  const { midpoint, topBarrier } = scaleBreaks();
  const p = Math.max(0, Math.min(.995, progress));
  if (p <= .5) return Math.round(Math.pow(10, interpolate(Math.log10(totalCompetitors), Math.log10(midpoint), p / .5)));
  if (p <= .77) return Math.round(Math.pow(10, interpolate(Math.log10(midpoint), Math.log10(topBarrier), (p - .5) / .27)));
  return Math.max(1, Math.round(Math.pow(10, interpolate(Math.log10(topBarrier), 0, (p - .77) / .225))));
}
function progressFromRank(rank) {
  const { midpoint, topBarrier } = scaleBreaks();
  const safeRank = Math.max(1, Math.min(totalCompetitors, rank));
  const logRank = Math.log10(safeRank);
  if (safeRank >= midpoint) return .5 * normalize(logRank, Math.log10(totalCompetitors), Math.log10(midpoint));
  if (safeRank >= topBarrier) return .5 + .27 * normalize(logRank, Math.log10(midpoint), Math.log10(topBarrier));
  return .77 + .225 * normalize(logRank, Math.log10(topBarrier), 0);
}
function interpolate(start, end, amount) { return start + (end - start) * amount; }
function normalize(value, start, end) { return Math.max(0, Math.min(1, (value - start) / (end - start))); }
function scaleBreaks() {
  const midpoint = totalCompetitors / 2;
  return { midpoint, topBarrier: Math.min(10_000, midpoint * .1) };
}
function inverseNormalCDF(probability) {
  const p = Math.max(1e-7, Math.min(1 - 1e-7, probability));
  const a = [-39.6968302866538, 220.946098424521, -275.928510446969, 138.357751867269, -30.6647980661472, 2.50662827745924];
  const b = [-54.4760987982241, 161.585836858041, -155.698979859887, 66.8013118877197, -13.2806815528857];
  const c = [-.00778489400243029, -.322396458041136, -2.40075827716184, -2.54973253934373, 4.37466414146497, 2.93816398269878];
  const d = [.00778469570904146, .32246712907004, 2.445134137143, 3.75440866190742];
  if (p < .02425) { const q = Math.sqrt(-2 * Math.log(p)); return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
  if (p > .97575) { const q = Math.sqrt(-2 * Math.log(1 - p)); return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
  const q = p - .5; const r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}
function deviationFromRank(rank) {
  const comparisonPopulation = Math.min(ACTUAL_EXAMINEE_COUNT, totalCompetitors);
  const upperTail = Math.min(comparisonPopulation - .5, Math.max(.5, rank - .5)) / comparisonPopulation;
  return Math.min(99, Math.max(25, 50 + 10 * inverseNormalCDF(1 - upperTail)));
}
function normalCDF(value) {
  const sign = value < 0 ? -1 : 1;
  const x = Math.abs(value) / Math.sqrt(2);
  const t = 1 / (1 + .3275911 * x);
  const erf = 1 - (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - .284496736) * t + .254829592) * t * Math.exp(-x * x));
  return .5 * (1 + sign * erf);
}
function rankFromDeviation(deviation) {
  const upperTail = 1 - normalCDF((deviation - 50) / 10);
  return Math.max(1, Math.min(totalCompetitors, Math.round(upperTail * totalCompetitors + .5)));
}
function formatRank(rank) {
  if (rank >= 1_000_000) return `${Math.round(rank / 10_000).toLocaleString()}万人`;
  if (rank >= 10_000) return `${Math.round(rank / 10_000).toLocaleString()}万位`;
  return `${rank.toLocaleString()}位`;
}
function formatPopulation(population) {
  if (population < 10_000) return population.toLocaleString();
  return `${(population / 10_000).toLocaleString()}万`;
}
function rankMarkup(rank) {
  const text = formatRank(rank);
  return text.endsWith('人') ? text : `${text.replace('位', '')}<small>位</small>`;
}
function drawPill(text, x, y, fill, color = 'white', fontSize = 15) {
  ctx.font = `800 ${fontSize}px sans-serif`;
  const width = ctx.measureText(text).width + fontSize * 1.45;
  const height = fontSize * 2;
  ctx.beginPath(); ctx.roundRect(x - width / 2, y - height * .68, width, height, fontSize * .6); ctx.fillStyle = fill; ctx.fill();
  ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.fillText(text, x, y); ctx.textAlign = 'left';
}
function drawStick(point, color, isYou, t, phase) {
  const forward = Math.sin(t * 3.1 + phase) * 6;
  const bob = Math.sin(t * 6.2 + phase) * 3.5;
  ctx.save(); ctx.translate(point.x + forward, point.y - 44 + bob); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = isYou ? 5 : 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(0, -43, 13, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(0, 2); ctx.moveTo(0, -19); ctx.lineTo(-15, -5); ctx.moveTo(0, -19); ctx.lineTo(15, -7); ctx.moveTo(0, 2); ctx.lineTo(-13, 25); ctx.moveTo(0, 2); ctx.lineTo(15, 22); ctx.stroke();
  if (isYou) { ctx.beginPath(); ctx.arc(0, -43, 20, 0, Math.PI * 2); ctx.strokeStyle = '#ffb1a8'; ctx.lineWidth = 2; ctx.stroke(); }
  ctx.restore();
}
function scaleRanks() {
  const ranks = [totalCompetitors];
  for (let power = Math.floor(Math.log10(totalCompetitors)); power >= 0; power -= 1) {
    const rank = Math.pow(10, power);
    if (rank < totalCompetitors) ranks.push(rank);
  }
  return ranks;
}
function scaleLabel(rank) { return rank === totalCompetitors ? formatPopulation(rank) : formatRank(rank); }
function drawLogScale(compact) {
  const labels = scaleRanks();
  labels.forEach((rank, index) => {
    if (compact && index !== 0 && index !== labels.length - 1 && rank !== 10_000) return;
    const p = progressFromRank(rank);
    const point = progressToPoint(p);
    const elite = rank <= 100;
    ctx.strokeStyle = elite ? '#ffb1a8' : '#cbd3ee'; ctx.lineWidth = elite ? 3 : 2;
    ctx.beginPath(); ctx.moveTo(point.x, point.y + 29); ctx.lineTo(point.x, point.y + 48); ctx.stroke();
    ctx.fillStyle = elite ? '#c64c43' : '#667096'; ctx.font = compact ? '800 30px sans-serif' : index === 0 ? '800 15px sans-serif' : '700 13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(scaleLabel(rank), point.x, point.y + (compact ? 86 : 69));
  });
  ctx.textAlign = 'left';
}
function draw(t) {
  ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const compact = window.innerWidth <= 720;
  // Top zone is deliberately darker: the belt speed rises as rank approaches 1.
  const angle = Math.atan2(field.top - field.bottom, field.right - field.left);
  ctx.save(); ctx.translate(field.left, field.bottom); ctx.rotate(angle);
  const beltLength = Math.hypot(field.right - field.left, field.top - field.bottom);
  ctx.beginPath(); ctx.roundRect(0, -39, beltLength, 78, 39); ctx.fillStyle = '#101d52'; ctx.fill(); ctx.strokeStyle = '#44538c'; ctx.lineWidth = 5; ctx.stroke();
  const acceleration = ctx.createLinearGradient(0, 0, beltLength, 0); acceleration.addColorStop(0, 'rgba(56, 78, 175, 0)'); acceleration.addColorStop(.72, 'rgba(106, 66, 199, .28)'); acceleration.addColorStop(1, 'rgba(255, 102, 86, .42)'); ctx.fillStyle = acceleration; ctx.fill();
  for (let i = -30; i < beltLength + 90; i += 82) { const x = i - beltPhase % 82; ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x + 34, -2); ctx.lineTo(x + 7, -2); ctx.lineTo(x + 21, -14); ctx.moveTo(x + 7, -2); ctx.lineTo(x + 21, 10); ctx.stroke(); }
  ctx.restore();
  ctx.strokeStyle = '#101d52'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(74, 491); ctx.lineTo(1058, 491); ctx.stroke();
  drawLogScale(compact);
  if (!compact) { const top = progressToPoint(.94); drawPill(`1位圏：最速 ${beltSpeedAt(1).toFixed(1)}倍`, top.x - 20, top.y - 96, '#7b3fc7'); }
  const ordered = [...runners].sort((a, b) => b.progress - a.progress);
  ordered.forEach((runner, index) => {
    const vibration = Math.sin(t * 2.2 + runner.phase) * .008;
    const point = progressToPoint(Math.max(0, Math.min(1, runner.progress + vibration)));
    drawStick(point, runner.color, runner.you, t, runner.phase);
    ctx.fillStyle = '#101d52'; ctx.font = compact ? '800 30px sans-serif' : '800 16px sans-serif'; ctx.textAlign = 'center';
    if (runner.you) ctx.fillText(formatRank(rankFromProgress(runner.progress)), point.x, point.y - (compact ? 138 : 120));
    if (runner.you && showDeviation) drawPill(`偏差値 ${deviationFromRank(rankFromProgress(runner.progress)).toFixed(1)}`, point.x, point.y - (compact ? 178 : 152), '#253aa8', 'white', compact ? 22 : 13);
    if (runner.you) drawPill('あなた', point.x, point.y + (compact ? 64 : 50), '#ff6656', 'white', compact ? 28 : 15);
    if (runner.you && playing && movement !== 'stay') {
      const arrow = movement === 'forward' ? '↗ 前進中' : '↙ 後退中';
      drawPill(arrow, point.x + (movement === 'forward' ? 76 : -76), point.y - 75, movement === 'forward' ? '#14845d' : '#c64c43', 'white', compact ? 22 : 13);
    }
  });
  ctx.textAlign = 'left';
}
function updateUI() {
  const you = runners.find(runner => runner.you);
  const pace = Number(paceInput.value);
  const deviation = deviationFromRank(rankFromProgress(you.progress));
  const localBeltSpeed = beltSpeedAt(you.progress);
  rankEl.innerHTML = rankMarkup(rankFromProgress(you.progress));
  paceValue.innerHTML = `${pace.toFixed(2)}<small>倍</small>`;
  topPaceValue.textContent = `${pace.toFixed(2)}倍`;
  beltValue.innerHTML = `${localBeltSpeed.toFixed(2)}<small>倍</small>`;
  deviationValue.textContent = deviation.toFixed(1);
  deviationStat.hidden = !showDeviation;
  deviationNote.hidden = !showDeviation;
  beltKey.textContent = `順位スケール：${formatPopulation(totalCompetitors)} → 1位`;
  scaleExplanation.textContent = `全体人数は${formatPopulation(totalCompetitors)}。偏差値50相当が中央に来るよう、上位ほど圧縮して並べています。`;
  beltCaption.textContent = `経過 ${Math.floor(elapsed)}秒 ｜ 高${grade}・流れ +${Math.round((Math.min(.65, elapsed * .018)) * 100)}% ｜ あなたの地点 ${localBeltSpeed.toFixed(2)}倍`;
  const delta = pace - localBeltSpeed;
  movement = delta > .035 ? 'forward' : delta < -.035 ? 'backward' : 'stay';
  movementIndicator.dataset.direction = playing ? movement : 'stay';
  movementIndicator.textContent = playing ? movement === 'forward' ? '順位：前進中 ↗' : movement === 'backward' ? '順位：後退中 ↙' : '順位：維持' : '再生待ち';
  if (!playing) message.textContent = '再生すると、時間の経過とともにベルトの流れも速くなります。';
  else if (you.progress > .83) message.textContent = '1位圏ではベルトが最速です。時間が経つほど、さらに前進が難しくなります。';
  else if (you.progress > .77 && movement !== 'forward') message.textContent = `上位${formatRank(Math.ceil(scaleBreaks().topBarrier))}圏です。ベルトが急に速くなり、これまでのペースでは前進できません。`;
  else if (movement === 'forward') message.textContent = '順位は前進中です。ただし時間の経過とともに、ベルトの流れも速くなります。';
  else if (movement === 'backward') message.textContent = '順位は後退中です。今いる位置のベルト速度が、あなたのペースを上回っています。';
  else message.textContent = 'いまは流れとほぼ同じペースです。順位は維持されます。';
}
function adjustPace(delta) {
  const minimum = Number(paceInput.min);
  const maximum = Number(paceInput.max);
  const next = Math.max(minimum, Math.min(maximum, Number((Number(paceInput.value) + delta).toFixed(2))));
  paceInput.value = String(next);
  updateUI();
}
function reset() {
  runners.find(runner => runner.you).progress = progressFromRank(Number(startRankInput.value));
  paceInput.value = 1;
  elapsed = 0;
  movement = 'stay';
  playing = false;
  playButton.setAttribute('aria-pressed', 'false'); playButton.innerHTML = '<span class="play-icon">▶</span><span>再生</span>';
  updateUI();
}
function selectStartRank(rank) {
  const value = String(rank);
  if (![...startRankInput.options].some(option => option.value === value)) {
    const option = new Option(formatRank(rank), value);
    startRankInput.add(option, 0);
  }
  startRankInput.value = value;
}
function rebuildStartRankOptions(useDeviationLabels) {
  const selectedRank = Number(startRankInput.value);
  const choices = useDeviationLabels
    ? deviationStartOptions.map(deviation => ({ value: rankFromDeviation(deviation), label: `偏差値 ${deviation}` }))
    : rankStartOptions.filter(rank => rank <= totalCompetitors).map(rank => ({ value: rank, label: formatRank(rank) }));
  if (!choices.some(choice => choice.value === selectedRank)) choices.push({ value: Math.min(selectedRank, totalCompetitors), label: useDeviationLabels ? `偏差値 ${deviationFromRank(selectedRank).toFixed(1)}` : formatRank(Math.min(selectedRank, totalCompetitors)) });
  choices.sort((a, b) => b.value - a.value);
  startRankInput.replaceChildren(...choices.map(choice => new Option(choice.label, String(choice.value), false, choice.value === selectedRank)));
  startRankInput.previousElementSibling.textContent = useDeviationLabels ? '開始位置（偏差値）' : '開始位置';
}
function tick(now) {
  const dt = Math.min((now - lastTime) / 1000, .05); lastTime = now;
  const you = runners.find(runner => runner.you);
  if (playing) {
    elapsed += dt;
    const belt = beltSpeedAt(you.progress);
    beltPhase += belt * dt * 150;
    you.progress += (Number(paceInput.value) - belt) * dt * .095;
    you.progress = Math.max(.001, Math.min(.995, you.progress));
    updateUI();
  }
  draw(now / 1000); requestAnimationFrame(tick);
}
playButton.addEventListener('click', () => { playing = !playing; playButton.setAttribute('aria-pressed', String(playing)); playButton.innerHTML = playing ? '<span class="play-icon">Ⅱ</span><span>一時停止</span>' : '<span class="play-icon">▶</span><span>再生</span>'; });
paceInput.min = '0'; paceInput.max = '3.2'; paceInput.step = '.01'; paceInput.value = '1';
paceInput.addEventListener('input', updateUI);
paceDownButton.addEventListener('click', () => adjustPace(-.05));
paceUpButton.addEventListener('click', () => adjustPace(.05));
startRankInput.addEventListener('change', reset);
totalCompetitorsInput.addEventListener('change', () => {
  const currentRank = rankFromProgress(runners.find(runner => runner.you).progress);
  totalCompetitors = Number(totalCompetitorsInput.value);
  const nextRank = Math.min(currentRank, totalCompetitors);
  rebuildStartRankOptions(showDeviation);
  runners.find(runner => runner.you).progress = progressFromRank(nextRank);
  updateUI();
});
deviationToggle.addEventListener('change', () => { showDeviation = deviationToggle.checked; rebuildStartRankOptions(showDeviation); updateUI(); });
resetButtons.forEach(button => button.addEventListener('click', reset));
gradeButtons.forEach(button => button.addEventListener('click', () => { grade = Number(button.dataset.grade); gradeButtons.forEach(item => item.classList.toggle('selected', item === button)); updateUI(); }));
rebuildStartRankOptions(false); reset(); requestAnimationFrame(tick);
