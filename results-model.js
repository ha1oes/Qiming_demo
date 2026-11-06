(function (root, factory) {
  const M = typeof module === 'object' && module.exports ? require('./model.js') : root.WireframeModel;
  const api = factory(M);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ResultsModel = api;
})(typeof window !== 'undefined' ? window : globalThis, function (M) {
  'use strict';
  const DEMO_NOW = '2026-11-02T12:00:00+08:00';
  const applicationLabels = { pending: '待审核', returned: '待补正', approved: '审核通过', rejected: '未通过' };
  const certificateLabels = { valid: '有效', suspended: '暂停验证', revoked: '已撤销' };
  const own = (state, rows) => rows.filter(row => row.ownerId === state.profile.studentNo);
  const publishedGrades = state => own(state, state.results.grades).filter(g => g.status === 'published');
  const grade = (state, id) => publishedGrades(state).find(g => g.id === id) || null;
  const current = record => record.versions.find(v => v.number === record.currentVersion);
  const programs = state => own(state, state.results.programs);
  const program = (state, id) => programs(state).find(p => p.id === id) || null;
  const applications = state => own(state, state.results.applications);
  const application = (state, programId) => applications(state).find(a => a.programId === programId) || null;
  const certificates = state => own(state, state.results.certificates);
  const latestCertificate = (state, programId) => certificates(state).filter(c => c.programId === programId).at(-1) || null;
  const certificate = (state, id) => certificates(state).find(c => c.id === id) || null;
  function stamp(state, options = {}) {
    const records = state.results.applications.flatMap(a => [...a.events, ...a.submissions]);
    records.push(...state.results.certificates.flatMap(c => c.statusHistory || []));
    const latest = Math.max(0, ...records.map(row => Date.parse(row.at)).filter(Number.isFinite));
    const requested = Date.parse(options.now || DEMO_NOW);
    if (!Number.isFinite(requested)) throw new Error('演示时间无效。');
    return new Date(Math.max(requested, latest + 1000)).toISOString();
  }
  function snapshot(state, p) {
    return { ruleVersion: p.ruleVersion, grades: p.gradeIds.map(id => { const g = grade(state, id); const v = current(g); return { id, version: v.number, score: v.score }; }), evidenceIds: p.evidenceIds.slice(), evidence: p.evidenceIds.map(id => M.copy(own(state, state.results.practiceEvidence).find(e => e.id === id))) };
  }
  function snapshotMatches(state, p, saved) {
    if (!p || !saved || !eligibility(state, p.id).eligible || saved.ruleVersion !== p.ruleVersion) return false;
    const live = snapshot(state, p);
    const normalized = value => JSON.stringify(value.slice().sort((a, b) => String(a.id || a).localeCompare(String(b.id || b))));
    return normalized(saved.grades || []) === normalized(live.grades) && normalized(saved.evidenceIds || []) === normalized(live.evidenceIds) && (!saved.evidence || normalized(saved.evidence) === normalized(live.evidence));
  }
  const uid = () => 'completion-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);

  function seed(state) {
    const ownerId = state.profile.studentNo;
    if (state.scenario === 'new') return { version: 1, grades: [], programs: [], practiceEvidence: [], applications: [], certificates: [] };
    const base = state.publishedGrades.filter(g => !g.ownerId || g.ownerId === ownerId).map(g => ({ ...g, ownerId, type: '课程', status: 'published', currentVersion: 1, versions: [{ number: 1, score: g.grade, publishedAt: g.publishedAt, change: '首次发布', reason: '沿用原有已发布演示记录。', assessments: [], publisher: '课程管理人员（演示）', reviewer: '课程复核人员（演示）' }] }));
    const python = base.find(g => g.id === 'grade-python');
    if (python && python.grade === 86) {
      python.currentVersion = 2;
      python.versions = [
        { number: 1, score: 82, publishedAt: '2026-10-16', change: '首次发布', reason: '原始发布记录，已由第2版替代。', assessments: [{ name: '过程考核', score: 80, weight: 60 }, { name: '成果考核', score: 85, weight: 40 }], publisher: '课程管理人员（演示）', reviewer: '课程复核人员（演示）' },
        { number: 2, score: 86, publishedAt: '2026-10-18', change: '成绩更正', reason: '成果考核复核更正为95分，第2版已发布生效。', assessments: [{ name: '过程考核', score: 80, weight: 60 }, { name: '成果考核', score: 95, weight: 40 }], publisher: '课程管理人员（演示）', reviewer: '课程复核人员（演示）' }
      ];
    }
    const makeGrade = (id, name, score, type, assessments) => ({ id, name, ownerId, type, batch: '2026秋季 · 演示批次', status: 'published', currentVersion: 1, versions: [{ number: 1, score, publishedAt: '2026-10-25', change: '首次发布', reason: '本人已发布演示记录。', assessments, publisher: '课程管理人员（演示）', reviewer: '课程复核人员（演示）' }] });
    const grades = base.concat([
      makeGrade('grade-data', '数据分析与表达', 91, '课程', [{ name: '过程考核', score: 95, weight: 20 }, { name: '项目报告', score: 90, weight: 80 }]),
      makeGrade('grade-vision', '视觉项目综合实践', 58, '项目', [{ name: '阶段报告', score: 60, weight: 60 }, { name: '成果答辩', score: 55, weight: 40 }]),
      makeGrade('grade-ai', '人工智能基础', 88, '课程', [{ name: '平时考核', score: 90, weight: 40 }, { name: '综合考核', score: 86.67, weight: 60 }])
    ]);
    const evidence = (id, title, status) => ({ id, ownerId, title, status, source: '独立的结业验收演示记录', reviewedAt: status === 'accepted' ? '2026-10-26' : null });
    const makeProgram = (id, title, gradeId, evidenceId) => ({ id, ownerId, title, batch: '2026秋季 · 演示批次', ruleVersion: '结业规则演示 v1', minScore: 60, gradeIds: [gradeId], evidenceIds: [evidenceId], description: '指定成绩达到演示及格线，且关联实践已经验收后，可提交结业申请。' });
    const items = [makeProgram('completion-python', 'Python 数据实践结业', 'grade-python', 'proof-python'), makeProgram('completion-data', '数据分析训练营结业', 'grade-data', 'proof-data'), makeProgram('completion-vision', '视觉工程实践结业', 'grade-vision', 'proof-vision'), makeProgram('completion-ai', '人工智能基础结业', 'grade-ai', 'proof-ai')];
    return {
      version: 1, grades, programs: items,
      practiceEvidence: [evidence('proof-python', '图像数据清洗实践', 'accepted'), evidence('proof-data', '数据分析报告验收', 'accepted'), evidence('proof-vision', '视觉工程项目验收', 'pending'), evidence('proof-ai', '人工智能基础综合实训', 'accepted')],
      applications: [
        { id: 'application-data', programId: 'completion-data', ownerId, status: 'returned', revision: 1, submissions: [{ revision: 1, at: '2026-10-27T04:00:00.000Z', note: '申请结业。', snapshot: { ruleVersion: '结业规则演示 v1', grades: [{ id: 'grade-data', version: 1, score: 91 }], evidenceIds: ['proof-data'] } }], events: [{ title: '提交申请', at: '2026-10-27T04:00:00.000Z', note: '材料已随申请关联。' }, { title: '退回补正', at: '2026-10-28T04:00:00.000Z', note: '请补充成果仓库的访问说明，说明报告与代码的对应关系。' }] },
        { id: 'application-ai', programId: 'completion-ai', ownerId, status: 'approved', revision: 1, submissions: [{ revision: 1, at: '2026-10-26T08:00:00.000Z', note: '申请结业。', snapshot: { ruleVersion: '结业规则演示 v1', grades: [{ id: 'grade-ai', version: 1, score: 88 }], evidenceIds: ['proof-ai'] } }], events: [{ title: '提交申请', at: '2026-10-26T08:00:00.000Z', note: '提交本人结业申请。' }, { title: '审核通过', at: '2026-10-27T04:00:00.000Z', note: '工作人员已确认资格（演示）。' }, { title: '证书已签发', at: '2026-10-28T04:00:00.000Z', note: '管理人员确认签发演示证书。' }] }
      ],
      certificates: [{ id: 'certificate-ai', programId: 'completion-ai', applicationId: 'application-ai', ownerId, holder: state.profile.name, title: '人工智能基础结业', number: 'DEMO-QM-2026-0001', verificationCode: 'DEMO-AI-2026-0001', status: 'valid', issuedAt: '2026-10-28', issuer: '启明平台（演示）', statusReason: '依据已通过的结业申请签发。', ruleVersion: '结业规则演示 v1' }]
    };
  }
  function upgradeState(state) {
    const next = M.copy(state);
    if (!next.results) { next.results = seed(next); return next; }
    const r = next.results;
    if (r.version !== 1) throw new Error('成绩认证演示版本不兼容。');
    for (const key of ['grades', 'programs', 'practiceEvidence', 'applications', 'certificates']) {
      if (!Array.isArray(r[key]) || r[key].some(x => !x || typeof x.id !== 'string' || typeof x.ownerId !== 'string') || new Set(r[key].map(x => x.id)).size !== r[key].length) throw new Error('成绩认证演示记录不完整。');
    }
    for (const g of r.grades) {
      if (!['published', 'draft', 'reviewing'].includes(g.status) || !Array.isArray(g.versions) || !g.versions.length || new Set(g.versions.map(v => v.number)).size !== g.versions.length || !current(g) || g.versions.some(v => !Number.isInteger(v.number) || v.number < 1 || (v.score !== null && (!Number.isFinite(v.score) || v.score < 0 || v.score > 100)) || !Array.isArray(v.assessments))) throw new Error('成绩版本不完整。');
    }
    if (r.applications.some(a => !Object.hasOwn(applicationLabels, a.status) || !Number.isInteger(a.revision) || !Array.isArray(a.events) || !Array.isArray(a.submissions)) || new Set(r.applications.map(a => a.ownerId + ':' + a.programId)).size !== r.applications.length) throw new Error('结业申请记录不完整。');
    if (r.programs.some(p => !Array.isArray(p.gradeIds) || !p.gradeIds.length || !Array.isArray(p.evidenceIds) || !Number.isFinite(p.minScore) || p.minScore < 0 || p.minScore > 100)) throw new Error('结业规则不完整。');
    if (r.certificates.some(c => !Object.hasOwn(certificateLabels, c.status) || typeof c.verificationCode !== 'string') || new Set(r.certificates.map(c => c.verificationCode)).size !== r.certificates.length) throw new Error('证书记录不完整。');
    return next;
  }
  function eligibility(state, id) {
    const p = program(state, id);
    if (!p) return { eligible: false, requirements: [], error: '该结业项目不存在或无权访问。' };
    const requirements = p.gradeIds.map(id => {
      const g = grade(state, id); const v = g && current(g);
      return { title: g?.name || '指定成绩尚未发布', met: !!v && v.score !== null && v.score >= p.minScore, detail: v ? (v.score === null ? '暂无有效总评' : `${v.score} 分 · 演示要求 ${p.minScore} 分 · 第 ${v.number} 版`) : '等待本人有效成绩发布', gradeId: g?.id || null };
    });
    for (const id of p.evidenceIds) {
      const e = own(state, state.results.practiceEvidence).find(e => e.id === id);
      requirements.push({ title: e?.title || '指定实践验收', met: e?.status === 'accepted', detail: e?.status === 'accepted' ? `已验收 · ${e.reviewedAt}` : '尚未验收，请完成实践要求并等待导师处理', evidenceId: id });
    }
    return { eligible: requirements.every(x => x.met), requirements, ruleVersion: p.ruleVersion };
  }
  function applyCompletion(state, id, note, options = {}) {
    const p = program(state, id); const gate = eligibility(state, id); const previous = application(state, id);
    if (!p || !gate.eligible) return { error: gate.error || '当前资格尚未满足，请先处理缺项。' };
    if (previous && previous.status !== 'returned') return { error: '申请已在处理中或已结束，不能重复提交。' };
    if (options.expectedRevision !== undefined && options.expectedRevision !== (previous?.revision || 0)) return { error: '申请版本已变化，请重新打开申请。' };
    const text = String(note || '').trim();
    if (text.length > 1000 || (previous && !text)) return { error: previous ? '请填写 1—1000 字的补正说明。' : '申请说明不能超过1000字。', field: 'note' };
    const at = stamp(state, options);
    const savedSnapshot = snapshot(state, p);
    const next = M.copy(state); const revision = (previous?.revision || 0) + 1;
    const submission = { revision, at, note: text, snapshot: savedSnapshot };
    const event = { title: previous ? '补正后重新提交' : '提交申请', at, note: text || '已关联当前有效成绩和实践验收证据。' };
    if (previous) {
      const a = next.results.applications.find(a => a.id === previous.id && a.ownerId === state.profile.studentNo);
      a.status = 'pending'; a.revision = revision; a.submissions.push(submission); a.events.push(event);
      delete a.review;
    } else {
      const newId = options.id || uid();
      if (next.results.applications.some(a => a.id === newId)) return { error: '申请标识冲突，请重新提交。' };
      next.results.applications.push({ id: newId, programId: id, ownerId: state.profile.studentNo, status: 'pending', revision, submissions: [submission], events: [event] });
    }
    return { state: next };
  }
  function completionQueue(state) {
    return programs(state).map(p => {
      const gate = eligibility(state, p.id); const a = application(state, p.id);
      const c = latestCertificate(state, p.id);
      const action = a?.status === 'returned' ? gate.eligible ? 'correct' : 'requirements' : a?.status === 'approved' && c && !c.replacementRequired ? 'certificate' : a ? 'progress' : gate.eligible ? 'apply' : 'requirements';
      const priority = a?.status === 'returned' ? 0 : !a && gate.eligible ? 1 : a?.status === 'pending' ? 2 : !a ? 3 : 4;
      return { program: p, gate, application: a, certificate: c, action, priority };
    }).sort((a, b) => a.priority - b.priority);
  }
  function completionTasks(state) {
    return completionQueue(state).filter(row => row.application?.status === 'returned').map(row => ({
      id: row.program.id, title: '结业申请需要补正', note: row.program.title,
      actionLabel: row.gate.eligible ? '去补正' : '查看缺项'
    }));
  }
  function certificateState(state, c) {
    if (!c) return { status: 'missing', label: '未找到证书', reason: '请检查演示验证码。' };
    if (c.status !== 'valid') return { status: c.status, label: certificateLabels[c.status], reason: c.statusReason };
    if (c.replacementRequired || c.supersededBy) return { status: 'suspended', label: '暂停验证', reason: '本证书已转入复核换发，保留原依据，不直接恢复有效。' };
    const a = state.results.applications.find(a => a.id === c.applicationId && a.ownerId === c.ownerId && a.programId === c.programId);
    const ownerState = { ...state, profile: { ...state.profile, studentNo: c.ownerId } };
    if (a?.status !== 'approved' || !snapshotMatches(ownerState, program(ownerState, c.programId), c.snapshot || a.submissions.at(-1)?.snapshot)) return { status: 'suspended', label: '暂停验证', reason: '关联成绩版本、资格或审核状态已变化，等待工作人员复核。' };
    return { status: 'valid', label: '有效', reason: c.statusReason };
  }
  function verifyCertificate(state, code) {
    const normalized = String(code || '').trim().toUpperCase();
    const c = state.results.certificates.find(c => c.verificationCode === normalized);
    if (!c) return null;
    const status = certificateState(state, c);
    // 验证结果只返回允许公开的演示字段，不包含成绩、学号和附件。
    return { number: c.number, holder: String(c.holder || '').slice(0, 1) + '**', title: c.title, issuedAt: c.issuedAt, issuer: c.issuer, status: status.status, label: status.label, reason: status.reason };
  }
  function transcriptCSV(state, records = publishedGrades(state)) {
    const cell = value => { let s = String(value ?? ''); if (/^[\s]*[=+\-@]/.test(s)) s = "'" + s; return '"' + s.replaceAll('"', '""') + '"'; };
    const allowed = new Set(publishedGrades(state).map(g => g.id));
    const rows = [['启明平台成绩导出（演示，不是正式成绩单）'], ['姓名', '学生标识', '课程或项目', '类型', '批次', '当前总评', '版本', '发布时间']];
    for (const g of records.filter(g => allowed.has(g.id))) { const actual = grade(state, g.id); const v = current(actual); rows.push([state.profile.name, state.profile.studentNo, actual.name, actual.type, actual.batch, v.score === null ? '暂无总评' : v.score, v.number, v.publishedAt]); }
    return '\uFEFF' + rows.map(row => row.map(cell).join(',')).join('\r\n');
  }
  return { DEMO_NOW, applicationLabels, certificateLabels, upgradeState, publishedGrades, grade, current, programs, program, applications, application, certificates, certificate, latestCertificate, eligibility, applyCompletion, completionQueue, completionTasks, certificateState, verifyCertificate, transcriptCSV, nextTimestamp: stamp, snapshot, snapshotMatches };
});
