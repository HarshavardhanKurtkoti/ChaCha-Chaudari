import os
from datetime import datetime
from pymongo import MongoClient, ASCENDING
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
MONGODB_DB = os.getenv('MONGODB_DB', 'capstone_db')

client = MongoClient(MONGODB_URI)
db = client[MONGODB_DB]

users_collection = db['users']
chats_collection = db['chats']

# Indexes (id + user_email unique for chats; email unique for users)
users_collection.create_index('email', unique=True)
chats_collection.create_index([('user_email', ASCENDING), ('id', ASCENDING)], unique=True)
chats_collection.create_index('user_email')


def utc_now_iso():
    return datetime.utcnow().isoformat() + 'Z'
