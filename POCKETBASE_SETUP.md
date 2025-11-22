# PocketBase Authentication Setup

This app uses PocketBase for authentication. Follow these steps to set it up:

## 1. Download PocketBase

1. Go to [pocketbase.io](https://pocketbase.io/docs/)
2. Download the latest version for your operating system
3. Extract the downloaded file

## 2. Start PocketBase

### On macOS/Linux:
```bash
./pocketbase serve
```

### On Windows:
```bash
pocketbase.exe serve
```

PocketBase will start on `http://127.0.0.1:8090`

## 3. Create Admin Account

1. Open your browser and go to `http://127.0.0.1:8090/_/`
2. Create an admin account (this is for the admin dashboard)
3. You'll be redirected to the admin dashboard

## 4. Configure Environment Variables (Optional)

By default, the app connects to `http://127.0.0.1:8090`. If you want to use a different URL:

1. Create a `.env` file in the project root (copy from `.env.example`)
2. Set your PocketBase URL:

```env
VITE_POCKETBASE_URL=http://127.0.0.1:8090
```

## 5. Test Authentication

1. Start your dev server: `npm run dev`
2. Click "Sign In / Create Account"
3. Try creating a new account
4. Check the PocketBase admin dashboard → **Users** collection to see registered users

## PocketBase Admin Dashboard

Access the admin dashboard at `http://127.0.0.1:8090/_/` to:
- View registered users
- Manage collections
- Configure auth settings
- View logs

## Running in Production

For production, you'll want to:
1. Run PocketBase as a service
2. Use a reverse proxy (nginx, caddy)
3. Enable HTTPS
4. Update `VITE_POCKETBASE_URL` to your production URL

See [PocketBase deployment docs](https://pocketbase.io/docs/going-to-production/) for more details.

## Security Notes

- Never commit your `.env` file to version control
- The `.env` file is already in `.gitignore`
- Change the admin password from the default
- Consider enabling 2FA for admin accounts in production
