import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { SECURITY_LIMITS } from '../config/limits';
import { logger } from '../logger/logger';

const execPromise = promisify(exec);

export class LatexService {
  private getBinaryPath(): string {
    // 1. Check AppData local program path first (User scope winget installation)
    const localAppDataPath = path.join(
      process.env.LOCALAPPDATA || 'C:\\Users\\ankit\\AppData\\Local',
      'Programs\\MiKTeX\\miktex\\bin\\x64\\xelatex.exe',
    );
    if (fs.existsSync(localAppDataPath)) {
      return localAppDataPath;
    }

    // 2. Check Program Files path (System scope installation)
    const programFilesPath = 'C:\\Program Files\\MiKTeX\\miktex\\bin\\x64\\xelatex.exe';
    if (fs.existsSync(programFilesPath)) {
      return programFilesPath;
    }

    // 3. Fallback to global command (e.g. Linux container in Render)
    return 'xelatex';
  }

  async compile(latexSource: string): Promise<Buffer> {
    const tempDir = path.join(process.cwd(), 'temp', `latex-${Date.now()}-${Math.random().toString(36).substring(7)}`);
    fs.mkdirSync(tempDir, { recursive: true });

    const texFileName = 'resume.tex';
    const texPath = path.join(tempDir, texFileName);
    fs.writeFileSync(texPath, latexSource, 'utf8');

    const binary = this.getBinaryPath();
    // Security: explicitly disable shell-escape to prevent arbitrary command execution via \write18
    const cmd = `"${binary}" -interaction=nonstopmode -no-shell-escape -output-directory="${tempDir}" "${texPath}"`;

    try {
      // Run compilation with strict timeout
      await execPromise(cmd, { timeout: SECURITY_LIMITS.timeouts.pdf });

      const pdfPath = path.join(tempDir, 'resume.pdf');
      if (!fs.existsSync(pdfPath)) {
        throw new Error('PDF output file was not created');
      }

      return fs.readFileSync(pdfPath);
    } catch (err: any) {
      // Capture error logs for debugging
      let compileLogs = err.stdout || '';
      const logPath = path.join(tempDir, 'resume.log');
      if (fs.existsSync(logPath)) {
        compileLogs += '\n--- resume.log ---\n' + fs.readFileSync(logPath, 'utf8');
      }

      logger.error('LaTeX Compilation Error', {
        err: err.message,
        timedOut: err.killed || err.signal === 'SIGTERM',
      });

      const errorMsg = `LaTeX Compilation Failed: ${err.killed ? 'Process timed out after 30 seconds' : (err.message || 'Compiler error')}`;
      throw new Error(errorMsg);
    } finally {
      // Guaranteed cleanup in all conditions
      this.cleanupTempDir(tempDir);
    }
  }

  private cleanupTempDir(dir: string) {
    try {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    } catch (e) {
      logger.warn('Failed to cleanup temp latex dir', { dir, err: String(e) });
    }
  }
}

export const latexService = new LatexService();
