const enquiryLink = document.querySelector('#enquiry-email');
const form = document.querySelector('#brief');
const status = document.querySelector('#form-status');

function formatBrief() {
  const values = new FormData(form);
  return [
    'Website project enquiry',
    '',
    'Name: ' + values.get('name'),
    'Email: ' + values.get('email'),
    'Project type: ' + values.get('kind'),
    '',
    values.get('details')
  ].join('\n');
}

form.addEventListener('submit', event => {
  event.preventDefault();
  const subject = encodeURIComponent('Website project enquiry');
  const body = encodeURIComponent(formatBrief());
  window.location.href = enquiryLink.href + '?subject=' + subject + '&body=' + body;
});

document.querySelector('#download-brief').addEventListener('click', () => {
  if (!form.reportValidity()) return;

  const url = URL.createObjectURL(new Blob([formatBrief()], {type: 'text/plain;charset=utf-8'}));
  const download = document.createElement('a');
  download.href = url;
  download.download = 'website-project-brief.txt';
  download.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
  status.textContent = 'Your brief is ready to attach to an email.';
});

form.hidden = false;
