#!/bin/bash

# Cosmic Monads Netlify Deployment Script

echo "=== Cosmic Monads Netlify Deployment ==="
echo ""

# Check if there are uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "There are uncommitted changes. Would you like to commit them? (y/n)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo "Enter commit message:"
        read -r commit_message
        git add .
        git commit -m "$commit_message"
        echo "Changes committed."
    else
        echo "Continuing without committing changes."
    fi
fi

# Check if we need to push to GitHub
local_commit=$(git rev-parse HEAD)
remote_commit=$(git rev-parse origin/main 2>/dev/null || echo "no-remote")

if [ "$local_commit" != "$remote_commit" ]; then
    echo "Local and remote repositories are different. Push to GitHub? (y/n)"
    read -r push_response
    if [[ "$push_response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        git push origin main
        echo "Changes pushed to GitHub."
    else
        echo "Continuing without pushing changes."
    fi
fi

# Update config for production (uncomment production URL)
echo "Preparing configuration for production..."
sed -i.bak 's/window.PRODUCTION_API_URL = isLocalhost ? null : getBaseUrl();/window.PRODUCTION_API_URL = getBaseUrl();/' config.js

# Ensure we have the netlify CLI
if ! command -v netlify &> /dev/null; then
    echo "Installing Netlify CLI..."
    npm install -g netlify-cli
fi

# Check if we're logged in to Netlify
echo "Checking Netlify login status..."
netlify status

# Link to existing site if not already linked
if [ ! -d ".netlify" ]; then
    echo "Linking to Netlify site..."
    netlify link --name cosmicmonads
fi

# Deploy to Netlify
echo "Deploying to Netlify..."
netlify deploy --prod

# Restore the configuration for local development
echo "Restoring configuration for local development..."
mv config.js.bak config.js

echo ""
echo "=== Deployment Complete ==="
echo ""
echo "Your game is now deployed to: https://cosmicmonads.netlify.app"
echo ""
echo "Important: Make sure your backend server is properly deployed and running."
echo "See BACKEND_DEPLOYMENT.md for instructions on setting up your backend server."
echo "" 