(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ResultsDrafts = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  const PREFIX = 'qiming-completion-draft-v1:';
  const ownerPrefix = ownerId => PREFIX + encodeURIComponent(ownerId) + ':';
  const key = context => ownerPrefix(context.ownerId) + encodeURIComponent(context.programId);
  const validContext = context => context && typeof context.ownerId === 'string' && context.ownerId && typeof context.programId === 'string' && context.programId && Number.isInteger(context.expectedRevision) && context.expectedRevision >= 0;

  function createStore(storage) {
    const clear = context => {
      try { if (!validContext(context)) throw new Error(); storage.removeItem(key(context)); return {}; }
      catch { return { error: '草稿未能清除，请检查浏览器存储后重试。' }; }
    };
    return {
      read(context) {
        try {
          if (!validContext(context)) throw new Error();
          const serialized = storage.getItem(key(context));
          if (!serialized) return { draft: null };
          const draft = JSON.parse(serialized);
          if (draft.version !== 1 || draft.ownerId !== context.ownerId || draft.programId !== context.programId || typeof draft.note !== 'string' || draft.note.length > 1000 || !Number.isInteger(draft.expectedRevision) || draft.expectedRevision < 0 || !Number.isFinite(Date.parse(draft.updatedAt))) throw new Error();
          // 旧申请版本的草稿不能覆盖新的补正要求。
          if (draft.expectedRevision !== context.expectedRevision) return { draft: null, stale: true };
          return { draft };
        } catch { return { draft: null, error: '无法恢复草稿，可继续填写；原草稿未被自动删除。' }; }
      },
      save(context, note, now = new Date().toISOString()) {
        try {
          if (!validContext(context) || typeof note !== 'string' || note.length > 1000 || !Number.isFinite(Date.parse(now))) throw new Error();
          if (!note.trim()) return clear(context);
          const draft = { version: 1, ownerId: context.ownerId, programId: context.programId, expectedRevision: context.expectedRevision, note, updatedAt: now };
          storage.setItem(key(context), JSON.stringify(draft));
          return { draft };
        } catch { return { error: '草稿暂存失败，输入仍在当前窗口；离开前请重试或保留说明。' }; }
      },
      clear,
      clearOwner(ownerId) {
        try {
          if (typeof ownerId !== 'string' || !ownerId) throw new Error();
          const keys = [];
          for (let i = 0; i < storage.length; i++) { const name = storage.key(i); if (name?.startsWith(ownerPrefix(ownerId))) keys.push(name); }
          keys.forEach(name => storage.removeItem(name));
          return {};
        } catch { return { error: '演示记录已重置，但部分申请草稿未能清除。' }; }
      }
    };
  }
  return { createStore };
});
