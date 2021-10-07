from flask import Flask
from flask_cors import CORS

from findmypath.routes import find_my_path

app = Flask(__name__)
CORS(app)
app.register_blueprint(find_my_path)


if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5001)