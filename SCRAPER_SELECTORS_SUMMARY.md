# CloudUCM Scraper - Selectors Summary

## Discovered Selectors

### 1. Login Page
- **Username field**: `input[id="username"]`
- **Password field**: `input[id="password"]`
- **Submit button**: `button[type="submit"]`

### 2. Dashboard Navigation
- **CDR Menu Item**: `li.ant-menu-submenu:has-text("CDR")`
  _(Click to expand CDR submenu)_
- **Recordings Submenu**: `li[role="menuitem"]:has-text("Recordings")`
  _(Click to navigate to recordings page)_

### 3. Recordings Page
**URL**: `https://071ffb.c.myucm.cloud:8443/cdr/recordingFile`

**Table Structure**: (Table 0 - Main recordings)
- **Headers**: ['', 'Caller', 'Callee', 'Call Time', 'Size', 'Play', 'Options']
- **Cell Indices**:
  - Cell 0: Checkbox
  - Cell 1: Caller number
  - Cell 2: Callee number
  - Cell 3: Call Time (format: "2026-02-06 16:21:36")
  - Cell 4: File size
  - Cell 5: Audio player with duration
  - Cell 6: Download and delete icons

**Download Button**:
- **Selector**: `span.sprite-download`
- **Location**: In the last cell (Options column) of each table row
- **Type**: Sprite-based icon (CSS background image)

**Bulk Download Buttons** (at top of page):
- "Download" button: `button.ant-btn:has-text("Download")`
- "Download All" button: `button.ant-btn:has-text("Download All")`

## How the Scraper Works

### Step 1: Login
```python
page.goto(UCM_URL)
page.wait_for_selector('input[id="username"]')
page.fill('input[id="username"]', username)
page.fill('input[id="password"]', password)
page.click('button[type="submit"]')
page.wait_for_load_state('networkidle')
page.wait_for_timeout(5000)  # Wait for React to render
```

### Step 2: Navigate to Recordings
```python
# Expand CDR menu
page.locator('li.ant-menu-submenu:has-text("CDR")').first.click()
page.wait_for_timeout(2000)

# Click Recordings submenu
page.locator('li[role="menuitem"]:has-text("Recordings")').click()
page.wait_for_load_state('networkidle')
page.wait_for_timeout(5000)
```

### Step 3: Download Recordings
For each call needing a recording:

1. **Find matching row**:
   - Get all rows: `page.locator('tbody tr')`
   - For each row, check the call time in cell 3
   - Match against database call.calldate

2. **Click download button**:
   ```python
   download_button = row.locator('span.sprite-download')
   with page.expect_download() as download_info:
       download_button.click()
   download = download_info.value
   ```

3. **Save file**:
   ```python
   local_path = download_dir / f"{call.uniqueid}_{download.suggested_filename}"
   download.save_as(str(local_path))
   ```

4. **Upload to Supabase**:
   ```python
   remote_path = f"tenant_{call.tenant_id}/{call.uniqueid}_{filename}"
   supabase_path = storage_manager.upload_recording(local_path, remote_path)
   ```

5. **Update database**:
   ```python
   call.supabase_path = supabase_path
   db.session.commit()
   ```

6. **Trigger AI processing**:
   ```python
   process_call_ai_async(call.id, supabase_path)
   ```

## Timing Considerations

- **Login wait**: 5 seconds after networkidle (React rendering)
- **Menu expansion**: 2 seconds (animation)
- **Page navigation**: 5 seconds after networkidle (table loading)
- **Download timeout**: 30 seconds max per file

## Error Handling

- If row not found: Log warning, recording might be on different page
- If download button missing: Log warning, skip that recording
- If download fails: Catch exception, continue to next recording
- If Supabase upload fails: Keep local file, don't update database

## Pagination

Current recordings page shows 10 rows per page with pagination at bottom.
The scraper currently only checks the first page.

To handle pagination in future:
- Check total page count
- Loop through pages
- Click next page button between iterations

## Known Limitations

1. **Single page only**: Only processes recordings visible on page 1
2. **No date filtering**: Doesn't use the date range filters available in UI
3. **No search**: Doesn't use search box to find specific calls
4. **Sequential processing**: Downloads one recording at a time

## Potential Improvements

1. Add pagination support to process all pages
2. Use date filters to narrow down results
3. Batch download using "Download All" button
4. Add retry logic for failed downloads
5. Parallel processing with multiple browser instances
