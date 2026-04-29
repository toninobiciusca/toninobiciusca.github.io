document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Intro Video Handling
    const introOverlay = document.getElementById('intro-overlay');
    const introVideo = document.getElementById('intro-video');

    if (introOverlay && introVideo) {
        const endIntro = () => {
            introOverlay.classList.add('fade-out');
            setTimeout(() => {
                introOverlay.remove();
            }, 1200); // Match 1.2s transition duration
        };

        introVideo.playbackRate = 6; // Set to 6x for "much faster" feel
        introVideo.addEventListener('ended', endIntro);

        // Ensure it starts playing and speed is applied
        introVideo.play().catch(e => {
            console.warn("Autoplay prevented:", e);
            endIntro(); // Skip if blocked
        });

        // Safety timeout
        setTimeout(() => {
            if (!introOverlay.classList.contains('fade-out')) {
                endIntro();
            }
        }, 5000); // Shorter safety for 2x speed
    }
    // Navigation handling
    const nav = document.querySelector('.glass-nav');
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-links a');

    // Sticky Header logic
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }

        // ScrollSpy logic
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (pageYOffset >= (sectionTop - 150)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').includes(current)) {
                link.classList.add('active');
            }
        });
    });

    // Reveal animations on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal');
            }
        });
    }, observerOptions);

    const revealElements = document.querySelectorAll('.glass-card');
    revealElements.forEach(el => observer.observe(el));

    // GitHub API Integration
    async function fetchGitHubRepos() {
        const repoContainer = document.getElementById('github-repos');
        const username = 'toninobiciusca';

        try {
            const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=6`);
            const repos = await response.json();

            if (!Array.isArray(repos)) throw new Error('Could not fetch repos');

            repoContainer.innerHTML = '';

            repos.filter(repo => !repo.fork).forEach(repo => {
                const card = document.createElement('div');
                card.className = 'glass-card repo-card';

                // Color mapping for languages
                const langColors = {
                    'Java': '#b07219',
                    'TypeScript': '#3178c6',
                    'JavaScript': '#f1e05a',
                    'HTML': '#e34c26',
                    'CSS': '#563d7c',
                    'C': '#555555'
                };
                const langColor = langColors[repo.language] || '#86868b';

                card.innerHTML = `
                    <div class="repo-header">
                        <div class="repo-name">${repo.name}</div>
                        <p class="repo-desc">${repo.description || 'No description available.'}</p>
                    </div>
                    <div class="repo-footer">
                        <div class="repo-lang">
                            <span class="lang-dot" style="background-color: ${langColor}"></span>
                            <span>${repo.language || 'Plain Text'}</span>
                        </div>
                        <div class="repo-stars">
                            <span>★</span>
                            <span>${repo.stargazers_count}</span>
                        </div>
                        <a href="${repo.html_url}" target="_blank" class="pub-link" style="margin: 0">View →</a>
                    </div>
                `;

                repoContainer.appendChild(card);
                observer.observe(card); // Animate new cards
            });
        } catch (error) {
            console.error('Error fetching GitHub repos:', error);
            repoContainer.innerHTML = '<div class="loading-state">Failed to load repositories. View them directly on GitHub.</div>';
        }
    }

    fetchGitHubRepos();

    // Parallax effect for background
    document.addEventListener('mousemove', (e) => {
        const moveX = (e.clientX - window.innerWidth / 2) * 0.01;
        const moveY = (e.clientY - window.innerHeight / 2) * 0.01;

        const gradient = document.querySelector('.bg-gradient');
        if (gradient) {
            gradient.style.transform = `translate(${moveX}px, ${moveY}px)`;
        }
    });
});
