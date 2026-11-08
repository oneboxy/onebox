(function () {
  'use strict';
  const inputSelector = '.dev-workbench.dev-timestamp input.dev-date-input[data-dev-field="timestampDate"]';
  let frame = 0;

  function splitValue(value) {
    const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}(?::\d{2})?)/.exec(String(value || ''));
    return match ? { date: match[1], time: match[2] } : { date: '', time: '' };
  }

  function enhance() {
    frame = 0;
    const original = document.querySelector(inputSelector);
    const row = original?.closest('.dev-timestamp-input-row');
    if (!original || !row || original.dataset.splitPickerReady === 'true') return;

    const english = /^en(?:-|$)/i.test(document.documentElement.lang || '');
    const wrapper = document.createElement('div');
    wrapper.className = 'dev-timestamp-date-time-control';
    wrapper.innerHTML =
      '<div class="dev-timestamp-date-part"><span>' + (english ? 'Date' : '日期') + '</span>' +
        '<input type="date" data-timestamp-date-part="date" aria-label="' + (english ? 'Date' : '日期') + '">' +
      '</div>' +
      '<div class="dev-timestamp-time-part"><span>' + (english ? 'Time' : '时间') + '</span>' +
        '<input type="time" step="1" data-timestamp-date-part="time" aria-label="' + (english ? 'Time' : '时间') + '">' +
      '</div>';

    original.dataset.splitPickerReady = 'true';
    original.classList.add('dev-timestamp-native-date');
    original.hidden = true;
    original.tabIndex = -1;
    original.setAttribute('aria-hidden', 'true');
    row.insertBefore(wrapper, original);

    const dateControl = wrapper.querySelector('[data-timestamp-date-part="date"]');
    const timeControl = wrapper.querySelector('[data-timestamp-date-part="time"]');
    const syncControls = () => {
      if (!original.isConnected) return;
      const parts = splitValue(original.value);
      if (dateControl && document.activeElement !== dateControl) dateControl.value = parts.date;
      if (timeControl && document.activeElement !== timeControl) timeControl.value = parts.time;
    };
    const writeOriginal = () => {
      const next = dateControl.value && timeControl.value
        ? dateControl.value + 'T' + timeControl.value
        : '';
      if (original.value === next) return;
      original.value = next;
      original.dispatchEvent(new Event('input', { bubbles: true }));
    };

    dateControl.addEventListener('input', writeOriginal);
    timeControl.addEventListener('input', writeOriginal);
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

  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedule, { once: true });
  else schedule();
})();