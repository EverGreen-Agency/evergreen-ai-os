# Meta Ads Dashboard — Complete AI Build Prompt

 | Ready to paste into Claude, Cursor, OpenClaw, or any AI coding assistant.


---

## The Master Build Prompt

*Copy and paste the following prompt in its entirety into your AI coding assistant to generate the full application. It is designed to be self-contained and comprehensive enough to produce a working dashboard in a single session.*

---

### PROMPT START

You are an expert full-stack developer and data visualization specialist. Your task is to build a comprehensive, production-ready **Meta Ads Dashboard** that connects to the Meta Marketing API. Follow every instruction below precisely and in order.

---

#### 1. Tech Stack & Architecture

Build the application using the following technology stack:

- **Framework**: Next.js 14 with the App Router
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (configured with the dark theme globally)
- **Charts**: Recharts (preferred) or Chart.js
- **API Integration**: Meta Marketing API v21.0
- **State Management**: React Context API or Zustand for global state (date range, selected account)
- **HTTP Client**: Axios or native `fetch` with server-side API routes in Next.js to protect the access token

---

#### 2. Environment & Authentication Setup

Create a `.env.local` file with the following variables. The application must never expose the access token to the client side — all Meta API calls must go through Next.js API routes (`/app/api/...`).

```
META_ACCESS_TOKEN=your_long_lived_access_token_here
META_AD_ACCOUNT_ID=act_your_ad_account_id_here
META_APP_ID=your_app_id_here
META_APP_SECRET=your_app_secret_here
```

Create a utility file at `lib/meta-api.ts` that exports a pre-configured Axios instance pointing to `https://graph.facebook.com/v21.0`. All API calls in the application must use this utility.

---

#### 3. Project Documentation

Immediately after scaffolding the project, create a `CLAUDE.md` file in the root directory. This file must document the following:

- **Tech Stack**: A table listing each technology and its purpose.
- **Folder Structure**: An annotated tree of the `app/`, `components/`, `lib/`, and `types/` directories.
- **API Architecture**: How the Meta API authentication flow works (server-side routes only, no client-side token exposure).
- **Key Meta API Endpoints Used**: A table listing each endpoint, its purpose, and the key fields requested.
- **Component Conventions**: Naming conventions, file structure for components, and how shadcn/ui components are extended.
- **Important Decisions**: Any architectural decisions made during setup (e.g., why Recharts was chosen, how date ranges are managed globally).

---

#### 4. Core Layout & Navigation

Create a persistent root layout (`app/layout.tsx`) that includes:

- A fixed left sidebar navigation (approximately 220px wide) with links to all six sections.
- The active route must be visually highlighted in the sidebar using the accent color.
- A top header bar showing the currently selected Ad Account name and a global date range picker (default to "Last 30 Days").
- The main content area must be scrollable and padded appropriately.

The sidebar navigation links must be:
1. Overview
2. Campaigns
3. Ad Sets
4. Creatives
5. Audiences
6. Budget

---

#### 5. Page-by-Page Feature Requirements

**Page A: Overview (`/`)**

This is the landing page and must provide a high-level summary of account performance.

- Connect to the Meta API `/insights` endpoint at the account level.
- Display a KPI summary row at the top with four cards: **Total Spend**, **Total Revenue** (estimated from ROAS × Spend), **Blended ROAS**, and **Total Impressions**. Each card must show the current period value and a percentage change indicator versus the previous equivalent period.
- Display a combined line chart showing **Daily Spend** and **ROAS** over the selected date range on a dual Y-axis.
- Display a summary campaign table (same as the Campaigns page but limited to the top 5 by spend) with a "View All" link.

**Page B: Campaigns (`/campaigns`)**

- Connect to the Meta API `/campaigns` endpoint with the `fields=name,status,daily_budget,lifetime_budget,insights{spend,impressions,clicks,ctr,cpc,purchase_roas}` parameter.
- Display a full data table of all campaigns. Columns: Campaign Name, Status, Spend, Impressions, Clicks, CTR, CPC, ROAS.
- The table must be sortable by any column (client-side sorting).
- Status must be displayed as a color-coded badge: Active (green), Paused (gray), Ended (red).
- Include a search/filter input to filter campaigns by name.

**Page C: Ad Performance Analytics (`/analytics`)**

- Connect to the Meta API `/insights` endpoint with `time_increment=1` to get daily breakdowns.
- Chart 1 (Line): Daily Spend vs. ROAS over the selected date range. Use a dual Y-axis (left for Spend in USD, right for ROAS as a multiplier).
- Chart 2 (Bar): ROAS breakdown by Campaign. Color-code bars based on performance thresholds (e.g., green for ROAS > 4x, yellow for 2–4x, red for below 2x).
- Chart 3 (Line): Impressions and Clicks over time on the same chart.
- Metrics comparison table: Show current period vs. previous period for Total Spend, Impressions, Clicks, CTR, CPC, and ROAS. Include a "Change" column with color-coded percentage values.

**Page D: Creative Library (`/creatives`)**

- Connect to the Meta API `/ads` endpoint with `fields=name,creative{thumbnail_url,image_url,video_id},insights{spend,impressions,ctr,purchase_roas}`.
- Display creatives in a responsive grid (3 columns on desktop, 2 on tablet, 1 on mobile).
- Each card must show: a thumbnail preview (image or video placeholder), the creative name, and the key metrics (Spend, Impressions, CTR, ROAS).
- Assign a performance tier badge to each creative: **Top Performer** (ROAS > 5x, green), **Average** (ROAS 2–5x, yellow), **Underperforming** (ROAS < 2x, red).
- Implement filter controls: filter by Campaign (dropdown), Date Range (inherited from global picker), and Performance Tier (radio buttons or tabs).

**Page E: Audience Insights (`/audiences`)**

- Connect to the Meta API `/insights` endpoint with `breakdowns=age,gender` for demographic data and `breakdowns=country` for geographic data.
- Chart 1 (Grouped Bar): Age & Gender distribution. Show male and female bars side-by-side for each age group (18–24, 25–34, 35–44, 45–54, 55+). Metrics: Spend or Impressions per segment.
- Chart 2 (Donut): Device type breakdown (Mobile, Desktop, Tablet). Use the `breakdowns=device_platform` parameter.
- Table: Top 10 geographic locations (countries) sorted by Spend, with columns for Country, Spend, Impressions, Clicks, and ROAS.
- Chart 3 (Bar): Placement performance (Facebook Feed, Instagram Feed, Stories, Reels, Audience Network). Use the `breakdowns=publisher_platform,placement` parameter.

**Page F: Budget Tracker (`/budget`)**

- Connect to the Meta API `/campaigns` endpoint to retrieve `daily_budget`, `lifetime_budget`, and `spend_cap` for each campaign.
- Combine with `/insights` data to calculate actual spend to date.
- Display a bar chart of daily spend for the current month, overlaid with a horizontal dashed line representing the average daily budget target.
- Display a campaign budget card grid. Each card must show: Campaign Name, Budget Type (Daily/Lifetime), Total Budget, Amount Spent, Amount Remaining, and a visual progress bar.
- Color-code the progress bar based on pacing: green if on track (spend % ≈ time elapsed %), orange if overpacing (spend % significantly exceeds time elapsed %), and blue if underpacing.
- Display a "Projected Month-End Spend" figure based on the current daily average spend rate.

---

#### 6. Design System & Theming

Apply the following design system consistently across all pages:

| Token | Value | Usage |
|---|---|---|
| Background | `#0d0d0d` | Page background |
| Card Background | `#161616` | All card and panel backgrounds |
| Card Border | `#282828` | Subtle borders on cards |
| Accent (Primary) | `#C8714A` | Active nav items, primary buttons, key highlights |
| Text (Primary) | `#FFFFFF` | All main body and heading text |
| Text (Secondary) | `#8C8C8C` | Labels, subtitles, muted information |
| Positive | `#4ADE80` | Positive changes, active status, good ROAS |
| Negative | `#F87171` | Negative changes, paused/ended status, poor ROAS |
| Neutral | `#94A3B8` | Neutral metrics, average performance |

Typography must use **Inter** (or the system sans-serif) for all UI text, and **JetBrains Mono** (or a monospace fallback) for any numeric data, API IDs, or code-style values.

All charts must use the dark theme: transparent or `#161616` backgrounds, with grid lines in `#282828` and axis labels in `#8C8C8C`.

---

#### 7. Error Handling & Loading States

Every page that fetches data must implement:

- A **skeleton loader** (using shadcn/ui Skeleton components) that matches the layout of the loaded content. Do not use generic spinners.
- An **error state** component that displays a clear error message and a "Retry" button if the Meta API call fails.
- An **empty state** component for when the API returns no data for the selected date range.

---

#### 8. Build Order

Please build the application in the following sequence to ensure a stable foundation:

1. Scaffold the Next.js project with Tailwind CSS and shadcn/ui.
2. Create the `CLAUDE.md` documentation file.
3. Set up the root layout with sidebar navigation and the global date range picker.
4. Create the `lib/meta-api.ts` utility and all Next.js API route handlers.
5. Build the Overview page.
6. Build the Campaigns page.
7. Build the Analytics page.
8. Build the Creative Library page.
9. Build the Audience Insights page.
10. Build the Budget Tracker page.

Begin now with Step 1.

### PROMPT END

---

## Individual Slide Prompts

The following are the individual prompts shown in each carousel slide. They can be used to build each section independently if you prefer an incremental approach.

### Slide 2 — Project Setup

> You are building a Meta Ads dashboard. Use Next.js, Tailwind CSS, and shadcn/ui for components. Connect to the Meta Marketing API v21.0. Set up the project structure with the following sections: Campaign Overview, Ad Set Manager, Creative Library, Audience Insights, and Budget Tracker. Use a dark theme globally. Create placeholder pages for each section with a shared sidebar navigation. When the initial project is set up, create a CLAUDE.md file that documents the tech stack, folder structure, API endpoints, and any important decisions made during setup.

### Slide 3 — Campaign Overview

> Build a campaign overview page that connects to the Meta Marketing API. It should display all active campaigns with their spend, impressions, clicks, CTR, CPC, and ROAS. Include a date range picker and a KPI summary bar at the top showing total spend, total revenue, and blended ROAS. Add color-coded status badges (active, paused, ended). Dark UI with a clean card-based table layout.

### Slide 4 — Ad Performance Charts

> Create an analytics page with line charts and bar charts showing ad performance over time. Use Recharts. Display daily spend, impressions, clicks, and ROAS trends. Include a breakdown by campaign and ad set. Pull data from the Meta Marketing API /insights endpoint. Dark theme with a date picker. Show percentage change vs previous period.

### Slide 5 — Creative Library

> Build a creative library page that fetches all ad creatives from the Meta API. Display them in a responsive grid with thumbnail previews. Show performance metrics for each creative: impressions, CTR, spend, and ROAS. Allow filtering by campaign, date range, and performance tier (top, average, underperforming). Use color-coded performance badges. Dark UI with card-based layout.

### Slide 6 — Audience Insights

> Create an audience insights page that pulls demographic data from the Meta Marketing API /insights endpoint with breakdowns. Show age and gender distribution as bar charts, top geographic locations as a sortable table, device type breakdown as a donut chart, and placement performance (Feed, Stories, Reels). Use Recharts. Dark theme with a date range filter.

### Slide 7 — Budget Tracker

> Build a budget tracker page that shows daily spend pacing against campaign budgets. Display a bar chart of daily spend with a budget threshold line. Show each campaign's remaining budget, daily budget, lifetime budget, and projected month-end spend. Add a color-coded pacing indicator (on track, overpacing, underpacing). Pull data from the Meta Marketing API campaigns endpoint. Dark UI.

---

## Meta API Quick Reference

The following table summarizes the key endpoints used in this dashboard.

| Endpoint | Purpose | Key Fields |
|---|---|---|
| `/{ad-account-id}/campaigns` | List all campaigns | `name`, `status`, `daily_budget`, `lifetime_budget` |
| `/{campaign-id}/insights` | Campaign-level metrics | `spend`, `impressions`, `clicks`, `ctr`, `cpc`, `purchase_roas` |
| `/{ad-account-id}/insights` | Account-level metrics | `spend`, `impressions`, `clicks`, `reach` |
| `/{ad-account-id}/insights` with `breakdowns=age,gender` | Demographic breakdown | `spend`, `impressions`, `age`, `gender` |
| `/{ad-account-id}/insights` with `breakdowns=country` | Geographic breakdown | `spend`, `impressions`, `country` |
| `/{ad-account-id}/insights` with `breakdowns=device_platform` | Device breakdown | `spend`, `impressions`, `device_platform` |
| `/{ad-account-id}/ads` | List all ads with creative data | `name`, `creative{thumbnail_url}`, `insights` |

All insight endpoints accept the `time_range` parameter in the format `{"since":"YYYY-MM-DD","until":"YYYY-MM-DD"}` and the `time_increment` parameter (set to `1` for daily data).
