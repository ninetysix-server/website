document.addEventListener('DOMContentLoaded', () => {
    initializeAllComponents();
});

function initializeAllComponents() {
    // ... other initializations
    initializeSketchCheckbox();
    // Core UI Components
    initializeCounters();
    initializeGlideCarousel();
    initializePortfolioAnimations();
    
    // Service Components
    initializeWebsiteDesignNavigation();
    initializeServiceGridInteractions();
    initializeServiceButtons();
    
    // Third-party Integrations
    initializeJuxtaposeSliders();

    // Initialize Logo Navigation
    initializeLogoNavigation(); // Add this line
}

function initializeLogoNavigation() {
    // Get references to the sections and buttons
    const logoDesignSection = document.getElementById('logo-design');
    const logoRedesignSection = document.getElementById('logo-redesign');
    const nextButton = logoDesignSection.querySelector('.next-button');
    const backButton = logoRedesignSection.querySelector('.back-button');

    // Show Logo Redesign on Next Button Click
    nextButton.addEventListener('click', () => {
        logoDesignSection.style.display = 'none'; // Hide Logo Design
        logoRedesignSection.style.display = 'block'; // Show Logo Redesign
    });

    // Show Logo Design on Back Button Click
    backButton.addEventListener('click', () => {
        logoRedesignSection.style.display = 'none'; // Hide Logo Redesign
        logoDesignSection.style.display = 'block'; // Show Logo Design
    });
}

function initializeCounters() {
    const counters = document.querySelectorAll('.count');
    const counterSection = document.querySelector('.counter');
    
    if (!counterSection) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateNumberCounters(counters);
                observer.unobserve(counterSection);
            }
        });
    }, { threshold: 0.5 });

    observer.observe(counterSection);
}

function animateNumberCounters(counters) {
    counters.forEach(counter => {
        const target = +counter.dataset.target;
        const duration = 2000; // Animation duration in milliseconds
        let current = 0;
        const increment = target / (duration / 16); // Increment value per frame

        const update = () => {
            current += increment;

            // Stop the animation when the target is reached
            if (current < target) {
                counter.textContent = Math.ceil(current);
                requestAnimationFrame(update);
            } else {
                counter.textContent = getSuffix(target); // Use the target to determine the suffix
            }
        };

        update();
    });
}

function getSuffix(target) {
    // Define the suffixes based on the data-target value
    const suffixes = {
        100: '5k',
        99: '80k',
        97: '100k',
        90: '200k',
    };

    // Return the suffix based on the target value
    return suffixes[target] || `${target}k+`; // Default to "targetk+" if no specific suffix is found
}

// Initialize the counters when the page loads
document.addEventListener('DOMContentLoaded', initializeCounters);
function initializeGlideCarousel() {
    loadGlideDependencies().then(() => {
        new Glide('.glide', {
            type: 'carousel',
            startAt: 0,
            perView: 4,
            gap: 20,
            autoplay: 3000,
            breakpoints: {
                768: { perView: 2 },
                992: { perView: 3 },
                1200: { perView: 4 }
            }
        }).mount();
    });
}

function loadGlideDependencies() {
    return new Promise((resolve) => {
        const glideCSS = document.createElement('link');
        glideCSS.rel = 'stylesheet';
        glideCSS.href = 'https://cdn.jsdelivr.net/npm/@glidejs/glide@3.4.1/dist/css/glide.core.min.css';
        document.head.appendChild(glideCSS);

        const glideJS = document.createElement('script');
        glideJS.src = 'https://cdn.jsdelivr.net/npm/@glidejs/glide@3.4.1/dist/glide.min.js';
        glideJS.onload = resolve;
        document.body.appendChild(glideJS);
    });
}

function initializeWebsiteDesignNavigation() {
    const designSection = document.querySelector('.grid-item[style*="background-color: #6610f2;"]');
    if (!designSection) return;

    const pages = designSection.querySelectorAll('.website-page');
    const [nextBtn, backBtn] = ['next-button', 'back-button'].map(s => designSection.querySelector(`.${s}`));
    const pageIndicator = designSection.querySelector('.page-indicator');

    let currentPage = 0;
    const totalPages = pages.length;

    const updateNavigation = () => {
        currentPage = (currentPage + totalPages) % totalPages; 
        pages.forEach((page, i) => page.style.display = i === currentPage ? 'block' : 'none');
        pageIndicator.textContent = `${currentPage + 1}/${totalPages}`;
    };

    nextBtn.addEventListener('click', () => { currentPage++; updateNavigation() });
    backBtn.addEventListener('click', () => { currentPage--; updateNavigation() });
    updateNavigation();
}

function initializeServiceGridInteractions() {
    document.querySelectorAll('.grid-item:not(.image-block)').forEach(item => {
        item.addEventListener('click', function() {
            // Close all other expanded items
            document.querySelectorAll('.grid-item.expanded').forEach(expandedItem => {
                if (expandedItem !== this) {
                    expandedItem.classList.remove('expanded');
                    const infoPanel = expandedItem.querySelector('.additional-info');
                    if (infoPanel) infoPanel.style.display = 'none';
                }
            });
            
            // Toggle current item
            this.classList.toggle('expanded');
            const infoPanel = this.querySelector('.additional-info');
            if (infoPanel) {
                infoPanel.style.display = this.classList.contains('expanded') ? 'block' : 'none';
            }
        });
    });
}

function initializeServiceButtons() {
    const serviceButtons = document.querySelectorAll('.service-buttons button');
    const serviceCards = document.querySelectorAll('.card-container');

    // Show first card by default
    if (serviceCards.length > 0) {
        serviceCards[0].style.display = 'block';
        serviceCards[0].style.opacity = '1';
    }

    serviceButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetService = button.dataset.service;
            serviceCards.forEach(card => {
                card.style.display = card.id === targetService ? 'block' : 'none';
                setTimeout(() => card.style.opacity = card.id === targetService ? 1 : 0, 10);
            });
        });
    });
}

function initializePortfolioAnimations() {
    const portfolioSection = document.querySelector('.portfolio');
    if (!portfolioSection) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animatePortfolioElements();
                observer.unobserve(portfolioSection);
            }
        });
    }, { threshold: 0.5 });

    observer.observe(portfolioSection);
}

function animatePortfolioElements() {
    const elements = {
        title: { selector: '.portfolio-title', delay: 0 },
        subtitle: { selector: '.portfolio-subtitle', delay: 0.5 },
        text: { selector: '.portfolio-text', delay: 1 },
        button: { selector: '.portfolio .btn-primary', delay: 1.5 }
    };

    Object.values(elements).forEach(({ selector, delay }) => {
        const el = document.querySelector(selector);
        if (el) setTimeout(() => el.style.animation = `fadeInUp ${1}s ease forwards`, delay * 1000);
    });
}

function initializeJuxtaposeSliders() {
    const sliders = document.querySelectorAll('.juxtapose');
    if (!sliders.length) return;

    loadJuxtaposeDependencies().then(() => {
        sliders.forEach(slider => new juxtapose.JXSlider(slider));
    });
}

function loadJuxtaposeDependencies() {
    return new Promise((resolve) => {
        if (window.juxtapose) return resolve();

        const css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = 'https://cdn.knightlab.com/libs/juxtapose/latest/css/juxtapose.css';
        
        const js = document.createElement('script');
        js.src = 'https://cdn.knightlab.com/libs/juxtapose/latest/js/juxtapose.min.js';
        js.onload = resolve;

        document.head.append(css, js);
    });
}

function initializeSketchCheckbox() {
    const checkbox = document.querySelector('.sketch-checkbox');
    const priceElement = document.querySelector('.service-price');
    const infoElement = document.querySelector('.service-info');

    if (checkbox && priceElement && infoElement) {
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                priceElement.textContent = 'R200';
                infoElement.textContent = 'one design concept';
            } else {
                priceElement.textContent = 'R300';
                infoElement.textContent = 'two to three concept design';
            }
        });
    }
}




// Show the page load overlay
function showPageLoadOverlay() {
    const overlay = document.getElementById('page-load-overlay');
    overlay.style.display = 'flex';
}

// Hide the page load overlay
function hidePageLoadOverlay() {
    const overlay = document.getElementById('page-load-overlay');
    overlay.style.display = 'none';
}

// Show overlay on page load
window.addEventListener('load', () => {
    showPageLoadOverlay();
    // Simulate a delay (e.g., fetching data or other resources)
    setTimeout(() => {
        hidePageLoadOverlay();
    }, 2000); // Replace with actual logic
});

document.addEventListener('DOMContentLoaded', () => {
    const lazyImages = document.querySelectorAll('.lazy-image');

    // Intersection Observer callback
    const lazyLoad = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                const src = img.getAttribute('data-src');

                // Replace placeholder with actual image
                img.src = src;

                // Remove the data-src attribute to avoid reloading
                img.removeAttribute('data-src');

                // Stop observing this image
                observer.unobserve(img);

                // Optional: Add a class to handle transitions or styling
                img.classList.add('loaded');
            }
        });
    };

    // Set up Intersection Observer
    const observer = new IntersectionObserver(lazyLoad, {
        rootMargin: '0px',
        threshold: 0.1, // Trigger when 10% of the image is visible
    });

    // Observe each lazy image
    lazyImages.forEach(img => {
        observer.observe(img);
    });
});



// Search Functionality
document.getElementById('searchButton').addEventListener('click', function () {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const loadingAnimation = document.getElementById('loadingAnimation');
    const noMatchMessage = document.getElementById('noMatchMessage');

    // Show loading animation
    loadingAnimation.style.display = 'flex';
    noMatchMessage.style.display = 'none';

    // Simulate search delay
    setTimeout(() => {
        // Hide loading animation
        loadingAnimation.style.display = 'none';

        // Define search terms for Graphic Design
        const graphicDesignTerms = [
            "graphic", "graphics", "design", "designs", "graphic design", "graphic designs",
            "logo design", "logo redesign", "flyer design", "banner design", "sticker design",
            "product design", "business card design", "calendar design", "poster design",
            "sign design", "website design", "logo", "website"
        ];

        // Define search terms for Computer Repair
        const computerRepairTerms = [
            "computer", "fix", "repair", "computer repair", "computer fix", "pc repair", "pc fix",
            "software", "software installation", "windows installation", "antivirus installation",
            "microsoft office installation", "adobe reader installation", "installation"
        ];

        // Check if the search input matches Graphic Design terms
        const isGraphicDesign = graphicDesignTerms.some(term => searchInput.includes(term));

        // Check if the search input matches Computer Repair terms
        const isComputerRepair = computerRepairTerms.some(term => searchInput.includes(term));

        // Redirect or show message based on search input
        if (isGraphicDesign) {
            window.location.href = "motioncreatives.html"; // Redirect to Graphic Design page
        } else if (isComputerRepair) {
            window.location.href = "http://onclick.96studios.co.za"; // Redirect to Computer Repair page
        } else {
            noMatchMessage.style.display = 'block'; // Show no match message
        }
    }, 1000); // Simulate 1-second delay
});




document.addEventListener('DOMContentLoaded', function() {
    const navbar = document.querySelector('.navbar.fixed-top');
    let lastScroll = window.scrollY;
    
    // Make sure header starts visible
    navbar.style.transform = 'none';
    
    // Add smooth transition
    navbar.style.transition = 'transform 0.3s ease';
    
    window.addEventListener('scroll', function() {
        const currentScroll = window.scrollY;
        
        // Scroll down - hide header
        if (currentScroll > lastScroll && currentScroll > 10) {
            navbar.style.transform = 'translateY(-200%)';
        } 
        // Scroll up - show header
        else if (currentScroll < lastScroll) {
            navbar.style.transform = 'none';
        }
        
        lastScroll = currentScroll;
    });
});



// Function to close entire profile page section
window.closeProfilePage = function() {
    // Hide the entire profile page section
    document.getElementById('profilePage').style.display = 'none';
    
    // Also reset the auth forms (optional but recommended)
    document.getElementById('authContainer').style.display = 'none';
    document.querySelector('.profile-page-overlay').style.display = 'none';
    
    // Reset all forms to initial state
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('passwordResetForm').style.display = 'none';
    
    // Clear all form fields
    const clearFields = [
        'loginEmail', 'loginPassword', 
        'registerName', 'registerEmail', 'registerPassword',
        'resetEmail'
    ];
    clearFields.forEach(id => {
        if (document.getElementById(id)) {
            document.getElementById(id).value = '';
        }
    });
    
    // Clear any error messages
    const clearErrors = ['loginError', 'registerError', 'resetError'];
    clearErrors.forEach(id => {
        if (document.getElementById(id)) {
            document.getElementById(id).textContent = '';
        }
    });
};