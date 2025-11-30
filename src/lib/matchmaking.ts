import type { Team, Match, Round } from './types';

export function generateRound(roundNumber: number, teams: Team[], previousRounds: Round[], mode: 'swiss' | 'round_robin' = 'swiss'): Match[] {
    if (mode === 'round_robin') {
        return generateRoundRobin(roundNumber, teams);
    } else {
        return generateSwissRound(roundNumber, teams, previousRounds);
    }
}

function generateRoundRobin(roundNumber: number, teams: Team[]): Match[] {
    // Stable sort to ensure consistent indices
    const sortedTeams = [...teams].filter(t => t.active).sort((a, b) => a.id.localeCompare(b.id));

    if (sortedTeams.length % 2 !== 0) {
        // Add a dummy team for Bye logic if needed, or just handle odd count
        // For simplicity, let's treat the "Bye" as a virtual team if we want to show it,
        // or just skip the pairing.
        // The user wants to see the Bye usually.
        // Let's add a placeholder for the algorithm
        // But we can't easily add a "fake" team that matches the Team interface without clutter.
        // Let's just use indices.
    }

    const n = sortedTeams.length;
    const isOdd = n % 2 !== 0;

    // Indices 0 to totalSlots - 1
    // If isOdd, the last slot is the "Bye" slot.

    const matches: Match[] = [];

    // Berger table / Circle method
    // Fixed position: 0
    // Rotating positions: 1 .. totalSlots - 1

    // For round r (1-based):
    // Shift amount = r - 1

    // Map current positions to original indices
    // Position 0 is always index 0 (if not odd? If odd, index 0 is just a team)
    // Actually, let's just use the standard algorithm:
    // Array of team indices: [0, 1, 2, ..., n-1] (plus a -1 for bye if odd)

    let indices = sortedTeams.map((_, i) => i);
    if (isOdd) indices.push(-1); // -1 represents Bye

    const numTeams = indices.length; // Now even
    const numRounds = numTeams - 1;

    // If roundNumber > numRounds, we cycle or stop? 
    // Usually Round Robin is 1 set of rounds. Double Round Robin is 2 sets.
    // Let's assume single Round Robin for now.
    // If roundNumber > numRounds, we return empty or cycle?
    // Let's cycle for "infinite" play if requested, but standard is stop.
    // But the context allows "nextRound" indefinitely.
    // Let's wrap around: (roundNumber - 1) % numRounds + 1

    const effectiveRound = (roundNumber - 1) % numRounds;

    // Rotate indices for the current round
    // We keep index 0 fixed, and rotate the rest (1..end)
    // Rotation amount = effectiveRound

    const movingIndices = indices.slice(1);
    // Rotate right by effectiveRound? Or left?
    // Standard: Rotate clockwise (right)
    // [1, 2, 3] -> shift 1 -> [3, 1, 2]

    for (let k = 0; k < effectiveRound; k++) {
        const last = movingIndices.pop();
        if (last !== undefined) movingIndices.unshift(last);
    }

    const currentIndices = [indices[0], ...movingIndices];

    // Pair: (0, N-1), (1, N-2), ...
    const half = numTeams / 2;
    for (let i = 0; i < half; i++) {
        const idx1 = currentIndices[i];
        const idx2 = currentIndices[numTeams - 1 - i];

        // If either is -1, it's a Bye
        if (idx1 === -1 || idx2 === -1) {
            const teamIdx = idx1 === -1 ? idx2 : idx1;
            const team = sortedTeams[teamIdx];
            matches.push({
                id: crypto.randomUUID(),
                round: roundNumber,
                teamAId: team.id,
                teamBId: 'BYE',
                isCompleted: true,
                result: { board1: 1, board2: 1 },
                tableNumber: 0
            });
        } else {
            const team1 = sortedTeams[idx1];
            const team2 = sortedTeams[idx2];
            matches.push({
                id: crypto.randomUUID(),
                round: roundNumber,
                teamAId: team1.id,
                teamBId: team2.id,
                isCompleted: false,
                tableNumber: matches.length + 1
            });
        }
    }

    return matches;
}

function generateSwissRound(roundNumber: number, teams: Team[], previousRounds: Round[]): Match[] {
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
    if (sortedTeams.length % 2 !== 0) {
        // The lowest ranked player who hasn't had a bye gets it. 
        // For MVP, just pick the last one.
        const byeTeam = sortedTeams.pop();
        if (byeTeam) {
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
