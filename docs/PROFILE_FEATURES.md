# Profile Picture Upload and Mobile Number Management

## Overview
Version 1.3.0 introduces comprehensive profile management features including profile picture uploads with automatic compression and mobile number management for all users.

## Features

### 1. Profile Picture Upload

#### Capabilities
- Upload profile pictures in multiple formats (JPEG, PNG, GIF, WEBP, AVIF)
- Automatic image compression to meet 1 MB size limit
- Real-time upload progress indicator
- Preview images before and after upload
- Remove existing profile pictures
- Avatar fallback with user initials

#### Technical Specifications
- **Maximum File Size**: 1 MB
- **Maximum Resolution**: 1920x1080 (1080p)
- **Compression Format**: WEBP (when compression is needed)
- **Compression Quality**: Starts at 0.8, reduces until under 1 MB
- **Storage Location**: Supabase Storage bucket `app-7oowe77h6v41_profile_images`

#### Security
- Filename validation (English letters and numbers only)
- Automatic filename sanitization
- File type validation
- User-specific storage folders (organized by user ID)
- Public read access, authenticated write access
- Users can only modify their own pictures
- Admins can manage all pictures

### 2. Mobile Number Management

#### Capabilities
- Add mobile numbers to user profiles
- Update existing mobile numbers
- Optional field (can be left blank)
- Display in user cards and header menu

#### Display Locations
- User Management page (in user cards with phone icon)
- Header user menu dropdown
- User edit dialog

## User Guide

### Uploading a Profile Picture

1. Navigate to **User Management** page
2. Click the **Edit** button on any user card
3. In the edit dialog, you'll see the profile picture upload section at the top
4. Click **Upload** or **Change** button
5. Select an image file from your device
6. Wait for the upload to complete (progress bar will show status)
7. If the image is over 1 MB, it will be automatically compressed
8. Click **Save** to apply all changes

### Removing a Profile Picture

1. Open the user edit dialog
2. Click the **Remove** button next to the profile picture
3. The picture will be deleted immediately
4. An avatar with initials will be displayed instead

### Adding/Updating Mobile Number

1. Navigate to **User Management** page
2. Click the **Edit** button on any user card
3. Find the **Mobile Number** field
4. Enter or update the mobile number
5. Click **Save** to apply changes

## Technical Implementation

### Database Schema

```sql
-- New columns in profiles table
ALTER TABLE profiles 
ADD COLUMN profile_picture_url text,
ADD COLUMN mobile_number text;

-- Index for mobile number lookups
CREATE INDEX idx_profiles_mobile_number ON profiles(mobile_number) 
WHERE mobile_number IS NOT NULL;
```

### Storage Bucket

```sql
-- Bucket configuration
Bucket ID: app-7oowe77h6v41_profile_images
Public: true
File Size Limit: 1048576 bytes (1 MB)
Allowed MIME Types: 
  - image/jpeg
  - image/png
  - image/gif
  - image/webp
  - image/avif
```

### Storage Policies

1. **Public Read**: Anyone can view profile images
2. **User Upload**: Authenticated users can upload to their own folder
3. **User Update**: Users can update their own images
4. **User Delete**: Users can delete their own images
5. **Admin Access**: Admins can manage all images

### File Structure

```
src/
├── components/
│   └── profile/
│       └── ProfilePictureUpload.tsx    # Upload component
├── utils/
│   └── imageUpload.ts                  # Upload utilities
└── types/
    └── types.ts                        # Updated Profile interface

supabase/
└── migrations/
    └── 02_add_profile_picture_and_mobile.sql
```

### API Functions

#### Upload Profile Picture
```typescript
uploadProfilePicture(
  file: File,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<{ url: string; compressed: boolean; finalSize: number }>
```

#### Delete Profile Picture
```typescript
deleteProfilePicture(url: string): Promise<void>
```

#### Update Profile
```typescript
profilesApi.update(id: string, updates: Partial<Profile>): Promise<Profile>
```

## Image Compression Algorithm

1. **Check File Size**: If file is under 1 MB, upload directly
2. **Load Image**: Read file and create image object
3. **Calculate Dimensions**: Resize if larger than 1920x1080 (maintain aspect ratio)
4. **Create Canvas**: Draw image at new dimensions
5. **Compress**: Convert to WEBP format
6. **Quality Loop**: Start at 0.8 quality, reduce by 0.1 until under 1 MB
7. **Upload**: Upload compressed image to storage

## Error Handling

### Upload Errors
- Invalid file type → "Invalid file type. Please upload JPEG, PNG, GIF, WEBP, or AVIF images."
- Invalid filename → "Filename must contain only English letters and numbers."
- Upload failure → Displays specific error from Supabase Storage
- Compression failure → "Failed to compress image"

### Delete Errors
- Invalid URL → "Invalid profile picture URL"
- Delete failure → Displays specific error from Supabase Storage

## Best Practices

### For Users
1. Use clear, professional profile pictures
2. Ensure images are well-lit and in focus
3. Use recent photos
4. Keep mobile numbers up to date

### For Administrators
1. Review uploaded images periodically
2. Ensure users follow image guidelines
3. Monitor storage usage
4. Maintain user privacy

### For Developers
1. Always validate file types and sizes on frontend
2. Use the provided upload utilities (don't bypass compression)
3. Handle errors gracefully with user-friendly messages
4. Test with various image formats and sizes
5. Ensure proper cleanup when deleting images

## Troubleshooting

### Image Won't Upload
- Check file size (must be under 1 MB after compression)
- Verify file format is supported
- Ensure filename contains only English letters and numbers
- Check internet connection

### Image Quality Issues
- Original images over 1 MB will be compressed
- Use high-quality source images
- Avoid uploading already-compressed images
- Consider uploading images closer to 1920x1080 resolution

### Mobile Number Not Saving
- Ensure you clicked the Save button
- Check for validation errors
- Verify you have permission to edit the user

## Future Enhancements

Potential improvements for future versions:
- Drag-and-drop upload interface
- Image cropping before upload
- Multiple image format support in preview
- Bulk user import with profile pictures
- Profile picture history/versioning
- Image optimization settings
- Custom avatar generator
- QR code generation for mobile numbers
