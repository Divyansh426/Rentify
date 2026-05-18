# Rentify — Rental Management Platform

A full-stack rental management platform built to solve a real problem.
Most small landlords in India manage rent payments, tenant records, and
room tracking through WhatsApp messages and paper notebooks. Rentify
replaces that with a clean, structured web application.

Live Demo: https://rentify-five-phi.vercel.app

---

## Features

### For Landlords
- Register and manage multiple properties and rooms
- Add tenants and link them to specific rooms
- Track monthly rent payments with paid, unpaid, and overdue status
- One-click rent status updates with automatic date tracking
- In-app notifications when rent status changes
- 6-month revenue analytics dashboard
- Full tenant management including removal and reassignment

### For Tenants
- Personal dashboard showing room details and monthly rent
- Complete payment history with status for each month
- In-app notifications for rent due, paid, and overdue events

---

## Tech Stack

### Backend
- Django REST Framework
- Simple JWT for authentication
- Django CORS Headers
- PostgreSQL (production) / SQLite (local)
- Whitenoise for static file serving
- Gunicorn as WSGI server
- Django Signals for automated notifications

### Frontend
- React with Vite
- Axios with JWT interceptors for token auto-refresh
- Recharts for analytics dashboard
- Protected routes based on user role

### Deployment
- Backend: Railway
- Frontend: Vercel
- Database: Railway PostgreSQL

---

## Project Structure
Rentify/
├── backend/
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── accounts/
│   ├── models.py        # Custom AbstractUser with role field
│   ├── serializers.py
│   └── views.py
├── rentals/
│   ├── models.py        # Property, Room, TenantProfile, RentPayment, Notification
│   ├── serializers.py
│   ├── views.py
│   ├── signals.py       # Auto-triggers notifications on events
│   ├── permissions.py   # IsLandlord, IsLandlordOrReadOnlyOwn
│   └── urls.py
├── manage.py
├── requirements.txt
├── Procfile
└── runtime.txt
