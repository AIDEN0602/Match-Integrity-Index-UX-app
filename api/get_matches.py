"""
Vercel Serverless Function: Get recent 10 matches for a player
"""
from http.server import BaseHTTPRequestHandler
import json
import os
import requests
from urllib.parse import parse_qs, urlparse

# Riot API configuration
RIOT_API_KEY = os.environ.get('RIOT_API_KEY')

# Region mappings
REGION_CONFIG = {
    'NA': {'region': 'na1', 'continent': 'americas'},
    'EUW': {'region': 'euw1', 'continent': 'europe'},
    'EUNE': {'region': 'eun1', 'continent': 'europe'},
    'KR': {'region': 'kr', 'continent': 'asia'},
    'JP': {'region': 'jp1', 'continent': 'asia'},
    'BR': {'region': 'br1', 'continent': 'americas'},
    'LAN': {'region': 'la1', 'continent': 'americas'},
    'LAS': {'region': 'la2', 'continent': 'americas'},
    'OCE': {'region': 'oc1', 'continent': 'sea'},
    'TR': {'region': 'tr1', 'continent': 'europe'},
    'RU': {'region': 'ru', 'continent': 'europe'},
    'PH': {'region': 'ph2', 'continent': 'sea'},
    'SG': {'region': 'sg2', 'continent': 'sea'},
    'TH': {'region': 'th2', 'continent': 'sea'},
    'TW': {'region': 'tw2', 'continent': 'sea'},
    'VN': {'region': 'vn2', 'continent': 'sea'},
}

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            # Parse query parameters
            parsed = urlparse(self.path)
            params = parse_qs(parsed.query)

            game_name = params.get('name', [''])[0]
            tag_line = params.get('tag', [''])[0]
            server = params.get('server', ['NA'])[0].upper()

            if not game_name or not tag_line:
                self.send_error_response(400, "Missing name or tag parameter")
                return

            if server not in REGION_CONFIG:
                self.send_error_response(400, f"Invalid server: {server}")
                return

            region_info = REGION_CONFIG[server]
            region = region_info['region']
            continent = region_info['continent']

            # Get PUUID
            puuid = self.get_puuid(game_name, tag_line, continent)
            if not puuid:
                self.send_error_response(404, "Player not found")
                return

            # Get recent matches
            matches = self.get_recent_matches(puuid, continent, region)

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

            response = {
                'success': True,
                'player': f"{game_name}#{tag_line}",
                'server': server,
                'matches': matches
            }

            self.wfile.write(json.dumps(response).encode())

        except Exception as e:
            self.send_error_response(500, str(e))

    def get_puuid(self, game_name, tag_line, continent):
        """Get player PUUID from Riot API"""
        url = f"https://{continent}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/{game_name}/{tag_line}"
        headers = {"X-Riot-Token": RIOT_API_KEY}

        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            return response.json()['puuid']
        return None

    def get_recent_matches(self, puuid, continent, region):
        """Get recent 10 ranked matches"""
        # Get match IDs
        url = f"https://{continent}.api.riotgames.com/lol/match/v5/matches/by-puuid/{puuid}/ids"
        params = {'type': 'ranked', 'start': 0, 'count': 10}
        headers = {"X-Riot-Token": RIOT_API_KEY}

        response = requests.get(url, params=params, headers=headers)
        if response.status_code != 200:
            return []

        match_ids = response.json()
        matches = []

        # Get match details for each
        for match_id in match_ids:
            match_url = f"https://{continent}.api.riotgames.com/lol/match/v5/matches/{match_id}"
            match_response = requests.get(match_url, headers=headers)

            if match_response.status_code == 200:
                match_data = match_response.json()

                # Find player in match
                for participant in match_data['info']['participants']:
                    if participant['puuid'] == puuid:
                        # Determine team color (Blue = 100, Red = 200)
                        team_color = 'Blue' if participant['teamId'] == 100 else 'Red'

                        matches.append({
                            'match_id': match_id,
                            'champion': participant['championName'],
                            'win': participant['win'],
                            'team': team_color,
                            'kills': participant['kills'],
                            'deaths': participant['deaths'],
                            'assists': participant['assists'],
                            'kda': round((participant['kills'] + participant['assists']) / max(participant['deaths'], 1), 2),
                            'game_duration': match_data['info']['gameDuration'],
                            'timestamp': match_data['info']['gameCreation']
                        })
                        break

        return matches

    def send_error_response(self, code, message):
        self.send_response(code)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()

        error = {'success': False, 'error': message}
        self.wfile.write(json.dumps(error).encode())
