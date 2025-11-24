import type { Team, Match, Round } from './types';

export function generateRound(roundNumber: number, teams: Team[], previousRounds: Round[]): Match[] {
    // Deep copy teams to avoid mutating state directly during sorting
    let sortedTeams = [...teams].filter(t => t.active);

    // Sort by Team Score (desc), then Buchholz (desc), then Random
    sortedTeams.sort((a, b) => {
        if (b.teamScore !== a.teamScore) return b.teamScore - a.teamScore;
        if (b.buchholz !== a.buchholz) return b.buchholz - a.buchholz;
        return Math.random() - 0.5;
    });

    const matches: Match[] = [];
    const paired = new Set<string>();
    const previousMatchups = new Set<string>();

    // Build a set of previous matchups to avoid repeats
    previousRounds.forEach(r => {
        r.matches.forEach(m => {
            previousMatchups.add(`${m.teamAId}-${m.teamBId}`);
            previousMatchups.add(`${m.teamBId}-${m.teamAId}`);
        });
    });

    // Simple Swiss Pairing (Top Half vs Bottom Half of score groups is ideal, but Neighbor pairing is easier for simple implementation)
    // We will use Neighbor pairing (1vs2, 3vs4) for simplicity in this MVP as it works well for small pools.

    // Handling odd number of teams -> Bye
    // (For now assuming even or handling bye simply)
    if (sortedTeams.length % 2 !== 0) {
        // The lowest ranked player who hasn't had a bye gets it. 
        // For MVP, just pick the last one.
        const byeTeam = sortedTeams.pop();
        if (byeTeam) {
            // In a real app, we'd record the Bye. For now, we just leave them out of the matches array 
            // or create a "Bye" match. Let's create a Bye match for tracking.
            matches.push({
                id: crypto.randomUUID(),
                round: roundNumber,
                teamAId: byeTeam.id,
                teamBId: 'BYE',
                isCompleted: true,
                result: { board1: 1, board2: 1 }, // Automatic win (2 points)
                tableNumber: 0
            });
            paired.add(byeTeam.id);
        }
    }

    for (let i = 0; i < sortedTeams.length; i++) {
        if (paired.has(sortedTeams[i].id)) continue;

        const teamA = sortedTeams[i];
        let teamB = null;

        // Find first unpaired opponent
        for (let j = i + 1; j < sortedTeams.length; j++) {
            const potentialOpponent = sortedTeams[j];
            if (!paired.has(potentialOpponent.id)) {
                // Check if played before (Soft constraint for MVP, skip if possible)
                if (!previousMatchups.has(`${teamA.id}-${potentialOpponent.id}`)) {
                    teamB = potentialOpponent;
                    break;
                }
            }
        }

        // Fallback: if everyone remaining has played each other, just pick the next available
        if (!teamB) {
            for (let j = i + 1; j < sortedTeams.length; j++) {
                if (!paired.has(sortedTeams[j].id)) {
                    teamB = sortedTeams[j];
                    break;
                }
            }
        }

        if (teamB) {
            matches.push({
                id: crypto.randomUUID(),
                round: roundNumber,
                teamAId: teamA.id,
                teamBId: teamB.id,
                isCompleted: false,
                tableNumber: matches.length + 1
            });
            paired.add(teamA.id);
            paired.add(teamB.id);
        }
    }

    return matches;
}
