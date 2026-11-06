(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.WireframeModel = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  const copy = value => JSON.parse(JSON.stringify(value));
  const templates = [
    { id: 'engineering', category: '职业方向', title: '人工智能工程实践', description: '从已有基础出发，在项目中练习数据处理、模型应用和工程协作，留下可追溯的作品。', tags: ['Python', '机器学习', '工程协作'], active: true },
    { id: 'research', category: '科研方向', title: '科研入门与项目表达', description: '通过问题分析、实验记录和成果表达，参与一项与专业方向相关的研究实践。', tags: ['实验设计', '研究方法', '学术表达'], active: true },
    { id: 'competition', category: '竞赛方向', title: '智能车竞赛实践', description: '围绕真实竞赛任务，了解软硬件分工，练习团队协作、阶段交付与迭代。', tags: ['嵌入式', '算法', '团队协作'], active: true },
    { id: 'software', category: '能力提升', title: '软件工程能力提升', description: '在小型项目中练习需求理解、版本协作和软件交付，积累经过审核的实践证据。', tags: ['前端开发', '版本协作', '软件测试'], active: true }
  ];
  // 面向探索的工科方向分组，不替代学校培养方案或官方专业目录。
  const directions = [
  {
    "id": "software",
    "title": "计算机与软件",
    "majors": "计算机、软件工程、网络安全",
    "steps": [
      "了解软件开发与安全场景",
      "数据结构与系统基础",
      "完成一个校园工具",
      "参与软件协作项目"
    ],
    "evidence": "代码、演示与使用说明",
    "examples": "网站、小程序、校园工具"
  },
  {
    "id": "ai-data",
    "title": "人工智能与数据",
    "majors": "人工智能、数据科学及相关交叉方向",
    "steps": [
      "了解数据与智能应用场景",
      "数据处理与统计基础",
      "完成数据分析或识别实验",
      "参与场景应用与模型评估"
    ],
    "evidence": "数据报告、代码与评估结果",
    "examples": "数据分析、图像识别、预测模型"
  },
  {
    "id": "electronics",
    "title": "电子信息与控制",
    "majors": "电子信息、通信、微电子、自动化、测控",
    "steps": [
      "了解电子与控制系统",
      "信号、嵌入式或控制基础",
      "完成传感采集或控制装置",
      "参与软硬件系统联调"
    ],
    "evidence": "电路图、代码与测试记录",
    "examples": "传感器采集、智能小车、通信实验"
  },
  {
    "id": "manufacturing",
    "title": "机械与智能制造",
    "majors": "机械、机械电子、工业工程",
    "steps": [
      "了解机械设计与制造流程",
      "机械设计与制造基础",
      "完成机构设计或零件加工",
      "参与机电集成项目"
    ],
    "evidence": "设计图、模型与加工验证记录",
    "examples": "机构设计、零件加工、自动化装置"
  },
  {
    "id": "energy",
    "title": "电气、能源与动力",
    "majors": "电气、能源动力、新能源、核工程",
    "steps": [
      "了解电气与能源系统",
      "电路或热流体基础",
      "完成能耗分析或控制实验",
      "参与能量系统分析与设计"
    ],
    "evidence": "计算模型、方案与实验报告",
    "examples": "能耗分析、电机控制、储能方案"
  },
  {
    "id": "materials",
    "title": "材料与化学工程",
    "majors": "材料、冶金、高分子、化工、轻工、纺织",
    "steps": [
      "了解材料与化工应用",
      "材料结构或化工原理",
      "完成制备、表征或流程实验",
      "参与性能分析与工艺优化"
    ],
    "evidence": "实验记录、表征结果与工艺报告",
    "examples": "材料性能测试、工艺设计、实验分析"
  },
  {
    "id": "infrastructure",
    "title": "建筑、土木与基础设施",
    "majors": "建筑、城乡规划、土木、水利、测绘",
    "steps": [
      "了解空间与基础设施工程",
      "设计、结构或测绘基础",
      "完成模型、测绘或结构分析",
      "参与综合设计与工程验证"
    ],
    "evidence": "图纸、模型与分析报告",
    "examples": "建筑模型、结构分析、校园空间改造"
  },
  {
    "id": "transport",
    "title": "交通与运载装备",
    "majors": "交通运输、车辆、航空航天、船舶与海洋工程",
    "steps": [
      "了解交通与运载系统",
      "交通或运载系统基础",
      "完成仿真或运载模型",
      "参与系统方案设计与验证"
    ],
    "evidence": "仿真结果、模型与测试报告",
    "examples": "交通仿真、车辆结构、飞行器模型"
  },
  {
    "id": "environment-life",
    "title": "资源环境与生命工程",
    "majors": "资源、环境、安全、生物工程、食品、生物医学工程",
    "steps": [
      "了解资源环境或生命健康方向",
      "补充对应化学、生物或工程基础",
      "完成监测、检测或装置实验",
      "参与环境或健康场景项目"
    ],
    "evidence": "监测数据、实验记录与分析报告",
    "examples": "水质监测、风险分析、食品检测、健康传感"
  }
];
  const subdirections = {"software":[["web","Web与应用开发","了解网页、客户端与服务端的分工","学习编程、数据库与HTTP基础","完成一个可运行的校园应用","参与需求、测试、部署与版本协作","应用演示、代码与测试记录"],["systems","系统与网络安全","了解操作系统、网络与安全场景","学习Linux、网络协议和系统编程","搭建服务并完成授权环境安全实验","参与系统运维、性能或安全加固项目","配置、代码与实验报告"],["software-engineering","软件工程与测试","了解软件从需求到交付的流程","学习需求分析、Git、测试与设计基础","为小应用编写测试并建立协作流程","参与多人迭代与持续集成","需求说明、测试报告与版本记录"]],"ai-data":[["data-analysis","数据分析与可视化","了解数据分析的问题与应用场景","学习Python、统计、SQL与数据清洗","完成一个公开数据集的分析与可视化","参与真实问题的数据分析并复核结论","分析报告、数据处理代码与图表"],["machine-learning","机器学习与智能应用","了解分类、预测与识别任务","学习线性代数、概率与机器学习基础","完成图像或文本任务的基线实验","参与数据标注、评估与应用集成","代码、实验记录与评估报告"]],"electronics":[["embedded","嵌入式与物联网","了解传感、采集与设备联网","学习电路、C语言与单片机基础","完成传感器采集与通信装置","参与设备联网、联调与可靠性测试","电路、固件与测试记录"],["communications","通信与电子系统","了解信息传输与电子系统组成","学习信号、电路与通信原理","完成信号处理或收发仿真实验","参与电子系统设计与链路测试","仿真、原理图与测量报告"],["control","自动控制与机器人","了解反馈控制与机器人任务","学习控制原理、传感与编程基础","完成电机闭环控制或移动机器人实验","参与感知、控制与执行系统联调","控制代码、模型与实验报告"]],"manufacturing":[["mechanical-design","机械设计与仿真","了解机构、零件与机械产品","学习工程制图、力学、CAD与设计基础","完成机构建模及运动或受力分析","参与设计迭代、样件制作与验证","图纸、模型与分析报告"],["smart-manufacturing","制造工艺与产线","了解加工、装配与生产流程","学习制造工艺、测量及自动化基础","完成工艺规划或生产单元仿真","参与产线优化与质量验证","工艺文件、仿真与质量记录"]],"energy":[["electrical","电气与电机控制","了解供配电、电机与驱动系统","学习电路、电机与电力电子基础","完成驱动仿真或低压控制实验","参与电气系统方案与联调验证","仿真、电气图与测试报告"],["new-energy","新能源与储能","了解光伏、风能与储能系统","学习能量转换、电化学或电力电子基础","完成储能或发电系统建模分析","参与系统配置、能效与运行策略研究","模型、方案与能效报告"],["thermal","热能与动力系统","了解热机、换热与动力装置","学习热力学、传热与流体力学","完成换热或动力循环仿真","参与热管理与系统性能优化","计算模型、仿真与分析报告"]],"materials":[["material-design","材料制备与性能","了解材料结构、制备与应用","学习材料科学、化学与表征基础","完成材料制备或性能数据分析","参与结构与性能关系的实验研究","实验记录、表征与分析报告"],["chemical-process","化工与工艺工程","了解化工生产与过程安全","学习化工原理、反应与流程基础","完成流程模拟或单元操作实验","参与工艺优化与安全分析","流程图、模拟与实验报告"]],"infrastructure":[["architecture","建筑与空间设计","了解建筑、城市与使用者需求","学习制图、空间表达与设计基础","完成校园空间调研和设计模型","参与综合空间方案与设计评议","调研、图纸与模型"],["civil-water","土木结构与水利工程","了解结构、水利与基础设施","学习力学、结构或水力学基础","完成结构或水流建模分析","参与工程方案、施工组织与验证","计算书、图纸与分析报告"],["surveying","测绘与空间信息","了解测量、地图与空间数据","学习测绘、GIS与编程基础","完成校园测绘或空间数据分析","参与空间信息应用与成果检验","地图、数据与精度报告"]],"transport":[["traffic","交通规划与运营","了解出行需求与交通系统","学习交通工程、统计与仿真基础","完成路口调查与交通仿真","参与交通组织、调度或运营优化","调查数据、仿真与方案"],["vehicle","车辆与运载装备","了解车辆结构、动力与控制","学习力学、机械与控制基础","完成车辆部件或运行性能仿真","参与整车或运载系统综合设计","模型、设计与验证报告"],["aerospace-marine","航空航天与船海装备","了解飞行器、船舶与任务场景","学习力学、结构、流体与控制基础","完成飞行或船体模型仿真","参与装备方案、模型试验与验证","模型、仿真与试验报告"]],"environment-life":[["resources-environment","资源与环境工程","了解资源利用、污染与治理场景","学习化学、地学或环境工程基础","完成水质、环境或资源数据分析","参与治理方案、资源评价与效果验证","监测数据、评价与方案报告"],["safety","安全与风险工程","了解生产过程与常见风险","学习安全原理、统计与风险分析","完成授权场景的隐患识别与评价","参与风险控制方案与应急演练设计","风险清单、评价与改进方案"],["bio-health","生物、食品与健康工程","了解生物过程、食品与医疗工程场景","按兴趣学习生物、化学或传感基础","完成公开数据分析或规范实验训练","参与食品、生物过程或健康装置项目","实验记录、代码或检测分析报告"]]};
  directions.forEach(d => { d.tracks = subdirections[d.id].map(([id,title,...items]) => ({id,title,steps:items.slice(0,4),evidence:items[4]})); });
  const pathStages = ['了解方向','学习基础','完成小项目','参与综合实践'];
  const pathTracks = ['工程应用','科研探索','交叉创新'];
  function parseTags(value) {
    return [...new Set((Array.isArray(value) ? value : String(value || '').split(/[,，、\n]/)).map(x => String(x).trim()).filter(Boolean))];
  }
  function createState(scenario = 'returning') {
    const current = { id: 'goal-initial', templateId: 'engineering', title: '人工智能工程实践', description: '参与一个视觉应用项目，完成数据处理与模型验证，积累可展示的工程实践成果。', tags: ['Python', '机器学习', '工程协作'], start: '2026-10-20', end: '2026-12-20', createdAt: '2026-10-20', version: 1 };
    return {
      schemaVersion: 1, scenario,
      profile: { name: '林同学', studentNo: 'DEMO-2024001', major: scenario === 'new' ? '' : '计算机科学与技术', grade: scenario === 'new' ? '' : '大二', interests: scenario === 'new' ? [] : ['人工智能', '机器人'], skills: scenario === 'new' ? [] : ['Python', '数据分析'], bio: '' },
      goals: scenario === 'new' ? [] : [current], currentGoalId: scenario === 'new' ? null : current.id,
      evidence: scenario === 'new' ? [] : [{ id: 'evidence-python', skill: 'Python 数据处理', source: '图像数据清洗实践', material: '数据清洗报告 v1.0', reviewer: '导师（演示）', reviewedAt: '2026-10-16', status: '已审核', note: '依据提交报告和代码记录确认具备该项目所需的数据处理实践经验。' }],
      projects: scenario === 'new' ? [] : [{ id: 'project-vision', name: '校园场景视觉识别项目', role: '项目成员', milestone: '提交数据标注与清洗方案', deadline: '2026-11-08', status: '进行中', goalSnapshot: copy(current), feedback: '请补充异常样本处理说明，并在下次提交时保留数据版本记录。', submission: '数据方案 v1.0 · 退回补正' }],
      publishedGrades: scenario === 'new' ? [] : [{ id: 'grade-python', name: 'Python 数据处理实践', batch: '演示批次', grade: 86, publishedAt: '2026-10-18', version: '已发布 v1' }]
    };
  }
  function currentGoal(state) { return state.goals.find(g => g.id === state.currentGoalId) || null; }
  function validateProfile(draft) {
    const errors = {};
    if (draft.major && !['计算机科学与技术', '自动化', '电子信息工程', '机械设计制造及其自动化'].includes(draft.major)) errors.major = '请选择演示专业字典中的选项。';
    if (draft.grade && !['大一', '大二', '大三', '大四', '研究生'].includes(draft.grade)) errors.grade = '请选择有效年级。';
    if (String(draft.bio || '').length > 500) errors.bio = '简介建议不超过 500 字。';
    return errors;
  }
  function updateProfile(state, draft) {
    const errors = validateProfile(draft);
    if (Object.keys(errors).length) return { errors };
    const next = copy(state);
    next.profile = { ...next.profile, major: draft.major || '', grade: draft.grade || '', interests: parseTags(draft.interests), skills: parseTags(draft.skills), bio: String(draft.bio || '').trim() };
    return { state: next };
  }
  function validDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
    const date = new Date(value + 'T00:00:00Z');
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }
  function validateGoal(draft, catalog = templates) {
    const errors = {};
    const template = catalog.find(t => t.id === draft.templateId);
    if (!['template', 'custom'].includes(draft.mode)) errors.mode = '请选择目标创建方式。';
    if (draft.mode === 'template' && (!template || !template.active)) errors.templateId = '该模板已停用，请选择其他模板。历史目标仍然保留。';
    const title = String(draft.mode === 'template' ? template?.title || '' : draft.title || '').trim();
    if (!title || title.length > 100) errors.title = '请填写 1—100 字的目标名称。';
    if (String(draft.description || '').length > 1000) errors.description = '目标说明建议不超过 1000 字。';
    for (const key of ['primaryDirection','exploreDirection']) if (draft[key] && !directions.some(d => d.id === draft[key])) errors[key] = '请选择有效方向。';
    if (draft.subDirection && !directions.find(d => d.id === draft.primaryDirection)?.tracks.some(t => t.id === draft.subDirection)) errors.subDirection = '请选择主方向下的小方向。';
    if (draft.primaryDirection && draft.primaryDirection === draft.exploreDirection) errors.exploreDirection = '探索方向应与主方向不同。';
    if (draft.pathStage && !pathStages.includes(draft.pathStage)) errors.pathStage = '请选择有效阶段。';
    if (draft.pathTrack && !pathTracks.includes(draft.pathTrack)) errors.pathTrack = '请选择有效实践偏向。';
    if (!validDate(draft.start)) errors.start = '请选择有效的开始日期。';
    if (!validDate(draft.end)) errors.end = '请选择有效的结束日期。';
    else if (validDate(draft.start) && draft.end < draft.start) errors.end = '结束日期不能早于开始日期。';
    return errors;
  }
  function commitGoal(state, draft, catalog = templates, options = {}) {
    const errors = validateGoal(draft, catalog);
    if (Object.keys(errors).length) return { errors };
    const template = catalog.find(t => t.id === draft.templateId);
    const goal = { id: options.id || 'goal-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7), templateId: draft.mode === 'template' ? template.id : null, title: draft.mode === 'template' ? template.title : draft.title.trim(), description: String(draft.description || '').trim(), tags: draft.mode === 'template' ? copy(template.tags) : parseTags(draft.tags), start: draft.start, end: draft.end, createdAt: options.date || new Date().toISOString().slice(0, 10), version: state.goals.length + 1 };
    goal.pathway = { subDirection: draft.subDirection || '', primaryDirection: draft.primaryDirection || '', exploreDirection: draft.exploreDirection || '', pathStage: draft.pathStage || pathStages[0], pathTrack: draft.pathTrack || pathTracks[0] };
    if (state.goals.some(g => g.id === goal.id)) return { errors: { form: '该目标记录已经存在，请刷新后重试。' } };
    const next = copy(state);
    next.goals.push(goal);
    next.currentGoalId = goal.id;
    return { state: next, goal };
  }
  function restoreState(serialized) {
    const state = JSON.parse(serialized);
    if (!state || state.schemaVersion !== 1 || !state.profile || !Array.isArray(state.goals) || !Array.isArray(state.projects) || !Array.isArray(state.evidence) || !Array.isArray(state.publishedGrades)) throw new Error('演示记录格式不兼容。');
    if (!Array.isArray(state.profile.interests) || !Array.isArray(state.profile.skills) || !['name', 'studentNo', 'major', 'grade'].every(key => typeof state.profile[key] === 'string')) throw new Error('画像演示记录不完整。');
    if (state.currentGoalId && state.goals.filter(g => g.id === state.currentGoalId).length !== 1) throw new Error('当前目标记录不完整。');
    if (new Set(state.goals.map(g => g.id)).size !== state.goals.length) throw new Error('目标记录标识重复。');
    return state;
  }
  return { templates, directions, pathStages, pathTracks, copy, parseTags, createState, currentGoal, validateProfile, updateProfile, validateGoal, commitGoal, restoreState };
});
