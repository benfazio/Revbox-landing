# Rev-Box Data Management
## Product Requirements Document

### Original Problem Statement
Build a data management/formatting tool for a P&C insurance aggregator company. The company facilitates payouts from different insurance carriers to agents. Key requirements:
- Focus on DATA FORMATTING AND EXTRACTION over traditional CRM
- Take in reports from carriers in various formats (PDFs, Excel)
- Custom field mapping per carrier/data source
- Staging area for holding data before approval
- Side-by-side conflict resolution with full context
- Ability to delete bad uploads easily
- Table linking through primary keys (broker ID, agent code, etc.)

### User Personas
1. **Data Administrator** - Configures data sources, sets up field mappings
2. **Operations Staff** - Reviews staged data, resolves conflicts, approves records
3. **Analyst** - Links tables, exports approved data for reporting

### Core Requirements (Static)
- Secure JWT authentication
- Data Source management with custom field mapping
- Configurable parsing (header row, data start row per source)
- Staging area for all uploaded data (review before approval)
- Side-by-side conflict resolution with full record context
- Approved data repository
- Table linking via primary key fields
- Easy deletion of bad/wrong uploads

### What's Been Implemented (January 14, 2026)

#### Data Flow
1. **Data Sources** - Configure carriers with field mappings
2. **Upload** - Import files (staged automatically)
3. **Staging Area** - Review all data before approval
4. **Conflict Resolution** - Side-by-side comparison with context
5. **Approved Data** - Clean, validated records
6. **Table Linking** - Combine sources by primary key

#### Features
- [x] Rev-Box branding and professional dark UI
- [x] Data Sources management (CRUD)
- [x] File structure preview for Excel files
- [x] Auto-detect header rows in Excel
- [x] Configurable header_row and data_start_row per source
- [x] Field mapping with standard field library
- [x] Primary key field designation
- [x] Staging area with all uploads
- [x] Bulk select/approve/reject records
- [x] Easy upload deletion
- [x] Side-by-side conflict comparison
- [x] Full record context in conflict view
- [x] Manual value entry for conflicts
- [x] Approved data export to CSV
- [x] Table linking by common fields
- [x] Link preview with merged data

### Technical Stack
- **Frontend**: React 19, Tailwind CSS, Shadcn UI
- **Backend**: FastAPI, Motor (async MongoDB)
- **Database**: MongoDB
- **AI**: Emergent LLM Key (Gemini 2.5 Flash) for PDF extraction

### API Endpoints
- `GET/POST/PUT/DELETE /api/carriers` - Data source management
- `PUT /api/carriers/{id}/field-mappings` - Field mapping config
- `POST /api/uploads/preview` - Preview Excel structure
- `POST /api/uploads` - Upload files to staging
- `GET /api/uploads/{id}/records` - Records for an upload
- `GET /api/records` - List records with filters
- `PUT /api/records/{id}/validate` - Approve record
- `PUT /api/records/{id}/reject` - Reject/delete record
- `GET /api/conflicts` - List conflicts
- `PUT /api/conflicts/{id}/resolve` - Resolve conflict
- `GET /api/dashboard` - Stats overview

### Tested Data Sources
- **Foremost Signature**: Excel, header row 4, 423+ records
- **GEICO**: Complex multi-LOB structure (needs custom parsing)
- **Foremost Specialty**: PDF scorecard format

### Prioritized Backlog

#### P0 (Critical)
- [ ] Improve session timeout handling
- [ ] Add search/filter to Staging Area records
- [ ] Batch conflict resolution

#### P1 (Important)
- [ ] Save linked table results
- [ ] Custom field creation
- [ ] Audit trail for approvals/rejections
- [ ] User roles and permissions

#### P2 (Nice to Have)
- [ ] API import from carriers
- [ ] Scheduled imports
- [ ] Dashboard analytics/charts

### Next Tasks
1. Add search to Staging Area
2. Test GEICO file parsing
3. Add batch conflict resolution ("resolve all same way")
4. Implement linked data export
