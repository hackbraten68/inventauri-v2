# Quickstart: Language Support Testing

## Overview
This quickstart guide provides step-by-step instructions for testing the internationalization features of the Inventauri application. Follow these steps to validate language detection, switching, and translation functionality.

## Prerequisites
- Node.js 18+ installed
- Application running on `http://localhost:4321`
- Git repository cloned and dependencies installed

## Test Environment Setup

### 1. Start the Development Server
```bash
cd /home/sam/Documents/GitHub/inventauri-v2
npm run dev
```

### 2. Open Browser Developer Tools
- Open Chrome/Firefox Developer Tools (F12)
- Go to Network tab to monitor API calls
- Go to Console tab to see translation warnings
- Go to Application tab to check URL parameters

## Test Scenarios

### Scenario 1: Language Detection on Page Load

**Steps**:
1. Open browser and navigate to `http://localhost:4321`
2. **Expected**: Application loads in English (default)
3. Check URL: Should show `http://localhost:4321` (no lang parameter)

**Browser Language Simulation**:
1. Open Developer Tools → Settings → Preferences
2. Change language to "Deutsch (Deutschland)" [de-DE]
3. Refresh the page
4. **Expected**: Application loads in German
5. Check URL: Should show `http://localhost:4321?lang=de`

**Validation**:
- [ ] Navigation menu shows German text
- [ ] Login form labels are in German
- [ ] Console shows no translation warnings
- [ ] URL parameter `lang=de` is set

### Scenario 2: Language Switcher Modal (Login Screen)

**Steps**:
1. Navigate to login page: `http://localhost:4321/login`
2. Look for language flag icon next to theme toggle (top-right)
3. Click the language switcher icon
4. **Expected**: Modal opens showing available languages

**Modal Testing**:
1. Click on German flag option
2. **Expected**: Modal closes, interface switches to German
3. Check URL: Should update to `http://localhost:4321/login?lang=de`
4. Verify all login form text is in German

**Validation**:
- [ ] Modal opens with correct language options
- [ ] Flag icons display correctly
- [ ] Language names show in native language
- [ ] Interface updates immediately after selection
- [ ] Modal closes after selection

### Scenario 3: Language Switcher Modal (Logged-in State)

**Steps**:
1. Log into the application (use existing credentials)
2. Navigate to dashboard or any authenticated page
3. Find language switcher next to theme toggler
4. Click the language switcher
5. **Expected**: Detailed modal opens with language options

**Detailed Modal Testing**:
1. Select German from the modal
2. **Expected**: Interface switches to German
3. Check URL parameter updates
4. Verify all dashboard content is translated
5. Navigate between pages to ensure consistency

**Validation**:
- [ ] Modal shows more detailed language information
- [ ] Language descriptions or additional info displayed
- [ ] Interface remains responsive during switch
- [ ] All authenticated pages update language
- [ ] User session persists across language changes

### Scenario 4: Missing Translation Fallback

**Steps**:
1. Switch to German: `http://localhost:4321?lang=de`
2. Open Developer Tools Console
3. Navigate through different pages
4. **Expected**: Some text may show English fallbacks

**Console Monitoring**:
1. Look for console warnings about missing translations
2. **Expected**: Format: `[i18n] Missing translation: {key} in {lang}`
3. Verify fallback text is still readable (English)
4. Check that application remains functional

**Validation**:
- [ ] Console shows appropriate warnings for missing translations
- [ ] Fallback text is English (not broken/missing)
- [ ] Application continues to work normally
- [ ] No JavaScript errors occur

### Scenario 5: Mobile Responsiveness

**Steps**:
1. Open browser Developer Tools
2. Toggle device emulation (mobile view)
3. Navigate to `http://localhost:4321`
4. Test language switching on mobile

**Mobile Testing**:
1. Click language switcher (should be touch-friendly)
2. Modal should be mobile-optimized
3. Language options should be easy to tap
4. Interface should remain usable on small screens

**Validation**:
- [ ] Language switcher is easily accessible on mobile
- [ ] Modal adapts to mobile screen size
- [ ] Touch targets are appropriately sized
- [ ] Language switching works smoothly on mobile

### Scenario 6: URL Sharing and Bookmarking

**Steps**:
1. Set language to German: `http://localhost:4321?lang=de`
2. Copy the URL from address bar
3. Open new browser tab/window
4. Paste and navigate to the URL

**Sharing Testing**:
1. **Expected**: New tab opens with German language
2. Verify all content loads in German
3. Test with different pages and states
4. Try bookmarking language-specific URLs

**Validation**:
- [ ] URLs with language parameters work correctly
- [ ] Language state persists across browser sessions
- [ ] Bookmarked URLs maintain language setting
- [ ] Shared URLs work for other users

### Scenario 7: Accessibility Testing

**Steps**:
1. Enable screen reader or accessibility tools
2. Navigate to language switcher using keyboard only
3. Test modal interactions with keyboard
4. Check ARIA labels and descriptions

**Accessibility Validation**:
1. **Expected**: All interactive elements are keyboard accessible
2. Screen reader announces language options correctly
3. Modal has proper focus management
4. Color contrast meets accessibility standards

**Validation**:
- [ ] Language switcher is keyboard navigable
- [ ] Modal supports keyboard-only interaction
- [ ] Screen reader compatibility
- [ ] Proper ARIA labels and descriptions

## Error Scenarios

### Error 1: Unsupported Language
**Steps**:
1. Manually modify URL to unsupported language: `?lang=xx`
2. Refresh the page
3. **Expected**: Falls back to English, logs error

**Validation**:
- [ ] Application loads in English
- [ ] Console shows error about unsupported language
- [ ] URL parameter is not preserved

### Error 2: Corrupted Translation Files
**Steps**:
1. Temporarily rename a translation file to test fallback
2. Refresh the page
3. **Expected**: Application continues with English fallback

**Validation**:
- [ ] Application remains functional
- [ ] Appropriate error logging
- [ ] User experience not degraded

## Performance Validation

### Load Time Testing
1. Use Developer Tools Network tab
2. Measure time to load translation files
3. **Expected**: Translation loading <100ms
4. Monitor bundle size impact

### Memory Usage
1. Monitor memory usage during language switching
2. **Expected**: No memory leaks
3. Check for proper cleanup of old translations

## Cleanup
1. Reset browser language settings to original values
2. Clear any test bookmarks or URLs
3. Close all test browser tabs

## Success Criteria
- ✅ All test scenarios pass
- ✅ No console errors (except expected translation warnings)
- ✅ Language switching works on all pages
- ✅ Mobile responsiveness maintained
- ✅ Accessibility standards met
- ✅ Performance requirements satisfied

---
*Quickstart testing guide for language support feature*
