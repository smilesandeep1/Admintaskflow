# Testing Guide: Profile Picture Upload

## Test Scenario 1: Upload Profile Picture

### Steps
1. Navigate to **Users** page
2. Click **Edit** button on any user card
3. Verify the edit dialog opens
4. Click **Upload** button in the profile picture section
5. Select an image file from your computer
6. **Expected Result**: 
   - ✅ Dialog stays open
   - ✅ Progress bar appears and shows upload progress
   - ✅ Success toast notification appears
   - ✅ Profile picture preview updates in the dialog
   - ✅ You can continue editing other fields

### What to Check
- [ ] Dialog does NOT close when file is selected
- [ ] Progress bar displays correctly (0% to 100%)
- [ ] Success message appears: "Profile picture uploaded"
- [ ] If image was compressed, message shows: "Image was automatically compressed to X KB"
- [ ] Avatar in dialog updates to show new picture
- [ ] All other form fields remain editable

## Test Scenario 2: Change Existing Profile Picture

### Steps
1. Navigate to **Users** page
2. Find a user who already has a profile picture
3. Click **Edit** button on their card
4. Click **Change** button in the profile picture section
5. Select a different image file
6. **Expected Result**:
   - ✅ Dialog stays open
   - ✅ Progress bar appears
   - ✅ Success toast appears
   - ✅ New picture replaces old picture
   - ✅ Old picture is deleted from storage

### What to Check
- [ ] Dialog stays open during upload
- [ ] Old picture is replaced (not duplicated)
- [ ] Success notification appears
- [ ] Avatar updates to new picture

## Test Scenario 3: Remove Profile Picture

### Steps
1. Navigate to **Users** page
2. Find a user who has a profile picture
3. Click **Edit** button on their card
4. Click **Remove** button in the profile picture section
5. **Expected Result**:
   - ✅ Dialog stays open
   - ✅ Picture is removed immediately
   - ✅ Avatar shows user initials instead
   - ✅ Upload button appears (instead of Change/Remove)

### What to Check
- [ ] Dialog stays open after removal
- [ ] Avatar changes to initials
- [ ] Upload button is now available
- [ ] No error messages appear

## Test Scenario 4: Upload and Edit Other Fields

### Steps
1. Navigate to **Users** page
2. Click **Edit** button on any user card
3. Click **Upload** button and select an image
4. Wait for upload to complete
5. **Without closing the dialog**, edit the following fields:
   - Full Name
   - Mobile Number
   - Designation
   - Role
   - Sections
6. Click **Save** button
7. **Expected Result**:
   - ✅ All changes are saved (including profile picture)
   - ✅ Dialog closes after clicking Save
   - ✅ User card shows updated information
   - ✅ Profile picture appears in user card

### What to Check
- [ ] Can edit all fields after uploading picture
- [ ] All changes save correctly
- [ ] User card reflects all updates
- [ ] Profile picture appears in user card

## Test Scenario 5: Upload Large Image (Auto-Compression)

### Steps
1. Prepare an image larger than 1 MB (e.g., 2-5 MB)
2. Navigate to **Users** page
3. Click **Edit** button on any user card
4. Click **Upload** button
5. Select the large image file
6. **Expected Result**:
   - ✅ Dialog stays open
   - ✅ Progress bar shows upload progress
   - ✅ Success message indicates compression: "Image was automatically compressed to X KB"
   - ✅ Compressed image is under 1 MB
   - ✅ Image quality is acceptable

### What to Check
- [ ] Large images are compressed automatically
- [ ] Compression message appears
- [ ] Final file size is under 1 MB
- [ ] Image quality is acceptable (not too pixelated)
- [ ] Dialog stays open during compression

## Test Scenario 6: Invalid File Type

### Steps
1. Navigate to **Users** page
2. Click **Edit** button on any user card
3. Click **Upload** button
4. Try to select a non-image file (e.g., .pdf, .txt, .doc)
5. **Expected Result**:
   - ✅ File picker may not show non-image files (browser behavior)
   - ✅ If selected, error message appears: "Invalid file type"
   - ✅ Dialog stays open
   - ✅ No upload occurs

### What to Check
- [ ] Only image files can be selected
- [ ] Error message appears for invalid files
- [ ] Dialog stays open
- [ ] No changes are made

## Test Scenario 7: Cancel During Upload

### Steps
1. Navigate to **Users** page
2. Click **Edit** button on any user card
3. Click **Upload** button and select a large image
4. While upload is in progress, click **Cancel** or close the dialog
5. **Expected Result**:
   - ✅ Dialog closes
   - ✅ Upload may complete in background (depending on timing)
   - ✅ No errors occur

### What to Check
- [ ] Can close dialog during upload
- [ ] No error messages appear
- [ ] Application remains stable

## Test Scenario 8: Multiple Users

### Steps
1. Navigate to **Users** page
2. Edit User A and upload a profile picture
3. Click **Save** to close the dialog
4. Edit User B and upload a different profile picture
5. Click **Save** to close the dialog
6. **Expected Result**:
   - ✅ Each user has their own profile picture
   - ✅ Pictures are not mixed up
   - ✅ Both pictures display correctly in user cards

### What to Check
- [ ] Each user has correct profile picture
- [ ] Pictures are not swapped or duplicated
- [ ] User list displays correctly

## Test Scenario 9: Mobile Number with Profile Picture

### Steps
1. Navigate to **Users** page
2. Click **Edit** button on any user card
3. Upload a profile picture
4. Enter a mobile number (e.g., +91-1234567890)
5. Click **Save**
6. **Expected Result**:
   - ✅ Both profile picture and mobile number are saved
   - ✅ User card shows profile picture
   - ✅ User card shows mobile number with phone icon
   - ✅ Header menu shows profile picture (if logged in as this user)

### What to Check
- [ ] Profile picture saves correctly
- [ ] Mobile number saves correctly
- [ ] Both display in user card
- [ ] Both display in header (if logged in user)

## Test Scenario 10: Dialog Refresh After Upload

### Steps
1. Navigate to **Users** page
2. Click **Edit** button on any user card
3. Upload a profile picture
4. Wait for success message
5. Click **Save** to close the dialog
6. **Expected Result**:
   - ✅ Dialog closes
   - ✅ User list refreshes automatically
   - ✅ Profile picture appears in user card
   - ✅ No need to manually refresh page

### What to Check
- [ ] User list refreshes when dialog closes
- [ ] Profile picture appears immediately
- [ ] No manual page refresh needed
- [ ] All user cards display correctly

## Browser Compatibility Testing

Test the above scenarios in:
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Testing

### Large Image Upload
- [ ] 1 MB image: Upload time < 5 seconds
- [ ] 5 MB image: Compression + upload time < 10 seconds
- [ ] 10 MB image: Compression + upload time < 15 seconds

### Multiple Uploads
- [ ] Upload 5 pictures in a row: No performance degradation
- [ ] Upload 10 pictures in a row: No memory leaks

## Accessibility Testing

- [ ] Can navigate with keyboard (Tab, Enter, Esc)
- [ ] Screen reader announces upload progress
- [ ] Error messages are accessible
- [ ] Focus management works correctly

## Error Handling Testing

### Network Errors
1. Disconnect internet
2. Try to upload profile picture
3. **Expected**: Error message appears, dialog stays open

### Storage Errors
1. Try to upload when storage is full (if possible)
2. **Expected**: Error message appears, dialog stays open

### Permission Errors
1. Try to upload as a user without permissions (if applicable)
2. **Expected**: Error message appears, no upload occurs

## Regression Testing

After the bug fix, verify that:
- [ ] All other user management features still work
- [ ] Creating new users works
- [ ] Deleting users works
- [ ] Updating user roles works
- [ ] Updating user sections works
- [ ] Password updates work
- [ ] Login/logout works
- [ ] Task management features work
- [ ] Dashboard displays correctly
- [ ] Reports generate correctly

## Sign-Off

### Tester Information
- Tester Name: _______________
- Date: _______________
- Browser: _______________
- OS: _______________

### Test Results
- [ ] All tests passed
- [ ] Some tests failed (list below)
- [ ] Ready for production

### Issues Found
1. _______________
2. _______________
3. _______________

### Notes
_______________________________________________
_______________________________________________
_______________________________________________
