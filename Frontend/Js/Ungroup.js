
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

function clearExcelError() {
    const errorBox = document.getElementById("excelError");
    if (errorBox) {
        errorBox.innerHTML = "";
        errorBox.style.display = "none";
    }
}
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