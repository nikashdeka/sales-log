// sales-tracker-simple-frontend/script.js

const API_BASE_URL = 'http://localhost:5000/api/v1';

// Get DOM elements
const salesForm = document.getElementById('salesForm');
const salespersonSelect = document.getElementById('salespersonId');
const entryDateInput = document.getElementById('entryDate');
const projectedAmountInput = document.getElementById('projectedAmount');
const actualAmountInput = document.getElementById('actualAmount');
const commitmentStatusSelect = document.getElementById('commitmentStatus');
const commentsTextarea = document.getElementById('comments');
const productServiceInput = document.getElementById('productService');
const messageDiv = document.getElementById('message');
const errorDiv = document.getElementById('error');
const projectionsDisplayDiv = document.getElementById('projectionsDisplay');
const selectedSalespersonNameSpan = document.getElementById('selectedSalespersonName');

let currentSalespersonId = ''; // To store the currently selected user's ID

// Helper function to display messages
function displayMessage(element, text, type) {
    element.textContent = text;
    element.className = `message ${type}-message`;
    element.classList.remove('hidden');
    setTimeout(() => {
        element.classList.add('hidden');
        element.textContent = '';
    }, 5000); // Hide after 5 seconds
}

// Function to fetch users and populate dropdown
async function populateSalespersons() {
    try {
        // In a real application, you'd fetch this from your backend
        // For this simple HTML, we'll use the sample UUIDs directly.
        // REMINDER: You MUST replace these with actual UserIDs from your PostgreSQL DB.
        const users = [
            { UserID: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', SalespersonName: 'Alice Johnson' },
            { UserID: 'b1fccb91-1c1a-4f51-a1b1-1bb8ad271b22', SalespersonName: 'Bob Smith' },
            { UserID: 'c2gddc88-2d2b-4e42-c2c2-2cc7bc162c33', SalespersonName: 'Charlie Brown' },
        ];

        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.UserID;
            option.textContent = user.SalespersonName;
            salespersonSelect.appendChild(option);
        });

        // Set default selected salesperson and trigger initial load
        if (users.length > 0) {
            salespersonSelect.value = users[0].UserID;
            currentSalespersonId = users[0].UserID;
            selectedSalespersonNameSpan.textContent = users[0].SalespersonName;
            fetchUserProjections(currentSalespersonId);
        }

    } catch (err) {
        console.error('Error populating salespersons:', err);
        displayMessage(errorDiv, 'Failed to load salespersons.', 'error');
    }
}

// Function to fetch and display user's daily projections
async function fetchUserProjections(userId) {
    if (!userId) {
        projectionsDisplayDiv.innerHTML = '<p>No projections submitted yet for this user.</p>';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/projections/${userId}`);
        const projections = await response.json();

        if (!response.ok) {
            throw new Error(projections.error || 'Failed to fetch projections');
        }

        if (projections.length === 0) {
            projectionsDisplayDiv.innerHTML = '<p>No projections submitted yet for this user.</p>';
            return;
        }

        let tableHtml = `
            <table class="projections-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Projected</th>
                        <th>Actual</th>
                        <th>Status</th>
                        <th>Comments</th>
                        <th>Submitted At</th>
                    </tr>
                </thead>
                <tbody>
        `;

        projections.forEach(proj => {
            const formattedDate = new Date(proj.date).toLocaleDateString();
            const formattedTimestamp = new Date(proj.timestampsubmitted).toLocaleString();
            tableHtml += `
                <tr>
                    <td>${formattedDate}</td>
                    <td>$${parseFloat(proj.projectedamount).toFixed(2)}</td>
                    <td>$${parseFloat(proj.actualamount).toFixed(2)}</td>
                    <td>${proj.commitmentstatus}</td>
                    <td>${proj.comments || '-'}</td>
                    <td>${formattedTimestamp}</td>
                </tr>
            `;
        });

        tableHtml += `</tbody></table>`;
        projectionsDisplayDiv.innerHTML = tableHtml;

    } catch (err) {
        console.error('Error fetching user projections:', err);
        displayMessage(errorDiv, `Error loading projections: ${err.message}`, 'error');
        projectionsDisplayDiv.innerHTML = '<p>Error loading projections. Please try again.</p>';
    }
}

// Handle form submission
salesForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent default form submission

    messageDiv.classList.add('hidden');
    errorDiv.classList.add('hidden');

    const payload = {
        salespersonId: salespersonSelect.value,
        entryDate: entryDateInput.value,
        projectedAmount: parseFloat(projectedAmountInput.value),
        actualAmount: parseFloat(actualAmountInput.value),
        commitmentStatus: commitmentStatusSelect.value,
        comments: commentsTextarea.value || null,
        productService: productServiceInput.value.split(',').map(s => s.trim()).filter(Boolean)
    };

    // Basic client-side validation
    if (!payload.salespersonId || !payload.entryDate || isNaN(payload.projectedAmount) || isNaN(payload.actualAmount) || !payload.commitmentStatus) {
        displayMessage(errorDiv, 'Please fill in all required fields and ensure amounts are numbers.', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/projections`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok) {
            displayMessage(messageDiv, result.message, 'success');
            // Clear form (except salesperson and date)
            projectedAmountInput.value = '';
            actualAmountInput.value = '';
            commentsTextarea.value = '';
            productServiceInput.value = '';
            commitmentStatusSelect.value = 'Met';
            // Refresh the list of projections for the current user
            fetchUserProjections(currentSalespersonId);
        } else {
            displayMessage(errorDiv, result.error || 'Failed to submit projection.', 'error');
        }
    } catch (err) {
        console.error('Submission error:', err);
        displayMessage(errorDiv, 'Network error or server unavailable. Please try again.', 'error');
    }
});

// Event listener for salesperson change
salespersonSelect.addEventListener('change', (e) => {
    currentSalespersonId = e.target.value;
    const selectedOption = e.target.options[e.target.selectedIndex];
    selectedSalespersonNameSpan.textContent = selectedOption.textContent;
    fetchUserProjections(currentSalespersonId); // Fetch new projections when salesperson changes
});

// Initialize form with current date
entryDateInput.value = new Date().toISOString().split('T')[0];

// Initial load: populate salespersons dropdown
document.addEventListener('DOMContentLoaded', populateSalespersons);
