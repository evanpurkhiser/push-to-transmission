if (!window.SendToTransmissionAdded) {
  chrome.runtime.onMessage.addListener(({ message, options }) => {
    const type = options.error ? 'error' : 'success';

    // Create a new message element
    const el = document.createElement('div');
    el.classList.add(
      'send-to-transmission-message',
      `send-to-transmission-message-${type}`
    );

    // Add the message text
    const text = document.createElement('p');
    text.insertAdjacentText('afterbegin', message);
    el.append(text);

    // Add the torrent name if provided
    if (options.torrentName) {
      const text = document.createElement('p');
      text.classList.add('send-to-transmission-message-torrent-name');
      text.insertAdjacentText('afterbegin', options.torrentName);
      el.append(text);
    }

    // Animate out prior messages
    Array.prototype.slice
      .call(document.querySelectorAll('.send-to-transmission-message'))
      .map(el => el.classList.add('send-to-transmission-message-hide'));

    document.body.insertAdjacentElement('beforeend', el);
    setTimeout(_ => el.remove(), 4000);
  });
}

window.SendToTransmissionAdded = true;
