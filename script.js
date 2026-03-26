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

    // 4. Chat — conversational response engine with short-term context memory
    let companionTurnCount = 0;
    let lastMood = null; // mood from the previous turn — used for vague reply context

    // Detects vague / short follow-up messages that should connect to the previous topic
    const isVagueReply = (text) => {
        const t = text.trim().toLowerCase();
        // Match common one-word / short acknowledgement phrases, or any message ≤ 3 words
        const vaguePatterns = /^(yeah|yep|yes|no|nah|not really|kind of|kinda|i guess|i think so|sort of|maybe|i don't know|idk|not sure|a bit|a little|exactly|true|probably|hmm|oh|ugh|same|me too|definitely|totally|i suppose|fair enough|right|makes sense|i see|i know|ugh yeah|yeah exactly|yeah kind of|not much|a lot|everything|nothing|everything honestly|i don't know honestly|hard to say|mostly|mostly school|mostly work|mostly family|mostly everything|school stuff|work stuff|just tired|just stressed|just sad|just lonely|kind of yeah|yeah kind of|not really sure|not sure honestly)$/;
        return vaguePatterns.test(t) || t.split(/\s+/).length <= 3;
    };

    // Contextual follow-ups — used when user sends a vague reply to continue the previous topic
    const contextualFollowUps = {
        overwhelmed: [
            "That makes sense. When everything piles up, even deciding where to start can feel impossible.",
            "Yeah, overwhelm has a way of making the whole list feel urgent all at once.",
            "It's a lot. You don't have to solve it all right now — just the very next step.",
            "That's completely understandable. Overwhelm can sneak up before you even realize it."
        ],
        anxious: [
            "That tracks. Anxiety doesn't always need a clear reason — sometimes it just settles in.",
            "Yeah, that kind of worry can be hard to shake, even when you know it logically.",
            "It makes sense. When your mind is caught in that loop, even rest can feel hard.",
            "That's really common. Anxiety loves to make everything feel more uncertain than it is."
        ],
        stressed: [
            "That makes sense. School pressure can build up quietly until it feels overwhelming.",
            "Yeah, that kind of stress doesn't always feel like stress until it's really heavy.",
            "Academic pressure has a way of touching everything — sleep, focus, mood.",
            "It adds up fast. Even when each thing seems small, together it doesn't feel that way."
        ],
        lonely: [
            "Night can make those feelings feel even louder. That makes a lot of sense.",
            "Yeah, loneliness can be extra heavy when the world around you goes quiet.",
            "That's such a real thing to feel. You're not alone in feeling alone.",
            "Some moments just amplify that feeling of disconnection. It's okay to name it."
        ],
        burned_out: [
            "Yeah, that exhaustion goes deeper than just being tired. Your body is asking for real rest.",
            "That makes sense. Burnout doesn't really go away with one day off — it needs more.",
            "It's hard to push through when your reserves are empty. You're allowed to slow down.",
            "Yeah, running on fumes makes everything harder — thinking, feeling, even deciding."
        ],
        angry: [
            "That frustration makes total sense. Sometimes the situation really is just unfair.",
            "Yeah, anger like that often means something matters to you. That's worth listening to.",
            "It makes sense that you'd feel that way. That kind of thing stays with you.",
            "Right. Sometimes things just aren't okay, and it's important to acknowledge that."
        ],
        calm: [
            "That's really good to hear. Holding onto that feeling is worth it.",
            "Yeah, those quieter moments are easy to overlook — glad you're noticing.",
            "It sounds like things feel a little more settled right now. That matters.",
            "Makes sense. Sometimes 'okay' is actually more than enough."
        ],
        default: [
            "Yeah, that makes sense given what you shared.",
            "I hear you. It sounds like that's been sitting with you.",
            "That tracks. These things aren't always easy to put into words.",
            "Right. It's okay not to have a full explanation for how you feel."
        ]
    };

    // Empathy openers — pool of 4 per mood so replies feel varied
    const empathyOpeners = {
        overwhelmed: [
            "That sounds like a lot to carry right now.",
            "I can hear how much is weighing on you.",
            "When everything piles up at once, even small things feel heavier than usual.",
            "That kind of pressure can be really exhausting."
        ],
        anxious: [
            "That sounds really unsettling.",
            "Anxiety has a way of making everything feel urgent all at once.",
            "I hear that. Worry can be such a draining thing to sit with.",
            "That makes a lot of sense — stress can be so present in the body."
        ],
        stressed: [
            "That sounds like a heavy day.",
            "Academic stress can make everything feel urgent all at once.",
            "It makes sense that you'd feel stretched thin.",
            "A lot seems to be demanded of you right now."
        ],
        lonely: [
            "Loneliness can be such a quiet, heavy feeling.",
            "Feeling disconnected doesn't mean there's something wrong with you.",
            "I'm really glad you're here and that you shared that.",
            "That kind of isolation can be genuinely painful."
        ],
        burned_out: [
            "Burnout is your mind and body asking for a real pause.",
            "Running on empty is hard — you've clearly been pushing through a lot.",
            "That kind of exhaustion goes deeper than just being tired.",
            "You deserve rest, not as a reward, but as a right."
        ],
        angry: [
            "That frustration sounds completely valid.",
            "Anger often points to something that genuinely matters to you.",
            "It makes sense that you'd feel that way.",
            "Being angry doesn't make you wrong — it just means something important was crossed."
        ],
        confused: [
            "It's okay not to have it all figured out.",
            "Uncertainty can feel really unsettling, even when there's no urgency.",
            "Not knowing the answer isn't the same as being lost.",
            "That kind of mental fog is more common than it seems."
        ],
        venting: [
            "I'm here. Take your time.",
            "Go ahead — I'm listening.",
            "You don't have to hold that in. Let it out.",
            "Sometimes you just need someone to hear you. I'm here for that."
        ],
        advice: [
            "That's a thoughtful thing to bring up.",
            "It sounds like you're working through something real.",
            "I appreciate you trusting me with this.",
            "Let's think through this gently together."
        ],
        positive: [
            "That's really wonderful to hear.",
            "I love that for you.",
            "That kind of moment is worth holding onto.",
            "Something good happened — and that genuinely matters."
        ],
        gratitude: [
            "I'm really glad this space has felt supportive.",
            "Thank you for sharing that — it means a lot.",
            "That's kind of you to say.",
            "I'm glad you're here."
        ],
        everyday: [
            "I'm always happy to just chat.",
            "This is a good space for that kind of conversation too.",
            "Thanks for checking in — how are you really doing?",
            "I love hearing about your day, even the ordinary parts."
        ],
        calm: [
            "It's really good to hear you're feeling okay.",
            "That sense of calm is worth noticing and holding onto.",
            "Moments of balance are worth taking in fully.",
            "There's something really special about feeling settled."
        ],
        default: [
            "Thank you for sharing that with me.",
            "I hear you.",
            "That sounds meaningful.",
            "I'm glad you brought that here."
        ]
    };

    // Reflections — empathy + observation, no question
    const reflections = {
        overwhelmed: "When life asks too much at once, even breathing can feel like an effort. You don't have to resolve everything today.",
        anxious: "Anxiety often tricks us into thinking the worst outcomes are certain. But you're here, and that counts for something.",
        stressed: "Stress is your system working hard — it doesn't mean you're failing.",
        lonely: "Sometimes just naming the feeling of loneliness out loud can loosen its grip a little.",
        burned_out: "Rest isn't giving up. It's the thing that lets you keep going.",
        angry: "Emotions like anger are information, not character flaws.",
        confused: "Confusion often means you're on the edge of understanding something new about yourself.",
        venting: "There's real relief in just saying it out loud — you don't need a solution right now.",
        advice: "Sometimes the clearest path forward starts with slowing down and asking what you actually need.",
        positive: "Good moments deserve to be acknowledged fully — not rushed through.",
        gratitude: "It's a two-way thing. I'm glad you're here too.",
        everyday: "The ordinary moments of life matter more than we usually give them credit for.",
        calm: "Calm moments are worth being present for — they're not 'nothing,' they're actually everything.",
        default: "Whatever you're feeling right now, it's valid. You don't have to explain or justify it."
    };

    // Gentle suggestions — empathy + soft nudge, no question
    const gentleSuggestions = {
        overwhelmed: "If it feels possible, try picking just one thing to focus on for the next hour — and let the rest wait.",
        anxious: "A slow exhale can sometimes signal safety to your nervous system. Just one breath, slowly out.",
        stressed: "Even a five-minute pause — away from the screen, just outside or somewhere quiet — can shift things.",
        lonely: "Sometimes sending a short message to someone you trust, even just to say hello, can close the distance a little.",
        burned_out: "Give yourself permission to do less today. Not as a failure — as an act of care.",
        angry: "Finding a physical outlet — even a walk around the block — can help the feeling move through instead of getting stuck.",
        confused: "It might help to write out what you do know, even if it's just a few words. Clarity sometimes follows from there.",
        venting: "Let it out as much as you need. There's no rush to wrap it up neatly.",
        advice: "One small step at a time is enough. You don't have to have the whole plan ready.",
        positive: "Hold onto this. Notice what made it feel good — you can come back to that feeling again.",
        gratitude: "Keep noticing the small things that make a difference. That awareness matters.",
        everyday: "Sometimes just showing up and checking in with yourself is more than enough.",
        calm: "This might be a good time to write something down, or just notice what's making today feel easier.",
        default: "Be gentle with yourself today. That's always a good place to start."
    };

    // Soft follow-up questions — used only on every 3rd turn
    const softQuestions = {
        overwhelmed: "Is there one thing in particular that's weighing on you most right now?",
        anxious: "Has this feeling been building for a while, or did something specific bring it on?",
        stressed: "Is there a particular area of your life that feels the most demanding right now?",
        lonely: "Are there people around you that you feel safe with, even if it's hard to reach out?",
        burned_out: "When did you last feel like yourself, even for a short while?",
        angry: "Do you feel like the anger is more about something external, or something closer to home?",
        confused: "Is there a specific part of the situation that feels most unclear to you?",
        venting: "Is there something in particular that started this feeling, or has it been building for a while?",
        advice: "What do you think you already know about what would help?",
        positive: "What was it about that moment that made it feel so good?",
        gratitude: "What's been making you feel most supported lately?",
        everyday: "What's been on your mind the most today?",
        calm: "What's something that's been helping you feel steadier lately?",
        default: "What's on your mind today?"
    };

    // Full standalone responses for special categories (used instead of opener+body)
    const fullResponses = {
        greeting: [
            "Hey, I'm really glad you're here. How are you feeling today?",
            "Hi there. I'm here with you — what's on your mind?",
            "Hello. Take a breath and settle in. How has your day been so far?",
            "Hey. I was hoping you'd check in. How are you doing right now?"
        ],
        gratitude: [
            "I'm really glad this space has felt supportive. You deserve that.",
            "Thank you for telling me — that genuinely means a lot. I'm happy to be here with you.",
            "That's kind of you to share. I'm glad something helped, even a little.",
            "It means a lot to hear that. I'm glad you're here."
        ],
        positive: [
            "That's genuinely wonderful to hear. Hold onto that feeling — you deserve good moments.",
            "I love hearing that something good happened. What made it feel special?",
            "That's the kind of thing worth pausing for. I'm really glad.",
            "Something good happened, and that matters. Tell me more if you'd like."
        ],
        venting: [
            "I'm here. Go ahead — I'm all ears, no judgment.",
            "Sometimes you just need to let it out. I'm listening, take your time.",
            "Of course. This is a safe space for that. What's been sitting on you?",
            "Absolutely. Say what you need to say. I'm not going anywhere."
        ],
        advice: [
            "I hear you. Let's think through this gently — what does the situation feel like from the inside?",
            "That's a real question and it deserves a thoughtful answer. What have you already tried or considered?",
            "I want to help you think this through. Sometimes the answer starts with what you actually need, not just what to do.",
            "It's okay not to have it figured out yet. What feels like the most tangled part right now?"
        ],
        confused: [
            "It's okay not to have it all figured out. Confusion often means you're paying attention to something that matters.",
            "That unclear feeling is really valid. Sometimes sitting with the question is the first honest step.",
            "Not knowing can feel disorienting — but it's not the same as being stuck. You're still moving.",
            "Confusion often means you're on the edge of something. That's not a bad place to be."
        ],
        everyday: [
            "You don't always need a reason to check in. I'm glad you did.",
            "Even ordinary days are worth talking about. What's been happening?",
            "I'm always here for the everyday stuff too. What's going on?",
            "Sometimes the regular moments are the most interesting. Tell me about your day."
        ]
    };

    const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

    const processUserMessage = (userText, explicitMood = null) => {
        chatHistory.innerHTML += `
            <div class="chat-bubble user-message">
                <div class="message-avatar">👤</div>
                <div class="message-text">${userText}</div>
            </div>`;
        chatHistory.scrollTop = chatHistory.scrollHeight;
        companionTurnCount++;

        // --- Context-aware follow-up: if the reply is vague and we have a previous mood ---
        if (isVagueReply(userText) && lastMood && !explicitMood) {
            const contextReply = pickRandom(contextualFollowUps[lastMood] || contextualFollowUps.default);
            setTimeout(() => {
                chatHistory.innerHTML += `
                    <div class="chat-bubble soulie-message">
                        <div class="message-avatar">✨</div>
                        <div class="message-text">${contextReply}</div>
                    </div>`;
                chatHistory.scrollTop = chatHistory.scrollHeight;
            }, 600);
            // Keep lastMood — the same topic continues
            return;
        }

        // --- Standard mood detection for a new or clear message ---
        let mood = explicitMood;
        if (!mood) {
            const t = userText.toLowerCase();
            // Special / situational categories (checked first for priority)
            if (/^(hi|hey|hello|good morning|good evening|good afternoon|hiya|howdy|sup|what's up|what's good)/.test(t)) mood = 'greeting';
            else if (/thank you|thanks|this helped|i feel better|that helped|appreciate|you're great|so helpful/.test(t)) mood = 'gratitude';
            else if (/something good|great news|excited|happy|good thing happened|celebrated|finally|proud|thrilled|so happy|made me smile/.test(t)) mood = 'positive';
            else if (/need to vent|just venting|can i vent|let me vent|i just need to say|had to get that out/.test(t)) mood = 'venting';
            else if (/what should i do|any advice|give me advice|help me decide|what do you think|what would you do|not sure what to do|don't know what to do/.test(t)) mood = 'advice';
            else if (/confused|don't understand|makes no sense|lost|unclear|not sure why|no idea|can't figure|i don't get/.test(t)) mood = 'confused';
            else if (/just checking in|nothing much|not much|just bored|bored|just here|nothing special|hi just|random|just wanted to/.test(t)) mood = 'everyday';
            // Emotional categories
            else if (/overwhelm|too much|heavy|can't cope/.test(t))             mood = 'overwhelmed';
            else if (/stress|anxious|anxiety|panic|worr|nervous/.test(t))        mood = 'anxious';
            else if (/lonely|alone|isolat|no one/.test(t))                       mood = 'lonely';
            else if (/burn|exhaust|tired|drained|depleted/.test(t))              mood = 'burned_out';
            else if (/angry|anger|mad|frustrat|annoyed|irritated/.test(t))       mood = 'angry';
            else if (/calm|okay|fine|good|grateful|happy|peaceful/.test(t))      mood = 'calm';
            else if (/school|work|study|exam|deadline|academ/.test(t))           mood = 'stressed';
        }
        // For special categories, use fullResponses (standalone complete response)
        const specialCategories = ['greeting', 'gratitude', 'positive', 'venting', 'advice', 'confused', 'everyday'];
        if (mood && specialCategories.includes(mood) && !explicitMood) {
            lastMood = mood;
            const reply = pickRandom(fullResponses[mood]);
            setTimeout(() => {
                chatHistory.innerHTML += `
                    <div class="chat-bubble soulie-message">
                        <div class="message-avatar">✨</div>
                        <div class="message-text">${reply}</div>
                    </div>`;
                chatHistory.scrollTop = chatHistory.scrollHeight;
            }, 600);
            renderRegulationTools(selectedMood);
            return;
        }
        if (mood) { selectedMood = mood; lastMood = mood; }

        // Response type rotates: 1=reflection, 2=suggestion, 3=soft question (only every 3rd)
        const useQuestion = companionTurnCount % 3 === 0;
        const responseType = useQuestion ? 3 : (companionTurnCount % 2 === 0 ? 1 : 2);

        const opener = pickRandom(empathyOpeners[mood] || empathyOpeners.default);
        let body = '';
        if (responseType === 1)      body = reflections[mood]       || reflections.default;
        else if (responseType === 2) body = gentleSuggestions[mood] || gentleSuggestions.default;
        else if (responseType === 3) body = softQuestions[mood]     || softQuestions.default;

        const fullResponse = body ? `${opener} ${body}` : opener;

        setTimeout(() => {
            chatHistory.innerHTML += `
                <div class="chat-bubble soulie-message">
                    <div class="message-avatar">✨</div>
                    <div class="message-text">${fullResponse}</div>
                </div>`;
            chatHistory.scrollTop = chatHistory.scrollHeight;
        }, 600);

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
