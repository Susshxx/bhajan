# How to Add Your YouTube Playlist

## Super Easy! Just One Link Required 🎵

You only need to provide your YouTube playlist link - the player will automatically load all videos from that playlist!

## Step 1: Get Your Playlist ID

### From YouTube Playlist URL:

Your playlist URL looks like:
```
https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf
```

The **Playlist ID** is the part after `list=`:
```
PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf
```

### How to Find It:
1. Go to YouTube
2. Navigate to your playlist (or any playlist you want to use)
3. Look at the URL in the address bar
4. Copy everything after `list=`

## Step 2: Update script.js

Open `script.js` and find this line near the top (line 4):

```javascript
const PLAYLIST_ID = "YOUR_PLAYLIST_ID_HERE";
```

Replace `YOUR_PLAYLIST_ID_HERE` with your actual playlist ID:

```javascript
const PLAYLIST_ID = "PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf";
```

## Complete Example:

If your YouTube playlist link is:
```
https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf
```

Update script.js to:
```javascript
const PLAYLIST_ID = "PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf";
```

That's it! Save the file and refresh your browser. 🎉

## What Happens Automatically:

✅ **All videos** from the playlist are loaded
✅ **Song titles** are automatically displayed
✅ **Artist names** are automatically extracted
✅ **Album art** is automatically fetched
✅ **Previous/Next** buttons navigate through the playlist
✅ **Auto-play** next song when current one ends
✅ Playlist **loops** automatically

## Example Playlists to Try:

### Public Bhajan Playlists:
1. Find any bhajan playlist on YouTube
2. Make sure it's **public** or **unlisted** (not private)
3. Copy the playlist ID
4. Paste it in script.js

## Tips:

- The playlist can have any number of songs
- The playlist must be public or unlisted (not private)
- All videos in the playlist will be playable
- If a video title contains " - ", it will be split into song and artist automatically
  - Example: "Hanuman Chalisa - Hariharan" → Song: "Hanuman Chalisa", Artist: "Hariharan"

## Troubleshooting:

**Playlist won't load?**
- Make sure the playlist is public or unlisted (not private)
- Check that the playlist ID is correct (no extra spaces)
- Make sure the playlist has at least one video

**Videos won't play?**
- Some videos may restrict embedding - the player will skip to the next one
- Make sure you're testing on a proper web server

**Song info not showing?**
- It may take a second to load when switching songs
- Check browser console (F12) for any errors

That's all you need! Just one playlist ID and you're ready to go! 🎵🎶