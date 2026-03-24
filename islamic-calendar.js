/**
 * Islamic Calendar & Eid Dates Calculator
 * IMPORTANT: This provides astronomical calculations only.
 * Actual Islamic dates depend on moon sighting and local authorities.
 * Always verify with your local mosque or Islamic authority.
 *
 * This file contains sensitive religious calculations.
 * Use with extreme caution and proper disclaimers.
 */

"use strict";

// ==================== ISLAMIC CALENDAR CONSTANTS ====================
const ISLAMIC_MONTHS = [
  "Muharram", "Safar", "Rabi al-awwal", "Rabi al-thani",
  "Jumada al-awwal", "Jumada al-thani", "Rajab", "Sha'ban",
  "Ramadan", "Shawwal", "Dhu al-Qi'dah", "Dhu al-Hijjah"
];

const ISLAMIC_HOLIDAYS = {
  // Major Islamic holidays with their Hijri dates
  // NOTE: month is 0-based index into ISLAMIC_MONTHS
  'Eid al-Fitr': { month: 9, day: 1 }, // 1 Shawwal (end of Ramadan)
  'Eid al-Adha': { month: 11, day: 10 }, // 10 Dhu al-Hijjah
  'Islamic New Year': { month: 0, day: 1 }, // 1st of Muharram
  'Ashura': { month: 0, day: 10 }, // 10th of Muharram
  'Mawlid al-Nabi': { month: 2, day: 12 }, // 12th of Rabi al-awwal (approximate)
  'Isra and Mi\'raj': { month: 6, day: 27 }, // 27th of Rajab
  'Laylat al-Qadr': { month: 8, day: 27 } // 27th of Ramadan (approximate)
};

// ==================== EID CALCULATION FUNCTIONS ====================

function getHijriAdjustmentDays() {
  try {
    const raw = localStorage.getItem("hijriAdjustmentDays");
    const n = parseInt(raw ?? "0", 10);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

function toDisplayDate(date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function hijriToGregorianDate(hYear, hMonthIndex0, hDay) {
  const adj = getHijriAdjustmentDays();
  if (typeof moment === "function" && moment.prototype.iYear) {
    return moment()
      .iYear(hYear)
      .iMonth(hMonthIndex0)
      .iDate(hDay)
      .add(adj, "days")
      .toDate();
  }
  return null;
}

/**
 * Calculate Eid dates for a given Gregorian year
 * @param {number} gregorianYear - Gregorian year (e.g., 2026)
 * @returns {Object} Eid dates with disclaimers
 */
function calculateEidDates(gregorianYear) {
  const disclaimer =
    "⚠️ IMPORTANT: These are astronomical calculations only. Actual dates depend on moon sighting and local Islamic authority rulings. Please verify with your local mosque or Islamic center.";

  // Prefer moment-hijri conversion (no network).
  if (typeof moment === "function" && moment.prototype.iYear) {
    const jan1 = moment(`${gregorianYear}-01-01`, "YYYY-MM-DD");
    const hYear1 = jan1.iYear();
    const hYear2 = hYear1 + 1;

    const candidates = [];
    for (const hYear of [hYear1, hYear2]) {
      const fitr = hijriToGregorianDate(hYear, 9, 1); // 1 Shawwal
      const adha = hijriToGregorianDate(hYear, 11, 10); // 10 Dhu al-Hijjah
      if (fitr) candidates.push({ kind: "fitr", hYear, date: fitr });
      if (adha) candidates.push({ kind: "adha", hYear, date: adha });
    }

    const pickForYear = (kind) => {
      const inYear = candidates
        .filter((c) => c.kind === kind && c.date.getFullYear() === gregorianYear)
        .sort((a, b) => a.date - b.date);
      if (inYear.length > 0) return inYear[0];
      const near = candidates
        .filter((c) => c.kind === kind)
        .sort((a, b) => Math.abs(a.date - new Date(`${gregorianYear}-07-01`)) - Math.abs(b.date - new Date(`${gregorianYear}-07-01`)));
      return near[0] || null;
    };

    const fitrPicked = pickForYear("fitr");
    const adhaPicked = pickForYear("adha");

    const eidDates = {
      eidAlFitr: fitrPicked
        ? {
            hijri: `1 Shawwal ${fitrPicked.hYear} AH`,
            gregorian: toDisplayDate(fitrPicked.date),
            date: fitrPicked.date,
            note: "Depends on moon sighting (date may vary by location).",
          }
        : null,
      eidAlAdha: adhaPicked
        ? {
            hijri: `10 Dhu al-Hijjah ${adhaPicked.hYear} AH`,
            gregorian: toDisplayDate(adhaPicked.date),
            date: adhaPicked.date,
            note: "Depends on moon sighting (date may vary by location).",
          }
        : null,
    };

    return {
      year: gregorianYear,
      islamicYear: fitrPicked?.hYear ?? adhaPicked?.hYear ?? hYear1,
      dates: eidDates,
      disclaimer,
      lastUpdated: new Date().toISOString().split("T")[0],
      currentDate: toDisplayDate(new Date()),
    };
  }

  // No conversion library available: return placeholders; UI should prefer API.
  return {
    year: gregorianYear,
    islamicYear: null,
    dates: { eidAlFitr: null, eidAlAdha: null },
    disclaimer,
    lastUpdated: new Date().toISOString().split("T")[0],
    currentDate: toDisplayDate(new Date()),
  };
}

/**
 * Get Islamic holidays for current year
 * @returns {Array} Array of Islamic holidays
 */
function getIslamicHolidays() {
  const currentYear = new Date().getFullYear();
  let eidData;
  try {
    eidData = calculateEidDates(currentYear);
  } catch (e) {
    console.error("Error calculating Eid dates:", e);
    eidData = null;
  }

  const events = [];

  if (eidData && eidData.dates) {
    if (eidData.dates.eidAlFitr && eidData.dates.eidAlFitr.date) {
      events.push({
        name: "🕌 Eid al-Fitr",
        hijri: eidData.dates.eidAlFitr.hijri,
        gregorian: eidData.dates.eidAlFitr.gregorian,
        date: eidData.dates.eidAlFitr.date,
        importance: "High",
        note: eidData.dates.eidAlFitr.note,
      });
    }
    if (eidData.dates.eidAlAdha && eidData.dates.eidAlAdha.date) {
      events.push({
        name: "🕌 Eid al-Adha",
        hijri: eidData.dates.eidAlAdha.hijri,
        gregorian: eidData.dates.eidAlAdha.gregorian,
        date: eidData.dates.eidAlAdha.date,
        importance: "High",
        note: eidData.dates.eidAlAdha.note,
      });
    }
  }

  // Add other key Islamic events (Islamic New Year, Ashura, etc.) when conversion is available.
  if (typeof moment === "function" && moment.prototype.iYear) {
    const jan1 = moment(`${currentYear}-01-01`, "YYYY-MM-DD");
    const baseHijriYear = jan1.iYear();
    const hijriYearsToCheck = [baseHijriYear - 1, baseHijriYear, baseHijriYear + 1];

    Object.entries(ISLAMIC_HOLIDAYS).forEach(([name, cfg]) => {
      if (name === "Eid al-Fitr" || name === "Eid al-Adha") return;

      hijriYearsToCheck.forEach((hYear) => {
        const d = hijriToGregorianDate(hYear, cfg.month, cfg.day);
        if (!d || d.getFullYear() !== currentYear) return;

        events.push({
          name: `🕌 ${name}`,
          hijri: `${cfg.day} ${ISLAMIC_MONTHS[cfg.month]} ${hYear} AH`,
          gregorian: formatIslamicDate(d),
          date: d,
          importance: "Medium",
          note: "Calculated from Hijri calendar (may vary by location).",
        });
      });
    });

    events.sort((a, b) => (a.date && b.date ? a.date - b.date : 0));
  }

  return events;
}

/**
 * Format date for display
 * @param {Date} date - Date object
 * @returns {string} Formatted date string
 */
function formatIslamicDate(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Load Eid dates for display in the app
 * @param {Object} el - DOM elements object
 */
async function loadEidDates(el) {
  if (!el || !el.eidDates) {
    console.warn("loadEidDates called without valid container:", el);
    return;
  }

  try {
    // Try to get from API first
    const currentYear = new Date().getFullYear();
    // Aladhan expects ISO-3166 alpha-2 country codes (e.g., TZ for Tanzania)
    const response = await fetch(`https://api.aladhan.com/v1/gToHCalendar/${currentYear}`);
    const data = await response.json();

    if (data.code === 200 && data.data && Array.isArray(data.data)) {
      const holidays = data.data;
      const keyEvents = holidays.filter(holiday =>
        holiday.name && (
          holiday.name.toLowerCase().includes('eid') ||
          holiday.name.toLowerCase().includes('fitr') ||
          holiday.name.toLowerCase().includes('adha') ||
          holiday.name.toLowerCase().includes('islamic new year') ||
          holiday.name.toLowerCase().includes('ashura') ||
          holiday.name.toLowerCase().includes('mawlid') ||
          holiday.name.toLowerCase().includes('laylat') ||
          holiday.name.toLowerCase().includes('isra') ||
          holiday.name.toLowerCase().includes('mi\'raj') ||
          holiday.name.toLowerCase().includes('miraj')
        )
      );

      if (keyEvents.length > 0) {
        const eidHTML = keyEvents
          .map((event) => {
            const dateString =
              (event.gregorian && event.gregorian.date) ||
              event.date ||
              event.date?.gregorian;
            const hijriString =
              (event.hijri && `${event.hijri.day} ${event.hijri.month?.en ?? ""} ${event.hijri.year} AH`) ||
              event.hijri;
            const date = dateString ? new Date(dateString) : null;
            const formattedDate = date ? formatIslamicDate(date) : String(dateString ?? "");
            return `<div style="margin-bottom: 0.5rem; padding: 0.5rem; background: var(--bg-secondary); border-radius: var(--radius-md);">
              <strong>🕌 ${event.name}</strong><br>
              <small style="color: var(--text-secondary);">${formattedDate}</small>
              ${hijriString ? `<br><small style="color: var(--text-secondary); font-style: italic;">${hijriString}</small>` : ""}
            </div>`;
          })
          .join("");

        el.eidDates.innerHTML = eidHTML + getDisclaimerHTML();
        return;
      }
    }

    // Fallback to calculated / local dates
    loadEidDatesFallback(el);

  } catch (error) {
    console.error("Error loading events from API:", error);
    loadEidDatesFallback(el, {
      message:
        "Unable to load events from the internet. Showing locally calculated dates instead.",
    });
  }
}

/**
 * Fallback Eid date calculation
 * @param {Object} el - DOM elements object
 * @param {Object} [options] - extra options (e.g. message)
 */
function loadEidDatesFallback(el, options) {
  if (!el || !el.eidDates) return;

  let holidays = [];
  try {
    holidays = getIslamicHolidays() || [];
  } catch (e) {
    console.error("Error calculating fallback events:", e);
    holidays = [];
  }

  if (!Array.isArray(holidays) || holidays.length === 0) {
    el.eidDates.innerHTML = `
      <div style="padding: 0.75rem; background: var(--bg-tertiary); border-radius: var(--radius-md);">
        <small style="color: var(--text-secondary);">
          No upcoming events could be calculated at this time.
        </small>
      </div>
      ${getDisclaimerHTML()}
    `;
    return;
  }

  const eidHTML = holidays
    .map(
      (holiday) => `
    <div style="margin-bottom: 0.5rem; padding: 0.5rem; background: var(--bg-secondary); border-radius: var(--radius-md);">
      <strong>${holiday.name}</strong><br>
      <small style="color: var(--text-secondary);">${holiday.gregorian}</small>
      ${
        holiday.hijri
          ? `<br><small style="color: var(--text-secondary); font-style: italic;">${holiday.hijri}</small>`
          : ""
      }
      ${
        holiday.note
          ? `<br><small style="color: var(--text-secondary); font-style: italic;">${holiday.note}</small>`
          : ""
      }
    </div>
  `,
    )
    .join("");

  const extraMessage =
    options && options.message
      ? `<div style="margin-top: 0.5rem;"><small style="color: var(--text-secondary); font-style: italic;">${options.message}</small></div>`
      : "";

  el.eidDates.innerHTML = eidHTML + extraMessage + getDisclaimerHTML();
}

/**
 * Get disclaimer HTML
 * @returns {string} Disclaimer HTML
 */
function getDisclaimerHTML() {
  return `
    <div style="margin-top: 0.5rem; padding: 0.5rem; background: var(--bg-tertiary); border-radius: var(--radius-md); border-left: 3px solid var(--accent-color);">
      <small style="color: var(--text-secondary); font-style: italic; font-weight: 500;">
        ⚠️ <strong>IMPORTANT:</strong> These are astronomical calculations only. Actual Islamic dates depend on moon sighting and local Islamic authority rulings. Please verify with your local mosque or Islamic center for exact dates.
      </small>
    </div>
  `;
}

// ==================== EXPORTS ====================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    calculateEidDates,
    getIslamicHolidays,
    formatIslamicDate,
    loadEidDates,
    loadEidDatesFallback
  };
}