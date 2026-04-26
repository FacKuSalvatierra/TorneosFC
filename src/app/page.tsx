'use client';

import { useState, useEffect } from 'react';
import { Tournament, Player, Match, TournamentFormat, TeamAssignment, PES_TEAMS, LEAGUES } from '@/types';

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function generateMatchups(players: Player[]): { p1Id: string; p2Id: string }[] {
  const shuffled = shuffleArray([...players]);
  const matchups: { p1Id: string; p2Id: string }[] = [];
  
  for (let i = 0; i < shuffled.length; i += 2) {
    if (shuffled[i + 1]) {
      matchups.push({ p1Id: shuffled[i].id, p2Id: shuffled[i + 1].id });
    } else {
      matchups.push({ p1Id: shuffled[i].id, p2Id: '' });
    }
  }
  return matchups;
}

export default function Home() {
  const [tournamentName, setTournamentName] = useState('');
  const [format, setFormat] = useState<TournamentFormat>('liga');
  const [playerCount, setPlayerCount] = useState(4);
  const [playerNames, setPlayerNames] = useState<string[]>(['', '', '', '']);
  const [teamAssignment, setTeamAssignment] = useState<TeamAssignment>('auto');
  const [selectedLeague, setSelectedLeague] = useState('Todas');
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [selectedTeams, setSelectedTeams] = useState<{ [key: string]: string }>({});
  const [currentPage, setCurrentPage] = useState<'setup' | 'teams' | 'tournament'>('setup');
  const [availableTeams, setAvailableTeams] = useState<string[]>([...PES_TEAMS]);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [tempScore, setTempScore] = useState({ p1: 0, p2: 0 });
  const [winner, setWinner] = useState<string>('');
  const [showVictoryModal, setShowVictoryModal] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('pes-torneo');
    if (saved) {
      try {
        setTournament(JSON.parse(saved));
        setCurrentPage('tournament');
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (tournament) {
      localStorage.setItem('pes-torneo', JSON.stringify(tournament));
    } else {
      localStorage.removeItem('pes-torneo');
    }
  }, [tournament]);

  useEffect(() => {
    if (tournament?.isComplete && tournament.format === 'liga') {
      const standings = getStandings();
      if (standings.length > 0) {
        setWinner(standings[0].player.name);
        setShowVictoryModal(true);
      }
    }
  }, [tournament?.isComplete]);

  const handlePlayerCountChange = (count: number) => {
    const newCount = Math.max(2, Math.min(16, count));
    setPlayerCount(newCount);
    const newNames = [...playerNames];
    while (newNames.length < newCount) {
      newNames.push('');
    }
    setPlayerNames(newNames.slice(0, newCount));
  };

  const updatePlayerName = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
  };

  const createTournament = () => {
    const validNames = playerNames.filter(n => n.trim() !== '');
    if (validNames.length < 2 || !tournamentName.trim()) return;

    const players: Player[] = validNames.map((name, i) => ({
      id: generateId(),
      name: name.trim(),
      team: '',
    }));

    const matches: Match[] = [];
    
    if (format === 'liga') {
      const numPlayers = players.length;
      const numFechas = numPlayers - 1;
      
      for (let fecha = 1; fecha <= numFechas; fecha++) {
        const matchups = generateMatchups(players);
        matchups.forEach(m => {
          matches.push({
            id: generateId(),
            player1Id: m.p1Id,
            player2Id: m.p2Id,
            player1Goals: 0,
            player2Goals: 0,
            played: false,
            round: fecha,
            fecha,
          });
        });
        
        const lastPlayer = players.pop();
        if (lastPlayer) players.unshift(lastPlayer);
      }
    } else {
      const numRounds = Math.ceil(Math.log2(players.length));
      let roundMatches = players.length;
      if (roundMatches % 2 !== 0) {
        roundMatches = roundMatches + 1;
      }
      
      for (let round = 1; round <= numRounds; round++) {
        const matchesInRound = roundMatches / Math.pow(2, round - 1);
        for (let m = 0; m < matchesInRound; m++) {
          if (round === 1) {
            const shuffledPlayers = shuffleArray([...players]);
            matches.push({
              id: generateId(),
              player1Id: shuffledPlayers[m * 2]?.id || '',
              player2Id: shuffledPlayers[m * 2 + 1]?.id || '',
              player1Goals: 0,
              player2Goals: 0,
              played: false,
              round,
              fecha: round,
            });
          } else {
            matches.push({
              id: generateId(),
              player1Id: '',
              player2Id: '',
              player1Goals: 0,
              player2Goals: 0,
              played: false,
              round,
              fecha: round,
            });
          }
        }
      }
    }

    const newTournament: Tournament = {
      id: generateId(),
      name: tournamentName.trim(),
      format,
      players,
      matches,
      currentRound: 1,
      isComplete: false,
      createdAt: Date.now(),
    };

    setTournament(newTournament);
    setAvailableTeams([...PES_TEAMS]);
    setCurrentPage('teams');
  };

  const assignTeamsAuto = () => {
    if (!tournament) return;
    const leagueTeams = LEAGUES[selectedLeague] || PES_TEAMS;
    const shuffledTeams = shuffleArray([...leagueTeams]);
    const updatedPlayers = tournament.players.map((player, i) => ({
      ...player,
      team: shuffledTeams[i % shuffledTeams.length],
    }));
    setTournament({ ...tournament, players: updatedPlayers });
    setCurrentPage('tournament');
  };

  const assignTeamToPlayer = (playerId: string, team: string) => {
    if (!tournament) return;
    setSelectedTeams(prev => ({ ...prev, [playerId]: team }));
  };

  const assignTeamsManual = () => {
    if (!tournament) return;
    const updatedPlayers = tournament.players.map(player => ({
      ...player,
      team: selectedTeams[player.id] || '',
    }));
    const allHaveTeam = updatedPlayers.every(p => p.team);
    if (allHaveTeam) {
      setTournament({ ...tournament, players: updatedPlayers });
      setCurrentPage('tournament');
    }
  };

  const openScoreModal = (match: Match) => {
    setEditingMatch(match);
    setTempScore({ p1: match.player1Goals, p2: match.player2Goals });
  };

  const saveScore = () => {
    if (!tournament || !editingMatch) return;
    const updatedMatches = tournament.matches.map(m => {
      if (m.id === editingMatch.id) {
        return {
          ...m,
          player1Goals: tempScore.p1,
          player2Goals: tempScore.p2,
          played: true,
        };
      }
      return m;
    });
    const allPlayed = updatedMatches.every(m => m.played);
    setTournament({ ...tournament, matches: updatedMatches, isComplete: allPlayed });
    setEditingMatch(null);
  };

  const advanceKnockoutRound = () => {
    if (!tournament || tournament.format !== 'eliminacion') return;
    
    const currentMatches = tournament.matches.filter(m => m.round === tournament.currentRound);
    const allPlayed = currentMatches.every(m => m.played);
    if (!allPlayed) return;

    const winners: Player[] = [];
    currentMatches.forEach(match => {
      const p1 = tournament.players.find(p => p.id === match.player1Id);
      const p2 = tournament.players.find(p => p.id === match.player2Id);
      if (match.player1Goals > match.player2Goals && p1) winners.push(p1);
      else if (match.player2Goals > match.player1Goals && p2) winners.push(p2);
      else if (match.player1Goals === match.player2Goals && match.player1Goals > 0) {
        if (Math.random() > 0.5 && p1) winners.push(p1);
        else if (p2) winners.push(p2);
      }
    });

    const nextRound = tournament.currentRound + 1;
    const nextMatches = tournament.matches.filter(m => m.round === nextRound);
    
    if (winners.length === 1 || (nextMatches.length === 0 && winners.length > 0)) {
      setTournament({ ...tournament, isComplete: true });
      return;
    }

    let matchIndex = 0;
    const updatedMatches = tournament.matches.map(m => {
      if (m.round === nextRound && m.player1Id === '') {
        const winner1 = winners[matchIndex++];
        const winner2 = winners[matchIndex++];
        return {
          ...m,
          player1Id: winner1?.id || '',
          player2Id: winner2?.id || '',
        };
      }
      return m;
    });

    setTournament({ ...tournament, matches: updatedMatches, currentRound: nextRound });
  };

  const getStandings = () => {
    if (!tournament) return [];
    
    const stats: { [key: string]: { points: number; gf: number; gc: number; gd: number; played: number } } = {};
    
    tournament.players.forEach(p => {
      stats[p.id] = { points: 0, gf: 0, gc: 0, gd: 0, played: 0 };
    });

    tournament.matches.forEach(m => {
      if (m.played) {
        const s1 = stats[m.player1Id];
        const s2 = stats[m.player2Id];
        if (s1 && s2) {
          s1.gf += m.player1Goals;
          s1.gc += m.player2Goals;
          s1.gd = s1.gf - s1.gc;
          s2.gf += m.player2Goals;
          s2.gc += m.player1Goals;
          s2.gd = s2.gf - s2.gc;
          s1.played++;
          s2.played++;

          if (m.player1Goals > m.player2Goals) s1.points += 3;
          else if (m.player2Goals > m.player1Goals) s2.points += 3;
          else { s1.points++; s2.points++; }
        }
      }
    });

    return tournament.players.map(p => ({
      player: p,
      ...stats[p.id],
    })).sort((a, b) => b.points - a.points || b.gd - a.gd);
  };

  const getFechas = () => {
    if (!tournament) return [];
    const fechas = tournament.matches
      .filter(m => m.round > 0)
      .reduce((acc, m) => {
        if (!acc[m.round]) acc[m.round] = [];
        acc[m.round].push(m);
        return acc;
      }, {} as { [key: number]: Match[] });
    return Object.keys(fechas).map(Number).sort((a, b) => a - b);
  };

  const getKnockoutMatches = () => {
    if (!tournament) return { current: [], next: [] };
    const current = tournament.matches.filter(m => m.round === tournament.currentRound);
    const next = tournament.matches.filter(m => m.round === tournament.currentRound + 1);
    return { current, next };
  };

  const resetTournament = () => {
    setTournament(null);
    setTournamentName('');
    setPlayerNames(['', '', '', '']);
    setSelectedTeams({});
    setCurrentPage('setup');
  };

  const renderSetup = () => (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 p-6">
      <div className="bg-[#16161f] rounded-xl p-6 sm:p-8 border border-[#ff4d4d33]">
        <h1 className="text-3xl font-bold text-center mb-2 text-[#ff4d4d]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
          PES TORNEOS
        </h1>
        <p className="text-center text-[#8888aa] mb-8">Crea tu torneo con amigos</p>

        <div className="space-y-6">
          <div>
            <label className="block text-sm text-[#8888aa] mb-2">Nombre del Torneo</label>
            <input
              type="text"
              value={tournamentName}
              onChange={(e) => setTournamentName(e.target.value)}
              placeholder="Copa de los Cuates"
              className="w-full bg-[#0a0a0f] border border-[#8888aa33] rounded-lg px-4 py-3 text-white focus:border-[#ff4d4d] focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-[#8888aa] mb-2">Formato</label>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setFormat('liga')}
                className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                  format === 'liga' 
                    ? 'bg-[#ff4d4d] text-white glow-border' 
                    : 'bg-[#1a1a2e] text-[#8888aa] hover:bg-[#1e1e2a]'
                }`}
              >
                Liga
              </button>
              <button
                onClick={() => setFormat('eliminacion')}
                className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                  format === 'eliminacion' 
                    ? 'bg-[#ff4d4d] text-white glow-border' 
                    : 'bg-[#1a1a2e] text-[#8888aa] hover:bg-[#1e1e2a]'
                }`}
              >
                Eliminación
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-[#8888aa] mb-2">Cantidad de Jugadores ({playerCount})</label>
            <input
              type="range"
              min="2"
              max="16"
              value={playerCount}
              onChange={(e) => handlePlayerCountChange(parseInt(e.target.value))}
              className="w-full accent-[#ff4d4d]"
            />
            <div className="flex justify-between text-xs text-[#8888aa]">
              <span>2</span>
              <span>16</span>
            </div>
          </div>

          <div>
            <label className="block text-sm text-[#8888aa] mb-2">Nombres de Jugadores</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {playerNames.slice(0, playerCount).map((name, i) => (
                <input
                  key={i}
                  type="text"
                  value={name}
                  onChange={(e) => updatePlayerName(i, e.target.value)}
                  placeholder={`Jugador ${i + 1}`}
                  className="bg-[#0a0a0f] border border-[#8888aa33] rounded-lg px-4 py-2 text-white focus:border-[#ff4d4d] focus:outline-none transition-colors"
                />
              ))}
            </div>
          </div>

          <button
            onClick={createTournament}
            disabled={!tournamentName.trim() || playerNames.filter(n => n.trim()).length < 2}
            className="w-full py-4 bg-[#ff4d4d] text-white font-bold rounded-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            style={{ fontFamily: 'Orbitron, sans-serif' }}
          >
            CREAR TORNEO
          </button>
        </div>
      </div>
    </div>
  );

  const renderTeamAssignment = () => (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 p-6">
      <div className="bg-[#16161f] rounded-xl p-6 sm:p-8 border border-[#ff4d4d33]">
        <h2 className="text-2xl font-bold text-center mb-2 text-[#ffd700]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
          Asignar Equipos
        </h2>
        <p className="text-center text-[#8888aa] mb-6">Elige cómo asignar los equipos PES</p>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <button
            onClick={() => setTeamAssignment('auto')}
            className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
              teamAssignment === 'auto' 
                ? 'bg-[#ffd700] text-black accent-glow' 
                : 'bg-[#1a1a2e] text-[#8888aa] hover:bg-[#1e1e2a]'
            }`}
          >
            Automático
          </button>
          <button
            onClick={() => setTeamAssignment('manual')}
            className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
              teamAssignment === 'manual' 
                ? 'bg-[#ffd700] text-black accent-glow' 
                : 'bg-[#1a1a2e] text-[#8888aa] hover:bg-[#1e1e2a]'
            }`}
          >
            Manual
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-[#8888aa] mb-2">Seleccionar Liga</label>
          <select
            value={selectedLeague}
            onChange={(e) => setSelectedLeague(e.target.value)}
            className="bg-[#1a1a2e] text-white px-4 py-2 rounded-lg border border-[#8888aa33] focus:border-[#ffd700] focus:outline-none"
          >
            {Object.keys(LEAGUES).map(league => (
              <option key={league} value={league}>{league}</option>
            ))}
          </select>
        </div>

        {teamAssignment === 'auto' ? (
          <div className="text-center">
            <p className="text-[#8888aa] mb-6">
              Se sortearán equipos aleatorios de la liga {selectedLeague} ({LEAGUES[selectedLeague]?.length || 0} equipos disponibles)
            </p>
            <button
              onClick={assignTeamsAuto}
              className="px-8 py-3 bg-[#ffd700] text-black font-bold rounded-lg hover:brightness-110 transition-all accent-glow"
              style={{ fontFamily: 'Orbitron, sans-serif' }}
            >
              SORTEAR EQUIPOS
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {tournament?.players.map(player => (
              <div key={player.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#0a0a0f] p-3 rounded-lg">
                <span className="text-white font-medium">{player.name}</span>
                <select
                  value={selectedTeams[player.id] || ''}
                  onChange={(e) => assignTeamToPlayer(player.id, e.target.value)}
                  className="w-full sm:w-auto bg-[#1a1a2e] text-white px-3 py-2 rounded-lg border border-[#8888aa33] focus:border-[#ffd700] focus:outline-none"
                >
                  <option value="">Seleccionar equipo</option>
                  {(LEAGUES[selectedLeague] || PES_TEAMS)
                    .filter(t => !Object.values(selectedTeams).includes(t) || selectedTeams[player.id] === t)
                    .map(team => (
                      <option key={team} value={team}>{team}</option>
                    ))}
                </select>
              </div>
            ))}
            <button
              onClick={assignTeamsManual}
              className="w-full py-3 bg-[#ffd700] text-black font-bold rounded-lg hover:brightness-110 transition-all accent-glow"
              style={{ fontFamily: 'Orbitron, sans-serif' }}
            >
              CONFIRMAR EQUIPOS
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderScoreModal = () => {
    if (!editingMatch || !tournament) return null;
    
    const p1 = tournament.players.find(p => p.id === editingMatch.player1Id);
    const p2 = tournament.players.find(p => p.id === editingMatch.player2Id);

    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-[#16161f] rounded-xl p-6 w-full max-w-md border border-[#ff4d4d]">
          <h3 className="text-xl font-bold text-center mb-6 text-[#ffd700]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            Ingresar Resultado
          </h3>
          
          <div className="flex items-center justify-between mb-6">
            <div className="text-center flex-1">
              <p className="text-white font-semibold mb-1">{p1?.name}</p>
              <p className="text-xs text-[#8888aa]">{p1?.team}</p>
            </div>
            <div className="flex gap-4 mx-4">
              <input
                type="number"
                min="0"
                max="99"
                value={tempScore.p1}
                onChange={(e) => setTempScore(s => ({ ...s, p1: parseInt(e.target.value) || 0 }))}
                className="w-16 h-16 text-center text-2xl font-bold bg-[#0a0a0f] text-white border border-[#8888aa33] rounded-lg focus:border-[#ff4d4d] focus:outline-none"
              />
              <span className="text-2xl font-bold text-[#8888aa] self-center">-</span>
              <input
                type="number"
                min="0"
                max="99"
                value={tempScore.p2}
                onChange={(e) => setTempScore(s => ({ ...s, p2: parseInt(e.target.value) || 0 }))}
                className="w-16 h-16 text-center text-2xl font-bold bg-[#0a0a0f] text-white border border-[#8888aa33] rounded-lg focus:border-[#ff4d4d] focus:outline-none"
              />
            </div>
            <div className="text-center flex-1">
              <p className="text-white font-semibold mb-1">{p2?.name}</p>
              <p className="text-xs text-[#8888aa]">{p2?.team}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setEditingMatch(null)}
              className="flex-1 py-3 bg-[#1a1a2e] text-[#8888aa] rounded-lg hover:bg-[#1e1e2a] transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={saveScore}
              className="flex-1 py-3 bg-[#ff4d4d] text-white font-bold rounded-lg hover:brightness-110 transition-all"
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    );
  };
  const renderVictoryModal = () => {
    if (!showVictoryModal || !tournament) return null;

    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="bg-[#16161f] rounded-xl p-8 w-full max-w-lg border-2 border-[#ffd700] text-center relative overflow-hidden">
          {/* Efecto de confetti simple con CSS */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-[#ffd700] rounded-full animate-bounce"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${1 + Math.random()}s`,
                }}
              />
            ))}
          </div>

          <div className="relative z-10">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-3xl font-bold text-[#ffd700] mb-2 animate-pulse" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              ¡VICTORIA!
            </h2>
            <p className="text-xl text-white mb-4">
              <span className="font-bold text-[#ff4d4d]">{winner}</span> es el campeón del torneo
            </p>
            <p className="text-[#8888aa] mb-6">
              "{tournament.name}" - Liga completada
            </p>
            <button
              onClick={() => {
                setShowVictoryModal(false);
                setTournament(null);
                setCurrentPage('setup');
              }}
              className="px-6 py-3 bg-[#ffd700] text-black font-bold rounded-lg hover:brightness-110 transition-all accent-glow"
              style={{ fontFamily: 'Orbitron, sans-serif' }}
            >
              NUEVO TORNEO
            </button>
          </div>
        </div>
      </div>
    );
  };
  const renderTournamentView = () => {
    if (!tournament) return null;

    if (tournament.format === 'liga') {
      const standings = getStandings();
      const fechas = getFechas();

      return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 p-6">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-[#ff4d4d]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              {tournament.name}
            </h1>
            <p className="text-[#8888aa]">Formato: Liga</p>
          </div>

          <div className="bg-[#16161f] rounded-xl p-6 border border-[#ff4d4d33] mb-6">
            <h2 className="text-xl font-bold text-[#ffd700] mb-4" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              Tabla de Posiciones
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full w-full text-center">
                <thead>
                  <tr className="text-[#8888aa] border-b border-[#8888aa33]">
                    <th className="py-2">#</th>
                    <th className="py-2 text-left">Jugador</th>
                    <th className="py-2">Equipo</th>
                    <th className="py-2">PJ</th>
                    <th className="py-2">PTS</th>
                    <th className="py-2">GF</th>
                    <th className="py-2">GC</th>
                    <th className="py-2">DG</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((s, i) => (
                    <tr key={s.player.id} className="border-b border-[#8888aa22] hover:bg-[#1e1e2a]">
                      <td className="py-3 text-[#ffd700] font-bold">{i + 1}</td>
                      <td className="py-3 text-left text-white">{s.player.name}</td>
                      <td className="py-3 text-[#8888aa]">{s.player.team}</td>
                      <td className="py-3 text-white">{s.played}</td>
                      <td className="py-3 text-[#ff4d4d] font-bold">{s.points}</td>
                      <td className="py-3 text-white">{s.gf}</td>
                      <td className="py-3 text-white">{s.gc}</td>
                      <td className="py-3 text-white">{s.gd >= 0 ? `+${s.gd}` : s.gd}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6">
            {fechas.map(fechaNum => {
              const fechaMatches = tournament.matches
                .filter(m => m.round === fechaNum)
                .sort((a, b) => a.id.localeCompare(b.id));
              
              const allPlayed = fechaMatches.every(m => m.played);
              
              return (
                <div key={fechaNum} className="bg-[#16161f] rounded-xl p-6 border border-[#ff4d4d33]">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-[#ffd700]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                      Fecha {fechaNum}
                    </h2>
                    {allPlayed && (
                      <span className="px-3 py-1 bg-[#22c55e] text-white text-xs rounded-full">Completada</span>
                    )}
                  </div>
                  <div className="grid gap-3">
                    {fechaMatches.map(match => {
                      const p1 = tournament.players.find(p => p.id === match.player1Id);
                      const p2 = tournament.players.find(p => p.id === match.player2Id);
                      return (
                        <div key={match.id} className="bg-[#0a0a0f] p-4 rounded-lg grid gap-4 sm:grid-cols-3 sm:items-center">
                          <div className="space-y-1 text-center sm:text-right">
                            <div className="text-xs uppercase tracking-[0.2em] text-[#8888aa]">Local</div>
                            <span className="text-white font-semibold text-lg">{p1?.name}</span>
                            <div className="text-xs text-[#8888aa]">{p1?.team}</div>
                          </div>
                          <div className="flex flex-col items-center justify-center gap-2 sm:gap-0">
                            {match.played ? (
                              <span className="text-2xl font-bold text-[#ffd700]">{match.player1Goals} - {match.player2Goals}</span>
                            ) : (
                              <button
                                onClick={() => openScoreModal(match)}
                                className="px-4 py-2 bg-[#ff4d4d] text-white text-sm font-semibold rounded hover:brightness-110 transition-all"
                              >
                                Ingresar
                              </button>
                            )}
                          </div>
                          <div className="space-y-1 text-center sm:text-left">
                            <div className="text-xs uppercase tracking-[0.2em] text-[#8888aa]">Visita</div>
                            <span className="text-white font-semibold text-lg">{p2?.name}</span>
                            <div className="text-xs text-[#8888aa]">{p2?.team}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={resetTournament}
            className="mt-6 w-full py-3 bg-[#1a1a2e] text-[#8888aa] rounded-lg hover:bg-[#1e1e2a] transition-all"
          >
            Nuevo Torneo
          </button>

          {renderScoreModal()}
          {renderVictoryModal()}
        </div>
      );
    } else {
      const { current } = getKnockoutMatches();
      return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 p-6">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-[#ff4d4d]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              {tournament.name}
            </h1>
            <p className="text-[#8888aa]">Eliminación Directa - Ronda {tournament.currentRound}</p>
          </div>

          {tournament.isComplete ? (
            <div className="bg-[#16161f] rounded-xl p-8 border border-[#ffd700] text-center accent-glow">
              <h2 className="text-2xl font-bold text-[#ffd700] mb-4" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                CAMPEÓN
              </h2>
              <p className="text-4xl font-bold text-white mb-2">
                {tournament.players.find(p => {
                  const lastMatch = [...tournament.matches].reverse().find(m => 
                    m.played && (m.player1Id === p.id || m.player2Id === p.id)
                  );
                  if (!lastMatch) return false;
                  return (lastMatch.player1Goals > lastMatch.player2Goals && lastMatch.player1Id === p.id) ||
                         (lastMatch.player2Goals > lastMatch.player1Goals && lastMatch.player2Id === p.id);
                })?.name}
              </p>
              <p className="text-[#8888aa]">
                {tournament.players.find(p => {
                  const lastMatch = [...tournament.matches].reverse().find(m => 
                    m.played && (m.player1Id === p.id || m.player2Id === p.id)
                  );
                  if (!lastMatch) return false;
                  return (lastMatch.player1Goals > lastMatch.player2Goals && lastMatch.player1Id === p.id) ||
                         (lastMatch.player2Goals > lastMatch.player1Goals && lastMatch.player2Id === p.id);
                })?.team}
              </p>
            </div>
          ) : (
            <div className="bg-[#16161f] rounded-xl p-6 border border-[#ff4d4d33]">
              <h2 className="text-xl font-bold text-[#ffd700] mb-4" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                Partidos - Ronda {tournament.currentRound}
              </h2>
              <div className="space-y-4">
                {current.map(match => {
                  const p1 = tournament.players.find(p => p.id === match.player1Id);
                  const p2 = tournament.players.find(p => p.id === match.player2Id);
                  const hasBothPlayers = p1 && p2;
                  
                  return (
                    <div key={match.id} className="bg-[#0a0a0f] p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 text-right">
                          <span className={`font-medium ${p1 ? 'text-white' : 'text-[#8888aa]'}`}>
                            {p1?.name || 'Por definir'}
                          </span>
                          <div className="text-xs text-[#8888aa]">{p1?.team}</div>
                        </div>
                        <div className="mx-4">
                          {match.played ? (
                            <span className="text-2xl font-bold text-[#ffd700]">
                              {match.player1Goals} - {match.player2Goals}
                            </span>
                          ) : hasBothPlayers ? (
                            <button
                              onClick={() => openScoreModal(match)}
                              className="px-4 py-2 bg-[#ff4d4d] text-white font-bold rounded hover:brightness-110 transition-all"
                            >
                              INGRESAR
                            </button>
                          ) : (
                            <span className="text-[#8888aa] text-sm">Esperando...</span>
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <span className={`font-medium ${p2 ? 'text-white' : 'text-[#8888aa]'}`}>
                            {p2?.name || 'Por definir'}
                          </span>
                          <div className="text-xs text-[#8888aa]">{p2?.team}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {current.every(m => m.played) && current.length > 0 && (
                <button
                  onClick={advanceKnockoutRound}
                  className="mt-6 w-full py-3 bg-[#ffd700] text-black font-bold rounded-lg hover:brightness-110 transition-all accent-glow"
                  style={{ fontFamily: 'Orbitron, sans-serif' }}
   >
                  SIGUIENTE RONDA
                </button>
              )}
            </div>
          )}

          <button
            onClick={resetTournament}
            className="mt-6 w-full py-3 bg-[#1a1a2e] text-[#8888aa] rounded-lg hover:bg-[#1e1e2a] transition-all"
          >
            Nuevo Torneo
          </button>

          {renderScoreModal()}
          {renderVictoryModal()}
        </div>
      );
    }
  };

  return (
    <main className="min-h-screen gradient-bg py-8">
      {currentPage === 'setup' && renderSetup()}
      {currentPage === 'teams' && renderTeamAssignment()}
      {currentPage === 'tournament' && renderTournamentView()}
    </main>
  );
}