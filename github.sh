#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print error messages
error() {
    echo -e "${RED}ERROR: $1${NC}"
}

# Function to print success messages
success() {
    echo -e "${GREEN}SUCCESS: $1${NC}"
}

# Function to print warning messages
warning() {
    echo -e "${YELLOW}WARNING: $1${NC}"
}

# Check if we're in a git repository
if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
    error "Not a git repository!"
    exit 1
fi

# Get current branch name
current_branch=$(git symbolic-ref --short HEAD)

# Fetch only from main branch
echo "Fetching latest changes from main branch..."
if ! git fetch origin main:main; then
    error "Failed to fetch latest changes from main"
    exit 1
fi

# If current branch is main, check if it's behind
if [ "$current_branch" = "main" ]; then
    behind_count=$(git rev-list HEAD..origin/main --count 2>/dev/null)
    if [ "$behind_count" -gt 0 ]; then
        warning "Your main branch is behind by $behind_count commits. Please pull changes first."
        read -p "Do you want to pull the latest changes? (y/n): " should_pull
        if [ "$should_pull" = "y" ]; then
            if ! git pull origin main; then
                error "Failed to pull changes"
                exit 1
            fi
        else
            error "Aborting to avoid conflicts"
            exit 1
        fi
    fi
else
    # If not on main, check if main has new changes
    warning "You are on branch: $current_branch"
    main_changes=$(git rev-list main..origin/main --count 2>/dev/null)
    if [ "$main_changes" -gt 0 ]; then
        warning "Main branch has $main_changes new commits. Consider updating your branch."
    fi
fi

# Run ESLint check
echo "Running ESLint check..."
if ! npm run lint; then
    warning "ESLint found issues"
    read -p "Do you want to run ESLint fix? (y/n): " should_fix
    if [ "$should_fix" = "y" ]; then
        echo "Running ESLint fix..."
        if ! npm run lint:fix; then
            warning "Some ESLint issues could not be automatically fixed"
            read -p "Do you want to continue anyway? (y/n): " continue_lint
            if [ "$continue_lint" != "y" ]; then
                exit 1
            fi
        else
            success "ESLint issues fixed"
        fi
    else
        read -p "Do you want to continue with ESLint issues? (y/n): " continue_lint
        if [ "$continue_lint" != "y" ]; then
            exit 1
        fi
    fi
else
    success "ESLint check passed"
fi

# Run code formatting
echo "Running code formatting..."
if ! npm run prettier; then
    error "Code formatting failed"
    read -p "Do you want to continue anyway? (y/n): " continue_anyway
    if [ "$continue_anyway" != "y" ]; then
        exit 1
    fi
fi

# Show git status
echo "Current git status:"
git status

# Prompt for commit message with validation
while true; do
    read -p "Enter commit message (min 10 characters): " commit_message
    if [ ${#commit_message} -lt 10 ]; then
        warning "Commit message too short. Please provide a more descriptive message."
    else
        break
    fi
done

# Add all changes
echo "Adding changes..."
if ! git add .; then
    error "Failed to add changes"
    exit 1
fi

# Commit changes
echo "Committing changes..."
if ! git commit -m "$commit_message"; then
    error "Failed to commit changes"
    exit 1
fi

# Confirm before force push
warning "You're about to push to branch: $current_branch"
read -p "Are you sure you want to push? (y/n): " should_push
if [ "$should_push" = "y" ]; then
    # Use --force-with-lease instead of -f for safer force pushing
    if git push --force-with-lease; then
        success "Successfully pushed changes to $current_branch"
    else
        error "Failed to push changes"
        exit 1
    fi
else
    warning "Push cancelled"
    exit 0
fi