/**
 * i18n.js — ALL user-facing text lives here, and only here.
 *
 * To add a new language:
 *   1. Copy the whole `en` block below, rename the key (e.g. `ka` for Georgian).
 *   2. Translate every string/array. Keep the same keys and function shapes.
 *   3. Add the new key to `SUPPORTED_LANGS` at the bottom.
 * Nothing in index.html or app.js needs to change.
 *
 * To edit existing wording (RU or EN):
 *   Find the string below and edit it. That's it — app.js reads everything
 *   from this object, it has no hardcoded text of its own.
 */

const I18N = {

  // ==========================================================
  // RUSSIAN
  // ==========================================================
  ru: {
    htmlLang: 'ru',
    docTitle: 'Форма бронирования - SkiSchool.ge',
    dateLocale: 'ru-RU',

    // Calendar
    weekStartsMonday: true,
    weekdayLabels: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
    monthNames: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
                 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
    monthNamesShort: ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],

    // Static UI text (used via data-i18n="..." in index.html)
    ui: {
      'step1.title': 'Детали занятия',
      'step2.title': 'Выберите дату и время для каждого занятия',
      'step3.title': 'Персональная информация',

      'tab.ski': 'Лыжи',
      'tab.snowboard': 'Сноуборд',
      'tab.kids': 'Детский клуб',

      'price.total': 'Итого:',
      'price.deposit': 'Предоплата 20%:',
      'price.remaining': 'Остаток к оплате:',

      'field.fullName.placeholder': 'ФИО *',
      'field.fullName.error': 'Пожалуйста, введите ваше полное имя',
      'field.phone.placeholder': 'Телефон (WhatsApp) *',
      'field.phone.error': 'Пожалуйста, введите корректный номер телефона',
      'field.email.placeholder': 'Email *',
      'field.email.error': 'Пожалуйста, введите корректный email адрес',
      'field.age.placeholder': 'Возраст *',
      'field.age.error': 'Пожалуйста, введите корректный возраст (5-80)',
      'field.skillLevel.error': 'Пожалуйста, выберите ваш уровень подготовки',
      'field.language.error': 'Пожалуйста, выберите предпочитаемый язык',
      'field.specialRequests.placeholder': 'Особые пожелания (необязательно)',

      'btn.continue': 'Продолжить',
      'btn.back': 'Назад',

      'payment.processing.title': 'Обработка платежа...',
      'payment.processing.message': 'Пожалуйста, подождите, пока мы обрабатываем ваш платеж.',
      'success.title': 'Бронирование подтверждено!',
      'success.message': 'Спасибо за бронирование! Ваше занятие запланировано! Будем рады видеть вас на склоне!',

      'timeSlots.loading': 'Проверка доступных временных слотов...'
    },

    // Select options: value/label pairs, built by app.js
    durationOptions: [
      { value: '2', label: 'Занятие 2 часа' },
      { value: '3', label: 'Занятие 3 часа' },
      { value: 'full', label: 'Занятие на полный день' }
    ],
    kidsDurationOptions: [
      { value: 'full', label: 'Детский клуб (полный день)' },
      { value: 'half-lunch', label: 'Детский клуб (полдня с обедом)' },
      { value: 'half-nolunch', label: 'Детский клуб (полдня без обеда)' }
    ],
    skillLevelOptions: {
      placeholder: 'Уровень подготовки *',
      adult: [
        { value: 'first-time', label: 'Первый раз' },
        { value: 'beginner', label: 'Начинающий' },
        { value: 'intermediate', label: 'Средний' },
        { value: 'advanced', label: 'Продвинутый' }
      ],
      kids: [
        { value: 'beginner', label: 'Начинающий' },
        { value: 'intermediate', label: 'Средний' }
      ]
    },
    languageOptions: {
      placeholder: 'Предпочитаемый язык *',
      adult: [
        { value: 'english', label: 'Английский' },
        { value: 'russian', label: 'Русский' },
        { value: 'georgian', label: 'Грузинский' },
        { value: 'other', label: 'Другой' }
      ],
      kids: [
        { value: 'english', label: 'Английский' },
        { value: 'russian', label: 'Русский' }
      ]
    },

    // Sport name as used mid-sentence ("занятие на ЛЫЖАХ")
    sportNamePrepositional: { ski: 'лыжах', snowboard: 'сноуборде', kids: 'Детский лыжный клуб' },

    // Duration display text (non-kids / kids)
    durationDisplay: { '2': '2 часа', '3': '3 часа', 'full': 'Полный день' },
    kidsDurationDisplay: {
      'full': 'Детский клуб (полный день)',
      'half-lunch': 'Детский клуб (полдня с обедом)',
      'half-nolunch': 'Детский клуб (полдня без обеда)'
    },
    kidsDurationDisplayWithHours: {
      'full': 'Полный день (10:30-16:30)',
      'half-lunch': 'Полдня с обедом (10:30-14:30)',
      'half-nolunch': 'Полдня без обеда (10:30-13:30)'
    },

    // Small word-form helpers (kept as simple two-way forms exactly like the original code)
    personWord: n => (n === 1 ? 'человек' : 'человека'),
    kidWord: n => (n === 1 ? 'ребёнок' : 'ребёнка'),
    dayWord: n => (n === 1 ? 'день' : 'дня(ей)'),
    personInstrumentalWord: n => (n > 1 ? 'человеками' : 'человеком'), // email intro sentence, "с N человеком/человеками"

    participantsLabel: n => `${n} ${I18N.ru.personWord(n)}`,
    kidsLabel: n => `${n} ${I18N.ru.kidWord(n)}`,
    daysLabel: n => `${n} ${I18N.ru.dayWord(n)}`,

    summaryDetails: (participantText, days) => `${participantText} × ${days} ${I18N.ru.dayWord(days)}`,

    discountTextKids15: (days, amount) => `🎉 Вы экономите 15% на днях 7-${days}! Ваша экономия: $${amount}`,
    discountTextKids10: (amount) => `🎉 Вы экономите 10% на днях 5-6! Ваша экономия: $${amount}`,
    discountTextGeneral: (ratePct, range, amount) => `Скидка ${ratePct}% на дни ${range}! Ваша экономия: $${amount}`,
    discountRange: { 0.20: '8+', 0.15: '6-7', 0.10: '4-5' },

    alerts: {
      selectDateFirst: 'Пожалуйста, сначала выберите дату',
      slotUnavailable: 'Этот временной слот больше не доступен. Пожалуйста, выберите другое время.',
      fillRequired: 'Пожалуйста, заполните все обязательные поля',
      paymentCancelled: 'Платёж отменён. Пожалуйста, попробуйте снова для завершения бронирования.',
      paymentError: 'Произошла ошибка при оплате. Пожалуйста, попробуйте снова.'
    },

    paypalDescription: (days, sportUpper) =>
      `Предоплата за бронирование - ${days} ${I18N.ru.dayWord(days)} занятие на ${sportUpper}`,

    emailScheduleLine: (index, dateStr, time) => `Занятие ${index + 1}: ${dateStr} в ${time}`,

    emailSubject: (durationText, sportName) => `Подтверждение бронирования: ${durationText} занятие на ${sportName}`,

    emailIntro: (durationText, sportName, participants, days) =>
      `${durationText} занятие на ${sportName} с ${participants} ${I18N.ru.personInstrumentalWord(participants)} на ${days} ${I18N.ru.dayWord(days)}`,

    emailLabels: {
      scheduleHeader: '📅 РАСПИСАНИЕ:',
      paymentStatus: 'Статус платежа: ✅ ВЫПОЛНЕНО',
      paymentId: 'ID платежа:',
      payerEmail: 'Email плательщика:',
      bookingId: 'ID бронирования:',
      fullName: 'ФИО:',
      phone: 'Телефон (WhatsApp):',
      email: 'Email:',
      age: 'Возраст:',
      skillLevel: 'Уровень подготовки:',
      preferredLanguage: 'Предпочитаемый язык:',
      additionalInfo: 'Дополнительная информация:',
      none: 'Нет',
      totalAmount: 'Общая сумма:',
      deposit: 'Предоплата 20%:',
      remaining: 'Остаток к оплате:',
      calendarLinks: 'Ссылки на Google Календарь:'
    },

    calendar: {
      eventTitle: (sportName, fullName) => `Занятие на ${sportName} - ${fullName}`,
      dayPrefix: (index) => `День ${index + 1}:`,
      dayLabel: (number) => `День ${number}`,
      location: 'Горнолыжный курорт Гудаури',
      descriptionLabels: {
        client: 'Клиент:',
        phone: 'Телефон:',
        email: 'Email:',
        participants: 'Участники:',
        level: 'Уровень:',
        days: 'Дней:',
        additionalInfo: 'Дополнительная информация:',
        none: 'Нет',
        meetingPoint: 'Место встречи: уточняется'
      }
    }
  },

  // ==========================================================
  // ENGLISH
  // ==========================================================
  en: {
    htmlLang: 'en',
    docTitle: 'Booking Form - SkiSchool.ge',
    dateLocale: 'en-US',

    weekStartsMonday: false,
    weekdayLabels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    monthNames: ['January', 'February', 'March', 'April', 'May', 'June',
                 'July', 'August', 'September', 'October', 'November', 'December'],
    monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],

    ui: {
      'step1.title': 'Lesson Details',
      'step2.title': 'Select Date & Time for Each Lesson',
      'step3.title': 'Personal Information',

      'tab.ski': 'Ski',
      'tab.snowboard': 'Snowboard',
      'tab.kids': 'Kids Ski Club',

      'price.total': 'Total:',
      'price.deposit': '20% deposit:',
      'price.remaining': 'Remaining balance:',

      'field.fullName.placeholder': 'Full Name *',
      'field.fullName.error': 'Please enter your full name',
      'field.phone.placeholder': 'Phone (WhatsApp) *',
      'field.phone.error': 'Please enter a valid phone number',
      'field.email.placeholder': 'Email *',
      'field.email.error': 'Please enter a valid email address',
      'field.age.placeholder': 'Age *',
      'field.age.error': 'Please enter a valid age (5-80)',
      'field.skillLevel.error': 'Please select your skill level',
      'field.language.error': 'Please select your preferred language',
      'field.specialRequests.placeholder': 'Special Requests (Optional)',

      'btn.continue': 'Continue',
      'btn.back': 'Back',

      'payment.processing.title': 'Processing Payment...',
      'payment.processing.message': 'Please wait while we process your payment.',
      'success.title': 'Booking Confirmed!',
      'success.message': "Thank you for your booking! Your lesson has been scheduled! We're excited to see you on the slopes!",

      'timeSlots.loading': 'Checking available time slots...'
    },

    durationOptions: [
      { value: '2', label: '2 Hours Lesson' },
      { value: '3', label: '3 Hours Lesson' },
      { value: 'full', label: 'Full Day Lesson' }
    ],
    kidsDurationOptions: [
      { value: 'full', label: 'Kids Ski Club Full Day' },
      { value: 'half-lunch', label: 'Kids Ski Club Half Day With Lunch' },
      { value: 'half-nolunch', label: 'Kids Ski Club Half Day No Lunch' }
    ],
    skillLevelOptions: {
      placeholder: 'Skill Level *',
      adult: [
        { value: 'first-time', label: 'First Time' },
        { value: 'beginner', label: 'Beginner' },
        { value: 'intermediate', label: 'Intermediate' },
        { value: 'advanced', label: 'Advanced' }
      ],
      kids: [
        { value: 'beginner', label: 'Beginner' },
        { value: 'intermediate', label: 'Intermediate' }
      ]
    },
    languageOptions: {
      placeholder: 'Preferred Language *',
      adult: [
        { value: 'english', label: 'English' },
        { value: 'russian', label: 'Russian' },
        { value: 'georgian', label: 'Georgian' },
        { value: 'other', label: 'Other' }
      ],
      kids: [
        { value: 'english', label: 'English' },
        { value: 'russian', label: 'Russian' }
      ]
    },

    sportNamePrepositional: { ski: 'Ski', snowboard: 'Snowboard', kids: 'Kids Ski Club' },

    durationDisplay: { '2': '2 Hours', '3': '3 Hours', 'full': 'Full Day' },
    kidsDurationDisplay: {
      'full': 'Kids Ski Club Full Day',
      'half-lunch': 'Kids Ski Club Half Day With Lunch',
      'half-nolunch': 'Kids Ski Club Half Day No Lunch'
    },
    kidsDurationDisplayWithHours: {
      'full': 'Full Day (10:30-16:30)',
      'half-lunch': 'Half Day With Lunch (10:30-14:30)',
      'half-nolunch': 'Half Day No Lunch (10:30-13:30)'
    },

    personWord: n => (n === 1 ? 'Person' : 'People'),
    kidWord: n => (n === 1 ? 'Kid' : 'Kids'),
    dayWord: n => (n === 1 ? 'Day' : 'Days'),
    personInstrumentalWord: n => (n > 1 ? 'people' : 'person'), // email intro sentence, "with N person/people"

    participantsLabel: n => `${n} ${I18N.en.personWord(n)}`,
    kidsLabel: n => `${n} ${I18N.en.kidWord(n)}`,
    daysLabel: n => `${n} ${I18N.en.dayWord(n)}`,

    summaryDetails: (participantText, days) => `${participantText} × ${days} ${I18N.en.dayWord(days)}`,

    discountTextKids15: (days, amount) => `🎉 You save 15% on days 7-${days}! You save $${amount}`,
    discountTextKids10: (amount) => `🎉 You save 10% on days 5-6! You save $${amount}`,
    discountTextGeneral: (ratePct, range, amount) => `${ratePct}% discount on days ${range}! You save $${amount}`,
    discountRange: { 0.20: '8+', 0.15: '6-7', 0.10: '4-5' },

    alerts: {
      selectDateFirst: 'Please select a date first',
      slotUnavailable: 'This time slot is no longer available. Please choose another time.',
      fillRequired: 'Please fill in all required fields',
      paymentCancelled: 'Payment was cancelled. Please try again to complete your booking.',
      paymentError: 'An error occurred with your payment. Please try again.'
    },

    paypalDescription: (days, sportUpper) =>
      `Booking Deposit - ${days} Day${days > 1 ? 's' : ''} ${sportUpper} Lesson`,

    emailScheduleLine: (index, dateStr, time) => `Lesson ${index + 1}: ${dateStr} at ${time}`,

    emailSubject: (durationText, sportName) => `Booking Confirmation: ${durationText} ${sportName} Lesson`,

    emailIntro: (durationText, sportName, participants, days) =>
      `${durationText} ${sportName} Lesson with ${participants} ${I18N.en.personInstrumentalWord(participants)} for ${days} ${days > 1 ? 'days' : 'day'}`,

    emailLabels: {
      scheduleHeader: '📅 SCHEDULE:',
      paymentStatus: 'Payment Status: ✅ COMPLETED',
      paymentId: 'Payment ID:',
      payerEmail: 'Payer Email:',
      bookingId: 'Booking ID:',
      fullName: 'Full Name:',
      phone: 'Phone (WhatsApp):',
      email: 'Email:',
      age: 'Age:',
      skillLevel: 'Skill level:',
      preferredLanguage: 'Preferred language:',
      additionalInfo: 'Additional information:',
      none: 'None',
      totalAmount: 'Total amount:',
      deposit: '20% deposit:',
      remaining: 'Remaining balance:',
      calendarLinks: 'Google Calendar Links:'
    },

    calendar: {
      eventTitle: (sportName, fullName) => `${sportName} Lesson - ${fullName}`,
      dayPrefix: (index) => `Day ${index + 1}:`,
      dayLabel: (number) => `Day ${number}`,
      location: 'Gudauri Ski Resort',
      descriptionLabels: {
        client: 'Client:',
        phone: 'Phone:',
        email: 'Email:',
        participants: 'Participants:',
        level: 'Level:',
        days: 'Days:',
        additionalInfo: 'Additional info:',
        none: 'None',
        meetingPoint: 'Meeting point: TBD'
      }
    }
  }
};

// Add a new language code here once you've added its block above.
const SUPPORTED_LANGS = ['ru', 'en'];
const DEFAULT_LANG = 'en';
