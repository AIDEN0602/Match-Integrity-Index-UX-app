"""
Vercel Serverless Function: Analyze a specific match and calculate MII for all 10 players
"""
from http.server import BaseHTTPRequestHandler
import json
import os
import requests
from urllib.parse import parse_qs, urlparse

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
            parsed = urlparse(self.path)
            params = parse_qs(parsed.query)

            match_id = params.get('match_id', [''])[0]
            server = params.get('server', ['NA'])[0].upper()

            if not match_id:
                self.send_error_response(400, "Missing match_id parameter")
                return

            if server not in REGION_CONFIG:
                self.send_error_response(400, f"Invalid server: {server}")
                return

            continent = REGION_CONFIG[server]['continent']

            # Get match data
            match_data = self.get_match_data(match_id, continent)
            if not match_data:
                self.send_error_response(404, "Match not found")
                return

            # Analyze and calculate MII
            analysis = self.analyze_match(match_data)

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

            self.wfile.write(json.dumps(analysis).encode())

        except Exception as e:
            self.send_error_response(500, str(e))

    def get_match_data(self, match_id, continent):
        """Fetch match data from Riot API"""
        url = f"https://{continent}.api.riotgames.com/lol/match/v5/matches/{match_id}"
        headers = {"X-Riot-Token": RIOT_API_KEY}

        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            return response.json()
        return None

    def calculate_mii(self, player_stats, team_stats):
        """
        Calculate Match Integrity Index (MII) for a player

        MII formula: Based on teammate performance
        - Higher deaths = higher MII (worse team)
        - Lower KDA = higher MII
        - Lower damage = higher MII

        Returns: MII score (0-100), higher = worse teammates
        """
        # Team averages (excluding the player)
        team_avg_deaths = sum(p['deaths'] for p in team_stats) / len(team_stats)
        team_avg_kda = sum(p['kda'] for p in team_stats) / len(team_stats)
        team_avg_damage = sum(p['damage'] for p in team_stats) / len(team_stats)

        # Normalize damage (0-1)
        max_damage = max(p['damage'] for p in team_stats)
        min_damage = min(p['damage'] for p in team_stats)

        if max_damage != min_damage:
            normalized_damage = (team_avg_damage - min_damage) / (max_damage - min_damage)
        else:
            normalized_damage = 0.5

        # Calculate raw MII score
        death_weight = 3.0
        kda_weight = 2.0
        damage_weight = 1.5

        mii_raw = (
            (team_avg_deaths * death_weight) -
            (team_avg_kda * kda_weight) -
            (normalized_damage * damage_weight * 10)
        )

        # Normalize to 0-100 scale (simple scaling)
        # Higher MII = worse teammates
        mii_score = max(0, min(100, (mii_raw + 10) * 5))

        return round(mii_score, 1)

    def analyze_match(self, match_data):
        """Analyze match and calculate MII for all players"""
        participants = match_data['info']['participants']

        # Split into teams
        blue_team = []
        red_team = []
        all_players = []

        for p in participants:
            player_data = {
                'name': p['riotIdGameName'],
                'tag': p['riotIdTagline'],
                'champion': p['championName'],
                'kills': p['kills'],
                'deaths': p['deaths'],
                'assists': p['assists'],
                'kda': round((p['kills'] + p['assists']) / max(p['deaths'], 1), 2),
                'damage': p['totalDamageDealtToChampions'],
                'gold': p['goldEarned'],
                'cs': p['totalMinionsKilled'] + p['neutralMinionsKilled'],
                'vision_score': p['visionScore'],
                'win': p['win'],
                'team_id': p['teamId']
            }

            all_players.append(player_data)
            if p['teamId'] == 100:
                blue_team.append(player_data)
            else:
                red_team.append(player_data)

        # Calculate performance score for ranking (lower deaths, higher KDA, higher damage = better)
        for player in all_players:
            # Performance score: prioritize KDA and minimize deaths
            player['performance'] = (
                player['kda'] * 10 -
                player['deaths'] * 3 +
                (player['damage'] / 1000)
            )

        # Rank all 10 players by performance
        all_players.sort(key=lambda x: x['performance'], reverse=True)

        # Assign MII based on rank (1st = 0, 10th = 100)
        for rank, player in enumerate(all_players):
            # Distribute 0-100 evenly across 10 players
            player['mii'] = round((rank / 9) * 100, 1)

        # Re-organize into teams (preserve original MII assignment)
        blue_team = [p for p in all_players if p['team_id'] == 100]
        red_team = [p for p in all_players if p['team_id'] == 200]

        # Calculate team averages
        blue_avg_mii = sum(p['mii'] for p in blue_team) / len(blue_team)
        red_avg_mii = sum(p['mii'] for p in red_team) / len(red_team)

        # Determine match verdict
        mii_diff = abs(blue_avg_mii - red_avg_mii)

        if mii_diff < 10:
            verdict = "Balanced Match"
            verdict_detail = "Both teams had similar match integrity."
        elif mii_diff < 20:
            verdict = "Slight Imbalance"
            verdict_detail = f"{'Blue' if blue_avg_mii < red_avg_mii else 'Red'} team had slightly better teammates."
        else:
            verdict = "Significant Imbalance"
            verdict_detail = f"{'Blue' if blue_avg_mii < red_avg_mii else 'Red'} team had significantly better teammates."

        return {
            'success': True,
            'match_id': match_data['metadata']['matchId'],
            'game_duration': match_data['info']['gameDuration'],
            'blue_team': {
                'players': blue_team,
                'avg_mii': round(blue_avg_mii, 1),
                'won': blue_team[0]['win']
            },
            'red_team': {
                'players': red_team,
                'avg_mii': round(red_avg_mii, 1),
                'won': red_team[0]['win']
            },
            'verdict': verdict,
            'verdict_detail': verdict_detail
        }

    def send_error_response(self, code, message):
        self.send_response(code)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()

        error = {'success': False, 'error': message}
        self.wfile.write(json.dumps(error).encode())
