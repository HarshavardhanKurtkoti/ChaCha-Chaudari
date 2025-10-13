import os
from datetime import datetime
from dotenv import load_dotenv

# Try to import pymongo; if unavailable or connection fails, we'll fall back to in-memory collections
try:
    from pymongo import MongoClient, ASCENDING  # type: ignore
    _pymongo_available = True
except Exception:  # pragma: no cover
    _pymongo_available = False
    MongoClient = None  # type: ignore
    ASCENDING = 1  # type: ignore

load_dotenv()

MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
MONGODB_DB = os.getenv('MONGODB_DB', 'capstone_db')


class _InsertOneResult:
    def __init__(self, inserted_id=None):
        self.inserted_id = inserted_id


class _DeleteResult:
    def __init__(self, deleted_count: int):
        self.deleted_count = deleted_count


class _InMemoryCollection:
    """Very small subset of PyMongo Collection API used in this app."""

    def __init__(self):
        self._docs = []

    # Utility helpers
    def _match(self, doc, filt: dict) -> bool:
        for k, v in filt.items():
            if k not in doc or doc[k] != v:
                return False
        return True

    # API methods used by the app
    def find_one(self, filt, projection=None):
        for d in self._docs:
            if self._match(d, filt):
                # projection: drop keys with 0
                if projection:
                    out = d.copy()
                    for k, v in projection.items():
                        if v == 0 and k in out:
                            out.pop(k, None)
                    return out
                return d
        return None

    def find(self, filt=None, projection=None):
        filt = filt or {}
        results = []
        for d in self._docs:
            if self._match(d, filt):
                if projection:
                    out = d.copy()
                    for k, v in projection.items():
                        if v == 0 and k in out:
                            out.pop(k, None)
                    results.append(out)
                else:
                    results.append(d)
        return results

    def insert_one(self, doc):
        self._docs.append(doc.copy())
        return _InsertOneResult()

    def replace_one(self, filt, doc, upsert=False):
        replaced = False
        for i, d in enumerate(self._docs):
            if self._match(d, filt):
                self._docs[i] = doc.copy()
                replaced = True
                break
        if not replaced and upsert:
            self._docs.append(doc.copy())
        # Mimic PyMongo result object minimally (not used by app)
        return type('ReplaceOneResult', (), {'acknowledged': True})()

    def update_one(self, filt, update_dict):
        """Support simple {'$set': {...}} updates and return a minimal result
        with attributes matched_count and modified_count to mimic PyMongo.
        """
        matched = 0
        modified = 0
        for i, d in enumerate(self._docs):
            if self._match(d, filt):
                matched += 1
                # support only $set for now
                if isinstance(update_dict, dict) and '$set' in update_dict:
                    for k, v in update_dict['$set'].items():
                        if d.get(k) != v:
                            d[k] = v
                            modified += 1
                else:
                    # apply a direct dict merge
                    for k, v in update_dict.items():
                        if d.get(k) != v:
                            d[k] = v
                            modified += 1
                self._docs[i] = d
                break
        # Minimal result object
        return type('UpdateResult', (), {'matched_count': matched, 'modified_count': modified})()

    def delete_one(self, filt):
        for i, d in enumerate(self._docs):
            if self._match(d, filt):
                self._docs.pop(i)
                return _DeleteResult(1)
        return _DeleteResult(0)

    def delete_many(self, filt):
        to_keep = []
        deleted = 0
        for d in self._docs:
            if self._match(d, filt):
                deleted += 1
            else:
                to_keep.append(d)
        self._docs = to_keep
        return _DeleteResult(deleted)

    def count_documents(self, filt):
        return len(self.find(filt))

    def aggregate(self, pipeline):
        # Only implements the specific pipeline used in admin_stats
        # [{'$group': {'_id': '$user_email', 'count': {'$sum': 1}}}, {'$sort': {'count': -1}}]
        if not pipeline:
            return iter([])
        stage1 = pipeline[0]
        if '$group' in stage1 and stage1['$group'].get('_id') == '$user_email':
            counts = {}
            for d in self._docs:
                key = d.get('user_email')
                counts[key] = counts.get(key, 0) + 1
            rows = [{'_id': k, 'count': v} for k, v in counts.items()]
            if len(pipeline) > 1 and '$sort' in pipeline[1]:
                sort_spec = pipeline[1]['$sort']
                if 'count' in sort_spec:
                    rows.sort(key=lambda r: r['count'], reverse=sort_spec['count'] < 0)
            return iter(rows)
        return iter([])

    # No-op for indexes in memory mode
    def create_index(self, *args, **kwargs):
        return None


def _init_mongo_collections():
    """Attempt to initialize real MongoDB collections; return (users, chats) or raise."""
    if not _pymongo_available:
        raise RuntimeError('pymongo not available')
    client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=8000)
    db = client[MONGODB_DB]
    users = db['users']
    chats = db['chats']
    # This will trigger connection at import time; guard with try/except
    try:
        users.create_index('email', unique=True)
        chats.create_index([('user_email', ASCENDING), ('id', ASCENDING)], unique=True)
        chats.create_index('user_email')
    except Exception as e:
        # Re-raise to trigger in-memory fallback
        raise RuntimeError(f'Mongo index creation failed: {e}')
    return users, chats


# Initialize collections with graceful fallback
try:
    users_collection, chats_collection = _init_mongo_collections()
    _USING_IN_MEMORY_DB = False
except Exception:
    # Fallback to in-memory collections so the app can still run without Mongo
    users_collection = _InMemoryCollection()
    chats_collection = _InMemoryCollection()
    _USING_IN_MEMORY_DB = True


def utc_now_iso():
    return datetime.utcnow().isoformat() + 'Z'
