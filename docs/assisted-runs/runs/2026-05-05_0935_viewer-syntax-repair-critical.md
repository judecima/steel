# Viewer Syntax Repair Critical

## Root Cause
An extra closing brace `}` was introduced at line 806 of `tools/qa-viewer/viewer.js` during a code injection, causing a syntax error that prevented the browser from parsing the file.

## Exact Broken Block
```javascript
801:     renderer.render(scene, camera);
802: }
803: 
804:     // Startup diagnostics for exports
805:     checkExports();
806: } // <--- EXTRA BRACE
```

## Actions Taken
1. **Syntax Fix**: Removed the extra `}` and corrected indentation.
2. **Package Script**: Added `"viewer:check": "node --check tools/qa-viewer/viewer.js"` to `package.json`.
3. **Automated Test**: Added `TEST 85` to `scripts/layer_tests.ts` to enforce syntax validation in the CI/CD pipeline.
4. **Verification**: Ran `node --check tools/qa-viewer/viewer.js` and confirmed it passes with exit code 0.

## Validation Results
- **TEST 85**: PASSED (viewer.js syntax is valid)
- **Browser State**: Ready for verification of:
  - Foundation visibility
  - Export downloads
  - Layer stats
  - Isolate/Focus features
  - Mode switching

## Guard Implemented
Future changes to `viewer.js` will be validated using `npm run viewer:check`.
