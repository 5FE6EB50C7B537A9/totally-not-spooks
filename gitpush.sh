#!/bin/sh
# usage: ./gitpush.sh [message]

echo "Pushing your current version to the repository..."

# add any new files that may have been created
git add . >/dev/null

# put all these changes into a commit
# -q: shut up
# -a: all changes
# -m "message": add commit message
git commit -am "$1" >/dev/null

# push the commits to the repository
git push origin master >/dev/null

echo "Done."
