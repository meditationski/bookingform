// Configuration
const CONFIG = {
    prices: {'2': 100, '3': 140, 'full': 250},
    minDate: new Date(2025, 11, 15),
    maxDate: new Date(2026, 3, 30),
    resortCloseHour: 17,
    lessonStartHour: 10
};

// State
const State = {
    currentMonth: new Date(Math.max(new Date(), CONFIG.minDate)),
    selectedDate: null,
    selectedTime: null,
    currentStep: 1,
    
    init() {
        this.currentMonth.setDate(1);
    },
    
    getBookingTitle() {
        const activeSport = document.querySelector('.tab.active').dataset.sport;
        const duration = document.getElementById('duration').value;
        const participants = parseInt(document.getElementById('participants').value);
        const days = parseInt(document.getElementById('days').value);
        
        const durationText = {'2': '2 Hours', '3': '3 Hours', 'full': 'Full Day'}[duration];
        const sportText = activeSport.charAt(0).toUpperCase() + activeSport.slice(1);
        const participantsText = participants === 1 ? '' : ` with ${participants} Persons`;
        const daysText = days === 1 ? '' : ` x ${days} Days`;
        
        return `${durationText} ${sportText} Lesson${participantsText}${daysText}`;
    }
};

// DOM Elements
const getEl = id => document.getElementById(id);

// Initialize EmailJS
emailjs.init('gb9ZTULk6-ghDtZuV');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    State.init();
    initPhoneInput();
    setupEventListeners();
    renderCalendar();
    updateAllPrices();
});

function initPhoneInput() {
    window.phoneInput = window.intlTelInput(getEl('phone'), {
        initialCountry: "auto",
        geoIpLookup: callback => {
            fetch('https://ipapi.co/json/').then(r => r.json()).then(data => callback(data.country_code)).catch(() => callback('us'));
        },
        preferredCountries: ['us', 'gb', 'fr', 'de', 'ru', 'ge'],
        utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/js/utils.js"
    });
}

function setupEventListeners() {
    // Tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            updateAllPrices();
        });
    });

    // Sliders and selects
    ['duration', 'participants', 'days'].forEach(id => {
        getEl(id).addEventListener('input', () => {
            if (id === 'participants') {
                getEl('participantsValue').textContent = getEl('participants').value + ' Person' + (getEl('participants').value > 1 ? 's' : '');
            }
            if (id === 'days') {
                getEl('daysValue').textContent = getEl('days').value + ' Day' + (getEl('days').value > 1 ? 's' : '');
            }
            updateAllPrices();
        });
    });

    // Navigation
    getEl('nextToStep2').addEventListener('click', () => showStep(2));
    getEl('backToStep1').addEventListener('click', () => showStep(1));

    // Calendar
    getEl('prevMonth').addEventListener('click', () => navigateMonth(-1));
    getEl('nextMonth').addEventListener('click', () => navigateMonth(1));

    // Form submission
    getEl('personalInfoForm').addEventListener('submit', handleSubmit);
}

function showStep(step) {
    document.querySelectorAll('.form-section').forEach(section => section.classList.remove('active'));
    getEl(`step${step}`).classList.add('active');
    State.currentStep = step;
    
    if (step === 2) {
        getEl('step2Title').textContent = State.getBookingTitle();
        getEl('step2DateTime').textContent = getEl('selectedDateTime').textContent;
    }
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateAllPrices() {
    const priceData = calculatePrice();
    
    ['', 'Step2'].forEach(suffix => {
        getEl(`totalPrice${suffix}`).textContent = `$${priceData.total}`;
        getEl(`depositPrice${suffix}`).textContent = `$${priceData.deposit}`;
        getEl(`remainingPrice${suffix}`).textContent = `$${priceData.remaining}`;
        getEl(`discountInfo${suffix}`).textContent = priceData.discountText;
    });
}

function calculatePrice() {
    const duration = getEl('duration').value;
    const participants = parseInt(getEl('participants').value);
    const days = parseInt(getEl('days').value);
    
    let basePrice = CONFIG.prices[duration];
    const pricePerDay = basePrice + (participants - 1) * 40;
    
    let total = 0;
    let maxDiscount = 0;
    
    for (let day = 1; day <= days; day++) {
        let discount = day >= 8 ? 0.20 : day >= 6 ? 0.15 : day >= 4 ? 0.10 : 0;
        total += pricePerDay * (1 - discount);
        if (discount > maxDiscount) maxDiscount = discount;
    }
    
    total = Math.round(total);
    const deposit = Math.round(total * 0.20);
    const remaining = total - deposit;
    
    const discountText = maxDiscount > 0 ? `🎉 You save ${maxDiscount * 100}% on days ${maxDiscount === 0.20 ? '8+' : maxDiscount === 0.15 ? '6-7' : '4-5'}` : '';
    
    return { total, deposit, remaining, discountText };
}

function renderCalendar() {
    const year = State.currentMonth.getFullYear();
    const month = State.currentMonth.getMonth();
    
    getEl('currentMonth').textContent = State.currentMonth.toLocaleDateString('en-US', {month: 'long', year: 'numeric'});
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    
    getEl('calendarDays').innerHTML = '';
    
    // Previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
        createCalendarDay(prevMonthLastDay - i, 'other-month disabled', true);
    }
    
    // Current month
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(year, month, day);
        let className = 'calendar-day';
        
        if (date.toDateString() === today.toDateString()) className += ' today';
        
        if (date < CONFIG.minDate || date > CONFIG.maxDate || date < today) {
            createCalendarDay(day, className + ' disabled', true);
        } else {
            if (State.selectedDate && State.selectedDate.toDateString() === date.toDateString()) {
                className += ' selected';
            }
            createCalendarDay(day, className, false, date);
        }
    }
    
    // Next month
    const totalCells = 42;
    const nextMonthDays = totalCells - (startDay + lastDay.getDate());
    for (let day = 1; day <= nextMonthDays; day++) {
        createCalendarDay(day, 'other-month disabled', true);
    }
    
    updateTimeSlots();
}

function createCalendarDay(day, className, disabled, date = null) {
    const button = document.createElement('button');
    button.className = className;
    button.textContent = day;
    button.disabled = disabled;
    
    if (!disabled && date) {
        button.addEventListener('click', () => {
            State.selectedDate = date;
            renderCalendar();
            updateTimeSlots();
            updateSelectedDateTime();
            getEl('nextToStep2').disabled = !State.selectedTime;
            
            // Scroll to time selection
            setTimeout(() => {
                getEl('timeSelectionContainer').scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start' 
                });
            }, 300);
        });
    }
    
    getEl('calendarDays').appendChild(button);
}

function navigateMonth(direction) {
    State.currentMonth.setMonth(State.currentMonth.getMonth() + direction);
    renderCalendar();
}

function updateTimeSlots() {
    getEl('timeSlots').innerHTML = '';
    
    if (!State.selectedDate) {
        getEl('timeSlots').innerHTML = '<div class="time-slot disabled">Select date first</div>';
        getEl('nextToStep2').disabled = true;
        return;
    }

    const duration = getEl('duration').value;
    
    if (duration === 'full') {
        createTimeSlot('10:00', '10:00 (Full day)');
    } else {
        const lessonHours = parseInt(duration);
        for (let hour = CONFIG.lessonStartHour; hour <= CONFIG.resortCloseHour - lessonHours; hour++) {
            createTimeSlot(`${hour}:00`);
        }
    }
}

function createTimeSlot(timeString, displayText = null) {
    const timeSlot = document.createElement('button');
    timeSlot.className = 'time-slot';
    timeSlot.textContent = displayText || timeString;
    
    if (State.selectedTime === timeString) timeSlot.classList.add('selected');
    
    timeSlot.addEventListener('click', function() {
        document.querySelectorAll('.time-slot').forEach(slot => slot.classList.remove('selected'));
        State.selectedTime = timeString;
        this.classList.add('selected');
        updateSelectedDateTime();
        getEl('nextToStep2').disabled = false;
        
        // Scroll to Next button
        setTimeout(() => {
            getEl('nextToStep2').scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
        }, 300);
    });
    
    getEl('timeSlots').appendChild(timeSlot);
}

function updateSelectedDateTime() {
    if (State.selectedDate && State.selectedTime) {
        const dateStr = State.selectedDate.toLocaleDateString('en-US', {
            weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
        });
        getEl('selectedDateTime').textContent = `${dateStr} at ${State.selectedTime}`;
    }
}

function handleSubmit(e) {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const formData = getFormData();
    sendEmail(formData);
    showSuccessScreen();
}

function validateForm() {
    let isValid = true;
    
    if (!getEl('fullName').value.trim()) {
        showError('fullNameError', 'Please enter your full name');
        isValid = false;
    } else {
        hideError('fullNameError');
    }
    
    if (!window.phoneInput.isValidNumber()) {
        showError('phoneError', 'Please enter a valid phone number');
        isValid = false;
    } else {
        hideError('phoneError');
    }
    
    if (!getEl('email').value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        showError('emailError', 'Please enter a valid email address');
        isValid = false;
    } else {
        hideError('emailError');
    }
    
    if (!getEl('skillLevel').value) {
        showError('skillLevelError', 'Please select your skill level');
        isValid = false;
    } else {
        hideError('skillLevelError');
    }
    
    return isValid;
}

function showError(id, message) {
    const element = getEl(id);
    element.textContent = message;
    element.classList.add('show');
}

function hideError(id) {
    getEl(id).classList.remove('show');
}

function getFormData() {
    const duration = getEl('duration').value;
    const participants = parseInt(getEl('participants').value);
    const days = parseInt(getEl('days').value);
    const sport = document.querySelector('.tab.active').dataset.sport;
    
    const durationText = {'2': '2 Hours', '3': '3 Hours', 'full': 'Full Day'}[duration];
    const sportText = sport.charAt(0).toUpperCase() + sport.slice(1);
    const participantsText = participants === 1 ? '1 Person' : `${participants} Persons`;
    
    const priceData = calculatePrice();
    
    return {
        subject: `Booking: ${durationText} ${sportText} Lesson with ${participantsText} x ${days} days`,
        durationText,
        sportText,
        participantsText,
        days,
        dateTime: getEl('selectedDateTime').textContent,
        fullName: getEl('fullName').value,
        phone: window.phoneInput.getNumber(),
        email: getEl('email').value,
        skillLevel: getEl('skillLevel').options[getEl('skillLevel').selectedIndex].text,
        additionalInfo: getEl('additionalInfo').value,
        total: priceData.total,
        deposit: priceData.deposit,
        remaining: priceData.remaining
    };
}

function sendEmail(formData) {
    const emailBody = `
${formData.durationText} ${formData.sportText} Lesson with ${formData.participantsText} x ${formData.days} days
${formData.dateTime}

Full Name: ${formData.fullName}
Phone (WhatsApp): https://wa.me/${formData.phone.replace('+', '')}
Email: ${formData.email}
Skill level: ${formData.skillLevel}
Additional information: ${formData.additionalInfo || 'None'}

Total amount: $${formData.total}
20% deposit: $${formData.deposit}
Remaining balance: $${formData.remaining}

Google Calendar Link: ${generateGoogleCalendarLink(formData)}
            `.trim();

    emailjs.send('service_0tuoznd', 'template_jiiwo1f', {
        to_email: 'info@skischool.ge',
        subject: formData.subject,
        message: emailBody,
        from_name: formData.fullName,
        from_email: formData.email,
        phone: formData.phone
    }).then(function(response) {
        console.log('SUCCESS!', response.status, response.text);
    }, function(error) {
        console.log('FAILED...', error);
        const mailtoLink = `mailto:info@skischool.ge?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(emailBody)}`;
        window.open(mailtoLink, '_blank');
    });
}

function generateGoogleCalendarLink(formData) {
    const startDate = new Date(State.selectedDate);
    const [hours] = State.selectedTime.split(':');
    startDate.setHours(parseInt(hours), 0, 0);
    
    const endDate = new Date(startDate);
    const duration = getEl('duration').value;
    const days = parseInt(getEl('days').value);
    
    endDate.setHours(startDate.getHours() + (duration === 'full' ? 8 : parseInt(duration)));
    
    const details = `
Full Name: ${formData.fullName}
Phone (WhatsApp): ${formData.phone}
Email: ${formData.email}
Skill level: ${formData.skillLevel}
Additional information: ${formData.additionalInfo || 'None'}

Total amount: $${formData.total}
20% deposit: $${formData.deposit}
Remaining balance: $${formData.remaining}
            `.trim();

    const eventTitle = `${formData.durationText} ${formData.sportText} Lesson with ${formData.participantsText} x ${formData.days} days`;

    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: eventTitle,
        dates: `${formatGoogleCalendarDate(startDate)}/${formatGoogleCalendarDate(endDate)}`,
        details: details,
        location: 'Gudauri Ski Resort'
    });

    if (days > 1) {
        const rrule = `RRULE:FREQ=DAILY;COUNT=${days}`;
        params.append('recur', rrule);
    }

    return `https://calendar.google.com/calendar/render?${params}`;
}

function formatGoogleCalendarDate(date) {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function showSuccessScreen() {
    document.querySelectorAll('.form-section').forEach(section => section.classList.remove('active'));
    getEl('successScreen').classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
