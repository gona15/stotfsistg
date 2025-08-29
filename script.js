// Enhanced JavaScript for ArmanLeads.com
// Modern, accessible, high-performance implementation

(function() {
    'use strict';

    // Performance optimizations
    const supportsPassive = (() => {
        let supportsPassive = false;
        try {
            const opts = Object.defineProperty({}, 'passive', {
                get() { supportsPassive = true; }
            });
            window.addEventListener('testPassive', null, opts);
            window.removeEventListener('testPassive', null, opts);
        } catch (e) {}
        return supportsPassive;
    })();

    const passiveIfSupported = supportsPassive ? { passive: true } : false;
    const passiveWithPreventDefault = supportsPassive ? { passive: false } : false;

    // Enhanced utility functions
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    function throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Intersection Observer utility
    function createIntersectionObserver(callback, options = {}) {
        const defaultOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };
        
        if (!('IntersectionObserver' in window)) {
            // Fallback for older browsers
            return {
                observe: () => {},
                unobserve: () => {},
                disconnect: () => {}
            };
        }

        return new IntersectionObserver(callback, { ...defaultOptions, ...options });
    }

    // Enhanced error handling
    function handleError(error, context) {
        console.error(`ArmanLeads Error [${context}]:`, error);
        
        // Optional: Send to analytics in production
        if (window.gtag && typeof window.gtag === 'function') {
            window.gtag('event', 'exception', {
                description: `${context}: ${error.message}`,
                fatal: false
            });
        }
    }

    // 1. Enhanced Preloader with better UX
    function initPreloader() {
        const preloader = document.getElementById('preloader');
        if (!preloader) return;

        let isLoaded = false;

        function hidePreloader() {
            if (isLoaded) return;
            isLoaded = true;
            
            preloader.classList.add('fade-out');
            setTimeout(() => {
                if (preloader.parentNode) {
                    preloader.parentNode.removeChild(preloader);
                }
                // Trigger any animations that should start after page load
                document.body.classList.add('loaded');
            }, 350);
        }

        // Hide on load or after max timeout
        window.addEventListener('load', hidePreloader);
        
        // Safety timeout - don't show preloader forever
        setTimeout(() => {
            if (!isLoaded) {
                console.warn('Preloader timeout - hiding after 5 seconds');
                hidePreloader();
            }
        }, 5000);
    }

    // 2. Enhanced sticky navbar with scroll direction detection
    function initStickyNavbar() {
        const navbar = document.getElementById('navbar');
        if (!navbar) return;

        let lastScrollY = window.scrollY;
        let isScrollingDown = false;

        const handleScroll = throttle(() => {
            const currentScrollY = window.scrollY;
            const scrollingDown = currentScrollY > lastScrollY;
            
            // Add scrolled class
            navbar.classList.toggle('scrolled', currentScrollY > 50);
            
            // Optional: Hide navbar when scrolling down (uncomment if desired)
            /*
            if (scrollingDown !== isScrollingDown && currentScrollY > 100) {
                isScrollingDown = scrollingDown;
                navbar.style.transform = scrollingDown ? 'translateY(-100%)' : 'translateY(0)';
            }
            */
            
            lastScrollY = currentScrollY;
        }, 16);

        window.addEventListener('scroll', handleScroll, passiveIfSupported);
        
        return () => window.removeEventListener('scroll', handleScroll);
    }

    // 3. Enhanced mobile navigation with better accessibility
    function initMobileNav() {
        const navToggle = document.getElementById('nav-toggle');
        const navMenu = document.getElementById('nav-menu');
        if (!navToggle || !navMenu) return;

        let isOpen = false;
        let focusableElements = [];
        let originalFocus = null;

        function updateFocusableElements() {
            focusableElements = Array.from(navMenu.querySelectorAll(
                'a[href], button, [tabindex]:not([tabindex="-1"])'
            ));
        }

        function trapFocus(e) {
            if (!isOpen || focusableElements.length === 0) return;

            const firstFocusable = focusableElements[0];
            const lastFocusable = focusableElements[focusableElements.length - 1];

            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstFocusable) {
                        e.preventDefault();
                        lastFocusable.focus();
                    }
                } else {
                    if (document.activeElement === lastFocusable) {
                        e.preventDefault();
                        firstFocusable.focus();
                    }
                }
            }
        }

        function openMenu() {
            isOpen = true;
            originalFocus = document.activeElement;
            navToggle.setAttribute('aria-expanded', 'true');
            navMenu.classList.add('active');
            document.body.classList.add('modal-open');
            
            updateFocusableElements();
            
            // Focus first menu item after animation
            setTimeout(() => {
                if (focusableElements[0]) {
                    focusableElements[0].focus();
                }
            }, 100);
            
            document.addEventListener('keydown', trapFocus);
        }

        function closeMenu() {
            isOpen = false;
            navToggle.setAttribute('aria-expanded', 'false');
            navMenu.classList.remove('active');
            document.body.classList.remove('modal-open');
            
            document.removeEventListener('keydown', trapFocus);
            
            // Restore focus
            if (originalFocus) {
                originalFocus.focus();
            } else {
                navToggle.focus();
            }
        }

        // Toggle functionality
        navToggle.addEventListener('click', (e) => {
            e.preventDefault();
            isOpen ? closeMenu() : openMenu();
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (isOpen && !navMenu.contains(e.target) && !navToggle.contains(e.target)) {
                closeMenu();
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isOpen) {
                closeMenu();
            }
        });

        // Close on nav link click (mobile only)
        const navLinks = navMenu.querySelectorAll('a[href^="#"]');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 767) {
                    setTimeout(closeMenu, 100); // Small delay for better UX
                }
            });
        });

        // Close menu on resize if mobile menu is open
        const handleResize = debounce(() => {
            if (isOpen && window.innerWidth > 767) {
                closeMenu();
            }
        }, 250);

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            document.removeEventListener('keydown', trapFocus);
        };
    }

    // 4. Enhanced smooth navigation with better performance
    function initSmoothNavigation() {
        const navLinks = document.querySelectorAll('a[href^="#"]');
        const navbar = document.getElementById('navbar');
        const navbarHeight = navbar ? navbar.offsetHeight : 80;

        // Handle navigation clicks
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href === '#' || href === '#top') return;

                const target = document.querySelector(href);
                if (!target) return;

                e.preventDefault();
                
                const targetPosition = target.offsetTop - navbarHeight - 20;
                const startPosition = window.pageYOffset;
                const distance = Math.max(0, targetPosition) - startPosition;
                
                // Use native smooth scrolling if supported, otherwise use custom
                if ('scrollBehavior' in document.documentElement.style) {
                    window.scrollTo({
                        top: Math.max(0, targetPosition),
                        behavior: 'smooth'
                    });
                } else {
                    // Custom smooth scroll for older browsers
                    const duration = Math.min(Math.abs(distance) / 2, 800);
                    let start = null;
                    
                    function animate(currentTime) {
                        if (start === null) start = currentTime;
                        const timeElapsed = currentTime - start;
                        const progress = Math.min(timeElapsed / duration, 1);
                        
                        // Easing function
                        const ease = progress < 0.5 
                            ? 2 * progress * progress 
                            : -1 + (4 - 2 * progress) * progress;
                            
                        window.scrollTo(0, startPosition + distance * ease);
                        
                        if (timeElapsed < duration) {
                            requestAnimationFrame(animate);
                        }
                    }
                    
                    requestAnimationFrame(animate);
                }
            });
        });

        // Enhanced active section highlighting
        const sections = document.querySelectorAll('section[id]');
        if (sections.length === 0) return;

        const observerOptions = {
            root: null,
            rootMargin: `-${navbarHeight + 50}px 0px -50% 0px`,
            threshold: [0, 0.25, 0.5, 0.75, 1]
        };

        const observer = createIntersectionObserver((entries) => {
            // Find the section with highest intersection ratio
            let maxRatio = 0;
            let activeSection = null;
            
            entries.forEach(entry => {
                if (entry.intersectionRatio > maxRatio) {
                    maxRatio = entry.intersectionRatio;
                    activeSection = entry.target;
                }
            });
            
            if (activeSection) {
                const id = activeSection.getAttribute('id');
                
                // Remove active from all nav links
                document.querySelectorAll('.nav-link').forEach(link => {
                    link.classList.remove('active');
                });
                
                // Add active to current
                const activeNavLink = document.querySelector(`.nav-link[href="#${id}"]`);
                if (activeNavLink) {
                    activeNavLink.classList.add('active');
                }
            }
        }, observerOptions);

        sections.forEach(section => {
            observer.observe(section);
        });

        return () => observer.disconnect();
    }

    // 5. Enhanced business type selector with better state management
    function initBusinessTypeSelector() {
        const businessTypeCards = document.querySelectorAll('.business-type-card');
        const businessTypeInput = document.getElementById('business-type');
        
        if (!businessTypeInput || businessTypeCards.length === 0) return;

        function selectBusinessType(selectedCard) {
            // Remove active from all cards
            businessTypeCards.forEach(card => {
                card.classList.remove('active');
                card.setAttribute('aria-pressed', 'false');
            });
            
            // Add active to selected card
            selectedCard.classList.add('active');
            selectedCard.setAttribute('aria-pressed', 'true');
            
            // Update hidden input value
            const businessType = selectedCard.getAttribute('data-type');
            businessTypeInput.value = businessType || 'dental';
            
            // Optional: Trigger custom event for analytics
            window.dispatchEvent(new CustomEvent('businessTypeSelected', {
                detail: { type: businessType }
            }));
        }

        // Initialize first card as selected
        if (businessTypeCards[0]) {
            selectBusinessType(businessTypeCards[0]);
        }

        businessTypeCards.forEach((card, index) => {
            // Add ARIA attributes
            card.setAttribute('role', 'button');
            card.setAttribute('tabindex', '0');
            card.setAttribute('aria-pressed', 'false');
            
            // Handle clicks
            card.addEventListener('click', () => selectBusinessType(card));
            
            // Handle keyboard navigation
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    selectBusinessType(card);
                }
                
                // Arrow key navigation
                if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                    e.preventDefault();
                    const nextIndex = e.key === 'ArrowRight' 
                        ? (index + 1) % businessTypeCards.length
                        : (index - 1 + businessTypeCards.length) % businessTypeCards.length;
                    businessTypeCards[nextIndex].focus();
                }
            });
        });
    }

    // 6. Enhanced contact form with better validation and UX
    function initContactForm() {
        const form = document.getElementById('contact-form');
        if (!form) return;

        const submitButton = form.querySelector('.btn-submit');
        const successMessage = document.getElementById('form-success');
        const inputs = form.querySelectorAll('input, textarea');
        
        // Real-time validation
        const validationRules = {
            name: {
                required: true,
                minLength: 2,
                pattern: /^[a-zA-Z\s-'\.]+$/,
                message: 'Please enter a valid name'
            },
            email: {
                required: true,
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Please enter a valid email address'
            },
            website: {
                pattern: /^https?:\/\/.+/,
                message: 'Please enter a valid URL (including http:// or https://)'
            }
        };

        function validateField(field) {
            const rules = validationRules[field.name];
            if (!rules) return true;

            const value = field.value.trim();
            let isValid = true;
            let message = '';

            // Required check
            if (rules.required && !value) {
                isValid = false;
                message = `${field.name.charAt(0).toUpperCase() + field.name.slice(1)} is required`;
            }
            // Pattern check
            else if (value && rules.pattern && !rules.pattern.test(value)) {
                isValid = false;
                message = rules.message;
            }
            // Min length check
            else if (value && rules.minLength && value.length < rules.minLength) {
                isValid = false;
                message = `Must be at least ${rules.minLength} characters`;
            }

            // Update field appearance
            field.classList.toggle('error', !isValid);
            field.style.borderColor = isValid ? '' : 'var(--color-error)';
            
            // Show/hide error message
            let errorElement = field.parentNode.querySelector('.error-message');
            if (!isValid && message) {
                if (!errorElement) {
                    errorElement = document.createElement('div');
                    errorElement.className = 'error-message';
                    errorElement.style.cssText = `
                        color: var(--color-error);
                        font-size: var(--text-sm);
                        margin-top: var(--space-1);
                    `;
                    field.parentNode.appendChild(errorElement);
                }
                errorElement.textContent = message;
            } else if (errorElement) {
                errorElement.remove();
            }

            return isValid;
        }

        // Add real-time validation to inputs
        inputs.forEach(input => {
            // Validate on blur
            input.addEventListener('blur', () => validateField(input));
            
            // Clear validation on input
            input.addEventListener('input', () => {
                input.classList.remove('error');
                input.style.borderColor = '';
                const errorElement = input.parentNode.querySelector('.error-message');
                if (errorElement) {
                    errorElement.remove();
                }
            });
        });

        // Form submission with enhanced error handling
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Validate all fields
            let isFormValid = true;
            inputs.forEach(input => {
                if (!validateField(input)) {
                    isFormValid = false;
                }
            });

            if (!isFormValid) {
                // Focus first invalid field
                const firstError = form.querySelector('.error');
                if (firstError) {
                    firstError.focus();
                    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                return;
            }

            // Check honeypot
            const honeypot = form.querySelector('input[name="website_url"]');
            if (honeypot && honeypot.value) {
                return; // Silent fail for bots
            }

            // Update button state
            const originalButtonText = submitButton.innerHTML;
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
                submitButton.classList.add('loading');
            }

            try {
                const formData = new FormData(form);
                
                // Add additional data
                formData.append('timestamp', new Date().toISOString());
                formData.append('user_agent', navigator.userAgent);
                
                const response = await fetch(form.action, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    // Success handling
                    if (successMessage) {
                        successMessage.classList.add('show');
                        successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                    
                    form.reset();
                    
                    // Reset business type to default
                    const businessTypeInput = document.getElementById('business-type');
                    if (businessTypeInput) {
                        businessTypeInput.value = 'dental';
                    }
                    
                    // Reset active business type card
                    const businessTypeCards = document.querySelectorAll('.business-type-card');
                    businessTypeCards.forEach((card, index) => {
                        card.classList.remove('active');
                        card.setAttribute('aria-pressed', 'false');
                        if (index === 0) { // First card (dental)
                            card.classList.add('active');
                            card.setAttribute('aria-pressed', 'true');
                        }
                    });
                    
                    // Analytics event
                    if (window.gtag) {
                        window.gtag('event', 'form_submit', {
                            event_category: 'engagement',
                            event_label: 'contact_form'
                        });
                    }
                    
                    // Hide success message after 10 seconds
                    setTimeout(() => {
                        if (successMessage) {
                            successMessage.classList.remove('show');
                        }
                    }, 10000);
                    
                } else {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                handleError(error, 'Form Submission');
                
                // Show user-friendly error message
                alert('There was an error sending your message. Please try again or contact us directly at hello@armanleads.com');
                
                // Analytics event
                if (window.gtag) {
                    window.gtag('event', 'exception', {
                        description: 'Form submission failed',
                        fatal: false
                    });
                }
            } finally {
                // Reset button state
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.innerHTML = originalButtonText;
                    submitButton.classList.remove('loading');
                }
            }
        });
    }

    // 7. Enhanced Calendly modal with better loading and error handling
    function initCalendlyModal() {
        const trigger = document.getElementById('calendly-trigger');
        const modal = document.getElementById('calendly-modal');
        const iframe = document.getElementById('calendly-iframe');
        const closeButtons = modal?.querySelectorAll('[data-close-modal]');
        const loadingElement = modal?.querySelector('.calendly-loading');
        
        if (!trigger || !modal) return;

        let isModalOpen = false;
        let focusableElements = [];
        let originalFocus = null;
        let iframeSrcSet = false;
        let iframeLoaded = false;

        function updateFocusableElements() {
            focusableElements = Array.from(modal.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            ));
        }

        function trapFocus(e) {
            if (!isModalOpen || focusableElements.length === 0) return;

            if (e.key === 'Tab') {
                const firstFocusable = focusableElements[0];
                const lastFocusable = focusableElements[focusableElements.length - 1];

                if (e.shiftKey) {
                    if (document.activeElement === firstFocusable) {
                        e.preventDefault();
                        lastFocusable.focus();
                    }
                } else {
                    if (document.activeElement === lastFocusable) {
                        e.preventDefault();
                        firstFocusable.focus();
                    }
                }
            }
        }

        function openModal() {
            isModalOpen = true;
            originalFocus = document.activeElement;
            modal.classList.add('active');
            document.body.classList.add('modal-open');
            modal.setAttribute('aria-hidden', 'false');

            // Focus management
            updateFocusableElements();
            if (focusableElements[0]) {
                focusableElements[0].focus();
            }

            // Load iframe if not already loaded
            if (!iframeSrcSet && iframe) {
                iframe.src = 'https://calendly.com/vrmvn0/meeting';
                iframeSrcSet = true;

                // Handle iframe load
                iframe.addEventListener('load', () => {
                    iframeLoaded = true;
                    if (loadingElement) {
                        loadingElement.style.display = 'none';
                    }
                });

                // Handle iframe error
                iframe.addEventListener('error', () => {
                    if (loadingElement) {
                        loadingElement.innerHTML = `
                            <div style="text-align: center; padding: 2rem;">
                                <p>Unable to load calendar. Please try refreshing the page or contact us directly.</p>
                                <a href="mailto:hello@armanleads.com" style="color: var(--color-accent-dark);">hello@armanleads.com</a>
                            </div>
                        `;
                    }
                });

                // Timeout for loading
                setTimeout(() => {
                    if (!iframeLoaded && loadingElement) {
                        loadingElement.innerHTML = `
                            <div style="text-align: center;">
                                <p>Taking longer than expected...</p>
                                <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: var(--color-accent); border: none; border-radius: 4px; cursor: pointer;">
                                    Refresh Page
                                </button>
                            </div>
                        `;
                    }
                }, 10000);
            }

            document.addEventListener('keydown', trapFocus);
        }

        function closeModal() {
            isModalOpen = false;
            modal.classList.remove('active');
            document.body.classList.remove('modal-open');
            modal.setAttribute('aria-hidden', 'true');
            
            document.removeEventListener('keydown', trapFocus);
            
            // Restore focus
            if (originalFocus) {
                originalFocus.focus();
            } else {
                trigger.focus();
            }
        }

        // Event listeners
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            openModal();
        });

        if (closeButtons) {
            closeButtons.forEach(button => {
                button.addEventListener('click', closeModal);
            });
        }

        // Close on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isModalOpen) {
                closeModal();
            }
        });

        // Initialize modal state
        modal.setAttribute('aria-hidden', 'true');

        return () => {
            document.removeEventListener('keydown', trapFocus);
        };
    }

    // 8. Enhanced scroll animations with performance optimizations
    function initScrollAnimations() {
        const animatedElements = document.querySelectorAll('[class*="animate-"], .card, .service-card, .approach-card');
        if (animatedElements.length === 0) return;

        const observerOptions = {
            root: null,
            rootMargin: '0px 0px -50px 0px',
            threshold: 0.1
        };

        const observer = createIntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    // Unobserve to prevent re-triggering
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        animatedElements.forEach(element => {
            observer.observe(element);
        });

        return () => observer.disconnect();
    }

    // 9. Performance monitoring and optimization
    function initPerformanceMonitoring() {
        // Monitor Core Web Vitals
        if ('web-vital' in window) {
            import('https://unpkg.com/web-vitals@3/dist/web-vitals.js').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
                getCLS(console.log);
                getFID(console.log);
                getFCP(console.log);
                getLCP(console.log);
                getTTFB(console.log);
            });
        }

        // Monitor long tasks
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    list.getEntries().forEach((entry) => {
                        if (entry.duration > 50) {
                            console.warn('Long task detected:', entry.duration);
                        }
                    });
                });
                observer.observe({ entryTypes: ['longtask'] });
            } catch (e) {
                // Ignore if longtask is not supported
            }
        }
    }

    // 10. Enhanced error handling and recovery
    function initErrorHandling() {
        window.addEventListener('error', (e) => {
            handleError(e.error, 'Global Error');
        });

        window.addEventListener('unhandledrejection', (e) => {
            handleError(e.reason, 'Unhandled Promise Rejection');
        });
    }

    // Initialize everything when DOM is ready
    function init() {
        try {
            // Initialize core functionality
            initPreloader();
            initErrorHandling();
            initStickyNavbar();
            initMobileNav();
            initSmoothNavigation();
            initBusinessTypeSelector();
            initContactForm();
            initCalendlyModal();
            
            // Initialize enhancements
            initScrollAnimations();
            initPerformanceMonitoring();

            // Mark as initialized
            document.body.setAttribute('data-js-initialized', 'true');
            
            console.log('ArmanLeads: All scripts initialized successfully');
        } catch (error) {
            handleError(error, 'Initialization');
        }
    }

    // Run initialization with proper timing
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // DOM is already ready
        if (document.readyState === 'complete') {
            init();
        } else {
            window.addEventListener('load', init);
        }
    }

    // Expose cleanup function for testing/debugging
    window.ArmanLeads = {
        version: '2.0.0',
        init: init,
        utils: {
            debounce,
            throttle,
            handleError
        }
    };

})();
