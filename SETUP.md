# 🚀 Trakhija Return Tracker - Local Setup Guide

This guide will help you set up the **Trakhija Return Tracker** application on your local machine (Mac or Windows).

---

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Mac Setup](#mac-setup)
- [Windows Setup](#windows-setup)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have the following installed on your system:

### Required Software

1. **Node.js** (v18 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`

2. **npm** (comes with Node.js)
   - Verify installation: `npm --version`

3. **Git** (for cloning the repository)
   - Download from: https://git-scm.com/
   - Verify installation: `git --version`

---

## 🍎 Mac Setup

### Step 1: Install Node.js

**Option A: Using Official Installer**
1. Visit https://nodejs.org/
2. Download the **LTS version** for macOS
3. Run the installer and follow the prompts
4. Verify installation:
   ```bash
   node --version
   npm --version
   ```

**Option B: Using Homebrew** (Recommended)
1. Install Homebrew if you don't have it:
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. Install Node.js:
   ```bash
   brew install node
   ```

3. Verify installation:
   ```bash
   node --version
   npm --version
   ```

### Step 2: Clone the Repository

```bash
# Navigate to your desired directory
cd ~/Documents

# Clone the repository
git clone <your-repository-url>

# Navigate into the project directory
cd return-tracker
```

### Step 3: Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Next.js 16.0.3
- React 19.2.0
- TailwindCSS 4
- TypeScript 5
- And other dependencies

### Step 4: Configure the Application

The project uses a `config.json` file for configuration. Update the storage path if needed:

```bash
# Open config.json in your preferred editor
nano config.json
# or
code config.json
```

Update the `storagePath` to your preferred location:
```json
{
  "storagePath": "/Users/YOUR_USERNAME/personal/github/return-tracker/recordings"
}
```

### Step 5: Create Required Directories

```bash
# Create the recordings directory
mkdir -p recordings
```

### Step 6: Run the Development Server

```bash
npm run dev
```

The application will start at **http://localhost:3000**

---

## 🪟 Windows Setup

### Step 1: Install Node.js

1. Visit https://nodejs.org/
2. Download the **LTS version** for Windows
3. Run the installer (.msi file)
4. Follow the installation wizard:
   - Accept the license agreement
   - Choose the installation path (default is fine)
   - **Important:** Make sure "Add to PATH" is checked
5. Click "Install" and wait for completion
6. Restart your computer (recommended)

7. Verify installation:
   ```cmd
   node --version
   npm --version
   ```

### Step 2: Install Git (if not already installed)

1. Download Git from: https://git-scm.com/download/win
2. Run the installer
3. Use default settings (recommended)
4. Verify installation:
   ```cmd
   git --version
   ```

### Step 3: Clone the Repository

**Using Command Prompt:**
```cmd
# Navigate to your desired directory
cd C:\Users\YourUsername\Documents

# Clone the repository
git clone <your-repository-url>

# Navigate into the project directory
cd return-tracker
```

**Using Git Bash:**
```bash
# Navigate to your desired directory
cd ~/Documents

# Clone the repository
git clone <your-repository-url>

# Navigate into the project directory
cd return-tracker
```

### Step 4: Install Dependencies

Open Command Prompt or PowerShell in the project directory:

```cmd
npm install
```

> **Note:** If you encounter permission errors, try running Command Prompt as Administrator.

### Step 5: Configure the Application

Update the `config.json` file with a Windows-compatible path:

```json
{
  "storagePath": "C:\\Users\\YourUsername\\Documents\\return-tracker\\recordings"
}
```

> **Important:** Use double backslashes (`\\`) or forward slashes (`/`) in Windows paths.

### Step 6: Create Required Directories

```cmd
# Create the recordings directory
mkdir recordings
```

### Step 7: Run the Development Server

```cmd
npm run dev
```

The application will start at **http://localhost:3000**

---

## 🎯 Running the Application

### Development Mode

```bash
npm run dev
```

- Starts the development server
- Enables hot-reload (auto-refresh on code changes)
- Accessible at: http://localhost:3000

### Production Build

```bash
# Build the application
npm run build

# Start the production server
npm start
```

### Linting

```bash
npm run lint
```

---

## 📁 Project Structure

```
return-tracker/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── settings/          # Settings page
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── Scanner.tsx        # QR code scanner
│   ├── ThemeToggle.tsx    # Theme switcher
│   └── theme-provider.tsx # Theme context
├── lib/                   # Utility functions
├── public/                # Static assets
├── recordings/            # Video recordings storage
├── config.json            # Application configuration
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
└── next.config.ts         # Next.js configuration
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. **Port 3000 Already in Use**

**Error:** `Port 3000 is already in use`

**Solution:**
- **Mac/Linux:**
  ```bash
  # Find the process using port 3000
  lsof -ti:3000

  # Kill the process
  kill -9 $(lsof -ti:3000)
  ```

- **Windows:**
  ```cmd
  # Find the process
  netstat -ano | findstr :3000

  # Kill the process (replace PID with actual process ID)
  taskkill /PID <PID> /F
  ```

- **Or run on a different port:**
  ```bash
  npm run dev -- -p 3001
  ```

#### 2. **Module Not Found Errors**

**Error:** `Cannot find module 'xyz'`

**Solution:**
```bash
# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json  # Mac/Linux
# or
rmdir /s node_modules & del package-lock.json  # Windows

# Reinstall dependencies
npm install
```

#### 3. **Permission Denied (Mac/Linux)**

**Error:** `EACCES: permission denied`

**Solution:**
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules
```

#### 4. **TypeScript Errors**

**Error:** TypeScript compilation errors

**Solution:**
```bash
# Clear Next.js cache
rm -rf .next  # Mac/Linux
# or
rmdir /s .next  # Windows

# Rebuild
npm run dev
```

#### 5. **Camera/Scanner Not Working**

**Issue:** QR code scanner doesn't access camera

**Solution:**
- Ensure you're using **HTTPS** or **localhost** (required for camera access)
- Check browser permissions for camera access
- Try a different browser (Chrome/Edge recommended)

#### 6. **Recordings Directory Issues**

**Error:** Cannot save recordings

**Solution:**
```bash
# Ensure the recordings directory exists
mkdir -p recordings  # Mac/Linux
mkdir recordings     # Windows

# Check permissions (Mac/Linux)
chmod 755 recordings
```

---

## 🌐 Browser Compatibility

The application works best with:
- ✅ Chrome (v90+)
- ✅ Edge (v90+)
- ✅ Safari (v14+)
- ✅ Firefox (v88+)

---

## 📱 Mobile Testing

To test on mobile devices on the same network:

1. Find your local IP address:
   - **Mac:** `ifconfig | grep "inet " | grep -v 127.0.0.1`
   - **Windows:** `ipconfig` (look for IPv4 Address)

2. Access from mobile browser:
   ```
   http://YOUR_IP_ADDRESS:3000
   ```

---

## 🆘 Need Help?

If you encounter issues not covered here:

1. Check the [Next.js Documentation](https://nextjs.org/docs)
2. Review the project's GitHub issues
3. Ensure all prerequisites are correctly installed
4. Try clearing cache and reinstalling dependencies

---

## 📝 Additional Commands

```bash
# Check for outdated packages
npm outdated

# Update packages (be careful with major versions)
npm update

# Clean install (removes node_modules and reinstalls)
npm ci

# Check for security vulnerabilities
npm audit

# Fix security vulnerabilities
npm audit fix
```

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] Node.js and npm are installed
- [ ] Repository is cloned
- [ ] Dependencies are installed (`node_modules` exists)
- [ ] `recordings` directory exists
- [ ] `config.json` has correct path
- [ ] Development server starts without errors
- [ ] Application loads at http://localhost:3000
- [ ] No console errors in browser
- [ ] Theme toggle works
- [ ] QR scanner can access camera

---

**Happy Coding! 🎉**
