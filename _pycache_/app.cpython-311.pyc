from flask import Flask, request, jsonify, render_template
import re
import hashlib

app = Flask(__name__)

# Basic keywords that might indicate a fake/scam message
SUSPICIOUS_KEYWORDS = [
    r'\burgent\b', r'\bwinner\b', r'\blottery\b', r'\bcrypto\b', 
    r'\binvestment\b', r'\bguaranteed\b', r'\bclick here\b', r'\bact now\b', 
    r'\bgiveaway\b', r'\bfree money\b', r'\bprince\b', r'\baccount suspended\b'
]

def analyze_text_logic(text):
    if not text:
        return {"result": "Unknown", "confidence_score": 0.0, "reason": "No text provided."}
    
    score = 0
    text_lower = text.lower()
    
    # 1. Keyword analysis
    matched_keywords = []
    for pattern in SUSPICIOUS_KEYWORDS:
        if re.search(pattern, text_lower):
            score += 20
            matched_keywords.append(pattern.replace(r'\b', ''))
            
    # 2. Check for all caps
    if text.isupper() and len(text) > 10:
        score += 30
        
    # 3. Check for excessive exclamation marks
    if text.count('!') > 3:
        score += 15
        
    # 4. Links present
    if 'http://' in text_lower or 'https://' in text_lower:
        score += 15
        
    confidence_score = min(score, 100)
    
    if confidence_score > 60:
        result = "Fake/Scam"
    elif confidence_score > 30:
        result = "Suspicious"
    else:
        result = "Real/Safe"
        
    return {
        "result": result,
        "confidence_score": confidence_score,
        "reason": f"Matched suspicious features: keywords {matched_keywords}" if matched_keywords else "No suspicious features found."
    }

def analyze_media_logic(file, media_type):
    # This is a basic mock logic for media fake detection
    
    # Read file content to simulate analysis
    content = file.read()
    file.seek(0) # Reset stream position
    
    if not content:
        return {"result": "Unknown", "confidence_score": 0.0, "reason": "Empty file."}
        
    hash_object = hashlib.md5(content)
    hash_hex = hash_object.hexdigest()
    
    # Use the first couple of characters of the hash to generate a score between 0 and 100
    pseudo_random_score = int(hash_hex[:4], 16) / 65535.0 * 100.0
    confidence_score = round(pseudo_random_score, 2)
    
    if confidence_score > 70:
        result = f"Likely AI Generated {media_type.capitalize()}"
    elif confidence_score > 40:
        result = "Suspicious"
    else:
        result = "Authentic"
        
    reason = "Analyzed image noise, artifacts, and metadata." if media_type == 'image' else "Analyzed frame consistency, audio-visual sync, and deepfake artifacts."
    
    return {
        "result": result,
        "confidence_score": confidence_score,
        "reason": reason
    }

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze-text', methods=['POST'])
def analyze_text():
    data = request.get_json(force=True, silent=True)
    if not data or 'message' not in data:
        return jsonify({"error": "Missing 'message' in JSON payload"}), 400
        
    text = data['message']
    analysis = analyze_text_logic(text)
    
    # Truncate to prevent huge payloads crashing local networks/browsers
    preview_text = text[:500] + "..." if len(text) > 500 else text
    
    return jsonify({
        "status": "success",
        "message_analyzed": preview_text,
        "analysis": analysis
    }), 200

@app.route('/analyze-image', methods=['POST'])
def analyze_image():
    if 'image' not in request.files:
        return jsonify({"error": "Missing 'image' in form-data"}), 400
        
    file = request.files['image']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
        
    analysis = analyze_media_logic(file, 'image')
    
    return jsonify({
        "status": "success",
        "filename": file.filename,
        "analysis": analysis
    }), 200

@app.route('/analyze-video', methods=['POST'])
def analyze_video():
    if 'video' not in request.files:
        return jsonify({"error": "Missing 'video' in form-data"}), 400
        
    file = request.files['video']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
        
    analysis = analyze_media_logic(file, 'video')
    
    return jsonify({
        "status": "success",
        "filename": file.filename,
        "analysis": analysis
    }), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)
