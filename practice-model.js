(function (root, factory) {
  const model = typeof module === 'object' && module.exports ? require('./model.js') : root.WireframeModel;
  const api = factory(model);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PracticeModel = api;
})(typeof window !== 'undefined' ? window : globalThis, function (M) {
  'use strict';
  // A fixed, visible review date keeps seeded deadline scenarios reproducible.
  const DEMO_NOW = '2026-10-20T12:00:00+08:00';
  const make = (id, title, type, direction, tags, extra = {}) => ({ id, title, type, direction, tags, publication: 'published', college: '启明学院（演示）', mentor: '项目导师（演示）', deadline: '2026-11-05T18:00:00+08:00', period: '2026年11月—12月', capacity: 6, baseEnrolled: 2, majors: [], requireProfile: true, requireReason: false, description: '围绕具体问题开展团队实践，按里程碑提交可追溯的成果材料。', requirements: '按已发布要求参与，阶段材料经导师审核后形成实践证据。', deliverables: ['阶段方案与过程记录', '项目成果与总结材料'], ...extra });
  const opportunities = [
    make('op-web', '校园活动服务前端原型', '项目', '软件工程', ['前端开发', 'Vue', 'TypeScript', '团队协作'], { requireReason: true, description: '从学生使用场景出发，设计活动信息、报名与个人记录界面，完成一个可交付的前端原型。', requirements: '了解HTML/CSS基础，愿意参与需求梳理和版本协作。报名时需说明希望承担的工作。', deliverables: ['页面关系与交互方案', '可运行前端原型', '演示与交付说明'] }),
    make('op-vision', '校园场景视觉识别项目', '项目', '人工智能', ['Python', '机器学习', '工程协作'], { majors: ['计算机科学与技术', '自动化', '电子信息工程'], description: '完成图像数据整理、模型验证和阶段展示，保留实验与材料版本记录。' }),
    make('op-data', '校园出行数据可视化实践', '项目', '数据分析', ['Python', '数据分析', '版本协作'], { baseEnrolled: 1, description: '整理演示出行数据，形成清晰的分析图表与可复用过程记录。', deliverables: ['数据整理说明', '可视化与分析报告'] }),
    make('op-car', '智能车视觉识别实践赛', '竞赛', '嵌入式', ['嵌入式', '算法', '团队协作'], { capacity: 8, baseEnrolled: 4, majors: ['自动化', '电子信息工程', '机械设计制造及其自动化'], deadline: '2026-10-30T18:00:00+08:00', requirements: '本演示机会限自动化、电子信息、机械相关专业。实际竞赛资格与报名方式需团队确认。' }),
    make('op-robotics', '机器人协同控制实践', '项目', '嵌入式', ['机器人', '控制', '工程协作'], { capacity: 4, baseEnrolled: 4, description: '围绕协同控制开展项目实践。本演示名额已满，可查看条件但不能继续报名。' }),
    make('op-design', '交互设计与作品表达赛', '竞赛', '软件工程', ['界面设计', '学术表达'], { deadline: '2026-10-10T18:00:00+08:00', description: '将交互方案整理为作品与说明。本演示报名已经截止。' }),
    make('op-research', '科研问题分析与实验记录', '项目', '科研实践', ['研究方法', '实验设计'], { publication: 'closed', description: '练习问题分析、实验记录和成果表达。本演示机会已关闭报名。' }),
    make('op-draft', '未发布的演示草稿', '项目', '科研实践', ['研究方法'], { publication: 'draft' })
  ];
  const statuses = { pending: '待审核', approved: '已通过', rejected: '已拒绝', withdrawn: '已撤回' };
  const nowValue = options => {
    const timestamp = Date.parse(options?.now || DEMO_NOW);
    if (!Number.isFinite(timestamp)) throw new Error('演示时点无效。');
    return timestamp;
  };
  const stamp = options => new Date(nowValue(options)).toISOString();
  const uid = prefix => prefix + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
  const visible = op => !!op && ['published', 'closed'].includes(op.publication);
  const getOpportunity = id => opportunities.find(op => op.id === id && visible(op)) || null;
  const ownApplications = state => (state.practice?.applications || []).filter(a => a.ownerId === state.profile.studentNo);
  const latestApplication = (state, opportunityId) => ownApplications(state).filter(a => a.opportunityId === opportunityId).slice(-1)[0] || null;

  function upgradeState(state) {
    const next = M.copy(state);
    if (next.practice) {
      if (next.practice.version !== 1 || !Array.isArray(next.practice.applications)) throw new Error('实践演示记录版本不兼容。');
      const records = next.practice.applications;
      if (records.some(a => !a || typeof a.id !== 'string' || typeof a.opportunityId !== 'string' || typeof a.ownerId !== 'string' || !Object.hasOwn(statuses, a.status)) || new Set(records.map(a => a.id)).size !== records.length) throw new Error('报名演示记录不完整。');
      return next;
    }
    next.practice = { version: 1, applications: [] };
    const project = next.projects.find(p => p.id === 'project-vision');
    if (project) {
      project.opportunityId = 'op-vision';
      project.applicationId = 'application-seed-vision';
      next.practice.applications.push({ id: project.applicationId, ownerId: next.profile.studentNo, opportunityId: 'op-vision', status: 'approved', reason: '既有实践参与记录（演示）', createdAt: '2026-10-15T04:00:00.000Z', reviewedAt: '2026-10-16T04:00:00.000Z', reviewNote: '已获准参与（演示）', goalSnapshot: M.copy(project.goalSnapshot), projectId: project.id, seed: true });
    }
    return next;
  }
  function remainingSeats(state, op) {
    const newlyApproved = (state.practice?.applications || []).filter(a => a.opportunityId === op.id && a.status === 'approved' && !a.seed).length;
    return Math.max(0, op.capacity - op.baseEnrolled - newlyApproved);
  }
  function availability(state, op, options = {}) {
    if (!visible(op)) return { allowed: false, code: 'unavailable', label: '不可访问', reason: '该机会不存在或尚未发布。' };
    const active = ownApplications(state).find(a => a.opportunityId === op.id && ['pending', 'approved'].includes(a.status) && a.id !== options.ignoreApplicationId);
    if (active) return { allowed: false, code: active.status, label: statuses[active.status], reason: active.status === 'pending' ? '你已提交报名，请等待审核，可在我的实践查看进度。' : '你已获准参与，可在我的实践查看参与记录。' };
    if (op.publication === 'closed') return { allowed: false, code: 'closed', label: '已关闭', reason: '该机会已关闭报名。' };
    if (nowValue(options) >= Date.parse(op.deadline)) return { allowed: false, code: 'expired', label: '已截止', reason: '报名已经截止。' };
    if (remainingSeats(state, op) <= 0) return { allowed: false, code: 'full', label: '名额已满', reason: '当前报名名额已满。' };
    if (op.requireProfile && (!state.profile.major || !state.profile.grade)) return { allowed: false, code: 'profile', label: '待完善资料', reason: '请先补充专业和年级，再校验本演示机会的资格。' };
    if (op.majors.length && !op.majors.includes(state.profile.major)) return { allowed: false, code: 'ineligible', label: '暂不符合资格', reason: '本演示机会的专业要求为：' + op.majors.join('、') + '。' };
    const last = latestApplication(state, op.id);
    if (last?.status === 'rejected' && last.id !== options.ignoreApplicationId) return { allowed: false, code: 'rejected', label: '报名未通过', reason: '此演示机会暂不开放拒绝后重报，请查看审核意见。实际重报规则待确认。' };
    return { allowed: true, code: 'open', label: '可报名', reason: '符合当前演示资料及报名时点条件，提交后仍需审核。' };
  }
  function filterOpportunities(state, filters = {}, options = {}) {
    return opportunities.filter(visible).filter(op => (!filters.type || filters.type === 'all' || op.type === filters.type) && (!filters.direction || filters.direction === 'all' || op.direction === filters.direction) && (!filters.tag || filters.tag === 'all' || op.tags.includes(filters.tag)) && (!filters.available || availability(state, op, options).allowed));
  }
  function recommendOpportunities(state, options = {}) {
    const goal = M.currentGoal(state);
    if (!goal) return [];
    const goalTags = new Set(goal.tags.map(x => x.toLowerCase()));
    const profileTags = new Set([...state.profile.skills, ...state.profile.interests].map(x => x.toLowerCase()));
    return opportunities.filter(op => availability(state, op, options).allowed).map(op => {
      const matchedGoal = op.tags.filter(t => goalTags.has(t.toLowerCase()));
      const matchedProfile = op.tags.filter(t => profileTags.has(t.toLowerCase()) && !matchedGoal.includes(t));
      return { opportunity: op, matchedGoal, matchedProfile, weight: matchedGoal.length * 2 + matchedProfile.length };
    }).filter(r => r.weight > 0).sort((a, b) => b.weight - a.weight).map(r => ({ ...r, reason: [r.matchedGoal.length ? '与当前目标的' + r.matchedGoal.join('、') + '标签相连' : '', r.matchedProfile.length ? '也关联你自填的' + r.matchedProfile.join('、') : ''].filter(Boolean).join('；') + '。规则示意已过滤资格、截止和名额。' }));
  }
  function submitApplication(state, opportunityId, input = {}, options = {}) {
    const op = getOpportunity(opportunityId);
    const gate = availability(state, op, options);
    if (!gate.allowed) return { error: gate.reason, code: gate.code };
    const reason = String(input.reason || '').trim();
    if (op.requireReason && !reason) return { error: '请简要说明你希望承担的工作。', field: 'reason' };
    if (reason.length > 500) return { error: '报名说明建议不超过500字。', field: 'reason' };
    const next = M.copy(state);
    const application = { id: options.id || uid('application'), ownerId: state.profile.studentNo, opportunityId: op.id, status: 'pending', reason, createdAt: stamp(options), reviewedAt: null, reviewNote: '', goalSnapshot: M.currentGoal(state) ? M.copy(M.currentGoal(state)) : null, projectId: null, seed: false };
    if (next.practice.applications.some(a => a.id === application.id)) return { error: '报名请求已存在，请刷新记录。', code: 'duplicate' };
    next.practice.applications.push(application);
    return { state: next, application };
  }
  function withdrawApplication(state, applicationId, options = {}) {
    const found = ownApplications(state).find(a => a.id === applicationId);
    if (!found) return { error: '无权操作这条报名记录。', code: 'forbidden' };
    if (found.status !== 'pending') return { error: '当前状态不能撤回，请刷新记录。', code: 'conflict' };
    const next = M.copy(state);
    const application = next.practice.applications.find(a => a.id === applicationId);
    application.status = 'withdrawn'; application.withdrawnAt = stamp(options);
    return { state: next, application };
  }
  // Explicit review harness only. This is not a student permission or a real approval service.
  function simulateReview(state, applicationId, decision, note = '', options = {}) {
    const found = ownApplications(state).find(a => a.id === applicationId);
    if (!found) return { error: '找不到本人演示报名。', code: 'forbidden' };
    if (found.status !== 'pending') return { error: '报名状态已经变化，请刷新后选择待审核记录。', code: 'conflict' };
    if (!['approved', 'rejected'].includes(decision)) return { error: '审核模拟结果无效。' };
    if (decision === 'rejected' && !String(note).trim()) return { error: '模拟拒绝需要填写原因。' };
    const op = getOpportunity(found.opportunityId);
    if (decision === 'approved') {
      const gate = availability(state, op, { ...options, ignoreApplicationId: found.id });
      if (!gate.allowed) return { error: '通过模拟校验失败：' + gate.reason, code: gate.code };
    }
    const next = M.copy(state);
    const application = next.practice.applications.find(a => a.id === applicationId);
    application.status = decision; application.reviewedAt = stamp(options); application.reviewNote = String(note).trim() || '已通过演示审核。';
    if (decision === 'approved') {
      const projectId = options.projectId || 'project-' + application.id;
      application.projectId = projectId;
      next.projects.push({ id: projectId, opportunityId: op.id, applicationId: application.id, name: op.title, role: '实践成员（演示）', milestone: '团队与里程碑待确认', deadline: '', status: '已获准参与', goalSnapshot: application.goalSnapshot ? M.copy(application.goalSnapshot) : null, feedback: '', submission: '尚未提交材料' });
    }
    return { state: next, application };
  }
  return { DEMO_NOW, opportunities, statuses, visible, getOpportunity, ownApplications, latestApplication, upgradeState, remainingSeats, availability, filterOpportunities, recommendOpportunities, submitApplication, withdrawApplication, simulateReview };
});
