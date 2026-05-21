/* eslint-disable */
// LIFEOS — sample data: categories + time blocks + goals/context
// Modeled after the user's reference screenshots (May 2026).

const CATEGORIES = [
  {
    id: 'business',
    name: 'BUSINESS',
    nameRu: 'Бизнес',
    tagline: 'Стратегия, рост, главные ставки проекта АПОЛЛОН.',
    description:
      'Главное направление профессиональной жизни. Здесь живут стратегические сессии (ГВЦ), переговоры, ключевые решения и планирование квартала.',
    swatch: 'var(--c-business)',
    swatchVar: '--c-business',
    icon: 'briefcase',
    goals: [
      { id: 'g1', title: 'Закрыть раунд Series A', due: 'Q3 · 2026', progress: 62, owner: '4 milestones' },
      { id: 'g2', title: 'Запустить АПОЛЛОН v2', due: 'Авг 2026', progress: 38, owner: '12 tasks' },
      { id: 'g3', title: 'Команда продукта · 8 чел.', due: 'Дек 2026', progress: 75, owner: '6/8 нанято' },
    ],
    notes:
      'Главная Великая Цель проекта АПОЛЛОН — стоит выше остальных равных Целей. Достижение ВГЦ приводит к Великому Видению. Без колебаний — в бой, с фокусом, приближая ГВЦ ещё ближе.',
    links: [
      { id: 'l1', title: 'Roadmap АПОЛЛОН Q2', meta: 'Notion · 14 страниц' },
      { id: 'l2', title: 'Финансовая модель', meta: 'Sheets · обновлено вчера' },
      { id: 'l3', title: 'Pitch deck v7', meta: 'Figma · 28 слайдов' },
      { id: 'l4', title: 'Investor outreach', meta: 'Airtable' },
    ],
    history: [3, 5, 4, 7, 6, 5, 8, 6, 9, 7, 8, 6],
  },
  {
    id: 'health',
    name: 'Health',
    nameRu: 'Здоровье',
    tagline: 'SPARTA, дисциплина тела, восстановление.',
    description:
      'Тренировки, восстановление, телесная практика. SPARTA — ежедневный 2-часовой блок. Agoge, FULL LEONID, PHITIDIA — суб-программы.',
    swatch: 'var(--c-health)',
    swatchVar: '--c-health',
    icon: 'spark',
    goals: [
      { id: 'h1', title: 'Marathon · sub-3:30', due: 'Окт 2026', progress: 41, owner: 'нед. 12/24' },
      { id: 'h2', title: 'Жим лёжа 120 кг', due: 'Авг 2026', progress: 78, owner: 'тек. 105' },
      { id: 'h3', title: 'Растяжка Монаха · 60 дней', due: 'Стрик', progress: 53, owner: '32/60' },
    ],
    notes:
      'SPARTA — основной режим. 7 дней в неделю по 2 часа. FULL LEONID — full body вторая половина дня. PHITIDIA — вечерняя короткая сессия. Sundays — Hiking.',
    links: [
      { id: 'hl1', title: 'Программа SPARTA · цикл 4', meta: 'PDF · 36 страниц' },
      { id: 'hl2', title: 'Дневник восстановления', meta: 'Apple Health' },
      { id: 'hl3', title: 'Питание · протокол', meta: 'Notes' },
      { id: 'hl4', title: 'Тренер · контакт', meta: 'Whatsapp' },
    ],
    history: [8, 7, 8, 9, 7, 8, 9, 9, 8, 9, 9, 8],
  },
  {
    id: 'learning',
    name: 'Learning',
    nameRu: 'Учёба',
    tagline: 'Чтение, языки, мастерство ремесла.',
    description:
      'Книги, курсы, иностранные языки. Ежедневный блок «Чтение» — обязательный. Architecture — изучение архитектурных принципов.',
    swatch: 'var(--c-learning)',
    swatchVar: '--c-learning',
    icon: 'book',
    goals: [
      { id: 'le1', title: '24 книги за 2026 год', due: 'Дек 2026', progress: 58, owner: '14 / 24' },
      { id: 'le2', title: 'Архитектура · курс MIT', due: 'Июл 2026', progress: 33, owner: '4 / 12 модулей' },
    ],
    notes:
      'Чтение — каждый день 60 минут перед сном. Текущая книга — Дезигн оф эвридей зингс, Norman. Архитектурный курс по понедельникам и средам.',
    links: [
      { id: 'lel1', title: 'Reading list 2026', meta: 'Goodreads' },
      { id: 'lel2', title: 'MIT Architecture · Lecture 4', meta: 'Видео · 1:24' },
      { id: 'lel3', title: 'Конспекты чтения', meta: 'Obsidian · 142 заметки' },
    ],
    history: [4, 5, 6, 5, 6, 7, 6, 7, 7, 8, 7, 7],
  },
  {
    id: 'creative',
    name: 'Creative',
    nameRu: 'Творчество',
    tagline: 'Музыка Аполлон, Equitation, проект жизни.',
    description:
      'Творческие практики. Музыкальное приложение АПОЛЛО — проект года. Equitation — конная подготовка. Дневник.',
    swatch: 'var(--c-creative)',
    swatchVar: '--c-creative',
    icon: 'note',
    goals: [
      { id: 'c1', title: 'Приложение АПОЛЛО · MVP', due: 'Сен 2026', progress: 47, owner: '8 / 17 экранов' },
      { id: 'c2', title: 'Equitation · Level 2', due: 'Q4 2026', progress: 28, owner: 'нач. курс' },
      { id: 'c3', title: 'Дневник · 365 дней подряд', due: 'Стрик', progress: 87, owner: '317 / 365' },
    ],
    notes:
      'Музыка Аполло — приложение для медитативной музыки. Цель — MVP к сентябрю. Equitation — каждый четверг и воскресенье.',
    links: [
      { id: 'cl1', title: 'Аполло · Figma', meta: '54 экрана' },
      { id: 'cl2', title: 'Equitation school', meta: 'maps · 12 km' },
      { id: 'cl3', title: 'Дневник 2026', meta: 'Day One · 317 записей' },
    ],
    history: [3, 4, 4, 5, 4, 5, 6, 6, 5, 6, 7, 6],
  },
  {
    id: 'family',
    name: 'Family',
    nameRu: 'Семья',
    tagline: 'Marsik · Love Budget · близкие.',
    description:
      'Семья и близкие отношения. Marsik Date — еженедельный субботний блок. Love Budget — совместное финансовое планирование.',
    swatch: 'var(--c-family)',
    swatchVar: '--c-family',
    icon: 'heart',
    goals: [
      { id: 'f1', title: 'Marsik Date · еженедельно', due: 'Стрик', progress: 92, owner: '24 / 26' },
      { id: 'f2', title: 'Семейная поездка', due: 'Авг 2026', progress: 22, owner: 'план' },
    ],
    notes:
      'Marsik Date — суббота 15:30, неприкосновенный блок. Love Budget — раз в две недели по средам, обсуждение совместных целей и финансов.',
    links: [
      { id: 'fl1', title: 'Семейный бюджет 2026', meta: 'Notion' },
      { id: 'fl2', title: 'Идеи для свиданий', meta: '42 идеи' },
      { id: 'fl3', title: 'Поездка · Италия', meta: 'Pinterest' },
    ],
    history: [2, 3, 3, 2, 3, 3, 3, 3, 3, 3, 3, 3],
  },
  {
    id: 'work',
    name: 'Work',
    nameRu: 'Работа',
    tagline: 'Hiking, активный отдых, природа.',
    description:
      'Активный отдых и природа. Hiking — субботние выходы. Восстановление после рабочей недели.',
    swatch: 'var(--c-work)',
    swatchVar: '--c-work',
    icon: 'tree',
    goals: [
      { id: 'w1', title: '12 hiking trails за год', due: 'Дек 2026', progress: 50, owner: '6 / 12' },
    ],
    notes:
      'Hiking — каждую субботу с 09:00. Ротация маршрутов. Зимой — короткие маршруты, летом — полные дни.',
    links: [
      { id: 'wl1', title: 'Маршруты 2026', meta: 'Maps · 12 пинов' },
      { id: 'wl2', title: 'Снаряжение · чек-лист', meta: 'Notes' },
    ],
    history: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  },
  {
    id: 'finance',
    name: 'Finance',
    nameRu: 'Финансы',
    tagline: 'SOA, отчётность, капитал.',
    description:
      'Финансовая дисциплина. SOA — еженедельный обзор счетов. Личные финансы, инвестиции, ежемесячный обзор.',
    swatch: 'var(--c-finance)',
    swatchVar: '--c-finance',
    icon: 'coin',
    goals: [
      { id: 'fi1', title: 'Подушка · 12 мес. расходов', due: 'Дек 2026', progress: 64, owner: '7.7 / 12' },
      { id: 'fi2', title: 'Инвест портфель ребаланс', due: 'Квартально', progress: 100, owner: 'Q1 ✓' },
    ],
    notes:
      'SOA (State of Affairs) — еженедельный обзор по пятницам. Ребалансировка портфеля каждый квартал. Контроль расходов через 4 категории.',
    links: [
      { id: 'fil1', title: 'SOA Q2 2026', meta: 'Sheets' },
      { id: 'fil2', title: 'Investment thesis', meta: 'Notion' },
    ],
    history: [2, 2, 2, 2, 3, 2, 2, 3, 2, 3, 2, 3],
  },
];

const CAT_BY_ID = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

// Block template: time-block can have a "subname" (the actual badge label like "SPARTA")
// We model the week May 18-24, 2026. Today is Wed May 20.
//
// Format: { id, day (0-6 mon-sun), start (h), end (h), title, sub?, cat, allDay?, recur?, notes?, checklist?, location? }

const WEEK_BLOCKS = [
  // ============ MON 18 ============
  { id: 'b1',  day: 0, start: 7,    end: 9,    title: 'SPARTA',     cat: 'health', recur: true, notes: 'Утренний 2-часовой блок. Базовая программа цикла 4.', checklist: ['Разминка 15 мин','Силовой 60 мин','Кардио 30 мин','Растяжка'] },
  { id: 'b2',  day: 0, start: 9.2,  end: 9.7,  title: 'Agoge',      cat: 'health', recur: true, sub: 'sub-program' },
  { id: 'b3',  day: 0, start: 9.7,  end: 10.5, title: 'FULL LEONID',cat: 'health', recur: true, sub: 'sub-program' },
  { id: 'b4',  day: 0, start: 10.5, end: 13,   title: 'ГВЦ',        cat: 'business', recur: true, notes: 'Главная Великая Цель — работа над проектом АПОЛЛОН. Полное погружение и фокус.', checklist: ['Roadmap review','Investor email','Tech architecture','Product strategy'] },
  { id: 'b5',  day: 0, start: 13.5, end: 14.5, title: 'Чтение',     cat: 'learning', recur: true },
  { id: 'b6',  day: 0, start: 14.5, end: 15.5, title: 'FULL LEONID',cat: 'health' },
  { id: 'b7',  day: 0, start: 15.5, end: 16.5, title: 'ГВЦ',        cat: 'business' },
  { id: 'b8',  day: 0, start: 16.5, end: 17.5, title: 'PHITIDIA',   cat: 'health', recur: true },
  { id: 'b9',  day: 0, start: 17.5, end: 18.5, title: 'Дневник',    cat: 'creative', recur: true, notes: 'Ежедневная запись.' },
  { id: 'b10', day: 0, start: 19,   end: 20,   title: 'Цветы',      cat: 'family' },
  { id: 'b11', day: 0, start: 20,   end: 21,   title: 'Agoge',      cat: 'health' },

  // ============ TUE 19 ============
  { id: 'c1', day: 1, start: 7,    end: 9,    title: 'SPARTA',      cat: 'health', recur: true },
  { id: 'c2', day: 1, start: 9.16, end: 9.5,  title: 'Agoge',       cat: 'health', recur: true },
  { id: 'c3', day: 1, start: 9.5,  end: 11,   title: 'FULL LEONID', cat: 'health', recur: true },
  { id: 'c4', day: 1, start: 11,   end: 14,   title: 'ГВЦ',         cat: 'business', recur: true },
  { id: 'c5', day: 1, start: 14,   end: 15,   title: 'FULL LEONID', cat: 'health' },
  { id: 'c6', day: 1, start: 15,   end: 16,   title: 'PHITIDIA',    cat: 'health' },
  { id: 'c7', day: 1, start: 16.5, end: 17.5, title: 'Дневник',     cat: 'creative' },
  { id: 'c8', day: 1, start: 17.5, end: 18.5, title: 'Чтение',      cat: 'learning' },
  { id: 'c9', day: 1, start: 19,   end: 20,   title: 'Agoge',       cat: 'health' },

  // ============ WED 20 (TODAY) ============
  { id: 'd1', day: 2, start: 7,    end: 9,    title: 'SPARTA',      cat: 'health', recur: true,
    notes: 'Утренний блок SPARTA — основа дня. Программа: верх тела + кардио. Цикл 4, неделя 2.\n\nДисциплина превыше всего. Без исключений. Tempo: agressive.',
    checklist: ['Разминка', 'Жим лёжа · 5×5 @ 100kg', 'Тяга · 5×5 @ 110kg', 'Кардио · 30 мин zone 2', 'Растяжка · 15 мин'],
    location: 'Дом · спортзал' },
  { id: 'd2', day: 2, start: 9.16, end: 9.5,  title: 'Agoge',       cat: 'health', recur: true },
  { id: 'd3', day: 2, start: 9.5,  end: 10,   title: 'FULL LEONID', cat: 'health' },
  { id: 'd4', day: 2, start: 10,   end: 15,   title: 'ГВЦ',         cat: 'business', recur: true,
    notes: 'Работа над Главной Великой Целью проекта АПОЛЛОН. Ни минуты не колеблясь, рвёшься в бой, с полным погружением и фокусом, приближая ГВЦ ещё ближе. Главная Великая Цель — это Цель, стоящая выше других равных Целей проекта Аполлон, достижение которых приводит к Великому Видению.',
    checklist: ['Архитектура v2 · review','Roadmap Q3','Investor outreach · 5 emails','Product strategy doc','Команда · 1:1 ×3'],
    location: 'Офис · АПОЛЛОН HQ' },
  { id: 'd5', day: 2, start: 10,   end: 11,   title: 'Love Budget', cat: 'family',
    notes: 'Совместный обзор бюджета и целей с партнёром.',
    checklist: ['Доходы за 2 недели','Расходы по категориям','Цели на месяц','Совместные проекты'] },
  { id: 'd6', day: 2, start: 13.7, end: 14.2, title: 'FULL LEONID', cat: 'health' },
  { id: 'd7', day: 2, start: 16,   end: 17,   title: 'Equitation',  cat: 'creative',
    notes: 'Урок верховой езды. Level 2 · 4 из 12.',
    location: 'Equitation school · 12 km' },
  { id: 'd8', day: 2, start: 17,   end: 18,   title: 'Стратегическое обсуждение', cat: 'business' },
  { id: 'd9', day: 2, start: 18,   end: 19,   title: 'PHITIDIA',    cat: 'health' },
  { id: 'd10',day: 2, start: 19,   end: 20,   title: 'Приложение АПОЛЛО', cat: 'creative',
    notes: 'Работа над приложением. Сегодня — экраны онбординга.',
    checklist: ['Onboarding 1/3','Onboarding 2/3','Onboarding 3/3','Превью в Figma'] },
  { id: 'd11',day: 2, start: 20,   end: 21,   title: 'Чтение',      cat: 'learning', recur: true,
    notes: 'Текущая книга — The Design of Everyday Things, Norman.',
    checklist: ['Глава 4','Заметки в Obsidian'] },
  { id: 'd12',day: 2, start: 21,   end: 22,   title: 'Agoge',       cat: 'health' },

  // ============ THU 21 ============
  { id: 'e1', day: 3, start: 7,    end: 9,    title: 'SPARTA',      cat: 'health', recur: true },
  { id: 'e2', day: 3, start: 9.16, end: 9.83, title: 'Растяжка',    cat: 'health', recur: true, sub: 'дополнительно' },
  { id: 'e3', day: 3, start: 9.83, end: 10.5, title: 'Agoge',       cat: 'health' },
  { id: 'e4', day: 3, start: 10.5, end: 13.5, title: 'FULL LEONID', cat: 'health', recur: true },
  { id: 'e5', day: 3, start: 14,   end: 16,   title: 'Архитектура', cat: 'learning', notes: 'MIT Architecture · Lecture 5' },
  { id: 'e6', day: 3, start: 16,   end: 18,   title: 'Marsik Date', cat: 'family' },
  { id: 'e7', day: 3, start: 18,   end: 19,   title: 'PHITIDIA',    cat: 'health' },
  { id: 'e8', day: 3, start: 19,   end: 20,   title: 'Чтение',      cat: 'learning' },
  { id: 'e9', day: 3, start: 20,   end: 21,   title: 'Agoge',       cat: 'health' },

  // ============ FRI 22 ============
  { id: 'f1', day: 4, start: 7,    end: 9,    title: 'SPARTA',      cat: 'health', recur: true },
  { id: 'f2', day: 4, start: 9.16, end: 9.7,  title: 'Растяжка',    cat: 'health' },
  { id: 'f3', day: 4, start: 9.7,  end: 10.5, title: 'Agoge',       cat: 'health' },
  { id: 'f4', day: 4, start: 10.5, end: 13,   title: 'FULL LEONID', cat: 'health', recur: true },
  { id: 'f5', day: 4, start: 13.5, end: 15,   title: 'ГВЦ',         cat: 'business' },
  { id: 'f6', day: 4, start: 15,   end: 16,   title: 'FULL LEONID', cat: 'health' },
  { id: 'f7', day: 4, start: 16,   end: 17,   title: 'SOA',         cat: 'finance', notes: 'Еженедельный обзор финансов.', checklist: ['Счета · обзор','Расходы по категориям','Сбережения · % от дохода','SOA таблица'] },
  { id: 'f8', day: 4, start: 17,   end: 18,   title: 'PHITIDIA',    cat: 'health' },
  { id: 'f9', day: 4, start: 18,   end: 19,   title: 'Дневник',     cat: 'creative' },
  { id: 'f10',day: 4, start: 19,   end: 20,   title: 'Чтение',      cat: 'learning' },
  { id: 'f11',day: 4, start: 20,   end: 21,   title: 'Agoge',       cat: 'health' },

  // ============ SAT 23 ============
  { id: 'g1', day: 5, start: 9,    end: 12,   title: 'Hiking',      cat: 'work', notes: 'Маршрут · Бутаковский водопад. 12 км туда-обратно.', checklist: ['Снаряжение','Вода 2 л','Перекус','Камера'] },
  { id: 'g2', day: 5, start: 12,   end: 13,   title: 'Растяжка Монаха', cat: 'health' },
  { id: 'g3', day: 5, start: 13.5, end: 15,   title: 'FULL LEONID', cat: 'health' },
  { id: 'g4', day: 5, start: 16,   end: 17.5, title: 'Музыка Аполло', cat: 'creative', notes: 'Запись новых треков. Сессия 8.' },
  { id: 'g5', day: 5, start: 18,   end: 19,   title: 'PHITIDIA',    cat: 'health' },
  { id: 'g6', day: 5, start: 19,   end: 20,   title: 'Дневник',     cat: 'creative' },
  { id: 'g7', day: 5, start: 20,   end: 21,   title: 'Чтение',      cat: 'learning' },

  // ============ SUN 24 ============
  { id: 'h1', day: 6, start: 13.5, end: 15,   title: 'FULL LEONID', cat: 'health' },
  { id: 'h2', day: 6, start: 15.5, end: 17,   title: 'Marsik Date', cat: 'family', notes: 'Еженедельный субботний блок. Неприкосновенный.' },
  { id: 'h3', day: 6, start: 18,   end: 19,   title: 'PHITIDIA',    cat: 'health' },
];

// All-day items (reminders, tasks without time)
const ALL_DAY = [
  { id: 'ad1', day: 2, title: 'Позвонить маме',         cat: 'family',  type: 'reminder' },
  { id: 'ad2', day: 2, title: 'Растяжка Монаха · 32/60', cat: 'health',  type: 'task' },
  { id: 'ad3', day: 4, title: 'SOA · подготовить',       cat: 'finance', type: 'task' },
];

// Tints per category — derived from --c-* (L C H) on the fly:
// background = oklch(L% C H / 0.45)
// edge      = oklch(L% C H / 0.65)
// bar       = oklch( (L-25)% (C+0.10) H )  // strong stripe
// ink       = oklch( 28% C H )             // text on tint (dark)

function tintStyle(catId) {
  // catId is the React-side id: business, health, learning, creative, family, work, finance
  // Each maps to a CSS palette block --c-{catId}, --c-{catId}-bar, --c-{catId}-ink defined in styles.css
  return {
    '--tint':      `var(--c-${catId})`,
    '--tint-edge': `var(--c-${catId}-bar)`,
    '--tint-bar':  `var(--c-${catId}-bar)`,
    '--tint-ink':  `var(--c-${catId}-ink)`,
  };
}

// Each --c-* in CSS is an "L% C H" triplet (NOT a full color).
// We compose oklch() colors via these custom-property strings in CSS,
// so to build derived strong/ink vars we set them as separate triplets here.
// Done in app boot — see app.jsx setDerivedSwatches().

window.LIFEOS_DATA = { CATEGORIES, CAT_BY_ID, WEEK_BLOCKS, ALL_DAY, tintStyle };
