import { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { Users, Play, Trash2 } from 'lucide-react';
import clsx from 'clsx';

export function TeamBuilder() {
    const { state, createTeams, disbandTeam, startTournament, toggleWeightedFirstGame } = useTournament();
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const [mode, setMode] = useState<'swiss' | 'round_robin'>('swiss');
    const [rounds, setRounds] = useState<number>(5);

    // Filter players who are already in a team
    const teamedPlayerIds = new Set(state.teams.flatMap(t => [t.player1Id, t.player2Id]));
    const availablePlayers = state.players.filter(p => !teamedPlayerIds.has(p.id));

    const toggleSelection = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(prev => prev.filter(pid => pid !== id));
        } else {
            if (selectedIds.length < 2) {
                setSelectedIds(prev => [...prev, id]);
            }
        }
    };

    const handleCreateTeam = () => {
        if (selectedIds.length === 2) {
            createTeams([[selectedIds[0], selectedIds[1]]]);
            setSelectedIds([]);
        }
    };

    const handleStart = () => {
        startTournament(mode, mode === 'swiss' ? rounds : undefined);
    };

    return (
        <div className="card space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-slate-800">2. Build Teams</h2>
                <p className="text-slate-500 text-sm">Select two players to form a team.</p>
            </div>

            {/* Available Players */}
            <div className="space-y-2">
                <h3 className="text-sm font-medium text-slate-700">Available Players ({availablePlayers.length})</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {availablePlayers.length === 0 && state.players.length > 0 && (
                        <p className="text-slate-400 text-sm italic col-span-full">All players assigned to teams.</p>
                    )}
                    {availablePlayers.length === 0 && state.players.length === 0 && (
                        <p className="text-slate-400 text-sm italic col-span-full">Add players above first.</p>
                    )}

                    {availablePlayers.map(player => (
                        <button
                            key={player.id}
                            onClick={() => toggleSelection(player.id)}
                            className={clsx(
                                "px-3 py-2 rounded-lg text-sm font-medium border transition-all text-left flex items-center justify-between",
                                selectedIds.includes(player.id)
                                    ? "bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500"
                                    : "bg-white border-slate-200 text-slate-700 hover:border-blue-300"
                            )}
                        >
                            <span className="truncate">{player.name}</span>
                            {selectedIds.includes(player.id) && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                        </button>
                    ))}
                </div>
            </div>

            {/* Action Area */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <div className="text-sm text-slate-500">
                    {selectedIds.length === 2 ? (
                        <div className="flex items-center gap-2">
                            <span className="text-blue-600 font-medium">Ready!</span>
                            <span className="text-xs text-slate-400">
                                {state.players.find(p => p.id === selectedIds[0])?.name} (B1) & {state.players.find(p => p.id === selectedIds[1])?.name} (B2)
                            </span>
                            <button
                                onClick={() => setSelectedIds(prev => [prev[1], prev[0]])}
                                className="text-xs text-blue-500 hover:underline"
                                title="Swap Board 1/2"
                            >
                                (Swap)
                            </button>
                        </div>
                    ) : (
                        <span>Select {2 - selectedIds.length} more player{selectedIds.length !== 1 && 's'}</span>
                    )}
                </div>
                <button
                    onClick={handleCreateTeam}
                    disabled={selectedIds.length !== 2}
                    className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Users className="w-4 h-4" />
                    Create Team
                </button>
            </div>

            {/* Teams List */}
            <div className="space-y-2">
                <h3 className="text-sm font-medium text-slate-700">Teams ({state.teams.length})</h3>
                <div className="space-y-2">
                    {state.teams.length === 0 && (
                        <p className="text-slate-400 text-sm italic">No teams created yet.</p>
                    )}
                    {state.teams.map(team => (
                        <div key={team.id} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
                            <div className="flex items-center gap-3">
                                <div className="bg-white p-2 rounded-full border border-slate-200">
                                    <Users className="w-4 h-4 text-slate-400" />
                                </div>
                                <div>
                                    <div className="font-medium text-slate-800">{team.name}</div>
                                    <div className="text-xs text-slate-500">
                                        {state.players.find(p => p.id === team.player1Id)?.name} & {state.players.find(p => p.id === team.player2Id)?.name}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => disbandTeam(team.id)}
                                className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                title="Disband Team"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tournament Settings */}
            <div className="space-y-4 pt-4 border-t border-slate-200">
                <h3 className="text-sm font-medium text-slate-700">Tournament Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Mode</label>
                        <select
                            value={mode}
                            onChange={(e) => setMode(e.target.value as 'swiss' | 'round_robin')}
                            className="w-full rounded-lg border-slate-200 text-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="swiss">Swiss System</option>
                            <option value="round_robin">Round Robin (Each vs Each)</option>
                        </select>
                    </div>
                    {mode === 'swiss' && (
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Number of Rounds</label>
                            <input
                                type="number"
                                min={1}
                                max={20}
                                value={rounds}
                                onChange={(e) => setRounds(parseInt(e.target.value) || 1)}
                                className="w-full rounded-lg border-slate-200 text-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    )}
                    <div className="col-span-full pt-2">
                        <label className="flex items-start gap-3 p-3 border rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                            <input
                                type="checkbox"
                                checked={state.weightedFirstGame || false}
                                onChange={toggleWeightedFirstGame}
                                className="mt-1 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div>
                                <span className="block text-sm font-medium text-slate-700">Weighted Board 1</span>
                                <span className="block text-xs text-slate-500 mt-0.5">
                                    Board 1 win awards 2 points, Board 2 awards 1 point. (Results: 3:0, 2:1, etc.)
                                </span>
                            </div>
                        </label>
                    </div>
                </div>
            </div>

            {/* Start Tournament */}
            <div className="pt-6 border-t border-slate-200">
                <button
                    onClick={handleStart}
                    disabled={state.teams.length < 2}
                    className="w-full btn btn-primary justify-center py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Play className="w-5 h-5" />
                    Start Tournament
                </button>
                {state.teams.length < 2 && (
                    <p className="text-center text-xs text-slate-400 mt-2">Need at least 2 teams to start.</p>
                )}
            </div>
        </div >
    );
}
