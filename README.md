# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/b1964521-24f7-4c19-ab5f-4c187e46307f

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/b1964521-24f7-4c19-ab5f-4c187e46307f) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Configure Supabase (REQUIRED!)
# Create a .env file in the project root:
cat > .env << EOF
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
EOF
# Replace with your actual Supabase credentials from https://supabase.com/dashboard

# Step 5: Run the SQL migration in Supabase
# Go to your Supabase project -> SQL Editor -> paste contents of supabase/migrations/0001_players_rls.sql

# Step 6: Start the development server with auto-reloading and an instant preview.
npm run dev
```

### ⚠️ Important: Supabase Configuration

This project requires Supabase to work. Without proper configuration, the leaderboard and authentication won't work.

See `README_DEV.md` for detailed architecture and setup instructions.

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/b1964521-24f7-4c19-ab5f-4c187e46307f) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
