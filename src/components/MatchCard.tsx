import { useState } from 'react';
import type { Match, Team } from '../lib/types';
import { useTournament } from '../context/TournamentContext';
import { Check, Edit2 } from 'lucide-react';
import clsx from 'clsx';

interface MatchCardProps {
    match: Match;
    teamA: Team;
    teamB: Team;
}

export function MatchCard({ match, teamA, teamB }: MatchCardProps) {
    const { state, submitMatchResult } = useTournament();
    const [isEditing, setIsEditing] = useState(!match.isCompleted);

    // Local state for inputs before submitting
    // Moved state initialization below the early return to avoid hook errors if conditional (though hooks should be top level, 
    // but here the early return is for a different view mode. 
    // Actually, React Hooks MUST be called in the same order. 
    // Putting them after an early return is a violation of Rules of Hooks if the return condition changes.
    // `match.isCompleted` and `isEditing` can change.
    // So we MUST move the hooks to the top.

    // Correct approach: Move the hooks to the top, but use the logic inside the initializer.

    const [board1, setBoard1] = useState<number>(() => {
        const val = match.result?.board1 ?? 0.5;
        return val > 1 ? val / 2 : val;
    });
    const [board2, setBoard2] = useState<number>(() => {
        const val = match.result?.board2 ?? 0.5;
        return val > 1 ? val / 2 : val;
    });

    const [firstBoard, setFirstBoard] = useState<'board1' | 'board2'>(() => {
        if (!state.weightedFirstGame) return 'board1';
        if ((match.result?.board1 || 0) > 1) return 'board1';
        if ((match.result?.board2 || 0) > 1) return 'board2';
        return 'board1';
    });

    const getPlayerName = (id: string) => state.players.find(p => p.id === id)?.name || 'Unknown';

    const teamAPlayer1 = getPlayerName(teamA.player1Id);
    const teamAPlayer2 = getPlayerName(teamA.player2Id);
    const teamBPlayer1 = teamB.id === 'BYE' ? 'BYE' : getPlayerName(teamB.player1Id);
    const teamBPlayer2 = teamB.id === 'BYE' ? 'BYE' : getPlayerName(teamB.player2Id);

    // If match is completed, show static view unless editing
    if (match.isCompleted && !isEditing) {
        const scoreA = (match.result?.board1 || 0) + (match.result?.board2 || 0);
        // Total possible points are 3 if weighted (2+1) or 2 if not (1+1)
        const scoreB = (state.weightedFirstGame ? 3 : 2) - scoreA;

        // Determine which board was weighted for display purposes
        const isBoard1Weighted = state.weightedFirstGame && (match.result?.board1 || 0) > 1;
        const isBoard2Weighted = state.weightedFirstGame && (match.result?.board2 || 0) > 1;

        // Calculate individual board scores for display
        const b1ScoreA = match.result?.board1 || 0;
        const b2ScoreA = match.result?.board2 || 0;
        const b1ScoreB = (isBoard1Weighted ? 2 : 1) - b1ScoreA;
        const b2ScoreB = (isBoard2Weighted ? 2 : 1) - b2ScoreA;

        return (
            <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-4 shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <div className="font-semibold text-slate-800">{teamA.name}</div>
                        <div className="text-sm text-slate-500">Table {match.tableNumber}</div>
                    </div>
                    <div className="px-6 font-bold text-xl text-slate-800 flex items-center gap-2">
                        <span>{scoreA}</span>
                        <span className="text-slate-300">-</span>
                        <span>{scoreB}</span>
                    </div>
                    <div className="flex-1 text-right">
                        <div className="font-semibold text-slate-800">{teamB.name}</div>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="text-xs text-blue-500 hover:underline mt-1 inline-flex items-center gap-1"
                        >
                            <Edit2 className="w-3 h-3" /> Edit
                        </button>
                    </div>
                </div>

                {/* Detailed Results View */}
                <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded border border-slate-100 grid grid-cols-3 gap-2 text-center">
                    <div className="text-right truncate">{teamAPlayer1}</div>
                    <div className="font-mono text-slate-700">
                        {b1ScoreA} - {b1ScoreB}
                    </div>
                    <div className="text-left truncate">{teamBPlayer1}</div>

                    <div className="text-right truncate">{teamAPlayer2}</div>
                    <div className="font-mono text-slate-700">
                        {b2ScoreA} - {b2ScoreB}
                    </div>
                    <div className="text-left truncate">{teamBPlayer2}</div>
                </div>
            </div>
        );
    }

    // State declarations moved to top


    const handleSubmit = () => {
        let finalB1 = board1;
        let finalB2 = board2;

        if (state.weightedFirstGame) {
            if (firstBoard === 'board1') {
                finalB1 *= 2;
            } else {
                finalB2 *= 2;
            }
        }

        submitMatchResult(match.id, { board1: finalB1, board2: finalB2 });
        setIsEditing(false);
    };

    const ScoreButton = ({ value, current, onChange, label }: { value: number, current: number, onChange: (v: number) => void, label: string }) => (
        <button
            onClick={() => onChange(value)}
            className={clsx(
                "px-3 py-1 text-xs font-medium rounded border transition-colors",
                current === value
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
            )}
        >
            {label}
        </button>
    );

    return (
        <div className="bg-white border border-blue-200 ring-1 ring-blue-100 rounded-lg p-4 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="font-semibold text-slate-800">{teamA.name}</span>
                <span className="text-xs text-slate-400 font-mono">VS</span>
                <span className="font-semibold text-slate-800">{teamB.name}</span>
            </div>

            {state.weightedFirstGame && (
                <div className="bg-blue-50 p-2 rounded-lg border border-blue-100">
                    <span className="text-xs font-medium text-blue-800 block mb-1">Which game finished first? (2 pts)</span>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                                type="radio"
                                name={`firstBoard-${match.id}`}
                                checked={firstBoard === 'board1'}
                                onChange={() => setFirstBoard('board1')}
                                className="text-blue-600 focus:ring-blue-500"
                            />
                            Board 1
                        </label>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                                type="radio"
                                name={`firstBoard-${match.id}`}
                                checked={firstBoard === 'board2'}
                                onChange={() => setFirstBoard('board2')}
                                className="text-blue-600 focus:ring-blue-500"
                            />
                            Board 2
                        </label>
                    </div>
                </div>
            )}

            <div className="space-y-3">
                {/* Board 1 */}
                <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs text-slate-500">
                        <span>{teamAPlayer1}</span>
                        <span className="uppercase font-medium">
                            Board 1 {state.weightedFirstGame && firstBoard === 'board1' ? '(x2)' : '(x1)'}
                        </span>
                        <span>{teamBPlayer1}</span>
                    </div>
                    <div className="flex items-center justify-center gap-1">
                        <ScoreButton value={1} current={board1} onChange={setBoard1} label="1-0" />
                        <ScoreButton value={0.5} current={board1} onChange={setBoard1} label="½-½" />
                        <ScoreButton value={0} current={board1} onChange={setBoard1} label="0-1" />
                    </div>
                </div>

                {/* Board 2 */}
                <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs text-slate-500">
                        <span>{teamAPlayer2}</span>
                        <span className="uppercase font-medium">
                            Board 2 {state.weightedFirstGame && firstBoard === 'board2' ? '(x2)' : '(x1)'}
                        </span>
                        <span>{teamBPlayer2}</span>
                    </div>
                    <div className="flex items-center justify-center gap-1">
                        <ScoreButton value={1} current={board2} onChange={setBoard2} label="1-0" />
                        <ScoreButton value={0.5} current={board2} onChange={setBoard2} label="½-½" />
                        <ScoreButton value={0} current={board2} onChange={setBoard2} label="0-1" />
                    </div>
                </div>
            </div>

            <button
                onClick={handleSubmit}
                className="w-full btn btn-primary justify-center text-sm py-1.5 mt-2"
            >
                <Check className="w-4 h-4" />
                Save Result
            </button>
        </div>
    );
}
