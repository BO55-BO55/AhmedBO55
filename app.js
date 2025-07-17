// Import Firebase functions
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, signInWithCustomToken } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, updateDoc, addDoc, query, orderBy, deleteDoc } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-analytics.js';

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDyqlcmRXjWUMfiuHazKO-sQqVP507d2Ys",
    authDomain: "test-22147.firebaseapp.com",
    projectId: "test-22147",
    storageBucket: "test-22147.firebasestorage.app",
    messagingSenderId: "388613954141",
    appId: "1:388613954141:web:fae308213be5723a518bb4",
    measurementId: "G-KXW43B01EH"
};

// Initialize Firebase
let app, auth, db, analytics;
let currentUser = null;
let stream = null;
let scanInterval = null;

// Admin email
const ADMIN_EMAIL = "admin@roboticsclub.com";

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    analytics = getAnalytics(app);
    document.getElementById('configNotice').style.display = 'none';
} catch (error) {
    console.error('Firebase initialization error:', error);
    showAlert('loginAlert', 'Firebase initialization failed', 'error');
}

// DOM Elements
const navbar = document.getElementById('navbar');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const parentDashboard = document.getElementById('parentDashboard');
const adminDashboard = document.getElementById('adminDashboard');
const showSignupLink = document.getElementById('showSignup');
const showLoginLink = document.getElementById('showLogin');
const navLogoutBtn = document.getElementById('navLogoutBtn');
const qrScanner = document.getElementById('qrScanner');
const showScannerBtn = document.getElementById('showScannerBtn');
const cancelScanBtn = document.getElementById('cancelScanBtn');
const scannerVideo = document.getElementById('scannerVideo');
const printBadgeBtn = document.getElementById('printBadgeBtn');
const qrModal = document.getElementById('qrModal');


// Admin Elements
const usersList = document.getElementById('usersList');
const userEditor = document.getElementById('userEditor');
const editingUserName = document.getElementById('editingUserName');
const paymentStatusSelect = document.getElementById('paymentStatusSelect');
const lastPaymentInput = document.getElementById('lastPaymentInput');
const projectInput = document.getElementById('projectInput');
const progressInput = document.getElementById('progressInput');
const attendanceEditor = document.getElementById('attendanceEditor');
const saveUserChangesBtn = document.getElementById('saveUserChangesBtn');
const announcementForm = document.getElementById('announcementForm');

// State
let currentPage = 'login';
let selectedUserId = null;
let selectedUserData = null;
let allUsers = [];

const attendanceWeeks = [
    { id: 'week1', label: 'Week 1' }, { id: 'week2', label: 'Week 2' },
    { id: 'week3', label: 'Week 3' }, { id: 'week4', label: 'Week 4' },
    { id: 'week5', label: 'Week 5' }, { id: 'week6', label: 'Week 6' },
    { id: 'week7', label: 'Week 7' }, { id: 'week8', label: 'Week 8' }
];

// --- Event Listeners ---
function setupEventListeners() {
    showSignupLink.addEventListener('click', (e) => { e.preventDefault(); showSignupForm(); });
    showLoginLink.addEventListener('click', (e) => { e.preventDefault(); showLoginForm(); });
    document.getElementById('dashboardLink').addEventListener('click', (e) => { e.preventDefault(); showDashboard(); });
    document.getElementById('adminLink').addEventListener('click', (e) => { e.preventDefault(); showAdminPanel(); });
    navLogoutBtn.addEventListener('click', logout);
    document.getElementById('loginFormElement').addEventListener('submit', handleLogin);
    document.getElementById('signupFormElement').addEventListener('submit', handleSignup);
    saveUserChangesBtn.addEventListener('click', saveAllUserChanges);
    announcementForm.addEventListener('submit', handlePostAnnouncement);
    showScannerBtn.addEventListener('click', showScanner);
    cancelScanBtn.addEventListener('click', hideScanner);
    printBadgeBtn.addEventListener('click', showQrModal);
    qrModal.querySelector('.close-btn').addEventListener('click', hideQrModal);
    document.getElementById('printBtn').addEventListener('click', printBadge);
}

// --- Helper Functions ---
function showAlert(containerId, message, type = 'error') {
    const container = document.getElementById(containerId);
    if(container){
        container.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
        container.classList.remove('hidden');
        if (type === 'success') setTimeout(() => { container.innerHTML = ''; container.classList.add('hidden') }, 3000);
    }
}

function clearAlerts() {
    document.querySelectorAll('[id$="Alert"]').forEach(alert => alert.innerHTML = '');
}

function showLoading(buttonId, isLoading, defaultText = 'Submit') {
    const button = document.getElementById(buttonId);
    button.disabled = isLoading;
    button.textContent = isLoading ? 'Loading...' : defaultText;
}

// --- Page Navigation ---
function hideAllPages() {
    [loginForm, signupForm, parentDashboard, adminDashboard, navbar, qrScanner].forEach(el => el.classList.add('hidden'));
}

function showSignupForm() {
    hideAllPages();
    signupForm.classList.remove('hidden');
    clearAlerts();
    currentPage = 'signup';
}

function showLoginForm() {
    hideAllPages();
    loginForm.classList.remove('hidden');
    clearAlerts();
    currentPage = 'login';
}

async function showDashboard() {
    hideAllPages();
    navbar.classList.remove('hidden');
    if (isAdmin()) {
        adminDashboard.classList.remove('hidden');
        await loadAdminDashboard();
    } else {
        parentDashboard.classList.remove('hidden');
        await loadParentDashboard();
    }
    updateNavigation();
    currentPage = 'dashboard';
}

function showAdminPanel() {
    if (!isAdmin()) return;
    hideAllPages();
    navbar.classList.remove('hidden');
    adminDashboard.classList.remove('hidden');
    updateNavigation();
    currentPage = 'admin';
}

function isAdmin() {
    return currentUser && currentUser.email === ADMIN_EMAIL;
}

function updateNavigation() {
    document.getElementById('navUserEmail').textContent = currentUser.email;
    const adminLink = document.getElementById('adminLink');
    const dashboardLink = document.getElementById('dashboardLink');

    if (isAdmin()) {
        adminLink.classList.remove('hidden');
        dashboardLink.classList.toggle('active', currentPage === 'dashboard');
        adminLink.classList.toggle('active', currentPage === 'admin');
    } else {
        adminLink.classList.add('hidden');
        dashboardLink.classList.add('active');
    }
}

// --- Authentication ---
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    showLoading('loginBtn', true, 'Sign In');
    clearAlerts();
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        showAlert('loginAlert', 'Login failed: ' + error.message, 'error');
    } finally {
        showLoading('loginBtn', false, 'Sign In');
    }
}

async function handleSignup(e) {
    e.preventDefault();
    const email = document.getElementById('signupEmail').value;
    const childName = document.getElementById('childName').value;
    const parentName = document.getElementById('parentName').value;
    const password = document.getElementById('signupPassword').value;
    if (password !== document.getElementById('confirmPassword').value) {
        return showAlert('signupAlert', 'Passwords do not match', 'error');
    }
    showLoading('signupBtn', true, 'Create Account');
    clearAlerts();
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', userCredential.user.uid), {
            email, childName, parentName,
            paymentStatus: 'pending',
            lastPaymentDate: null,
            attendance: initializeAttendance(),
            currentProject: 'Not Assigned',
            projectProgress: 0,
            createdAt: new Date().toISOString()
        });
    } catch (error) {
        showAlert('signupAlert', 'Signup failed: ' + error.message, 'error');
    } finally {
        showLoading('signupBtn', false, 'Create Account');
    }
}

async function logout() {
    await signOut(auth);
    currentUser = null;
    selectedUserId = null;
    selectedUserData = null;
    allUsers = [];
    hideAllPages();
    showLoginForm();
}

// --- QR Code Functionality ---

function showScanner() {
    hideAllPages();
    qrScanner.classList.remove('hidden');
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then(s => {
            stream = s;
            scannerVideo.srcObject = stream;
            scannerVideo.onloadedmetadata = () => {
                scannerVideo.play();
                scanInterval = setInterval(tick, 200);
            };
        })
        .catch(err => {
            console.error("Error accessing camera", err);
            showAlert('scannerMessage', 'Could not access camera.', 'error');
        });
}

function hideScanner() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    clearInterval(scanInterval);
    hideAllPages();
    showLoginForm();
}

function tick() {
    if (scannerVideo.readyState === scannerVideo.HAVE_ENOUGH_DATA) {
        const canvasElement = document.createElement('canvas');
        const canvas = canvasElement.getContext('2d');
        canvasElement.height = scannerVideo.videoHeight;
        canvasElement.width = scannerVideo.videoWidth;
        canvas.drawImage(scannerVideo, 0, 0, canvasElement.width, canvasElement.height);
        const imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
        // Use window.jsQR to access the library from the module script
        const code = window.jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
        });

        if (code) {
            handleScannedCode(code.data);
        }
    }
}

async function handleScannedCode(token) {
    hideScanner();
    try {
        const userDoc = await getDoc(doc(db, "users", token));
        if (userDoc.exists()) {
            // This is a major security simplification for a client-side only demo.
            // It creates a "pseudo-session" by setting currentUser manually.
            // A real application should use a backend function to generate a custom auth token for signInWithCustomToken.
            if (!auth.currentUser) {
                showAlert('loginAlert', 'Login successful! Redirecting...', 'success');
                const user = { uid: token, email: userDoc.data().email };
                currentUser = user;
                showDashboard();
            }
        } else {
            showAlert('loginAlert', 'Invalid QR Code.', 'error');
        }
    } catch (e) {
        showAlert('loginAlert', 'Failed to process QR code.', 'error');
        console.error(e);
    }
}

async function showQrModal() {
    if (!selectedUserId || !selectedUserData) return;
    document.getElementById('badgeName').textContent = `Child: ${selectedUserData.childName} | Parent: ${selectedUserData.parentName}`;
    const canvas = document.getElementById('qrCanvas');
    // Use window.QRCode to access the library from the module script
    // In a real app, this should be a secure, single-use token.
    // For simplicity, we use the user's UID. THIS IS NOT SECURE FOR PRODUCTION.
    await window.QRCode.toCanvas(canvas, selectedUserId, { width: 200 });
    qrModal.classList.remove('hidden');
}

function hideQrModal() {
    qrModal.classList.add('hidden');
}

function printBadge() {
    const modalContent = qrModal.querySelector('.modal-content').innerHTML;
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Print Badge</title>');
    printWindow.document.write('<link rel="stylesheet" href="styles.css">'); // Optional: for styling
    printWindow.document.write('</head><body >');
    printWindow.document.write(modalContent);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 500);
}


// --- Data Initialization ---
function initializeAttendance() {
    return attendanceWeeks.reduce((acc, week) => ({ ...acc, [week.id]: null }), {});
}

// --- Parent Dashboard ---
async function loadParentDashboard() {
    if (!currentUser) return;
    try {
        const userData = await getUserData(currentUser.uid);
        if (userData) {
            document.getElementById('parentNameDisplay').textContent = userData.parentName || 'N/A';
            document.getElementById('childNameDisplay').textContent = userData.childName || 'N/A';
            loadPaymentStatus(userData);
            loadAttendanceDisplay(userData.attendance || {});
            loadProjectProgress(userData);
            await loadAnnouncements();
        }
    } catch (error) {
        console.error('Error loading parent dashboard:', error);
    }
}

function loadPaymentStatus(userData) {
    const statusText = document.getElementById('paymentText');
    const statusIndicator = document.getElementById('paymentStatus').querySelector('.status-indicator');
    statusIndicator.className = `status-indicator ${userData.paymentStatus || 'pending'}`;
    statusText.textContent = `Payment ${userData.paymentStatus || 'pending'}`;
    document.getElementById('lastPaymentDate').textContent = userData.lastPaymentDate || 'No payment recorded';
}

function loadAttendanceDisplay(attendance) {
    const grid = document.getElementById('attendanceGrid');
    grid.innerHTML = attendanceWeeks.map(week => {
        const status = attendance[week.id];
        const statusClass = status === true ? 'present' : status === false ? 'absent' : '';
        const statusIcon = status === true ? '✓' : status === false ? '✗' : '?';
        const statusText = status === true ? 'Present' : status === false ? 'Absent' : 'Not Set';
        return `
            <div class="attendance-week ${statusClass}">
                <h4>${week.label}</h4>
                <div class="attendance-status">${statusIcon}</div>
                <div class="attendance-text">${statusText}</div>
            </div>`;
    }).join('');
}

function loadProjectProgress(userData) {
    document.getElementById('projectNameDisplay').textContent = userData.currentProject || 'Not Assigned';
    const progress = userData.projectProgress || 0;
    const progressBar = document.getElementById('projectProgressBar');
    const progressText = document.getElementById('projectProgressText');
    progressBar.style.width = `${progress}%`;
    progressText.textContent = `${progress}% Complete`;
}

// --- Announcements ---
async function loadAnnouncements() {
    const list = document.getElementById('announcementsList');
    list.innerHTML = 'Loading announcements...';
    const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        list.innerHTML = '<p>No announcements yet.</p>';
        return;
    }
    list.innerHTML = snapshot.docs.map(doc => {
        const item = doc.data();
        const date = item.createdAt.toDate().toLocaleDateString();
        return `
            <div class="announcement-item">
                <h5>${item.title}</h5>
                <p>${item.content}</p>
                <div class="date">${date}</div>
            </div>`;
    }).join('');
}

// --- Admin Dashboard ---
async function loadAdminDashboard() {
    await loadAllUsers();
    await loadAdminAnnouncements();
}

async function loadAllUsers() {
    const usersCollection = collection(db, 'users');
    const snapshot = await getDocs(usersCollection);
    allUsers = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(user => user.email !== ADMIN_EMAIL);
    displayUsersList();
}

function displayUsersList() {
    usersList.innerHTML = allUsers.map(user => `
        <div class="user-card ${selectedUserId === user.id ? 'selected' : ''}" data-user-id="${user.id}">
            <h4>${user.childName || 'N/A'}</h4>
            <p><strong>Parent:</strong> ${user.parentName || 'N/A'}</p>
            <p><strong>Payment:</strong> <span class="status-indicator ${user.paymentStatus || 'pending'}"></span> ${user.paymentStatus || 'pending'}</p>
        </div>
    `).join('');
    usersList.querySelectorAll('.user-card').forEach(card => {
        card.addEventListener('click', () => selectUser(card.dataset.userId));
    });
}

function selectUser(userId) {
    selectedUserId = userId;
    selectedUserData = allUsers.find(user => user.id === userId);
    displayUsersList(); // Refresh to show selection
    showUserEditor();
}

function showUserEditor() {
    if (!selectedUserData) return;
    userEditor.classList.remove('hidden');
    editingUserName.textContent = selectedUserData.childName || 'Unknown';
    paymentStatusSelect.value = selectedUserData.paymentStatus || 'pending';
    lastPaymentInput.value = selectedUserData.lastPaymentDate || '';
    projectInput.value = selectedUserData.currentProject || '';
    progressInput.value = selectedUserData.projectProgress || 0;
    loadAttendanceEditor();
}

function loadAttendanceEditor() {
    attendanceEditor.innerHTML = attendanceWeeks.map(week => {
        const attendanceValue = selectedUserData.attendance?.[week.id];
        return `
            <div class="attendance-editor-week">
                <h5>${week.label}</h5>
                <div class="attendance-toggle">
                    <button type="button" class="attendance-btn ${attendanceValue === true ? 'active present' : ''}" data-week="${week.id}" data-status="present">Present</button>
                    <button type="button" class="attendance-btn ${attendanceValue === false ? 'active absent' : ''}" data-week="${week.id}" data-status="absent">Absent</button>
                </div>
            </div>`;
    }).join('');

    attendanceEditor.querySelectorAll('.attendance-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const weekId = e.target.dataset.week;
            const currentStatus = selectedUserData.attendance[weekId];
            const newStatus = e.target.dataset.status === 'present';
            // Toggle off if clicking the same button again
            selectedUserData.attendance[weekId] = (currentStatus === newStatus) ? null : newStatus;
            loadAttendanceEditor(); // Refresh display
        });
    });
}

async function saveAllUserChanges() {
    if (!selectedUserId || !selectedUserData) return;
    showLoading('saveUserChangesBtn', true, 'Save Changes');
    try {
        const updatedData = {
            paymentStatus: paymentStatusSelect.value,
            lastPaymentDate: lastPaymentInput.value,
            currentProject: projectInput.value,
            projectProgress: Number(progressInput.value),
            attendance: selectedUserData.attendance,
        };
        await updateDoc(doc(db, 'users', selectedUserId), updatedData);

        // Update local data and UI
        const userInList = allUsers.find(user => user.id === selectedUserId);
        Object.assign(userInList, updatedData);
        displayUsersList();
        
        showAlert('loginAlert', 'User updated successfully!', 'success');
    } catch (error) {
        console.error('Error saving changes:', error);
        showAlert('loginAlert', 'Failed to save changes', 'error');
    } finally {
        showLoading('saveUserChangesBtn', false, 'Save Changes');
    }
}

async function handlePostAnnouncement(e) {
    e.preventDefault();
    const title = document.getElementById('announcementTitle').value;
    const content = document.getElementById('announcementContent').value;
    showLoading('postAnnouncementBtn', true, 'Post');
    try {
        await addDoc(collection(db, "announcements"), {
            title,
            content,
            createdAt: new Date()
        });
        announcementForm.reset();
        await loadAdminAnnouncements();
    } catch (error) {
        console.error("Error adding announcement:", error);
    } finally {
        showLoading('postAnnouncementBtn', false, 'Post');
    }
}

async function loadAdminAnnouncements() {
    const list = document.getElementById('announcementsListAdmin');
    list.innerHTML = 'Loading...';
    const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        list.innerHTML = '<p>No announcements yet.</p>';
        return;
    }
    list.innerHTML = snapshot.docs.map(doc => {
        const item = doc.data();
        return `
        <div class="announcement-item-admin" data-id="${doc.id}">
            <div class="content">
                <h5>${item.title}</h5>
                <p>${item.content.substring(0, 50)}...</p>
            </div>
            <button class="delete-btn">X</button>
        </div>`;
    }).join('');

    list.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const docId = e.target.closest('.announcement-item-admin').dataset.id;
            if (confirm('Are you sure you want to delete this announcement?')) {
                await deleteDoc(doc(db, "announcements", docId));
                await loadAdminAnnouncements();
            }
        });
    });
}

// --- Utility Functions ---
async function getUserData(userId) {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
}

// --- Auth State Observer ---
if (auth) {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            await showDashboard();
        } else {
            hideAllPages();
            showLoginForm();
        }
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
});
