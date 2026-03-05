"use strict";

const STORAGE_KEY = "islamicAppPrefs";
const KAABA_LAT = 21.4225;
const KAABA_LON = 39.8262;

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
    // Ramadan elements
    ramadanSection: document.getElementById("ramadan-section"),
    ramadanCountdown: document.getElementById("ramadan-countdown"),
    sehriTime: document.getElementById("sehri-time"),
    sehriCountdown: document.getElementById("sehri-countdown"),
    iftarTime: document.getElementById("iftar-time"),
    iftarCountdown: document.getElementById("iftar-countdown"),
    ramadanDay: document.getElementById("ramadan-day")
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

  let now = new Date();
  let current = now.toTimeString().slice(0, 5);
  ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"].forEach(p => {
    if (window.todayTimings[p] === current) {
      el.audio.play();
      if (Notification.permission === "granted")
        new Notification("Adhan", { body: p + " time has started" });
    }
  });
}

/* ==================== THEME + STORAGE ==================== */
function applyPrefs(el, state) {
  el.toggle24.checked = state.is24;
  el.toggleTheme.checked = state.dark;
  el.calculationMethod.value = state.method || 2;
  el.madhab.value = state.madhab || 0;
  document.body.classList.toggle("dark", state.dark);
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
  if (zakatDueUSD > 0) {
    noteDiv.textContent = `Zakat is due as your wealth exceeds the Nisab threshold (${currencySymbol}${nisabThresholdLocal.toFixed(2)} ${selectedCurrency})`;
  } else {
    noteDiv.textContent = `No Zakat due as your wealth is below the Nisab threshold (${currencySymbol}${nisabThresholdLocal.toFixed(2)} ${selectedCurrency})`;
  }
  
  // Style the Zakat amount based on whether it's due
  if (zakatDueUSD > 0) {
    zakatDueDiv.style.color = 'var(--accent-color)';
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