(function () {
  class FixedStepClock {
    constructor(options) {
      this.step = options?.step ?? 1 / 120;
      this.maxFrameTime = options?.maxFrameTime ?? 0.1;
      this.maxStepsPerFrame = options?.maxStepsPerFrame ?? 12;
      this.onStep = options?.onStep ?? function () {};
      this.onRender = options?.onRender ?? function () {};
      this.running = false;
      this.accumulator = 0;
      this.lastTime = 0;
      this.frameId = 0;
      this.tick = this.tick.bind(this);
    }

    start() {
      if (this.running) return;
      this.running = true;
      this.accumulator = 0;
      this.lastTime = performance.now();
      this.frameId = requestAnimationFrame(this.tick);
    }

    pause() {
      this.running = false;
      if (this.frameId) {
        cancelAnimationFrame(this.frameId);
        this.frameId = 0;
      }
    }

    reset() {
      this.accumulator = 0;
      this.lastTime = performance.now();
    }

    tick(now) {
      if (!this.running) return;

      const elapsed = Math.min((now - this.lastTime) / 1000, this.maxFrameTime);
      this.lastTime = now;
      this.accumulator += elapsed;

      let steps = 0;
      while (this.accumulator >= this.step && steps < this.maxStepsPerFrame) {
        this.onStep(this.step);
        this.accumulator -= this.step;
        steps += 1;
      }
      if (steps === this.maxStepsPerFrame) {
        this.accumulator = 0;
      }

      this.onRender(this.accumulator / this.step);
      this.frameId = requestAnimationFrame(this.tick);
    }
  }

  window.PhysicsSimClock = {
    FixedStepClock
  };
})();
