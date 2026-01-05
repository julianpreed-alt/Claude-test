from flask import Flask, render_template, request, jsonify
from anthropic import Anthropic
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)
client = Anthropic()

# Store conversation history
conversations = {}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    user_message = data.get('message')
    session_id = data.get('session_id', 'default')

    if not user_message:
        return jsonify({'error': 'No message provided'}), 400

    # Initialize conversation history for this session if it doesn't exist
    if session_id not in conversations:
        conversations[session_id] = []

    # Add user message to history
    conversations[session_id].append({
        "role": "user",
        "content": user_message
    })

    try:
        # Call Claude API with conversation history
        message = client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=1024,
            messages=conversations[session_id]
        )

        # Extract assistant's response
        assistant_message = message.content[0].text

        # Add assistant's response to history
        conversations[session_id].append({
            "role": "assistant",
            "content": assistant_message
        })

        return jsonify({
            'response': assistant_message,
            'session_id': session_id
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/clear', methods=['POST'])
def clear_conversation():
    data = request.json
    session_id = data.get('session_id', 'default')

    if session_id in conversations:
        conversations[session_id] = []

    return jsonify({'success': True})

if __name__ == '__main__':
    app.run(debug=True, port=5001)
