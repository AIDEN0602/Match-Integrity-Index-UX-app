# LoL MII Analyzer - Web Application

A web-based League of Legends Match Integrity Index (MII) analyzer that measures **structural fairness** of competitive matches, not individual player skill. Unlike ranking systems (OP.GG, etc.), MII evaluates whether the match environment was fair enough for meaningful competition to exist.

## Features

- Search any player by Summoner Name and Tag
- Support for 16 different servers/regions worldwide
- View recent 10 ranked matches
- Detailed MII analysis for all 10 players in a match
- Team-based comparison (Blue Team vs Red Team)
- Match verdict system (Balanced/Imbalanced)

## Tech Stack

- **Backend**: Python serverless functions (Vercel)
- **Frontend**: React (vanilla, no build tools)
- **API**: Riot Games API
- **Hosting**: Vercel (free tier)

## Deployment

### Prerequisites

1. Get a Riot Games API key from [developer.riotgames.com](https://developer.riotgames.com/)
2. Install [Vercel CLI](https://vercel.com/docs/cli): `npm i -g vercel`

### Deploy to Vercel

1. Clone this repository
2. Navigate to the project directory:
   ```bash
   cd mii-web-app
   ```

3. Initialize Git (if not already initialized):
   ```bash
   git init
   git add .
   git commit -m "Initial commit: MII Web Analyzer"
   ```

4. Deploy to Vercel:
   ```bash
   vercel
   ```

5. Add your Riot API key as an environment variable:
   ```bash
   vercel env add RIOT_API_KEY
   ```
   Then paste your API key when prompted.

6. Redeploy with the environment variable:
   ```bash
   vercel --prod
   ```

## Local Development

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Add your Riot API key to `.env`

3. Install Vercel CLI and run locally:
   ```bash
   vercel dev
   ```

## Project Structure

```
mii-web-app/
├── api/
│   ├── get_matches.py      # Fetch recent 10 matches
│   ├── analyze_match.py    # Calculate MII for match
│   └── requirements.txt    # Python dependencies
├── public/
│   ├── index.html         # HTML entry point
│   └── styles.css         # CSS styling
├── src/
│   └── App.jsx           # React application
├── vercel.json           # Vercel configuration
└── README.md            # This file
```

## How It Works

1. **User Search**: Enter summoner name, tag, and select server
2. **Match List**: System fetches recent 10 ranked matches from Riot API
3. **Match Selection**: Click on any match to analyze
4. **MII Calculation**:
   - Ranks all 10 players by in-game performance
   - Assigns MII based on rank position (1st = 0, 10th = 100)
   - **Lower MII = advantageous team environment**
   - **Higher MII = disadvantaged team environment**
5. **Results**: Shows both teams with individual MII scores and team averages

## What MII Measures

**MII is NOT a skill rating system.** It measures:
- **Structural fairness**: Was this match winnable given team composition?
- **Environmental disadvantage**: How much burden did team performance create?
- **Match integrity**: Were competitive conditions fair?

Based on NYU research showing that matches with MII >60 have <20% win rates across all skill tiers, indicating structurally unwinnable conditions regardless of individual skill.

## MII Calculation Formula

```
Performance Score = (KDA × 10) - (Deaths × 3) + (Damage Dealt / 1000)
```

All 10 players ranked by performance → MII assigned:
- 1st place: MII 0
- 2nd place: MII 11.1
- 3rd place: MII 22.2
- ...
- 10th place: MII 100

**Team Average MII** indicates overall team environment quality:
- 0-25: Highly advantageous team
- 25-50: Above average team
- 50-75: Below average team (structurally difficult)
- 75-100: Severely disadvantaged team (likely unwinnable)

## License

This project is for educational purposes. Riot Games API usage must comply with their [Terms of Service](https://developer.riotgames.com/terms).
