(function (root, factory) {
  const node = typeof module === 'object' && module.exports;
  const api = factory(node ? require('./model.js') : root.WireframeModel, node ? require('./results-model.js') : root.ResultsModel);
  if (node) module.exports = api;
  else root.CertificationModel = api;
})(typeof window !== 'undefined' ? window : globalThis, function (M, R) {
  'use strict';
  const roles = { reviewer: '审核人员（演示）', issuer: '签发人员（演示）' };
  const scenarios = { normal: { title: '正常申请', programId: 'completion-python', description: '从满足资格、尚未申请开始，完整演示提交、审核和签发。' }, correction: { title: '补正演练', programId: 'completion-data', description: '从已有退回意见开始，演示草稿、补正和重新审核。' }, blocked: { title: '资格不足', programId: 'completion-vision', description: '成绩未达要求且实践未验收，展示缺项和提交限制。' } };
  const materialCatalog = {
    'proof-python': { name: '图像数据清洗实践说明（示例）', sections: [['实践任务', '整理图像样本、去除重复记录，输出可追溯的数据清洗清单。'], ['示例成果', '清洗脚本、样本统计和实验说明。此处是内置文字样例，没有实际上传文件。'], ['可补充的说明', '说明实验报告章节与脚本入口的对应关系，以及成果材料的访问方式。']] },
    'proof-data': { name: '数据分析报告说明（示例）', sections: [['实践任务', '完成数据整理、统计分析与可视化表达，解释结论依据。'], ['示例成果', '报告包含问题定义、处理步骤与结果分析；示例代码按处理阶段组织。'], ['补正提示', '请补充仓库访问步骤，以及报告章节、代码和运行结果的对应关系。']] },
    'proof-vision': { name: '视觉工程阶段材料（示例）', sections: [['当前阶段', '已完成阶段记录，综合实践验收尚未完成。'], ['待处理事项', '继续完善成果与答辩材料，等待导师确认验收。']] },
    'proof-ai': { name: '人工智能基础实训说明（示例）', sections: [['示例任务', '完成模型训练、结果分析和综合实训报告。']] }
  };
  const authorized = (options, role) => options?.actor === role;
  const versionMatches = (a, options) => Number.isInteger(options?.expectedRevision) && a?.revision === options.expectedRevision;
  const checkSnapshot = (state, p, a) => R.snapshotMatches(state, p, a?.submissions.at(-1)?.snapshot);
  const canReconsider = (state, programId) => {
    const p = R.program(state, programId); const a = R.application(state, programId); const c = R.latestCertificate(state, programId);
    if (!p || a?.status !== 'approved') return false;
    if (!checkSnapshot(state, p, a)) return true;
    if (c?.replacementRequired && a.reconsideration && a.revision > a.reconsideration.sourceRevision && a.review?.revision === a.revision) return false;
    return !!c && R.certificateState(state, c).status !== 'valid';
  };
  function rememberReview(a) {
    a.reviewHistory ||= [];
    if (a.review && !a.reviewHistory.some(r => r.at === a.review.at && r.revision === a.review.revision)) a.reviewHistory.push(M.copy(a.review));
  }

  function reconsider(state, programId, note, options = {}) {
    if (!authorized(options, 'reviewer')) return { error: '请由审核人员发起复核。' };
    const a = R.application(state, programId); const text = String(note || '').trim();
    if (!versionMatches(a, options) || !canReconsider(state, programId)) return { error: '仅能复核依据变化或证书失效的已通过申请，请重新核对。' };
    if (!text || text.length > 1000) return { error: '请填写1—1000字复核原因。', field: 'note' };
    const next = M.copy(state); const row = R.application(next, programId); const at = R.nextTimestamp(state, options);
    rememberReview(row);
    row.status = 'returned'; row.reconsideration = { sourceRevision: row.revision, at, reason: text, actor: roles.reviewer };
    row.events.push({ title: '转入复核补正', note: text, at, actor: roles.reviewer, revision: row.revision });
    // 复核只追加状态记录，不替换旧证书与旧审核所依据的快照。
    for (const c of R.certificates(next).filter(c => c.programId === programId && !c.supersededBy)) {
      c.replacementRequired = true;
      if (c.status !== 'revoked') {
        c.status = 'suspended'; c.statusReason = '已转入复核，重新审核通过后需换发：' + text;
        c.statusHistory ||= []; c.statusHistory.push({ status: 'suspended', note: c.statusReason, at, actor: roles.reviewer });
      }
    }
    return { state: next };
  }

  function review(state, programId, decision, note, options = {}) {
    if (!authorized(options, 'reviewer')) return { error: '请在审核人员演示模式中办理。' };
    const p = R.program(state, programId); const a = R.application(state, programId);
    if (!p || !a) return { error: '该申请不存在或不属于当前演示学生。' };
    if (!versionMatches(a, options) || a.status !== 'pending') return { error: '申请版本或状态已变化，请重新载入后处理。' };
    if (!['returned', 'approved', 'rejected'].includes(decision)) return { error: '请选择有效的审核结果。' };
    const text = String(note || '').trim();
    if (text.length > 1000 || (decision !== 'approved' && !text)) return { error: '退回或不通过时请填写1—1000字处理意见。', field: 'note' };
    if (decision === 'approved' && !checkSnapshot(state, p, a)) return { error: '当前资格或关联版本已变化，不能通过；请退回补正后重新核对。' };
    const next = M.copy(state); const row = R.application(next, programId); const at = R.nextTimestamp(state, options);
    const savedNote = text || '已核对成绩、实践验收和申请说明，同意结业（演示）。';
    row.status = decision;
    row.review = { decision, revision: row.revision, at, actor: roles.reviewer, snapshot: decision === 'approved' ? R.snapshot(state, p) : null };
    rememberReview(row);
    if (decision === 'rejected' && row.reconsideration) {
      for (const c of R.certificates(next).filter(c => c.programId === programId && c.replacementRequired && !c.supersededBy && c.status !== 'revoked')) {
        c.status = 'revoked'; c.statusReason = '复核未通过，原证书已撤销：' + savedNote;
        c.statusHistory ||= []; c.statusHistory.push({ status: 'revoked', at, actor: roles.reviewer, note: c.statusReason });
      }
    }
    row.events.push({ title: { returned: '退回补正', approved: '审核通过', rejected: '审核未通过' }[decision], at, note: savedNote, actor: roles.reviewer, revision: row.revision });
    return { state: next };
  }
  function issue(state, programId, options = {}) {
    if (!authorized(options, 'issuer')) return { error: '请在签发人员演示模式中办理。' };
    const p = R.program(state, programId); const a = R.application(state, programId);
    if (!p || !a || a.status !== 'approved' || !versionMatches(a, options)) return { error: '仅能为当前审核通过的申请签发，请重新核对状态和版本。' };
    const previous = R.latestCertificate(state, programId);
    const replacing = !!previous && previous.replacementRequired && !previous.supersededBy && !!a.reconsideration && a.revision > a.reconsideration.sourceRevision && a.review?.revision === a.revision;
    if (previous && !replacing) return { error: '已有证书记录，不能重复签发；失效后须先由审核人员发起复核。' };
    if (!checkSnapshot(state, p, a) || (a.review && (a.review.revision !== a.revision || !R.snapshotMatches(state, p, a.review.snapshot)))) return { error: '审核关联的成绩、规则或验收记录已变化，暂不能签发。' };
    const next = M.copy(state); const at = R.nextTimestamp(state, options);
    // 编号只在本机演示数据内唯一，不冒充服务端的正式签发编号。
    let serial = 1;
    while (state.results.certificates.some(c => c.number === `DEMO-QM-${String(serial).padStart(6, '0')}` || c.verificationCode === `DEMO-VERIFY-${String(serial).padStart(6, '0')}` || c.id === `certificate-demo-${serial}`)) serial++;
    const c = { id: `certificate-demo-${serial}`, programId, applicationId: a.id, ownerId: state.profile.studentNo, holder: state.profile.name, title: p.title, number: `DEMO-QM-${String(serial).padStart(6, '0')}`, verificationCode: `DEMO-VERIFY-${String(serial).padStart(6, '0')}`, status: 'valid', issuedAt: at.slice(0, 10), issuer: '启明平台（演示）', statusReason: '依据本次审核通过的结业申请确认签发（演示）。', ruleVersion: p.ruleVersion, snapshot: R.snapshot(state, p), statusHistory: [{ status: 'valid', at, actor: roles.issuer, note: '确认签发演示样张。' }] };
    c.applicationRevision = a.revision;
    if (replacing) {
      const old = R.certificate(next, previous.id);
      c.replacesCertificateId = old.id;
      old.status = 'revoked'; old.supersededBy = c.id; old.statusReason = '已换发为 ' + c.number + '，本证书不再有效。';
      old.statusHistory ||= []; old.statusHistory.push({ status: 'revoked', at, actor: roles.issuer, note: old.statusReason });
      c.statusHistory[0].note = '复核后换发，替代原证书 ' + old.number + '。';
    }
    next.results.certificates.push(c);
    R.application(next, programId).events.push({ title: replacing ? '证书已换发' : '证书已签发', at, actor: roles.issuer, note: `签发演示样张 ${c.number}${replacing ? '，原证书 ' + previous.number + ' 已撤销' : ''}，可在学生端查看和验证。`, revision: a.revision });
    return { state: next, certificateId: c.id };
  }
  function changeCertificate(state, id, status, note, options = {}) {
    if (!authorized(options, 'issuer')) return { error: '请在签发人员演示模式中办理。' };
    const c = R.certificate(state, id); const text = String(note || '').trim();
    if (!c || c.status !== options.expectedStatus) return { error: '证书状态已变化或记录不可访问，请重新核对。' };
    if (!Object.hasOwn(R.certificateLabels, status) || c.status === status || c.status === 'revoked') return { error: '当前状态不允许该变更；撤销后保留历史，不直接恢复有效。' };
    if (!text || text.length > 1000) return { error: '请填写1—1000字状态变更原因。', field: 'note' };
    if (status === 'valid' && R.certificateState(state, { ...c, status: 'valid' }).status !== 'valid') return { error: '关联资格或审核版本不一致，暂不能恢复有效。' };
    const next = M.copy(state); const row = R.certificate(next, id); const at = R.nextTimestamp(state, options);
    row.status = status; row.statusReason = text; row.statusHistory ||= []; row.statusHistory.push({ status, at, note: text, actor: roles.issuer });
    return { state: next };
  }
  function prepareScenario(state, key) {
    if (!Object.hasOwn(scenarios, key)) return { error: '请选择有效的演练场景。' };
    const base = M.copy(state); delete base.results; base.scenario = 'returning';
    base.publishedGrades = M.copy(M.createState('returning').publishedGrades);
    const results = R.upgradeState(base).results; const p = scenarios[key].programId;
    results.programs = results.programs.filter(row => row.id === p);
    results.applications = key === 'correction' ? results.applications.filter(row => row.programId === p) : [];
    results.certificates = []; results.demoScenario = key;
    const next = M.copy(state); next.results = results;
    return { state: next, programId: p };
  }
  function basisScenario(state, programId) {
    const p = R.program(state, programId); const a = R.application(state, programId);
    if (!p || a?.status !== 'approved') return { error: '请先完成审核通过，再演练依据变化。' };
    const source = R.grade(state, p.gradeIds[0]);
    if (!source) return { error: '没有可用于演练的本人已发布成绩。' };
    const next = M.copy(state); const g = R.grade(next, source.id); const at = R.nextTimestamp(state);
    const version = M.copy(R.current(g)); version.number = Math.max(...g.versions.map(v => v.number)) + 1;
    version.change = '演练：成绩依据更正'; version.reason = '内置演练追加新版本，分数不变，用于检查复核流程；不是正式录分发布。'; version.publishedAt = at.slice(0, 10);
    g.versions.push(version); g.currentVersion = version.number;
    R.application(next, programId).events.push({ title: '演练：成绩依据变化', at, actor: '评审演练工具', note: `成绩由第${source.currentVersion}版变为第${version.number}版，分数不变，需要工作人员重新复核。`, revision: a.revision });
    return { state: next };
  }
  function materials(state, programId) {
    const p = R.program(state, programId); if (!p) return [];
    return p.evidenceIds.map(id => state.results.practiceEvidence.find(e => e.id === id && e.ownerId === state.profile.studentNo)).filter(Boolean).map(e => ({ ...M.copy(e), sample: materialCatalog[e.id] ? M.copy(materialCatalog[e.id]) : null }));
  }
  return { roles, scenarios, review, issue, changeCertificate, reconsider, canReconsider, prepareScenario, basisScenario, materials, checkSnapshot };
});
