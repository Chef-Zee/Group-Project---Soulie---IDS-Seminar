document.addEventListener('DOMContentLoaded', () => {

    // Global navigation function
    window.switchView = (viewId) => {
        // Hide all views
        document.querySelectorAll('.app-view').forEach(view => {
            view.classList.remove('active');
        });
        
        // Remove active class from nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Show target view
        document.getElementById(viewId).classList.add('active');
        
        // Set nav item active
        const navItem = Array.from(document.querySelectorAll('.nav-item'))
            .find(item => item.getAttribute('onclick').includes(viewId));
        if (navItem) navItem.classList.add('active');
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'auto' });
    };

    // Auth helper functions
    const getSavedUsers = () => {
        const users = localStorage.getItem('soulie_users');
        return users ? JSON.parse(users) : {};
    };

    const showError = (msg) => {
        const errorEl = document.getElementById('auth-error');
        if (errorEl) {
            errorEl.innerText = msg;
            errorEl.style.display = 'block';
        } else {
            alert(msg);
        }
    };

    const hideError = () => {
        const errorEl = document.getElementById('auth-error');
        if (errorEl) errorEl.style.display = 'none';
    };

    const loginUser = (username) => {
        localStorage.setItem('soulie_currentUser', username);
        
        const homeGreeting = document.getElementById('home-greeting');
        const companionGreeting = document.getElementById('companion-greeting');
        
        if (homeGreeting) homeGreeting.innerHTML = `Welcome, ${username}.<br>Breathe.<br>Reflect.<br>Reset.`;
        if (companionGreeting) companionGreeting.innerText = `Hi, ${username}. I'm here with you.`;
        
        const appNav = document.getElementById('app-nav');
        if (appNav) appNav.style.display = 'flex';

        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) logoutBtn.style.display = 'block';

        switchView('view-home');
    };

    window.handleLogout = () => {
        localStorage.removeItem('soulie_currentUser');

        const appNav = document.getElementById('app-nav');
        if (appNav) appNav.style.display = 'none';

        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) logoutBtn.style.display = 'none';

        // Clear auth inputs
        const usernameInput = document.getElementById('auth-username');
        const passwordInput = document.getElementById('auth-password');
        if (usernameInput) usernameInput.value = '';
        if (passwordInput) passwordInput.value = '';

        switchView('view-auth');
    };

    window.handleSignup = () => {
        hideError();
        const usernameInput = document.getElementById('auth-username').value.trim();
        const passwordInput = document.getElementById('auth-password').value;

        if (!usernameInput || !passwordInput) {
            showError("Please enter both username and password.");
            return;
        }

        const users = getSavedUsers();
        if (users[usernameInput]) {
            showError("Username already exists. Please log in.");
            return;
        }

        users[usernameInput] = passwordInput;
        localStorage.setItem('soulie_users', JSON.stringify(users));
        
        loginUser(usernameInput);
    };

    window.handleLogin = () => {
        hideError();
        const usernameInput = document.getElementById('auth-username').value.trim();
        const passwordInput = document.getElementById('auth-password').value;

        if (!usernameInput || !passwordInput) {
            showError("Please enter both username and password.");
            return;
        }

        const users = getSavedUsers();
        if (!users[usernameInput] || users[usernameInput] !== passwordInput) {
            showError("Invalid username or password.");
            return;
        }

        loginUser(usernameInput);
    };

    // 1. State to keep track of the selected mood
    let selectedMood = 'calm';

    // 2. Setup Support Messages based on mood (Rule-based)
    const supportMessages = {
        anxious: "It's completely normal to feel anxious. Try taking a deep breath in for 4 seconds, holding for 4, and exhaling for 6. You are safe in this moment.",
        overwhelmed: "When everything feels like too much, it's okay to step back. Just focus on the very next smallest step. You don't have to figure it all out today.",
        lonely: "Loneliness can feel heavy. Remember that feeling disconnected doesn't mean you are unloved. Your feelings are valid, and we're glad you're here sharing them.",
        burned_out: "Burnout is your body's way of asking for a pause. Give yourself permission to rest without guilt. You've been working so hard and deserve a break.",
        calm: "It's wonderful that you're feeling okay right now. Take a moment to savor this calm. It's a great time to reflect on what brings you peace."
    };

    const defaultMessage = "Thank you for checking in. Whatever you're going through, taking time to pause and reflect is a beautiful first step towards feeling better.";

    const talkSuggestions = {
        anxious: "Let's start with one small step toward calm. Box breathing can help.",
        overwhelmed: "You may not need to solve everything today. Focus on only the very next thing.",
        lonely: "We're here with you. Consider reaching out to one trusted person today.",
        burned_out: "It's time to rest. Give yourself the grace to put down the heavy things for a bit.",
        calm: "That's wonderful to hear. Keep noticing what feels peaceful right now."
    };

    // Pool of 10 guided reflection prompts
    const guidedPromptsPool = [
        "What feels heaviest on your heart right now, and why might that be?",
        "What is one small thing you can let go of today?",
        "How did your body feel when you woke up this morning?",
        "What is one way you can show yourself kindness before the day ends?",
        "What helped you feel safe, calm, or supported recently?",
        "What do you need most right now — rest, connection, or space to breathe?",
        "Describe one moment today, big or small, that made you feel something.",
        "If a close friend were going through what you are, what would you tell them?",
        "What are three things you are grateful for, even on a hard day?",
        "What does your inner voice need you to hear today?"
    ];

    let lastPromptIndex = -1;

    // Rule-based mood detection from journal text
    const detectMood = (text) => {
        const t = text.toLowerCase();
        if (/overwhelm|too much|can't handle|can't cope|too many|everything at once/.test(t)) return 'overwhelmed';
        if (/lonely|alone|isolated|no one|nobody|by myself/.test(t)) return 'lonely';
        if (/burned out|burnt out|drained|exhausted|tired|no energy|depleted/.test(t)) return 'burned_out';
        if (/stress|anxious|anxiety|worried|worry|pressure|panic|nervous/.test(t)) return 'stressed';
        if (/angry|anger|mad|frustrated|frustrat|annoyed|irritated|upset|furious/.test(t)) return 'angry';
        if (/calm|peaceful|okay|good|grateful|happy|content|relaxed|fine/.test(t)) return 'calm';
        return 'calm'; // default
    };

    // Human-readable mood labels
    const moodLabels = {
        overwhelmed: 'Overwhelmed',
        lonely: 'Lonely',
        burned_out: 'Burned Out',
        stressed: 'Stressed',
        angry: 'Angry',
        calm: 'Calm'
    };

    const moodEmojis = {
        overwhelmed: '🌊',
        lonely: '🌙',
        burned_out: '🕯️',
        stressed: '💨',
        angry: '🔥',
        calm: '🌿'
    };

    const showRandomPrompt = () => {
        const promptEl = document.getElementById('guided-prompt-text');
        if (!promptEl) return;
        let idx;
        do {
            idx = Math.floor(Math.random() * guidedPromptsPool.length);
        } while (idx === lastPromptIndex && guidedPromptsPool.length > 1);
        lastPromptIndex = idx;
        promptEl.textContent = guidedPromptsPool[idx];
    };

    const dailyQuestions = "1. How did my body feel today?\n2. What is one good thing that happened?\n3. What do I need tomorrow?";

    const soundRecommendations = {
        anxious: [
            { title: "Soft Piano Reset", desc: "Gentle keys to slow your racing thoughts.", tag: "8 min" },
            { title: "Rain for Focus", desc: "Steady distant rain to block out noise.", tag: "15 min" },
            { title: "Slow Ambient Breathing", desc: "A soft drone to pace your inhales and exhales.", tag: "5 min" }
        ],
        stressed: [
            { title: "Soft Piano Reset", desc: "Gentle keys to slow your racing thoughts.", tag: "8 min" },
            { title: "Rain for Focus", desc: "Steady distant rain to block out noise.", tag: "15 min" },
            { title: "Slow Ambient Breathing", desc: "A soft drone to pace your inhales and exhales.", tag: "5 min" }
        ],
        lonely: [
            { title: "Warm Acoustic Comfort", desc: "Relaxing guitar to keep you company.", tag: "12 min" },
            { title: "Gentle Lo-fi Evening", desc: "Soft, comforting beats for quiet nights.", tag: "20 min" },
            { title: "Safe Space Soundscape", desc: "Warm and embracing atmospheric tones.", tag: "10 min" }
        ],
        overwhelmed: [
            { title: "Grounding Instrumental", desc: "Steady rhythms to anchor your mind.", tag: "7 min" },
            { title: "White Noise Reset", desc: "Clean audio slate to wash away overwhelm.", tag: "10 min" },
            { title: "One-Step Calm", desc: "Simplistic, repetitive melodies for focus.", tag: "5 min" }
        ],
        burned_out: [
            { title: "Deep Rest Ambient", desc: "Low frequencies to promote physical relaxation.", tag: "15 min" },
            { title: "Restore & Unwind", desc: "Effortless listening for complete detachment.", tag: "20 min" },
            { title: "Quiet Nervous System Reset", desc: "Scientifically backed tones for recovery.", tag: "10 min" }
        ],
        calm: [
            { title: "Light Focus Flow", desc: "Uplifting but unobtrusive background sounds.", tag: "30 min" },
            { title: "Clear Mind Ambient", desc: "Airy, open electronic soundscapes.", tag: "15 min" },
            { title: "Gentle Morning Balance", desc: "Bright and reassuring acoustic elements.", tag: "10 min" }
        ]
    };

    const regulationToolsData = [
        {
            name: "Box Breathing",
            purpose: "Reset your breath and slow your heart rate.",
            instructions: "1. Inhale slowly for 4 seconds.<br>2. Hold your breath for 4 seconds.<br>3. Exhale completely for 4 seconds.<br>4. Hold empty for 4 seconds.<br>Repeat 4 times.",
            bestFor: ['anxious', 'stressed', 'calm']
        },
        {
            name: "5-4-3-2-1 Grounding",
            purpose: "Find your surroundings and return to the present.",
            instructions: "Take a deep breath. Look around and silently name:<br>- 5 things you can see<br>- 4 things you can physically feel<br>- 3 things you can hear<br>- 2 things you can smell<br>- 1 thing you can taste",
            bestFor: ['overwhelmed', 'lonely', 'anxious']
        },
        {
            name: "60-Second Body Scan",
            purpose: "Check in with physical tension and release it.",
            instructions: "Close your eyes. Start from your toes, slowly moving your awareness up your legs, torso, arms, and neck, all the way to the top of your head. Notice any tension, and breathe into it.",
            bestFor: ['burned_out', 'stressed', 'calm']
        },
        {
            name: "Shoulder Release",
            purpose: "Drop the physical weight you're carrying.",
            instructions: "Inhale deeply and lift your shoulders all the way up to your ears. Hold for a moment. Exhale forcefully through your mouth, letting your shoulders drop completely. Repeat 3 times.",
            bestFor: ['overwhelmed', 'burned_out', 'lonely']
        }
    ];

    // 3. Grab DOM Elements
    const chatHistory = document.getElementById('chat-history');
    const chatReplyButtons = document.querySelectorAll('.chat-reply-btn');
    const chatInput = document.getElementById('chat-input-field');
    const chatSendBtn = document.getElementById('chat-send-btn');
    
    const journalText = document.getElementById('journal-entry');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const soundCardsContainer = document.getElementById('sound-cards-container');
    const regulationContainer = document.getElementById('regulation-cards-container');

    const renderSoundCards = (mood) => {
        const recommendations = soundRecommendations[mood] || soundRecommendations['calm'];
        soundCardsContainer.innerHTML = recommendations.map(rec => `
            <div class="sound-card">
                <h3>${rec.title}</h3>
                <p>${rec.desc}</p>
                <div class="sound-meta">
                    <span class="sound-tag">${rec.tag}</span>
                    <button class="play-btn" aria-label="Play ${rec.title}">
                        <div class="play-icon"></div>
                    </button>
                </div>
            </div>
        `).join('');
    };

    const renderRegulationTools = (mood) => {
        const sortedTools = [...regulationToolsData].sort((a, b) => {
            const aMatch = a.bestFor.includes(mood || 'calm') ? 1 : 0;
            const bMatch = b.bestFor.includes(mood || 'calm') ? 1 : 0;
            return bMatch - aMatch;
        });

        regulationContainer.innerHTML = sortedTools.map((tool, index) => {
            const isRecommended = tool.bestFor.includes(mood || 'calm') && index === 0;
            return `
                <div class="card tool-card glass ${isRecommended ? 'recommended' : ''}">
                    ${isRecommended ? '<span class="recommended-badge">Recommended</span>' : ''}
                    <h3>${tool.name}</h3>
                    <p class="tool-desc">${tool.purpose}</p>
                    <button class="btn-secondary tool-toggle" onclick="this.nextElementSibling.classList.toggle('hidden');">Start</button>
                    <div class="tool-content hidden">
                        <p>${tool.instructions}</p>
                    </div>
                </div>
            `;
        }).join('');
    };

    // Initial render
    renderSoundCards('calm');
    renderRegulationTools('calm');

    // 4. Chat Reply & Input Logic
    const processUserMessage = (userText, explicitMood = null) => {
        
        chatHistory.innerHTML += `
            <div class="chat-bubble user-message">
                <div class="message-avatar">👤</div>
                <div class="message-text">${userText}</div>
            </div>
        `;
        chatHistory.scrollTop = chatHistory.scrollHeight;

        let mood = explicitMood;
        
        if (!mood) {
            const textLower = userText.toLowerCase();
            if (textLower.includes('overwhelm') || textLower.includes('too much') || textLower.includes('heavy')) mood = 'overwhelmed';
            else if (textLower.includes('stress') || textLower.includes('anxious') || textLower.includes('panic') || textLower.includes('calm down') || textLower.includes('worr')) mood = 'anxious';
            else if (textLower.includes('lonely') || textLower.includes('alone') || textLower.includes('isolat')) mood = 'lonely';
            else if (textLower.includes('burn') || textLower.includes('exhaust') || textLower.includes('tired')) mood = 'burned_out';
            else if (textLower.includes('calm') || textLower.includes('okay') || textLower.includes('fine') || textLower.includes('reflect') || textLower.includes('good')) mood = 'calm';
        }

        if (mood) {
            selectedMood = mood;
        }

        let responseMessage = supportMessages[mood] || "I hear you. Thank you for sharing that with me. Whenever you're ready, we can explore how to support you today.";
        let followUp = talkSuggestions[mood] || "It's completely okay to just feel whatever you are feeling right now.";

        setTimeout(() => {
            chatHistory.innerHTML += `
                <div class="chat-bubble soulie-message">
                    <div class="message-avatar">✨</div>
                    <div class="message-text">
                        <p style="margin-bottom: 8px;">${responseMessage}</p>
                        <p><em>${followUp}</em></p>
                    </div>
                </div>
            `;
            chatHistory.scrollTop = chatHistory.scrollHeight;
        }, 600);
        
        // (no guided-prompt tab — prompt is always visible in Write Entry)
        
        renderSoundCards(selectedMood);
        renderRegulationTools(selectedMood);
    };

    if (chatSendBtn && chatInput) {
        chatSendBtn.addEventListener('click', () => {
            const text = chatInput.value.trim();
            if (text) {
                processUserMessage(text);
                chatInput.value = '';
            }
        });

        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                chatSendBtn.click();
            }
        });
    }

    if (chatReplyButtons.length > 0) {
        chatReplyButtons.forEach(button => {
            button.addEventListener('click', () => {
                const userText = button.innerText;
                const mood = button.getAttribute('data-mood');
                processUserMessage(userText, mood);
            });
        });
    }

    // New Journal / Diary Logic
    const saveJournalBtn = document.getElementById('save-journal-btn');
    const writeEntrySection = document.getElementById('write-entry-section');
    const calendarSection = document.getElementById('calendar-section');
    const calendarGrid = document.getElementById('calendar-grid');

    // Wire up guided prompt
    showRandomPrompt();
    const newPromptBtn = document.getElementById('new-prompt-btn');
    if (newPromptBtn) {
        newPromptBtn.addEventListener('click', showRandomPrompt);
    }

    const renderCalendar = () => {
        if (!calendarGrid) return;
        calendarGrid.innerHTML = '';
        
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth(); // 0-11
        
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const currentUser = localStorage.getItem('soulie_currentUser');
        const entriesStr = localStorage.getItem('soulie_entries');
        const allEntries = entriesStr ? JSON.parse(entriesStr) : [];

        for (let i = 1; i <= daysInMonth; i++) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day';
            dayDiv.innerText = i;
            
            const monthStr = String(month + 1).padStart(2, '0');
            const dayStr = String(i).padStart(2, '0');
            const dateKey = `${year}-${monthStr}-${dayStr}`;
            
            // Look for matching user AND date
            const entry = allEntries.find(e => e.username === currentUser && e.date === dateKey);
            
            if (entry) {
                dayDiv.classList.add('has-entry');
                // Replace plain text with number + colored dot
                dayDiv.innerText = '';
                const numSpan = document.createElement('span');
                numSpan.textContent = i;
                const dot = document.createElement('div');
                dot.className = `mood-dot mood-dot--${entry.mood}`;
                dayDiv.appendChild(numSpan);
                dayDiv.appendChild(dot);
            }
            
            dayDiv.addEventListener('click', () => {
                document.querySelectorAll('.calendar-day').forEach(el => el.classList.remove('active-day'));
                dayDiv.classList.add('active-day');
                
                const viewEl = document.getElementById('calendar-entry-view');
                document.getElementById('calendar-entry-date').innerText = new Date(year, month, i).toLocaleDateString();
                
                if (entry) {
                    const emoji = moodEmojis[entry.mood] || '✨';
                    const label = moodLabels[entry.mood] || entry.mood;
                    document.getElementById('calendar-entry-mood').innerText = `${emoji} Mood: ${label}`;
                    document.getElementById('calendar-entry-text').innerText = entry.text;
                } else {
                    document.getElementById('calendar-entry-mood').innerText = '';
                    document.getElementById('calendar-entry-text').innerText = 'No entry for this day.';
                }
                viewEl.classList.remove('hidden');
            });
            
            calendarGrid.appendChild(dayDiv);
        }
    };

    if (saveJournalBtn) {
        saveJournalBtn.addEventListener('click', () => {
            const text = journalText.value.trim();
            if (!text) {
                alert("Please write something before saving.");
                return;
            }
            
            const currentUser = localStorage.getItem('soulie_currentUser') || 'Anonymous';
            const todayDate = new Date();
            const yearStr = todayDate.getFullYear();
            const monthStr = String(todayDate.getMonth() + 1).padStart(2, '0');
            const dayStr = String(todayDate.getDate()).padStart(2, '0');
            const todayStr = `${yearStr}-${monthStr}-${dayStr}`;

            // Auto-detect mood from the written text
            const detectedMood = detectMood(text);
            selectedMood = detectedMood;
            
            const entriesStr = localStorage.getItem('soulie_entries');
            let allEntries = entriesStr ? JSON.parse(entriesStr) : [];
            
            // Override existing entry for the user today
            allEntries = allEntries.filter(e => !(e.username === currentUser && e.date === todayStr));
            
            allEntries.push({
                username: currentUser,
                date: todayStr,
                mood: detectedMood,
                text: text
            });
            
            localStorage.setItem('soulie_entries', JSON.stringify(allEntries));
            
            // Show mood feedback
            const moodFeedback = document.getElementById('mood-feedback');
            if (moodFeedback) {
                const emoji = moodEmojis[detectedMood] || '✨';
                const label = moodLabels[detectedMood] || detectedMood;
                moodFeedback.textContent = `${emoji} Detected mood: ${label}`;
                moodFeedback.style.display = 'block';
                setTimeout(() => { moodFeedback.style.display = 'none'; }, 4000);
            }

            journalText.value = '';
            renderCalendar();
            renderSoundCards(detectedMood);
            renderRegulationTools(detectedMood);
        });
    }

    if (tabButtons) {
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                tabButtons.forEach(t => t.classList.remove('active'));
                btn.classList.add('active');
                
                const tab = btn.getAttribute('data-tab');
                
                if (tab === 'write-entry') {
                    writeEntrySection.classList.remove('hidden');
                    calendarSection.classList.add('hidden');
                } else if (tab === 'calendar') {
                    writeEntrySection.classList.add('hidden');
                    calendarSection.classList.remove('hidden');
                    renderCalendar();
                }
            });
        });
    }

    // Initialize Auth state on load
    const savedUser = localStorage.getItem('soulie_currentUser');
    if (savedUser) {
        const homeGreeting = document.getElementById('home-greeting');
        const companionGreeting = document.getElementById('companion-greeting');
        const appNav = document.getElementById('app-nav');
        const logoutBtn = document.getElementById('logout-btn');
        
        if (homeGreeting) homeGreeting.innerHTML = `Welcome, ${savedUser}.<br>Breathe.<br>Reflect.<br>Reset.`;
        if (companionGreeting) companionGreeting.innerText = `Hi, ${savedUser}. I'm here with you.`;
        if (appNav) appNav.style.display = 'flex';
        if (logoutBtn) logoutBtn.style.display = 'block';
        
        const authView = document.getElementById('view-auth');
        const homeView = document.getElementById('view-home');
        if (authView) authView.classList.remove('active');
        if (homeView) homeView.classList.add('active');
    }
});
