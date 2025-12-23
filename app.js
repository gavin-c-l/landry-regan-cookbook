import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';
import { getDatabase, ref, push, set, onValue, remove, update } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js';

// Initialize Firebase
const firebaseConfig = {
apiKey: "AIzaSyCFMhJ9KV738dSvb46IogqC3myjtSaj5Nw",
authDomain: "landry-regan-cookbook.firebaseapp.com",
projectId: "landry-regan-cookbook",
storageBucket: "landry-regan-cookbook.firebasestorage.app",
messagingSenderId: "366289651898",
appId: "1:366289651898:web:34740ac805a4e4696b1a83"
};


const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getDatabase(firebaseApp);

const app = {
    user: null,
    categories: [],
    recipes: [],
    authMode: 'login', // 'login' or 'signup'

    init() {
        // Check if user is logged in
        onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                this.user = {
                    id: firebaseUser.uid,
                    email: firebaseUser.email
                };
                this.loadUserProfile();
                this.showView('main');
            } else {
                this.user = null;
                //this.showView('auth');
            }
        });
    },

    showView(view) 
    {
        document.getElementById('hero').classList.toggle('hidden', view !== 'hero');
        document.getElementById('auth').classList.toggle('hidden', view !== 'auth');
        document.getElementById('main').classList.toggle('hidden', view !== 'main');
        
        if (view === 'main') {
            this.loadCategories();
            this.loadRecipes();
        }
    },

    toggleAuthMode() {
        this.authMode = this.authMode === 'login' ? 'signup' : 'login';
        this.updateAuthUI();
    },

    updateAuthUI() {
        const authForm = document.getElementById('authForm');
        const authTitle = document.getElementById('authTitle');
        const authSubtitle = document.getElementById('authSubtitle');
        const authButton = document.getElementById('authButton');
        const toggleText = document.getElementById('toggleText');
        const nameInput = document.getElementById('authName');

        if (this.authMode === 'signup') {
            authTitle.textContent = 'Create Account';
            authSubtitle.textContent = 'Join the family cookbook';
            nameInput.classList.remove('hidden');
            authButton.textContent = 'Sign Up';
            toggleText.innerHTML = 'Already have an account? <button type="button" onclick="app.toggleAuthMode()" class="text-purple-600 hover:text-purple-700 font-bold">Login</button>';
        } else {
            authTitle.textContent = 'Sign In';
            authSubtitle.textContent = 'Access your family recipes';
            nameInput.classList.add('hidden');
            authButton.textContent = 'Sign In';
            toggleText.innerHTML = 'Don\'t have an account? <button type="button" onclick="app.toggleAuthMode()" class="text-purple-600 hover:text-purple-700 font-bold">Sign Up</button>';
        }
    },

    async handleAuth() {
        const email = document.getElementById('authEmail').value.trim();
        const password = document.getElementById('authPassword').value;
        const name = document.getElementById('authName').value.trim();

        if (!email || !password) {
            alert('Please fill in all fields');
            return;
        }

        if (this.authMode === 'signup' && !name) {
            alert('Please enter your name');
            return;
        }

        try {
            let userCredential;
            if (this.authMode === 'signup') {
                userCredential = await createUserWithEmailAndPassword(auth, email, password);
                // Create user profile in database
                await set(ref(db, `users/${userCredential.user.uid}`), {
                    name: name,
                    email: email,
                    createdAt: new Date().toISOString()
                });
                alert('Account created successfully!');
            } else {
                userCredential = await signInWithEmailAndPassword(auth, email, password);
            }

            // Clear form
            document.getElementById('authEmail').value = '';
            document.getElementById('authPassword').value = '';
            document.getElementById('authName').value = '';
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    },

    loadUserProfile() {
        const userRef = ref(db, `users/${this.user.id}`);
        onValue(userRef, (snapshot) => {
            if (snapshot.exists()) {
                const userData = snapshot.val();
                document.getElementById('userDisplay').textContent = userData.name || this.user.email;
            }
        });
    },

    toggleForm(formId) {
        document.getElementById(formId + 'Form').classList.toggle('hidden');
    },

    // Categories
    loadCategories() {
        const categoriesRef = ref(db, 'categories');
        onValue(categoriesRef, (snapshot) => {
            this.categories = [];
            if (snapshot.exists()) {
                snapshot.forEach((childSnapshot) => {
                    this.categories.push({
                        id: childSnapshot.key,
                        ...childSnapshot.val()
                    });
                });
            }
            this.renderCategories();
            this.updateCategorySelect();
        });
    },

    async addCategory() {
        const name = document.getElementById('categoryInput').value.trim();
        if (!name) {
            alert('Please enter a category name');
            return;
        }

        try {
            const newCategoryRef = push(ref(db, 'categories'));
            await set(newCategoryRef, {
                name: name,
                createdBy: this.user.id,
                createdAt: new Date().toISOString()
            });
            document.getElementById('categoryInput').value = '';
            this.toggleForm('addCategory');
        } catch (error) {
            alert(`Error adding category: ${error.message}`);
        }
    },

    renderCategories() {
        const grid = document.getElementById('categoriesGrid');
        if (this.categories.length === 0) {
            grid.innerHTML = '<p class="col-span-full text-center text-gray-600">No categories yet. Create one to get started!</p>';
            return;
        }

        grid.innerHTML = this.categories.map(cat => `
            <div class="bg-white rounded-lg shadow-md p-4 flex flex-col items-center justify-center cursor-pointer hover:shadow-lg transition group">
                <i class="fas fa-shopping-basket text-purple-500 text-3xl mb-2 group-hover:scale-110 transition"></i>
                <h4 class="font-bold text-gray-800 text-center text-sm">${cat.name}</h4>
                ${cat.createdBy === this.user.id ? `
                    <button onclick="app.deleteCategory('${cat.id}')" class="mt-2 text-red-500 hover:text-red-700 text-xs">
                        <i class="fas fa-trash"></i>
                    </button>
                ` : ''}
            </div>
        `).join('');
    },

    async deleteCategory(id) {
        if (confirm('Delete this category? All associated recipes will remain.')) {
            try {
                await remove(ref(db, `categories/${id}`));
            } catch (error) {
                alert(`Error deleting category: ${error.message}`);
            }
        }
    },

    updateCategorySelect() {
        const select = document.getElementById('recipeCategory');
        const currentValue = select.value;
        select.innerHTML = '<option value="">Select Category *</option>' + 
            this.categories.map(cat => `<option value="${cat.name}">${cat.name}</option>`).join('');
        select.value = currentValue;
    },

    // Recipes
    loadRecipes() {
        const recipesRef = ref(db, 'recipes');
        onValue(recipesRef, (snapshot) => {
            this.recipes = [];
            if (snapshot.exists()) {
                snapshot.forEach((childSnapshot) => {
                    this.recipes.push({
                        id: childSnapshot.key,
                        ...childSnapshot.val()
                    });
                });
            }
            this.renderRecipes();
        });
    },

    addIngredientInput() {
        const container = document.getElementById('ingredientsContainer');
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'ingredient-input w-full px-4 py-2 border border-gray-300 rounded-lg';
        input.placeholder = 'Ingredient';
        container.appendChild(input);
    },

    addInstructionInput() {
        const container = document.getElementById('instructionsContainer');
        const textarea = document.createElement('textarea');
        textarea.className = 'instruction-input w-full px-4 py-2 border border-gray-300 rounded-lg';
        textarea.placeholder = 'Step';
        textarea.rows = 2;
        container.appendChild(textarea);
    },

    removeIngredientInput() {
        const container = document.getElementById('ingredientsContainer');
        if (container.childElementCount <= 1) {
            return;
        } 
        container.lastElementChild.remove();
    },

    removeInstructionInput() {
        const container = document.getElementById('instructionsContainer');
                if (container.childElementCount <= 1) {
            return;
        } 
        container.lastElementChild.remove();
    },

    async saveRecipe() {
        const name = document.getElementById('recipeName').value.trim();
        const category = document.getElementById('recipeCategory').value;
        
        if (!name || !category) {
            alert('Please fill in Recipe Name and Category');
            return;
        }

        const ingredients = Array.from(document.querySelectorAll('.ingredient-input'))
            .map(input => input.value.trim())
            .filter(val => val);
        
        const instructions = Array.from(document.querySelectorAll('.instruction-input'))
            .map(textarea => textarea.value.trim())
            .filter(val => val);

        if (ingredients.length === 0 || instructions.length === 0) {
            alert('Please add at least one ingredient and one instruction');
            return;
        }

        const recipe = {
            name: name,
            category: category,
            origin: document.getElementById('recipeOrigin').value,
            time: document.getElementById('recipeTime').value,
            link: document.getElementById('recipeLink').value,
            ingredients: ingredients,
            instructions: instructions,
            createdBy: this.user.id,
            createdAt: new Date().toISOString()
        };

        try {
            const newRecipeRef = push(ref(db, 'recipes'));
            await set(newRecipeRef, recipe);
            this.resetRecipeForm();
            this.toggleForm('addRecipe');
        } catch (error) {
            alert(`Error saving recipe: ${error.message}`);
        }
    },

    resetRecipeForm() {
        document.getElementById('recipeName').value = '';
        document.getElementById('recipeCategory').value = '';
        document.getElementById('recipeOrigin').value = '';
        document.getElementById('recipeTime').value = '';
        document.getElementById('recipeLink').value = '';
        
        const ingContainer = document.getElementById('ingredientsContainer');
        ingContainer.innerHTML = '<input type="text" class="ingredient-input w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Ingredient">';
        
        const instContainer = document.getElementById('instructionsContainer');
        instContainer.innerHTML = '<textarea class="instruction-input w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Step 1" rows="2"></textarea>';
    },

    renderRecipes() {
        const grid = document.getElementById('recipesGrid');
        if (this.recipes.length === 0) {
            grid.innerHTML = '<p class="col-span-full text-center text-gray-600">No recipes yet. Add one to get started!</p>';
            return;
        }

        grid.innerHTML = this.recipes.map(recipe => `
            <div class="recipe-card bg-white rounded-lg shadow-md overflow-hidden">
                <div class="p-6">
                    <div class="flex justify-between items-start mb-3">
                        <h5 class="text-xl font-bold text-gray-800">${recipe.name}</h5>
                        ${recipe.createdBy === this.user.id ? `
                            <button onclick="app.deleteRecipe('${recipe.id}')" class="text-red-500 hover:text-red-700">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                    <div class="text-sm text-gray-600 mb-4 space-y-1">
                        <p><strong>Category:</strong> ${recipe.category}</p>
                        ${recipe.origin ? `<p><strong>Who makes it:</strong> ${recipe.origin}</p>` : ''}
                        ${recipe.time ? `<p><strong>Time:</strong> ${recipe.time}</p>` : ''}
                    </div>

                    <div class="accordion accordion-flush" id="acc${recipe.id}">
                        <div class="accordion-item border-0 mb-2">
                            <h2 class="accordion-header">
                                <button class="accordion-button collapsed text-gray-800 font-bold" type="button" data-bs-toggle="collapse" data-bs-target="#ing${recipe.id}">
                                    <i class="fas fa-list mr-2 text-blue-500"></i> Ingredients
                                </button>
                            </h2>
                            <div id="ing${recipe.id}" class="accordion-collapse collapse" data-bs-parent="#acc${recipe.id}">
                                <div class="accordion-body p-3 bg-gray-50">
                                    <ul class="list-disc list-inside space-y-1">
                                        ${recipe.ingredients.map(ing => `<li class="text-gray-700">${ing}</li>`).join('')}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div class="accordion-item border-0">
                            <h2 class="accordion-header">
                                <button class="accordion-button collapsed text-gray-800 font-bold" type="button" data-bs-toggle="collapse" data-bs-target="#inst${recipe.id}">
                                    <i class="fas fa-directions mr-2 text-green-500"></i> Instructions
                                </button>
                            </h2>
                            <div id="inst${recipe.id}" class="accordion-collapse collapse" data-bs-parent="#acc${recipe.id}">
                                <div class="accordion-body p-3 bg-gray-50">
                                    <ol class="list-decimal list-inside space-y-2">
                                        ${recipe.instructions.map((inst, idx) => `<li class="text-gray-700">${inst}</li>`).join('')}
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>

                    ${recipe.link ? `<a href="${recipe.link}" target="_blank" class="mt-4 inline-block text-blue-500 hover:text-blue-700 font-semibold text-sm">
                        <i class="fas fa-external-link mr-1"></i> View Original
                    </a>` : ''}
                </div>
            </div>
        `).join('');
    },

    async deleteRecipe(id) {
        if (confirm('Delete this recipe?')) {
            try {
                await remove(ref(db, `recipes/${id}`));
            } catch (error) {
                alert(`Error deleting recipe: ${error.message}`);
            }
        }
    },

    async logout() {
        try {
            await signOut(auth);
            this.user = null;
            this.showView('auth');
        } catch (error) {
            alert(`Error logging out: ${error.message}`);
        }
    }
};

// Initialize app when DOM is ready
window.app=app;
document.addEventListener('DOMContentLoaded', () => {
    app.init();
    app.updateAuthUI();
});


