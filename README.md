# Football Score Sheet PWA

A fast, mobile-first Progressive Web App (PWA) for recording football match scores, built specifically for outdoor usage with high contrast and offline capabilities.

## Requirements Met
- **Offline First**: All data is stored in the browser using IndexedDB (Dexie).
- **Mobile First**: Large buttons, high contrast for sunlight visibility.
- **Data Preservation**: Timer and match states survive page refreshes.
- **Export**: PDF export of the final match sheet mimicking the paper version.
- **Digital Signatures**: Canvas based signatures for Captains and Referees.

## Setup & Development

### 1. Install dependencies
```bash
npm install
```

### 2. Start development server
```bash
npm run dev
```

### 3. Build for production
```bash
npm run build
```

### 4. Preview production build
```bash
npm run preview
```

## Deployment to Render

To host this application for free on Render, use the **Static Site** option:

1. **Push to GitHub**: Commit all your files and push them to a repository on GitHub.
2. **Create a New Web Service**:
   - Go to [Render Dashboard](https://dashboard.render.com/).
   - Click the **New +** button and select **Static Site**.
3. **Connect Repository**: Connect your GitHub account and select the repository you just pushed.
4. **Configure Settings**:
   - **Name**: `football-score-sheet` (or whatever you prefer)
   - **Branch**: `main` (or `master`)
   - **Build Command**: `npm run build`
   - **Publish directory**: `dist`
5. **Add React Router Rewrite Rule (Crucial for Client-Side Routing)**:
   - On the Render dashboard for your site, go to **Redirects/Rewrites**.
   - Add a new rule:
     - **Source**: `/*`
     - **Destination**: `/index.html`
     - **Action**: `Rewrite`
6. Click **Save Changes**.
7. **Deploy**: Render will automatically build and deploy your app. Once deployed, you can open the URL on an Android device and select **"Add to Home Screen"** to install the PWA.

## Converting to APK (Future)

To convert this PWA into an installable Android APK, you can use [Capacitor](https://capacitorjs.com/):

1. Initialize Capacitor:
   ```bash
   npm install @capacitor/core @capacitor/cli
   npx cap init "Football Score Sheet" "com.football.scoresheet"
   ```
2. Build the web app:
   ```bash
   npm run build
   ```
3. Add Android platform:
   ```bash
   npm install @capacitor/android
   npx cap add android
   npx cap sync
   ```
4. Open Android Studio and build the APK:
   ```bash
   npx cap open android
   ```
   In Android Studio, go to `Build > Build Bundle(s) / APK(s) > Build APK(s)`.
