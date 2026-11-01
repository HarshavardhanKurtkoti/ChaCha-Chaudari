"""
Gamification and Location Routes for ChaCha-Chaudari.
Implements server-authoritative score tracking, daily rewards,
badges, streaks, leaderboards, and location update persistence.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify

try:
    from .db import game_progress_collection, location_collection, utc_now_iso  # type: ignore
    from .auth import token_required  # type: ignore
except ImportError:
    from db import game_progress_collection, location_collection, utc_now_iso  # type: ignore
    from auth import token_required  # type: ignore

log = logging.getLogger(__name__)

game_bp = Blueprint("game", __name__)

# Server-side badge definition thresholds
BADGE_RULES = [
    {"id": "seedling", "label": "Ganga Seedling", "threshold": 25},
    {"id": "streamkeeper", "label": "Stream Keeper", "threshold": 75},
    {"id": "river-guardian", "label": "River Guardian", "threshold": 150},
    {"id": "river-champion", "label": "River Champion", "threshold": 300},
    {"id": "river-legend", "label": "River Legend", "threshold": 600},
    {"id": "river-hero", "label": "River Hero", "threshold": 1200},
]

# Max points allowed per single game session to prevent score injection/spoofing
MAX_SCORE_CAPS = {
    "quiz": 50,
    "trash": 100,
    "cleanup": 250,
    "daily": 25,
}

DAILY_REWARD_BASE = 15


def _get_user_email() -> str:
    user = getattr(request, "user", None)
    if user and isinstance(user, dict) and user.get("email"):
        return user["email"]
    # Fallback for guest sessions or identifier
    auth_header = request.headers.get("Authorization", "")
    data = request.get_json(silent=True) or {}
    return data.get("user_email") or data.get("playerName") or "guest_player"


def _calculate_badges(points: int) -> list[str]:
    unlocked = []
    for b in BADGE_RULES:
        if points >= b["threshold"]:
            unlocked.append(b["id"])
    return unlocked


@game_bp.route("/game/progress", methods=["GET"])
def get_progress():
    """Get player progress from database."""
    email = _get_user_email()
    doc = game_progress_collection.find_one({"user_email": email}, {"_id": 0})
    if not doc:
        doc = {
            "user_email": email,
            "points": 0,
            "badges": [],
            "streak": 0,
            "gamesPlayed": 0,
            "achievements": [],
            "lastDailyReward": None,
            "updatedAt": utc_now_iso(),
        }
    return jsonify({"success": True, "progress": doc})


@game_bp.route("/game/progress", methods=["POST"])
def update_progress():
    """Sync progress with anti-spoofing limits."""
    email = _get_user_email()
    data = request.get_json(silent=True) or {}

    current = game_progress_collection.find_one({"user_email": email}) or {
        "points": 0,
        "badges": [],
        "streak": 0,
        "gamesPlayed": 0,
        "achievements": [],
    }

    incoming_points = int(data.get("points", current.get("points", 0)))
    # Prevent arbitrary huge point leaps
    max_allowed = current.get("points", 0) + 500
    points = min(incoming_points, max_allowed)

    streak = min(int(data.get("streak", current.get("streak", 0))), 365)
    games_played = int(data.get("gamesPlayed", current.get("gamesPlayed", 0)))
    achievements = list(set(current.get("achievements", []) + (data.get("achievements") or [])))

    badges = _calculate_badges(points)

    doc = {
        "user_email": email,
        "points": points,
        "badges": badges,
        "streak": streak,
        "gamesPlayed": games_played,
        "achievements": achievements,
        "updatedAt": utc_now_iso(),
    }
    game_progress_collection.replace_one({"user_email": email}, doc, upsert=True)
    return jsonify({"success": True, "progress": doc})


@game_bp.route("/game/score", methods=["POST"])
def record_score():
    """Authoritative score award with validation and streak multiplier."""
    email = _get_user_email()
    data = request.get_json(silent=True) or {}

    mission = data.get("mission", "quiz")
    raw_score = int(data.get("score") or data.get("points") or 0)

    if raw_score <= 0:
        return jsonify({"error": "Score must be positive"}), 400

    cap = MAX_SCORE_CAPS.get(mission, 100)
    valid_score = min(raw_score, cap)

    current = game_progress_collection.find_one({"user_email": email}) or {
        "points": 0,
        "badges": [],
        "streak": 0,
        "gamesPlayed": 0,
        "achievements": [],
    }

    streak = current.get("streak", 0)
    multiplier = min(1.0 + (streak * 0.1), 1.5)
    delta = int(round(valid_score * multiplier))

    new_points = current.get("points", 0) + delta
    new_badges = _calculate_badges(new_points)

    achievements = list(current.get("achievements", []))
    if mission == "quiz" and "first-quiz" not in achievements:
        achievements.append("first-quiz")
    elif mission == "trash" and "first-trash" not in achievements:
        achievements.append("first-trash")
    elif mission == "cleanup" and "first-cleanup" not in achievements:
        achievements.append("first-cleanup")

    updated = {
        "user_email": email,
        "points": new_points,
        "badges": new_badges,
        "streak": streak,
        "gamesPlayed": current.get("gamesPlayed", 0) + 1,
        "achievements": achievements,
        "updatedAt": utc_now_iso(),
    }
    game_progress_collection.replace_one({"user_email": email}, updated, upsert=True)

    return jsonify({
        "success": True,
        "addedPoints": delta,
        "totalPoints": new_points,
        "badges": new_badges,
        "achievements": achievements,
    })


@game_bp.route("/game/daily-reward", methods=["POST"])
def claim_daily_reward():
    """Server-side validated daily reward claim (once per calendar day)."""
    email = _get_user_email()
    today_utc = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    current = game_progress_collection.find_one({"user_email": email}) or {
        "points": 0,
        "badges": [],
        "streak": 0,
        "gamesPlayed": 0,
        "achievements": [],
        "lastDailyReward": None,
    }

    last_claim = current.get("lastDailyReward")
    if last_claim == today_utc:
        return jsonify({
            "success": False,
            "error": "Daily reward already claimed today. Please return tomorrow!",
            "alreadyClaimed": True,
        }), 409

    streak = current.get("streak", 0) + 1
    multiplier = min(1.0 + (streak * 0.1), 1.5)
    pts = int(round(DAILY_REWARD_BASE * multiplier))

    new_points = current.get("points", 0) + pts
    badges = _calculate_badges(new_points)

    achievements = list(current.get("achievements", []))
    if streak >= 3 and "streak-3" not in achievements:
        achievements.append("streak-3")
    if streak >= 7 and "streak-7" not in achievements:
        achievements.append("streak-7")

    doc = {
        "user_email": email,
        "points": new_points,
        "badges": badges,
        "streak": streak,
        "gamesPlayed": current.get("gamesPlayed", 0),
        "achievements": achievements,
        "lastDailyReward": today_utc,
        "updatedAt": utc_now_iso(),
    }
    game_progress_collection.replace_one({"user_email": email}, doc, upsert=True)

    return jsonify({
        "success": True,
        "rewardPoints": pts,
        "streak": streak,
        "totalPoints": new_points,
        "date": today_utc,
    })


@game_bp.route("/game/leaderboard", methods=["GET"])
def get_leaderboard():
    """Retrieve top 10 players by total points."""
    try:
        cursor = game_progress_collection.find(
            {},
            {"_id": 0, "user_email": 1, "points": 1, "streak": 1, "badges": 1}
        )
        if hasattr(cursor, "sort"):
            cursor = cursor.sort("points", -1)
        if hasattr(cursor, "limit"):
            cursor = cursor.limit(10)
        top_players = list(cursor)
        leaderboard = []
        for rank, p in enumerate(top_players, 1):
            raw_name = p.get("user_email", "Player")
            display_name = raw_name.split("@")[0] if "@" in raw_name else raw_name
            leaderboard.append({
                "rank": rank,
                "name": display_name,
                "score": p.get("points", 0),
                "points": p.get("points", 0),
                "streak": p.get("streak", 0),
                "badgeCount": len(p.get("badges", [])),
            })
        return jsonify({"success": True, "leaderboard": leaderboard, "count": len(leaderboard)})
    except Exception as e:
        log.error("Leaderboard fetch error: %s", e)
        return jsonify({"success": False, "leaderboard": [], "error": str(e)}), 500


@game_bp.route("/updateLocation", methods=["POST"])
@game_bp.route("/api/updateLocation", methods=["POST"])
def update_location():
    """Record user coordinates safely with bounding checks and privacy protection."""
    data = request.get_json(silent=True) or {}
    raw_lat = data.get("lat") if data.get("lat") is not None else data.get("latitude")
    raw_lon = data.get("lon") if data.get("lon") is not None else data.get("longitude")
    try:
        lat = float(raw_lat)
        lon = float(raw_lon)
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid coordinates; lat and lon must be numbers"}), 400

    if not (-90.0 <= lat <= 90.0 and -180.0 <= lon <= 180.0):
        return jsonify({"error": "Coordinates out of bounds"}), 400

    email = _get_user_email()
    doc = {
        "user_email": email,
        "lat": round(lat, 4),  # Truncate to ~11m precision for privacy
        "lon": round(lon, 4),
        "timestamp": utc_now_iso(),
    }
    location_collection.replace_one({"user_email": email}, doc, upsert=True)
    return jsonify({"success": True, "lat": round(lat, 4), "lon": round(lon, 4)})

    return jsonify({"success": True, "location": {"lat": doc["lat"], "lon": doc["lon"]}})
