from backend.app.game import parse_player_list


def test_parse_player_list_with_players():
    raw = "There are 2 of a max of 8 players online: Guicho, Amigo1"
    assert parse_player_list(raw) == {"online": 2, "max": 8, "players": ["Guicho", "Amigo1"]}


def test_parse_player_list_empty():
    raw = "There are 0 of a max of 8 players online:"
    assert parse_player_list(raw) == {"online": 0, "max": 8, "players": []}
