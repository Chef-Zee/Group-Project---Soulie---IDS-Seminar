document.addEventListener('DOMContentLoaded', () => {
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

    // 3. Grab DOM Elements
    const moodButtons = document.querySelectorAll('.mood-btn');
    const submitBtn = document.getElementById('find-support-btn');
    const supportSection = document.getElementById('support-section');
    const supportMessageEl = document.getElementById('support-message');
    const resetBtn = document.getElementById('reset-btn');
    const journalText = document.getElementById('journal-entry');

    // 4. Add click listeners to mood buttons
    moodButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove 'selected' class from all buttons
            moodButtons.forEach(btn => btn.classList.remove('selected'));
            
            // Add 'selected' class to the clicked button
            button.classList.add('selected');
            
            // Update state with the selected mood
            selectedMood = button.getAttribute('data-mood');
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
});
