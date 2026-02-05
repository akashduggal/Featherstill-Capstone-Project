# Frontend Architecture & Decisions

## Overview
This document outlines the initial frontend architecture, technology choices, and design decisions for the battery monitoring mobile application.  
The app connects to battery hardware via an ESP32 controller, displays live battery metrics, and syncs data with a backend service.

This document is intended to serve as a living reference and will evolve as implementation progresses.

---

## Goals
- Display real-time battery metrics (voltage, charge cycles, health, etc.)
- Authenticate users securely
- Maintain a scalable and maintainable frontend architecture

---

## Technology Stack

### Mobile Framework
- **React Native**
  - Cross-platform support (iOS & Android)

### Authentication
- **Firebase Authentication**
  - Username/password-based authentication

---

## Proposed Folder Structure

This project uses **Expo Router**, where the file system defines the app's routes.

## 📁 Directory Map

```text
root/
├── app/                  # ROUTING: Every file here is a route
│   ├── (auth)/           # Logged-out flow (Login, Signup, Forgot Password)
│   ├── _layout.tsx       # Root layout (Providers, Themes)
│   └── (dashboard)/      # Logged-in flow (Main app features, Tabs, Feed)
├── components/           # Reusable UI elements
├── hooks/                # Custom React hooks
├── services/             # API calls and Firebase
├── constants/            # Colors, Spacing, Keys
└── utils/                # Helper Functions