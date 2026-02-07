# PARKPAL - Complete System Architecture

## System Overview

PARKPAL is a comprehensive web-based parking management system built with modern cloud-native architecture using:
- **Frontend**: React 18 with Vite, TypeScript, Tailwind CSS
- **Backend**: Supabase Edge Functions (Serverless)
- **Database**: Supabase PostgreSQL with Row-Level Security
- **Authentication**: Supabase Auth (JWT-based)
- **Real-time**: Supabase real-time subscriptions

---

## High-Level System Design

```
┌─────────────────────────────────────────────────────────────────┐
│                        PARKPAL APPLICATION                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐         ┌──────────────────┐              │
│  │   React Frontend │◄────────┤  React Router    │              │
│  │   (Vite + TS)    │         │  (Client-side)   │              │
│  └────────┬─────────┘         └──────────────────┘              │
│           │                                                       │
│           │ (HTTP/REST)                                          │
│           ▼                                                       │
│  ┌──────────────────────────────────────────────────┐           │
│  │      Supabase Client (@supabase/supabase-js)    │           │
│  │  - Auth Management                              │           │
│  │  - Database Operations                          │           │
│  │  - Real-time Subscriptions                      │           │
│  └────────┬────────────────────────────────────────┘           │
│           │                                                       │
│           │ (HTTPS/REST API)                                    │
│           ▼                                                       │
│  ┌──────────────────────────────────────────────────┐           │
│  │         Supabase Backend Services                │           │
│  │  ┌──────────────────────────────────────────┐   │           │
│  │  │  PostgreSQL Database (RLS Enabled)       │   │           │
│  │  │  - Users & Profiles                      │   │           │
│  │  │  - Parking Locations & Slots             │   │           │
│  │  │  - Bookings & Payments                   │   │           │
│  │  └──────────────────────────────────────────┘   │           │
│  │  ┌──────────────────────────────────────────┐   │           │
│  │  │  Authentication (JWT Tokens)             │   │           │
│  │  │  - Sign Up / Login                       │   │           │
│  │  │  - Session Management                    │   │           │
│  │  └──────────────────────────────────────────┘   │           │
│  │  ┌──────────────────────────────────────────┐   │           │
│  │  │  Row Level Security (RLS)                │   │           │
│  │  │  - User-based access control             │   │           │
│  │  │  - Role-based policies                   │   │           │
│  │  └──────────────────────────────────────────┘   │           │
│  └──────────────────────────────────────────────────┘           │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Frontend Architecture

### File Structure
```
src/
├── contexts/
│   └── AuthContext.tsx              # Authentication state & methods
├── services/
│   ├── parkingService.ts            # Parking location APIs
│   ├── bookingService.ts            # Booking management APIs
│   ├── paymentService.ts            # Payment processing APIs
│   └── adminService.ts              # Admin dashboard APIs
├── components/
│   ├── Navbar.tsx                   # Navigation bar
│   ├── ParkingCard.tsx              # Parking display card
│   └── ProtectedRoute.tsx           # Route protection component
├── pages/
│   ├── LoginPage.tsx                # User login
│   ├── RegisterPage.tsx             # User registration
│   ├── DashboardPage.tsx            # User dashboard
│   ├── SearchPage.tsx               # Parking search
│   ├── ParkingDetailsPage.tsx       # Parking info & slots
│   ├── BookingPage.tsx              # Booking confirmation
│   ├── BookingDetailsPage.tsx       # Booking view
│   ├── OwnerParkingsPage.tsx        # Owner management
│   └── AdminPage.tsx                # Admin dashboard
├── lib/
│   └── supabase.ts                  # Supabase client setup
├── App.tsx                          # Main app with routing
└── main.tsx                         # Entry point
```

### Key Components

#### AuthContext (src/contexts/AuthContext.tsx)
- Manages global authentication state
- Provides `useAuth()` hook for all components
- Handles sign up, login, logout
- Syncs with Supabase Auth
- Tracks user profile and role

#### Service Layer (src/services/)
- **parkingService**: Search, filter, manage parking locations
- **bookingService**: Create, view, cancel bookings
- **paymentService**: Process simulated payments
- **adminService**: System statistics and user management

#### Pages
- **LoginPage/RegisterPage**: Authentication UI with role selection
- **SearchPage**: City-based parking search with filters
- **ParkingDetailsPage**: View parking details and available slots
- **BookingPage**: Select time slot and payment method
- **DashboardPage**: View user bookings and statistics
- **AdminPage**: System overview, user management, parking approvals
- **OwnerParkingsPage**: Owner's parking management

---

## Database Schema

### Tables Overview

#### users
```sql
- id (uuid, PK)
- auth_id (uuid, FK → auth.users)
- email (text, unique)
- full_name (text)
- phone_number (text)
- role (enum: 'user', 'owner', 'admin')
- is_active (boolean)
- is_blocked (boolean)
- avatar_url (text)
- rating (numeric 0-5)
- total_bookings (integer)
- created_at, updated_at (timestamptz)
```

#### parking_locations
```sql
- id (uuid, PK)
- owner_id (uuid, FK → users)
- name (text)
- address, city, state, zip_code (text)
- latitude, longitude (numeric)
- total_slots (integer)
- available_slots (integer)
- price_per_hour (numeric)
- description (text)
- amenities (jsonb array)
- operating_hours (jsonb)
- is_approved (boolean)
- is_active (boolean)
- average_rating (numeric 0-5)
- total_reviews (integer)
- created_at, updated_at (timestamptz)
```

#### parking_slots
```sql
- id (uuid, PK)
- parking_location_id (uuid, FK)
- slot_number (text)
- slot_type (enum: 'standard', 'compact', 'premium', 'handicap')
- is_available (boolean)
- is_active (boolean)
- created_at, updated_at (timestamptz)
- UNIQUE(parking_location_id, slot_number)
```

#### bookings
```sql
- id (uuid, PK)
- user_id (uuid, FK)
- parking_location_id (uuid, FK)
- slot_id (uuid, FK)
- start_time, end_time (timestamptz)
- status (enum: 'active', 'completed', 'cancelled')
- total_duration (numeric hours)
- total_cost (numeric)
- vehicle_number (text)
- notes (text)
- created_at, updated_at (timestamptz)
```

#### payments
```sql
- id (uuid, PK)
- booking_id (uuid, FK, unique)
- user_id (uuid, FK)
- amount (numeric)
- payment_method (enum: 'card', 'wallet', 'upi')
- status (enum: 'pending', 'success', 'failed')
- transaction_id (text, unique)
- payment_gateway (text)
- metadata (jsonb)
- created_at, updated_at (timestamptz)
```

#### reviews
```sql
- id (uuid, PK)
- user_id (uuid, FK)
- parking_location_id (uuid, FK)
- booking_id (uuid, FK)
- rating (integer 1-5)
- comment (text)
- created_at, updated_at (timestamptz)
```

### Relationships
```
users (1) ──── (many) parking_locations
         ──── (many) bookings
         ──── (many) reviews

parking_locations (1) ──── (many) parking_slots
                    ──── (many) bookings
                    ──── (many) reviews

parking_slots (1) ──── (many) bookings

bookings (1) ──── (1) payments
```

### Row Level Security (RLS)

**users table**:
- Users can view/update their own profile
- Admins can view and update all user data
- Admins can block/unblock users

**parking_locations table**:
- Everyone can view approved parkings
- Owners can view their own parkings (unapproved too)
- Owners can create parkings
- Admins can approve/reject parkings

**parking_slots table**:
- Public view for approved parkings
- Owners can manage their parking slots
- Users can view slot availability

**bookings table**:
- Users can view their own bookings
- Owners can view bookings for their parkings
- Admins can view all bookings
- Users can create and cancel bookings

**payments table**:
- Users can view their own payments
- Users can create payments for their bookings
- Only owners/admins can access payment aggregates

---

## Authentication Flow

```
1. User Registration
   ├─ Input: email, password, full_name, role
   ├─ Supabase Auth creates user
   ├─ Profile created in users table
   └─ JWT token issued

2. User Login
   ├─ Input: email, password
   ├─ Supabase Auth validates
   ├─ JWT token issued
   └─ User profile loaded from DB

3. Session Management
   ├─ AuthContext listens for auth state changes
   ├─ JWT token stored in localStorage
   ├─ Automatic refresh on page reload
   └─ Real-time sync across tabs

4. Authorization (via RLS)
   ├─ JWT included in all DB queries
   ├─ Supabase verifies user_id from JWT
   ├─ RLS policies enforce access rules
   └─ Unauthorized queries return no rows
```

---

## Booking Logic

### Booking Process
```
1. Search Parkings
   └─ User searches by city and price filter
      └─ Database returns matching approved parkings

2. View Parking Details
   └─ User views parking location and available slots
      └─ Check slot availability for requested time range
         └─ Query bookings table for conflicts

3. Select Time Slot
   └─ User chooses start/end time and slot
      └─ Calculate duration and total cost
      └─ Verify slot is still available

4. Create Booking
   └─ Create booking record in database
      └─ Status: 'active'
      └─ Slot marked as unavailable for that time range

5. Process Payment
   └─ Simulated payment processing
      └─ Create payment record
      └─ Status: 'success' or 'failed'
      └─ If failed: cancel booking

6. Booking Confirmation
   └─ Display confirmation with details
   └─ Send to booking details page
```

### Slot Availability Algorithm
```
SELECT * FROM bookings
WHERE slot_id = ?
  AND status = 'active'
  AND end_time > requested_start_time
  AND start_time < requested_end_time

IF (count > 0) THEN
  Slot is UNAVAILABLE
ELSE
  Slot is AVAILABLE
END IF
```

### Pricing Calculation
```
Duration (hours) = (end_time - start_time) / 60
Total Cost = Duration × Price Per Hour
```

---

## User Roles & Permissions

### 1. User (Parking Customer)
**Capabilities**:
- Search parkings by city and price
- View parking details and available slots
- Create bookings for specific time ranges
- View booking history
- Make payments (simulated)
- Write reviews (after completed booking)
- View personal profile

**Restrictions**:
- Cannot create parking locations
- Cannot approve parkings
- Cannot manage other users

### 2. Owner (Parking Provider)
**Capabilities**:
- Create new parking locations
- Manage parking details (name, price, amenities)
- Define total slots
- View all bookings for their parkings
- View booking calendar
- See revenue statistics
- Edit parking information

**Restrictions**:
- Cannot approve their own parkings
- Cannot manage other owner's parkings
- Cannot access admin panel

### 3. Admin
**Capabilities**:
- View all users, owners, parkings
- Approve/reject parking listings
- Block/unblock users
- View system statistics
- Access complete booking records
- View payment analytics
- Monitor system health

**Restrictions**:
- Generally read-only access
- Can modify user status and parking approval

---

## API Design

### Authentication APIs
```
POST /auth/signup
  Body: { email, password, fullName, role }
  Returns: { user, session }

POST /auth/signin
  Body: { email, password }
  Returns: { user, session }

POST /auth/signout
  Returns: { success }

GET /auth/session
  Returns: { user, profile }
```

### Parking APIs
```
GET /parkings/search?city=&maxPrice=
  Returns: [ ParkingLocation ]

GET /parkings/:id
  Returns: ParkingLocation

GET /parkings/:id/slots
  Returns: [ ParkingSlot ]

POST /parkings
  Body: ParkingLocation
  Returns: ParkingLocation

PUT /parkings/:id
  Body: Partial<ParkingLocation>
  Returns: ParkingLocation

GET /parkings/:id/slots/available?start=&end=
  Returns: [ ParkingSlot ]
```

### Booking APIs
```
POST /bookings
  Body: { parkingId, slotId, startTime, endTime, vehicleNumber }
  Returns: Booking

GET /bookings/my
  Returns: [ Booking ]

GET /bookings/:id
  Returns: Booking

PUT /bookings/:id/cancel
  Returns: Booking

GET /parkings/:parkingId/bookings
  Returns: [ Booking ]
```

### Payment APIs
```
POST /payments
  Body: { bookingId, amount, paymentMethod }
  Returns: Payment

GET /payments/my
  Returns: [ Payment ]

GET /payments/booking/:bookingId
  Returns: Payment
```

### Admin APIs
```
GET /admin/stats
  Returns: AdminStats

GET /admin/users
  Returns: [ User ]

PUT /admin/users/:id/block
  Returns: User

GET /admin/parkings/pending
  Returns: [ ParkingLocation ]

PUT /admin/parkings/:id/approve
  Returns: ParkingLocation

PUT /admin/parkings/:id/reject
  Returns: ParkingLocation
```

---

## Payment Processing

### Simulated Payment Flow
```
1. User initiates payment
2. Generate transaction ID: TXN-{timestamp}-{random}
3. Simulate payment (90% success rate)
4. Create payment record with status
5. If success:
   └─ Booking remains active
   └─ Display confirmation
6. If failed:
   └─ Cancel booking automatically
   └─ Prompt user to retry
```

### Payment Methods (Supported)
- Credit/Debit Card
- Digital Wallet
- UPI

**Note**: Payment processing is simulated for demonstration. In production, integrate with Stripe or similar gateway.

---

## Security Measures

### 1. Authentication Security
- JWT tokens issued by Supabase Auth
- Tokens include user_id and role
- Automatic token refresh
- Secure session storage

### 2. Database Security
- Row Level Security (RLS) on all tables
- Auth-based access control via `auth.uid()`
- Role-based policies
- Ownership verification before modifications

### 3. API Security
- All endpoints behind authentication
- Role validation on protected routes
- Input validation on forms
- SQL injection prevention via parameterized queries

### 4. Data Validation
- Email format validation
- Time range validation (end > start)
- Price validation (must be > 0)
- Slot availability verification

### 5. Error Handling
- Try-catch blocks in all services
- User-friendly error messages
- Detailed server-side logging
- No sensitive data in error responses

---

## Performance Optimizations

### 1. Database
- Indexes on frequently queried columns:
  - `users.email`, `users.role`
  - `parking_locations.city`, `parking_locations.owner_id`
  - `parking_slots.parking_location_id`
  - `bookings.user_id`, `bookings.parking_location_id`
  - `bookings.start_time`, `bookings.end_time`

### 2. Frontend
- Code splitting via Vite
- Component lazy loading
- Memoization for expensive operations
- Efficient state management via Context API

### 3. Caching
- Service layer caches parking data temporarily
- Booking cache invalidation on updates
- LocalStorage for auth tokens

---

## Scalability Considerations

### Short Term (Current)
- Supabase auto-scaling handles database
- Vercel/similar hosts static frontend
- Real-time updates via Supabase subscriptions

### Medium Term (100K+ users)
- Implement payment service integration (Stripe)
- Add review aggregation service
- Cache frequently accessed data
- Implement rate limiting

### Long Term (1M+ users)
- Multi-region database replication
- CDN for static assets
- Message queue for async operations
- Separate analytics database
- Microservices architecture

---

## Future Enhancements

### 1. Features
- Real-time parking availability maps
- User ratings and reviews system
- Booking history export
- Monthly subscription plans
- Cancellation policies
- Promotions and discount codes

### 2. Business
- Commission/revenue sharing for owners
- Parking owner analytics dashboard
- Demand-based dynamic pricing
- Premium tier for owners

### 3. Technology
- Mobile app (React Native)
- SMS/Email notifications
- Payment gateway integration
- Advanced analytics
- ML-based pricing recommendations

### 4. Compliance
- GDPR compliance
- Data export functionality
- Right to be forgotten
- Terms of service
- Privacy policy

---

## Deployment Guide

### Frontend Deployment (Vercel/Netlify)
```bash
1. Build: npm run build
2. Output directory: dist/
3. Environment variables:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY
4. Deploy dist/ folder
```

### Backend (Supabase)
```bash
1. Database migrations already applied
2. RLS policies configured
3. Edge Functions deployed
4. Auth configured
```

### Environment Variables
```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

---

## Monitoring & Maintenance

### Key Metrics
- User registration rate
- Booking completion rate
- Payment success rate
- Average booking duration
- Peak usage times

### Alerts
- High payment failure rate
- Database connection errors
- Authentication failures
- Slow API responses

### Regular Maintenance
- Monitor database performance
- Review and optimize queries
- Update dependencies
- Security patches
- User feedback review

---

## Support & Documentation

For development setup:
```bash
npm install
npm run dev
```

For production build:
```bash
npm run build
npm run preview
```

Type checking:
```bash
npm run typecheck
```

---

## Conclusion

PARKPAL is a production-ready parking management system demonstrating:
- Modern cloud-native architecture
- Secure authentication and authorization
- Scalable database design with RLS
- Professional frontend development
- Role-based access control
- Real-world business logic

The system is designed to be maintainable, scalable, and secure for deployment in production environments.
