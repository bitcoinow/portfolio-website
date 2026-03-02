import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, query, orderBy } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

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
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginForm = document.getElementById('login-form');
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');

const addProjectForm = document.getElementById('add-project-form');
const projMsg = document.getElementById('proj-msg');
const projectsList = document.getElementById('projects-list');
const contactsList = document.getElementById('contacts-list');
const themeToggle = document.getElementById('theme-toggle');

// Auth State Listener
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in
        loginSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
        loadDashboardData();
    } else {
        // User is signed out
        dashboardSection.classList.add('hidden');
        loginSection.classList.remove('hidden');
        loginForm.reset();
    }
});

// Login Flow
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.style.display = 'none';
    const btn = loginForm.querySelector('.submit-btn');
    btn.textContent = 'Logging In...';

    try {
        await signInWithEmailAndPassword(auth, loginEmail.value, loginPassword.value);
        // onAuthStateChanged will handle UI swap
    } catch (error) {
        const errorMessage = error.message;
        loginError.textContent = errorMessage;
        loginError.style.display = 'block';
    } finally {
        btn.textContent = 'Log In';
    }
});

// Logout Flow
logoutBtn.addEventListener('click', () => {
    signOut(auth).then(() => {
        // Sign-out successful. UI handled by listener.
    }).catch((error) => {
        console.error("Logout Error:", error);
    });
});

// Load Dashboard Data
async function loadDashboardData() {
    loadProjects();
    loadContacts();
}

// Add New Project
addProjectForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = addProjectForm.querySelector('.submit-btn');
    btn.textContent = 'Adding...';
    btn.style.opacity = '0.8';
    projMsg.style.display = 'none';

    try {
        await addDoc(collection(db, "projects"), {
            title: document.getElementById('proj-title').value,
            description: document.getElementById('proj-desc').value,
            cssClass: document.getElementById('proj-css-class').value,
            status: document.getElementById('proj-status').value,
            linkText: document.getElementById('proj-link-text').value,
            createdAt: serverTimestamp()
        });

        btn.textContent = 'Project Added!';
        btn.style.background = '#10b981';

        addProjectForm.reset();
        loadProjects(); // Reload list

        setTimeout(() => {
            btn.textContent = 'Add Project';
            btn.style.background = '';
            btn.style.opacity = '1';
        }, 3000);

    } catch (error) {
        console.error("Error adding project: ", error);
        projMsg.textContent = "Error adding project: " + error.message;
        projMsg.style.color = '#ef4444';
        projMsg.style.display = 'block';
        btn.textContent = 'Error';
        setTimeout(() => { btn.textContent = 'Add Project'; }, 3000);
    }
});

// Load Projects from Firestore
async function loadProjects() {
    try {
        projectsList.innerHTML = '<li>Loading existing projects...</li>';
        const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            projectsList.innerHTML = '<li>No projects found. Add one above.</li>';
            return;
        }

        projectsList.innerHTML = '';
        querySnapshot.forEach((document) => {
            const data = document.data();
            const li = window.document.createElement('li');
            li.innerHTML = `
                <div class="item-content">
                    <h4>${data.title} <span style="font-size:0.8rem; background:#333; padding:2px 6px; border-radius:4px; margin-left:10px;">${data.status}</span></h4>
                    <p>${data.description}</p>
                    <p style="color: #666;">Class: ${data.cssClass} | Link: ${data.linkText}</p>
                </div>
                <button class="delete-btn" data-id="${document.id}" data-type="projects">Delete</button>
            `;
            projectsList.appendChild(li);
        });

        attachDeleteListeners();

    } catch (error) {
        console.error("Error loading projects: ", error);
        projectsList.innerHTML = `<li>Error loading projects: ${error.message}</li>`;
    }
}

// Load Contacts from Firestore
async function loadContacts() {
    try {
        contactsList.innerHTML = '<li>Loading messages...</li>';
        const q = query(collection(db, "contacts"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            contactsList.innerHTML = '<li>No messages found.</li>';
            return;
        }

        contactsList.innerHTML = '';
        querySnapshot.forEach((document) => {
            const data = document.data();
            const date = data.timestamp ? data.timestamp.toDate().toLocaleString() : 'Just now';
            const li = window.document.createElement('li');
            li.innerHTML = `
                <div class="item-content" style="max-width: 80%;">
                    <h4>${data.name} <span style="font-weight:normal; font-size:0.9rem; color:#666;">(${data.email})</span></h4>
                    <p>${data.message}</p>
                    <p style="color: #666; font-size: 0.8rem; margin-top:5px;">Received: ${date}</p>
                </div>
                <button class="delete-btn" data-id="${document.id}" data-type="contacts">Delete</button>
            `;
            contactsList.appendChild(li);
        });

        attachDeleteListeners();

    } catch (error) {
        console.error("Error loading contacts: ", error);
        contactsList.innerHTML = `<li>Error loading contacts: ${error.message}</li>`;
    }
}

function attachDeleteListeners() {
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if (confirm("Are you sure you want to delete this?")) {
                const id = e.target.getAttribute('data-id');
                const type = e.target.getAttribute('data-type');

                try {
                    e.target.textContent = 'Deleting...';
                    await deleteDoc(doc(db, type, id));
                    if (type === 'projects') loadProjects();
                    if (type === 'contacts') loadContacts();
                } catch (err) {
                    console.error("Error deleting document: ", err);
                    alert("Error deleting: " + err.message);
                    e.target.textContent = 'Delete';
                }
            }
        });
    });
}

// Theme Toggle logic for Admin Page 
if (themeToggle) {
    themeToggle.addEventListener('click', (e) => {
        e.preventDefault();
        const currentTheme = document.documentElement.getAttribute('data-theme');
        if (currentTheme === 'light') {
            document.documentElement.removeAttribute('data-theme');
            themeToggle.textContent = '☀️/🌙';
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            themeToggle.textContent = '🌙/☀️';
        }
    });
}
