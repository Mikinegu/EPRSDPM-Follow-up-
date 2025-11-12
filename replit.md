# Entoto Peacock Manpower Follow-Up Sheet

## Overview

The Entoto Peacock Manpower Follow-Up Sheet is a Next.js 14 web application designed to track staff and daily laborer (DL) attendance across multiple construction or service sites. The application provides a simple form-based interface for recording daily attendance and a protected admin panel for viewing historical data and managing personnel.

The system manages multiple sites (e.g., Entoto Main, Peacock Villa, Entoto Hills, Forest Lodge), each with their own roster of staff members and daily laborers. Users can submit daily attendance forms, and administrators can access the admin panel to view data and manage sites, staff, and DL workers.

## Recent Changes

**November 12, 2025**: Initial project creation and admin panel implementation
- Set up Next.js 14 with App Router, TypeScript, and Tailwind CSS
- Configured Prisma ORM with PostgreSQL database (Replit managed)
- Created attendance tracking system with main form and admin panel
- Implemented NextAuth.js authentication for admin access
- Added user management with password hashing using bcryptjs
- Created admin panel with CRUD operations for sites, staff, and DL workers
- Implemented API routes for data management and admin operations
- Seeded database with 4 sample sites, 18 staff members, 10 DL workers, and default admin user

## User Preferences

Preferred communication style: Simple, everyday language.

## Admin Access

**Default Admin Credentials:**
- Email: admin@entoto.com
- Password: admin123

**Note:** Change the password after first login by creating a password change feature or creating a new admin user.

## System Architecture

### Frontend Architecture

**Framework**: Next.js 14 with App Router
- The application uses Next.js 14's App Router pattern for file-based routing
- Client-side interactivity is implemented using React hooks (`useState`, `useEffect`, `useSession`)
- Pages are marked with `'use client'` directive for client-side rendering where interactivity is needed

**Styling**: Tailwind CSS
- Utility-first CSS framework for rapid UI development
- Custom CSS variables defined in `globals.css` for theming (`--background`, `--foreground`)
- Configuration in `tailwind.config.ts` includes content paths for all components and pages
- Green accent color (#10b981) for present status, blue for admin actions, responsive grid layouts

**UI Components**:
- Toast notifications using Sonner library for user feedback
- Form-based attendance tracking interface on the main page with toggle buttons
- Admin panel with tabbed interface for viewing different data perspectives and management tools
- Modal dialogs for add/edit operations in admin panel
- Responsive design works on both mobile and desktop

**TypeScript**: Full TypeScript implementation
- Strict type checking enabled in `tsconfig.json`
- Interfaces defined for all major data structures (Staff, DL, Site, AttendanceRecord, User)
- Path aliases configured (`@/*`) for cleaner imports

### Authentication Architecture

**NextAuth.js**: Session-based authentication system
- Credentials provider for email/password authentication
- JWT strategy for session management
- Middleware protection for `/admin` routes
- Password hashing with bcryptjs (salt rounds: 10)
- AuthProvider wrapper for SessionProvider in root layout
- Server-side session validation in API routes

**Security Features**:
- Protected admin routes via middleware
- Server-side authentication checks in API endpoints
- Hashed passwords stored in database
- AUTH_SECRET environment variable for token signing
- CSRF protection built into NextAuth.js

### Backend Architecture

**API Routes**: Next.js API Routes (serverless functions)

Public API Routes:
- `/api/sites` - Retrieves all sites with their associated staff and DLs
- `/api/attendance` - POST endpoint for submitting attendance records, GET for retrieving records
- `/api/dashboard` - GET endpoint with query parameters for filtered data views
- `/api/auth/[...nextauth]` - NextAuth.js authentication endpoints (login, logout, session)

Protected Admin API Routes (require authentication):
- `/api/admin/staff` - POST (create), PUT (update), DELETE staff members
- `/api/admin/dl` - POST (create), PUT (update), DELETE DL workers
- `/api/admin/sites` - POST (create), PUT (update), DELETE sites

**Database**: Prisma ORM with PostgreSQL
- Prisma Client for type-safe database queries
- PostgreSQL database managed by Replit (Neon-backed)
- Schema includes core entities: User, Site, Staff, DL, AttendanceRecord, StaffAttendance, DLAttendance
- Relationship model: 
  - Users for admin authentication
  - Sites have many Staff and DLs
  - AttendanceRecords link to Sites and contain multiple StaffAttendance and DLAttendance records
  - Cascade deletes ensure data integrity

**Data Model Design**:
- **User**: Admin users with email, hashed password, name, and role
- **Site**: Represents physical locations (Entoto Main, Peacock Villa, etc.)
- **Staff/DL**: Workers assigned to specific sites
- **AttendanceRecord**: Daily attendance submission per site with date
- **StaffAttendance/DLAttendance**: Individual attendance entries (present/absent) linked to workers and attendance records

**Singleton Pattern**: Database connection
- Prisma Client instantiated as singleton in `lib/prisma.ts`
- Global reference prevents multiple instances in development (hot reloading)
- Conditional instantiation based on `NODE_ENV`

### Deployment Configuration

**Platform**: Vercel-compatible
- Custom port configuration (5000) for development and production
- Host binding to `0.0.0.0` for network accessibility
- Build process includes Prisma client generation (`prisma generate`)
- Postinstall hook ensures Prisma client is generated after dependency installation

**Environment Variables**:
- `DATABASE_URL` - PostgreSQL connection string (provided by Replit)
- `AUTH_SECRET` - Secret for NextAuth.js token signing (required)
- `SESSION_SECRET` - Session secret (provided by Replit)
- Additional Postgres credentials: `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`

**Build Process**:
1. Install dependencies
2. Generate Prisma client (postinstall hook)
3. Build Next.js application
4. Deploy serverless functions and static assets

## External Dependencies

### Authentication & Security
- **NextAuth.js** (v5 beta): Authentication for Next.js with credentials provider
- **bcryptjs**: Password hashing library
- **Zod**: Schema validation for credentials

### Database
- **Prisma** (v5.7.1): ORM for database management
  - `@prisma/client`: Runtime query builder
  - `prisma`: CLI for migrations and schema management
- **Database Provider**: PostgreSQL (Replit managed, Neon-backed)

### UI Framework & Styling
- **Next.js** (v14.2.18): React framework with App Router, API routes, and server-side rendering
- **React** (v18.3.1): UI library
- **Tailwind CSS** (v3.4.0): Utility-first CSS framework
- **Sonner** (v1.4.0): Toast notification library for user feedback

### Development Tools
- **TypeScript** (v5): Type safety and developer experience
- **ESLint** (v8): Code linting with Next.js configuration
- **PostCSS** (v8.4.32): CSS processing for Tailwind
- **Autoprefixer** (v10.4.16): Automatic vendor prefixing for CSS

### Seed Data
- Database seeding script (`prisma/seed.ts`) populates initial data:
  - 4 sites with realistic names
  - Staff members (3-6 per site)
  - Daily laborers/drivers (2-3 per site)
- Admin user seeding script (`scripts/create-admin.ts`):
  - Default admin user for initial access
  - Hashed password for security

## Key Features

### Main Attendance Form (/)
Public-facing form for daily attendance submission:
- Auto-filled date (editable)
- Site location dropdown
- Dynamic loading of staff and DL lists based on selected site
- Toggle buttons for marking attendance (green = present, gray = absent)
- Real-time counters showing present/total for staff and DLs
- Form submission with success notification
- Form reset after submission
- Link to Admin Panel in header

### Admin Panel (/admin)
Protected administrative interface requiring authentication:

**Authentication:**
- Login page at `/login` with email/password form
- Session management with NextAuth.js
- Automatic redirect to login for unauthenticated users
- Logout functionality

**Dashboard Tabs:**
1. **Attendance Records Tab**: 
   - Shows all submitted attendance records
   - Displays date, site, staff present/absent counts, DL present/absent counts
   - Filter by date and site
   
2. **Staff Management Tab**: 
   - View all staff members with their assigned sites
   - Add new staff members
   - Edit existing staff (name, site assignment)
   - Delete staff members
   - Filter by date and site
   
3. **DL Management Tab**: 
   - View all DL workers with their assigned sites
   - Add new DL workers
   - Edit existing DLs (name, site assignment)
   - Delete DL workers
   - Filter by date and site
   
4. **Site Management Tab**: 
   - View all sites with staff/DL counts
   - Add new sites
   - Edit site names
   - Delete sites (cascades to staff/DL/attendance)

**UI Features:**
- Responsive table layouts with hover effects
- Modal dialogs for add/edit operations
- Loading states for better UX
- Confirmation dialogs for delete operations
- Filter controls for date and site
- Clear filters button
- Welcome message with admin name
- Logout and navigation buttons

## Security Considerations

1. **Password Security**: Passwords hashed with bcryptjs before storage
2. **Session Security**: JWT-based sessions with AUTH_SECRET
3. **Route Protection**: Middleware protects all `/admin` routes
4. **API Protection**: Server-side authentication checks in admin API routes
5. **CSRF Protection**: Built into NextAuth.js
6. **Environment Variables**: Sensitive data stored in environment variables

## Future Enhancements (Suggested)

1. Add unique constraint for (siteId, date) to prevent duplicate daily submissions
2. Implement server-side validation of attendance payloads
3. Add automated tests for API endpoints and UI flows
4. Implement CSV/JSON export functionality for reports
5. Add user management interface (create/delete admin users)
6. Implement password change functionality
7. Add role-based access control (admin, viewer, etc.)
8. Add attendance analytics and reporting dashboards
9. Implement audit logging for admin actions
10. Add email notifications for attendance submissions
