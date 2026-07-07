/**
 * app.js — all booking-form behavior (pricing, calendar, availability,
 * validation, PayPal, email/webhook notifications).
 *
 * This is the ONLY copy of the logic. It reads every piece of user-facing
 * text from the current language's entry in I18N (see i18n.js) via the
 * `T` variable. There is no hardcoded Russian or English text in this file.
 *
 * If you need to change how the form calculates prices, handles dates,
 * talks to PayPal, or sends notifications — this is the file to edit,
 * and the change applies to every language automatically.
 */

// ============ LANGUAGE DETECTION ============
function detectLang() {
    const params = new URLSearchParams(window.location.search);
    const urlLang = params.get('lang');
    if (urlLang && SUPPORTED_LANGS.includes(urlLang)) return urlLang;

    const nav = (navigator.language || navigator.userLanguage || '').toLowerCase();
    for (const lang of SUPPORTED_LANGS) {
        if (nav.startsWith(lang)) return lang;
    }
    return DEFAULT_LANG;
}

const CURRENT_LANG = detectLang();
const T = I18N[CURRENT_LANG];

// ============ APPLY STATIC TRANSLATIONS ============
function translateStaticText() {
    document.documentElement.lang = T.htmlLang;
    document.title = T.docTitle;

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const val = T.ui[key];
        if (val !== undefined) el.textContent = val;
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        const val = T.ui[key];
        if (val !== undefined) el.placeholder = val;
    });

    renderWeekdayHeader();
}

function renderWeekdayHeader() {
    const el = document.getElementById('weekdaysHeader');
    el.innerHTML = T.weekdayLabels.map(label => `<div>${label}</div>`).join('');
}

function populateSelect(selectEl, placeholderLabel, options, currentValue) {
    const placeholderOption = placeholderLabel !== null
        ? `<option value="">${placeholderLabel}</option>` : '';
    const optionsHtml = options.map(o => `<option value="${o.value}">${o.label}</option>`).join('');
    selectEl.innerHTML = placeholderOption + optionsHtml;
    if (currentValue && options.some(o => o.value === currentValue)) {
        selectEl.value = currentValue;
    }
}

// ============ GLOBAL STATE ============
const state = {
    sport: 'ski',
    duration: '2',
    participants: 1,
    days: 1,
    lessons: [],
    currentLessonIndex: 0,
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),

    prices: {
        ski: {
            '2': { base: 100, additional: 40 },
            '3': { base: 140, additional: 50 },
            'full': { base: 250, additional: 80 }
        },
        snowboard: {
            '2': { base: 100, additional: 40 },
            '3': { base: 140, additional: 50 },
            'full': { base: 250, additional: 80 }
        },
        kids: {
            'full': 150,
            'half-lunch': 110,
            'half-nolunch': 90
        }
    },

    getDiscount: function () {
        if (this.sport === 'kids') {
            if (this.days >= 7) return 0.15;
            if (this.days >= 5) return 0.10;
            return 0;
        } else {
            if (this.days >= 8) return 0.20;
            if (this.days >= 6) return 0.15;
            if (this.days >= 4) return 0.10;
            return 0;
        }
    },

    getTimeSlots: function () {
        if (this.sport === 'kids') {
            return ['10:30'];
        }

        if (this.duration === '2') {
            return ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00'];
        } else if (this.duration === '3') {
            return ['10:00', '11:00', '12:00', '13:00', '14:00'];
        } else if (this.duration === 'full') {
            return ['10:00'];
        }

        return ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];
    },

    bookingPeriod: {
        startDate: new Date('2026-07-07'),
        endDate: new Date('2026-07-10')
    }
};

// ============ AVAILABILITY CHECK ============
const AVAILABILITY_API_URL = 'https://script.google.com/macros/s/AKfycbyzf3hmuOVckf_3Td9ca-zD-Ruov_gK0JpDYK3L2fH882eNG_4YJczTfkmiHrOnojyVwQ/exec';

// Sent with the booking webhook so the bot can reject requests that didn't
// come from this form. NOTE: since this file runs in the browser, anyone
// can view-source and read this value — it only stops casual/opportunistic
// abuse of the URL, not a deliberate attacker. The real protection against
// fake "paid" bookings is the server verifying the payment directly with
// PayPal (see the bot's index.js) — set this to the SAME value as the
// bot's BOOKING_WEBHOOK_SECRET environment variable.
const BOOKING_WEBHOOK_SECRET = '034f9ba3335b35e8f7eba1d58b7d2be93762e36d415e5396cc20aa962b3401f5';

const availabilityCache = new Map();

async function checkTimeSlotAvailability(dateStr, sport, duration, time) {
    const cacheKey = `${dateStr}_${sport}_${duration}_${time}`;
    if (availabilityCache.has(cacheKey)) {
        return availabilityCache.get(cacheKey);
    }

    try {
        const url = `${AVAILABILITY_API_URL}?date=${dateStr}&sport=${sport}&duration=${duration}&time=${time}`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        availabilityCache.set(cacheKey, data.available);
        return data.available;

    } catch (error) {
        console.error('Time slot availability check failed:', error);
        availabilityCache.set(cacheKey, true);
        return true;
    }
}

async function getAvailableTimeSlots(dateStr, sport, duration) {
    const cacheKey = `${dateStr}_${sport}_${duration}`;

    if (availabilityCache.has(cacheKey)) {
        return availabilityCache.get(cacheKey);
    }

    try {
        const url = `${AVAILABILITY_API_URL}?action=getAvailableSlots&date=${dateStr}&sport=${sport}&duration=${duration}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        availabilityCache.set(cacheKey, data.availableSlots);
        return data.availableSlots;

    } catch (error) {
        console.error('Batch time slots check failed:', error);

        try {
            const timeSlots = state.getTimeSlots();
            const availableSlots = [];

            for (const time of timeSlots) {
                const isAvailable = await checkTimeSlotAvailability(dateStr, sport, duration, time);
                if (isAvailable) {
                    availableSlots.push(time);
                }
            }

            availabilityCache.set(cacheKey, availableSlots);
            return availableSlots;
        } catch (error2) {
            console.error('Individual checks also failed, returning all slots as available', error2);
            const fallbackSlots = state.getTimeSlots();
            availabilityCache.set(cacheKey, fallbackSlots);
            return fallbackSlots;
        }
    }
}

let phoneInput;
let paypalButtons;

emailjs.init('gb9ZTULk6-ghDTZuV');

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', function () {
    translateStaticText();

    const phoneEl = document.querySelector('#phone');
    if (phoneEl) {
        phoneInput = window.intlTelInput(phoneEl, {
            initialCountry: 'ge',
            preferredCountries: ['ge', 'us', 'ru'],
            utilsScript: 'https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/js/utils.js'
        });
    }

    initStep1();
    updatePrices();

    // Reveal the page now that translated text is in place (avoids a flash
    // of untranslated / placeholder markup).
    document.documentElement.style.visibility = 'visible';
});

// ============ STEP 1: LESSON DETAILS ============
function initStep1() {
    populateSelect(document.getElementById('duration'), null, T.durationOptions, state.duration);
    populateSelect(document.getElementById('kidsDurationSelect'), null, T.kidsDurationOptions, state.duration);
    document.getElementById('participantsValue').textContent = T.participantsLabel(state.participants);
    document.getElementById('kidsValue').textContent = T.kidsLabel(state.participants);
    document.getElementById('daysValue').textContent = T.daysLabel(state.days);
    document.getElementById('kidsDaysValue').textContent = T.daysLabel(state.days);

    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function (e) {
            e.preventDefault();

            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            state.sport = this.dataset.sport;

            if (state.sport === 'kids') {
                document.getElementById('skiSnowboardDuration').style.display = 'none';
                document.getElementById('kidsDuration').style.display = 'block';
                document.getElementById('skiSnowboardParticipants').style.display = 'none';
                document.getElementById('kidsParticipants').style.display = 'block';
                document.getElementById('skiSnowboardDays').style.display = 'none';
                document.getElementById('kidsDays').style.display = 'block';
                state.duration = 'full';
            } else {
                document.getElementById('skiSnowboardDuration').style.display = 'block';
                document.getElementById('kidsDuration').style.display = 'none';
                document.getElementById('skiSnowboardParticipants').style.display = 'block';
                document.getElementById('kidsParticipants').style.display = 'none';
                document.getElementById('skiSnowboardDays').style.display = 'block';
                document.getElementById('kidsDays').style.display = 'none';
                state.duration = '2';
            }

            availabilityCache.clear();
            updatePrices();
        });
    });

    document.getElementById('duration').addEventListener('change', function () {
        state.duration = this.value;
        availabilityCache.clear();
        updatePrices();
    });

    document.getElementById('kidsDurationSelect').addEventListener('change', function () {
        state.duration = this.value;
        availabilityCache.clear();
        updatePrices();
    });

    document.getElementById('participants').addEventListener('input', function () {
        state.participants = parseInt(this.value);
        document.getElementById('participantsValue').textContent = T.participantsLabel(state.participants);
        updatePrices();
    });

    document.getElementById('kids').addEventListener('input', function () {
        state.participants = parseInt(this.value);
        document.getElementById('kidsValue').textContent = T.kidsLabel(state.participants);
        updatePrices();
    });

    document.getElementById('days').addEventListener('input', function () {
        state.days = parseInt(this.value);
        document.getElementById('daysValue').textContent = T.daysLabel(state.days);
        updatePrices();
    });

    document.getElementById('kidsDaysSlider').addEventListener('input', function () {
        state.days = parseInt(this.value);
        document.getElementById('kidsDaysValue').textContent = T.daysLabel(state.days);
        updatePrices();
    });

    document.getElementById('nextToStep2').addEventListener('click', function () {
        initStep2();
        showStep('step2');
    });
}

function calculatePrice() {
    let totalPrice = 0;

    if (state.sport === 'kids') {
        const pricePerKid = state.prices.kids[state.duration];
        let pricePerDay = pricePerKid * state.participants;

        const fullPriceDays = Math.min(4, state.days);
        totalPrice = pricePerDay * fullPriceDays;

        if (state.days > 4) {
            const discountRate = state.getDiscount();
            const discountedDays = state.days - 4;
            const discountedPrice = pricePerDay * (1 - discountRate);
            totalPrice += discountedPrice * discountedDays;
        }
    } else {
        const priceConfig = state.prices[state.sport][state.duration];
        let pricePerDay = priceConfig.base;

        if (state.participants > 1) {
            pricePerDay += (state.participants - 1) * priceConfig.additional;
        }

        const fullPriceDays = Math.min(3, state.days);
        totalPrice = pricePerDay * fullPriceDays;

        if (state.days > 3) {
            const discountRate = state.getDiscount();
            const discountedDays = state.days - 3;
            const discountedPrice = pricePerDay * (1 - discountRate);
            totalPrice += discountedPrice * discountedDays;
        }
    }

    totalPrice = Math.round(totalPrice);
    const depositPrice = Math.round(totalPrice * 0.2);
    const remainingPrice = totalPrice - depositPrice;

    const discountRate = state.getDiscount();
    let discountAmount = 0;

    if (discountRate > 0) {
        if (state.sport === 'kids') {
            const pricePerKid = state.prices.kids[state.duration];
            let pricePerDay = pricePerKid * state.participants;
            const discountedDays = state.days - (state.days >= 7 ? 4 : (state.days >= 5 ? 4 : 0));
            discountAmount = Math.round(pricePerDay * discountRate * discountedDays);
        } else {
            const priceConfig = state.prices[state.sport][state.duration];
            let pricePerDay = priceConfig.base;
            if (state.participants > 1) {
                pricePerDay += (state.participants - 1) * priceConfig.additional;
            }
            const discountedDays = state.days - 3;
            discountAmount = Math.round(pricePerDay * discountRate * discountedDays);
        }
    }

    return { totalPrice, depositPrice, remainingPrice, discountAmount, discountRate };
}

function updatePrices() {
    const prices = calculatePrice();

    ['', 'Step2', 'Step3'].forEach(suffix => {
        document.getElementById(`totalPrice${suffix}`).textContent = `$${prices.totalPrice}`;
        document.getElementById(`depositPrice${suffix}`).textContent = `$${prices.depositPrice}`;
        document.getElementById(`remainingPrice${suffix}`).textContent = `$${prices.remainingPrice}`;
    });

    updateSummary();

    const discountEls = ['discountInfo', 'discountInfoStep2', 'discountInfoStep3'];
    if (prices.discountRate > 0) {
        let text = '';
        if (state.sport === 'kids') {
            if (prices.discountRate === 0.15) {
                text = T.discountTextKids15(state.days, prices.discountAmount);
            } else if (prices.discountRate === 0.10) {
                text = T.discountTextKids10(prices.discountAmount);
            }
        } else {
            const ratePct = (prices.discountRate * 100).toFixed(0);
            const range = T.discountRange[prices.discountRate];
            text = T.discountTextGeneral(ratePct, range, prices.discountAmount);
        }

        discountEls.forEach(id => {
            const el = document.getElementById(id);
            el.textContent = text;
            el.classList.add('show');
        });
    } else {
        discountEls.forEach(id => {
            document.getElementById(id).classList.remove('show');
        });
    }
}

function updateSummary() {
    const sportName = T.sportNamePrepositional[state.sport];

    let durationText = '';
    if (state.sport === 'kids') {
        durationText = T.kidsDurationDisplay[state.duration];
    } else {
        durationText = CURRENT_LANG === 'ru'
            ? `Занятие на ${sportName} ${T.durationDisplay[state.duration]}`
            : `${T.durationDisplay[state.duration]} ${sportName} Lesson`;
    }

    const participantText = state.sport === 'kids' ? T.kidsLabel(state.participants) : T.participantsLabel(state.participants);
    const detailsText = T.summaryDetails(participantText, state.days);

    ['step1', 'step2', 'step3'].forEach(step => {
        const titleEl = document.getElementById(`${step}SummaryTitle`);
        const detailsEl = document.getElementById(`${step}SummaryDetails`);
        if (titleEl) titleEl.textContent = durationText;
        if (detailsEl) detailsEl.textContent = detailsText;
    });
}

// ============ STEP 2: SCHEDULE (MULTIPLE SELECTION) ============
function initStep2() {
    state.lessons = [];
    for (let i = 0; i < state.days; i++) {
        state.lessons.push({
            number: i + 1,
            date: null,
            time: null
        });
    }

    state.currentLessonIndex = 0;

    renderCalendar();
    renderTimeSlots();
    updateStep2DatesList();

    document.getElementById('backToStep1').addEventListener('click', function () {
        showStep('step1');
    });

    document.getElementById('nextToStep3').addEventListener('click', function () {
        updateStep3DatesList();
        initStep3();
        showStep('step3');
    });

    document.getElementById('prevMonth').addEventListener('click', function () {
        state.currentMonth--;
        if (state.currentMonth < 0) {
            state.currentMonth = 11;
            state.currentYear--;
        }
        renderCalendar();
    });

    document.getElementById('nextMonth').addEventListener('click', function () {
        state.currentMonth++;
        if (state.currentMonth > 11) {
            state.currentMonth = 0;
            state.currentYear++;
        }
        renderCalendar();
    });
}

function updateStep2DatesList() {
    const datesList = document.getElementById('step2DatesList');
    datesList.innerHTML = '';

    state.lessons.forEach((lesson, index) => {
        const item = document.createElement('div');
        item.className = 'summary-date-item';

        if (state.currentLessonIndex === index) {
            item.classList.add('selected');
        }

        if (lesson.date && lesson.time) {
            item.classList.add('completed');
            item.textContent = `${formatDateShort(lesson.date)} ${lesson.time}`;
        } else {
            item.textContent = T.calendar.dayLabel(lesson.number);
        }

        item.addEventListener('click', function () {
            selectLessonDay(index);
        });

        datesList.appendChild(item);
    });
}

function selectLessonDay(index) {
    state.currentLessonIndex = index;
    updateStep2DatesList();
    renderCalendar();
    renderTimeSlots();
}

function renderCalendar() {
    const calendarDays = document.getElementById('calendarDays');
    const calendarMonth = document.getElementById('calendarMonth');

    calendarDays.innerHTML = '';

    calendarMonth.textContent = `${T.monthNames[state.currentMonth]} ${state.currentYear}`;

    const firstDay = new Date(state.currentYear, state.currentMonth, 1);
    const lastDay = new Date(state.currentYear, state.currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();

    let startDay = firstDay.getDay();
    if (T.weekStartsMonday) {
        startDay = startDay === 0 ? 6 : startDay - 1;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const bookingStart = new Date(state.bookingPeriod.startDate);
    bookingStart.setHours(0, 0, 0, 0);
    const bookingEnd = new Date(state.bookingPeriod.endDate);
    bookingEnd.setHours(0, 0, 0, 0);

    for (let i = 0; i < startDay; i++) {
        const emptyDay = document.createElement('button');
        emptyDay.className = 'day disabled other-month';
        emptyDay.disabled = true;
        calendarDays.appendChild(emptyDay);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dayButton = document.createElement('button');
        dayButton.className = 'day';
        dayButton.type = 'button';
        dayButton.textContent = day;

        const currentDate = new Date(state.currentYear, state.currentMonth, day);
        currentDate.setHours(0, 0, 0, 0);

        if (currentDate < today || currentDate < bookingStart || currentDate > bookingEnd) {
            dayButton.classList.add('disabled');
            dayButton.disabled = true;
        }

        if (currentDate.getTime() === today.getTime()) {
            dayButton.classList.add('today');
        }

        const isBooked = state.lessons.some(lesson => {
            if (!lesson.date) return false;
            const lessonDate = new Date(lesson.date + 'T00:00:00');
            return lessonDate.getFullYear() === state.currentYear &&
                lessonDate.getMonth() === state.currentMonth &&
                lessonDate.getDate() === day;
        });

        if (isBooked) {
            dayButton.classList.add('booked');
        }

        const lesson = state.lessons[state.currentLessonIndex];
        if (lesson && lesson.date) {
            const lessonDate = new Date(lesson.date + 'T00:00:00');
            if (lessonDate.getFullYear() === state.currentYear &&
                lessonDate.getMonth() === state.currentMonth &&
                lessonDate.getDate() === day) {
                dayButton.classList.add('selected');
            }
        }

        if (!dayButton.disabled) {
            dayButton.addEventListener('click', function () {
                selectDate(state.currentYear, state.currentMonth, day);
            });
        }

        calendarDays.appendChild(dayButton);
    }
}

async function selectDate(year, month, day) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    state.lessons[state.currentLessonIndex].date = dateStr;

    renderCalendar();
    await renderTimeSlots();
    updateStep2DatesList();
    checkStep2Complete();
}

function isTimeSlotAvailable(time, currentLessonIndex) {
    const currentLesson = state.lessons[currentLessonIndex];
    if (!currentLesson.date) return true;

    for (let i = 0; i < state.lessons.length; i++) {
        if (i === currentLessonIndex) continue;

        const otherLesson = state.lessons[i];
        if (!otherLesson.date || !otherLesson.time) continue;
        if (otherLesson.date !== currentLesson.date) continue;

        const otherStartTime = parseInt(otherLesson.time.split(':')[0]);
        const currentStartTime = parseInt(time.split(':')[0]);

        let otherDuration = 1;
        if (state.duration === '2') otherDuration = 2;
        else if (state.duration === '3') otherDuration = 3;
        else if (state.duration === 'full') otherDuration = 7;

        let currentDuration = 1;
        if (state.duration === '2') currentDuration = 2;
        else if (state.duration === '3') currentDuration = 3;
        else if (state.duration === 'full') currentDuration = 7;

        const otherEndTime = otherStartTime + otherDuration;
        const currentEndTime = currentStartTime + currentDuration;

        if (currentStartTime < otherEndTime && currentEndTime > otherStartTime) {
            return false;
        }
    }

    return true;
}

async function renderTimeSlots() {
    const container = document.getElementById('timeSlots');

    container.innerHTML = `
        <div class="loading-message">
            <div class="loading-spinner-small"></div>
            <div>${T.ui['timeSlots.loading']}</div>
        </div>
    `;

    const timeSlots = state.getTimeSlots();
    const lesson = state.lessons[state.currentLessonIndex];
    const dateSelected = lesson && lesson.date;

    if (!dateSelected) {
        container.innerHTML = '';
        timeSlots.forEach(time => {
            const btn = document.createElement('button');
            btn.className = 'time-slot disabled';
            btn.type = 'button';
            btn.textContent = time;
            btn.disabled = true;
            container.appendChild(btn);
        });
        return;
    }

    try {
        const availableSlots = await getAvailableTimeSlots(lesson.date, state.sport, state.duration);

        container.innerHTML = '';

        for (const time of timeSlots) {
            const btn = document.createElement('button');
            btn.className = 'time-slot';
            btn.type = 'button';
            btn.textContent = time;

            const isAvailable = availableSlots.includes(time);
            const isConflict = !isTimeSlotAvailable(time, state.currentLessonIndex);

            if (!isAvailable || isConflict) {
                btn.classList.add('disabled');
                btn.disabled = true;
            }

            if (lesson && lesson.time === time) {
                btn.classList.add('selected');
            }

            if (!btn.disabled) {
                btn.addEventListener('click', function () {
                    selectTime(time);
                });
            }

            container.appendChild(btn);
        }

    } catch (error) {
        console.error('Error loading time slots:', error);

        container.innerHTML = '';
        timeSlots.forEach(time => {
            const btn = document.createElement('button');
            btn.className = 'time-slot';
            btn.type = 'button';
            btn.textContent = time;

            if (lesson && lesson.time === time) {
                btn.classList.add('selected');
            }

            btn.addEventListener('click', function () {
                selectTime(time);
            });

            container.appendChild(btn);
        });
    }
}

async function selectTime(time) {
    const lesson = state.lessons[state.currentLessonIndex];

    if (!lesson.date) {
        alert(T.alerts.selectDateFirst);
        return;
    }

    const isAvailable = await checkTimeSlotAvailability(lesson.date, state.sport, state.duration, time);

    if (!isAvailable) {
        alert(T.alerts.slotUnavailable);
        return;
    }

    state.lessons[state.currentLessonIndex].time = time;

    renderTimeSlots();
    updateStep2DatesList();
    checkStep2Complete();

    const nextIncomplete = state.lessons.findIndex((l, i) =>
        i > state.currentLessonIndex && (!l.date || !l.time)
    );

    if (nextIncomplete !== -1) {
        setTimeout(() => selectLessonDay(nextIncomplete), 300);
    }
}

function updateStep3DatesList() {
    const datesList = document.getElementById('step3DatesList');
    datesList.innerHTML = '';

    state.lessons.forEach(lesson => {
        if (lesson.date && lesson.time) {
            const item = document.createElement('div');
            item.className = 'summary-date-item';
            item.textContent = `${formatDateShort(lesson.date)} ${lesson.time}`;
            datesList.appendChild(item);
        }
    });
}

function checkStep2Complete() {
    const allComplete = state.lessons.every(l => l.date && l.time);
    document.getElementById('nextToStep3').disabled = !allComplete;
}

function formatDateShort(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    const day = date.getDate();
    return `${day} ${T.monthNamesShort[date.getMonth()]}`;
}

function formatDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString(T.dateLocale, options);
}

// ============ STEP 3: PERSONAL INFORMATION ============
function initStep3() {
    document.getElementById('backToStep2').addEventListener('click', function () {
        showStep('step2');
    });

    updateStep3Fields();

    const paypalContainer = document.getElementById('paypal-button-container');
    paypalContainer.innerHTML = '';
    initPayPal();
}

function updateStep3Fields() {
    const ageInput = document.getElementById('age');
    const skillSelect = document.getElementById('skillLevel');
    const languageSelect = document.getElementById('language');

    const currentSkill = skillSelect.value;
    const currentLanguage = languageSelect.value;

    if (state.sport === 'kids') {
        ageInput.min = 5;
        ageInput.max = 13;
        populateSelect(skillSelect, T.skillLevelOptions.placeholder, T.skillLevelOptions.kids, currentSkill);
        populateSelect(languageSelect, T.languageOptions.placeholder, T.languageOptions.kids, currentLanguage);
    } else {
        ageInput.min = 5;
        ageInput.max = 80;
        populateSelect(skillSelect, T.skillLevelOptions.placeholder, T.skillLevelOptions.adult, currentSkill);
        populateSelect(languageSelect, T.languageOptions.placeholder, T.languageOptions.adult, currentLanguage);
    }
}

function validateForm() {
    let isValid = true;

    const fullName = document.getElementById('fullName').value.trim();
    if (fullName === '') {
        document.getElementById('fullNameError').classList.add('show');
        isValid = false;
    } else {
        document.getElementById('fullNameError').classList.remove('show');
    }

    if (!phoneInput || !phoneInput.isValidNumber()) {
        document.getElementById('phoneError').classList.add('show');
        isValid = false;
    } else {
        document.getElementById('phoneError').classList.remove('show');
    }

    const email = document.getElementById('email').value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        document.getElementById('emailError').classList.add('show');
        isValid = false;
    } else {
        document.getElementById('emailError').classList.remove('show');
    }

    const age = parseInt(document.getElementById('age').value);
    if (isNaN(age) || age < 5 || age > 80) {
        document.getElementById('ageError').classList.add('show');
        isValid = false;
    } else {
        document.getElementById('ageError').classList.remove('show');
    }

    const skillLevel = document.getElementById('skillLevel').value;
    if (skillLevel === '') {
        document.getElementById('skillLevelError').classList.add('show');
        isValid = false;
    } else {
        document.getElementById('skillLevelError').classList.remove('show');
    }

    const language = document.getElementById('language').value;
    if (language === '') {
        document.getElementById('languageError').classList.add('show');
        isValid = false;
    } else {
        document.getElementById('languageError').classList.remove('show');
    }

    return isValid;
}

function initPayPal() {
    const prices = calculatePrice();

    paypalButtons = paypal.Buttons({
        style: {
            layout: 'vertical',
            color: 'gold',
            shape: 'pill',
            label: 'paypal',
            height: 55
        },
        createOrder: function (data, actions) {
            if (!validateForm()) {
                alert(T.alerts.fillRequired);
                return actions.reject();
            }

            return actions.order.create({
                purchase_units: [{
                    description: T.paypalDescription(state.days, state.sport.toUpperCase()),
                    amount: {
                        value: prices.depositPrice.toFixed(2),
                        currency_code: 'USD'
                    }
                }],
                application_context: {
                    shipping_preference: 'NO_SHIPPING'
                }
            });
        },
        onApprove: function (data, actions) {
            showPaymentProcessing();
            return actions.order.capture().then(function (details) {
                console.log('Payment successful:', details);
                sendBookingNotifications(details);
                setTimeout(showSuccess, 1000);
            });
        },
        onCancel: function (data) {
            alert(T.alerts.paymentCancelled);
        },
        onError: function (err) {
            console.error('PayPal Error:', err);
            alert(T.alerts.paymentError);
        }
    });

    if (paypalButtons.isEligible()) {
        paypalButtons.render('#paypal-button-container');
    }
}

// ============ NOTIFICATION FUNCTIONS ============

function generateBookingId() {
    return 'BK' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
}

function sendBookingNotifications(paypalDetails) {
    const prices = calculatePrice();

    const bookingData = {
        bookingId: generateBookingId(),
        fullName: document.getElementById('fullName').value,
        phone: phoneInput.getNumber(),
        email: document.getElementById('email').value,
        age: document.getElementById('age').value,
        skillLevel: document.getElementById('skillLevel').value,
        language: document.getElementById('language').value,
        additionalInfo: document.getElementById('specialRequests').value || '',
        sport: state.sport,
        duration: state.duration,
        participants: state.participants,
        days: state.days,
        date: state.lessons[0].date,
        time: state.lessons[0].time,
        selectedDates: state.lessons.map(lesson => ({
            date: lesson.date,
            time: lesson.time
        })),
        total: prices.totalPrice,
        deposit: prices.depositPrice,
        remaining: prices.remainingPrice,
        paymentStatus: 'COMPLETED',
        paymentId: paypalDetails.id,
        payerEmail: paypalDetails.payer.email_address
    };

    console.log('Sending booking data to bot:', bookingData);

    sendToBot(bookingData);
    sendEmailNotification(bookingData);
}

function sendToBot(bookingData) {
    const webhookUrl = 'https://skischoolgebot-production.up.railway.app/webhook/booking';

    const botData = {
        bookingId: bookingData.bookingId,
        fullName: bookingData.fullName,
        phone: bookingData.phone,
        email: bookingData.email,
        age: bookingData.age,
        skillLevel: bookingData.skillLevel,
        preferredLanguage: bookingData.language,
        additionalInfo: bookingData.additionalInfo,
        sport: bookingData.sport,
        duration: bookingData.duration,
        participants: bookingData.participants,
        days: bookingData.days,
        date: bookingData.date,
        time: bookingData.time,
        selectedDates: bookingData.selectedDates,
        total: bookingData.total,
        deposit: bookingData.deposit,
        remaining: bookingData.remaining,
        paymentStatus: 'COMPLETED',
        paymentId: bookingData.paymentId,
        payerEmail: bookingData.payerEmail
    };

    fetch(webhookUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Booking-Secret': BOOKING_WEBHOOK_SECRET
        },
        body: JSON.stringify(botData)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .catch(error => {
            console.error('Bot error:', error);
        });
}

function sendEmailNotification(data) {
    let datesText = '';
    if (data.selectedDates && data.selectedDates.length > 0) {
        datesText = data.selectedDates.map((dt, index) =>
            T.emailScheduleLine(index, formatDate(dt.date), dt.time)
        ).join('\n');
    } else {
        datesText = `${formatDate(data.date)} ${data.time}`;
    }

    const sportName = T.sportNamePrepositional[data.sport];

    const durationText = data.sport === 'kids'
        ? T.kidsDurationDisplayWithHours[data.duration]
        : T.durationDisplay[data.duration];

    const calendarLinks = generateCalendarLinksOld(data);
    const L = T.emailLabels;

    const body = `
${T.emailIntro(durationText, sportName, data.participants, data.days)}

${L.scheduleHeader}
${datesText}

${L.paymentStatus}
${L.paymentId} ${data.paymentId}
${L.payerEmail} ${data.payerEmail}

${L.bookingId} ${data.bookingId}
${L.fullName} ${data.fullName}
${L.phone} ${data.phone}
${L.email} ${data.email}
${L.age} ${data.age}
${L.skillLevel} ${data.skillLevel}
${L.preferredLanguage} ${data.language}
${L.additionalInfo} ${data.additionalInfo || L.none}

${L.totalAmount} $${data.total}
${L.deposit} $${data.deposit}
${L.remaining} $${data.remaining}

${L.calendarLinks}
${calendarLinks}
    `.trim();

    const toEmail = 'info@skischool.ge';
    const subject = T.emailSubject(durationText, sportName);

    emailjs.send('service_0tuoznd', 'template_jiiwo1f', {
        to_email: toEmail,
        subject: subject,
        message: body,
        from_name: data.fullName,
        from_email: data.email,
        phone: data.phone
    }).then(function (response) {
        console.log('Email sent successfully:', response.status, response.text);
    }).catch(function (error) {
        console.error('Email sending failed:', error);
        const mailto = `mailto:${toEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(mailto, '_blank');
    });
}

function generateCalendarLinksOld(data) {
    if (!data.selectedDates || data.selectedDates.length === 0) return 'N/A';

    const DL = T.calendar.descriptionLabels;

    return data.selectedDates.map((lesson, index) => {
        const start = new Date(lesson.date + 'T' + lesson.time + ':00');
        const end = new Date(start);

        let durationHours = 2;
        if (data.duration === '3') durationHours = 3;
        else if (data.duration === 'full') durationHours = 8;
        else if (data.duration.includes('half')) durationHours = 4;

        end.setHours(start.getHours() + durationHours);

        const sportName = T.sportNamePrepositional[data.sport];
        const title = T.calendar.eventTitle(sportName, data.fullName);

        const description = `${DL.client} ${data.fullName}
${DL.phone} ${data.phone}
${DL.email} ${data.email}
${DL.participants} ${data.participants}
${DL.level} ${data.skillLevel}
${DL.days} ${data.days}

${DL.additionalInfo} ${data.additionalInfo || DL.none}

${DL.meetingPoint}`;

        const location = T.calendar.location;

        const params = new URLSearchParams({
            action: 'TEMPLATE',
            text: title,
            dates: `${formatGoogleDate(start)}/${formatGoogleDate(end)}`,
            details: description,
            location: location
        });

        return `${T.calendar.dayPrefix(index)} https://calendar.google.com/calendar/render?${params}`;
    }).join('\n');
}

function formatGoogleDate(date) {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

// ============ UTILITIES ============
function showStep(stepId) {
    document.querySelectorAll('.form-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(stepId).classList.add('active');
}

function showPaymentProcessing() {
    document.querySelectorAll('.form-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById('paymentProcessing').classList.add('active');
}

function showSuccess() {
    document.querySelectorAll('.form-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById('successScreen').classList.add('active');
}
