(function () {
  function resolveBasePath() {
    const script = document.currentScript;
    const src = script?.getAttribute("src") ?? "";
    if (!src) return "../../";
    return new URL("../../", new URL(src, window.location.href)).pathname;
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

  window.PhysicsSimShell = {
    create: createShell
  };
})();
