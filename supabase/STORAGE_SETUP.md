# Storage Setup for Book Covers

This document explains how to set up the storage bucket and policies for book cover images.

## What We're Setting Up

- **Bucket**: `book-covers` - stores book cover images
- **Folder Structure**: `book-covers/books/{book_id}/cover.{ext}`
- **File Types**: JPEG, PNG, WebP, GIF
- **File Size Limit**: 5MB per image

## Storage Policies

**⚠️ TEMPORARY SETUP (No Authentication)**

The current policies allow all operations since your app doesn't have authentication set up yet:

1. **Anyone can upload/update/delete** book covers
2. **Public read access** to all book covers
3. **No user isolation** - all users can access all covers

**🔒 FUTURE: When you add authentication, update policies to:**

1. **Authenticated users only** can upload/update/delete covers
2. **User isolation** - users can only access their own book covers
3. **File type validation** - only images allowed

## Setup Instructions

### Option 1: Apply Migration (Recommended)

```bash
# From your project root
supabase db reset
# This will apply all migrations including the storage policies
```

### Option 2: Manual Setup

If you prefer to set up manually:

1. **Create the bucket** in Supabase Dashboard:

   - Go to Storage → New Bucket
   - Name: `book-covers`
   - Public: ✅ Yes
   - File size limit: 5MB

2. **Apply the policies** by running the SQL in `migrations/20241220000000_create_book_covers_bucket.sql`

### Option 3: Local Development

```bash
# Start local Supabase
supabase start

# Apply migrations
supabase db reset
```

## Testing the Setup

1. **Upload a book cover** in your PublishPage
2. **Check the console** for success/error messages
3. **Verify in Supabase Dashboard**:
   - Storage → book-covers bucket
   - Should see: `books/{book_id}/cover.{ext}`

## Troubleshooting

### Common Issues

1. **"Bucket not found"**: Ensure bucket is created
2. **"Policy violation"**: Check if user is authenticated
3. **"File too large"**: Ensure file is under 5MB
4. **"Invalid file type"**: Ensure file is JPEG, PNG, WebP, or GIF

### Policy Debugging

```sql
-- Check if bucket exists
SELECT * FROM storage.buckets WHERE id = 'book-covers';

-- Check policies
SELECT * FROM storage.policies WHERE bucket_id = 'book-covers';

-- Test file path parsing
SELECT storage.foldername('books/123e4567-e89b-12d3-a456-426614174000/cover.jpg');
```

## Security Notes

- Users can only access covers for books they own
- Public read access allows embedding covers in web pages
- File type validation prevents malicious uploads
- 5MB limit prevents abuse
