const categoryOrder = ["力学", "波動", "熱", "天体", "数学補助"];

const categoryLabels = new Map([
  ["力学", "力学"],
  ["波動", "波動"],
  ["熱", "熱"],
  ["天体", "天体"],
  ["数学補助", "数学補助"]
]);

const listRoot = document.querySelector("[data-simulator-list]");
const countNode = document.querySelector("[data-simulator-count]");
const reviewedNode = document.querySelector("[data-last-reviewed]");

function createCard(simulator) {
  const card = document.createElement("a");
  card.className = "sim-card";
  card.href = simulator.route;
  card.dataset.simulatorId = simulator.id;

  const body = document.createElement("div");
  const title = document.createElement("h3");
  title.textContent = simulator.title;
  const purpose = document.createElement("p");
  purpose.textContent = simulator.purpose;
  body.append(title, purpose);

  const meta = document.createElement("div");
  meta.className = "meta";

  const status = document.createElement("span");
  status.className = "status";
  status.textContent = simulator.status;
  meta.append(status);

  const sourceCount = document.createElement("span");
  const alternateCount = simulator.alternateSources?.length ?? 0;
  sourceCount.textContent = `${alternateCount + 1} file${alternateCount ? "s" : ""}`;
  meta.append(sourceCount);

  if (simulator.dependencies?.length) {
    const deps = document.createElement("span");
    deps.textContent = `外部依存 ${simulator.dependencies.length}`;
    meta.append(deps);
  }

  card.append(body, meta);
  return card;
}

function renderCategory(category, simulators) {
  const section = document.createElement("section");
  section.className = "section";

  const shell = document.createElement("div");
  shell.className = "shell";

  const heading = document.createElement("h2");
  heading.textContent = categoryLabels.get(category) ?? category;

  const grid = document.createElement("div");
  grid.className = "grid";
  simulators.forEach((simulator) => grid.append(createCard(simulator)));

  shell.append(heading, grid);
  section.append(shell);
  return section;
}

function renderSimulators(simulators) {
  const grouped = new Map();
  simulators.forEach((simulator) => {
    const group = grouped.get(simulator.category) ?? [];
    group.push(simulator);
    grouped.set(simulator.category, group);
  });

  listRoot.replaceChildren();
  categoryOrder.forEach((category) => {
    const group = grouped.get(category);
    if (group?.length) {
      listRoot.append(renderCategory(category, group));
    }
  });

  [...grouped.keys()]
    .filter((category) => !categoryOrder.includes(category))
    .sort()
    .forEach((category) => listRoot.append(renderCategory(category, grouped.get(category))));

  countNode.textContent = `${simulators.length}件`;
  const lastReviewed = simulators
    .map((simulator) => simulator.lastReviewed)
    .filter(Boolean)
    .sort()
    .at(-1);
  reviewedNode.textContent = lastReviewed ?? "未確認";
}

async function loadSimulators() {
  try {
    const response = await fetch("./data/simulators.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to load simulator metadata: ${response.status}`);
    }
    const simulators = await response.json();
    renderSimulators(simulators);
  } catch (error) {
    console.error(error);
    listRoot.textContent = "シミュレータ一覧を読み込めませんでした。ローカルサーバー経由で開いてください。";
    listRoot.classList.add("load-error");
  }
}

loadSimulators();
