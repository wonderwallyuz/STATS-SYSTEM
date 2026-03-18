let groupedData = [];

// chart data
let classIntervals = [];
let frequencies = [];

// create chart
const ctx = document.getElementById("groupedBarChart").getContext("2d");

const groupedBarChart = new Chart(ctx, {
    type: "bar",
    data: {
        labels: classIntervals,
        datasets: [{
            label: "Frequency",
            data: frequencies,
            backgroundColor: "rgba(38, 166, 154, 0.7)",
            borderColor: "rgba(38, 166, 154, 1)",
            borderWidth: 1,
            borderRadius: 6,
            barThickness: 60
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true
            },
            title: {
                display: true,
                text: "Frequency Distribution Bar Graph",
                color: "#333",
                font: {
                    size: 18,
                    weight: "bold"
                }
            }
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: "Class Intervals",
                    color: "#333",
                    font: {
                        size: 14,
                        weight: "bold"
                    }
                },
                ticks: {
                    color: "#333"
                },
                grid: {
                    display: false
                }
            },
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: "Frequency",
                    color: "#333",
                    font: {
                        size: 14,
                        weight: "bold"
                    }
                },
                ticks: {
                    stepSize: 1,
                    color: "#333"
                },
                grid: {
                    color: "#e0e0e0"
                }
            }
        }
    }
});

// add row manually
function addRow() {
    const lowerLimit = document.getElementById("lowerLimit").value.trim();
    const upperLimit = document.getElementById("upperLimit").value.trim();
    const frequency = document.getElementById("frequency").value.trim();

    if (lowerLimit === "" || upperLimit === "" || frequency === "") {
        alert("Please fill in all fields.");
        return;
    }

    const lower = Number(lowerLimit);
    const upper = Number(upperLimit);
    const freq = Number(frequency);

    if (isNaN(lower) || isNaN(upper) || isNaN(freq)) {
        alert("Please enter valid numbers.");
        return;
    }

    if (lower > upper) {
        alert("Lower Class Limit must not be greater than Upper Class Limit.");
        return;
    }

    if (freq <= 0) {
        alert("Frequency must be greater than 0.");
        return;
    }

    groupedData.push({
        lowerLimit: lower,
        upperLimit: upper,
        frequency: freq
    });

    renderAddedIntervals();
    updateChart();
    renderAutoTable();

    document.getElementById("lowerLimit").value = "";
    document.getElementById("upperLimit").value = "";
    document.getElementById("frequency").value = "";
}

// render added intervals table
function renderAddedIntervals() {
    const tableBody = document.getElementById("addedIntervalsBody");
    const totalValues = document.getElementById("totalValues");
    const totalFrequency = document.getElementById("totalFrequency");

    tableBody.innerHTML = "";

    if (groupedData.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="3" style="text-align:center; color:#888;">
                    No data input yet
                </td>
            </tr>
        `;
        totalValues.textContent = "Total values: 0";
        totalFrequency.textContent = "0";
        return;
    }

    let totalFreq = 0;

    groupedData.forEach((item, index) => {
        totalFreq += item.frequency;

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${item.lowerLimit}-${item.upperLimit}</td>
            <td>${item.frequency}</td>
            <td>
                <span class="action-icon icon-edit" onclick="editRow(${index})">Edit</span>
                <span class="action-icon icon-trash" onclick="deleteRow(${index})">Remove</span>
            </td>
        `;
        tableBody.appendChild(row);
    });

    totalValues.textContent = `Total values: ${groupedData.length}`;
    totalFrequency.textContent = totalFreq;
}

// update chart
function updateChart() {

    const graphMessage = document.getElementById("noGraphData");

    if (groupedData.length === 0) {
        graphMessage.style.display = "block";
        groupedBarChart.data.labels = [];
        groupedBarChart.data.datasets[0].data = [];
        groupedBarChart.update();
        return;
    }

    graphMessage.style.display = "none";

    classIntervals = groupedData.map(item => `${item.lowerLimit}-${item.upperLimit}`);
    frequencies = groupedData.map(item => item.frequency);

    groupedBarChart.data.labels = classIntervals;
    groupedBarChart.data.datasets[0].data = frequencies;
    groupedBarChart.update();
}

// delete row
function deleteRow(index) {
    groupedData.splice(index, 1);
    renderAddedIntervals();
    updateChart();
    renderAutoTable();
}

// edit row
function editRow(index) {
    const item = groupedData[index];

    document.getElementById("lowerLimit").value = item.lowerLimit;
    document.getElementById("upperLimit").value = item.upperLimit;
    document.getElementById("frequency").value = item.frequency;

    groupedData.splice(index, 1);
    renderAddedIntervals();
    updateChart();
    renderAutoTable();
}
// excel upload
document.getElementById("excelFile").addEventListener("change", handleExcelUpload);

function showExcelError(message) {
    const errorBox = document.getElementById("excelError");

    if (!errorBox) {
        alert("⚠️ " + message);
        return;
    }

    errorBox.innerHTML = `⚠️ ${message}`;
    errorBox.style.display = "block";
}

// clear excel error
function clearExcelError() {
    const errorBox = document.getElementById("excelError");
    if (errorBox) {
        errorBox.innerHTML = "";
        errorBox.style.display = "none";
    }
}

// excel upload handler
function handleExcelUpload(event) {
    const file = event.target.files[0];

    clearExcelError();

    if (!file) return;

    const allowedExtensions = [".xlsx", ".xls"];
    const fileName = file.name.toLowerCase();
    const isValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));

    if (!isValidExtension) {
        showExcelError("Invalid file type. Please upload an Excel file (.xlsx or .xls).");
        event.target.value = "";
        return;
    }

    if (file.size === 0) {
        showExcelError("The selected file is empty.");
        event.target.value = "";
        return;
    }

    const reader = new FileReader();

    reader.onerror = function () {
        showExcelError("Failed to read the Excel file.");
        event.target.value = "";
    };

    reader.onload = function (e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: "array" });

            if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
                showExcelError("No worksheet found in the Excel file.");
                event.target.value = "";
                return;
            }

            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

            if (!jsonData || jsonData.length === 0) {
                showExcelError("The Excel file has no usable data.");
                event.target.value = "";
                return;
            }

            let validRows = 0;
            let invalidRows = [];

            // START AT ROW 0 (no header)
            for (let i = 0; i < jsonData.length; i++) {

                const row = jsonData[i];

                if (!row || row.length < 3) {
                    invalidRows.push(i + 1);
                    continue;
                }

                const lowerLimit = Number(row[0]);
                const upperLimit = Number(row[1]);
                const frequency = Number(row[2]);

                if (
                    isNaN(lowerLimit) ||
                    isNaN(upperLimit) ||
                    isNaN(frequency) ||
                    lowerLimit > upperLimit ||
                    frequency <= 0
                ) {
                    invalidRows.push(i + 1);
                    continue;
                }

                groupedData.push({
                    lowerLimit: lowerLimit,
                    upperLimit: upperLimit,
                    frequency: frequency
                });

                validRows++;
            }

            if (validRows === 0) {
                showExcelError("⚠️ No valid rows were found in the Excel file.");
                event.target.value = "";
                return;
            }

            renderAddedIntervals();
            updateChart();
            renderAutoTable();

            if (invalidRows.length > 0) {
                showExcelError(
                    `⚠️ Imported with warnings. ${validRows} valid row(s) added, invalid data found on row(s): ${invalidRows.join(", ")}.`
                );
            } else {
                clearExcelError();
            }

        } catch (error) {
            console.error("Excel upload error:", error);
            showExcelError("⚠️ An error occurred while processing the Excel file.");
        }

        event.target.value = "";
    };

    reader.readAsArrayBuffer(file);
}

// clear all data
function clearAllData() {

    if (groupedData.length === 0) {
        showExcelError("⚠️ There is no data to clear.");
        return;
    }

    const confirmClear = confirm("⚠️ Are you sure you want to clear all data?");

    if (!confirmClear) return;

    // Clear stored data
    groupedData = [];

    // Reset table
    renderAddedIntervals();

    // Reset chart
    classIntervals = [];
    frequencies = [];

    groupedBarChart.data.labels = [];
    groupedBarChart.data.datasets[0].data = [];
    groupedBarChart.update();

    // Reset totals
    const totalValues = document.getElementById("totalValues");
    const totalFrequency = document.getElementById("totalFrequency");

    if (totalValues) totalValues.textContent = "Total values: 0";
    if (totalFrequency) totalFrequency.textContent = "0";

    clearExcelError();
}

// sort by lower limit
function sortByLowerLimit() {

    if (groupedData.length === 0) {
        showExcelError("⚠️ No data available to sort.");
        return;
    }

    // sort ascending by lower limit
    groupedData.sort((a, b) => a.lowerLimit - b.lowerLimit);

    renderAddedIntervals();
    updateChart();
    renderAutoTable();
}

function renderAutoTable() {
    const tbody = document.getElementById("autoTableBody");
    const tfoot = document.getElementById("autoTableFooter");
    
    if (!tbody) return; 
    tbody.innerHTML = "";
    if (tfoot) tfoot.innerHTML = ""; 

    // Handle empty data state
    if (!groupedData || groupedData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#999;">No data to display</td></tr>`;
        return;
    }

    let cumulativeFrequency = 0;
    let sumF = 0;
    let sumFX = 0;

    groupedData.forEach((data, index) => {
        const classInterval = `${data.lowerLimit} - ${data.upperLimit}`;
        const frequency = Number(data.frequency);
        const classWidth = (data.upperLimit - data.lowerLimit) + 1;
        const midpoint = (data.lowerLimit + data.upperLimit) / 2;
        const fx = frequency * midpoint;
        
        cumulativeFrequency += frequency;
        sumF += frequency;
        sumFX += fx;

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${classInterval}</td>
            <td>${frequency} <span style="cursor:pointer" onclick="editFrequency(${index})"></span></td>
            <td>${classWidth}</td>
            <td>${midpoint}</td>
            <td>${fx.toFixed(2)}</td>
            <td>${cumulativeFrequency}</td>
            <td><input type="checkbox"></td>
        `;
        tbody.appendChild(row);
    });

    if (tfoot) {
        tfoot.innerHTML = `
            <tr>
                <td><strong>Total</strong></td>
                <td><strong>Σ f = ${sumF}</strong></td>
                <td></td>
                <td></td>
                <td><strong>Σ f⋅x = ${sumFX.toFixed(2)}</strong></td>
                <td></td>
                <td></td>
            </tr>`;
    }
    calculateStatistics(groupedData);
}

// THIS LINE MAKES IT AUTOMATIC:
document.addEventListener("DOMContentLoaded", renderAutoTable);

function editFrequency(index) {
    const newFreq = prompt("Enter new frequency:", groupedData[index].frequency);
    if (newFreq !== null && !isNaN(newFreq) && newFreq > 0) {
        groupedData[index].frequency = Number(newFreq);
        renderAutoTable(); // Refresh the table
        updateChart();      // Refresh your chart
    }
}

/**
 * renamed from addRow to generateAutoTable
 * This function processes the 'groupedData' array and renders the full stats table.
 */
function generateAutoTable() {
    const tbody = document.getElementById("autoTableBody");
    const tfoot = document.getElementById("autoTableFooter");
    
    // Reset table content
    tbody.innerHTML = "";
    
    let cumulativeF = 0;
    let sumF = 0;
    let sumFX = 0;

    // Loop through your data array to calculate and create rows
    groupedData.forEach((data, index) => {
        // 1. Perform Calculations
        const interval = `${data.lowerLimit} - ${data.upperLimit}`;
        const frequency = Number(data.frequency);
        const width = (data.upperLimit - data.lowerLimit) + 1; 
        const midpoint = (data.lowerLimit + data.upperLimit) / 2;
        const fx = frequency * midpoint;
        
        cumulativeF += frequency;
        sumF += frequency;
        sumFX += fx;

        // 2. Build the Row HTML
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${interval}</td>
            <td>
                ${frequency} 
                <span class="edit-in-table" style="cursor:pointer" onclick="quickEdit(${index})">✏️</span>
            </td>
            <td>${width}</td>
            <td>${midpoint}</td>
            <td>${fx.toFixed(2)}</td>
            <td>${cumulativeF}</td>
            <td><input type="checkbox"></td>
        `;
        tbody.appendChild(row);
    });

    // 3. Update the Footer with Totals
    tfoot.innerHTML = `
        <tr>
            <td><strong>Total</strong></td>
            <td><strong>Σ f = ${sumF}</strong></td>
            <td></td>
            <td></td>
            <td><strong>Σ f⋅x = ${sumFX.toFixed(2)}</strong></td>
            <td></td>
            <td></td>
        </tr>
    `;
}

function calculateStatistics(groupedData) {
    if (!groupedData || groupedData.length === 0) return;

    // 1. Basic Totals
    const n = groupedData.reduce((sum, d) => sum + Number(d.frequency), 0);
    const sumFX = groupedData.reduce((sum, d) => sum + (Number(d.frequency) * ((d.lowerLimit + d.upperLimit) / 2)), 0);
    const mean = sumFX / n;

    // 2. Median Calculation
    // Find Median Class (where cumulative frequency >= n/2)
    let cumulativeF = 0;
    let medianClass = groupedData[0];
    let prevCF = 0;
    for (let i = 0; i < groupedData.length; i++) {
        cumulativeF += Number(groupedData[i].frequency);
        if (cumulativeF >= n / 2) {
            medianClass = groupedData[i];
            prevCF = cumulativeF - Number(groupedData[i].frequency);
            break;
        }
    }
    const L_med = medianClass.lowerLimit - 0.5; // Lower boundary
    const f_med = Number(medianClass.frequency);
    const c = (medianClass.upperLimit - medianClass.lowerLimit) + 1; // Class width
    const median = L_med + (( (n / 2) - prevCF ) / f_med) * c;

    // 3. Mode Calculation
    // Find Modal Class (class with highest frequency)
    let modalIndex = 0;
    for (let i = 1; i < groupedData.length; i++) {
        if (Number(groupedData[i].frequency) > Number(groupedData[modalIndex].frequency)) {
            modalIndex = i;
        }
    }
    const modalClass = groupedData[modalIndex];
    const L_mo = modalClass.lowerLimit - 0.5;
    const f1 = Number(modalClass.frequency);
    const f0 = modalIndex > 0 ? Number(groupedData[modalIndex - 1].frequency) : 0;
    const f2 = modalIndex < groupedData.length - 1 ? Number(groupedData[modalIndex + 1].frequency) : 0;
    const mode = L_mo + ((f1 - f0) / ((f1 - f0) + (f1 - f2))) * c;

    // 4. Variance & SD
    // Formula: s² = Σ f(x - mean)² / (n - 1)
    let sumF_xMinusMeanSq = 0;
    groupedData.forEach(d => {
        const x = (d.lowerLimit + d.upperLimit) / 2;
        sumF_xMinusMeanSq += Number(d.frequency) * Math.pow(x - mean, 2);
    });
    const variance = sumF_xMinusMeanSq / (n - 1);
    const sd = Math.sqrt(variance);

    // 5. Update HTML
    document.querySelector(".card-mean .result-value").innerText = mean.toFixed(2);
    document.querySelector(".card-median .result-value").innerText = median.toFixed(2);
    document.querySelector(".card-mode .result-value").innerText = mode.toFixed(2);
    document.querySelector(".variance .result-value").innerText = variance.toFixed(2);
    document.querySelector(".sd .result-value").innerText = sd.toFixed(2);
}
/**
 * Helper to edit frequency directly from the table
 */
