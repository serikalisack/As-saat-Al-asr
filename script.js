"use strict";

// Basic DOM helpers
function $(id) {
  return document.getElementById(id);
}

function safeNumber(value) {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

// ==================== TRANSLATION STATE ====================

let currentLang = "en";
let translations = null;

function getStoredLanguage() {
  try {
    const stored = localStorage.getItem("language") || "en";
    if (stored === "en" || stored === "ar" || stored === "sw") return stored;
  } catch {
    // ignore
  }
  return "en";
}

async function loadTranslations(lang) {
  try {
    const res = await fetch(`translations/${lang}.json`, { cache: "no-store" });
    translations = await res.json();
  } catch (e) {
    console.error("Error loading translations for", lang, e);
    translations = null;
  }
}

function syncLanguageSelects() {
  const top = $("language-select-top");
  const inSettings = $("language-select");
  if (top) top.value = currentLang;
  if (inSettings) inSettings.value = currentLang;
}

function applyTranslations() {
  if (!translations) return;
  const t = translations;

  // Document direction
  document.documentElement.lang = currentLang;
  document.documentElement.dir = currentLang === "ar" ? "rtl" : "ltr";

  // Side menu header & buttons
  const menuTitle = $("side-menu-title");
  if (menuTitle) menuTitle.textContent = t.menu?.menu || "Menu";

  const btnSettings = $("btn-settings");
  if (btnSettings) btnSettings.firstChild.nodeValue = (t.menu?.settings || "Settings") + " ";

  const btnAbout = $("btn-about");
  if (btnAbout) btnAbout.firstChild.nodeValue = (t.menu?.about || "About") + " ";

  const btnContact = $("btn-contact");
  if (btnContact) btnContact.firstChild.nodeValue = (t.menu?.contact || "Contact") + " ";

  const qaTitle = $("side-menu-quick-title");
  if (qaTitle) qaTitle.textContent = t.app?.loading ? qaTitle.textContent : qaTitle.textContent;

  const btnEnable = $("btn-enable-notifications");
  if (btnEnable && t.actions?.enable_notifications) {
    btnEnable.firstChild.nodeValue = t.actions.enable_notifications + " ";
  }
  const btnRefresh = $("btn-refresh-data");
  if (btnRefresh && t.actions?.refresh_data) {
    btnRefresh.firstChild.nodeValue = t.actions.refresh_data + " ";
  }

  // Main section titles
  const inspTitle = document.querySelector("section:nth-of-type(1) > h3");
  if (inspTitle && t.sections?.islamic_inspiration) {
    inspTitle.textContent = t.sections.islamic_inspiration;
  }
  const eventsTitle = document.querySelector("#upcoming-events-section > h3");
  if (eventsTitle && t.sections?.islamic_events) {
    eventsTitle.textContent = t.sections.islamic_events;
  }
  

  // Zakat section title
  const zakatTitle = document.querySelector("section:nth-of-type(3) > h3");
  if (zakatTitle && t.sections?.zakat_calculator) {
    zakatTitle.textContent = t.sections.zakat_calculator;
  }

  // Zakat labels
  const labelGold = document.querySelector('label[for="gold-value"]');
  if (labelGold && t.zakat?.gold_grams) labelGold.textContent = t.zakat.gold_grams + ":";
  const labelSilver = document.querySelector('label[for="silver-value"]');
  if (labelSilver && t.zakat?.silver_grams) labelSilver.textContent = t.zakat.silver_grams + ":";

  // Settings modal header and tabs
  const settingsHeader = document.querySelector("#settings-modal .modal-header h2");
  if (settingsHeader && t.menu?.settings) settingsHeader.textContent = t.menu.settings;

  const tabs = document.querySelectorAll(".settings-tabs .tab-btn");
  if (tabs.length >= 5 && t.settings) {
    tabs[0].textContent = t.settings.display_settings || tabs[0].textContent;
    tabs[1].textContent = t.settings.prayer_settings || tabs[1].textContent;
    tabs[2].textContent = t.settings.notification_settings || tabs[2].textContent;
    tabs[3].textContent = t.settings.sound_settings || tabs[3].textContent;
    tabs[4].textContent = t.settings.location_settings || tabs[4].textContent;
  }
}

async function setLanguage(lang) {
  currentLang = lang;
  try {
    localStorage.setItem("language", lang);
  } catch {
    // ignore
  }
  syncLanguageSelects();
  await loadTranslations(lang);
  applyTranslations();
  loadDailyInspiration();
}

function getHijriAdjustmentDays() {
  try {
    const raw = localStorage.getItem("hijriAdjustmentDays");
    const n = parseInt(raw ?? "0", 10);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

let hijriTodayCache = null;

function formatYmd(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDmy(date) {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
}

async function loadHijriForTodayIfNeeded(now) {
  const hijriEl = $("hijri-date");
  if (!hijriEl) return;

  const key = `hijriCache:${formatYmd(now)}`;
  try {
    const cached = localStorage.getItem(key);
    if (cached) {
      hijriTodayCache = JSON.parse(cached);
      if (hijriTodayCache?.text) hijriEl.textContent = hijriTodayCache.text;
      return;
    }
  } catch {
    // ignore cache issues
  }

  const adj = getHijriAdjustmentDays();
  try {
    const resp = await fetch(
      `https://api.aladhan.com/v1/gToH?date=${encodeURIComponent(
        formatDmy(now),
      )}&adjustment=${encodeURIComponent(String(adj))}`,
      { cache: "no-store" },
    );
    const data = await resp.json();
    const hijri = data?.data?.hijri;
    if (hijri?.day && hijri?.month?.en && hijri?.year) {
      const text = `${hijri.day} ${hijri.month.en} ${hijri.year} AH`;
      hijriTodayCache = { text };
      hijriEl.textContent = text;
      try {
        localStorage.setItem(key, JSON.stringify(hijriTodayCache));
      } catch {
        // ignore storage quota
      }
    }
  } catch {
    // Network failed; keep local fallbacks.
  }
}

// ==================== CLOCK & DATES ====================

function updateClockAndDates() {
  const now = new Date();
  const clockEl = $("clock");
  const dateEl = $("date");
  const hijriEl = $("hijri-date");

  if (!clockEl || !dateEl || !hijriEl) return;

  const is24h = $("toggle-12-24")?.checked;
  const timeOptions = {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: !is24h,
  };
  clockEl.textContent = now.toLocaleTimeString(undefined, timeOptions);

  dateEl.textContent = now.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Prefer cached / API-based conversion (most reliable across implementations).
  // We trigger it asynchronously; meanwhile show a local fallback immediately.
  if (hijriTodayCache?.text) {
    hijriEl.textContent = hijriTodayCache.text;
  } else if (typeof HijriDate !== "undefined") {
    try {
      const h = new HijriDate(now);
      const monthName = typeof h.getMonthName === "function" ? h.getMonthName() : "";
      hijriEl.textContent = `${h.getDate()} ${monthName} ${h.getFullYear()} AH`.trim();
    } catch {
      hijriEl.textContent = fallbackHijriDate(now);
    }
  } else if (typeof moment === "function" && moment.prototype.iYear) {
    const adj = getHijriAdjustmentDays();
    const m = moment(now).add(adj, "days");
    hijriEl.textContent = m.format("iD iMMMM iYYYY [AH]");
  } else {
    hijriEl.textContent = fallbackHijriDate(now);
  }

  // Load a corrected Hijri date in background (once/day via cache key).
  // Fire-and-forget; safe to call on the 1s tick.
  void loadHijriForTodayIfNeeded(now);
}

function fallbackHijriDate(date) {
  const gregorianDate = new Date(date);
  const year = gregorianDate.getFullYear();
  const month = gregorianDate.getMonth() + 1;
  const day = gregorianDate.getDate();

  const yearsSince622 = year - 622;
  const hijriYear = Math.floor((yearsSince622 * 365.2425) / 354.367) + 1;

  const dayOfYear =
    Math.floor(
      (new Date(year, month - 1, day) - new Date(year, 0, 1)) /
        (1000 * 60 * 60 * 24),
    ) + 1;
  const hijriDayOfYear = Math.floor((dayOfYear * 354.367) / 365.2425);

  const monthLengths = [30, 29, 30, 29, 30, 29, 30, 29, 30, 29, 30, 29];
  let hijriMonth = 1;
  let remainingDays = hijriDayOfYear;

  for (let i = 0; i < monthLengths.length; i += 1) {
    if (remainingDays <= monthLengths[i]) {
      hijriMonth = i + 1;
      break;
    }
    remainingDays -= monthLengths[i];
  }

  const hijriDay = remainingDays;

  const monthNames = [
    "Muharram",
    "Safar",
    "Rabi al-Awwal",
    "Rabi al-Thani",
    "Jumada al-Ula",
    "Jumada al-Thani",
    "Rajab",
    "Shaban",
    "Ramadan",
    "Shawwal",
    "Dhu al-Qidah",
    "Dhu al-Hijjah",
  ];

  return `${hijriDay} ${monthNames[hijriMonth - 1]} ${hijriYear} AH`;
}

// ==================== INSPIRATION ====================

const VERSES = [
  "“Indeed, in the remembrance of Allah do hearts find rest.” (Qur'an 13:28)",
  "“So remember Me; I will remember you.” (Qur'an 2:152)",
  "“And whoever relies upon Allah – then He is sufficient for him.” (Qur'an 65:3)",
];

const HADITHS = [
  "“The best of you are those who are best to their families.” (Tirmidhi)",
  "“Actions are judged by intentions.” (Bukhari & Muslim)",
  "“A Muslim is the one from whose tongue and hand the people are safe.” (Nasa'i)",
];

const DUA_LINES = [
  "اللّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ",
  "رَبِّ اجْعَلْنِي مُقِيمَ الصَّلَاةِ وَمِنْ ذُرِّيَّتِي",
  "رَبِّ اغْفِرْ لِي وَلِوَالِدَيَّ وَلِلْمُؤْمِنِينَ",
  "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
];

const DUA_TRANSLATIONS = {
  en: [
    "O Allah, help me to remember You, to thank You, and to worship You in the best manner.",
    "My Lord, make me an establisher of prayer, and [many] from my descendants.",
    "My Lord, forgive me, my parents, and the believers.",
    "Our Lord, grant us good in this world and good in the Hereafter and protect us from the punishment of the Fire.",
  ],
  sw: [
    "Ee Mola, nisaidie nikukumbuke, nikushukuru na kukuabudu kwa njia iliyo bora.",
    "Mola wangu, nifanye niwe msimamishaji wa swala, na katika kizazi changu pia.",
    "Mola wangu, nisamehe mimi, wazazi wangu na waumini wote.",
    "Mola wetu, tupe kheri ya dunia na kheri ya Akhera na utulinde na adhabu ya Moto.",
  ],
};

function loadDailyInspiration() {
  const verseEl = $("verse-of-day");
  const hadithEl = $("hadith-of-day");
  const duaEl = $("dua-line");
  if (!verseEl || !hadithEl) return;

  const today = new Date();
  const index =
    (today.getFullYear() * 1000 + today.getMonth() * 50 + today.getDate()) %
    VERSES.length;
  const hadithIndex =
    (today.getFullYear() * 2000 +
      today.getMonth() * 75 +
      today.getDate()) %
    HADITHS.length;

  verseEl.textContent = VERSES[index];
  hadithEl.textContent = HADITHS[hadithIndex];

  if (duaEl && DUA_LINES.length > 0) {
    const lang = currentLang || "en";
    const duaIndex =
      (today.getFullYear() * 3000 +
        today.getMonth() * 33 +
        today.getDate()) %
      DUA_LINES.length;
    const arabic = DUA_LINES[duaIndex];
    const translation =
      DUA_TRANSLATIONS[lang] && DUA_TRANSLATIONS[lang][duaIndex]
        ? DUA_TRANSLATIONS[lang][duaIndex]
        : null;

    if (lang === "ar" || !translation) {
      duaEl.textContent = arabic;
      duaEl.dir = "rtl";
      duaEl.lang = "ar";
    } else {
      duaEl.innerHTML = `<span dir="rtl" lang="ar">${arabic}</span><br><span style="font-size: 0.9em; color: var(--text-secondary);">${translation}</span>`;
      duaEl.dir = "";
      duaEl.lang = "";
    }
  }
}

// ==================== EID DATES ====================

function initEidDates() {
  const eidContainer = $("eid-dates-content");
  if (!eidContainer || typeof loadEidDates !== "function") return;
  loadEidDates({ eidDates: eidContainer });
}

// ==================== RAMADAN TIMERS (HIJRI-BASED) ====================

function initRamadanSection() {
  const countdownEl = $("ramadan-countdown");
  const sehriTimeEl = $("sehri-time");
  const iftarTimeEl = $("iftar-time");
  const ramadanDayEl = $("ramadan-day");

  if (!countdownEl || !sehriTimeEl || !iftarTimeEl || !ramadanDayEl) return;

  // NOTE: We only show calendar-based Ramadan status here.
  // Actual fasting times depend on location/prayer calculations (handled elsewhere).
  function getRamadanWindow() {
    const adj = getHijriAdjustmentDays();
    if (typeof moment === "function" && moment.prototype.iYear) {
      const nowAdj = moment().add(adj, "days");
      const hYear = nowAdj.iYear();

      // Ramadan: 1 Ramadan (iMonth 8) to 1 Shawwal (iMonth 9)
      const startThis = moment()
        .iYear(hYear)
        .iMonth(8)
        .iDate(1)
        .add(adj, "days")
        .startOf("day");
      const endThis = moment()
        .iYear(hYear)
        .iMonth(9)
        .iDate(1)
        .add(adj, "days")
        .startOf("day");

      if (nowAdj.isBefore(startThis)) {
        return { start: startThis, end: endThis, hYear };
      }

      if (nowAdj.isSameOrAfter(endThis)) {
        const startNext = moment()
          .iYear(hYear + 1)
          .iMonth(8)
          .iDate(1)
          .add(adj, "days")
          .startOf("day");
        const endNext = moment()
          .iYear(hYear + 1)
          .iMonth(9)
          .iDate(1)
          .add(adj, "days")
          .startOf("day");
        return { start: startNext, end: endNext, hYear: hYear + 1 };
      }

      return { start: startThis, end: endThis, hYear };
    }

    return null;
  }

  function updateRamadan() {
    const window = getRamadanWindow();
    if (!window) {
      countdownEl.textContent = "Ramadan dates unavailable (missing Hijri converter).";
      ramadanDayEl.textContent = "";
      sehriTimeEl.textContent = "";
      iftarTimeEl.textContent = "";
      return;
    }

    const now = moment();
    const start = window.start;
    const end = window.end;

    if (now.isBefore(start)) {
      const days = start.diff(now, "days") + 1;
      countdownEl.textContent = `${days} day(s) until Ramadan (estimated)`;
      ramadanDayEl.textContent = `Expected start: ${start.format("dddd, MMMM D, YYYY")}`;
    } else if (now.isSameOrAfter(end)) {
      countdownEl.textContent = "Ramadan has ended (estimated)";
      ramadanDayEl.textContent = `Ended: ${end.clone().subtract(1, "day").format("dddd, MMMM D, YYYY")}`;
    } else {
      const dayOfRamadan = now.startOf("day").diff(start, "days") + 1;
      countdownEl.textContent = "We are in Ramadan (estimated)";
      ramadanDayEl.textContent = `Ramadan Day ${dayOfRamadan}`;
    }

    // Placeholder: these are not computed here.
    sehriTimeEl.textContent = "See Fajr time";
    iftarTimeEl.textContent = "See Maghrib time";
  }

  updateRamadan();
  setInterval(updateRamadan, 60 * 1000);
}

// ==================== ZAKAT CALCULATOR ====================

function updateMarketPrices() {
  $("gold-price-display").textContent = `1g = $${safeNumber(
    $("gold-price")?.value,
  ).toFixed(2)}`;
  $("silver-price-display").textContent = `1g = $${safeNumber(
    $("silver-price")?.value,
  ).toFixed(2)}`;
  $("platinum-price-display").textContent = `1g = $${safeNumber(
    $("platinum-price")?.value,
  ).toFixed(2)}`;
  $("palladium-price-display").textContent = `1g = $${safeNumber(
    $("palladium-price")?.value,
  ).toFixed(2)}`;
  $("diamond-price-display").textContent = `1ct = $${safeNumber(
    $("diamond-price")?.value,
  ).toFixed(2)}`;
}

function calculateZakat() {
  const goldGrams = safeNumber($("gold-value")?.value);
  const silverGrams = safeNumber($("silver-value")?.value);
  const platinumGrams = safeNumber($("platinum-value")?.value);
  const palladiumGrams = safeNumber($("palladium-value")?.value);
  const diamondCarats = safeNumber($("diamond-value")?.value);
  const otherMinerals = safeNumber($("other-minerals")?.value);
  const cash = safeNumber($("cash-value")?.value);
  const investments = safeNumber($("investments-value")?.value);

  const goldPrice = safeNumber($("gold-price")?.value);
  const silverPrice = safeNumber($("silver-price")?.value);
  const platinumPrice = safeNumber($("platinum-price")?.value);
  const palladiumPrice = safeNumber($("palladium-price")?.value);
  const diamondPrice = safeNumber($("diamond-price")?.value);

  const baseGold = goldGrams * goldPrice;
  const baseSilver = silverGrams * silverPrice;
  const basePlatinum = platinumGrams * platinumPrice;
  const basePalladium = palladiumGrams * palladiumPrice;
  const baseDiamonds = diamondCarats * diamondPrice;

  const totalWealth =
    baseGold +
    baseSilver +
    basePlatinum +
    basePalladium +
    baseDiamonds +
    otherMinerals +
    cash +
    investments;

  const zakatDue = totalWealth * 0.025;

  const resultContainer = $("zakat-result");
  if (!resultContainer) return;

  resultContainer.style.display = "block";

  $("total-wealth").textContent = `$${totalWealth.toFixed(2)}`;
  $("zakat-due").textContent = `$${zakatDue.toFixed(2)}`;

  const breakdown = [];
  if (baseGold) breakdown.push(`Gold: $${baseGold.toFixed(2)}`);
  if (baseSilver) breakdown.push(`Silver: $${baseSilver.toFixed(2)}`);
  if (basePlatinum) breakdown.push(`Platinum: $${basePlatinum.toFixed(2)}`);
  if (basePalladium) breakdown.push(`Palladium: $${basePalladium.toFixed(2)}`);
  if (baseDiamonds) breakdown.push(`Diamonds: $${baseDiamonds.toFixed(2)}`);
  if (otherMinerals) breakdown.push(`Other minerals: $${otherMinerals.toFixed(2)}`);
  if (cash) breakdown.push(`Cash savings: $${cash.toFixed(2)}`);
  if (investments) breakdown.push(`Investments: $${investments.toFixed(2)}`);

  $("breakdown-details").innerHTML =
    breakdown.length > 0 ? breakdown.join("<br>") : "No assets entered.";

  const currency = $("currency-select")?.value || "USD";
  const rate = safeNumber($("exchange-rate")?.value) || 1;

  const converted = zakatDue * rate;
  $("conversion-details").textContent = `${currency} ${converted.toFixed(
    2,
  )} (based on rate ${rate})`;

  $("zakat-note").textContent =
    "Zakat calculation here is a general guideline. Please consult a qualified scholar for detailed rulings.";
}

// ==================== MENU & MODALS ====================

function toggleMenu() {
  const menu = $("side-menu");
  const overlay = $("menu-overlay");
  const hamburger = $("hamburger");
  if (!menu || !overlay || !hamburger) return;

  const isOpen = menu.style.right === "0px";
  if (isOpen) {
    menu.style.right = "-350px";
    overlay.style.opacity = "0";
    overlay.style.display = "none";
    hamburger.classList.remove("open");
  } else {
    menu.style.right = "0";
    overlay.style.display = "block";
    requestAnimationFrame(() => {
      overlay.style.opacity = "1";
    });
    hamburger.classList.add("open");
  }
}

function showSection(section) {
  const main = $("side-menu-main");
  const detail = $("side-menu-detail");
  const titleEl = $("side-menu-title");
  const closeBtn = $("side-menu-close-btn");
  if (!main || !detail || !titleEl || !closeBtn) return;

  const templates = (window._sideMenuTemplates =
    window._sideMenuTemplates ||
    {
      settings:
        document.querySelector("#settings-modal .modal-body")?.innerHTML || "",
      about:
        document.querySelector("#about-modal .modal-body")?.innerHTML || "",
      contact:
        document.querySelector("#contact-modal .modal-body")?.innerHTML || "",
    });

  main.style.display = "none";
  detail.style.display = "block";

  let title = "Menu";
  if (section === "settings") title = translations?.menu?.settings || "Settings";
  else if (section === "about") title = translations?.menu?.about || "About";
  else if (section === "contact")
    title = translations?.menu?.contact || "Contact";

  titleEl.textContent = title;
  closeBtn.textContent = "←";
  closeBtn.onclick = () => {
    detail.innerHTML = "";
    titleEl.textContent = translations?.menu?.menu || "Menu";
    closeBtn.textContent = "✕";
    closeBtn.onclick = toggleMenu;
    main.style.display = "block";
    detail.style.display = "none";
  };

  detail.innerHTML = templates[section] || "";
}

function openModal(name) {
  const modal = $(name + "-modal");
  if (!modal) return;
  modal.style.display = "block";
}

function closeModal(name) {
  const modal = $(name + "-modal");
  if (!modal) return;
  modal.style.display = "none";
}

function showSettingsTab(tabId) {
  const tabs = document.querySelectorAll(".tab-content");
  tabs.forEach((tab) => {
    tab.classList.remove("active");
  });
  const buttons = document.querySelectorAll(".tab-btn");
  buttons.forEach((btn) => {
    if (btn.dataset.tab === tabId) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
  const target = $(tabId + "-tab");
  if (target) target.classList.add("active");
}

function requestNotificationPermission() {
  if (!("Notification" in window)) {
    alert("This browser does not support notifications.");
    return;
  }
  if (Notification.permission === "granted") {
    alert("Notifications are already enabled.");
    return;
  }
  Notification.requestPermission().then((permission) => {
    if (permission === "granted") {
      alert("Notifications enabled.");
    } else {
      alert("Notifications permission denied.");
    }
  });
}

// ==================== THEME ====================

function initThemeToggle() {
  const themeToggle = $("toggle-theme");
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (!themeToggle) return;

  const storedTheme = localStorage.getItem("theme") || "light";
  if (storedTheme === "dark") {
    document.body.classList.add("dark-theme");
    themeToggle.checked = true;
    if (metaTheme) metaTheme.setAttribute("content", "#020617");
  }

  themeToggle.addEventListener("change", () => {
    if (themeToggle.checked) {
      document.body.classList.add("dark-theme");
      localStorage.setItem("theme", "dark");
      if (metaTheme) metaTheme.setAttribute("content", "#020617");
    } else {
      document.body.classList.remove("dark-theme");
      localStorage.setItem("theme", "light");
      if (metaTheme) metaTheme.setAttribute("content", "#1e40af");
    }
  });
}

// ==================== INITIALISATION ====================

document.addEventListener("DOMContentLoaded", () => {
  const splash = $("splash-screen");
  // Keep splash for a brief moment while initialisation runs
  const hideSplash = () => {
    if (!splash) return;
    splash.style.opacity = "0";
    splash.style.visibility = "hidden";
    setTimeout(() => {
      if (splash && splash.parentNode) {
        splash.parentNode.removeChild(splash);
      }
    }, 600);
  };

  currentLang = getStoredLanguage();
  syncLanguageSelects();

  updateClockAndDates();
  setInterval(updateClockAndDates, 1000);

  const toggle24 = $("toggle-12-24");
  if (toggle24) {
    toggle24.addEventListener("change", updateClockAndDates);
  }

  initThemeToggle();
  initEidDates();
  initRamadanSection();
  updateMarketPrices();

  const volumeSlider = $("volume-slider");
  const volumeDisplay = $("volume-display");
  if (volumeSlider && volumeDisplay) {
    volumeSlider.addEventListener("input", () => {
      volumeDisplay.textContent = `${volumeSlider.value}%`;
    });
  }

  const langTop = $("language-select-top");
  const langInSettings = $("language-select");
  const onLangChange = (e) => {
    const lang = e.target.value || "en";
    setLanguage(lang);
  };
  if (langTop) langTop.addEventListener("change", onLangChange);
  if (langInSettings) langInSettings.addEventListener("change", onLangChange);

  // Load translations then inspiration, then hide splash (a bit slower for a premium feel)
  setLanguage(currentLang).finally(() => {
    loadDailyInspiration();
    setTimeout(hideSplash, 1400);
  });
});

