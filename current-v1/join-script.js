/* join-script.js */
import { registerUser } from './auth.js';

// --- Form Logic ---
let currentStep = 1;
const totalSteps = 8; // Added Password step

// DOM Elements
const progressBar = document.getElementById('progressBar');
const stepIndicator = document.getElementById('stepIndicator');
// Note: questions are queried dynamically or we can query them all
const form = document.getElementById('joinForm');
const successScreen = document.getElementById('successScreen');

// Initialize
updateProgress();

// Make functions available globally for HTML onclick attributes
window.nextStep = nextStep;
window.prevStep = prevStep;
window.selectOption = selectOption;
window.submitForm = submitForm;

// Handle Enter Key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        if (currentStep === totalSteps) {
            if (e.ctrlKey) submitForm();
            return;
        }
        nextStep();
    }
});

function updateProgress() {
    const progress = ((currentStep - 1) / totalSteps) * 100;
    progressBar.style.width = `${progress}%`;
    stepIndicator.innerText = `${currentStep} / ${totalSteps}`;
}

function showError(step, msg) {
    const errorDiv = document.querySelector(`.question-slide[data-step="${step}"] .error-msg`);
    if (errorDiv) {
        errorDiv.innerText = msg;
        errorDiv.classList.add('visible');
        setTimeout(() => errorDiv.classList.remove('visible'), 3000);
    }
}

function validateStep(step) {
    const slide = document.querySelector(`.question-slide[data-step="${step}"]`);
    if (!slide) return true;

    if (step === 1) { // Name
        const val = slide.querySelector('input').value.trim();
        if (val.length < 2) {
            showError(step, "Please enter your full name");
            return false;
        }
    }
    else if (step === 2) { // Email
        const val = slide.querySelector('input').value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(val)) {
            showError(step, "Please enter a valid college email");
            return false;
        }
    }
    else if (step === 3) { // Password (NEW)
        const val = slide.querySelector('input').value;
        if (val.length < 6) {
            showError(step, "Password must be at least 6 characters");
            return false;
        }
    }
    else if (step === 4) { // Year
        const selected = slide.querySelector('input[type="radio"]:checked');
        if (!selected) {
            showError(step, "Please select your year");
            return false;
        }
    }
    else if (step === 5) { // Branch
        const val = slide.querySelector('select').value;
        if (!val) {
            showError(step, "Please select your branch");
            return false;
        }
    }
    else if (step === 6) { // Section
        const val = slide.querySelector('input').value.trim();
        if (val.length < 1) {
            showError(step, "Please enter your section");
            return false;
        }
    }
    else if (step === 7) { // Interest
        const selected = slide.querySelector('input[type="radio"]:checked');
        if (!selected) {
            showError(step, "Please select an area of interest");
            return false;
        }
    }
    else if (step === 8) { // Reason
        const val = slide.querySelector('textarea').value.trim();
        if (val.length < 10) {
            showError(step, "Please tell us a bit more (min 10 chars)");
            return false;
        }
    }

    return true;
}

function nextStep() {
    console.log("nextStep called. Current Step:", currentStep);
    if (!validateStep(currentStep)) {
        console.log("Validation failed for step", currentStep);
        return;
    }

    if (currentStep < totalSteps) {
        const currentSlide = document.querySelector(`.question-slide[data-step="${currentStep}"]`);
        const nextSlide = document.querySelector(`.question-slide[data-step="${currentStep + 1}"]`);

        console.log("Transitioning from", currentStep, "to", currentStep + 1);

        if (currentSlide && nextSlide) {
            currentSlide.classList.remove('active');
            currentSlide.classList.add('prev');
            nextSlide.classList.add('active');

            currentStep++;
            updateProgress();

            setTimeout(() => {
                const input = nextSlide.querySelector('input, select, textarea');
                if (input) input.focus();
            }, 500);
        } else {
            console.error("Missing slides. Current:", currentSlide, "Next:", nextSlide);
        }
    } else {
        console.log("Already at last step");
    }
}

function prevStep() {
    if (currentStep > 1) {
        const currentSlide = document.querySelector(`.question-slide[data-step="${currentStep}"]`);
        const prevSlide = document.querySelector(`.question-slide[data-step="${currentStep - 1}"]`);

        if (currentSlide && prevSlide) {
            currentSlide.classList.remove('active');
            prevSlide.classList.remove('prev');
            prevSlide.classList.add('active');

            currentStep--;
            updateProgress();
        }
    }
}

function selectOption(card, groupName) {
    const cards = document.querySelectorAll(`input[name="${groupName}"]`);
    cards.forEach(input => {
        input.parentElement.classList.remove('selected');
    });

    card.classList.add('selected');
    const radio = card.querySelector('input');
    radio.checked = true;

    setTimeout(() => {
        nextStep();
    }, 400);
}

async function submitForm() {
    if (!validateStep(currentStep)) return;

    const btn = document.querySelector('.question-slide[data-step="8"] .btn-next');
    if (btn) {
        btn.innerText = "SENDING...";
        btn.disabled = true;
    }

    // Collect Data
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value; // Get Password

    const additionalData = {
        name: document.getElementById('name').value,
        year: document.querySelector('input[name="year"]:checked').value,
        branch: document.getElementById('branch').value,
        section: document.getElementById('section').value,
        interests: document.querySelector('input[name="interest"]:checked').value,
        reason: document.getElementById('reason').value, // Could store this in Firestore too if needed
        // Note: auth.js logic currently doesn't store 'reason'. I should probably update auth.js or registerUser signature if I want to keep it.
        // For now, let's pass it in additionalData, auth.js might ignore it unless I update auth.js to spread ...additionalData
    };

    try {
        await registerUser(email, password, additionalData);

        // Show Success Screen
        form.style.display = 'none';
        successScreen.classList.add('active');
        successScreen.style.display = 'flex';

    } catch (e) {
        console.error("Registration Error: ", e);
        alert("Registration Failed: " + e.message);
        if (btn) {
            btn.innerText = "ERROR - TRY AGAIN";
            btn.disabled = false;
        }
    }
}

