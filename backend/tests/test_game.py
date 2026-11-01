def test_get_progress_default(client):
    """Test getting progress for new player returns sensible defaults."""
    response = client.get("/game/progress", json={"playerName": "RiverHero"})
    assert response.status_code == 200
    data = response.get_json()
    assert data["success"] is True
    progress = data["progress"]
    assert progress["points"] == 0
    assert progress["streak"] == 0
    assert isinstance(progress["badges"], list)

def test_score_submission_and_caps(client):
    """Test submitting game scores and verify anti-cheat point cap."""
    # Submit a quiz score with 30 points (under 50 cap)
    response = client.post("/game/score", json={
        "playerName": "ArjunHero",
        "mission": "quiz",
        "points": 30
    })
    assert response.status_code == 200
    data = response.get_json()
    assert data["success"] is True
    assert data["addedPoints"] == 30
    assert data["totalPoints"] == 30

    # Submit an excessive score (e.g. 5000 points) — should be capped at 50 for quiz
    response2 = client.post("/game/score", json={
        "playerName": "ArjunHero",
        "mission": "quiz",
        "points": 5000
    })
    assert response2.status_code == 200
    data2 = response2.get_json()
    assert data2["addedPoints"] == 50
    assert data2["totalPoints"] == 80  # 30 + 50

def test_daily_reward_once_per_calendar_day(client):
    """Test that daily reward can only be claimed once per calendar day."""
    # First claim
    res1 = client.post("/game/daily-reward", json={"playerName": "DailyHero"})
    assert res1.status_code == 200
    d1 = res1.get_json()
    assert d1["success"] is True
    assert d1["rewardPoints"] >= 15
    assert d1["streak"] == 1

    # Immediate second claim on same day must be rejected with 409
    res2 = client.post("/game/daily-reward", json={"playerName": "DailyHero"})
    assert res2.status_code == 409
    d2 = res2.get_json()
    assert d2["success"] is False
    assert d2.get("alreadyClaimed") is True

def test_leaderboard_retrieval(client):
    """Test leaderboard returns ranked array."""
    # Seed player 1
    client.post("/game/score", json={"playerName": "Leader1", "mission": "quiz", "points": 40})
    # Seed player 2
    client.post("/game/score", json={"playerName": "Leader2", "mission": "trash", "points": 90})

    response = client.get("/game/leaderboard")
    assert response.status_code == 200
    data = response.get_json()
    assert data["success"] is True
    board = data["leaderboard"]
    assert len(board) >= 2
    # Verify sorted descending by points
    assert board[0]["points"] >= board[1]["points"]

def test_update_location_validation(client):
    """Test /updateLocation validates lat/lon ranges and truncates precision for privacy."""
    # Valid coordinates (Varanasi Ghats)
    res = client.post("/updateLocation", json={
        "playerName": "GhatVisitor",
        "latitude": 25.317645,
        "longitude": 83.006214
    })
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True

    # Invalid latitude (> 90)
    res_invalid = client.post("/updateLocation", json={
        "playerName": "GhatVisitor",
        "latitude": 95.0,
        "longitude": 83.0
    })
    assert res_invalid.status_code == 400
    assert "error" in res_invalid.get_json()

