
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





let resultsData = [];

async function loadCSV(year, semester) {
    try {
        const filePath = `/assets/csvs/btech-cse/results_${year}_sem${semester}.csv`;
        const response = await fetch(filePath);
        
        if (!response.ok) {
            throw new Error(`CSV file not found for ${year}, Semester ${semester}`);
        }

        const text = await response.text();
        resultsData = parseCSV(text);
    } catch (error) {
        console.error('Error loading CSV:', error.message);
        document.getElementById('result-display').innerHTML = `<p>Error loading results for ${year}, Semester ${semester}. Please ensure the file exists or try again later.</p>`;
        resultsData = [];
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

function getSubjectDisplay(subjectCode, score) {
    if (score.toUpperCase() === 'F') {
        return `<span>${subjectCode}</span><span class="failed">F</span>`;
    }
    return `<span>${subjectCode}</span><span>${score || 'N/A'}</span>`;
}

// Define subject codes and total credits for each semester
const semesterDetails = {
    '1': { subjects: ['AEC010', 'CE101', 'CSE111', 'CSE113', 'ME105', 'PHY107', 'PHY115', 'PT101', 'PT103', 'PT105', 'VAC022'], totalCredits: '20.00' },
    '3': { subjects: ['CSE251', 'CSE253', 'CSE255', 'CSE257', 'CSE259', 'CSE261', 'EE217', 'EE223', 'ENG205', 'MAT253'], totalCredits: '25.00' },
    '4': { subjects: ['CSE254', 'CSE256', 'CSE260', 'CSE262', 'EVS002', 'MAT212', 'MGT007', 'PT202', 'PT204', 'PT206', 'SSC007'], totalCredits: '22.00' },
    
    
};

function getSemesterDetails(semester) {
    return semesterDetails[semester] || { subjects: [], totalCredits: 'N/A' };
}

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

    resultDisplay.innerHTML = `<p>Loading results for ${year}, Semester ${semester}, please wait...</p>`;
    loadCSV(year, semester).then(() => {
        if (resultsData.length === 0) {
            return;
        }

        const result = resultsData.find(row => row['Roll No'] === rollNo);

        if (result) {
            const isRP = result['Remarks'].includes('RP');
            const { subjects, totalCredits } = getSemesterDetails(semester);
            const subjectItems = subjects.map(subject => 
                `<div class="subject-item">${getSubjectDisplay(subject, result[subject])}</div>`
            ).join('');

            resultDisplay.innerHTML = `
                <div class="result-wrapper">
                    <div class="result-meta">
                        <p><strong>Result Type:</strong> Regular</p>
                        <p><strong>Programme:</strong> UG</p>
                        <p><strong>Total Credits for the Semester:</strong> ${totalCredits}</p>
                    </div>
                    <div class="result-card">
                        <div class="result-header">${result['Student Name']}'s Result</div>
                        <div class="result-details">
                            <div class="detail-row"><span>Roll No</span><span>${result['Roll No']}</span></div>
                            <div class="detail-row"><span>Father Name</span><span>${result['Father Name']}</span></div>
                            <div class="detail-row"><span>Total Credit Point Earned</span><span>${result['TOTAL CREDIT POINT EARNED (B)']}</span></div>
                            <div class="detail-row"><span>Semester CGPA</span><span>${result['SEMESTER CREDIT POINT AVERAGE (B/A)']}</span></div>
                            <div class="subject-orbit">
                                ${subjectItems}
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