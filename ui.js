/* Small shared SVG vocabulary; no remote icon or font dependency. */
window.QimingUI = (() => {
  const paths = {
    target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><path d="m13 11 7-7m-4 0h4v4"/>',
    spark: '<path d="m12 3 2.6 6.4L21 12l-6.4 2.6L12 21l-2.6-6.4L3 12l6.4-2.6Z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
    folder: '<path d="M3 7V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><path d="M3 10h18"/>',
    badge: '<path d="m8 15-2 7 6-3 6 3-2-7"/><circle cx="12" cy="9" r="7"/><path d="m9 9 2 2 4-4"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
    flag: '<path d="M4 22V3m0 0c5-5 11 5 16 0v11c-5 5-11-5-16 0"/>',
    code: '<path d="m8 8-4 4 4 4m8-8 4 4-4 4m-3-11-2 14"/>',
    cpu: '<rect x="6" y="6" width="12" height="12" rx="2"/><rect x="9" y="9" width="6" height="6" rx="1"/><path d="M9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4"/>',
    chart: '<path d="M4 3v18h17M8 16v-4m5 4V8m5 8V5"/>',
    robot: '<rect x="4" y="7" width="16" height="13" rx="4"/><path d="M12 3v4M1 11v5m22-5v5M9 16h6"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/>',
    flask: '<path d="M9 3h6m-5 0v7L4 20a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1l-6-10V3M7 15h10"/>',
    trophy: '<path d="M8 3h8v7a4 4 0 0 1-8 0ZM8 5H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4m-4 2v7m-4 0h8"/>',
    book: '<path d="M12 5c-3-2-6-2-10-1v15c4-1 7-1 10 1 3-2 6-2 10-1V4c-4-1-7-1-10 1Zm0 0v15"/>',
    file: '<path d="M14 2H5v20h14V7Zm0 0v6h5M8 12h8m-8 4h6"/>',
    alert: '<path d="m12 3 10 18H2Zm0 6v5m0 3v1"/>',
    layers: '<path d="m12 2 10 6-10 6L2 8Zm-9 11 9 5 9-5M3 17l9 5 9-5"/>'
  };
  const icon = (name, cls = '') => `<svg class="ui-icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.folder}</svg>`;
  const theme = direction => ({ '软件工程': ['code','blue'], '人工智能': ['cpu','violet'], '数据分析': ['chart','teal'], '嵌入式': ['robot','orange'], '科研实践': ['flask','violet'] }[direction] || ['folder','blue']);
  const heading = (name, text, tone = 'blue') => `<span class="section-title"><span class="section-icon ${tone}">${icon(name)}</span>${text}</span>`;
  return { icon, theme, heading };
})();
