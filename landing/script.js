/**
 * SalonHub Landing Page - Main JavaScript
 * Handles animations, scroll effects, and form interactions
 */

// ===================================
// Intersection Observer for Fade-in Animations
// ===================================
const observerOptions = {
  threshold: 0.15,
  rootMargin: "0px 0px -50px 0px",
};

const fadeInObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
    }
  });
}, observerOptions);

// Apply observer to all animated elements
document.addEventListener("DOMContentLoaded", () => {
  const animatedElements = document.querySelectorAll(
    ".feature-card, .how-it-works-card, .image-showcase, .pricing"
  );
  animatedElements.forEach((element) => fadeInObserver.observe(element));
});

// ===================================
// Header Scroll Effect
// ===================================
let lastScrollY = window.scrollY;

window.addEventListener("scroll", () => {
  const header = document.querySelector("header");
  const currentScrollY = window.scrollY;

  if (currentScrollY > 50) {
    header.classList.add("scrolled");
  } else {
    header.classList.remove("scrolled");
  }

  lastScrollY = currentScrollY;
});

// ===================================
// Smooth Scroll for Navigation Links
// ===================================
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const targetId = this.getAttribute("href");

    if (targetId === "#") return;

    const targetElement = document.querySelector(targetId);
    if (targetElement) {
      const headerOffset = 80;
      const elementPosition = targetElement.getBoundingClientRect().top;
      const offsetPosition =
        elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  });
});

// ===================================
// EmailJS Configuration
// ===================================
const EMAILJS_CONFIG = {
  serviceID: "service_hvu0uee", // Remplacer par votre Service ID
  templateID: "template_fudehow", // Remplacer par votre Template ID
  publicKey: "bWDKhC9so5aLgrYO5", // Doit correspondre à la clé dans index.html
};

// Variable globale pour stocker le plan sélectionné
let selectedPlan = null;

// ===================================
// Form Validation and Submission with EmailJS
// ===================================
const handleFormSubmit = (form) => {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const emailInput = form.querySelector('input[type="email"]');
    const email = emailInput.value.trim();
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      showNotification("Veuillez entrer une adresse email valide.", "error");
      return;
    }

    // Disable button and show loading state
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi...';

    try {
      // Déterminer le type de formulaire
      const isNewsletterForm = form.classList.contains("newsletter-form");
      const formType = isNewsletterForm ? "Newsletter" : "Lead CTA";

      // Paramètres à envoyer via EmailJS
      const templateParams = {
        email: email,
        form_type: formType,
        plan: selectedPlan || "Non spécifié", // Inclure le plan sélectionné
        date: new Date().toLocaleString("fr-FR"),
      };

      // Envoi via EmailJS
      const response = await emailjs.send(
        EMAILJS_CONFIG.serviceID,
        EMAILJS_CONFIG.templateID,
        templateParams
      );

      console.log("Email envoyé avec succès:", response);

      // Success notification
      if (isNewsletterForm) {
        showNotification(
          "Merci! Vous êtes maintenant inscrit à notre newsletter.",
          "success"
        );
      } else {
        showNotification(
          "Merci! Nous vous contacterons très bientôt.",
          "success"
        );
      }

      // Reset form and selected plan
      emailInput.value = "";
      selectedPlan = null; // Réinitialiser le plan après l'envoi
    } catch (error) {
      console.error("Erreur lors de l'envoi:", error);
      showNotification("Une erreur est survenue. Veuillez réessayer.", "error");
    } finally {
      // Restore button state
      submitButton.disabled = false;
      submitButton.innerHTML = originalButtonText;
    }
  });
};

// Apply to all forms
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".cta-form, .newsletter-form").forEach((form) => {
    handleFormSubmit(form);
  });
});

// ===================================
// Notification System
// ===================================
const showNotification = (message, type = "info") => {
  // Remove existing notification if any
  const existingNotification = document.querySelector(".notification");
  if (existingNotification) {
    existingNotification.remove();
  }

  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.textContent = message;

  // Styles for notification
  Object.assign(notification.style, {
    position: "fixed",
    top: "20px",
    right: "20px",
    padding: "15px 25px",
    borderRadius: "8px",
    backgroundColor: type === "success" ? "#4CAF50" : "#f44336",
    color: "white",
    fontWeight: "500",
    boxShadow: "0 5px 15px rgba(0,0,0,0.2)",
    zIndex: "1000",
    animation: "slideIn 0.3s ease-out",
  });

  document.body.appendChild(notification);

  // Auto remove after 4 seconds
  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease-out";
    setTimeout(() => notification.remove(), 300);
  }, 4000);
};

// Add notification animations
const style = document.createElement("style");
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
// Pricing Card Interactions & CTA Scroll to Form
// ===================================

// Function to scroll to form and focus input
const scrollToFormAndFocus = (e) => {
  e.preventDefault();
  const heroSection = document.getElementById("hero-form");
  const emailInput = document.getElementById("hero-email-input");

  if (heroSection && emailInput) {
    // Smooth scroll to hero section
    const headerOffset = 80;
    const elementPosition = heroSection.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth",
    });

    // Focus on email input after scroll animation
    setTimeout(() => {
      emailInput.focus();
      // Add a subtle animation to the input
      emailInput.style.transition = "all 0.3s ease";
      emailInput.style.transform = "scale(1.05)";
      setTimeout(() => {
        emailInput.style.transform = "scale(1)";
      }, 300);
    }, 500);
  }
};

// Apply to pricing buttons
document.querySelectorAll(".btn-pricing").forEach((button) => {
  button.addEventListener("click", (e) => {
    const planName = button
      .closest(".pricing-card")
      .querySelector("h3").textContent;

    // Stocker le plan sélectionné dans la variable globale
    selectedPlan = planName;

    showNotification(
      `Plan ${planName} sélectionné ! Inscrivez votre email ci-dessous.`,
      "success"
    );

    // Scroll to form and focus
    scrollToFormAndFocus(e);
  });
});

// Apply to CTA button
document.querySelectorAll(".scroll-to-form").forEach((button) => {
  button.addEventListener("click", scrollToFormAndFocus);
});

// ===================================
// Image Slider
// ===================================
document.addEventListener("DOMContentLoaded", () => {
  const sliderTrack = document.querySelector(".slider-track");
  const slides = document.querySelectorAll(".slider-slide");
  const prevBtn = document.querySelector(".slider-btn-prev");
  const nextBtn = document.querySelector(".slider-btn-next");
  const dots = document.querySelectorAll(".slider-dot");

  if (!sliderTrack || slides.length === 0) return;

  let currentSlide = 0;
  const totalSlides = slides.length;

  // Fonction pour aller à une slide spécifique
  const goToSlide = (slideIndex) => {
    // S'assurer que l'index est valide
    if (slideIndex < 0) {
      currentSlide = totalSlides - 1;
    } else if (slideIndex >= totalSlides) {
      currentSlide = 0;
    } else {
      currentSlide = slideIndex;
    }

    // Déplacer le slider
    const offset = -currentSlide * 100;
    sliderTrack.style.transform = `translateX(${offset}%)`;

    // Mettre à jour les classes active
    slides.forEach((slide, index) => {
      slide.classList.toggle("active", index === currentSlide);
    });

    dots.forEach((dot, index) => {
      dot.classList.toggle("active", index === currentSlide);
    });
  };

  // Bouton précédent
  prevBtn.addEventListener("click", () => {
    goToSlide(currentSlide - 1);
  });

  // Bouton suivant
  nextBtn.addEventListener("click", () => {
    goToSlide(currentSlide + 1);
  });

  // Dots navigation
  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      goToSlide(index);
    });
  });

  // Auto-play (optionnel)
  let autoplayInterval = setInterval(() => {
    goToSlide(currentSlide + 1);
  }, 5000); // Change toutes les 5 secondes

  // Pause auto-play au survol
  const sliderContainer = document.querySelector(".slider-container");
  sliderContainer.addEventListener("mouseenter", () => {
    clearInterval(autoplayInterval);
  });

  sliderContainer.addEventListener("mouseleave", () => {
    autoplayInterval = setInterval(() => {
      goToSlide(currentSlide + 1);
    }, 5000);
  });

  // Support clavier
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      goToSlide(currentSlide - 1);
    } else if (e.key === "ArrowRight") {
      goToSlide(currentSlide + 1);
    }
  });

  // Support touch/swipe (mobile)
  let touchStartX = 0;
  let touchEndX = 0;

  sliderContainer.addEventListener("touchstart", (e) => {
    touchStartX = e.changedTouches[0].screenX;
  });

  sliderContainer.addEventListener("touchend", (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  });

  const handleSwipe = () => {
    if (touchEndX < touchStartX - 50) {
      // Swipe left
      goToSlide(currentSlide + 1);
    }
    if (touchEndX > touchStartX + 50) {
      // Swipe right
      goToSlide(currentSlide - 1);
    }
  };
});

// ===================================
// Performance Optimization
// ===================================
// Lazy load images
if ("IntersectionObserver" in window) {
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute("data-src");
          imageObserver.unobserve(img);
        }
      }
    });
  });

  document.querySelectorAll("img[data-src]").forEach((img) => {
    imageObserver.observe(img);
  });
}

// ===================================
// Pricing Toggle
// ===================================
document.addEventListener("DOMContentLoaded", function () {
  const billingToggle = document.getElementById("billing-cycle-checkbox");
  const prices = document.querySelectorAll(".pricing-card .price");
  const billingPeriods = document.querySelectorAll(
    ".pricing-card .billing-period"
  );

  if (billingToggle) {
    billingToggle.addEventListener("change", function () {
      const isYearly = this.checked;

      prices.forEach((priceEl) => {
        const monthlyPrice = priceEl.getAttribute("data-monthly");
        const yearlyPrice = priceEl.getAttribute("data-yearly");
        priceEl.textContent = isYearly ? yearlyPrice + "€" : monthlyPrice + "€";
      });

      billingPeriods.forEach((periodEl) => {
        periodEl.textContent = isYearly ? "/ an" : "/ mois";
      });
    });
  }
});

// ===================================
// Responsive Navigation (Hamburger Menu)
// ===================================
document.addEventListener("DOMContentLoaded", function () {
  const hamburger = document.querySelector(".hamburger");
  const header = document.querySelector("header");

  if (hamburger) {
    hamburger.addEventListener("click", function () {
      header.classList.toggle("nav-open");
    });
  }
});
