
// Particle Effect
const particlesContainer = document.getElementById('particles');
for (let i = 0; i < 20; i++) {
    const particle = document.createElement('div');
    particle.classList.add('particle');
    particle.style.width = `${Math.random() * 10 + 5}px`;
    particle.style.height = particle.style.width;
    particle.style.left = `${Math.random() * 100}vw`;
    particle.style.top = `${Math.random() * 100}vh`;
    particle.style.animationDelay = `${Math.random() * 5}s`;
    particlesContainer.appendChild(particle);
}





// Load and parse CSV file
let resultsData = [];

async function loadCSV(year, semester) {
    try {
        // Construct the dynamic CSV file path based on year and semester
        const filePath = `../csvs/btech-cse/results_${year}_sem${semester}.csv`;
        const response = await fetch(filePath);
        
        // Check if the response is OK (e.g., file exists)
        if (!response.ok) {
            throw new Error(`CSV file not found for ${year}, Semester ${semester}`);
        }

        const text = await response.text();
        resultsData = parseCSV(text);
    } catch (error) {
        console.error('Error loading CSV:', error.message);
        document.getElementById('result-display').innerHTML = `<p>Error loading results for ${year}, Semester ${semester}. Please ensure the file exists or try again later.</p>`;
        resultsData = []; // Reset resultsData on error
    }
}

function parseCSV(csvText) {
    const rows = csvText.trim().split('\n');
    const headers = rows[0].split(',').map(header => header.trim());
    const data = [];

    for (let i = 1; i < rows.length; i++) {
        const cols = rows[i].split(',').map(col => col.trim());
        const row = {};
        headers.forEach((header, index) => {
            row[header] = cols[index] || '';
        });
        data.push(row);
    }
    return data;
}

// Helper function to determine subject status
function getSubjectDisplay(subjectCode, score) {
    if (score.toUpperCase() === 'F') {
        return `<span>${subjectCode}</span><span class="failed">F</span>`;
    }
    return `<span>${subjectCode}</span><span>${score || 'N/A'}</span>`;
}

// Search Result Function
function searchResult() {
    const rollNo = document.getElementById('roll-no').value.trim();
    const semester = document.getElementById('semester').value;
    const year = document.getElementById('year').value;
    const resultDisplay = document.getElementById('result-display');

    if (!rollNo || !semester || !year) {
        resultDisplay.innerHTML = `<p>Please enter roll number and select all fields to view results.</p>`;
        resultDisplay.style.animation = 'zoomIn 0.5s ease-out';
        return;
    }

    // Reset resultsData if the year or semester has changed
    // This ensures we load the correct CSV file
    resultDisplay.innerHTML = `<p>Loading results for ${year}, Semester ${semester}, please wait...</p>`;
    loadCSV(year, semester).then(() => {
        // After loading, check if data exists and search for the result
        if (resultsData.length === 0) {
            // Error message is already set by loadCSV in case of failure
            return;
        }

        const result = resultsData.find(row => row['Roll No'] === rollNo);

        if (result) {
            const isRP = result['Remarks'].includes('RP');
            resultDisplay.innerHTML = `
                <div class="result-wrapper">
                    <div class="result-meta">
                        <p><strong>Result Type:</strong> Regular</p>
                        <p><strong>Programme:</strong> UG</p>
                        <p><strong>Total Credits for the Semester:</strong> 25.00</p>
                    </div>
                    <div class="result-card">
                        <div class="result-header">${result['Student Name']}'s Result</div>
                        <div class="result-details">
                            <div class="detail-row"><span>Roll No</span><span>${result['Roll No']}</span></div>
                            <div class="detail-row"><span>Father Name</span><span>${result['Father Name']}</span></div>
                            <div class="detail-row"><span>Total Credit Point Earned </span><span>${result['TOTAL CREDIT POINT EARNED (B)']}</span></div>
                            <div class="detail-row"><span>Semester CGPA</span><span>${result['SEMESTER CREDIT POINT AVERAGE (B/A)']}</span></div>
                            <div class="subject-orbit">
                                <div class="subject-item">${getSubjectDisplay('CSE251', result['CSE251'])}</div>
                                <div class="subject-item">${getSubjectDisplay('CSE253', result['CSE253'])}</div>
                                <div class="subject-item">${getSubjectDisplay('CSE255', result['CSE255'])}</div>
                                <div class="subject-item">${getSubjectDisplay('CSE257', result['CSE257'])}</div>
                                <div class="subject-item">${getSubjectDisplay('CSE259', result['CSE259'])}</div>
                                <div class="subject-item">${getSubjectDisplay('CSE261', result['CSE261'])}</div>
                                <div class="subject-item">${getSubjectDisplay('EE217', result['EE217'])}</div>
                                <div class="subject-item">${getSubjectDisplay('EE223', result['EE223'])}</div>
                                <div class="subject-item">${getSubjectDisplay('ENG205', result['ENG205'])}</div>
                                <div class="subject-item">${getSubjectDisplay('MAT253', result['MAT253'])}</div>
                            </div>
                            <div class="remarks ${isRP ? 'rp' : ''}">${result['Remarks']}</div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            resultDisplay.innerHTML = `<p>No result found for Roll No: ${rollNo}, Semester: ${semester}, Year: ${year}</p>`;
        }
        resultDisplay.style.animation = 'zoomIn 0.5s ease-out';
    });
}

// No initial load of CSV on page load
// loadCSV('2024', '3'); // Removed






