// ==UserScript==
// @name         BrokeCord Solver 2
// @version      0.1
// @description
// @match        https://*.discord.com/*
// @match        https://*.hcaptcha.com/*
// @grant        none
// ==/UserScript==
// Same script than userscript.txt, perhaps this can better reduce detection (mangled variables)
(() => {
  'use strict';

  const B = (() => {
    const sleep = (ms = 1000) => new Promise(resolve => setTimeout(resolve, ms));
    const randomSleep = async (min, max) => {
      const delay = Math.floor(Math.random() * (max - min) + min);
      await sleep(delay);
    };
    const now = () => {
      if (!Date.now) Date.now = () => new Date().getTime();
      return Date.now();
    };
    return { m: sleep, g: randomSleep, now };
  })();

  const triggerMouseEvents = element => {
    if (!element) return;
    const events = ['mouseover', 'mouseenter', 'mousedown', 'mouseup', 'click', 'mouseout'];
    events.forEach(eventType => {
      const event = new MouseEvent(eventType, {
        detail: eventType === 'mouseover' ? 0 : 1,
        view: window,
        bubbles: true,
        cancelable: true,
        clientX: null,
        clientY: null
      });
      element.dispatchEvent(event);
    });
  };

  const handleCaptcha = async () => {
    await B.m(3000);
    triggerMouseEvents(document.querySelector('#menu-info'));
    triggerMouseEvents(document.querySelector('#text_challenge'));
    let active = 1;

    while (active > 0) {
      for (let i = 0; i < 3; i++) {
        await B.m(2000);
        const prompt1 = document.querySelector('h2.prompt-text#prompt')?.innerText?.replace(/\s+/g, ' ')?.trim();
        const prompt2 = document.querySelector('div.text-text#prompt-text')?.innerText?.replace(/\s+/g, ' ')?.trim();
        const fulltask = `${prompt1}: ${prompt2}`;
        const apiUrl = 'http://127.0.0.1:5000/api';

        if (prompt1 && prompt2) {
          try {
            const response = await fetch(apiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ fulltask })
            });
            const result = await response.json();
            console.log('Question:', fulltask);

            const input = document.querySelector('input[type="text"]');
            triggerMouseEvents(input);

            const normalizeAnswer = text => {
              const cleaned = text.toLowerCase().replace(/[^a-zí]/g, '');
              if (/(no|sí)$/.test(cleaned)) return cleaned;
              return Math.random() < 0.5 ? 'no' : 'sí';
            };

            const fixedString = normalizeAnswer(result.answer);
            const typeResponse = await fetch('http://127.0.0.1:5000/type', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', o: '*' },
              body: JSON.stringify({ fixedString })
            });
            const typed = await typeResponse.json();
            console.log(typed);
          } catch (err) {
            console.error('Error calling API:', err);
          }
        }
      }
      await B.m(3000);
      active = checkError() ? 1 : 0;
    }
  };

  const submit = () => {
    try {
      triggerMouseEvents(document.querySelector('.button-submit'));
    } catch (err) {
      console.error('Error submitting', err);
    }
  };

  const initCaptcha = async () => {
    await B.m(500);
    await startCaptcha();
  };

  const runCaptcha = async () => {
    if (document.querySelector('.display-language .text')) {
      triggerMouseEvents(document.querySelector('.language-selector .option:nth-child(90)'));
      await B.m(500);
    }
    await handleCaptcha();
  };

  const waitForIframe = () =>
    new Promise(resolve => {
      const interval = setInterval(() => {
        if (document.querySelector('iframe[src*="newassets.hcaptcha.com"]')) {
          clearInterval(interval);
          resolve(true);
        }
      }, 500);
    });

  const hasPrompt = () => !!document.querySelector('h2.prompt-text');

  const startCaptcha = async () => {
    triggerMouseEvents(document.querySelector('#anchor'));
    await B.m(1000);
    if (hasPrompt()) await runCaptcha();
  };

  const checkError = () => {
    const el = document.querySelector('div.error-text');
    return el && (el.innerText.includes('Inténtalo de nuevo') || el.innerText.includes('⚠️'));
  };

  (async () => {
    await B.m(1000);
    if (waitForIframe()) initCaptcha();
  })();
})();
