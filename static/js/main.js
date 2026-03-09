document.addEventListener('DOMContentLoaded', () => {
    // Tab Switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    const panels = document.querySelectorAll('.scanner-panel');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all tabs and panels
            tabBtns.forEach(b => b.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));

            // Add active class to clicked tab and corresponding panel
            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');

            // Hide results container when switching tabs
            document.getElementById('results-container').style.display = 'none';
        });
    });

    // File Upload Handling - Image
    const imageInput = document.getElementById('image-input');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const imagePreview = document.getElementById('image-preview');
    const imageFileName = document.getElementById('image-file-name');
    const analyzeImageBtn = document.getElementById('analyze-image-btn');
    const imageUploadArea = document.getElementById('image-upload');

    // File Upload Handling - Video
    const videoInput = document.getElementById('video-input');
    const videoPreviewContainer = document.getElementById('video-preview-container');
    const videoPreview = document.getElementById('video-preview');
    const videoFileName = document.getElementById('video-file-name');
    const analyzeVideoBtn = document.getElementById('analyze-video-btn');
    const videoUploadArea = document.getElementById('video-upload');

    function handleFile(file, type) {
        if (!file) return;

        if (type === 'image' && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.src = e.target.result;
                imageFileName.textContent = file.name;
                imagePreviewContainer.style.display = 'block';
                analyzeImageBtn.disabled = false;
            };
            reader.readAsDataURL(file);
        } else if (type === 'video' && file.type.startsWith('video/')) {
            const url = URL.createObjectURL(file);
            videoPreview.src = url;
            videoFileName.textContent = file.name;
            videoPreviewContainer.style.display = 'block';
            analyzeVideoBtn.disabled = false;
        } else if (type === 'text' && (file.type === 'text/plain' || file.name.endsWith('.txt'))) {
            document.getElementById('text-file-name').textContent = file.name;
            const reader = new FileReader();
            reader.onload = (ev) => {
                document.getElementById('text-input').value = ev.target.result;
                const length = document.getElementById('text-input').value.length;
                document.querySelector('.word-count').textContent = `${length}/50000 characters`;
            };
            reader.readAsText(file);
        } else if (type === 'text') {
            alert("Please upload a valid .txt file");
        }
    }

    // Input changes
    imageInput.addEventListener('change', (e) => handleFile(e.target.files[0], 'image'));
    videoInput.addEventListener('change', (e) => handleFile(e.target.files[0], 'video'));

    const textFileInput = document.getElementById('text-file-input');
    textFileInput.addEventListener('change', (e) => handleFile(e.target.files[0], 'text'));

    // Drag and drop setup for areas
    function setupDragAndDrop(area, input, type) {
        area.addEventListener('dragover', (e) => {
            e.preventDefault();
            area.classList.add('dragover');
        });

        area.addEventListener('dragleave', () => {
            area.classList.remove('dragover');
        });

        area.addEventListener('drop', (e) => {
            e.preventDefault();
            area.classList.remove('dragover');
            if (e.dataTransfer.files.length) {
                input.files = e.dataTransfer.files;
                handleFile(e.dataTransfer.files[0], type);
            }
        });
    }

    setupDragAndDrop(imageUploadArea, imageInput, 'image');
    setupDragAndDrop(videoUploadArea, videoInput, 'video');
    const textUploadArea = document.getElementById('text-upload');
    setupDragAndDrop(textUploadArea, textFileInput, 'text');

    // Text Area Analysis
    const textInput = document.getElementById('text-input');
    const wordCount = document.querySelector('.word-count');
    const analyzeTextBtn = document.getElementById('analyze-text-btn');

    textInput.addEventListener('input', () => {
        const length = textInput.value.length;
        wordCount.textContent = `${length}/50000 characters`;
        if (length > 50000) {
            textInput.value = textInput.value.substring(0, 50000);
            wordCount.textContent = `50000/50000 characters`;
        }
    });

    // Analysis Logic
    const resultsContainer = document.getElementById('results-container');
    const analysisLoader = document.getElementById('analysis-loader');
    const resultCard = document.getElementById('result-card');

    // Result elements
    const resultVerdict = document.getElementById('result-verdict');
    const resultReason = document.getElementById('result-reason');
    const scoreText = document.getElementById('score-text');
    const scorePath = document.getElementById('score-path');
    const resultHeader = document.querySelector('.result-header');

    const fakeBar = document.getElementById('fake-bar');
    const fakeText = document.getElementById('fake-text');
    const realBar = document.getElementById('real-bar');
    const realText = document.getElementById('real-text');

    // History Logic
    const historyList = document.getElementById('history-list');
    const historyEmpty = document.getElementById('history-empty');
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    let scanHistory = JSON.parse(localStorage.getItem('sleuthAI_history')) || [];

    function saveToHistory(data, inputType, inputValue) {
        const historyEntry = {
            id: Date.now(),
            date: new Date().toLocaleString(),
            type: inputType,
            value: inputValue,
            result: data.analysis.result,
            confidence: data.analysis.confidence_score,
            reason: data.analysis.reason
        };

        scanHistory.unshift(historyEntry); // Add to beginning
        if (scanHistory.length > 20) scanHistory.pop(); // Keep only last 20

        localStorage.setItem('sleuthAI_history', JSON.stringify(scanHistory));
        renderHistory();
    }

    function renderHistory() {
        historyList.innerHTML = '';

        if (scanHistory.length === 0) {
            historyEmpty.style.display = 'block';
            clearHistoryBtn.style.display = 'none';
            return;
        }

        historyEmpty.style.display = 'none';
        clearHistoryBtn.style.display = 'block';

        scanHistory.forEach(item => {
            const li = document.createElement('li');
            li.className = 'history-item';

            // Add appropriate color class
            if (item.confidence > 60) li.classList.add('score-fake');
            else if (item.confidence > 30) li.classList.add('score-suspicious');
            else li.classList.add('score-safe');

            // Format title
            let titlePrefix = '';
            if (item.type === 'video') titlePrefix = '<i class="fa-solid fa-film"></i> Video Scanner: ';
            else if (item.type === 'image') titlePrefix = '<i class="fa-regular fa-image"></i> Image Scanner: ';
            else titlePrefix = '<i class="fa-solid fa-align-left"></i> Text Scanner: ';

            // Value snippet (truncate text if needed)
            let snippet = item.value;
            if (item.type === 'text' && snippet.length > 30) {
                snippet = snippet.substring(0, 30) + '...';
            }

            li.innerHTML = `
                <div class="history-content">
                    <h4>${titlePrefix} ${item.result}</h4>
                    <div><strong style="color:var(--text-primary)">Input:</strong> ${snippet}</div>
                    <div class="history-details">${item.date} • ${item.reason}</div>
                </div>
                <div class="history-score">${item.confidence}%</div>
            `;
            historyList.appendChild(li);
        });
    }

    // Initial render
    renderHistory();

    clearHistoryBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear your scan history?')) {
            scanHistory = [];
            localStorage.removeItem('sleuthAI_history');
            renderHistory();
        }
    });

    function showResults(data) {
        analysisLoader.style.display = 'none';
        resultCard.style.display = 'block';

        let confidence = data.analysis.confidence_score;
        let resultType = data.analysis.result;
        let reason = data.analysis.reason;

        // Calculate fake and real percentages
        let fakePercentage = confidence;
        let realPercentage = (100 - confidence).toFixed(2);

        // Format to whole numbers if they end in .00
        if (realPercentage.endsWith('.00')) realPercentage = parseInt(realPercentage);
        if (Number.isInteger(fakePercentage)) fakePercentage = parseInt(fakePercentage);

        // Reset classes
        resultHeader.parentElement.className = 'result-card';

        // Define styling based on score
        if (confidence > 60) {
            resultHeader.parentElement.classList.add('score-fake');
        } else if (confidence > 30) {
            resultHeader.parentElement.classList.add('score-suspicious');
        } else {
            resultHeader.parentElement.classList.add('score-safe');
        }

        // Animate main score
        scoreText.textContent = confidence + '%';
        scorePath.setAttribute('stroke-dasharray', `${confidence}, 100`);

        // Update detail bars
        fakeBar.style.width = `${fakePercentage}%`;
        fakeText.textContent = `${fakePercentage}%`;

        realBar.style.width = `${realPercentage}%`;
        realText.textContent = `${realPercentage}%`;

        // Explicitly format verdict text
        if (confidence > 60) {
            resultVerdict.textContent = `${confidence}% AI Generated`;
        } else {
            resultVerdict.textContent = resultType;
        }

        resultReason.textContent = reason;
    }

    function triggerAnalysis(endpoint, formDataFunc, inputType, inputValue) {
        // Show loader
        resultsContainer.style.display = 'block';
        analysisLoader.style.display = 'block';
        resultCard.style.display = 'none';

        // Disable all analyze buttons
        document.querySelectorAll('.analyze-btn').forEach(btn => btn.disabled = true);

        // Fetch
        const { options, isFormData } = formDataFunc();

        fetch(endpoint, options)
            .then(res => res.json())
            .then(data => {
                setTimeout(() => { // Add a slight delay for realism
                    showResults(data);
                    saveToHistory(data, inputType, inputValue);
                    // Re-enable current tab button
                    const currentActivePanel = document.querySelector('.scanner-panel.active');
                    currentActivePanel.querySelector('.analyze-btn').disabled = false;
                }, 1500);
            })
            .catch(err => {
                console.error(err);
                analysisLoader.style.display = 'none';
                alert('An error occurred during analysis.');
                // Re-enable current tab button
                const currentActivePanel = document.querySelector('.scanner-panel.active');
                currentActivePanel.querySelector('.analyze-btn').disabled = false;
            });
    }

    // Button event listeners
    analyzeImageBtn.addEventListener('click', () => {
        triggerAnalysis('/analyze-image', () => {
            const formData = new FormData();
            formData.append('image', imageInput.files[0]);
            return {
                options: { method: 'POST', body: formData },
                isFormData: true
            };
        }, 'image', imageInput.files[0] ? imageInput.files[0].name : "Unknown Image");
    });

    analyzeVideoBtn.addEventListener('click', () => {
        triggerAnalysis('/analyze-video', () => {
            const formData = new FormData();
            formData.append('video', videoInput.files[0]);
            return {
                options: { method: 'POST', body: formData },
                isFormData: true
            };
        }, 'video', videoInput.files[0] ? videoInput.files[0].name : "Unknown Video");
    });

    analyzeTextBtn.addEventListener('click', () => {
        if (!textInput.value.trim()) {
            alert('Please enter some text to analyze.');
            return;
        }
        triggerAnalysis('/analyze-text', () => {
            return {
                options: {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: textInput.value })
                },
                isFormData: false
            };
        }, 'text', textInput.value);
    });

    // Reset button
    document.getElementById('scan-again-btn').addEventListener('click', () => {
        resultsContainer.style.display = 'none';

        // Reset current active form
        const activeTab = document.querySelector('.tab-btn.active').getAttribute('data-target');

        if (activeTab === 'image-scanner') {
            imageInput.value = '';
            imagePreviewContainer.style.display = 'none';
            analyzeImageBtn.disabled = true;
        } else if (activeTab === 'video-scanner') {
            videoInput.value = '';
            videoPreviewContainer.style.display = 'none';
            analyzeVideoBtn.disabled = true;
        } else if (activeTab === 'text-scanner') {
            textInput.value = '';
            document.querySelector('.word-count').textContent = '0/50000 characters';
            document.getElementById('text-file-input').value = '';
            document.getElementById('text-file-name').textContent = '';
        }
    });
});
