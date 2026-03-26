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

    // ===== Find Nearby Support — mock data & flow =====
    const nearbyCentersData = [
        { id: 1, name: "Serenity Mindfulness Studio", type: "Meditation", icon: "🧘", address: "12 Rue de la Paix, 75001 Paris", desc: "A peaceful urban retreat offering guided meditation, breathwork, and mindfulness classes for all levels.", distance: "0.3 km" },
        { id: 2, name: "The Yoga Loft", type: "Yoga", icon: "🧘‍♀️", address: "47 Boulevard Saint-Germain, 75005 Paris", desc: "Community-focused yoga studio with restorative, vinyasa, and yin classes. Welcoming to beginners.", distance: "0.6 km" },
        { id: 3, name: "Open Mind Counseling", type: "Counseling", icon: "💬", address: "8 Rue du Temple, 75004 Paris", desc: "Confidential individual and group counseling for students and young professionals dealing with stress, anxiety, and burnout.", distance: "0.9 km" },
        { id: 4, name: "Breath & Be Studio", type: "Breathwork", icon: "🌬️", address: "23 Rue Montorgueil, 75002 Paris", desc: "Specializing in somatic breathwork and nervous system regulation techniques. Drop-in sessions available.", distance: "1.1 km" },
        { id: 5, name: "Circle of Care", type: "Support Groups", icon: "👥", address: "5 Passage Brady, 75010 Paris", desc: "Weekly peer support circles for loneliness, academic pressure, and life transitions. All genders welcome.", distance: "1.4 km" },
        { id: 6, name: "Calm Space Therapy", type: "Counseling", icon: "💬", address: "31 Rue de Rivoli, 75004 Paris", desc: "Short-term therapeutic consultations in a safe, judgment-free space. First session free for students.", distance: "1.7 km" },
        { id: 7, name: "Lotus Flow Yoga", type: "Yoga", icon: "🧘‍♀️", address: "18 Rue de Bretagne, 75003 Paris", desc: "Hot and gentle yoga classes in a beautiful studio space. Specializes in stress relief and flexibility.", distance: "2.0 km" },
        { id: 8, name: "Rise Together Group", type: "Support Groups", icon: "👥", address: "64 Rue Oberkampf, 75011 Paris", desc: "Themed monthly meetups focused on resilience, self-compassion, and community connection.", distance: "2.3 km" }
    ];

    // Track the currently selected center for the booking flow
    let selectedCenter = null;

    // Show a support panel by name ('search' | 'results' | 'detail' | 'booking' | 'success')
    window.showSupportPanel = (name) => {
        document.querySelectorAll('.support-panel').forEach(p => {
            p.classList.remove('active-panel');
            p.classList.add('hidden');
        });
        const target = document.getElementById(`support-panel-${name}`);
        if (target) {
            target.classList.remove('hidden');
            target.classList.add('active-panel');
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Step 1: Search
    window.findNearbySupport = () => {
        const address = document.getElementById('nearby-address-input').value.trim();
        if (!address) {
            document.getElementById('nearby-address-input').focus();
            return;
        }

        const btn = document.querySelector('.nearby-search-btn');
        btn.textContent = 'Searching…';
        btn.disabled = true;

        setTimeout(() => {
            btn.textContent = 'Find Nearby Support';
            btn.disabled = false;

            const label = document.getElementById('nearby-results-label');
            if (label) label.textContent = `Results near "${address}"`;

            // Reset filters & sort to defaults each new search
            currentResultsCategory = 'all';
            currentResultsSort = 'nearest';
            const sortSelect = document.getElementById('results-sort-select');
            if (sortSelect) sortSelect.value = 'nearest';
            document.querySelectorAll('.result-chip').forEach(c => {
                c.classList.toggle('active', c.getAttribute('data-cat') === 'all');
            });

            showRecommendationBanner();
            renderNearbyResults();
            showSupportPanel('results');
        }, 900);
    };

    // Filter/sort state for results panel
    let currentResultsCategory = 'all';
    let currentResultsSort = 'nearest';

    // Mood → recommended category mapping
    const moodToCategory = {
        stressed:    { cat: 'Breathwork',     msg: 'Based on your recent journal, Breathwork sessions may help you reset right now.' },
        anxious:     { cat: 'Meditation',     msg: 'Your journal suggests some anxiety — Meditation could bring you calm.' },
        overwhelmed: { cat: 'Breathwork',     msg: 'When things feel like too much, Breathwork can help you feel grounded.' },
        lonely:      { cat: 'Support Groups', msg: 'You don\'t have to go through this alone — Support Groups are a great place to connect.' },
        burned_out:  { cat: 'Meditation',     msg: 'Rest and recovery matter — Meditation sessions are recommended for burnout.' },
        angry:       { cat: 'Yoga',           msg: 'Yoga can help channel and release intense emotions safely.' },
        calm:        { cat: 'Yoga',           msg: 'You\'re feeling balanced — a Yoga class is a great way to maintain that peace.' }
    };

    // Show or hide the mood recommendation banner
    const showRecommendationBanner = () => {
        const banner = document.getElementById('support-recommendation-banner');
        const text = document.getElementById('support-recommendation-text');
        if (!banner || !text) return;
        const rec = moodToCategory[selectedMood];
        if (rec) {
            text.textContent = rec.msg;
            banner.classList.remove('hidden');
        } else {
            banner.classList.add('hidden');
        }
    };

    // Apply current filter + sort and re-render — called by chips and sort select
    window.applyResultsFilters = () => {
        const sortEl = document.getElementById('results-sort-select');
        if (sortEl) currentResultsSort = sortEl.value;
        renderNearbyResults();
    };

    // Wire up category chip clicks (delegated on the chips container)
    document.addEventListener('click', e => {
        const chip = e.target.closest('.result-chip');
        if (!chip) return;
        document.querySelectorAll('.result-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        currentResultsCategory = chip.getAttribute('data-cat');
        renderNearbyResults();
    });

    // Step 2: Render results with filtering and sorting
    const renderNearbyResults = () => {
        const grid = document.getElementById('nearby-results-grid');
        if (!grid) return;

        const recommendedCat = (moodToCategory[selectedMood] || {}).cat || null;

        // 1. Filter by category
        let results = currentResultsCategory === 'all'
            ? [...nearbyCentersData]
            : nearbyCentersData.filter(c => c.type === currentResultsCategory);

        // 2. Sort
        if (currentResultsSort === 'nearest') {
            results.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
        } else {
            // Recommended: mood-matched category floats to top, then by distance
            results.sort((a, b) => {
                const aRec = recommendedCat && a.type === recommendedCat ? 1 : 0;
                const bRec = recommendedCat && b.type === recommendedCat ? 1 : 0;
                if (bRec !== aRec) return bRec - aRec;
                return parseFloat(a.distance) - parseFloat(b.distance);
            });
        }

        if (results.length === 0) {
            grid.innerHTML = `<p style="grid-column:1/-1; text-align:center; padding:40px; color:var(--text-light);">No ${currentResultsCategory} centers found. Try a different category.</p>`;
            return;
        }

        grid.innerHTML = results.map(center => {
            const isRecommended = recommendedCat && center.type === recommendedCat && currentResultsSort === 'recommended';
            return `
                <div class="support-card nearby-result-card${isRecommended ? ' result-card--recommended' : ''}" onclick="viewCenterDetail(${center.id})">
                    ${isRecommended ? '<span class="result-rec-badge">✨ Recommended for you</span>' : ''}
                    <div class="nearby-result-top">
                        <span class="nearby-result-icon">${center.icon}</span>
                        <span class="nearby-distance-badge">${center.distance}</span>
                    </div>
                    <div class="support-category">${center.type}</div>
                    <h3>${center.name}</h3>
                    <p class="support-desc">${center.desc}</p>
                    <button class="btn-primary" style="width:auto; padding:10px 20px; font-size:0.88rem; margin-top:auto;"
                        onclick="event.stopPropagation(); viewCenterDetail(${center.id})">View Details</button>
                </div>
            `;
        }).join('');
    };


    // Step 3: Show detail view
    window.viewCenterDetail = (centerId) => {
        selectedCenter = nearbyCentersData.find(c => c.id === centerId);
        if (!selectedCenter) return;

        const detailCard = document.getElementById('nearby-detail-card');
        if (detailCard) {
            detailCard.innerHTML = `
                <div class="detail-icon">${selectedCenter.icon}</div>
                <div class="detail-type-chip">${selectedCenter.type}</div>
                <h3 class="detail-name">${selectedCenter.name}</h3>
                <p class="detail-address">📍 ${selectedCenter.address}</p>
                <p class="detail-desc">${selectedCenter.desc}</p>
                <button class="btn-primary" style="margin-top: 28px;" onclick="openBookingForm()">Book Appointment</button>
            `;
        }
        showSupportPanel('detail');
    };

    // Step 4: Open booking form
    window.openBookingForm = () => {
        if (!selectedCenter) return;
        const nameEl = document.getElementById('booking-center-name');
        const typeEl = document.getElementById('booking-center-type');
        if (nameEl) nameEl.textContent = selectedCenter.name;
        if (typeEl) typeEl.textContent = selectedCenter.type;

        // Set min date to today
        const dateInput = document.getElementById('booking-date');
        if (dateInput) {
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            dateInput.min = `${yyyy}-${mm}-${dd}`;
            dateInput.value = '';
        }
        const timeInput = document.getElementById('booking-time');
        if (timeInput) timeInput.value = '';

        // Clear email field and hide any previous error
        const emailInput = document.getElementById('booking-email');
        if (emailInput) emailInput.value = '';
        const emailError = document.getElementById('booking-email-error');
        if (emailError) emailError.classList.add('hidden');

        showSupportPanel('booking');
    };

    // Tab switcher: 'find' or 'mybookings'
    window.switchSupportTab = (tab) => {
        // Update tab button states
        document.querySelectorAll('.support-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-tab') === tab);
        });
        // Show/hide tab content
        document.getElementById('support-tab-find').classList.toggle('hidden', tab !== 'find');
        document.getElementById('support-tab-mybookings').classList.toggle('hidden', tab !== 'mybookings');

        if (tab === 'mybookings') {
            renderMyBookings();
        }
    };

    // Step 5: Confirm booking — save to localStorage then show success
    window.confirmBooking = () => {
        const dateInput = document.getElementById('booking-date');
        const timeInput = document.getElementById('booking-time');
        const emailInput = document.getElementById('booking-email');
        const emailError = document.getElementById('booking-email-error');
        const date = dateInput ? dateInput.value : '';
        const time = timeInput ? timeInput.value : '';
        const email = emailInput ? emailInput.value.trim() : '';

        // Validate date & time
        if (!date || !time) {
            alert('Please choose both a date and a time to continue.');
            return;
        }

        // Validate email
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailPattern.test(email)) {
            if (emailError) emailError.classList.remove('hidden');
            if (emailInput) emailInput.focus();
            return;
        }
        if (emailError) emailError.classList.add('hidden');

        // Format date nicely
        const [y, m, d] = date.split('-');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const prettyDate = `${months[parseInt(m, 10) - 1]} ${parseInt(d, 10)}, ${y}`;

        const successEl = document.getElementById('booking-success-details');
        if (successEl && selectedCenter) {
            successEl.innerHTML = `Your appointment has been confirmed. A confirmation email has been sent.<br><span style="font-size:0.9rem; color:var(--text-light);">You can view it anytime in My Bookings.</span>`;
        }

        // --- Save booking to localStorage ---
        const currentUser = localStorage.getItem('soulie_currentUser') || 'Anonymous';
        const newBooking = {
            username: currentUser,
            centerName: selectedCenter ? selectedCenter.name : '',
            category: selectedCenter ? selectedCenter.type : '',
            address: selectedCenter ? selectedCenter.address : '',
            date: prettyDate,
            rawDate: date,
            time: time,
            email: email
        };
        const existing = localStorage.getItem('soulie_bookings');
        const allBookings = existing ? JSON.parse(existing) : [];
        allBookings.push(newBooking);
        localStorage.setItem('soulie_bookings', JSON.stringify(allBookings));

        showSupportPanel('success');
    };

    // Render My Bookings tab
    const renderMyBookings = () => {
        const container = document.getElementById('mybookings-list');
        if (!container) return;

        const currentUser = localStorage.getItem('soulie_currentUser') || 'Anonymous';
        const existing = localStorage.getItem('soulie_bookings');
        const allBookings = existing ? JSON.parse(existing) : [];

        // Filter by current user, sort newest first (by rawDate desc)
        const userBookings = allBookings
            .map((b, i) => ({ ...b, globalIndex: i }))
            .filter(b => b.username === currentUser)
            .sort((a, b) => (b.rawDate || '').localeCompare(a.rawDate || ''));

        if (userBookings.length === 0) {
            container.innerHTML = `
                <div class="mybookings-empty">
                    <div class="mybookings-empty-icon">🗓️</div>
                    <h3>No bookings yet</h3>
                    <p>Your upcoming support sessions will appear here.</p>
                    <button class="btn-secondary" style="margin-top:20px; width:auto; padding:10px 24px;"
                        onclick="switchSupportTab('find')">Find Support</button>
                </div>
            `;
            return;
        }

        container.innerHTML = userBookings.map(b => `
            <div class="booking-history-card">
                <div class="booking-history-header">
                    <div>
                        <span class="booking-history-category">${b.category}</span>
                        <h3 class="booking-history-name">${b.centerName}</h3>
                    </div>
                    <button class="booking-cancel-btn" onclick="cancelBooking(${b.globalIndex})" title="Cancel booking">✕</button>
                </div>
                <div class="booking-history-meta">
                    <span>📍 ${b.address}</span>
                    <span>📅 ${b.date}</span>
                    <span>🕐 ${b.time}</span>
                    ${b.email ? `<span class="booking-history-email">✉️ ${b.email}</span>` : ''}
                </div>
            </div>
        `).join('');
    };

    // Cancel a booking (by global index in the full array)
    window.cancelBooking = (globalIndex) => {
        const existing = localStorage.getItem('soulie_bookings');
        if (!existing) return;
        const allBookings = JSON.parse(existing);
        allBookings.splice(globalIndex, 1);
        localStorage.setItem('soulie_bookings', JSON.stringify(allBookings));
        renderMyBookings();
    };

    // Legacy close modal (kept for safety)
    window.closeBookingModal = () => {
        const bm = document.getElementById('booking-modal');
        if (bm) bm.classList.add('hidden');
    };

    const closeModal = document.querySelector('.close-modal');
    if (closeModal) closeModal.onclick = window.closeBookingModal;

    window.onclick = (event) => {
        const bm = document.getElementById('booking-modal');
        if (bm && event.target === bm) window.closeBookingModal();
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
    const regulationContainer = document.getElementById('regulation-cards-container');


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

        // Update regulation tools based on mood
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
