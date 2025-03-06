# Cosmic Monads Supabase Leaderboard Configuration

This document details how the Cosmic Monads leaderboard is configured in Supabase.

## Supabase Project

The leaderboard uses Supabase for persistent storage across all players. This allows players to see their ranking compared to others, even if they switch devices or usernames.

## Leaderboard Table Schema

The `leaderboard` table has the following structure:

| Column       | Type           | Description                              |
|--------------|----------------|------------------------------------------|
| id           | UUID           | Primary key, auto-generated with uuid_v4 |
| username     | TEXT           | Player's chosen name (unique)            |
| score        | INT8           | Player's high score                      |
| created_at   | TIMESTAMPTZ    | When the record was first created        |
| updated_at   | TIMESTAMPTZ    | When the record was last updated         |

## Row-Level Security (RLS) Policies

The following RLS policies are applied to the leaderboard table:

### SELECT policy (Read)
- Policy name: `Enable read access for everyone`
- Target roles: (none) - Available to all users
- Using expression: `true`
- Allows anyone to view the leaderboard

### INSERT/UPDATE policy (Write)
- Policy name: `Enable insert/update for authenticated and anonymous users`
- Target roles: (none) - Available to all users
- Using expression: `true`
- Additional check: Upsert operation will only update scores if the new score is higher than the existing one

## API Configuration

The Supabase client is configured in `leaderboard.js` with the following settings:

```javascript
this.supabaseUrl = 'https://mqkqztkqzekpsyajvxlc.supabase.co';
this.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xa3F6dGtxemVrcHN5YWp2eGxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTk5NzkyMzcsImV4cCI6MjAxNTU1NTIzN30.FpQfE3XmC0MJnshekrSBz2Y2Z5l_ZyRIFKXhm0HtD-8';
```

## Leaderboard Behavior

The leaderboard implements the following features:

1. **Persistent High Scores**: Each player's highest score is saved by username
2. **Top 10 Display**: The leaderboard shows the top 10 players by score
3. **Current Player Highlighting**: The current player's score is highlighted
4. **Current Player Visibility**: If the current player isn't in the top 10, their position is shown at the bottom
5. **Real-time Updates**: Scores are updated in real-time as the game is played
6. **Automatic Refresh**: The leaderboard refreshes periodically to show new scores from other players

## Backup Behavior

If Supabase is unavailable or encounters errors, the leaderboard falls back to local demo data to ensure players still have a functioning leaderboard experience.

## Customization

To modify the leaderboard appearance or behavior:

1. Visual styling can be adjusted in `index.html` in the CSS section
2. Leaderboard behavior can be modified in `leaderboard.js`
3. Database schema can be adjusted in the Supabase dashboard

## Troubleshooting

If the leaderboard isn't functioning correctly:

1. Check browser console for errors
2. Verify Supabase credentials are correct
3. Ensure the `leaderboard` table exists with the correct schema
4. Confirm RLS policies are properly configured

The leaderboard system is designed to be resilient, with graceful fallbacks if any component fails. 