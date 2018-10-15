let options, sessionToken;

const OPTION_KEYS = ['host', 'port', 'url', 'username', 'password', 'https'];

function showMessage(message, options) {
  const sendMessage = _ =>
    chrome.tabs.query({ active: true, currentWindow: true }, tabs =>
      chrome.tabs.sendMessage(tabs[0].id, { message, options })
    );

  chrome.tabs.insertCSS({ file: 'css/message.css' });
  chrome.tabs.executeScript({ file: 'js/message.js' }, sendMessage);
}

function buildRequest(token, args = {}) {
  const scheme = options.https ? 'https://' : 'http://';
  const targetUrl = `${scheme}${options.host}:${options.port}${options.url}`;

  const headers = {
    'Content-type': 'application/json',
    'X-Transmission-Session-Id': token,
  };

  if (options.username) {
    const auth = btoa(`${options.username}:${options.password}`);
    headers['Authorization'] = `Basic ${auth}`;
  }

  return new Request(targetUrl, {
    method: 'POST',
    headers,
    ...args,
  });
}

async function addTorrent(base64Url) {
  const base64Data = base64Url.replace(
    'data:application/x-bittorrent;base64,',
    ''
  );

  const body = JSON.stringify({
    method: 'torrent-add',
    arguments: { metainfo: base64Data },
  });

  if (options.host === undefined) {
    showMessage('No IP/Hostname is set in options.', true);
    return;
  }

  const resp = await fetch(buildRequest(sessionToken, { body }));
  torrentAdded(resp, base64Url);
}

async function torrentAdded(response, base64Url) {
  const { status } = response;
  const error = true;

  if (status === 409) {
    getToken();
    addTorrent(base64Url);
    return;
  }

  if (status === 401) {
    showMessage('Incorrect username or password.', { error });
    return;
  }

  if (status !== 200) {
    showMessage('Failed to add torrent. Check your configuration.', { error });
    return;
  }

  const data = await response.json();

  if ('torrent-duplicate' in data.arguments) {
    showMessage('Torrent already exists.', { error });
    return;
  }

  if (data.result === 'success') {
    const torrentName = Object.values(data.arguments)[0].name;
    showMessage('Torrent successfully added.', { torrentName });
    return;
  }

  showMessage('Invalid torrent file.', { error });
}

async function getToken() {
  const resp = await fetch(buildRequest());
  const data = await resp.text();

  const match = data.match(/<code>X-Transmission-Session-Id: (.*?)<\/code>/);
  sessionToken = match[1];
}

function onRequest({ type, responseHeaders, url }) {
  const isTorrentFile = responseHeaders.some(
    h => h.name === 'content-type' && h.value === 'application/x-bittorrent'
  );

  if (!isTorrentFile || type == 'xmlhttprequest') {
    return;
  }

  const sendTorrentData = blob => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.addEventListener('loadend', _ => addTorrent(reader.result));
  };

  fetch(url)
    .then(resp => resp.blob())
    .then(sendTorrentData);

  // Cancel request silently
  return { redirectUrl: 'javascript:' };
}

function onOptions(init) {
  // Get chrome extension settings from storage
  chrome.storage.sync.get(OPTION_KEYS, items => {
    options = items;
    if (init) getToken();
  });
}

// Get options and intialize extension
onOptions(true);

// Setup listeners
chrome.storage.onChanged.addListener(onOptions);
chrome.webRequest.onHeadersReceived.addListener(
  onRequest,
  { urls: ['<all_urls>'] },
  ['blocking', 'responseHeaders']
);
