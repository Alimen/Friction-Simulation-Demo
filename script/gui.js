// gui.js
(function (global) {
    'use strict';

    // DOM 快取
    const massSel = document.querySelector('#mass');
    const matSel = document.querySelector('#mat');

    const forceRange = document.querySelector('#force');
    const forceValLabel = document.querySelector('#forceVal');

    const chkShowFrictions = document.querySelector('#showFrictions');
    const chkShowForces = document.querySelector('#showForces');
    const resetBtn = document.querySelector("#reset");

    const arrowForce = document.querySelector('#arrow-force');
    const arrowNormal = document.querySelector('#arrow-normal');
    const arrowGravity = document.querySelector('#arrow-gravity');
    const arrowStatic = document.querySelector('#arrow-static');
    const arrowDynamic = document.querySelector('#arrow-dynamic');

    const fricVal = document.querySelector('#fricVal');
    const netVal = document.querySelector('#netVal');
    const accVal = document.querySelector('#accVal');

    // 材質對應表
    const materialTable = {
        wood: { muS: 0.4, muK: 0.3 },
        metal: { muS: 0.3, muK: 0.2 }
    };

    // 外部取值 API
    const api = {
        getMass: () => Number(massSel.value),
        getMaterial: () => matSel.value,
        showFrictions: () => chkShowFrictions.checked,
        showForces: () => chkShowForces.checked
    };
    global.FrictionGui = api;

    // 初始化
    function init() {
        FrictionSim.setG(10);

        // 設定初始質量
        FrictionSim.setMass(parseFloat(massSel.value));

        // 設定初始摩擦係數
        const mat = materialTable[matSel.value];
        FrictionSim.setMuS(mat.muS);
        FrictionSim.setMuK(mat.muK);

        // 初始施力
        const f = parseFloat(forceRange.value);
        FrictionSim.setAppliedForce(f);
        forceValLabel.textContent = `${f} N`;
    }

    // 綁定事件
    function bindEvents() {
        massSel.addEventListener('change', () => {
            FrictionSim.setMass(parseFloat(massSel.value));
        });

        matSel.addEventListener('change', () => {
            const mat = materialTable[matSel.value];
            FrictionSim.setMuS(mat.muS);
            FrictionSim.setMuK(mat.muK);
        });

        forceRange.addEventListener('input', () => {
            const f = parseFloat(forceRange.value);
            FrictionSim.setAppliedForce(f);
            forceValLabel.textContent = `${f} N`;
        });

        chkShowFrictions.addEventListener('change', () => {
            const show = chkShowFrictions.checked;
            arrowStatic.hidden = !show;
            arrowDynamic.hidden = !show;
        });

        chkShowForces.addEventListener('change', () => {
            const show = chkShowForces.checked;
            arrowForce.hidden = !show
            arrowNormal.hidden = !show;
            arrowGravity.hidden = !show;
        });

        resetBtn.addEventListener('click', () => {
            FrictionSim.reset();
        });
    }

    // 更新即時數值
    function updateStats() {
        const s = FrictionSim.getState();
        fricVal.textContent = s.fric.toFixed(2);
        netVal.textContent = s.fTotal.toFixed(2);
        accVal.textContent = s.a.toFixed(2);
        requestAnimationFrame(updateStats);
    }

    // 啟動
    window.addEventListener('DOMContentLoaded', () => {
        init();
        bindEvents();
        updateStats();
        FrictionSim.resume();
    });
})(typeof window !== "undefined" ? window : globalThis);
