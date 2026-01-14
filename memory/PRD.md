# PayoutHub - Insurance Aggregator CRM
## Product Requirements Document

### Original Problem Statement
Build a CRM-like system for a P&C (Property & Casualty) insurance aggregator company. The company facilitates payouts from different insurance carriers to agents - they are not an agency themselves. The system needs to:
- Take in reports from insurance carriers in various formats (PDFs, Excel)
- Break down information into correct fields
- Identify conflicts in data
- Handle different formats with different primary key fields
- Allow custom field mapping per carrier
- Focus heavily on data formatting and extraction

### User Personas
1. **Operations Manager** - Reviews extracted data, resolves conflicts, approves payouts
2. **Data Administrator** - Configures carriers, sets up field mappings, manages agents
3. **Finance Team** - Tracks payouts, generates reports, marks payments complete

### Core Requirements (Static)
- Secure JWT authentication
- Carrier management with custom field mapping per carrier
- Agent/Payee management with commission tracking
- Document upload (PDF, Excel, CSV) with AI-powered extraction
- Conflict detection (duplicates, field mismatches)
- Data review and validation workflow
- Payout generation and tracking

### What's Been Implemented (January 14, 2026)
- [x] User authentication (register, login, logout)
- [x] Dashboard with stats overview (carriers, agents, uploads, conflicts, payouts)
- [x] Carrier CRUD with field mapping configuration
- [x] **Carrier-specific parsing config** (header_row, data_start_row per carrier)
- [x] AI-powered field mapping suggestions (Gemini integration)
- [x] Agent CRUD with commission rates
- [x] Document upload center (Excel, PDF, CSV support)
- [x] **Smart Excel header detection** (auto-detects header rows)
- [x] **File structure preview API** for configuration
- [x] AI data extraction from uploaded documents
- [x] Data review page with validation/rejection
- [x] Conflict detection and resolution UI
- [x] Payout generation from validated records
- [x] Payout tracking and completion marking
- [x] Professional Swiss/High-Contrast UI design

### Tested Carriers
- **Foremost Signature**: Excel format, header row 4, 423+ records extracted successfully
- **GEICO**: Complex multi-LOB structure (requires custom parsing)
- **Foremost Specialty**: PDF agency scorecard format

### Technical Stack
- **Frontend**: React 19, Tailwind CSS, Shadcn UI, React Router
- **Backend**: FastAPI, Motor (async MongoDB driver)
- **Database**: MongoDB
- **AI Integration**: Emergent LLM Key with Gemini 2.5 Flash for document extraction

### API Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `GET/POST/PUT/DELETE /api/carriers` - Carrier management
- `PUT /api/carriers/{id}/field-mappings` - Update field mappings
- `POST /api/carriers/{id}/suggest-mappings` - AI mapping suggestions
- `GET/POST/PUT/DELETE /api/agents` - Agent management
- `POST /api/uploads` - Upload carrier reports
- `POST /api/uploads/preview` - Preview Excel file structure
- `GET /api/uploads` - List uploads
- `GET /api/records` - List extracted records
- `PUT /api/records/{id}/validate` - Validate record
- `PUT /api/records/{id}/reject` - Reject record
- `GET /api/conflicts` - List conflicts
- `PUT /api/conflicts/{id}/resolve` - Resolve conflict
- `POST /api/payouts/generate` - Generate payouts
- `GET /api/payouts` - List payouts
- `PUT /api/payouts/{id}/complete` - Mark payout complete
- `GET /api/dashboard` - Dashboard stats

### Prioritized Backlog

#### P0 (Critical - Next Phase)
- [ ] GEICO multi-LOB Excel parser (complex structure)
- [ ] Foremost Specialty PDF parser optimization
- [ ] Batch processing queue for large files
- [ ] Email notifications for conflicts

#### P1 (Important)
- [ ] Agent self-service portal
- [ ] Automated reconciliation reports
- [ ] Audit trail for all actions
- [ ] Export data to CSV/Excel

#### P2 (Nice to Have)
- [ ] Multi-tenant support
- [ ] Custom report builder
- [ ] API for carrier integrations
- [ ] Mobile responsive improvements

### Next Tasks
1. Configure GEICO carrier with proper field mappings
2. Test PDF extraction with Foremost Specialty file
3. Implement batch validation/rejection
4. Add search and advanced filtering to records
5. Add date range filters to payouts
