# PetVerse — REST API Documentation

All API endpoints are prefixed with `/api/v1` unless noted otherwise.

---

## 1. Authentication (`/api/v1/auth`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/auth/register` | None | Register a new user account with hashed password. Sets refresh cookie. |
| `POST` | `/auth/login` | None | Authenticate with email/password. Enforces 5-attempt account lockout. Sets refresh cookie. |
| `POST` | `/auth/refresh` | Cookie | Silently rotate refresh token and issue new 15-minute access token. |
| `POST` | `/auth/logout` | Optional | Revoke active refresh token and clear cookie. |
| `POST` | `/auth/send-otp` | None | Send 6-digit email verification OTP. |
| `POST` | `/auth/verify-otp` | None | Submit OTP code to mark account as verified (`isVerified = true`). |
| `POST` | `/auth/forgot-password` | None | Issue secure 1-hour password reset token link. |
| `POST` | `/auth/reset-password` | None | Reset account password using token. Invalidates reset token immediately. |
| `POST` | `/auth/google` | None | Verify Google OAuth ID token credential and log in or register. |

---

## 2. Pets Management (`/api/v1/pets`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/pets` | Bearer | List all pets owned by authenticated user. |
| `POST` | `/pets` | Bearer | Create a new pet profile (`name`, `species`, `breed`, `dob`, `weight`, etc.). |
| `GET` | `/pets/:id` | Bearer | Retrieve detailed pet profile by ID. Enforces ownership check. |
| `PATCH` | `/pets/:id` | Bearer | Update pet details, weight, neutered status, or `isLost` emergency toggle. |
| `DELETE` | `/pets/:id` | Bearer | Cascade delete pet and all associated medical records and reminders. |
| `POST` | `/pets/:id/photos` | Bearer | Upload and append photo to pet gallery. |
| `GET` | `/pets/:id/timeline` | Bearer | Aggregated chronological timeline of health, vaccine, and care events. |
| `GET` | `/pets/public/:qrCode` | None | Public emergency scan profile (microchip ID, emergency contacts, medical alerts). |
| `GET` | `/pets/lost` | None | Public community lost & found emergency board. |

---

## 3. Health & Medical Records (`/api/v1/health`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/health/:petId/dashboard` | Bearer | Get pet health score, active conditions, allergies, and vital history. |
| `POST` | `/health/:petId/visits` | Bearer | Log veterinary clinical visit with diagnosis, notes, and vet details. |
| `GET` | `/health/:petId/visits/:recordId` | Bearer | Retrieve specific medical visit record. |
| `PATCH` | `/health/:petId/visits/:recordId` | Bearer | Update clinical visit record notes or discharge instructions. |
| `POST` | `/health/:petId/vitals` | Bearer | Record vital signs (`weight`, `heartRate`, `temperature`, `respiratoryRate`). |
| `POST` | `/health/:petId/conditions` | Bearer | Log diagnosed condition (`acuteOrChronic`, `severity`, `status`). |
| `PATCH` | `/health/:petId/conditions/:conditionId/resolve` | Bearer | Mark diagnosed condition as resolved. |
| `POST` | `/health/:petId/allergies` | Bearer | Log allergen with severity and emergency alert flag (`isEmergencyFlag`). |

---

## 4. Vaccinations (`/api/v1/vaccinations`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/vaccinations/:petId` | Bearer | Retrieve complete vaccination record history and booster due dates. |
| `POST` | `/vaccinations/:petId` | Bearer | Log administered vaccination dose with batch number and manufacturer. |
| `POST` | `/vaccinations/:petId/reactions` | Bearer | Record adverse vaccine reaction (`anaphylaxis`, `fever`, `swelling`). |

---

## 5. Medications (`/api/v1/medications`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/medications/:petId` | Bearer | List active prescriptions and courses for a pet. |
| `POST` | `/medications/:petId` | Bearer | Issue prescription with dose calculation and auto-generated reminders. |
| `POST` | `/medications/:petId/courses/:courseId/log-dose` | Bearer | Record taken or missed dosage for adherence tracking. |

---

## 6. Reminders (`/api/v1/reminders`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/reminders/my-reminders` | Bearer | Retrieve all active and upcoming reminders for authenticated user's pets. |
| `POST` | `/reminders` | Bearer | Create reminder with cron schedule (`0 8 * * *`) and multi-channel escalation. |
| `POST` | `/reminders/:id/snooze` | Bearer | Postpone reminder by specified hours (+1h, +4h, +8h, +24h). |
| `POST` | `/reminders/:id/complete` | Bearer | Mark reminder as completed for current cycle. |

---

## 7. Appointments & Nearby Clinics (`/api/v1/appointments` & `/api/v1/nearby`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/nearby` | None | Find nearby vet clinics, groomers, and emergency care within radius (2dsphere). |
| `GET` | `/nearby/:id` | None | Get clinic profile, services, and verified reviews. |
| `POST` | `/nearby/:id/reviews` | Bearer | Post verified clinic rating and review. |
| `GET` | `/appointments/slots` | None | Query available 30-minute booking slots for a clinic on a specific date. |
| `POST` | `/appointments` | Bearer | Book appointment slot. Enforces double-booking conflict protection (`409 Conflict`). |
| `PATCH` | `/appointments/:id/reschedule` | Bearer | Reschedule existing appointment to a new date and time slot. |
| `PATCH` | `/appointments/:id/cancel` | Bearer | Cancel scheduled appointment with reason. |

---

## 8. Payments (`/api/v1/payments`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/payments/create-checkout-session` | Bearer | Initialize server-side Stripe Checkout session for clinic booking. |
| `POST` | `/payments/verify` | Bearer | Verify transaction completion server-side before updating appointment status. |
| `POST` | `/payments/webhook` | None | Stripe raw body webhook handler with signature validation and idempotency. |

---

## 9. AI Veterinary Assistant (`/api/v1/ai`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/ai/symptoms` | Bearer | AI symptom analyzer assessing urgency with safe veterinary disclaimer. |
| `POST` | `/ai/breed-scan` | Bearer | Computer vision breed identification with physical care guidance. |
| `POST` | `/ai/diet-plan` | Bearer | Tailored caloric and nutritional meal planning by species, weight, and age. |

---

## 10. Admin & Telemetry Operations

| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/users` | Admin | List all registered users with role and status filtering. |
| `PATCH` | `/users/:id/status` | Admin | Activate or deactivate account, or change user role. Automatically records audit log. |
| `GET` | `/users/admin/stats` | Admin | Platform-wide user, pet, appointment, and uptime statistics. |
| `GET` | `/users/admin/audit-logs` | Admin | Query chronological audit logs of administrative actions. |
| `GET` | `/users/admin/pets` | Admin | Search, filter, and inspect all registered pets platform-wide. |
| `GET` | `/health` | None | Process liveness check with memory usage and uptime. Includes `X-Response-Time`. |
| `GET` | `/ready` | None | Dependency readiness check verifying MongoDB ping, replica set, and system stats. |
| `GET` | `/metrics` | None | Real-time performance telemetry (total requests, avg latency, p95, status codes). |

---

## 11. Expense Tracking (`/api/v1/expenses`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/expenses` | Bearer | Query expenses with filtering by pet, category, date range, and pagination. |
| `POST` | `/expenses` | Bearer | Record a new pet expense with receipt image, notes, and vendor. |
| `GET` | `/expenses/analytics` | Bearer | Aggregate analytics: lifetime total, monthly spend, category breakdown, 12-month trend. |
| `DELETE` | `/expenses/:id` | Bearer | Delete expense record. Enforces ownership check. |

---

## 12. Pet Community (`/api/v1/community`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/community/posts` | None/Bearer | Browse community posts with category filters, search, and pagination. |
| `POST` | `/community/posts` | Bearer | Create a new community post with media attachments and tags. |
| `GET` | `/community/posts/:id` | None/Bearer | View post detail with threaded comments and like status. |
| `POST` | `/community/posts/:id/like` | Bearer | Toggle like/upvote on a post. |
| `POST` | `/community/posts/:id/comments` | Bearer | Post a comment on a community discussion. |
| `DELETE` | `/community/posts/:id` | Bearer | Delete post (author or admin). |

---

## 13. Veterinary Marketplace (`/api/v1/marketplace`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/marketplace/products` | None | Browse veterinary catalog with category filter, search, and stock status. |
| `GET` | `/marketplace/products/:id` | None | View product details, ratings, and verified vet badge. |
| `POST` | `/marketplace/orders` | Bearer | Place an order with items, shipping address, and initial pending payment status. |
| `GET` | `/marketplace/orders` | Bearer | Retrieve order history for the authenticated user. |

---

## 14. Adoption Sanctuary (`/api/v1/adoption`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/adoption/listings` | None | Browse rescue pets available for adoption with species and status filters. |
| `GET` | `/adoption/listings/:id` | None | View full shelter profile, personality, medical history, and shelter contact. |
| `POST` | `/adoption/listings` | Bearer | Create new adoption listing (shelters, rescues, or verified users). |
| `POST` | `/adoption/listings/:id/apply` | Bearer | Submit an adoption application with household and pet care questionnaire. |
| `GET` | `/adoption/applications` | Bearer | View submitted adoption applications and review statuses. |

---

## 15. Lost & Found Alerts (`/api/v1/lost-found`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/lost-found/reports` | None | Browse active lost pet alerts and found animal sightings. |
| `POST` | `/lost-found/reports` | Bearer | File an official lost or found report with geolocation coordinates and photos. |
| `GET` | `/lost-found/reports/:id/matches` | Bearer | Run automated computer-assisted matching algorithm against lost/found registry. |
| `POST` | `/lost-found/reports/:id/inquire` | Bearer | Send secure, private in-app inquiry to report author without exposing phone/email. |
| `PATCH` | `/lost-found/reports/:id/resolve` | Bearer | Mark lost pet as safely reunited or found animal returned to owner. |
| `PATCH` | `/lost-found/admin/reports/:id/moderate` | Admin | Moderate report status (`approved`, `flagged`, `rejected`). |

