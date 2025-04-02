from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import pipeline
import torch
import re

app = Flask(__name__)
CORS(app, resources={r"/analyze": {"origins": "*"}})

# Initialize models
device = -1  # -1 for CPU
print("Loading NLP models...")
sentiment_analyzer = pipeline(
    "sentiment-analysis",
    model="distilbert-base-uncased-finetuned-sst-2-english",
    device=device
)

def neutralize_sentence(sentence):
    """Replace biased phrases with neutral alternatives"""
    neutralizations = {
        r'\bclearly\b': 'apparently',
        r'\beveryone knows\b': 'research suggests',
        r'\bterrible\b': 'problematic',
        r'\bdisastrous\b': 'controversial'
    }
    for pattern, replacement in neutralizations.items():
        sentence = re.sub(pattern, replacement, sentence, flags=re.IGNORECASE)
    return sentence

@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        data = request.json
        text = data.get('text', '')[:5000]  # Limit input size
        
        sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', text) if 10 < len(s.strip()) < 500]
        results = []
        
        for sentence in sentences[:50]:  # Limit to 50 sentences
            try:
                analysis = sentiment_analyzer(sentence)[0]
                if analysis['score'] > 0.85:  # Only strong sentiments
                    results.append({
                        'original': sentence,
                        'modified': neutralize_sentence(sentence),
                        'type': analysis['label'].lower(),
                        'score': float(analysis['score']),
                        'start': text.find(sentence),
                        'length': len(sentence)
                    })
            except Exception as e:
                continue
                
        return jsonify({
            'biases': results,
            'bias_free': len(results) == 0,
            'status': 'success'
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, threaded=True)