# Robotics Club Website - Phase 1

## Overview
This repository contains the source code for Phase 1 of the **Robotics Club** website system. This phase focuses on establishing a strong digital presence, showcasing our club's activities, and providing a platform for new member registration.

The design philosophy follows a **futuristic, glassmorphism aesthetic** with neon accents (Cyan, Purple, Green) to reflect our club's focus on innovation and intelligent automation.

## Vision & Theme
**Vision:** "To develop well-rounded solutions that integrate creativity, technology, and practicality for a smarter, automated future."

**Theme:** *"Innovate, Automate, and Elevate: Building the Future with AI for Robotics"*

## Features Implemented (Phase 1)

### 1. Public Landing Page (`index.html`)
The main entry point to our digital ecosystem, featuring:
- **Hero Section:** Dynamic typewriter effect ("INNOVATE. BUILD. INSPIRE.") and impactful call-to-action.
- **About & Mission:** Highlights our vision, theme, and key areas of interest (Sensor Integration, AI, etc.).
- **Project Spotlight:** Grid layout showcasing flagship projects like RoboCup and Drone Swarms.
- **Training Modules:** Interactive **Flip Cards** displaying our technical workshops (3D Printing, ROS 2, FPGA, etc.).
- **Core Team:** "Meet the Team" section with interactive **Modals** for detailed bios and research interests.
- **Gallery:** Auto-scrolling marquee of event photos with a lightbox modal view.
- **Responsive Design:** Fully optimized for mobile, tablet, and desktop screens.

### 2. Registration Portal (`join-us.html`)
A dedicated page for student recruitment:
- Futuristic form design with glassmorphism effects.
- Input fields for Student Details, Year, Branch, and Areas of Interest.
- Smooth form validation and submission UX.

### 3. Admin Dashboard (`dashboard.html`)
A basic administration interface for club management:
- **Overview:** Quick stats on total members, active projects, and upcoming events.
- **Member Management:** Table view to list and manage club members.
- **Project Tracking:** Status indicators for ongoing projects.

## Tech Stack
- **Structure:** HTML5 (Semantic)
- **Styling:** Tailwind CSS (via CDN for rapid development)
- **Interactivity:** Vanilla JavaScript (No heavy frameworks for Phase 1)
- **Font:** Google Fonts (`Inter` for body, `Orbitron` for headers)
- **Icons:** SVG Icons

## Setup & Usage
1. **Clone the Repository:**
   ```bash
   git clone <repository-url>
   ```
2. **Open the Website:**
   - Simply open `index.html` in any modern web browser.
   - For the registration page, navigate to `join-us.html`.
   - For the dashboard, navigate to `dashboard.html`.
3. **Note:** Since this project currently uses Tailwind via CDN, an internet connection is required for styles to load correctly.

## Future Roadmap

### Phase 2: Foundation & User System
*Tech Stack: Firebase (Auth, Firestore, Hosting)*
1.  **Authentication System:**
    *   **Admins:** Secure login for club management.
    *   **Members:** User profile creation with email-based login and unique Member ID generation.
2.  **Upcoming Events:**
    *   Dynamic container to display upcoming workshops and events.
    *   "Register Now" functionality.

### Phase 3: Operations & Automation
1.  **Hardware Inventory System:**
    *   Admin dashboard to track club assets (sensors, boards, drones).
    *   Real-time entries for hardware availability.
2.  **Allocation Record:**
    *   System to track component issuance to members.
3.  **Automated Mail System:**
    *   Auto-notifications for application status (Accepted/Rejected).
    *   Integration with university mail `roboticsclub@av.amrita.edu`.
