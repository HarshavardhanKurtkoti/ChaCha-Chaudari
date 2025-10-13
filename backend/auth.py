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
    # Generate ephemeral secret key for non-production boot; tokens will invalidate across restarts
    import secrets, logging
    SECRET_KEY = secrets.token_hex(32)
    logging.getLogger(__name__).warning('SECRET_KEY not set; using ephemeral key for this session (not for production)')

ADMIN_CODE = os.getenv('ADMIN_CODE', 'letmein-admin')
TOKEN_EXP_HOURS = int(os.getenv('TOKEN_EXP_HOURS', '24'))


def create_token(user: dict):
    """Create JWT including basic user claims for personalization.
    Expects dict with at least 'email'; optional 'name' and 'age'.
    """
    payload = {
        'email': user.get('email'),
        'name': user.get('name'),
        'age': user.get('age'),
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
    # Optional age for personalization
    age = data.get('age')

    if not name or not email or not password:
        return jsonify({'error': 'Missing fields'}), 400

    if users_collection.find_one({'email': email}):
        return jsonify({'error': 'Email already used'}), 409

    user_doc = {
        'name': name,
        'email': email,
        'password': generate_password_hash(password),
        'is_admin': admin_code == ADMIN_CODE,
        'created': datetime.utcnow().isoformat() + 'Z',
        'age': int(age) if isinstance(age, (int, float, str)) and str(age).isdigit() else None,
    }
    users_collection.insert_one(user_doc)

    token = create_token(user_doc)
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

    user_out = {k: v for k, v in user.items() if k not in ('_id', 'password')}
    token = create_token(user_out)
    user_out['token'] = token
    return jsonify(user_out)


@auth_bp.route('/google-login', methods=['POST'])
def google_login():
    """Accepts {googleToken} (Google ID token). Minimal decode without signature verification.
    In production, verify signature with Google's certs.
    Upserts user and returns JWT token.
    """
    data = request.get_json() or {}
    google_token = data.get('googleToken')
    if not google_token:
        return jsonify({'error': 'googleToken required'}), 400
    try:
        payload = jwt.decode(google_token, options={"verify_signature": False})
        email = (payload.get('email') or '').lower().strip()
        name = (payload.get('name') or payload.get('given_name') or email.split('@')[0] or 'User').strip()
        if not email:
            return jsonify({'error': 'Email not present in token'}), 400
        user = users_collection.find_one({'email': email})
        if not user:
            user = {
                'name': name,
                'email': email,
                'is_admin': False,
                'created': datetime.utcnow().isoformat() + 'Z',
                'age': None,
                'provider': 'google',
            }
            users_collection.insert_one(user)
        else:
            # Ensure name is populated
            if not user.get('name') and name:
                users_collection.update_one({'email': email}, {'$set': {'name': name}})
                user['name'] = name
        user_out = {k: v for k, v in user.items() if k != '_id'}
        token = create_token(user_out)
        user_out['token'] = token
        return jsonify(user_out)
    except Exception as e:
        return jsonify({'error': 'Google token decode failed', 'details': str(e)}), 400


@auth_bp.route('/google-signup', methods=['POST'])
def google_signup():
    # Alias to google_login for now
    return google_login()


@auth_bp.route('/update_profile', methods=['POST'])
@token_required
def update_profile():
    try:
        data = request.get_json() or {}
        fields = {}
        name = data.get('name')
        age = data.get('age')
        if name:
            fields['name'] = str(name).strip()
        if age is not None:
            try:
                fields['age'] = int(age)
            except Exception:
                return jsonify({'error': 'age must be integer'}), 400
        if not fields:
            return jsonify({'error': 'no fields to update'}), 400
        email = request.user.get('email')  # type: ignore
        if not email:
            return jsonify({'error': 'authenticated user missing email'}), 400
        res = users_collection.update_one({'email': email}, {'$set': fields})
        if getattr(res, 'matched_count', None) == 0 and getattr(res, 'modified_count', None) == 0:
            # In in-memory mode, update_one returns no stats; try another read
            user = users_collection.find_one({'email': email}, {'_id': 0, 'password': 0})
            if not user:
                return jsonify({'error': 'user not found'}), 404
        user = users_collection.find_one({'email': email}, {'_id': 0, 'password': 0})
        # issue a fresh token carrying updated claims
        token = create_token(user)
        return jsonify({'updated': True, 'user': user, 'token': token})
    except Exception as e:
        import logging
        logging.getLogger(__name__).exception('update_profile failed')
        return jsonify({'error': 'update failed', 'details': str(e)}), 500


@auth_bp.route('/me', methods=['GET'])
@token_required
def me():
    return jsonify(request.user)  # type: ignore
