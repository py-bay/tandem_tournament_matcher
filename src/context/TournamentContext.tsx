import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Player, Team, TournamentState, MatchResult } from '../lib/types';
import { generateRound } from '../lib/matchmaking';

interface TournamentContextType {
    state: TournamentState;
    addPlayer: (name: string) => void;
    removePlayer: (id: string) => void;
    createTeams: (pairs: [string, string][]) => void;
    startTournament: (mode: 'swiss' | 'round_robin', totalRounds?: number) => void;
    nextRound: () => void;
    submitMatchResult: (matchId: string, result: MatchResult) => void;
    disbandTeam: (teamId: string) => void;
    resetTournament: () => void;
    toggleWeightedFirstGame: () => void;
}

const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

const INITIAL_STATE: TournamentState = {
    name: 'Tandem Tournament',
    players: [],
    teams: [],
    rounds: [],
    currentRound: 0,
    status: 'setup',
    mode: 'swiss',
    weightedFirstGame: false,
};

export function TournamentProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<TournamentState>(() => {
        const saved = localStorage.getItem('tandem_tournament_state');
        return saved ? JSON.parse(saved) : INITIAL_STATE;
    });

    useEffect(() => {
        localStorage.setItem('tandem_tournament_state', JSON.stringify(state));
    }, [state]);

    const addPlayer = (name: string) => {
        const newPlayer: Player = {
            id: crypto.randomUUID(),
            name,
            individualScore: 0,
            matchesPlayed: 0,
            wins: 0,
            losses: 0,
            draws: 0,
        };
        setState(prev => ({ ...prev, players: [...prev.players, newPlayer] }));
    };

    const removePlayer = (id: string) => {
        setState(prev => ({
            ...prev,
            players: prev.players.filter(p => p.id !== id)
        }));
    };

    const createTeams = (pairs: [string, string][]) => {
        const newTeams: Team[] = pairs.map(([p1Id, p2Id]) => {
            const p1 = state.players.find(p => p.id === p1Id);
            const p2 = state.players.find(p => p.id === p2Id);
            return {
                id: crypto.randomUUID(),
                name: `${p1?.name} & ${p2?.name}`,
                player1Id: p1Id,
                player2Id: p2Id,
                teamScore: 0,
                matchPoints: 0,
                buchholz: 0,
                matchesPlayed: 0,
                active: true
            };
        });
        setState(prev => ({ ...prev, teams: [...prev.teams, ...newTeams] }));
    };

    const disbandTeam = (teamId: string) => {
        setState(prev => ({
            ...prev,
            teams: prev.teams.filter(t => t.id !== teamId)
        }));
    };

    const startTournament = (mode: 'swiss' | 'round_robin', totalRounds?: number) => {
        if (state.teams.length < 2) return;

        // For Round Robin, total rounds is usually teams.length - 1 (if even) or teams.length (if odd)
        // But we can let the generator handle the logic or just pass it through.
        // If mode is round_robin, we might ignore totalRounds or use it as a limit.

        const round1 = generateRound(1, state.teams, [], mode);
        setState(prev => ({
            ...prev,
            status: 'active',
            currentRound: 1,
            mode,
            totalRounds,
            rounds: [{ number: 1, matches: round1, isCompleted: false }]
        }));
    };

    const updateStats = (currentState: TournamentState) => {
        // Reset stats to recalculate from scratch (safest way)
        const playersMap = new Map(currentState.players.map(p => [p.id, { ...p, individualScore: 0, wins: 0, losses: 0, draws: 0, matchesPlayed: 0 }]));
        const teamsMap = new Map(currentState.teams.map(t => [t.id, { ...t, teamScore: 0, matchPoints: 0, matchesPlayed: 0, buchholz: 0 }]));

        currentState.rounds.forEach(round => {
            round.matches.forEach(match => {
                if (!match.isCompleted || !match.result) return;

                const teamA = teamsMap.get(match.teamAId);
                const teamB = teamsMap.get(match.teamBId); // Might be undefined if BYE

                if (teamA) {
                    // Team Stats
                    let b1Points = match.result.board1;
                    let b2Points = match.result.board2;

                    // Points are already weighted in the match result if applicable

                    const points = b1Points + b2Points;
                    teamA.teamScore += points;
                    teamA.matchesPlayed += 1;

                    const totalAvailable = currentState.weightedFirstGame ? 3 : 2;
                    const threshold = totalAvailable / 2;

                    if (currentState.weightedFirstGame) {
                        // In weighted mode, Match Points = Team Score (Game Points)
                        teamA.matchPoints += points;
                    } else {
                        if (points > threshold) teamA.matchPoints += 2; // Win
                        else if (points === threshold) teamA.matchPoints += 1; // Draw
                    }

                    // Player Stats (Assuming Board 1 is Player 1, Board 2 is Player 2 for simplicity? 
                    // Or do we track who played which board? 
                    // For MVP, let's assume P1 plays B1, P2 plays B2. 
                    // Ideally we should let users swap, but let's stick to fixed boards for now or just add points to both?)

                    // Actually, in Tandem, you swap colors but partners stay. 
                    // Let's assume Player 1 is always Board A, Player 2 is Board B for the team.

                    const p1 = playersMap.get(teamA.player1Id);
                    const p2 = playersMap.get(teamA.player2Id);

                    if (p1) {
                        p1.matchesPlayed += 1;
                        p1.individualScore += match.result.board1;
                        // Check for Win (Full points) or Draw (Half points)
                        // If weighted (2 pts), 2 is Win, 1 is Draw? No, 1 is Draw in weighted?
                        // Actually, if board1 is weighted: Win=2, Draw=1, Loss=0.
                        // If board1 is unweighted: Win=1, Draw=0.5, Loss=0.
                        // We can infer max points for Board 1 too.

                        let b1Max = 1;
                        if (currentState.weightedFirstGame && (match.result.board1 > 1 || (match.result.board1 === 1 && match.result.board2 === 0.5))) {
                            b1Max = 2;
                        }

                        if (match.result.board1 === b1Max) p1.wins += 1;
                        else if (match.result.board1 === b1Max / 2) p1.draws += 1;
                        else p1.losses += 1;
                    }
                    if (p2) {
                        p2.matchesPlayed += 1;
                        p2.individualScore += match.result.board2;

                        let b2Max = 1;
                        if (currentState.weightedFirstGame && (match.result.board2 > 1 || (match.result.board2 === 1 && match.result.board1 === 0.5))) {
                            b2Max = 2;
                        }

                        if (match.result.board2 === b2Max) p2.wins += 1;
                        else if (match.result.board2 === b2Max / 2) p2.draws += 1;
                        else p2.losses += 1;
                    }
                }

                if (teamB && match.teamBId !== 'BYE') {
                    const totalAvailable = currentState.weightedFirstGame ? 3 : 2;
                    const points = totalAvailable - (match.result.board1 + match.result.board2);

                    teamB.teamScore += points;
                    teamB.matchesPlayed += 1;

                    const threshold = totalAvailable / 2;

                    if (currentState.weightedFirstGame) {
                        teamB.matchPoints += points;
                    } else {
                        if (points > threshold) teamB.matchPoints += 2;
                        else if (points === threshold) teamB.matchPoints += 1;
                    }

                    const p1 = playersMap.get(teamB.player1Id);
                    const p2 = playersMap.get(teamB.player2Id);

                    // Infer max points for each board to calculate opponent score
                    // If weightedFirstGame is ON, we assume the board with > 1 points was the weighted one (max 2).
                    // If neither > 1, it's ambiguous, but we can assume Board 1 if we must, or check if total score implies it.
                    // Actually, if we use the "First Game" toggle in UI, we should probably store that metadata.
                    // But for now, let's infer: if board1 > 1, max is 2. If board2 > 1, max is 2.
                    // If both <= 1 in weighted mode? e.g. 1-0 (First game was 1-0? No, first game win is 2).
                    // If first game was Draw (1-1), then board score is 1.
                    // If second game was Draw (0.5-0.5), board score is 0.5.
                    // So if score is 1, it could be First Game Draw OR Second Game Win.
                    // This ambiguity is real. 
                    // However, we can try to be consistent with the UI.
                    // For now, let's assume Board 1 is weighted if ambiguous, as a fallback.

                    let b1Max = 1;
                    let b2Max = 1;

                    if (currentState.weightedFirstGame) {
                        // Try to detect which board is weighted
                        if (match.result.board1 > 1 || (match.result.board1 === 1 && match.result.board2 === 0.5)) {
                            b1Max = 2;
                        } else if (match.result.board2 > 1 || (match.result.board2 === 1 && match.result.board1 === 0.5)) {
                            b2Max = 2;
                        } else {
                            // Fallback: Board 1 is weighted if no clear indicator
                            b1Max = 2;
                        }
                    }

                    const b1Res = b1Max - match.result.board1;
                    const b2Res = b2Max - match.result.board2;

                    if (p1) {
                        p1.matchesPlayed += 1;
                        p1.individualScore += b1Res;
                        // Win/Loss/Draw logic
                        // If b1Res > b1Max/2 -> Win? No, Win is full point?
                        // In weighted: Win=2, Draw=1, Loss=0.
                        // In unweighted: Win=1, Draw=0.5, Loss=0.
                        // So if b1Res == b1Max -> Win.
                        // If b1Res == b1Max/2 -> Draw.
                        // Else Loss.

                        if (b1Res === b1Max) p1.wins += 1;
                        else if (b1Res === b1Max / 2) p1.draws += 1;
                        else p1.losses += 1;
                    }
                    if (p2) {
                        p2.matchesPlayed += 1;
                        p2.individualScore += b2Res;
                        if (b2Res === b2Max) p2.wins += 1;
                        else if (b2Res === b2Max / 2) p2.draws += 1;
                        else p2.losses += 1;
                    }
                }
            });
        });

        // Calculate Buchholz (Sum of opponents' team scores)
        // We need the updated scores first, which we have in teamsMap now.
        currentState.rounds.forEach(round => {
            round.matches.forEach(match => {
                if (match.teamBId === 'BYE') return;
                const teamA = teamsMap.get(match.teamAId);
                const teamB = teamsMap.get(match.teamBId);
                if (teamA && teamB) {
                    teamA.buchholz += teamB.teamScore;
                    teamB.buchholz += teamA.teamScore;
                }
            });
        });

        return {
            ...currentState,
            players: Array.from(playersMap.values()),
            teams: Array.from(teamsMap.values())
        };
    };

    const submitMatchResult = (matchId: string, result: MatchResult) => {
        setState(prev => {
            const newRounds = prev.rounds.map(r => ({
                ...r,
                matches: r.matches.map(m => m.id === matchId ? { ...m, result, isCompleted: true } : m)
            }));

            // Check if round is complete
            const currentRoundObj = newRounds.find(r => r.number === prev.currentRound);
            if (currentRoundObj) {
                currentRoundObj.isCompleted = currentRoundObj.matches.every(m => m.isCompleted);
            }

            const stateWithResults = { ...prev, rounds: newRounds };
            return updateStats(stateWithResults);
        });
    };

    const nextRound = () => {
        setState(prev => {
            // Check limits
            let maxRounds = Infinity;
            if (prev.mode === 'swiss' && prev.totalRounds) {
                maxRounds = prev.totalRounds;
            } else if (prev.mode === 'round_robin') {
                const n = prev.teams.filter(t => t.active).length;
                maxRounds = n % 2 === 0 ? n - 1 : n;
            }

            if (prev.currentRound >= maxRounds) {
                return { ...prev, status: 'completed' };
            }

            const nextRoundNum = prev.currentRound + 1;
            const newMatches = generateRound(nextRoundNum, prev.teams, prev.rounds, prev.mode);
            return {
                ...prev,
                currentRound: nextRoundNum,
                rounds: [...prev.rounds, { number: nextRoundNum, matches: newMatches, isCompleted: false }]
            };
        });
    };

    const resetTournament = () => {
        if (confirm("Are you sure? All data will be lost.")) {
            setState(INITIAL_STATE);
        }
    };

    const toggleWeightedFirstGame = () => {
        setState(prev => {
            const newState = { ...prev, weightedFirstGame: !prev.weightedFirstGame };
            return updateStats(newState);
        });
    };

    return (
        <TournamentContext.Provider value={{ state, addPlayer, removePlayer, createTeams, startTournament, nextRound, submitMatchResult, disbandTeam, resetTournament, toggleWeightedFirstGame }}>
            {children}
        </TournamentContext.Provider>
    );
}

export function useTournament() {
    const context = useContext(TournamentContext);
    if (context === undefined) {
        throw new Error('useTournament must be used within a TournamentProvider');
    }
    return context;
}
