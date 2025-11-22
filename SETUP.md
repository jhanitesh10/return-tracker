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

> [!NOTE]
> Windows users have multiple setup options: native Windows, WSL (Windows Subsystem for Linux), or alternative package managers. Choose the method that best fits your workflow.

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

> [!TIP]
> If you encounter "cannot be loaded because running scripts is disabled", see the [PowerShell Execution Policy](#powershell-execution-policy-windows) troubleshooting section below.

---

## 🐧 Windows WSL Setup (Alternative)

Windows Subsystem for Linux (WSL) provides a Linux environment on Windows, which many developers prefer.

### Step 1: Install WSL

1. Open PowerShell as Administrator and run:
   ```powershell
   wsl --install
   ```

2. Restart your computer when prompted

3. After restart, Ubuntu will automatically install and prompt you to create a username and password

4. Verify WSL installation:
   ```bash
   wsl --version
   ```

### Step 2: Install Node.js in WSL

**Option A: Using apt (Ubuntu/Debian)**
```bash
# Update package list
sudo apt update

# Install Node.js and npm
sudo apt install nodejs npm -y

# Verify installation
node --version
npm --version
```

**Option B: Using nvm (Recommended)**
```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload shell configuration
source ~/.bashrc

# Install latest LTS Node.js
nvm install --lts

# Verify installation
node --version
npm --version
```

### Step 3: Clone and Setup Project

```bash
# Navigate to your desired directory
cd ~

# Clone the repository
git clone <your-repository-url>

# Navigate into the project directory
cd return-tracker

# Install dependencies
npm install

# Run the development server
npm run dev
```

### Step 4: Access from Windows Browser

The application will be accessible at **http://localhost:3000** from your Windows browser.

> [!IMPORTANT]
> **WSL File System Notes:**
> - Your WSL files are located at: `\\wsl$\Ubuntu\home\yourusername`
> - You can access Windows files from WSL at: `/mnt/c/Users/YourUsername/`
> - For best performance, keep your project files in the WSL file system, not on the Windows drive

---

## 📦 Alternative Package Managers

You can use yarn, pnpm, or bun instead of npm.

### Using Yarn

**Install Yarn:**
```bash
# Windows (using npm)
npm install -g yarn

# Verify installation
yarn --version
```

**Project Commands:**
```bash
yarn install          # Install dependencies
yarn dev              # Run development server
yarn build            # Build for production
yarn start            # Start production server
yarn lint             # Run linting
```

### Using pnpm

**Install pnpm:**
```bash
# Windows (using npm)
npm install -g pnpm

# Or using PowerShell (standalone installer)
iwr https://get.pnpm.io/install.ps1 -useb | iex

# Verify installation
pnpm --version
```

**Project Commands:**
```bash
pnpm install          # Install dependencies
pnpm dev              # Run development server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run linting
```

### Using Bun

**Install Bun:**
```bash
# Windows (using PowerShell)
powershell -c "irm bun.sh/install.ps1|iex"

# Verify installation
bun --version
```

**Project Commands:**
```bash
bun install           # Install dependencies
bun dev               # Run development server
bun run build         # Build for production
bun start             # Start production server
bun lint              # Run linting
```

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

#### 0. **PowerShell Execution Policy (Windows)**

**Error:** `cannot be loaded because running scripts is disabled on this system`

**Solution:**
```powershell
# Check current execution policy
Get-ExecutionPolicy

# Set execution policy for current user (recommended)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Or, run the command with bypass (temporary)
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
```

> [!WARNING]
> If you don't have admin rights, use `-Scope CurrentUser` instead of requiring administrator privileges.

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

#### 7. **Antivirus/Windows Defender Blocking (Windows)**

**Issue:** Antivirus software blocking npm, node, or development server

**Solution:**
1. Add exclusions to Windows Defender:
   - Open Windows Security
   - Go to "Virus & threat protection"
   - Click "Manage settings" under "Virus & threat protection settings"
   - Scroll to "Exclusions" and click "Add or remove exclusions"
   - Add these folders:
     - `C:\Program Files\nodejs`
     - Your project directory (e.g., `C:\Users\YourUsername\Documents\return-tracker`)
     - `C:\Users\YourUsername\AppData\Roaming\npm`

2. Temporarily disable real-time protection while installing dependencies (not recommended for regular use)

#### 8. **Long Path Issues (Windows)**

**Error:** `ENAMETOOLONG: name too long`

**Solution:**
```powershell
# Enable long paths in Windows (requires admin)
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force

# Or use shorter project path
# Instead of: C:\Users\YourUsername\Documents\Projects\MyCompany\return-tracker
# Use: C:\Projects\return-tracker
```

#### 9. **Line Ending Issues (Windows)**

**Issue:** Git changing line endings, causing issues

**Solution:**
```bash
# Configure Git to handle line endings properly
git config --global core.autocrlf true

# If you already cloned, reset the repository
git rm -rf --cached .
git reset --hard
```

#### 10. **Firewall Blocking Localhost (Windows)**

**Issue:** Cannot access http://localhost:3000

**Solution:**
1. Open Windows Defender Firewall
2. Click "Allow an app or feature through Windows Defender Firewall"
3. Click "Change settings" then "Allow another app"
4. Browse to `C:\Program Files\nodejs\node.exe`
5. Add it to both Private and Public networks

#### 11. **Network Access for Mobile Testing**

**Issue:** Cannot access app from mobile device on same network

**Solution:**
```bash
# Run dev server on all network interfaces
npm run dev -- -H 0.0.0.0

# Then access from mobile using your computer's IP:
# http://192.168.1.XXX:3000
```

**Windows Firewall Configuration:**
1. Open Windows Defender Firewall with Advanced Security
2. Click "Inbound Rules" → "New Rule"
3. Select "Port" → Next
4. Select "TCP" and enter port "3000" → Next
5. Select "Allow the connection" → Next
6. Check all profiles (Domain, Private, Public) → Next
7. Name it "Next.js Dev Server" → Finish

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

## 🎯 Quick Reference

### Common Commands Comparison

| Task | npm | yarn | pnpm | bun |
|------|-----|------|------|-----|
| Install dependencies | `npm install` | `yarn install` | `pnpm install` | `bun install` |
| Run dev server | `npm run dev` | `yarn dev` | `pnpm dev` | `bun dev` |
| Build for production | `npm run build` | `yarn build` | `pnpm build` | `bun run build` |
| Start production | `npm start` | `yarn start` | `pnpm start` | `bun start` |
| Run linting | `npm run lint` | `yarn lint` | `pnpm lint` | `bun lint` |
| Clean install | `npm ci` | `yarn install --frozen-lockfile` | `pnpm install --frozen-lockfile` | `bun install --frozen-lockfile` |

### Platform-Specific Quick Fixes

**Mac/Linux:**
```bash
# Kill process on port 3000
kill -9 $(lsof -ti:3000)

# Fix permissions
sudo chown -R $(whoami) ~/.npm

# Clear cache
rm -rf node_modules .next
npm install
```

**Windows (Command Prompt):**
```cmd
# Kill process on port 3000
for /f "tokens=5" %a in ('netstat -aon ^| find ":3000" ^| find "LISTENING"') do taskkill /F /PID %a

# Clear cache
rmdir /s /q node_modules .next
npm install
```

**Windows (PowerShell):**
```powershell
# Kill process on port 3000
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force

# Clear cache
Remove-Item -Recurse -Force node_modules, .next
npm install
```

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] Node.js and npm are installed (check with `node --version` and `npm --version`)
- [ ] Repository is cloned
- [ ] Dependencies are installed (`node_modules` exists)
- [ ] `recordings` directory exists
- [ ] `config.json` has correct path (use `\\` or `/` on Windows)
- [ ] Development server starts without errors
- [ ] Application loads at http://localhost:3000
- [ ] No console errors in browser (F12 → Console tab)
- [ ] Theme toggle works (click sun/moon icon)
- [ ] QR scanner can access camera (may need HTTPS for production)

**Windows-Specific Checks:**
- [ ] PowerShell execution policy is set (if using PowerShell)
- [ ] Antivirus exclusions added (if applicable)
- [ ] Firewall allows Node.js (if accessing from network)
- [ ] Long paths enabled (if deep directory structure)

---

**Happy Coding! 🎉**
