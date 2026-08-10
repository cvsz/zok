# Execution Plan: Zaapi Platform Copy-Clone

This document outlines the architecture, layout, design specs, and development roadmap for building a fully interactive, premium clone of the **Zaapi** conversational AI and chat-commerce platform.

---

## 1. Project Overview & Objectives
Zaapi is an all-in-one conversational AI platform that consolidates client interactions across Southeast Asia's major chat and e-commerce channels (WhatsApp, Facebook, Instagram, LINE OA, TikTok Shop, Shopee, Lazada, email, and live chat) into a single unified workspace.

**Our Goal:** Build a stunning, high-fidelity web application containing:
1. **Premium Landing Page:** Built with high-end glassmorphism, responsive grids, custom brand styling (using the signature `#00c28e` emerald theme), interactive features slider, and smooth micro-animations.
2. **Zaapi App Dashboard Clone:** An interactive, rich mockup representing the actual platform, allowing the user to experience all key features:
   * **Unified Inbox:** Rich chat panel filtering messages by channel, sending mock messages, smart tag segmentation, agent assignment, and customer CRM sidebar (Shopify order sync).
   * **AI Sales Agent Studio:** Sandbox to customize business context, define agent persona, edit QA pairs, and test the AI bot dynamically.
   * **Visual Flow Builder:** Sleek canvas representing the chatbot flow automation builder, with draggable and configurable nodes (Triggers, Sends, Conditions).
   * **Broadcasts Panel:** Target segments using custom customer tags, select bulk templates (WhatsApp/LINE), and track delivery statistics.
   * **Analytics Dashboard:** Graphical charts representing KPIs like Response Times, Resolution Rates, Platform Distribution, and Sales Revenue.
   * **Integrations Portal:** Setup panel for Shopify, Lazada, Shopee, TikTok Shop, HubSpot, and Webhooks.

---

## 2. Technology Stack & Design System
We will implement this project as a **Vite + React** single-page application (SPA) with a custom design system using vanilla CSS variables to ensure high performance, responsiveness, and maximum design control.

### CSS Theme Tokens (`/src/index.css`)
* **Primary Color:** `#00c28e` (Zaapi Green)
* **Dark Background:** `#0B132B` (App dark mode UI background)
* **Light/Glass Surface:** `rgba(255, 255, 255, 0.05)` (App glassmorphism backdrop)
* **Borders:** `rgba(255, 255, 255, 0.1)` / `#E5E7EB`
* **Typography:** `Inter`, `Outfit`, Sans-serif
* **Gradient Elements:** Warm radial mesh gradients matching Zaapi's brand styles.

---

## 3. Implementation Directory Structure
```
/mnt/zok/
├── exec-planing.md           # This execution plan
├── package.json              # Project dependencies
├── vite.config.js            # Build config
├── index.html                # Entry document
├── src/
│   ├── main.jsx              # App entrypoint
│   ├── index.css             # Main styling, utility classes & animations
│   ├── App.jsx               # App routing / View management
│   ├── components/           # Reusable components
│   │   ├── Navbar.jsx        # Landing page responsive nav
│   │   ├── Footer.jsx        # Branding and links
│   │   ├── ThemeToggle.jsx   # Custom theme control
│   │   └── ui/               # Basic design-system components
│   └── views/                # Platform main views
│       ├── LandingPage.jsx   # High-conversion product showcase
│       └── Dashboard/        # Zaapi App Clone Container
│           ├── DashboardNav.jsx
│           ├── UnifiedInbox.jsx
│           ├── AIAgent.jsx
│           ├── FlowBuilder.jsx
│           ├── Broadcasts.jsx
│           ├── Analytics.jsx
│           └── Integrations.jsx
```

---

## 4. Feature Specifications & Roadmap

### Phase 1: Foundation & Setup
1. Setup React app with Vite.
2. Initialize global styles (`index.css`) containing color variables, typography, reset layout, and custom grid utility classes.
3. Configure layout templates.

### Phase 2: Landing Page Development
1. **Hero Section:** Engaging headline, animated grid background, mock platform floating layers.
2. **Channel Marquee:** Multi-row continuous animation listing channel icons (WhatsApp, Instagram, etc.).
3. **Interactive Features Slider:** Clickable tabs detailing Unified Inbox, AI Agent, Flow Builder, and Broadcasts with visual dynamic screenshots/simulators.
4. **Platform Comparison Grid:** Interactive comparison matrices detailing Zaapi features vs HubSpot, Zendesk, and standard LINE/WhatsApp.
5. **Interactive Pricing Plans:** Tiered pricing tables (Basic, Pro, Advanced) with monthly and annual billing period sliders.
6. **Data Privacy & Trust Section:** Highlight safety and customer ownership.

### Phase 3: The Unified Inbox View
1. **Left Sidebar:** User selection & Channel Filter buttons.
2. **Chat List:** List of customers (e.g. Panacee Medical, Karmart client names) with last message, unread badges, and channel indicators.
3. **Chat Window:** Active window allowing messaging. An automated response simulation will reply to user inputs.
4. **CRM Right Panel:** Client details, active tags (e.g., "VIP", "Needs-Follow-up"), assignee manager dropdown, and Shopify order history list.

### Phase 4: AI Agent Studio & Flow Builder
1. **AI Agent Setup:** Form inputs for Knowledge Base text, Assistant Name, Persona Select.
2. **AI Simulator widget:** Interactive chat preview where users can talk to the custom bot.
3. **Flow Builder Canvas:** Visual representation of conversation flow charts. Interactive mock where users can add nodes (Action, Condition, Trigger), connect them with lines, and inspect node options.

### Phase 5: Broadcasts, Analytics & Integrations
1. **Broadcast Creator:** Audience target setup, template writer (variables support like `{{customer_name}}`), and scheduler.
2. **Campaign Reports:** Progress bars showing open and conversion rates.
3. **Analytics Dashboard:** Visual widgets showing key performance indicator (KPI) graphs.
4. **Integration Switches:** Interlock buttons to simulate connecting Shopify, TikTok, Shopee with status logs.

---

## 5. Verification & Review Plan
* Test responsiveness across all devices (Desktop, Tablet, Mobile).
* Ensure smooth screen transitions and instant micro-interactions.
* Verify clean console logs and optimized asset load speeds.
* Execute builds to verify standard bundle outputs are lint-free.
