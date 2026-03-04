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
nextPrayer: document.getElementById("next-prayer")
};

let state = loadPrefs();
applyPrefs(elements, state);
attachEvents(elements, state);

startClock(elements, state);
updateDate(elements);
loadIslamicContent(elements);

initLocation(elements, state);
initServiceWorker();
requestNotificationPermission();
}

/* CLOCK */
function startClock(el, state){
updateClock(el, state);
setInterval(()=> updateClock(el,state),1000);
}

function updateClock(el, state){
const now = new Date();
let hours = state.is24 ? now.getHours() : ((now.getHours()%12)||12);
let minutes = String(now.getMinutes()).padStart(2,"0");
let seconds = String(now.getSeconds()).padStart(2,"0");
let ampm = now.getHours()>=12?"PM":"AM";

el.clock.textContent = state.is24 ?
`${hours}:${minutes}:${seconds}` :
`${hours}:${minutes}:${seconds} ${ampm}`;

el.greeting.textContent = getGreeting(now.getHours());
}

/* DATE */
function updateDate(el){
const now = new Date();

el.date.textContent = new Intl.DateTimeFormat("en-US",
{weekday:"long",year:"numeric",month:"long",day:"numeric"}).format(now);

el.hijri.textContent = new Intl.DateTimeFormat("en-TZ-u-ca-islamic",
{day:"numeric",month:"long",year:"numeric"}).format(now);
}

/* QIBLA PRECISE CALCULATION */
function calculateQibla(lat, lon){

const toRad = d => d * Math.PI/180;
const toDeg = r => r * 180/Math.PI;

const φ1 = toRad(lat);
const φ2 = toRad(KAABA_LAT);
const Δλ = toRad(KAABA_LON - lon);

const y = Math.sin(Δλ);
const x = Math.cos(φ1)*Math.tan(φ2) - Math.sin(φ1)*Math.cos(Δλ);

let θ = Math.atan2(y,x);
θ = (toDeg(θ)+360)%360;

return θ;
}

function initQiblaCompass(qiblaBearing, el){

if(window.DeviceOrientationEvent){
window.addEventListener("deviceorientationabsolute", e=>{
if(e.alpha !== null){
let heading = e.alpha;
let rotation = qiblaBearing - heading;
el.needle.style.transform = `translateX(-50%) rotate(${rotation}deg)`;
}
});
}

if(el.qiblaAngle) {
el.qiblaAngle.textContent = `Qibla Direction: ${qiblaBearing.toFixed(1)}°`;
}
}

/* LOCATION */
function initLocation(el,state){

if(state.city){
fetchPrayerByCity(el,state,state.city);
return;
}

navigator.geolocation.getCurrentPosition(pos=>{
let lat = pos.coords.latitude;
let lon = pos.coords.longitude;

let qibla = calculateQibla(lat,lon);
initQiblaCompass(qibla,el);

fetchPrayerByCoords(el,state,lat,lon);

});
}

/* PRAYER API */
async function fetchPrayerByCoords(el,state,lat,lon){
try {
let method = state.method || 2;
let madhab = state.madhab || 0;
let res = await fetch(
`https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=${method}&madhab=${madhab}`);
let data = await res.json();
window.todayTimings = data.data.timings;
renderPrayer(el,data.data.timings);
updateNextPrayer(el,data.data.timings);
} catch (error) {
console.error('Error fetching prayer times:', error);
if (el.prayerTimes) {
el.prayerTimes.innerHTML = '<div style="color: var(--accent-color);">Unable to fetch prayer times. Please check your connection.</div>';
}
}
}

async function fetchPrayerByCity(el,state,city){
try {
let method = state.method || 2;
let madhab = state.madhab || 0;
let res = await fetch(
`https://api.aladhan.com/v1/timingsByCity?city=${city}&country=Tanzania&method=${method}&madhab=${madhab}`);
let data = await res.json();
window.todayTimings = data.data.timings;
renderPrayer(el,data.data.timings);
updateNextPrayer(el,data.data.timings);
fetchMonthly(city,el);
} catch (error) {
console.error('Error fetching prayer times:', error);
if (el.prayerTimes) {
el.prayerTimes.innerHTML = '<div style="color: var(--accent-color);">Unable to fetch prayer times. Please check your connection.</div>';
}
}
}

function renderPrayer(el,t){
const prayers=["Fajr","Dhuhr","Asr","Maghrib","Isha"];
el.prayerTimes.innerHTML =
prayers.map(p=>{
let isCurrent = isCurrentPrayerTime(t[p]);
let className = isCurrent ? 'current-prayer' : '';
return `<div class="${className}">${p}: ${t[p]}</div>`;
}).join("");

setInterval(()=> checkAdhan(el),60000);
setInterval(()=> updateNextPrayer(el,t),60000);
}

function isCurrentPrayerTime(prayerTime){
let now=new Date().toTimeString().slice(0,5);
return prayerTime === now;
}

function updateNextPrayer(el,timings){
if(!timings || !el.nextPrayer) return;

const now = new Date();
const currentTime = now.toTimeString().slice(0,5);
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

if(prayerDate < now) {
prayerDate.setDate(prayerDate.getDate() + 1);
}

let diff = prayerDate - now;
if(diff < minDiff) {
minDiff = diff;
nextPrayer = prayer;
}
});

if(nextPrayer) {
let hours = Math.floor(minDiff / (1000 * 60 * 60));
let minutes = Math.floor((minDiff % (1000 * 60 * 60)) / (1000 * 60));
let timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
el.nextPrayer.textContent = `Next prayer: ${nextPrayer.name} in ${timeStr}`;
}
}

/* MONTHLY */
async function fetchMonthly(city,el){
const today = new Date();
let m=today.getMonth()+1;
let y=today.getFullYear();

let res = await fetch(
`https://api.aladhan.com/v1/calendarByCity?city=${city}&country=Tanzania&month=${m}&year=${y}&method=2`);
let data = await res.json();

el.monthly.innerHTML =
data.data.map(d=>`
<div>${d.date.gregorian.day} - Fajr ${d.timings.Fajr} | Maghrib ${d.timings.Maghrib}</div>
`).join("");
}

/* ADHAN */
function checkAdhan(el){
if(!window.todayTimings) return;

let now=new Date();
let current=now.toTimeString().slice(0,5);
["Fajr","Dhuhr","Asr","Maghrib","Isha"].forEach(p=>{
if(window.todayTimings[p]===current){
el.audio.play();
if(Notification.permission==="granted")
new Notification("Adhan",{body:p+" time has started"});
}
});
}

/* THEME + STORAGE */
function applyPrefs(el,state){
el.toggle24.checked=state.is24;
el.toggleTheme.checked=state.dark;
el.calculationMethod.value=state.method||2;
el.madhab.value=state.madhab||0;
document.body.classList.toggle("dark",state.dark);
}

function attachEvents(el,state){

el.toggle24.addEventListener("change",e=>{
state.is24=e.target.checked; savePrefs(state);
});

el.toggleTheme.addEventListener("change",e=>{
state.dark=e.target.checked;
document.body.classList.toggle("dark",state.dark);
savePrefs(state);
});

el.calculationMethod.addEventListener("change",e=>{
state.method=parseInt(e.target.value);
savePrefs(state);
location.reload();
});

el.madhab.addEventListener("change",e=>{
state.madhab=parseInt(e.target.value);
savePrefs(state);
location.reload();
});

el.citySelect.addEventListener("change",e=>{
state.city=e.target.value||null;
savePrefs(state);
location.reload();
});
}

function loadPrefs(){
return JSON.parse(localStorage.getItem(STORAGE_KEY))||
{is24:false,dark:false,city:null,method:2,madhab:0};
}

function savePrefs(s){
localStorage.setItem(STORAGE_KEY,JSON.stringify(s));
}

function getGreeting(h){
if(h<4)return"Good Night";
if(h<6)return"Time for Tahajjud";
if(h<12)return"Good Morning";
if(h<15)return"Good Afternoon";
if(h<18)return"Good Afternoon";
if(h<20)return"Good Evening";
return"Good Night";
}

/* ISLAMIC CONTENT */
function loadIslamicContent(el){
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

if(el.verseOfDay) {
el.verseOfDay.innerHTML = `${verses[verseIndex].text}<br><small style="color: var(--text-secondary);">${verses[verseIndex].reference}</small>`;
}

if(el.hadithOfDay) {
el.hadithOfDay.innerHTML = `${hadiths[hadithIndex].text}<br><small style="color: var(--text-secondary);">${hadiths[hadithIndex].reference}</small>`;
}
}

/* SERVICE WORKER */
function initServiceWorker(){
if("serviceWorker" in navigator) {
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

function requestNotificationPermission(){
if("Notification" in window)
Notification.requestPermission();
}