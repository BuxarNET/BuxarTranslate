console.log("BuxarTranslate loaded");

const defaultSettings = {
  translateTo: "ru",
  autoDetectLanguage: true,
  windowDisplayTime: 5,
  userLang: "auto"
};

// Расширенный список поддерживаемых языков
const supportedLanguages = {
  'af': 'Afrikaans', 'sq': 'Albanian', 'am': 'Amharic', 'ar': 'Arabic', 'hy': 'Armenian',
  'az': 'Azerbaijani', 'eu': 'Basque', 'be': 'Belarusian', 'bn': 'Bengali', 'bs': 'Bosnian',
  'bg': 'Bulgarian', 'ca': 'Catalan', 'ceb': 'Cebuano', 'zh': 'Chinese (Simplified)',
  'zh-TW': 'Chinese (Traditional)', 'co': 'Corsican', 'hr': 'Croatian', 'cs': 'Czech',
  'da': 'Danish', 'nl': 'Dutch', 'en': 'English', 'eo': 'Esperanto', 'et': 'Estonian',
  'fi': 'Finnish', 'fr': 'French', 'fy': 'Frisian', 'gl': 'Galician', 'ka': 'Georgian',
  'de': 'German', 'el': 'Greek', 'gu': 'Gujarati', 'ht': 'Haitian Creole', 'ha': 'Hausa',
  'haw': 'Hawaiian', 'he': 'Hebrew', 'hi': 'Hindi', 'hmn': 'Hmong', 'hu': 'Hungarian',
  'is': 'Icelandic', 'ig': 'Igbo', 'id': 'Indonesian', 'ga': 'Irish', 'it': 'Italian',
  'ja': 'Japanese', 'jv': 'Javanese', 'kn': 'Kannada', 'kk': 'Kazakh', 'km': 'Khmer',
  'rw': 'Kinyarwanda', 'ko': 'Korean', 'ku': 'Kurdish', 'ky': 'Kyrgyz', 'lo': 'Lao',
  'lv': 'Latvian', 'lt': 'Lithuanian', 'lb': 'Luxembourgish', 'mk': 'Macedonian',
  'mg': 'Malagasy', 'ms': 'Malay', 'ml': 'Malayalam', 'mt': 'Maltese', 'mi': 'Maori',
  'mr': 'Marathi', 'mn': 'Mongolian', 'my': 'Myanmar (Burmese)', 'ne': 'Nepali',
  'no': 'Norwegian', 'ny': 'Nyanja (Chichewa)', 'or': 'Odia (Oriya)', 'ps': 'Pashto',
  'fa': 'Persian', 'pl': 'Polish', 'pt': 'Portuguese', 'pa': 'Punjabi', 'ro': 'Romanian',
  'ru': 'Russian', 'sm': 'Samoan', 'gd': 'Scots Gaelic', 'sr': 'Serbian', 'st': 'Sesotho',
  'sn': 'Shona', 'sd': 'Sindhi', 'si': 'Sinhala (Sinhalese)', 'sk': 'Slovak', 'sl': 'Slovenian',
  'so': 'Somali', 'es': 'Spanish', 'su': 'Sundanese', 'sw': 'Swahili', 'sv': 'Swedish',
  'tl': 'Tagalog (Filipino)', 'tg': 'Tajik', 'ta': 'Tamil', 'tt': 'Tatar', 'te': 'Telugu',
  'th': 'Thai', 'tr': 'Turkish', 'tk': 'Turkmen', 'uk': 'Ukrainian', 'ur': 'Urdu',
  'ug': 'Uyghur', 'uz': 'Uzbek', 'vi': 'Vietnamese', 'cy': 'Welsh', 'xh': 'Xhosa',
  'yi': 'Yiddish', 'yo': 'Yoruba', 'zu': 'Zulu'
};

// Функция для получения перевода с учетом языка пользователя
async function getUserTranslation(messageKey, substitutions = []) {
    const settings = await browser.storage.local.get(defaultSettings);
    const userLang = settings.userLang || 'auto';

    let currentLang = 'en';
    if (userLang === 'auto') {
        const uiLang = browser.i18n.getUILanguage();
        currentLang = uiLang.startsWith('ru') ? 'ru' : 'en';
    } else {
        currentLang = userLang;
    }

    // Загружаем переводы для нужного языка
    try {
        const response = await fetch(`/_locales/${currentLang}/messages.json`);
        if (response.ok) {
            const translations = await response.json();
            if (translations[messageKey] && translations[messageKey].message) {
                let message = translations[messageKey].message;
                substitutions.forEach((sub, index) => {
                    message = message.replace(`$${index + 1}`, sub);
                });
                return message;
            }
        }
    } catch (error) {
        console.log('Error loading custom translations:', error);
    }

    // Fallback к стандартному i18n
    return browser.i18n.getMessage(messageKey, substitutions);
}

// Инициализация
browser.runtime.onInstalled.addListener(() => {
  console.log("Extension installed");
  browser.storage.local.set(defaultSettings);
  updateContextMenu();
});

// Обновление контекстного меню с выбранным языком
async function updateContextMenu() {
  const settings = await browser.storage.local.get(defaultSettings);
  const targetLangName = getLanguageName(settings.translateTo);

  // Получаем перевод для контекстного меню с учетом языка пользователя
  const menuTitle = await getUserTranslation("translateTo", [targetLangName]);

  browser.menus.removeAll().then(() => {
    browser.menus.create({
      id: "translate",
      title: menuTitle,
      contexts: ["selection"]
    });
    console.log(`Context menu updated: ${menuTitle}`);
  }).catch(error => {
    console.error("Error creating menu:", error);
  });
}

// Обработчик контекстного меню
browser.menus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "translate" && info.selectionText) {
    const text = info.selectionText.trim();
    if (text.length > 0) {
      console.log("Context menu clicked with text:", text);

      // Выполняем перевод
      const translation = await translateText(text);

      // Сразу показываем стандартное уведомление (без задержки)
      console.log("Showing native notification immediately");
      showNotification(translation);

      // Сразу открываем отдельное окно (без задержки)
      console.log("Opening separate translation window immediately");
      openTranslationWindow(translation);
    }
  }
});

// Функция для открытия отдельного окна с переводом
async function openTranslationWindow(translation) {
  try {
    const settings = await browser.storage.local.get(defaultSettings);
    const displayTime = settings.windowDisplayTime || 30;
    const sourceLangName = getLanguageName(translation.sourceLang);
    const targetLangName = getLanguageName(translation.targetLang);

    // Получаем переводы для окна с учетом языка пользователя
    const translationResultText = await getUserTranslation("translationResult");
    const originalTextLabel = await getUserTranslation("originalText", [sourceLangName]);
    const translatedTextLabel = await getUserTranslation("translatedText", [targetLangName]);
    const copyTranslationText = await getUserTranslation("copyTranslation");
    const copiedToClipboardText = await getUserTranslation("copiedToClipboard");
    const closeText = await getUserTranslation("close");
    const autoCloseNotice = await getUserTranslation("thisWindowWillClose", [displayTime.toString()]);
    const extensionName = await getUserTranslation("buxarTranslateExtension");
    const translatedAtText = await getUserTranslation("translatedAt", [new Date(translation.timestamp).toLocaleString()]);

    const windowContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${translationResultText}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            width: 100vw;
            height: 100vh;
            font-family: Arial, sans-serif;
            background: #f5f5f5;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
          }
          .translation-container {
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            width: 100%;
            max-width: 500px;
            border: 2px solid #0066cc;
            position: relative;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 1px solid #eee;
          }
          .header h3 {
            color: #333;
            margin-bottom: 5px;
          }
          .language-direction {
            color: #0066cc;
            font-weight: bold;
            font-size: 14px;
          }
          .translator-badge {
            background: #28a745;
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 11px;
            margin-left: 8px;
          }
          .text-section {
            margin: 15px 0;
          }
          .section-label {
            font-weight: bold;
            color: #333;
            margin-bottom: 8px;
            font-size: 14px;
          }
          .text-content {
            background: #f8f9fa;
            padding: 12px;
            border-radius: 6px;
            border-left: 3px solid #0066cc;
            line-height: 1.4;
            font-size: 14px;
            max-height: 150px;
            overflow-y: auto;
            white-space: pre-wrap;
            word-wrap: break-word;
          }
          .translated-text {
            background: #e7f3ff;
            border-left-color: #28a745;
          }
          .actions {
            display: flex;
            gap: 10px;
            margin: 20px 0 10px 0;
          }
          .action-btn {
            flex: 1;
            padding: 10px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            transition: background 0.2s;
          }
          .copy-btn {
            background: #28a745;
            color: white;
          }
          .copy-btn:hover {
            background: #218838;
          }
          .close-btn {
            background: #dc3545;
            color: white;
          }
          .close-btn:hover {
            background: #c82333;
          }
          .footer {
            text-align: center;
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 12px;
          }
          .auto-close-notice {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 4px;
            padding: 8px;
            margin-top: 10px;
            font-size: 11px;
            color: #856404;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="translation-container">
          <div class="header">
            <h3>🔤 ${translationResultText}</h3>
            <div class="language-direction">
              ${sourceLangName} → ${targetLangName}
              <span class="translator-badge">GOOGLE</span>
            </div>
          </div>

          <div class="text-section">
            <div class="section-label">${originalTextLabel}</div>
            <div class="text-content" id="originalText">${escapeHtml(translation.original)}</div>
          </div>

          <div class="text-section">
            <div class="section-label">${translatedTextLabel}</div>
            <div class="text-content translated-text" id="translatedText">${escapeHtml(translation.translated)}</div>
          </div>

          <div class="actions">
            <button class="action-btn copy-btn" id="copyTranslatedBtn">${copyTranslationText}</button>
            <button class="action-btn close-btn" id="closeBtn">${closeText}</button>
          </div>

          <div class="auto-close-notice">
            ${autoCloseNotice}
          </div>

          <div class="footer">
            ${extensionName}<br>
            <small>${translatedAtText}</small>
          </div>
        </div>

        <script>
          function escapeHtml(unsafe) {
            return unsafe
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;")
              .replace(/'/g, "&#039;");
          }

          // Функция для отправки сообщений в background script
          function sendMessageToBackground(message) {
            if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.sendMessage) {
              browser.runtime.sendMessage(message);
            } else if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
              chrome.runtime.sendMessage(message);
            }
          }

          document.getElementById('closeBtn').addEventListener('click', function() {
            sendMessageToBackground({ action: "closeTranslationWindow" });
          });

          document.getElementById('copyTranslatedBtn').addEventListener('click', function() {
            const translatedText = document.getElementById('translatedText').textContent;
            navigator.clipboard.writeText(translatedText).then(() => {
              const originalText = this.textContent;
              this.textContent = '${copiedToClipboardText}';
              this.style.background = '#6c757d';

              setTimeout(() => {
                this.textContent = originalText;
                this.style.background = '#28a745';
              }, 2000);
            }).catch(err => {
              console.error('Copy failed:', err);
              this.textContent = '❌ ${copyTranslationText}';
              setTimeout(() => {
                this.textContent = '${copyTranslationText}';
              }, 2000);
            });
          });

          // Закрытие при нажатии Escape
          document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') {
              sendMessageToBackground({ action: "closeTranslationWindow" });
            }
          });

          // Фокус на окне при открытии
          window.focus();
        </script>
      </body>
      </html>
    `;

    // Создаем blob URL для стабильного окна
    const blob = new Blob([windowContent], {type: 'text/html'});
    const url = URL.createObjectURL(blob);

    // Создаем отдельное окно и сохраняем его ID
    const translationWindow = await browser.windows.create({
      url: url,
      type: 'popup',
      width: 550,
      height: 600,
      left: 100,
      top: 50
    });

    console.log("Translation window opened with ID:", translationWindow.id);

    // Сохраняем ID окна для последующего закрытия
    await browser.storage.local.set({
      translationWindowId: translationWindow.id
    });

    // Автоматически закрываем окно через заданное время
    setTimeout(async () => {
      try {
        const storage = await browser.storage.local.get("translationWindowId");
        if (storage.translationWindowId) {
          await browser.windows.remove(storage.translationWindowId);
          console.log("Translation window closed by timeout");
          await browser.storage.local.remove("translationWindowId");
        }
      } catch (error) {
        console.log("Error closing window by timeout:", error);
      }
    }, displayTime * 1000);

  } catch (error) {
    console.error("Error showing translation window:", error);
  }
}


// Основная функция перевода
async function translateText(text, targetLang = null) {
  console.log("Starting translation for:", text);

  try {
    const settings = await browser.storage.local.get(defaultSettings);
    const finalTargetLang = targetLang || settings.translateTo;

    const sourceLang = await detectLanguage(text);
    console.log(`Detected language: ${sourceLang} -> ${finalTargetLang}`);

    const translatedText = await translateWithGoogle(text, sourceLang, finalTargetLang);

    const translation = {
      original: text,
      translated: translatedText,
      sourceLang: sourceLang,
      targetLang: finalTargetLang,
      timestamp: Date.now(),
      translator: "google"
    };

    await browser.storage.local.set({ lastTranslation: translation });

    console.log("Translation completed successfully");
    return translation;

  } catch (error) {
    console.error("Translation error:", error);
    showError("Translation failed: " + error.message);
    throw error;
  }
}

// Функция определения языка
async function detectLanguage(text) {
  if (text.length < 2) return "auto";

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=ld&q=${encodeURIComponent(text)}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Language detection failed: ${response.status}`);
    }

    const data = await response.json();
    return data && data[2] ? data[2] : "auto";

  } catch (error) {
    console.error("Language detection error:", error);
    return "auto";
  }
}

// Перевод через Google API с сохранением форматирования
async function translateWithGoogle(text, sourceLang, targetLang) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Google API error: ${response.status}`);
  }

  const data = await response.json();
  let translatedText = "";

  if (data && data[0]) {
    data[0].forEach(item => {
      if (item[0]) translatedText += item[0];
    });
  }

  // Сохраняем переносы строк из оригинального текста
  return preserveLineBreaks(translatedText || text, text);
}

// Функция для сохранения переносов строк
function preserveLineBreaks(translatedText, originalText) {
  // Если в оригинале есть переносы строк, применяем их к переводу
  if (originalText.includes('\n')) {
    const originalLines = originalText.split('\n');
    const translatedLines = translatedText.split('\n');

    // Если количество строк совпадает, используем структуру оригинала
    if (originalLines.length === translatedLines.length) {
      return translatedLines.join('\n');
    }

    // Если перевод вернулся как одна строка, но оригинал был с переносами,
    // пытаемся разбить перевод по смыслу
    if (translatedLines.length === 1 && originalLines.length > 1) {
      // Просто возвращаем перевод как есть - лучше одна строка чем неправильное разбиение
      return translatedText;
    }
  }

  return translatedText;
}

// Получение названия языка по коду
function getLanguageName(langCode) {
  return supportedLanguages[langCode] || langCode;
}

// Функция для экранирования HTML
function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Показываем уведомление с результатом
function showNotification(translation) {
  if (!browser.notifications) {
    console.log("Browser notifications not available");
    return;
  }

  const sourceLangName = getLanguageName(translation.sourceLang);
  const targetLangName = getLanguageName(translation.targetLang);

  const formatText = (text, maxLength = 80) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  };

  const originalShort = formatText(translation.original);
  const translatedShort = formatText(translation.translated);

  const title = `✅ ${sourceLangName} → ${targetLangName}`;
  const message = `"${originalShort}"\n↓\n"${translatedShort}"`;

  console.log("Creating native notification:", title);

  browser.notifications.create({
    type: "basic",
    iconUrl: "icon.png",
    title: title,
    message: message
  }).then(() => {
    console.log("Native notification shown successfully");
  }).catch(error => {
    console.error("Error showing native notification:", error);
  });
}

// Показываем ошибку
function showError(message) {
  if (browser.notifications) {
    browser.notifications.create({
      type: "basic",
      iconUrl: "icon.png",
      title: "❌ Translation Error",
      message: message
    });
  }
}

// Обработчик сообщений от popup
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Message received:", request);

  if (request.action === "getTranslation") {
    browser.storage.local.get("lastTranslation").then(result => {
      sendResponse(result);
    });
    return true;
  }

  if (request.action === "getSettings") {
    browser.storage.local.get(defaultSettings).then(settings => {
      // Загружаем последние языки
      return browser.storage.local.get("recentLanguages").then(storage => {
        sendResponse({
          settings: settings,
          supportedLanguages: supportedLanguages,
          recentLanguages: storage.recentLanguages || ['ru', 'en', 'es', 'fr', 'de']
        });
      });
    });
    return true;
  }

  if (request.action === "saveSettings") {
    browser.storage.local.set(request.settings).then(() => {
        // Обновляем последние языки
        updateRecentLanguages(request.settings.translateTo);
        updateContextMenu(); // ОБНОВЛЯЕМ КОНТЕКСТНОЕ МЕНЮ ПРИ СОХРАНЕНИИ НАСТРОЕК
        sendResponse({success: true});
    });
    return true;
  }

  if (request.action === "closeTranslationWindow") {
    closeTranslationWindow();
    sendResponse({success: true});
    return true;
  }
});

// Функция для закрытия окна перевода
async function closeTranslationWindow() {
  try {
    const storage = await browser.storage.local.get("translationWindowId");
    if (storage.translationWindowId) {
      await browser.windows.remove(storage.translationWindowId);
      console.log("Translation window closed by user request");
      await browser.storage.local.remove("translationWindowId");
    }
  } catch (error) {
    console.log("Error closing translation window:", error);
  }
}

// Функция для обновления последних языков
async function updateRecentLanguages(newLang) {
  const storage = await browser.storage.local.get("recentLanguages");
  let recentLanguages = storage.recentLanguages || ['ru', 'en', 'es', 'fr', 'de'];

  recentLanguages = recentLanguages.filter(lang => lang !== newLang);
  recentLanguages.unshift(newLang);
  recentLanguages = recentLanguages.slice(0, 5);

  await browser.storage.local.set({ recentLanguages: recentLanguages });
  console.log("Recent languages updated:", recentLanguages);
}
