#!/bin/sh
echo "Syncing with the Git repo..."
git pull origin master > /dev/null
echo "Done!"
