const { useState } = React;

const SERVERS = [
    { code: 'NA', name: 'North America' },
    { code: 'EUW', name: 'Europe West' },
    { code: 'EUNE', name: 'Europe Nordic & East' },
    { code: 'KR', name: 'Korea' },
    { code: 'JP', name: 'Japan' },
    { code: 'BR', name: 'Brazil' },
    { code: 'LAN', name: 'Latin America North' },
    { code: 'LAS', name: 'Latin America South' },
    { code: 'OCE', name: 'Oceania' },
    { code: 'TR', name: 'Turkey' },
    { code: 'RU', name: 'Russia' },
    { code: 'PH', name: 'Philippines' },
    { code: 'SG', name: 'Singapore' },
    { code: 'TH', name: 'Thailand' },
    { code: 'TW', name: 'Taiwan' },
    { code: 'VN', name: 'Vietnam' },
];

const API_BASE = window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api'
    : '/api';

function App() {
    const [gameName, setGameName] = useState('');
    const [tagLine, setTagLine] = useState('');
    const [server, setServer] = useState('NA');
    const [loading, setLoading] = useState(false);
    const [matches, setMatches] = useState(null);
    const [analysis, setAnalysis] = useState(null);
    const [error, setError] = useState(null);

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMatches(null);
        setAnalysis(null);

        try {
            const response = await fetch(
                `${API_BASE}/get_matches?name=${encodeURIComponent(gameName)}&tag=${encodeURIComponent(tagLine)}&server=${server}`
            );
            const data = await response.json();

            if (data.success) {
                setMatches(data);
            } else {
                setError(data.error || 'Failed to fetch matches');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const analyzeMatch = async (matchId) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `${API_BASE}/analyze_match?match_id=${encodeURIComponent(matchId)}&server=${server}`
            );
            const data = await response.json();

            if (data.success) {
                setAnalysis(data);
            } else {
                setError(data.error || 'Failed to analyze match');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    };

    return (
        <div className="container">
            <div className="header">
                <h1>⚔️ LoL MII Analyzer</h1>
                <p>Match Integrity Index - Analyze Your League Games</p>
            </div>

            <div className="search-card">
                <form onSubmit={handleSearch} className="search-form">
                    <div className="form-group">
                        <label>Summoner Name</label>
                        <input
                            type="text"
                            value={gameName}
                            onChange={(e) => setGameName(e.target.value)}
                            placeholder="Hide on bush"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Tag Line</label>
                        <input
                            type="text"
                            value={tagLine}
                            onChange={(e) => setTagLine(e.target.value)}
                            placeholder="KR1"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Server</label>
                        <select value={server} onChange={(e) => setServer(e.target.value)}>
                            {SERVERS.map(s => (
                                <option key={s.code} value={s.code}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </form>
            </div>

            {loading && (
                <div className="loading">
                    <div className="spinner"></div>
                    <p>Loading data...</p>
                </div>
            )}

            {error && (
                <div className="error">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {matches && !analysis && (
                <div className="matches-list">
                    <h2>Recent Matches for {matches.player}</h2>
                    {matches.matches.map((match, idx) => (
                        <div
                            key={idx}
                            className="match-item"
                            onClick={() => analyzeMatch(match.match_id)}
                        >
                            <div className="match-info">
                                <span className="match-champion">{match.champion}</span>
                                <span className="match-kda">
                                    {match.kills}/{match.deaths}/{match.assists} (KDA: {match.kda})
                                </span>
                                <span style={{color: '#999', fontSize: '0.9rem'}}>
                                    {formatTimestamp(match.timestamp)}
                                </span>
                            </div>
                            <span className={`match-result ${match.win ? 'win' : 'loss'}`}>
                                {match.win ? 'Victory' : 'Defeat'}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {analysis && (
                <div className="analysis-container">
                    <button
                        className="btn btn-primary back-button"
                        onClick={() => setAnalysis(null)}
                    >
                        ← Back to Matches
                    </button>

                    <div className="verdict-card">
                        <h2>{analysis.verdict}</h2>
                        <p>{analysis.verdict_detail}</p>
                    </div>

                    <div className="teams-container">
                        <div className="team-card blue">
                            <div className="team-header">
                                <h3>Blue Team</h3>
                                <span className="team-status">
                                    {analysis.blue_team.won ? '✓ Victory' : '✗ Defeat'}
                                </span>
                            </div>

                            <div className="avg-mii">
                                Team Avg MII: {analysis.blue_team.avg_mii}
                            </div>

                            <div className="player-list">
                                {analysis.blue_team.players.map((player, idx) => (
                                    <div key={idx} className="player-item">
                                        <div className="player-info">
                                            <div className="player-name">
                                                {player.name}#{player.tag}
                                            </div>
                                            <div className="player-stats">
                                                {player.champion} • {player.kills}/{player.deaths}/{player.assists} • KDA: {player.kda}
                                            </div>
                                        </div>
                                        <div className="player-mii">
                                            {player.mii}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="team-card red">
                            <div className="team-header">
                                <h3>Red Team</h3>
                                <span className="team-status">
                                    {analysis.red_team.won ? '✓ Victory' : '✗ Defeat'}
                                </span>
                            </div>

                            <div className="avg-mii">
                                Team Avg MII: {analysis.red_team.avg_mii}
                            </div>

                            <div className="player-list">
                                {analysis.red_team.players.map((player, idx) => (
                                    <div key={idx} className="player-item">
                                        <div className="player-info">
                                            <div className="player-name">
                                                {player.name}#{player.tag}
                                            </div>
                                            <div className="player-stats">
                                                {player.champion} • {player.kills}/{player.deaths}/{player.assists} • KDA: {player.kda}
                                            </div>
                                        </div>
                                        <div className="player-mii">
                                            {player.mii}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

ReactDOM.render(<App />, document.getElementById('root'));
