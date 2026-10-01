const fs = require('fs');
const path = require('path');

const cssPath = path.resolve(__dirname, '../dashboard/src/index.css');
let content = fs.readFileSync(cssPath, 'utf8');

const layoutRules = `
/* ==========================================================================
   PRIMARY TERMINAL ROW & PAGE LAYOUT (CRITICAL FLEXBOX DOCKING)
   ========================================================================== */
.app-content-row {
  display: flex !important;
  flex-direction: row !important;
  flex: 1 1 0% !important;
  height: calc(100vh - var(--strip-h, 40px)) !important;
  min-height: 0 !important;
  overflow: hidden !important;
  position: relative !important;
  width: 100% !important;
}

.app-page {
  flex: 1 1 0% !important;
  min-width: 0 !important;
  height: 100% !important;
  overflow-y: auto !important;
  overflow-x: hidden !important;
  padding: 18px 24px !important;
  box-sizing: border-box !important;
}

.watchlist-container {
  width: 290px !important;
  max-width: 290px !important;
  min-width: 290px !important;
  flex-shrink: 0 !important;
  height: 100% !important;
  border-left: 1px solid #1e293b !important;
  background: #080c16 !important;
  display: flex !important;
  flex-direction: column !important;
  position: relative !important;
  overflow: hidden !important;
  box-sizing: border-box !important;
}

.watchlist-scroll-area {
  flex: 1 1 0% !important;
  min-height: 0 !important;
  overflow-y: auto !important;
  overflow-x: hidden !important;
}

.watchlist-chart-wrapper {
  padding: 8px 12px !important;
  border-top: 1px solid #1e293b !important;
  background: #0b101c !important;
  flex-shrink: 0 !important;
  box-sizing: border-box !important;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.chart-title {
  font-size: 0.65rem;
  font-weight: 700;
  color: #64748b;
  letter-spacing: 0.05em;
}
`;

content = content + '\n' + layoutRules;
fs.writeFileSync(cssPath, content, 'utf8');
console.log('Successfully injected .app-content-row, .app-page, and .watchlist layout rules!');
