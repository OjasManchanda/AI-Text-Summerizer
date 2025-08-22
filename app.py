from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import re
import heapq
from collections import defaultdict

app = Flask(__name__)
CORS(app)

def simple_extractive_summarizer(text, num_sentences=3):
    """
    A simple extractive summarizer that doesn't require external AI models
    """
    # Clean text
    text = re.sub(r'\s+', ' ', text.strip())
    
    # Split into sentences
    sentences = re.split(r'[.!?]+', text)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 10]
    
    if len(sentences) <= num_sentences:
        return text
    
    # Simple word frequency approach
    words = re.findall(r'\b\w+\b', text.lower())
    word_freq = defaultdict(int)
    
    # Remove common stop words
    stop_words = {
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
        'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 
        'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
        'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they'
    }
    
    for word in words:
        if word not in stop_words and len(word) > 2:
            word_freq[word] += 1
    
    # Score sentences based on word frequencies
    sentence_scores = []
    for i, sentence in enumerate(sentences):
        sentence_words = re.findall(r'\b\w+\b', sentence.lower())
        score = sum(word_freq[word] for word in sentence_words if word in word_freq)
        sentence_scores.append((score, i, sentence))
    
    # Get top sentences
    top_sentences = heapq.nlargest(num_sentences, sentence_scores, key=lambda x: x[0])
    
    # Sort by original order
    top_sentences.sort(key=lambda x: x[1])
    
    summary = '. '.join([sentence[2] for sentence in top_sentences])
    
    # Clean up the summary
    summary = re.sub(r'\s+', ' ', summary).strip()
    if not summary.endswith('.'):
        summary += '.'
    
    return summary

def generate_summary(text, max_length=100):
    """Generate summary using simple extractive method"""
    try:
        # Determine number of sentences based on max_length
        if max_length <= 50:
            num_sentences = 2
        elif max_length <= 100:
            num_sentences = 3
        else:
            num_sentences = 4
        
        summary = simple_extractive_summarizer(text, num_sentences)
        
        # If summary is still too long, truncate
        words = summary.split()
        if len(words) > max_length:
            summary = ' '.join(words[:max_length]) + '...'
        
        return summary
    
    except Exception as e:
        return f"Error generating summary: {str(e)}"

@app.route('/')
def index():
    """Serve the main page"""
    return render_template('index.html')

@app.route('/summarize', methods=['POST'])
def summarize():
    """API endpoint for text summarization"""
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({'error': 'No text provided'}), 400
        
        input_text = data['text']
        max_length = data.get('max_length', 100)
        
        # Basic validation
        if len(input_text.split()) < 10:
            return jsonify({'error': 'Text too short. Please provide at least 10 words.'}), 400
        
        # Generate summary
        summary = generate_summary(input_text, max_length)
        
        # Calculate statistics
        original_words = len(input_text.split())
        summary_words = len(summary.split())
        compression_ratio = round((1 - summary_words/original_words) * 100, 1) if original_words > 0 else 0
        
        return jsonify({
            'summary': summary,
            'original_length': original_words,
            'summary_length': summary_words,
            'compression_ratio': compression_ratio,
            'status': 'success'
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health')
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_type': 'extractive_summarizer'
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)