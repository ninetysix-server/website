// Cart System Variables
export let cartItems = JSON.parse(localStorage.getItem('cart')) || [];
export let cartCounter = cartItems.length; // Use `let` here

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    sendEmailVerification,
    sendPasswordResetEmail,
    updatePassword,
    deleteUser,
    reauthenticateWithCredential,
    EmailAuthProvider
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    deleteDoc,
    collection, 
    getDocs  
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCADBg6bzpMuII1xje5OvOaIz-2jtPcftQ",
    authDomain: "mylogin-f41d5.firebaseapp.com",
    projectId: "mylogin-f41d5",
    storageBucket: "mylogin-f41d5.firebasestorage.app",
    messagingSenderId: "806828163950",
    appId: "1:806828163950:web:2d6966fed3158fcc38b77f"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Auth state listener
auth.onAuthStateChanged(async user => {
    try {
        const profilePage = document.getElementById('profilePage');
        
        if (user) {
            await user.getIdToken(true);

            // Fetch user document from Firestore
            const userDoc = await getDoc(doc(db, "users", user.uid));
            const userData = userDoc.data();

            if (userData.role === 'admin') {
                // Redirect admin to a white page with the admin dashboard
                document.body.innerHTML = `
                    <div class="admin-page">
                        <h1></h1>
                        <div id="adminDashboard" class="admin-dashboard"></div>
                    </div>
                `;
                showAdminDashboard(); // Load the admin dashboard
            } else {
                // Regular user flow
                if (profilePage.style.display === 'block') {
                    document.getElementById('dashboard').style.display = 'block';
                    document.getElementById('authContainer').style.display = 'none';
                }
                await updateUserProfile(user);
            }
        } else {
            // No user is logged in
            if (profilePage.style.display === 'block') {
                document.getElementById('authContainer').style.display = 'block';
                document.getElementById('dashboard').style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Auth state error:', error);
        document.getElementById('userEmail').textContent = 'Error loading email address';
        document.getElementById('emailVerified').textContent = 'Verification status unavailable';
    }
});


// Fetch List of Users with Track Design Active
async function fetchUserList() {
    const userList = document.getElementById('userList');
    userList.innerHTML = '';

 const querySnapshot = await getDocs(collection(db, "users"));
querySnapshot.forEach((doc) => {
    const userData = doc.data();
    if (userData.trackDesignActive) {
        const userItem = document.createElement('div');
        userItem.className = 'user-item';
        
        // Split email at @ and format with line break
        const [emailUser, emailDomain] = userData.email.split('@');
        const formattedEmail = emailDomain 
            ? `${emailUser}@<wbr>${emailDomain}`
            : userData.email;
        
        userItem.innerHTML = `
            <p class="email-wrap">
                ${userData.username} (${formattedEmail})
            </p>
            <button onclick="manageUserDesign('${doc.id}')">Manage Design</button>
        `;
        userList.appendChild(userItem);
    }
});

// Add this CSS
const style = document.createElement('style');
style.textContent = `
    .email-wrap {
        white-space: normal;
    }
    .user-item p {
        line-height: 1.4;
    }
    wbr {
        display: inline-block;
    }
    @media (max-width: 768px) {
        .email-wrap {
            word-break: break-all;
        }
    }
`;
document.head.appendChild(style);

    // Show a message if no users are found
    if (userList.innerHTML === '') {
        userList.innerHTML = '<p>No active track design sessions at the moment.</p>';
    }
}

// Manage User Design
window.manageUserDesign = async function (userId) {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
        const userData = userDoc.data();

        // Show the user management section
        document.getElementById('userManagement').style.display = 'block';

        // Populate user info
        document.getElementById('manageUsername').textContent = userData.username;
        document.getElementById('manageEmail').textContent = userData.email;

        // Populate dropdowns with current values
        document.getElementById('adminDesignProgress').value = userData.designProgress || 'Preparing';
        document.getElementById('adminPaymentStatus').value = userData.paymentStatus || 'Not Paid';
        document.getElementById('adminDesignDuration').value = userData.designDuration || 'Pending';

        // Store the current user ID for saving changes
        window.currentManagedUserId = userId;
    }
};

// Save User Changes
window.saveUserChanges = async function () {
    const userId = window.currentManagedUserId;
    if (!userId) {
        alert('No user selected.');
        return;
    }

    try {
        const designProgress = document.getElementById('adminDesignProgress').value;
        const paymentStatus = document.getElementById('adminPaymentStatus').value;
        const designDuration = document.getElementById('adminDesignDuration').value;

        await setDoc(doc(db, "users", userId), {
            designProgress: designProgress,
            paymentStatus: paymentStatus,
            designDuration: designDuration
        }, { merge: true });

        alert('Changes saved successfully!');
    } catch (error) {
        console.error('Error saving changes:', error);
        alert('Failed to save changes. Please try again.');
    }
};

// End Session for a User
window.endSession = async function () {
    const userId = window.currentManagedUserId;
    if (!userId) {
        alert('No user selected.');
        return;
    }

    try {
        // Clear the user's cart and set trackDesignActive to false in Firestore
        await setDoc(doc(db, "users", userId), {
            trackDesignActive: false,
            cart: [], // Clear the cart
            designProgress: 'Preparing', // Reset design progress
            paymentStatus: 'Not Paid', // Reset payment status
            designDuration: 'Pending' // Reset design duration
        }, { merge: true });

        // If the user is currently logged in, clear their local storage and cart state
        const user = auth.currentUser;
        if (user && user.uid === userId) {
            localStorage.removeItem('cart'); // Clear local storage
            cartItems = []; // Clear the cartItems array
            updateCartCounterValue(0); // Reset the cart counter
            updateCartCounter(); // Update the cart counter UI

            // Optionally, you can also reload the page to ensure the UI is updated
            window.location.reload();
        }

        alert('Session ended successfully!');
        fetchUserList(); // Refresh the user list
        document.getElementById('userManagement').style.display = 'none'; // Hide the user management section
    } catch (error) {
        console.error('Error ending session:', error);
        alert('Failed to end session. Please try again.');
    }
};

const user = auth.currentUser;
if (user) {
    const userDocRef = doc(db, "users", user.uid);
    onSnapshot(userDocRef, (doc) => {
        const userData = doc.data();
        if (!userData.trackDesignActive) {
            // Clear local storage and update UI
            localStorage.removeItem('cart');
            cartItems = [];
            updateCartCounterValue(0);
            updateCartCounter();
            // Optionally, reload the page or update specific UI elements
        }
    });
}

// Show Admin Dashboard
window.showAdminDashboard = async function () {
    const adminDashboard = document.getElementById('adminDashboard');
    adminDashboard.innerHTML = `
    <div id="adminDashboard">
        <div class="admin-header">
            <h1><i class="fas fa-user-shield"></i> You are logged in as Admin</h1>
            <h2 class="admin-subtitle">Admin Dashboard</h2>
        </div>

        <div class="user-list" id="userList"></div>

        <!-- User Management Section -->
        <div id="userManagement" class="user-management" style="display: none;">
            <div class="management-header">
                <h2>Manage Design for <span id="manageUsername" class="highlight-name"></span></h2>
                <div class="user-email">
                    <i class="fas fa-envelope"></i> <span id="manageEmail"></span>
                </div>
            </div>

            <div class="form-group">
                <label for="adminDesignProgress"><i class="fas fa-tasks"></i> Design Progress:</label>
                <select id="adminDesignProgress" class="form-select">
                    <option value="Preparing">Preparing</option>
                    <option value="Designing">Designing</option>
                    <option value="Finalizing">Finalizing</option>
                    <option value="Finished">Finished</option>
                </select>
            </div>

            <div class="form-group">
                <label for="adminPaymentStatus"><i class="fas fa-credit-card"></i> Payment Status:</label>
                <select id="adminPaymentStatus" class="form-select">
                    <option value="Not Paid">Not Paid</option>
                    <option value="Paid">Paid</option>
                </select>
            </div>

            <div class="form-group">
                <label for="adminDesignDuration"><i class="fas fa-clock"></i> Design Duration:</label>
                <select id="adminDesignDuration" class="form-select">
                    <option value="Pending">Pending</option>
                    <option value="Weeks">Weeks</option>
                    <option value="Few Weeks">Few Weeks</option>
                    <option value="Days">Days</option>
                    <option value="Few Days">Few Days</option>
                    <option value="Hours">Hours</option>
                    <option value="Few Hours">Few Hours</option>
                    <option value="Almost Finished">Almost Finished</option>
                    <option value="Finished">Finished</option>
                </select>
            </div>

            <div class="action-buttons">
                <button onclick="saveUserChanges()" class="btn-save">
                    <i class="fas fa-save"></i> Save Changes
                </button>
                <button onclick="endSession()" class="btn-end">
                    <i class="fas fa-sign-out-alt"></i> End Session
                </button>
                <button onclick="showDesignRequest()" class="btn-design">
                    <i class="fas fa-pencil-ruler"></i> Design Request
                </button>
            </div>
        </div>

<!-- Final Fixed Design Request Popup -->
<div id="designRequestPopup" class="design-popup">
    <div class="popup-container">
        <div class="popup-content">
            <div class="popup-header">
                <h3><i class="fas fa-file-alt"></i> Design Request Details</h3>
            </div>
            <div id="designRequestContent" class="popup-body">
                <!-- Content will be inserted here dynamically -->
            </div>
            <div class="popup-footer">
                <button onclick="closeDesignRequestPopup()" class="btn-close-popup">
                    <i class="fas fa-times"></i> Close
                </button>
            </div>
        </div>
    </div>
</div>
    `;

    // Add truncation styles without affecting layout
    const style = document.createElement('style');
    style.textContent = `
        /* Only target the specific elements we want to truncate */
        #manageUsername, #manageEmail {
            display: inline-block;
            max-width: 120px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            vertical-align: bottom;
        }
        
        /* Show full text on hover without disrupting layout */
        #manageUsername:hover, #manageEmail:hover {
            overflow: visible;
            position: absolute;
            background: white;
            z-index: 1000;
            box-shadow: 0 0 5px rgba(0,0,0,0.2);
            max-width: 300px;
        }
    `;
    document.head.appendChild(style);

    await fetchUserList();
};


// Show Design Request Popup
window.showDesignRequest = async function () {
    const userId = window.currentManagedUserId;
    if (!userId) {
        alert('No user selected.');
        return;
    }

    try {
        // Fetch the user's document from Firestore
        const userDoc = await getDoc(doc(db, "users", userId));
        const userData = userDoc.data();

        // Get the cart items
        const cartItems = userData.cart || [];

        // Generate HTML for the cart items
        let cartHTML = '';
        let totalAmount = 0;

        cartItems.forEach((item) => {
            totalAmount += item.price;
            cartHTML += `
                <div class="cart-item">
                    <div class="item-details">
                        <h4>${item.title}</h4>
                        <p class="item-price"><strong>Price:</strong> R${item.price.toFixed(2)}</p>
                        ${item.description ? `<p class="item-description"><strong>Description:</strong> ${item.description}</p>` : ''}
                    </div>
                    ${item.imageUrl ? `
                        <div class="image-container">
                            <img src="${item.imageUrl}" alt="Design Sketch">
                        </div>
                    ` : ''}
                </div>
            `;
        });

        // Add total amount to the HTML
        cartHTML += `<p class="total-amount"><strong>Total Amount:</strong> R${totalAmount.toFixed(2)}</p>`;

        // Display the cart items in the popup
        document.getElementById('designRequestContent').innerHTML = cartHTML;
        document.getElementById('designRequestPopup').style.display = 'block';
    } catch (error) {
        console.error('Error fetching design request:', error);
        alert('Failed to fetch design request. Please try again.');
    }
};

// Close Design Request Popup
window.closeDesignRequestPopup = function () {
    document.getElementById('designRequestPopup').style.display = 'none';
};

// UI Functions
window.showRegisterForm = () => {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    document.getElementById('passwordResetForm').style.display = 'none';
    clearErrors();
};

window.showLoginForm = () => {
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('passwordResetForm').style.display = 'none';
    clearErrors();
};

window.showPasswordReset = () => {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('passwordResetForm').style.display = 'block';
    clearErrors();
};

window.showAuth = () => {
    document.getElementById('profilePage').style.display = 'block';
    const user = auth.currentUser;

    if (user) {
        document.getElementById('dashboard').style.display = 'block';
        document.getElementById('authContainer').style.display = 'none';
        updateUserProfile(user); // Fetch and display cart data
    } else {
        document.getElementById('authContainer').style.display = 'block';
        document.getElementById('dashboard').style.display = 'none';
        showLoginForm();
    }
};

window.hideAuth = () => {
    document.getElementById('profilePage').style.display = 'none';
};

// Auth Functions
window.signInWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        await handleNewGoogleUser(user);
    } catch (error) {
        showError('loginError', error.message);
    }
};

window.signUp = async (e) => {
    e.preventDefault();
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const username = document.getElementById('registerName').value;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", userCredential.user.uid), { 
            username: username,
            email: email,
            created: new Date().toISOString(),
            cart: [] // Initialize an empty cart for new users
        });
        await sendEmailVerification(userCredential.user);
        alert('Verification email sent! Please check your inbox.');
    } catch (error) {
        console.error('Signup error:', error);
        showError('registerError', error.message);
    }
};

// Auth Functions - Modified to close session on success
window.signIn = async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        await updateUserProfile(userCredential.user);
        closeLoginSession(); // Add this line to close the session
    } catch (error) {
        showError('loginError', error.message);
    }
};

window.signInWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        await handleNewGoogleUser(user);
        await updateUserProfile(user);
        closeLoginSession(); // Add this line to close the session
    } catch (error) {
        showError('loginError', error.message);
    }
};

// Universal function to close login session
function closeLoginSession() {
    // Hide auth container and overlay
    document.getElementById('authContainer').style.display = 'none';
    document.querySelector('.profile-page-overlay').style.display = 'none';
    
    // Reset all forms
    resetAuthForms();
    
    // Clear any temporary auth data if needed
    localStorage.removeItem('tempAuthData');
}

// Helper function to reset all auth forms
function resetAuthForms() {
    // Show only login form
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('passwordResetForm').style.display = 'none';
    
    // Clear all input fields
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('registerName').value = '';
    document.getElementById('registerEmail').value = '';
    document.getElementById('registerPassword').value = '';
    document.getElementById('resetEmail').value = '';
    
    // Clear error messages
    document.getElementById('loginError').textContent = '';
    document.getElementById('registerError').textContent = '';
    document.getElementById('resetError').textContent = '';
}

// Update your existing hideAuth function to match
window.hideAuth = function() {
    closeLoginSession();
    document.getElementById('profilePage').style.display = 'none';
};

// Dashboard Functions
window.sendVerificationEmail = async () => {
    try {
        const user = auth.currentUser;
        await sendEmailVerification(user);
        await user.reload();
        await updateUserProfile(auth.currentUser);
        alert('Verification email sent! Status updated.');
    } catch (error) {
        alert(error.message);
    }
};

window.toggleSettings = () => {
    const settingsContainer = document.getElementById('settingsContainer');
    settingsContainer.classList.toggle('visible');
};

window.showChangePassword = () => {
    const passwordForm = document.getElementById('changePasswordForm');
    passwordForm.classList.toggle('visible');
};

window.changePassword = async () => {
    try {
        const newPassword = document.getElementById('newPassword').value;
        await updatePassword(auth.currentUser, newPassword);
        alert('Password updated successfully!');
        document.getElementById('changePasswordForm').classList.remove('visible');
    } catch (error) {
        showError('passwordError', error.message);
    }
};

window.deleteAccount = async () => {
    const password = prompt('Please enter your password to confirm deletion:');
    
    try {
        const credential = EmailAuthProvider.credential(
            auth.currentUser.email, 
            password
        );
        await reauthenticateWithCredential(auth.currentUser, credential);
        await deleteDoc(doc(db, "users", auth.currentUser.uid));
        await deleteUser(auth.currentUser);
        alert('Account deleted successfully!');
    } catch (error) {
        alert(error.message);
    }
};

window.signOut = () => auth.signOut();

// Helper Functions
async function handleNewGoogleUser(user) {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists()) {
        await setDoc(doc(db, "users", user.uid), { 
            username: user.displayName || user.email.split('@')[0],
            email: user.email,
            cart: [] // Initialize an empty cart for new Google users
        });
    }
    await updateUserProfile(user);
}

// Update User Profile Function
async function updateUserProfile(user) {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const userEmail = user.email || userDoc.data()?.email || 'Email not available';
    
    document.getElementById('username').textContent = userDoc.data()?.username || 'User';
    document.getElementById('userEmail').textContent = userEmail;
    document.getElementById('emailVerified').textContent = 
        user.emailVerified ? 'Verified ✓' : 'Not Verified';
    
    // Fetch cart data from Firestore
    const userData = userDoc.data();
    const cartItems = userData?.cart || [];
    const contentsState = document.querySelector('.contents-state');
    const emptyState = document.querySelector('.empty-state');
    
    if (cartItems.length > 0) {
        contentsState.style.display = 'block';
        emptyState.style.display = 'none';
        displayCartContents(cartItems);
    } else {
        contentsState.style.display = 'none';
        emptyState.style.display = 'block';
    }
}

// Display Cart Contents Function
function displayCartContents(cartItems) {
    const itemsList = document.querySelector('.cart-items-list');
    const totalElement = document.querySelector('.total-value-profile');
    
    // Clear existing items
    itemsList.innerHTML = '';
    
    // Populate items
    let total = 0;
    
    cartItems.forEach((item, index) => {
        total += item.price;
        
        const itemHTML = `
            <div class="cart-item-profile">
                <div class="item-header">
                    <h5>${item.title}</h5>
                    <span>R${item.price.toFixed(2)}</span>
                </div>
                
                ${item.description ? `
                <div class="item-description">
                    <strong>Description:</strong>
                    <p>${item.description}</p>
                </div>` : ''}
                
                ${item.imageUrl ? `
                <div class="item-image">
                    <img src="${item.imageUrl}" alt="Uploaded design sketch" 
                         class="img-fluid" style="max-width: 200px;">
                </div>` : ''}
            </div>
            <hr>
        `;
        
        itemsList.innerHTML += itemHTML;
    });
    
    // Update total
    totalElement.textContent = `R${total.toFixed(2)}`;
}

function clearErrors() {
    document.querySelectorAll('.error').forEach(el => el.textContent = '');
}

function showError(elementId, message) {
    document.getElementById(elementId).textContent = message;
}

// Clear Cart Function
window.clearCart = async () => {
    const user = auth.currentUser;

    if (user) {
        try {
            // Clear the cart in Firestore and set trackDesignActive: false
            await setDoc(doc(db, "users", user.uid), {
                cart: [], // Set cart to an empty array
                trackDesignActive: false, // Set trackDesignActive to false
                paymentMethod: null // Clear the payment method
            }, { merge: true });

            // Verify that the cart data was cleared successfully
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists() && userDoc.data().cart.length === 0) {
                // Update the UI to show the empty state
                const contentsState = document.querySelector('.contents-state');
                const emptyState = document.querySelector('.empty-state');
                contentsState.style.display = 'none';
                emptyState.style.display = 'block';

                // Clear the local cart data
                localStorage.removeItem('cart');
                cartItems.length = 0; // Clear the cartItems array
                updateCartCounterValue(0); // Reset the cart counter
                updateCartCounter(); // Update the cart counter UI

                alert('Cart and payment method cleared successfully!'); // Show success message
            } else {
                throw new Error('Cart data not cleared correctly.');
            }
        } catch (error) {
            console.error('Error clearing cart:', error.message); // Log the exact error message
            alert('Failed to clear cart. Please try again.');
        }
    } else {
        alert('You must be logged in to clear your cart.');
    }
};

//PAYMENT METHOD POPUP
// Function to submit payment choice to Firestore
window.submitPaymentChoice = async () => {
    const paymentType = document.querySelector('input[name="paymentType"]:checked');
    const user = auth.currentUser;

    if (!paymentType) {
        alert('Please select a payment method.');
        return;
    }

    if (user) {
        try {
            await setDoc(doc(db, "users", user.uid), {
                paymentMethod: paymentType.value
            }, { merge: true });

            alert('Payment method saved successfully!');
            document.getElementById('paymentPopup').style.display = 'none'; // Hide popup
        } catch (error) {
            console.error('Error saving payment method:', error.message);
            alert('Failed to save payment method. Please try again.');
        }
    } else {
        alert('You must be logged in to save your payment method.');
    }
};

// Fetch Design Progress from Firestore
async function fetchDesignProgress() {
    const user = auth.currentUser;

    if (user) {
        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                const data = userDoc.data();

                // Update Progress Bar
                const progressFill = document.getElementById('progressFill');
                const progressStages = ['Preparing', 'Designing', 'Finalizing', 'Finished'];
                const progressIndex = progressStages.indexOf(data.designProgress || 'Preparing');
                progressFill.style.width = `${(progressIndex + 1) * 25}%`;

                // Update Payment Status
                document.getElementById('paymentStatus').textContent = data.paymentStatus || 'Not Paid';

                // Update Design Duration
                document.getElementById('designDuration').textContent = data.designDuration || 'Weeks';
            }
        } catch (error) {
            console.error('Error fetching design progress:', error);
        }
    }
}

// Hide Track Design Section
window.hideTrackDesign = function () {
    document.getElementById('trackDesignSection').style.display = 'none';
};


// Export Firestore functions for use in other files
export { auth, db, setDoc, doc, getDoc, updateUserProfile };

// Function to update cartCounter
export function updateCartCounterValue(newValue) {
    cartCounter = newValue;
}

// Function to update cartCounter
export function updateCartCounter() {
    document.querySelectorAll('.cart-counter').forEach(el => {
        el.textContent = cartCounter;
    });
}




// Final Fixed JavaScript
function openDesignRequestPopup() {
    document.getElementById('designRequestPopup').classList.add('active');
    document.body.classList.add('popup-open');
}

function closeDesignRequestPopup() {
    document.getElementById('designRequestPopup').classList.remove('active');
    document.body.classList.remove('popup-open');
}

// Make sure to call these functions properly
document.addEventListener('DOMContentLoaded', function() {
    // Example of how to insert content
    const sampleContent = `
        <p>This is sample popup content</p>
        <img src="your-image.jpg" alt="Sample Image">
        <p>All content will be properly contained within the popup.</p>
    `;
    document.getElementById('designRequestContent').innerHTML = sampleContent;
});


// Add this to your Firebase.js file
window.sendPasswordReset = async (e) => {
    e.preventDefault();
    const email = document.getElementById('resetEmail').value;
    
    try {
        await sendPasswordResetEmail(auth, email);
        alert('Password reset email sent! Please check your inbox.');
        showLoginForm(); // Return to login form
    } catch (error) {
        console.error('Password reset error:', error);
        showError('resetError', error.message);
    }
};