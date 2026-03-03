/**
 * Islamic Digital Clock
 * Features: Live clock, Gregorian date, Hijri date, time-based greetings, toggle switches.
 * Author: [Your Name]
 * Version: 2.0
 */

(function() {
    "use strict";

    // -------------------- DOM Elements --------------------
    const clockElement = document.getElementById("clock");
    const dateElement = document.getElementById("date");
    const hijriDateElement = document.getElementById("hijri-date");
    const greetingElement = document.getElementById("greeting");

    const toggle12_24 = document.getElementById("toggle-12-24");
    const toggleGregorian = document.getElementById("toggle-gregorian");
    const toggleHijri = document.getElementById("toggle-hijri");

    // -------------------- State --------------------
    let is24HourFormat = false;   // false = 12-hour, true = 24-hour

    // -------------------- Constants --------------------
    const GREETINGS = ["Good Night", "Good Morning", "Good Afternoon", "Good Evening"];
    const HIJRI_MONTHS = [
        "Muharram", "Safar", "Rabi' al-awwal", "Rabi' al-thani",
        "Jumada al-awwal", "Jumada al-thani", "Rajab", "Sha'ban",
        "Ramadan", "Shawwal", "Dhul-Qi'dah", "Dhul-Hijjah"
    ];

    // -------------------- Initialisation --------------------
    function init() {
        // Set initial display states based on checkboxes
        dateElement.style.display = toggleGregorian.checked ? "block" : "none";
        hijriDateElement.style.display = toggleHijri.checked ? "block" : "none";

        // Attach event listeners
        toggle12_24.addEventListener("change", handleFormatToggle);
        toggleGregorian.addEventListener("change", handleGregorianToggle);
        toggleHijri.addEventListener("change", handleHijriToggle);

        // Start the clock
        updateClock();
        updateDate();
        setInterval(updateClock, 1000);
    }

    // -------------------- Event Handlers --------------------
    function handleFormatToggle() {
        is24HourFormat = toggle12_24.checked;
        updateClock();
    }

    function handleGregorianToggle() {
        dateElement.style.display = toggleGregorian.checked ? "block" : "none";
    }

    function handleHijriToggle() {
        hijriDateElement.style.display = toggleHijri.checked ? "block" : "none";
    }

    // -------------------- Clock & Greeting --------------------
    function updateClock() {
        const now = new Date();
        clockElement.textContent = formatTime(now, is24HourFormat);
        greetingElement.textContent = getGreeting(now);
    }

    /**
     * Format time based on 12/24 hour preference.
     * @param {Date} date - The date object.
     * @param {boolean} use24Hour - True for 24-hour format, false for 12-hour.
     * @returns {string} Formatted time string.
     */
    function formatTime(date, use24Hour) {
        let hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, "0");
        const seconds = date.getSeconds().toString().padStart(2, "0");
        const ampm = hours >= 12 ? "PM" : "AM";

        if (!use24Hour) {
            hours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
            return `${hours}:${minutes}:${seconds} ${ampm}`;
        }
        return `${hours.toString().padStart(2, "0")}:${minutes}:${seconds}`;
    }

    /**
     * Return appropriate greeting based on hour of day.
     * @param {Date} date - The date object.
     * @returns {string} Greeting message.
     */
    function getGreeting(date) {
        const hour = date.getHours();
        if (hour < 6) return GREETINGS[0];      // Night
        if (hour < 12) return GREETINGS[1];     // Morning
        if (hour < 18) return GREETINGS[2];     // Afternoon
        return GREETINGS[3];                     // Evening
    }

    // -------------------- Date Handling --------------------
    function updateDate() {
        const now = new Date();
        dateElement.textContent = formatGregorianDate(now);
        hijriDateElement.textContent = formatHijriDate(now);
    }

    /**
     * Format Gregorian date in English (weekday, month, day, year).
     * @param {Date} date - The date object.
     * @returns {string} Formatted Gregorian date.
     */
    function formatGregorianDate(date) {
        const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
        return date.toLocaleDateString("en-US", options);
    }

    /**
     * Calculate and format Hijri date using Umm al-Qura algorithm.
     * Falls back to approximate calculation if Intl is not supported.
     * @param {Date} date - The Gregorian date object.
     * @returns {string} Hijri date string (e.g., "1 Ramadan 1445").
     */
    function formatHijriDate(date) {
        try {
            // Use browser's built-in Islamic calendar if available
            const options = { calendar: 'islamic-umalqura', day: 'numeric', month: 'long', year: 'numeric' };
            const formatter = new Intl.DateTimeFormat('en-US', options);
            const parts = formatter.formatToParts(date);
            const day = parts.find(p => p.type === 'day')?.value;
            const month = parts.find(p => p.type === 'month')?.value;
            const year = parts.find(p => p.type === 'year')?.value;
            if (day && month && year) {
                return `${day} ${month} ${year}`;
            }
            throw new Error('Intl format failed');
        } catch (e) {
            // Fallback to approximate calculation
            return calculateHijriApprox(date);
        }
    }

    /**
     * Approximate Hijri date calculation (used as fallback).
     * @param {Date} gregorianDate - The Gregorian date.
     * @returns {string} Approximate Hijri date.
     */
    function calculateHijriApprox(gregorianDate) {
        // Julian date of Hijri epoch (July 16, 622 CE)
        const HIJRI_EPOCH = 1948439.5;
        // Milliseconds to Julian days conversion
        const MS_PER_DAY = 86400000;
        const JULIAN_OFFSET = 2440587.5;

        const julianDate = (gregorianDate.getTime() / MS_PER_DAY) + JULIAN_OFFSET;
        const hijriDays = Math.floor(julianDate - HIJRI_EPOCH);
        const hijriYear = Math.floor(hijriDays / 354.367);
        const remainingDays = hijriDays % 354.367;
        const hijriMonth = Math.floor(remainingDays / 29.5);
        const hijriDay = Math.floor(remainingDays % 29.5) + 1; // +1 because days start at 1

        return `${hijriDay} ${HIJRI_MONTHS[hijriMonth] || 'Unknown'} ${hijriYear}`;
    }

    // -------------------- Start the application --------------------
    init();
})();