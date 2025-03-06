#!/bin/bash

# Cosmic Monads Netlify Deployment Script

echo "=== Cosmic Monads Netlify Deployment ==="
echo

# Check if Git repository has uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "There are uncommitted changes. Would you like to commit them? (y/n)"
    read commit_response
    
    if [ "$commit_response" = "y" ]; then
        echo "Enter a commit message:"
        read commit_message
        
        git add .
        git commit -m "$commit_message"
        echo "Changes committed with message: $commit_message"
    else
        echo "Uncommitted changes will not be deployed."
        exit 1
    fi
fi

# Check if local and remote repositories are in sync
LOCAL_COMMIT=$(git rev-parse HEAD)
REMOTE_COMMIT=$(git rev-parse @{u} 2>/dev/null || echo "no-remote")

if [ "$LOCAL_COMMIT" != "$REMOTE_COMMIT" ] && [ "$REMOTE_COMMIT" != "no-remote" ]; then
    echo "Local and remote repositories are different. Push to GitHub? (y/n)"
    read push_response
    
    if [ "$push_response" = "y" ]; then
        git push
        echo "Changes pushed to GitHub."
    else
        echo "Local changes will not be pushed to GitHub."
    fi
fi

# Prepare configuration for production
echo "Preparing configuration for production..."

# Update config.js to use production settings
cp config.js config.js.bak
sed -i.bak 's/debugMode: true/debugMode: false/g' config.js
sed -i.bak 's/showFPS: true/showFPS: false/g' config.js

# Check Netlify login status
echo "Checking Netlify login status..."
if ! netlify status &>/dev/null; then
    echo "You need to log in to Netlify."
    netlify login
fi

# Check if the site is linked
if [ ! -d .netlify ]; then
    echo "Linking to Netlify site 'cosmicmonads'..."
    netlify link --name cosmicmonads
fi

# Deploy to Netlify
echo "Deploying to Netlify..."
netlify deploy --prod

# Restore local development configuration
echo "Restoring configuration for local development..."
mv config.js.bak config.js

echo
echo "=== Deployment Complete ==="
echo
echo "Your game is now deployed to: https://cosmicmonads.netlify.app"
echo
echo "Important: Make sure your backend server is properly deployed and running."
echo "See BACKEND_DEPLOYMENT.md for instructions on setting up your backend server."
echo 