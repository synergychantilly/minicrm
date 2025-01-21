import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { 
  getAuth, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import { 
  getDatabase,
  ref,
  onValue,
  push,
  set
} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDcz3F4mbJ87PiNuiOBx8QwDNHTeAIEefM",
  authDomain: "minicrm-4ae44.firebaseapp.com",
  databaseURL: "https://minicrm-4ae44-default-rtdb.firebaseio.com",
  projectId: "minicrm-4ae44",
  storageBucket: "minicrm-4ae44.appspot.com",
  messagingSenderId: "572080501512",
  appId: "1:572080501512:web:0040edf973e4e7a57d72bd",
  measurementId: "G-J0QCX0WVSD"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

onAuthStateChanged(auth, (user) => {
  if (user) {
    initCRM(user.uid);
  } else {
    window.location.href = '../index.html';
  }
});

async function initCRM(userId) {
  let currentTags = [];
  const contactsRef = ref(db, `users/${userId}/contacts`);

  // Real-time database listener
  onValue(contactsRef, (snapshot) => {
    const data = snapshot.val();
    const contacts = data ? Object.values(data) : [];
    renderContacts(contacts);
  }, (error) => {
    console.error("Database error:", error);
  });

  // DOM Elements
  const contactGrid = document.getElementById('contactGrid');
  const addUserBtn = document.getElementById('addUserBtn');
  const userModal = document.getElementById('userModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const contactForm = document.getElementById('contactForm');
  const tagsInput = document.getElementById('tagsInput');

  // Modal Handling
  addUserBtn.addEventListener('click', () => {
    userModal.style.display = 'flex';
    setTimeout(() => {
      userModal.classList.add('active');
    }, 10);
  });

  closeModalBtn.addEventListener('click', () => {
    userModal.classList.remove('active');
    setTimeout(() => {
      userModal.style.display = 'none';
    }, 300);
  });

  window.addEventListener('click', (e) => {
    if(e.target === userModal) {
      userModal.classList.remove('active');
      setTimeout(() => {
        userModal.style.display = 'none';
      }, 300);
    }
  });

  // Tag Management
  tagsInput.addEventListener('keydown', (e) => {
    if (e.key === ',' || e.key === 'Enter') {
      e.preventDefault();
      const tag = tagsInput.value.trim().replace(/,/g, '');
      if (tag) {
        currentTags.push(tag);
        tagsInput.value = '';
        renderTags();
      }
    }
  });

  function renderTags() {
    const container = document.querySelector('.tags-container');
    container.innerHTML = currentTags.map(tag => `
      <div class="tag">
        <span>${tag}</span>
        <span class="tag-remove" onclick="removeTag('${tag}')">&times;</span>
      </div>
    `).join('');
    container.appendChild(tagsInput);
  }

  window.removeTag = (tag) => {
    currentTags = currentTags.filter(t => t !== tag);
    renderTags();
  };

  // Form Submission
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const newContact = {
      name: document.getElementById('fullName').value,
      email: document.getElementById('email').value,
      phone: document.getElementById('phone').value,
      birthday: document.getElementById('birthDate').value,
      tags: [...currentTags],
      lastContacted: new Date().toISOString().split('T')[0]
    };

    try {
      const newContactRef = push(contactsRef);
      await set(newContactRef, newContact);
      
      currentTags = [];
      renderTags();
      userModal.classList.remove('active');
      setTimeout(() => {
        userModal.style.display = 'none';
      }, 300);
      contactForm.reset();
    } catch (error) {
      console.error("Save failed:", error);
      alert('Failed to save contact');
    }
  });

  function renderContacts(contacts) {
    contactGrid.innerHTML = contacts.map(contact => `
      <div class="contact-card">
        <h3>${contact.name}</h3>
        <div class="contact-details">
          <p><i class="fas fa-envelope"></i> ${contact.email}</p>
          ${contact.phone ? `<p><i class="fas fa-phone"></i> ${contact.phone}</p>` : ''}
          ${contact.birthday ? `<p class="clean-font"><i class="fas fa-birthday-cake"></i> ${formatBirthday(contact.birthday)}</p>` : ''}
          ${contact.tags?.length ? `
            <div class="tags-container">
              ${contact.tags.map(tag => `
                <div class="tag">
                  <span>${tag}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
        <div class="contact-actions">
          <button class="action-btn email-btn">
            <i class="fas fa-envelope-open-text"></i>
            Newsletter
          </button>
          <button class="action-btn birthday-btn">
            <i class="fas fa-gift"></i>
            Birthday
          </button>
        </div>
      </div>
    `).join('');

    updateMetrics(contacts);
  }

  function formatBirthday(dateString) {
    const options = { month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  }

  function isBirthdayThisMonth(birthday) {
    if(!birthday) return false;
    const now = new Date();
    const birthDate = new Date(birthday);
    return birthDate.getMonth() === now.getMonth();
  }

  function updateMetrics(contacts) {
    document.getElementById('totalContacts').textContent = contacts.length;
    document.getElementById('birthdayContacts').textContent = 
      contacts.filter(c => isBirthdayThisMonth(c.birthday)).length;
  }
}

// Logout Handler
document.getElementById('logoutBtn').addEventListener('click', async () => {
  try {
    await signOut(auth);
    window.location.href = '../index.html';
  } catch (error) {
    console.error('Logout error:', error);
    alert('Logout failed. Please check console for details.');
  }
});