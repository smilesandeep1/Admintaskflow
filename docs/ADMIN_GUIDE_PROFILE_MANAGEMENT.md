# Administrator Guide: Profile Management

## Quick Start Guide for Profile Picture and Mobile Number Management

### Overview
As an administrator or L1 user, you can now manage profile pictures and mobile numbers for all users in the system.

## Accessing User Management

1. Log in to TaskFlow Hub
2. Click on **Users** in the navigation menu
3. You'll see a list of all users with their profile information

## Managing Profile Pictures

### Uploading a Profile Picture

1. **Locate the User**
   - Find the user card in the User Management page
   - Click the **Edit** button (pencil icon) on the user's card

2. **Upload Image**
   - In the edit dialog, you'll see the profile picture section at the top
   - Click the **Upload** or **Change** button
   - Select an image file from your computer
   - Supported formats: JPEG, PNG, GIF, WEBP, AVIF
   - Maximum size: 1 MB (images will be automatically compressed if larger)

3. **Monitor Progress**
   - A progress bar will show the upload status
   - Wait for the upload to complete (usually takes a few seconds)
   - You'll see a success notification when complete

4. **Save Changes**
   - The profile picture is saved immediately upon upload
   - You can continue editing other fields if needed
   - Click **Save** to apply any other changes

### Changing an Existing Profile Picture

1. Open the user edit dialog
2. Click the **Change** button
3. Select a new image file
4. The old image will be replaced automatically

### Removing a Profile Picture

1. Open the user edit dialog
2. Click the **Remove** button next to the profile picture
3. The image will be deleted immediately
4. The user's avatar will show their initials instead

### Image Requirements

- **File Size**: Maximum 1 MB (automatic compression applied)
- **Resolution**: Maximum 1920x1080 pixels
- **Formats**: JPEG, PNG, GIF, WEBP, AVIF
- **Filename**: Must contain only English letters and numbers
- **Quality**: High-quality images recommended (will be compressed if needed)

## Managing Mobile Numbers

### Adding a Mobile Number

1. **Open User Edit Dialog**
   - Click the **Edit** button on any user card

2. **Enter Mobile Number**
   - Find the **Mobile Number** field
   - Enter the user's mobile number
   - Format: Any format is accepted (e.g., +91-1234567890, 1234567890)

3. **Save Changes**
   - Click the **Save** button at the bottom of the dialog
   - You'll see a success notification

### Updating a Mobile Number

1. Open the user edit dialog
2. Modify the mobile number in the **Mobile Number** field
3. Click **Save**

### Removing a Mobile Number

1. Open the user edit dialog
2. Clear the **Mobile Number** field (delete all text)
3. Click **Save**

## Where Profile Information Appears

### Profile Pictures
- **User Cards**: Large avatar (64x64 pixels) on the left side of each user card
- **Header Menu**: Small avatar (32x32 pixels) in the top-right corner
- **User Dropdown**: Avatar shown in the user menu dropdown

### Mobile Numbers
- **User Cards**: Displayed as a badge with a phone icon
- **User Dropdown**: Shown in the header user menu (for logged-in user only)

## Best Practices

### Profile Pictures
1. **Use Professional Images**
   - Encourage users to upload clear, professional photos
   - Avoid blurry or low-quality images
   - Ensure good lighting and focus

2. **Maintain Consistency**
   - Use similar style across all user profiles
   - Consider setting guidelines for image backgrounds
   - Ensure images are appropriate for workplace

3. **Regular Updates**
   - Encourage users to update photos periodically
   - Remove outdated or inappropriate images
   - Verify images during user onboarding

### Mobile Numbers
1. **Verify Accuracy**
   - Confirm mobile numbers with users
   - Use consistent format across all entries
   - Update numbers when users report changes

2. **Privacy Considerations**
   - Only add mobile numbers with user consent
   - Inform users where their numbers will be displayed
   - Follow organizational privacy policies

3. **Keep Updated**
   - Regularly verify mobile numbers are current
   - Remove numbers for inactive users
   - Update during user profile reviews

## Troubleshooting

### Common Issues

#### Image Upload Fails
**Problem**: Upload button doesn't work or shows error

**Solutions**:
1. Check file size (must be under 1 MB)
2. Verify file format is supported
3. Ensure filename has no special characters
4. Try a different image
5. Check internet connection

#### Image Quality is Poor
**Problem**: Uploaded image looks compressed or pixelated

**Solutions**:
1. Upload a higher quality source image
2. Ensure source image is close to 1920x1080 resolution
3. Avoid uploading already-compressed images
4. Use PNG format for better quality (if under 1 MB)

#### Mobile Number Won't Save
**Problem**: Mobile number field doesn't save changes

**Solutions**:
1. Ensure you clicked the **Save** button
2. Check for any validation errors
3. Verify you have admin or L1 permissions
4. Try refreshing the page and trying again

#### Profile Picture Doesn't Appear
**Problem**: Uploaded image doesn't show in user card or header

**Solutions**:
1. Refresh the page (Ctrl+F5 or Cmd+Shift+R)
2. Clear browser cache
3. Verify upload was successful (check for success notification)
4. Try uploading again

### Error Messages

| Error Message | Meaning | Solution |
|--------------|---------|----------|
| "Invalid file type" | File format not supported | Use JPEG, PNG, GIF, WEBP, or AVIF |
| "Filename must contain only English letters and numbers" | Special characters in filename | Rename file before uploading |
| "Upload failed" | Network or server error | Check connection and try again |
| "Failed to compress image" | Image processing error | Try a different image |
| "Failed to update user" | Database error | Check permissions and try again |

## Security and Privacy

### Access Control
- Only **Admin** and **L1** users can manage other users' profiles
- Users can view their own profile information
- Profile pictures are publicly accessible (anyone can view)
- Mobile numbers are only visible to authenticated users

### Data Storage
- Profile pictures stored in Supabase Storage
- Each user has their own folder (organized by user ID)
- Mobile numbers stored in encrypted database
- All changes are logged with timestamps

### Compliance
- Follow organizational data protection policies
- Obtain user consent before adding personal information
- Respect user privacy preferences
- Maintain data accuracy and currency

## Bulk Operations

### Managing Multiple Users
Currently, profile pictures and mobile numbers must be updated individually. For bulk operations:

1. **Create a Spreadsheet**
   - List all users and their information
   - Track which users need updates
   - Note mobile numbers to be added

2. **Update Systematically**
   - Work through users alphabetically or by section
   - Update 5-10 users at a time
   - Verify each update before moving to next

3. **Document Changes**
   - Keep a log of updates made
   - Note any issues encountered
   - Track completion status

## Reporting Issues

If you encounter problems:

1. **Note the Details**
   - What were you trying to do?
   - What error message appeared?
   - Which user were you editing?

2. **Try Basic Troubleshooting**
   - Refresh the page
   - Clear browser cache
   - Try a different browser
   - Check internet connection

3. **Contact Support**
   - Provide detailed description
   - Include screenshots if possible
   - Mention browser and device used
   - Note any error messages

## Tips for Efficient Management

1. **Batch Similar Tasks**
   - Upload all profile pictures in one session
   - Update all mobile numbers together
   - Review all user profiles periodically

2. **Use Keyboard Shortcuts**
   - Tab to navigate between fields
   - Enter to save forms
   - Esc to close dialogs

3. **Maintain Standards**
   - Create guidelines for profile pictures
   - Use consistent mobile number format
   - Document your processes

4. **Regular Maintenance**
   - Review user profiles monthly
   - Update outdated information
   - Remove inactive users
   - Verify contact information

## Summary

Profile picture and mobile number management enhances user identification and communication within TaskFlow Hub. As an administrator, you play a key role in maintaining accurate and professional user profiles. Follow these guidelines to ensure smooth operation and user satisfaction.

For technical details, see [PROFILE_FEATURES.md](./PROFILE_FEATURES.md)
