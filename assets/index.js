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
const versionButtons = [...document.querySelectorAll("[data-version-mode]")];

let preferredVersion = localStorage.getItem("simulatorPreferredVersion") || "re";

function setPreferredVersion(version, simulators = []) {
  preferredVersion = version;
  localStorage.setItem("simulatorPreferredVersion", version);
  versionButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.versionMode === version);
  });
  if (simulators.length) {
    renderSimulators(simulators);
  }
}

function createCard(simulator) {
  const card = document.createElement("article");
  card.className = "sim-card";
  card.dataset.simulatorId = simulator.id;
  card.dataset.hasRe = simulator.reRoute ? "true" : "false";

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

  const reStatus = document.createElement("span");
  reStatus.className = simulator.reRoute ? "re-status is-ready" : "re-status";
  reStatus.textContent = simulator.reRoute ? (simulator.reStatus ?? "リメイク版あり") : "リメイク準備中";
  meta.append(reStatus);

  const sourceCount = document.createElement("span");
  const alternateCount = simulator.alternateSources?.length ?? 0;
  sourceCount.textContent = `${alternateCount + 1} file${alternateCount ? "s" : ""}`;
  meta.append(sourceCount);

  if (simulator.dependencies?.length) {
    const deps = document.createElement("span");
    deps.textContent = `外部依存 ${simulator.dependencies.length}`;
    meta.append(deps);
  }

  const actions = document.createElement("div");
  actions.className = "card-actions";

  const originalLink = document.createElement("a");
  originalLink.className = "variant-link";
  originalLink.href = simulator.route;
  originalLink.textContent = "元版";

  if (simulator.reRoute) {
    const reLink = document.createElement("a");
    reLink.className = "variant-link";
    reLink.href = simulator.reRoute;
    reLink.textContent = "リメイク版";

    const primary = preferredVersion === "re" ? reLink : originalLink;
    primary.classList.add("is-primary");
    actions.append(preferredVersion === "re" ? reLink : originalLink);
    actions.append(preferredVersion === "re" ? originalLink : reLink);
  } else {
    originalLink.classList.add("is-primary");
    const pending = document.createElement("span");
    pending.className = "variant-note";
    pending.textContent = "リメイク準備中";
    actions.append(originalLink, pending);
  }

  card.append(body, meta, actions);
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
    versionButtons.forEach((button) => {
      button.addEventListener("click", () => setPreferredVersion(button.dataset.versionMode, simulators));
    });
    setPreferredVersion(preferredVersion, []);
    renderSimulators(simulators);
  } catch (error) {
    console.error(error);
    listRoot.textContent = "シミュレータ一覧を読み込めませんでした。ローカルサーバー経由で開いてください。";
    listRoot.classList.add("load-error");
  }
}

loadSimulators();
