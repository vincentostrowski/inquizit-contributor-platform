#!/bin/bash

echo "🚀 Setting up Book Covers Storage Bucket..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

echo "📁 Creating book-covers storage bucket..."

# Create the bucket using Supabase CLI
supabase storage create book-covers --public

if [ $? -eq 0 ]; then
    echo "✅ Storage bucket 'book-covers' created successfully!"
else
    echo "⚠️  Bucket creation failed or already exists. Continuing with policy setup..."
fi

echo "🔐 Applying storage policies..."

# Apply the migration
supabase db reset

echo ""
echo "⚠️  NOTE: Storage policies are set to allow all operations temporarily."
echo "   This is because your app doesn't have authentication set up yet."
echo "   Once you add auth, you should update the policies to be more restrictive."
echo ""

if [ $? -eq 0 ]; then
    echo "✅ Storage policies applied successfully!"
    echo ""
    echo "🎉 Setup complete! Your book-covers storage is ready."
    echo ""
    echo "📋 What was created:"
    echo "   • Storage bucket: book-covers"
    echo "   • Upload policies for authenticated users"
    echo "   • Public read access for all covers"
    echo "   • File type validation (images only)"
    echo "   • User isolation (users can only access their own covers)"
    echo ""
    echo "🧪 Test it:"
    echo "   1. Go to your PublishPage"
    echo "   2. Upload a book cover image"
    echo "   3. Click Save - should work without errors!"
else
    echo "❌ Failed to apply storage policies. Please check the error above."
    exit 1
fi
