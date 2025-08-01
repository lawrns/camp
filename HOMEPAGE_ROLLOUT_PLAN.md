# Homepage Rollout Plan

## Overview

This document outlines the implementation of a feature-flag-based homepage replacement strategy that allows safe A/B testing between the legacy homepage and the new commie homepage.

## Implementation Status

✅ **COMPLETED**

### What Was Implemented

1. **Feature Flag Setup**
   - Added `NEXT_PUBLIC_HOMEPAGE_VARIANT` to `env.mjs`
   - Created `useHomepageVariant()` hook for client-side access
   - Default value: "legacy"

2. **Component Extraction**
   - Created `app/LegacyHome.tsx` - contains original homepage content
   - Created `app/CommieHome.tsx` - imports and renders commie homepage
   - Updated `app/page.tsx` - conditionally renders based on feature flag

3. **SEO & Metadata**
   - Added canonical URL support in `app/layout.tsx`
   - Preserved all existing meta tags

4. **Testing**
   - Created test page at `/test-homepage-variant`
   - Build passes successfully
   - No breaking changes to existing functionality

## Usage

### Environment Variables

```bash
# For legacy homepage (default)
NEXT_PUBLIC_HOMEPAGE_VARIANT=legacy

# For new commie homepage
NEXT_PUBLIC_HOMEPAGE_VARIANT=commie
```

### Testing

1. **Local Testing**
   ```bash
   # Test legacy variant
   NEXT_PUBLIC_HOMEPAGE_VARIANT=legacy npm run dev
   
   # Test commie variant
   NEXT_PUBLIC_HOMEPAGE_VARIANT=commie npm run dev
   ```

2. **Test Page**
   - Visit `/test-homepage-variant` to see current variant
   - Visit `/` to see homepage in action

## Rollout Strategy

### Phase 1: Staging (Current)
- [ ] Deploy to staging with `NEXT_PUBLIC_HOMEPAGE_VARIANT=commie`
- [ ] Test all functionality
- [ ] Monitor performance and errors

### Phase 2: Production (Gradual)
- [ ] Deploy to production with `NEXT_PUBLIC_HOMEPAGE_VARIANT=legacy` (default)
- [ ] Switch to `NEXT_PUBLIC_HOMEPAGE_VARIANT=commie` for 10% traffic
- [ ] Monitor metrics and user feedback
- [ ] Gradually increase to 50%, then 100%

### Phase 3: Cleanup (After Stabilization)
- [ ] Remove feature flag logic
- [ ] Make commie homepage the default
- [ ] Remove legacy components if no longer needed

## Safety Features

1. **Easy Rollback**: Simply change environment variable to "legacy"
2. **No Data Loss**: All existing functionality preserved
3. **A/B Testing Ready**: Can easily switch between variants
4. **SEO Preserved**: Canonical URLs and meta tags maintained

## Monitoring

### Key Metrics to Watch
- Page load times
- User engagement (time on page, bounce rate)
- Error rates
- Conversion rates (if applicable)

### Rollback Triggers
- Increased error rates
- Performance degradation
- Negative user feedback
- SEO impact

## Files Modified

- `env.mjs` - Added feature flag
- `hooks/useHomepageVariant.ts` - New hook
- `app/LegacyHome.tsx` - Extracted legacy homepage
- `app/CommieHome.tsx` - New commie homepage wrapper
- `app/page.tsx` - Updated to use feature flag
- `app/layout.tsx` - Added canonical URL
- `app/test-homepage-variant/page.tsx` - Test page

## Next Steps

1. Deploy to staging environment
2. Test with `NEXT_PUBLIC_HOMEPAGE_VARIANT=commie`
3. Monitor for 24-48 hours
4. If successful, proceed to production rollout
5. If issues arise, rollback to legacy immediately 