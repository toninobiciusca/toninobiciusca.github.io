/**
 * Scroll Portfolio Interactions Controller
 * Coded for Tonino Biciusca's Professional Scroll Portfolio
 * Coordinates bottom HUD navigation dock scroll spys, active tracers,
 * skills filters, and sanitized contact form responses.
 */

document.addEventListener('DOMContentLoaded', () => {

    // Initialize EmailJS Browser SDK
    if (typeof emailjs !== 'undefined') {
        emailjs.init({
            publicKey: 'w6dyLy_LSiQHYkgdt'
        });
    }

    // ----------------------------------------------------
    // 0. Super-Fast System Preloader (Hubtown style)
    // ----------------------------------------------------
    const loaderWrapper = document.getElementById('loader-wrapper');
    const loaderPercent = document.getElementById('loader-percent');
    
    if (loaderWrapper && loaderPercent) {
        let progress = 0;
        const intervalTime = 25; // 25ms ticks for ultra-fast progression
        
        const loaderInterval = setInterval(() => {
            const increment = Math.floor(Math.random() * 16) + 6; // random jump
            progress += increment;
            
            if (progress >= 100) {
                progress = 100;
                clearInterval(loaderInterval);
                loaderPercent.textContent = '100%';
                
                setTimeout(() => {
                    loaderWrapper.classList.add('fade-out');
                }, 80);
            } else {
                loaderPercent.textContent = `${progress}%`;
            }
        }, intervalTime);
        
        // Window load safety override
        window.addEventListener('load', () => {
            clearInterval(loaderInterval);
            loaderPercent.textContent = '100%';
            loaderWrapper.classList.add('fade-out');
        });
    }

    // ----------------------------------------------------
    // 1. Interactive 3D Depth Scroll Tunnel (Hubtown style)
    // ----------------------------------------------------
    const scrollContainer = document.querySelector('.scroll-container');
    const contentWrapper = document.querySelector('.content-wrapper');
    const sections = scrollContainer 
        ? document.querySelectorAll('.scroll-container ~ .content-wrapper > section')
        : document.querySelectorAll('.content-wrapper > section');
    const navLinks = document.querySelectorAll('.dock-item');

    if (scrollContainer && contentWrapper && sections.length > 0) {
        let targetScrollY = window.scrollY;
        let currentScrollY = window.scrollY;
        let animationFrameId = null;

        // Z-Scroll Tunnel Transformer
        const updateZScroll = () => {
            if (window.innerWidth <= 1024) {
                // Responsive Fallback: Clear inline overrides to let CSS normal layouts govern
                sections.forEach(section => {
                    section.style.transform = '';
                    section.style.opacity = '';
                    section.style.pointerEvents = '';
                });
                return;
            }

            const scrollY = window.scrollY;
            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            const progress = maxScroll > 0 ? currentScrollY / maxScroll : 0;
            const N = sections.length;

            // Update the neural background canvas with the scroll progress (fly-through panning & rotation)
            if (window.neuralBackgroundInstance) {
                window.neuralBackgroundInstance.setScrollProgress(progress);
            }

            sections.forEach((section, index) => {
                // Calculate relative difference from scroll progress center
                const diff = progress * (N - 1) - index;

                // Dwell / friction scroll zone threshold buffer (30% dwell zone)
                let visualDiff = 0;
                const DWELL = 0.3;
                if (Math.abs(diff) <= DWELL) {
                    visualDiff = 0;
                } else if (diff > DWELL) {
                    visualDiff = (diff - DWELL) / (1 - DWELL);
                } else {
                    visualDiff = (diff + DWELL) / (1 - DWELL);
                }

                let z = 0;
                let opacity = 1;
                let scale = 1;
                let xOffset = 0;
                let yOffset = 0;

                // Unique cinematic fly-through angles based on section index
                const angle = index * (Math.PI / 3); // 60 degrees shift per section path

                if (visualDiff < 0) {
                    // Incoming: fly in from a specific angle in 3D space, expanding from a point
                    z = visualDiff * 1200; // From -1200px to 0px
                    xOffset = Math.sin(angle) * visualDiff * 800; // Left/Right side entry
                    yOffset = Math.cos(angle) * visualDiff * 600; // Up/Down side entry
                    opacity = Math.max(0, 1 + visualDiff); // Linear cross-fade-in
                    scale = Math.max(0, 1 + visualDiff); // Scale expand
                } else {
                    // Outgoing: fly out in the opposite angle, collapsing to a point
                    z = visualDiff * 600; // From 0px to 600px
                    xOffset = -Math.sin(angle) * visualDiff * 1000;
                    yOffset = -Math.cos(angle) * visualDiff * 800;
                    opacity = Math.max(0, 1 - visualDiff); // Linear cross-fade-out
                    scale = Math.max(0, 1 - visualDiff); // Collapse to point
                }

                // Apply Z-axis translation, camera offsets, scale and opacity
                section.style.transform = `translate3d(${xOffset}px, ${yOffset}px, ${z}px) scale(${scale})`;
                section.style.opacity = opacity;

                // Toggle active visibility classes
                const isClosest = Math.round(progress * (N - 1)) === index;
                if (Math.abs(diff) < 1.0) {
                    section.classList.add('active-section');
                    section.setAttribute('aria-hidden', 'false');
                    
                    // Force reveal-on-scroll elements to become visible once their parent is active
                    section.querySelectorAll('.reveal-on-scroll').forEach(el => {
                        el.classList.add('revealed');
                    });
                } else {
                    section.classList.remove('active-section');
                    section.setAttribute('aria-hidden', 'true');
                }

                // Only allow pointer events (clicks/inputs) on the section that is closest to focus
                section.style.pointerEvents = isClosest ? 'auto' : 'none';
            });

            // Update active HUD dock highlights based on progress
            const activeIndex = Math.round(progress * (N - 1));
            const activeSection = sections[activeIndex];
            const activeId = activeSection ? activeSection.getAttribute('id') : '';

            navLinks.forEach(link => {
                const href = link.getAttribute('href');
                if (href === `#${activeId}` || href.endsWith(`#${activeId}`)) {
                    link.classList.add('active');
                    link.setAttribute('aria-selected', 'true');
                } else {
                    link.classList.remove('active');
                    link.setAttribute('aria-selected', 'false');
                }
            });
        };

        // Smoothly interpolate scroll changes (LERP engine to avoid abrupt scroll notch transitions)
        const tickScroll = () => {
            const delta = targetScrollY - currentScrollY;
            if (Math.abs(delta) > 0.1) {
                currentScrollY += delta * 0.085; // 0.085 LERP factor for buttery-smooth gliding inertia
                updateZScroll();
                animationFrameId = requestAnimationFrame(tickScroll);
            } else {
                currentScrollY = targetScrollY;
                updateZScroll();
                animationFrameId = null;
            }
        };

        const handleScroll = () => {
            targetScrollY = window.scrollY;
            if (window.innerWidth <= 1024) {
                // Instantly update on mobile/tablet viewports
                currentScrollY = targetScrollY;
                updateZScroll();
            } else if (!animationFrameId) {
                // Activate requestAnimationFrame loop for smooth LERP on desktop
                animationFrameId = requestAnimationFrame(tickScroll);
            }
        };

        // Trigger updates on scroll, resize, and initial load
        window.addEventListener('scroll', handleScroll);
        window.addEventListener('resize', () => {
            targetScrollY = window.scrollY;
            currentScrollY = window.scrollY;
            updateZScroll();
        });
        
        // Initial setup run
        updateZScroll();

        // Intercept all internal anchor link clicks to scroll smoothly (e.g. HUD dock, "Get in Touch" buttons)
        document.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href && href.startsWith('#') && href !== '#') {
                    const targetId = href.substring(1);
                    const targetSection = document.getElementById(targetId);
                    
                    // Only intercept if target is one of our managed scroll tunnel sections
                    if (targetSection && Array.from(sections).includes(targetSection)) {
                        e.preventDefault();
                        if (window.innerWidth <= 1024) {
                            // On mobile/tablet, scroll natively to the element's actual position
                            targetSection.scrollIntoView({
                                behavior: 'smooth'
                            });
                        } else {
                            // On desktop, scroll to the corresponding spacer zone dynamically based on total scroll height
                            const sectionIndex = Array.from(sections).indexOf(targetSection);
                            if (sectionIndex !== -1) {
                                const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
                                targetScrollY = (sectionIndex / (sections.length - 1)) * maxScroll;
                                window.scrollTo({
                                    top: targetScrollY,
                                    behavior: 'smooth'
                                });
                            }
                        }
                    }
                }
            });
        });

        // Initialize scroll height position if URL contains a section anchor hash
        if (window.location.hash) {
            setTimeout(() => {
                const targetId = window.location.hash.substring(1);
                const targetSection = document.getElementById(targetId);
                if (targetSection) {
                    if (window.innerWidth <= 1024) {
                        targetSection.scrollIntoView({
                            behavior: 'smooth'
                        });
                    } else {
                        const sectionIndex = Array.from(sections).indexOf(targetSection);
                        if (sectionIndex !== -1) {
                            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
                            targetScrollY = (sectionIndex / (sections.length - 1)) * maxScroll;
                            currentScrollY = targetScrollY; // Snap immediately on page load
                            window.scrollTo({
                                top: targetScrollY
                            });
                            updateZScroll();
                        }
                    }
                }
            }, 200);
        }
    }

    // ----------------------------------------------------
    // Mobile/Static Scroll Spy Observer
    // ----------------------------------------------------
    const spyOptions = {
        root: null,
        rootMargin: '-30% 0px -60% 0px', // Adjusted to align nicely when center of section passes through viewport
        threshold: 0
    };

    const spyObserver = new IntersectionObserver((entries) => {
        // Only run this observer if we are on mobile/tablet OR if there is no scrollContainer (e.g. portfolio.html)
        const isMobile = window.innerWidth <= 1024;
        const isStaticPage = !scrollContainer;
        
        if (!isMobile && !isStaticPage) return;

        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                navLinks.forEach(link => {
                    const href = link.getAttribute('href');
                    if (href === `#${id}` || href.endsWith(`#${id}`)) {
                        link.classList.add('active');
                        link.setAttribute('aria-selected', 'true');
                    } else {
                        link.classList.remove('active');
                        link.setAttribute('aria-selected', 'false');
                    }
                });
            }
        });
    }, spyOptions);

    sections.forEach(section => spyObserver.observe(section));

    // ----------------------------------------------------
    // 3. Work Experience Interactive Console Tabs Switcher
    // ----------------------------------------------------
    const jobTabBtns = document.querySelectorAll('.job-tab-btn');
    const jobDetailsPanels = document.querySelectorAll('.job-details-panel');

    if (jobTabBtns.length > 0 && jobDetailsPanels.length > 0) {
        jobTabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.getAttribute('data-tab');
                
                // Toggle active class on tab buttons
                jobTabBtns.forEach(b => {
                    b.classList.remove('active');
                    b.setAttribute('aria-selected', b === btn ? 'true' : 'false');
                });
                btn.classList.add('active');

                // Toggle active class on panels
                jobDetailsPanels.forEach(panel => {
                    if (panel.id === tabId) {
                        panel.classList.add('active');
                    } else {
                        panel.classList.remove('active');
                    }
                });
            });
        });
    }

    // ----------------------------------------------------
    // 3.5 Skills Tech Stack Live Search Filter
    // ----------------------------------------------------
    const skillsSearchInput = document.getElementById('skills-search-input');
    const skillsClearBtn = document.getElementById('skills-clear-btn');
    const skillBadges = document.querySelectorAll('.skill-badge');

    if (skillsSearchInput && skillBadges.length > 0) {
        skillsSearchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            
            if (query !== '') {
                if (skillsClearBtn) skillsClearBtn.style.display = 'flex';
                
                skillBadges.forEach(badge => {
                    const text = badge.textContent.toLowerCase();
                    if (text.includes(query)) {
                        badge.classList.remove('dimmed');
                        badge.classList.add('highlighted');
                    } else {
                        badge.classList.remove('highlighted');
                        badge.classList.add('dimmed');
                    }
                });
            } else {
                if (skillsClearBtn) skillsClearBtn.style.display = 'none';
                resetSkillsFilter();
            }
        });

        if (skillsClearBtn) {
            skillsClearBtn.addEventListener('click', () => {
                skillsSearchInput.value = '';
                skillsClearBtn.style.display = 'none';
                resetSkillsFilter();
                skillsSearchInput.focus();
            });
        }

        function resetSkillsFilter() {
            skillBadges.forEach(badge => {
                badge.classList.remove('dimmed');
                badge.classList.remove('highlighted');
            });
        }
    }

    // ----------------------------------------------------
    // 4. Secure SMTP Mock Contact Form Handler
    // ----------------------------------------------------
    const contactForm = document.getElementById('contact-form');

    function sanitizeInput(str) {
        // Strict XSS Prevention: escape HTML entities to prevent code injection
        return str.replace(/[&<>"']/g, function(m) {
            switch (m) {
                case '&': return '&amp;';
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '"': return '&quot;';
                case "'": return '&#039;';
            }
        });
    }

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // 1. Honeypot check (anti-spam bot)
            const honeypotVal = contactForm.querySelector('input[name="biciusca_mid_val"]').value;
            if (honeypotVal) {
                console.warn('Bot injection attempt blocked.');
                return;
            }

            // 2. Extract input values
            const nameInput = document.getElementById('name');
            const emailInput = document.getElementById('email');
            const subjectInput = document.getElementById('subject');
            const messageInput = document.getElementById('message');

            const name = sanitizeInput(nameInput.value.trim());
            const email = sanitizeInput(emailInput.value.trim());
            const subject = sanitizeInput(subjectInput.value.trim());
            const message = sanitizeInput(messageInput.value.trim());

            // 3. Validation Rules
            let hasErrors = false;

            // Name validation
            const errName = document.getElementById('err-name');
            if (name.length < 2) {
                errName.textContent = 'Name must be at least 2 characters.';
                hasErrors = true;
            } else {
                errName.textContent = '';
            }

            // Email validation
            const errEmail = document.getElementById('err-email');
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(email)) {
                errEmail.textContent = 'Please enter a valid email address.';
                hasErrors = true;
            } else {
                errEmail.textContent = '';
            }

            // Subject validation
            const errSubject = document.getElementById('err-subject');
            if (subject.length < 3) {
                errSubject.textContent = 'Subject must be at least 3 characters.';
                hasErrors = true;
            } else {
                errSubject.textContent = '';
            }

            // Message validation
            const errMessage = document.getElementById('err-message');
            if (message.length < 10) {
                errMessage.textContent = 'Message details must be at least 10 characters.';
                hasErrors = true;
            } else {
                errMessage.textContent = '';
            }

            // GDPR checkbox validation
            const gdprConsent = document.getElementById('gdpr-consent');
            const errGdpr = document.getElementById('err-gdpr');
            if (gdprConsent && !gdprConsent.checked) {
                errGdpr.textContent = 'You must agree to the GDPR policy to submit.';
                hasErrors = true;
            } else if (errGdpr) {
                errGdpr.textContent = '';
            }

            if (hasErrors) return;

            // 4. Submission Loading Animations
            const submitBtn = document.getElementById('submit-btn');
            const btnText = submitBtn.querySelector('.btn-text');
            const btnSpinner = submitBtn.querySelector('.btn-spinner');

            submitBtn.disabled = true;
            btnText.textContent = 'Sending Message...';
            btnSpinner.style.display = 'inline-block';

            if (typeof emailjs !== 'undefined') {
                const serviceID = 'service_azsxojf'; // EmailJS service ID
                const templateID = 'template_6v5edjv';

                emailjs.sendForm(serviceID, templateID, contactForm, {
                    publicKey: 'w6dyLy_LSiQHYkgdt'
                })
                    .then(() => {
                        submitBtn.disabled = false;
                        btnText.textContent = 'Send Message';
                        btnSpinner.style.display = 'none';

                        // Display success prompt box
                        const alertBox = document.getElementById('form-alert-box');
                        const successIcon = document.getElementById('success-icon');
                        const alertText = document.getElementById('alert-text');

                        alertBox.style.display = 'flex';
                        successIcon.style.display = 'block';
                        alertText.innerHTML = `<strong>Message transmitted successfully!</strong><br>Thank you ${name}. Your message has been received, and I'll review it shortly.`;

                        // Flush inputs
                        nameInput.value = '';
                        emailInput.value = '';
                        subjectInput.value = '';
                        messageInput.value = '';
                        if (gdprConsent) gdprConsent.checked = false;

                        // Fade alert out after 6 seconds
                        setTimeout(() => {
                            alertBox.style.transition = 'opacity 0.5s ease';
                            alertBox.style.opacity = 0;
                            setTimeout(() => {
                                alertBox.style.display = 'none';
                                alertBox.style.opacity = 1;
                            }, 500);
                        }, 6000);
                    })
                    .catch((error) => {
                        submitBtn.disabled = false;
                        btnText.textContent = 'Send Message';
                        btnSpinner.style.display = 'none';

                        const alertBox = document.getElementById('form-alert-box');
                        const successIcon = document.getElementById('success-icon');
                        const alertText = document.getElementById('alert-text');

                        alertBox.style.display = 'flex';
                        successIcon.style.display = 'none';
                        alertText.innerHTML = `<strong>Error Sending Message.</strong><br>Something went wrong during transmission: ${error.text || 'Unknown Error'}. Please try again later.`;

                        // Fade alert out after 6 seconds
                        setTimeout(() => {
                            alertBox.style.transition = 'opacity 0.5s ease';
                            alertBox.style.opacity = 0;
                            setTimeout(() => {
                                alertBox.style.display = 'none';
                                alertBox.style.opacity = 1;
                            }, 500);
                        }, 6000);
                    });
            } else {
                // Fallback / SDK Offline Handling
                setTimeout(() => {
                    submitBtn.disabled = false;
                    btnText.textContent = 'Send Message';
                    btnSpinner.style.display = 'none';

                    const alertBox = document.getElementById('form-alert-box');
                    const successIcon = document.getElementById('success-icon');
                    const alertText = document.getElementById('alert-text');

                    alertBox.style.display = 'flex';
                    successIcon.style.display = 'none';
                    alertText.innerHTML = `<strong>Offline Transmission Error.</strong><br>The email transmission service is currently offline. Please check your internet connection and try again later.`;

                    // Fade alert out after 6 seconds
                    setTimeout(() => {
                        alertBox.style.transition = 'opacity 0.5s ease';
                        alertBox.style.opacity = 0;
                        setTimeout(() => {
                            alertBox.style.display = 'none';
                            alertBox.style.opacity = 1;
                        }, 500);
                    }, 6000);
                }, 1000);
            }
        });
    }

    // GDPR Modal Popup Event Listeners
    const gdprModal = document.getElementById('gdpr-modal');
    const gdprLink = document.getElementById('gdpr-link');
    const gdprModalClose = document.getElementById('gdpr-modal-close');

    if (gdprLink && gdprModal) {
        gdprLink.addEventListener('click', (e) => {
            e.preventDefault();
            gdprModal.classList.add('active');
            gdprModal.setAttribute('aria-hidden', 'false');
        });
    }

    if (gdprModalClose && gdprModal) {
        gdprModalClose.addEventListener('click', () => {
            gdprModal.classList.remove('active');
            gdprModal.setAttribute('aria-hidden', 'true');
        });
        // Close modal on clicking outside the content box
        gdprModal.addEventListener('click', (e) => {
            if (e.target === gdprModal) {
                gdprModal.classList.remove('active');
                gdprModal.setAttribute('aria-hidden', 'true');
            }
        });
    }

    // ----------------------------------------------------
    // 5. Dynamic Apple-style Typing/Deleting Role Cycler
    // ----------------------------------------------------
    const dynamicText = document.getElementById('dynamic-role-text');
    if (dynamicText) {
        const roles = [
            'Tech Department Leader',
            'Software Engineer',
            'Fullstack Developer',
            'Backend Developer'
        ];
        let roleIndex = 0;
        let charIndex = roles[0].length; // Start with the full initial text
        let isDeleting = true; // Start by deleting the first hardcoded role
        let delay = 2000; // Delay before deleting the initial role

        function typeRole() {
            const currentRole = roles[roleIndex];
            if (isDeleting) {
                dynamicText.textContent = currentRole.substring(0, charIndex - 1);
                charIndex--;
                delay = 45; // Delete faster
            } else {
                dynamicText.textContent = currentRole.substring(0, charIndex + 1);
                charIndex++;
                delay = 75; // Type naturally
            }

            if (!isDeleting && charIndex === currentRole.length) {
                isDeleting = true;
                delay = 2500; // Hold full word
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                roleIndex = (roleIndex + 1) % roles.length;
                delay = 400; // Pause before typing next
            }

            setTimeout(typeRole, delay);
        }
        setTimeout(typeRole, delay);
    }

    // ----------------------------------------------------
    // 6. Apple-style Scroll Reveal Animation
    // ----------------------------------------------------
    const revealElements = document.querySelectorAll('.reveal-on-scroll');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                revealObserver.unobserve(entry.target); // Trigger only once
            }
        });
    }, {
        root: null,
        threshold: 0.05, // Trigger when 5% of section enters viewport
        rootMargin: '0px 0px -40px 0px'
    });
    revealElements.forEach(el => revealObserver.observe(el));

    // ----------------------------------------------------
    // 7. Premium Audio Synth Engine (Web Audio API)
    // ----------------------------------------------------
    let audioCtx = null;
    let ambientDrone = null;
    let ambientVolumeNode = null;
    let isSoundOn = false;

    const soundToggleBtn = document.getElementById('sound-toggle-btn');
    const soundOnSvg = document.querySelector('.sound-on-svg');
    const soundOffSvg = document.querySelector('.sound-off-svg');

    function initAudio() {
        if (audioCtx) return;
        
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContextClass();

        // Main gain volume node for mute/unmute control
        ambientVolumeNode = audioCtx.createGain();
        ambientVolumeNode.connect(audioCtx.destination);
        ambientVolumeNode.gain.setValueAtTime(0, audioCtx.currentTime);

        // 1. Cosmic Space Wind (Resonant Bandpass Filtered White Noise)
        const bufferSize = 2 * audioCtx.sampleRate;
        const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = audioCtx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const noiseFilter = audioCtx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.Q.setValueAtTime(3.5, audioCtx.currentTime);
        noiseFilter.frequency.setValueAtTime(400, audioCtx.currentTime);

        const windLFO = audioCtx.createOscillator();
        windLFO.frequency.setValueAtTime(0.04, audioCtx.currentTime); // Slow 0.04Hz modulation

        const windLFOGain = audioCtx.createGain();
        windLFOGain.gain.setValueAtTime(180, audioCtx.currentTime); // Sweeps center frequency +-180Hz

        const windGain = audioCtx.createGain();
        windGain.gain.setValueAtTime(0.005, audioCtx.currentTime); // Subtle space wind level

        // Connect wind path
        windLFO.connect(windLFOGain);
        windLFOGain.connect(noiseFilter.frequency);
        whiteNoise.connect(noiseFilter);
        noiseFilter.connect(windGain);
        windGain.connect(ambientVolumeNode);

        // Start wind components
        windLFO.start(0);
        whiteNoise.start(0);

        // 2. Ethereal Planetary Drone (Deep evolving space chord: 110Hz A2, 165Hz E3, 220Hz A3)
        const frequencies = [110.00, 165.00, 220.00];
        const lfoFreqs = [0.03, 0.05, 0.07];
        const baseGains = [0.004, 0.003, 0.002];
        const activeOscillators = [];

        for (let i = 0; i < frequencies.length; i++) {
            const osc = audioCtx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(frequencies[i], audioCtx.currentTime);

            const oscGain = audioCtx.createGain();
            oscGain.gain.setValueAtTime(baseGains[i], audioCtx.currentTime);

            // Independent slow amplitude modulations to simulate planetary orbits shifting
            const oscLFO = audioCtx.createOscillator();
            oscLFO.frequency.setValueAtTime(lfoFreqs[i], audioCtx.currentTime);

            const oscLFOGain = audioCtx.createGain();
            oscLFOGain.gain.setValueAtTime(baseGains[i] * 0.45, audioCtx.currentTime); // modulate up to 45% depth

            oscLFO.connect(oscLFOGain);
            oscLFOGain.connect(oscGain.gain);
            osc.connect(oscGain);
            oscGain.connect(ambientVolumeNode);

            osc.start(0);
            oscLFO.start(0);

            activeOscillators.push({ osc, oscGain, oscLFO, oscLFOGain });
        }

        // 3. Cosmic Pulsar Beacon (Pulsing carrier tone at 440Hz)
        const pulsar = audioCtx.createOscillator();
        pulsar.type = 'sine';
        pulsar.frequency.setValueAtTime(440, audioCtx.currentTime);

        const pulsarGain = audioCtx.createGain();
        pulsarGain.gain.setValueAtTime(0.0008, audioCtx.currentTime);

        const pulsarLFO = audioCtx.createOscillator();
        pulsarLFO.type = 'sine';
        pulsarLFO.frequency.setValueAtTime(0.12, audioCtx.currentTime); // slow pulse every ~8 seconds

        const pulsarLFOGain = audioCtx.createGain();
        pulsarLFOGain.gain.setValueAtTime(0.0006, audioCtx.currentTime); // pulse depth

        pulsarLFO.connect(pulsarLFOGain);
        pulsarLFOGain.connect(pulsarGain.gain);
        pulsar.connect(pulsarGain);
        pulsarGain.connect(ambientVolumeNode);

        pulsar.start(0);
        pulsarLFO.start(0);

        ambientDrone = { 
            whiteNoise, noiseFilter, windLFO, windLFOGain, windGain,
            activeOscillators, pulsar, pulsarGain, pulsarLFO, pulsarLFOGain
        };
    }

    function playTactileClick(type = 'click') {
        if (!isSoundOn || !audioCtx) return;

        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        if (type === 'hover') {
            // Ethereal star chime twinkle slide
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1800, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.04);
            gainNode.gain.setValueAtTime(0.006, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.04);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.04);
        } else if (type === 'copy') {
            // Premium cosmic confirmation chime (double fast high-pitch ping)
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
            osc.frequency.setValueAtTime(1600, audioCtx.currentTime + 0.06);
            gainNode.gain.setValueAtTime(0.008, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.18);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.18);
        } else {
            // Soft cosmic sonar ping
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.25);
            gainNode.gain.setValueAtTime(0.015, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.25);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.25);
        }
    }

    function toggleSoundState() {
        if (!audioCtx) {
            initAudio();
        }

        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        isSoundOn = !isSoundOn;
        localStorage.setItem('tb_sound_on', isSoundOn ? 'true' : 'false');

        if (isSoundOn) {
            if (ambientVolumeNode) {
                ambientVolumeNode.gain.linearRampToValueAtTime(0.012, audioCtx.currentTime + 0.6);
            }
            if (soundOnSvg) soundOnSvg.style.display = 'block';
            if (soundOffSvg) soundOffSvg.style.display = 'none';
            playTactileClick('click');
        } else {
            if (ambientVolumeNode) {
                ambientVolumeNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.4);
            }
            if (soundOnSvg) soundOnSvg.style.display = 'none';
            if (soundOffSvg) soundOffSvg.style.display = 'block';
        }
    }

    if (soundToggleBtn) {
        soundToggleBtn.addEventListener('click', toggleSoundState);

        // Default sound to off on page load (prevents browser autoplay blocks)
        isSoundOn = false;
        if (soundOnSvg) soundOnSvg.style.display = 'none';
        if (soundOffSvg) soundOffSvg.style.display = 'block';
    }

    // 8. Scroll-Aware HUD Dock Positioning (Prevents overlapping the footer)
    const footer = document.querySelector('.main-footer');
    const dockWrapper = document.querySelector('.hud-dock-wrapper');
    if (footer && dockWrapper) {
        const updateDockPosition = () => {
            const footerRect = footer.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            // If the footer is visible in the viewport, shift the dock up dynamically
            if (footerRect.top < viewportHeight) {
                const footerVisibleHeight = viewportHeight - footerRect.top;
                dockWrapper.style.bottom = `${footerVisibleHeight + 20}px`;
            } else {
                dockWrapper.style.bottom = ''; // Fallback to CSS default (64px desktop / 30px mobile)
            }
        };
        
        window.addEventListener('scroll', updateDockPosition, { passive: true });
        window.addEventListener('resize', updateDockPosition, { passive: true });
        updateDockPosition(); // Initial execution
    }

    // Event delegation for tactile clicks and hovers (including dock items, job tabs, badges, and copyable rows)
    const tactileSelectors = '.dock-item, .job-tab-btn, .skill-badge, .pub-link, .btn, .submit-btn, .sound-toggle-btn, .contact-link-row.copyable';
    
    document.addEventListener('mouseenter', (e) => {
        if (e.target && e.target.matches && e.target.matches(tactileSelectors)) {
            playTactileClick('hover');
        }
    }, true);

    document.addEventListener('click', (e) => {
        if (e.target && e.target.closest && e.target.closest(tactileSelectors)) {
            if (!e.target.closest('#sound-toggle-btn') && !e.target.closest('.copyable')) {
                playTactileClick('click');
            }
        }
    }, true);

    // Telemetry Click-to-Copy for Email and Phone Number
    const copyableElements = document.querySelectorAll('.contact-link-row.copyable');
    copyableElements.forEach(el => {
        el.addEventListener('click', () => {
            const textToCopy = el.getAttribute('data-copy');
            if (!textToCopy) return;

            navigator.clipboard.writeText(textToCopy).then(() => {
                // Play custom copy sound chime
                playTactileClick('copy');

                // Update tooltip text
                const tooltip = el.querySelector('.copy-tooltip');
                if (tooltip) {
                    tooltip.textContent = 'Copied!';
                    el.classList.add('copied');

                    // Reset tooltip text after 2 seconds
                    setTimeout(() => {
                        tooltip.textContent = 'Click to copy';
                        el.classList.remove('copied');
                    }, 2000);
                }
            }).catch(err => {
                console.error('Failed to copy text: ', err);
            });
        });
    });
});
