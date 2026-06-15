# Changelog

## [1.0.2] - 2026-06-15

### Fixed
- **Crash on launch (release APK)**: Added `babel.config.js` with `react-native-reanimated/plugin` — `parallax-scroll-view.tsx` uses `useAnimatedStyle` (worklet) which requires the Reanimated Babel plugin; without it, Hermes crashes on launch
- **Build fix**: Installed correct `babel-preset-expo@~54.0.0` matching Expo SDK 54 (previously resolved wrong version 56)

### Added
- `babel.config.js` with `presets: ['babel-preset-expo']` and `plugins: ['react-native-reanimated/plugin']`

## [1.0.1] - 2026-06-15

### Fixed
- **Crash on launch**: Disabled `reactCompiler` in `app.json` (experimental feature caused release APK crash)
- **Responsive header scaling**: All 6 screens now use dynamic font sizes via `useResponsive().header` — `titleSize` (28/22px), `sectionTitleSize` (20/17px), `subTitleSize`, `paddingVertical`, `marginBottom`
- **Android build setup**: Added `local.properties` pointing to Android SDK, removed `adaptiveIcon` references from `app.json`

### Added
- **APK build workflow**: Builds successfully with `gradlew assembleRelease` at `android/app/build/outputs/apk/release/app-release.apk`
- **GitHub release**: Tagged `v1.0.0` release with APK attached

### Changed
- **app.json**: `reactCompiler: false`, `newArchEnabled: true`, no adaptive icon, simple `icon` pointer

## [1.0.0] - 2026-06-15

### Added
- Initial release of Inventra — inventory management + POS app
- Product management (add, edit, delete, search)
- Sales/POS with cart, receipt history, "Close Business Day"
- Analytics dashboard with daily/monthly/all-time views
- Stock tracking with per-product `min_stock` thresholds
- Stock movement audit trail
- Notifications for low-stock alerts
- Responsive layout (portrait + landscape/tablet)
- Inter font integration, PHP currency formatting
