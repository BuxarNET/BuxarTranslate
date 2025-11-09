let allLanguages = {};
let recentLanguages = [];
let filteredLanguages = {};
let currentUILang = 'en';
let availableUILanguages = {};
/* eslint-disable no-unsafe-innerhtml */
// Безопасная функция для установки HTML

// Функция для сканирования доступных языков
async function scanAvailableLanguages() {
    const languages = {};

    // Попробуем автоматически обнаружить языки
    try {
        const possibleLangs = ['en', 'ru', 'es', 'de', 'fr', 'it', 'zh', 'ja', 'ko', 'pt', 'ar', 'hi'];

        for (const lang of possibleLangs) {
            try {
                const response = await fetch(`/_locales/${lang}/messages.json`);
                if (response.ok) {
                    const translations = await response.json();
                    // Используем поле languageName из messages.json
                    if (translations.languageName && translations.languageName.message) {
                        languages[lang] = translations.languageName.message;
                    }
                }
            } catch (e) {
                // Язык недоступен, пропускаем
                console.log(`Language ${lang} not available`);
            }
        }
    } catch (error) {
        console.log('Error scanning languages:', error);
    }

    // Если не нашли ни одного языка, используем английский как fallback
    if (Object.keys(languages).length === 0) {
        languages['en'] = 'English';
    }

    return languages;
}


// Функция для заполнения выпадающего списка языков
function populateInterfaceLanguageSelect(languages) {
    const select = document.getElementById('interfaceLanguage');
    if (!select) return;

    // Сохраняем текущее значение
    const currentValue = select.value;

    // Очищаем существующие опции (кроме Auto)
    const autoOption = select.querySelector('option[value="auto"]');
    select.innerHTML = '';
    if (autoOption) {
        select.appendChild(autoOption);
    }

    // Добавляем доступные языки
    Object.entries(languages).forEach(([code, name]) => {
        const option = document.createElement('option');
        option.value = code;
        option.textContent = `${name} (${code})`;
        select.appendChild(option);
    });

    // Восстанавливаем значение
    if (currentValue && (currentValue === 'auto' || languages[currentValue])) {
        select.value = currentValue;
    } else if (languages['en']) {
        select.value = 'en';
    }
}

// Загружаем переводы для конкретного языка
async function loadTranslations(lang) {
    try {
        const response = await fetch(`_locales/${lang}/messages.json`);
        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        console.error(`Error loading translations for ${lang}:`, error);
    }
    return null;
}

// Менеджер языка
const LanguageManager = {
    translations: {},
    currentLang: 'en',
    availableLanguages: {},

    async init() {
        // Сначала сканируем доступные языки
        this.availableLanguages = await scanAvailableLanguages();
        availableUILanguages = this.availableLanguages;

        // Загружаем настройки чтобы определить язык
        const storage = await browser.storage.local.get('userLang');
        const userLang = storage.userLang || 'auto';

        // Определяем какой язык использовать
        if (userLang === 'auto') {
            const uiLang = browser.i18n.getUILanguage();
            // Проверяем доступность системного языка
            const systemLang = uiLang.split('-')[0];
            this.currentLang = this.availableLanguages[systemLang] ? systemLang : 'en';
        } else {
            this.currentLang = this.availableLanguages[userLang] ? userLang : 'en';
        }

        currentUILang = this.currentLang;

        // Загружаем переводы для выбранного языка
        this.translations = await loadTranslations(this.currentLang) || {};
        console.log(`Loaded translations for: ${this.currentLang}`);

        // Создаем кнопки языков и заполняем выпадающий список

        populateInterfaceLanguageSelect(this.availableLanguages);
    },

    getCurrentLang() {
        return this.currentLang;
    },

    getTranslation(messageKey, substitutions = []) {
        // Сначала пытаемся получить перевод из загруженного файла
        if (this.translations[messageKey] && this.translations[messageKey].message) {
            let message = this.translations[messageKey].message;

            // Заменяем плейсхолдеры $1, $2, etc.
            substitutions.forEach((sub, index) => {
                message = message.replace(`$${index + 1}`, sub);
            });

            return message;
        }

        // Fallback к стандартному i18n
        return browser.i18n.getMessage(messageKey, substitutions);
    },

    translatePage() {
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(element => {
            const messageKey = element.getAttribute('data-i18n');
            let message = this.getTranslation(messageKey);

            if (message) {
                element.textContent = message;
            }
        });

        const placeholders = document.querySelectorAll('[data-i18n-placeholder]');
        placeholders.forEach(element => {
            const messageKey = element.getAttribute('data-i18n-placeholder');
            const message = this.getTranslation(messageKey);
            if (message) {
                element.placeholder = message;
            }
        });


    }
};

// Функция для получения перевода
function getTranslation(messageKey, substitutions = []) {
    return LanguageManager.getTranslation(messageKey, substitutions);
}

document.addEventListener('DOMContentLoaded', async function() {
    console.log("Popup loaded");

    // Инициализируем менеджер языка
    await LanguageManager.init();
    LanguageManager.translatePage();

    // Загружаем настройки
    await loadSettings();

    // Обработчики событий
    document.getElementById('saveSettings').addEventListener('click', saveSettings);
    document.getElementById('searchLanguage').addEventListener('input', filterLanguages);

    // Обработчик для клавиши Enter в поиске
    document.getElementById('searchLanguage').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const select = document.getElementById('targetLanguage');
            const visibleOptions = Array.from(select.options).filter(opt => opt.style.display !== 'none');
            if (visibleOptions.length > 0) {
                select.value = visibleOptions[0].value;
                updateQuickLanguagesActiveState(visibleOptions[0].value);
            }
        }
    });
	// ЗАГРУЖАЕМ ПОСЛЕДНИЙ ПЕРЕВОД ПОСЛЕ ВСЕХ НАСТРОЕК
	    await loadLastTranslation();
	});

// Загружаем настройки (без переводов)
async function loadSettings() {
    try {
        showStatus(getTranslation("loading"), "success");
        const response = await browser.runtime.sendMessage({action: "getSettings"});
        console.log("Settings loaded:", response);

        if (response.supportedLanguages) {
            allLanguages = response.supportedLanguages;
            filteredLanguages = {...allLanguages};
            populateLanguageSelect(allLanguages);
            updateLanguageCount(Object.keys(allLanguages).length);

            recentLanguages = response.recentLanguages || ['ru', 'en', 'es', 'fr', 'de'];
            updateQuickLanguages();
        }

        if (response.settings) {
            const select = document.getElementById('targetLanguage');
            if (response.settings.translateTo && allLanguages[response.settings.translateTo]) {
                select.value = response.settings.translateTo;
                updateQuickLanguagesActiveState(response.settings.translateTo);
            }

            document.getElementById('windowDisplayTime').value = response.settings.windowDisplayTime || 30;

            // Устанавливаем язык интерфейса
            const interfaceLang = response.settings.userLang || 'auto';
            document.getElementById('interfaceLanguage').value = interfaceLang;


        }

        // Загружаем последний перевод
        await loadLastTranslation();

        showStatus(getTranslation("settingsLoaded"), "success");

    } catch (error) {
        console.error("Error loading settings:", error);
        showStatus(getTranslation("errorLoadingSettings"), "error");
    }
}

// Загружаем последний перевод
async function loadLastTranslation() {
    try {
        console.log("Loading last translation...");
        const response = await browser.runtime.sendMessage({action: "getTranslation"});
        console.log("Translation response:", response);
        
        if (response && response.lastTranslation) {
            displayTranslation(response.lastTranslation);
        } else {
            console.log("No translation found, showing default message");
            showNoTranslation();
        }
    } catch (error) {
        console.error("Error loading translation:", error);
        showNoTranslation();
    }
}

function populateLanguageSelect(languages) {
    const select = document.getElementById('targetLanguage');
    const currentValue = select.value;

    select.innerHTML = '';

    const sortedLanguages = Object.entries(languages).sort((a, b) => a[1].localeCompare(b[1]));

    sortedLanguages.forEach(([code, name]) => {
        const option = document.createElement('option');
        option.value = code;
        option.textContent = name;
        select.appendChild(option);
    });

    if (currentValue && languages[currentValue]) {
        select.value = currentValue;
    }
}

function filterLanguages() {
    const searchTerm = document.getElementById('searchLanguage').value.toLowerCase().trim();
    const select = document.getElementById('targetLanguage');
    const options = Array.from(select.options);

    let visibleCount = 0;
    let firstVisibleOption = null;

    options.forEach(option => {
        const text = option.textContent.toLowerCase();
        const value = option.value.toLowerCase();

        if (searchTerm === '' || text.includes(searchTerm) || value.includes(searchTerm)) {
            option.style.display = 'block';
            visibleCount++;
            if (!firstVisibleOption) {
                firstVisibleOption = option;
            }
        } else {
            option.style.display = 'none';
        }
    });

    const currentOption = select.options[select.selectedIndex];
    if (currentOption && currentOption.style.display === 'none' && firstVisibleOption) {
        select.value = firstVisibleOption.value;
        updateQuickLanguagesActiveState(firstVisibleOption.value);
    }

    updateLanguageCount(visibleCount);
}

function updateLanguageCount(count) {
    const countElement = document.getElementById('languageCount');
    if (count !== undefined) {
        countElement.textContent = getTranslation("languagesFound", [count.toString()]);
    } else {
        countElement.textContent = getTranslation("languagesAvailable", [Object.keys(allLanguages).length.toString()]);
    }
}

function updateQuickLanguages() {
    const container = document.getElementById('quickLanguages');
    container.innerHTML = '';

    if (recentLanguages.length === 0) {
        recentLanguages = ['ru', 'en', 'es', 'fr', 'de'];
    }

    recentLanguages.forEach(langCode => {
        if (allLanguages[langCode]) {
            const button = document.createElement('button');
            button.className = 'quick-lang-btn';
            button.type = 'button';

            let displayName = allLanguages[langCode];
            if (displayName.length > 12) {
                const words = displayName.split(' ');
                if (words[0].length <= 12) {
                    displayName = words[0];
                } else {
                    displayName = displayName.substring(0, 10) + '..';
                }
            }

            button.textContent = displayName;
            button.title = allLanguages[langCode];
            button.setAttribute('data-lang', langCode);

            const select = document.getElementById('targetLanguage');
            if (select.value === langCode) {
                button.classList.add('active');
            }

            button.addEventListener('click', function() {
                const langCode = this.getAttribute('data-lang');
                document.getElementById('targetLanguage').value = langCode;
                updateQuickLanguagesActiveState(langCode);
            });

            container.appendChild(button);
        }
    });
}

function updateQuickLanguagesActiveState(activeLang) {
    const buttons = document.querySelectorAll('.quick-lang-btn');
    buttons.forEach(button => {
        if (button.getAttribute('data-lang') === activeLang) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
}

async function saveSettings() {
    try {
        const select = document.getElementById('targetLanguage');
        const targetLang = select.value;
        const displayTime = parseInt(document.getElementById('windowDisplayTime').value) || 30;
        const interfaceLang = document.getElementById('interfaceLanguage').value;

        if (!targetLang) {
            showStatus(getTranslation("pleaseSelectLanguage"), "error");
            return;
        }

        if (!allLanguages[targetLang]) {
            showStatus(getTranslation("invalidLanguage"), "error");
            return;
        }

        if (displayTime < 5 || displayTime > 300) {
            showStatus(getTranslation("displayTimeRangeError"), "error");
            return;
        }

        showStatus(getTranslation("savingSettings"), "success");

        const settings = {
            translateTo: targetLang,
            autoDetectLanguage: true,
            windowDisplayTime: displayTime,
            userLang: interfaceLang
        };

        await browser.runtime.sendMessage({
            action: "saveSettings",
            settings: settings
        });

        const langName = allLanguages[targetLang];
        showStatus(getTranslation("nowTranslatingTo", [langName]), "success");

        document.getElementById('searchLanguage').value = '';
        const options = document.querySelectorAll('#targetLanguage option');
        options.forEach(option => {
            option.style.display = 'block';
        });
        updateLanguageCount(Object.keys(allLanguages).length);

    } catch (error) {
        console.error("Error saving settings:", error);
        showStatus(getTranslation("errorSavingSettings") + ": " + error.message, "error");
    }
}

// Функция для отображения перевода с сохранением форматирования
function displayTranslation(trans) {
    console.log("=== displayTranslation called ===");
    console.log("Translation data:", trans);
    
    const resultDiv = document.getElementById('result');
    console.log("Result div found:", !!resultDiv);
    
    if (!resultDiv) {
        console.error("❌ Result div element not found!");
        return;
    }
    
    if (!trans) {
        console.log("⚠️ No translation data provided, showing default message");
        showNoTranslation();
        return;
    }
    
    console.log("✅ Displaying translation...");
    
    // Полностью очищаем контейнер
    resultDiv.textContent = '';
    
    const sourceLangName = allLanguages[trans.sourceLang] || trans.sourceLang;
    const targetLangName = allLanguages[trans.targetLang] || trans.targetLang;

    // Создаем блок с оригинальным текстом
    const originalContainer = document.createElement('div');
    originalContainer.style.marginBottom = '12px';
    
    const originalLabel = document.createElement('strong');
    originalLabel.textContent = getTranslation("originalText", [sourceLangName]);
    
    const originalTextContainer = document.createElement('div');
    originalTextContainer.style.background = '#f8f9fa';
    originalTextContainer.style.padding = '10px';
    originalTextContainer.style.borderRadius = '6px';
    originalTextContainer.style.marginTop = '6px';
    originalTextContainer.style.borderLeft = '3px solid #0066cc';
    originalTextContainer.style.whiteSpace = 'pre-wrap';
    originalTextContainer.style.lineHeight = '1.4';
    originalTextContainer.textContent = trans.original;
    
    originalContainer.appendChild(originalLabel);
    originalContainer.appendChild(document.createElement('br'));
    originalContainer.appendChild(originalTextContainer);

    // Создаем блок с переведенным текстом
    const translatedContainer = document.createElement('div');
    translatedContainer.style.marginBottom = '12px';
    
    const translatedLabel = document.createElement('strong');
    translatedLabel.textContent = getTranslation("translatedText", [targetLangName]);
    
    const translatedTextContainer = document.createElement('div');
    translatedTextContainer.style.background = '#e7f3ff';
    translatedTextContainer.style.padding = '10px';
    translatedTextContainer.style.borderRadius = '6px';
    translatedTextContainer.style.marginTop = '6px';
    translatedTextContainer.style.borderLeft = '3px solid #28a745';
    translatedTextContainer.style.whiteSpace = 'pre-wrap';
    translatedTextContainer.style.lineHeight = '1.4';
    translatedTextContainer.textContent = trans.translated;
    
    translatedContainer.appendChild(translatedLabel);
    translatedContainer.appendChild(document.createElement('br'));
    translatedContainer.appendChild(translatedTextContainer);

    // Создаем блок с информацией о переводе
    const infoContainer = document.createElement('div');
    infoContainer.className = 'language-info';
    
    const detectedInfo = document.createElement('div');
    detectedInfo.textContent = getTranslation("autoDetected", [sourceLangName]);
    
    const translatorInfo = document.createElement('div');
    translatorInfo.textContent = getTranslation("translator");
    
    const timestampInfo = document.createElement('div');
    timestampInfo.textContent = '⏰ ' + new Date(trans.timestamp).toLocaleString();
    
    infoContainer.appendChild(detectedInfo);
    infoContainer.appendChild(translatorInfo);
    infoContainer.appendChild(timestampInfo);

    // Собираем все вместе
    resultDiv.appendChild(originalContainer);
    resultDiv.appendChild(translatedContainer);
    resultDiv.appendChild(infoContainer);

    // Создаем кнопку копирования
    const copyButton = document.createElement('button');
    copyButton.textContent = getTranslation("copyTranslation");
    copyButton.style.cssText = 'width: 100%; padding: 10px; margin-top: 12px; background: #28a745; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;';
    copyButton.onclick = function() {
        navigator.clipboard.writeText(trans.translated).then(() => {
            copyButton.textContent = getTranslation("copiedToClipboard");
            copyButton.style.background = '#6c757d';
            setTimeout(() => {
                copyButton.textContent = getTranslation("copyTranslation");
                copyButton.style.background = '#28a745';
            }, 2000);
        });
    };

    resultDiv.appendChild(copyButton);
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

function showNoTranslation() {
    const resultDiv = document.getElementById('result');
    if (!resultDiv) {
        console.error("Result div not found!");
        return;
    }
    
    // Полностью очищаем
    resultDiv.textContent = '';
    
    // Создаем элементы вручную
    const container = document.createElement('div');
    container.style.textAlign = 'center';
    container.style.color = '#6c757d';
    container.style.padding = '20px';
    
    const emoji = document.createElement('div');
    emoji.textContent = '🔤';
    emoji.style.fontSize = '48px';
    emoji.style.marginBottom = '10px';
    
    const message = document.createElement('strong');
    message.textContent = getTranslation("noTranslationsYet");
    
    const instruction = document.createElement('div');
    instruction.textContent = getTranslation("selectTextToTranslate");
    
    // Собираем структуру
    container.appendChild(emoji);
    container.appendChild(message);
    container.appendChild(document.createElement('br'));
    container.appendChild(instruction);
    
    resultDiv.appendChild(container);
}

function showStatus(message, type) {
    const statusDiv = document.getElementById('status');
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;

    const timeout = type === 'success' ? 3000 : 5000;
    setTimeout(() => {
        if (statusDiv.textContent === message) {
            statusDiv.textContent = '';
            statusDiv.className = 'status';
        }
    }, timeout);
}
