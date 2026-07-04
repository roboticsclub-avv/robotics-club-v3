# Robotics Club Website 3.0

# Target Architecture

---

## Framework

Next.js App Router

---

## Authentication

Firebase Authentication

---

## Database

Firestore

Collections:

- users
- events
- inventory
- allocations

---

## API Layer

Client
↓
API Routes
↓
Firebase Admin SDK
↓
Firestore

---

## Routes

/

/login

/join-us

/event/[id]

/dashboard

/member (reserved)

---

## Error Routes

/error

/not-found

---

## Component Structure

components/

- Navbar
- Hero
- About
- Projects
- Training
- Events
- Gallery
- Team
- Footer
- Loader

components/ui/

- AlertPopup
- GlobalAlertContainer
- SkeletonLoader
- ThemeSwitcher

---

## Theme System

Theme 1

Cosmic Premium

Theme 2

Aurora Light

Theme 3

Deep Space

---

## Reserved Features

Member Portal

Advanced Dashboard Platform

Club Collaboration Platform

These features are not part of current implementation.

---

## Visual Sources

Loader → V2

Hero → V2 + V1 Glitch

Events → V2

Gallery → Upgraded V1

Authentication → V1

Recruitment → V1

Inventory → V1

Allocation → V1