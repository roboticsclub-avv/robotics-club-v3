document.addEventListener('DOMContentLoaded', () => {
    /* --- Gallery Modal Logic --- */
    const galleryItems = document.querySelectorAll('.gallery-item');
    const galleryModal = document.getElementById('galleryModal');
    const modalImage = document.getElementById('modalImage');
    const modalTitle = document.getElementById('modalTitle');
    const modalDate = document.getElementById('modalDate');
    const closeModal = document.getElementById('closeModal');

    // Open Gallery Modal
    galleryItems.forEach(item => {
        item.addEventListener('click', () => {
            const img = item.querySelector('img');
            const title = item.querySelector('h3').innerText;
            const date = item.querySelector('p').innerText;

            modalImage.src = img.src;
            modalTitle.innerText = title;
            modalDate.innerText = date;

            galleryModal.style.display = 'flex';
            document.body.style.overflow = 'hidden'; // Prevent scrolling
        });
    });

    // Close Gallery Modal
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            galleryModal.style.display = 'none';
            document.body.style.overflow = 'auto'; // Enable scrolling
        });
    }

    // Close Gallery Modal on Outside Click
    window.addEventListener('click', (e) => {
        if (e.target === galleryModal) {
            galleryModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });

    /* --- Team Modal Logic --- */
    const teamModal = document.getElementById('teamModal');
    const closeTeamModal = document.getElementById('closeTeamModal');
    const teamModalImage = document.getElementById('teamModalImage');
    const teamModalName = document.getElementById('teamModalName');
    const teamModalRole = document.getElementById('teamModalRole');
    const teamModalBio = document.getElementById('teamModalBio');
    const teamModalResearch = document.getElementById('teamModalResearch');
    const viewProfileBtns = document.querySelectorAll('.view-profile-btn');

    // Team Data
    const teamData = {
        'shashwat': {
            name: 'SHASHWAT MISHRA',
            role: 'PRESIDENT',
            image: 'media/Shashwat.jpg',
            bio: 'Shashwat is a visionary leader with a passion for robotics and AI. He has led multiple successful projects and is dedicated to fostering a culture of innovation within the club.',
            research: 'Autonomous Navigation, Defence Robotics, Artificial Intelligence in Robotics.'
        },
        'desai': {
            name: 'DR. RAVISHANKAR P DESAI',
            role: 'FACULTY MENTOR',
            image: 'media/desai.png',
            bio: 'Dr. Desai is a distinguished professor with over 15 years of experience in robotics research. He provides invaluable guidance and mentorship to the club members.',
            research: 'Control Systems, Human-Robot Interaction, Industrial Automation.'
        },
        'yashashwini': {
            name: 'YASHASHWINI RAO',
            role: 'STUDENT MENTOR',
            image: 'media/Yashashwini.jpeg',
            bio: 'Yashashwini is an experienced senior member who loves teaching and mentoring juniors. She specializes in embedded systems and circuit design.',
            research: 'Embedded Systems, IoT, Signal Processing.'
        },
        'rithwik': {
            name: 'C RITHVIK BHASKAR',
            role: 'STUDENT MENTOR',
            image: 'media/Rithvik.jpeg',
            bio: ' AI-focused technologist passionate about impactful innovation.Combines leadership with strong execution to deliver real-world solutions.Driven to inspire teams and shape a smarter future.',
            research: 'Artificial Intelligence, Product-Focused ML, Real-World Deployment, Innovation.\n FORGE → Focus, Optimize, Research, Grow, Execute'
        },
        'nishanth': {
            name: 'AREKATLA NISHANTH',
            role: 'VICE PRESIDENT',
            image: 'media/Nishanth.jpeg',
            bio: 'Nishanth is known for his execution skills and operational excellence. He ensures that all club activities run smoothly and efficiently.',
            research: 'Mechanical Design, Kinematics, Rapid Prototyping.'
        },
        'thaslim': {
            name: 'SHAIK THASLIM',
            role: 'TREASURER',
            image: 'media/Thaslim.jpg',
            bio: 'Shaik Thaslim, an Artificial Intelligence student with experience in analytical thinking and problem-solving. As Treasurer, she ensures efficient management of resources while supporting technically driven initiatives within the club.',
            research: 'Applied AI, Intelligent Systems, Data-Driven Problem Solving.'
        },
        'charithasree': {
            name: 'CHARITHA SREE',
            role: 'GENERAL SECRETARY',
            image: 'media/Charitha.jpeg',
            bio: 'I’m Charitha Sree, a Computer Science student passionate about building impactful tech solutions. I work on full-stack development, AI-powered platforms, and competitive programming projects. I enjoy learning deeply, solving real-world problems, and constantly pushing my technical limits.',
            research: 'Full-stack Development, AI Platforms, Competitive Programming.'
        }
    };

    // Open Team Modal
    viewProfileBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const memberId = btn.getAttribute('data-id');
            const member = teamData[memberId];

            if (member) {
                teamModalImage.src = member.image;
                teamModalName.innerText = member.name;
                teamModalRole.innerText = member.role;
                teamModalBio.innerText = member.bio;
                teamModalResearch.innerText = member.research;

                teamModal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            }
        });
    });

    // Close Team Modal
    if (closeTeamModal) {
        closeTeamModal.addEventListener('click', () => {
            teamModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        });
    }

    // Close Team Modal on Outside Click
    window.addEventListener('click', (e) => {
        if (e.target === teamModal) {
            teamModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });

    /* --- Typewriter Animation Logic --- */
    const line1 = document.getElementById('line1');
    const line2 = document.getElementById('line2');
    const line3 = document.getElementById('line3');

    // Tagline sets
    const taglineSet1 = ['INNOVATE.', 'BUILD.', 'INSPIRE.'];
    const taglineSet2 = ['CODE.', 'CONSTRUCT.', 'CONQUER.'];

    let currentSet = 1; // Start with first set
    let currentLine = 0;
    let currentTexts = ['', '', '']; // Track text for each line
    let typingSpeed = 100; // milliseconds per character
    let erasingSpeed = 50; // milliseconds per character
    let pauseAfterTyping = 2500; // pause after all lines are typed
    let pauseAfterErasing = 800; // pause after all lines are erased

    function getCurrentTaglineSet() {
        return currentSet === 1 ? taglineSet1 : taglineSet2;
    }

    function getLineElement(lineIndex) {
        if (lineIndex === 0) return line1;
        if (lineIndex === 1) return line2;
        return line3;
    }

    function applyGradientToLine(lineElement, lineIndex, setIndex) {
        // Apply gradient to third line of both sets (INSPIRE. and CONQUER.)
        if (lineIndex === 2) {
            lineElement.classList.add('gradient-text');
        } else {
            lineElement.classList.remove('gradient-text');
        }
    }

    function typeText() {
        const taglineSet = getCurrentTaglineSet();
        const lineElement = getLineElement(currentLine);
        const targetText = taglineSet[currentLine];

        if (currentTexts[currentLine].length < targetText.length) {
            currentTexts[currentLine] = targetText.substring(0, currentTexts[currentLine].length + 1);
            lineElement.textContent = currentTexts[currentLine];
            lineElement.setAttribute('data-text', currentTexts[currentLine]);
            lineElement.classList.add('typing', 'active');
            applyGradientToLine(lineElement, currentLine, currentSet);
            setTimeout(typeText, typingSpeed);
        } else {
            // Finished typing this line
            lineElement.classList.remove('typing');

            // Move to next line
            currentLine++;

            if (currentLine < taglineSet.length) {
                // More lines to type
                setTimeout(typeText, 300);
            } else {
                // All lines typed, wait then erase all at once
                setTimeout(() => {
                    eraseAllLines();
                }, pauseAfterTyping);
            }
        }
    }

    function eraseAllLines() {
        const taglineSet = getCurrentTaglineSet();
        let allErased = true;

        // Add glitch effect to container
        const container = document.querySelector('.typewriter-container');
        container.classList.add('glitch-erase');

        // Erase all three lines simultaneously
        for (let i = 0; i < 3; i++) {
            const lineElement = getLineElement(i);

            if (currentTexts[i].length > 0) {
                currentTexts[i] = currentTexts[i].substring(0, currentTexts[i].length - 1);
                lineElement.textContent = currentTexts[i];
                lineElement.setAttribute('data-text', currentTexts[i]);
                lineElement.classList.add('erasing');
                allErased = false;
            }
        }

        if (!allErased) {
            setTimeout(eraseAllLines, erasingSpeed);
        } else {
            // All lines erased, remove classes and switch to next set
            for (let i = 0; i < 3; i++) {
                const lineElement = getLineElement(i);
                lineElement.classList.remove('erasing', 'active', 'gradient-text');
            }

            // Remove glitch effect
            container.classList.remove('glitch-erase');

            // Switch to next set
            currentLine = 0;
            currentSet = currentSet === 1 ? 2 : 1;
            currentTexts = ['', '', ''];

            setTimeout(() => {
                typeText();
            }, pauseAfterErasing);
        }
    }

    // Start the animation
    setTimeout(() => {
        typeText();
    }, 500); // Initial delay

    /* --- Gallery Modal openModal function (for onclick handlers) --- */
    window.openModal = function (imageSrc, title, date) {
        if (galleryModal && modalImage && modalTitle && modalDate) {
            modalImage.src = imageSrc;
            modalTitle.innerText = title;
            modalDate.innerText = date;
            galleryModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    };

    /* --- Mobile Menu Logic --- */
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const navLinks = document.getElementById('nav-links');

    if (mobileMenuButton && navLinks) {
        const toggleMenu = () => {
            navLinks.classList.toggle('hidden');
            navLinks.classList.toggle('flex');
            navLinks.classList.toggle('flex-col');
            navLinks.classList.toggle('absolute');
            navLinks.classList.toggle('top-16');
            navLinks.classList.toggle('left-0');
            navLinks.classList.toggle('w-full');
            navLinks.classList.toggle('bg-slate-900/95');
            navLinks.classList.toggle('p-6');
            navLinks.classList.toggle('border-b');
            navLinks.classList.toggle('border-cyan-500/30');
            navLinks.classList.toggle('space-y-4');

            const isMenuOpen = !navLinks.classList.contains('hidden');
            mobileMenuButton.setAttribute('aria-expanded', isMenuOpen ? 'true' : 'false');
        };

        mobileMenuButton.addEventListener('click', toggleMenu);

        // Close menu when a nav link is selected (mobile)
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth < 768 && !navLinks.classList.contains('hidden')) {
                    toggleMenu();
                }
            });
        });
    }
});
