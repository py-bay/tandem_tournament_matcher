import { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import clsx from 'clsx';
import { Trophy, User } from 'lucide-react';

export function StandingsTable() {
    const { state } = useTournament();
    const [activeTab, setActiveTab] = useState<'teams' | 'players'>('teams');

    // Sort Teams
    const sortedTeams = [...state.teams].sort((a, b) => {
        if (b.matchPoints !== a.matchPoints) return b.matchPoints - a.matchPoints;
        if (b.teamScore !== a.teamScore) return b.teamScore - a.teamScore; // Game points
        return b.buchholz - a.buchholz;
    });

    // Sort Players
    const sortedPlayers = [...state.players].sort((a, b) => {
        if (b.individualScore !== a.individualScore) return b.individualScore - a.individualScore;
        return b.wins - a.wins;
    });

    return (
        <div className="card p-0 overflow-hidden">
            <div className="flex border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('teams')}
                    className={clsx(
                        "flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors",
                        activeTab === 'teams' ? "bg-white text-blue-600 border-b-2 border-blue-600" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                    )}
                >
                    <Trophy className="w-4 h-4" />
                    Team Standings
                </button>
                <button
                    onClick={() => setActiveTab('players')}
                    className={clsx(
                        "flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors",
                        activeTab === 'players' ? "bg-white text-blue-600 border-b-2 border-blue-600" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                    )}
                >
                    <User className="w-4 h-4" />
                    Player Stats
                </button>
                <button
                    onClick={() => {
                        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
                        const downloadAnchorNode = document.createElement('a');
                        downloadAnchorNode.setAttribute("href", dataStr);
                        downloadAnchorNode.setAttribute("download", "tournament_export.json");
                        document.body.appendChild(downloadAnchorNode); // required for firefox
                        downloadAnchorNode.click();
                        downloadAnchorNode.remove();
                    }}
                    className="px-4 py-3 text-sm font-medium bg-slate-50 text-slate-600 hover:bg-slate-100 border-l border-slate-200 transition-colors"
                    title="Export JSON"
                >
                    Export
                </button>
            </div>

            <div className="overflow-x-auto">
                {activeTab === 'teams' ? (
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3 w-12">#</th>
                                <th className="px-4 py-3">Team</th>
                                <th className="px-4 py-3 text-right">MP</th>
                                <th className="px-4 py-3 text-right">Pts</th>
                                <th className="px-4 py-3 text-right hidden sm:table-cell">BH</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {sortedTeams.map((team, index) => (
                                <tr key={team.id} className="hover:bg-slate-50/50">
                                    <td className="px-4 py-3 text-slate-400 font-mono">{index + 1}</td>
                                    <td className="px-4 py-3 font-medium text-slate-800">{team.name}</td>
                                    <td className="px-4 py-3 text-right font-bold text-slate-800">{team.matchPoints}</td>
                                    <td className="px-4 py-3 text-right text-slate-600">{team.teamScore}</td>
                                    <td className="px-4 py-3 text-right text-slate-400 hidden sm:table-cell">{team.buchholz}</td>
                                </tr>
                            ))}
                            {sortedTeams.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic">No teams yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                ) : (
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3 w-12">#</th>
                                <th className="px-4 py-3">Player</th>
                                <th className="px-4 py-3 text-right">Pts</th>
                                <th className="px-4 py-3 text-right">W/D/L</th>
                                <th className="px-4 py-3 text-right hidden sm:table-cell">%</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {sortedPlayers.map((player, index) => (
                                <tr key={player.id} className="hover:bg-slate-50/50">
                                    <td className="px-4 py-3 text-slate-400 font-mono">{index + 1}</td>
                                    <td className="px-4 py-3 font-medium text-slate-800">{player.name}</td>
                                    <td className="px-4 py-3 text-right font-bold text-slate-800">{player.individualScore}</td>
                                    <td className="px-4 py-3 text-right text-slate-600 font-mono text-xs">
                                        {player.wins}/{player.draws}/{player.losses}
                                    </td>
                                    <td className="px-4 py-3 text-right text-slate-400 hidden sm:table-cell">
                                        {player.matchesPlayed > 0 ? Math.round((player.individualScore / player.matchesPlayed) * 100) : 0}%
                                    </td>
                                </tr>
                            ))}
                            {sortedPlayers.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic">No players yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
