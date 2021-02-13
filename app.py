import os

from flask import Flask
from flask_cors import CORS

from main.routes import find_my_path

app = Flask(__name__)
CORS(app)
app.register_blueprint(resume_routes)


if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)