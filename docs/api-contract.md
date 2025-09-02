# ViviCity API — Contrat v1

## Données (PostgreSQL)
- users(id, email UNIQUE, password_hash, display_name, created_at)
- reviews(id, user_id→users, lat, lng, city, criterion['note','proprete','securite'], rating[0..5], comment, created_at)
- actions(id, user_id→users, theme, title, description, date_utc, lat, lng, created_at)

## Endpoints (REST + JWT)
### Auth
- POST /auth/register {email,password,display_name?} → 200 {id,email,display_name}
- POST /auth/login {email,password} → 200 {token}
- GET /me (Bearer) → 200 {id,email,display_name}

### Reviews
- GET  /reviews?lat=&lng=&radius=&criterion= → 200 [{...}]
- POST /reviews (Bearer) {lat,lng,criterion,rating,comment} → 201 {...}

### Actions
- GET  /actions?lat=&lng=&radius=&after= → 200 [{...}]
- POST /actions (Bearer) {theme,title,description,date_utc,lat,lng} → 201 {...}
