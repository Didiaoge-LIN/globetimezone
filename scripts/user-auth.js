// ===== GlobeTimeZone User Auth System =====
// localStorage-based MVP with Firebase integration stubs
// Replace FIREBASE_CONFIG with real values when Firebase project is created

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBRvbtYaiu125NP9RfdltdWKdzYz-8LAwg",
  authDomain: "globetimezone.firebaseapp.com",
  projectId: "globetimezone",
  storageBucket: "globetimezone.firebasestorage.app",
  messagingSenderId: "648299486520",
  appId: "1:648299486520:web:3677a1b2e6fbd47928f5cd",
  measurementId: "G-EJ7EE72P7P"
};

// ===== Firebase SDK Initialization =====
let firebaseReady = false;
let firebaseAuth = null;
let firebaseDb = null;

try {
  if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length === 0) {
    firebase.initializeApp(FIREBASE_CONFIG);
    firebaseAuth = firebase.auth();
    firebaseDb = firebase.firestore();
    firebaseReady = true;
    console.log('🔥 Firebase connected - cloud sync enabled');
  } else if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
    firebaseAuth = firebase.auth();
    firebaseDb = firebase.firestore();
    firebaseReady = true;
  } else {
    console.log('📦 Firebase SDK not loaded, running in local mode');
  }
} catch (e) {
  console.warn('⚠️ Firebase init failed, falling back to local mode:', e.message);
  firebaseReady = false;
}

const AUTH_STORAGE_KEY = 'gtz_user';
const USER_CITIES_KEY = 'gtz_saved_cities';

class UserAuthManager {
  constructor() {
    this.currentUser = this.loadUser();
    this.onAuthChangeCallbacks = [];
  }

  loadUser() {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  saveUser(user) {
    this.currentUser = user;
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
    this.notifyCallbacks();
  }

  isLoggedIn() {
    return this.currentUser !== null;
  }

  getUser() {
    return this.currentUser;
  }

  onAuthChange(callback) {
    this.onAuthChangeCallbacks.push(callback);
    // Immediately call with current state
    callback(this.currentUser);
  }

  notifyCallbacks() {
    this.onAuthChangeCallbacks.forEach(cb => cb(this.currentUser));
  }

  async registerWithEmail(email, password, displayName) {
    // Validate
    if (!email || !password) {
      throw new Error('Email and password are required');
    }
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Invalid email format');
    }

    // Firebase cloud mode
    if (firebaseReady && firebaseAuth) {
      try {
        const credential = await firebaseAuth.createUserWithEmailAndPassword(email, password);
        await credential.user.updateProfile({ displayName: displayName || email.split('@')[0] });
        const user = {
          uid: credential.user.uid,
          email: credential.user.email,
          displayName: credential.user.displayName || displayName || email.split('@')[0],
          photoURL: credential.user.photoURL,
          createdAt: new Date().toISOString(),
          provider: 'email',
          lastLogin: new Date().toISOString()
        };
        this.saveLocalUser(user);
        this.saveUser(user);
        return user;
      } catch (err) {
        throw new Error(this.translateFirebaseError(err.code));
      }
    }

    // Local fallback
    const existingUsers = this.getAllLocalUsers();
    if (existingUsers.find(u => u.email === email)) {
      throw new Error('An account with this email already exists');
    }

    // Create user
    const user = {
      uid: 'local_' + Date.now().toString(36) + Math.random().toString(36).substr(2),
      email: email,
      displayName: displayName || email.split('@')[0],
      photoURL: null,
      createdAt: new Date().toISOString(),
      provider: 'email',
      lastLogin: new Date().toISOString()
    };

    // Store password (hashed in real implementation, plain for localStorage MVP)
    user._passwordHash = this.hashPassword(password);
    this.saveLocalUser(user);
    this.saveUser(user);
    return user;
  }

  async loginWithEmail(email, password) {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    // Firebase cloud mode
    if (firebaseReady && firebaseAuth) {
      try {
        const credential = await firebaseAuth.signInWithEmailAndPassword(email, password);
        const fbUser = credential.user;
        const user = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || email.split('@')[0],
          photoURL: fbUser.photoURL,
          createdAt: fbUser.metadata.creationTime || new Date().toISOString(),
          provider: 'email',
          lastLogin: new Date().toISOString()
        };
        this.saveLocalUser(user);
        this.saveUser(user);
        return user;
      } catch (err) {
        throw new Error(this.translateFirebaseError(err.code));
      }
    }

    // Local fallback
    const existingUsers = this.getAllLocalUsers();
    const user = existingUsers.find(u => u.email === email);

    if (!user) {
      throw new Error('No account found with this email');
    }
    if (user._passwordHash !== this.hashPassword(password)) {
      throw new Error('Incorrect password');
    }

    user.lastLogin = new Date().toISOString();
    this.saveLocalUser(user);
    this.saveUser(user);
    return user;
  }

  async loginWithGoogle() {
    // Firebase cloud mode with Google Auth popup
    if (firebaseReady && firebaseAuth) {
      try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await firebaseAuth.signInWithPopup(provider);
        const fbUser = result.user;
        const user = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || 'Google User',
          photoURL: fbUser.photoURL,
          createdAt: fbUser.metadata.creationTime || new Date().toISOString(),
          provider: 'google',
          lastLogin: new Date().toISOString()
        };
        this.saveLocalUser(user);
        this.saveUser(user);
        return user;
      } catch (err) {
        if (err.code === 'auth/popup-closed-by-user') {
          throw new Error('Sign-in popup was closed. Please try again.');
        }
        throw new Error(this.translateFirebaseError(err.code));
      }
    }

    // Local fallback (simulated Google login)
    const user = {
      uid: 'google_' + Date.now().toString(36),
      email: 'google.user@gmail.com',
      displayName: 'Google User',
      photoURL: null,
      createdAt: new Date().toISOString(),
      provider: 'google',
      lastLogin: new Date().toISOString()
    };

    this.saveLocalUser(user);
    this.saveUser(user);
    return user;
  }

  logout() {
    // Firebase cloud sign out
    if (firebaseReady && firebaseAuth) {
      firebaseAuth.signOut().catch(e => console.warn('Firebase sign out error:', e));
    }
    this.saveUser(null);
    localStorage.removeItem(USER_CITIES_KEY);
  }

  // Local user storage (simulates Firestore)
  getAllLocalUsers() {
    try {
      const stored = localStorage.getItem('gtz_all_users');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  saveLocalUser(user) {
    const users = this.getAllLocalUsers();
    const index = users.findIndex(u => u.uid === user.uid);
    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }
    localStorage.setItem('gtz_all_users', JSON.stringify(users));
  }

  hashPassword(password) {
    // Simple hash for localStorage MVP - use bcrypt in production
    let hash = 0;
    const str = 'gtz_salt_' + password;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return 'hash_' + Math.abs(hash).toString(16);
  }

  translateFirebaseError(code) {
    const map = {
      'auth/email-already-in-use': 'An account with this email already exists',
      'auth/invalid-email': 'Invalid email format',
      'auth/user-disabled': 'This account has been disabled',
      'auth/user-not-found': 'No account found with this email',
      'auth/wrong-password': 'Incorrect password',
      'auth/weak-password': 'Password must be at least 6 characters',
      'auth/too-many-requests': 'Too many attempts. Please try again later',
      'auth/network-request-failed': 'Network error. Please check your connection',
      'auth/popup-blocked': 'Pop-up blocked. Please allow pop-ups for this site',
      'auth/cancelled-popup-request': 'Sign-in cancelled',
      'auth/account-exists-with-different-credential': 'An account with this email already exists using a different sign-in method',
      'auth/operation-not-allowed': 'This sign-in method is not enabled. Please contact support'
    };
    return map[code] || 'An unexpected error occurred. Please try again';
  }
}

// ===== Auth UI Component =====
class AuthUIManager {
  constructor(authManager) {
    this.auth = authManager;
    this.modalVisible = false;
    this.initUI();
    this.auth.onAuthChange((user) => this.updateAuthUI(user));
  }

  initUI() {
    // Create auth button in header
    this.createAuthButton();
    // Create modal (hidden by default)
    this.createAuthModal();
  }

  createAuthButton() {
    const nav = document.querySelector('header nav');
    if (!nav) return;

    // If button already exists in HTML, just attach click listener
    const existingBtn = document.getElementById('auth-trigger-btn');
    if (existingBtn) {
      existingBtn.addEventListener('click', () => this.showModal());
      return;
    }

    const authBtn = document.createElement('span');
    authBtn.id = 'auth-btn-container';
    authBtn.style.cssText = 'margin-left:8px;';
    authBtn.innerHTML = `
      <button id="auth-trigger-btn" class="btn btn-sm" style="
        padding:8px 16px;
        border-radius:8px;
        border:1px solid var(--border);
        background:var(--primary);
        color:white;
        font-size:0.9rem;
        font-weight:600;
        cursor:pointer;
        transition:all 0.2s;
      ">Login</button>
    `;

    nav.appendChild(authBtn);
    document.getElementById('auth-trigger-btn').addEventListener('click', () => this.showModal());
  }

  createAuthModal() {
    const modal = document.createElement('div');
    modal.id = 'auth-modal';
    modal.className = 'auth-modal';
    modal.style.cssText = `
      display:none;
      position:fixed;
      inset:0;
      z-index:9999;
      background:rgba(0,0,0,0.5);
      align-items:center;
      justify-content:center;
      backdrop-filter:blur(4px);
    `;
    modal.addEventListener('click', (e) => {
      if (e.target === modal) this.hideModal();
    });

    modal.innerHTML = `
      <div class="auth-card" style="
        background:white;
        border-radius:16px;
        padding:32px;
        width:100%;
        max-width:420px;
        box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);
        position:relative;
        animation:slideUp 0.3s ease;
      ">
        <button id="auth-close-btn" style="
          position:absolute;
          top:16px;
          right:16px;
          border:none;
          background:none;
          font-size:1.5rem;
          cursor:pointer;
          color:var(--text-muted);
          line-height:1;
        ">&times;</button>

        <div id="auth-form-container">
          <div style="text-align:center;margin-bottom:24px;">
            <div style="font-size:2.5rem;margin-bottom:8px;">🌍</div>
            <h2 style="font-size:1.5rem;font-weight:700;color:var(--secondary);">Welcome to GlobeTimeZone</h2>
            <p style="color:var(--text-muted);font-size:0.9rem;margin-top:4px;">Save your cities and sync across devices</p>
          </div>

          <!-- Tab Switcher -->
          <div id="auth-tabs" style="display:flex;gap:4px;margin-bottom:24px;background:var(--bg);border-radius:10px;padding:4px;">
            <button class="auth-tab active" data-tab="login" style="
              flex:1;padding:10px;border:none;border-radius:8px;cursor:pointer;
              font-weight:600;font-size:0.9rem;transition:all 0.2s;
            ">Login</button>
            <button class="auth-tab" data-tab="register" style="
              flex:1;padding:10px;border:none;border-radius:8px;cursor:pointer;
              font-weight:500;font-size:0.9rem;transition:all 0.2s;
              background:transparent;color:var(--text-muted);
            ">Register</button>
          </div>

          <!-- Login Form -->
          <div id="login-form" class="auth-form">
            <div class="auth-error" id="login-error" style="display:none;color:#ef4444;font-size:0.85rem;margin-bottom:12px;padding:8px 12px;background:#fef2f2;border-radius:8px;"></div>
            <div style="margin-bottom:16px;">
              <label style="display:block;font-size:0.85rem;font-weight:600;color:var(--secondary);margin-bottom:6px;">Email</label>
              <input type="email" id="login-email" placeholder="you@email.com" style="width:100%;padding:10px 14px;border:1px solid var(--border);border-radius:8px;font-size:0.95rem;outline:none;" />
            </div>
            <div style="margin-bottom:16px;">
              <label style="display:block;font-size:0.85rem;font-weight:600;color:var(--secondary);margin-bottom:6px;">Password</label>
              <input type="password" id="login-password" placeholder="Your password" style="width:100%;padding:10px 14px;border:1px solid var(--border);border-radius:8px;font-size:0.95rem;outline:none;" />
            </div>
            <button id="login-submit-btn" style="
              width:100%;padding:12px;border:none;border-radius:8px;
              background:var(--primary);color:white;font-size:1rem;font-weight:600;
              cursor:pointer;transition:all 0.2s;
            ">Login</button>
          </div>

          <!-- Register Form -->
          <div id="register-form" class="auth-form" style="display:none;">
            <div class="auth-error" id="register-error" style="display:none;color:#ef4444;font-size:0.85rem;margin-bottom:12px;padding:8px 12px;background:#fef2f2;border-radius:8px;"></div>
            <div style="margin-bottom:16px;">
              <label style="display:block;font-size:0.85rem;font-weight:600;color:var(--secondary);margin-bottom:6px;">Name</label>
              <input type="text" id="register-name" placeholder="Your name" style="width:100%;padding:10px 14px;border:1px solid var(--border);border-radius:8px;font-size:0.95rem;outline:none;" />
            </div>
            <div style="margin-bottom:16px;">
              <label style="display:block;font-size:0.85rem;font-weight:600;color:var(--secondary);margin-bottom:6px;">Email</label>
              <input type="email" id="register-email" placeholder="you@email.com" style="width:100%;padding:10px 14px;border:1px solid var(--border);border-radius:8px;font-size:0.95rem;outline:none;" />
            </div>
            <div style="margin-bottom:16px;">
              <label style="display:block;font-size:0.85rem;font-weight:600;color:var(--secondary);margin-bottom:6px;">Password</label>
              <input type="password" id="register-password" placeholder="Min 6 characters" style="width:100%;padding:10px 14px;border:1px solid var(--border);border-radius:8px;font-size:0.95rem;outline:none;" />
            </div>
            <button id="register-submit-btn" style="
              width:100%;padding:12px;border:none;border-radius:8px;
              background:var(--primary);color:white;font-size:1rem;font-weight:600;
              cursor:pointer;transition:all 0.2s;
            ">Create Account</button>
          </div>

          <!-- Divider -->
          <div style="display:flex;align-items:center;gap:12px;margin:20px 0;">
            <div style="flex:1;height:1px;background:var(--border);"></div>
            <span style="color:var(--text-muted);font-size:0.85rem;">or</span>
            <div style="flex:1;height:1px;background:var(--border);"></div>
          </div>

          <!-- Google Login -->
          <button id="google-login-btn" style="
            width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;
            background:white;font-size:0.95rem;font-weight:500;
            cursor:pointer;transition:all 0.2s;display:flex;align-items:center;
            justify-content:center;gap:8px;
          ">
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </button>

          <p style="text-align:center;color:var(--text-muted);font-size:0.75rem;margin-top:16px;">
            By continuing, you agree to our <a href="pages/privacy.html">Privacy Policy</a>
          </p>
        </div>

        <!-- Logged in state -->
        <div id="auth-logged-in" style="display:none;text-align:center;">
          <div style="font-size:3rem;margin-bottom:12px;">👤</div>
          <h3 style="font-size:1.2rem;font-weight:700;color:var(--secondary);" id="auth-user-name"></h3>
          <p style="color:var(--text-muted);font-size:0.9rem;margin-top:4px;" id="auth-user-email"></p>
          <div style="display:flex;gap:8px;margin-top:20px;justify-content:center;flex-wrap:wrap;">
            <button id="auth-logout-btn" style="
              padding:10px 20px;border:1px solid #ef4444;border-radius:8px;
              cursor:pointer;font-weight:600;color:#ef4444;background:white;font-size:0.9rem;
            ">Logout</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Event listeners
    document.getElementById('auth-close-btn').addEventListener('click', () => this.hideModal());

    // Tab switching
    modal.querySelectorAll('.auth-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });

    // Form submissions
    document.getElementById('login-submit-btn').addEventListener('click', () => this.handleLogin());
    document.getElementById('register-submit-btn').addEventListener('click', () => this.handleRegister());
    document.getElementById('google-login-btn').addEventListener('click', () => this.handleGoogleLogin());
    document.getElementById('auth-logout-btn').addEventListener('click', () => this.handleLogout());

    // Enter key submits
    ['login-email', 'login-password'].forEach(id => {
      document.getElementById(id)?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.handleLogin();
      });
    });
    ['register-email', 'register-password', 'register-name'].forEach(id => {
      document.getElementById(id)?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.handleRegister();
      });
    });
  }

  showModal() {
    const modal = document.getElementById('auth-modal');
    if (!modal) return;
    
    if (this.auth.isLoggedIn()) {
      document.getElementById('auth-form-container').style.display = 'none';
      document.getElementById('auth-logged-in').style.display = 'block';
      document.getElementById('auth-user-name').textContent = this.auth.getUser().displayName;
      document.getElementById('auth-user-email').textContent = this.auth.getUser().email;
    } else {
      document.getElementById('auth-form-container').style.display = 'block';
      document.getElementById('auth-logged-in').style.display = 'none';
      this.switchTab('login');
    }
    
    modal.style.display = 'flex';
  }

  hideModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.style.display = 'none';
  }

  switchTab(tab) {
    const tabs = document.querySelectorAll('.auth-tab');
    tabs.forEach(t => {
      if (t.dataset.tab === tab) {
        t.classList.add('active');
        t.style.background = 'white';
        t.style.color = 'var(--secondary)';
        t.style.fontWeight = '600';
        t.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
      } else {
        t.classList.remove('active');
        t.style.background = 'transparent';
        t.style.color = 'var(--text-muted)';
        t.style.fontWeight = '500';
        t.style.boxShadow = 'none';
      }
    });

    document.getElementById('login-form').style.display = tab === 'login' ? 'block' : 'none';
    document.getElementById('register-form').style.display = tab === 'register' ? 'block' : 'none';
    
    // Clear errors
    document.getElementById('login-error').style.display = 'none';
    document.getElementById('register-error').style.display = 'none';
  }

  async handleLogin() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');

    try {
      await this.auth.loginWithEmail(email, password);
      errorEl.style.display = 'none';
      this.hideModal();
      showToast('Welcome back, ' + this.auth.getUser().displayName + '!', 'success');
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.style.display = 'block';
    }
  }

  async handleRegister() {
    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const errorEl = document.getElementById('register-error');

    try {
      await this.auth.registerWithEmail(email, password, name);
      errorEl.style.display = 'none';
      this.hideModal();
      showToast('Account created! Welcome, ' + this.auth.getUser().displayName + '!', 'success');
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.style.display = 'block';
    }
  }

  async handleGoogleLogin() {
    try {
      await this.auth.loginWithGoogle();
      this.hideModal();
      showToast('Signed in with Google! (Simulated)', 'success');
    } catch (err) {
      showToast('Login failed: ' + err.message, 'error');
    }
  }

  handleLogout() {
    this.auth.logout();
    this.hideModal();
    showToast('Logged out successfully', 'default');
  }

  updateAuthUI(user) {
    const btn = document.getElementById('auth-trigger-btn');
    if (!btn) return;

    if (user) {
      btn.textContent = user.displayName || 'Account';
      btn.style.background = 'var(--primary-light)';
      btn.style.color = 'var(--primary)';
      btn.style.border = '1px solid var(--primary)';
    } else {
      btn.textContent = 'Login';
      btn.style.background = 'var(--primary)';
      btn.style.color = 'white';
      btn.style.border = '1px solid var(--primary)';
    }
  }
}

// ===== Initialize =====
const userAuth = new UserAuthManager();
let authUI;

// Safe init: works whether DOM is already ready or not
(function initAuthUI() {
  function doInit() {
    try {
      authUI = new AuthUIManager(userAuth);
      console.log('✅ Auth UI initialized');
    } catch (e) {
      console.error('❌ Auth UI init failed:', e);
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', doInit);
  } else {
    doInit();
  }
})();

// Export for use in other scripts
window.userAuth = userAuth;
window.getAuthUI = () => authUI;
