import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const { phase, action } = await request.json();
    
    if (!phase || !action) {
      return NextResponse.json({ 
        error: 'Missing phase or action parameter' 
      }, { status: 400 });
    }

    if (!['enable', 'disable'].includes(action)) {
      return NextResponse.json({ 
        error: 'Action must be "enable" or "disable"' 
      }, { status: 400 });
    }

    const validPhases = ['genz', 'professional', 'cannabis'];
    if (!validPhases.includes(phase)) {
      return NextResponse.json({ 
        error: `Phase must be one of: ${validPhases.join(', ')}` 
      }, { status: 400 });
    }

    // Execute the phase command
    return new Promise((resolve) => {
      const command = `pnpm phase ${action} ${phase}`;
      const child = spawn(command, { 
        shell: true, 
        cwd: process.cwd(),
        stdio: 'pipe'
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve(NextResponse.json({ 
            success: true, 
            message: `Successfully ${action}d ${phase} phase`,
            output: stdout 
          }));
        } else {
          resolve(NextResponse.json({ 
            success: false, 
            error: `Failed to ${action} ${phase} phase`,
            output: stderr || stdout 
          }, { status: 500 }));
        }
      });
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}