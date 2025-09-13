// === p5 繪圖層：依賴 FrictionSim，但不碰物理公式 ===

(function (global) {
    'use strict';

    // 視覺比例（只在繪圖，用不到物理）
    let pixelsPerMeter = 90;       // 1 m = 90 px
    let forcePixelsPerNewton = 6;  // 1 N = 6 px
    let accTime = 0;

    // 影像資產
    let imgBg;            // 背景圖
    let imgGround;        // 地面圖
    let blockTex = {};    // 方塊貼圖表（依質量挑圖）

    // 載入圖片（檔名先用 placeholder）
    function preload() {
        // 你可以換成自己的路徑，例如 "assets/bg.png" 等
        imgBg = loadImage('image/background.jpg');
        imgGround = loadImage('image/table.png');

        // 依質量區間提供兩種示意材質（可以自由增減）
        blockTex.wood = loadImage('image/block-wood.png');
        blockTex.metal = loadImage('image/block-metal.png');
    }

    function setup() {
        createCanvas(windowWidth, windowHeight);
        pixelDensity(Math.min(displayDensity(), 2));
        rectMode(CENTER);
        strokeCap(SQUARE);
        noSmooth();

        // 用中心對齊較易畫出等比圖
        imageMode(CENTER);
    }

    function draw() {
        // 固定步長積分：用 p5 的 deltaTime 來累積
        const dt = Math.min(50, deltaTime) / 1000;
        const st = FrictionSim.getState();
        if (!st.paused) {
            accTime += dt;
            const fixedDt = FrictionSim.getFixedDt();
            while (accTime >= fixedDt) {
                FrictionSim.step(fixedDt);
                accTime -= fixedDt;
            }
        }

        renderScene();
    }

    function windowResized() {
        // 視窗改變時，微調箭頭比例
        resizeCanvas(windowWidth, windowHeight);
        forcePixelsPerNewton = constrain(Math.round(width / 160), 3, 10);
    }

    // --- 繪圖 ---
    function renderScene() {
        const w = width, h = height;

        // 繪製背景：維持滿版不留黑邊（cover）
        if (imgBg) {
            const bgAR = imgBg.width / imgBg.height;
            const canvasAR = w / h;
            let drawW, drawH;
            if (canvasAR > bgAR) {
                // 畫布較寬 => 以寬為基準
                drawW = w;
                drawH = w / bgAR;
            } else {
                // 畫布較高 => 以高為基準
                drawH = h;
                drawW = h * bgAR;
            }
            image(imgBg, w * 0.5, h * 0.5, drawW, drawH);
        }

        // 繪製地面
        // 你原本應該有一條「地面線」的 y 值，這裡沿用。若沒有，給一個靠下的預設值。
        const groundY = h - 80;
        if (imgGround) {
            // 以畫布寬度鋪一條帶狀，地面圖高度可自由設定（這裡用原圖高或自訂厚度）
            const groundStripH = imgGround.height * 0.8;
            const groundStripW = w + 60;
            const offsetY = -50;
            // 用 CENTER 對齊，讓圖的中心落在 (w/2, groundY + groundStripH/2)
            image(imgGround, w * 0.5, groundY + offsetY + groundStripH * 0.5, groundStripW - 200 + 2, groundStripH, 100, 0, imgGround.width - 200, imgGround.height);
            image(imgGround, w * 0.5 + groundStripW * 0.5 - 50, groundY + offsetY + groundStripH * 0.5, 100, groundStripH, imgGround.width - 100, 0, 100, imgGround.height);
            image(imgGround, w * 0.5 - groundStripW * 0.5 + 50, groundY + offsetY + groundStripH * 0.5, 100, groundStripH, 0, 0, 100, imgGround.height);
        } else {
            // [FALLBACK] 若地面圖未載到，退回原本的線條畫法
            stroke(60); strokeWeight(2);
            line(0, groundY, w, groundY);
        }

        // 繪製方塊
        const st = FrictionSim.getState();
        const scale = getBlockScale(FrictionSim.getMass());

        const boxW_m = 1.6 * scale, boxH_m = 1.28 * scale;
        const boxW = boxW_m * pixelsPerMeter;
        const boxH = boxH_m * pixelsPerMeter;

        const cx0 = w * 0.5;
        const cx = cx0 + st.x * pixelsPerMeter;
        const cy = groundY - boxH / 2;

        const tex = getBlockTex(FrictionGui.getMaterial());
        if (tex) {
            // 以圖片等比塞入方塊框
            const texAR = tex.width / tex.height;
            const blockAR = boxW / boxH;
            let drawW, drawH;

            // 這裡用「contain」（完整顯示貼圖，留邊）：
            if (blockAR > texAR) {
                drawH = boxH;
                drawW = drawH * texAR;
            } else {
                drawW = boxW;
                drawH = drawW / texAR;
            }
            image(tex, cx, cy, drawW, drawH);
        } else {
            // [FALLBACK] 若沒載到貼圖，退回方塊外框
            fill("#213241"); stroke("#99b6c9"); strokeWeight(2);
            rect(cx, cy, boxW, boxH, 10);
        }

        // 計算箭頭長度的公式
        const L = (F) => F * forcePixelsPerNewton;
        const N = (F) => F * forcePixelsPerNewton * 0.25;

        if (FrictionGui.showForces()) {
            // 施力 F_app — 紅
            drawArrow(cx, cy, cx + L(st.forces.applied), cy, '#dc3c3c');

            // 重力 mg — 黑
            drawArrow(cx, cy, cx, cy + N(st.forces.gravity), '#202020');

            // 正向力 N — 綠
            drawArrow(cx, cy, cx, cy - N(st.forces.normal), '#28c878');
        }

        if (FrictionGui.showFrictions()) {
            // 靜摩擦 — 深藍（可能為 0）
            if (Math.abs(st.forces.staticFric) > 1e-8) {
                drawArrow(cx, cy + boxH / 2 - 3, cx + L(st.forces.staticFric), cy + boxH / 2 - 3, '#3c8cff');
            }

            // 動摩擦 — 淺藍（可能為 0）
            if (Math.abs(st.forces.kineticFric) > 1e-8) {
                drawArrow(cx, cy + boxH / 2 - 3, cx + L(st.forces.kineticFric), cy + boxH / 2 - 3, '#bed6ee');
            }
        }
    }

    function drawArrow(x0, y0, x1, y1, col) {
        const dx = x1 - x0, dy = y1 - y0;
        const len = Math.hypot(dx, dy) || 1;
        const ux = dx / len, uy = dy / len;

        const head = constrain(len * 0.18, 8, 16);
        const bx = x1 - ux * head, by = y1 - uy * head;

        stroke(col); fill(col); strokeWeight(3);
        line(x0, y0, bx, by);

        const side = head * 0.4;
        triangle(
            x1, y1,
            bx - uy * side, by + ux * side,
            bx + uy * side, by - ux * side
        );
    }

    function getBlockScale(mass) {
        if (mass > 5) return 1.26;
        return 1;
    }

    function getBlockTex(name) {
        if (name == 'metal') return blockTex.metal;
        return blockTex.wood;
    }

    // ---- 對外 API ----
    const api = {
        getPixelsPerMeter: () => pixelsPerMeter,

        preload,
        setup,
        draw,
        windowResized
    };
    global.FrictionRenderer = api;
})(typeof window !== "undefined" ? window : globalThis);

// ---- 橋接 p5.js  ---- 
function preload() {
    FrictionRenderer.preload();
}

function setup() {
    FrictionRenderer.setup();
}

function draw() {
    FrictionRenderer.draw();
}

function windowResized() {
    FrictionRenderer.windowResized();
}
