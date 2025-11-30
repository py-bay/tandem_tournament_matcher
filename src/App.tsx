import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TournamentProvider, useTournament } from './context/TournamentContext';
import { Layout } from './components/Layout';
import { SetupForm } from './components/SetupForm';
import { TeamBuilder } from './components/TeamBuilder';
import { MatchCard } from './components/MatchCard';
import { StandingsTable } from './components/StandingsTable';
import { Trophy, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

function SetupPage() {
  const { state } = useTournament();

  if (state.status === 'active' || state.status === 'completed') {
    return (
      <div className="space-y-6">
        <div className={clsx(
          "border rounded-lg p-4 flex items-start gap-3",
          state.status === 'active' ? "bg-blue-50 border-blue-200" : "bg-green-50 border-green-200"
        )}>
          {state.status === 'active' ? (
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          ) : (
            <Trophy className="w-5 h-5 text-green-600 mt-0.5" />
          )}
          <div>
            <h3 className={clsx("font-semibold", state.status === 'active' ? "text-blue-900" : "text-green-900")}>
              {state.status === 'active' ? 'Tournament in Progress' : 'Tournament Completed'}
            </h3>
            <p className={clsx("text-sm mt-1", state.status === 'active' ? "text-blue-700" : "text-green-700")}>
              {state.status === 'active'
                ? 'The tournament is currently active. You cannot add players or change teams without resetting.'
                : 'The tournament has finished. Reset to start a new one.'}
            </p>
          </div>
        </div>
        <StandingsTable />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Tandem Tournament Setup</h1>
        <p className="text-slate-500">Register players and form teams to begin.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-8">
        <SetupForm />
        <TeamBuilder />
      </div>
    </div>
  );
}

function TournamentPage() {
  const { state, nextRound } = useTournament();
  const currentRound = state.rounds.find(r => r.number === state.currentRound);

  if (state.status === 'setup') {
    return (
      <div className="text-center py-12">
        <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-8 h-8 text-slate-400" />
        </div>
        <h2 className="text-xl font-semibold text-slate-800">Tournament Not Started</h2>
        <p className="text-slate-500 mt-2 mb-6">Complete the setup to begin matches.</p>
        <a href="/" className="btn btn-primary inline-flex">Go to Setup</a>
      </div>
    );
  }

  if (state.status === 'completed') {
    return (
      <div className="space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
          <Trophy className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-green-900 mb-2">Tournament Completed!</h2>
          <p className="text-green-700 text-lg">Congratulations to the winners!</p>
        </div>
        <StandingsTable />
      </div>
    );
  }

  if (!currentRound) return null;

  const allCompleted = currentRound.matches.every(m => m.isCompleted);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Round {state.currentRound}</h2>
        {allCompleted && (
          <button onClick={nextRound} className="btn btn-primary">
            Next Round
          </button>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {currentRound.matches.map(match => {
          const teamA = state.teams.find(t => t.id === match.teamAId);
          const teamB = state.teams.find(t => t.id === match.teamBId) || { id: 'BYE', name: 'BYE', player1Id: '', player2Id: '', teamScore: 0, matchPoints: 0, buchholz: 0, matchesPlayed: 0, active: false };

          if (!teamA) return null;

          return (
            <MatchCard
              key={match.id}
              match={match}
              teamA={teamA}
              teamB={teamB}
            />
          );
        })}
      </div>

      {currentRound.matches.length === 0 && (
        <p className="text-center text-slate-500 italic">No matches in this round.</p>
      )}
    </div>
  );
}

function StandingsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Standings</h2>
      <StandingsTable />
    </div>
  );
}

export default function App() {
  return (
    <TournamentProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<SetupPage />} />
            <Route path="/tournament" element={<TournamentPage />} />
            <Route path="/standings" element={<StandingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TournamentProvider>
  );
}
