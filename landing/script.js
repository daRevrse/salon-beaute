/**
 * SalonHub Landing Page - Main JavaScript
 * Handles animations, scroll effects, and form interactions
 */

// ===================================
// Intersection Observer for Fade-in Animations
// ===================================
const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
};

const fadeInObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

// Apply observer to all animated elements
document.addEventListener('DOMContentLoaded', () => {
    const animatedElements = document.querySelectorAll('.feature-card, .image-showcase, .pricing');
    animatedElements.forEach(element => fadeInObserver.observe(element));
});

// ===================================
// Header Scroll Effect
// ===================================
let lastScrollY = window.scrollY;

window.addEventListener('scroll', () => {
    const header = document.querySelector('header');
    const currentScrollY = window.scrollY;

    if (currentScrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }

    lastScrollY = currentScrollY;
});

// ===================================
// Smooth Scroll for Navigation Links
// ===================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');

        if (targetId === '#') return;

        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            const headerOffset = 80;
            const elementPosition = targetElement.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// ===================================
// Form Validation and Submission
// ===================================
const handleFormSubmit = (form) => {
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const emailInput = form.querySelector('input[type="email"]');
        const email = emailInput.value.trim();

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            showNotification('Veuillez entrer une adresse email valide.', 'error');
            return;
        }

        // Simulate form submission
        showNotification('Merci! Nous vous contacterons bientôt.', 'success');
        emailInput.value = '';
    });
};

// Apply to all forms
document.querySelectorAll('.cta-form, .newsletter-form').forEach(form => {
    handleFormSubmit(form);
});

// ===================================
// Notification System
// ===================================
const showNotification = (message, type = 'info') => {
    // Remove existing notification if any
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Styles for notification
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '15px 25px',
        borderRadius: '8px',
        backgroundColor: type === 'success' ? '#4CAF50' : '#f44336',
        color: 'white',
        fontWeight: '500',
        boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
        zIndex: '1000',
        animation: 'slideIn 0.3s ease-out'
    });

    document.body.appendChild(notification);

    // Auto remove after 4 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
};

// Add notification animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ===================================
// Pricing Card Interactions
// ===================================
document.querySelectorAll('.btn-pricing').forEach(button => {
    button.addEventListener('click', (e) => {
        e.preventDefault();
        const planName = button.closest('.pricing-card').querySelector('h3').textContent;
        showNotification(`Vous avez sélectionné le plan ${planName}. Redirection...`, 'success');

        // Simulate redirect after 2 seconds
        setTimeout(() => {
            // window.location.href = '/signup?plan=' + planName.toLowerCase();
            console.log('Redirect to signup page with plan:', planName);
        }, 2000);
    });
});

// ===================================
// Performance Optimization
// ===================================
// Lazy load images
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    imageObserver.unobserve(img);
                }
            }
        });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// ===================================
// Console Welcome Message
// ===================================
console.log(
    '%c👋 Bienvenue sur SalonHub by FlowKraft!',
    'font-size: 20px; font-weight: bold; color: #764BA2;'
);
console.log(
    '%cVous êtes développeur? Rejoignez-nous: contact@flowkraftagency.com',
    'font-size: 12px; color: #555;'
);
