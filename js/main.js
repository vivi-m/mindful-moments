document.addEventListener('DOMContentLoaded', () => {

    // ---- CONFIGURATION ----
    // In production (Vercel), these will be managed via Environment Variables
    const CONFIG = {
        SUPABASE_URL: 'https://krdvvjydpysedktyznwu.supabase.co',
        SUPABASE_ANON_KEY: 'sb_publishable_dUUshx-tGuBHRJAiWhoDbw_zNDYuv6a',
        EMAILJS_KEY: 'I3TfiF71ijXHh8WID',
        EMAILJS_SERVICE: 'service_diu6ywd',
        EMAILJS_TEMPLATE: 'template_f1ttkq'
    };
    
    let supabaseClient = null;
    if (typeof supabase !== 'undefined') {
        supabaseClient = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
    }

    // Initialize EmailJS immediately if available
    if (typeof emailjs !== 'undefined') {
        emailjs.init({
            publicKey: CONFIG.EMAILJS_KEY,
        });
    }

    // ---- Helper: Relative Time ----
    const timeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        return Math.floor(seconds) + " seconds ago";
    };

    // ---- Helper: Deterministic Avatar Generator ----
    const getAvatarColor = (name) => {
        const bgClasses = ['bg-sage-light', 'bg-clay-light', 'bg-earth-light', 'bg-forest', 'bg-sage-dark', 'bg-clay-dark'];
        // Use name to pick a consistent index
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % bgClasses.length;
        return bgClasses[index];
    };

    // ---- Dark Mode Logic ----
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = themeToggleBtn.querySelector('i');
    
    // Check for saved user preference, else check system preference
    const currentTheme = localStorage.getItem('theme') ? localStorage.getItem('theme') : null;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (currentTheme) {
        document.documentElement.setAttribute('data-theme', currentTheme);
        if (currentTheme === 'dark') {
            themeIcon.classList.replace('fa-moon', 'fa-sun');
        }
    } else if (systemPrefersDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeIcon.classList.replace('fa-moon', 'fa-sun');
    }

    themeToggleBtn.addEventListener('click', () => {
        let theme = document.documentElement.getAttribute('data-theme');
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
            themeIcon.classList.replace('fa-sun', 'fa-moon');
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            themeIcon.classList.replace('fa-moon', 'fa-sun');
        }
    });

    // ---- Review System Logic (Supabase Persistence) ----
    const trackElement = document.querySelector('.carousel-track');
    const dotsNavElement = document.querySelector('.carousel-dots');

    const renderReviewCard = (review) => {
        let starsHTML = '';
        for (let i = 0; i < 5; i++) {
            starsHTML += i < review.rating ? '<i class="fa-solid fa-star" style="color: #FFC107;"></i>' : '<i class="fa-regular fa-star" style="color: #FFC107;"></i>';
        }
        
        const avatarColor = getAvatarColor(review.name);
        const relTime = review.created_at ? timeAgo(review.created_at) : 'Just now';

        return `
            <div class="testimonial-card">
                <div class="customer-info" style="margin-bottom: 16px;">
                    <div class="avatar ${avatarColor}"></div>
                    <div>
                        <h4 style="margin: 0; font-size: 1.1rem;">${review.name}</h4>
                        <div style="font-size: 0.85rem; opacity: 0.6;">${relTime}</div>
                    </div>
                </div>
                <div class="rating" style="margin-bottom: 12px; font-size: 0.85rem;">${starsHTML}</div>
                <p class="quote-text" style="font-size: 1.1rem; line-height: 1.5; font-style: normal; font-family: inherit;">"${review.text}"</p>
            </div>
        `;
    };

    const updateReviewSummary = (reviews) => {
        if (!reviews.length) return;
        const total = reviews.length;
        const sum = reviews.reduce((acc, r) => acc + (r.rating || 5), 0);
        const avg = (sum / total).toFixed(1);

        document.getElementById('avg-rating').textContent = avg;
        document.getElementById('review-count').textContent = `Based on ${total} reviews`;

        // Update Stars
        const starsContainer = document.getElementById('avg-stars');
        let avgStarsHTML = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= Math.round(avg)) avgStarsHTML += '<i class="fa-solid fa-star"></i>';
            else avgStarsHTML += '<i class="fa-regular fa-star"></i>';
        }
        starsContainer.innerHTML = avgStarsHTML;

        // Update Bars
        const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        reviews.forEach(r => counts[r.rating || 5]++);
        
        for (let i = 1; i <= 5; i++) {
            const percentage = (counts[i] / total) * 100;
            document.getElementById(`bar-${i}`).style.width = `${percentage}%`;
        }
    };

    const fetchReviews = async () => {
        let allReviews = [];

        // 1. Fetch from Local Storage (Resilience fallback)
        const localData = JSON.parse(localStorage.getItem('mm_reviews_data') || '[]');
        allReviews = [...localData];

        // 2. Fetch from Supabase (Global Cloud)
        if (supabaseClient && trackElement) {
            console.log('Fetching from Supabase...');
            const { data: dbReviews, error } = await supabaseClient
                .from('reviews')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Supabase Error:', error);
                // On-screen small hint for the user
                console.warn('Review System strictly using Local Storage due to Database Error.');
            } else if (dbReviews) {
                // Merge and remove duplicates (by name+text if needed, simplified here)
                allReviews = [...dbReviews, ...allReviews];
                console.log('Successfully fetched from Supabase.');
            }
        } else {
            console.warn('Supabase Client NOT initialized. Using Local Storage only.');
        }

        if (trackElement) {
            // Remove duplicates by text to avoid double-showing local fallback vs cloud
            const uniqueReviews = [];
            const seenText = new Set();
            allReviews.forEach(r => {
                if (!seenText.has(r.text)) {
                    uniqueReviews.push(r);
                    seenText.add(r.text);
                }
            });

        // Update Summary
        updateReviewSummary(uniqueReviews);

        // Injection
        uniqueReviews.forEach((review) => {
            trackElement.insertAdjacentHTML('beforeend', renderReviewCard(review));
            if (dotsNavElement) dotsNavElement.insertAdjacentHTML('beforeend', '<span class="dot"></span>');
        });

        // CRITICAL: Always initialize carousel even if empty or local only
        initCarousel();
        }
    };

    const initCarousel = () => {
        if (!trackElement) return;
        
        // Reset active states for new DOM order
        const cards = Array.from(trackElement.children);
        const dots = dotsNavElement ? Array.from(dotsNavElement.children) : [];

        dots.forEach((dot, index) => {
            dot.setAttribute('data-index', index);
            if (index === 0) dot.classList.add('active');
            else dot.classList.remove('active');
        });

        cards.forEach((card, index) => {
            if (index === 0) card.classList.add('active');
            else card.classList.remove('active');
        });
    };

    fetchReviews();

    // ---- Testimonials Carousel Logic ----
    const track = document.querySelector('.carousel-track');
    if (track) {
        const cards = Array.from(track.children);
        const nextButton = document.querySelector('.next-btn');
        const prevButton = document.querySelector('.prev-btn');
        const dotsNav = document.querySelector('.carousel-dots');
        const dots = dotsNav ? Array.from(dotsNav.children) : [];

        let currentIndex = 0;
        const slideDuration = 5000;
        let autoPlayInterval;

        const moveToSlide = (targetIndex) => {
            if (targetIndex < 0) targetIndex = cards.length - 1;
            else if (targetIndex >= cards.length) targetIndex = 0;

            const currentCard = cards[currentIndex];
            const nextCard = cards[targetIndex];
            const currentDot = dots[currentIndex];
            const nextDot = dots[targetIndex];

            // Animate out current
            currentCard.classList.remove('active');
            currentCard.classList.add('exit');

            setTimeout(() => {
                currentCard.classList.remove('exit');
            }, 600); // match css transition duration

            // Animate in next
            nextCard.classList.add('active');
            
            // Update dots
            if (currentDot && nextDot) {
                currentDot.classList.remove('active');
                nextDot.classList.add('active');
            }

            currentIndex = targetIndex;
        };

        const nextSlide = () => moveToSlide(currentIndex + 1);
        const prevSlide = () => moveToSlide(currentIndex - 1);

        if (nextButton) nextButton.addEventListener('click', () => { nextSlide(); resetAutoPlay(); });
        if (prevButton) prevButton.addEventListener('click', () => { prevSlide(); resetAutoPlay(); });

        if (dotsNav) {
            dotsNav.addEventListener('click', e => {
                const targetDot = e.target.closest('.dot');
                if (!targetDot) return;
                const targetIndex = dots.findIndex(dot => dot === targetDot);
                if (targetIndex === currentIndex) return;
                moveToSlide(targetIndex);
                resetAutoPlay();
            });
        }

        const startAutoPlay = () => { autoPlayInterval = setInterval(nextSlide, slideDuration); };
        const resetAutoPlay = () => { clearInterval(autoPlayInterval); startAutoPlay(); };

        const carouselContainer = document.querySelector('.carousel-container');
        if (carouselContainer) {
            carouselContainer.addEventListener('mouseenter', () => clearInterval(autoPlayInterval));
            carouselContainer.addEventListener('mouseleave', startAutoPlay);
        }

        startAutoPlay();
    }

    // ---- PARALLAX & SCROLL EFFECTS ----
    const initScrollEffects = () => {
        const scrollElements = document.querySelectorAll('.scroll-fade-up');
        const scrollObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target); 
                }
            });
        }, { threshold: 0.15 });

        scrollElements.forEach((el) => scrollObserver.observe(el));

        const heroBg = document.querySelector('.hero-bg');
        if (heroBg) {
            window.addEventListener('scroll', () => {
                const scrollY = window.scrollY;
                if (scrollY < window.innerHeight) {
                    heroBg.style.transform = `translateY(${scrollY * 0.4}px)`;
                }
            });
        }
    };

    // ---- NAVIGATION LOGIC ----
    const initNavigation = () => {
        const mobileToggle = document.querySelector('.mobile-toggle');
        const navLinks = document.querySelector('.nav-links');
        const body = document.body;

        if (mobileToggle) {
            mobileToggle.addEventListener('click', () => {
                navLinks.classList.toggle('active');
                const icon = mobileToggle.querySelector('i');
                if (navLinks.classList.contains('active')) {
                    icon.classList.replace('fa-bars', 'fa-xmark');
                    body.style.overflow = 'hidden';
                } else {
                    icon.classList.replace('fa-xmark', 'fa-bars');
                    body.style.overflow = '';
                }
            });

            navLinks.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    navLinks.classList.remove('active');
                    mobileToggle.querySelector('i').classList.replace('fa-xmark', 'fa-bars');
                    body.style.overflow = '';
                });
            });
        }
    };

    // Initialize these systems
    initScrollEffects();
    initNavigation();
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const messageInput = document.getElementById('message');
        const submitBtn = document.getElementById('submit-btn');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoader = submitBtn.querySelector('.btn-loader');
        const successMessage = document.getElementById('form-success');

        const validateEmail = (email) => {
            const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return re.test(String(email).toLowerCase());
        };

        const showError = (input, message) => {
            const errorElement = document.getElementById(`${input.id}-error`);
            input.classList.add('error');
            errorElement.textContent = message;
        };

        const clearError = (input) => {
            const errorElement = document.getElementById(`${input.id}-error`);
            input.classList.remove('error');
            errorElement.textContent = '';
        };

        const validateField = (input) => {
            if (input.value.trim() === '') {
                showError(input, `${input.id.charAt(0).toUpperCase() + input.id.slice(1)} is required.`);
                return false;
            }
            if (input.id === 'email' && !validateEmail(input.value)) {
                showError(input, 'Please enter a valid email address.');
                return false;
            }
            clearError(input);
            return true;
        };

        // Real-time validation
        [nameInput, emailInput, messageInput].forEach(input => {
            input.addEventListener('input', () => {
                if(input.classList.contains('error')) {
                    validateField(input);
                }
            });
            input.addEventListener('blur', () => validateField(input));
        });

        // Form Submission
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const isNameValid = validateField(nameInput);
            const isEmailValid = validateField(emailInput);
            const isMessageValid = validateField(messageInput);

            if (isNameValid && isEmailValid && isMessageValid) {
                submitBtn.disabled = true;
                btnText.style.display = 'none';
                btnLoader.style.display = 'inline-block';

                // EmailJS Integration (IDs managed in CONFIG)
                try {
                    if (typeof emailjs !== 'undefined') {
                        emailjs.sendForm(CONFIG.EMAILJS_SERVICE, CONFIG.EMAILJS_TEMPLATE, contactForm)
                            .then(() => {
                                // Success handling
                                submitBtn.disabled = false;
                                btnText.style.display = 'inline-block';
                                btnLoader.style.display = 'none';
                                
                                contactForm.reset();
                                successMessage.style.display = 'block';
                                successMessage.innerHTML = '<i class="fa-solid fa-check-circle"></i> Thank you! Your message has been sent peacefully.';
                                successMessage.style.color = 'var(--primary-green)';
                                successMessage.style.backgroundColor = 'rgba(74, 103, 88, 0.1)';
                                
                                setTimeout(() => {
                                    successMessage.style.display = 'none';
                                }, 5000);
                            }, (error) => {
                                // Error handling
                                console.error('EmailJS Error:', error);
                                submitBtn.disabled = false;
                                btnText.style.display = 'inline-block';
                                btnLoader.style.display = 'none';
                                
                                successMessage.style.display = 'block';
                                // Masking technical details to keep it professional for your visitors
                                successMessage.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> Sending failed. Please try again or email us directly.`;
                                successMessage.style.color = '#d9534f';
                                successMessage.style.backgroundColor = '#f8d7da';
                            });
                    } else {
                        throw new Error('EmailJS SDK not loaded');
                    }
                } catch (err) {
                     console.error(err);
                     submitBtn.disabled = false;
                     btnText.style.display = 'inline-block';
                     btnLoader.style.display = 'none';
                     successMessage.style.display = 'block';
                     successMessage.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> Something went wrong. Please try again later.`;
                     successMessage.style.color = '#d9534f';
                }
            }
        });
    }

    // ---- Mobile Navigation Toggle ----
    const mobileToggle = document.querySelector('.mobile-toggle');
    const navLinks = document.querySelector('.nav-links');
    const body = document.body;

    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            // Toggle icon
            const icon = mobileToggle.querySelector('i');
            if (navLinks.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-xmark');
                body.style.overflow = 'hidden'; // prevent scrolling when menu is open
            } else {
                icon.classList.remove('fa-xmark');
                icon.classList.add('fa-bars');
                body.style.overflow = '';
            }
        });

        // Close mobile menu when a link is clicked
        const mobileLinks = navLinks.querySelectorAll('a');
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                mobileToggle.querySelector('i').classList.replace('fa-xmark', 'fa-bars');
                body.style.overflow = ''; // allow scroll again
            });
        });
    }

    // ---- Modals Logic ----
    const loginBtn = document.getElementById('login-open-btn');
    const loginModal = document.getElementById('login-modal');
    const loginCloseBtn = document.getElementById('login-close-btn');

    const openModal = (modalElement) => {
        modalElement.classList.add('active');
        modalElement.setAttribute('aria-hidden', 'false');
        body.style.overflow = 'hidden'; // Prevent background scrolling
    };

    const closeModal = (modalElement) => {
        modalElement.classList.remove('active');
        modalElement.setAttribute('aria-hidden', 'true');
        body.style.overflow = '';
    };

    // Login Events
    if (loginBtn && loginModal) {
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal(loginModal);
        });
        loginCloseBtn.addEventListener('click', () => closeModal(loginModal));
    }

    // Universal Close Events (Click outside overlay & Escape key)
    const modals = [loginModal, document.getElementById('article-modal'), document.getElementById('payment-modal'), document.getElementById('paywall-modal')];
    modals.forEach(modal => {
        if (!modal) return;
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal);
            }
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            modals.forEach(modal => {
                if (modal && modal.classList.contains('active')) {
                    closeModal(modal);
                }
            });
        }
    });

    // ---- App State Management (Auth & Subscriptions) ----
    let currentUser = JSON.parse(localStorage.getItem('mm_user')) || { isLoggedIn: false, isSubscribed: false, name: '' };

    const updateAuthUI = () => {
        const authStateElem = document.getElementById('auth-state');
        if (!authStateElem) return;

        if (currentUser.isLoggedIn) {
            authStateElem.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="color: var(--text-forest); font-weight: 500; font-size: 0.95rem; display: none;" class="desktop-name">Hi, ${currentUser.name}</span>
                    <div class="user-avatar" style="width: 36px; height: 36px; border-radius: 50%; background: var(--primary-green); color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; cursor: pointer;" title="Log Out" id="logout-btn">
                        ${currentUser.name.charAt(0).toUpperCase()}
                    </div>
                </div>
            `;
            // Add desktop name visibility via css in a real app, handled inline here for simplicity
            const desktopName = authStateElem.querySelector('.desktop-name');
            if (window.innerWidth > 768) desktopName.style.display = 'block';

            document.getElementById('logout-btn').addEventListener('click', () => {
                currentUser = { isLoggedIn: false, isSubscribed: false, name: '' };
                localStorage.setItem('mm_user', JSON.stringify(currentUser));
                updateAuthUI();
                updatePremiumUI();
            });
        } else {
            authStateElem.innerHTML = `<a href="#" class="btn btn-outline" id="login-open-btn" aria-label="Open Login Modal">Log In</a>`;
            document.getElementById('login-open-btn').addEventListener('click', (e) => {
                e.preventDefault();
                openModal(document.getElementById('login-modal'));
            });
        }
    };

    const updatePremiumUI = () => {
        const premiumCards = document.querySelectorAll('.premium-card');
        premiumCards.forEach(card => {
            const lockBtn = card.querySelector('.subscribe-lock-btn');
            const readBtn = card.querySelector('.read-more-btn');
            const badge = card.querySelector('.badge.premium');

            if (currentUser.isSubscribed) {
                if(lockBtn) lockBtn.classList.add('hidden');
                if(readBtn) readBtn.classList.remove('hidden');
                if(badge) badge.innerHTML = `<i class="fa-solid fa-unlock"></i> Unlocked`;
            } else {
                if(lockBtn) lockBtn.classList.remove('hidden');
                if(readBtn) readBtn.classList.add('hidden');
                if(badge) badge.innerHTML = `<i class="fa-solid fa-lock"></i> Premium`;
            }
        });
    };

    // Initialization
    updateAuthUI();
    updatePremiumUI();

    // ---- Auth Form Submission ----
    const authForm = document.getElementById('auth-form');
    if (authForm) {
        authForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('auth-submit-btn');
            const btnText = submitBtn.querySelector('.btn-text');
            const btnLoader = submitBtn.querySelector('.btn-loader');
            const nameInput = document.getElementById('auth-name').value || 'User';

            submitBtn.disabled = true;
            btnText.style.display = 'none';
            btnLoader.style.display = 'inline-block';

            setTimeout(() => {
                submitBtn.disabled = false;
                btnText.style.display = 'inline-block';
                btnLoader.style.display = 'none';

                // Save state
                currentUser.isLoggedIn = true;
                currentUser.name = nameInput;
                localStorage.setItem('mm_user', JSON.stringify(currentUser));

                updateAuthUI();
                closeModal(document.getElementById('login-modal'));
                authForm.reset();
            }, 1000);
        });
    }

    // ---- Library Content Logic (Dynamic Loading from data.js) ----
    const libraryContainer = document.getElementById('library-grid-container');
    const paywallModal = document.getElementById('paywall-modal');
    const articleModal = document.getElementById('article-modal');

    const renderLibraryCards = () => {
        if (!libraryContainer || typeof websiteData === 'undefined') return;
        
        libraryContainer.innerHTML = ''; // Clear container

        websiteData.articles.forEach((article, index) => {
            const delay = (index % 3 + 1) * 0.1;
            
            const cardHTML = `
                <div class="library-card scroll-fade-up ${article.isPremium ? 'premium-card' : ''}" style="transition-delay: ${delay}s;">
                    <div class="library-img ${article.imageClass}"></div>
                    <div class="library-content">
                        ${article.isPremium 
                            ? `<span class="badge premium"><i class="fa-solid fa-lock"></i> Premium</span>` 
                            : `<span class="badge free">Free</span>`
                        }
                        <h3 style="margin-bottom: 4px;">${article.title}</h3>
                        <div style="font-size: 0.85rem; color: var(--text-forest); opacity: 0.7; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                            <span><i class="fa-solid fa-pen-nib" style="margin-right: 4px;"></i>${article.author || 'Vivian Mugure'}</span>
                            <span>&bull;</span>
                            <span>${article.date || 'March 2026'}</span>
                        </div>
                        <p>${article.shortPreview}</p>
                        
                        ${article.isPremium 
                            ? `<button class="btn btn-primary subscribe-lock-btn" data-id="${article.id}">Subscribe to Read</button>
                               <button class="btn btn-outline read-more-btn hidden" data-id="${article.id}">Read More</button>`
                            : `<button class="btn btn-outline read-more-btn" data-id="${article.id}">Read More</button>`
                        }
                    </div>
                </div>
            `;
            libraryContainer.innerHTML += cardHTML;
        });

        // Ensure new cards are observed for scroll animation
        const newCards = libraryContainer.querySelectorAll('.scroll-fade-up');
        newCards.forEach(card => {
            if (typeof scrollObserver !== 'undefined') {
                scrollObserver.observe(card);
            } else {
                // Fallback: if observer fails, make it visible immediately
                card.classList.add('is-visible'); 
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }
        });

        attachLibraryEvents();
    };

    const attachLibraryEvents = () => {
        const readMoreBtns = document.querySelectorAll('.read-more-btn');
        const subscribeLockBtns = document.querySelectorAll('.subscribe-lock-btn');

        // Free & Unlocked Reading
        readMoreBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const articleId = e.target.getAttribute('data-id');
                const articleData = websiteData.articles.find(a => a.id === articleId);
                
                if (articleData) {
                    document.getElementById('article-title').textContent = articleData.title;
                    
                    const authorBlock = `
                        <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid var(--border-color); font-size: 0.95rem; opacity: 0.85; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                            <span style="font-weight: 500; color: var(--text-forest);"><i class="fa-solid fa-pen-nib" style="color: var(--primary-green); margin-right: 8px;"></i>By ${articleData.author || 'Vivian Mugure'}</span>
                            <span style="color: var(--text-forest);"><i class="fa-regular fa-calendar" style="color: var(--primary-green); margin-right: 8px;"></i>Published ${articleData.date || 'March 2026'}</span>
                        </div>
                    `;

                    document.getElementById('article-body').innerHTML = articleData.fullBody + authorBlock;
                    openModal(articleModal);
                }
            });
        });

        // Premium Lock Clicks (Subscribing directly from card if logged out/unsubscribed)
        subscribeLockBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (!currentUser.isLoggedIn) {
                    document.getElementById('paywall-title').textContent = "Join to Access Premium";
                    openModal(paywallModal);
                } else if (!currentUser.isSubscribed) {
                    document.getElementById('paywall-title').textContent = "Premium Content";
                    openModal(paywallModal);
                }
            });
        });
    };

    // Initialize dynamic library content
    renderLibraryCards();
    updatePremiumUI(); // Re-trigger UI update on fresh cards

    document.getElementById('paywall-to-pricing')?.addEventListener('click', () => {
        closeModal(paywallModal);
        setTimeout(() => {
            // Smooth scroll handled by CSS, just need to close modal
            window.location.hash = '#pricing'; 
        }, 100);
    });

    // ---- Pricing & Payment Simulation ----
    const pricingSubscribeBtns = document.querySelectorAll('.pricing-subscribe-btn');
    const paymentModal = document.getElementById('payment-modal');
    const paymentForm = document.getElementById('payment-form');

    pricingSubscribeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (!currentUser.isLoggedIn) {
                openModal(document.getElementById('login-modal'));
                return;
            }
            if (currentUser.isSubscribed) {
                alert("You are already subscribed to a premium plan!");
                return;
            }
            
            const plan = e.target.getAttribute('data-plan');
            document.getElementById('payment-plan-desc').textContent = `You are subscribing to the ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan.`;
            openModal(paymentModal);
        });
    });

    if (paymentForm) {
        paymentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('payment-submit-btn');
            const btnText = submitBtn.querySelector('.btn-text');
            const btnLoader = submitBtn.querySelector('.btn-loader');
            const successMsg = document.getElementById('payment-success');

            submitBtn.disabled = true;
            btnText.style.display = 'none';
            btnLoader.style.display = 'inline-block';

            // Simulate card processing network request
            setTimeout(() => {
                successMsg.style.display = 'block';
                btnLoader.style.display = 'none';
                
                // Upgrade User
                currentUser.isSubscribed = true;
                localStorage.setItem('mm_user', JSON.stringify(currentUser));
                updatePremiumUI();

                setTimeout(() => {
                    closeModal(paymentModal);
                    submitBtn.disabled = false;
                    btnText.style.display = 'inline-block';
                    successMsg.style.display = 'none';
                    paymentForm.reset();
                    
                    // Launch a premium article as a reward
                    document.getElementById('article-title').textContent = "Welcome to Premium";
                    document.getElementById('article-body').innerHTML = "<p>Thank you for subscribing! You now have full access to our entire library of guided meditations, trauma healing scripts, and exclusive workshops.</p>";
                    openModal(articleModal);
                }, 2000);

            }, 2000);
        });
    }

    // ---- FAQ Accordion ----
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const answer = question.nextElementSibling;
            
            // Toggle active state on question for chevron rotation
            question.classList.toggle('active');

            if (question.classList.contains('active')) {
                answer.style.maxHeight = answer.scrollHeight + "px";
            } else {
                answer.style.maxHeight = "0";
            }
        });
    });

    // Handle existing elements that might have been lost in replacement chunks
    const articleCloseBtn = document.getElementById('article-close-btn');
    if(articleCloseBtn) articleCloseBtn.addEventListener('click', () => closeModal(articleModal));
    const paywallCloseBtn = document.getElementById('paywall-close-btn');
    if(paywallCloseBtn) paywallCloseBtn.addEventListener('click', () => closeModal(paywallModal));
    const paymentCloseBtn = document.getElementById('payment-close-btn');
    if(paymentCloseBtn) paymentCloseBtn.addEventListener('click', () => closeModal(paymentModal));

    // ---- Live Review Submission Logic (Supabase) ----
    const liveReviewForm = document.getElementById('live-review-form');
    if (liveReviewForm) {
        liveReviewForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('review-submit-btn');
            const submitText = submitBtn.querySelector('.btn-text');
            const submitLoader = submitBtn.querySelector('.btn-loader');
            const successMsg = document.getElementById('review-success-msg');

            const name = document.getElementById('review-name').value || 'Anonymous';
            const role = document.getElementById('review-role').value || '';
            const text = document.getElementById('review-text').value;
            const ratingInput = document.querySelector('.star-rating-input input[name="rating"]:checked');
            const ratingValue = ratingInput ? parseInt(ratingInput.value) : 5;

            submitBtn.disabled = true;
            submitText.style.display = 'none';
            submitLoader.style.display = 'inline-block';

            if (!supabaseClient) {
                // Fallback to local storage if supabaseClient isn't configured yet
                console.warn('Supabase not configured. Falling back to local storage.');
                setTimeout(() => {
                    const localReview = { name, role, text, rating: ratingValue, created_at: new Date().toISOString() };
                    const savedReviews = JSON.parse(localStorage.getItem('mm_reviews_data') || '[]');
                    savedReviews.push(localReview);
                    localStorage.setItem('mm_reviews_data', JSON.stringify(savedReviews));

                    submitBtn.disabled = false;
                    submitText.style.display = 'inline-block';
                    submitLoader.style.display = 'none';
                    successMsg.style.display = 'block';
                    liveReviewForm.reset();
                    setTimeout(() => { window.location.reload(); }, 1500);
                }, 800);
                return;
            }

            const { error } = await supabaseClient
                .from('reviews')
                .insert([{ name, role, text, rating: ratingValue }]);

            if (error) {
                console.error('Error submitting review:', error);
                alert('Connection error. Please try again.');
                submitBtn.disabled = false;
                submitText.style.display = 'inline-block';
                submitLoader.style.display = 'none';
            } else {
                submitBtn.disabled = false;
                submitText.style.display = 'inline-block';
                submitLoader.style.display = 'none';
                successMsg.style.display = 'block';
                liveReviewForm.reset();

                setTimeout(() => {
                    successMsg.style.display = 'none';
                    window.location.reload(); 
                }, 1500);
            }
        });
    }

});
