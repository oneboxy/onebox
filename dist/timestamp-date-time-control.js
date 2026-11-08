(function () {
  'use strict';
  const inputSelector = '.dev-workbench.dev-timestamp input.dev-date-input[data-dev-field="timestampDate"]';
  let frame = 0;
  let activePopup = null;
  let activeTrigger = null;
  let activeRoot = null;

  function closePopup() {
    if (!activePopup) return;
    activePopup.hidden = true;
    activeTrigger?.setAttribute('aria-expanded', 'false');
    activeRoot?.classList.remove('is-open', 'opens-up');
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
      root.classList.toggle('opens-up', below < rect.height + 12 && above > below);
    });
  }
  function enhanceUnitSelect(row) {
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
    const updateLabel = () => { label.textContent = select.selectedOptions[0]?.textContent || ''; };
    updateLabel();
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
      menu.appendChild(item);
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
      updateLabel();
      menu.querySelectorAll('[role="option"]').forEach((option) => option.setAttribute('aria-selected', String(option === item)));
      select.dispatchEvent(new Event('input', { bubbles: true }));
      select.dispatchEvent(new Event('change', { bubbles: true }));
      closePopup();
    });
    select.addEventListener('change', updateLabel);
  }
  const isoDate = (date) =>
    date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
  const parseDate = (value) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
    return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : null;
  };
  const dateTimeParts = (value) => {
    const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/.exec(String(value || ''));
    return match ? { date: match[1], hour: match[2], minute: match[3], second: match[4] || '00' } : { date: '', hour: '00', minute: '00', second: '00' };
  };
  const pad = (value) => String(value).padStart(2, '0');

  function enhance() {
    frame = 0;
    const original = document.querySelector(inputSelector);
    const row = original?.closest('.dev-timestamp-input-row');
    if (!original || !row) return;
    enhanceUnitSelect(row);
    if (original.dataset.splitPickerReady === 'true') return;

    const english = /^en(?:-|$)/i.test(document.documentElement.lang || '');
    const wrapper = document.createElement('div');
    wrapper.className = 'dev-timestamp-date-time-control';
    wrapper.innerHTML =
      '<button type="button" class="dev-timestamp-datetime-trigger" data-datetime-picker-toggle aria-haspopup="dialog" aria-expanded="false">' +
        '<span class="dev-timestamp-datetime-value"></span>' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="16" rx="2"/><path d="M7.5 3v4M16.5 3v4M4 9h16"/></svg>' +
      '</button>' +
      '<section class="dev-timestamp-datetime-popover" role="dialog" aria-label="' + (english ? 'Choose date and time' : '选择日期和时间') + '" hidden>' +
        '<header class="dev-timestamp-datetime-head">' +
          '<button type="button" class="dev-timestamp-calendar-nav" data-calendar-prev aria-label="' + (english ? 'Previous month' : '上个月') + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg></button>' +
          '<strong data-calendar-title></strong>' +
          '<button type="button" class="dev-timestamp-calendar-nav" data-calendar-next aria-label="' + (english ? 'Next month' : '下个月') + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg></button>' +
        '</header>' +
        '<div class="dev-timestamp-calendar-weekdays"></div><div class="dev-timestamp-calendar-days"></div>' +
        '<div class="dev-timestamp-datetime-time">' +
          '<span class="dev-timestamp-datetime-time-label">' + (english ? 'Time' : '时间') + '</span>' +
          '<div class="dev-timestamp-datetime-time-inputs">' +
            '<label><span>' + (english ? 'Hour' : '时') + '</span><input type="number" min="0" max="23" step="1" inputmode="numeric" data-datetime-part="hour" aria-label="' + (english ? 'Hour' : '小时') + '"></label>' +
            '<b aria-hidden="true">:</b>' +
            '<label><span>' + (english ? 'Minute' : '分') + '</span><input type="number" min="0" max="59" step="1" inputmode="numeric" data-datetime-part="minute" aria-label="' + (english ? 'Minute' : '分钟') + '"></label>' +
            '<b aria-hidden="true">:</b>' +
            '<label><span>' + (english ? 'Second' : '秒') + '</span><input type="number" min="0" max="59" step="1" inputmode="numeric" data-datetime-part="second" aria-label="' + (english ? 'Second' : '秒') + '"></label>' +
          '</div>' +
        '</div>' +
        '<footer class="dev-timestamp-datetime-foot">' +
          '<button type="button" data-datetime-clear>' + (english ? 'Clear' : '清除') + '</button>' +
          '<span></span>' +
          '<button type="button" data-datetime-today>' + (english ? 'Now' : '现在') + '</button>' +
          '<button type="button" class="is-done" data-datetime-done>' + (english ? 'Done' : '完成') + '</button>' +
        '</footer>' +
      '</section>';
    original.dataset.splitPickerReady = 'true';
    original.classList.add('dev-timestamp-native-date');
    original.hidden = true;
    original.tabIndex = -1;
    original.setAttribute('aria-hidden', 'true');
    row.insertBefore(wrapper, original);

    const trigger = wrapper.querySelector('[data-datetime-picker-toggle]');
    const popup = wrapper.querySelector('.dev-timestamp-datetime-popover');
    const visibleValue = wrapper.querySelector('.dev-timestamp-datetime-value');
    const title = wrapper.querySelector('[data-calendar-title]');
    const weekdays = wrapper.querySelector('.dev-timestamp-calendar-weekdays');
    const days = wrapper.querySelector('.dev-timestamp-calendar-days');
    const partsInputs = Object.fromEntries(Array.from(wrapper.querySelectorAll('[data-datetime-part]')).map((input) => [input.dataset.datetimePart, input]));
    let visibleMonth = new Date();
    const weekdayNames = english ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] : ['一', '二', '三', '四', '五', '六', '日'];
    weekdays.innerHTML = weekdayNames.map((name) => '<span>' + name + '</span>').join('');

    function renderCalendar() {
      const year = visibleMonth.getFullYear();
      const month = visibleMonth.getMonth();
      title.textContent = english
        ? new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(visibleMonth)
        : year + '年' + (month + 1) + '月';
      const first = new Date(year, month, 1);
      const start = new Date(year, month, 1 - ((first.getDay() + 6) % 7));
      const today = isoDate(new Date());
      const selected = dateTimeParts(original.value).date;
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
      days.replaceChildren(fragment);
    }
    function sync() {
      if (!original.isConnected) return;
      const p = dateTimeParts(original.value);
      const date = parseDate(p.date);
      if (date) visibleMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      visibleValue.textContent = p.date
        ? p.date.replaceAll('-', '/') + ' ' + p.hour + ':' + p.minute + ':' + p.second
        : (english ? 'Select date and time' : '选择日期和时间');
      Object.entries({ hour: p.hour, minute: p.minute, second: p.second }).forEach(([key, value]) => {
        const input = partsInputs[key];
        if (input && document.activeElement !== input) input.value = value;
      });
      renderCalendar();
    }
    function writeOriginal() {
      const date = dateTimeParts(original.value).date;
      if (!date) return;
      const values = {};
      Object.entries(partsInputs).forEach(([key, input]) => {
        const max = key === 'hour' ? 23 : 59;
        let value = Number(input.value);
        if (!Number.isFinite(value)) value = 0;
        value = Math.max(0, Math.min(max, Math.trunc(value)));
        input.value = pad(value);
        values[key] = pad(value);
      });
      const next = date + 'T' + values.hour + ':' + values.minute + ':' + values.second;
      if (original.value === next) return;
      original.value = next;
      original.dispatchEvent(new Event('input', { bubbles: true }));
      original.dispatchEvent(new Event('change', { bubbles: true }));
      renderCalendar();
    }
    trigger.addEventListener('click', () => {
      const selected = parseDate(dateTimeParts(original.value).date);
      if (selected) visibleMonth = new Date(selected.getFullYear(), selected.getMonth(), 1);
      renderCalendar();
      openPopup(wrapper, popup, trigger);
    });
    popup.addEventListener('click', (event) => {
      const day = event.target.closest('[data-calendar-date]');
      if (day) {
        const current = dateTimeParts(original.value);
        original.value = day.dataset.calendarDate + 'T' + current.hour + ':' + current.minute + ':' + current.second;
        original.dispatchEvent(new Event('input', { bubbles: true }));
        original.dispatchEvent(new Event('change', { bubbles: true }));
        sync();
        return;
      }
      if (event.target.closest('[data-calendar-prev]')) {
        visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1);
        renderCalendar();
      } else if (event.target.closest('[data-calendar-next]')) {
        visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1);
        renderCalendar();
      } else if (event.target.closest('[data-datetime-clear]')) {
        original.value = '';
        original.dispatchEvent(new Event('input', { bubbles: true }));
        original.dispatchEvent(new Event('change', { bubbles: true }));
        sync();
      } else if (event.target.closest('[data-datetime-today]')) {
        const now = new Date();
        original.value = localDateTime(now);
        original.dispatchEvent(new Event('input', { bubbles: true }));
        original.dispatchEvent(new Event('change', { bubbles: true }));
        sync();
      } else if (event.target.closest('[data-datetime-done]')) closePopup();
    });
    Object.values(partsInputs).forEach((input) => {
      input.addEventListener('input', writeOriginal);
      input.addEventListener('change', writeOriginal);
      input.addEventListener('blur', writeOriginal);
    });
    original.addEventListener('input', sync);
    original.addEventListener('change', sync);
    try {
      const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
      if (descriptor?.get && descriptor?.set) {
        Object.defineProperty(original, 'value', {
          configurable: true,
          get() { return descriptor.get.call(this); },
          set(value) { descriptor.set.call(this, value); requestAnimationFrame(sync); }
        });
      }
    } catch {}
    sync();
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