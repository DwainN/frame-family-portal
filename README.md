# Frame Family Portal

A web app for the family of someone who uses our **AI Digital Picture Frame for Assisted Communication** (Engineering Design, Group 13).

The frame sits in the home of an older adult who may have memory loss, poor eyesight, or no experience with technology. The frame shows a slideshow of family photos and lets them call family members by voice. This portal is where the family sets that up: they log in, upload the photos the frame shows, and manage the contacts the frame can call.

This is a working prototype of the frame's cloud side, built for the ED2 "Build Software with AI" assignment.

- **Live app:** https://frame-family-portal.netlify.app
- **Demo video (YouTube, unlisted):** _VIDEO_LINK_

## What the app does

| Feature | What you can do |
| --- | --- |
| **Accounts** | Sign up, log in, and log out. You must be logged in to see or change any data. |
| **Photos** | Upload a photo with a caption, see all your photos, edit a caption, and delete a photo. |
| **Contacts** | Add, view, edit, and delete the people the frame can call (name, relationship, phone). |
| **Frame Preview** | Watch your photos play as a full-screen slideshow the way the real frame shows them. |

The Frame Preview uses the same rules as our slideshow design (task 2.2.1): photos are shuffled into a queue, and no photo repeats until every other photo has been shown once. Captions are large, light-on-dark text so they can be read from across a room.

## Technologies used

- **React 18** + **Vite 5** for the frontend
- **Supabase** (free tier) for the backend:
  - **Supabase Auth** for sign up, log in, and log out (email + password)
  - **Postgres database** with two tables: `photos` and `contacts`
  - **Supabase Storage** (private `photos` bucket) for the image files
  - **Row Level Security** so each user can only read and change their own rows and files
- **Netlify** for hosting
- **Claude Code** (AI coding assistant) to write the code, following the Hootcamp workflow: write a short spec, build in small steps, test each step, and commit as you go

## Project structure

```
frame-family-portal/
├── index.html               Page shell that loads the React app
├── netlify.toml             Netlify build settings
├── supabase/
│   └── schema.sql           Creates the tables, security policies, and storage bucket
└── src/
    ├── main.jsx             Starts React
    ├── App.jsx              Checks login state and shows the right screen and tabs
    ├── config.js            Supabase project URL and public anon key
    ├── supabaseClient.js    Creates the one Supabase client the app uses
    ├── photoUrls.js         Loads photo rows and makes signed URLs for the private images
    ├── styles.css           All styling
    └── components/
        ├── Auth.jsx         Log in / sign up form
        ├── Photos.jsx       Photo CRUD (upload, list, edit caption, delete)
        ├── Contacts.jsx     Contact CRUD
        └── FramePreview.jsx Slideshow with the no-repeat shuffle queue
```

### How the frontend talks to the backend

There is no custom server. The React app uses the `@supabase/supabase-js` library to talk to Supabase directly over HTTPS:

1. `supabase.auth.signUp` / `signInWithPassword` / `signOut` handle accounts. Supabase returns a session token that the library sends with every later request.
2. `supabase.from('photos').select / insert / update / delete` read and write rows. Each table has a `user_id` column that defaults to the logged-in user.
3. Row Level Security policies in Postgres check `auth.uid() = user_id` on every request, so even though the anon key is public, one user can never see another user's data.
4. Images upload to `photos/<user id>/<random id>.jpg` in Storage. The bucket is private, so the app asks for signed URLs that expire after one hour.

### Design decisions

- **Private photos.** Family photos are personal, so the storage bucket is private and every read goes through a signed URL. This matches our privacy requirements (PRIV-01 to PRIV-03).
- **Security in the database, not the browser.** The browser code can be changed by anyone, so the rules that protect data live in Postgres Row Level Security.
- **No repeats in the slideshow.** Pure random repeats photos and makes the frame feel broken, so the preview uses a shuffled queue.
- **No custom backend.** Supabase gives us auth, a database, and file storage on the free tier, so the app is only a static site. That keeps hosting free and simple on Netlify.

## Setup instructions (run it yourself)

You need [Node.js](https://nodejs.org) 18 or newer and a free [Supabase](https://supabase.com) account.

1. **Get the code**
   ```bash
   git clone https://github.com/DwainN/frame-family-portal.git
   cd frame-family-portal
   npm install
   ```
2. **Make a Supabase project.** In the Supabase dashboard, click **New project**.
3. **Create the database.** Open **SQL Editor → New query**, paste all of `supabase/schema.sql`, and click **Run**.
4. **(Optional) Turn off email confirmation** so new accounts can log in right away: **Authentication → Sign In / Providers → Email → Confirm email = off**.
5. **Connect the app.** Open **Project Settings → API** and copy the **Project URL** and the **anon public** key into `src/config.js`. You can also set them as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment variables.
6. **Run it**
   ```bash
   npm run dev
   ```
   Open the link it prints (usually http://localhost:5173).

### Deploy to Netlify

1. Push the repo to GitHub.
2. In Netlify, choose **Add new site → Import an existing project** and pick this repo.
3. Netlify reads `netlify.toml`, runs `npm run build`, and publishes the `dist` folder.

## Future work

- Let several family members share one frame (a `frames` table that links users to a frame).
- Connect the real Raspberry Pi frame so it downloads photos and contacts from this database.
- Add a photo to each contact so the frame can show faces on the touch-only contacts screen.
