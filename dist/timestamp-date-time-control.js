(function () {
  'use strict';
  const inputSelector = '.dev-workbench.dev-timestamp input.dev-date-input[data-dev-field="timestampDate"]';
  let frame = 0;
  let activePicker = null;

  function splitValue(value) {
    const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/.exec(String(value || ''));
    return match ? { date: match[1], hour: match[2], minute: match[3], second: match[4] || '00' } : { date: '', hour: '00', minute: '00', second: '00' };
  }

  function closePicker(wrapper) {
    const popup = wrapper?.querySelector('.dev-timestamp-time-popover');
    const trigger = wrapper?.querySelector('[data-time-picker-toggle]');
    if (!popup || !trigger) return;
    popup.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    wrapper.classList.remove('is-open');
    if (activePicker === wrapper) activePicker = null;
  }

  function scrollSelected(wrapper) {
    wrapper.querySelectorAll('.dev-timestamp-time-list').forEach((list) => {
      const selected = list.querySelector('[aria-selected="true"]');
      if (selected) list.scrollTop = selected.offsetTop - (list.clientHeight - selected.offsetHeight) / 2;
    });
  }

  function updateSelected(wrapper, part, value) {
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

  function enhance() {
    frame = 0;
    const original = document.querySelector(inputSelector);
    const row = original?.closest('.dev-timestamp-input-row');
    if (!original || !row || original.dataset.splitPickerReady === 'true') return;

    const english = /^en(?:-|$)/i.test(document.documentElement.lang || '');
    const wrapper = document.createElement('div');
    wrapper.className = 'dev-timestamp-date-time-control';
    const options = (part, count) => Array.from({ length: count }, (_, value) => {
      const formatted = String(value).padStart(2, '0');
      return '<button type="button" role="option" aria-selected="false" class="dev-timestamp-time-option" data-time-part="' + part + '" data-time-value="' + formatted + '">' + formatted + '</button>';
    }).join('');

    wrapper.innerHTML =
      '<div class="dev-timestamp-date-part"><span>' + (english ? 'Date' : '日期') + '</span>' +
        '<input type="date" data-timestamp-date-part="date" aria-label="' + (english ? 'Date' : '日期') + '">' +
      '</div>' +
      '<div class="dev-timestamp-time-part"><span>' + (english ? 'Time' : '时间') + '</span>' +
        '<div class="dev-timestamp-time-picker">' +
          '<button type="button" class="dev-timestamp-time-trigger" data-time-picker-toggle aria-haspopup="dialog" aria-expanded="false">' +
            '<span class="dev-timestamp-time-value">00:00:00</span>' +
            '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/></svg>' +
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
    const timeTrigger = wrapper.querySelector('[data-time-picker-toggle]');
    const popup = wrapper.querySelector('.dev-timestamp-time-popover');

    const syncControls = () => {
      if (!original.isConnected) return;
      const parts = splitValue(original.value);
      if (dateControl && document.activeElement !== dateControl) dateControl.value = parts.date;
      updateSelected(wrapper, 'hour', parts.hour);
      updateSelected(wrapper, 'minute', parts.minute);
      updateSelected(wrapper, 'second', parts.second);
    };
    const writeOriginal = () => {
      const hour = wrapper.querySelector('[data-time-list="hour"] [aria-selected="true"]')?.dataset.timeValue || '00';
      const minute = wrapper.querySelector('[data-time-list="minute"] [aria-selected="true"]')?.dataset.timeValue || '00';
      const second = wrapper.querySelector('[data-time-list="second"] [aria-selected="true"]')?.dataset.timeValue || '00';
      const next = dateControl.value ? dateControl.value + 'T' + hour + ':' + minute + ':' + second : '';
      if (original.value === next) return;
      original.value = next;
      original.dispatchEvent(new Event('input', { bubbles: true }));
    };
    const openPicker = () => {
      if (!popup.hidden) return closePicker(wrapper);
      popup.hidden = false;
      wrapper.classList.add('is-open');
      timeTrigger.setAttribute('aria-expanded', 'true');
      activePicker = wrapper;
      requestAnimationFrame(() => {
        const rect = popup.getBoundingClientRect();
        const below = window.innerHeight - rect.top;
        wrapper.classList.toggle('opens-up', below < rect.height + 12 && rect.top > rect.height + 12);
        scrollSelected(wrapper);
      });
    };

    dateControl.addEventListener('input', writeOriginal);
    timeTrigger.addEventListener('click', openPicker);
    popup.addEventListener('click', (event) => {
      const option = event.target.closest?.('[data-time-part][data-time-value]');
      if (option) {
        updateSelected(wrapper, option.dataset.timePart, option.dataset.timeValue);
        writeOriginal();
        return;
      }
      if (event.target.closest?.('[data-time-picker-done]')) closePicker(wrapper);
    });
    popup.addEventListener('keydown', (event) => {
      const list = event.target.closest?.('[data-time-list]');
      if (!list || !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const part = list.dataset.timeList;
      const count = part === 'hour' ? 24 : 60;
      const current = Number(list.querySelector('[aria-selected="true"]')?.dataset.timeValue || '0');
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? count - 1 : (current + (event.key === 'ArrowDown' ? 1 : -1) + count) % count;
      updateSelected(wrapper, part, String(next).padStart(2, '0'));
      writeOriginal();
      scrollSelected(wrapper);
    });
    original.addEventListener('input', syncControls);
    original.addEventListener('change', syncControls);

    try {
      const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
      if (descriptor?.get && descriptor?.set) {
        Object.defineProperty(original, 'value', {
          configurable: true,
          get() { return descriptor.get.call(this); },
          set(value) {
            descriptor.set.call(this, value);
            requestAnimationFrame(syncControls);
          }
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
    if (activePicker && !activePicker.contains(event.target)) closePicker(activePicker);
  }, true);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && activePicker) closePicker(activePicker);
  });
  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedule, { once: true });
  else schedule();
})();