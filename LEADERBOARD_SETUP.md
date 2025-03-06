# Cosmic Monads Leaderboard Setup

This document provides instructions for setting up Supabase as the backend for the Cosmic Monads leaderboard system.

## Setting Up Supabase

1. **Create a Supabase Account**
   - Go to [Supabase](https://supabase.io)
   - Sign up for a free account

2. **Create a New Project**
   - Click "New Project"
   - Enter a name for your project (e.g., "cosmic-monads")
   - Set a secure database password
   - Choose a region closest to your users
   - Click "Create New Project"

3. **Create the Leaderboard Table**
   - In the Supabase dashboard, go to "Table Editor"
   - Click "Create a new table"
   - Set the table name to `leaderboard`
   - Add the following columns:
     - `id` (type: uuid, Primary Key, Default: `uuid_generate_v4()`)
     - `username` (type: text, Unique)
     - `score` (type: int8)
     - `created_at` (type: timestamptz, Default: `now()`)
   - Click "Save"

4. **Set Up Row Level Security (RLS)**
   - Go to "Authentication" > "Policies"
   - Find your `leaderboard` table
   - Click "Add Policies"
   - Enable read access for anyone:
     - Policy name: "Enable read access for all users"
     - Target roles: Leave blank for public access
     - Using expression: `true`
     - Policy definition: Use the "Select" template
   - Enable write access for authenticated users:
     - Policy name: "Enable insert for authenticated users"
     - Target roles: `authenticated`
     - Using expression: `auth.uid() IS NOT NULL`
     - Policy definition: Use the "Insert" template

5. **Get Your API Keys**
   - Go to "Settings" > "API"
   - Find your "URL" and "anon" public key
   - You'll need these to update the leaderboard.js file

## Updating the Leaderboard Configuration

1. Open `leaderboard.js` in your code editor
2. Replace the placeholder values with your Supabase credentials:

```javascript
// Supabase client setup
this.supabaseUrl = 'YOUR_SUPABASE_URL'; // Replace with your Supabase URL
this.supabaseKey = 'YOUR_SUPABASE_ANON_KEY'; // Replace with your anon key
```

3. Set `this.useDemoData = false;` to use the actual Supabase backend instead of demo data

## Testing the Leaderboard

1. After making these changes, play the game and enter a username
2. Check the leaderboard to see if your score appears
3. Verify in the Supabase dashboard that your score was recorded in the database

## Using the Leaderboard in Production

For production use, make sure to:

1. Set up proper authentication if you want to prevent score manipulation
2. Consider adding additional fields like game version, player ID, etc.
3. Add additional validation on the server side to prevent cheating

## Troubleshooting

If you encounter issues:

1. Check the browser console for errors
2. Verify your Supabase credentials are correct
3. Make sure the database table has the correct columns and RLS policies
4. Test basic CRUD operations directly from the Supabase dashboard 