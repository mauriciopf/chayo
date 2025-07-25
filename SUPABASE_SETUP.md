# Database Setup Instructions

## Setting up the Supabase Database

1. **Access your Supabase project dashboard** at https://app.supabase.com
2. **Navigate to the SQL Editor** (in the left sidebar)
3. **Create a new query** and paste the contents of `supabase/schema.sql`
4. **Run the query** to create the tables and policies

## What this creates:

### Tables:
- `agents` - Stores AI agents created by users
- `user_subscriptions` - Stores Stripe subscription information

### Security:
- Row Level Security (RLS) policies ensure users can only access their own data
- Proper foreign key constraints and indexes for performance

### Triggers:
- Automatic `updated_at` timestamp updates

## Testing the Setup:

1. Start your Next.js development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000/dashboard`

3. Try creating a new agent through the modal

4. Check the Supabase dashboard to confirm the agent was created in the database

## Environment Variables:

Make sure your `.env.local` file has the correct Supabase credentials:

```bash
NEXT_PUBLIC_NEXT_PUBLIC_SUPABASE_URL=your_NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_NEXT_PUBLIC_SUPABASE_ANON_KEY=your_NEXT_PUBLIC_SUPABASE_ANON_KEY
```

## API Endpoints:

- `POST /api/agents` - Create new agent
- `GET /api/agents` - Fetch user's agents
- `PUT /api/agents/[id]` - Update agent
- `DELETE /api/agents/[id]` - Delete agent

All endpoints are protected and require user authentication.
