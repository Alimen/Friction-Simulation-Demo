// === FrictionSim: 物理模擬核心（不依賴 p5） ===
(function (global) {
    // ---- 可調參數（之後可由 UI 覆寫） ----
    let mass = 5.0;          // kg
    let g = 9.8;             // m/s^2
    let muS = 0.6;           // 靜摩擦
    let muK = 0.45;          // 動摩擦
    let appliedForceX = 12;  // N

    let x0 = 0.0;            // 初始位置 (m)
    let v0 = 0.0;            // 初始速度 (m/s)

    // 固定步長（由渲染層決定何時呼叫 step）
    let fixedDt = 1 / 120;

    // ---- 模擬狀態 ----
    const state = {
        t: 0,
        x: x0,
        v: v0,
        a: 0,
        fric: 0,
        fTotal: 0,
        forces: { applied: 0, gravity: 0, normal: 0, staticFric: 0, kineticFric: 0 },
        paused: false
    };

    // ---- 物理步進（半隱式歐拉）----
    function step(dt) {
        const N = mass * g;
        const mg = mass * g;
        const Fapp = appliedForceX;

        const epsV = 1e-4;
        let F_s = 0, F_k = 0, ax = 0;
        const FsMax = muS * N;
        let fric = 0, fTotal = 0;

        if (Math.abs(state.v) < epsV && Math.abs(Fapp) <= FsMax) {
            // 靜摩擦：抵銷外力
            F_s = -Fapp;
            ax = 0;
            fric = F_s;
        } else {
            // 動摩擦：與速度（或外力）方向相反
            const dir = (Math.abs(state.v) >= epsV) ? Math.sign(state.v)
                : (Fapp !== 0 ? Math.sign(Fapp) : 0);
            F_k = -muK * N * dir;
            const Fnet = Fapp + F_k;
            ax = Fnet / mass;
            fric = F_k;
            fTotal = Fnet;
        }

        state.v += ax * dt;
        state.x += state.v * dt;
        state.a = ax;
        state.fric = fric;
        state.fTotal = fTotal;

        state.forces.applied = Fapp;
        state.forces.gravity = mg;
        state.forces.normal = N;
        state.forces.staticFric = F_s;
        state.forces.kineticFric = F_k;
        state.t += dt;

        // 計算兩側截止點
        const physicalWidth = windowWidth / pixelsPerMeter;
        if (state.x > physicalWidth * 0.5 - 1) { state.x = physicalWidth * 0.5 - 1; state.v = 0; }
        if (state.x < -physicalWidth * 0.5 + 1) { state.x = -physicalWidth * 0.5 + 1; state.v = 0; }
    }

    // ---- 對外 API ----
    const api = {
        // 狀態與時間步長
        getState: () => state,
        getFixedDt: () => fixedDt,
        setFixedDt: (dt) => { fixedDt = Math.max(1 / 1000, +dt || fixedDt); },

        // 參數 setter（方便 UI 接入）
        setMass: (m) => { mass = Math.max(0.001, +m); },
        setMuS: (v) => { muS = Math.max(0, +v); },
        setMuK: (v) => { muK = Math.max(0, +v); },
        setG: (v) => { g = Math.max(0, +v); },
        setAppliedForce: (fx) => { appliedForceX = +fx; },

        // 控制
        pause: (p = true) => { state.paused = !!p; },
        resume: () => { state.paused = false; },
        reset: () => { state.t = 0; state.x = x0; state.v = v0; state.a = 0; },

        // Debug
        getMass: () => mass,
        getMuS: () => muS,

        // 步進（通常由渲染層固定頻率呼叫）
        step
    };
    global.FrictionSim = api;
})(typeof window !== "undefined" ? window : globalThis);
