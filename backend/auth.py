import os
import jwt
from functools import wraps
from datetime import datetime, timedelta, timezone
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
try:  # Allow running as module or script
    from .db import users_collection  # type: ignore
except ImportError:  # pragma: no cover
    from db import users_collection  # type: ignore

load_dotenv()

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

SECRET_KEY = os.getenv('SECRET_KEY')
if not SECRET_KEY:
    raise RuntimeError('SECRET_KEY env var is required')

ADMIN_CODE = os.getenv('ADMIN_CODE', 'letmein-admin')
TOKEN_EXP_HOURS = int(os.getenv('TOKEN_EXP_HOURS', '24'))


def create_token(email: str):
    payload = {
        'email': email,
        'exp': datetime.now(tz=timezone.utc) + timedelta(hours=TOKEN_EXP_HOURS)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')


def token_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authorization header missing'}), 401
        token = auth_header.split(' ', 1)[1]
        try:
            data = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            email = data.get('email')
            if not email:
                raise jwt.InvalidTokenError('No email in token')
            user = users_collection.find_one({'email': email}, {'_id': 0, 'password': 0})
            if not user:
                return jsonify({'error': 'User not found'}), 401
            request.user = user  # type: ignore
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expired'}), 401
        except jwt.InvalidTokenError as e:
            return jsonify({'error': 'Invalid token', 'details': str(e)}), 401
        return f(*args, **kwargs)
    return wrapper


def admin_required(f):
    @wraps(f)
    @token_required
    def wrapper(*args, **kwargs):
        if not request.user.get('is_admin'):  # type: ignore
            return jsonify({'error': 'Admin only'}), 403
        return f(*args, **kwargs)
    return wrapper


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    email = data.get('email', '').lower().strip()
    password = data.get('password', '')
    admin_code = data.get('admin_code')

    if not name or not email or not password:
        return jsonify({'error': 'Missing fields'}), 400

    if users_collection.find_one({'email': email}):
        return jsonify({'error': 'Email already used'}), 409

    user_doc = {
        'name': name,
        'email': email,
        'password': generate_password_hash(password),
        'is_admin': admin_code == ADMIN_CODE,
        'created': datetime.utcnow().isoformat() + 'Z'
    }
    users_collection.insert_one(user_doc)

    token = create_token(email)
    user_doc.pop('password')
    user_doc['token'] = token
    return jsonify(user_doc), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email', '').lower().strip()
    password = data.get('password', '')
    if not email or not password:
        return jsonify({'error': 'Missing credentials'}), 400

    user = users_collection.find_one({'email': email})
    if not user or not check_password_hash(user['password'], password):
        return jsonify({'error': 'Invalid credentials'}), 401

    token = create_token(email)
    user_out = {k: v for k, v in user.items() if k not in ('_id', 'password')}
    user_out['token'] = token
    return jsonify(user_out)


@auth_bp.route('/me', methods=['GET'])
@token_required
def me():
    return jsonify(request.user)  # type: ignore
