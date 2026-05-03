- Timer bar: 20s countdown with color transition (green→yellow→red)
- Premium overlay: "Best Hand: Two Pair" text below name (if premium visible)
- Empty seat: "Waiting..." placeholder with tier min-buy-in display
4. ACTION PANEL (client/src/components/game/ActionPanel.tsx):
- Dynamic buttons based on legal actions: [Fold] [Check/Call X] [Raise to Y]
- Bet slider for raise amounts
- All-in button with confirmation
- Auto-action toggles: Auto-fold, Auto-check/fold
- Keyboard shortcuts: F=fold, C=check/call, R=raise
- Disabled state when not user's turn


5. PREMIUM HUD (client/src/components/hud/):
HandIdentifier.tsx:
- Shows current best hand name (e.g., "Two Pair, Kings and Queens")
- Updates in real-time as community cards appear
- Styled overlay at top of screen with hand rank icon
WinProbability.tsx:
- Shows percentage bar: "65% Win • 12% Tie • 23% Lose"
- Color-coded bar animation
- Updates when community cards change
- Shows "Calculating..." during Monte Carlo simulation
- Only renders if user.isPremium === true
PremiumOverlay.tsx:
- If not premium, shows locked feature with upgrade CTA
- "Unlock Premium HUD • See Win Odds • Advanced Stats"
- Link to upgrade/payment
6. RABBIT HUNT (client/src/components/game/RabbitHunt.tsx):
- Trigger: button appears after user folds ("Hunt Rabbit")
- On click: requests next community card from server
- Displays card with animation: "Next Card Would Have Been: [A♠]"
- Card fades out after 3 seconds
- Shows resulting hand: "Would Have Made: Full House"
- Only available for folded players in current hand
7. CHAT COMPONENT (client/src/components/game/Chat.tsx):
- Real-time message display (50 message buffer)
- Input with send button and Enter key
- Message types: user message, system action (player joined, hand won), dealer
announcements
- Emoji picker (limited set)
- Profanity filter (client-side pre-filter)
- Auto-scroll to latest
IMPLEMENT all components with TailwindCSS, dark theme (green felt-inspired),
mobile-responsive, and accessibility attributes.
PHASE 8: ADMIN DASHBOARD FRONTEND



BUILD the React admin dashboard:

1. ADMIN LAYOUT (client/src/pages/AdminDashboard.tsx):
- Protected route (check user.isAdmin)
- Sidebar navigation: Dashboard, Approvals, Users, Game Monitor, Alerts
- Header with real-time stats ticker
- Dark professional theme (differentiate from player UI)
2. DASHBOARD VIEW (client/src/components/admin/Dashboard.tsx):
- 4 metric cards with animated counters:
- Total Platform Liquidity (sum all balances)
- Today's Revenue (rake collected)
- Active Games (rooms in 'active' status)
- Pending Approvals (badge count)
- Revenue chart (Recharts):
- Line chart: Daily revenue last 30 days
- Bar chart: Monthly revenue comparison
- Pie chart: Revenue by room tier
- Recent transactions table (last 20)
- Active rooms list with spectator quick-join
3. APPROVAL QUEUE (client/src/components/admin/ApprovalQueue.tsx):
- Tabbed: Pending Deposits | Pending Withdrawals
- Table columns: User, Amount, Reference, Requested At, Status
- Actions: [Approve] [Reject] with confirmation modal
- Reject modal: requires reason (select + text)
- Bulk approve: select multiple, one-click
- Auto-refresh every 30 seconds
- Sound notification on new pending item
4. USER SEARCH & MANAGEMENT (client/src/components/admin/UserSearch.tsx):
- Search bar: phone number or username (debounced 500ms)
- Results table: avatar, username, phone, balance, premium, last active, actions
- Click user → expandable detail panel:
- Transaction history with pagination
- Game history (last 50 hands)
- IP log with timestamps
- Collusion flags if any
- Actions: [Restrict Account] [Force Logout] [Adjust Balance (with reason)]
- Export user data as CSV
5. GOD MODE SPECTATOR (client/src/components/admin/SpectatorView.tsx):
- List of active rooms with player counts
- Click to enter spectate mode


- View identical to game table but:
- ALL hole cards visible (face-up)
- Player balances shown
- IP addresses displayed next to names
- Action log with timestamps
- Overlay badge: "ADMIN SPECTATING - SESSION LOGGED"
6. BEHAVIORAL ALERTS (client/src/components/admin/AlertsPanel.tsx):
- Auto-detected alerts:
- "IP Collusion: Users A, B, C sharing IP in Room #123"
- "Suspicious Win Rate: User X (87% over 200 hands)"
- "Chip Dumping: User Y transferred 50,000 to User Z in 5 hands"
- "Rapid Balance Changes: User W (+500% in 1 hour)"
- Each alert: severity badge (low/medium/high), timestamp, [Investigate] button
- Investigate opens detailed game replay for flagged hands
IMPLEMENT with React Query for data fetching, optimistic updates for approvals, and
WebSocket subscription for real-time metric updates.
PHASE 9: AVATAR SYSTEM & CLOUDINARY INTEGRATION

IMPLEMENT avatar upload and serving system:
1. AVATAR UPLOAD SERVICE (client/src/services/avatarUpload.js):
- Function uploadAvatar(file):
Validates: type (image/png, image/jpeg, image/webp), size (<5MB)
Creates FormData with file
POST /api/users/avatar (multipart/form-data)
Returns: {avatarUrl}
- Show upload progress bar
- Preview before upload with cropping capability (react-image-crop)
- Optimize client-side: resize to 300x300 before upload
2. AVATAR UPLOAD BACKEND (server/src/controllers/userController.js):
- Configure multer: memory storage, file filter for images, 5MB limit
- Upload to Cloudinary:
cloudinary.uploader.upload(buffer, {
folder: 'mossPOK/avatars',
public_id: userId,
transformation: [{width: 300, height: 300, crop: 'fill', gravity: 'face'}]


## })

- Update User.avatarUrl with Cloudinary URL
- Delete old avatar from Cloudinary if exists
- Return new URL
3. AVATAR COMPONENT (client/src/components/common/Avatar.tsx):
- Props: {url, username, size, isOnline, hasGlow}
- Default: generate colored initial avatar if no URL (consistent color from username hash)
- Online indicator: green dot overlay
- Glow effect: for current turn or premium users
- Lazy load with blur-up placeholder
- Fallback on image load error
4. AVATAR FETCHING:
- On room join: batch fetch all player avatars in single request
- Cache avatars in browser (localStorage with 24h expiry)
- Service worker for offline avatar display
IMPLEMENT with proper error handling, retry logic, and loading states throughout.
PHASE 10: INTEGRATION & FINAL WIRING

WIRE everything together into a cohesive application:

1. SERVER ENTRY POINT (server/src/server.js):
- Initialize MongoDB connection with retry logic
- Initialize Redis connection with health check
- Create HTTP server
- Attach Socket.io with CORS config
- Initialize ConnectionManager
- Initialize RoomManager (pre-create room pools for each tier)
- Start cron jobs:
- Every 5 min: expire stale rooms
- Every hour: revenue reconciliation
- Every 30 min: collusion pattern detection
- Graceful shutdown handling

2. CLIENT ROUTING (client/src/App.tsx):
- React Router routes:
- / → Lobby (show available rooms, tiers)
- /game/:roomId → GameRoom
- /admin → AdminDashboard (protected)
- /profile → UserProfile
- /premium → PremiumUpgrade
- Auth guard on protected routes
- Socket connection established in App level, passed via context

3. LOBBY PAGE (client/src/pages/Lobby.jsx):
- Tier selection cards (10/20, 20/40, 50/100, 500/1000)
- Each card: min buy-in, current active players, active rooms count
- Quick join button (auto-finds room)
- Create room button (forces new room)
- Recent hands showcase
- Current balance display in header

4. END-TO-END FLOW TEST:
Document the complete flow:
1. User registers/logs in
2. User deposits via zuseapi
3. User joins room at tier 20/
4. Hand plays out with actions, timer, rake
5. Winner receives balance minus rake
6. Admin views revenue in dashboard
7. Admin approves withdrawal
8. User receives payout

5. ERROR BOUNDARIES & FALLBACKS:
- Wrap game table in ErrorBoundary → shows "Game Crashed" with rejoin button
- Socket disconnect → reconnect with exponential backoff, show reconnecting overlay
- API failures → toast notifications with retry option
- Wallet operations → confirmations with undo where possible
IMPLEMENT comprehensive logging (Winston), monitoring endpoints (/health, /metrics), and
feature flags for gradual rollout.
EXECUTION ORDER
Run these prompts in sequence:

Phase 1-2 first (structure + models) — commit as "foundation"
Phase 3-4 next (game engine + sockets) — test with unit tests
Phase 5 (financial) — critical, test thoroughly with sandbox
Phase 7 (game UI) — build on working backend
Phase 6 + 8 (admin) — can run parallel to Phase 7
Phase 9-10 last — polish and integration
Each phase builds on the previous. Start from a clean branch off the existing repo: git checkout
-b mossPOK-upgrade
