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

        // Dynamic rendering
        if (viewId === 'view-journal') {
            if (typeof renderCalendar === 'function') renderCalendar();
        }

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
        // Inject pro offerings before rendering results
        injectProOfferingsIntoResults();

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

        // Merge pro offerings into the result set
        const proExtras = (window._proExtraCenters || []);
        const allCenters = [...nearbyCentersData, ...proExtras];

        // 1. Filter by category
        let results = currentResultsCategory === 'all'
            ? [...allCenters]
            : allCenters.filter(c => c.type === currentResultsCategory);

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
            const proTag = center.isProCreated ? `<span class="pro-created-badge">✦ Soulie Pro</span>` : '';
            
            // Professional Avatar Clickable
            const pAvt = (center.isProCreated && center.proPhoto) 
                ? `<img src="${center.proPhoto}" onclick="event.stopPropagation(); openProProfile('${center.proEmail}')" style="width:24px; height:24px; border-radius:50%; object-fit:cover; margin-right:6px; vertical-align:middle; cursor:pointer;">` 
                : (center.isProCreated ? `<span onclick="event.stopPropagation(); openProProfile('${center.proEmail}')" style="font-size:1.1rem; margin-right:6px; vertical-align:middle; cursor:pointer;">👤</span>` : '');
            
            // Professional Row Clickable (Photo + Name)
            const pRow = center.isProCreated 
                ? `<div style="font-size:0.85rem; color:var(--text-light); margin-bottom:10px; display:flex; align-items:center;">
                    <span onclick="event.stopPropagation(); openProProfile('${center.proEmail}')" style="cursor:pointer; display:flex; align-items:center;">
                        ${pAvt}<span>By ${center.proName}</span>
                    </span> 
                    <span style="margin-left:6px; padding-left:6px; border-left:1px solid #ddd; font-weight:500;">${center.proProfession}</span>
                   </div>` 
                : '';

            return `
                <div class="support-card nearby-result-card${isRecommended ? ' result-card--recommended' : ''}" onclick="viewCenterDetail('${center.id}')">
                    ${isRecommended ? '<span class="result-rec-badge">✨ Recommended for you</span>' : ''}
                    ${proTag}
                    <div class="nearby-result-top">
                        <span class="nearby-result-icon">${center.icon}</span>
                        <span class="nearby-distance-badge">${center.distance}</span>
                    </div>
                    <div class="support-category">${center.type}</div>
                    <h3 style="${center.isProCreated ? 'margin-bottom:6px;' : ''}">${center.name}</h3>
                    ${pRow}
                    <p class="support-desc">${center.desc}</p>
                    <button class="btn-primary" style="width:auto; padding:10px 20px; font-size:0.88rem; margin-top:auto;"
                        onclick="event.stopPropagation(); viewCenterDetail('${center.id}')">View Details</button>
                </div>
            `;
        }).join('');
    };



    // Step 3: Show detail view
    window.viewCenterDetail = (centerId) => {
        // Search both hardcoded centers and pro-created ones
        const allCenters = [...nearbyCentersData, ...(window._proExtraCenters || [])];
        selectedCenter = allCenters.find(c => String(c.id) === String(centerId));
        if (!selectedCenter) return;

        const detailCard = document.getElementById('nearby-detail-card');
        if (detailCard) {
            const proTagHtml = selectedCenter.isProCreated
                ? `<span class="pro-created-badge" style="display:inline-block; margin-bottom:12px;">✦ Soulie Pro Offering</span>`
                : '';
                
            const pAvt = (selectedCenter.isProCreated && selectedCenter.proPhoto) 
                ? `<img src="${selectedCenter.proPhoto}" onclick="openProProfile('${selectedCenter.proEmail}')" style="width:46px; height:46px; border-radius:50%; object-fit:cover; border:2px solid #fff; box-shadow:0 4px 10px rgba(0,0,0,0.05); margin-bottom:8px; cursor:pointer;">` 
                : (selectedCenter.isProCreated ? `<div onclick="openProProfile('${selectedCenter.proEmail}')" style="font-size:2.2rem; margin-bottom:6px; cursor:pointer;">👤</div>` : '');
                
            const pRow = selectedCenter.isProCreated 
                ? `<div style="display:flex; flex-direction:column; align-items:center; margin-bottom:20px; padding:12px; background:rgba(255,255,255,0.4); border-radius:12px;">
                    <div onclick="openProProfile('${selectedCenter.proEmail}')" style="cursor:pointer; text-align:center;">
                        ${pAvt}<br>
                        <span style="font-size:0.95rem; font-weight:600; color:var(--text-dark);">By ${selectedCenter.proName}</span>
                    </div>
                    <span style="font-size:0.85rem; color:var(--text-light); margin-top:2px;">${selectedCenter.proProfession}</span>
                   </div>` 
                : '';
                
            const timeHtml = selectedCenter.availableTime
                ? `<p class="detail-address">🕐 ${selectedCenter.availableTime}</p>`
                : '';
                
            detailCard.innerHTML = `
                <div class="detail-icon" style="${selectedCenter.isProCreated ? 'font-size:2.2rem; margin-bottom:8px;' : ''}">${selectedCenter.icon}</div>
                ${proTagHtml}
                <div class="detail-type-chip">${selectedCenter.type}</div>
                <h3 class="detail-name">${selectedCenter.name}</h3>
                ${pRow}
                <p class="detail-address" style="margin-bottom:8px;">📍 ${selectedCenter.address}</p>
                ${timeHtml}
                <div style="height:1px; background:rgba(0,0,0,0.06); margin:16px 0;"></div>
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
            email: email,
            proEmail: selectedCenter && selectedCenter.isProCreated ? selectedCenter.proEmail : null
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


    // ----------------------------------------------------
    // REGULATION TOOLS - Interactive Engine
    // ----------------------------------------------------

    const regulationToolsData = [
        {
            id: 'tool-box-breathing',
            name: "Box Breathing",
            purpose: "Reset your breath and slow your heart rate.",
            estimatedTime: "1-2 minutes",
            bestFor: ['anxious', 'stressed', 'calm'],
            type: 'breathing',
            phases: [
                { text: "Inhale...", duration: 4 },
                { text: "Hold...", duration: 4 },
                { text: "Exhale...", duration: 4 },
                { text: "Hold empty...", duration: 4 }
            ],
            cycles: 4
        },
        {
            id: 'tool-grounding',
            name: "5-4-3-2-1 Grounding",
            purpose: "Find your surroundings and return to the present.",
            estimatedTime: "2-3 minutes",
            bestFor: ['overwhelmed', 'lonely', 'anxious'],
            type: 'timed-steps',
            steps: [
                { text: "Take a deep, slow breath.", duration: 7 },
                { text: "Look around. Silently name 5 things you can see.", duration: 10 },
                { text: "Notice your body. Name 4 things you can physically feel.", duration: 10 },
                { text: "Listen closely. Name 3 things you can hear.", duration: 7 },
                { text: "Name 2 things you can smell (or your favorite smells).", duration: 7 },
                { text: "Name 1 thing you can taste (or a comforting flavor).", duration: 7 },
                { text: "Take one last deep breath. You are here.", duration: 7 }
            ]
        },
        {
            id: 'tool-body-scan',
            name: "60-Second Body Scan",
            purpose: "Check in with physical tension and release it.",
            estimatedTime: "1 minute",
            bestFor: ['burned_out', 'stressed', 'calm'],
            type: 'timer',
            totalSeconds: 60,
            prompts: [
                { time: 60, text: "Close your eyes and take a slow breath in." },
                { time: 50, text: "Notice your forehead, eyes, and jaw. Let them soften." },
                { time: 40, text: "Drop your shoulders away from your ears." },
                { time: 30, text: "Notice your chest rising and falling. Don't force it." },
                { time: 20, text: "Soften your hands and let your arms rest heavy." },
                { time: 10, text: "Feel the weight of your legs and feet against the floor." },
                { time: 0,  text: "Slowly open your eyes." }
            ]
        },
        {
            id: 'tool-shoulder',
            name: "Shoulder Release",
            purpose: "Drop the physical weight you're carrying.",
            estimatedTime: "1 minute",
            bestFor: ['overwhelmed', 'burned_out', 'lonely', 'angry'],
            type: 'timed-steps',
            steps: [
                { text: "Sit up slightly, feet flat on the floor.", duration: 5 },
                { text: "Inhale deeply. Lift your shoulders all the way up to your ears.", duration: 6 },
                { text: "Hold them there. Notice the tension.", duration: 5 },
                { text: "Exhale forcefully through your mouth. Drop your shoulders completely.", duration: 6 },
                { text: "Let's do that again. Inhale and lift shoulders up.", duration: 6 },
                { text: "Hold the tension.", duration: 5 },
                { text: "Exhale and drop them heavily.", duration: 6 },
                { text: "Gently roll your shoulders back a few times.", duration: 7 }
            ]
        }
    ];

    // State tracking for active tools
    const activeTools = {};

    // --- Background Music Controls ---
    const playSoulieMusic = () => {
        const bgm = document.getElementById('soulie-bgm');
        if (bgm) {
            bgm.currentTime = 0;
            bgm.play().catch(err => console.log("Audio play prevented by browser policy:", err));
        }
    };

    const stopSoulieMusic = () => {
        const bgm = document.getElementById('soulie-bgm');
        if (bgm) {
            bgm.pause();
            bgm.currentTime = 0;
        }
    };

    window.startTool = (toolId) => {
        // Enforce single-activity: reset any currently running tools
        Object.keys(activeTools).forEach(id => {
            if (activeTools[id] && activeTools[id].isRunning) {
                window.resetTool(id);
            }
        });

        const tool = regulationToolsData.find(t => t.id === toolId);
        if (!tool) return;

        // Start background music
        playSoulieMusic();

        const container = document.getElementById(`${toolId}-content`);
        const startBtn = document.getElementById(`${toolId}-start-btn`);
        
        startBtn.classList.add('hidden');
        container.classList.remove('hidden');

        activeTools[toolId] = { isRunning: true, currentStep: 0, cycle: 0, timer: null };

        if (tool.type === 'stepper') {
            renderStepperTool(tool, container);
        } else if (tool.type === 'breathing') {
            runBreathingTool(tool, container);
        } else if (tool.type === 'timer') {
            runTimerTool(tool, container);
        } else if (tool.type === 'timed-steps') {
            runTimedStepsTool(tool, container);
        }
    };

    const endTool = (toolId, container) => {
        clearInterval(activeTools[toolId].timer);
        activeTools[toolId].isRunning = false;
        
        // Stop background music
        stopSoulieMusic();

        container.innerHTML = `
            <div class="tool-completed slide-in">
                <span class="emoji" style="font-size:2rem; margin-bottom:8px; display:block;">✨</span>
                <p style="font-weight:600; margin-bottom:16px;">Exercise complete</p>
                <button class="btn-secondary" onclick="resetTool('${toolId}')">Start Over</button>
            </div>
        `;
        
        // Save to completedTools in localStorage
        const currentUser = localStorage.getItem('soulie_currentUser') || 'Anonymous';
        const today = new Date();
        const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        
        const completedToolsStr = localStorage.getItem('soulie_completed_tools');
        let completedTools = completedToolsStr ? JSON.parse(completedToolsStr) : [];
        const toolLabel = regulationToolsData.find(t => t.id === toolId)?.name || toolId;
        
        completedTools.push({
            username: currentUser,
            date: dateKey,
            toolId: toolId,
            toolName: toolLabel,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('soulie_completed_tools', JSON.stringify(completedTools));
    };

    window.resetTool = (toolId) => {
        const tool = regulationToolsData.find(t => t.id === toolId);
        const container = document.getElementById(`${toolId}-content`);
        const startBtn = document.getElementById(`${toolId}-start-btn`);
        
        if (activeTools[toolId] && activeTools[toolId].timer) {
            clearInterval(activeTools[toolId].timer);
        }
        activeTools[toolId] = null;

        // Stop background music
        stopSoulieMusic();
        
        container.innerHTML = '';
        container.classList.add('hidden');
        startBtn.classList.remove('hidden');
    };

    // --- Interactive Tool Renderers ---

    const renderStepperTool = (tool, container) => {
        const state = activeTools[tool.id];
        
        container.innerHTML = `
            <div class="tool-active-area fade-in">
                <p id="${tool.id}-stepper-text" class="tool-prompt" style="font-size:1.1rem; min-height:90px; transition: opacity 0.3s;"></p>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:20px;">
                    <span id="${tool.id}-stepper-count" style="font-size:0.85rem; color:var(--text-light);"></span>
                    <div style="display:flex; gap:8px;">
                        <button class="btn-secondary" style="padding: 8px 12px; font-size: 0.85rem;" onclick="resetTool('${tool.id}')">Stop</button>
                        <button id="${tool.id}-stepper-btn" class="btn-primary" style="padding: 8px 16px; font-size: 0.85rem;" onclick="progressStepper('${tool.id}')">Next</button>
                    </div>
                </div>
            </div>
        `;
        
        const textEl = document.getElementById(`${tool.id}-stepper-text`);
        const countEl = document.getElementById(`${tool.id}-stepper-count`);
        const btnEl = document.getElementById(`${tool.id}-stepper-btn`);

        const updateStep = (init = false) => {
            const isLast = state.currentStep === tool.steps.length - 1;
            const newText = tool.steps[state.currentStep];
            
            if (init && textEl) {
                textEl.textContent = newText;
                if (countEl) countEl.textContent = `${state.currentStep + 1} / ${tool.steps.length}`;
                if (btnEl) btnEl.textContent = isLast ? 'Finish' : 'Next';
            } else if (textEl) {
                textEl.style.opacity = '0';
                setTimeout(() => {
                    if (!state.isRunning) return;
                    textEl.textContent = newText;
                    textEl.style.opacity = '1';
                    if (countEl) countEl.textContent = `${state.currentStep + 1} / ${tool.steps.length}`;
                    if (btnEl) btnEl.textContent = isLast ? 'Finish' : 'Next';
                }, 300);
            }
        };
        updateStep(true);
        
        window.progressStepper = (id) => {
            if (activeTools[id].currentStep >= tool.steps.length - 1) {
                endTool(id, container);
            } else {
                activeTools[id].currentStep++;
                updateStep();
            }
        };
    };

    const runBreathingTool = (tool, container) => {
        const state = activeTools[tool.id];
        
        // Initial DOM Setup
        container.innerHTML = `
            <div class="tool-active-area fade-in" style="text-align:center;">
                <div id="${tool.id}-circle" style="
                    width:80px; height:80px; border-radius:50%; background:var(--primary-color); opacity:0.2; 
                    margin: 20px auto; transition: transform 4s ease-in-out;
                    transform: scale(1);
                "></div>
                <h3 id="${tool.id}-text" style="margin-bottom:8px; font-weight:600;"></h3>
                <p id="${tool.id}-cycle" style="font-size:0.85rem; color:var(--text-light); margin-bottom: 20px;"></p>
                <button class="btn-secondary" onclick="resetTool('${tool.id}')">Stop Exercise</button>
            </div>
        `;
        
        const updatePhase = () => {
            if (!state.isRunning) return;
            if (state.cycle >= tool.cycles) {
                endTool(tool.id, container);
                return;
            }

            const phase = tool.phases[state.currentStep];
            
            // Visual circle that grows/shrinks
            let circleTransform = 'scale(1)';
            if (phase.text.includes('Inhale')) circleTransform = 'scale(1.5)';
            else if (phase.text.includes('Hold')) circleTransform = state.currentStep === 1 ? 'scale(1.5)' : 'scale(1)';
            else if (phase.text.includes('Exhale')) circleTransform = 'scale(1)';

            const circle = document.getElementById(`${tool.id}-circle`);
            const textEl = document.getElementById(`${tool.id}-text`);
            const cycleEl = document.getElementById(`${tool.id}-cycle`);

            if (circle) {
                circle.style.transition = `transform ${phase.duration}s ease-in-out`;
                circle.style.transform = circleTransform;
            }
            if (textEl) textEl.textContent = phase.text;
            if (cycleEl) cycleEl.textContent = `Cycle ${state.cycle + 1} of ${tool.cycles}`;

            state.timer = setTimeout(() => {
                state.currentStep++;
                if (state.currentStep >= tool.phases.length) {
                    state.currentStep = 0;
                    state.cycle++;
                }
                updatePhase();
            }, phase.duration * 1000);
        };
        
        // Trigger first phase slightly delayed so CSS transition registers
        setTimeout(updatePhase, 50);
    };

    const runTimerTool = (tool, container) => {
        const state = activeTools[tool.id];
        let secondsLeft = tool.totalSeconds;

        container.innerHTML = `
            <div class="tool-active-area" style="text-align:center;">
                <div id="${tool.id}-timer-text" style="font-size:2.5rem; font-weight:300; margin-bottom:16px; font-variant-numeric: tabular-nums;"></div>
                <p id="${tool.id}-prompt-text" class="tool-prompt" style="font-size:1.1rem; min-height:90px; transition: opacity 0.5s; margin-bottom:20px;"></p>
                <button class="btn-secondary" onclick="resetTool('${tool.id}')">Stop Exercise</button>
            </div>
        `;
        
        const timeEl = document.getElementById(`${tool.id}-timer-text`);
        const promptEl = document.getElementById(`${tool.id}-prompt-text`);
        let currentPromptText = "";

        const updateTimer = () => {
            if (!state.isRunning) return;
            if (secondsLeft <= 0) {
                endTool(tool.id, container);
                return;
            }

            if (timeEl) timeEl.textContent = `0:${secondsLeft < 10 ? '0' : ''}${secondsLeft}`;

            const currentPrompt = tool.prompts.find(p => secondsLeft <= p.time);
            const newPromptText = currentPrompt ? currentPrompt.text : '';
            
            if (promptEl && newPromptText !== currentPromptText) {
                if (currentPromptText === "") {
                    // first load
                    promptEl.textContent = newPromptText;
                } else {
                    // fade transition
                    promptEl.style.opacity = '0';
                    setTimeout(() => {
                        if (!state.isRunning) return;
                        promptEl.textContent = newPromptText;
                        promptEl.style.opacity = '1';
                    }, 500);
                }
                currentPromptText = newPromptText;
            }

            state.timer = setTimeout(() => {
                secondsLeft--;
                updateTimer();
            }, 1000);
        };
        updateTimer();
    };

    const runTimedStepsTool = (tool, container) => {
        const state = activeTools[tool.id];

        // Initial DOM Setup
        container.innerHTML = `
            <div class="tool-active-area fade-in" style="text-align:center; padding: 20px 0;">
                <p id="${tool.id}-step-text" class="tool-prompt" style="font-size:1.15rem; font-weight:500; min-height:80px; margin-bottom: 20px; transition: opacity 0.3s;"></p>
                <div style="margin-top:20px; width:100%; height:4px; background:var(--bg-dark); border-radius:2px; overflow:hidden; margin-bottom: 20px;">
                    <div id="${tool.id}-progress" style="height:100%; background:var(--primary-color); width:0%;"></div>
                </div>
                <button class="btn-secondary" onclick="resetTool('${tool.id}')">Stop Exercise</button>
            </div>
        `;

        const textEl = document.getElementById(`${tool.id}-step-text`);
        const barEl = document.getElementById(`${tool.id}-progress`);

        const updateStep = () => {
            if (!state.isRunning) return;
            if (state.currentStep >= tool.steps.length) {
                endTool(tool.id, container);
                return;
            }

            const step = tool.steps[state.currentStep];
            
            if (textEl && textEl.textContent !== step.text) {
                if (textEl.textContent === "") {
                    textEl.textContent = step.text;
                } else {
                    textEl.style.opacity = '0';
                    setTimeout(() => {
                        if (!state.isRunning) return;
                        textEl.textContent = step.text;
                        textEl.style.opacity = '1';
                    }, 300);
                }
            }
            
            // Reset bar instantly
            if (barEl) {
                barEl.style.transition = 'none';
                barEl.style.width = '0%';
            }

            // Trigger progress bar animation in next tick
            setTimeout(() => {
                if (barEl && state.isRunning) {
                    barEl.style.transition = `width ${step.duration}s linear`;
                    barEl.style.width = '100%';
                }
            }, 50);

            state.timer = setTimeout(() => {
                state.currentStep++;
                updateStep();
            }, step.duration * 1000);
        };
        
        // Short delay to establish DOM before animations start
        setTimeout(updateStep, 50);
    };

    // 3. Grab DOM Elements
    const chatHistory = document.getElementById('chat-history');
    const chatReplyButtons = document.querySelectorAll('.chat-reply-btn');
    const chatInput = document.getElementById('chat-input-field');
    const chatSendBtn = document.getElementById('chat-send-btn');

    const journalText = document.getElementById('journal-entry');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const regulationContainer = document.getElementById('regulation-cards-container');

    // Render original card list but wired up for interactivity
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
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <div>
                            <h3 style="margin-bottom:4px;">${tool.name}</h3>
                            <span style="font-size:0.8rem; color:var(--text-light); background:var(--bg-dark); padding:2px 8px; border-radius:12px;">⏱ ${tool.estimatedTime}</span>
                        </div>
                    </div>
                    <p class="tool-desc" style="margin-top:12px;">${tool.purpose}</p>
                    
                    <button id="${tool.id}-start-btn" class="btn-secondary tool-toggle" onclick="startTool('${tool.id}')">Start Exercise</button>
                    
                    <div id="${tool.id}-content" class="tool-interactive-content hidden" style="margin-top:20px; border-top:1px solid rgba(0,0,0,0.05); padding-top:16px;">
                        <!-- Interactive content injected here -->
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

    let currentCalendarDate = new Date();
    
    // Wire up Calendar Nav Buttons
    const prevMonthBtn = document.getElementById('prev-month-btn');
    const nextMonthBtn = document.getElementById('next-month-btn');
    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
            renderCalendar();
        });
    }
    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
            renderCalendar();
        });
    }

    const renderCalendar = () => {
        if (!calendarGrid) return;
        calendarGrid.innerHTML = '';

        const year = currentCalendarDate.getFullYear();
        const month = currentCalendarDate.getMonth(); // 0-11
        
        const calendarHeaderMonthYear = document.getElementById('calendar-month-year');
        if (calendarHeaderMonthYear) {
            const mNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            calendarHeaderMonthYear.textContent = `${mNames[month]} ${year}`;
        }

        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const currentUser = localStorage.getItem('soulie_currentUser');
        
        const entriesStr = localStorage.getItem('soulie_entries');
        const allEntries = entriesStr ? JSON.parse(entriesStr) : [];
        
        const completedToolsStr = localStorage.getItem('soulie_completed_tools');
        const allCompletedTools = completedToolsStr ? JSON.parse(completedToolsStr) : [];
        
        const supportBookingsStr = localStorage.getItem('soulie_bookings');
        const allSupportBookings = supportBookingsStr ? JSON.parse(supportBookingsStr) : [];

        for (let i = 1; i <= daysInMonth; i++) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day';

            const monthStr = String(month + 1).padStart(2, '0');
            const dayStr = String(i).padStart(2, '0');
            const dateKey = `${year}-${monthStr}-${dayStr}`;

            // Look for matching user AND date
            const dayEntry = allEntries.find(e => e.username === currentUser && e.date === dateKey);
            const dayTools = allCompletedTools.filter(t => t.username === currentUser && t.date === dateKey);
            const dayBookings = allSupportBookings.filter(b => b.username === currentUser && b.rawDate === dateKey);

            dayDiv.innerText = '';
            const numSpan = document.createElement('span');
            numSpan.textContent = i;
            dayDiv.appendChild(numSpan);

            // Add indicator dots
            if (dayEntry || dayTools.length > 0 || dayBookings.length > 0) {
                dayDiv.classList.add('has-entry');
                
                const dotsContainer = document.createElement('div');
                dotsContainer.className = 'calendar-dots-container';
                
                if (dayEntry) {
                    const dot = document.createElement('div');
                    dot.className = 'mood-dot dot-journal';
                    dotsContainer.appendChild(dot);
                }
                if (dayTools.length > 0) {
                    const dot = document.createElement('div');
                    dot.className = 'mood-dot dot-regulate';
                    dotsContainer.appendChild(dot);
                }
                if (dayBookings.length > 0) {
                    const dot = document.createElement('div');
                    dot.className = 'mood-dot dot-support';
                    dotsContainer.appendChild(dot);
                }
                dayDiv.appendChild(dotsContainer);
            }

            dayDiv.addEventListener('click', () => {
                document.querySelectorAll('.calendar-day').forEach(el => el.classList.remove('active-day'));
                dayDiv.classList.add('active-day');

                const viewEl = document.getElementById('calendar-entry-view');
                document.getElementById('calendar-entry-date').innerText = new Date(year, month, i).toLocaleDateString();

                // 1. Journal
                const jContainer = document.getElementById('detail-journal');
                const delBtn = document.getElementById('delete-journal-entry-btn');
                if (dayEntry) {
                    jContainer.classList.remove('hidden');
                    const emoji = moodEmojis[dayEntry.mood] || '✨';
                    const label = moodLabels[dayEntry.mood] || dayEntry.mood;
                    document.getElementById('calendar-entry-mood').innerText = `${emoji} Mood: ${label}`;
                    document.getElementById('calendar-entry-text').innerText = dayEntry.text;
                    if (delBtn) {
                        delBtn.style.display = 'inline-block';
                        delBtn.onclick = () => {
                            if (confirm('Are you sure you want to delete this journal entry?')) {
                                const newEntries = allEntries.filter(e => !(e.username === currentUser && e.date === dateKey));
                                localStorage.setItem('soulie_entries', JSON.stringify(newEntries));
                                viewEl.classList.add('hidden');
                                renderCalendar();
                            }
                        };
                    }
                } else {
                    jContainer.classList.add('hidden');
                    if (delBtn) delBtn.style.display = 'none';
                }
                
                // 2. Regulate Tools
                const rContainer = document.getElementById('detail-regulate');
                const rList = document.getElementById('calendar-entry-regulate-list');
                if (dayTools.length > 0) {
                    rContainer.classList.remove('hidden');
                    rList.innerHTML = dayTools.map(t => `<li style="margin-bottom:4px;">Completed <b>${t.toolName}</b></li>`).join('');
                } else {
                    rContainer.classList.add('hidden');
                }
                
                // 3. Support Bookings
                const sContainer = document.getElementById('detail-support');
                const sList = document.getElementById('calendar-entry-support-list');
                if (dayBookings.length > 0) {
                    sContainer.classList.remove('hidden');
                    sList.innerHTML = dayBookings.map(b => `<li style="margin-bottom:8px;"><b>${b.centerName}</b><br><span style="font-size:0.85rem; color:var(--text-light);">${b.time}</span></li>`).join('');
                } else {
                    sContainer.classList.add('hidden');
                }
                
                // Show empty state if nothing
                if (!dayEntry && dayTools.length === 0 && dayBookings.length === 0) {
                    jContainer.classList.remove('hidden');
                    document.getElementById('calendar-entry-mood').innerText = '';
                    document.getElementById('calendar-entry-text').innerText = 'No wellness activity recorded for this day.';
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

    // Dismiss calendar detail view when clicking outside
    document.addEventListener('click', (e) => {
        const calendarSection = document.getElementById('calendar-section');
        const calendarView = document.getElementById('calendar-entry-view');
        
        // If clicking outside the entire calendar section
        if (calendarSection && !calendarSection.contains(e.target)) {
            if (calendarView && !calendarView.classList.contains('hidden')) {
                calendarView.classList.add('hidden');
                document.querySelectorAll('.calendar-day').forEach(el => el.classList.remove('active-day'));
            }
        }
    });

});

// ============================================================
//  PROFESSIONAL MODE — Auth & Dashboard (outside DOMContentLoaded
//  so they are available as global onclick handlers)
// ============================================================

// --- Helper: get/save professional accounts ---
const getProUsers = () => {
    const d = localStorage.getItem('soulie_pro_users');
    return d ? JSON.parse(d) : {};
};

const showProError = (msg) => {
    const el = document.getElementById('pro-auth-error');
    if (el) { el.textContent = msg; el.style.display = 'block'; }
};
const hideProError = () => {
    const el = document.getElementById('pro-auth-error');
    if (el) el.style.display = 'none';
};

// --- Log in a professional ---
const loginPro = (username) => {
    localStorage.setItem('soulie_currentPro', username);

    // Update greeting
    const proGreeting = document.getElementById('pro-greeting');
    const pros = getProUsers();
    const uObj = pros[username];
    const name = (uObj && uObj.fullName) ? uObj.fullName : username;
    if (proGreeting) proGreeting.innerHTML = `Welcome, ${name}.<br>Your Dashboard`;

    // Show pro badge + logout; hide user bottom nav
    const appNav    = document.getElementById('app-nav');
    const logoutBtn = document.getElementById('logout-btn');
    const proBadge  = document.getElementById('pro-badge');
    if (appNav)    appNav.style.display = 'none';
    if (logoutBtn) { logoutBtn.style.display = 'block'; logoutBtn.textContent = 'Log out'; }
    if (proBadge)  proBadge.style.display = 'block';

    // Switch to pro dashboard
    document.querySelectorAll('.app-view').forEach(v => v.classList.remove('active'));
    const proDash = document.getElementById('view-pro-dashboard');
    if (proDash) proDash.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'auto' });

    // Reset form
    const emailInput = document.getElementById('pro-auth-email');
    const passInput  = document.getElementById('pro-auth-password');
    if (emailInput) emailInput.value = '';
    if (passInput)  passInput.value  = '';
};

window.showProSignupForm = () => {
    hideProError();
    const errorEl = document.getElementById('pro-signup-error');
    if(errorEl) errorEl.style.display = 'none';
    const lCard = document.getElementById('pro-login-card');
    const sCard = document.getElementById('pro-signup-card');
    if (lCard) lCard.classList.add('hidden');
    if (sCard) sCard.classList.remove('hidden');
};

window.showProLoginForm = () => {
    const errorEl = document.getElementById('pro-signup-error');
    if(errorEl) errorEl.style.display = 'none';
    const lCard = document.getElementById('pro-login-card');
    const sCard = document.getElementById('pro-signup-card');
    if (sCard) sCard.classList.add('hidden');
    if (lCard) lCard.classList.remove('hidden');
};

let capturedProPhoto = '';
document.addEventListener('DOMContentLoaded', () => {
    const photoInput = document.getElementById('pro-signup-photo');
    if (photoInput) {
        photoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (evt) => {
                    capturedProPhoto = evt.target.result;
                    const img = document.getElementById('pro-photo-img');
                    const icon = document.getElementById('pro-photo-icon');
                    if (img && icon) {
                        img.src = capturedProPhoto;
                        img.style.display = 'block';
                        icon.style.display = 'none';
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }
});

window.submitProSignup = () => {
    const errorEl = document.getElementById('pro-signup-error');
    const showErr = (msg) => { if(errorEl){ errorEl.textContent = msg; errorEl.style.display = 'block'; } };
    if(errorEl) errorEl.style.display = 'none';

    const fullName   = (document.getElementById('pro-signup-fname')?.value || '').trim();
    const username   = (document.getElementById('pro-signup-username')?.value || '').trim();
    const email      = (document.getElementById('pro-signup-email')?.value || '').trim();
    const password   = document.getElementById('pro-signup-password')?.value || '';
    const gender     = document.getElementById('pro-signup-gender')?.value || '';
    const profession = (document.getElementById('pro-signup-profession')?.value || '').trim();
    const location   = (document.getElementById('pro-signup-location')?.value || '').trim();
    const bio        = (document.getElementById('pro-signup-bio')?.value || '').trim();

    if (!fullName || !username || !email || !password || !profession || !location) {
        showErr('Please fill out all required fields marked with *');
        return;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) { showErr('Please enter a valid email address.'); return; }
    if (password.length < 4) { showErr('Password must be at least 4 characters.'); return; }

    const pros = getProUsers();
    if (pros[username]) { showErr('Account with this username already exists. Please choose another.'); return; }

    pros[username] = {
        password, fullName, username, email, gender, profession, location, bio,
        profilePhoto: capturedProPhoto
    };
    
    localStorage.setItem('soulie_pro_users', JSON.stringify(pros));
    loginPro(username);
    
    // reset form
    document.querySelectorAll('#pro-signup-card .form-input').forEach(el => el.value = '');
    const photoInput = document.getElementById('pro-signup-photo');
    if (photoInput) photoInput.value = '';
    capturedProPhoto = '';
    const img = document.getElementById('pro-photo-img');
    const icon = document.getElementById('pro-photo-icon');
    if(img) img.style.display = 'none';
    if(icon) icon.style.display = 'inline';
};

window.handleProLogin = () => {
    hideProError();
    const username = (document.getElementById('pro-auth-username')?.value || '').trim();
    const password =  document.getElementById('pro-auth-password')?.value || '';

    if (!username || !password) { showProError('Please enter your username and password.'); return; }

    const pros = getProUsers();
    const userObj = pros[username];
    const savedPassword = (userObj && typeof userObj === 'object') ? userObj.password : userObj;
    
    if (!userObj || savedPassword !== password) { showProError('Username or password is incorrect.'); return; }

    loginPro(username);
};

// Override the existing handleLogout to also handle pro sessions
const _originalHandleLogout = window.handleLogout;
window.handleLogout = () => {
    const isPro = !!localStorage.getItem('soulie_currentPro');
    if (isPro) {
        localStorage.removeItem('soulie_currentPro');

        const appNav    = document.getElementById('app-nav');
        const logoutBtn = document.getElementById('logout-btn');
        const proBadge  = document.getElementById('pro-badge');
        if (logoutBtn) { logoutBtn.style.display = 'none'; logoutBtn.textContent = 'Log out'; }
        if (proBadge)  proBadge.style.display = 'none';
        if (appNav)    appNav.style.display = 'none';

        document.querySelectorAll('.app-view').forEach(v => v.classList.remove('active'));
        const authView = document.getElementById('view-auth');
        if (authView) authView.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'auto' });
    } else {
        _originalHandleLogout();
    }
};

// --- Pro tab switcher ---
window.switchProTab = (tab) => {
    document.querySelectorAll('[data-pro-tab]').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-pro-tab') === tab);
    });
    document.getElementById('pro-tab-add').classList.toggle('hidden', tab !== 'add');
    document.getElementById('pro-tab-my').classList.toggle('hidden', tab !== 'my');
    document.getElementById('pro-tab-schedule').classList.toggle('hidden', tab !== 'schedule');
    if (tab === 'my') renderProOfferings();
    if (tab === 'schedule') renderProCalendar();
};

let currentProCalendarDate = new Date();

window.renderProCalendar = () => {
    const grid = document.getElementById('pro-calendar-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const year = currentProCalendarDate.getFullYear();
    const month = currentProCalendarDate.getMonth();
    
    const headerTitle = document.getElementById('pro-calendar-month-year');
    if (headerTitle) {
        const mNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        headerTitle.textContent = `${mNames[month]} ${year}`;
    }

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const currentProEmail = localStorage.getItem('soulie_currentPro');
    
    const allBookings = JSON.parse(localStorage.getItem('soulie_bookings') || '[]');
    const proBookings = allBookings.filter(b => b.proEmail === currentProEmail);

    for (let i = 1; i <= daysInMonth; i++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day';

        const monthStr = String(month + 1).padStart(2, '0');
        const dayStr = String(i).padStart(2, '0');
        const dateKey = `${year}-${monthStr}-${dayStr}`;

        const dayBookings = proBookings.filter(b => b.rawDate === dateKey);

        const numSpan = document.createElement('span');
        numSpan.textContent = i;
        dayDiv.appendChild(numSpan);

        if (dayBookings.length > 0) {
            dayDiv.classList.add('has-entry');
            const dotsContainer = document.createElement('div');
            dotsContainer.className = 'calendar-dots-container';
            const dot = document.createElement('div');
            dot.className = 'mood-dot dot-support';
            dotsContainer.appendChild(dot);
            dayDiv.appendChild(dotsContainer);
        }

        dayDiv.addEventListener('click', () => {
            document.querySelectorAll('#pro-calendar-grid .calendar-day').forEach(el => el.classList.remove('active-day'));
            dayDiv.classList.add('active-day');

            const viewEl = document.getElementById('pro-calendar-entry-view');
            document.getElementById('pro-calendar-entry-date').innerText = new Date(year, month, i).toLocaleDateString();

            const sList = document.getElementById('pro-calendar-entry-support-list');
            if (dayBookings.length > 0) {
                sList.innerHTML = dayBookings.map(b => 
                    `<li style="margin-bottom:8px;">
                        <b>${b.centerName}</b> (${b.category})<br>
                        <span style="font-size:0.85rem; color:var(--text-light);">
                            Time: ${b.time}<br>
                            User: ${b.username || 'Anonymous'} (${b.email})
                        </span>
                    </li>`
                ).join('');
            } else {
                sList.innerHTML = `<li style="margin-bottom:8px; color:var(--text-light);">No scheduled sessions for this day.</li>`;
            }

            viewEl.classList.remove('hidden');
        });

        grid.appendChild(dayDiv);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const prevProMonthBtn = document.getElementById('prev-pro-month-btn');
    const nextProMonthBtn = document.getElementById('next-pro-month-btn');
    if (prevProMonthBtn) {
        prevProMonthBtn.addEventListener('click', () => {
            currentProCalendarDate.setMonth(currentProCalendarDate.getMonth() - 1);
            if (typeof renderProCalendar === 'function') renderProCalendar();
        });
    }
    if (nextProMonthBtn) {
        nextProMonthBtn.addEventListener('click', () => {
            currentProCalendarDate.setMonth(currentProCalendarDate.getMonth() + 1);
            if (typeof renderProCalendar === 'function') renderProCalendar();
        });
    }
});

// --- Format toggle ---
let selectedProFormat = 'In-Person';
window.selectProFormat = (btn) => {
    document.querySelectorAll('.pro-format-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedProFormat = btn.getAttribute('data-format');
};

// --- Save a new offering ---
window.saveProOffering = () => {
    const title    = (document.getElementById('pro-offer-title')?.value || '').trim();
    const category =  document.getElementById('pro-offer-category')?.value || '';
    const desc     = (document.getElementById('pro-offer-desc')?.value || '').trim();
    const address  = (document.getElementById('pro-offer-address')?.value || '').trim();
    const time     = (document.getElementById('pro-offer-time')?.value || '').trim();

    const errorEl = document.getElementById('pro-offer-error');
    const showErr = (msg) => { if (errorEl) { errorEl.textContent = msg; errorEl.style.display = 'block'; } };
    const hideErr = () => { if (errorEl) errorEl.style.display = 'none'; };

    hideErr();
    if (!title)    { showErr('Please give your offering a title.'); return; }
    if (!category) { showErr('Please select a category.'); return; }
    if (!desc)     { showErr('Please add a short description.'); return; }
    if (!address)  { showErr('Please enter an address or location.'); return; }
    if (!time)     { showErr('Please enter your available times.'); return; }

    const currentPro = localStorage.getItem('soulie_currentPro') || 'unknown@pro.com';
    const catIcons = {
        'Meditation': '🧘', 'Yoga': '🧘‍♀️', 'Counseling': '💬',
        'Breathwork': '🌬️', 'Support Groups': '👥', 'Other': '💛'
    };

    const offering = {
        id: Date.now(),
        proEmail: currentPro,
        title,
        category,
        icon: catIcons[category] || '💛',
        desc,
        format: selectedProFormat,
        address,
        time,
        createdAt: new Date().toISOString()
    };

    const existing = localStorage.getItem('soulie_pro_offerings');
    const all = existing ? JSON.parse(existing) : [];
    all.push(offering);
    localStorage.setItem('soulie_pro_offerings', JSON.stringify(all));

    // Clear form
    ['pro-offer-title', 'pro-offer-address', 'pro-offer-time'].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = '';
    });
    const descEl = document.getElementById('pro-offer-desc'); if (descEl) descEl.value = '';
    const catEl  = document.getElementById('pro-offer-category'); if (catEl) catEl.value = '';
    document.querySelectorAll('.pro-format-btn').forEach((b, i) => b.classList.toggle('active', i === 0));
    selectedProFormat = 'In-Person';

    // Switch to My Offerings tab to show success
    window.switchProTab('my');
};

// --- Render pro's own offerings ---
const renderProOfferings = () => {
    const container = document.getElementById('pro-offerings-list');
    if (!container) return;

    const currentPro = localStorage.getItem('soulie_currentPro') || '';
    const all = JSON.parse(localStorage.getItem('soulie_pro_offerings') || '[]');
    const mine = all.filter(o => o.proEmail === currentPro);

    if (mine.length === 0) {
        container.innerHTML = `
            <div class="pro-empty-state">
                <div class="pro-empty-state-icon">📋</div>
                <h3 style="color: var(--text-dark); margin-bottom: 8px;">No offerings yet</h3>
                <p>Switch to the <strong>Add Offering</strong> tab to publish your first support session.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = mine.slice().reverse().map(o => `
        <div class="pro-offering-card">
            <div class="pro-offering-header">
                <div>
                    <span class="pro-offering-category">${o.category}</span>
                    <h3 class="pro-offering-title">${o.icon} ${o.title}</h3>
                </div>
                <button class="pro-offering-delete-btn" onclick="deleteProOffering(${o.id})" title="Delete offering">✕</button>
            </div>
            <p class="pro-offering-desc">${o.desc}</p>
            <div class="pro-offering-meta">
                <span><span class="pro-format-badge">${o.format}</span></span>
                <span>📍 ${o.address}</span>
                <span>🕐 ${o.time}</span>
            </div>
        </div>
    `).join('');
};

// --- Delete an offering ---
window.deleteProOffering = (id) => {
    const all = JSON.parse(localStorage.getItem('soulie_pro_offerings') || '[]');
    const updated = all.filter(o => o.id !== id);
    localStorage.setItem('soulie_pro_offerings', JSON.stringify(updated));
    renderProOfferings();
};

// Inject pro offerings into window._proExtraCenters so renderNearbyResults can merge them.
// Declared as a function (not const arrow) so it is hoisted and callable from inside DOMContentLoaded.
function injectProOfferingsIntoResults() {
    const proOfferings = JSON.parse(localStorage.getItem('soulie_pro_offerings') || '[]');
    const proUsers = JSON.parse(localStorage.getItem('soulie_pro_users') || '{}');
    const catIcons = {
        'Meditation': '🧘', 'Yoga': '🧘‍♀️', 'Counseling': '💬',
        'Breathwork': '🌬️', 'Support Groups': '👥', 'Other': '💛'
    };
    window._proExtraCenters = proOfferings.map(o => {
        const uObj = proUsers[o.proEmail] || {};
        const pPhoto = uObj.profilePhoto || '';
        const pName = uObj.fullName || o.proEmail;
        const pProf = uObj.profession || 'Professional';
        return {
            id: `pro_${o.id}`,
            name: o.title,
            type: o.category,
            icon: o.icon || catIcons[o.category] || '💛',
            address: o.address,
            desc: `${o.desc} (${o.format})`,
            distance: '0.5 km',
            isProCreated: true,
            proEmail: o.proEmail,
            proName: pName,
            proPhoto: pPhoto,
            proProfession: pProf,
            availableTime: o.time
        };
    });
}

// --- Professional Profile Popup ---
window.openProProfile = (proUsername) => {
    const pros = JSON.parse(localStorage.getItem('soulie_pro_users') || '{}');
    const profile = pros[proUsername];
    if (!profile) return;

    const modal = document.getElementById('pro-profile-modal');
    const pPhoto = document.getElementById('modal-pro-photo');
    const pIcon  = document.getElementById('modal-pro-icon');
    const pName  = document.getElementById('modal-pro-name');
    const pProf  = document.getElementById('modal-pro-profession');
    const pGend  = document.getElementById('modal-pro-gender');
    const pBio   = document.getElementById('modal-pro-bio');

    if (profile.profilePhoto) {
        pPhoto.src = profile.profilePhoto;
        pPhoto.style.display = 'block';
        pIcon.style.display = 'none';
    } else {
        pPhoto.style.display = 'none';
        pIcon.style.display = 'block';
    }

    pName.innerText = profile.fullName || profile.username;
    pProf.innerText = profile.profession || '';
    pGend.innerText = profile.gender || 'Not specified';
    pBio.innerText  = profile.bio || 'No introduction provided.';

    modal.style.display = 'flex';
    modal.classList.remove('hidden');
};

window.closeProProfile = () => {
    const modal = document.getElementById('pro-profile-modal');
    modal.classList.add('hidden');
    setTimeout(() => {
        if (modal.classList.contains('hidden')) modal.style.display = 'none';
    }, 300);
};
