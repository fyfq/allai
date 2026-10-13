'use strict';
const templates = {
  blank: '',
  learn: '我想学习：[主题]\n我的基础：[已有知识]\n请用一个直观例子解释核心概念，再给出由浅入深的学习路线，最后用三个问题检查我的理解。请标明不确定的信息。',
  write: '请改进下面的文字。\n目标读者：[读者]\n期望语气：[语气]\n原文：[粘贴文字]\n请保留原意，不添加未经证实的事实，并解释主要修改。',
  plan: '我希望完成：[目标]\n可用时间：[时间]\n约束条件：[约束]\n请将目标拆成可执行步骤，列出每步的完成标准、依赖关系和主要风险。信息不足时先提出关键问题。',
  code: '请帮我排查一个代码问题。\n预期行为：[预期]\n实际行为：[实际]\n环境和版本：[环境]\n相关代码与错误：[粘贴内容，先移除密钥]\n请先列出可能原因，再给出验证方法和最小修复建议。'
};
const $ = id => document.getElementById(id);
const storageKey = 'allai.tasks.v1';
let tasks = [];
try {
  const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
  if (!Array.isArray(stored) || !stored.every(t => t && typeof t.id === 'string' && typeof t.title === 'string' && typeof t.prompt === 'string' && typeof t.created === 'string')) throw new Error('Invalid storage');
  tasks = stored;
} catch {
  $('status').textContent = '无法读取任务库；请检查浏览器是否允许本地存储。';
}
function persist(next) {
  try { localStorage.setItem(storageKey, JSON.stringify(next)); tasks = next; render(); return true; }
  catch { $('status').textContent = '保存失败：本地存储不可用或空间不足。'; return false; }
}
async function copy(text) {
  try { await navigator.clipboard.writeText(text); $('status').textContent = '提示词已复制。'; }
  catch { $('status').textContent = '复制不可用，请在输入框中手动选择并复制。'; }
}
function render() {
  const container = $('tasks'); container.replaceChildren();
  const query = $('search').value.trim().toLocaleLowerCase();
  const visible = tasks.filter(t => (t.title + '\n' + t.prompt).toLocaleLowerCase().includes(query));
  if (!visible.length) { const p = document.createElement('p'); p.textContent = tasks.length ? '没有匹配的任务。' : '还没有任务。从左侧模板开始吧。'; container.append(p); }
  for (const task of visible) {
    const card = document.createElement('article');
    const title = document.createElement('h3'); title.textContent = task.title;
    const prompt = document.createElement('p'); prompt.textContent = task.prompt;
    const meta = document.createElement('div'); meta.className = 'meta'; meta.textContent = new Date(task.created).toLocaleString('zh-CN');
    const actions = document.createElement('div'); actions.className = 'actions';
    const reuse = document.createElement('button'); reuse.className = 'secondary'; reuse.textContent = '载入';
    reuse.onclick = () => { $('title').value = task.title; $('prompt').value = task.prompt; $('template').value = 'blank'; $('prompt').focus(); $('status').textContent = '已载入，修改后保存为新任务。'; };
    const remove = document.createElement('button'); remove.className = 'secondary'; remove.textContent = '删除';
    remove.onclick = () => { if (confirm('删除这个任务？')) { if (persist(tasks.filter(t => t.id !== task.id))) $('status').textContent = '任务已删除。'; } };
    actions.append(reuse, remove); card.append(title, meta, prompt, actions); container.append(card);
  }
}
$('template').onchange = () => {
  const next = templates[$('template').value];
  if ($('prompt').value.trim() && !confirm('用模板替换当前提示词？')) return;
  $('prompt').value = next;
};
$('save').onclick = () => {
  const prompt = $('prompt').value.trim();
  if (!prompt) { $('status').textContent = '请先填写提示词。'; $('prompt').focus(); return; }
  const task = { id: crypto.randomUUID(), title: $('title').value.trim() || '未命名任务', prompt, created: new Date().toISOString() };
  if (persist([task, ...tasks])) { $('status').textContent = '任务已保存。'; $('title').value = ''; $('prompt').value = ''; $('template').value = 'blank'; }
};
$('copy').onclick = () => { const prompt = $('prompt').value.trim(); if (prompt) copy(prompt); else $('status').textContent = '请先填写提示词。'; };
$('search').oninput = render;
$('export').onclick = () => {
  const url = URL.createObjectURL(new Blob([JSON.stringify(tasks, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = 'allai-tasks.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  $('status').textContent = '已导出任务备份。';
};
render();
