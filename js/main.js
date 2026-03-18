/* ============================================================
   SPARTA BOOKING PUBLISHING - Main JavaScript
   Handles: Navigation, Scroll effects, Counters,
            Animations, FAQ, Contact form, Scroll to top
   ============================================================ */

/* ============================================================
   1. DOM READY - Initialize everything after page loads
   ============================================================ */
document.addEventListener('DOMContentLoaded', function () {
    initNavbar();            // Navbar scroll behavior
    initScrollAnimations();  // Fade-in on scroll animations
    initCounters();          // Animated number counters in hero
    initContactForm();       // Contact form submission handler
    initScrollToTop();       // Scroll to top button visibility
    highlightActiveNav();    // Mark current page link as active
});

/* ============================================================
   2. NAVBAR - Sticky scroll effect
   Adds .scrolled class when page is scrolled > 50px
   ============================================================ */
function initNavbar() {
    const navbar = document.querySelector('.main-navbar');
    if (!navbar) return;

    function onScroll() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');    // Triggers backdrop blur style
        } else {
            navbar.classList.remove('scrolled');
        }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // Run once on load in case page starts scrolled
}

/* ============================================================
   3. SCROLL ANIMATIONS - Fade in elements as they enter view
   Uses IntersectionObserver for performance (no scroll listeners)
   ============================================================ */
function initScrollAnimations() {
    // Select all elements with animate class
    const animatedEls = document.querySelectorAll('.animate-fade-up');
    if (!animatedEls.length) return;

    const observer = new IntersectionObserver(
        function (entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated'); // Trigger CSS animation
                    observer.unobserve(entry.target);       // Animate only once
                }
            });
        },
        {
            threshold: 0.1,        // Trigger when 10% of element is visible
            rootMargin: '0px 0px -40px 0px'  // Slight offset from bottom
        }
    );

    animatedEls.forEach(el => observer.observe(el));
}

/* ============================================================
   4. COUNTER ANIMATION - Counts up numbers in hero stats
   Finds elements with data-target attribute
   Example: <span class="counter" data-target="500">0</span>
   ============================================================ */
function initCounters() {
    const counters = document.querySelectorAll('.counter');
    if (!counters.length) return;

    const counterObserver = new IntersectionObserver(
        function (entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    counterObserver.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.5 }
    );

    counters.forEach(counter => counterObserver.observe(counter));
}

/* Count up animation from 0 to target value */
function animateCounter(el) {
    const target = parseInt(el.getAttribute('data-target'), 10);
    const suffix = el.getAttribute('data-suffix') || '';  // e.g., '+', '%'
    const duration = 2000; // milliseconds
    const stepTime = 16;   // ~60fps
    const steps = duration / stepTime;
    const increment = target / steps;
    let current = 0;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        el.textContent = Math.floor(current).toLocaleString() + suffix;
    }, stepTime);
}

/* ============================================================
   5. CONTACT FORM - Handles submission via FormSubmit AJAX & WhatsApp
   ============================================================ */
function initContactForm() {
    const forms = [
        document.getElementById('contactForm'),
        document.getElementById('heroConsultationForm'),
        document.getElementById('serviceConsultationForm')
    ];

    forms.forEach(form => {
        if (!form) return;

        let clickedButton = null;

        // Track which button was clicked
        const buttons = form.querySelectorAll('button[type="submit"]');
        buttons.forEach(btn => {
            btn.addEventListener('click', function () {
                clickedButton = this;
            });
        });

        form.addEventListener('submit', function (e) {
            e.preventDefault();

            const submitBtn = e.submitter || clickedButton || form.querySelector('button[type="submit"]');
            const isWhatsApp = submitBtn && submitBtn.classList.contains('btn-whatsapp-submit');
            const successMsg = form.querySelector('.form-success-msg');

            // Validate form
            if (form.checkValidity && !form.checkValidity()) {
                form.classList.add('was-validated');
                return;
            }

            // Gather values compatibles with older browsers
            const formData = new FormData(form);
            const data = {};
            formData.forEach((value, key) => {
                data[key] = value;
            });

            // Map fields if necessary
            if (!data.Name && data['Full Name']) data.Name = data['Full Name'];
            if (!data.Email && data['Email Address']) data.Email = data['Email Address'];

            // Add subject
            data._subject = "New Website Inquiry (" + (data.Service || "General") + ")";
            data._template = "table";

            // Button Loading State
            const originalBtnHtml = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Processing...';
            submitBtn.disabled = true;

            // --- 1. SEND GMAIL (VIA FORMSUBMIT AJAX) ---
            const emailPromise = fetch("https://formsubmit.co/ajax/7b8f55043e887d61bbf0257a2e56592a", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(data)
            });

            // --- 2. WHATSAPP REDIRECTION (IF CLICKED) ---
            if (isWhatsApp) {
                let whatsappMsg = `*New Inquiry Details:*\n`;
                for (let key in data) {
                    if (data[key] && !key.startsWith('_')) {
                        whatsappMsg += `*${key}:* ${data[key]}\n`;
                    }
                }
                const encodedMsg = encodeURIComponent(whatsappMsg);
                const whatsappUrl = `https://wa.me/923303945079?text=${encodedMsg}`;

                submitBtn.innerHTML = '<i class="fas fa-check me-2"></i>Opening WhatsApp...';

                setTimeout(() => {
                    window.open(whatsappUrl, '_blank');
                    form.reset();
                    form.classList.remove('was-validated');
                    submitBtn.innerHTML = originalBtnHtml;
                    submitBtn.disabled = false;
                }, 1000);
            }

            // --- 3. HANDLE EMAIL RESPONSE ---
            emailPromise
                .then(response => {
                    console.log('Server Status:', response.status);
                    return response.json();
                })
                .then(result => {
                    console.log('FormSubmit Data:', result);

                    // If success is false, FormSubmit usually provides a message
                    if (result.success === "false" || result.success === false) {
                        const msg = result.message || "Activation Required! Check Musabshaikhss@gmail.com and click 'Activate Form'.";
                        alert("FormSubmit says: " + msg);
                        submitBtn.innerHTML = 'Action Required';
                        submitBtn.disabled = false;
                        return;
                    }

                    if (!isWhatsApp) {
                        submitBtn.innerHTML = '<i class="fas fa-check me-2"></i>Sent!';
                        if (successMsg) {
                            successMsg.style.display = 'block';
                            setTimeout(() => { successMsg.style.display = 'none'; }, 5000);
                        } else {
                            alert("Success! Your data has been sent to your Gmail.");
                        }
                        form.reset();
                        form.classList.remove('was-validated');
                        setTimeout(() => {
                            submitBtn.innerHTML = originalBtnHtml;
                            submitBtn.disabled = false;
                        }, 2000);
                    }
                })
                .catch(error => {
                    console.error('Final Submission Error:', error);
                    if (!isWhatsApp) {
                        submitBtn.innerHTML = 'Error! Try Again';
                        submitBtn.disabled = false;
                        alert("Submission Failed. Possible reasons:\n1. You haven't clicked 'Activate Form' in your Gmail.\n2. No internet connection.\n3. FormSubmit key is invalid for this domain.");
                    }
                });
        });
    });
}

/* ============================================================
   6. SCROLL TO TOP BUTTON
   Shows/hides the floating scroll-up button
   ============================================================ */
function initScrollToTop() {
    const btn = document.querySelector('.scroll-to-top');
    if (!btn) return;

    /* Show button after scrolling 300px */
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            btn.classList.add('visible');
        } else {
            btn.classList.remove('visible');
        }
    }, { passive: true });

    /* Smooth scroll to top on click */
    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

/* ============================================================
   7. ACTIVE NAV LINK - Highlight current page in navigation
   Compares current URL path to nav link hrefs
   ============================================================ */
function highlightActiveNav() {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.main-navbar .nav-link');

    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href');
        if (linkPage === currentPath ||
            (currentPath === '' && linkPage === 'index.html') ||
            (currentPath === 'index.html' && linkPage === 'index.html')) {
            link.classList.add('active');
        }
    });
}

/* ============================================================
   8. NEWSLETTER FORM - Footer newsletter subscribe
   ============================================================ */
document.querySelectorAll('.newsletter-form, #newsletterForm').forEach(form => {
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        const input = this.querySelector('input[type="email"]');
        const email = input ? input.value.trim() : '';

        if (!email) return;

        const submitBtn = this.querySelector('button[type="submit"]');
        const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        }

        fetch("https://formsubmit.co/ajax/7b8f55043e887d61bbf0257a2e56592a", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                _subject: "New Newsletter Subscriber",
                Email: email
            })
        })
            .then(res => res.json())
            .then(result => {
                if (result.success === "false" || result.success === false) {
                    alert("Newsletter Subscribed! BUT you must confirm your email at Musabshaikhss@gmail.com to start receiving these notifications.");
                } else {
                    alert('Thank you for subscribing! We will keep you updated.');
                }
                if (input) input.value = '';
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnHtml;
                }
            })
            .catch(() => {
                alert('Success! (If this is your first time, please check your inbox for an activation email from FormSubmit).');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnHtml;
                }
            });
    });
});

/* ============================================================
   9. SMOOTH SCROLL FOR ANCHOR LINKS
   Prevents default jump and scrolls smoothly to target
   ============================================================ */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            e.preventDefault();
            const offset = 80; // Height of sticky navbar
            const top = target.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top, behavior: 'smooth' });
        }
    });
});

/* ============================================================
   10. MOBILE NAVBAR - Close on link click
   Automatically closes mobile nav when a link is tapped
   ============================================================ */
document.querySelectorAll('.navbar-nav .nav-link:not(.dropdown-toggle)').forEach(link => {
    link.addEventListener('click', () => {
        const navbarCollapse = document.querySelector('.navbar-collapse');
        if (navbarCollapse && navbarCollapse.classList.contains('show')) {
            const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
            if (bsCollapse) bsCollapse.hide();
        }
    });
});
