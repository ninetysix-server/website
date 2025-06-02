import { auth, db, setDoc, doc, getDoc, updateUserProfile, cartItems, cartCounter, updateCartCounterValue, updateCartCounter } from './firebase.js';

// Initialize Cart System
function initializeCartSystem() {
    updateCartCounter();
    updateCartDisplay();
}

// Initialize Cart Event Handlers
function initializeCartEventHandlers() {
    // Cart Toggle with State Management
    document.querySelectorAll('.cart-trigger').forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            const cartSection = document.getElementById('cart-section');
            cartSection.classList.toggle('active');
            
            // Force UI refresh when opening cart
            if (cartSection.classList.contains('active')) {
                updateCartDisplay();
            }
        });
    });

    // Cart Close
    document.getElementById('cart-close').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('cart-section').classList.remove('active');
    });

    // Dynamic Item Removal
    document.body.addEventListener('click', (e) => {
        if (e.target.closest('.btn-remove')) {
            const itemId = parseInt(e.target.dataset.id);
            cartItems.splice(cartItems.findIndex(item => item.id === itemId), 1); // Modify array in place
            persistCartState();
            updateCartDisplay();
            
            // Auto-close cart if last item removed
            if (cartItems.length === 0) {
                document.getElementById('cart-section').classList.remove('active');
            }
        }
    });

// Proceed to Checkout
document.querySelector('.btn-proceed').addEventListener('click', async (e) => {
    e.preventDefault();
    const user = auth.currentUser;

    if (user) {
        try {
            let updatedCartItems = JSON.parse(localStorage.getItem('cart')) || [];

            // Add default values for admin dashboard fields
            await setDoc(doc(db, "users", user.uid), {
                cart: updatedCartItems,
                trackDesignActive: true,
                designProgress: 'Preparing',
                paymentStatus: 'Not Paid',
                designDuration: 'Pending',
                lastUpdated: new Date().toISOString()
            }, { merge: true });

            showAuth();
            await updateUserProfile(user);
            alert('Cart saved successfully!');
        } catch (error) {
            console.error('Error saving cart:', error.message);
            alert('Failed to save cart. Please try again.');
        }
    } else {
        showAuth();
    }
});

    // Continue Shopping Button
    document.body.addEventListener('click', (e) => {
        if (e.target.closest('.btn-continue-shopping')) {
            document.getElementById('cart-section').classList.remove('active');
        }
    });
}

// Updated addToCart function
function addToCart(itemDetails) {
    const newItem = {
        id: Date.now(),
        ...itemDetails,
        price: parseFloat(itemDetails.price.replace('R', '')),
        timestamp: new Date().toISOString(),
        description: itemDetails.description || '',
        imageUrl: itemDetails.imageUrl || '',
       // page: itemDetails.page || '0' // Include the page number, default to '0' if not provided
    };

    cartItems.push(newItem);
    persistCartState();
    updateCartDisplay();
    document.getElementById('cart-section').classList.add('active');
    showPaymentPopup(); // Add this line to show the payment popup
}

// Persist Cart State to Local Storage
function persistCartState() {
    updateCartCounterValue(cartItems.length); 
    localStorage.setItem('cart', JSON.stringify(cartItems));
    updateCartCounter();
}

// Update Cart Display
function updateCartDisplay() {
    const cartBody = document.querySelector('.cart-body');
    const totalElement = document.querySelector('.total-value');
    const inputFields = document.querySelector('.input-fields');
    const costInfo = document.querySelector('.cost-info');
    const proceedContainer = document.querySelector('.proceed-container');
    const designsCount = document.getElementById('designs-count');

    // Always reset these elements when updating
    const additionalSections = [inputFields, costInfo, proceedContainer];

    if (cartItems.length === 0) {
        cartBody.innerHTML = `
            <div class="empty-cart" style="text-align: center;">
            <div class="cart-empty"><img src="assets/icons/basket.png" alt="Logo" class="logo"></div>
                <p>Your cart is empty</p>
                <button class="btn-continue-shopping">Continue Shopping</button>
            </div>
        `;
        // Hide additional cart sections
        additionalSections.forEach(section => section.style.display = 'none');
        designsCount.textContent = '0';
        totalElement.textContent = 'R0.00';
    } else {
        // Show additional cart sections
        additionalSections.forEach(section => section.style.display = 'block');
        designsCount.textContent = cartItems.length;
        
        // Clear existing items
        cartBody.innerHTML = '';
        
        // Populate cart items
        cartItems.forEach(item => {
            cartBody.innerHTML += `
                <div class="cart-item" data-id="${item.id}">
                    <img src="assets/images/${item.id}.jpg" alt="${item.title}" hidden>
                    <div class="item-details">
                        <h3>${item.title}</h3>
                        <p>R${item.price.toFixed(2)}</p>
                        ${item.info ? `<div class="item-info" hidden>${item.info}</div>` : ''}
                        ${item.page ? `<p>Page: ${item.page}</p>` : ''}
                        <button class="btn-remove" data-id="${item.id}">Remove</button>
                    </div>
                </div>
            `;
        });

        // Calculate total
        const total = cartItems.reduce((sum, item) => sum + item.price, 0);
        totalElement.textContent = `R${total.toFixed(2)}`;
    }
}

// Handle Design Buttons
// Handle Design Buttons
document.body.addEventListener('click', (e) => {
    if (e.target.closest('.design-button')) {
        const product = e.target.closest('.grid-item');
        
        // Check if the product is within the "Website Design" section
        const websitePagesContainer = product.querySelector('.website-pages');
        if (websitePagesContainer) {
            // Find the currently visible page
            const visiblePage = websitePagesContainer.querySelector('.website-page[style*="display: block"]') || 
                                websitePagesContainer.querySelector('.website-page:not([style*="display: none"])');
            
            if (visiblePage) {
                const pageNumber = visiblePage.getAttribute('data-page');
                addToCart({
                    title: visiblePage.querySelector('.service-title').textContent,
                    price: visiblePage.querySelector('.service-price').textContent,
                    info: visiblePage.querySelector('.service-info').textContent,
                    page: pageNumber // Include the page number in the item details
                });
            }
        } else {
            // Handle other products
            addToCart({
                title: product.querySelector('.service-title').textContent,
                price: product.querySelector('.service-price').textContent,
                info: product.querySelector('.service-info').textContent
            });
        }
    }

    // Handle Advert Buttons
    if (e.target.closest('.advert-button')) {
        const button = e.target.closest('.advert-button');
        addToCart({
            title: button.dataset.title,
            price: button.dataset.price,
            info: button.dataset.info
        });
    }
});

// Handle Glide Slider Cart Icons
document.body.addEventListener('click', (e) => {
    if (e.target.closest('.cart-icon')) {
        const cartIcon = e.target.closest('.cart-icon');
        addToCart({
            title: cartIcon.dataset.title,
            price: cartIcon.dataset.price,
            info: cartIcon.dataset.info,
            additionalInfo: cartIcon.dataset.additionalInfo
        });
    }
});

// Page Load Overlay
function showPageLoadOverlay() {
    const overlay = document.getElementById('page-load-overlay');
    overlay.style.display = 'flex';
}

function hidePageLoadOverlay() {
    const overlay = document.getElementById('page-load-overlay');
    overlay.style.display = 'none';
}

// Function to wait for all images to load
function waitForAllImagesToLoad() {
    const images = document.querySelectorAll('img');
    const imagePromises = [];

    images.forEach(img => {
        if (!img.complete) {
            const promise = new Promise((resolve) => {
                img.addEventListener('load', resolve);
                img.addEventListener('error', resolve); // Handle broken images
            });
            imagePromises.push(promise);
        }
    });

    return Promise.all(imagePromises);
}

window.addEventListener('load', () => {
    showPageLoadOverlay();

    // Wait for all images to load
    waitForAllImagesToLoad().then(() => {
        hidePageLoadOverlay();
    });
});


// Upload Sketch Overlay
function showUploadOverlay() {
    const overlay = document.getElementById('upload-overlay');
    overlay.style.display = 'flex';
}

function hideUploadOverlay() {
    const overlay = document.getElementById('upload-overlay');
    overlay.style.display = 'none';
}

document.getElementById('sketch-upload').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    showUploadOverlay();

    try {
        const imageUrl = await uploadToCloudinary(file);
        if (imageUrl) {
            let cartItems = JSON.parse(localStorage.getItem('cart')) || [];
            if (cartItems.length > 0) {
                cartItems[cartItems.length - 1].imageUrl = imageUrl;
                localStorage.setItem('cart', JSON.stringify(cartItems));
                updateCartDisplay();
                showUploadAlert('Sketch uploaded successfully!', 'success');
            }
        } else {
            showUploadAlert('Upload failed. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Upload failed:', error);
        showUploadAlert(`Upload failed: ${error.message}`, 'error');
    } finally {
        hideUploadOverlay();
    }
});


// Update the Description Handler
document.getElementById('design-description').addEventListener('input', function() {
    let cartItems = JSON.parse(localStorage.getItem('cart')) || [];
    if (cartItems.length > 0) {
        cartItems[cartItems.length - 1].description = this.value; // Update last item's description
        localStorage.setItem('cart', JSON.stringify(cartItems)); // Save to local storage
    }
});


// Show Upload Alert
function showUploadAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `upload-alert alert-${type}`;
    alertDiv.textContent = message;
    
    document.body.appendChild(alertDiv);
    
    // Force reflow to enable transition
    void alertDiv.offsetWidth;
    
    alertDiv.classList.add('show');
    
    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => {
            alertDiv.remove();
        }, 500);
    }, 3000);
}

// Update the Description Handler
document.getElementById('design-description').addEventListener('input', function() {
    const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
    if (cartItems.length > 0) {
        cartItems[cartItems.length - 1].description = this.value; // Update the last item's description
        localStorage.setItem('cart', JSON.stringify(cartItems)); // Update local storage
    }
});

// Upload to Cloudinary
async function uploadToCloudinary(file) {
    const cloudName = 'ddaeq2zfn';
    const uploadPreset = 'design_sketch'; 

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    try {
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            { method: 'POST', body: formData }
        );
        const data = await response.json();
        return data.secure_url;
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        return null;
    }
}

// Initialize Cart System on DOM Load
document.addEventListener('DOMContentLoaded', () => {
    initializeCartSystem();
    initializeCartEventHandlers();
});



//PAYMENT METHOD POPUP
// Function to show payment popup after 5 seconds
function showPaymentPopup() {
    setTimeout(() => {
        const paymentPopup = document.getElementById('paymentPopup');
        if (cartItems.length > 0) {
            paymentPopup.style.display = 'flex';
        }
    }, 5000); // 5 seconds delay
}



// TRACK DESIGN SECTION
// Show Track Design Section

// Fetch Design Progress from Firestore
window.fetchDesignProgress = async function () {
    const user = auth.currentUser;

    if (user) {
        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                const data = userDoc.data();

                // Update progress bar
                const progressFill = document.getElementById('progressFill');
                const progressStages = ['Preparing', 'Designing', 'Finalizing', 'Finished'];
                const progressIndex = progressStages.indexOf(data.designProgress || 'Preparing');
                const progressPercentage = ((progressIndex + 1) / progressStages.length) * 100;
                progressFill.style.width = `${progressPercentage}%`;

                // Update stages with checkmarks and green styling
                const stages = document.querySelectorAll('.progress-stages .stage');
                
                stages.forEach((stage, index) => {
                    if (index <= progressIndex) {
                        stage.classList.add('active');
                        if (index < progressIndex) {
                            stage.classList.add('completed');
                        }
                    } else {
                        stage.classList.remove('active', 'completed');
                    }
                });

                // Update payment status and design duration
                document.getElementById('paymentStatus').textContent = data.paymentStatus || 'Not Paid';
                document.getElementById('designDuration').textContent = data.designDuration || 'Pending';
            }
        } catch (error) {
            console.error('Error fetching design progress:', error);
        }
    }
};

function showTrackDesign() {
    const trackDesignSection = document.getElementById('trackDesignSection');
    trackDesignSection.style.display = 'block';

    // Populate user info
    document.getElementById('trackUsername').textContent = document.getElementById('username').textContent;
    document.getElementById('trackEmail').textContent = document.getElementById('userEmail').textContent;

    // Fetch and update progress from Firestore
    fetchDesignProgress();
}

// Hide Track Design Section
function hideTrackDesign() {
    document.getElementById('trackDesignSection').style.display = 'none';
}

// Show Track Design Section
window.showTrackDesign = function () {
    const trackDesignSection = document.getElementById('trackDesignSection');
    trackDesignSection.style.display = 'block';

    // Populate user info
    document.getElementById('trackUsername').textContent = document.getElementById('username').textContent;
    document.getElementById('trackEmail').textContent = document.getElementById('userEmail').textContent;

    // Fetch and update progress from Firestore
    fetchDesignProgress(); // Call the function
};


