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

    // 1. State to keep track of the selected mood
    let selectedMood = '';

    // 2. Setup Support Messages based on mood (Rule-based)
    // These responses are kept simple, empathetic, and encouraging
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

    const guidedPrompts = {
        anxious: "What feels heaviest right now?",
        overwhelmed: "What is one thing you can let go of today?",
        lonely: "What is one way you can show yourself kindness today?",
        burned_out: "What do you need most right now?",
        calm: "What helped you feel safe, calm, or supported today?",
        default: "Write about whatever is on your mind."
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

    // 3. Grab DOM Elements
    const moodButtons = document.querySelectorAll('.mood-btn');
    const submitBtn = document.getElementById('find-support-btn');
    const supportSection = document.getElementById('support-section');
    const supportMessageEl = document.getElementById('support-message');
    const resetBtn = document.getElementById('reset-btn');
    const journalText = document.getElementById('journal-entry');
    const talkToSoulieSection = document.getElementById('talk-to-soulie');
    const talkToSoulieMessage = document.getElementById('talk-to-soulie-message');
    const talkToSoulieSuggestion = document.getElementById('talk-to-soulie-suggestion');
    const resetTalkBtn = document.getElementById('reset-talk-btn');

    const tabButtons = document.querySelectorAll('.tab-btn');
    const journalPromptText = document.getElementById('journal-prompt-text');
    const soundCardsContainer = document.getElementById('sound-cards-container');

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

    // Initial render
    renderSoundCards('calm');

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

    // 4. Add click listeners to mood buttons
    moodButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove 'selected' class from all buttons
            moodButtons.forEach(btn => btn.classList.remove('selected'));
            
            // Add 'selected' class to the clicked button
            button.classList.add('selected');
            
            // Update state with the selected mood
            selectedMood = button.getAttribute('data-mood');
            
            // Update and show Talk to Soulie section
            let responseMessage = supportMessages[selectedMood] || defaultMessage;
            talkToSoulieMessage.innerHTML = `<p>${responseMessage}</p>`;
            talkToSoulieSuggestion.innerText = talkSuggestions[selectedMood] || "";
            talkToSoulieSection.classList.remove('hidden');
            
            // Update guided prompt if the tab is active
            if (document.querySelector('.tab-btn[data-tab="guided-prompt"]').classList.contains('active')) {
                journalPromptText.innerText = guidedPrompts[selectedMood] || guidedPrompts.default;
            }
            
            // Update sound recommendations
            renderSoundCards(selectedMood);
            
            // Update regulation tools
            renderRegulationTools(selectedMood);
            
            // Scroll to it
            setTimeout(() => {
                talkToSoulieSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        });
    });

    // 5. Handle 'Find Support' button click
    submitBtn.addEventListener('click', () => {
        const hasText = journalText.value.trim().length > 0;

        // Require either a mood selected OR some text written
        if (!selectedMood && !hasText) {
            alert("Please select a mood or write something before finding support.");
            return;
        }

        // Determine the response message
        let responseMessage = supportMessages[selectedMood] || defaultMessage;
        
        // Custom message if they wrote in the journal but didn't pick a mood
        if (!selectedMood && hasText) {
            responseMessage = "Thank you for sharing your thoughts. Writing down how you feel is a powerful way to process your emotions. Remember to take things one step at a time.";
        }
        
        // Update the support content
        supportMessageEl.innerHTML = `<p>${responseMessage}</p>`;
        
        // Show the support section
        supportSection.classList.remove('hidden');
        
        // Disable the inputs so they focus on the result support card
        journalText.disabled = true;
        submitBtn.disabled = true;
        moodButtons.forEach(btn => btn.style.pointerEvents = 'none');
        
        // Smooth scroll down to the support message
        setTimeout(() => {
            supportSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    });

    // 6. Handle 'Check in again' reset button click
    resetBtn.addEventListener('click', () => {
        // Clear state
        selectedMood = '';
        
        // Reset UI
        moodButtons.forEach(btn => {
            btn.classList.remove('selected');
            btn.style.pointerEvents = 'auto'; // Re-enable clicks
        });
        journalText.value = '';
        journalText.disabled = false;
        submitBtn.disabled = false;
        
        // Hide support section
        supportSection.classList.add('hidden');
        
        // Scroll back to top smoothly
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Handle 'Reset' for Talk to Soulie
    if (resetTalkBtn) {
        resetTalkBtn.addEventListener('click', () => {
            selectedMood = '';
            moodButtons.forEach(btn => btn.classList.remove('selected'));
            talkToSoulieSection.classList.add('hidden');
            
            // Reset journal tab if on guided mode
            if (document.querySelector('.tab-btn[data-tab="guided-prompt"]').classList.contains('active')) {
                journalPromptText.innerText = guidedPrompts.default;
            }
            
            // Reset sounds to default
            renderSoundCards('calm');
            
            // Reset tools
            renderRegulationTools('calm');
            
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Handle Journal Tabs
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all
            tabButtons.forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
            
            const tab = btn.getAttribute('data-tab');
            
            if (tab === 'free-write') {
                journalPromptText.classList.add('hidden');
                journalText.placeholder = "I'm feeling...";
                if (journalText.value === dailyQuestions) journalText.value = '';
            } else if (tab === 'guided-prompt') {
                journalPromptText.classList.remove('hidden');
                journalPromptText.innerText = guidedPrompts[selectedMood || 'default'];
                journalText.placeholder = "Write your reflection here...";
                if (journalText.value === dailyQuestions) journalText.value = '';
            } else if (tab === 'daily-checkin') {
                journalPromptText.classList.remove('hidden');
                journalPromptText.innerText = "Daily Check-In Questions:";
                if (!journalText.value.trim() || journalText.value === dailyQuestions) {
                    journalText.value = dailyQuestions;
                }
            }
        });
    });
});
