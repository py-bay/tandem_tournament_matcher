import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { UserPlus, X } from 'lucide-react';

export function SetupForm() {
    const { state, addPlayer, removePlayer } = useTournament();
    const [name, setName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            addPlayer(name.trim());
            setName('');
        }
    };

    return (
        <div className="card space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-slate-800">1. Register Players</h2>
                <p className="text-slate-500 text-sm">Add all participants to the pool.</p>
            </div>

            <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter player name..."
                    className="input flex-1"
                    autoFocus
                />
                <button type="submit" className="btn btn-primary" disabled={!name.trim()}>
                    <UserPlus className="w-4 h-4" />
                    Add
                </button>
            </form>

            <div className="flex flex-wrap gap-2">
                {state.players.length === 0 && (
                    <p className="text-slate-400 text-sm italic w-full text-center py-4">No players added yet.</p>
                )}
                {state.players.map(player => (
                    <div key={player.id} className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 group">
                        {player.name}
                        <button
                            onClick={() => removePlayer(player.id)}
                            className="text-slate-400 hover:text-red-500 transition-colors"
                            aria-label="Remove player"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
