import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const labs = [
  ["air-resistance", "空気抵抗と終端速度", "力学", "抗力・落下・終端速度", "重力、速度比例抵抗、終端速度、落下運動", "質量と抗力係数を変え、落下速度が終端速度へ近づく過程を確認する。"],
  ["coupled-pulley-dynamics", "連結物体と滑車の運動", "力学", "張力・加速度・連結条件", "2物体の運動方程式、糸の張力、加速度拘束", "アトウッドの装置で質量差と加速度・張力の関係を確認する。"],
  ["conical-pendulum", "円錐振り子", "力学", "張力・向心力・角速度", "円錐振り子、鉛直成分、向心力、周期", "糸の長さと角度から回転半径・張力・周期を確認する。"],
  ["non-inertial-frame", "非慣性系と見かけの力", "力学", "加速する乗り物・見かけの重力", "慣性力、加速度系、有効重力、つり合い角", "加速する車内で物体や振り子が傾く理由を可視化する。"],
  ["banked-curve", "バンクした道路と円運動", "力学", "向心力・摩擦・設計速度", "バンク角、向心力、設計速度、摩擦限界", "カーブ半径と傾斜角から摩擦なしで曲がれる速度を求める。"],
  ["rolling-motion", "転がり運動", "力学", "並進・回転・エネルギー分配", "転がり条件、慣性モーメント、並進・回転エネルギー", "形状による斜面加速度とエネルギー分配の違いを比較する。"],
  ["angular-momentum", "角運動量保存", "力学", "回転半径・慣性モーメント・角速度", "角運動量保存、慣性モーメント、回転運動エネルギー", "回転する人が腕を縮めたとき角速度が増す関係を確認する。"],
  ["rigid-equilibrium", "剛体のつり合い", "力学", "力のモーメント・支点反力", "力のつり合い、モーメントのつり合い、支点反力", "梁上の荷重位置を動かし、左右の支点反力を求める。"],
  ["kepler-orbit", "ケプラー運動と人工衛星", "力学", "楕円軌道・面積速度・軌道周期", "万有引力、ケプラーの法則、円・楕円軌道", "長半径と離心率を変え、速度と面積速度の変化を確認する。"],

  ["thermal-conduction", "熱伝導", "熱", "温度勾配・熱流・複合壁", "フーリエの法則、熱伝導率、定常熱流", "材料と厚さを変え、温度分布と熱流率を比較する。"],
  ["newton-cooling", "ニュートンの冷却則", "熱", "周囲温度・時定数・冷却曲線", "ニュートンの冷却則、指数関数、時定数", "物体温度が周囲温度へ指数関数的に近づく過程を確認する。"],
  ["thermal-expansion", "熱膨張とバイメタル", "熱", "線膨張・曲がり・温度差", "線膨張、体膨張、バイメタル", "温度変化による棒の伸びとバイメタルの曲がりを可視化する。"],
  ["phase-diagram", "相図と相変化", "熱", "圧力・温度・三重点", "相図、融解曲線、蒸発曲線、三重点、臨界点", "温度と圧力を動かし、固体・液体・気体の領域を確認する。"],
  ["brownian-diffusion", "ブラウン運動と拡散", "熱", "熱運動・拡散係数・平均二乗変位", "ブラウン運動、拡散、平均二乗変位", "温度と粒子半径による拡散の速さの違いを観察する。"],
  ["entropy-process", "エントロピーと不可逆過程", "熱", "可逆・不可逆・熱の移動", "エントロピー変化、熱移動、不可逆性", "異なる温度の物体が平衡へ向かうと全エントロピーが増えることを確かめる。"],

  ["convex-lens", "凸レンズの像", "波動", "焦点距離・物体距離・実像と虚像", "薄レンズの式、倍率、実像・虚像", "物体を動かし、像の位置・向き・大きさを作図と式で確認する。"],
  ["spherical-mirror", "球面鏡の像", "波動", "凹面鏡・凸面鏡・光線作図", "球面鏡の式、焦点距離、倍率", "鏡の種類と物体距離を変え、像の性質を確認する。"],
  ["prism-dispersion", "プリズムと光の分散", "波動", "屈折率・波長・偏角", "スネルの法則、分散、プリズムの偏角", "波長による屈折率の違いから白色光が分かれる様子を観察する。"],
  ["polarization", "光の偏光", "波動", "偏光板・検光子・マリュスの法則", "偏光、マリュスの法則、透過光強度", "2枚の偏光板の角度と透過光強度の関係を確認する。"],
  ["sound-intensity", "音の強さとデシベル", "波動", "距離・強さ・音圧レベル", "逆二乗則、音の強さ、デシベル", "音源からの距離と音源数が音圧レベルへ与える影響を確認する。"],
  ["forced-resonance", "強制振動と共振", "波動", "駆動振動数・減衰・共振曲線", "強制振動、共振、減衰、位相差", "外力の振動数を変え、振幅と位相の共振応答を確認する。"],
  ["wave-packet", "波束と群速度", "波動", "重ね合わせ・位相速度・群速度", "波束、位相速度、群速度、分散", "近い波数の波を重ね、包絡線と内部波の進み方を比較する。"],
  ["wave-transmission", "境界面での反射と透過", "波動", "波のインピーダンス・振幅係数", "反射係数、透過係数、波のインピーダンス", "媒質の違いにより反射波の位相と透過エネルギーが変わることを確認する。"],

  ["rc-circuit", "RC回路の充電と放電", "電磁気", "時定数・電荷・電流", "RC回路、指数関数、時定数、充電・放電", "抵抗と容量を変え、電圧と電流の時間変化を確認する。"],
  ["lr-circuit", "LR回路と自己誘導", "電磁気", "時定数・逆起電力・電流", "自己誘導、LR回路、時定数、磁気エネルギー", "コイル電流が急に変化できない理由を時間変化から確認する。"],
  ["transformer", "変圧器", "電磁気", "巻数比・電圧・電流・電力", "相互誘導、巻数比、理想変圧器、効率", "一次・二次巻数と負荷から電圧・電流・電力を求める。"],
  ["magnetic-field-current", "電流がつくる磁場", "電磁気", "直線電流・円形電流・ソレノイド", "ビオ・サバールの法則、アンペールの法則", "導線形状と電流から磁場の向きと大きさを比較する。"],
  ["parallel-current-force", "平行電流間の力", "電磁気", "電流の向き・距離・単位長さ当たりの力", "平行電流、磁場、アンペール力", "同方向電流が引き合い、逆方向電流が反発することを確認する。"],
  ["motional-emf", "導体棒の電磁誘導", "電磁気", "運動起電力・レール・レンツの法則", "運動起電力、ローレンツ力、誘導電流、磁気抵抗力", "磁場中を動く導体棒の起電力・電流・力を確認する。"],
  ["velocity-selector", "速度選別器", "電磁気", "電場・磁場・直進条件", "電気力、ローレンツ力、速度選別", "直進条件v=E/Bと速度が外れた粒子の偏向を確認する。"],
  ["mass-spectrometer", "質量分析器", "電磁気", "加速電圧・磁場・軌道半径", "荷電粒子の加速、磁場中の円運動、質量電荷比", "同位体の質量差が軌道半径の差として現れることを確認する。"],
  ["cyclotron", "サイクロトロン", "電磁気", "高周波加速・周期・最大エネルギー", "サイクロトロン、磁場中の円運動、高周波加速", "粒子が電極間を通るたびに加速され、軌道が広がる様子を観察する。"],
  ["hall-effect", "ホール効果", "電磁気", "キャリア符号・ホール電圧", "ホール効果、ローレンツ力、キャリア密度", "電流と磁場からホール電圧を求め、キャリアの符号を判定する。"],
  ["internal-resistance", "電池の内部抵抗", "電磁気", "端子電圧・最大電力・負荷", "起電力、内部抵抗、端子電圧、最大電力", "負荷抵抗を変え、端子電圧と取り出せる電力の関係を確認する。"],
  ["wheatstone-bridge", "ホイートストンブリッジ", "電磁気", "平衡条件・未知抵抗・検流計", "ホイートストンブリッジ、電位差、平衡条件", "抵抗比を調整し、検流計電流が0になる条件から未知抵抗を求める。"],

  ["rutherford-scattering", "ラザフォード散乱", "原子", "クーロン反発・衝突径数・散乱角", "クーロン散乱、衝突径数、散乱角", "α粒子の入射位置とエネルギーから散乱角を確認する。"],
  ["electron-diffraction", "物質波と電子回折", "原子", "ド・ブロイ波長・加速電圧・回折環", "物質波、ド・ブロイ波長、電子回折", "加速電圧と結晶面間隔から電子の波長と回折角を求める。"],
  ["xray-bragg", "X線とブラッグ反射", "原子", "格子間隔・波長・回折角", "ブラッグの条件、X線回折、結晶構造", "X線波長と格子間隔を変え、強め合う角度を確認する。"],
  ["compton-scattering", "コンプトン効果", "原子", "光子の運動量・散乱角・波長変化", "コンプトン効果、光子の運動量、エネルギー・運動量保存", "散乱角によるX線の波長変化と電子の反跳を確認する。"],
  ["binding-energy-curve", "原子核の結合エネルギー曲線", "原子", "質量数・核子当たり結合エネルギー", "結合エネルギー、質量欠損、核分裂・核融合", "鉄付近で核子当たり結合エネルギーが最大になることを確認する。"],
  ["fission-chain-reaction", "核分裂連鎖反応", "原子", "中性子増倍率・臨界・世代", "核分裂、連鎖反応、中性子増倍率、臨界", "増倍率により反応が減衰・一定・増大する違いを確認する。"],
  ["radiation-shielding", "放射線の透過と遮蔽", "原子", "半価層・吸収係数・材質", "指数減衰、吸収係数、半価層、遮蔽", "放射線の種類と遮蔽材・厚さから透過率を比較する。"]
];

const html = lab => `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${lab[1]}シミュレータ</title><link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E"><link rel="stylesheet" href="../../assets/common-sim.css"><link rel="stylesheet" href="../../assets/physics-lab.css"><script src="../../assets/sim-shell.js"></script></head><body><script>PhysicsSimShell.create({title:${JSON.stringify(lab[1])},subtitle:${JSON.stringify(lab[3])},basePath:'../../'});</script><main id="physics-lab-root"></main><script>window.PHYSICS_LAB_ID=${JSON.stringify(lab[0])};</script><script src="../../assets/physics-lab-next.js"></script></body></html>\n`;

for (const lab of labs) {
  const dir = path.join(root, "simulators", lab[0]);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html(lab));
}

const catalogPath = path.join(root, "data", "simulators.json");
const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
const ids = new Set(labs.map(lab => lab[0]));
const kept = catalog.filter(item => !ids.has(item.id));
const additions = labs.map(([id, title, category, , physicsModel, purpose]) => ({
  id,
  title,
  category,
  route: `./simulators/${id}/`,
  originalSource: "new-simulator-2026-08-24-wave-2",
  alternateSources: [],
  status: "初版作成",
  dependencies: [],
  physicsModel,
  purpose,
  lastReviewed: "2026-08-24"
}));

const next = [...kept, ...additions];
const unique = new Set(next.map(item => item.id));
if (unique.size !== next.length) throw new Error("simulator id is duplicated");
fs.writeFileSync(catalogPath, `${JSON.stringify(next, null, 2)}\n`);
console.log(`Generated ${labs.length} pages; catalog now has ${next.length} entries.`);
