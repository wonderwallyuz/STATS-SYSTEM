// ─────────────────────────────────────────────
//  REFERENCES
// ─────────────────────────────────────────────
const inputField = document.querySelector('.form-group input');
const addButton  = document.querySelector('.add-value-btn');
const dataList   = document.querySelector('.data-list');
const totalBadge = document.querySelector('.total-values-badge');

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────
function getNumbers() {
    return Array.from(dataList.querySelectorAll('.data-item .value'))
                .map(el => parseFloat(el.textContent));
}

function updateBadge() {
    const count = dataList.querySelectorAll('.data-item').length;
    totalBadge.textContent = `Total values: ${count}`;

    // Empty state
    let ph = dataList.querySelector('.empty-state');
    if (count === 0) {
        if (!ph) {
            ph = document.createElement('li');
            ph.className = 'empty-state';
            ph.textContent = 'No Data Value Added';
            dataList.appendChild(ph);
        }
    } else {
        if (ph) ph.remove();
    }
}

function makeItem(val) {
    const li = document.createElement('li');
    li.className = 'data-item';
    li.innerHTML = `
        <span class="value">${val}</span>
        <div class="actions">
            <span class="edit">✏️ Edit</span>
            <span class="remove-btn">🗑️ Remove</span>
        </div>`;
    return li;
}

// ─────────────────────────────────────────────
//  ADD
// ─────────────────────────────────────────────
function addValue() {
    const raw = inputField.value.trim();
    if (raw === '' || isNaN(raw)) { alert('Please enter a valid number'); return; }
    dataList.appendChild(makeItem(raw));
    inputField.value = '';
    inputField.focus();
    updateBadge();
    runCalculations();
}

addButton.addEventListener('click', addValue);
inputField.addEventListener('keypress', e => { if (e.key === 'Enter') addValue(); });

// ─────────────────────────────────────────────
//  REMOVE / EDIT  (event delegation)
// ─────────────────────────────────────────────
dataList.addEventListener('click', e => {
    const item = e.target.closest('.data-item');
    if (!item) return;

    if (e.target.classList.contains('remove-btn')) {
        item.remove();
        updateBadge();
        runCalculations();
    }

    if (e.target.classList.contains('edit')) {
        inputField.value = item.querySelector('.value').textContent;
        item.remove();
        inputField.focus();
        updateBadge();
        runCalculations();
    }
});

// ─────────────────────────────────────────────
//  SORT
// ─────────────────────────────────────────────
function sortData(asc) {
    const items = Array.from(dataList.querySelectorAll('.data-item'));
    if (!items.length) return;
    items.sort((a, b) => {
        const diff = parseFloat(a.querySelector('.value').textContent)
                   - parseFloat(b.querySelector('.value').textContent);
        return asc ? diff : -diff;
    });
    items.forEach(el => el.remove());
    items.forEach(el => dataList.appendChild(el));
    runCalculations();
}

document.querySelector('.sort-btn.ascending') .addEventListener('click', () => sortData(true));
document.querySelector('.sort-btn.descending').addEventListener('click', () => sortData(false));

// ─────────────────────────────────────────────
//  CLEAR
// ─────────────────────────────────────────────
document.querySelector('.clear-btn').addEventListener('click', () => {
    dataList.innerHTML = '';
    updateBadge();
    runCalculations();
});

// ─────────────────────────────────────────────
//  EXCEL IMPORT
// ─────────────────────────────────────────────
const excelUpload = document.getElementById('excel-upload');
if (excelUpload) {
    excelUpload.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (ev) {
            try {
                const wb  = XLSX.read(new Uint8Array(ev.target.result), { type: 'array' });
                const ws  = wb.Sheets[wb.SheetNames[0]];
                const raw = XLSX.utils.sheet_to_json(ws, { header: 1 });
                const nums = raw.flat().filter(v => v !== null && v !== '' && !isNaN(v) && typeof v !== 'boolean');
                if (!nums.length) { alert('No valid numbers found.'); return; }
                nums.forEach(n => dataList.appendChild(makeItem(n)));
                updateBadge();
                runCalculations();
            } catch (err) {
                console.error(err);
                alert('Error reading file.');
            }
            excelUpload.value = '';
        };
        reader.readAsArrayBuffer(file);
    });
}

// ─────────────────────────────────────────────
//  CHART
// ─────────────────────────────────────────────
let myChart = null;

function updateGraph(numbers) {
    const canvas = document.getElementById('frequencyChart');
    if (!canvas) return;

    if (myChart) { myChart.destroy(); myChart = null; }
    if (!numbers.length) return;

    const counts = {};
    numbers.forEach(n => { counts[n] = (counts[n] || 0) + 1; });
    const labels = Object.keys(counts).map(Number).sort((a, b) => a - b);
    const values = labels.map(l => counts[l]);

    myChart = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Frequency',
                data: values,
                backgroundColor: '#319795',
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
                    font: { size: 14, weight: 'bold', family: "'Segoe UI', sans-serif" }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 },
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

// ─────────────────────────────────────────────
//  FREQUENCY TABLE
// ─────────────────────────────────────────────
function updateFrequencyTable(numbers) {
    const tbody = document.querySelector('.frequency-table-card tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (!numbers.length) return;

    const counts = {};
    numbers.forEach(n => { counts[n] = (counts[n] || 0) + 1; });
    Object.keys(counts).map(Number).sort((a, b) => a - b).forEach(val => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${val}</td><td>${counts[val]}</td>`;
        tbody.appendChild(tr);
    });
}

// ─────────────────────────────────────────────
//  STATISTICS
// ─────────────────────────────────────────────
function calcMode(nums) {
    const freq = {};
    nums.forEach(n => { freq[n] = (freq[n] || 0) + 1; });
    const max = Math.max(...Object.values(freq));
    if (max === 1) return null;
    return Object.keys(freq).filter(k => freq[k] === max).map(Number).sort((a,b)=>a-b);
}

function calcSampleVariance(nums, mean) {
    if (nums.length < 2) return 0;
    return nums.reduce((s, x) => s + (x - mean) ** 2, 0) / (nums.length - 1);
}

function calcPopVariance(nums, mean) {
    return nums.reduce((s, x) => s + (x - mean) ** 2, 0) / nums.length;
}

// ─────────────────────────────────────────────
//  MAIN AUTO-CALCULATE
// ─────────────────────────────────────────────
function setCard(sel, val) {
    const el = document.querySelector(sel);
    if (el) el.textContent = val;
}

function runCalculations() {
    const numbers = getNumbers();

    if (!numbers.length) {
        setCard('.result-card.mean   .value', '0.00');
        setCard('.result-card.median .value', '0.00');
        setCard('.result-card.mode   .value', '--');
        setCard('.result-card.range  .value', '0');
        document.querySelectorAll('.result-card.variance').forEach(c => c.querySelector('.value').textContent = '0.00');
        document.querySelectorAll('.result-card.sd')      .forEach(c => c.querySelector('.value').textContent = '0.00');
        updateGraph([]);
        updateFrequencyTable([]);
        const steps = document.querySelector('.median-steps .steps-list');
        if (steps) steps.innerHTML = '';
        return;
    }

    const n      = numbers.length;
    const sorted = [...numbers].sort((a, b) => a - b);
    const mean   = numbers.reduce((a, b) => a + b, 0) / n;
    const median = n % 2 === 0
        ? (sorted[n/2 - 1] + sorted[n/2]) / 2
        : sorted[Math.floor(n/2)];
    const modes     = calcMode(numbers);
    const range     = Math.max(...numbers) - Math.min(...numbers);
    const sVar      = calcSampleVariance(numbers, mean);
    const pVar      = calcPopVariance(numbers, mean);
    const sSD       = Math.sqrt(sVar);
    const pSD       = Math.sqrt(pVar);

    setCard('.result-card.mean   .value', mean.toFixed(2));
    setCard('.result-card.median .value', median.toFixed(2));
    setCard('.result-card.mode   .value', modes ? modes.join(', ') : 'No Mode');
    setCard('.result-card.range  .value', range);

    const vCards = document.querySelectorAll('.result-card.variance');
    vCards[0].querySelector('.value').textContent = sVar.toFixed(2);
    vCards[1].querySelector('.value').textContent = pVar.toFixed(2);

    const sdCards = document.querySelectorAll('.result-card.sd');
    sdCards[0].querySelector('.value').textContent = sSD.toFixed(2);
    sdCards[1].querySelector('.value').textContent = pSD.toFixed(2);

    updateGraph(numbers);
    updateFrequencyTable(numbers);

    // Median steps
    const stepsList = document.querySelector('.median-steps .steps-list');
    if (stepsList) {
        stepsList.innerHTML = '';
        const steps = [
            `<span class="icon">①</span> Sorted: [ ${sorted.join(', ')} ]`,
            `<span class="icon">②</span> n = ${n} (${n % 2 === 0 ? 'even' : 'odd'})`,
            n % 2 === 0
                ? `<span class="icon">③</span> (${sorted[n/2-1]} + ${sorted[n/2]}) / 2 = <strong>${median.toFixed(2)}</strong>`
                : `<span class="icon">③</span> Middle value at position ${Math.floor(n/2)+1} = <strong>${median.toFixed(2)}</strong>`
        ];
        steps.forEach(s => {
            const li = document.createElement('li');
            li.innerHTML = s;
            stepsList.appendChild(li);
        });
    }
}

// ─────────────────────────────────────────────
//  INIT
// ─────────────────────────────────────────────
updateBadge();