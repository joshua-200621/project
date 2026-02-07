# PARKPAL - Quick Start Guide

## Project Overview

PARKPAL is a complete parking management system with:
- User authentication and profiles
- Parking search and booking
- Payment processing (simulated)
- Admin dashboard
- Parking owner management

## Setup

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation
```bash
npm install
npm run build
```

## Running Locally

```bash
npm run dev
```

Visit `http://localhost:5173`

## Project Structure

```
src/
├── contexts/AuthContext.tsx      # Global auth state
├── services/                      # Database operations
│   ├── parkingService.ts
│   ├── bookingService.ts
│   ├── paymentService.ts
│   └── adminService.ts
├── pages/                         # Route pages
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── DashboardPage.tsx
│   ├── SearchPage.tsx
│   ├── ParkingDetailsPage.tsx
│   ├── BookingPage.tsx
│   ├── BookingDetailsPage.tsx
│   ├── AdminPage.tsx
│   └── OwnerParkingsPage.tsx
├── components/                    # Reusable UI
│   ├── Navbar.tsx
│   ├── ParkingCard.tsx
│   └── ProtectedRoute.tsx
├── App.tsx                        # Routing setup
└── main.tsx                       # Entry point
```

## Key Features

### 1. Authentication
- User registration (User or Owner role)
- Secure login/logout
- JWT-based sessions
- Automatic profile loading

### 2. Parking Search
- Search by city
- Filter by price
- View parking details
- Check real-time availability

### 3. Booking System
- Select time slot
- View pricing calculation
- Choose payment method
- Get confirmation

### 4. User Dashboard
- View all bookings
- Check booking status
- Cancel active bookings
- See booking history

### 5. Owner Panel
- Create parking locations
- Manage slots
- View bookings
- Track revenue

### 6. Admin Dashboard
- View all users
- Approve parking locations
- Block/unblock users
- System statistics

## User Roles

### User (Customer)
1. Register with email/password
2. Search parkings by city
3. View parking details
4. Book a parking slot
5. Make payment
6. View booking history

### Owner (Parking Provider)
1. Register as Owner
2. Create parking locations
3. Manage parking details
4. Set pricing and slots
5. View all bookings
6. Check revenue

### Admin
1. Built-in admin account (contact developer)
2. Approve parking listings
3. Manage users
4. View system metrics

## Database

### Tables
- **users**: User profiles and auth info
- **parking_locations**: Parking properties
- **parking_slots**: Individual parking spaces
- **bookings**: Parking reservations
- **payments**: Payment transactions
- **reviews**: User reviews

### Security
All tables have Row Level Security (RLS) enabled:
- Users can only access their own data
- Owners manage only their parkings
- Admins have full access

## API Services

### parkingService
```typescript
searchParkings(city, maxPrice)    // Search parkings
getParkingById(id)                 // Get parking details
getSlots(parkingId)                // Get slots
getAvailableSlots(parkingId, start, end)  // Check availability
createParking(data)                // Create new parking
updateParking(id, data)            // Update parking
```

### bookingService
```typescript
createBooking(parkingId, slotId, start, end, vehicle, price)
getUserBookings()                  // Get user's bookings
getBookingById(id)                 // Get booking details
cancelBooking(id)                  // Cancel booking
getParkingBookings(parkingId)      // Get owner's bookings
```

### paymentService
```typescript
processPayment(bookingId, amount, method)  // Process payment
getPaymentByBooking(bookingId)    // Get payment status
getUserPayments()                 // Get user's payments
```

### adminService
```typescript
getDashboardStats()               // System statistics
getAllUsers(limit)                // Get all users
blockUser(userId)                 // Block a user
unblockUser(userId)              // Unblock a user
```

## Authentication Context

Use the `useAuth()` hook in any component:

```typescript
import { useAuth } from './contexts/AuthContext';

function MyComponent() {
  const {
    user,                    // Supabase user object
    profile,                 // User profile from DB
    isAuthenticated,         // Is user logged in
    loading,                 // Loading state
    signUp,                  // Register
    signIn,                  // Login
    signOut,                 // Logout
    hasRole,                 // Check role
    error                    // Error message
  } = useAuth();

  return (
    <div>
      {profile?.full_name}
      {profile?.role}
    </div>
  );
}
```

## Protected Routes

Routes are protected with role-based access:

```typescript
// Any authenticated user
<ProtectedRoute>
  <DashboardPage />
</ProtectedRoute>

// Specific role only
<ProtectedRoute requiredRoles={['admin']}>
  <AdminPage />
</ProtectedRoute>
```

## Sample User Test Data

### Test as User
```
Email: user@test.com
Password: Test1234!
Role: User
```

### Test as Owner
```
Email: owner@test.com
Password: Test1234!
Role: Owner
```

### Test as Admin
```
Email: admin@parkpal.com
Password: Admin1234!
Role: Admin
```

## Payment Flow

1. User enters vehicle number
2. Selects payment method (Card/Wallet/UPI)
3. Views total cost
4. Clicks "Confirm & Pay"
5. Simulated payment processes
6. 90% success rate (for demo)
7. Booking confirmation displayed

## Styling

Using Tailwind CSS classes:
- Colors: Blue, Green, Red, Gray
- Spacing: 4px, 8px, 16px, etc.
- Responsive: sm:, md:, lg: breakpoints
- Utilities: hover:, focus:, disabled:, etc.

## Environment Variables

Required in `.env`:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

These are already configured in the project.

## Common Tasks

### Add a new page
1. Create file in `src/pages/NewPage.tsx`
2. Add route in `src/App.tsx`
3. Protect with `<ProtectedRoute>` if needed

### Add a new service
1. Create file in `src/services/newService.ts`
2. Export functions for database operations
3. Use in components/pages with `await`

### Style a component
1. Use Tailwind classes
2. Keep classes under 40 chars per line
3. Group related utilities
4. Test responsive breakpoints

## Troubleshooting

### Can't login
- Check email and password
- Ensure account exists (register first)
- Check browser console for errors

### Parking not showing
- Ensure parking is "Approved" by admin
- Check city spelling
- Try different price range

### Booking fails
- Verify slot availability
- Check time range (end > start)
- Ensure payment method selected

### Database errors
- Check Row Level Security policies
- Verify user_id in profile table
- Check auth.uid() in RLS policies

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run typecheck    # Type check
```

## Performance Tips

- Memoize expensive components
- Lazy load routes if needed
- Cache search results
- Optimize database queries
- Use Tailwind purge

## Security Best Practices

- Never expose Supabase keys in client code
- Always validate user input
- Check user role before operations
- Use HTTPS in production
- Keep dependencies updated

## Support

For issues:
1. Check browser console for errors
2. Review ARCHITECTURE.md for design
3. Check service layer for API calls
4. Verify database migrations

## Next Steps

- Deploy to Vercel
- Connect to real Stripe account
- Add email notifications
- Implement mobile app
- Add advanced analytics

---

**Happy parking! 🚗**
