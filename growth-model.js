(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.GrowthModel = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  const dimensions = [
    {id:'foundation',label:'专业基础'},{id:'tools',label:'工具与方法'},
    {id:'implementation',label:'设计与实现'},{id:'validation',label:'测试与分析'},
    {id:'collaboration',label:'协作与表达'}
  ];
  // 旧维度仅用于读取历史记录；方向清单中的明确映射优先。
  const legacyDimensions={coding:'foundation',data:'validation',algorithm:'implementation',engineering:'implementation',research:'collaboration'};
  const normalizeDimension = value => legacyDimensions[value] || value;
  const skillCatalog=[{"name":"编程基础","dimension":"foundation","aliases":[]},{"name":"Git版本协作","dimension":"tools","aliases":["Git","版本协作"]},{"name":"Web应用开发","dimension":"implementation","aliases":[]},{"name":"软件测试","dimension":"validation","aliases":[]},{"name":"技术文档","dimension":"collaboration","aliases":[]},{"name":"计算机网络","dimension":"foundation","aliases":[]},{"name":"Linux工具","dimension":"tools","aliases":[]},{"name":"系统编程","dimension":"implementation","aliases":[]},{"name":"安全测试","dimension":"validation","aliases":[]},{"name":"软件工程基础","dimension":"foundation","aliases":[]},{"name":"软件设计","dimension":"implementation","aliases":[]},{"name":"Python","dimension":"foundation","aliases":["Python编程"]},{"name":"SQL","dimension":"tools","aliases":[]},{"name":"数据可视化","dimension":"implementation","aliases":[]},{"name":"数据分析","dimension":"validation","aliases":[]},{"name":"分析报告","dimension":"collaboration","aliases":[]},{"name":"机器学习基础","dimension":"foundation","aliases":[]},{"name":"数据清洗","dimension":"tools","aliases":["Python 数据处理","Python数据处理"]},{"name":"机器学习建模","dimension":"implementation","aliases":[]},{"name":"模型评估","dimension":"validation","aliases":[]},{"name":"实验报告","dimension":"collaboration","aliases":[]},{"name":"C语言","dimension":"foundation","aliases":["C","C语言编程"]},{"name":"单片机工具链","dimension":"tools","aliases":[]},{"name":"嵌入式开发","dimension":"implementation","aliases":[]},{"name":"传感器测试","dimension":"validation","aliases":[]},{"name":"电路基础","dimension":"foundation","aliases":[]},{"name":"信号仿真工具","dimension":"tools","aliases":[]},{"name":"通信系统设计","dimension":"implementation","aliases":[]},{"name":"信号分析","dimension":"validation","aliases":[]},{"name":"控制原理","dimension":"foundation","aliases":[]},{"name":"控制仿真工具","dimension":"tools","aliases":[]},{"name":"控制系统实现","dimension":"implementation","aliases":[]},{"name":"控制性能测试","dimension":"validation","aliases":[]},{"name":"工程力学","dimension":"foundation","aliases":[]},{"name":"CAD建模","dimension":"tools","aliases":[]},{"name":"机构设计","dimension":"implementation","aliases":[]},{"name":"结构分析","dimension":"validation","aliases":[]},{"name":"工程图纸","dimension":"collaboration","aliases":[]},{"name":"制造工艺基础","dimension":"foundation","aliases":[]},{"name":"产线仿真工具","dimension":"tools","aliases":[]},{"name":"工艺设计","dimension":"implementation","aliases":[]},{"name":"质量检测","dimension":"validation","aliases":[]},{"name":"工艺文档","dimension":"collaboration","aliases":[]},{"name":"电气仿真工具","dimension":"tools","aliases":[]},{"name":"电机控制","dimension":"implementation","aliases":[]},{"name":"电气测试","dimension":"validation","aliases":[]},{"name":"能量转换基础","dimension":"foundation","aliases":[]},{"name":"储能建模工具","dimension":"tools","aliases":[]},{"name":"能源系统设计","dimension":"implementation","aliases":[]},{"name":"能效分析","dimension":"validation","aliases":[]},{"name":"热力学基础","dimension":"foundation","aliases":[]},{"name":"热流体仿真工具","dimension":"tools","aliases":[]},{"name":"热管理设计","dimension":"implementation","aliases":[]},{"name":"热性能分析","dimension":"validation","aliases":[]},{"name":"材料科学基础","dimension":"foundation","aliases":[]},{"name":"材料表征方法","dimension":"tools","aliases":[]},{"name":"材料制备","dimension":"implementation","aliases":[]},{"name":"材料性能分析","dimension":"validation","aliases":[]},{"name":"化工原理","dimension":"foundation","aliases":[]},{"name":"流程模拟工具","dimension":"tools","aliases":[]},{"name":"化工流程设计","dimension":"implementation","aliases":[]},{"name":"过程安全分析","dimension":"validation","aliases":[]},{"name":"空间设计基础","dimension":"foundation","aliases":[]},{"name":"建筑建模工具","dimension":"tools","aliases":[]},{"name":"建筑空间设计","dimension":"implementation","aliases":[]},{"name":"设计评估","dimension":"validation","aliases":[]},{"name":"设计表达","dimension":"collaboration","aliases":[]},{"name":"工程仿真工具","dimension":"tools","aliases":[]},{"name":"结构与水利设计","dimension":"implementation","aliases":[]},{"name":"工程计算分析","dimension":"validation","aliases":[]},{"name":"测绘基础","dimension":"foundation","aliases":[]},{"name":"GIS工具","dimension":"tools","aliases":[]},{"name":"空间数据建模","dimension":"implementation","aliases":[]},{"name":"测绘精度分析","dimension":"validation","aliases":[]},{"name":"测绘报告","dimension":"collaboration","aliases":[]},{"name":"交通工程基础","dimension":"foundation","aliases":[]},{"name":"交通仿真工具","dimension":"tools","aliases":[]},{"name":"交通组织设计","dimension":"implementation","aliases":[]},{"name":"交通数据分析","dimension":"validation","aliases":[]},{"name":"车辆工程基础","dimension":"foundation","aliases":[]},{"name":"车辆部件设计","dimension":"implementation","aliases":[]},{"name":"车辆性能分析","dimension":"validation","aliases":[]},{"name":"流体力学基础","dimension":"foundation","aliases":[]},{"name":"流体仿真工具","dimension":"tools","aliases":[]},{"name":"运载装备设计","dimension":"implementation","aliases":[]},{"name":"模型试验分析","dimension":"validation","aliases":[]},{"name":"环境工程基础","dimension":"foundation","aliases":[]},{"name":"环境监测方法","dimension":"tools","aliases":[]},{"name":"环境治理设计","dimension":"implementation","aliases":[]},{"name":"环境数据分析","dimension":"validation","aliases":[]},{"name":"安全工程基础","dimension":"foundation","aliases":[]},{"name":"风险评价方法","dimension":"tools","aliases":[]},{"name":"风险控制设计","dimension":"implementation","aliases":[]},{"name":"风险分析","dimension":"validation","aliases":[]},{"name":"安全报告","dimension":"collaboration","aliases":[]},{"name":"生物化学基础","dimension":"foundation","aliases":[]},{"name":"实验与传感方法","dimension":"tools","aliases":[]},{"name":"生物健康工程设计","dimension":"implementation","aliases":[]},{"name":"检测数据分析","dimension":"validation","aliases":[]}];
  const pathRequirements={"web":["编程基础","Git版本协作","Web应用开发","软件测试","技术文档"],"systems":["计算机网络","Linux工具","系统编程","安全测试","技术文档"],"software-engineering":["软件工程基础","Git版本协作","软件设计","软件测试","技术文档"],"data-analysis":["Python","SQL","数据可视化","数据分析","分析报告"],"machine-learning":["机器学习基础","数据清洗","机器学习建模","模型评估","实验报告"],"embedded":["C语言","单片机工具链","嵌入式开发","传感器测试","技术文档"],"communications":["电路基础","信号仿真工具","通信系统设计","信号分析","实验报告"],"control":["控制原理","控制仿真工具","控制系统实现","控制性能测试","技术文档"],"mechanical-design":["工程力学","CAD建模","机构设计","结构分析","工程图纸"],"smart-manufacturing":["制造工艺基础","产线仿真工具","工艺设计","质量检测","工艺文档"],"electrical":["电路基础","电气仿真工具","电机控制","电气测试","技术文档"],"new-energy":["能量转换基础","储能建模工具","能源系统设计","能效分析","技术文档"],"thermal":["热力学基础","热流体仿真工具","热管理设计","热性能分析","实验报告"],"material-design":["材料科学基础","材料表征方法","材料制备","材料性能分析","实验报告"],"chemical-process":["化工原理","流程模拟工具","化工流程设计","过程安全分析","工艺文档"],"architecture":["空间设计基础","建筑建模工具","建筑空间设计","设计评估","设计表达"],"civil-water":["工程力学","工程仿真工具","结构与水利设计","工程计算分析","工程图纸"],"surveying":["测绘基础","GIS工具","空间数据建模","测绘精度分析","测绘报告"],"traffic":["交通工程基础","交通仿真工具","交通组织设计","交通数据分析","分析报告"],"vehicle":["车辆工程基础","CAD建模","车辆部件设计","车辆性能分析","工程图纸"],"aerospace-marine":["流体力学基础","流体仿真工具","运载装备设计","模型试验分析","实验报告"],"resources-environment":["环境工程基础","环境监测方法","环境治理设计","环境数据分析","分析报告"],"safety":["安全工程基础","风险评价方法","风险控制设计","风险分析","安全报告"],"bio-health":["生物化学基础","实验与传感方法","生物健康工程设计","检测数据分析","实验报告"]};
  const pathParents={"web":"software","systems":"software","software-engineering":"software","data-analysis":"ai-data","machine-learning":"ai-data","embedded":"electronics","communications":"electronics","control":"electronics","mechanical-design":"manufacturing","smart-manufacturing":"manufacturing","electrical":"energy","new-energy":"energy","thermal":"energy","material-design":"materials","chemical-process":"materials","architecture":"infrastructure","civil-water":"infrastructure","surveying":"infrastructure","traffic":"transport","vehicle":"transport","aerospace-marine":"transport","resources-environment":"environment-life","safety":"environment-life","bio-health":"environment-life"};
  const stages = ['待评估', '学习中', '完成练习', '项目应用', '审核验证'];
  const key = name => String(name || '').normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
  const clone = state => JSON.parse(JSON.stringify(state));
  const now = options => options?.now || new Date().toISOString();
  const id = prefix => prefix + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
  const approvedEvidence = evidence => ['已审核', '已验证', 'approved'].includes(evidence.status);
  const definition = name => skillCatalog.find(skill=>[skill.name,...skill.aliases].some(alias=>key(alias)===key(name)));
  const identity = name => key(definition(name)?.name || name);
  function classify(label) {
    const known=definition(label);if(known)return known.dimension;
    const text = key(label);
    if (/数据|分析|清洗|可视化|sql|pandas|excel|data/.test(text)) return 'validation';
    if (/算法|模型|机器学习|深度学习|machine learning/.test(text)) return 'implementation';
    if (/表达|沟通|写作|汇报|协作|团队/.test(text)) return 'collaboration';
    if (/工程|版本|测试|嵌入式|硬件|控制|机器人|实验|研究|科研|\bgit\b/.test(text)) return 'implementation';
    if (/编程|开发|python|javascript|typescript|vue|react|java|c\+\+|html|css/.test(text)) return 'foundation';
    return null;
  }
  function validateState(state) {
    if (!state.growth) return;
    const growth = state.growth;
    if (growth.version !== 1 || !Array.isArray(growth.skills) || !Array.isArray(growth.requests)) throw Error('技能记录版本不兼容。');
    if (new Set(growth.skills.map(skill => key(skill.name))).size !== growth.skills.length || growth.skills.some(skill => !key(skill.name) || !dimensions.some(d=>d.id===normalizeDimension(skill.dimension)) || ![1,2,3].includes(skill.stage))) throw Error('技能记录不完整。');
    if (new Set(growth.requests.map(request=>request.id)).size!==growth.requests.length || growth.requests.some(request=>!request.id || !key(request.skillName) || typeof request.ownerId!=='string' || !['pending','approved','rejected'].includes(request.status))) throw Error('技能验证记录不完整。');
  }
  function editableState(state) {
    validateState(state);
    const next = clone(state);
    next.growth ||= { version: 1, skills: [], requests: [] };
    return next;
  }
  const ownRequests = state => (state.growth?.requests || []).filter(request=>request.ownerId===state.profile.studentNo);
  function summarize(state) {
    const records = new Map();
    const ensure = value => {
      const label = String(value || '').normalize('NFKC').trim().replace(/\s+/g,' ');
      if (!label) return null;
      const normalized = identity(label);
      const metadata = state.growth?.skills.find(skill=>identity(skill.name)===normalized);
      if (!records.has(normalized)) records.set(normalized, { label, key: normalized, dimension: definition(label)?.dimension || normalizeDimension(metadata?.dimension) || classify(label), selfReported: false, evidence: [], metadata: metadata || null });
      return records.get(normalized);
    };
    for (const skill of state.profile?.skills || []) { const ability=ensure(skill); if(ability) ability.selfReported=true; }
    for (const evidence of state.evidence || []) {
      if (!approvedEvidence(evidence)) continue;
      const ability=ensure(evidence.skill);
      if(ability&&!ability.evidence.some(item=>item.id===evidence.id)) ability.evidence.push(evidence);
    }
    const abilities = [...records.values()].map(ability=>{
      const requests=ownRequests(state).filter(request=>identity(request.skillName)===ability.key);
      const stage=ability.evidence.length?4:ability.metadata?.stage || 1;
      return {...ability,stage,stageLabel:stages[stage],requests,latestRequest:requests.slice(-1)[0]||null};
    });
    const axes = dimensions.map(dimension=>{
      const matches=abilities.filter(ability=>ability.dimension===dimension.id);
      return {...dimension,reported:matches.filter(ability=>ability.selfReported).length,verified:matches.filter(ability=>ability.evidence.length).length,stage:matches.length?Math.max(...matches.map(ability=>ability.stage)):null,abilities:matches};
    });
    return {abilities,axes,unclassified:abilities.filter(ability=>!ability.dimension).length,max:4,step:1};
  }
  function forDirection(state) {
    const all=summarize(state),goal=state.goals.find(g=>g.id===state.currentGoalId);
    const names=pathRequirements[goal?.pathway?.subDirection];
    if(!names || pathParents[goal?.pathway?.subDirection]!==goal?.pathway?.primaryDirection)return null;
    const requirements=names.map(name=>{const skill=definition(name);const ability=all.abilities.find(a=>identity(a.label)===identity(name)) || null;return {...skill,ability};});
    const abilities=requirements.flatMap(r=>r.ability?[{...r.ability,dimension:r.dimension}]:[]);
    const axes=dimensions.map(d=>{const needed=requirements.filter(r=>r.dimension===d.id),matches=abilities.filter(a=>a.dimension===d.id);return {...d,required:needed.length,recorded:matches.length,verified:matches.filter(a=>a.stage===4).length,stage:matches.length?Math.max(...matches.map(a=>a.stage)):null,abilities:matches};});
    return {...all,abilities,axes,requirements,scope:'direction',recorded:abilities.length,verified:abilities.filter(a=>a.stage===4).length};
  }
  function saveSkill(state,input,options={}) {
    const name=String(input.name||'').normalize('NFKC').trim().replace(/\s+/g,' ');
    const errors={};
    if(!name||name.length>60||/[,，、\n]/.test(name)) errors.name='请填写1—60字的单项技能，不要一次输入多个标签。';
    if(!dimensions.some(d=>d.id===input.dimension)) errors.dimension='请选择能力维度。';
    if(definition(name) && input.dimension!==definition(name).dimension) errors.dimension='该技能已有固定维度映射，请选择'+dimensions.find(d=>d.id===definition(name).dimension).label+'。';
    const stage=Number(input.stage);
    if(![1,2,3].includes(stage)) errors.stage='学生只能记录学习中、完成练习或项目应用；审核验证由评审产生。';
    const sourceLabel=String(input.sourceLabel||'').trim();
    if(sourceLabel.length>100) errors.sourceLabel='学习来源最多100字。';
    if(stage>=2&&!sourceLabel&&!input.projectId) errors.sourceLabel='请补充练习/实践来源，或关联已参与项目。';
    if(input.projectId&&!state.projects.some(project=>project.id===input.projectId)) errors.projectId='只能关联本人已有的参与项目。';
    const existing=summarize(state).abilities.find(ability=>ability.key===identity(name));
    if(options.edit&&!existing) errors.name='该技能记录已不存在，请刷新后重试。';
    if(!options.edit&&existing) errors.name='该技能已存在，请更新原有记录。';
    if(existing&&(existing.evidence.length||existing.latestRequest?.status==='pending')) errors.form='已验证或审核中的记录不能通过学生编辑修改，请查看证据或等待处理。';
    if(Object.keys(errors).length) return {errors};
    const next=editableState(state);
    const record={name,dimension:definition(name)?.dimension || input.dimension,stage,sourceLabel,projectId:input.projectId||null,updatedAt:now(options)};
    next.growth.skills=next.growth.skills.filter(skill=>identity(skill.name)!==identity(name));
    next.growth.skills.push(record);
    if(!next.profile.skills.some(skill=>identity(skill)===identity(name))) next.profile.skills.push(name);
    return {state:next,record};
  }
  function validateProfileChange(state,skills) {
    const keys=new Set(skills.map(identity));
    return ownRequests(state).some(request=>request.status==='pending'&&!keys.has(identity(request.skillName)))?'存在审核中的技能，请等待处理后再移除。':'';
  }
  function requestVerification(state,skillName,input,options={}) {
    const ability=summarize(state).abilities.find(item=>item.key===identity(skillName));
    const errors={};
    if(!ability||!ability.selfReported) errors.form='只能申请验证本人的技能记录。';
    else if(!ability.dimension) errors.form='请先更新学习记录并选择能力维度，再申请验证。';
    else if(ability.evidence.length) errors.form='该技能已有已验证证据，无需重复申请。';
    else if(ability.latestRequest?.status==='pending') errors.form='该技能正在审核中，请勿重复提交。';
    const materialTitle=String(input.materialTitle||'').trim(),description=String(input.description||'').trim(),materialUrl=String(input.materialUrl||'').trim();
    if(!materialTitle||materialTitle.length>100) errors.materialTitle='请填写1—100字的材料名称。';
    if(description.length<10||description.length>1000) errors.description='请用10—1000字说明你完成的工作和材料如何证明这项技能。';
    if(materialUrl) {try {const url=new URL(materialUrl);if(!['https:','http:'].includes(url.protocol)||url.username||url.password)throw Error();}catch {errors.materialUrl='请输入不包含账号密码的HTTP或HTTPS材料链接。';}}
    if(materialUrl.length>2000)errors.materialUrl='材料链接最多2000字。';
    if(ability?.latestRequest?.status==='rejected' && materialTitle===ability.latestRequest.materialTitle && description===ability.latestRequest.description && materialUrl===ability.latestRequest.materialUrl) errors.form='请根据退回意见补充或修改材料后再提交。';
    if(Object.keys(errors).length)return {errors};
    const next=editableState(state);
    const request={id:options.id||id('skill-review'),ownerId:state.profile.studentNo,skillName:ability.label,dimension:ability.dimension,materialTitle,description,materialUrl,status:'pending',createdAt:now(options),reviewedAt:null,reviewNote:'',skillSnapshot:ability.metadata?clone(ability.metadata):null};
    if(next.growth.requests.some(item=>item.id===request.id))return {errors:{form:'该提交请求已存在，请刷新后查看结果。'}};
    next.growth.requests.push(request);
    return {state:next,request};
  }
  // 仅供独立评审工具模拟；正式权限、审核与证据写入均应由服务端执行。
  function simulateReview(state,requestId,decision,note='',options={}) {
    const request=ownRequests(state).find(item=>item.id===requestId);
    if(!request)return {error:'无权处理这条演示验证申请。'};
    if(request.status!=='pending')return {error:'验证申请状态已变化，请刷新后重试。'};
    if(!['approved','rejected'].includes(decision))return {error:'请选择有效的评审结果。'};
    note=String(note).trim();
    if(note.length>1000||decision==='rejected'&&!note)return {error:'退回需要填写原因，处理意见最多1000字。'};
    const ability=summarize(state).abilities.find(item=>item.key===identity(request.skillName));
    if(!ability||!ability.selfReported||ability.evidence.length)return {error:'技能记录已变化，请重新核对。'};
    const next=editableState(state),record=next.growth.requests.find(item=>item.id===requestId);
    record.status=decision;record.reviewedAt=now(options);record.reviewNote=note||(decision==='approved'?'材料通过演示审核。':'');
    if(decision==='approved')next.evidence.push({id:'evidence-'+record.id,skill:record.skillName,source:record.skillSnapshot?.sourceLabel||'技能材料验证（演示）',material:record.materialTitle,reviewer:'技能评审人（演示）',reviewedAt:record.reviewedAt.slice(0,10),status:'已审核',note:record.reviewNote,verificationRequestId:record.id});
    return {state:next,request:record};
  }
  return {dimensions,stages,key,identity,definition,skillCatalog,pathRequirements,forDirection,classify,summarize,validateState,saveSkill,requestVerification,simulateReview,ownRequests,validateProfileChange};
});
