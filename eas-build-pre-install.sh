#!/bin/bash

# Create a .env file with the necessary environment variables
echo "EXPO_PUBLIC_SUPABASE_URL=https://jfbazvfmbvoufpewlwge.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmYmF6dmZtYnZvdWZwZXdsd2dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI0Mjc5ODksImV4cCI6MjA1ODAwMzk4OX0.c1T_kTtqzGhzx46jDxG2pVevSZn3RiXm0i7W5gEhnS0" > .env

# If you have an OpenAI API key, uncomment the line below and add your key
# echo "EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key" >> .env

# Make the file executable
chmod +x eas-build-pre-install.sh
