# Quick Start - Testing New Features

## Prerequisites
- Flask app running on `http://localhost:5000` (or your configured host)
- Test images ready (with and without GPS data)

## Feature Testing Guide

### 1. Test Favicon (30 seconds)
1. Open browser
2. Navigate to `http://localhost:5000`
3. **Check**: Browser tab shows custom icon (not default)
4. **Check**: Bookmark page and verify icon appears

**Expected**: Custom favicon visible in tab and bookmarks

---

### 2. Test Multiple File Upload (2 minutes)

#### Via File Picker
1. Click upload area
2. Hold Ctrl/Cmd and select 3 images
3. **Check**: 3 preview cards appear in grid
4. **Check**: Each shows thumbnail, filename, file size
5. **Check**: Each has a "Remove" button

#### Via Drag & Drop
1. Open file explorer
2. Select 3 images
3. Drag onto upload area
4. **Check**: Same as above

**Expected**: All files preview correctly with remove buttons

---

### 3. Test Preview Cancellation (1 minute)

1. Upload 3 files (see above)
2. Click "Remove" on middle card
3. **Check**: Middle card disappears
4. **Check**: Other 2 cards remain
5. Click "Remove" on remaining cards
6. **Check**: Preview container hides when all removed

**Expected**: Individual removal works, container hides when empty

---

### 4. Test GPS Detection - WITH GPS (3 minutes)

#### Get Test Image
- Use smartphone photo with location enabled
- Or download sample: https://github.com/ianare/exif-samples/raw/master/jpg/gps/DSCN0010.jpg

#### Test Steps
1. Upload GPS-enabled image
2. Click "Analyze Metadata"
3. **Check**: Blue "View Location on Google Maps" button appears
4. **Check**: Coordinates shown: `(lat, lon)`
5. Click the map link
6. **Check**: Google Maps opens in new tab
7. **Check**: Map shows correct location

**Expected**: Map link works and shows correct location

---

### 5. Test GPS Detection - WITHOUT GPS (2 minutes)

#### Get Test Image
- Use screenshot
- Or any image edited in Photoshop
- Or download sample without GPS

#### Test Steps
1. Upload non-GPS image
2. Click "Analyze Metadata"
3. **Check**: Gray box appears
4. **Check**: Message: "📍 GPS location data not available"
5. **Check**: No clickable link

**Expected**: Clear "not available" message, no link

---

## Quick Test Script

### Automated Test (5 minutes)
```
1. Upload single image with GPS
   → Verify: GPS link appears
   
2. Upload single image without GPS
   → Verify: "Not available" message
   
3. Upload 5 images
   → Verify: 5 preview cards
   
4. Remove 3 cards
   → Verify: 2 remain
   
5. Analyze remaining files
   → Verify: First file processed
   
6. Check browser tab
   → Verify: Favicon visible
```

---

## Common Issues & Solutions

### Issue: Favicon Not Showing
**Solution**: 
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Clear browser cache
- Check Flask is serving static files correctly

### Issue: GPS Link Not Appearing
**Debug Steps**:
1. Open browser console (F12)
2. Check for JavaScript errors
3. Verify metadata has `GPS` section
4. Check if `GPSLatitude` and `GPSLongitude` exist

**Solution**:
- Ensure image actually has GPS data
- Test with known GPS image (link above)

### Issue: Preview Cards Not Showing
**Debug Steps**:
1. Check browser console for errors
2. Verify `multiple` attribute on file input
3. Check CSS is loading correctly

**Solution**:
- Hard refresh browser
- Check `static/style.css` is accessible

### Issue: Remove Button Not Working
**Debug Steps**:
1. Check console for JavaScript errors
2. Verify event listeners are binding

**Solution**:
- Ensure `ui.js` is loading after DOM ready
- Check for JavaScript syntax errors

---

## Browser Compatibility Testing

### Desktop
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)

### Mobile
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

### Expected Behavior
- All features work on modern browsers
- Graceful degradation on older browsers
- Touch-friendly on mobile

---

## Performance Testing

### Large File Test
1. Upload 200MB image
2. **Check**: Preview loads
3. **Check**: Analysis completes
4. **Check**: No browser freeze

**Expected**: Smooth operation even with large files

### Multiple File Test
1. Upload 10 images
2. **Check**: All previews render
3. **Check**: No lag when scrolling
4. **Check**: Remove buttons responsive

**Expected**: Grid layout handles many files

---

## Privacy Verification

### Verify No Server Storage
1. Upload image with GPS
2. Analyze metadata
3. Check server directory
4. **Verify**: No files saved to disk

### Verify GPS Privacy
1. Upload GPS image
2. Check network tab (F12)
3. **Verify**: GPS coordinates only sent to Google Maps when user clicks link
4. **Verify**: No automatic GPS transmission

---

## Edge Case Testing

### Test: Corrupted GPS Data
1. Upload image with partial GPS
2. **Expected**: "Not available" message (graceful fallback)

### Test: Very Long Filename
1. Upload file: `this_is_a_very_long_filename_that_should_truncate_properly.jpg`
2. **Expected**: Filename truncates with ellipsis

### Test: Special Characters
1. Upload file: `photo (1) [test].jpg`
2. **Expected**: Displays correctly, no errors

### Test: Mixed File Types
1. Select 2 images + 1 PDF
2. **Expected**: Only images preview, PDF ignored

---

## Success Criteria

### All Features Working
- ✅ Favicon visible in browser tab
- ✅ Multiple files can be selected
- ✅ Preview cards display correctly
- ✅ Remove buttons work individually
- ✅ GPS link appears when data exists
- ✅ "Not available" shows when GPS missing
- ✅ Map link opens correct location
- ✅ No JavaScript errors in console
- ✅ No memory leaks (check DevTools)
- ✅ Responsive on mobile

### Performance Benchmarks
- ✅ Preview render: < 500ms for 10 files
- ✅ Analysis: < 2s for 5MB image
- ✅ No UI freeze during processing
- ✅ Smooth animations

### Privacy Maintained
- ✅ No files stored on server
- ✅ GPS only sent to Maps when user clicks
- ✅ Memory cleaned up properly

---

## Reporting Issues

If you find a bug, report with:
1. **Browser**: Chrome 120, Firefox 121, etc.
2. **OS**: Windows 11, macOS 14, etc.
3. **Steps to reproduce**
4. **Expected behavior**
5. **Actual behavior**
6. **Console errors** (F12 → Console tab)
7. **Screenshot** (if visual issue)

---

## Next Steps After Testing

### If All Tests Pass
1. Deploy to production
2. Monitor for errors
3. Gather user feedback

### If Issues Found
1. Check documentation (FEATURES.md, GPS_REFERENCE.md)
2. Review console errors
3. Test in different browser
4. Report issue with details above

---

## Quick Reference

### Test Images
- **With GPS**: Smartphone photo with location enabled
- **Without GPS**: Screenshot or edited image
- **Sample GPS**: https://github.com/ianare/exif-samples/raw/master/jpg/gps/DSCN0010.jpg

### Key Files
- `templates/index.html` - HTML structure
- `static/style.css` - Styling
- `static/ui.js` - JavaScript logic
- `utils/metadata_tools.py` - Backend processing

### Documentation
- `IMPLEMENTATION_SUMMARY.md` - Feature overview
- `FEATURES.md` - Detailed implementation
- `GPS_REFERENCE.md` - GPS technical details
- `UI_GUIDE.md` - Visual changes

---

Happy testing! 🚀
