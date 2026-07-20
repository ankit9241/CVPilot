import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

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

    // 3. Fallback to global command
    return 'xelatex';
  }

  async compile(latexSource: string): Promise<Buffer> {
    const tempDir = path.join(process.cwd(), 'temp', `latex-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });

    const texFileName = 'resume.tex';
    const texPath = path.join(tempDir, texFileName);
    fs.writeFileSync(texPath, latexSource, 'utf8');

    const binary = this.getBinaryPath();
    // Quote paths to avoid issues with spaces in Windows directories
    const cmd = `"${binary}" -interaction=nonstopmode -output-directory="${tempDir}" "${texPath}"`;

    try {
      // Run compilation (max 30s timeout)
      await execPromise(cmd, { timeout: 30000 });

      const pdfPath = path.join(tempDir, 'resume.pdf');
      if (!fs.existsSync(pdfPath)) {
        throw new Error('PDF output file was not created');
      }

      const pdfBuffer = fs.readFileSync(pdfPath);

      // Cleanup temp files asynchronously
      this.cleanupTempDir(tempDir);

      return pdfBuffer;
    } catch (err: any) {
      // Capture logs from output directory or compiler stdout/stderr
      let compileLogs = err.stdout || '';
      const logPath = path.join(tempDir, 'resume.log');
      if (fs.existsSync(logPath)) {
        compileLogs += '\n--- resume.log ---\n' + fs.readFileSync(logPath, 'utf8');
      }

      this.cleanupTempDir(tempDir);

      const errorMsg = `LaTeX Compilation Failed:\n${err.stderr || err.message}\nLogs:\n${compileLogs}`;
      throw new Error(errorMsg);
    }
  }

  private cleanupTempDir(dir: string) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {
      // ignore cleanup issues
    }
  }
}

export const latexService = new LatexService();
