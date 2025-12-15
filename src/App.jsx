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

const TRANSLATIONS = {
    ko: {
        title: '⚔️ LoL MII 분석기',
        subtitle: '매칭 무결성 지수 - 당신의 게임을 분석하세요',
        summonerName: '소환사 이름',
        tagLine: '태그',
        server: '서버',
        search: '검색',
        searching: '검색 중...',
        loading: '데이터 로딩 중...',
        error: '오류',
        recentMatches: '의 최근 매치',
        victory: '승리',
        defeat: '패배',
        backToMatches: '← 매치 목록으로',
        blueTeam: '블루 팀',
        redTeam: '레드 팀',
        teamAvgMII: '팀 평균 MII',
        // Explanation
        whatIsMII: 'MII란 무엇인가요?',
        miiExplanation: 'Match Integrity Index (MII)는 매치의 구조적 공정성을 측정합니다. 개인 실력이 아닌, 해당 게임이 얼마나 공정한 경쟁 환경이었는지를 평가합니다. 낮을수록 유리한 팀 환경, 높을수록 불리한 팀 환경을 의미합니다.',
        howToRead: 'MII 해석 방법',
        miiRange1: '0-25: 매우 유리한 팀 환경 (상위 1-3등 수준 팀원)',
        miiRange2: '25-50: 평균 이상 팀 환경 (4-6등 수준 팀원)',
        miiRange3: '50-75: 평균 이하 팀 환경 (7-8등 수준 팀원)',
        miiRange4: '75-100: 매우 불리한 팀 환경 (하위 9-10등 수준 팀원)',
        calculation: '계산 방식',
        calcFormula: '게임 내 10명을 성적순으로 정렬 → 1등: MII 0, 2등: MII 11.1, ..., 10등: MII 100',
        calcNote: '* 성적 = (KDA × 10) - (데스 × 3) + (딜량 / 1000)',
        // Verdicts
        balancedMatch: '균형잡힌 매치',
        balancedDetail: '양팀 모두 비슷한 수준의 선수들로 구성되었습니다.',
        slightImbalance: '약간의 불균형',
        slightImbalanceBlue: '블루팀이 약간 더 나은 선수들로 구성되었습니다.',
        slightImbalanceRed: '레드팀이 약간 더 나은 선수들로 구성되었습니다.',
        significantImbalance: '심각한 불균형',
        significantImbalanceBlue: '블루팀이 훨씬 더 나은 선수들로 구성되었습니다.',
        significantImbalanceRed: '레드팀이 훨씬 더 나은 선수들로 구성되었습니다.',
    },
    en: {
        title: '⚔️ LoL MII Analyzer',
        subtitle: 'Match Integrity Index - Analyze Your League Games',
        summonerName: 'Summoner Name',
        tagLine: 'Tag Line',
        server: 'Server',
        search: 'Search',
        searching: 'Searching...',
        loading: 'Loading data...',
        error: 'Error',
        recentMatches: 'Recent Matches for',
        victory: 'Victory',
        defeat: 'Defeat',
        backToMatches: '← Back to Matches',
        blueTeam: 'Blue Team',
        redTeam: 'Red Team',
        teamAvgMII: 'Team Avg MII',
        // Explanation
        whatIsMII: 'What is MII?',
        miiExplanation: 'Match Integrity Index (MII) measures structural fairness of the match environment, not individual skill. It evaluates whether the competitive conditions were fair. Lower = advantageous team environment, Higher = disadvantageous team environment.',
        howToRead: 'How to Interpret MII',
        miiRange1: '0-25: Highly advantageous team (teammates ranked 1-3)',
        miiRange2: '25-50: Above average team (teammates ranked 4-6)',
        miiRange3: '50-75: Below average team (teammates ranked 7-8)',
        miiRange4: '75-100: Severely disadvantaged team (teammates ranked 9-10)',
        calculation: 'Calculation Method',
        calcFormula: 'Rank all 10 players by performance → 1st: MII 0, 2nd: MII 11.1, ..., 10th: MII 100',
        calcNote: '* Performance = (KDA × 10) - (Deaths × 3) + (Damage / 1000)',
        // Verdicts
        balancedMatch: 'Balanced Match',
        balancedDetail: 'Both teams had similar skill levels.',
        slightImbalance: 'Slight Imbalance',
        slightImbalanceBlue: 'Blue team had slightly better players.',
        slightImbalanceRed: 'Red team had slightly better players.',
        significantImbalance: 'Significant Imbalance',
        significantImbalanceBlue: 'Blue team had significantly better players.',
        significantImbalanceRed: 'Red team had significantly better players.',
    }
};

const API_BASE = window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api'
    : '/api';

function App() {
    const [lang, setLang] = useState('ko');
    const [gameName, setGameName] = useState('');
    const [tagLine, setTagLine] = useState('');
    const [server, setServer] = useState('NA');
    const [loading, setLoading] = useState(false);
    const [matches, setMatches] = useState(null);
    const [analysis, setAnalysis] = useState(null);
    const [error, setError] = useState(null);
    const [showExplanation, setShowExplanation] = useState(false);

    const t = TRANSLATIONS[lang];

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

    const translateVerdict = (verdict, verdictDetail) => {
        const blueAvg = analysis?.blue_team?.avg_mii || 0;
        const redAvg = analysis?.red_team?.avg_mii || 0;
        const betterTeam = blueAvg < redAvg ? 'blue' : 'red';

        if (verdict.includes('Balanced')) {
            return {
                title: t.balancedMatch,
                detail: t.balancedDetail
            };
        } else if (verdict.includes('Slight')) {
            return {
                title: t.slightImbalance,
                detail: betterTeam === 'blue' ? t.slightImbalanceBlue : t.slightImbalanceRed
            };
        } else {
            return {
                title: t.significantImbalance,
                detail: betterTeam === 'blue' ? t.significantImbalanceBlue : t.significantImbalanceRed
            };
        }
    };

    return (
        <div className="container">
            <div className="header">
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <div>
                        <h1>{t.title}</h1>
                        <p>{t.subtitle}</p>
                    </div>
                    <div className="language-toggle">
                        <button
                            className={lang === 'ko' ? 'active' : ''}
                            onClick={() => setLang('ko')}
                        >
                            한국어
                        </button>
                        <button
                            className={lang === 'en' ? 'active' : ''}
                            onClick={() => setLang('en')}
                        >
                            English
                        </button>
                    </div>
                </div>
            </div>

            {/* MII Explanation Section */}
            <div className="explanation-card">
                <button
                    className="explanation-toggle"
                    onClick={() => setShowExplanation(!showExplanation)}
                >
                    {t.whatIsMII} {showExplanation ? '▼' : '▶'}
                </button>

                {showExplanation && (
                    <div className="explanation-content">
                        <p><strong>{t.miiExplanation}</strong></p>

                        <h4>{t.howToRead}:</h4>
                        <ul>
                            <li style={{color: '#10b981'}}>✓ {t.miiRange1}</li>
                            <li style={{color: '#f59e0b'}}>⚠ {t.miiRange2}</li>
                            <li style={{color: '#ef4444'}}>✗ {t.miiRange3}</li>
                            <li style={{color: '#dc2626'}}>⚠️ {t.miiRange4}</li>
                        </ul>

                        <h4>{t.calculation}:</h4>
                        <code style={{display: 'block', padding: '10px', background: '#1f2937', borderRadius: '5px', fontSize: '0.85rem'}}>
                            {t.calcFormula}
                        </code>
                        <p style={{fontSize: '0.85rem', color: '#9ca3af', marginTop: '5px'}}>{t.calcNote}</p>
                    </div>
                )}
            </div>

            <div className="search-card">
                <form onSubmit={handleSearch} className="search-form">
                    <div className="form-group">
                        <label>{t.summonerName}</label>
                        <input
                            type="text"
                            value={gameName}
                            onChange={(e) => setGameName(e.target.value)}
                            placeholder="Hide on bush"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>{t.tagLine}</label>
                        <input
                            type="text"
                            value={tagLine}
                            onChange={(e) => setTagLine(e.target.value)}
                            placeholder="KR1"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>{t.server}</label>
                        <select value={server} onChange={(e) => setServer(e.target.value)}>
                            {SERVERS.map(s => (
                                <option key={s.code} value={s.code}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? t.searching : t.search}
                    </button>
                </form>
            </div>

            {loading && (
                <div className="loading">
                    <div className="spinner"></div>
                    <p>{t.loading}</p>
                </div>
            )}

            {error && (
                <div className="error">
                    <strong>{t.error}:</strong> {error}
                </div>
            )}

            {matches && !analysis && (
                <div className="matches-list">
                    <h2>{t.recentMatches} {matches.player}</h2>
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
                            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px'}}>
                                <span className={`team-badge ${match.team.toLowerCase()}`}>
                                    {match.team} Team
                                </span>
                                <span className={`match-result ${match.win ? 'win' : 'loss'}`}>
                                    {match.win ? t.victory : t.defeat}
                                </span>
                            </div>
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
                        {t.backToMatches}
                    </button>

                    <div className="verdict-card">
                        <h2>{translateVerdict(analysis.verdict, analysis.verdict_detail).title}</h2>
                        <p>{translateVerdict(analysis.verdict, analysis.verdict_detail).detail}</p>
                    </div>

                    <div className="teams-container">
                        <div className="team-card blue">
                            <div className="team-header">
                                <h3>{t.blueTeam}</h3>
                                <span className="team-status">
                                    {analysis.blue_team.won ? `✓ ${t.victory}` : `✗ ${t.defeat}`}
                                </span>
                            </div>

                            <div className="avg-mii">
                                {t.teamAvgMII}: {analysis.blue_team.avg_mii}
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
                                <h3>{t.redTeam}</h3>
                                <span className="team-status">
                                    {analysis.red_team.won ? `✓ ${t.victory}` : `✗ ${t.defeat}`}
                                </span>
                            </div>

                            <div className="avg-mii">
                                {t.teamAvgMII}: {analysis.red_team.avg_mii}
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
