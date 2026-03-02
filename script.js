import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const firebaseConfig = {
    projectId: "portfolio-site-db",
    appId: "1:1007349452987:web:531da8c895c69aca93599e",
    storageBucket: "portfolio-site-db.firebasestorage.app",
    apiKey: "AIzaSyCMCRFuxlDBTY7mYM5MORdZomqICNRBhEA",
    authDomain: "portfolio-site-db.firebaseapp.com",
    messagingSenderId: "1007349452987",
    projectNumber: "1007349452987"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', () => {
    // Load projects dynamically
    loadProjects();

    // Navbar scroll effect
    const navbar = document.getElementById('navbar');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Theme Toggle
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.addEventListener('click', (e) => {
        e.preventDefault();
        const currentTheme = document.documentElement.getAttribute('data-theme');
        if (currentTheme === 'light') {
            document.documentElement.removeAttribute('data-theme');
            themeToggle.textContent = '☀️/🌙'; // Or icon for light theme
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            themeToggle.textContent = '🌙/☀️'; // Or icon for dark theme
        }
    });

    // Form submission with Firebase
    const form = document.querySelector('.contact-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = form.querySelector('.submit-btn');
            const originalText = btn.textContent;

            const nameInput = document.getElementById('name').value;
            const emailInput = document.getElementById('email').value;
            const messageInput = document.getElementById('message').value;

            btn.textContent = 'Sending...';
            btn.style.opacity = '0.8';

            try {
                // Add a new document with a generated id.
                await addDoc(collection(db, "contacts"), {
                    name: nameInput,
                    email: emailInput,
                    message: messageInput,
                    timestamp: serverTimestamp()
                });

                btn.textContent = 'Message Sent!';
                btn.style.background = '#10b981'; // success color

                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.style.background = '';
                    btn.style.opacity = '1';
                    form.reset();
                }, 3000);
            } catch (error) {
                console.error("Error adding document: ", error);
                btn.textContent = 'Error Sending!';
                btn.style.background = '#ef4444'; // error color

                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.style.background = '';
                    btn.style.opacity = '1';
                }, 3000);
            }
        });
    }
});

async function loadProjects() {
    const projectGrid = document.getElementById('dynamic-project-grid');
    if (!projectGrid) return;

    try {
        const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            projectGrid.innerHTML = '<p style="text-align: center; width: 100%; grid-column: 1 / -1;">No projects found yet.</p>';
            return;
        }

        projectGrid.innerHTML = '';
        querySnapshot.forEach((document) => {
            const data = document.data();

            // Determine badge class
            let badgeClass = 'concept';
            if (data.status && data.status.toLowerCase().includes('finish')) {
                badgeClass = 'finished';
            }

            const cardHTML = `
                <div class="project-card">
                    <div class="project-image ${data.cssClass || ''}">
                        <span class="status-badge ${badgeClass}">${data.status}</span>
                    </div>
                    <div class="project-info">
                        <h3>${data.title}</h3>
                        <p>${data.description}</p>
                        <a href="#" class="read-more">${data.linkText} <span>→</span></a>
                    </div>
                </div>
            `;
            projectGrid.innerHTML += cardHTML;
        });
    } catch (error) {
        console.error("Error loading projects:", error);
        projectGrid.innerHTML = '<p style="text-align: center; width: 100%; grid-column: 1 / -1; color: #ef4444;">Error loading projects. Please try again later.</p>';
    }
}
