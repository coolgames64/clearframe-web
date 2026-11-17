'use strict';

const sampleTimes = {
  cut: ['Tuesday 10:00', 'Thursday 14:15'],
  'blow-dry': ['Tuesday 11:00', 'Saturday 09:30'],
  restyle: ['Thursday 10:30', 'Saturday 13:00']
};

const form = document.getElementById('appointment-form');
const times = document.getElementById('sample-times');
const options = document.getElementById('time-options');
const preview = document.getElementById('preview-appointment');
const review = document.getElementById('appointment-review');
const done = document.getElementById('appointment-done');

function showTimes(service) {
  const labels = sampleTimes[service].map(time => {
    const label = document.createElement('label');
    label.className = 'time';
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'time';
    input.value = time;
    input.required = true;
    label.append(input, time);
    return label;
  });
  options.replaceChildren(...labels);
  times.hidden = false;
  preview.hidden = false;
}

form.addEventListener('change', event => {
  if (event.target.name === 'service') showTimes(event.target.value);
});

form.addEventListener('submit', event => {
  event.preventDefault();
  const service = form.querySelector('input[name="service"]:checked');
  const time = form.querySelector('input[name="time"]:checked');
  if (!service || !time) return;

  const card = service.closest('.service');
  const details = [card.querySelector('.service-copy strong').textContent,
    ...Array.from(card.querySelector('.service-meta').children, element => element.textContent),
    time.value];
  document.getElementById('selection').textContent = details.join(' · ');
  form.hidden = true;
  review.hidden = false;
  document.getElementById('review-title').focus();
});

document.getElementById('edit').addEventListener('click', () => {
  review.hidden = true;
  form.hidden = false;
  form.querySelector('input[name="time"]:checked').focus();
});

document.getElementById('confirm').addEventListener('click', () => {
  review.hidden = true;
  done.hidden = false;
  document.getElementById('done-title').focus();
});

document.getElementById('restart').addEventListener('click', () => {
  form.reset();
  options.replaceChildren();
  times.hidden = true;
  preview.hidden = true;
  done.hidden = true;
  form.hidden = false;
  form.querySelector('input[name="service"]').focus();
});

form.dataset.ready = '';
const restoredService = form.querySelector('input[name="service"]:checked');
if (restoredService) showTimes(restoredService.value);
