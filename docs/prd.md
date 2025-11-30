# Sr.DFM/Hubli TaskFlow Hub Requirements Document

## 1. Application Overview

### 1.1 Application Name
Sr.DFM/Hubli TaskFlow Hub

### 1.2 Application Description
A comprehensive task management application designed for office workflow monitoring and assignments, supporting multi-level user hierarchy, task lifecycle management, document handling, reporting capabilities, AI-powered insights for performance optimization, and internal messaging system.\n
### 1.3 Application Type
Web-based management system

### 1.4 Application Logo
Use the uploaded image Applogo.png as the application logo displayed in the header and login page.

---

## 2. User Authentication

### 2.1 Login System
- User login with credentials\n- Password update feature after successful login
- Logout functionality
\n### 2.2 Password Management
- Admin and L1 users can set or reset passwords for any existing user
- Password reset functionality accessible from user management interface
\n---

## 3. User Hierarchy and Roles

### 3.1 Level1 (L1) - Super User
- **Designation**: Sr.DFM\n- **Privileges**:
  - Full administrative access
  - Manage L2, L3, L4 users (Create, Read, Update, Delete)
  - Edit user names for any level
  - Sort and update user roles
  - Assign and update sections for users
  - Set or reset passwords for any user
  - Create, assign, transfer and monitor all tasks for L2, L3, L4\n  - Manage sections and tasks across the organization
  - Send messages to all lower-level users or target by level, section, or individual user
  - Delete chat history and records from database
\n### 3.2 Level2 (L2) - Gazetted Officers
- **Designations**: ADFM I, ADFM II, ADFM III, ADFM IV
- **Privileges**:
  - Receive, complete and update assigned tasks
  - Create tasks for L3 and L4 users
  - Transfer tasks (created by L1 or self) among L3 and L4 users
  - View and manage only tasks assigned to their own sections
  - Send messages to L3 and L4 users within assigned sections, by section or by individual user
\n### 3.3 Level3 (L3) - Section Officers
- **Designation**: Sr. Section Officers
- **Privileges**:\n  - Receive, complete and update assigned tasks
  - Create tasks for L4 users
  - Transfer tasks (created by L1, L2 or self) to L4 users
  - View and manage only tasks assigned to their own sections
  - Send messages to L4 users within assigned sections, by section or by individual user\n
### 3.4 Level4 (L4) - Group C Staff
- **Designation**: Group C Staff
- **Privileges**:
  - Receive, complete and update assigned tasks
  - View only tasks assigned to their own sections
  - Receive messages from higher-level users
\n### 3.5 Admin Users
- **Privileges**:
  - Manage users (CRUD) of all levels
  - Edit user names for any level
  - Sort and update user roles
  - Assign and update sections for users
  - Set or reset passwords for any user
  - Initiate and assign new tasks to L2, L3, L4 users
  - Manage sections and tasks\n  - Send messages to L2, L3, and L4 users with full targeting capabilities
  - Delete chat history and records from database

---

## 4. Section Management

### 4.1 Available Sections
- ADMN\n- PF
- NPS
- PEN
- ESTT
- FX
- FE
- BR
- Audit
- INSP
- EX I
- EX II
- BUDGET
- SUSP
- BOOKS
- EFFY
- IT
- SWindow
- Fuel
\n### 4.2 Section Assignment
- Each user can be assigned to multiple sections
- Sections displayed in alphabetical order across all app pages
\n---

## 5. Task Management

### 5.1 Task Creation and Assignment Rules
- **L1**: Can create and assign tasks to L2, L3, L4 users
- **L2**: Can create and assign tasks to L3, L4 users
- **L3**: Can create and assign tasks to L4 users
- **Restriction**: No tasks can be assigned to L1 users by any other level
- **Multiple User Assignment**: Tasks can be assigned to multiple users simultaneously

### 5.2 Task Transfer Rules
- **L1**: Can transfer tasks across L2, L3, L4 users
- **L2**: Can transfer tasks among L3, L4 users\n- **L3**: Can transfer tasks among L4 users
\n### 5.3 Document Attachments
- Allowdocument upload from local disk during task creation
- Provide download option for assigned users
\n### 5.4 Task Completion\n- Mark task as 'Completed' requires entering remarks
- Remarks stored with task for record keeping
- Upon marking task as completed, generate comprehensive task completion report in DOC or PDF format

### 5.5 Multi-User Task Status Management
- **Pending Status**: When a task is assigned to multiple users, the task status displays as 'Pending' until all assigned users mark their individual status as completed
- **Final Completion**: Task status changes to 'Completed' only after all assigned users have updated their individual status to completed
- **Individual User Status Tracking**: System tracks completion status for each assigned user independently
- **Status Display Logic**:
  - If not all users have completed: Display 'Pending'\n  - If all users have completed: Display 'Completed'
  - If task has not been initiated by any user: Display 'Pending'\n\n### 5.6 Assigned User Name Color Coding
- **Task Initiated Status**: User name displayed in Dark Pink color when user updates their portion of the task as'Task Initiated'
- **Completed Users**: User names displayed in Dark Green color after they mark their individual task status as completed
- **Pending Users**: User names displayed in Dark Red color for users who have not yet initiated or completed their part of the task
- **Color Coding Application**: Color indicators applied in task detail view, task list view, and all task-related interfaces
- **Real-time Update**: User name colors update immediately upon status change

### 5.7 Task Completion Report Generation
- **Report Format**: DOC (Microsoft Word document) or PDF, optimized for single-page printing and official filing
- **Report Structure**:
  - **Header Section**: Application logo (Applogo.png) centered at top ofdocument
  - **Addressee Section**: 'To' address field displaying L1 user name and designation
  - **Body Section**:
    - Task title asdocument heading
    - Task description in detail
    - Task details including:\n      - Section assignment
      - Priority level
      - Due date
      - Complete status change history with dates, times, and users involved at each stage
      - For multi-user tasks: Individual completion status for each assigned user with timestamps
      - Full task reassignment history showing all transfers with date, time, from user, to user, and reason for transfer
      - List of all attached files with file names and upload dates
  - **Verification and Generation Section**:
    - **Verified By**: Display user name and official designation of the user who verified the task completion
    - **Generated By**: Display user name and official designation of the user who generated the report
  - **Signature Section**: Provision for authorized user signature at bottom of document for official authorization
- **Page Layout Optimization**: All content formatted to fit within one page using compact spacing and optimized font sizes
- **Download Functionality**: Report available for download immediately after task completion in both DOC and PDF formats
- **Access Control**: Report accessible to task assignee and all users with higher privilege levels
- **Official Documentation**: Reports formatted as official documents ready for printing, filing, and archival purposes

### 5.8 Status Tracking\n- Record each status change event with date and time
- Track status changes at all user levels\n- For multi-user tasks, maintain individual status tracking for each assigned user
- Log task initiation events with user details and timestamps
\n### 5.9 Task Viewing Permissions
- Users can view only tasks assigned to their own sections
\n### 5.10 Edit Task Functionality
- **Assign To Interface**: Replace existing dropdown with checkbox feature for selecting multiple users
- **Multi-User Selection**: Allow selecting multiple users simultaneously using checkboxes
- **Pre-selection**: Currently assigned users are preselected in the checkbox list
- **User List Display**: Display all eligible users based on task creator's level and permissions
- **Selection Management**: Users can check or uncheck boxes to add or remove assignees
- **Save Changes**: Updated assignments saved and reflected immediately in task details

---

## 6. User Management

### 6.1 User Administration
- Admin and L1 users can edit user names\n- Admin and L1 users can update/assign sections
- Admin and L1 users can change user designations
- Admin and L1 users can edit official designations
- Admin and L1 users can set or reset passwords for existing users
- Users displayed in alphabetical order across all app pages

### 6.2 User Profile Fields
- **User Name**: Display name used throughout the application
- **Designation**: Role-based designation (Sr.DFM, ADFM I-IV, Sr. Section Officers, Group C Staff)
- **Official Desig**: Official designation field for entering the formal job title or position
- **Section Assignment**: One or multiple sections assigned to the user
- **Mobile Number**: Contact number for the user
- **Profile Picture**: User photo displayed across the application
- **Password**: Login credentials managed by admin/L1 users or self\n\n### 6.3 Edit User Functionality
- Admin and L1 users can access edit user interface
- Edit form includes all user profile fields:\n  - User Name (text input)
  - Designation (dropdown selection)
  - Official Desig (text input for official designation)
  - Section Assignment (multi-select dropdown)
  - Mobile Number (numeric input with validation)
  - Profile Picture (file upload)
  - Password Reset (optional action button)
- All fields editable except user level which requires separate role management
- Changes saved and reflected immediately across the application
- Edit history logged for audit purposes

### 6.4 User Profile Management
- Users can upload profile pictures from local disk
- Profile pictures displayed in user profile and throughout the application
- Supported image formats: JPG, PNG, GIF\n- Admin and L1 users can upload or update profile pictures for any user
- Other users can upload or update their own profile pictures
\n### 6.5 Mobile Number Management
- Admin and L1 users can upload and update mobile numbers for all users
- Users can upload and update their own mobile numbers
- Mobile number upload functionality accessible from user profile and user management interface
- Support for bulk mobile number upload for multiple users
- Mobile number field accessible during user creation and editing
- Mobile number validation to ensure correct format (10-digit numeric format)
- Mobile number displayed in user profile and user listing pages

### 6.6 User Display View Options
- User management interface supports two display modes: Grid View and List View
- **Grid View**: Display users as cards in a responsive grid layout, showing profile picture, name, designation, and section assignments
- **List View**: Display users in a tabular format with columns for profile picture, name, designation, sections, and action buttons
- View toggle button available in user management interface header
- User's selected view preference saved and persisted across sessions
- Both views support sorting, filtering, and search functionality
- Both views maintain alphabetical ordering of users

---

## 7. Automated Task Reminder System

### 7.1 Email Notification System
- Automated email notifications sent to task assignees before due dates
- Email content includes task details, due date, and direct link to task
- System checks for upcoming due dates and triggers notifications automatically
\n### 7.2 Configurable Reminder Periods
- Default reminder options: 24hours, 3 days, 7 days before due date
- Admin and L1 users can configure system-wide default reminder periods
- Individual users can customize their own reminder preferences
\n### 7.3 User Reminder Preferences
- Users can access reminder settings from their profile page
- Options to enable/disable email reminders
- Select preferred reminder timing (24hours, 3 days, 7 days, or custom)
- Option to receive multiple reminders at different intervals
- Preferences saved per user and applied to all assigned tasks

### 7.4 Reminder Management
- Reminders automatically stop once task is marked as completed
- For multi-user tasks, reminders continue for users who have not completed their part
- No reminders sent for tasks without specified due dates
- Reminder history logged for tracking and audit purposes

---

## 8. Reporting and Dashboard

### 8.1 Report Types
- Task status reports
- Task completion rates
- Section workload analysis
- User activity reports
\n### 8.2 Dashboard Visualization
- Various types of graphs and charts for data visualization
- Visual representation of task metrics and performance indicators
\n### 8.3 Periodic Report Download
- **Section-wise Reports**: Generate and download reports filtered by specific sections or all sections
- **Status-wise Reports**: Generate and download reports filtered by task status (Pending, In Progress, Completed)
- **User-wise Reports**: Generate and download reports filtered by specific users or user levels
- **Level-wise Reports**: Generate and download reports filtered by user levels (L1, L2, L3, L4) to analyze performance and workload distribution across hierarchy levels
- **Task-wise Reports**: Generate and download reports filtered by specific tasks or task categories to analyze individual task performance, completion timelines, and assignment history
- **Custom Date Range**: Allow users to select custom start and end dates for report generation
- **Export Formats**: Support downloading reports in both XLS (Excel) and CSV formats
- **Download Interface**: Provide intuitive interface with dropdown filters for section, status, user, level, and task selection along with date range picker
- **Report Content**: Include task details, assignment information, status history, completion dates, individual user completion status for multi-user tasks, and relevant metrics
- **Access Control**: Report download functionality available to Admin and L1 users for all data; L2, L3, L4 users can download reports only for their assigned sections

---

## 9. AI-Powered Insights and Analytics

### 9.1 Task Completion Trend Analysis
- Analyze historical task completion data to identify patterns and trends
- Display trend graphs showing completion rates over time periods (daily, weekly, monthly)
- Compare performance across sections and user levels
\n### 9.2 Workflow Bottleneck Identification
- Automatically detect tasks with prolonged pending status
- Identify sections or users with consistently high task backlogs
- Highlight workflow stages where delays frequently occur

### 9.3 Delay Prediction
- Predict potential task delays based on historical completion times and current workload
- Provide early warning alerts for tasks at risk of missing deadlines
- Calculate estimated completion dates for pending tasks

### 9.4 Actionable Recommendations
- Generate performance improvement suggestions based on data analysis
- Recommend task redistribution to balance workload\n- Suggest process optimizations to reduce completion times
\n### 9.5 AI-Powered Assignment Oversight
- Intelligent workload distribution recommendations when creating new tasks
- Analyze current workload across users before suggesting optimal assignee\n- Monitor assignment patterns to ensure fair distribution\n
### 9.6 Graphical Workload Analysis
- Visual representation of workload distribution across users and sections
- Heat maps showing task density and completion rates
- Comparative charts for workload balance analysis
- Interactive graphs for drilling down into specific metrics

---
\n## 10. Internal Messaging and Chat System

### 10.1 Chat Interface
- Chat icon displayed in application header for easy access
- Clicking chat icon opens chat window overlay
- Chat window displays conversation history and message composition area
- Real-time message delivery and notification system
- Support for both broadcast messaging and one-on-one chat conversations

### 10.2 Messaging Permissions by User Level
\n#### 10.2.1 Admin User Messaging Rights
- Send messages to L2, L3, and L4 users
- **All Eligible Users**: Broadcast to all L2, L3, and L4 users collectively
- **By Level**: Target specific level (all L2 users, all L3 users, or all L4 users)
- **By Section**: Target all users in a specific section
- **Individual User**: Send direct messages to a specific person for one-on-one chat
\n#### 10.2.2 L1 User Messaging Rights
- Send messages to all lower-level users (L2, L3, L4) collectively
- Target messages by user level (all L2 users, all L3 users, or all L4 users)\n- Target messages by section (all users in a specific section)
- Send direct messages to individual users at any level for one-on-one chat

#### 10.2.3 L2 User Messaging Rights
- Send messages to L3 and L4 users only
- Messaging limited to sections assigned to the L2 user
- Target messages by section (all users in assigned sections)
- Send direct messages to specific L3 or L4 users within assigned sections for one-on-one chat

#### 10.2.4 L3 User Messaging Rights
- Send messages to L4 users only
- Messaging limited to sections assigned to the L3 user
- Target messages by section (all L4 users in assigned sections)
- Send direct messages to specific L4 users within assigned sections for one-on-one chat

#### 10.2.5 L4 User Messaging Rights
- Receive messages from higher-level users
- Reply to direct messages from higher-level users within one-on-one chat conversations
- No broadcast messaging capabilities
\n### 10.3 Chat Functionality
- **Broadcast Messages**: Send announcements or updates to multiple users based on level or section targeting
- **One-on-One Chat**: Private chat conversations between individual users within their messaging permissions
- **Chat History**: Maintain separate conversation threads for each one-on-one chat\n- **Message Threading**: Group messages by conversation for easy tracking
- **Active Chat List**: Display list of active chat conversations with unread message indicators
\n### 10.4 Message Composition Features
- Recipient selection dropdown with filtering options (by level, by section, by individual user)
- Text input area for message content
- Send button to deliver message
- Message history display showing sent and received messages
- Timestamp for each message
- Read/unread status indicators
- Typing indicators for one-on-one chats
- Message delivery confirmation

### 10.5 Message Notifications
- Visual notification badge on chat icon when new messages arrive
- In-app notification alerts for new messages
- Message count indicator showing number of unread messages
- Desktop notifications for new messages when application is in background
- Sound alerts for incoming messages (user-configurable)
\n### 10.6 Chat History Management
- **Delete Functionality**: Admin and L1 users can delete chat history and records
- **Deletion Scope**: Option to delete individual conversations or entire chat history
- **Database Removal**: Deleted chat records permanently removed from database
- **Deletion Confirmation**: Confirmation dialog before deleting chat history to prevent accidental deletion
- **Access Control**: Chat deletion functionality exclusively available to Admin and L1 users
- **Deletion Options**:
  - Delete specific one-on-one conversation threads
  - Delete broadcast message history
  - Delete all chat records for a specific user
  - Delete all chat records within a date range
- **Audit Trail**: Log deletion actions with timestamp and user information for accountability

---

## 11. Design Style\n
### 11.1 Color Scheme
- Primary color: Professional blue (#2C5F8D) for headers and primary actions
- Secondary color: Light gray (#F5F7FA) for backgrounds\n- Accent color: Green (#28A745) for completed tasks and success states
- Alert color: Orange (#FFA500) for pending tasks and warnings
- Status indicator colors:\n  - Dark Pink for task initiator names (users who marked task as 'Task Initiated')\n  - Dark Green for completed user names\n  - Dark Red for pending user names
\n### 11.2 Layout\n- Dashboard-style layout with sidebar navigation for different modules
- Card-based design for task items and user information
- Tabular layout for task lists and user management
- Responsive grid system for reports and charts
- Overlay chat window with fixed positioning\n\n### 11.3 Visual Details
- Rounded corners (4px) for cards and buttons
- Subtle shadows for elevated elements
- Clear visual hierarchy with distinct section headers
- Icon-based navigation for quick access
- Status badges with color coding for task states
- Dropdown menus for user actions and filters
- Circular profile picture thumbnails with2px border\n- Toggle buttons for switching between grid and list views in user management
- Chat icon with notification badge overlay in header
- Color-coded user names in task assignment sections with clear visual distinction
- Checkbox interface for multi-user task assignment in edit task form

### 11.4 Header Display
- Application logo (Applogo.png) displayed in header
- User name and designation displayed in header
- Official designation not displayed in header
- Navigation menu and action icons in header
- Profile picture thumbnail in header for quick access to user profile
\n### 11.5 Color Indicator Legend
- **Display Location**: Prominent position at the top of all task-related pages and interfaces
- **Legend Format**: Horizontal bar with color-coded indicators and descriptions
- **Indicator Items**:
  - Dark Pink square/circle with label: 'Task Initiated - User has started working on the task'
  - Dark Green square/circle with label: 'Completed - User has finished their portion of the task'
  - Dark Red square/circle with label: 'Pending - User has not yet initiated or completed the task'
- **Visual Design**: Clean, compact layout with adequate spacing between indicators
- **Visibility**: Always visible on task list pages, task detail pages, and dashboard
- **Responsive Design**: Adapts to different screen sizes while maintaining readability
- **User Convenience**: Provides instant reference for understanding user status color coding without needing to memorize meanings