// === 處理控制面板的折疊動畫，不牽涉任何物理或輸入邏輯 ===
// 使用 <details> 原生可折疊元素，這裡加上一點高度動畫糖衣。

(function () {
  /** 讓 details 的內容有平滑開闔動畫 */
  function animateDetails(details) {
    const body = details.querySelector('.card-body');
    if (!body) return;

    // 初始：若為收合狀態，將內容高度視為 0（用 CSS Grid 的 row 技巧）
    if (!details.open) {
      body.style.gridTemplateRows = '0fr';
    }

    details.addEventListener('toggle', () => {
      // 使用 requestAnimationFrame 確保樣式計算順序
      if (details.open) {
        // 展開
        requestAnimationFrame(() => {
          body.style.gridTemplateRows = '1fr';
        });
      } else {
        // 收合
        requestAnimationFrame(() => {
          body.style.gridTemplateRows = '0fr';
        });
      }
    });
  }

  document.querySelectorAll('details.info-card').forEach(animateDetails);
})();

