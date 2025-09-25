from flask import Blueprint, request, jsonify

try:  # Support running with/without package context
    from .db import chats_collection, utc_now_iso  # type: ignore
    from .auth import token_required, admin_required  # type: ignore
except ImportError:  # pragma: no cover
    from db import chats_collection, utc_now_iso  # type: ignore
    from auth import token_required, admin_required  # type: ignore

chat_bp = Blueprint('chats', __name__, url_prefix='/chats')

SPECIAL_WELCOME_TITLE = 'Welcome Chat'


def normalize_chat_id(raw_id):
    """Accept numeric or string id; store as string consistently."""
    if raw_id is None:
        return None
    return str(raw_id)


@chat_bp.route('/', methods=['GET'])
@token_required
def list_chats():
    email = request.user['email']  # type: ignore
    chats = list(chats_collection.find({'user_email': email}, {'_id': 0}))
    return jsonify({'chats': chats})


@chat_bp.route('/save', methods=['POST'])
@token_required
def save_chat():
    data = request.get_json() or {}
    email = request.user['email']  # type: ignore
    chat_id = normalize_chat_id(data.get('id'))
    title = (data.get('title') or '').strip()
    messages = data.get('messages') or []

    if not chat_id:
        return jsonify({'error': 'id required'}), 400
    if not title:
        return jsonify({'error': 'title required'}), 400
    if not isinstance(messages, list):
        return jsonify({'error': 'messages must be list'}), 400

    # Prevent duplicate special welcome chat
    if title == SPECIAL_WELCOME_TITLE:
        existing = chats_collection.find_one({'user_email': email, 'title': SPECIAL_WELCOME_TITLE})
        if existing and existing.get('id') != chat_id:
            return jsonify({'error': 'Welcome Chat already exists'}), 409

    doc = {
        'id': chat_id,
        'user_email': email,
        'title': title,
        'messages': messages,
        'updated': utc_now_iso(),
    }
    old = chats_collection.find_one({'user_email': email, 'id': chat_id})
    if not old:
        doc['created'] = doc['updated']
    chats_collection.replace_one({'user_email': email, 'id': chat_id}, doc, upsert=True)
    return jsonify({'saved': True, 'chat': doc})


@chat_bp.route('/<chat_id>', methods=['DELETE'])
@token_required
def delete_chat(chat_id):
    email = request.user['email']  # type: ignore
    res = chats_collection.delete_one({'user_email': email, 'id': normalize_chat_id(chat_id)})
    return jsonify({'deleted': res.deleted_count == 1})


@chat_bp.route('/delete_all', methods=['DELETE'])
@token_required
def delete_all():
    email = request.user['email']  # type: ignore
    res = chats_collection.delete_many({'user_email': email})
    return jsonify({'deleted_count': res.deleted_count})

# Admin endpoints
@chat_bp.route('/admin/all', methods=['GET'])
@admin_required
def admin_all_chats():
    chats = list(chats_collection.find({}, {'_id': 0}))
    return jsonify({'chats': chats})


@chat_bp.route('/admin/stats', methods=['GET'])
@admin_required
def admin_stats():
    user_counts = chats_collection.aggregate([
        {'$group': {'_id': '$user_email', 'count': {'$sum': 1}}},
        {'$sort': {'count': -1}}
    ])
    return jsonify({'per_user': list(user_counts), 'total': chats_collection.count_documents({})})
