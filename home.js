(function(){
  // --- Guards ---
  const user = (function(){
    try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
  })();
  if (!user || !user.name || !["Никося","Славик"].includes(user.name)){
    location.replace("index.html"); // строгая проверка
  }

  // --- DOM refs ---
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => Array.from(root.querySelectorAll(s));

  // --- Utils ---
  const rub = (n) => new Intl.NumberFormat("ru-RU",{style:"currency",currency:"RUB",maximumFractionDigits:0}).format(Number(n||0));
  const today = new Date();
  const iso = (d=today) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0,10);
  const ymKey = (d=today) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
  const weekdays = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];
  const weekdayName = (d) => ["Вс","Пн","Вт","Ср","Чт","Пт","Сб"][d.getDay()];
  const uid = () => Math.random().toString(36).slice(2,9);

  function readLS(key, def){ try{ return JSON.parse(localStorage.getItem(key) || JSON.stringify(def)); }catch{return def;} }
  function writeLS(key, val){ localStorage.setItem(key, JSON.stringify(val)); }

  // --- Header / Menu ---
  const currentUserEl = $("#currentUser");
  currentUserEl.textContent = user.name;
  $("#logoutBtn").addEventListener("click", () => window.Auth ? window.Auth.signOut() : (localStorage.removeItem("user"), location.replace("index.html")));

  const menuItemsBase = [
    { id:"home", label:"Дом" },
    { id:"daily", label:"Задачи на день" },
    { id:"expenses", label:"Траты" },
    { id:"budget", label:"Бюджет" },
    { id:"gifts", label:"Хочу подарить" },
    { id:"cleaning", label:"Памятка по уборке" },
  ];
  if (user.name === "Никося") menuItemsBase.splice(5,0,{ id:"meds", label:"Приём лекарств" });
  if (user.name === "Славик") menuItemsBase.splice(2,0,{ id:"mustdo", label:"Нужно сделать" });

  const menuList = $("#menuList");
  for (const m of menuItemsBase){
    const a = document.createElement("a");
    a.href = "#";
    a.dataset.section = m.id;
    a.textContent = m.label;
    if (m.id === "home") a.classList.add("active");
    const li = document.createElement("li");
    li.appendChild(a);
    menuList.appendChild(li);
  }

  const sideMenu = $("#sideMenu");
  const overlay = $("#overlay");
  const burger = $("#burger");

  function closeMenu(){
    sideMenu.classList.remove("open");
    overlay.classList.add("hidden");
    burger.setAttribute("aria-expanded","false");
  }
  function openMenu(){
    sideMenu.classList.add("open");
    overlay.classList.remove("hidden");
    burger.setAttribute("aria-expanded","true");
  }
  burger.addEventListener("click", () => sideMenu.classList.contains("open") ? closeMenu() : openMenu());
  overlay.addEventListener("click", closeMenu);
  document.addEventListener("keydown", (e)=>{ if(e.key==="Escape") closeMenu(); });

  function showSection(id){
    $$(".section").forEach(s => s.classList.toggle("active", s.id === `section-${id}`));
    $$("#menuList a").forEach(a => a.classList.toggle("active", a.dataset.section === id));
    if (id==="home") updateHomeView();
    if (id==="daily") renderDaily();
    if (id==="mustdo") renderMustdo();
    if (id==="meds") renderMeds();
    if (id==="expenses") renderExpenses();
    if (id==="budget") renderBudget();
    if (id==="gifts") renderGifts();
    if (id==="cleaning") renderCleaning();
    closeMenu();
  }

  menuList.addEventListener("click", (e)=>{
    const a = e.target.closest("a");
    if (!a) return;
    e.preventDefault();
    showSection(a.dataset.section);
  });
  $("#logo").addEventListener("click", ()=> showSection("home"));

  // --- Advice ---
  function updateAdvice(){
    try {
      const txt = window.getDailyAdvice(user.name);
      $("#adviceText").textContent = txt;
    } catch {
      $("#adviceText").textContent = "";
    }
  }

  // --- Weekly schedules ---
  const SCHEDULES = {
    "Никося": {
      // порядок кнопок: Пн..Вс
      1: [
        "08:00–08:30 — Подъём, умывание, зарядка",
        "08:30–09:00 — Завтрак",
        "09:00–09:50 — 🧹 Кухня (столешницы, плита, пол)",
        "10:00–10:30 — Отчёт к планёрке",
        "10:40–11:00 — Планёрка",
        "11:00–11:30 — Чаты, быстрые задачи",
        "11:30–11:50 — 📚 Чтение",
        "11:50–12:00 — Чаты",
        "12:00–12:20 — 🏋️‍♀️ Тренировка",
        "12:20–13:00 — 💅 Обучение маникюру",
        "13:00–13:30 — Обед",
        "13:30–14:00 — Работа",
        "14:00–14:30 — Документы, билеты",
        "14:30–14:50 — 📚 Чтение",
        "14:50–15:00 — Чаты",
        "15:00–15:10 — 💅 Маникюр",
        "15:10–16:00 — Чаты, прозвоны",
        "16:00–16:20 — 📚 Чтение",
        "16:20–17:00 — Чаты, задачи",
        "17:00–17:20 — 💅 Маникюр",
        "17:20–18:50 — Чаты + перевахтовки",
        "19:00–19:30 — Ужин",
        "19:30–21:00 — Личное время",
        "21:00–21:30 — 📚 Чтение / релакс",
        "21:30–22:00 — Подготовка ко сну"
      ],
      2: [
        "08:00–08:30 — Подъём, умывание, зарядка",
        "08:30–09:00 — Завтрак",
        "09:00–09:50 — 🧹 Ванная (раковина, зеркало, пол)",
        "10:00–10:30 — Отчёт к планёрке",
        "10:40–11:00 — Планёрка",
        "11:00–11:30 — Чаты, быстрые задачи",
        "11:30–11:50 — 📚 Чтение",
        "11:50–12:00 — Чаты",
        "12:00–12:20 — 🏋️‍♀️ Тренировка",
        "12:20–13:00 — 💅 Обучение маникюру",
        "13:00–13:30 — Обед",
        "13:30–14:00 — Работа",
        "14:00–14:30 — Документы, билеты",
        "14:30–14:50 — 📚 Чтение",
        "14:50–15:00 — Чаты",
        "15:00–15:10 — 💅 Маникюр",
        "15:10–16:00 — Чаты, прозвоны",
        "16:00–16:20 — 📚 Чтение",
        "16:20–17:00 — Чаты, задачи",
        "17:00–17:20 — 💅 Маникюр",
        "17:20–18:50 — Чаты + перевахтовки",
        "19:00–19:30 — Ужин",
        "19:30–21:00 — Личное время",
        "21:00–21:30 — 📚 Чтение / релакс",
        "21:30–22:00 — Подготовка ко сну"
      ],
      3: [
        "08:00–08:30 — Подъём, умывание, зарядка",
        "08:30–09:00 — Завтрак",
        "09:00–09:50 — 🧹 Прихожая (пол, обувница)",
        "10:00–10:30 — Отчёт к планёрке",
        "10:40–11:00 — Планёрка",
        "11:00–11:30 — Чаты, быстрые задачи",
        "11:30–11:50 — 📚 Чтение",
        "11:50–12:00 — Чаты",
        "12:00–12:20 — 🏋️‍♀️ Тренировка",
        "12:20–13:00 — 💅 Обучение маникюру",
        "13:00–13:30 — Обед",
        "13:30–14:00 — Работа",
        "14:00–14:30 — Документы, билеты",
        "14:30–14:50 — 📚 Чтение",
        "14:50–15:00 — Чаты",
        "15:00–15:10 — 💅 Маникюр",
        "15:10–16:00 — Чаты, прозвоны",
        "16:00–16:20 — 📚 Чтение",
        "16:20–17:00 — Чаты, задачи",
        "17:00–17:20 — 💅 Маникюр",
        "17:20–18:50 — Чаты + перевахтовки",
        "19:00–19:30 — Ужин",
        "19:30–21:00 — Личное время",
        "21:00–21:30 — 📚 Чтение / релакс",
        "21:30–22:00 — Подготовка ко сну"
      ],
      4: [
        "08:00–08:30 — Подъём, умывание, зарядка",
        "08:30–09:00 — Завтрак",
        "09:00–09:50 — 🧹 Гостиная (пыль, пол)",
        "далее — как в понедельник"
      ],
      5: [
        "08:00–08:30 — Подъём, умывание, зарядка",
        "08:30–09:00 — Завтрак",
        "09:00–09:50 — 🧹 Лоджия (пол, пыль)",
        "далее — как в понедельник"
      ],
      6: [],
      7: []
    },
    "Славик": {
      1: [
        "08:30–09:00 Подъём, завтрак",
        "09:00–10:30 Работа",
        "10:30–11:30 2 ч обучение (онлайн-курс)",
        "11:30–12:00 Рабочие задачи",
        "12:00–12:20 🏋️‍♂️ Тренировка",
        "12:20–13:00 Обед",
        "13:00–15:00 2 ч работа над сайтом",
        "15:00–17:30 Работа",
        "18:00–19:00 🧹 Балкон",
        "19:00–22:00 Игры 🎮"
      ],
      2: [
        "08:30–09:00 Подъём, завтрак",
        "09:00–10:30 Работа",
        "10:30–11:30 2 ч обучение (онлайн-курс)",
        "11:30–12:00 Рабочие задачи",
        "12:00–12:20 🏋️‍♂️ Тренировка",
        "12:20–13:00 Обед",
        "13:00–15:00 2 ч работа над сайтом",
        "15:00–17:30 Работа",
        "18:00–19:00 🧹 Ванная",
        "19:00–22:00 Общее время с Никой"
      ],
      3: [
        "08:30–09:00 Подъём, завтрак",
        "09:00–10:30 Работа",
        "10:30–11:30 2 ч обучение (онлайн-курс)",
        "11:30–12:00 Рабочие задачи",
        "12:00–12:20 🏋️‍♂️ Тренировка",
        "12:20–13:00 Обед",
        "13:00–15:00 2 ч работа над сайтом",
        "15:00–17:30 Работа",
        "18:00–19:00 🧹 Гостиная",
        "19:00–22:00 Игры 🎮"
      ],
      4: [
        "08:30–09:00 Подъём, завтрак",
        "09:00–10:30 Работа",
        "10:30–11:30 2 ч обучение (онлайн-курс)",
        "11:30–12:00 Рабочие задачи",
        "12:00–12:20 🏋️‍♂️ Тренировка",
        "12:20–13:00 Обед",
        "13:00–15:00 2 ч работа над сайтом",
        "15:00–17:30 Работа",
        "18:00–19:00 🧹 Прихожая",
        "19:00–22:00 Общее время с Никой"
      ],
      5: [
        "08:30–09:00 Подъём, завтрак",
        "09:00–10:30 Работа",
        "10:30–11:30 2 ч обучение (онлайн-курс)",
        "11:30–12:00 Рабочие задачи",
        "12:00–12:20 🏋️‍♂️ Тренировка",
        "12:20–13:00 Обед",
        "13:00–16:30 Работа",
        "19:00–22:00 Игры 🎮"
      ],
      6: [],
      7: []
    }
  };

  const ZONES = {
    "Никося": [
      ["Пн","Кухня"],["Вт","Ванная"],["Ср","Прихожая"],["Чт","Гостиная"],["Пт","Лоджия"],["Сб","—"],["Вс","—"]
    ],
    "Славик": [
      ["Пн","Балкон"],["Вт","Ванная"],["Ср","Гостиная"],["Чт","Прихожая"],["Пт","—"],["Сб","—"],["Вс","—"]
    ]
  };

  // --- Weekly reset (run on Sundays) ---
  function ensureWeeklyReset(){
    const key = "dom.week.reset.last";
    const last = readLS(key, "");
    const isSunday = (new Date()).getDay() === 0;
    const todayIso = iso();
    if (isSunday && last !== todayIso){
      // очистка прогресса задач по дням (для обоих пользователей)
      ["Никося","Славик"].forEach(u=>{
        for (let d=1; d<=7; d++){
          localStorage.removeItem(`dom.schedule.${u}.${d}.done`);
        }
      });
      writeLS(key, todayIso);
    }
  }

  // --- Home view: days, tasks per day, zones ---
  const daysContainer = $("#daysContainer");
  const dayPanel = $("#dayPanel");
  const dayTitle = $("#dayTitle");
  const dayTasksEl = $("#dayTasks");
  const dayNote = $("#dayNote");
  const dayProgress = $("#dayProgress");

  function getDoneMap(u, d){
    return readLS(`dom.schedule.${u}.${d}.done`, {}); // { index: true }
  }
  function setDoneMap(u, d, map){
    writeLS(`dom.schedule.${u}.${d}.done`, map);
  }

  function isDayCompleted(u, d){
    const items = (SCHEDULES[u][d]||[]);
    if (items.length===0) return false;
    const done = getDoneMap(u,d);
    let doneCount = 0;
    for (let i=0;i<items.length;i++) if (done[i]) doneCount++;
    return doneCount === items.length;
  }

  function buildDayButtons(){
    daysContainer.innerHTML = "";
    for (let i=1;i<=7;i++){
      const btn = document.createElement("button");
      btn.type="button";
      btn.className="day-btn";
      btn.textContent = weekdays[i-1];
      btn.dataset.day = String(i);
      if (isDayCompleted(user.name, i)) btn.classList.add("hidden");
      btn.addEventListener("click", ()=> openDay(i));
      daysContainer.appendChild(btn);
    }
  }

  function openDay(d){
    const tasks = (SCHEDULES[user.name][d]||[]);
    dayPanel.classList.remove("hidden");
    dayTitle.textContent = `${weekdays[d-1]} — задачи`;
    dayTasksEl.innerHTML = "";
    const done = getDoneMap(user.name, d);
    let doneCount = 0;

    tasks.forEach((t, idx)=>{
      const li = document.createElement("li");
      const cb = document.createElement("input");
      cb.type="checkbox"; cb.checked=!!done[idx];
      const span = document.createElement("span");
      span.textContent = t;
      if (cb.checked) span.classList.add("done");
      cb.addEventListener("change", ()=>{
        done[idx] = cb.checked;
        if (!cb.checked) delete done[idx];
        setDoneMap(user.name,d,done);
        span.classList.toggle("done", cb.checked);
        renderDayProgress(d);
        if (isDayCompleted(user.name, d)){
          // скрываем кнопку дня
          const b = daysContainer.querySelector(`.day-btn[data-day="${d}"]`);
          if (b) b.classList.add("hidden");
          dayNote.classList.remove("hidden");
        }
        updateBadge();
      });
      li.append(cb, span);
      dayTasksEl.appendChild(li);
      if (cb.checked) doneCount++;
    });

    function count(){
      const m = getDoneMap(user.name,d);
      let c=0; for (let i=0;i<tasks.length;i++) if (m[i]) c++;
      return c;
    }
    function render(){
      dayProgress.textContent = `${count()} / ${tasks.length}`;
      dayNote.classList.toggle("hidden", !isDayCompleted(user.name,d));
    }
    renderDayProgress = render; // update closure
    render();
  }
  let renderDayProgress = ()=>{};

  function renderZones(){
    const list = $("#zonesList");
    list.innerHTML = "";
    for (const [day, zone] of ZONES[user.name]){
      const li = document.createElement("li");
      li.textContent = `${day}: ${zone}`;
      list.appendChild(li);
    }
  }

  function updateHomeView(){
    updateAdvice();
    buildDayButtons();
    renderZones();
    dayPanel.classList.add("hidden");
  }

  // --- Daily tasks (today) ---
  const dailyKey = ()=> `dom.dayTodos.${iso()}`;
  function readDaily(){
    return readLS(dailyKey(), []); // {id,text,assignee,creator,done}
  }
  function writeDaily(items){
    writeLS(dailyKey(), items);
  }
  function renderDaily(){
    const items = readDaily();
    const mine = items.filter(x=>x.assignee===user.name);
    const byMe = items.filter(x=>x.creator===user.name && x.assignee!==user.name);

    const mineEl = $("#dailyMine"); mineEl.innerHTML="";
    for (const t of mine){
      const li = document.createElement("li");
      const cb = document.createElement("input");
      cb.type="checkbox"; cb.checked=!!t.done;
      const span = document.createElement("span"); span.textContent = t.text;
      if (cb.checked) span.classList.add("done");
      cb.addEventListener("change", ()=>{
        t.done = cb.checked; writeDaily(items);
        span.classList.toggle("done", t.done);
        updateBadge();
      });
      li.append(cb, span);
      mineEl.appendChild(li);
    }

    const byMeEl = $("#dailyByMe"); byMeEl.innerHTML="";
    for (const t of byMe){
      const li = document.createElement("li");
      const cb = document.createElement("input");
      cb.type="checkbox"; cb.checked=!!t.done; cb.disabled = true;
      const span = document.createElement("span"); span.textContent = `${t.text} — ${t.assignee}`;
      if (cb.checked) span.classList.add("done");
      li.append(cb, span);
      byMeEl.appendChild(li);
    }
  }

  $("#dailyForm").addEventListener("submit", (e)=>{
    e.preventDefault();
    const text = $("#dailyText").value.trim();
    const assignee = $("#dailyAssignee").value;
    if (!text) return;
    const items = readDaily();
    items.push({ id: uid(), text, assignee, creator: user.name, done:false });
    writeDaily(items);
    $("#dailyText").value = "";
    renderDaily();
    updateBadge();
  });

  // --- Mustdo (Славик) ---
  function mustdoKey(){ return `dom.mustdo.Славик`; }
  function readMustdo(){ return readLS(mustdoKey(), []); } // {id,text,dateISO,done}
  function writeMustdo(v){ writeLS(mustdoKey(), v); }

  function renderMustdo(){
    if (user.name!=="Славик") return;
    const list = $("#mustdoList"); list.innerHTML="";
    const items = readMustdo();
    for (const t of items){
      const li = document.createElement("li");
      const cb = document.createElement("input");
      cb.type="checkbox"; cb.checked=!!t.done;
      const txt = document.createElement("span");
      const isOver = !t.done && new Date(t.dateISO) <= new Date(iso());
      txt.textContent = `${t.text} — до ${t.dateISO}`;
      if (isOver) txt.classList.add("overdue");
      if (cb.checked) txt.classList.add("done");
      cb.addEventListener("change", ()=>{
        t.done = cb.checked; writeMustdo(items);
        txt.classList.toggle("done", t.done);
        txt.classList.toggle("overdue", !t.done && new Date(t.dateISO) <= new Date(iso()));
        updateBadge();
      });
      li.append(cb, txt);
      list.appendChild(li);
    }
  }

  const mustdoForm = $("#mustdoForm");
  if (mustdoForm){
    mustdoForm.addEventListener("submit",(e)=>{
      e.preventDefault();
      const text = $("#mustdoText").value.trim();
      const dateISO = $("#mustdoDate").value;
      if (!text || !dateISO) return;
      const items = readMustdo();
      items.push({ id: uid(), text, dateISO, done:false });
      writeMustdo(items);
      $("#mustdoText").value = ""; $("#mustdoDate").value = "";
      renderMustdo();
      updateBadge();
    });
  }

  // --- Meds (Ника, today) ---
  function medsKey(){ return `dom.meds.${iso()}.Никося`; }
  function readMeds(){ return readLS(medsKey(), []); } // {id,name,time,taken}
  function writeMeds(v){ writeLS(medsKey(), v); }

  function renderMeds(){
    if (user.name!=="Никося") return;
    const list = $("#medsList"); list.innerHTML="";
    for (const t of readMeds()){
      const li = document.createElement("li");
      const cb = document.createElement("input"); cb.type="checkbox"; cb.checked=!!t.taken;
      const span = document.createElement("span"); span.textContent = `${t.time} — ${t.name}`;
      if (cb.checked) span.classList.add("done");
      cb.addEventListener("change", ()=>{
        t.taken = cb.checked; writeMeds(readMeds()); // re-read for immutability
        const items = readMeds().map(x=> x.id===t.id ? {...x, taken: cb.checked} : x);
        writeMeds(items);
        span.classList.toggle("done", cb.checked);
        updateBadge();
      });
      li.append(cb, span);
      list.appendChild(li);
    }
  }

  const medsForm = $("#medsForm");
  if (medsForm){
    medsForm.addEventListener("submit",(e)=>{
      e.preventDefault();
      const name = $("#medsName").value.trim();
      const time = $("#medsTime").value;
      if (!name || !time) return;
      const items = readMeds();
      items.push({ id: uid(), name, time, taken:false });
      writeMeds(items);
      $("#medsName").value=""; $("#medsTime").value="";
      renderMeds();
      updateBadge();
    });
  }

  // --- Expenses ---
  const FIXED_DEF = [
    ["Квартира",11000],
    ["Нейросети",4000],
    ["Уборка",150],
    ["ЖКХ",4000],
    ["Интернет",4000],
    ["Питомцы",2000],
    ["Вредные привычки",1000]
  ];
  function fixedKey(){ return `dom.expenses.fixed.${ymKey()}`; }
  function varKey(){ return `dom.expenses.var.${ymKey()}`; }
  function readFixed(){
    let m = readLS(fixedKey(), null);
    if (!m){ m = Object.fromEntries(FIXED_DEF.map(([n,_])=>[n,false])); writeLS(fixedKey(), m); }
    return m; // {name: paidBool}
  }
  function writeFixed(v){ writeLS(fixedKey(), v); }
  function readVar(){ return readLS(varKey(), []); } // {id,name,amount,type,dateISO}
  function writeVar(v){ writeLS(varKey(), v); }

  function renderExpenses(){
    // fixed
    const fixed = readFixed();
    const fixedList = $("#fixedList"); fixedList.innerHTML="";
    for (const [name, amount] of FIXED_DEF){
      const li = document.createElement("li"); li.className="fixed-item";
      const left = document.createElement("div"); left.textContent = `${name} — ${rub(amount)}`;
      const btn = document.createElement("button"); btn.className="btn";
      btn.textContent = fixed[name] ? "Оплачено" : "Отметить оплату";
      if (fixed[name]) btn.classList.add("primary"), btn.classList.add("paid"); // визуал
      btn.addEventListener("click", ()=>{
        fixed[name] = !fixed[name];
        writeFixed(fixed);
        renderExpenses();
      });
      li.append(left, btn);
      fixedList.appendChild(li);
    }

    // var list
    const ul = $("#varList"); ul.innerHTML = "";
    for (const it of readVar()){
      const li = document.createElement("li");
      const span = document.createElement("span");
      span.innerHTML = `${it.dateISO}: <strong>${it.name}</strong> — ${rub(it.amount)} <span class="tag">${it.type}</span>`;
      const del = document.createElement("button"); del.className="del"; del.textContent="✕";
      del.addEventListener("click", ()=>{
        const arr = readVar().filter(x=>x.id!==it.id);
        writeVar(arr);
        renderExpenses();
      });
      li.append(span, del);
      ul.appendChild(li);
    }

    // summary
    const fixedPaidSum = FIXED_DEF.filter(([n,_])=>fixed[n]).reduce((s,[_,a])=>s+a,0);
    const varAll = readVar();
    const varSum = varAll.reduce((s,x)=>s+Number(x.amount||0),0);
    const varBad = varAll.filter(x=>x.type==="лишняя").reduce((s,x)=>s+Number(x.amount||0),0);
    const total = fixedPaidSum + varSum;

    const sum = $("#expSummary"); sum.innerHTML="";
    const kpi = (label,val)=>{
      const d = document.createElement("div"); d.className="kpi";
      d.innerHTML = `<strong>${rub(val)}</strong><span class="muted">${label}</span>`;
      return d;
    };
    sum.append(
      kpi("Всего за месяц", total),
      kpi("Обязательные оплачено", fixedPaidSum),
      kpi("Переменные расходы", varSum),
      kpi("Лишние траты", varBad)
    );
  }

  $("#varForm").addEventListener("submit",(e)=>{
    e.preventDefault();
    const name = $("#varName").value.trim();
    const amount = Math.max(0, Number($("#varAmount").value));
    const type = $("#varType").value;
    if (!name || !amount) return;
    const arr = readVar();
    arr.push({ id: uid(), name, amount, type, dateISO: iso() });
    writeVar(arr);
    $("#varName").value=""; $("#varAmount").value="";
    renderExpenses();
  });

  // --- Budget ---
  function debtInitKey(){ return "dom.budget.initialDebt"; }
  function budgetEntriesKey(){ return "dom.budget.entries"; }
  function readDebt(){ return Number(localStorage.getItem(debtInitKey()) || 0); }
  function writeDebt(v){ localStorage.setItem(debtInitKey(), String(Math.max(0,Number(v)||0))); }
  function readEntries(){ return readLS(budgetEntriesKey(), []); } // [{dateISO,weekday,inc,inDebt,balance,who}]
  function writeEntries(v){ writeLS(budgetEntriesKey(), v); }

  function renderBudget(){
    $("#debtInput").value = readDebt() || "";
    $("#debtInfo").textContent = readDebt() ? `Текущий долг: ${rub(readDebt())}` : "Долг не задан";

    const entries = readEntries();
    // table
    const tbody = $("#budgetTable tbody"); tbody.innerHTML="";
    for (const e of entries){
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${e.dateISO}</td>
        <td>${e.weekday}</td>
        <td>${rub(e.inc)}</td>
        <td>${rub(e.inDebt)}</td>
        <td>${rub(e.balance)}</td>
        <td>${e.who}</td>
      `;
      tbody.appendChild(tr);
    }
    // summary
    const init = readDebt();
    const lastBal = entries.length ? entries[entries.length-1].balance : init;
    const paid = Math.max(0, init - lastBal);
    const progress = init ? Math.round((paid / init)*100) : 0;
    const planDate = entries.length ? entries[entries.length-1].dateISO : "—";

    const wrap = $("#budgetSummary"); wrap.innerHTML="";
    const block = (label,val)=>{
      const d = document.createElement("div"); d.className="kpi";
      d.innerHTML = `<strong>${val}</strong><span class="muted">${label}</span>`;
      return d;
    };
    wrap.append(
      block("Остаток долга", rub(lastBal)),
      block("Выплачено", rub(paid)),
      block("Прогресс", progress + " %"),
      block("Плановая дата", planDate)
    );
  }

  $("#saveDebt").addEventListener("click", ()=>{
    const v = Number($("#debtInput").value);
    writeDebt(v);
    // сброс пересчёта балансов относительно нового долга
    const entries = readEntries();
    let balance = readDebt();
    for (const e of entries){
      balance = Math.max(0, balance - Number(e.inDebt||0));
      e.balance = balance;
    }
    writeEntries(entries);
    renderBudget();
  });

  $("#clearBudget").addEventListener("click", ()=>{
    if (!confirm("Очистить все записи и долг?")) return;
    localStorage.removeItem(debtInitKey());
    localStorage.removeItem(budgetEntriesKey());
    renderBudget();
  });

  $("#budgetForm").addEventListener("submit",(e)=>{
    e.preventDefault();
    const inc = Math.max(0, Number($("#incToday").value));
    const inDebt = Math.max(0, Number($("#payDebt").value));
    const who = $("#whoPaid").value;
    let init = readDebt();
    if (!init && init!==0){ alert("Сначала задайте начальный долг."); return; }
    const entries = readEntries();
    let prevBal = entries.length ? entries[entries.length-1].balance : init;
    let newBal = Math.max(0, prevBal - inDebt);
    const entry = { dateISO: iso(), weekday: weekdayName(new Date()), inc, inDebt, balance: newBal, who };
    entries.push(entry);
    writeEntries(entries);
    renderBudget();
    $("#incToday").value=""; $("#payDebt").value="";
  });

  // --- Gifts (per user) ---
  function goalsKey(){ return `dom.gifts.${user.name}.goals`; }
  function purchasedKey(){ return `dom.gifts.${user.name}.purchased`; }
  function readGoals(){ return readLS(goalsKey(), []); } // {id,name,price,link,saved}
  function writeGoals(v){ writeLS(goalsKey(), v); }
  function readPurchased(){ return readLS(purchasedKey(), []); } // {id,name,price,link,dateISO}
  function writePurchased(v){ writeLS(purchasedKey(), v); }

  function renderGifts(){
    const goals = readGoals();
    const purchased = readPurchased();

    // goals list
    const gl = $("#goalsList"); gl.innerHTML="";
    for (const g of goals){
      const li = document.createElement("li");
      const left = document.createElement("div");
      const link = g.link ? ` — <a class="link" href="${g.link}" target="_blank" rel="noopener">ссылка</a>` : "";
      left.innerHTML = `<strong>${g.name}</strong> — цена ${rub(g.price)} — накоплено ${rub(g.saved)}${link}`;
      const right = document.createElement("div"); right.className="row";
      const add = document.createElement("button"); add.className="btn"; add.textContent="Отложить 500 ₽";
      const del = document.createElement("button"); del.className="del"; del.textContent="✕";
      add.addEventListener("click", ()=>{
        g.saved = Number(g.saved||0) + 500;
        if (g.saved >= g.price){
          // move to purchased
          const rest = goals.filter(x=>x.id!==g.id);
          writeGoals(rest);
          const pur = readPurchased(); pur.push({ id: g.id, name:g.name, price:g.price, link:g.link, dateISO: iso() });
          writePurchased(pur);
        } else {
          writeGoals(goals);
        }
        renderGifts();
      });
      del.addEventListener("click", ()=>{
        writeGoals(goals.filter(x=>x.id!==g.id));
        renderGifts();
      });
      right.append(add, del);
      li.append(left, right);
      gl.appendChild(li);
    }

    // purchased list
    const pl = $("#purchasedList"); pl.innerHTML="";
    for (const p of purchased){
      const li = document.createElement("li");
      const link = p.link ? ` — <a class="link" href="${p.link}" target="_blank" rel="noopener">ссылка</a>` : "";
      li.innerHTML = `<span><strong>${p.name}</strong> — ${rub(p.price)} — куплено ${p.dateISO}${link}</span>`;
      pl.appendChild(li);
    }

    // summary
    const summary = $("#giftsSummary"); summary.innerHTML="";
    const totalGoals = goals.length;
    const totalPrices = goals.reduce((s,x)=>s+Number(x.price||0),0);
    const totalSaved = goals.reduce((s,x)=>s+Number(x.saved||0),0);
    const leftSum = Math.max(0, totalPrices - totalSaved);
    const kpi = (label,val)=>{ const d=document.createElement("div"); d.className="kpi"; d.innerHTML=`<strong>${val}</strong><span class="muted">${label}</span>`; return d; };
    summary.append(
      kpi("Кол-во целей", totalGoals),
      kpi("Сумма цен", rub(totalPrices)),
      kpi("Накоплено", rub(totalSaved)),
      kpi("Осталось", rub(leftSum))
    );
  }

  $("#giftForm").addEventListener("submit",(e)=>{
    e.preventDefault();
    const name = $("#giftName").value.trim();
    const price = Math.max(0, Number($("#giftPrice").value));
    const link = $("#giftLink").value.trim();
    if (!name || !price) return;
    const goals = readGoals();
    goals.push({ id: uid(), name, price, link, saved:0 });
    writeGoals(goals);
    $("#giftName").value=""; $("#giftPrice").value=""; $("#giftLink").value="";
    renderGifts();
  });

  // --- Cleaning memo (accordion) ---
  const CLEAN_SECTIONS = [
    {
      title:"Кухня",
      steps:[
        "Инвентарь: перчатки, универсальный спрей, средство для плиты, губка, микрофибра, салфетки для стекла, веник/пылесос, швабра.",
        "Столешницы: убрать лишнее, пройтись универсальным средством, протереть сухой микрофиброй.",
        "Плита: снять решётки/конфорки, нанести средство, протереть; убрать пятна вокруг.",
        "Раковина: сполоснуть, мягким абразивом/содой почистить чашу и кран, вытереть насухо.",
        "Фартук/стены у плиты: обезжирить и протереть.",
        "Техника снаружи: протереть холодильник, микроволновку, духовку.",
        "Стол/стулья: протереть сверху и под кромкой.",
        "Пол: подмести/пропылесосить, протереть шваброй от дальнего угла к выходу."
      ]
    },
    {
      title:"Ванная",
      steps:[
        "Инвентарь: перчатки, средство от известкового налёта, средство для стекла, ершик, салфетки из микрофибры.",
        "Зеркало: спрей для стёкол, протереть насухо.",
        "Раковина/кран: нанести средство от налёта, пройтись губкой, сполоснуть, вытереть.",
        "Смесители/душ: удалить известковый налёт, протереть насухо.",
        "Унитаз: залить средство под ободок, пройтись ершиком, протереть крышку/сиденье снаружи.",
        "Поверхности/полки: снять лишнее, протереть влажной, затем сухой салфеткой.",
        "Пол: пропылесосить и вымыть, уделяя внимание углам и за санузлом."
      ]
    },
    {
      title:"Прихожая",
      steps:[
        "Инвентарь: веник/пылесос, швабра, салфетки для пыли.",
        "Обувница/полки: разобрать, протереть пыль, привести в порядок.",
        "Зеркало/дверь: протереть стекло и ручки.",
        "Коврик: вытряхнуть или пропылесосить.",
        "Пол: собрать мусор у порога, вымыть."
      ]
    },
    {
      title:"Гостиная",
      steps:[
        "Инвентарь: салфетки для пыли, насадка-пылесос, швабра.",
        "Поверхности: протереть пыль сверху вниз (полки, тумбы, подоконники).",
        "Техника: аккуратно протереть экран/панели сухой салфеткой.",
        "Текстиль: встряхнуть плед/подушки.",
        "Пол: пропылесосить, затем вымыть."
      ]
    },
    {
      title:"Лоджия",
      steps:[
        "Инвентарь: веник/пылесос, швабра, салфетки.",
        "Подоконники/парапет: убрать пыль, вытереть насухо.",
        "Поверхности: протереть от пыли и паутины.",
        "Пол: подмести, вымыть."
      ]
    },
    {
      title:"Балкон",
      steps:[
        "Инвентарь: веник, совок, влажные салфетки.",
        "Собрать мусор и листья.",
        "Перила/подоконник: протереть влажной салфеткой.",
        "Пол: подмести, при необходимости вымыть."
      ]
    }
  ];
  function renderCleaning(){
    const acc = $("#accordion"); acc.innerHTML="";
    CLEAN_SECTIONS.forEach((sec, idx)=>{
      const item = document.createElement("div"); item.className="acc-item";
      const h = document.createElement("button"); h.className="acc-header"; h.type="button"; h.textContent = sec.title;
      const c = document.createElement("div"); c.className="acc-content";
      const ul = document.createElement("ul");
      sec.steps.forEach(s=>{ const li=document.createElement("li"); li.textContent=s; ul.appendChild(li); });
      c.appendChild(ul);
      h.addEventListener("click", ()=>{
        item.classList.toggle("open");
      });
      if (idx===0) item.classList.add("open");
      item.append(h,c); acc.appendChild(item);
    });
  }

  // --- Notification badge ---
  function updateBadge(){
    let count = 0;
    // daily mine (today)
    count += readDaily().filter(x=> x.assignee===user.name && !x.done).length;
    // mustdo overdue (Славик)
    if (user.name==="Славик"){
      count += readMustdo().filter(x=> !x.done && new Date(x.dateISO) <= new Date(iso())).length;
    }
    // meds today (Ника)
    if (user.name==="Никося"){
      count += readMeds().filter(x=> !x.taken).length;
    }
    const badge = $("#badge");
    if (count>0){
      badge.textContent = String(count);
      badge.classList.remove("hidden");
      badge.setAttribute("aria-hidden","false");
    } else {
      badge.classList.add("hidden");
      badge.setAttribute("aria-hidden","true");
    }
  }
  $("#bell").addEventListener("click", ()=> showSection("daily"));

  // --- Init ---
  ensureWeeklyReset();
  renderCleaning(); // prepare once
  updateHomeView();
  renderDaily();
  if (user.name==="Славик") renderMustdo();
  if (user.name==="Никося") renderMeds();
  renderExpenses();
  renderBudget();
  renderGifts();
  updateBadge();

  // expose for manual navigation (optional)
  window.DomApp = { showSection };

})();
