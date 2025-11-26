// NXChain Interactive JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Mobile Navigation Toggle
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close mobile menu when clicking on a link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function() {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // Header scroll effect
    const header = document.querySelector('.header');
    let lastScroll = 0;

    window.addEventListener('scroll', function() {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 100) {
            header.style.background = 'rgba(10, 10, 15, 0.98)';
            header.style.backdropFilter = 'blur(25px)';
        } else {
            header.style.background = 'rgba(10, 10, 15, 0.95)';
            header.style.backdropFilter = 'blur(20px)';
        }

        lastScroll = currentScroll;
    });

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Intersection Observer for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all sections
    document.querySelectorAll('section').forEach(section => {
        observer.observe(section);
    });

    // Live counter animation for minting
    const liveCounter = document.querySelector('.live-counter');
    if (liveCounter) {
        let counter = 0;
        const targetCounter = 1234567;
        const increment = targetCounter / 100;
        let isCounting = false;

        const startCounting = () => {
            if (isCounting) return;
            isCounting = true;
            
            const countInterval = setInterval(() => {
                counter += increment;
                if (counter >= targetCounter) {
                    counter = targetCounter;
                    clearInterval(countInterval);
                    isCounting = false;
                    
                    // Restart after a delay
                    setTimeout(() => {
                        counter = 0;
                        startCounting();
                    }, 2000);
                }
                liveCounter.textContent = Math.floor(counter).toLocaleString() + ' NX';
            }, 20);
        };

        // Start counting when element is in view
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !isCounting) {
                    startCounting();
                }
            });
        });

        counterObserver.observe(liveCounter);
    }

    // Particle animation enhancement
    const particles = document.querySelector('.particles');
    if (particles) {
        // Add dynamic particle generation
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'dynamic-particle';
            particle.style.cssText = `
                position: absolute;
                width: ${Math.random() * 4 + 1}px;
                height: ${Math.random() * 4 + 1}px;
                background: rgba(0, 212, 255, ${Math.random() * 0.5 + 0.2});
                border-radius: 50%;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation: float ${Math.random() * 10 + 10}s ease-in-out infinite;
                animation-delay: ${Math.random() * 5}s;
            `;
            particles.appendChild(particle);
        }
    }

    // Button hover effects
    document.querySelectorAll('.btn').forEach(button => {
        button.addEventListener('mouseenter', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const ripple = document.createElement('span');
            ripple.className = 'ripple';
            ripple.style.cssText = `
                position: absolute;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.3);
                width: 100px;
                height: 100px;
                left: ${x - 50}px;
                top: ${y - 50}px;
                animation: ripple 0.6s ease-out;
                pointer-events: none;
            `;
            
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });
    });

    // Add ripple animation to CSS
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            from {
                transform: scale(0);
                opacity: 1;
            }
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
        
        .dynamic-particle {
            pointer-events: none;
        }
        
        .hamburger.active span:nth-child(1) {
            transform: rotate(-45deg) translate(-5px, 6px);
        }
        
        .hamburger.active span:nth-child(2) {
            opacity: 0;
        }
        
        .hamburger.active span:nth-child(3) {
            transform: rotate(45deg) translate(-5px, -6px);
        }
    `;
    document.head.appendChild(style);

    // Typing effect for hero title
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
        const originalText = heroTitle.innerHTML;
        heroTitle.innerHTML = '';
        let charIndex = 0;
        
        const typeWriter = () => {
            if (charIndex < originalText.length) {
                heroTitle.innerHTML += originalText.charAt(charIndex);
                charIndex++;
                setTimeout(typeWriter, 30);
            }
        };
        
        setTimeout(typeWriter, 500);
    }

    // Progress bar animations for protection meter
    const meterFill = document.querySelector('.meter-fill');
    if (meterFill) {
        const animateMeter = () => {
            meterFill.style.width = '0%';
            setTimeout(() => {
                meterFill.style.transition = 'width 2s ease-in-out';
                meterFill.style.width = '80%';
            }, 100);
        };
        
        animateMeter();
        setInterval(animateMeter, 5000);
    }

    // Card hover effects with 3D transform
    document.querySelectorAll('.glass-card, .tokenomics-card, .ecosystem-card').forEach(card => {
        card.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;
            
            this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
        });
    });

    // Parallax scrolling effect
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const parallaxElements = document.querySelectorAll('.glowing-sphere, .particles');
        
        parallaxElements.forEach((element, index) => {
            const speed = index === 0 ? 0.5 : 0.3;
            element.style.transform = `translateY(${scrolled * speed}px)`;
        });
    });

    // Form validation (if forms are added later)
    const validateForm = (form) => {
        const inputs = form.querySelectorAll('input, textarea');
        let isValid = true;
        
        inputs.forEach(input => {
            if (input.hasAttribute('required') && !input.value.trim()) {
                isValid = false;
                input.classList.add('error');
            } else {
                input.classList.remove('error');
            }
        });
        
        return isValid;
    };

    // Copy contract address functionality
    const contractAddress = document.querySelector('.contract-address');
    if (contractAddress) {
        contractAddress.style.cursor = 'pointer';
        contractAddress.title = 'Click to copy';
        
        contractAddress.addEventListener('click', function() {
            navigator.clipboard.writeText(this.textContent).then(() => {
                const originalText = this.textContent;
                this.textContent = 'Copied!';
                this.style.color = '#00ff88';
                
                setTimeout(() => {
                    this.textContent = originalText;
                    this.style.color = '';
                }, 2000);
            });
        });
    }

    // Lazy loading for images (if images are added later)
    const lazyImages = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });

    lazyImages.forEach(img => imageObserver.observe(img));

    // Performance optimization: Debounce scroll events
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        if (scrollTimeout) {
            window.cancelAnimationFrame(scrollTimeout);
        }
        
        scrollTimeout = window.requestAnimationFrame(() => {
            // Scroll-based animations here
        });
    });

    // Initialize tooltips
    const initTooltips = () => {
        const tooltipElements = document.querySelectorAll('[data-tooltip]');
        
        tooltipElements.forEach(element => {
            element.addEventListener('mouseenter', function() {
                const tooltip = document.createElement('div');
                tooltip.className = 'tooltip';
                tooltip.textContent = this.dataset.tooltip;
                tooltip.style.cssText = `
                    position: absolute;
                    background: rgba(0, 0, 0, 0.9);
                    color: white;
                    padding: 8px 12px;
                    border-radius: 6px;
                    font-size: 14px;
                    z-index: 1000;
                    pointer-events: none;
                    white-space: nowrap;
                    animation: fadeIn 0.3s ease;
                `;
                
                document.body.appendChild(tooltip);
                
                const rect = this.getBoundingClientRect();
                tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
                tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + 'px';
                
                this.tooltip = tooltip;
            });
            
            element.addEventListener('mouseleave', function() {
                if (this.tooltip) {
                    this.tooltip.remove();
                    this.tooltip = null;
                }
            });
        });
    };

    initTooltips();

    // Mobile-specific touch interactions
    const initMobileInteractions = () => {
        // Add swipe gestures for mobile
        let touchStartX = 0;
        let touchEndX = 0;
        
        const handleSwipe = () => {
            const swipeThreshold = 50;
            const diff = touchStartX - touchEndX;
            
            if (Math.abs(diff) > swipeThreshold) {
                if (diff > 0) {
                    // Swipe left - could navigate to next section
                    console.log('Swipe left detected');
                } else {
                    // Swipe right - could navigate to previous section
                    console.log('Swipe right detected');
                }
            }
        };
        
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        
        document.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, { passive: true });
        
        // Add haptic feedback for buttons on supported devices
        document.querySelectorAll('.btn').forEach(button => {
            button.addEventListener('touchstart', function() {
                if ('vibrate' in navigator) {
                    navigator.vibrate(10);
                }
            }, { passive: true });
        });
        
        // Optimize scroll performance on mobile
        let isScrolling = false;
        window.addEventListener('scroll', () => {
            if (!isScrolling) {
                window.requestAnimationFrame(() => {
                    // Add scroll-based animations optimized for mobile
                    const scrolled = window.pageYOffset;
                    const parallaxElements = document.querySelectorAll('.glowing-sphere, .particles');
                    
                    parallaxElements.forEach((element, index) => {
                        const speed = index === 0 ? 0.3 : 0.2; // Reduced parallax for mobile
                        element.style.transform = `translateY(${scrolled * speed}px)`;
                    });
                    
                    isScrolling = false;
                });
                isScrolling = true;
            }
        }, { passive: true });
    };

    // Mobile viewport height fix for iOS Safari
    const fixMobileViewport = () => {
        const setViewportHeight = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };
        
        setViewportHeight();
        window.addEventListener('resize', setViewportHeight);
        window.addEventListener('orientationchange', setViewportHeight);
    };

    // Mobile menu enhancements
    const enhanceMobileMenu = () => {
        const navMenu = document.querySelector('.nav-menu');
        const hamburger = document.querySelector('.hamburger');
        
        // Close menu when clicking outside
        document.addEventListener('touchstart', (e) => {
            if (navMenu.classList.contains('active') && 
                !navMenu.contains(e.target) && 
                !hamburger.contains(e.target)) {
                navMenu.classList.remove('active');
                hamburger.classList.remove('active');
            }
        }, { passive: true });
        
        // Prevent body scroll when menu is open
        const toggleBodyScroll = (isOpen) => {
            document.body.style.overflow = isOpen ? 'hidden' : '';
            document.body.style.position = isOpen ? 'fixed' : '';
            document.body.style.width = isOpen ? '100%' : '';
        };
        
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    const isOpen = navMenu.classList.contains('active');
                    toggleBodyScroll(isOpen);
                }
            });
        });
        
        observer.observe(navMenu, { attributes: true });
    };

    // Initialize mobile optimizations
    if ('ontouchstart' in window) {
        initMobileInteractions();
        fixMobileViewport();
        enhanceMobileMenu();
    }

    // Performance optimization for mobile devices
    const optimizeForMobile = () => {
        // Reduce animation complexity on mobile
        if (window.innerWidth <= 768) {
            // Disable resource-intensive animations
            const style = document.createElement('style');
            style.textContent = `
                @media (max-width: 768px) {
                    .particles {
                        animation: none !important;
                    }
                    
                    .glowing-sphere {
                        animation: pulse 6s ease-in-out infinite !important;
                    }
                    
                    .minting-particles::before,
                    .minting-particles::after {
                        animation: particle 3s ease-in-out infinite !important;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    };

    optimizeForMobile();

    // Mobile-specific loading optimization
    const optimizeMobileLoading = () => {
        // Lazy load non-critical animations
        const lazyAnimations = () => {
            const animatedElements = document.querySelectorAll('.glass-card, .tokenomics-card, .ecosystem-card');
            
            const animationObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.opacity = '0';
                        entry.target.style.transform = 'translateY(20px)';
                        
                        setTimeout(() => {
                            entry.target.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                            entry.target.style.opacity = '1';
                            entry.target.style.transform = 'translateY(0)';
                        }, 100);
                        
                        animationObserver.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1 });
            
            animatedElements.forEach(el => animationObserver.observe(el));
        };
        
        if ('requestIdleCallback' in window) {
            requestIdleCallback(lazyAnimations);
        } else {
            setTimeout(lazyAnimations, 100);
        }
    };

    optimizeMobileLoading();

    // Mobile gesture support for card interactions
    const initCardGestures = () => {
        const cards = document.querySelectorAll('.glass-card, .tokenomics-card, .ecosystem-card');
        
        cards.forEach(card => {
            let startY = 0;
            let startTime = 0;
            
            card.addEventListener('touchstart', (e) => {
                startY = e.touches[0].clientY;
                startTime = Date.now();
            }, { passive: true });
            
            card.addEventListener('touchend', (e) => {
                const endY = e.changedTouches[0].clientY;
                const endTime = Date.now();
                const diffY = startY - endY;
                const diffTime = endTime - startTime;
                
                // Quick swipe up
                if (diffY > 50 && diffTime < 300) {
                    card.style.transform = 'translateY(-10px) scale(0.98)';
                    setTimeout(() => {
                        card.style.transform = '';
                    }, 200);
                }
            }, { passive: true });
        });
    };

    initCardGestures();

    // Mobile pull-to-refresh functionality
    const initPullToRefresh = () => {
        let startY = 0;
        let isPulling = false;
        const pullThreshold = 100;
        
        document.addEventListener('touchstart', (e) => {
            if (window.scrollY === 0) {
                startY = e.touches[0].clientY;
                isPulling = true;
            }
        }, { passive: true });
        
        document.addEventListener('touchmove', (e) => {
            if (isPulling && window.scrollY === 0) {
                const currentY = e.touches[0].clientY;
                const diff = currentY - startY;
                
                if (diff > pullThreshold) {
                    // Show pull to refresh indicator
                    document.body.style.transform = `translateY(${Math.min(diff * 0.5, 50)}px)`;
                }
            }
        }, { passive: true });
        
        document.addEventListener('touchend', () => {
            if (isPulling) {
                document.body.style.transform = '';
                isPulling = false;
                
                // Trigger refresh if threshold was met
                if (diff > pullThreshold) {
                    window.location.reload();
                }
            }
        }, { passive: true });
    };

    // Only enable pull-to-refresh on mobile
    if ('ontouchstart' in window && window.innerWidth <= 768) {
        initPullToRefresh();
    }

    // Console Easter egg
    console.log('%c🚀 Welcome to NXChain!', 'font-size: 20px; color: #00d4ff; font-weight: bold;');
    console.log('%cNext-Generation Participation Economy', 'font-size: 14px; color: #00ff88;');
    console.log('%cBuilt with passion for Web3 and GameFi', 'font-size: 12px; color: #ff00ff;');
    console.log('%c📱 Mobile Optimized', 'font-size: 12px; color: #ffff00;');
});

// Additional utility functions
const utils = {
    // Format numbers with commas
    formatNumber: (num) => {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },
    
    // Format currency
    formatCurrency: (amount, currency = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount);
    },
    
    // Debounce function
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // Throttle function
    throttle: (func, limit) => {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = utils;
}
