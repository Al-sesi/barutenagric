# Barutem Agricultural Portal - Admin Setup Guide

## Overview

This project consists of two separate applications:
1. **Public Site** - Marketing pages accessible to everyone (Home, Produce, Process, Contact)
2. **Admin Portal** - Secure dashboard at `/barutehouse` for managing orders and farmers

## Setting Up Admin Access

### Step 1: Access the Admin Login

The admin portal is accessible at a secret URL:
- **Development**: `http://localhost:8080/barutehouse`
- **Production**: `https://yourdomain.com/barutehouse`

**Important:** There are NO links to this page from the public site. You must share this URL directly with authorized administrators.

### Step 2: Create Admin Accounts

**Primary General Admin Account:**
- Email: `Barutemagriculture@gmail.com`
- Password: `Barutem1010`

To set up this account:
1. Visit `/barutehouse` and sign up with the above credentials
2. After signing up, assign the `general_admin` role (see Step 3)

For additional admin accounts:
1. **For testing purposes**, you can create accounts through the login page
2. **For production**, create accounts and then assign roles manually

### Step 3: Assign Roles

After creating a user account, you need to assign them a role in the backend:

#### Using SQL

Run this query in the Cloud Database section:

```sql
-- For a General Admin (full access to all features)
INSERT INTO public.user_roles (user_id, role)
VALUES ('USER_ID_HERE', 'general_admin');

-- For a Sub-Admin (district-restricted access)
INSERT INTO public.user_roles (user_id, role, district)
VALUES ('USER_ID_HERE', 'sub_admin', 'Ilesha Baruba');
```

Replace `USER_ID_HERE` with the actual user ID from the auth system.

### Step 4: Test the System

1. **Test General Admin Access:**
   - Log in with a general_admin account
   - Verify you can see all three tabs:
     - Incoming Orders
     - Farmer Registry
     - District Management
   - Test assigning orders to districts
   - Test registering farmers in any district

2. **Test Sub-Admin Access:**
   - Log in with a sub_admin account
   - Verify you only see two tabs (District Management is hidden)
   - Verify you can only see orders assigned to your district
   - Verify you can only register farmers in your district

## User Roles Explained

### General Admin
- **Full system access**
- Can view all orders from all districts
- Can assign orders to specific districts
- Can register farmers in any district
- Can manage district-to-sub-admin assignments
- Has access to the District Management tab

### Sub-Admin
- **District-restricted access**
- Can only view orders assigned to their district
- Can only register farmers in their assigned district
- Cannot assign orders to districts
- Cannot access District Management tab

## Four Districts

The system is configured for these four districts:
1. **Ilesha Baruba**
2. **Gwanara**
3. **Okuta**
4. **Yashikira**

## Sample Test Data

The system includes sample inquiries for testing:
- Dangote Foods Ltd - Maize order
- Golden Grain Exports - Cashew Nuts order
- FarmFresh Distributors - Yam Tubers order (assigned to Gwanara)
- West African Mills - Soybeans order

## Security Notes

1. **No Public Links:** The admin portal URL (`/admin-login`) should never be linked from the public site
2. **Role-Based Access:** All permissions are enforced at the database level using Row Level Security (RLS)
3. **Secure Storage:** Roles are stored in a separate `user_roles` table (not in profiles) to prevent privilege escalation
4. **Authentication Required:** All admin routes require valid authentication

## Contact Form Integration

The public contact form on `/contact` automatically saves inquiries to the database. These appear in the "Incoming Orders" tab with a status of "new". General Admins can then assign these orders to specific districts.

## Troubleshooting

**Can't see orders/farmers:**
- Verify your role is correctly set in the `user_roles` table
- Check that RLS policies are enabled
- Ensure you're logged in with the correct account

**District Management tab not visible:**
- This tab is only visible to users with the `general_admin` role
- Sub-admins cannot access this feature

**Can't assign orders:**
- Only General Admins can assign orders to districts
- Make sure your role is `general_admin`, not `sub_admin`
