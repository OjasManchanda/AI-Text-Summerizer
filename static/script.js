document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const inputText = document.getElementById('inputText');
    const summarizeBtn = document.getElementById('summarizeBtn');
    const maxLengthSelect = document.getElementById('maxLength');
    const outputSection = document.getElementById('outputSection');
    const outputText = document.getElementById('outputText');
    const errorMessage = document.getElementById('errorMessage');
    const charCount = document.getElementById('charCount');
    const copyBtn = document.getElementById('copyBtn');
    const btnText = document.querySelector('.btn-text');
    const loadingSpinner = document.querySelector('.loading-spinner');
    
    // Stats elements
    const originalLength = document.getElementById('originalLength');
    const summaryLength = document.getElementById('summaryLength');
    const compressionRatio = document.getElementById('compressionRatio');

    // Character counter
    inputText.addEventListener('input', function() {
        const count = this.value.length;
        charCount.textContent = count;
        
        // Change color based on usage
        if (count > 1800) {
            charCount.style.color = '#e53e3e';
        } else if (count > 1500) {
            charCount.style.color = '#dd6b20';
        } else {
            charCount.style.color = '#666';
        }
    });

    // Summarize button click handler
    summarizeBtn.addEventListener('click', async function() {
        const text = inputText.value.trim();
        
        // Hide previous results
        hideOutput();
        hideError();
        
        // Validation
        if (!text) {
            showError('Please enter some text to summarize.');
            return;
        }
        
        if (text.split(' ').length < 10) {
            showError('Please provide at least 10 words for summarization.');
            return;
        }
        
        // Show loading state
        setLoadingState(true);
        
        try {
            const response = await fetch('/summarize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: text,
                    max_length: parseInt(maxLengthSelect.value),
                    min_length: Math.min(30, Math.floor(parseInt(maxLengthSelect.value) * 0.3))
                })
            });
            
            const data = await response.json();
            
            if (response.ok && data.status === 'success') {
                displaySummary(data);
            } else {
                showError(data.error || 'An error occurred while generating the summary.');
            }
            
        } catch (error) {
            console.error('Error:', error);
            showError('Network error. Please check your connection and try again.');
        } finally {
            setLoadingState(false);
        }
    });

    // Copy button functionality
    copyBtn.addEventListener('click', function() {
        const textToCopy = outputText.textContent;
        
        // Modern clipboard API
        if (navigator.clipboard) {
            navigator.clipboard.writeText(textToCopy).then(function() {
                showCopyFeedback();
            }).catch(function() {
                fallbackCopyText(textToCopy);
            });
        } else {
            fallbackCopyText(textToCopy);
        }
    });

    // Enter key to summarize (Ctrl+Enter)
    inputText.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            summarizeBtn.click();
        }
    });

    // Helper functions
    function setLoadingState(loading) {
        if (loading) {
            summarizeBtn.disabled = true;
            btnText.style.display = 'none';
            loadingSpinner.style.display = 'block';
        } else {
            summarizeBtn.disabled = false;
            btnText.style.display = 'block';
            loadingSpinner.style.display = 'none';
        }
    }

    function displaySummary(data) {
        outputText.textContent = data.summary;
        originalLength.textContent = `${data.original_length} words`;
        summaryLength.textContent = `${data.summary_length} words`;
        compressionRatio.textContent = `${data.compression_ratio}% shorter`;
        
        outputSection.style.display = 'block';
        outputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        errorMessage.scrollIntoView({ behavior: 'smooth' });
    }

    function hideError() {
        errorMessage.style.display = 'none';
    }

    function hideOutput() {
        outputSection.style.display = 'none';
    }

    function showCopyFeedback() {
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '✓ Copied!';
        copyBtn.style.background = '#48bb78';
        
        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.style.background = '#667eea';
        }, 2000);
    }

    function fallbackCopyText(text) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            showCopyFeedback();
        } catch (err) {
            console.error('Copy failed:', err);
        }
        
        document.body.removeChild(textArea);
    }

    // Add some sample text for demo
    const sampleTexts = [
        "Artificial intelligence (AI) is intelligence demonstrated by machines, as opposed to natural intelligence displayed by animals including humans. AI research has been defined as the field of study of intelligent agents, which refers to any system that perceives its environment and takes actions that maximize its chance of achieving its goals. The term artificial intelligence is applied when a machine mimics cognitive functions that humans associate with the human mind, such as learning and problem solving. As machines become increasingly capable, tasks considered to require intelligence are often removed from the definition of AI, a phenomenon known as the AI effect.",
        
        "Climate change refers to long-term shifts in global temperatures and weather patterns. While climate variations are natural, since the 1800s, human activities have been the main driver of climate change, primarily due to the burning of fossil fuels which releases greenhouse gases into the atmosphere. The evidence for rapid climate change is compelling: global temperature rise, warming oceans, shrinking ice sheets, declining Arctic sea ice, glacial retreat, decreased snow cover, sea level rise, and extreme weather events. The consequences affect food security, water resources, human health, and economic stability worldwide."
    ];
    
    
    const sampleBtn = document.createElement('button');
    sampleBtn.textContent = 'Try Sample Text';
    sampleBtn.className = 'sample-btn';
    sampleBtn.style.cssText = `
        background: #e2e8f0;
        color: #4a5568;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 14px;
        cursor: pointer;
        margin-left: 10px;
        transition: background-color 0.3s;
    `;
    
    sampleBtn.addEventListener('mouseover', () => sampleBtn.style.background = '#cbd5e0');
    sampleBtn.addEventListener('mouseout', () => sampleBtn.style.background = '#e2e8f0');
    
    sampleBtn.addEventListener('click', () => {
        const randomText = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
        inputText.value = randomText;
        inputText.dispatchEvent(new Event('input'));
    });
    
    // Add sample button after the textarea
    inputText.parentNode.appendChild(sampleBtn);
});