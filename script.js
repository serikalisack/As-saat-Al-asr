document.addEventListener("DOMContentLoaded", () => {
    const clockElement = document.getElementById("clock");
    const dateElement = document.getElementById("date");
    const hijriDateElement = document.getElementById("hijri-date");
    const greetingElement = document.getElementById("greeting");

    const toggle12_24 = document.getElementById("toggle-12-24");
    const toggleGregorian = document.getElementById("toggle-gregorian");
    const toggleHijri = document.getElementById("toggle-hijri");

    let is24HourFormat = false;

    toggle12_24.addEventListener("change", () => {
        is24HourFormat = toggle12_24.checked;
        updateClock();
    });

    toggleGregorian.addEventListener("change", () => {
        dateElement.style.display = toggleGregorian.checked ? "block" : "none";
    });

    toggleHijri.addEventListener("change", () => {
        hijriDateElement.style.display = toggleHijri.checked ? "block" : "none";
    });

    function updateClock() {
        const now = new Date();
        const hours = is24HourFormat ? now.getHours() : ((now.getHours() % 12) || 12);
        const minutes = now.getMinutes().toString().padStart(2, "0");
        const seconds = now.getSeconds().toString().padStart(2, "0");
        const ampm = now.getHours() >= 12 ? "PM" : "AM";

        clockElement.textContent = is24HourFormat ? `${hours}:${minutes}:${seconds}` : `${hours}:${minutes}:${seconds} ${ampm}`;

        const greetings = ["Good Night", "Good Morning", "Good Afternoon", "Good Evening"];
        const hour = now.getHours();
        greetingElement.textContent =
            hour < 6 ? greetings[0] :
            hour < 12 ? greetings[1] :
            hour < 18 ? greetings[2] : greetings[3];
    }

    function updateDate() {
        const now = new Date();
        const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
        dateElement.textContent = now.toLocaleDateString("en-US", options);

        // Hijri date calculation (using a library like "hijri-date" is recommended for accuracy)
        const hijriDate = calculateHijriDate(now);
        hijriDateElement.textContent = hijriDate;
    }

    function calculateHijriDate(gregorianDate) {
        // Placeholder for Hijri date calculation logic
        // Replace with a library like "hijri-date" for accurate results
        return "Hijri Date Placeholder";
    }

    setInterval(() => {
        updateClock();
    }, 1000);

    updateDate();
});