import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST() {
  try {
    // Use AppleScript to open a folder picker dialog
    // 'POSIX path of (choose folder)' returns the absolute path
    const { stdout, stderr } = await execAsync("osascript -e 'POSIX path of (choose folder)'");

    if (stderr) {
      console.error('osascript error:', stderr);
      return NextResponse.json({ error: 'Failed to open dialog' }, { status: 500 });
    }

    const path = stdout.trim();
    return NextResponse.json({ path });
  } catch (error) {
    console.error('Error picking folder:', error);
    // If the user cancels, it might throw an error
    return NextResponse.json({ error: 'Selection cancelled' }, { status: 400 });
  }
}
