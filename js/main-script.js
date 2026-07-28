// ======================== CONFIGURATION ========================
const Master_ID = '10g0Ctj_mEtozUcCPceI5LKXaZG1XXP0TpT0mGoNR3fM'; //master sheet id
const API_KEY = 'AIzaSyDc8tegwi2rgHyDFYm7uWBqVqQ7Fwb3uWM';
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzgnnDFUsZ1eVB6D3TR1_0x4EgFjsvFAAmaPxjNTiuy1xkmodnO_SU_oPB-UyvAhslL/exec'; // for login time stamp update
const MENU_Table = 'Menu';
const ICON_Table = 'icons';
const LOGIN_Table = 'Login';
const FLASH_Table = 'scroll texts';
const MENU_RANGE = 'A:D';
const ICON_RANGE = 'A:F';
const LOGIN_RANGE = 'B:D';
const FLASH_RANGE = 'A:A';

// Add cache-busting timestamp to all API calls
const CACHE_BUST = Date.now();

// Chat configuration for notification system
const CHAT_Master_ID = "1dkeQ7zsPi1dH1KHaf4BO9uKEWKgwSnbr59KHjc8n9QM";
const CHAT_Table_NAME = "Chats";
const CHAT_API_KEY = "AIzaSyDc8tegwi2rgHyDFYm7uWBqVqQ7Fwb3uWM";

let menuData = [];
let iconData = new Map();
let isAuthenticated = false;
let currentUser = null;
let flashNewsInterval = null;
let unreadCheckInterval = null;
let lastUnreadCount = 0;
let notificationSound = null;
let soundEnabled = true;
let audioContext = null;
let userInteracted = false;

// Make variables globally accessible for notification system
window.isAuthenticated = false;
window.currentUser = null;

// ======================== NOTIFICATION SOUND FUNCTIONS ========================
function initNotificationSound() {
    try {
        notificationSound = new Audio('./sweet.mp3');
        notificationSound.volume = 0.5;
        notificationSound.load();
        console.log("Notification sound loaded from ./sweet.mp3");

        if (!audioContext) {
            audioContext = new(window.AudioContext || window.webkitAudioContext)();
            console.log("Web Audio API context created (suspended)");
        }
    } catch (e) {
        console.log("Audio not supported or file not found:", e);
        notificationSound = null;
    }
}

function enableAudioOnUserInteraction() {
    if (userInteracted) return;
    userInteracted = true;

    console.log("User interaction detected - enabling audio");

    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
            console.log("AudioContext resumed successfully");
        }).catch(e => {
            console.log("Failed to resume AudioContext:", e);
        });
    }

    if (notificationSound) {
        try {
            notificationSound.volume = 0;
            notificationSound.play().then(() => {
                notificationSound.pause();
                notificationSound.currentTime = 0;
                notificationSound.volume = 0.5;
                console.log("Audio unlocked via silent playback");
            }).catch(e => {
                console.log("Silent playback failed:", e);
            });
        } catch (e) {
            console.log("Error unlocking audio:", e);
        }
    }
}

function setupUserInteractionListener() {
    const events = ['click', 'touchstart', 'keydown', 'mousedown'];
    const handler = function() {
        enableAudioOnUserInteraction();
        events.forEach(event => {
            document.removeEventListener(event, handler);
        });
    };

    events.forEach(event => {
        document.addEventListener(event, handler);
    });
}

function playNotificationSound() {
    if (!soundEnabled) {
        console.log("Sound disabled by user");
        return;
    }

    if (notificationSound) {
        try {
            notificationSound.currentTime = 0;
            const playPromise = notificationSound.play();

            if (playPromise !== undefined) {
                playPromise.then(() => {
                    console.log("Notification sound played successfully");
                }).catch(error => {
                    console.log("Audio play failed:", error.message);
                    playFallbackBeep();
                });
            }
        } catch (e) {
            console.log("Sound play error:", e);
            playFallbackBeep();
        }
    } else {
        playFallbackBeep();
    }
}

function playFallbackBeep() {
    if (!userInteracted && (!audioContext || audioContext.state !== 'running')) {
        console.log("Waiting for user interaction before playing beep");
        return;
    }

    try {
        let ctx = audioContext;
        if (!ctx) {
            ctx = new(window.AudioContext || window.webkitAudioContext)();
            audioContext = ctx;
        }

        if (ctx.state === 'suspended') {
            ctx.resume().then(() => {
                playBeepWithContext(ctx);
            }).catch(e => console.log("Cannot resume AudioContext:", e));
        } else if (ctx.state === 'running') {
            playBeepWithContext(ctx);
        } else {
            const tempCtx = new(window.AudioContext || window.webkitAudioContext)();
            tempCtx.resume().then(() => {
                playBeepWithContext(tempCtx);
                setTimeout(() => tempCtx.close(), 500);
            }).catch(e => console.log("Cannot create temp context:", e));
        }
    } catch (e) {
        console.log("Fallback beep failed:", e);
    }
}

function playBeepWithContext(ctx) {
    try {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.frequency.value = 880;
        gainNode.gain.value = 0.15;
        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.4);
        oscillator.stop(ctx.currentTime + 0.4);
        console.log("Fallback beep played");
    } catch (e) {
        console.log("Beep playback failed:", e);
    }
}

function toggleNotificationSound() {
    soundEnabled = !soundEnabled;
    localStorage.setItem('notificationSoundEnabled', soundEnabled);
    console.log("Notification sound:", soundEnabled ? "Enabled" : "Disabled");

    const soundIcon = document.getElementById('notificationSoundIcon');
    if (soundIcon) {
        soundIcon.innerHTML = soundEnabled ? '<i class="bi bi-volume-up-fill"></i>' : '<i class="bi bi-volume-mute-fill"></i>';
    }

    return soundEnabled;
}

const savedSoundPref = localStorage.getItem('notificationSoundEnabled');
if (savedSoundPref !== null) {
    soundEnabled = savedSoundPref === 'true';
}

// ======================== UPDATE LOGIN TIMESTAMP ========================
function updateLoginTimestamp(username) {
    return new Promise((resolve) => {
        try {
            const timestamp = new Date().toISOString();
            
            // Method 1: Try fetch with no-cors mode (most reliable)
            const fetchUrl = `${WEB_APP_URL}?action=updateLoginTime&username=${encodeURIComponent(username)}&timestamp=${encodeURIComponent(timestamp)}`;
            
            fetch(fetchUrl, {
                method: 'GET',
                mode: 'no-cors',
                cache: 'no-cache'
            })
            .then(() => {
                console.log('✓ Login timestamp update attempted for', username);
                resolve(true);
            })
            .catch(() => {
                // If fetch fails, try JSONP method
                console.log('Fetch failed, trying JSONP method...');
                tryJSONPMethod(username, timestamp, resolve);
            });
            
            // Set timeout to prevent hanging
            setTimeout(() => {
                console.warn('⚠ Timestamp update timeout for', username);
                resolve(false);
            }, 15000);
            
        } catch (error) {
            console.error('Error updating timestamp:', error);
            resolve(false);
        }
    });
}

// JSONP fallback method
function tryJSONPMethod(username, timestamp, resolve) {
    try {
        const callbackName = 'cb_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
        const script = document.createElement('script');
        const url = `${WEB_APP_URL}?action=updateLoginTime&username=${encodeURIComponent(username)}&timestamp=${encodeURIComponent(timestamp)}&callback=${callbackName}`;
        
        // Define callback
        window[callbackName] = function(response) {
            delete window[callbackName];
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
            if (response && response.success) {
                console.log('✓ Login timestamp recorded via JSONP for', username);
            } else {
                console.warn('⚠ Timestamp update via JSONP failed:', response?.error);
            }
            resolve(true);
        };
        
        script.onerror = function() {
            delete window[callbackName];
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
            console.warn('⚠ JSONP request failed for', username);
            resolve(false);
        };
        
        // Add timeout for script loading
        setTimeout(() => {
            if (window[callbackName]) {
                delete window[callbackName];
                try {
                    if (document.body.contains(script)) {
                        document.body.removeChild(script);
                    }
                } catch(e) {}
                console.warn('⚠ JSONP timeout for', username);
                resolve(false);
            }
        }, 10000);
        
        script.src = url;
        document.body.appendChild(script);
        
    } catch (error) {
        console.error('JSONP method error:', error);
        resolve(false);
    }
}

// Simple fire-and-forget timestamp update using Image
function updateLoginTimestampSimple(username) {
    try {
        const timestamp = new Date().toISOString();
        const img = new Image();
        img.src = `${WEB_APP_URL}?action=updateLoginTime&username=${encodeURIComponent(username)}&timestamp=${encodeURIComponent(timestamp)}&img=true&_=${Date.now()}`;
        img.onload = function() {
            console.log('✓ Timestamp update triggered via image for', username);
        };
        img.onerror = function() {
            console.warn('⚠ Timestamp update via image failed for', username);
        };
        // Add timeout to prevent hanging
        setTimeout(() => {
            img.src = '';
        }, 5000);
    } catch(e) {
        console.warn('Simple timestamp update failed:', e);
    }
}

// ======================== ALTERNATIVE: UPDATE TIMESTAMP VIA SHEETS API ========================
async function updateLoginTimestampViaAPI(username) {
    try {
        // First, find the user's row
        const loginUrl = `https://sheets.googleapis.com/v4/spreadsheets/${Master_ID}/values/${LOGIN_Table}!A:J?key=${API_KEY}&_=${Date.now()}`;
        const response = await fetch(loginUrl);
        const data = await response.json();
        
        if (data.error || !data.values) {
            console.error('Error fetching login data:', data.error);
            return false;
        }
        
        let rowIndex = -1;
        const rows = data.values;
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (row.length >= 2 && row[1] === username) {
                rowIndex = i + 1;
                break;
            }
        }
        
        if (rowIndex === -1) {
            console.warn('User not found:', username);
            return false;
        }
        
        // Update the timestamp (Column G = index 6)
        const timestamp = new Date().toISOString();
        const updateRange = `${LOGIN_Table}!G${rowIndex}`;
        const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${Master_ID}/values/${updateRange}?valueInputOption=USER_ENTERED&key=${API_KEY}`;
        
        const updateResponse = await fetch(updateUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                values: [[timestamp]]
            })
        });
        
        const result = await updateResponse.json();
        if (result.updatedCells) {
            console.log('✓ Login timestamp updated via API for', username);
            return true;
        } else {
            console.warn('⚠ Timestamp update via API failed:', result);
            return false;
        }
    } catch (error) {
        console.error('Error updating timestamp via API:', error);
        return false;
    }
}

// ======================== THEME FUNCTIONS ========================
function initTheme() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.body.className = savedTheme;
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) themeToggle.checked = savedTheme === 'dark-theme';
    } else {
        document.body.className = prefersDark ? 'dark-theme' : 'light-theme';
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) themeToggle.checked = prefersDark;
    }
}

function toggleTheme() {
    const isDark = document.body.classList.contains('dark-theme');
    const newTheme = isDark ? 'light-theme' : 'dark-theme';
    document.body.className = newTheme;
    localStorage.setItem('theme', newTheme);
}

// ======================== LOGIN ERROR FUNCTIONS ========================
function showLoginError(message) {
    const errorDiv = document.getElementById('loginError');
    const errorText = document.getElementById('errorMessageText');
    if (errorDiv && errorText) {
        errorText.textContent = message;
        errorDiv.style.display = 'flex';

        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }
}

function hideLoginError() {
    const errorDiv = document.getElementById('loginError');
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
}

// ======================== NOTIFICATION SYSTEM FUNCTIONS ========================
function getCurrentBranchForChat() {
    if (currentUser && currentUser.username) {
        let username = currentUser.username.toUpperCase();
        if (/^BR\d{4}$/i.test(username) || username === "ADMIN") {
            return username;
        }
    }

    let branch = localStorage.getItem('branchCode');
    if (branch && (/^BR\d{4}$/i.test(branch) || branch === "ADMIN")) {
        return branch.toUpperCase();
    }

    branch = localStorage.getItem('selectedBranch');
    if (branch && (/^BR\d{4}$/i.test(branch) || branch === "ADMIN")) {
        return branch.toUpperCase();
    }

    const sessionUser = sessionStorage.getItem('currentUser');
    if (sessionUser) {
        try {
            const userData = JSON.parse(sessionUser);
            const username = userData.username;
            if (username && (/^BR\d{4}$/i.test(username) || username === "ADMIN")) {
                return username.toUpperCase();
            }
        } catch (e) {}
    }

    return null;
}

async function fetchUnreadChatCount() {
    const branch = getCurrentBranchForChat();
    if (!branch) {
        console.log("No branch found for unread chat check");
        updateNotificationBadge(0);
        return 0;
    }

    try {
        const range = `${CHAT_Table_NAME}!A:K`;
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${CHAT_Master_ID}/values/${range}?key=${CHAT_API_KEY}&_=${Date.now()}`;
        const response = await fetch(url);
        const data = await response.json();

        if (!data.values || data.values.length <= 1) {
            updateNotificationBadge(0);
            return 0;
        }

        const rows = data.values.slice(1);
        let unreadCount = 0;

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (row.length >= 3) {
                const messageBranch = row[1] ? row[1].toString().toUpperCase() : "";
                const readStatus = row[8] ? row[8].toString() : "";
                const readBy = row[9] ? row[9].toString() : "";
                const allMentionReadBy = row[10] ? row[10].toString() : "";
                const messageText = row[2] ? row[2].toString().toLowerCase() : "";
                const isAllMention = messageText.includes('@all');

                if (messageBranch !== branch) {
                    if (!isAllMention && readStatus !== "TRUE" && !readBy.includes(branch)) {
                        unreadCount++;
                    } else if (isAllMention && !allMentionReadBy.includes(branch)) {
                        unreadCount++;
                    }
                }
            }
        }

        if (unreadCount > lastUnreadCount && unreadCount > 0) {
            setTimeout(() => playNotificationSound(), 100);
        }

        lastUnreadCount = unreadCount;
        updateNotificationBadge(unreadCount);
        return unreadCount;

    } catch (error) {
        console.error("Error fetching unread chat count:", error);
        updateNotificationBadge(0);
        return 0;
    }
}

function updateNotificationBadge(count) {
    const badge = document.getElementById('notificationBadge');
    if (!badge) return;

    if (count > 0) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.classList.remove('zero');
        badge.style.animation = 'pulse-red 0.5s ease-in-out';
        setTimeout(() => {
            if (badge) badge.style.animation = 'pulse-red 1.5s infinite';
        }, 500);
        document.title = `(${count}) Park My Site`;
    } else {
        badge.textContent = '0';
        badge.classList.add('zero');
        document.title = ' Park My Site';
    }
}

function openChatInIframe() {
    const chatUrl = "./chat.html?t=" + Date.now();
    const iframe = document.getElementById('content-frame');
    const loading = document.getElementById('loading');
    const welcomeMessage = document.getElementById('welcome-message');

    if (welcomeMessage) welcomeMessage.style.display = 'none';
    if (loading) loading.style.display = 'flex';

    iframe.onload = function() {
        if (loading) loading.style.display = 'none';
        setTimeout(() => {
            fetchUnreadChatCount();
        }, 3000);
    };

    iframe.onerror = function() {
        if (loading) loading.style.display = 'none';
        console.error('Error loading chat page');
    };

    iframe.src = chatUrl;
}

function startUnreadCheckInterval() {
    if (unreadCheckInterval) clearInterval(unreadCheckInterval);

    fetchUnreadChatCount();

    unreadCheckInterval = setInterval(() => {
        if (isAuthenticated) {
            fetchUnreadChatCount();
        }
    }, 10000);
}

function stopUnreadCheckInterval() {
    if (unreadCheckInterval) {
        clearInterval(unreadCheckInterval);
        unreadCheckInterval = null;
    }
}

function initNotificationSystem() {
    initNotificationSound();
    setupUserInteractionListener();

    const notificationBtn = document.getElementById('notificationIconBtn');
    if (notificationBtn) {
        notificationBtn.removeEventListener('click', openChatInIframe);
        notificationBtn.addEventListener('click', openChatInIframe);
    }
    startUnreadCheckInterval();
}

// ======================== FLASH NEWS FUNCTIONS ========================
async function fetchAndDisplayFlashNews() {
    const flashContainer = document.getElementById('flashNewsContainer');
    const flashTicker = document.getElementById('flashNewsTicker');

    if (!flashContainer || !flashTicker) return;

    try {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${Master_ID}/values/${FLASH_Table}!A2:A?key=${API_KEY}&_=${Date.now()}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            console.warn('Flash news sheet error:', data.error);
            flashContainer.classList.add('hidden');
            adjustWrapperHeightForTicker();
            return;
        }

        let newsItems = [];
        if (data.values && data.values.length > 0) {
            newsItems = data.values
                .map(row => row[0] ? row[0].toString().trim() : '')
                .filter(text => text !== '' && text !== null && text !== undefined);
        }

        if (newsItems.length === 0) {
            console.log('No scroll texts found in A2:A range, hiding ticker');
            flashContainer.classList.add('hidden');
            adjustWrapperHeightForTicker();
            return;
        }

        let tickerHtml = '';
        newsItems.forEach((item) => {
            tickerHtml += `<span><i class="bi bi-megaphone-fill"></i> ${escapeHtml(item)}</span>`;
        });

        const totalItems = newsItems.length;
        let scrollDuration = Math.min(40, Math.max(15, 25 + (totalItems * 0.5)));

        flashTicker.innerHTML = tickerHtml;

        flashTicker.style.animation = 'none';
        flashTicker.offsetHeight;
        flashTicker.style.animation = `scroll-left ${scrollDuration}s linear infinite`;

        flashContainer.classList.remove('hidden');
        adjustWrapperHeightForTicker();

        console.log(`Flash news ticker displayed with ${newsItems.length} items, scroll duration: ${scrollDuration}s`);

    } catch (error) {
        console.error('Error fetching flash news:', error);
        flashContainer.classList.add('hidden');
        adjustWrapperHeightForTicker();
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function adjustWrapperHeightForTicker() {
    const flashContainer = document.getElementById('flashNewsContainer');
    const wrapper = document.querySelector('.dashboard-container .wrapper');

    if (!wrapper) return;

    const navbar = document.querySelector('.navbar-custom');
    const navbarHeight = navbar ? navbar.offsetHeight : 73;
    const isTickerVisible = flashContainer && !flashContainer.classList.contains('hidden');
    const tickerHeight = isTickerVisible && flashContainer ? flashContainer.offsetHeight : 0;
    const viewportHeight = window.innerHeight;

    wrapper.style.height = `${viewportHeight - navbarHeight - tickerHeight}px`;
}

// ======================== FETCH USER DETAILS FROM LOGIN SHEET ========================
async function fetchUserDetailsFromLoginSheet(username) {
    try {
        const loginUrl = `https://sheets.googleapis.com/v4/spreadsheets/${Master_ID}/values/${LOGIN_Table}!A:J?key=${API_KEY}&_=${Date.now()}`;
        const response = await fetch(loginUrl);
        const data = await response.json();

        if (data.error || !data.values) {
            console.error('Error fetching user details:', data.error);
            return null;
        }

        const rows = data.values;
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (row.length >= 2) {
                const storedUserId = row[1] || ''; // Column B: User ID

                // Match against User ID (Column B)
                if (storedUserId === username) {
                    return {
                        displayName: row[0] || '', // Column A: User Name (Display Name)
                        userId: row[1] || '', // Column B: User ID
                        password: row[2] || '', // Column C: Password
                        menuSheet: row[3] || '', // Column D: Menu Sheet
                        email: row[4] || '', // Column E: Email ID
                        otp: row[5] || '', // Column F: OTP
                        loginTimestamp: row[6] || '', // Column G: Login Time
                        treasury: row[7] || '', // Column H: Treasury Name
                        otpExpiry: row[8] || '', // Column I: OTP Expiry
                        imageUrl: row[9] || null // Column J: Image URL
                    };
                }
            }
        }
        console.warn('User not found with ID:', username);
        return null;
    } catch (error) {
        console.error('Error fetching user details:', error);
        return null;
    }
}

// ======================== LOGIN FUNCTIONS ========================
async function validateLogin(username, password) {
    try {
        const loginUrl = `https://sheets.googleapis.com/v4/spreadsheets/${Master_ID}/values/${LOGIN_Table}!${LOGIN_RANGE}?key=${API_KEY}&_=${Date.now()}`;
        const response = await fetch(loginUrl);
        const data = await response.json();

        if (data.error) {
            console.error('API Error:', data.error);
            return null;
        }

        if (data.values) {
            for (let i = 0; i < data.values.length; i++) {
                const row = data.values[i];
                if (row.length >= 2) {
                    const storedUsername = row[0];
                    const storedPassword = row[1];

                    if (username === storedUsername && password === storedPassword) {
                        const menuSheet = row.length >= 3 && row[2] ? row[2].trim() : null;

                        if (!menuSheet) {
                            console.error('No menu sheet specified for user:', username);
                            return null;
                        }

                        return {
                            username: storedUsername,
                            menuSheet: menuSheet
                        };
                    }
                }
            }
        }

        return null;
    } catch (error) {
        console.error('Login validation error:', error);
        return null;
    }
}

// ======================== MAIN LOGIN HANDLER ========================
const __originalHandleLogin = window.handleLogin;

window.handleLogin = async function() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const loginBtn = document.getElementById('loginBtn');
    const loginSpinner = document.getElementById('loginSpinner');
    const loginText = document.getElementById('loginText');
    const loginOverlay = document.getElementById('loginOverlay');

    hideLoginError();

    if (!username || !password) {
        showLoginError('Please enter both User ID and password');
        return;
    }

    loginBtn.disabled = true;
    loginSpinner.classList.remove('d-none');
    loginText.textContent = 'Verifying...';
    document.activeElement.blur();

    try {
        const userData = await validateLogin(username, password);

        if (userData) {
            isAuthenticated = true;
            window.isAuthenticated = true;

            // Fetch full user details using User ID (Column B)
            const fullDetails = await fetchUserDetailsFromLoginSheet(username);
            console.log('Full user details fetched:', fullDetails);

            const completeUserData = {
                username: username, // User ID (login)
                displayName: fullDetails?.displayName || username, // Column A: Display Name
                userId: username, // Column B: User ID
                loginTime: new Date().toISOString(),
                menuSheet: userData.menuSheet,
                email: fullDetails?.email || '', // Column E: Email
                treasury: fullDetails?.treasury || '', // Column H: Treasury
                imageUrl: fullDetails?.imageUrl || null, // Column J: Image URL
                _fullDetails: fullDetails
            };

            console.log('Complete user data:', completeUserData);

            localStorage.setItem('currentUser', JSON.stringify(completeUserData));
            sessionStorage.setItem('currentUser', JSON.stringify(completeUserData));

            currentUser = completeUserData;
            window.currentUser = completeUserData;

            // ========== UPDATE TIMESTAMP WITH MULTIPLE METHODS ==========
            // Try all methods - at least one should work
            updateLoginTimestamp(username).catch(err => {
                console.warn('Timestamp update via primary method failed:', err);
                // Try simple method as fallback
                updateLoginTimestampSimple(username);
            });
            
            // Also try the simple method as a backup
            setTimeout(() => {
                updateLoginTimestampSimple(username);
            }, 1000);
            
            // Try API method as another backup (if needed)
            setTimeout(() => {
                updateLoginTimestampViaAPI(username).catch(err => {
                    console.warn('API timestamp update failed:', err);
                });
            }, 2000);
            // ==========================================================

            loginOverlay.style.opacity = '0';

            setTimeout(() => {
                loginOverlay.style.display = 'none';
                document.getElementById('dashboardContainer').style.display = 'block';

                if (typeof window.updateNavbarUser === 'function') {
                    window.updateNavbarUser(completeUserData);
                }

                loadMenuData(userData.menuSheet);

                setTimeout(() => {
                    fetchAndDisplayFlashNews();
                    initNotificationSystem();
                }, 100);
            }, 500);
        } else {
            loginBtn.disabled = false;
            loginSpinner.classList.add('d-none');
            loginText.textContent = 'Login';
            document.getElementById('password').value = '';
            showLoginError('Invalid User ID or password');
            document.getElementById('username').focus();
        }
    } catch (error) {
        console.error('Login error:', error);
        loginBtn.disabled = false;
        loginSpinner.classList.add('d-none');
        loginText.textContent = 'Login';
        showLoginError('Unable to verify credentials. Please try again.');
        document.getElementById('username').focus();
    }
};

// ======================== LOGOUT FUNCTION ========================
function logout() {
    stopUnreadCheckInterval();

    localStorage.removeItem('currentUser');
    sessionStorage.removeItem('currentUser');
    currentUser = null;
    isAuthenticated = false;

    window.isAuthenticated = false;
    window.currentUser = null;

    const loginOverlay = document.getElementById('loginOverlay');
    const dashboardContainer = document.getElementById('dashboardContainer');
    const flashContainer = document.getElementById('flashNewsContainer');

    if (flashContainer) {
        flashContainer.classList.add('hidden');
    }

    loginOverlay.style.display = 'flex';
    loginOverlay.style.opacity = '1';
    dashboardContainer.style.display = 'none';

    document.getElementById('username').value = '';
    document.getElementById('password').value = '';

    updateNotificationBadge(0);
    lastUnreadCount = 0;
    document.title = ' Park My Site';
    userInteracted = false;

    if (typeof window.hideUserPopup === 'function') {
        window.hideUserPopup();
    }

    // Reset sidebar state on logout
    const sidebar = document.getElementById('desktopSidebarContainer');
    if (sidebar) {
        sidebar.classList.remove('collapsed');
        localStorage.removeItem('sidebarCollapsed');
    }

    setTimeout(() => {
        document.getElementById('username').focus();
        resetLoginButtonState();
    }, 100);
}

// ======================== USER DISPLAY FUNCTIONS ========================
function displayLoggedInUser() {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        try {
            const userData = JSON.parse(storedUser);
            currentUser = userData;
            window.currentUser = userData;

            if (typeof window.updateNavbarUser === 'function') {
                window.updateNavbarUser(userData);
            }

            const existingDesktopUser = document.getElementById('desktopUserInfo');
            if (existingDesktopUser) existingDesktopUser.remove();

            const existingMobileUser = document.getElementById('mobileUserInfo');
            if (existingMobileUser) existingMobileUser.remove();

            const desktopSidebar = document.getElementById('desktopSidebar');
            if (desktopSidebar) {
                const userInfoDiv = document.createElement('div');
                userInfoDiv.className = 'user-info-sidebar';
                userInfoDiv.id = 'desktopUserInfo';
                userInfoDiv.style.display = 'none';
                userInfoDiv.innerHTML = `
                    <div class="user-info-content">
                        <div class="user-avatar">
                            <i class="bi bi-person-circle"></i>
                        </div>
                        <div class="user-details">
                            <span class="user-label">Logged in as</span>
                            <span class="user-name">${escapeHtml(userData.displayName || userData.username)}</span>
                            <span class="user-login-time">${new Date(userData.loginTime).toLocaleString()}</span>
                        </div>
                        <button class="logout-icon-btn" onclick="logout()" title="Logout">
                            <i class="bi bi-box-arrow-right"></i>
                        </button>
                    </div>
                `;
                desktopSidebar.insertBefore(userInfoDiv, desktopSidebar.firstChild);
            }

            const mobileSidebar = document.getElementById('mobileSidebar');
            if (mobileSidebar) {
                const userInfoDiv = document.createElement('div');
                userInfoDiv.className = 'user-info-sidebar';
                userInfoDiv.id = 'mobileUserInfo';
                userInfoDiv.style.display = 'none';
                userInfoDiv.innerHTML = `
                    <div class="user-info-content">
                        <div class="user-avatar">
                            <i class="bi bi-person-circle"></i>
                        </div>
                        <div class="user-details">
                            <span class="user-label">Logged in as</span>
                            <span class="user-name">${escapeHtml(userData.displayName || userData.username)}</span>
                            <span class="user-login-time">${new Date(userData.loginTime).toLocaleString()}</span>
                        </div>
                        <button class="logout-icon-btn" onclick="logout()" title="Logout">
                            <i class="bi bi-box-arrow-right"></i>
                        </button>
                    </div>
                `;
                mobileSidebar.insertBefore(userInfoDiv, mobileSidebar.firstChild);
            }
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
    }
}

// ======================== CHECK EXISTING SESSION ========================
function checkExistingSession() {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        try {
            const userData = JSON.parse(storedUser);
            const loginTime = new Date(userData.loginTime);
            const now = new Date();
            const hoursSinceLogin = (now - loginTime) / (1000 * 60 * 60);

            if (hoursSinceLogin > 24) {
                logout();
                return;
            }

            isAuthenticated = true;
            currentUser = userData;
            window.isAuthenticated = true;
            window.currentUser = userData;

            const loginOverlay = document.getElementById('loginOverlay');
            const dashboardContainer = document.getElementById('dashboardContainer');

            loginOverlay.style.display = 'none';
            dashboardContainer.style.display = 'block';

            if (typeof window.updateNavbarUser === 'function') {
                window.updateNavbarUser(userData);
            }

            loadMenuData(userData.menuSheet);
            setTimeout(() => {
                fetchAndDisplayFlashNews();
                initNotificationSystem();
            }, 100);
        } catch (e) {
            console.error('Error restoring session:', e);
            logout();
        }
    }
}

// ======================== MENU DATA FUNCTIONS ========================
function processIconData(rows) {
    if (!rows || rows.length < 2) return;
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < 6) continue;
        const [mainMenu, mainIcon, subMenu, subIcon, linkItem, linkIcon] = row;
        if (mainMenu && subMenu && linkItem) {
            const key = `${mainMenu}|${subMenu}|${linkItem}`;
            iconData.set(key, {
                mainIcon: mainIcon || '<i class="bi bi-folder2"></i>',
                subIcon: subIcon || '<i class="bi bi-folder2"></i>',
                linkIcon: linkIcon || '<i class="bi bi-link-45deg"></i>'
            });
            const mainKey = `${mainMenu}||`;
            if (!iconData.has(mainKey)) iconData.set(mainKey, { mainIcon: mainIcon || '<i class="bi bi-grid"></i>' });
            const subKey = `${mainMenu}|${subMenu}|`;
            if (!iconData.has(subKey)) iconData.set(subKey, { subIcon: subIcon || '<i class="bi bi-folder"></i>' });
        }
    }
}

function getIcon(mainMenu, subMenu = '', linkItem = '', level) {
    const key = `${mainMenu}|${subMenu}|${linkItem}`;
    const icons = iconData.get(key);
    if (icons) {
        switch (level) {
            case 'main':
                return icons.mainIcon || '<i class="bi bi-grid"></i>';
            case 'sub':
                return icons.subIcon || '<i class="bi bi-folder"></i>';
            case 'link':
                return icons.linkIcon || '<i class="bi bi-link-45deg"></i>';
        }
    }
    if (level === 'main') {
        const mainKey = `${mainMenu}||`;
        const mainIcons = iconData.get(mainKey);
        if (mainIcons && mainIcons.mainIcon) return mainIcons.mainIcon;
    }
    if (level === 'sub') {
        const subKey = `${mainMenu}|${subMenu}|`;
        const subIcons = iconData.get(subKey);
        if (subIcons && subIcons.subIcon) return subIcons.subIcon;
    }
    switch (level) {
        case 'main':
            return '<i class="bi bi-grid"></i>';
        case 'sub':
            return '<i class="bi bi-folder"></i>';
        case 'link':
            return '<i class="bi bi-link-45deg"></i>';
        default:
            return '<i class="bi bi-folder2"></i>';
    }
}

function processMenuData(rows) {
    if (!rows || rows.length < 2) return [];
    const menuMap = new Map();
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < 4) continue;
        const [mainMenu, subMenu, linkItem, url] = row;
        if (!mainMenu || !subMenu || !linkItem || !url) continue;
        if (!menuMap.has(mainMenu)) menuMap.set(mainMenu, new Map());
        const subMenuMap = menuMap.get(mainMenu);
        if (!subMenuMap.has(subMenu)) subMenuMap.set(subMenu, []);
        subMenuMap.get(subMenu).push({
            title: linkItem,
            url: url,
            icon: getIcon(mainMenu, subMenu, linkItem, 'link')
        });
    }
    return Array.from(menuMap.entries()).map(([mainMenu, subMenuMap]) => ({
        title: mainMenu,
        icon: getIcon(mainMenu, '', '', 'main'),
        subMenus: Array.from(subMenuMap.entries()).map(([subMenu, items]) => ({
            title: subMenu,
            icon: getIcon(mainMenu, subMenu, '', 'sub'),
            items: items
        }))
    }));
}

async function fetchSheetData(menuSheetName) {
    try {
        console.log('Fetching menu from sheet:', menuSheetName);

        iconData.clear();

        const menuUrl = `https://sheets.googleapis.com/v4/spreadsheets/${Master_ID}/values/${menuSheetName}!${MENU_RANGE}?key=${API_KEY}&_=${Date.now()}`;
        const menuResponse = await fetch(menuUrl);
        const menuData_raw = await menuResponse.json();

        if (menuData_raw.error) {
            console.error('Menu sheet error:', menuData_raw.error);
            throw new Error(`Menu sheet '${menuSheetName}' not found or inaccessible`);
        }

        const iconUrl = `https://sheets.googleapis.com/v4/spreadsheets/${Master_ID}/values/${ICON_Table}!${ICON_RANGE}?key=${API_KEY}&_=${Date.now()}`;
        const iconResponse = await fetch(iconUrl);
        const iconData_raw = await iconResponse.json();
        if (!iconData_raw.error) processIconData(iconData_raw.values);

        return processMenuData(menuData_raw.values);
    } catch (error) {
        console.error('Error fetching data:', error);
        showError('Error loading menu: ' + error.message);
        return [];
    }
}

function loadMenuData(menuSheetName) {
    try {
        if (!menuSheetName) {
            showError('No menu sheet configured for this user');
            return;
        }

        fetchSheetData(menuSheetName).then(data => {
            menuData = data;
            renderMenuCards(menuData, 'desktopSidebar');
            renderMenuCards(menuData, 'mobileSidebar');

            displayLoggedInUser();

            const welcomeMsg = document.getElementById('welcome-message');
            if (welcomeMsg) {
                welcomeMsg.style.display = 'block';
                setTimeout(() => {
                    welcomeMsg.style.display = 'none';
                }, 5000);
            }

            const loading = document.getElementById('loading');
            if (loading) loading.style.display = 'none';

            if (currentUser) {
                console.log(`Logged in as: ${currentUser.displayName || currentUser.username}, using menu sheet: ${menuSheetName}`);
            }
        }).catch(error => {
            console.error('Error loading menu data:', error);
            showError('Error loading menu data');
        });
    } catch (error) {
        console.error('Error in loadMenuData:', error);
        showError('Error loading menu data');
    }
}

function showError(message) {
    const desktop = document.getElementById('desktopSidebar');
    const mobile = document.getElementById('mobileSidebar');
    if (desktop) desktop.innerHTML = `<div class="error-message text-danger p-3">${escapeHtml(message)}</div>`;
    if (mobile) mobile.innerHTML = `<div class="error-message text-danger p-3">${escapeHtml(message)}</div>`;
}

function renderMenuCards(menuData, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (!menuData || menuData.length === 0) {
        container.innerHTML = '<div class="text-muted p-3">No menu items available for your account</div>';
        return;
    }
    let html = '';
    menuData.forEach(main => {
        let subHtml = '';
        main.subMenus.forEach(sub => {
            let linksHtml = '';
            sub.items.forEach(link => {
                linksHtml += `<li class="link-item" data-url="${link.url}" data-title="${link.title}">${link.icon} ${escapeHtml(link.title)}</li>`;
            });
            subHtml += `<div class="submenu-block">
                <div class="submenu-title">${sub.icon} ${escapeHtml(sub.title)}</div>
                <ul class="link-items">${linksHtml}</ul>
            </div>`;
        });
        html += `<div class="menu-card">
            <div class="menu-card-header">${main.icon} ${escapeHtml(main.title)}</div>
            <div class="menu-card-body">${subHtml}</div>
        </div>`;
    });
    container.innerHTML = html;

    container.querySelectorAll('.link-item').forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            const url = el.dataset.url;

            container.querySelectorAll('.link-item').forEach(item => {
                item.classList.remove('active');
            });

            el.classList.add('active');

            loadUrlInIframe(url);
            if (window.innerWidth < 992) {
                const offcanvasEl = document.getElementById('mobileMenuOffcanvas');
                if (offcanvasEl) {
                    const bsOffcanvas = bootstrap.Offcanvas.getInstance(offcanvasEl);
                    if (bsOffcanvas) bsOffcanvas.hide();
                }
            }
        });
    });
}

function loadUrlInIframe(url) {
    const iframe = document.getElementById('content-frame');
    const loading = document.getElementById('loading');
    const welcomeMessage = document.getElementById('welcome-message');

    if (welcomeMessage) welcomeMessage.style.display = 'none';
    if (loading) loading.style.display = 'flex';

    let fullUrl = url;

    if (fullUrl.includes('?')) {
        fullUrl += `&_=${Date.now()}`;
    } else {
        fullUrl += `?_=${Date.now()}`;
    }

    if (url.includes('treasury-status') && currentUser && currentUser.branch) {
        const separator = url.includes('?') ? '&' : '?';
        fullUrl = `${url}${separator}branch=${encodeURIComponent(currentUser.branch)}`;
    }

    iframe.onload = function() {
        if (loading) loading.style.display = 'none';
    };

    iframe.onerror = function() {
        if (loading) loading.style.display = 'none';
        alert('Error loading page: ' + fullUrl);
    };

    iframe.src = fullUrl;
}

// ======================== SIDEBAR TOGGLE FUNCTION (FIXED) ========================
function initDesktopSidebarToggle() {
    const toggleBtn = document.getElementById('desktopSidebarToggle');
    const sidebar = document.getElementById('desktopSidebarContainer');
    
    if (!toggleBtn || !sidebar) {
        console.warn('Sidebar toggle elements not found');
        return;
    }
    
    // Check if sidebar is collapsed from localStorage
    const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    
    // Set initial state
    if (isCollapsed) {
        sidebar.classList.add('collapsed');
    } else {
        sidebar.classList.remove('collapsed');
    }
    
    // Remove existing listeners to prevent duplicates
    toggleBtn.removeEventListener('click', handleSidebarToggle);
    toggleBtn.addEventListener('click', handleSidebarToggle);
}

function handleSidebarToggle(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const sidebar = document.getElementById('desktopSidebarContainer');
    
    if (!sidebar) return;
    
    const isCurrentlyCollapsed = sidebar.classList.contains('collapsed');
    
    if (isCurrentlyCollapsed) {
        // Expand sidebar
        sidebar.classList.remove('collapsed');
        localStorage.setItem('sidebarCollapsed', 'false');
    } else {
        // Collapse sidebar
        sidebar.classList.add('collapsed');
        localStorage.setItem('sidebarCollapsed', 'true');
    }
    
    // Trigger resize event for iframe
    setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
        if (typeof window.adjustWrapperHeightForTicker === 'function') {
            window.adjustWrapperHeightForTicker();
        }
    }, 350);
}

// ======================== RESET LOGIN BUTTON STATE ========================
function resetLoginButtonState() {
    const loginBtn = document.getElementById('loginBtn');
    const loginSpinner = document.getElementById('loginSpinner');
    const loginText = document.getElementById('loginText');

    if (loginBtn) loginBtn.disabled = false;
    if (loginSpinner) loginSpinner.classList.add('d-none');
    if (loginText) loginText.textContent = 'Login';
}

// ======================== TEST FUNCTION FOR TIMESTAMP ========================
async function testTimestampUpdate() {
    const username = prompt('Enter username to test timestamp update:');
    if (username) {
        console.log('=== Testing Timestamp Update for:', username, '===');
        console.log('Method 1: Primary fetch method...');
        const result1 = await updateLoginTimestamp(username);
        console.log('Primary method result:', result1 ? '✅ Success' : '❌ Failed');
        
        console.log('Method 2: Simple image method...');
        updateLoginTimestampSimple(username);
        console.log('Simple method triggered (check console for result)');
        
        console.log('Method 3: API method...');
        const result3 = await updateLoginTimestampViaAPI(username);
        console.log('API method result:', result3 ? '✅ Success' : '❌ Failed');
        
        console.log('=== Timestamp test completed ===');
    }
}

// ======================== INITIALIZATION ========================
document.addEventListener('DOMContentLoaded', function() {
    initTheme();

    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('change', toggleTheme);
    }

    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', window.handleLogin);
    }

    const username = document.getElementById('username');
    const password = document.getElementById('password');

    if (username) {
        username.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (password) password.focus();
            }
        });
        username.addEventListener('input', hideLoginError);
    }

    if (password) {
        password.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                window.handleLogin();
            }
        });
        password.addEventListener('input', hideLoginError);
    }

    // Initialize sidebar toggle
    initDesktopSidebarToggle();

    const welcomeMsg = document.getElementById('welcome-message');
    if (welcomeMsg) welcomeMsg.style.display = 'none';

    checkExistingSession();

    window.addEventListener('resize', () => {
        if (isAuthenticated) {
            adjustWrapperHeightForTicker();
        }
    });

    setTimeout(() => {
        if (!isAuthenticated && username) {
            username.focus();
        }
    }, 100);
});

// Iframe load event
const contentFrame = document.getElementById('content-frame');
if (contentFrame) {
    contentFrame.addEventListener('load', function() {
        const loading = document.getElementById('loading');
        if (loading) loading.style.display = 'none';
    });
}

// Register service worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/network/sw.js')
            .then(registration => {
                console.log('ServiceWorker registered successfully with scope:', registration.scope);
            })
            .catch(error => {
                console.log('ServiceWorker registration failed:', error);
            });
    });
}

// ======================== EXPORT FUNCTIONS ========================
window.fetchAndDisplayFlashNews = fetchAndDisplayFlashNews;
window.adjustWrapperHeightForTicker = adjustWrapperHeightForTicker;
window.logout = logout;
window.fetchUnreadChatCount = fetchUnreadChatCount;
window.openChatInIframe = openChatInIframe;
window.getCurrentBranchForChat = getCurrentBranchForChat;
window.toggleNotificationSound = toggleNotificationSound;
window.initTheme = initTheme;
window.toggleTheme = toggleTheme;
window.showLoginError = showLoginError;
window.hideLoginError = hideLoginError;
window.initNotificationSystem = initNotificationSystem;
window.displayLoggedInUser = displayLoggedInUser;
window.checkExistingSession = checkExistingSession;
window.loadMenuData = loadMenuData;
window.resetLoginButtonState = resetLoginButtonState;
window.fetchUserDetailsFromLoginSheet = fetchUserDetailsFromLoginSheet;
window.handleLogin = handleLogin;
window.validateLogin = validateLogin;
window.updateLoginTimestamp = updateLoginTimestamp;
window.updateLoginTimestampSimple = updateLoginTimestampSimple;
window.updateLoginTimestampViaAPI = updateLoginTimestampViaAPI;
window.testTimestampUpdate = testTimestampUpdate;
window.initDesktopSidebarToggle = initDesktopSidebarToggle;
window.handleSidebarToggle = handleSidebarToggle;

console.log('[System] All systems initialized');
console.log('[System] User details fetched from Login sheet columns: A-DisplayName, B-UserID, E-Email, H-Treasury, J-ImageURL');
console.log('[System] Click on user avatar in navbar to view profile');
console.log('[System] Timestamp update uses multiple methods for reliability');
console.log('[System] To test timestamp update, run: testTimestampUpdate()');
console.log('[System] Sidebar toggle initialized');