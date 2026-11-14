const enquiryEmail = '';
const form = document.querySelector('#brief');
const status = document.querySelector('#form-status');
if (enquiryEmail) {
  document.querySelector('#form-button').textContent = 'Open email draft ↗';
  status.textContent = 'Your email app will open with your project brief ready to send.';
}
form.addEventListener('submit', event => {
  event.preventDefault();
  const values = new FormData(form);
  const brief = ['Website project enquiry', '', 'Name: ' + values.get('name'), 'Email: ' + values.get('email'), 'Project type: ' + values.get('kind'), '', values.get('details')].join('\n');
  if (enquiryEmail) {
    window.location.href = 'mailto:' + enquiryEmail + '?subject=' + encodeURIComponent('Website project enquiry') + '&body=' + encodeURIComponent(brief);
    return;
  }
  const url = URL.createObjectURL(new Blob([brief], {type: 'text/plain;charset=utf-8'}));
  const download = document.createElement('a');
  download.href = url;
  download.download = 'website-project-brief.txt';
  download.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
  status.textContent = 'Your brief is ready to save.';
});
