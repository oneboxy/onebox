(function () {
  'use strict';
  const inputSelector = '.dev-workbench.dev-timestamp input.dev-date-input[data-dev-field="timestampDate"]';
  let frame = 0;
  let activePopup = null;
  let activeTrigger = null;
  let activeRoot = null;

  function splitValue(value) {
    const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/.exec(String(value || ''));
    return match ? { date: match[1], hour: match[2], minute: match[3], second: match[4] || '00' } : { date: '', hour: '00', minute: '00', second: '00' };
  }
  function isoDate(date) {
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
  }
  function parseDate(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
    return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : null;
  }
  function closePopup() {
    if (!activePopup) return;
    activePopup.hidden = true;
    activeTrigger?.setAttribute('aria-expanded', 'false');
    activeRoot?.classList.remove('opens-up', 'is-open');
    activePopup = activeTrigger = activeRoot = null;
  }
  function openPopup(root, popup, trigger) {
    if (activePopup === popup) { closePopup(); return; }
    closePopup();
    popup.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    root.classList.add('is-open');
    activePopup = popup;
    activeTrigger = trigger;
    activeRoot = root;
    requestAnimationFrame(() => {
      if (!popup.isConnected || popup.hidden) return;
      const rect = popup.getBoundingClientRect();
      const above = rect.top;
      const below = window.innerHeight - rect.bottom;
      root.classList.toggle('opens-up', below < 12 && above > rect.height + 12);
    });
  }
  function updateTimeSelected(wrapper, part, value) {
    const list = wrapper.querySelector('[data-time-list="' + part + '"]');
    const trigger = wrapper.querySelector('[data-time-picker-toggle]');
    if (!list || !trigger) return;
    list.querySelectorAll('[data-time-value]').forEach((option) => {
      const selected = option.dataset.timeValue === value;
      option.setAttribute('aria-selected', String(selected));
      option.classList.toggle('is-selected', selected);
    });
    const values = ['hour', 'minute', 'second'].map((key) =>
      wrapper.querySelector('[data-time-list="' + key + '"] [aria-selected="true"]')?.dataset.timeValue || '00'
    );
    trigger.querySelector('.dev-timestamp-time-value').textContent = values.join(':');
  }
  function scrollTimeSelected(wrapper) {
    wrapper.querySelectorAll('.dev-timestamp-time-list').forEach((list) => {
      const selected = list.querySelector('[aria-selected="true"]');
      if (selected) list.scrollTop = selected.offsetTop - (list.clientHeight - selected.offsetHeight) / 2;
    });
  }
  function enhanceUnitSelect(row, english) {
    const select = row.querySelector('select');
    if (!select || select.dataset.customUnitReady === 'true') return;
    const root = document.createElement('div');
    root.className = 'dev-timestamp-unit-picker';
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'dev-timestamp-unit-trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    const label = document.createElement('span');
    label.textContent = select.selectedOptions[0]?.textContent || '';
    const chevron = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    chevron.setAttribute('viewBox', '0 0 24 24');
    chevron.setAttribute('aria-hidden', 'true');
    chevron.innerHTML = '<path d="m7 10 5 5 5-5"/>';
    trigger.append(label, chevron);
    const menu = document.createElement('div');
    menu.className = 'dev-timestamp-unit-menu';
    menu.setAttribute('role', 'listbox');
    menu.hidden = true;
    Array.from(select.options).forEach((option) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'dev-timestamp-unit-option';
      item.setAttribute('role', 'option');
      item.setAttribute('aria-selected', String(option.value === select.value));
      item.dataset.unitValue = option.value;
      item.textContent = option.textContent;
      menu.append(item);
    });
    root.append(trigger, menu);
    select.classList.add('dev-timestamp-unit-native');
    select.dataset.customUnitReady = 'true';
    select.insertAdjacentElement('afterend', root);
    trigger.addEventListener('click', () => openPopup(root, menu, trigger));
    menu.addEventListener('click', (event) => {
      const item = event.target.closest('[data-unit-value]');
      if (!item) return;
      select.value = item.dataset.unitValue;
      label.textContent = select.selectedOptions[0]?.textContent || item.textContent;
      menu.querySelectorAll('[role="option"]').forEach((option) => option.setAttribute('aria-selected', String(option === item)));
      select.dispatchEvent(new Event('input', { bubbles: true }));
      select.dispatchEvent(new Event('change', { bubbles: true }));
      closePopup();
    });
    select.addEventListener('change', () => { label.textContent = select.selectedOptions[0]?.textContent || ''; });
  }

  function enhance() {
    frame = 0;
    const original = document.querySelector(inputSelector);
    const row = original?.closest('.dev-timestamp-input-row');
    if (!original || !row || original.dataset.splitPickerReady === 'true') return;
    const english = /^en(?:-|$)/i.test(document.documentElement.lang || '');
    enhanceUnitSelect(row, english);

    const wrapper = document.createElement('div');
    wrapper.className = 'dev-timestamp-date-time-control';
    const options = (part, count) => Array.from({ length: count }, (_, value) => {
      const formatted = String(value).padStart(2, '0');
      return '<button type="button" role="option" aria-selected="false" class="dev-timestamp-time-option" data-time-part="' + part + '" data-time-value="' + formatted + '">' + formatted + '</button>';
    }).join('');
    const dateLabel = english ? 'Date' : '日期';
    const timeLabel = english ? 'Time' : '时间';
    wrapper.innerHTML =
      '<div class="dev-timestamp-date-part"><span>' + dateLabel + '</span>' +
        '<div class="dev-timestamp-date-picker">' +
          '<button type="button" class="dev-timestamp-date-trigger" data-date-picker-toggle aria-haspopup="dialog" aria-expanded="false">' +
            '<span class="dev-timestamp-date-value"></span><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="16" rx="2"/><path d="M7.5 3v4M16.5 3v4M4 9h16"/></svg>' +
          '</button>' +
          '<section class="dev-timestamp-date-popover" role="dialog" aria-label="' + (english ? 'Choose a date' : '选择日期') + '" hidden>' +
            '<header class="dev-timestamp-date-popover-head">' +
              '<button type="button" class="dev-timestamp-calendar-nav" data-calendar-prev aria-label="' + (english ? 'Previous month' : '上个月') + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg></button>' +
              '<strong data-calendar-title></strong>' +
              '<button type="button" class="dev-timestamp-calendar-nav" data-calendar-next aria-label="' + (english ? 'Next month' : '下个月') + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg></button>' +
            '</header>' +
            '<div class="dev-timestamp-calendar-weekdays"></div><div class="dev-timestamp-calendar-days"></div>' +
            '<footer class="dev-timestamp-date-popover-foot"><button type="button" data-calendar-clear>' + (english ? 'Clear' : '清除') + '</button><button type="button" data-calendar-today>' + (english ? 'Today' : '今天') + '</button></footer>' +
          '</section>' +
          '<input type="date" class="dev-timestamp-native-date" data-timestamp-date-part="date" tabindex="-1" aria-hidden="true">' +
        '</div>' +
      '</div>' +
      '<div class="dev-timestamp-time-part"><span>' + timeLabel + '</span>' +
        '<div class="dev-timestamp-time-picker">' +
          '<button type="button" class="dev-timestamp-time-trigger" data-time-picker-toggle aria-haspopup="dialog" aria-expanded="false">' +
            '<span class="dev-timestamp-time-value">00:00:00</span><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/></svg>' +
          '</button>' +
          '<section class="dev-timestamp-time-popover" role="dialog" aria-label="' + (english ? 'Choose a time' : '选择时间') + '" hidden>' +
            '<header class="dev-timestamp-time-popover-head"><strong>' + (english ? 'Choose time' : '选择时间') + '</strong><button type="button" data-time-picker-done>' + (english ? 'Done' : '完成') + '</button></header>' +
            '<div class="dev-timestamp-time-columns">' +
              '<div class="dev-timestamp-time-column"><span>' + (english ? 'Hour' : '时') + '</span><div class="dev-timestamp-time-list" role="listbox" tabindex="0" aria-label="' + (english ? 'Hour' : '小时') + '" data-time-list="hour">' + options('hour', 24) + '</div></div>' +
              '<div class="dev-timestamp-time-column"><span>' + (english ? 'Minute' : '分') + '</span><div class="dev-timestamp-time-list" role="listbox" tabindex="0" aria-label="' + (english ? 'Minute' : '分钟') + '" data-time-list="minute">' + options('minute', 60) + '</div></div>' +
              '<div class="dev-timestamp-time-column"><span>' + (english ? 'Second' : '秒') + '</span><div class="dev-timestamp-time-list" role="listbox" tabindex="0" aria-label="' + (english ? 'Second' : '秒') + '" data-time-list="second">' + options('second', 60) + '</div></div>' +
            '</div>' +
          '</section>' +
        '</div>' +
      '</div>';

    original.dataset.splitPickerReady = 'true';
    original.classList.add('dev-timestamp-native-date');
    original.hidden = true;
    original.tabIndex = -1;
    original.setAttribute('aria-hidden', 'true');
    row.insertBefore(wrapper, original);

    const dateControl = wrapper.querySelector('[data-timestamp-date-part="date"]');
    const dateRoot = wrapper.querySelector('.dev-timestamp-date-picker');
    const dateTrigger = wrapper.querySelector('[data-date-picker-toggle]');
    const datePopup = wrapper.querySelector('.dev-timestamp-date-popover');
    const dateValue = wrapper.querySelector('.dev-timestamp-date-value');
    const calendarTitle = wrapper.querySelector('[data-calendar-title]');
    const weekdays = wrapper.querySelector('.dev-timestamp-calendar-weekdays');
    const calendarDays = wrapper.querySelector('.dev-timestamp-calendar-days');
    const timeRoot = wrapper.querySelector('.dev-timestamp-time-picker');
    const timeTrigger = wrapper.querySelector('[data-time-picker-toggle]');
    const timePopup = wrapper.querySelector('.dev-timestamp-time-popover');
    let visibleMonth = new Date();
    const weekdayNames = english ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] : ['一', '二', '三', '四', '五', '六', '日'];
    weekdays.innerHTML = weekdayNames.map((name) => '<span>' + name + '</span>').join('');

    function renderCalendar() {
      const year = visibleMonth.getFullYear();
      const month = visibleMonth.getMonth();
      calendarTitle.textContent = english
        ? new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(visibleMonth)
        : year + '年' + (month + 1) + '月';
      const first = new Date(year, month, 1);
      const start = new Date(year, month, 1 - ((first.getDay() + 6) % 7));
      const today = isoDate(new Date());
      const selected = dateControl.value;
      const fragment = document.createDocumentFragment();
      for (let index = 0; index < 42; index += 1) {
        const day = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
        const iso = isoDate(day);
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'dev-timestamp-calendar-day';
        if (day.getMonth() !== month) button.classList.add('is-outside-month');
        if (iso === today) button.classList.add('is-today');
        if (iso === selected) button.classList.add('is-selected');
        button.dataset.calendarDate = iso;
        button.textContent = String(day.getDate());
        button.setAttribute('aria-label', iso);
        button.setAttribute('aria-pressed', String(iso === selected));
        fragment.append(button);
      }
      calendarDays.replaceChildren(fragment);
    }
    function syncControls() {
      if (!original.isConnected) return;
      const parts = splitValue(original.value);
      dateControl.value = parts.date;
      dateValue.textContent = parts.date ? parts.date.replaceAll('-', '/') : (english ? 'Select date' : '选择日期');
      const parsed = parseDate(parts.date);
      if (parsed) visibleMonth = new Date(parsed.getFullYear(), parsed.getMonth(), 1);
      updateTimeSelected(wrapper, 'hour', parts.hour);
      updateTimeSelected(wrapper, 'minute', parts.minute);
      updateTimeSelected(wrapper, 'second', parts.second);
      renderCalendar();
    }
    function writeOriginal() {
      const hour = wrapper.querySelector('[data-time-list="hour"] [aria-selected="true"]')?.dataset.timeValue || '00';
      const minute = wrapper.querySelector('[data-time-list="minute"] [aria-selected="true"]')?.dataset.timeValue || '00';
      const second = wrapper.querySelector('[data-time-list="second"] [aria-selected="true"]')?.dataset.timeValue || '00';
      const next = dateControl.value ? dateControl.value + 'T' + hour + ':' + minute + ':' + second : '';
      if (original.value === next) return;
      original.value = next;
      original.dispatchEvent(new Event('input', { bubbles: true }));
    }
    dateTrigger.addEventListener('click', () => {
      const selected = parseDate(dateControl.value);
      if (selected) visibleMonth = new Date(selected.getFullYear(), selected.getMonth(), 1);
      renderCalendar();
      openPopup(dateRoot, datePopup, dateTrigger);
    });
    datePopup.addEventListener('click', (event) => {
      const dayButton = event.target.closest('[data-calendar-date]');
      if (dayButton) {
        dateControl.value = dayButton.dataset.calendarDate;
        renderCalendar();
        dateValue.textContent = dateControl.value.replaceAll('-', '/');
        writeOriginal();
        closePopup();
        return;
      }
      if (event.target.closest('[data-calendar-prev]')) {
        visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1);
        renderCalendar();
      } else if (event.target.closest('[data-calendar-next]')) {
        visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1);
        renderCalendar();
      } else if (event.target.closest('[data-calendar-today]')) {
        dateControl.value = isoDate(new Date());
        visibleMonth = new Date();
        renderCalendar();
        dateValue.textContent = dateControl.value.replaceAll('-', '/');
        writeOriginal();
        closePopup();
      } else if (event.target.closest('[data-calendar-clear]')) {
        dateControl.value = '';
        renderCalendar();
        dateValue.textContent = english ? 'Select date' : '选择日期';
        writeOriginal();
        closePopup();
      }
    });
    timeTrigger.addEventListener('click', () => {
      openPopup(timeRoot, timePopup, timeTrigger);
      requestAnimationFrame(() => { if (!timePopup.hidden) scrollTimeSelected(wrapper); });
    });
    timePopup.addEventListener('click', (event) => {
      const option = event.target.closest('[data-time-part][data-time-value]');
      if (option) {
        updateTimeSelected(wrapper, option.dataset.timePart, option.dataset.timeValue);
        writeOriginal();
      } else if (event.target.closest('[data-time-picker-done]')) closePopup();
    });
    timePopup.addEventListener('keydown', (event) => {
      const list = event.target.closest('[data-time-list]');
      if (!list || !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const part = list.dataset.timeList;
      const count = part === 'hour' ? 24 : 60;
      const current = Number(list.querySelector('[aria-selected="true"]')?.dataset.timeValue || '0');
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? count - 1 : (current + (event.key === 'ArrowDown' ? 1 : -1) + count) % count;
      updateTimeSelected(wrapper, part, String(next).padStart(2, '0'));
      writeOriginal();
      scrollTimeSelected(wrapper);
    });
    original.addEventListener('input', syncControls);
    original.addEventListener('change', syncControls);
    try {
      const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
      if (descriptor?.get && descriptor?.set) {
        Object.defineProperty(original, 'value', {
          configurable: true,
          get() { return descriptor.get.call(this); },
          set(value) { descriptor.set.call(this, value); requestAnimationFrame(syncControls); }
        });
      }
    } catch {}
    syncControls();
  }

  function schedule() {
    if (frame) return;
    frame = requestAnimationFrame(enhance);
  }
  document.addEventListener('pointerdown', (event) => {
    if (activePopup && !activeRoot?.contains(event.target)) closePopup();
  }, true);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closePopup();
  });
  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedule, { once: true });
  else schedule();
})();