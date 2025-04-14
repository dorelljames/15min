# 15min Activity Tracker Chrome Extension

This Chrome extension replaces your new tab page with the 15min Activity Tracker application.

## Installation (Developer Mode)

1. Run the build command to create the extension:

   ```
   pnpm install
   pnpm run build:extension
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" in the top-right corner

4. Click "Load unpacked" and select the `dist` directory from this project

5. Open a new tab to see the Activity Tracker in action

## Features

- Track your activities in 15-minute increments
- View a timeline of your day
- Manage your time more effectively

## Development

To work on the extension:

1. Make your changes to the code
2. Run `pnpm run watch:extension` to automatically rebuild on changes
3. Reload the extension in Chrome to see your changes

## Troubleshooting

If you encounter build errors:

1. Make sure all dependencies are installed: `pnpm install`
2. Ensure the TypeScript configuration is correctly set up:
   - The extension uses `tsconfig.extension.json` to compile the extension
   - Check that required properties are added to all interfaces/types
3. For CSS/Tailwind issues:
   - We use `@tailwindcss/postcss` for Tailwind v4
4. Clear the dist directory and rebuild: `rm -rf dist && pnpm run build:extension`

## Testing the Extension

After building the extension:

1. Go to `chrome://extensions/` in Chrome
2. Enable "Developer mode" in the top-right corner
3. Click "Load unpacked" and select the `dist` directory from this project
4. Open a new tab to see the extension in action
5. You can also click on the extension's "Details" button, then "Extension options" to customize settings

## Permissions

This extension requires the following permissions:

- `storage`: To save your activities locally in your browser
