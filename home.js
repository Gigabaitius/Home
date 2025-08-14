// Основание: твоя последняя версия с разделами «Дом», «Задачи на день», «Траты», «Бюджет», «Подарки», «Нужно сделать».
// Добавлено: «Памятка по уборке» + «Зоны уборки по дням» (на главной).

const DAY_LABEL = { mon:'Понедельник',tue:'Вторник',wed:'Среда',thu:'Четверг',fri:'Пятница',sat:'Суббота',sun:'Воскресенье' };
const RU_DOW_ABBR = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];

const HIDDEN_DAYS_KEY = (user) => `HIDDEN_DAYS_${user}`;
const TASKS_STATE_KEY = (user, day) => `TASKS_DONE_${user}_${day}`;
const GLOBAL_TASKS_KEY = 'GLOBAL_DAILY_TASKS';
const PERSONAL_TASKS_KEY = (user) => `PERSONAL_TASKS_${user}`;
const EXPENSES_KEY = 'EXPENSES';
const BUDGET_LEDGER_KEY = 'BUDGET_LEDGER';
const BUDGET_START_KEY  = 'BUDGET_START_DEBT';
const GIFTS_KEY = (user) => `GIFTS_${user}`;

const todayStr = () => new Date().toISOString().slice(0,10);
const monthKey = (d) => (d || todayStr()).slice(0,7);
const fmtMoney0 = (n) => (Number(n||0)).toLocaleString('ru-RU', { style:'currency', currency:'RUB', maximumFractionDigits:0 });

// === Советы
function renderDailyAdvice(user){
  const out = document.getElementById('advice-text'); if(!out) return;
  const isGirl = (user === 'Никося');
  const list = (window.ADVICES && (isGirl ? window.ADVICES.girl : window.ADVICES.guy)) || [];
  out.textContent = list.length ? list[seededIndex(user+'|'+todayStr(), list.length)] :
    (isGirl ? 'Добавьте советы для девушки в advices.js' : 'Добавьте советы для парня в advices.js');
}
function seededIndex(s,m){ let h=0x811c9dc5; for(const ch of s){ h^=ch.charCodeAt(0); h=(h*0x01000193)>>>0; } return m? h%m : 0; }

// === Расписания (в т.ч. для Славика)
var TASKS_DATA = window.TASKS_DATA || {};
if(!TASKS_DATA['Славик']){
  TASKS_DATA['Славик'] = {
    mon:[{time:'08:30–09:00',text:'Подъём, завтрак'},{time:'09:00–10:30',text:'Работа'},{time:'10:30–11:30',text:'2 ч обучение (онлайн-курс)'},{time:'11:30–12:00',text:'Рабочие задачи'},{time:'12:00–12:20',text:'🏋️‍♂️ Тренировка'},{time:'12:20–13:00',text:'Обед'},{time:'13:00–15:00',text:'2 ч работа над сайтом'},{time:'15:00–17:30',text:'Работа'},{time:'18:00–19:00',text:'🧹 Балкон'},{time:'19:00–22:00',text:'Игры 🎮'}],
    tue:[{time:'08:30–09:00',text:'Подъём, завтрак'},{time:'09:00–10:30',text:'Работа'},{time:'10:30–11:30',text:'2 ч обучение'},{time:'11:30–12:00',text:'Рабочие задачи'},{time:'12:00–12:20',text:'🏋️‍♂️ Тренировка'},{time:'12:20–13:00',text:'Обед'},{time:'13:00–15:00',text:'2 ч работа над сайтом'},{time:'15:00–17:30',text:'Работа'},{time:'18:00–19:00',text:'🧹 Ванная'},{time:'19:00–22:00',text:'Общее время с Никой'}],
    wed:[{time:'08:30–09:00',text:'Подъём, завтрак'},{time:'09:00–10:30',text:'Работа'},{time:'10:30–11:30',text:'2 ч обучение'},{time:'11:30–12:00',text:'Рабочие задачи'},{time:'12:00–12:20',text:'🏋️‍♂️ Тренировка'},{time:'12:20–13:00',text:'Обед'},{time:'13:00–15:00',text:'2 ч работа над сайтом'},{time:'15:00–17:30',text:'Работа'},{time:'18:00–19:00',text:'🧹 Гостиная'},{time:'19:00–22:00',text:'Игры 🎮'}],
    thu:[{time:'08:30–09:00',text:'Подъём, завтрак'},{time:'09:00–10:30',text:'Работа'},{time:'10:30–11:30',text:'2 ч обучение'},{time:'11:30–12:00',text:'Рабочие задачи'},{time:'12:00–12:20',text:'🏋️‍♂️ Тренировка'},{time:'12:20–13:00',text:'Обед'},{time:'13:00–15:00',text:'2 ч работа над сайтом'},{time:'15:00–17:30',text:'Работа'},{time:'18:00–19:00',text:'🧹 Прихожая'},{time:'19:00–22:00',text:'Общее время с Никой'}],
    fri:[{time:'08:30–09:00',text:'Подъём, завтрак'},{time:'09:00–10:30',text:'Работа'},{time:'10:30–11:30',text:'2 ч обучение'},{time:'11:30–12:00',text:'Рабочие задачи'},{time:'12:00–12:20',text:'🏋️‍♂️ Тренировка'},{time:'12:20–13:00',text:'Обед'},{time:'13:00–15:00',text:'2 ч работа над сайтом'},{time:'15:00–17:30',text:'Работа до 16:30'},{time:'19:00–22:00',text:'Игры 🎮'}],
    sat:[], sun:[]
  };
}

// === Зоны по дням для каждого пользователя
const ZONES_BY_DAY = {
  'Никося': { mon:'Кухня', tue:'Ванная', wed:'Прихожая', thu:'Гостиная', fri:'Лоджия', sat:'—', sun:'—' },
  'Славик': { mon:'Балкон', tue:'Ванная', wed:'Гостиная', thu:'Прихожая', fri:'—', sat:'—', sun:'—' },
};

// === Динамический пункт меню
function buildMenuForUser(user){
  const ul = document.querySelector('#side-menu ul'); if(!ul) return;

  // очистка предыдущих динамических
  ul.querySelectorAll('li[data-dynamic="1"]').forEach(li=>li.remove());

  const li = document.createElement('li'); li.setAttribute('data-dynamic','1');
  if(user === 'Никося'){ li.id = 'menu-meds'; li.textContent = 'Приём лекарств'; }
  else { li.id = 'menu-personal'; li.textContent = 'Нужно сделать'; }
  ul.appendChild(li);
}

// === Переключение секций
function setActiveMenu(keyId){
  ['menu-home','menu-daily','menu-expenses','menu-budget','menu-gifts','menu-cleaning','menu-personal','menu-meds'].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.classList.toggle('active', id===keyId);
  });
}
function showSection(section){
  const advice = document.getElementById('advice-box');
  const days = document.getElementById('days-list');
  const zonesWrap = document.getElementById('zones-wrap');
  const schedulePanel = document.getElementById('tasks-panel');
  const daily = document.getElementById('daily-tasks');
  const expenses = document.getElementById('expenses-section');
  const budget = document.getElementById('budget-section');
  const gifts = document.getElementById('gifts-section');
  const personal = document.getElementById('personal-section');
  const cleaning = document.getElementById('cleaning-section');
  const logoutBtn = document.getElementById('logoutBtn');

  const hideAll = () => [advice,days,zonesWrap,schedulePanel,daily,expenses,budget,gifts,personal,cleaning]
    .forEach(el=>el&&el.classList.add('hidden'));

  if(section==='daily'){
    hideAll(); daily.classList.remove('hidden'); setActiveMenu('menu-daily'); if(logoutBtn) logoutBtn.classList.add('hidden');
  } else if(section==='expenses'){
    hideAll(); expenses.classList.remove('hidden'); setActiveMenu('menu-expenses'); if(logoutBtn) logoutBtn.classList.add('hidden');
  } else if(section==='budget'){
    hideAll(); budget.classList.remove('hidden'); setActiveMenu('menu-budget'); if(logoutBtn) logoutBtn.classList.add('hidden');
  } else if(section==='gifts'){
    hideAll(); gifts.classList.remove('hidden'); setActiveMenu('menu-gifts'); if(logoutBtn) logoutBtn.classList.add('hidden');
  } else if(section==='personal'){
    hideAll(); personal.classList.remove('hidden'); setActiveMenu('menu-personal'); if(logoutBtn) logoutBtn.classList.add('hidden');
  } else if(section==='cleaning'){
    hideAll(); cleaning.classList.remove('hidden'); setActiveMenu('menu-cleaning'); if(logoutBtn) logoutBtn.classList.add('hidden');
  } else {
    // Дом
    hideAll();
    advice.classList.remove('hidden'); days.classList.remove('hidden'); zonesWrap.classList.remove('hidden');
    schedulePanel.classList.add('hidden'); setActiveMenu('menu-home'); if(logoutBtn) logoutBtn.classList.remove('hidden');
  }
}

function toggleMenu(open){
  const menu = document.getElementById('side-menu'); if(!menu) return;
  if(typeof open === 'boolean') menu.classList.toggle('hidden', !open);
  else menu.classList.toggle('hidden');
}
function wireBurger(){
  const b = document.getElementById('burgerBtn'); if(!b) return;
  b.addEventListener('click', () => toggleMenu());
  b.addEventListener('keydown', (e) => { if(e.key==='Enter'||e.key===' '){ e.preventDefault(); toggleMenu(); } });
  document.addEventListener('click', (e)=>{
    const menu = document.getElementById('side-menu');
    if(!menu) return;
    if(!menu.contains(e.target) && !b.contains(e.target)) menu.classList.add('hidden');
  });
}
function wireNav(){
  const mHome = document.getElementById('menu-home');
  const mDaily = document.getElementById('menu-daily');
  const mExp = document.getElementById('menu-expenses');
  const mBud = document.getElementById('menu-budget');
  const mGifts = document.getElementById('menu-gifts');
  const mCleaning = document.getElementById('menu-cleaning');
  const mPersonal = document.getElementById('menu-personal');

  if(mHome) mHome.addEventListener('click', ()=>{ showSection('home'); toggleMenu(false); });
  if(mDaily) mDaily.addEventListener('click', ()=>{ openDailyTasks(); });
  if(mExp) mExp.addEventListener('click', ()=>{ openExpenses(); });
  if(mBud) mBud.addEventListener('click', ()=>{ openBudget(); });
  if(mGifts) mGifts.addEventListener('click', ()=>{ openGifts(); });
  if(mCleaning) mCleaning.addEventListener('click', ()=>{ openCleaning(); });
  if(mPersonal) mPersonal.addEventListener('click', ()=>{ openPersonal(); });

  const bell = document.getElementById('notifBell');
  if(bell){
    const open = ()=>{ openDailyTasks(); };
    bell.addEventListener('click', open);
    bell.addEventListener('keydown', (e)=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); open(); } });
  }
}
function wireLogoNav(){
  const logo = document.getElementById('logoBtn'); if(!logo) return;
  const goHome = ()=>{ showSection('home'); toggleMenu(false); };
  logo.addEventListener('click', goHome);
  logo.addEventListener('keydown', (e)=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); goHome(); } });
}
function wireLogout(){
  const btn = document.getElementById('logoutBtn'); if(!btn) return;
  btn.addEventListener('click', ()=>{
    localStorage.removeItem('user');
    window.location.replace('index.html?logout=1');
  });
}

// === «Зоны уборки по дням» (генерация списка)
function renderZonesByDay(user){
  const elUser = document.getElementById('zones-user');
  const ul = document.getElementById('zones-list');
  if(elUser) elUser.textContent = user;
  if(!ul) return;
  const map = ZONES_BY_DAY[user] || {};
  ul.innerHTML = '';
  ['mon','tue','wed','thu','fri','sat','sun'].forEach(k=>{
    const li = document.createElement('li');
    li.innerHTML = `<span>${DAY_LABEL[k]||'-'}:</span> ${map[k] || '—'}`;
    ul.appendChild(li);
  });
}

// === Задачи на день
function loadGlobalTasks(){ try{return JSON.parse(localStorage.getItem(GLOBAL_TASKS_KEY)||'[]');}catch{return[];} }
function saveGlobalTasks(list){ localStorage.setItem(GLOBAL_TASKS_KEY, JSON.stringify(list)); }
function addDailyTask(){
  const user=localStorage.getItem('user'); if(!user) return false;
  const text=(document.getElementById('taskText').value||'').trim();
  const assignee=document.getElementById('taskAssignee').value;
  if(!text||!assignee) return false;
  const list=loadGlobalTasks();
  list.push({ id:`${Date.now()}_${Math.random().toString(36).slice(2,8)}`, text, assignee, author:user, date:todayStr(), done:false, doneBy:null, doneAt:null });
  saveGlobalTasks(list);
  document.getElementById('taskText').value=''; document.getElementById('taskAssignee').value='';
  const u=localStorage.getItem('user'); renderDailyTasks(u); updateNotifBadge(u); return false;
}
function toggleDailyDone(id, checked){
  const user=localStorage.getItem('user'); const list=loadGlobalTasks(); const t=list.find(x=>x.id===id); if(!t) return;
  if(t.assignee!==user) return; t.done=!!checked; t.doneBy=checked?user:null; t.doneAt=checked?Date.now():null; saveGlobalTasks(list);
  renderDailyTasks(user); updateNotifBadge(user);
}
function renderDailyTasks(user){
  const myUL=document.getElementById('myTasks'); const byMeUL=document.getElementById('assignedByMe');
  if(!myUL||!byMeUL) return;
  const list=loadGlobalTasks().filter(t=>t.date===todayStr());
  const my=list.filter(t=>t.assignee===user); const byMe=list.filter(t=>t.author===user);
  const render=(ul,arr,enable)=>{ ul.innerHTML=''; if(!arr.length){ ul.innerHTML=`<li class="task-row"><div></div><div class="text" style="color:#9a9a9a">Пока пусто</div><div></div></li>`; return; }
    arr.forEach(t=>{ const li=document.createElement('li'); li.className='task-row'+(t.done?' done':'');
      const cb=document.createElement('input'); cb.type='checkbox'; cb.checked=!!t.done; cb.disabled=!enable(t); cb.addEventListener('change',()=>toggleDailyDone(t.id,cb.checked));
      const txt=document.createElement('div'); txt.className='text'; txt.textContent=t.text;
      const who=document.createElement('div'); who.className='who'; who.textContent=(t.assignee===user)?'Мне':t.assignee;
      li.appendChild(cb); li.appendChild(txt); li.appendChild(who); ul.appendChild(li); });
  };
  render(myUL,my,t=>t.assignee===user); render(byMeUL,byMe,t=>t.assignee===user);
}
function openDailyTasks(){ showSection('daily'); const u=localStorage.getItem('user'); renderDailyTasks(u); updateNotifBadge(u); toggleMenu(false); }

// === Личные задачи (Славик)
function loadPersonalTasks(user){ try{return JSON.parse(localStorage.getItem(PERSONAL_TASKS_KEY(user))||'[]');}catch{return[];} }
function savePersonalTasks(user, arr){ localStorage.setItem(PERSONAL_TASKS_KEY(user), JSON.stringify(arr)); }
function addPersonalTask(){
  const user=localStorage.getItem('user'); if(!user) return false;
  const text=(document.getElementById('pText').value||'').trim();
  const due=document.getElementById('pDue').value;
  if(!text||!due) return false;
  const list=loadPersonalTasks(user);
  list.push({ id:`P_${Date.now()}_${Math.random().toString(36).slice(2,6)}`, text, due, done:false, createdAt:Date.now() });
  savePersonalTasks(user, list);
  document.getElementById('pText').value=''; document.getElementById('pDue').value='';
  renderPersonal(); updateNotifBadge(user); return false;
}
function togglePersonalDone(id, checked){
  const user=localStorage.getItem('user'); const list=loadPersonalTasks(user);
  const t=list.find(x=>x.id===id); if(!t) return;
  t.done=!!checked;
  savePersonalTasks(user, list);
  renderPersonal(); updateNotifBadge(user);
}
function deletePersonalTask(id){
  const user=localStorage.getItem('user'); const list=loadPersonalTasks(user);
  const i=list.findIndex(x=>x.id===id); if(i>=0){ list.splice(i,1); savePersonalTasks(user, list); }
  renderPersonal(); updateNotifBadge(user);
}
function isOverdue(due){ return due && due < todayStr(); }
function renderPersonal(){
  const user=localStorage.getItem('user'); const ul=document.getElementById('pList'); if(!ul) return;
  const arr = loadPersonalTasks(user).slice().sort((a,b)=> (a.due||'').localeCompare(b.due||''));
  ul.innerHTML='';
  if(!arr.length){ ul.innerHTML = `<li class="p-row"><div></div><div class="p-text" style="color:#9a9a9a">Пока пусто</div><div></div><div></div></li>`; return; }
  arr.forEach(t=>{
    const li=document.createElement('li'); li.className='p-row'+(t.done?' done':'');
    const cb=document.createElement('input'); cb.type='checkbox'; cb.checked=!!t.done; cb.addEventListener('change',()=>togglePersonalDone(t.id, cb.checked));
    const txt=document.createElement('div'); txt.className='p-text'; txt.textContent=t.text;
    const due=document.createElement('div'); due.className='p-due'; due.textContent = `до ${t.due||'—'}`;
    if(!t.done && isOverdue(t.due)) due.classList.add('overdue');
    const del=document.createElement('div'); del.className='p-del'; del.title='Удалить'; del.textContent='×';
    del.addEventListener('click',()=>deletePersonalTask(t.id));
    li.appendChild(cb); li.appendChild(txt); li.appendChild(due); li.appendChild(del); ul.appendChild(li);
  });
}
function openPersonal(){ showSection('personal'); renderPersonal(); const u=localStorage.getItem('user'); updateNotifBadge(u); toggleMenu(false); }

// === Дни/расписание
function weeklyResetIfSunday(user){
  const day=new Date().getDay(); if(day===0){
    localStorage.removeItem(HIDDEN_DAYS_KEY(user));
    if(TASKS_DATA && TASKS_DATA[user]) Object.keys(TASKS_DATA[user]).forEach(d=>localStorage.removeItem(TASKS_STATE_KEY(user,d)));
  }
}
function setupDaysHandlers(user){
  const container=document.getElementById('days-list'); if(!container) return;
  container.querySelectorAll('button[data-day]').forEach(btn=>{
    btn.addEventListener('click',()=>openDay(user, btn.getAttribute('data-day')));
  });
}
function applyHiddenDays(user){
  const hidden=readHiddenDays(user); const c=document.getElementById('days-list'); if(!c) return;
  c.querySelectorAll('button[data-day]').forEach(btn=>{ const k=btn.getAttribute('data-day'); btn.classList.toggle('hidden', hidden.includes(k)); });
}
function readHiddenDays(user){ try{return JSON.parse(localStorage.getItem(HIDDEN_DAYS_KEY(user))||'[]');}catch{return[];} }
function writeHiddenDays(user,arr){ localStorage.setItem(HIDDEN_DAYS_KEY(user), JSON.stringify(arr)); }
function openDay(user, dayKey){
  showSection('home');
  const panel=document.getElementById('tasks-panel'); const title=document.getElementById('tasks-title');
  const listEl=document.getElementById('tasks-list'); const progressEl=document.getElementById('tasks-progress'); const finishedEl=document.getElementById('tasks-finished');
  if(!panel||!title||!listEl||!progressEl||!finishedEl) return;
  const tasks=(TASKS_DATA && TASKS_DATA[user] ? TASKS_DATA[user] : {})[dayKey]||[];
  title.textContent=`${DAY_LABEL[dayKey]||'День'} — задачи`; listEl.innerHTML=''; finishedEl.classList.add('hidden');
  if(!tasks.length){ listEl.innerHTML=`<li class="task-item"><div class="task-time">—</div><div class="task-text">Для этого дня задач пока нет</div><div></div></li>`; progressEl.textContent='0 / 0'; panel.classList.remove('hidden'); return; }
  const state=loadTasksState(user, dayKey, tasks.length);
  tasks.forEach((t,i)=>{
    const li=document.createElement('li'); li.className='task-item'+(state[i]?' task-done':'');
    const time=document.createElement('div'); time.className='task-time'; time.textContent=t.time;
    const text=document.createElement('div'); text.className='task-text'; text.textContent=t.text;
    const check=document.createElement('input'); check.type='checkbox'; check.className='task-check'; check.checked=!!state[i];
    check.addEventListener('change',()=>{ state[i]=check.checked; li.classList.toggle('task-done',check.checked); saveTasksState(user,dayKey,state); updateProgress(progressEl,state);
      if(state.every(Boolean)){ finishedEl.classList.remove('hidden'); hideDayForUser(user,dayKey);} else { finishedEl.classList.add('hidden'); } });
    li.appendChild(time); li.appendChild(text); li.appendChild(check); listEl.appendChild(li);
  });
  updateProgress(progressEl,state); finishedEl.classList.toggle('hidden', !state.every(Boolean)); panel.classList.remove('hidden');
}
function updateProgress(el, state){ const d=state.filter(Boolean).length; el.textContent=`${d} / ${state.length}`; }
function loadTasksState(user, dayKey, len){ try{ const raw=localStorage.getItem(TASKS_STATE_KEY(user,dayKey)); const arr=raw?JSON.parse(raw):[]; return Array.from({length:len},(_,i)=>!!arr[i]); }catch{return Array.from({length:len},()=>false);} }
function saveTasksState(user, dayKey, arr){ localStorage.setItem(TASKS_STATE_KEY(user,dayKey), JSON.stringify(arr.map(Boolean))); }
function hideDayForUser(user, dayKey){
  const hidden=readHiddenDays(user); if(!hidden.includes(dayKey)){ hidden.push(dayKey); writeHiddenDays(user,hidden); }
  const btn=document.querySelector(`button[data-day="${dayKey}"]`); if(btn) btn.classList.add('hidden');
}

// === Траты/Бюджет/Подарки — (сокращено: как в предыдущей рабочей версии) ===
// (оставляю функции из твоей версии: renderExpensesDashboard, openBudget, renderGiftsDashboard и т.д.)
// ----- начало короткого блока (точно как у тебя) -----
const BASELINE=[{key:'Квартира',amount:11000},{key:'Нейросети',amount:4000},{key:'Уборка',amount:150},{key:'ЖКХ',amount:4000},{key:'Интернет',amount:4000},{key:'Питомцы',amount:2000},{key:'Вредные привычки',amount:1000}];
const DISCRETIONARY_CATS=new Set(['Вредные привычки','Кафе','Рестораны','Такси','Сладкое','Фастфуд','Игры','Алкоголь','Сигареты']);
function loadExpenses(){try{return JSON.parse(localStorage.getItem(EXPENSES_KEY)||'[]')}catch{return[]}}
function saveExpenses(a){localStorage.setItem(EXPENSES_KEY,JSON.stringify(a))}
function openExpenses(){showSection('expenses');renderExpensesDashboard();toggleMenu(false)}
function wireExpensesMenu(){const li=document.getElementById('menu-expenses');if(li)li.addEventListener('click',openExpenses)}
function renderExpensesDashboard(){const l=document.getElementById('expMonthLabel');if(l)l.textContent=new Date().toLocaleDateString('ru-RU',{month:'long',year:'numeric'});const dl=document.getElementById('expCats');if(dl){dl.innerHTML='';BASELINE.forEach(b=>{const o=document.createElement('option');o.value=b.key;dl.appendChild(o)})}const d=document.getElementById('expDate');if(d&&!d.value)d.value=todayStr();renderFixedTable();calcAndRenderMetrics();renderLast();renderBreakdown();renderExtra()}
function renderFixedTable(){const tbody=document.getElementById('fixedTbody');if(!tbody)return;const all=loadExpenses();const mk=monthKey();const paidMap=new Map();all.filter(e=>monthKey(e.date)===mk&&e.recurring===true).forEach(e=>paidMap.set(e.baselineKey,e));tbody.innerHTML='';BASELINE.forEach(row=>{const paid=paidMap.has(row.key);const tr=document.createElement('tr');const tdK=document.createElement('td');tdK.textContent=row.key;const tdA=document.createElement('td');tdA.className='amount';tdA.textContent=fmtMoney0(row.amount);const tdS=document.createElement('td');tdS.innerHTML=paid?`<span class="ok">Оплачено</span>`:`<span class="warn">Не оплачено</span>`;const tdB=document.createElement('td');const btn=document.createElement('button');if(!paid){btn.className='btn';btn.textContent='Оплачено';btn.addEventListener('click',()=>markFixedPaid(row.key,row.amount))}else{btn.className='btn btn-outline';btn.textContent='Отменить';btn.addEventListener('click',()=>unmarkFixedPaid(row.key))}tdB.appendChild(btn);tr.appendChild(tdK);tr.appendChild(tdA);tr.appendChild(tdS);tr.appendChild(tdB);tbody.appendChild(tr)})}
function markFixedPaid(key,amount){const user=localStorage.getItem('user')||'Система';const arr=loadExpenses();arr.push({id:`R_${key}_${monthKey()}`,date:todayStr(),category:key,amount:Number(amount),note:'Ежемесячный платеж',by:user,recurring:true,baselineKey:key});saveExpenses(arr);renderExpensesDashboard()}
function unmarkFixedPaid(key){const arr=loadExpenses();const mk=monthKey();const idx=arr.findIndex(e=>e.recurring===true&&e.baselineKey===key&&monthKey(e.date)===mk);if(idx>=0){arr.splice(idx,1);saveExpenses(arr);renderExpensesDashboard()}}
function addExpense(){const amt=Number(document.getElementById('expAmount').value);const cat=(document.getElementById('expCategory').value||'').trim();const dt=document.getElementById('expDate').value;const note=document.getElementById('expNote').value||'';if(!amt||!cat||!dt)return false;const user=localStorage.getItem('user')||'';const arr=loadExpenses();arr.push({id:`E_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,date:dt,category:cat,amount:amt,note,by:user,recurring:false});saveExpenses(arr);document.getElementById('expAmount').value='';document.getElementById('expCategory').value='';document.getElementById('expNote').value='';if(!document.getElementById('expDate').value)document.getElementById('expDate').value=todayStr();renderExpensesDashboard();return false}
function calcAndRenderMetrics(){const all=loadExpenses().filter(e=>monthKey(e.date)===monthKey());const total=all.reduce((a,b)=>a+Number(b.amount||0),0);const fixed=all.filter(e=>e.recurring).reduce((a,b)=>a+Number(b.amount||0),0);const variable=total-fixed;const extra=all.filter(e=>DISCRETIONARY_CATS.has(e.category)).reduce((a,b)=>a+Number(b.amount||0),0);setText('mTotal',fmtMoney0(total));setText('mFixed',fmtMoney0(fixed));setText('mVar',fmtMoney0(variable));setText('mExtra',fmtMoney0(extra))}
function setText(id,txt){const el=document.getElementById(id);if(el)el.textContent=txt}
function renderLast(){const ul=document.getElementById('lastList');if(!ul)return;const all=loadExpenses().filter(e=>monthKey(e.date)===monthKey()).sort((a,b)=>(b.date||'').localeCompare(a.date||'')).slice(0,15);ul.innerHTML='';if(!all.length){ul.innerHTML=`<li class="last-item"><div>—</div><div>Пока нет расходов</div><div></div><div></div></li>`;return}all.forEach(e=>{const li=document.createElement('li');li.className='last-item';const d=document.createElement('div');d.textContent=e.date;const t=document.createElement('div');t.textContent=`${e.category}${e.note?' — '+e.note:''}`;const a=document.createElement('div');a.textContent=fmtMoney0(e.amount);const del=document.createElement('div');del.className='del';del.textContent='×';del.title='Удалить запись';del.addEventListener('click',()=>{deleteExpense(e.id)});li.appendChild(d);li.appendChild(t);li.appendChild(a);li.appendChild(del);ul.appendChild(li)})}
function deleteExpense(id){const arr=loadExpenses();const i=arr.findIndex(x=>x.id===id);if(i>=0){arr.splice(i,1);saveExpenses(arr);renderExpensesDashboard()}}
function renderBreakdown(){const div=document.getElementById('breakdown');if(!div)return;const all=loadExpenses().filter(e=>monthKey(e.date)===monthKey());const map=new Map();all.forEach(e=>map.set(e.category,(map.get(e.category)||0)+Number(e.amount)));const items=[...map.entries()].sort((a,b)=>b[1]-a[1]);div.innerHTML='';if(!items.length){div.textContent='Нет данных';return}const max=Math.max(...items.map(x=>x[1]));items.forEach(([cat,val])=>{const bar=document.createElement('div');bar.className='bar';const fill=document.createElement('div');fill.style.width=`${Math.round(val*100/max)}%`;bar.appendChild(fill);const label=document.createElement('div');label.className='label';label.innerHTML=`<span>${cat}</span><span>${fmtMoney0(val)}</span>`;div.appendChild(bar);div.appendChild(label)})}
function renderExtra(){const ul=document.getElementById('extraList');if(!ul)return;const all=loadExpenses().filter(e=>monthKey(e.date)===monthKey()&&DISCRETIONARY_CATS.has(e.category));const byCat=new Map();all.forEach(e=>byCat.set(e.category,(byCat.get(e.category)||0)+Number(e.amount)));const items=[...byCat.entries()].sort((a,b)=>b[1]-a[1]);ul.innerHTML='';if(!items.length){ul.innerHTML='<li>Нет «лишних» трат по текущему правилу</li>';return}items.forEach(([cat,sumv])=>{const li=document.createElement('li');li.innerHTML=`<span>${cat}</span><strong>${fmtMoney0(sumv)}</strong>`;ul.appendChild(li)})}
// ---- конец короткого блока ----

// === БЮДЖЕТ (как в твоей версии)
const DEFAULT_BUDGET_PLAN=[{date:'2025-08-18',income:11500,toDebt:11500},{date:'2025-08-19',income:0,toDebt:0},{date:'2025-08-20',income:0,toDebt:0},{date:'2025-08-21',income:0,toDebt:0},{date:'2025-08-22',income:0,toDebt:0},{date:'2025-08-23',income:0,toDebt:0},{date:'2025-08-24',income:0,toDebt:0},{date:'2025-08-25',income:50500,toDebt:50500},{date:'2025-08-26',income:0,toDebt:0},{date:'2025-08-27',income:0,toDebt:0},{date:'2025-08-28',income:0,toDebt:0},{date:'2025-08-29',income:0,toDebt:0},{date:'2025-08-30',income:0,toDebt:0},{date:'2025-08-31',income:0,toDebt:0},{date:'2025-09-01',income:11500,toDebt:11500},{date:'2025-09-02',income:0,toDebt:0},{date:'2025-09-03',income:0,toDebt:0},{date:'2025-09-04',income:0,toDebt:0},{date:'2025-09-05',income:0,toDebt:0},{date:'2025-09-06',income:0,toDebt:0},{date:'2025-09-07',income:0,toDebt:0},{date:'2025-09-08',income:11500,toDebt:6500}];
const DEFAULT_START_DEBT=80000;
function loadBudgetLedger(){try{return JSON.parse(localStorage.getItem(BUDGET_LEDGER_KEY)||'[]')}catch{return[]}}
function saveBudgetLedger(a){localStorage.setItem(BUDGET_LEDGER_KEY,JSON.stringify(a))}
function getStartDebt(){const v=Number(localStorage.getItem(BUDGET_START_KEY));return Number.isFinite(v)&&v>0?v:DEFAULT_START_DEBT}
function setStartDebt(v){localStorage.setItem(BUDGET_START_KEY,String(Math.max(0,Math.floor(Number(v)||0))))}
function openBudget(){showSection('budget');renderBudgetDashboard();toggleMenu(false)}
function wireBudgetMenu(){const li=document.getElementById('menu-budget');if(li)li.addEventListener('click',openBudget)}
function addBudgetEntry(){const dt=document.getElementById('bDate').value;const inc=Math.max(0,Math.floor(Number(document.getElementById('bIncome').value||0)));const pay=Math.max(0,Math.floor(Number(document.getElementById('bToDebt').value||0)));const by=document.getElementById('bBy').value;if(!dt||!by)return false;const ledger=loadBudgetLedger();ledger.push({date:dt,income:inc,toDebt:pay,by});saveBudgetLedger(ledger);document.getElementById('bIncome').value='';document.getElementById('bToDebt').value='';document.getElementById('bBy').value='';if(!document.getElementById('bDate').value)document.getElementById('bDate').value=todayStr();renderBudgetDashboard();return false}
function deleteBudgetRow(idx){const ledger=loadBudgetLedger().sort((a,b)=>a.date.localeCompare(b.date));if(idx>=0&&idx<ledger.length){ledger.splice(idx,1);saveBudgetLedger(ledger);renderBudgetDashboard()}}
function saveStartDebt(){const v=document.getElementById('bStartInput').value;setStartDebt(v);renderBudgetDashboard()}
function clearBudget(){if(!confirm('Очистить все записи бюджета и платежей?'))return;localStorage.removeItem(BUDGET_LEDGER_KEY);localStorage.removeItem(BUDGET_START_KEY);renderBudgetDashboard()}
function resetToPlan(){if(!confirm('Перезаписать текущие записи планом погашения?'))return;const plan=DEFAULT_BUDGET_PLAN.map(r=>({...r,by:''}));setStartDebt(DEFAULT_START_DEBT);saveBudgetLedger(plan);renderBudgetDashboard()}
function computeBudget(ledger,startDebt){const sorted=ledger.slice().sort((a,b)=>a.date.localeCompare(b.date));let remain=startDebt;let paidSum=0;const rows=sorted.map(r=>{const pay=Math.min(remain,Math.max(0,Number(r.toDebt)||0));remain-=pay;paidSum+=pay;return{date:r.date,dow:RU_DOW_ABBR[new Date(r.date).getDay()],income:Math.max(0,Number(r.income)||0),toDebt:pay,remain:Math.max(0,Math.floor(remain)),by:r.by||''}});const finish=rows.findLast?rows.findLast(x=>x.remain===0):[...rows].reverse().find(x=>x.remain===0);return{rows,paidSum,remain,finishDate:finish?finish.date:null}}
function renderBudgetDashboard(){const startDebt=getStartDebt();document.getElementById('bStartInput').value=startDebt;const ledger=loadBudgetLedger();const {rows,paidSum,remain,finishDate}=computeBudget(ledger,startDebt);setText('bRemain',fmtMoney0(remain));setText('bPaid',fmtMoney0(paidSum));const p=startDebt>0?Math.min(100,Math.round((paidSum/startDebt)*100)):100;const fill=document.getElementById('bProgressFill');if(fill)fill.style.width=p+'%';setText('bProgressLabel',startDebt>0?`${p}%`:'100%');setText('bFinish',finishDate?finishDate:'—');const dtLabel=document.getElementById('budgetSummaryDate');if(dtLabel)dtLabel.textContent=new Date().toLocaleDateString('ru-RU',{month:'long',year:'numeric'});const d=document.getElementById('bDate');if(d&&!d.value)d.value=todayStr();const tbody=document.getElementById('budgetTbody');tbody.innerHTML='';if(rows.length===0){tbody.innerHTML=`<tr><td colspan="7" class="warn">Нет записей</td></tr>`;return}rows.forEach((r,idx)=>{const tr=document.createElement('tr');tr.innerHTML=`<td>${r.date}</td><td>${r.dow}</td><td>${fmtMoney0(r.income)}</td><td>${fmtMoney0(r.toDebt)}</td><td>${fmtMoney0(r.remain)}</td><td>${r.by?r.by:'—'}</td><td><span class="row-del" title="Удалить" onclick="deleteBudgetRow(${idx})">×</span></td>`;tbody.appendChild(tr)})}

// === Подарки (как в твоей версии)
function loadGifts(user){try{return JSON.parse(localStorage.getItem(GIFTS_KEY(user))||'[]')}catch{return[]}}
function saveGifts(user,arr){localStorage.setItem(GIFTS_KEY(user),JSON.stringify(arr))}
function openGifts(){showSection('gifts');renderGiftsDashboard();toggleMenu(false)}
function giftAdd(){const user=localStorage.getItem('user');if(!user)return false;const name=(document.getElementById('gName').value||'').trim();const price=Math.max(1,Math.floor(Number(document.getElementById('gPrice').value||0)));const link=(document.getElementById('gLink').value||'').trim();if(!name||!price)return false;const items=loadGifts(user);items.push({id:`G_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,name,price,saved:0,link,done:false,createdAt:Date.now()});saveGifts(user,items);document.getElementById('gName').value='';document.getElementById('gPrice').value='';document.getElementById('gLink').value='';renderGiftsDashboard();return false}
function giftDeposit(id){const user=localStorage.getItem('user');const items=loadGifts(user);const g=items.find(x=>x.id===id);if(!g)return;const inp=document.getElementById(`dep_${id}`);const val=Math.max(0,Math.floor(Number((inp&&inp.value)||0)));if(!val)return;g.saved=Math.min(g.price,Math.max(0,(Number(g.saved)||0)+val));saveGifts(user,items);if(inp)inp.value='';renderGiftsDashboard()}
function giftMarkBought(id){const user=localStorage.getItem('user');const items=loadGifts(user);const g=items.find(x=>x.id===id);if(!g)return;g.done=true;g.saved=g.price;saveGifts(user,items);renderGiftsDashboard()}
function giftDelete(id){const user=localStorage.getItem('user');const items=loadGifts(user);const i=items.findIndex(x=>x.id===id);if(i>=0){items.splice(i,1);saveGifts(user,items)}renderGiftsDashboard()}
function renderGiftsDashboard(){const user=localStorage.getItem('user');if(!user)return;const items=loadGifts(user);const active=items.filter(x=>!x.done);const count=active.length;const targetSum=active.reduce((a,b)=>a+Number(b.price||0),0);const savedSum=active.reduce((a,b)=>a+Number(b.saved||0),0);const remainSum=Math.max(0,targetSum-savedSum);setText('gCount',String(count));setText('gTarget',fmtMoney0(targetSum));setText('gSaved',fmtMoney0(savedSum));setText('gRemain',fmtMoney0(remainSum));const listDiv=document.getElementById('giftsList');listDiv.innerHTML='';if(!active.length){listDiv.innerHTML=`<div class="g-item"><div><h4>Пока пусто</h4><div class="g-meta">Добавь первую цель выше.</div></div></div>`}else{active.map(g=>({...g,remain:Math.max(0,Number(g.price)-Number(g.saved||0))})).sort((a,b)=>b.remain-a.remain).forEach(g=>{const wrap=document.createElement('div');wrap.className='g-item';const left=document.createElement('div');const title=document.createElement('h4');title.textContent=g.name;left.appendChild(title);const meta=document.createElement('div');meta.className='g-meta';const linkHtml=g.link?` · <a href="${g.link}" target="_blank" rel="noopener noreferrer">ссылка</a>`:'';meta.innerHTML=`Цена: <strong>${fmtMoney0(g.price)}</strong> · Накоплено: <strong>${fmtMoney0(g.saved||0)}</strong> · Осталось: <strong>${fmtMoney0(Math.max(0,g.price-(g.saved||0)))}</strong>${linkHtml}`;left.appendChild(meta);const progress=document.createElement('div');progress.className='g-progress';const fill=document.createElement('div');fill.style.width=`${Math.min(100,Math.round(((g.saved||0)/g.price)*100))}%`;progress.appendChild(fill);left.appendChild(progress);const nums=document.createElement('div');nums.className='g-nums';nums.innerHTML=`<span>Цель: ${fmtMoney0(g.price)}</span><span>Отложил: ${fmtMoney0(g.saved||0)}</span><span>Осталось: ${fmtMoney0(Math.max(0,g.price-(g.saved||0)))}</span>`;left.appendChild(nums);const right=document.createElement('div');right.className='g-actions';right.innerHTML=`<input id="dep_${g.id}" type="number" min="1" step="1" placeholder="Сколько отложить, ₽" /><button class="btn" onclick="giftDeposit('${g.id}')">Отложить</button><button class="btn btn-outline" onclick="giftMarkBought('${g.id}')">Куплено</button><button class="btn btn-outline danger" onclick="giftDelete('${g.id}')">Удалить</button>`;wrap.appendChild(left);wrap.appendChild(right);listDiv.appendChild(wrap)})}const doneDiv=document.getElementById('giftsDone');doneDiv.innerHTML='';const done=items.filter(x=>x.done).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));if(!done.length){doneDiv.innerHTML=`<div class="g-item"><div><h4>Пока нет</h4><div class="g-meta">Когда цель будет выполнена — она появится здесь.</div></div></div>`}else{done.forEach(g=>{const wrap=document.createElement('div');wrap.className='g-item';const left=document.createElement('div');const title=document.createElement('h4');title.textContent=`${g.name} — куплено`;const meta=document.createElement('div');meta.className='g-meta';const linkHtml=g.link?` · <a href="${g.link}" target="_blank" rel="noopener noreferrer">ссылка</a>`:'';meta.innerHTML=`Цена: <strong>${fmtMoney0(g.price)}</strong>${linkHtml}`;left.appendChild(title);left.appendChild(meta);const right=document.createElement('div');right.className='g-actions';right.innerHTML=`<button class="btn btn-outline danger" onclick="giftDelete('${g.id}')">Удалить</button>`;wrap.appendChild(left);wrap.appendChild(right);doneDiv.appendChild(wrap)})}}
function openCleaning(){ showSection('cleaning'); toggleMenu(false); }

// === Уведомления
function updateNotifBadge(user){
  const badge = document.getElementById('notifBadge'); if(!badge) return;
  const dailyOpen = loadGlobalTasks().filter(t => t.date===todayStr() && t.assignee===user && !t.done).length;
  let personalDue = 0;
  if(user === 'Славик'){
    personalDue = loadPersonalTasks(user).filter(t => !t.done && t.due && t.due <= todayStr()).length;
  }
  const total = dailyOpen + personalDue;
  badge.textContent = total; badge.classList.toggle('hidden', total===0);
}

// === Инициализация
window.onload = function(){
  const user=localStorage.getItem('user');
  if(!user){ window.location.href='index.html'; return; }

  const nameEl=document.getElementById('username'); if(nameEl) nameEl.textContent=user;

  renderDailyAdvice(user);
  buildMenuForUser(user);
  renderZonesByDay(user);

  weeklyResetIfSunday(user);
  setupDaysHandlers(user);
  applyHiddenDays(user);

  wireBurger();
  wireNav();
  wireLogoNav();
  wireLogout();
  wireExpensesMenu();
  wireBudgetMenu();

  renderDailyTasks(user);
  updateNotifBadge(user);

  showSection('home');

  // Подготовка остальных разделов (ничего не показываем, только инициализируем данные)
  renderExpensesDashboard();
  renderBudgetDashboard();
  renderGiftsDashboard();
};
