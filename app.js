(() => {
  'use strict';
  const M = window.WireframeModel;
  const P = window.PracticeModel;
  const V = window.PracticeView;
  const UI = window.QimingUI;
  const R = window.ResultsModel;
  const RV = window.ResultsView;
  const W = window.CertificationModel;
  const WV = window.CertificationView;
  const draftStore = window.ResultsDrafts.createStore({
    getItem: key => localStorage.getItem(key), setItem: (key, value) => localStorage.setItem(key, value),
    removeItem: key => localStorage.removeItem(key), key: index => localStorage.key(index),
    get length() { return localStorage.length; }
  });
  const G = window.GrowthModel;
  const goalManager = document.getElementById('goal-manager-dialog');
  let selectedDimension = null;
  let skillScope = 'direction';
  const skillDialog = document.getElementById('skill-dialog');
  let skillDraft = null, skillInitial = '', skillSaving = false;
  const STORAGE_KEY = 'qiming-student-wireframes-v1';
  const main = document.getElementById('main-content');
  const goalDialog = document.getElementById('goal-dialog');
  const confirmDialog = document.getElementById('confirm-dialog');
  const sourceDialog = document.getElementById('source-dialog');
  const applicationDialog = document.getElementById('application-dialog');
  const resultsDialog = document.getElementById('results-dialog');
  const catalog = M.copy(M.templates);
  main.addEventListener('click', event => {
    if (event.target.closest('[data-action="scroll-tasks"]')) {
      event.preventDefault();
      document.getElementById('home-tasks')?.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    }
  });
  const paths = { home: '/student/home', profile: '/student/profile', goals: '/student/goals', opportunities: '/student/opportunities', opportunity: '/student/opportunities/', practice: '/student/practice', grades: '/student/grades', 'grade-detail': '/student/grades/', completions: '/student/completions', 'completion-detail': '/student/completions/', certificates: '/student/certificates', 'certificate-detail': '/student/certificates/', verify: '/verify', archive: '/student/archive', workbench: '/demo/certification' };
  const labels = { home: '学生首页', profile: '画像与目标', goals: '画像与目标', opportunities: '项目与竞赛', opportunity: '机会详情', practice: '我的实践', grades: '我的成绩', 'grade-detail': '成绩详情', completions: '结业申请', 'completion-detail': '结业申请详情', certificates: '我的证书', 'certificate-detail': '证书详情', verify: '演示证书验证', archive: '成果档案' };
  const resultRoutes = ['grades', 'grade-detail', 'completions', 'completion-detail', 'certificates', 'certificate-detail', 'verify'];
  const resultParents = { 'grade-detail': 'grades', 'completion-detail': 'completions', 'certificate-detail': 'certificates', verify: 'certificates' };
  const sections = [
    { id: 'home', label: '学生首页', pages: ['home'] },
    { id: 'growth', label: '画像与目标', pages: ['profile', 'goals'] },
    { id: 'practice', label: '科创实践', pages: ['opportunities', 'practice'] },
    { id: 'results', label: '成绩与结业', pages: ['grades', 'completions', 'certificates'] },
    { id: 'archive', label: '成果档案', pages: ['archive'] }
  ];
  const plannedPages = {
    grades: '这里将提供本人已发布成绩、考核明细和成绩单。',
    completions: '这里将提供结业资格、缺项提示、申请与审核进度。',
    certificates: '这里将提供本人证书、有效状态、下载与验证入口。',
    archive: '这里将汇集已审核成果及来源证据，并提供授权导出。'
  };
  let data = null;
  let route = 'home';
  let goalTab = 'templates';
  let editingProfile = false;
  let profileDraft = null;
  let profileSaving = false;
  let goalDraft = null;
  let goalInitialDraft = null;
  let goalSaving = false;
  let applicationSaving = false;
  let applicationDraft = null;
  let selectedOpportunityId = null;
  let practiceTab = 'participating';
  let selectedResultId = null;
  let resultFilters = { q: '', type: 'all', outcome: 'all' };
  let resultFiltersOpen = false;
  let verificationCode = '';
  let verificationSubmitted = false;
  let completionDraft = null;
  let completionSaving = false;
  let renderedResultId = null;
  let workbenchRole = 'reviewer';
  let workbenchProgramId = '';
  let workbenchDraft = null;
  let workbenchSaving = false;
  let renderedWorkbench = { role: 'reviewer', id: '' };
  let filters = { type: 'all', direction: 'all', tag: 'all', available: false };
  let failNextSave = false;
  let toastTimer = null;
  let loadVersion = 0;

  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const date = value => esc(String(value || '待确认').replaceAll('-', '.'));
  const tags = (values, tone = '') => `<div class="tag-row">${(values || []).map(value => `<span class="tag ${tone}">${esc(value)}</span>`).join('')}</div>`;
  const routeButton = (page, label, style = '') => `<a class="button ${style}" href="#${urlFor(page)}" data-route="${page}">${esc(label)}</a>`;
  const sourceButton = (type, id, label) => `<button class="text-link" type="button" data-action="source" data-type="${esc(type)}" data-id="${esc(id)}">${esc(label)} →</button>`;
  const empty = (title, description, action = '') => `<div class="empty"><div class="empty-mark" aria-hidden="true">＋</div><h3>${esc(title)}</h3><p>${esc(description)}</p>${action}</div>`;
  const kv = (label, value, extraClass = '') => `<div class="kv ${extraClass}"><div class="label">${esc(label)}</div><div class="value">${esc(value || '尚未填写')}</div></div>`;
  const feedback = (text, tone = 'error') => `<div class="info-line ${tone}" role="${tone === 'error' ? 'alert' : 'status'}">${esc(text)}</div>`;
  const goalPeriod = goal => `${date(goal.start)} — ${date(goal.end)}`;
  const viewContext = () => ({ M, P, R, W, WV, UI, data, filters, selectedOpportunityId, practiceTab, esc, date, tags, kv, feedback, empty, routeButton, sourceButton, selectedResultId, resultFilters, resultFiltersOpen, verificationCode, verificationSubmitted, workbenchRole, workbenchProgramId, workbenchDraft });
  const isSaving = () => profileSaving || goalSaving || applicationSaving || completionSaving || workbenchSaving || skillSaving;
  function filterQuery() {
    const query = new URLSearchParams();
    ['type', 'direction', 'tag'].forEach(key => { if (filters[key] !== 'all') query.set(key, filters[key]); });
    if (filters.available) query.set('available', '1');
    return query.toString();
  }
  function urlFor(page) {
    if (page === 'workbench') return paths.workbench + '?role=' + workbenchRole + (workbenchProgramId ? '&program=' + encodeURIComponent(workbenchProgramId) : '');
    if (['grade-detail', 'completion-detail', 'certificate-detail'].includes(page)) return paths[page] + encodeURIComponent(selectedResultId || 'missing');
    if (page === 'verify') return paths.verify + (verificationCode ? '?code=' + encodeURIComponent(verificationCode) : '');
    if (page === 'grades') { const q = new URLSearchParams(); if (resultFilters.q) q.set('q', resultFilters.q); if (resultFilters.type !== 'all') q.set('type', resultFilters.type); if (resultFilters.outcome !== 'all') q.set('outcome', resultFilters.outcome); return paths.grades + (q.size ? '?' + q : ''); }
    if (page === 'opportunity') return paths.opportunity + encodeURIComponent(selectedOpportunityId || 'missing') + (filterQuery() ? '?' + filterQuery() : '');
    if (page === 'opportunities') return paths.opportunities + (filterQuery() ? '?' + filterQuery() : '');
    if (page === 'practice') return paths.practice + (practiceTab === 'applications' ? '?tab=applications' : '');
    if (page === 'goals') return paths.goals + (goalTab === 'history' ? '?tab=history' : '');
    return paths[page];
  }
  function demoOpportunity() {
    const result = P.recommendOpportunities(data)[0];
    return result ? { ...result.opportunity, reason: result.reason } : null;
  }
  function toast(message) {
    const target = document.getElementById('toast');
    clearTimeout(toastTimer); target.textContent = message; target.hidden = false;
    toastTimer = setTimeout(() => { target.hidden = true; }, 3600);
  }
  function reviewStatus(message) { document.getElementById('review-status').textContent = message; }
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

  async function persist(candidate) {
    await delay(420);
    if (failNextSave) {
      failNextSave = false;
      reviewStatus('已触发一次保存失败；再次保存可重试。');
      throw new Error('模拟保存失败：内容已保留，请重试。');
    }
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(candidate)); }
    catch { throw new Error('浏览器未能保存演示数据。输入已保留，请检查本地存储权限后重试。'); }
    data = candidate;
  }
  function confirmAction(title, message, action = '确认') {
    return new Promise(resolve => {
      confirmDialog.innerHTML = `<h2 id="confirm-title">${esc(title)}</h2><p class="confirm-copy">${esc(message)}</p><div class="button-row end"><button type="button" class="button" data-result="cancel">取消</button><button type="button" class="button primary" data-result="confirm">${esc(action)}</button></div>`;
      confirmDialog.returnValue = '';
      const close = () => { confirmDialog.removeEventListener('close', close); resolve(confirmDialog.returnValue === 'confirm'); };
      confirmDialog.addEventListener('close', close);
      confirmDialog.querySelectorAll('[data-result]').forEach(button => button.addEventListener('click', () => confirmDialog.close(button.dataset.result)));
      confirmDialog.showModal();
      confirmDialog.querySelector('[data-result="cancel"]').focus();
    });
  }

  function profileInput() {
    return { major: data.profile.major, grade: data.profile.grade, interests: data.profile.interests.join('，'), skills: data.profile.skills.join('，'), bio: data.profile.bio || '' };
  }
  function profileDirty() { return !!(editingProfile && profileDraft && JSON.stringify(profileDraft) !== JSON.stringify(profileInput())); }
  function goalDirty() { return !!(goalDraft && JSON.stringify(goalDraft) !== JSON.stringify(goalInitialDraft)); }
  const completionDirty = () => !!completionDraft && completionDraft.note !== completionDraft.savedNote;
  const workbenchDirty = () => !!workbenchDraft?.note.trim();

  async function navigate(nextRoute, updateHash = true) {
    if (!paths[nextRoute]) nextRoute = 'home';
    if (isSaving()) { toast('正在保存，请稍候。'); return; }
    if (workbenchDirty() && (nextRoute !== route || workbenchRole !== renderedWorkbench.role || workbenchProgramId !== renderedWorkbench.id)) {
      if (!await confirmAction('离开当前处理？', '处理意见尚未确认，离开后将丢弃本次输入。', '放弃输入并离开')) { workbenchRole = renderedWorkbench.role; workbenchProgramId = renderedWorkbench.id; history.replaceState(null, '', '#' + urlFor(route)); return; }
      workbenchDraft = null;
    }
    if (nextRoute !== 'workbench') workbenchDraft = null;
    if ((nextRoute !== route || selectedResultId !== renderedResultId) && completionDraft) {
      if (completionDirty() && !await confirmAction('离开这次结业申请？', '说明暂存失败，离开后将丢失未暂存的输入。', '仍然离开')) { selectedResultId = renderedResultId; history.replaceState(null, '', '#' + urlFor(route)); return; }
      resultsDialog.close();
    }
    if (nextRoute !== route && skillDialog.open && !await closeSkill()) { history.replaceState(null,'','#'+urlFor(route));return; }
    if (nextRoute !== route && profileDirty()) {
      if (!await confirmAction('离开前确认', '资料还有未保存的修改。离开后将恢复到上一次保存的版本。', '放弃修改并离开')) {
        history.replaceState(null, '', '#' + urlFor(route)); return;
      }
    }
    if (nextRoute !== route) { editingProfile = false; profileDraft = null; }
    route = nextRoute;
    if (updateHash) history.pushState(null, '', '#' + urlFor(route));
    render();
    main.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function readHash() {
    const [path, query = ''] = location.hash.replace(/^#/, '').split('?');
    const params = new URLSearchParams(query);
    if (path === paths.workbench) {
      workbenchRole = params.get('role') === 'issuer' ? 'issuer' : 'reviewer';
      workbenchProgramId = (params.get('program') || '').slice(0, 100);
      return 'workbench';
    }
    const resultDetail = path.match(/^\/student\/(grades|completions|certificates)\/([^/]+)$/);
    if (resultDetail) { try { selectedResultId = decodeURIComponent(resultDetail[2]); } catch { selectedResultId = null; } return { grades: 'grade-detail', completions: 'completion-detail', certificates: 'certificate-detail' }[resultDetail[1]]; }
    if (path === paths.grades) {
      resultFilters = { q: (params.get('q') || '').slice(0, 100), type: ['课程', '项目'].includes(params.get('type')) ? params.get('type') : 'all', outcome: ['passed', 'failed'].includes(params.get('outcome')) ? params.get('outcome') : 'all' };
      resultFiltersOpen = resultFilters.type !== 'all' || resultFilters.outcome !== 'all';
    }
    if (path === paths.verify) { verificationCode = (params.get('code') || '').slice(0, 64); verificationSubmitted = !!verificationCode; }
    const detail = path.match(/^\/student\/opportunities\/([^/]+)$/);
    if (path === paths.opportunities || detail) {
      const visible = P.opportunities.filter(P.visible);
      const values = { type: ['项目', '竞赛'], direction: [...new Set(visible.map(o => o.direction))], tag: [...new Set(visible.flatMap(o => o.tags))] };
      ['type', 'direction', 'tag'].forEach(key => { filters[key] = values[key].includes(params.get(key)) ? params.get(key) : 'all'; });
      filters.available = params.get('available') === '1';
    }
    if (detail) { try { selectedOpportunityId = decodeURIComponent(detail[1]); } catch { selectedOpportunityId = null; } return 'opportunity'; }
    const page = Object.keys(paths).find(key => paths[key] === path) || 'home';
    if (page === 'goals') goalTab = params.get('tab') === 'history' ? 'history' : 'templates';
    if (page === 'practice') practiceTab = params.get('tab') === 'applications' ? 'applications' : 'participating';
    return page;
  }
  function render() {
    if (!data) return;
    document.title = `${route === 'workbench' ? '认证工作台（演示）' : labels[route]} · 启明交互原型`;
    document.body.dataset.workspace = route === 'workbench' ? 'certification' : 'student';
    document.querySelector('.topbar-title').textContent = route === 'workbench' ? '启明 · 认证演示' : '学生成长工作台';
    document.querySelector('.review-bar strong').textContent = route === 'workbench' ? '认证工作台演示' : '学生端交互原型';
    if (route === 'workbench') {
      if (!workbenchProgramId) workbenchProgramId = R.completionQueue(data).find(row => row.application?.status === 'pending')?.program.id || R.programs(data)[0]?.id || '';
      if (workbenchDraft && (workbenchDraft.programId !== workbenchProgramId || workbenchDraft.role !== workbenchRole)) workbenchDraft = null;
    }
    const activePage = route === 'opportunity' ? 'opportunities' : resultParents[route] || route;
    const section = sections.find(item => item.pages.includes(activePage)) || { id: 'certification', label: '认证演示', pages: [] };
    document.getElementById('breadcrumb').textContent = route === 'workbench' ? '认证工作台 / ' + W.roles[workbenchRole] : route === 'home' ? '学生工作台 / 学生首页' : section.id === 'growth' || section.pages.length === 1 ? section.label : `${section.label} / ${labels[route]}`;
    document.querySelectorAll('.nav-item[data-section]').forEach(link => {
      const active = link.dataset.section === section.id;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', section.pages.length === 1 ? 'page' : 'true'); else link.removeAttribute('aria-current');
    });
    const sectionNavigation = document.getElementById('section-navigation');
    sectionNavigation.hidden = section.pages.length < 2 || section.id === 'growth';
    sectionNavigation.setAttribute('aria-label', `${section.label}子栏目`);
    sectionNavigation.innerHTML = section.pages.length < 2 || section.id === 'growth' ? '' : `<div class="section-navigation-inner">${section.pages.map(page => `<a class="section-link${page === activePage ? ' active' : ''}" href="#${urlFor(page)}" data-route="${page}"${page === activePage ? ` aria-current="${route === page ? 'page' : 'true'}"` : ''}>${labels[page]}</a>`).join('')}</div>`;
    main.dataset.page = route;
    main.innerHTML = route === 'workbench' ? WV.page(viewContext()) : resultRoutes.includes(route) ? RV.page(viewContext(), route) : route === 'home' ? renderHome() : route === 'profile' || route === 'goals' ? renderGrowth() : route === 'opportunities' ? V.list(viewContext()) : route === 'opportunity' ? V.detail(viewContext()) : route === 'practice' ? V.practice(viewContext()) : renderPlannedPage();
    renderedResultId = selectedResultId;
    renderedWorkbench = { role: workbenchRole, id: workbenchProgramId };
    document.querySelector('.navigation-toggle').setAttribute('aria-expanded', 'false');
    document.querySelector('.app-shell').classList.remove('navigation-open');
    syncReviewControls();
    if (route === 'goals' && goalTab === 'history') { goalTab = 'templates'; openGoalHistory(); }
  }

  function renderPlannedPage() {
    return `<section class="panel planned-page"><span class="tag">待建设</span><h1>${labels[route]}</h1><p>${plannedPages[route]}</p><p>该页面尚未开放。你可以先完善画像、设置目标，或浏览当前的项目与竞赛。</p>${routeButton('opportunities', '浏览项目与竞赛', 'primary')}</section>`;
  }

  function renderHome() {
    const goal = M.currentGoal(data);
    const recommendations = P.recommendOpportunities(data).slice(0, 2);
    const firstUse = !goal && !data.profile.major && !data.profile.skills.length;
    const missing = [!data.profile.major && '专业', !data.profile.grade && '年级', !data.profile.skills.length && '自填技能'].filter(Boolean);
    const tasks = [];
    R.completionTasks(data).forEach(task => tasks.push({ ...task, button: `<a class="button small" data-results-route="completion-detail" data-id="${esc(task.id)}" href="#/student/completions/${encodeURIComponent(task.id)}">${esc(task.actionLabel)}</a>` }));
    if (missing.length) tasks.push({ title: '完善你的画像', note: `还可补充：${missing.join('、')}。`, button: routeButton('profile', '去完善', 'small') });
    if (!goal) tasks.push({ title: '选择一个当前目标', note: '从方向模板开始，明确下一步想完成的事。', button: routeButton('goals', '选目标', 'small') });
    data.projects.filter(p => p.feedback).forEach(p => tasks.push({ title: '实践材料需要补正', note: p.name, button: `<button type="button" class="button small" data-action="source" data-type="project" data-id="${esc(p.id)}">查看意见</button>` }));
    const project = data.projects[0];
    const grade = R.publishedGrades(data)[0];
    const gradeVersion = grade && R.current(grade);
    return `<section class="welcome-banner"><div class="welcome-copy"><h1>${esc(data.profile.name)}，${firstUse ? '欢迎使用启明' : '欢迎回来'}</h1><p>让每一个目标，都在实践中向前一步。</p><div class="welcome-meta"><span>${esc(data.profile.major || '从完善个人资料开始')}</span>${data.profile.grade ? `<span>${esc(data.profile.grade)}</span>` : ''}<span class="demo-label">学生端演示</span></div></div><div class="welcome-art" aria-hidden="true"><img src="assets/student-welcome.png" width="240" height="160" alt="" decoding="async"></div>
      <dl class="learning-overview" aria-label="学习概览">
        <div class="overview-stat"><dt>待处理事项</dt><dd><a href="#home-tasks" data-action="scroll-tasks" aria-label="查看 ${tasks.length} 项待处理事项"><strong>${tasks.length}</strong><span>项</span>${UI.icon('arrow')}</a></dd></div>
        <div class="overview-stat"><dt>参与中的实践</dt><dd><strong>${data.projects.length}</strong><span>项</span></dd></div>
        <div class="overview-stat"><dt>已验证技能</dt><dd><strong>${data.evidence.length}</strong><span>项</span></dd></div>
      </dl></section>
      <div class="home-grid">
        <section class="panel goal-highlight home-goal"><div class="panel-head"><h2>${UI.heading('target','我的成长目标')}</h2><span class="tag ${goal ? 'blue' : ''}">${goal ? '当前目标' : '尚未选择'}</span></div>
        ${goal ? `<div class="goal-body"><div><h3>${esc(goal.title)}</h3><p class="description">${esc(goal.description || '围绕当前目标参与实践，积累可追溯的成长证据。')}</p>${tags(goal.tags)}</div></div><div class="panel-bottom"><span class="subtle">${UI.icon('clock')} ${goalPeriod(goal)}</span>${routeButton('goals', '查看与调整目标', 'small')}</div>` : `<h3>先定一个方向，再走出第一步</h3><p class="description">选择一个方向模板，或说说你希望完成什么。</p><div class="panel-bottom"><span class="subtle">支持职业、科研、竞赛与能力提升方向</span>${routeButton('goals', '选择我的目标', 'primary small')}</div>`}</section>
        <section id="home-tasks" class="panel home-tasks"><div class="panel-head"><h2>${UI.heading('clock','我的待办','orange')}</h2><span class="section-count">${tasks.length} 项待处理</span></div><div class="task-list">${tasks.length ? tasks.map(t => `<div class="task-row"><span class="task-dot" aria-hidden="true"></span><div class="content"><h3>${esc(t.title)}</h3><p>${esc(t.note)}</p></div>${t.button}</div>`).join('') : `<div class="calm-empty">${UI.icon('check')}<div><h3>当前没有待处理事项</h3><p>可以继续探索感兴趣的实践方向。</p></div></div>`}</div></section>
        <section class="panel home-practice"><div class="panel-head"><h2>${UI.heading('folder','我的实践','violet')}</h2>${routeButton('practice','查看全部','ghost small')}</div>${project ? `<div class="practice-feature"><span class="feature-icon violet">${UI.icon('cpu')}</span><div><h3>${esc(project.name)}</h3><p>${esc(project.role)} <span class="tag green">${esc(project.status)}</span></p></div></div><div class="home-milestone"><span class="home-milestone-icon" aria-hidden="true">${UI.icon('flag')}</span><div><span class="step">下一里程碑</span><p>${esc(project.milestone)}</p></div><span class="home-milestone-date">${UI.icon('clock')} ${project.deadline ? `截止 ${date(project.deadline)}` : '时间待确认'}</span></div><div class="panel-bottom"><span class="subtle">参与时目标：${esc(project.goalSnapshot?.title || '未关联目标')}</span>${sourceButton('project',project.id,'查看实践摘要')}</div>` : empty('还没有参与的实践','报名审核通过后，你可以在这里跟踪参与记录。',routeButton('opportunities','浏览实践机会','small'))}</section>
        <section class="panel recommendation-panel"><div class="panel-head"><h2>${UI.heading('spark','为你发现','teal')}</h2><span class="tag green">规则推荐</span></div>${recommendations.length ? recommendations.map(({opportunity:op,reason}) => `<article class="recommendation-item"><span class="recommendation-type">${esc(op.type)} · ${esc(op.direction)}</span><h3>${esc(op.title)}</h3><p>${esc(reason)}</p><button type="button" class="text-link" data-action="opportunity-detail" data-id="${esc(op.id)}">了解这项机会 ${UI.icon('arrow')}</button></article>`).join('') : `<div class="calm-empty"><p>${goal ? '暂无可报名的方向关联机会，可以浏览全部机会。' : '选择目标后，这里会展示关联机会与推荐理由。'}</p></div>`}<div class="panel-bottom">${routeButton('opportunities','探索全部机会','small')}</div></section>
        <section class="panel student-card"><div class="panel-head"><h2>${UI.heading('user','我的画像')}</h2>${routeButton('profile','查看我的画像','ghost small')}</div><div class="student-card-content"><div class="student-card-top"><span class="avatar profile-avatar" aria-hidden="true">${esc(data.profile.name.slice(0,1))}</span><div><h3>${esc(data.profile.name)}</h3><p>${esc(data.profile.major || '专业尚未填写')}</p><span class="tag outline">${esc(data.profile.grade || '年级尚未填写')}</span></div></div><div class="student-details"><span>兴趣方向</span><strong>${esc(data.profile.interests.join('、') || '尚未填写')}</strong></div><div class="student-details"><span>自填技能</span>${data.profile.skills.length ? tags(data.profile.skills) : '<strong>尚未填写</strong>'}</div></div></section>
        <section class="panel grade-panel"><div class="panel-head"><h2>${UI.heading('badge','成绩与成果','blue')}</h2></div>${grade ? `<div class="grade-record"><div><span class="subtle">本人已发布成绩 · 演示</span><h3>${esc(grade.name)}</h3><small>${date(gradeVersion.publishedAt)}</small></div><span class="grade-value">${esc(gradeVersion.score === null ? '暂无总评' : gradeVersion.score)}<small>分</small></span></div>` : '<p class="panel-caption">暂无已发布成绩。</p>'}<div class="panel-bottom">${grade ? sourceButton('grade',grade.id,'查看记录来源') : ''}<a class="text-link" href="#/student/certificates" data-route="certificates">查看我的证书（${R.certificates(data).length}）</a></div></section>
      </div>`;
  }

  function selectField(name, label, options, value, placeholder) {
    return `<div class="field"><label for="profile-${name}">${esc(label)}</label><select id="profile-${name}" name="${name}" aria-describedby="error-${name}"><option value="">${esc(placeholder)}</option>${options.map(option => `<option value="${esc(option)}" ${value === option ? 'selected' : ''}>${esc(option)}</option>`).join('')}</select><span class="field-error" id="error-${name}"></span></div>`;
  }
  function renderProfileDetails() {
    const p = data.profile;
    const draft = profileDraft || profileInput();
    return `<div class="page-heading"><div><h2>个人资料</h2><p>让目标和实践建立在真实资料与证据之上。</p></div>${editingProfile ? '<span class="tag amber">编辑中 · 尚未保存</span>' : '<button type="button" class="button primary" data-action="edit-profile">编辑资料</button>'}</div>
      <div class="profile-stats" aria-label="画像记录摘要"><div><span class="summary-icon blue">${UI.icon('user')}</span><span><strong>${p.interests.length}</strong><small>个兴趣方向</small></span></div><div><span class="summary-icon violet">${UI.icon('code')}</span><span><strong>${p.skills.length}</strong><small>项自填技能</small></span></div><div><span class="summary-icon teal">${UI.icon('badge')}</span><span><strong>${data.evidence.length}</strong><small>项已验证技能</small></span></div></div>
      <div class="profile-grid"><section class="panel"><div class="profile-person"><span class="avatar profile-avatar" aria-hidden="true">林</span><div><h2>${esc(p.name)}</h2><p>${esc(p.studentNo)} <span class="tag outline">演示身份</span></p></div></div>
      ${editingProfile ? `<form id="profile-form" novalidate><div class="form-grid">${selectField('major', '专业', ['计算机科学与技术', '自动化', '电子信息工程', '机械设计制造及其自动化'], draft.major, '暂未填写')}${selectField('grade', '年级', ['大一', '大二', '大三', '大四', '研究生'], draft.grade, '暂未填写')}
      <div class="field span-2"><label for="profile-interests">兴趣方向</label><input id="profile-interests" name="interests" value="${esc(draft.interests)}" placeholder="例如：人工智能，机器人"><span class="hint">多个方向用逗号分隔，相同标签保存时合并。</span></div>
      <div class="field span-2"><label for="profile-skills">自填技能</label><input id="profile-skills" name="skills" value="${esc(draft.skills)}" placeholder="例如：Python，数据分析"><span class="hint">本人填写的信息，与经过审核的技能证据分开展示。</span></div>
      <div class="field span-2"><label for="profile-bio">个人简介 <span class="subtle">选填</span></label><textarea id="profile-bio" name="bio" maxlength="500" aria-describedby="error-bio" placeholder="简单描述你已有的经历或希望探索的方向。">${esc(draft.bio)}</textarea><span class="field-error" id="error-bio"></span><span class="hint">简介为本轮界面建议，最多 500 字。</span></div></div><div id="profile-error" class="form-error" aria-live="polite"></div><div class="form-actions"><span class="subtle">姓名与学生标识在本原型中只读。</span><div class="button-row"><button type="button" class="button" data-action="cancel-profile">取消</button><button type="submit" class="button primary">保存资料</button></div></div></form>` : `<div class="kv-grid">${kv('专业', p.major)}${kv('年级', p.grade)}<div class="kv span-2"><div class="label">兴趣方向</div>${p.interests.length ? tags(p.interests) : '<div class="value subtle">尚未填写</div>'}</div><div class="kv span-2"><div class="label">自填技能 <span class="tag outline">本人填写</span></div>${p.skills.length ? tags(p.skills) : '<div class="value subtle">尚未填写</div>'}</div>${p.bio ? kv('个人简介', p.bio, 'span-2') : ''}</div><div class="panel-bottom"><span class="subtle">已验证技能由审核记录提供，不通过编辑资料修改。</span>${routeButton('goals', '查看我的目标', 'small')}</div>`}</section>
      <div class="profile-side"><section class="panel"><div class="panel-head"><h2>${UI.heading('badge','已验证技能','teal')}</h2><span class="tag green">有据可查</span></div>${data.evidence.length ? data.evidence.map(e => `<div class="evidence-card"><h3>${esc(e.skill)}</h3><p>${esc(e.source)}<br>${date(e.reviewedAt)} · ${esc(e.status)}</p>${sourceButton('evidence', e.id, '查看证据')}</div>`).join('') : empty('暂无已审核证据', '实践材料经过审核后，才能在这里留下验证记录。')}</section><section class="panel"><h2>资料与成果的区别</h2><ul class="line-list" style="margin-top:12px"><li>兴趣与自填技能，说明你当前的方向和基础。</li><li>审核通过的材料，构成已验证技能的来源。</li><li>目标切换会保留历史参与时的目标记录。</li></ul></section></div></div>`;
  }

  function renderCapabilityChart(summary) {
    const cx=250,cy=164,radius=104;
    const point=(index,value,distance=radius)=>{const angle=-Math.PI/2+index*Math.PI*2/5;return [cx+Math.cos(angle)*distance*value,cy+Math.sin(angle)*distance*value];};
    const coordinates=values=>values.map((value,index)=>point(index,value/4).map(n=>n.toFixed(2)).join(',')).join(' ');
    const rings=[1,2,3,4].map(stage=>`<polygon points="${coordinates(summary.axes.map(()=>stage))}" class="radar-grid"/>`).join('');
    const axes=summary.axes.map((axis,index)=>{const [x,y]=point(index,1),[tx,ty]=point(index,1,143);return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" class="radar-axis"/><g data-action="select-capability-dimension" data-dimension="${axis.id}" class="radar-dimension ${selectedDimension===axis.id?'selected':''}"><rect x="${tx-56}" y="${ty-17}" width="112" height="44" fill="transparent"/><text x="${tx}" y="${ty}" text-anchor="middle" class="radar-label">${axis.label}</text><text x="${tx}" y="${ty+18}" text-anchor="middle" class="radar-stage-label">${axis.stage===null?'待评估':G.stages[axis.stage]}</text></g>`;}).join('');
    const known=summary.axes.filter(axis=>axis.stage!==null);
    const segments=summary.axes.map((axis,index)=>{const next=summary.axes[(index+1)%5];if(axis.stage===null||next.stage===null)return '';const [x1,y1]=point(index,axis.stage/4),[x2,y2]=point((index+1)%5,next.stage/4);return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="radar-stage-line"/>`;}).join('');
    const plot=`${known.length===5?`<polygon points="${coordinates(summary.axes.map(axis=>axis.stage))}" class="radar-stage-area"/>`:''}${segments}${summary.axes.map((axis,index)=>{if(axis.stage===null)return '';const [x,y]=point(index,axis.stage/4);return `<circle cx="${x}" cy="${y}" r="5" class="radar-stage-point ${axis.stage===4?'verified':''}"><title>${axis.label}：${G.stages[axis.stage]}</title></circle>`;}).join('')}`;
    return `<section class="panel capability-chart-panel"><div class="panel-head"><h2>${UI.heading('chart','能力成长雷达','blue')}</h2><span class="tag outline">${summary.scope==='direction'?'当前方向':'全部技能'}</span></div><p class="radar-scope-note">${summary.scope==='direction'?'仅展示该小方向已有的技能记录':'展示全部技能的记录阶段'}</p><figure class="capability-figure"><svg viewBox="0 0 500 350" role="img" aria-labelledby="capability-chart-title capability-chart-description"><title id="capability-chart-title">五维能力成长雷达图</title><desc id="capability-chart-description">${summary.axes.map(axis=>`${axis.label}：${axis.stage===null?'待评估':G.stages[axis.stage]}`).join('；')}。各维度展示技能记录支持的最高阶段，不代表评测分数；未评估的维度不画能力点。</desc>${rings}${axes}${plot}</svg></figure><div class="growth-stage-guide">${G.stages.slice(1).map((stage,index)=>`<span><i>${index+1}</i>${stage}</span>`).join('')}</div><div class="dimension-chips" aria-label="查看能力维度对应技能">${summary.axes.map(axis=>`<button type="button" data-action="select-capability-dimension" data-dimension="${axis.id}" aria-pressed="${selectedDimension===axis.id}"><span>${axis.label}</span><small>${summary.scope==='direction'?`${axis.recorded}/${axis.required} 项记录 · ${axis.verified} 项验证`:axis.stage===null?'待评估':G.stages[axis.stage]}</small></button>`).join('')}</div><details class="radar-stage-note"><summary>阶段计算说明</summary><p>每维取当前范围内已有技能的最高阶段，不代表整维掌握程度。方向视图同时显示已记录／建议技能数与验证数；缺少记录不补分。学习阶段由本人记录，审核通过才标记验证。</p></details></section>`;
  }

  function renderSkillCards(summary) {
    const plan=G.forDirection(data);
    const missing=(summary.requirements||[]).filter(r=>!r.ability && (!selectedDimension || r.dimension===selectedDimension));
    const filtered=selectedDimension?summary.abilities.filter(ability=>ability.dimension===selectedDimension):summary.abilities;
    const dimension=G.dimensions.find(item=>item.id===selectedDimension);
    return `<section class="panel learned-capabilities"><div class="panel-head"><h2>${UI.heading('layers','我的技能','violet')}</h2><button type="button" class="button primary small" data-action="add-skill">添加技能</button></div><div class="skill-scope-controls" aria-label="技能显示范围"><button type="button" data-action="skill-scope" data-scope="direction" aria-pressed="${summary.scope==='direction'}" ${plan?'':'disabled'}>当前方向技能</button><button type="button" data-action="skill-scope" data-scope="all" aria-pressed="${summary.scope!=='direction'}">全部技能</button></div>${summary.scope==='direction'?`<p class="skill-active-path">${esc(M.directions.flatMap(d=>d.tracks).find(t=>t.id===M.currentGoal(data)?.pathway?.subDirection)?.title || '当前方向')}</p><div class="skill-coverage"><span>已记录 <strong>${summary.recorded}/${summary.requirements.length}</strong> 项</span><span>审核验证 <strong>${summary.verified}</strong> 项</span></div>`:!plan?'<p class="skill-plan-hint">选择具体小方向后，可查看对应技能清单。<button type="button" class="text-link" data-action="manage-goals">选择方向</button></p>':''}<div class="skill-filter-summary"><span>${dimension?`${dimension.label} · `:''}${filtered.length} 项已有记录${missing.length ? ` · ${missing.length} 项待学习` : ''}</span>${dimension?'<button type="button" class="text-link" data-action="clear-capability-dimension">查看全部</button>':''}</div>${filtered.length?`<div class="skill-cards">${filtered.map(ability=>{
      const dimension=G.dimensions.find(item=>item.id===ability.dimension),pending=ability.latestRequest?.status==='pending',rejected=ability.latestRequest?.status==='rejected';
      const project=data.projects.find(item=>item.id===ability.metadata?.projectId);
      return `<article class="skill-card"><div class="skill-card-heading"><span class="learned-icon ${ability.stage===4?'teal':'blue'}">${UI.icon(ability.stage===4?'badge':'code')}</span><div><h3>${esc(ability.label)}</h3><span>${dimension?.label||'维度待归类'}</span></div><span class="tag ${ability.stage===4?'green':'outline'}">${ability.stageLabel}</span></div><div class="skill-stage-track" aria-label="${esc(ability.label)}：${ability.stageLabel}${ability.stage<4?'，本人记录':''}">${[1,2,3,4].map(stage=>`<span class="${ability.stage>=stage?'reached':''}" title="${G.stages[stage]}"></span>`).join('')}</div><p class="skill-record-source">${ability.metadata?`学习来源：${esc(project?.name||ability.metadata.sourceLabel||'本人学习记录')}`:ability.evidence.length?`证据来源：${esc(ability.evidence[0].source)}`:'从个人资料导入 · 本人记录'}${ability.metadata?.updatedAt?`<small>更新于 ${date(ability.metadata.updatedAt.slice(0,10))}</small>`:''}</p>${project?sourceButton('project',project.id,'查看关联实践'):''}${pending?'<div class="skill-review-note pending">待评审，审核通过后更新验证状态。</div>':rejected?`<div class="skill-review-note rejected"><strong>材料需补充</strong><p>${esc(ability.latestRequest.reviewNote)}</p></div>`:''}<div class="skill-card-actions">${ability.evidence.length?ability.evidence.map(evidence=>sourceButton('evidence',evidence.id,'查看验证证据')).join(''):`<button type="button" class="text-link" data-action="edit-skill" data-skill="${esc(ability.label)}" ${pending?'disabled':''}>更新学习记录</button><button type="button" class="button small" data-action="verify-skill" data-skill="${esc(ability.label)}" ${pending?'disabled':''}>${pending?'验证处理中':rejected?'补充后重申':'申请验证'}</button>`}${ability.requests.length?`<button type="button" class="text-link" data-action="skill-review-history" data-skill="${esc(ability.label)}">验证记录（${ability.requests.length}）</button>`:''}</div></article>`;
    }).join('')}</div>`:missing.length?'':empty(dimension?'该维度还没有技能记录':'从一项技能开始记录',dimension?'可以添加该维度的技能，或查看全部技能。':'点击“添加技能”，填写学习阶段与来源。')}${missing.length?`<div class="required-skill-list">${missing.map(r=>`<article class="required-skill-row"><div><h3>${esc(r.name)}</h3><span>${G.dimensions.find(d=>d.id===r.dimension).label} · 待学习</span></div><button type="button" class="button small" data-action="start-required-skill" data-skill="${esc(r.name)}">开始记录</button></article>`).join('')}</div>`:''}<p class="capability-disclaimer">${summary.scope==='direction'?'清单为方向学习建议；开始记录后才计入个人技能。':''}本地演示：验证结果来自模拟评审。</p></section>`;
  }

  function selectDimension(dimension) {
    if(!G.dimensions.some(item=>item.id===dimension))return;
    selectedDimension=dimension;render();
    main.querySelector(`.dimension-chips [data-dimension="${dimension}"]`)?.focus({preventScroll:true});
  }

  function skillField(name,label,value='',type='input',hint='') {
    return `<div class="field"><label for="skill-${name}">${label}</label>${type==='textarea'?`<textarea id="skill-${name}" name="${name}" aria-describedby="error-${name}">${esc(value)}</textarea>`:`<input id="skill-${name}" name="${name}" value="${esc(value)}" aria-describedby="error-${name}">`}<span class="field-error" id="error-${name}"></span>${hint?`<small class="hint">${hint}</small>`:''}</div>`;
  }

  function openSkill(name=null,requiredName=null) {
    const ability=name?G.summarize(data).abilities.find(item=>item.key===G.identity(name)):null;
    if(name&&!ability){toast('技能不存在，请刷新后查看。');return;}
    if(ability&&(ability.evidence.length||ability.latestRequest?.status==='pending')){toast('该技能已验证或正在审核，请查看记录。');return;}
    const required=requiredName?G.forDirection(data)?.requirements.find(r=>r.name===requiredName):null;
    if(required?.ability){openSkill(required.ability.label);return;}
    skillDraft={kind:'record',edit:!!ability,name:ability?.label||required?.name||'',dimension:ability?.dimension||required?.dimension||selectedDimension||'',stage:ability?.metadata?.stage||1,sourceLabel:ability?.metadata?.sourceLabel||'',projectId:ability?.metadata?.projectId||''};
    skillInitial=JSON.stringify(skillDraft);
    skillDialog.innerHTML=`<div class="dialog-header"><div><h2 id="skill-dialog-title">${ability?'更新学习记录':'添加技能'}</h2><p>如实记录学习阶段，审核验证需要另行提交材料。</p></div><button type="button" class="close-button" data-action="close-skill" aria-label="关闭技能表单">×</button></div><form id="skill-form" novalidate><div class="form-grid">${skillField('name','技能名称',skillDraft.name)}<div class="field"><label for="skill-dimension">能力维度</label><select id="skill-dimension" name="dimension" aria-describedby="error-dimension"><option value="">请选择维度</option>${G.dimensions.map(item=>`<option value="${item.id}" ${item.id===skillDraft.dimension?'selected':''}>${item.label}</option>`).join('')}</select><span class="field-error" id="error-dimension"></span></div><div class="field span-2"><label for="skill-stage">当前学习阶段（本人记录）</label><select id="skill-stage" name="stage" aria-describedby="error-stage">${[1,2,3].map(stage=>`<option value="${stage}" ${stage===skillDraft.stage?'selected':''}>${G.stages[stage]}</option>`).join('')}</select><span class="field-error" id="error-stage"></span></div>${skillField('sourceLabel','学习 / 练习来源',skillDraft.sourceLabel,'input','完成练习或项目应用时，需填写来源或关联项目。')}<div class="field"><label for="skill-projectId">关联本人参与的项目（选填）</label><select id="skill-projectId" name="projectId" aria-describedby="error-projectId"><option value="">不关联项目</option>${data.projects.map(project=>`<option value="${esc(project.id)}" ${project.id===skillDraft.projectId?'selected':''}>${esc(project.name)}</option>`).join('')}</select><span class="field-error" id="error-projectId"></span></div></div><div id="skill-form-error" class="form-error" role="alert"></div><div class="form-actions"><span class="subtle">保存后同步更新技能卡片与能力雷达。</span><div class="button-row"><button type="button" class="button" data-action="close-skill">取消</button><button type="submit" class="button primary">保存技能</button></div></div></form>`;
    if(ability || required)skillDialog.querySelector('[name="name"]').readOnly=true;
    skillDialog.showModal();skillDialog.querySelector(ability?'[name="stage"]':'[name="name"]').focus();
  }

  function openSkillVerification(name) {
    const ability=G.summarize(data).abilities.find(item=>item.key===G.key(name));
    if(!ability||ability.evidence.length||ability.latestRequest?.status==='pending'){toast('该技能暂不能提交验证，请查看当前状态。');return;}
    const previous=ability.latestRequest?.status==='rejected'?ability.latestRequest:null;
    skillDraft={kind:'verification',name:ability.label,materialTitle:previous?.materialTitle||'',materialUrl:previous?.materialUrl||'',description:previous?.description||''};skillInitial=JSON.stringify(skillDraft);
    skillDialog.innerHTML=`<div class="dialog-header"><div><h2 id="skill-dialog-title">申请技能验证</h2><p>${esc(ability.label)} · 提交材料后等待评审</p></div><button type="button" class="close-button" data-action="close-skill" aria-label="关闭技能表单">×</button></div><form id="skill-form" novalidate>${skillField('materialTitle','材料名称',skillDraft.materialTitle,'input','例如：数据清洗报告 v1.0、练习代码与说明。')}${skillField('materialUrl','材料链接（选填）',skillDraft.materialUrl,'input','仅支持HTTP/HTTPS，当前不会自动访问链接。')}${skillField('description','完成情况与证明说明',skillDraft.description,'textarea','10—1000字，说明你完成了什么、材料如何证明这项技能。')}<div class="info-line">当前原型仅保存材料名称、链接与说明，没有上传文件。提交后为待审核，不直接升级能力阶段。</div><div id="skill-form-error" class="form-error" role="alert"></div><div class="form-actions"><span class="subtle">评审通过后，才会新增已验证证据。</span><div class="button-row"><button type="button" class="button" data-action="close-skill">取消</button><button type="submit" class="button primary">提交验证申请</button></div></div></form>`;
    skillDialog.showModal();skillDialog.querySelector('[name="materialTitle"]').focus();
  }

  async function closeSkill() {
    if(skillSaving)return false;
    if(skillDraft&&JSON.stringify(skillDraft)!==skillInitial&&!await confirmAction('放弃技能编辑？','本次输入尚未保存，取消关闭可继续编辑。','放弃编辑'))return false;
    skillDialog.close();return true;
  }

  async function saveSkillForm(form) {
    if(isSaving()||!skillDraft)return;
    const result=skillDraft.kind==='verification'?G.requestVerification(data,skillDraft.name,skillDraft):G.saveSkill(data,skillDraft,{edit:skillDraft.edit});
    showErrors(form,result.errors||{});form.querySelector('#skill-form-error').textContent=result.errors?.form||'';
    if(result.errors)return;
    skillSaving=true;busyForm(form,true,'保存中…');syncReviewControls();
    const verification=skillDraft.kind==='verification';
    try {await persist(result.state);if(result.record){selectedDimension=result.record.dimension;if(!G.forDirection(result.state)?.requirements.some(r=>G.identity(r.name)===G.identity(result.record.name)))skillScope='all';}skillDialog.close();render();main.focus({preventScroll:true});toast(verification?'验证申请已提交，等待评审。':'技能记录已保存，能力图已同步。');}
    catch(error){busyForm(form,false);form.querySelector('#skill-form-error').textContent=error.message;}
    finally{skillSaving=false;syncReviewControls();}
  }

  function openSkillReviewHistory(name) {
    const records=G.ownRequests(data).filter(request=>G.identity(request.skillName)===G.identity(name)).slice().reverse();
    sourceDialog.innerHTML=`<div class="dialog-header"><div><h2 id="source-title">技能验证记录</h2><p>${esc(name)}</p></div><button type="button" class="close-button" data-action="close-source" aria-label="关闭详情">×</button></div>${records.map(request=>`<article class="history-item"><header><h3>${esc(request.materialTitle)}</h3><span class="tag ${request.status==='approved'?'green':request.status==='pending'?'blue':'amber'}">${{pending:'待审核',approved:'已通过',rejected:'需补充'}[request.status]}</span></header><p>${esc(request.description)}</p>${request.materialUrl?`<p>材料链接：${esc(request.materialUrl)}</p>`:''}<div class="meta-line"><span>提交 ${date(request.createdAt.slice(0,10))}</span>${request.reviewedAt?`<span>处理 ${date(request.reviewedAt.slice(0,10))}</span>`:''}</div>${request.reviewNote?`<div class="info-line">处理意见：${esc(request.reviewNote)}</div>`:''}</article>`).join('')}`;
    sourceDialog.showModal();
  }

  async function reviewSkill(decision) {
    if(isSaving())return;
    const result=G.simulateReview(data,document.getElementById('review-skill').value,decision,document.getElementById('review-skill-note').value);
    if(result.error){reviewStatus(result.error);return;}
    skillSaving=true;syncReviewControls();
    try{await persist(result.state);document.getElementById('review-skill-note').value='';render();reviewStatus(decision==='approved'?'技能验证已模拟通过，新增证据并更新成长阶段。':'技能材料已退回，学生可以补充后重新申请。');}
    catch(error){reviewStatus(error.message);}
    finally{skillSaving=false;syncReviewControls();}
  }

  function renderGrowth() {
    const goal = M.currentGoal(data);
    const directionSummary=G.forDirection(data);
    const summary=skillScope==='direction' && directionSummary ? directionSummary : G.summarize(data);
    return `<div class="page-heading growth-heading"><div><h1>画像与目标</h1></div><span class="growth-owner"><span class="avatar small" aria-hidden="true">${esc(data.profile.name.slice(0,1))}</span>${esc(data.profile.name)}的成长空间</span></div>
      <section class="panel personal-goal-panel" aria-labelledby="personal-goal-title"><div class="personal-goal-top"><div class="personal-goal-heading"><span class="goal-panel-symbol" aria-hidden="true">${UI.icon('target')}</span><div class="personal-goal-copy"><div class="personal-goal-label">当前目标 <span class="tag ${goal ? 'blue' : 'outline'}">${goal ? '进行中' : '待设置'}</span></div><h2 id="personal-goal-title">${esc(goal?.title || '尚未设置目标')}</h2></div></div><div class="button-row goal-actions">${goal ? '<button type="button" class="button small" data-action="manage-goals">更换方向</button><button type="button" class="button primary small" data-action="edit-current-goal">修改目标</button>' : '<button type="button" class="button primary small" data-action="manage-goals">设置目标</button>'}</div></div>${goal?.description ? `<p class="personal-goal-description">${esc(goal.description)}</p>` : ''}<div class="personal-goal-bottom"><div class="goal-metadata">${goal ? `<span class="goal-period">${UI.icon('clock')}<span>${goalPeriod(goal)}</span></span>${tags(goal.tags)}` : ''}</div><button type="button" class="goal-history-link text-link" data-action="show-history">目标历史${data.goals.length ? `（${data.goals.length}）` : ''}</button></div></section>
      ${pathwayView(goal)}
      <div class="growth-capabilities">${renderSkillCards(summary)}${renderCapabilityChart(summary)}</div>
      <details class="growth-profile-details" ${editingProfile ? 'open' : ''}><summary>${UI.icon('user')} 个人资料 <span>专业、兴趣与技能</span></summary><div class="growth-profile-content">${renderProfileDetails()}</div></details>`;
  }

  function pathwayView(goal) {
    const path = goal?.pathway;
    const direction = M.directions.find(item => item.id === path?.primaryDirection);
    if (!direction) return '';
    const explore = M.directions.find(item => item.id === path.exploreDirection);
    const sub = direction.tracks.find(item => item.id === path.subDirection);
    const chosen = sub || direction;
    return `<details class="goal-pathway"><summary>学习路径 · ${esc(chosen.title)}<span>${esc(path.pathStage)} · ${esc(path.pathTrack)}</span></summary>${explore ? `<p>探索方向：${esc(explore.title)}</p>` : ''}<ol class="pathway-steps">${chosen.steps.map((step,i)=>`<li class="${M.pathStages[i]===path.pathStage?'current':''}"><small>${M.pathStages[i]}</small><span>${esc(step)}</span></li>`).join('')}</ol><p>建议成果：${esc(chosen.evidence)}</p></details>`;
  }

  function pathSelect(name,label,choices,value,emptyLabel) {
    return `<div class="field"><label for="goal-${name}">${label}</label><select id="goal-${name}" name="${name}" aria-describedby="error-${name}">${emptyLabel ? `<option value="">${emptyLabel}</option>` : ''}${choices.map(item=>`<option value="${esc(item.id)}" ${item.id===value?'selected':''}>${esc(item.title)}</option>`).join('')}</select><span class="field-error" id="error-${name}"></span></div>`;
  }

  function openGoalManager() {
    goalManager.innerHTML = `<div class="dialog-header"><div><h2 id="goal-manager-title">选择成长方向</h2><p>工科 · 9类专业。展开小方向，查看对应学习路径。</p></div><button type="button" class="close-button" data-action="close-goal-manager" aria-label="关闭方向选择">×</button></div><div class="engineering-directions">${M.directions.map((d,i)=>`<article><div class="direction-heading"><span>${String(i+1).padStart(2,'0')}</span><h3>${esc(d.title)}</h3></div><p>${esc(d.majors)}</p><div class="direction-subtracks">${d.tracks.map(t=>`<details class="direction-subtrack"><summary>${esc(t.title)}<small>查看路径</small></summary><ol>${t.steps.map((step,i)=>`<li><small>${M.pathStages[i]}</small>${esc(step)}</li>`).join('')}</ol><p>建议成果：${esc(t.evidence)}</p><button type="button" class="button small" data-action="choose-engineering" data-id="${d.id}" data-sub="${t.id}">选择此小方向</button></details>`).join('')}</div></article>`).join('')}</div><div class="goal-manager-custom"><span class="subtle">方向分组供探索使用，可跨专业选择。</span><button type="button" class="button" data-action="custom-goal">暂未确定 / 自定义</button></div><details class="legacy-goal-templates"><summary>已有目标模板</summary><div class="goal-direction-list">${catalog.map(t=>`<article><div><h3>${esc(t.title)}</h3><p>${esc(t.description)}</p></div><button type="button" class="button small" data-action="template-goal" data-id="${t.id}" ${t.active?'':'disabled'}>${t.active?'选择':'已停用'}</button></article>`).join('')}</div></details>`;
    goalManager.showModal();
    goalManager.querySelector('.close-button').focus();
  }

  function openGoalHistory() {
    sourceDialog.innerHTML = `<div class="dialog-header"><div><h2 id="source-title">目标历史</h2><p>目标修改会保留版本，参与时的目标快照保持不变。</p></div><button type="button" class="close-button" data-action="close-source" aria-label="关闭详情">×</button></div>${data.goals.length ? [...data.goals].reverse().map(goal => `<article class="history-item"><header><h3>${esc(goal.title)}</h3><span class="tag ${goal.id === data.currentGoalId ? 'blue' : 'outline'}">${goal.id === data.currentGoalId ? '当前使用' : '历史版本'}</span></header><p>${esc(goal.description || '未填写说明')}</p>${pathwayView(goal)}<div class="meta-line"><span>${goalPeriod(goal)}</span><span>v${esc(goal.version)}</span></div></article>`).join('') : empty('还没有目标记录','设置目标后，修改与切换的历史会保留在这里。')}`;
    sourceDialog.showModal();
  }

  function openGoal(mode, templateId = null, directionId = '', subId = '') {
    const template = catalog.find(t => t.id === templateId);
    const current = mode === 'edit' ? M.currentGoal(data) : null;
    if (goalManager.open) goalManager.close();
    if (mode === 'template' && !template?.active) { toast('该模板已停用，请选择其他方向。'); return; }
    goalDraft = current ? { mode: 'custom', templateId: null, title: current.title, description: current.description || '', tags: current.tags.join('，'), start: current.start, end: current.end, editing: true } : { mode, templateId, title: template?.title || '', description: '', tags: '', start: '', end: '' };
    const direction = M.directions.find(item => item.id === directionId);
    Object.assign(goalDraft, { subDirection: current?.pathway?.subDirection || subId, primaryDirection: current?.pathway?.primaryDirection || direction?.id || '', exploreDirection: current?.pathway?.exploreDirection || '', pathStage: current?.pathway?.pathStage || M.pathStages[0], pathTrack: current?.pathway?.pathTrack || M.pathTracks[0] });
    if(direction) { const sub=direction.tracks.find(t=>t.id===subId); goalDraft.title = '完成' + (sub?.title || direction.title) + '入门实践'; goalDraft.tags = [direction.title, sub?.title].filter(Boolean).join('，'); }
    goalInitialDraft = M.copy(goalDraft);
    goalDialog.innerHTML = `<div class="dialog-header"><div><h2 id="goal-dialog-title">${current ? '修改当前目标' : mode === 'template' ? '设置目标周期' : '创建自定义目标'}</h2><p>${current ? '保存为新的目标版本，旧记录和参与时快照继续保留。' : '保存后将成为你的当前目标，之前的记录会保留。'}</p></div><button type="button" class="close-button" data-action="close-goal" aria-label="关闭目标表单">×</button></div><form id="goal-form" novalidate><div class="form-grid"><div class="field span-2"><label for="goal-title">目标名称</label><input id="goal-title" name="title" value="${esc(goalDraft.title)}" maxlength="100" ${mode === 'template' ? 'readonly' : ''} aria-describedby="error-title" placeholder="例如：完成一个可交付的前端实践项目"><span class="field-error" id="error-title"></span></div>${mode === 'template' ? `<div class="span-2">${tags(template.tags)}<span class="field-error" id="error-templateId" role="status"></span></div>` : `<div class="field span-2"><label for="goal-tags">方向或技能标签 <span class="subtle">选填</span></label><input id="goal-tags" name="tags" value="${esc(goalDraft.tags)}" placeholder="例如：前端开发，团队协作"><span class="hint">多个标签用逗号分隔。</span></div>`}${pathSelect('primaryDirection','主方向',M.directions,goalDraft.primaryDirection,'暂未确定')}${pathSelect('subDirection','具体小方向',M.directions.find(d=>d.id===goalDraft.primaryDirection)?.tracks || [],goalDraft.subDirection,'先了解大类 / 暂未确定')}${pathSelect('exploreDirection','探索方向（选填）',M.directions,goalDraft.exploreDirection,'暂不选择')}${pathSelect('pathStage','当前阶段',M.pathStages.map(title=>({id:title,title})),goalDraft.pathStage)}${pathSelect('pathTrack','实践偏向',M.pathTracks.map(title=>({id:title,title})),goalDraft.pathTrack)}<div class="field"><label for="goal-start">开始日期</label><input id="goal-start" type="date" name="start" value="${esc(goalDraft.start)}" aria-describedby="error-start"><span class="field-error" id="error-start"></span></div><div class="field"><label for="goal-end">结束日期</label><input id="goal-end" type="date" name="end" value="${esc(goalDraft.end)}" aria-describedby="error-end"><span class="field-error" id="error-end"></span></div><div class="field span-2"><label for="goal-description">目标说明 <span class="subtle">选填</span></label><textarea id="goal-description" name="description" maxlength="1000" placeholder="说说你想完成什么，以及希望留下什么成果。" aria-describedby="error-description">${esc(goalDraft.description)}</textarea><span class="field-error" id="error-description"></span></div></div><div class="goal-preview"><h3>目标摘要预览</h3><strong id="preview-goal-title">${esc(goalDraft.title || '填写你的目标名称')}</strong><span id="preview-goal-period">${goalDraft.start && goalDraft.end ? `${date(goalDraft.start)} — ${date(goalDraft.end)}` : '请选择目标周期'}</span></div><div id="goal-error" class="form-error" aria-live="polite"></div><div class="form-actions"><span class="subtle">周期形式为本轮设计建议。</span><div class="button-row"><button type="button" class="button" data-action="close-goal">取消</button><button type="submit" class="button primary">${current ? '保存修改' : M.currentGoal(data) ? '保存并切换目标' : '保存为当前目标'}</button></div></div></form>`;
    goalDialog.showModal();
    goalDialog.querySelector(mode === 'template' ? '#goal-start' : '#goal-title').focus();
  }

  function showSource(type, id) {
    let title = ''; let body = '';
    if (type === 'evidence') {
      const e = data.evidence.find(x => x.id === id); if (!e) return;
      title = '已验证技能的证据来源';
      body = `<div class="info-line success">已审核 · 演示证据</div><dl class="source-detail"><div><dt>技能</dt><dd>${esc(e.skill)}</dd></div><div><dt>来源实践</dt><dd>${esc(e.source)}</dd></div><div><dt>材料及版本</dt><dd>${esc(e.material)}</dd></div><div><dt>审核记录</dt><dd>${esc(e.reviewer)} · ${date(e.reviewedAt)}</dd></div><div><dt>判断依据</dt><dd>${esc(e.note)}</dd></div></dl>`;
    } else if (type === 'project') {
      const p = data.projects.find(x => x.id === id); if (!p) return;
      title = '实践与补正意见摘要';
      body = `<h3>${esc(p.name)}</h3><dl class="source-detail"><div class="source-grid"><div><dt>本人身份</dt><dd>${esc(p.role)}</dd></div><div><dt>实践状态</dt><dd>${esc(p.status)}</dd></div></div><div><dt>当前提交</dt><dd>${esc(p.submission)}</dd></div><div><dt>导师反馈（演示）</dt><dd>${esc(p.feedback || '暂无反馈')}</dd></div><div><dt>下一里程碑</dt><dd>${esc(p.milestone)} · ${date(p.deadline)}</dd></div><div><dt>参与时保存的目标</dt><dd>${esc(p.goalSnapshot?.title || '未关联目标')}<br><span class="subtle">切换当前目标后，这份历史关联保持原样。</span></dd></div></dl><div class="info-line">这是来源摘要示意。材料提交与完整实践工作台在后续页面中细化。</div>`;
    } else if (type === 'grade') {
      const g = R.grade(data, id); if (!g) return;
      const version = R.current(g);
      title = '本人已发布成绩摘要';
      body = `<div class="info-line">演示记录，不代表正式成绩或结业资格。</div><dl class="source-detail"><div><dt>课程/实践</dt><dd>${esc(g.name)}</dd></div><div class="source-grid"><div><dt>总评</dt><dd>${esc(version.score === null ? '暂无总评' : version.score)}</dd></div><div><dt>批次</dt><dd>${esc(g.batch)}</dd></div></div><div><dt>发布记录</dt><dd>${date(version.publishedAt)} · 第 ${version.number} 版</dd></div></dl><a class="button small" data-results-route="grade-detail" data-id="${esc(g.id)}" href="#/student/grades/${encodeURIComponent(g.id)}">查看成绩明细</a>`;
    } else if (type === 'opportunity') {
      const opportunity = P.getOpportunity(id) || demoOpportunity();
      if (opportunity) { selectedOpportunityId = opportunity.id; navigate('opportunity'); } else navigate('opportunities');
      return;
    } else if (type === 'template') {
      const t = catalog.find(x => x.id === id); if (!t) return;
      title = t.title; body = `<span class="tag ${t.active ? 'blue' : 'amber'}">${esc(t.category)} · ${t.active ? '可选择' : '已停用'}</span><p style="margin-top:16px">${esc(t.description)}</p>${tags(t.tags)}<div class="info-line">方向模板提供目标参考，不自动生成学习路径。已保存的历史目标不会因模板停用而消失。</div>`;
    } else return;
    sourceDialog.innerHTML = `<div class="dialog-header"><div><h2 id="source-title">${esc(title)}</h2></div><button type="button" class="close-button" data-action="close-source" aria-label="关闭详情">×</button></div>${body}<div class="button-row end" style="margin-top:25px"><button type="button" class="button" data-action="close-source">返回</button></div>`;
    sourceDialog.showModal();
  }

  function showErrors(form, errors) {
    form.querySelectorAll('.field-error').forEach(el => { el.textContent = ''; });
    form.querySelectorAll('[aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
    Object.entries(errors).forEach(([key, message]) => {
      const error = form.querySelector('#error-' + key);
      if (error) error.textContent = message;
      const field = form.elements.namedItem(key);
      if (field) field.setAttribute('aria-invalid', 'true');
    });
    const first = form.querySelector('[aria-invalid="true"]');
    if (first) first.focus();
  }
  function busyForm(form, busy, label) {
    form.querySelectorAll('button,input,select,textarea').forEach(el => { el.disabled = busy; });
    form.setAttribute('aria-busy', String(busy));
    const submit = form.querySelector('button[type="submit"]');
    if (busy) { submit.dataset.originalText = submit.textContent; submit.textContent = label; }
    else submit.textContent = submit.dataset.originalText || submit.textContent;
  }

  async function saveProfile(form) {
    if (profileSaving) return;
    const pendingError=G.validateProfileChange(data,M.parseTags(profileDraft.skills));
    if(pendingError){form.querySelector('#profile-error').innerHTML=feedback(pendingError);return;}
    const result = M.updateProfile(data, profileDraft);
    showErrors(form, result.errors || {});
    if (result.errors) return;
    profileSaving = true; busyForm(form, true, '保存中…');
    form.querySelector('#profile-error').innerHTML = '';
    try { await persist(result.state); editingProfile = false; profileDraft = null; render(); toast('资料已保存，本地演示页面已同步更新。'); }
    catch (error) { busyForm(form, false); form.querySelector('#profile-error').innerHTML = feedback(error.message); }
    finally { profileSaving = false; syncReviewControls(); }
  }
  async function saveGoal(form) {
    if (goalSaving) return;
    const errors = M.validateGoal(goalDraft, catalog);
    showErrors(form, errors);
    form.querySelector('#goal-error').innerHTML = '';
    if (Object.keys(errors).length) return;
    const previous = M.currentGoal(data);
    const editing = !!goalDraft.editing;
    const candidateTitle = goalDraft.mode === 'template' ? catalog.find(t => t.id === goalDraft.templateId).title : goalDraft.title.trim();
    if (previous && !await confirmAction(goalDraft.editing ? '确认更新当前目标' : '确认切换当前目标', editing ? `将“${previous.title}”更新为“${candidateTitle}”。\n修改前的版本会保留，已参与项目的目标快照不变。` : `从“${previous.title}”切换为“${candidateTitle}”。\n原目标会保留在历史中，已参与项目的目标记录不变。`, goalDraft.editing ? '确认更新' : '确认切换')) return;
    const result = M.commitGoal(data, M.copy(goalDraft), catalog);
    if (result.errors) { showErrors(form, result.errors); form.querySelector('#goal-error').innerHTML = feedback(Object.values(result.errors)[0]); return; }
    goalSaving = true; busyForm(form, true, '保存中…');
    try { await persist(result.state); goalDialog.close(); goalTab = 'templates'; render(); toast(editing ? '目标修改已保存，旧版本和参与快照已保留。' : previous ? '当前目标已切换，历史目标和参与记录已保留。' : '目标已保存，可以返回首页查看。'); }
    catch (error) { busyForm(form, false); form.querySelector('#goal-error').innerHTML = feedback(error.message); }
    finally { goalSaving = false; syncReviewControls(); }
  }
  async function closeGoal() {
    if (goalSaving) return;
    if (goalDirty() && !await confirmAction('放弃这次目标编辑？', '当前输入尚未保存。取消关闭可以继续编辑。', '放弃编辑')) return;
    goalDialog.close();
  }

  function syncReviewControls() {
    const skillSelect=document.getElementById('review-skill'),skillSelected=skillSelect.value;
    const skillPending=G.ownRequests(data).filter(request=>request.status==='pending');
    skillSelect.innerHTML=skillPending.length?skillPending.map(request=>`<option value="${esc(request.id)}">${esc(request.skillName)}</option>`).join(''):'<option value="">暂无待审核技能</option>';
    if(skillPending.some(request=>request.id===skillSelected))skillSelect.value=skillSelected;
    skillSelect.disabled=!skillPending.length||isSaving();
    ['review-skill-approve','review-skill-reject'].forEach(id=>{document.getElementById(id).disabled=!skillPending.length||isSaving();});
    const select = document.getElementById('review-application');
    const selected = select.value;
    const pending = P.ownApplications(data).filter(a => a.status === 'pending');
    select.innerHTML = pending.length ? pending.map(a => `<option value="${esc(a.id)}">${esc(P.getOpportunity(a.opportunityId)?.title || '历史机会')}</option>`).join('') : '<option value="">暂无待审核报名</option>';
    if (pending.some(a => a.id === selected)) select.value = selected;
    select.disabled = !pending.length || isSaving();
    ['review-approve', 'review-reject'].forEach(id => { document.getElementById(id).disabled = !pending.length || isSaving(); });
  }
  function openApplication(id) {
    if (isSaving()) return;
    const op = P.getOpportunity(id);
    const gate = P.availability(data, op);
    if (!gate.allowed) { toast(gate.reason); render(); return; }
    applicationDraft = { opportunityId: id, reason: '' };
    applicationDialog.innerHTML = V.applicationForm(viewContext(), op, applicationDraft);
    applicationDialog.showModal();
    document.getElementById('application-reason').focus();
  }
  async function closeApplication() {
    if (applicationSaving) return;
    if (applicationDraft?.reason.trim() && !await confirmAction('放弃这次报名编辑？', '报名说明还未提交，可以取消关闭继续填写。', '放弃编辑')) return;
    applicationDialog.close();
  }
  async function saveApplication(form) {
    if (isSaving() || !applicationDraft) return;
    const result = P.submitApplication(data, applicationDraft.opportunityId, applicationDraft);
    const input = form.querySelector('#application-reason');
    input.removeAttribute('aria-invalid');
    form.querySelector('#application-reason-error').textContent = '';
    form.querySelector('#application-error').innerHTML = '';
    if (result.error) {
      if (result.field === 'reason') { form.querySelector('#application-reason-error').textContent = result.error; input.setAttribute('aria-invalid', 'true'); input.focus(); }
      else form.querySelector('#application-error').innerHTML = feedback(result.error);
      return;
    }
    applicationSaving = true; busyForm(form, true, '提交中…'); syncReviewControls();
    try { await persist(result.state); applicationDialog.close(); render(); toast('报名已提交，请等待审核；参与记录暂不增加。'); }
    catch (error) { busyForm(form, false); form.querySelector('#application-error').innerHTML = feedback(error.message); }
    finally { applicationSaving = false; syncReviewControls(); }
  }
  async function withdrawApplication(id) {
    if (isSaving()) return;
    if (!await confirmAction('撤回这次报名？', '撤回后保留历史记录。本演示允许重新报名，实际规则待确认。', '确认撤回')) return;
    const result = P.withdrawApplication(data, id);
    if (result.error) { toast(result.error); render(); return; }
    applicationSaving = true; syncReviewControls();
    try { await persist(result.state); render(); toast('已撤回报名，历史记录仍然保留。'); }
    catch (error) { toast(error.message); }
    finally { applicationSaving = false; syncReviewControls(); }
  }
  async function reviewApplication(decision) {
    if (isSaving()) return;
    const id = document.getElementById('review-application').value;
    const result = P.simulateReview(data, id, decision, decision === 'rejected' ? document.getElementById('review-reason').value : '');
    if (result.error) { reviewStatus(result.error); return; }
    applicationSaving = true; syncReviewControls();
    try { await persist(result.state); render(); reviewStatus(decision === 'approved' ? '已模拟外部审核通过；新增参与记录，尚未验收或认证。' : '已模拟外部审核拒绝；原因保留在报名记录。'); toast('演示审核结果已更新，请查看报名与参与记录。'); }
    catch (error) { reviewStatus(error.message); }
    finally { applicationSaving = false; syncReviewControls(); }
  }

  function openCompletion(id) {
    const p = R.program(data, id); const previous = R.application(data, id);
    if (!p || !R.eligibility(data, id).eligible || (previous && previous.status !== 'returned')) { toast('当前无法提交该结业申请，请重新核对资格和状态。'); render(); return; }
    const context = { ownerId: data.profile.studentNo, programId: id, expectedRevision: previous?.revision || 0 };
    const restored = draftStore.read(context);
    completionDraft = { id, ...context, note: restored.draft?.note || '', savedNote: restored.draft?.note || '', draftStatus: restored.error || (restored.stale ? '申请状态已变化，旧版草稿未用于本次填写。' : restored.draft ? draftStatus(restored.draft) : '说明会自动暂存于本机，关闭后可继续填写；暂存不等于提交。') };
    resultsDialog.innerHTML = RV.applicationForm(viewContext(), p, completionDraft);
    resultsDialog.showModal(); document.getElementById('completion-note').focus();
  }
  async function closeCompletion() {
    if (completionSaving) return;
    if (completionDirty() && !await confirmAction('说明尚未暂存', '关闭后会丢失未暂存的输入，可以取消后继续填写。', '仍然关闭')) return;
    resultsDialog.close();
  }
  function draftStatus(draft) {
    const time = new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(draft.updatedAt));
    return `已暂存于本机 · ${time}，尚未提交。`;
  }
  function saveCompletionDraft() {
    if (!completionDraft || completionSaving) return;
    const result = draftStore.save(completionDraft, completionDraft.note);
    if (!result.error) completionDraft.savedNote = completionDraft.note;
    completionDraft.draftStatus = result.error || (result.draft ? draftStatus(result.draft) : '草稿已清空，填写说明后自动暂存。');
    const status = document.getElementById('completion-draft-status');
    if (status) { if (status.textContent !== completionDraft.draftStatus) status.textContent = completionDraft.draftStatus; status.classList.toggle('draft-error', !!result.error); }
  }
  async function saveCompletion(form) {
    if (isSaving() || !completionDraft) return;
    const result = R.applyCompletion(data, completionDraft.id, completionDraft.note, { expectedRevision: completionDraft.expectedRevision });
    const field = form.querySelector('#completion-note');
    field.removeAttribute('aria-invalid'); form.querySelector('#completion-note-error').textContent = ''; form.querySelector('#completion-error').innerHTML = '';
    if (result.error) {
      if (result.field === 'note') { field.setAttribute('aria-invalid', 'true'); form.querySelector('#completion-note-error').textContent = result.error; field.focus(); }
      else form.querySelector('#completion-error').innerHTML = feedback(result.error);
      return;
    }
    completionSaving = true; busyForm(form, true, '提交中…'); syncReviewControls();
    try { await persist(result.state); const cleared = draftStore.clear(completionDraft); resultsDialog.close(); render(); toast('结业申请已保存到本地演示记录，状态为待审核。'); if (cleared.error) reviewStatus(cleared.error + '旧版草稿不会用于下一次申请。'); }
    catch (error) { busyForm(form, false); form.querySelector('#completion-error').innerHTML = feedback(error.message); }
    finally { completionSaving = false; syncReviewControls(); }
  }
  function filterResults(form) {
    const fields = new FormData(form);
    resultFilters = { q: String(fields.get('q') || '').trim().slice(0, 100), type: String(fields.get('type') || 'all'), outcome: String(fields.get('outcome') || 'all') };
    resultFiltersOpen = resultFilters.type !== 'all' || resultFilters.outcome !== 'all';
    history.replaceState(null, '', '#' + urlFor('grades')); render();
  }
  function exportResults() {
    const rows = RV.filteredGrades(viewContext());
    if (!rows.length) return;
    const blob = new Blob([R.transcriptCSV(data, rows)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = '启明成绩_演示_2026-11-02.csv';
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('已生成本人当前筛选结果的演示 CSV。');
  }
  function rememberWorkbench(form) {
    const fields = new FormData(form);
    workbenchDraft = { programId: workbenchProgramId, role: workbenchRole, note: String(fields.get('note') || ''), decision: String(fields.get('decision') || 'returned'), status: String(fields.get('status') || 'suspended') };
  }
  async function saveWorkbench(form) {
    if (isSaving()) return;
    rememberWorkbench(form);
    const fields = new FormData(form);
    const options = { actor: workbenchRole, expectedRevision: Number(form.dataset.revision) };
    let result;
    if (form.id === 'certification-review') result = W.review(data, form.dataset.program, fields.get('decision'), fields.get('note'), options);
    else if (form.id === 'certification-reconsider') {
      if (!await confirmAction('确认转入复核补正？', '将保留原申请和审核记录，等待学生重新提交；已有证书暂停使用，复核通过后单独换发。', '确认转入复核')) return;
      result = W.reconsider(data, form.dataset.program, fields.get('note'), options);
    }
    else if (form.id === 'certification-issue') {
      const replacing = R.latestCertificate(data, form.dataset.program)?.replacementRequired;
      if (!await confirmAction(replacing ? '确认换发演示证书？' : '确认签发演示证书？', replacing ? '将生成新编号及验证码，旧证书保留原依据并标记已撤销。新旧记录相互关联。' : `将为${data.profile.name}的“${R.program(data, form.dataset.program)?.title || '结业申请'}”生成关联本次审核的演示样张。`, replacing ? '确认换发' : '确认签发')) return;
      result = W.issue(data, form.dataset.program, options);
    } else {
      if (!await confirmAction('确认变更演示证书状态？', '变更原因将保留，学生端和验证结果同步更新；撤销后不能直接恢复。', '确认变更')) return;
      result = W.changeCertificate(data, form.dataset.certificate, fields.get('status'), fields.get('note'), { actor: workbenchRole, expectedStatus: form.dataset.status });
    }
    form.querySelector('#certification-error').innerHTML = '';
    const noteField = form.elements.namedItem('note'); noteField?.removeAttribute('aria-invalid');
    if (result.error) {
      form.querySelector('#certification-error').innerHTML = feedback(result.error);
      if (result.field === 'note' && noteField) { noteField.setAttribute('aria-invalid', 'true'); noteField.focus(); }
      return;
    }
    workbenchSaving = true; busyForm(form, true, '正在保存…'); syncReviewControls();
    try { await persist(result.state); workbenchDraft = null; render(); toast(form.id === 'certification-issue' ? '演示证书已签发，可切换到学生端查看。' : '办理结果已保存，学生端记录已同步。'); }
    catch (error) { busyForm(form, false); form.querySelector('#certification-error').innerHTML = feedback(error.message); }
    finally { workbenchSaving = false; syncReviewControls(); }
  }
  async function prepareCertification(key) {
    if (isSaving()) return;
    const scene = W.scenarios[key]; if (!scene) return;
    if (!await confirmAction('载入“' + scene.title + '”演练？', '将重置成绩认证演示记录、本人申请草稿和未确认的处理意见。画像、目标及科创实践记录保留。', '载入演练')) return;
    const result = W.prepareScenario(data, key);
    if (result.error) { toast(result.error); return; }
    workbenchSaving = true; syncReviewControls();
    try {
      await persist(result.state);
      const cleared = draftStore.clearOwner(data.profile.studentNo);
      workbenchDraft = null; workbenchRole = 'reviewer'; workbenchProgramId = result.programId;
      history.replaceState(null, '', '#' + urlFor('workbench')); render();
      if (cleared.error) reviewStatus(cleared.error);
      toast('已载入' + scene.title + '，可从学生端开始演练。');
    } catch (error) { toast(error.message); }
    finally { workbenchSaving = false; syncReviewControls(); }
  }
  async function changeCertificationBasis(id) {
    if (isSaving()) return;
    if (!await confirmAction('演练认证依据变化？', '仅为本项目追加同分数的演示成绩版本，保留申请与证书历史。不会真实录分；之后可在结业审核中转入复核补正。', '模拟依据更正')) return;
    const result = W.basisScenario(data, id);
    if (result.error) { toast(result.error); return; }
    workbenchSaving = true; syncReviewControls();
    try { await persist(result.state); render(); toast('演示成绩版本已更正，请前往结业审核办理复核。'); }
    catch (error) { toast(error.message); }
    finally { workbenchSaving = false; syncReviewControls(); }
  }
  document.addEventListener('click', async event => {
    const resultLink = event.target.closest('[data-results-route]');
    if (resultLink) { event.preventDefault(); if (sourceDialog.open) sourceDialog.close(); selectedResultId = resultLink.dataset.id || null; await navigate(resultLink.dataset.resultsRoute); return; }
    const routeLink = event.target.closest('[data-route]');
    if (routeLink) { event.preventDefault(); document.querySelector('.review-tools').removeAttribute('open'); await navigate(routeLink.dataset.route); return; }
    const button = event.target.closest('[data-action]'); if (!button) return;
    const action = button.dataset.action;
    if (isSaving()) { toast('正在保存，请稍候。'); return; }
    if (action === 'certification-scenario') await prepareCertification(button.dataset.id);
    else if (action === 'certification-basis') await changeCertificationBasis(button.dataset.id);
    else if (action === 'certification-material') {
      const content = WV.materialDialog(viewContext(), button.dataset.program, button.dataset.id);
      if (content) { sourceDialog.innerHTML = content; sourceDialog.showModal(); }
    }
    else if (action === 'results-apply') openCompletion(button.dataset.id);
    else if (action === 'results-close') await closeCompletion();
    else if (action === 'results-export') exportResults();
    else if (action === 'results-toggle-filters') {
      resultFiltersOpen = !resultFiltersOpen;
      button.setAttribute('aria-expanded', String(resultFiltersOpen));
      document.getElementById('result-advanced').classList.toggle('is-open', resultFiltersOpen);
    }
    else if (action === 'results-reset-filters') { resultFilters = { q: '', type: 'all', outcome: 'all' }; resultFiltersOpen = false; history.replaceState(null, '', '#' + urlFor('grades')); render(); }
    else if (action === 'results-print') {
      const c = R.certificate(data, button.dataset.id);
      if (!c || R.certificateState(data, c).status !== 'valid') { toast('证书当前不能作为有效演示凭证打印。'); render(); return; }
      document.body.dataset.printResult = 'certificate'; window.print();
    }
    else if (action === 'edit-current-goal') { openGoal('edit'); }
    else if (action === 'choose-engineering') { openGoal('custom', null, button.dataset.id, button.dataset.sub);  }
    else if (action === 'manage-goals') { openGoalManager(); }
    else if (action === 'close-goal-manager') { goalManager.close(); }
    else if (action === 'show-history') { openGoalHistory(); }
    else if (action === 'skill-scope') { skillScope=button.dataset.scope==='all'?'all':'direction';selectedDimension=null;render();main.querySelector(`[data-action="skill-scope"][data-scope="${skillScope}"]`)?.focus({preventScroll:true}); }
    else if (action === 'start-required-skill') openSkill(null,button.dataset.skill);
    else if (action === 'add-skill') openSkill();
    else if (action === 'edit-skill') openSkill(button.dataset.skill);
    else if (action === 'verify-skill') openSkillVerification(button.dataset.skill);
    else if (action === 'skill-review-history') openSkillReviewHistory(button.dataset.skill);
    else if (action === 'close-skill') await closeSkill();
    else if (action === 'select-capability-dimension') selectDimension(button.dataset.dimension);
    else if (action === 'clear-capability-dimension') { selectedDimension=null;render(); }
    else if (action === 'edit-profile') { editingProfile = true; profileDraft = profileInput(); render(); document.getElementById('profile-major').focus(); }
    else if (action === 'cancel-profile') {
      if (profileDirty() && !await confirmAction('取消资料编辑？', '未保存的修改将恢复到上一次保存的内容。', '放弃修改')) return;
      editingProfile = false; profileDraft = null; render();
    }
    else if (action === 'template-goal') openGoal('template', button.dataset.id);
    else if (action === 'custom-goal') openGoal('custom');
    else if (action === 'template-info') showSource('template', button.dataset.id);
    else if (action === 'source') showSource(button.dataset.type, button.dataset.id);
    else if (action === 'close-source') sourceDialog.close();
    else if (action === 'close-goal') await closeGoal();
    else if (action === 'opportunity-detail') { selectedOpportunityId = button.dataset.id; await navigate('opportunity'); }
    else if (action === 'open-application') openApplication(button.dataset.id);
    else if (action === 'close-application') await closeApplication();
    else if (action === 'withdraw-application') await withdrawApplication(button.dataset.id);
    else if (action === 'reset-filters') { filters = { type: 'all', direction: 'all', tag: 'all', available: false }; history.replaceState(null, '', '#' + urlFor(route)); render(); }
    else if (action === 'practice-tab') { practiceTab = button.dataset.tab; history.replaceState(null, '', '#' + urlFor('practice')); render(); }
    else if (action === 'reload-data') await loadData(false);
  });
  document.addEventListener('input', event => {
    const target = event.target;
    if (target.form?.id.startsWith('certification-')) rememberWorkbench(target.form);
    if (target.form?.id === 'skill-form' && skillDraft && target.name) skillDraft[target.name]=target.value;
    if (target.form?.id === 'profile-form' && profileDraft && target.name) profileDraft[target.name] = target.value;
    if (target.form?.id === 'application-form' && applicationDraft && target.name === 'reason') applicationDraft.reason = target.value;
    if (target.form?.id === 'completion-form' && completionDraft && target.name === 'note') { completionDraft.note = target.value; saveCompletionDraft(); }
    if (target.form?.id === 'goal-form' && goalDraft && target.name) {
      goalDraft[target.name] = target.value;
      document.getElementById('preview-goal-title').textContent = goalDraft.title.trim() || '填写你的目标名称';
      document.getElementById('preview-goal-period').textContent = goalDraft.start && goalDraft.end ? `${goalDraft.start} — ${goalDraft.end}` : '请选择目标周期';
    }
  });
  document.addEventListener('change', event => {
    if (event.target.form?.id.startsWith('certification-')) rememberWorkbench(event.target.form);
    if(event.target.form?.id==='skill-form'&&skillDraft)skillDraft[event.target.name]=event.target.value;
    if (event.target.form?.id === 'profile-form' && profileDraft) profileDraft[event.target.name] = event.target.value;
    if (event.target.form?.id === 'goal-form' && goalDraft) {
      goalDraft[event.target.name] = event.target.value;
      if(event.target.name==='primaryDirection') {
        goalDraft.subDirection='';
        const choices=M.directions.find(d=>d.id===goalDraft.primaryDirection)?.tracks || [];
        document.getElementById('goal-subDirection').innerHTML='<option value="">先了解大类 / 暂未确定</option>'+choices.map(t=>`<option value="${esc(t.id)}">${esc(t.title)}</option>`).join('');
        document.getElementById('error-subDirection').textContent='';
      }
    }
    if (event.target.form?.id === 'opportunity-filters') {
      filters[event.target.name] = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
      const id = event.target.id;
      history.replaceState(null, '', '#' + urlFor('opportunities')); render();
      if (id) document.getElementById(id)?.focus();
    }
  });
  document.addEventListener('keydown', event => {
    if (event.target.getAttribute('role') !== 'tab' || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const tabs = [...event.target.closest('[role="tablist"]').querySelectorAll('[role="tab"]')];
    const index = tabs.indexOf(event.target);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    const id = tabs[next].id; tabs[next].click(); document.getElementById(id).focus();
  });
  document.addEventListener('submit', async event => {
    if (event.target.id.startsWith('certification-')) { event.preventDefault(); await saveWorkbench(event.target); }
    else if (event.target.id === 'skill-form') { event.preventDefault(); await saveSkillForm(event.target); }
    else if (event.target.id === 'profile-form') { event.preventDefault(); await saveProfile(event.target); }
    else if (event.target.id === 'goal-form') { event.preventDefault(); await saveGoal(event.target); }
    else if (event.target.id === 'application-form') { event.preventDefault(); await saveApplication(event.target); }
    else if (event.target.id === 'completion-form') { event.preventDefault(); await saveCompletion(event.target); }
    else if (event.target.id === 'result-filters') { event.preventDefault(); filterResults(event.target); }
    else if (event.target.id === 'certificate-verification') { event.preventDefault(); verificationCode = String(new FormData(event.target).get('code') || '').trim().slice(0, 64); verificationSubmitted = true; history.replaceState(null, '', '#' + urlFor('verify')); render(); }
    else if (event.target.id === 'opportunity-filters') event.preventDefault();
  });
  skillDialog.addEventListener('cancel',event=>{event.preventDefault();closeSkill();});
  skillDialog.addEventListener('close',()=>{skillDraft=null;skillInitial='';});
  goalDialog.addEventListener('cancel', event => { event.preventDefault(); closeGoal(); });
  goalDialog.addEventListener('close', () => { goalDraft = null; goalInitialDraft = null; });
  applicationDialog.addEventListener('cancel', event => { event.preventDefault(); closeApplication(); });
  applicationDialog.addEventListener('close', () => { applicationDraft = null; });
  resultsDialog.addEventListener('cancel', event => { event.preventDefault(); closeCompletion(); });
  resultsDialog.addEventListener('close', () => { completionDraft = null; });
  window.addEventListener('afterprint', () => { delete document.body.dataset.printResult; });
  window.addEventListener('hashchange', () => navigate(readHash(), false));
  window.addEventListener('popstate', () => { if (!location.hash) navigate('home'); });
  window.addEventListener('beforeunload', event => { if (profileDirty() || (skillDraft && JSON.stringify(skillDraft)!==skillInitial) || goalDirty() || applicationDraft?.reason.trim() || completionDirty() || workbenchDirty() || isSaving()) { event.preventDefault(); event.returnValue = ''; } });

  async function loadData(fail = false) {
    const version = ++loadVersion;
    main.innerHTML = '<div class="loading" role="status">正在读取演示数据…</div>';
    await delay(420);
    if (version !== loadVersion) return;
    if (fail) {
      main.innerHTML = '<section class="panel error-page"><h1>暂时无法读取页面</h1><p>这是一次模拟加载失败，之前保存的数据仍然保留。</p><button type="button" class="button primary" data-action="reload-data">重新加载</button></section>';
      return;
    }
    let warning = '';
    try {
      const serialized = localStorage.getItem(STORAGE_KEY);
      data = R.upgradeState(P.upgradeState(serialized ? M.restoreState(serialized) : M.createState('returning')));
      G.validateState(data);
    } catch { data = R.upgradeState(P.upgradeState(data || M.createState('returning'))); warning = '无法恢复本地记录，已使用内存演示场景；保存时仍会检查存储是否可用。'; }
    document.getElementById('scenario-select').value = data.scenario;
    render(); if (warning) reviewStatus(warning);
  }
  document.getElementById('fail-save').addEventListener('click', () => { failNextSave = true; reviewStatus('下一次有效的保存或报名操作会失败一次；失败后可重试。'); });
  document.getElementById('fail-load').addEventListener('click', async () => {
    if (isSaving() || goalDialog.open || applicationDialog.open || resultsDialog.open || skillDialog.open || goalManager.open) { reviewStatus('请先完成或取消当前表单，再模拟加载失败。'); return; }
    if ((profileDirty() || workbenchDirty()) && !await confirmAction('模拟重新加载？', '这会离开当前编辑状态，未保存的输入将丢弃。', '继续模拟')) return;
    editingProfile = false; profileDraft = null; workbenchDraft = null; await loadData(true);
  });
  document.getElementById('toggle-template').addEventListener('click', () => {
    catalog[0].active = !catalog[0].active;
    document.getElementById('toggle-template').textContent = catalog[0].active ? '模拟首个模板停用' : '恢复首个模板启用';
    reviewStatus(catalog[0].active ? '首个模板已恢复。' : '首个模板已停用；已保存目标保留，新提交会重新校验。');
    render();
  });
  document.getElementById('reset-scenario').addEventListener('click', async () => {
    if (isSaving() || skillDialog.open || goalDialog.open || goalManager.open || applicationDialog.open || resultsDialog.open) { reviewStatus('请先完成或取消当前表单。'); return; }
    const scenario = document.getElementById('scenario-select').value;
    if (!await confirmAction('重置本地演示记录？', '将清除本原型的资料修改、目标历史、新增报名与本人申请草稿，恢复所选场景。其他网站数据不受影响。', '重置演示')) return;
    const candidate = R.upgradeState(P.upgradeState(M.createState(scenario)));
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(candidate)); }
    catch { reviewStatus('浏览器不允许写入本地记录，重置未生效。'); return; }
    const clearedDrafts = draftStore.clearOwner(data.profile.studentNo);
    data = candidate; editingProfile = false; profileDraft = null; workbenchDraft = null; workbenchProgramId = ''; workbenchRole = 'reviewer'; failNextSave = false;
    if (goalDialog.open) goalDialog.close(); if (sourceDialog.open) sourceDialog.close();
    if (applicationDialog.open) applicationDialog.close();
    if (resultsDialog.open) resultsDialog.close();
    catalog.forEach(t => { t.active = true; });
    document.getElementById('toggle-template').textContent = '模拟首个模板停用';
    route = 'home'; goalTab = 'templates'; practiceTab = 'participating'; filters = { type: 'all', direction: 'all', tag: 'all', available: false }; history.replaceState(null, '', '#' + paths.home);
    resultFilters = { q: '', type: 'all', outcome: 'all' };
    render(); reviewStatus(`已恢复“${scenario === 'new' ? '首次使用' : '已有资料与目标'}”场景。` + (clearedDrafts.error || '')); toast('本地演示记录已重置。');
  });
  document.getElementById('review-skill-approve').addEventListener('click',()=>reviewSkill('approved'));
  document.getElementById('review-skill-reject').addEventListener('click',()=>reviewSkill('rejected'));
  document.getElementById('review-approve').addEventListener('click', () => reviewApplication('approved'));
  document.getElementById('review-reject').addEventListener('click', () => reviewApplication('rejected'));
  route = readHash();
  if (!location.hash) history.replaceState(null, '', '#' + urlFor(route));
  loadData();
})();
