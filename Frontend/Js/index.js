// 1. Select the elements
const inputField = document.querySelector('.form-group input');
const addButton = document.querySelector('.add-value-btn');
const dataList = document.querySelector('.data-list');
const totalBadge = document.querySelector('.total-values-badge');

/**
 * Adds a new value to the list
 */
function addValue() {
    const value = inputField.value.trim();

    // Validation: Check if input is empty or not a number
    if (value === "" || isNaN(value)) {
        alert("Please enter a valid number");
        return;
    }

    // Create the new list item
    const li = document.createElement('li');
    li.className = 'data-item';

    li.innerHTML = `
        <span class="value">${value}</span>
        <div class="actions">
            <span class="edit">✏️ Edit</span>
            <span class="remove-btn" style="cursor:pointer">🗑️ Remove</span>
        </div>
    `;

    // Add the new item to the list
    dataList.appendChild(li);

    // Clear and focus the input for the next entry
    inputField.value = "";
    inputField.focus();

    // Update the "Total values" count
    updateTotalCount();
}

/**
 * Updates the badge count based on current list items
 */
function updateTotalCount() {
    const count = document.querySelectorAll('.data-item').length;
    totalBadge.textContent = `Total values: ${count}`;
}

// --- EVENT LISTENERS ---

// Click event for Add Button
addButton.addEventListener('click', addValue);

// "Enter" key event for Input Field
inputField.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addValue();
    }
});

// Event Delegation for "Remove" and "Edit"
dataList.addEventListener('click', (e) => {
    // REMOVE LOGIC
    if (e.target.classList.contains('remove-btn') || e.target.innerText.includes('Remove')) {
        e.target.closest('.data-item').remove();
        updateTotalCount();
    }

    // EDIT LOGIC
    if (e.target.classList.contains('edit') || e.target.innerText.includes('Edit')) {
        const item = e.target.closest('.data-item');
        const valueToEdit = item.querySelector('.value').innerText;
        inputField.value = valueToEdit;
        item.remove();
        inputField.focus();
        updateTotalCount();
    }
});

// Initialize count on load
updateTotalCount();

// EXCEL IMPORT FUNCTIONALITY
const excelUpload = document.getElementById('excel-upload');
if (excelUpload) {
    excelUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

                const numbers = jsonData.flat().filter(val => {
                    return val !== null && val !== "" && !isNaN(val) && typeof val !== 'boolean';
                });

                if (numbers.length === 0) {
                    alert("No valid numbers found in this file.");
                    return;
                }

                numbers.forEach(num => {
                    const li = document.createElement('li');
                    li.className = 'data-item';
                    li.innerHTML = `
                        <span class="value">${num}</span>
                        <div class="actions">
                            <span class="edit">✏️ Edit</span>
                            <span class="remove-btn" style="cursor:pointer">🗑️ Remove</span>
                        </div>
                    `;
                    dataList.appendChild(li);
                });

                updateTotalCount();
            } catch (error) {
                console.error("Excel Error:", error);
                alert("Error reading file. Please use a standard .xlsx or .csv file.");
            }
            excelUpload.value = '';
        };
        reader.readAsArrayBuffer(file);
    });
}

// SORTING LOGIC
const sortAscBtn = document.querySelector('.sort-btn.ascending');
const sortDescBtn = document.querySelector('.sort-btn.descending');

function sortData(ascending = true) {
    const items = Array.from(dataList.querySelectorAll('.data-item'));
    if (items.length === 0) return;

    items.sort((a, b) => {
        const valA = parseFloat(a.querySelector('.value').innerText);
        const valB = parseFloat(b.querySelector('.value').innerText);
        return ascending ? valA - valB : valB - valA;
    });

    dataList.innerHTML = "";
    items.forEach(item => dataList.appendChild(item));
}

if (sortAscBtn) sortAscBtn.addEventListener('click', () => sortData(true));
if (sortDescBtn) sortDescBtn.addEventListener('click', () => sortData(false));

// CLEAR DATA
const clearBtn = document.querySelector('.clear-btn');
if (clearBtn) {
    clearBtn.addEventListener('click', () => {
        dataList.innerHTML = "";
        updateTotalCount();
    });
}

// --- MAO NI SA GRAPH (PROFESSIONAL UPDATE) ---
let myChart = null; 

function updateGraph(data) {
    const canvas = document.getElementById('frequencyChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Process Frequency Data
    const counts = {};
    data.forEach(num => counts[num] = (counts[num] || 0) + 1);
    const labels = Object.keys(counts).sort((a, b) => a - b);
    const values = labels.map(label => counts[label]);

    if (myChart) {
        myChart.destroy();
    }

    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Frequency',
                data: values,
                backgroundColor: '#319795', // Matches your --teal-primary
                borderRadius: 4,
                barPercentage: 0.6 
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' },
                title: {
                    display: true,
                    text: 'Frequency Distribution Bar Graph',
                    font: { size: 16, weight: 'bold', family: "'Segoe UI', sans-serif" }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#edf2f7' },
                    title: { display: true, text: 'Frequency', font: { weight: 'bold' } }
                },
                x: {
                    grid: { display: false },
                    title: { display: true, text: 'Values', font: { weight: 'bold' } }
                }
            }
        }
    });
}

// --- CALCULATE STATISTICS & UPDATE GRAPH ---
const calculateBtn = document.querySelector('.calculate-btn');

calculateBtn.addEventListener('click', () => {
    const dataItems = document.querySelectorAll('.data-item .value');
    const numbers = Array.from(dataItems).map(span => parseFloat(span.innerText));

    if (numbers.length === 0) {
        alert("Please add some data first!");
        return;
    }

    // 1. Visual Updates
    updateGraph(numbers);
    updateFrequencyTable(numbers);

    // 2. Mean, Median, Range Logic (Left exactly as you requested)
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    const sorted = [...numbers].sort((a, b) => a - b);
    const median = sorted.length % 2 === 0 
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2 
        : sorted[Math.floor(sorted.length / 2)];

    document.querySelector('.result-card.mean .value').textContent = mean.toFixed(2);
    document.querySelector('.result-card.median .value').textContent = median.toFixed(2);
    
    const range = Math.max(...numbers) - Math.min(...numbers);
    document.querySelector('.result-card.range .value').textContent = range;
});

/**
 * Updates the Table below the graph
 */
function updateFrequencyTable(data) {
    const tbody = document.querySelector('.frequency-table-card tbody');
    if (!tbody) return;
    tbody.innerHTML = ''; 

    const counts = {};
    data.forEach(num => counts[num] = (counts[num] || 0) + 1);
    const sortedUnique = Object.keys(counts).sort((a, b) => a - b);

    sortedUnique.forEach(val => {
        const row = `<tr>
            <td>${val}</td>
            <td>${counts[val]}</td>
        </tr>`;
        tbody.innerHTML += row;
    });
}