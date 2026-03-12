"use strict";

const STORAGE_KEY = "islamicAppPrefs";
const KAABA_LAT = 21.4225;
const KAABA_LON = 39.8262;

// Language Manager
class LanguageManager {
  constructor() {
    this.currentLanguage = localStorage.getItem('language') || 'en';
    this.translations = {};
    this.loadTranslations();
  }

  async loadTranslations() {
    try {
      // For local development, handle both file:// and http:// protocols
      let response;
      if (window.location.protocol === 'file:') {
        // For file:// protocol, create a simple fallback
        this.translations = this.getFallbackTranslations();
      } else {
        response = await fetch(`translations/${this.currentLanguage}.json`);
        this.translations = await response.json();
      }
      this.applyTranslations();
      this.setDirection();
    } catch (error) {
      console.error('Failed to load translations:', error);
      // Fallback to English if translation fails
      if (this.currentLanguage !== 'en') {
        this.currentLanguage = 'en';
        this.loadTranslations();
      }
    }
  }

  getFallbackTranslations() {
    // Fallback translations embedded in JavaScript for file:// protocol
    const translations = {
      'en': {
        "app": { "title": "As-saat | Al-asr" },
        "header": { "title": "As-saat | Al-asr" },
        "menu": { "menu": "Menu", "settings": "Settings", "about": "About", "contact": "Contact" },
        "sections": {
          "islamic_inspiration": "Islamic Inspiration",
          "ramadan_2025": "Ramadan 2025", 
          "zakat_calculator": "Zakat Calculator",
          "prayer_times": "Prayer Times",
          "qibla_direction": "Qibla Direction",
          "monthly_timetable": "Monthly Timetable"
        },
        "settings": {
          "display_settings": "Display Settings",
          "prayer_settings": "Prayer Settings",
          "notification_settings": "Notification Settings",
          "sound_settings": "Sound Settings",
          "location_settings": "Location Settings"
        }
      },
      'ar': {
        "app": { "title": "الساعة الإسلامية الذكية" },
        "header": { "title": "الساعة الإسلامية الذكية" },
        "menu": { "menu": "القائمة", "settings": "الإعدادات", "about": "حول", "contact": "اتصل" },
        "sections": {
          "islamic_inspiration": "الإلهام الإسلامي",
          "ramadan_2025": "رمضان 2025",
          "zakat_calculator": "حاسبة الزكاة", 
          "prayer_times": "أوقات الصلاة",
          "qibla_direction": "اتجاه القبلة",
          "monthly_timetable": "الجدول الشهري"
        },
        "settings": {
          "display_settings": "إعدادات العرض",
          "prayer_settings": "إعدادات الصلاة",
          "notification_settings": "إعدادات الإشعارات",
          "sound_settings": "إعدادات الصوت",
          "location_settings": "إعدادات الموقع"
        }
      },
      'sw': {
        "app": { "title": "As-saat | Al-asr" },
        "header": { "title": "As-saat | Al-asr<br><small style='font-size: 0.6em; opacity: 0.8;'>The Islamic Watch</small>" },
        "menu": { "menu": "Menyu", "settings": "Mipangilio", "about": "Kuhusu", "contact": "Mawasiliano" },
        "sections": {
          "islamic_inspiration": "Hamasa ya Imaan",
          "ramadan_2025": "Ramadan 2025",
          "zakat_calculator": "Kikokotoo cha Zakat",
          "prayer_times": "Nyakati za Swala", 
          "qibla_direction": "Mwelekeo wa Qibla",
          "monthly_timetable": "Ratiba ya Kila Mwezi"
        },
        "settings": {
          "display_settings": "Mipangilio ya Muonekano",
          "prayer_settings": "Mipangilio ya Swala",
          "notification_settings": "Mipangilio ya Arifa",
          "sound_settings": "Mipangilio ya Sauti",
          "location_settings": "Mipangilio ya Mahali"
        }
      }
    };
    
    return translations[this.currentLanguage] || translations['en'];
  }

  async changeLanguage(lang) {
    this.currentLanguage = lang;
    localStorage.setItem('language', lang);
    await this.loadTranslations();
  }

  setDirection() {
    const isRTL = this.currentLanguage === 'ar';
    document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', this.currentLanguage);
  }

  t(key) {
    const keys = key.split('.');
    let value = this.translations;
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value || key;
  }

  applyTranslations() {
    console.log('Applying translations for:', this.currentLanguage);
    
    // Update page title
    document.title = this.t('app.title');
    
    // Header title
    const headerTitle = document.querySelector('h1 span');
    if (headerTitle) {
      headerTitle.innerHTML = this.t('header.title');
    }
    
    // Menu title
    const menuTitle = document.querySelector('#side-menu h2');
    if (menuTitle) {
      menuTitle.textContent = this.t('menu.menu');
    }
    
    // Section titles
    const sectionTitles = document.querySelectorAll('main section h3');
    const sectionKeys = ['islamic_inspiration', 'ramadan_2025', 'zakat_calculator', 'prayer_times', 'qibla_direction', 'monthly_timetable'];
    
    sectionTitles.forEach((title, index) => {
      if (sectionKeys[index]) {
        title.textContent = this.t('sections.' + sectionKeys[index]);
      }
    });
    
    // Settings modal
    const settingsTitle = document.querySelector('#settings-modal h2');
    if (settingsTitle) {
      settingsTitle.textContent = this.t('menu.settings');
    }
    
    // Settings tabs
    const settingsTabs = document.querySelectorAll('.tab-btn');
    const tabTranslations = ['settings.display_settings', 'settings.prayer_settings', 'settings.notification_settings', 'settings.sound_settings', 'settings.location_settings'];
    
    settingsTabs.forEach((tab, index) => {
      if (tabTranslations[index]) {
        tab.textContent = this.t(tabTranslations[index]);
      }
    });
    
    // Settings content
    const displaySettingsTitle = document.querySelector('#display-tab h3');
    if (displaySettingsTitle) {
      displaySettingsTitle.textContent = this.t('settings.display_settings');
    }
    
    // About modal
    const aboutTitle = document.querySelector('#about-modal h2');
    if (aboutTitle) {
      aboutTitle.textContent = this.t('about.about');
    }
    
    // Contact modal
    const contactTitle = document.querySelector('#contact-modal h2');
    if (contactTitle) {
      contactTitle.textContent = this.t('contact.contact');
    }
    
    console.log('Translations applied successfully');
  }

  updateText(elementId, translationKey) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = this.t(translationKey);
    }
  }

  updatePrayerNames() {
    const prayerNames = {
      'fajr': this.t('prayers.fajr'),
      'sunrise': this.t('prayers.sunrise'),
      'dhuhr': this.t('prayers.dhuhr'),
      'asr': this.t('prayers.asr'),
      'maghrib': this.t('prayers.maghrib'),
      'isha': this.t('prayers.isha')
    };
    
    // Update prayer time displays
    Object.keys(prayerNames).forEach(prayer => {
      const elements = document.querySelectorAll(`[data-prayer="${prayer}"]`);
      elements.forEach(el => {
        el.textContent = prayerNames[prayer];
      });
    });
  }

  updateZakatLabels() {
    const labels = {
      'gold-value': this.t('zakat.gold_grams'),
      'silver-value': this.t('zakat.silver_grams'),
      'platinum-value': this.t('zakat.platinum_grams'),
      'palladium-value': this.t('zakat.palladium_grams'),
      'diamond-value': this.t('zakat.diamond_carats'),
      'other-minerals': this.t('zakat.other_minerals'),
      'cash-value': this.t('zakat.cash_savings'),
      'investments-value': this.t('zakat.investments'),
      'calculate-zakat': this.t('zakat.calculate_zakat')
    };
    
    Object.keys(labels).forEach(id => {
      const label = document.querySelector(`label[for="${id}"]`);
      if (label) {
        label.textContent = labels[id];
      }
    });
  }

  updateAboutContent() {
    const aboutTitle = document.querySelector('#about-modal h3');
    if (aboutTitle) aboutTitle.textContent = this.t('about.about');
    
    const aboutDesc = document.querySelector('#about-modal p:nth-of-type(2)');
    if (aboutDesc) aboutDesc.textContent = this.t('about.description');
  }

  updateContactContent() {
    const contactTitle = document.querySelector('#contact-modal h3');
    if (contactTitle) contactTitle.textContent = this.t('contact.contact');
    
    const contactDesc = document.querySelector('#contact-modal p:nth-of-type(2)');
    if (contactDesc) contactDesc.textContent = this.t('contact.we_value_feedback');
  }
}

// Initialize language manager
const languageManager = new LanguageManager();

document.addEventListener("DOMContentLoaded", init);

function init() {
  const elements = {
    clock: document.getElementById("clock"),
    date: document.getElementById("date"),
    hijri: document.getElementById("hijri-date"),
    greeting: document.getElementById("greeting"),
    prayerTimes: document.getElementById("prayer-times"),
    monthly: document.getElementById("monthly-table"),
    needle: document.getElementById("needle"),
    audio: document.getElementById("adhan-audio"),
    toggle24: document.getElementById("toggle-12-24"),
    toggleGreg: document.getElementById("toggle-gregorian"),
    toggleHijri: document.getElementById("toggle-hijri"),
    toggleTheme: document.getElementById("toggle-theme"),
    toggleAdhan: document.getElementById("toggle-adhan"),
    citySelect: document.getElementById("city-select"),
    themeMeta: document.getElementById("theme-meta"),
    qiblaAngle: document.getElementById("qibla-angle"),
    verseOfDay: document.getElementById("verse-of-day"),
    hadithOfDay: document.getElementById("hadith-of-day"),
    calculationMethod: document.getElementById("calculation-method"),
    madhab: document.getElementById("madhab"),
    nextPrayer: document.getElementById("next-prayer"),
    compassRose: document.getElementById("compass-rose"),
    deviceHeading: document.getElementById("device-heading"),
    compassStatus: document.getElementById("compass-status"),
    ramadanSection: document.getElementById("ramadan-section"),
    ramadanCountdown: document.getElementById("ramadan-countdown"),
    ramadanDay: document.getElementById("ramadan-day"),
    sehriTime: document.getElementById("sehri-time"),
    sehriCountdown: document.getElementById("sehri-countdown"),
    iftarTime: document.getElementById("iftar-time"),
    iftarCountdown: document.getElementById("iftar-countdown"),
    togglePrayerReminders: document.getElementById("toggle-prayer-reminders"),
    toggleZakatReminder: document.getElementById("toggle-zakat-reminder"),
    toggleRamadanNotifications: document.getElementById("toggle-ramadan-notifications"),
    toggleFridayReminder: document.getElementById("toggle-friday-reminder"),
    toggleIslamicEvents: document.getElementById("toggle-islamic-events"),
    toggleMasterSound: document.getElementById("toggle-master-sound"),
    toggleAdhanSound: document.getElementById("toggle-adhan-sound"),
    toggleNotificationSound: document.getElementById("toggle-notification-sound"),
    volumeSlider: document.getElementById("volume-slider"),
    volumeDisplay: document.getElementById("volume-display")
  };

  let state = loadPrefs();
  applyPrefs(elements, state);
  attachEvents(elements, state);

  startClock(elements, state);
  updateDate(elements);
  loadIslamicContent(elements);
  initRamadanFeatures(elements);

  initLocation(elements, state);
  initServiceWorker();
  requestNotificationPermission();
}

/* ==================== CLOCK ==================== */
function startClock(el, state) {
  updateClock(el, state);
  setInterval(() => updateClock(el, state), 1000);
}

function updateClock(el, state) {
  const now = new Date();
  let hours = state.is24 ? now.getHours() : ((now.getHours() % 12) || 12);
  let minutes = String(now.getMinutes()).padStart(2, "0");
  let seconds = String(now.getSeconds()).padStart(2, "0");
  let ampm = now.getHours() >= 12 ? "PM" : "AM";

  el.clock.textContent = state.is24
    ? `${hours}:${minutes}:${seconds}`
    : `${hours}:${minutes}:${seconds} ${ampm}`;

  el.greeting.textContent = getGreeting(now.getHours());
}

/* ==================== DATE ==================== */
function updateDate(el) {
  const now = new Date();

  el.date.textContent = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(now);

  el.hijri.textContent = new Intl.DateTimeFormat("en-TZ-u-ca-islamic", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(now);
}

/* ==================== QIBLA ==================== */
function calculateQibla(lat, lon) {
  const toRad = d => d * Math.PI / 180;
  const toDeg = r => r * 180 / Math.PI;

  const φ1 = toRad(lat);
  const φ2 = toRad(KAABA_LAT);
  const Δλ = toRad(KAABA_LON - lon);

  const y = Math.sin(Δλ);
  const x = Math.cos(φ1) * Math.tan(φ2) - Math.sin(φ1) * Math.cos(Δλ);

  let θ = Math.atan2(y, x);
  θ = (toDeg(θ) + 360) % 360;

  return θ;
}

function initQiblaCompass(qiblaBearing, el) {
  // Add compass rose with degree markings
  if (el.compassRose) {
    el.compassRose.innerHTML = `
      <div class="compass-degree n">N</div>
      <div class="compass-degree ne">45°</div>
      <div class="compass-degree e">E</div>
      <div class="compass-degree se">135°</div>
      <div class="compass-degree s">S</div>
      <div class="compass-degree sw">225°</div>
      <div class="compass-degree w">W</div>
      <div class="compass-degree nw">315°</div>
    `;
  }

  // Initialize compass state
  window.qiblaState = {
    qiblaBearing: qiblaBearing,
    currentHeading: 0,
    lastHeading: null,      // null signals first reading
    isSupported: false,
    isActive: false
  };

  // Update Qibla angle display
  if (el.qiblaAngle) {
    el.qiblaAngle.textContent = `Qibla Direction: ${qiblaBearing.toFixed(1)}° ${getCardinalDirection(qiblaBearing)}`;
  }

  // Start compass initialization
  initializeCompass(el);
}

function initializeCompass(el) {
  updateCompassStatus(el, 'Initializing compass...', 'info');

  if (!window.DeviceOrientationEvent) {
    updateCompassStatus(el, 'Device orientation not supported', 'error');
    return;
  }

  // iOS 13+ permission flow
  if (typeof DeviceOrientationEvent.requestPermission === 'function') {
    const permissionBtn = document.createElement('button');
    permissionBtn.textContent = 'Enable Compass';
    permissionBtn.style.cssText = `
      background: var(--primary-color);
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      margin: 1rem auto;
      display: block;
      font-size: 1rem;
    `;

    permissionBtn.addEventListener('click', async () => {
      try {
        updateCompassStatus(el, 'Requesting permission...', 'info');
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission === 'granted') {
          startCompassTracking(el);
          permissionBtn.remove();
        } else {
          updateCompassStatus(el, 'Permission denied', 'error');
        }
      } catch (error) {
        console.error('Error requesting device orientation permission:', error);
        updateCompassStatus(el, 'Permission request failed', 'error');
      }
    });

    const compassContainer = document.getElementById('compass-container');
    if (compassContainer) {
      compassContainer.insertBefore(permissionBtn, compassContainer.firstChild);
    }
  } else {
    // No permission needed, start tracking immediately
    startCompassTracking(el);
  }
}

function startCompassTracking(el) {
  window.qiblaState.isSupported = true;
  window.qiblaState.isActive = true;
  updateCompassStatus(el, 'Compass active - rotate your device', 'success');

  // Remove any existing listeners to avoid duplicates
  window.removeEventListener("deviceorientationabsolute", handleOrientation);
  window.removeEventListener("deviceorientation", handleOrientation);

  // Prefer absolute orientation (true north) if available
  window.addEventListener("deviceorientationabsolute", handleOrientation);
  // Fallback to regular deviceorientation
  window.addEventListener("deviceorientation", handleOrientation);

  console.log('Compass tracking started');
}

// Unified orientation handler (works for both Android and iOS)
function handleOrientation(event) {
  const state = window.qiblaState;
  if (!state || !state.isActive) return;

  let heading = null;

  // iOS provides webkitCompassHeading (true north)
  if (event.webkitCompassHeading !== undefined) {
    heading = event.webkitCompassHeading;
  }
  // Android / standard: alpha is the rotation around z-axis
  else if (event.alpha !== null) {
    // Convert to compass heading: 0° = North
    heading = 360 - event.alpha;
  }

  if (heading === null || isNaN(heading)) return;

  // Normalise to 0–360
  heading = ((heading % 360) + 360) % 360;

  // Smooth the reading
  const smoothed = smoothHeading(heading, state.lastHeading);
  state.currentHeading = smoothed;
  state.lastHeading = smoothed;

  // Update the UI at the next paint to avoid layout thrashing
  requestAnimationFrame(() => {
    updateCompassNeedle(state.qiblaBearing, smoothed);
    updateCompassInfo(smoothed);
  });
}

// Improved smoothing with proper wrap-around handling
function smoothHeading(current, last, factor = 0.2) {
  if (last === null) return current; // first reading

  let diff = current - last;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;

  return last + diff * factor;
}

function updateCompassNeedle(qiblaBearing, deviceHeading) {
  const needle = document.getElementById('needle');
  if (!needle) return;

  // Needle should point to Qibla relative to device orientation
  const rotation = qiblaBearing - deviceHeading;
  needle.style.transform = `translateX(-50%) rotate(${rotation}deg)`;
}

function updateCompassInfo(heading) {
  const deviceHeadingEl = document.getElementById('device-heading');
  if (deviceHeadingEl) {
    deviceHeadingEl.textContent = `Current Heading: ${heading.toFixed(1)}° ${getCardinalDirection(heading)}`;
  }
}

function updateCompassStatus(el, message, type = 'info') {
  if (el.compassStatus) {
    el.compassStatus.textContent = message;
    el.compassStatus.style.color =
      type === 'error' ? 'var(--accent-color)' :
      type === 'success' ? 'var(--secondary-color)' : 'var(--primary-color)';
  }
  console.log('Compass status:', message, type);
}

function getCardinalDirection(degrees) {
  const normalized = ((degrees % 360) + 360) % 360;
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(normalized / 45) % 8;
  return directions[index];
}

/* ==================== LOCATION (with watch) ==================== */
function initLocation(el, state) {
  if (state.city) {
    fetchPrayerByCity(el, state, state.city);
    return;
  }

  // Get initial position and start watching
  navigator.geolocation.getCurrentPosition(
    pos => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;

      const qibla = calculateQibla(lat, lon);
      initQiblaCompass(qibla, el);

      fetchPrayerByCoords(el, state, lat, lon);
      watchLocation(el, state); // start watching for moves
    },
    error => {
      console.warn('Geolocation error:', error);
      updateCompassStatus(el, 'Location unavailable', 'error');
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
}

// Watch user's position and recalculate Qibla if they move significantly
function watchLocation(el, state) {
  if (!navigator.geolocation) return;

  let lastLat = null, lastLon = null;

  navigator.geolocation.watchPosition(
    pos => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;

      // On first run, just store coordinates
      if (lastLat === null || lastLon === null) {
        lastLat = lat;
        lastLon = lon;
        return;
      }

      // If moved more than ~1 km, recalculate Qibla
      const distance = getDistanceFromLatLonInKm(lastLat, lastLon, lat, lon);
      if (distance >= 1.0) {
        console.log(`Moved ${distance.toFixed(2)} km, recalculating Qibla`);
        const newQibla = calculateQibla(lat, lon);
        window.qiblaState.qiblaBearing = newQibla;

        if (el.qiblaAngle) {
          el.qiblaAngle.textContent = `Qibla Direction: ${newQibla.toFixed(1)}° ${getCardinalDirection(newQibla)}`;
        }

        // Update needle immediately with current heading
        updateCompassNeedle(newQibla, window.qiblaState.currentHeading);

        lastLat = lat;
        lastLon = lon;
      }
    },
    error => console.warn('Location watch error:', error),
    {
      enableHighAccuracy: true,
      maximumAge: 30000,
      timeout: 27000
    }
  );
}

// Haversine formula to calculate distance between two coordinates (in km)
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/* ==================== PRAYER API ==================== */
async function fetchPrayerByCoords(el, state, lat, lon) {
  try {
    let method = state.method || 2;
    let madhab = state.madhab || 0;
    let res = await fetch(
      `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=${method}&madhab=${madhab}`
    );
    let data = await res.json();
    window.todayTimings = data.data.timings;
    renderPrayer(el, data.data.timings);
    updateNextPrayer(el, data.data.timings);
  } catch (error) {
    console.error('Error fetching prayer times:', error);
    if (el.prayerTimes) {
      el.prayerTimes.innerHTML = '<div style="color: var(--accent-color);">Unable to fetch prayer times. Please check your connection.</div>';
    }
  }
}

async function fetchPrayerByCity(el, state, city) {
  try {
    let method = state.method || 2;
    let madhab = state.madhab || 0;
    let res = await fetch(
      `https://api.aladhan.com/v1/timingsByCity?city=${city}&country=Tanzania&method=${method}&madhab=${madhab}`
    );
    let data = await res.json();
    window.todayTimings = data.data.timings;
    renderPrayer(el, data.data.timings);
    updateNextPrayer(el, data.data.timings);
    fetchMonthly(city, el);
  } catch (error) {
    console.error('Error fetching prayer times:', error);
    if (el.prayerTimes) {
      el.prayerTimes.innerHTML = '<div style="color: var(--accent-color);">Unable to fetch prayer times. Please check your connection.</div>';
    }
  }
}

function renderPrayer(el, t) {
  const prayers = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
  el.prayerTimes.innerHTML = prayers
    .map(p => {
      let isCurrent = isCurrentPrayerTime(t[p]);
      let className = isCurrent ? 'current-prayer' : '';
      return `<div class="${className}">${p}: ${t[p]}</div>`;
    })
    .join("");

  setInterval(() => checkAdhan(el), 60000);
  setInterval(() => updateNextPrayer(el, t), 60000);
}

function isCurrentPrayerTime(prayerTime) {
  let now = new Date().toTimeString().slice(0, 5);
  return prayerTime === now;
}

function updateNextPrayer(el, timings) {
  if (!timings || !el.nextPrayer) return;

  const now = new Date();
  const prayers = [
    { name: "Fajr", time: timings.Fajr },
    { name: "Dhuhr", time: timings.Dhuhr },
    { name: "Asr", time: timings.Asr },
    { name: "Maghrib", time: timings.Maghrib },
    { name: "Isha", time: timings.Isha }
  ];

  let nextPrayer = null;
  let minDiff = Infinity;

  prayers.forEach(prayer => {
    let prayerDate = new Date();
    let [hours, minutes] = prayer.time.split(':');
    prayerDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    if (prayerDate < now) {
      prayerDate.setDate(prayerDate.getDate() + 1);
    }

    let diff = prayerDate - now;
    if (diff < minDiff) {
      minDiff = diff;
      nextPrayer = prayer;
    }
  });

  if (nextPrayer) {
    let hours = Math.floor(minDiff / (1000 * 60 * 60));
    let minutes = Math.floor((minDiff % (1000 * 60 * 60)) / (1000 * 60));
    let timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    el.nextPrayer.textContent = `Next prayer: ${nextPrayer.name} in ${timeStr}`;
  }
}

/* ==================== MONTHLY ==================== */
async function fetchMonthly(city, el) {
  const today = new Date();
  let m = today.getMonth() + 1;
  let y = today.getFullYear();
  const state = loadPrefs();
  let method = state.method || 2;

  let res = await fetch(
    `https://api.aladhan.com/v1/calendarByCity?city=${city}&country=Tanzania&month=${m}&year=${y}&method=${method}`
  );
  let data = await res.json();

  el.monthly.innerHTML = data.data
    .map(d => `
      <div>${d.date.gregorian.day} - Fajr ${d.timings.Fajr} | Maghrib ${d.timings.Maghrib}</div>
    `)
    .join("");
}

/* ==================== ADHAN ==================== */
function checkAdhan(el) {
  if (!window.todayTimings) return;

  const state = loadPrefs();
  let now = new Date();
  let current = now.toTimeString().slice(0, 5);
  
  ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"].forEach(p => {
    if (window.todayTimings[p] === current) {
      // Check if Adhan notifications are enabled
      if (state.adhanNotifications !== false) {
        // Play Adhan sound if enabled
        if (state.masterSound !== false && state.adhanSound !== false) {
          el.audio.play();
        }
        
        // Show notification if permission granted
        if (Notification.permission === "granted") {
          new Notification(" Adhan Time", { 
            body: p + " prayer has started",
            icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23228B22'><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z'/></svg>"
          });
        }
        
        // Check for prayer reminders
        if (state.prayerReminders !== false) {
          setTimeout(() => {
            if (Notification.permission === "granted") {
              new Notification(" Prayer Reminder", { 
                body: "Don't forget to pray " + p + " on time",
                icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%234169E1'><path d='M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'/></svg>"
              });
            }
          }, 5 * 60 * 1000); // 5 minutes later
        }
      }
    }
  });
  
  // Check for Friday Jumu'ah reminder
  if (now.getDay() === 5 && state.fridayReminder !== false) { // Friday is day 5
    const dhuhrTime = window.todayTimings.Dhuhr;
    if (dhuhrTime) {
      const [hours, minutes] = dhuhrTime.split(':');
      const dhuhrDate = new Date();
      dhuhrDate.setHours(parseInt(hours), parseInt(minutes) - 30, 0, 0); // 30 minutes before Dhuhr
      
      const timeDiff = dhuhrDate - now;
      if (timeDiff > 0 && timeDiff <= 60000) { // Within 1 minute of reminder time
        if (Notification.permission === "granted") {
          new Notification(" Friday Jumu'ah", { 
            body: "Jumu'ah prayer is in 30 minutes. Prepare for congregation.",
            icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23FFD700'><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z'/></svg>"
          });
        }
      }
    }
  }
}

/* ==================== THEME + STORAGE ==================== */
function applyPrefs(el, state) {
  el.toggle24.checked = state.is24;
  el.toggleTheme.checked = state.dark;
  el.calculationMethod.value = state.method || 2;
  el.madhab.value = state.madhab || 0;
  document.body.classList.toggle("dark", state.dark);
  
  // Apply notification settings
  el.toggleAdhan.checked = state.adhanNotifications !== false;
  el.togglePrayerReminders.checked = state.prayerReminders !== false;
  el.toggleZakatReminder.checked = state.zakatReminder !== false;
  el.toggleRamadanNotifications.checked = state.ramadanNotifications !== false;
  el.toggleFridayReminder.checked = state.fridayReminder !== false;
  el.toggleIslamicEvents.checked = state.islamicEvents !== false;
  
  // Apply sound settings
  el.toggleMasterSound.checked = state.masterSound !== false;
  el.toggleAdhanSound.checked = state.adhanSound !== false;
  el.toggleNotificationSound.checked = state.notificationSound !== false;
  el.volumeSlider.value = state.volume || 70;
  el.volumeDisplay.textContent = (state.volume || 70) + '%';
  
  // Set audio volume
  if (el.audio) {
    el.audio.volume = (state.volume || 70) / 100;
  }
}

function attachEvents(el, state) {
  el.toggle24.addEventListener("change", e => {
    state.is24 = e.target.checked;
    savePrefs(state);
  });

  el.toggleTheme.addEventListener("change", e => {
    state.dark = e.target.checked;
    document.body.classList.toggle("dark", state.dark);
    savePrefs(state);
  });

  el.calculationMethod.addEventListener("change", e => {
    state.method = parseInt(e.target.value);
    savePrefs(state);
    location.reload();
  });

  el.madhab.addEventListener("change", e => {
    state.madhab = parseInt(e.target.value);
    savePrefs(state);
    location.reload();
  });

  el.citySelect.addEventListener("change", e => {
    state.city = e.target.value || null;
    savePrefs(state);
    location.reload();
  });

  // Language selector event listener
  const languageSelect = document.getElementById('language-select');
  if (languageSelect) {
    languageSelect.addEventListener('change', async e => {
      await languageManager.changeLanguage(e.target.value);
      location.reload();
    });
    
    // Set current language in selector
    languageSelect.value = languageManager.currentLanguage;
  }

  // Notification toggle events
  el.toggleAdhan.addEventListener("change", e => {
    state.adhanNotifications = e.target.checked;
    savePrefs(state);
  });

  el.togglePrayerReminders.addEventListener("change", e => {
    state.prayerReminders = e.target.checked;
    savePrefs(state);
  });

  el.toggleZakatReminder.addEventListener("change", e => {
    state.zakatReminder = e.target.checked;
    savePrefs(state);
  });

  el.toggleRamadanNotifications.addEventListener("change", e => {
    state.ramadanNotifications = e.target.checked;
    savePrefs(state);
  });

  el.toggleFridayReminder.addEventListener("change", e => {
    state.fridayReminder = e.target.checked;
    savePrefs(state);
  });

  el.toggleIslamicEvents.addEventListener("change", e => {
    state.islamicEvents = e.target.checked;
    savePrefs(state);
  });

  // Sound toggle events
  el.toggleMasterSound.addEventListener("change", e => {
    state.masterSound = e.target.checked;
    savePrefs(state);
  });

  el.toggleAdhanSound.addEventListener("change", e => {
    state.adhanSound = e.target.checked;
    savePrefs(state);
  });

  el.toggleNotificationSound.addEventListener("change", e => {
    state.notificationSound = e.target.checked;
    savePrefs(state);
  });

  // Volume slider event
  el.volumeSlider.addEventListener("input", e => {
    const volume = parseInt(e.target.value);
    state.volume = volume;
    el.volumeDisplay.textContent = volume + '%';
    
    // Update audio volume in real-time
    if (el.audio) {
      el.audio.volume = volume / 100;
    }
    
    savePrefs(state);
  });
}

function loadPrefs() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) ||
    { is24: false, dark: false, city: null, method: 2, madhab: 0 };
}

function savePrefs(s) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

function getGreeting(h) {
  if (h < 4) return "Good Night";
  if (h < 6) return "Time for Tahajjud";
  if (h < 12) return "Good Morning";
  if (h < 15) return "Good Afternoon";
  if (h < 18) return "Good Afternoon";
  if (h < 20) return "Good Evening";
  return "Good Night";
}

/* ==================== ISLAMIC CONTENT ==================== */
function loadIslamicContent(el) {
  const verses = [
    { text: "In the name of Allah, the Entirely Merciful, the Especially Merciful.", reference: "Quran 1:1" },
    { text: "Allah does not burden a soul beyond that it can bear.", reference: "Quran 2:286" },
    { text: "And He found you lost and guided [you].", reference: "Quran 93:7" },
    { text: "So remember Me; I will remember you.", reference: "Quran 2:152" },
    { text: "Indeed, with hardship comes ease.", reference: "Quran 94:6" },
    { text: "And Allah is the best of providers.", reference: "Quran 62:11" },
    { text: "Indeed, Allah is with the patient.", reference: "Quran 2:153" },
    { text: "And speak to people good.", reference: "Quran 2:83" }
  ];

  const hadiths = [
    { text: "The best among you are those who learn the Quran and teach it.", reference: "Sahih Bukhari" },
    { text: "None of you truly believes until he wishes for his brother what he wishes for himself.", reference: "Sahih Bukhari" },
    { text: "The strong is not the one who overcomes the people by his strength, but the strong is the one who controls himself while in anger.", reference: "Sahih Bukhari" },
    { text: "Cleanliness is half of faith.", reference: "Sahih Muslim" },
    { text: "Actions are judged by intentions.", reference: "Sahih Bukhari" },
    { text: "The most complete believers are those with the best character.", reference: "Tirmidhi" },
    { text: "Seek knowledge from the cradle to the grave.", reference: "At-Tirmidhi" },
    { text: "A believer is not bitten from the same hole twice.", reference: "Sahih Bukhari" }
  ];

  const today = new Date().getDate();
  const verseIndex = today % verses.length;
  const hadithIndex = (today + 1) % hadiths.length;

  if (el.verseOfDay) {
    el.verseOfDay.innerHTML = `${verses[verseIndex].text}<br><small style="color: var(--text-secondary);">${verses[verseIndex].reference}</small>`;
  }

  if (el.hadithOfDay) {
    el.hadithOfDay.innerHTML = `${hadiths[hadithIndex].text}<br><small style="color: var(--text-secondary);">${hadiths[hadithIndex].reference}</small>`;
  }
}

/* ==================== MENU & MODAL FUNCTIONS ==================== */
function toggleMenu() {
  const menu = document.getElementById('side-menu');
  const overlay = document.getElementById('menu-overlay');
  const hamburger = document.getElementById('hamburger');
  
  if (menu.style.right === '-350px' || menu.style.right === '') {
    // Open menu
    menu.style.right = '0px';
    overlay.style.display = 'block';
    setTimeout(() => {
      overlay.style.opacity = '1';
    }, 10);
    
    // Transform hamburger to X
    hamburger.children[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
    hamburger.children[1].style.opacity = '0';
    hamburger.children[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
  } else {
    // Close menu
    menu.style.right = '-350px';
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.style.display = 'none';
    }, 300);
    
    // Reset hamburger
    hamburger.children[0].style.transform = 'none';
    hamburger.children[1].style.opacity = '1';
    hamburger.children[2].style.transform = 'none';
  }
}

function showSection(section) {
  // Close menu first
  toggleMenu();
  
  // Show the appropriate modal
  if (section === 'settings') {
    document.getElementById('settings-modal').style.display = 'block';
    document.body.style.overflow = 'hidden';
  } else if (section === 'about') {
    document.getElementById('about-modal').style.display = 'block';
    document.body.style.overflow = 'hidden';
  } else if (section === 'contact') {
    document.getElementById('contact-modal').style.display = 'block';
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(modal) {
  if (modal === 'settings') {
    document.getElementById('settings-modal').style.display = 'none';
  } else if (modal === 'about') {
    document.getElementById('about-modal').style.display = 'none';
  } else if (modal === 'contact') {
    document.getElementById('contact-modal').style.display = 'none';
  }
  document.body.style.overflow = 'auto';
}

function showSettingsTab(tabName) {
  // Hide all tabs
  const tabs = document.querySelectorAll('.tab-content');
  tabs.forEach(tab => tab.classList.remove('active'));
  
  // Remove active class from all buttons
  const buttons = document.querySelectorAll('.tab-btn');
  buttons.forEach(btn => btn.classList.remove('active'));
  
  // Show selected tab
  document.getElementById(tabName + '-tab').classList.add('active');
  
  // Add active class to clicked button
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
}

/* ==================== SERVICE WORKER ==================== */
function initServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js").then(reg => {
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            if (confirm('New version available! Reload to update?')) {
              window.location.reload();
            }
          }
        });
      });
    });
  }
}

function requestNotificationPermission() {
  if ("Notification" in window)
    Notification.requestPermission();
}

/* ==================== RAMADAN FEATURES ==================== */
function initRamadanFeatures(el) {
  // Ramadan 2025 dates (approximate - may vary by location)
  const ramadanStart = new Date('2025-02-28'); // Approximate start
  const ramadanEnd = new Date('2025-03-30'); // Approximate end
  const currentDate = new Date();

  // Hide Ramadan section if not in Ramadan month
  if (currentDate < ramadanStart || currentDate > ramadanEnd) {
    if (el.ramadanSection) {
      el.ramadanSection.style.display = 'none';
    }
    return;
  }

  // Calculate Ramadan day
  const dayNumber = Math.floor((currentDate - ramadanStart) / (1000 * 60 * 60 * 24)) + 1;
  const totalDays = 30;

  // Update Ramadan countdown and day
  updateRamadanInfo(el, dayNumber, totalDays, currentDate, ramadanEnd);

  // Start updating timers every second
  setInterval(() => updateRamadanTimers(el), 1000);
  
  // Check for Ramadan notifications
  setInterval(() => checkRamadanNotifications(el), 60000); // Check every minute
}

function checkRamadanNotifications(el) {
  const state = loadPrefs();
  if (state.ramadanNotifications === false) return;
  
  if (!window.todayTimings) return;

  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5);

  // Get Sehri (Fajr) and Iftar (Maghrib) times
  const sehriTime = window.todayTimings.Fajr;
  const iftarTime = window.todayTimings.Maghrib;

  // Check for Sehri notification (30 minutes before)
  if (sehriTime) {
    const [sehriHours, sehriMinutes] = sehriTime.split(':');
    const sehriNotificationTime = new Date();
    sehriNotificationTime.setHours(parseInt(sehriHours), parseInt(sehriMinutes) - 30, 0, 0);
    
    const timeDiff = sehriNotificationTime - now;
    if (timeDiff > 0 && timeDiff <= 60000) { // Within 1 minute of notification time
      if (Notification.permission === "granted" && state.notificationSound !== false) {
        new Notification("🌙 Ramadan Sehri", { 
          body: "Sehri time is in 30 minutes. Prepare for Suhoor.",
          icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%234B5563'><path d='M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-3.03 0-5.5-2.47-5.5-5.5 0-1.82.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z'/></svg>"
        });
      }
    }
  }

  // Check for Iftar notification (15 minutes before)
  if (iftarTime) {
    const [iftarHours, iftarMinutes] = iftarTime.split(':');
    const iftarNotificationTime = new Date();
    iftarNotificationTime.setHours(parseInt(iftarHours), parseInt(iftarMinutes) - 15, 0, 0);
    
    const timeDiff = iftarNotificationTime - now;
    if (timeDiff > 0 && timeDiff <= 60000) { // Within 1 minute of notification time
      if (Notification.permission === "granted" && state.notificationSound !== false) {
        new Notification("🍽️ Ramadan Iftar", { 
          body: "Iftar time is in 15 minutes. Prepare to break your fast.",
          icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23F59E0B'><path d='M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1z'/></svg>"
        });
      }
    }
  }
}

function updateRamadanInfo(el, dayNumber, totalDays, currentDate, ramadanEnd) {
  if (el.ramadanCountdown) {
    const daysLeft = Math.floor((ramadanEnd - currentDate) / (1000 * 60 * 60 * 24));
    if (daysLeft > 0) {
      el.ramadanCountdown.textContent = `Ramadan Day ${dayNumber} - ${daysLeft} days remaining`;
    } else {
      el.ramadanCountdown.textContent = `Ramadan Day ${dayNumber} - Final day`;
    }
  }

  if (el.ramadanDay) {
    const progress = (dayNumber / totalDays) * 100;
    el.ramadanDay.innerHTML = `
      <div style="margin-bottom: 0.5rem;">Progress: ${Math.round(progress)}%</div>
      <div style="background: var(--border-color); height: 8px; border-radius: 4px; overflow: hidden;">
        <div style="background: linear-gradient(90deg, var(--primary-color), var(--secondary-color)); height: 100%; width: ${progress}%; transition: width 1s ease;"></div>
      </div>
    `;
  }
}

function updateRamadanTimers(el) {
  if (!window.todayTimings) return;

  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5);

  // Get Sehri (Fajr) and Iftar (Maghrib) times
  const sehriTime = window.todayTimings.Fajr;
  const iftarTime = window.todayTimings.Maghrib;

  // Update Sehri timer
  if (el.sehriTime && el.sehriCountdown) {
    el.sehriTime.textContent = sehriTime;
    
    const sehriDate = new Date();
    const [sehriHours, sehriMinutes] = sehriTime.split(':');
    sehriDate.setHours(parseInt(sehriHours), parseInt(sehriMinutes), 0, 0);

    // If Sehri time has passed, set it for tomorrow
    if (sehriDate < now) {
      sehriDate.setDate(sehriDate.getDate() + 1);
    }

    const sehriDiff = sehriDate - now;
    if (sehriDiff > 0) {
      const sehriHours = Math.floor(sehriDiff / (1000 * 60 * 60));
      const sehriMinutes = Math.floor((sehriDiff % (1000 * 60 * 60)) / (1000 * 60));
      const sehriSeconds = Math.floor((sehriDiff % (1000 * 60)) / 1000);
      
      if (sehriHours > 0) {
        el.sehriCountdown.textContent = `${sehriHours}h ${sehriMinutes}m ${sehriSeconds}s`;
      } else {
        el.sehriCountdown.textContent = `${sehriMinutes}m ${sehriSeconds}s`;
      }
    } else {
      el.sehriCountdown.textContent = 'Sehri time has passed';
    }
  }

  // Update Iftar timer
  if (el.iftarTime && el.iftarCountdown) {
    el.iftarTime.textContent = iftarTime;
    
    const iftarDate = new Date();
    const [iftarHours, iftarMinutes] = iftarTime.split(':');
    iftarDate.setHours(parseInt(iftarHours), parseInt(iftarMinutes), 0, 0);

    // If Iftar time has passed, set it for tomorrow
    if (iftarDate < now) {
      iftarDate.setDate(iftarDate.getDate() + 1);
    }

    const iftarDiff = iftarDate - now;
    if (iftarDiff > 0) {
      const iftarHours = Math.floor(iftarDiff / (1000 * 60 * 60));
      const iftarMinutes = Math.floor((iftarDiff % (1000 * 60 * 60)) / (1000 * 60));
      const iftarSeconds = Math.floor((iftarDiff % (1000 * 60)) / 1000);
      
      if (iftarHours > 0) {
        el.iftarCountdown.textContent = `${iftarHours}h ${iftarMinutes}m ${iftarSeconds}s`;
      } else {
        el.iftarCountdown.textContent = `${iftarMinutes}m ${iftarSeconds}s`;
      }
    } else {
      el.iftarCountdown.textContent = 'Iftar time has passed';
    }
  }
}

/* ==================== ZAKAT CALCULATOR ==================== */
function calculateZakat() {
  // Get mineral and metal values
  const goldGrams = parseFloat(document.getElementById('gold-value').value) || 0;
  const silverGrams = parseFloat(document.getElementById('silver-value').value) || 0;
  const platinumGrams = parseFloat(document.getElementById('platinum-value').value) || 0;
  const palladiumGrams = parseFloat(document.getElementById('palladium-value').value) || 0;
  const diamondCarats = parseFloat(document.getElementById('diamond-value').value) || 0;
  const otherMinerals = parseFloat(document.getElementById('other-minerals').value) || 0;
  
  // Get financial values
  const cash = parseFloat(document.getElementById('cash-value').value) || 0;
  const investments = parseFloat(document.getElementById('investments-value').value) || 0;
  
  // Get prices
  const goldPricePerGram = parseFloat(document.getElementById('gold-price').value) || 60;
  const silverPricePerGram = parseFloat(document.getElementById('silver-price').value) || 0.90;
  const platinumPricePerGram = parseFloat(document.getElementById('platinum-price').value) || 30;
  const palladiumPricePerGram = parseFloat(document.getElementById('palladium-price').value) || 50;
  const diamondPricePerCarat = parseFloat(document.getElementById('diamond-price').value) || 5000;
  
  // Get currency settings
  const selectedCurrency = document.getElementById('currency-select').value;
  const exchangeRate = parseFloat(document.getElementById('exchange-rate').value) || 1;
  
  // Calculate mineral values in USD
  const goldValue = goldGrams * goldPricePerGram;
  const silverValue = silverGrams * silverPricePerGram;
  const platinumValue = platinumGrams * platinumPricePerGram;
  const palladiumValue = palladiumGrams * palladiumPricePerGram;
  const diamondValue = diamondCarats * diamondPricePerCarat;
  
  // Total wealth breakdown
  const wealthBreakdown = {
    'Gold': goldValue,
    'Silver': silverValue,
    'Platinum': platinumValue,
    'Palladium': palladiumValue,
    'Diamonds': diamondValue,
    'Other Minerals': otherMinerals,
    'Cash': cash,
    'Investments': investments
  };
  
  const totalWealthUSD = Object.values(wealthBreakdown).reduce((sum, value) => sum + value, 0);
  
  // Nisab threshold (approximately 85 grams of gold)
  const nisabThreshold = 85 * goldPricePerGram;
  
  // Calculate Zakat (2.5% of wealth above nisab)
  const zakatRate = 0.025; // 2.5%
  let zakatDueUSD = 0;
  let note = '';
  
  if (totalWealthUSD >= nisabThreshold) {
    zakatDueUSD = totalWealthUSD * zakatRate;
    note = `Zakat is due as your wealth exceeds the Nisab threshold ($${nisabThreshold.toFixed(2)})`;
  } else {
    note = `No Zakat due as your wealth is below the Nisab threshold ($${nisabThreshold.toFixed(2)})`;
  }
  
  // Convert to selected currency
  const totalWealthLocal = totalWealthUSD * exchangeRate;
  const zakatDueLocal = zakatDueUSD * exchangeRate;
  const nisabThresholdLocal = nisabThreshold * exchangeRate;
  
  // Get currency symbols
  const currencySymbols = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'TZS': 'TSh',
    'KES': 'KSh',
    'INR': '₹',
    'MYR': 'RM',
    'SAR': '﷼'
  };
  
  const currencySymbol = currencySymbols[selectedCurrency] || '$';
  
  // Display results
  const resultDiv = document.getElementById('zakat-result');
  const totalWealthDiv = document.getElementById('total-wealth');
  const zakatDueDiv = document.getElementById('zakat-due');
  const breakdownDiv = document.getElementById('breakdown-details');
  const conversionDiv = document.getElementById('conversion-details');
  const noteDiv = document.getElementById('zakat-note');
  
  resultDiv.style.display = 'block';
  totalWealthDiv.textContent = `${currencySymbol}${totalWealthLocal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
  zakatDueDiv.textContent = `${currencySymbol}${zakatDueLocal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
  
  // Show asset breakdown
  let breakdownHTML = '';
  for (const [asset, value] of Object.entries(wealthBreakdown)) {
    if (value > 0) {
      const localValue = value * exchangeRate;
      const percentage = ((value / totalWealthUSD) * 100).toFixed(1);
      breakdownHTML += `
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
          <span>${asset}:</span>
          <span>${currencySymbol}${localValue.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})} (${percentage}%)</span>
        </div>
      `;
    }
  }
  breakdownDiv.innerHTML = breakdownHTML || '<div style="color: var(--text-secondary);">No assets entered</div>';
  
  // Show conversion details
  if (selectedCurrency !== 'USD') {
    conversionDiv.innerHTML = `
      <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
        <span>USD Total:</span>
        <span>$${totalWealthUSD.toFixed(2)} → $${zakatDueUSD.toFixed(2)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
        <span>Exchange Rate:</span>
        <span>1 USD = ${exchangeRate} ${selectedCurrency}</span>
      </div>
      <div style="display: flex; justify-content: space-between; font-weight: 600;">
        <span>${selectedCurrency} Total:</span>
        <span>${currencySymbol}${totalWealthLocal.toFixed(2)} → ${currencySymbol}${zakatDueLocal.toFixed(2)}</span>
      </div>
    `;
  } else {
    conversionDiv.innerHTML = `
      <div style="display: flex; justify-content: space-between; font-weight: 600;">
        <span>Calculations in USD:</span>
        <span>$${totalWealthUSD.toFixed(2)} → $${zakatDueUSD.toFixed(2)}</span>
      </div>
    `;
  }
  
  // Update note with local currency
  noteDiv.textContent = zakatDueUSD > 0 
    ? `Zakat is due as your wealth exceeds the Nisab threshold (${currencySymbol}${nisabThresholdLocal.toFixed(2)} ${selectedCurrency})`
    : `No Zakat due as your wealth is below the Nisab threshold (${currencySymbol}${nisabThresholdLocal.toFixed(2)} ${selectedCurrency})`;
  
  // Style the Zakat amount based on whether it's due
  if (zakatDueUSD > 0) {
    zakatDueDiv.style.color = 'var(--accent-color)';
    
    // Check for Zakat reminder notification
    const state = loadPrefs();
    if (state.zakatReminder !== false && Notification.permission === "granted") {
      new Notification("💰 Zakat Calculation Complete", { 
        body: `Zakat due: ${currencySymbol}${zakatDueLocal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}. Remember to pay your Zakat on time.`,
        icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2310B981'><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1.81.45 1.61 1.67 1.61 1.16 0 1.6-.64 1.6-1.46 0-.84-.68-1.22-1.88-1.64-1.68-.55-3.48-1.22-3.48-3.61 0-1.69 1.26-2.83 2.97-3.21V5h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.63-1.63-1.63-1.01 0-1.46.54-1.46 1.34 0 .89.79 1.21 1.97 1.58 1.69.52 3.42 1.15 3.42 3.67 0 1.87-1.36 3.03-3.19 3.39z'/></svg>"
      });
    }
  } else {
    zakatDueDiv.style.color = 'var(--text-secondary)';
  }
}

// Update market prices display
function updateMarketPrices() {
  const goldPrice = parseFloat(document.getElementById('gold-price').value) || 60;
  const silverPrice = parseFloat(document.getElementById('silver-price').value) || 0.90;
  const platinumPrice = parseFloat(document.getElementById('platinum-price').value) || 30;
  const palladiumPrice = parseFloat(document.getElementById('palladium-price').value) || 50;
  const diamondPrice = parseFloat(document.getElementById('diamond-price').value) || 5000;
  
  // Update price displays
  document.getElementById('gold-price-display').textContent = `1g = $${goldPrice.toFixed(2)}`;
  document.getElementById('silver-price-display').textContent = `1g = $${silverPrice.toFixed(2)}`;
  document.getElementById('platinum-price-display').textContent = `1g = $${platinumPrice.toFixed(2)}`;
  document.getElementById('palladium-price-display').textContent = `1g = $${palladiumPrice.toFixed(2)}`;
  document.getElementById('diamond-price-display').textContent = `1ct = $${diamondPrice.toFixed(2)}`;
  
  // Show visual feedback
  const button = event.target;
  const originalText = button.textContent;
  button.textContent = 'Prices Updated!';
  button.style.background = 'var(--secondary-color)';
  
  setTimeout(() => {
    button.textContent = originalText;
    button.style.background = '';
  }, 1500);
}

// Add currency change event listener
document.addEventListener('DOMContentLoaded', function() {
  const currencySelect = document.getElementById('currency-select');
  const exchangeRateInput = document.getElementById('exchange-rate');
  
  // Predefined exchange rates (approximate - users should update with current rates)
  const predefinedRates = {
    'USD': 1,
    'EUR': 0.92,
    'GBP': 0.79,
    'TZS': 2500,
    'KES': 130,
    'INR': 83,
    'MYR': 4.7,
    'SAR': 3.75
  };
  
  if (currencySelect && exchangeRateInput) {
    currencySelect.addEventListener('change', function() {
      const selectedCurrency = this.value;
      if (predefinedRates[selectedCurrency]) {
        exchangeRateInput.value = predefinedRates[selectedCurrency];
      }
    });
  }
  
  // Add real-time price update listeners
  const priceInputs = ['gold-price', 'silver-price', 'platinum-price', 'palladium-price', 'diamond-price'];
  const displayElements = {
    'gold-price': 'gold-price-display',
    'silver-price': 'silver-price-display',
    'platinum-price': 'platinum-price-display',
    'palladium-price': 'palladium-price-display',
    'diamond-price': 'diamond-price-display'
  };
  
  priceInputs.forEach(inputId => {
    const input = document.getElementById(inputId);
    const display = document.getElementById(displayElements[inputId]);
    
    if (input && display) {
      input.addEventListener('input', function() {
        const price = parseFloat(this.value) || 0;
        const unit = inputId.includes('diamond') ? 'ct' : 'g';
        display.textContent = `1${unit} = $${price.toFixed(2)}`;
      });
    }
  });
  
  // Initialize price displays
  updateMarketPrices();
});

/* ==================== ISLAMIC EVENTS ==================== */
function initIslamicEvents() {
  // Check for Islamic events notifications daily
  setInterval(() => checkIslamicEvents(), 3600000); // Check every hour
  checkIslamicEvents(); // Check immediately on load
}

function checkIslamicEvents() {
  const state = loadPrefs();
  if (state.islamicEvents === false) return;
  
  if (Notification.permission !== "granted") return;
  
  const today = new Date();
  const hijriDate = new Intl.DateTimeFormat('en-TZ-u-ca-islamic', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric'
  }).format(today);
  
  // Extract Hijri day and month
  const hijriParts = hijriDate.split('/');
  const hijriDay = parseInt(hijriParts[1]);
  const hijriMonth = parseInt(hijriParts[0]);
  
  // Important Islamic events
  const events = {
    1: { 1: "Islamic New Year (Muharram 1)" },
    1: { 10: "Day of Ashura (Muharram 10)" },
    3: { 12: "Mawlid al-Nabi (Rabi' al-Awwal 12)" },
    7: { 27: "Lailat al-Mi'raj (Rajab 27)" },
    8: { 15: "Lailat al-Bara'ah (Sha'ban 15)" },
    9: { 1: "First day of Ramadan", 17: "Battle of Badr", 21: "Lailat al-Qadr begins", 27: "Lailat al-Qadr" },
    10: { 1: "Eid al-Fitr", 8: "Day of Arafah", 9: "Eid al-Adha", 10: "Eid al-Adha" },
    12: { 18: "Day of Arafah (Hajj season)" }
  };
  
  // Check if today is an event day
  if (events[hijriMonth] && events[hijriMonth][hijriDay]) {
    const eventName = events[hijriMonth][hijriDay];
    const lastNotification = localStorage.getItem(`islamic-event-${hijriMonth}-${hijriDay}`);
    const todayString = today.toDateString();
    
    // Only show notification once per day
    if (lastNotification !== todayString) {
      new Notification("🌙 Islamic Event", {
        body: `Today is ${eventName}. May Allah accept your deeds.`,
        icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%237C3AED'><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z'/></svg>"
      });
      
      localStorage.setItem(`islamic-event-${hijriMonth}-${hijriDay}`, todayString);
    }
  }
  
  // Special notifications for upcoming events
  checkUpcomingEvents(today, hijriDay, hijriMonth);
}

function checkUpcomingEvents(today, currentDay, currentMonth) {
  const upcomingEvents = [
    { month: 9, day: 1, name: "Ramadan", daysBefore: 7, message: "Ramadan begins in 7 days. Prepare spiritually!" },
    { month: 10, day: 1, name: "Eid al-Fitr", daysBefore: 3, message: "Eid al-Fitr is in 3 days. Prepare for celebration!" },
    { month: 10, day: 9, name: "Eid al-Adha", daysBefore: 3, message: "Eid al-Adha is in 3 days. Prepare for sacrifice!" },
    { month: 9, day: 27, name: "Lailat al-Qadr", daysBefore: 1, message: "Lailat al-Qadr is tomorrow. Seek forgiveness!" }
  ];
  
  upcomingEvents.forEach(event => {
    if (currentMonth === event.month && currentDay === event.day - event.daysBefore) {
      const notificationKey = `upcoming-${event.month}-${event.day}`;
      const lastNotification = localStorage.getItem(notificationKey);
      const todayString = today.toDateString();
      
      if (lastNotification !== todayString) {
        new Notification("📅 Upcoming Islamic Event", {
          body: event.message,
          icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23F59E0B'><path d='M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z'/></svg>"
        });
        
        localStorage.setItem(notificationKey, todayString);
      }
    }
  });
}

// Initialize Islamic events when the app loads
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(initIslamicEvents, 2000); // Delay to ensure everything is loaded
});