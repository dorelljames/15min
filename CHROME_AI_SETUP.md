# Setting Up Chrome AI in Timi App

This document explains how to set up and use the Chrome AI features in the Timi app.

## Origin Trial Tokens

To enable Chrome AI in your application, you need to use the origin trial tokens you've obtained:

1. Create a `.env.local` file in the root of your project (if it doesn't exist already)
2. Add your origin trial tokens to the file, separated by commas:
   ```
   NEXT_PUBLIC_ORIGIN_TRIAL_TOKENS=your_first_token_here,your_second_token_here
   ```
3. You can add as many tokens as needed, each separated by a comma
4. Restart your development server if it's already running

### Why Multiple Tokens?

Origin trial tokens may have different:

- Expiration dates
- Feature sets
- Testing requirements

Using multiple tokens ensures broader compatibility and can extend your testing period if some tokens expire before others.

## Requirements

Users of your application must:

1. Use Chrome version 131 or newer
2. Have hardware that supports the AI features (most modern computers)

## User Experience

The app now includes a streamlined experience for Chrome AI:

1. **Chrome AI Status Indicator** in the footer shows the current status of Chrome AI
2. **Download Prompt** appears in the summary section when Chrome AI is available but needs to be downloaded
3. **Download Progress** is shown with a visual indicator during the download process
4. **Notification** appears when Chrome AI needs attention

## Troubleshooting

If users have issues with Chrome AI:

1. Make sure they are using Chrome 131+
2. Check if their hardware supports Chrome AI
3. The download is approximately 350MB and requires a stable internet connection
4. Try refreshing the page or restarting Chrome

## Benefits

- All AI processing happens locally on the user's device
- No data is sent to external servers
- Fast, private summarization of activities
- Personalized insights without privacy concerns
