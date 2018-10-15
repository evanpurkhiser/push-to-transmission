function saveOptions(silentUpdate) {
  const host = document.getElementById('host').value;
  const port = document.getElementById('port').value;
  const https = document.getElementById('https').checked;
  const url = document.getElementById('url').value;
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  const btn = document.getElementById('save');
  const btnText = document.getElementById('content');
  const success = document.getElementById('success');

  // Get stored options
  chrome.storage.sync.set({ host, port, https, url, username, password }, _ => {
    if (silentUpdate == true) {
      return;
    }

    btn.classList.add('button-dark');
    btnText.style.display = 'none';
    success.style.display = 'block';
    success.classList.add('fadeIn');

    setTimeout(_ => {
      btn.classList.remove('button-dark');
      btnText.style.display = 'block';
      success.style.display = 'none';
      btnText.classList.add('fadeIn');
    }, 2000);
  });
}

function restoreOptions() {
  // Restore saved options to html fields
  chrome.storage.sync.get(
    {
      host: null,
      port: null,
      https: false,
      username: null,
      password: null,
      url: '/transmission/rpc',
    },
    function(items) {
      document.getElementById('host').value = items.host;
      document.getElementById('port').value = items.port;
      document.getElementById('https').checked = items.https;
      document.getElementById('url').value = items.url;
      document.getElementById('username').value = items.username;
      document.getElementById('password').value = items.password;
    }
  );
}

function enterKey() {
  if (event.keyCode === 13) {
    saveOptions();
  }
}

// Restore options on dom load and add event listeners to DOM elements
document.addEventListener('DOMContentLoaded', restoreOptions);
document.addEventListener('keydown', enterKey);
document.getElementById('save').addEventListener('click', saveOptions);
