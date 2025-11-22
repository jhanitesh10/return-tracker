# Netlify Deployment Fix - Read-Only Filesystem

## Problem
After deploying to Netlify, you were getting this error when saving videos:

```json
{
    "error": "Failed to save video",
    "details": "EROFS: read-only file system, open '/var/task/recordings-metadata.json'"
}
```

## Root Cause
Netlify Functions run in a **read-only filesystem environment**. The application was trying to:
1. Write to `config.json` file
2. Write to `recordings-metadata.json` file

Both operations fail on Netlify because the filesystem is read-only.

## Solution
We've implemented a **dual-storage strategy** that mirrors the pattern already used for metadata:

### Local Development
- Reads/writes `config.json` file
- Reads/writes `recordings-metadata.json` file

### Netlify Production
- Uses **Netlify Blobs** for both config and metadata storage
- No filesystem writes attempted
- Fully compatible with serverless environment

## Files Modified

### New File
- `lib/config.ts` - Centralized configuration utility that handles both local and Netlify environments

### Updated Files
- `app/api/save-video/route.ts` - Now uses async config from Netlify Blobs
- `app/api/settings/route.ts` - Saves settings to Netlify Blobs in production
- `app/api/video/route.ts` - Reads config from Netlify Blobs
- `app/api/recordings/route.ts` - Uses async config utility

## How It Works

The `lib/config.ts` utility automatically detects the environment:

```typescript
function isNetlify(): boolean {
  return !!(
    process.env.NETLIFY ||
    process.env.NETLIFY_DEV ||
    process.env.AWS_LAMBDA_FUNCTION_NAME
  );
}
```

### Reading Config
1. **On Netlify**: Reads from Netlify Blobs store named 'metadata' with key 'app-config'
2. **Locally**: Reads from `config.json` file
3. **Fallback**: Returns default configuration if neither exists

### Writing Config
1. **On Netlify**: Writes to Netlify Blobs (via settings API)
2. **Locally**: Writes to `config.json` file
3. **Error Handling**: Throws error if Netlify Blobs write fails (no silent failures)

## Netlify Blobs Setup

Netlify Blobs is **automatically available** in your Netlify deployment. No additional setup required!

The application uses a single blob store named `'metadata'` with two keys:
- `'recordings-metadata'` - Video recording metadata
- `'app-config'` - Application configuration

## Testing the Fix

### Local Testing
1. Your existing `config.json` will continue to work
2. No changes needed for local development

### Netlify Testing
1. Deploy to Netlify
2. Go to Settings page in your app
3. Configure your storage settings (Storj credentials, etc.)
4. Settings will be saved to Netlify Blobs
5. Try recording a video - it should now work!

## Current Configuration

Your current `config.json` has Storj configured:
```json
{
  "storageType": "storj",
  "storjAccessKey": "jwbz2sy4jbhkqms2vqn2dkbaqigq",
  "storjSecretKey": "j3aoeaqx7wwnn6a6il4zthgptp3okinfdpxam2pwlarlmegv3kfxg",
  "storjEndpoint": "https://gateway.storjshare.io",
  "storjBucket": "return-tracker"
}
```

After deploying, you'll need to **configure these settings via the Settings page** in your deployed app, as they won't automatically transfer from your local `config.json`.

## Important Notes

1. **Settings are environment-specific**: Local settings (config.json) won't automatically sync to Netlify
2. **Use the Settings UI**: Configure your Storj credentials through the Settings page after deployment
3. **Netlify Blobs is free**: Included in Netlify's free tier with generous limits
4. **No data loss**: Existing local recordings and metadata are preserved

## Verification

After deployment, check the Netlify Function logs to see:
- `🔵 Running on Netlify, using Blobs storage` - Confirms Netlify environment detected
- `✅ Config loaded from Netlify Blobs` - Confirms config is being read
- `✅ Config saved to Netlify Blobs` - Confirms config saves work
- `✅ Metadata saved to Netlify Blobs` - Confirms video metadata saves work

## Next Steps

1. **Deploy to Netlify** with these changes
2. **Configure settings** via the Settings page in your deployed app
3. **Test video recording** to confirm everything works
4. **Monitor logs** in Netlify dashboard for any issues
