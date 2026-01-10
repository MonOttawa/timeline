# Substantifique Roadmap

> **Vision**: Master anything, faster. Substantifique turns curiosity into expertise.

---

## ✅ Completed Milestones

### Core Platform
- **Project Rebranding**: Renamed from "timeline" to "Substantifique", updated branding assets and documentation
- **Timeline Sharing**: Implemented public sharing functionality with unique slugs
- **Public Viewing**: Created dedicated public view for shared timelines
- **Timeline Styles**: Implemented Bauhaus, Neo-Brutalist, Corporate, and Handwritten styles
- **PocketBase Integration**: Set up authentication and database persistence

### AI & Learning Features
- **Multi-Provider AI Integration**: Support for OpenRouter, Groq, Cerebras, OpenAI, Anthropic, Gemini, and Z.AI (GLM)
- **Centralized AI Settings**: Unified AI provider configuration with global SettingsModal
- **Learning Assistant**: Multiple learning modes (Explain, Key Points, Study Cards, Knowledge Check, Blind Spots, Action Plan)
- **Deep Dive Mode**: Comprehensive learning with ELI5, Key Concepts, Buzzwords, Misconceptions, Path to Mastery, Books, and Experts
- **Spaced Repetition**: SuperMemo-2 algorithm for flashcard review scheduling
- **Review System**: Due card tracking and review mode
- **Planned**: Mindmap/Diagram Mode (React Flow or better) for auto-layout graphs (ELK/Tree/Dagre), draggable nodes, and shareable embeds; supports mindmap-style diagrams similar to the provided reference.

---

## 🎯 Monetization Strategy

### Pricing Tiers

#### Free Tier (Freemium Hook)
- 3 learning paths
- 50 flashcards
- Basic AI explanations
- Web-only access
- Public sharing
- Community templates (read-only)

**Goal**: Get users hooked on the workflow

#### Pro Tier ($12/mo or $99/yr)
- Unlimited learning paths
- Unlimited flashcards
- AI Tutor Mode (Socratic Method)
- Mobile apps (iOS/Android)
- Offline mode with sync
- Analytics dashboard
- Export to Anki/Notion/Obsidian
- Priority AI processing
- Custom themes
- Advanced practice problems

**Goal**: Convert power users

#### Team Tier ($39/mo for 5 users)
- Everything in Pro
- Collaborative learning spaces
- Classroom mode with assignments
- Admin dashboard
- Bulk operations
- Team analytics
- Shared learning paths

**Goal**: Capture study groups, bootcamps, small teams

#### Enterprise (Custom pricing, starting at $99/mo)
- Everything in Team
- SSO/SAML authentication
- API access
- White-label option
- Dedicated support
- Custom integrations (HR systems)
- Compliance tracking
- Unlimited users

**Goal**: Land corporate training contracts

---

## 🚀 Phase 1: MVP for Monetization (Months 1-3)

### Priority 1: Learning Paths & Curriculum Builder ⭐⭐⭐⭐⭐

**The Problem**: People don't know what to learn next or in what order.

**Features**:
- [ ] AI-generated learning paths for any skill/topic
- [ ] Visual roadmap with modules → topics → sessions
- [ ] Progress tracking with completion percentages
- [ ] Adaptive next-step suggestions based on quiz performance
- [ ] Pre-built paths for popular topics (React, Python, Machine Learning, etc.)
- [ ] Path templates (e.g., "Career Switch to Data Science", "Ace Your Finals")

**Technical Implementation**:
- New collection: `learning_paths` (id, user, title, goal, modules, progress, created, updated)
- New collection: `path_modules` (id, path_id, title, order, topics, locked)
- AI prompt engineering for curriculum generation
- Progress calculation algorithm
- Visual tree/roadmap component

**Monetization**:
- Free: 1 active path
- Pro: Unlimited paths
- Team: Shared paths with collaboration

**Success Metrics**:
- Path completion rate > 30%
- Average time to complete module < 7 days
- User retention after starting path > 60%

---

### Priority 2: Smart Review Queue with Analytics ⭐⭐⭐⭐⭐

**The Problem**: Spaced repetition only works if you actually do it.

**Features**:
- [ ] Daily review reminders (email + push notifications)
- [ ] Streak tracking with visual calendar
- [ ] Gamification: badges, levels, achievements
- [ ] Learning velocity analytics ("You're learning 3x faster than average")
- [ ] Retention heatmap (calendar view showing mastery over time)
- [ ] Weak spot detection (AI identifies struggling concepts)
- [ ] Personalized review schedule optimization
- [ ] Social features: leaderboards, study buddies

**Technical Implementation**:
- Email service integration (SendGrid/Postmark)
- Push notification service (OneSignal/Firebase)
- Analytics engine for velocity calculations
- Heatmap visualization component
- AI analysis of quiz/flashcard performance
- Gamification point system

**Monetization**:
- Free: 50 cards, basic reminders
- Pro: Unlimited cards, advanced analytics, streak recovery
- Team: Group leaderboards, team challenges

**Success Metrics**:
- Daily active users (DAU) > 40%
- Average streak length > 14 days
- Review completion rate > 70%

---

### Priority 3: Mobile PWA (Progressive Web App) ⭐⭐⭐⭐

**The Problem**: Learning happens everywhere, not just at your desk.

**Features**:
- [ ] Responsive mobile-first design
- [ ] Offline mode with service workers
- [ ] Install to home screen
- [ ] Quick capture: voice notes → AI converts to flashcards
- [ ] Swipe gestures for flashcard review
- [ ] Background sync
- [ ] Push notifications

**Technical Implementation**:
- PWA manifest configuration
- Service worker for offline caching
- IndexedDB for local storage
- Web Speech API for voice capture
- Touch/swipe gesture handlers
- Background sync API

**Monetization**:
- Free: Web-only, limited offline
- Pro: Full offline mode, voice capture, unlimited sync

**Success Metrics**:
- Mobile traffic > 50%
- PWA install rate > 20%
- Mobile session length > 5 minutes

---

### Priority 4: Analytics Dashboard ⭐⭐⭐⭐

**The Problem**: Users need to see their progress to stay motivated.

**Features**:
- [ ] Learning velocity graph (concepts learned over time)
- [ ] Retention curve (how well you remember over time)
- [ ] Time invested breakdown (by topic/path)
- [ ] Mastery levels (beginner → intermediate → expert)
- [ ] Weak spots report with recommendations
- [ ] Streak calendar with recovery options
- [ ] Comparative analytics ("Top 10% of learners")
- [ ] Export reports (PDF/CSV)

**Technical Implementation**:
- Data aggregation queries
- Chart.js/Recharts for visualizations
- Statistical calculations (retention curves, velocity)
- PDF generation library
- Caching layer for performance

**Monetization**:
- Free: Basic stats (total cards, current streak)
- Pro: Full analytics suite, exports, comparisons

**Success Metrics**:
- Dashboard visit rate > 30% of sessions
- Average time on dashboard > 2 minutes
- Correlation between dashboard usage and retention

---

### Priority 5: Payment Integration (Stripe) ⭐⭐⭐⭐⭐

**The Problem**: Can't make money without payments.

**Features**:
- [ ] Stripe Checkout integration
- [ ] Subscription management (upgrade/downgrade/cancel)
- [ ] Billing portal
- [ ] Usage-based limits enforcement
- [ ] Trial period (14 days)
- [ ] Promo codes/coupons
- [ ] Team billing (seat-based)
- [ ] Invoice generation

**Technical Implementation**:
- Stripe SDK integration
- Webhook handlers for subscription events
- Middleware for feature gating
- Customer portal integration
- Usage tracking system

**Monetization**:
- This IS the monetization

**Success Metrics**:
- Free → Pro conversion rate > 5%
- Monthly churn rate < 5%
- Average LTV > $144 (12 months)

---

## 🔥 Phase 2: Differentiation Features (Months 4-6)

### Priority 6: AI Tutor Mode (Socratic Method) ⭐⭐⭐⭐⭐

**The Problem**: Passive learning doesn't stick. You need active recall.

**Features**:
- [ ] Socratic questioning instead of direct answers
- [ ] Adaptive difficulty based on user responses
- [ ] Hint system (progressive disclosure)
- [ ] "Aha moment" detection and reinforcement
- [ ] Conversation history and replay
- [ ] Multi-turn dialogue support
- [ ] Personalized teaching style

**Example Flow**:
```
User: "Explain quantum entanglement"
AI: "Before I explain, what do you think happens when you 
     measure one entangled particle?"
User: "The other one changes?"
AI: "Interesting! What makes you think it 'changes'? Could 
     there be another explanation for why they're correlated?"
```

**Technical Implementation**:
- Advanced prompt engineering for Socratic dialogue
- Conversation state management
- Response quality evaluation
- Hint generation algorithm
- Session persistence

**Monetization**:
- Free: Basic explanations (current mode)
- Pro: Socratic tutoring, unlimited sessions

**Success Metrics**:
- Tutor session completion rate > 60%
- Average session length > 5 minutes
- User satisfaction rating > 4.5/5

---

### Priority 7: AI-Powered Knowledge Graph ⭐⭐⭐⭐⭐

**The Problem**: Learning is disconnected. Related concepts aren't linked.

**Features**:
- [ ] Automatic concept extraction from learning sessions
- [ ] AI-powered relationship detection
- [ ] Visual graph view (nodes = concepts, edges = relationships)
- [ ] "You might want to review X before learning Y" suggestions
- [ ] Prerequisite detection
- [ ] Concept clustering (related topics)
- [ ] Search by concept
- [ ] Export graph as image/JSON

**Example**:
```
You're learning "React Hooks"
↓
AI notices you previously studied "Closures in JavaScript"
↓
Suggests: "Want to understand why useEffect works? Review closures first."
```

**Technical Implementation**:
- NLP for concept extraction
- Graph database (Neo4j or in-memory graph)
- Relationship scoring algorithm
- Force-directed graph visualization (D3.js/Cytoscape)
- Prerequisite detection logic

**Monetization**:
- Free: Basic connections (manual tags)
- Pro: AI-powered graph, visual explorer, smart suggestions

**Success Metrics**:
- Concepts extracted per session > 5
- Graph navigation rate > 20%
- "Review prerequisite" click-through > 40%

---

### Priority 8: AI-Generated Practice Problems ⭐⭐⭐⭐⭐

**The Problem**: Most tools stop at explanation. This forces application.

**Features**:
- [ ] Multiple choice quizzes (adaptive difficulty)
- [ ] Coding challenges (with test cases)
- [ ] Essay prompts with AI grading
- [ ] Real-world scenario problems
- [ ] Difficulty progression (easy → hard)
- [ ] Instant feedback with explanations
- [ ] Problem history and retry
- [ ] Spaced repetition for problems

**Example**: Learning "SQL Joins"
```
AI generates:
"You have two tables: users and orders. Write a query to find 
all users who have never placed an order."

[Code editor]

Test cases:
✓ Returns correct users
✓ Handles empty tables
✗ Performance on large dataset
```

**Technical Implementation**:
- Problem generation prompts (per topic type)
- Code execution sandbox (Judge0/Piston API)
- Test case generation
- AI grading for open-ended responses
- Difficulty calibration algorithm

**Monetization**:
- Free: 5 practice problems/day
- Pro: Unlimited problems, coding challenges, AI grading

**Success Metrics**:
- Problem attempt rate > 50% after learning session
- Average attempts per problem > 2
- Completion rate > 40%

---

### Priority 9: Export to Anki/Notion/Obsidian ⭐⭐⭐

**The Problem**: Users fear vendor lock-in.

**Features**:
- [ ] One-click export to Anki (.apkg format)
- [ ] Notion integration (bidirectional sync)
- [ ] Obsidian markdown export
- [ ] CSV/JSON export
- [ ] Import from Anki/Quizlet
- [ ] Scheduled auto-exports
- [ ] Selective export (by path/topic)

**Technical Implementation**:
- Anki package format generator
- Notion API integration
- Markdown formatter
- Import parsers
- Scheduled job system

**Monetization**:
- Free: Basic export (CSV)
- Pro: All formats, bidirectional sync, auto-export

**Success Metrics**:
- Export usage rate > 15%
- Import conversion rate > 10%
- Retention of users who export > 70%

---

## 🎓 Phase 3: Team & Education Features (Months 7-9)

### Priority 10: Classroom Mode ⭐⭐⭐⭐⭐

**The Problem**: Teachers want to track student progress.

**Features**:
- [ ] Create assignments (learning paths)
- [ ] Student roster management
- [ ] Real-time progress dashboard
- [ ] Identify struggling students (auto-flagging)
- [ ] Bulk flashcard creation from curriculum
- [ ] Grading and feedback system
- [ ] Attendance tracking (session completion)
- [ ] Parent/admin reports

**Technical Implementation**:
- Role-based access control (teacher/student/admin)
- Assignment distribution system
- Real-time progress aggregation
- Alert system for struggling students
- Bulk import tools (CSV)
- Report generation

**Monetization**:
- Team tier required
- Per-student pricing for large classes

**Success Metrics**:
- Teacher adoption rate (target: 100 teachers in 6 months)
- Average class size > 20 students
- Student engagement rate > 70%

---

### Priority 11: Collaborative Learning Spaces ⭐⭐⭐⭐

**The Problem**: Learning alone is hard. Study groups are disorganized.

**Features**:
- [ ] Shared learning paths
- [ ] Group flashcard decks
- [ ] Peer review mode (students quiz each other)
- [ ] Discussion threads on topics
- [ ] Real-time collaboration (like Google Docs)
- [ ] Group challenges and competitions
- [ ] Shared analytics

**Technical Implementation**:
- WebSocket for real-time collaboration
- Operational Transform (OT) or CRDT for conflict resolution
- Permissions system
- Notification system
- Group chat integration

**Monetization**:
- Free: Solo-only
- Team: Collaboration enabled

**Success Metrics**:
- Groups created per month > 100
- Average group size > 4
- Group retention > 60%

---

## 🏢 Phase 4: Enterprise Features (Months 10-12)

### Priority 12: Corporate Training & Onboarding ⭐⭐⭐⭐⭐

**The Problem**: Employee onboarding is expensive and inconsistent.

**Features**:
- [ ] Auto-generate onboarding paths from company docs
- [ ] Employee certification tracking
- [ ] Compliance training modules
- [ ] Integration with HR systems (BambooHR, Workday, ADP)
- [ ] Custom branding (white-label)
- [ ] SSO/SAML authentication
- [ ] Advanced analytics (manager dashboards)
- [ ] API for custom integrations

**Technical Implementation**:
- Document parsing (PDF/DOCX → learning path)
- SAML/OAuth integration
- White-label theming system
- HR system webhooks
- Enterprise API with rate limiting

**Monetization**:
- Custom pricing (typically $200-500/mo base + per-user)
- Annual contracts

**Success Metrics**:
- Enterprise deals closed > 5 in year 1
- Average contract value > $5,000/yr
- Enterprise churn < 10%

---

## 🔮 Phase 5: Advanced Features (Year 2+)

### Priority 13: Learning Autopilot (Killer Feature) ⭐⭐⭐⭐⭐

**The Problem**: Decision fatigue kills learning momentum.

**Features**:
- [ ] Goal-based curriculum generation ("Get a job as a data scientist")
- [ ] Daily learning schedule (personalized timing)
- [ ] Adaptive pacing based on performance
- [ ] Daily push: "Here's what to study today"
- [ ] Milestone tracking with celebrations
- [ ] Automatic difficulty adjustment
- [ ] Recovery mode (if you fall behind)

**User Flow**:
```
1. User sets goal: "Get a job as a data scientist"
2. AI generates 6-month curriculum
3. Breaks into daily 30-minute sessions
4. Sends daily notification: "Today: Learn Pandas DataFrames"
5. Tracks progress toward goal
6. Adjusts if user struggles or excels
7. Celebrates milestones: "You're 25% to your goal!"
```

**Technical Implementation**:
- Goal parsing and curriculum generation
- Scheduling algorithm (considers user availability)
- Performance tracking and adaptation
- Notification orchestration
- Milestone detection

**Monetization**:
- Free: Generic path
- Pro: Personalized + adaptive autopilot

**Success Metrics**:
- Autopilot activation rate > 40%
- Goal completion rate > 25%
- Retention of autopilot users > 80%

---

### Priority 14: Multi-Modal Learning ⭐⭐⭐⭐

**Features**:
- [ ] AI-generated audio explanations (podcast-style)
- [ ] Video summaries (AI avatar)
- [ ] Interactive diagrams (draw to learn)
- [ ] AR/VR support (future)
- [ ] Learning style detection
- [ ] Format preferences

**Monetization**:
- Free: Text-only
- Pro: Audio/video/interactive

---

### Priority 15: Community Templates & Marketplace ⭐⭐⭐⭐

**Features**:
- [ ] Share learning paths publicly
- [ ] Template marketplace
- [ ] Creator revenue sharing
- [ ] Ratings and reviews
- [ ] Featured templates
- [ ] Template remixing

**Monetization**:
- Platform fee on paid templates (20%)
- Premium template access for Pro users

---

## 📊 Success Metrics & KPIs

### User Acquisition
- Monthly signups: 1,000 (Month 3) → 10,000 (Month 12)
- Organic vs. paid ratio: 70/30
- Referral rate: 20%

### Engagement
- Daily Active Users (DAU): 30% of MAU
- Average session length: 15 minutes
- Sessions per week: 4+

### Monetization
- Free → Pro conversion: 5%
- Monthly churn: < 5%
- Average LTV: $144 (12 months × $12)
- Year 1 ARR: $77k
- Year 2 ARR: $395k
- Year 3 ARR: $1.1M

### Retention
- Day 1: 60%
- Day 7: 40%
- Day 30: 25%
- Month 6: 15%

---

## 🎯 Go-to-Market Strategy

### Phase 1: Niche Domination (Months 1-6)
**Target**: Self-taught developers learning to code

**Tactics**:
- Create "Learn React in 30 Days" path (free, high-quality)
- Post on r/learnprogramming, r/webdev, r/reactjs
- Partner with FreeCodeCamp, The Odin Project
- Offer free Pro to course creators who integrate
- Launch on Product Hunt
- Write technical blog posts (SEO)

**Goal**: 10,000 users, 500 paying

---

### Phase 2: Horizontal Expansion (Months 6-12)
**Target**: Students (high school/college)

**Tactics**:
- "Ace Your Finals" campaign
- University partnerships (offer to CS departments)
- Student discount (50% off)
- Referral program (free month per friend)
- TikTok/Instagram content marketing
- Sponsor student hackathons

**Goal**: 50,000 users, 2,500 paying

---

### Phase 3: B2B Pivot (Year 2+)
**Target**: Corporate training departments

**Tactics**:
- Case studies from early adopters
- LinkedIn ads targeting L&D managers
- Attend HR/training conferences (ATD, Learning Technologies)
- Offer free pilot programs (3 months)
- Build integration marketplace
- Hire enterprise sales team

**Goal**: 5-10 enterprise deals, $300k+ ARR from B2B

---

## 🛠️ Technical Architecture

### Backend Migration (Supabase)
- [ ] Migrate from PocketBase to Supabase
- [ ] Set up RLS policies
- [ ] Implement Edge Functions for AI processing
- [ ] Set up Supabase Auth
- [ ] Database schema migration

### Infrastructure
- [ ] CDN for static assets (Cloudflare)
- [ ] Redis for caching
- [ ] Queue system for background jobs (BullMQ)
- [ ] Monitoring (Sentry, LogRocket)
- [ ] Analytics (PostHog, Mixpanel)

### Mobile Apps
- [ ] React Native apps (iOS/Android)
- [ ] Or: Capacitor (PWA → native)
- [ ] App Store optimization
- [ ] Push notification service

---

## 💡 Competitive Advantages

1. **Visual + AI + Spaced Repetition**: No competitor does all three
2. **Outcome-focused**: "Get a job" not "learn Python"
3. **Knowledge Graph**: Automatic concept linking (Roam requires manual)
4. **Socratic Tutoring**: Active learning, not passive consumption
5. **Multi-modal**: Text, audio, video, interactive
6. **Autopilot**: Removes decision fatigue
7. **Open ecosystem**: Export anywhere, no lock-in

---

## 🚨 Risks & Mitigations

### Risk 1: AI costs too high
**Mitigation**: 
- Use cheaper models for simple tasks (Groq/Cerebras)
- Cache common responses
- Rate limiting on free tier
- User brings own API key option

### Risk 2: Low conversion rate
**Mitigation**:
- A/B test pricing ($9 vs $12 vs $15)
- Offer annual discount (2 months free)
- Add "freemium ceiling" (50 cards is too limiting?)
- Trial period (14 days)

### Risk 3: High churn
**Mitigation**:
- Email re-engagement campaigns
- Streak recovery features
- Exit surveys to understand why
- Offer pause subscription (not cancel)

### Risk 4: Competition from big players
**Mitigation**:
- Move fast, build community
- Focus on niche (developers first)
- Better UX than enterprise tools
- Open ecosystem (they're walled gardens)

---

## 📅 Timeline Summary

**Q1 2025**: MVP (Learning Paths, Review Queue, PWA, Analytics, Stripe)
**Q2 2025**: Differentiation (AI Tutor, Knowledge Graph, Practice Problems)
**Q3 2025**: Team Features (Classroom, Collaboration)
**Q4 2025**: Enterprise (SSO, White-label, HR integrations)
**2026**: Scale (Autopilot, Multi-modal, Marketplace)

---

## 🎬 Next Steps

1. ✅ **Validate demand**: Post on Reddit/Twitter
2. [ ] **Build MVP**: Learning Paths + Review Queue + Stripe
3. [ ] **Add video timeline export**: Remotion / Re.video (https://re.video) animated timeline → MP4/GIF
4. [ ] **Create timeline generation API**: Public endpoints for generating timelines from text/markdown (integrations like Windmill)
5. [ ] **Get 10 paying users**: Manual onboarding, feedback
6. [ ] **Iterate**: Fix what's broken, double down on what works
7. [ ] **Scale**: Product-market fit → growth

---

**Remember**: People don't pay for features. They pay for transformation.

**Tagline**: "Master anything, faster. Substantifique turns curiosity into expertise."
