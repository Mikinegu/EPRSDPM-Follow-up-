# Entoto Peacock Manpower Follow-Up Sheet

## Overview

The Entoto Peacock Manpower Follow-Up Sheet is a Next.js 14 web application designed to track staff and daily laborer (DL) attendance across multiple construction or service sites. The application provides a simple form-based interface for recording daily attendance and a dashboard for viewing historical attendance records and individual worker attendance patterns.

The system manages multiple sites (e.g., Entoto Main, Peacock Villa, Entoto Hills, Forest Lodge), each with their own roster of staff members and daily laborers. Users can submit daily attendance forms and view aggregated attendance data through various filtering options.

## Recent Changes

**November 12, 2025**: Initial project creation
- Set up Next.js 14 with App Router, TypeScript, and Tailwind CSS
- Configured Prisma ORM with PostgreSQL database (Replit managed)
- Created attendance tracking system with main form and dashboard
- Implemented API routes for data management
- Seeded database with 4 sample sites, 18 staff members, and 10 DL workers

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: Next.js 14 with App Router
- The application uses Next.js 14's App Router pattern for file-based routing
- Client-side interactivity is implemented using React hooks (`useState`, `useEffect`)
- Pages are marked with `'use client'` directive for client-side rendering where interactivity is needed

**Styling**: Tailwind CSS
- Utility-first CSS framework for rapid UI development
- Custom CSS variables defined in `globals.css` for theming (`--background`, `--foreground`)
- Configuration in `tailwind.config.ts` includes content paths for all components and pages
- Green accent color (#10b981) for present status, responsive grid layouts

**UI Components**:
- Toast notifications using Sonner library for user feedback
- Form-based attendance tracking interface on the main page with toggle buttons
- Dashboard with tabbed interface for viewing different data perspectives (forms, staff, DL)
- Responsive design works on both mobile and desktop

**TypeScript**: Full TypeScript implementation
- Strict type checking enabled in `tsconfig.json`
- Interfaces defined for all major data structures (Staff, DL, Site, AttendanceRecord)
- Path aliases configured (`@/*`) for cleaner imports

### Backend Architecture

**API Routes**: Next.js API Routes (serverless functions)
- `/api/sites` - Retrieves all sites with their associated staff and DLs
- `/api/attendance` - POST endpoint for submitting attendance records, GET for retrieving records
- `/api/dashboard` - GET endpoint with query parameters for filtered data views (staff/DL attendance with site and date filters)

**Database**: Prisma ORM with PostgreSQL
- Prisma Client for type-safe database queries
- PostgreSQL database managed by Replit (Neon-backed)
- Schema includes core entities: Site, Staff, DL, AttendanceRecord, StaffAttendance, DLAttendance
- Relationship model: Sites have many Staff and DLs; AttendanceRecords link to Sites and contain multiple StaffAttendance and DLAttendance records

**Data Model Design**:
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

**Build Process**:
1. Install dependencies
2. Generate Prisma client (postinstall hook)
3. Build Next.js application
4. Deploy serverless functions and static assets

## External Dependencies

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
- Seed data provides development and testing foundation

## Key Features

### Main Attendance Form (/)
- Auto-filled date (editable)
- Site location dropdown
- Dynamic loading of staff and DL lists based on selected site
- Toggle buttons for marking attendance (green = present, gray = absent)
- Real-time counters showing present/total for staff and DLs
- Form submission with success notification
- Form reset after submission

### Dashboard (/dashboard)
- **Form List Tab**: Shows all submitted attendance records with date, site, and present/absent counts
- **Staff Attendance Tab**: Person-based view showing each staff member's attendance history
- **DL Attendance Tab**: Person-based view showing each DL's attendance history
- Filtering by date and site across all tabs
- Responsive table layouts with hover effects
- Loading states for better UX

## Future Enhancements (Suggested by Architect)

1. Add unique constraint for (siteId, date) to prevent duplicate daily submissions
2. Implement server-side validation of attendance payloads
3. Add automated tests for API endpoints and UI flows
4. Implement CSV/JSON export functionality
5. Add user authentication for admin access
