
const menuToggle = document.querySelector('.menu-toggle');
const navMenu = document.querySelector('.nav-menu');
const darkModeToggle = document.querySelector('.dark-mode-toggle');
const toggleBall = document.querySelector('.toggle-ball');
const body = document.body;
const navbar = document.querySelector('.navbar');
const overlay = document.querySelector('.overlay');

// Menu Toggle
menuToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    overlay.classList.toggle('active');
    menuToggle.textContent = navMenu.classList.contains('active') ? '✕' : '☰';
});

// Close menu by clicking anywhere
overlay.addEventListener('click', () => {
    navMenu.classList.remove('active');
    overlay.classList.remove('active');
    menuToggle.textContent = '☰';
});





// Ensure DOM is fully loaded before adding event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Select elements
    const body = document.querySelector('body');
    const navbar = document.querySelector('.navbar'); // Fixed: Assuming class="navbar"
    const darkModeToggle = document.getElementById('darkModeToggle');
    const toggleBall = document.querySelector('.toggle-ball');

    // Check if essential elements exist
    if (!body || !darkModeToggle || !toggleBall) {
        console.error('Required elements not found:', {
            body: body,
            darkModeToggle: darkModeToggle,
            toggleBall: toggleBall,
        });
        return;
    }

    // Warn if navbar is missing (optional element)
    if (!navbar) {
        console.warn('Navbar element not found. Dark mode will still apply to body.');
    }

    // Function to apply theme
    function applyTheme(theme) {
        if (theme === 'dark') {
            body.classList.add('dark');
            if (navbar) navbar.classList.add('dark');
            toggleBall.style.transform = 'translateX(30px) rotate(360deg)';
        } else {
            body.classList.remove('dark');
            if (navbar) navbar.classList.remove('dark');
            toggleBall.style.transform = 'translateX(0) rotate(0deg)';
        }
    }

    // Check for saved theme in localStorage and apply it on page load
    const savedTheme = localStorage.getItem('theme') || 'light'; // Default to light if not set
    applyTheme(savedTheme);

    // Dark Mode Toggle Event Listener
    darkModeToggle.addEventListener('click', () => {
        // Toggle the theme
        body.classList.toggle('dark');
        if (navbar) navbar.classList.toggle('dark');

        // Update the toggle ball and save the new theme state
        if (body.classList.contains('dark')) {
            toggleBall.style.transform = 'translateX(30px) rotate(360deg)';
            localStorage.setItem('theme', 'dark'); // Save dark mode state
        } else {
            toggleBall.style.transform = 'translateX(0) rotate(0deg)';
            localStorage.setItem('theme', 'light'); // Save light mode state
        }
    });
});

// Close mobile menu on link click
const navLinks = document.querySelectorAll('.nav-link');
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            navMenu.classList.remove('active');
            overlay.classList.remove('active');
            menuToggle.textContent = '☰';
        }
    });
});

// Handle resize
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        navMenu.classList.remove('active');
        overlay.classList.remove('active');
        menuToggle.textContent = '☰';
    }
});





// Hero section js 
// Text Animation
const headingText = "Bhai Apna result dekh le";
const subheadingText = "Kya Pta Pass Ho Gya ho";
const heading = document.getElementById('heading');
const subheading = document.getElementById('subheading');

function splitText(element, text, delayBase) {
    if (!element) return;
    const words = text.split(' ');
    element.innerHTML = words.map((word, wordIndex) => {
        const chars = word.split('').map((char, charIndex) => 
            `<span class="char" style="animation-delay: ${delayBase + wordIndex * 0.3 + charIndex * 0.05}s">${char}</span>`
        ).join('');
        return `<span class="word">${chars}</span>`;
    }).join(' ');
}

if (heading && subheading) {
    splitText(heading, headingText, 2.5);
    splitText(subheading, subheadingText, 3);
}

// Emoji Rain Effect
const emojiRain = document.getElementById('emoji-rain');
const emojis = ['✔️', '📈', '🏅'];
const maxEmojis = 20; // Hard limit on number of emojis
let activeEmojis = 0;

function createEmoji() {
    if (!emojiRain || activeEmojis >= maxEmojis) return;
    
    const emoji = document.createElement('span');
    emoji.classList.add('emoji');
    emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    emoji.style.left = `${Math.random() * 100}vw`;
    emoji.style.animationDuration = '4s'; // Constant speed
    
    emojiRain.appendChild(emoji);
    activeEmojis++;
    
    emoji.addEventListener('animationend', () => {
        emoji.remove();
        activeEmojis--;
    });
}

if (emojiRain) {
    // Spawn at fixed rate, but won't exceed maxEmojis
    setInterval(createEmoji, 200); // 1 emoji every 200ms, up to 20 total
}

// CTA Button Interactivity
const ctaButton = document.querySelector('.cta-button');
if (ctaButton) {
    ctaButton.addEventListener('mouseover', () => {
        ctaButton.style.background = '#e65a50';
    });
    ctaButton.addEventListener('mouseout', () => {
        ctaButton.style.background = '#ff6f61';
    });
}