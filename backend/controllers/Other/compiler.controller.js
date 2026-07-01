const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const https = require('https');

// Safe cleanup function to handle EBUSY file locks on Windows
const safeCleanup = (dir) => {
  try {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  } catch (err) {
    console.error(`[Compiler Cleanup] Failed to delete temp dir ${dir}:`, err.message);
    // If resource is locked/busy, defer cleanup for 1 second to let Windows release file handles
    if (err.code === 'EBUSY') {
      setTimeout(() => {
        try {
          if (fs.existsSync(dir)) {
            fs.rmSync(dir, { recursive: true, force: true });
          }
        } catch (retryErr) {
          console.error(`[Compiler Cleanup Retry] Failed to delete temp dir ${dir}:`, retryErr.message);
        }
      }, 1000);
    }
  }
};

const executeWithJudge0 = (language, code, input, res, dir) => {
  let languageId;
  if (language === 'c') {
    languageId = 50; // C (GCC 9.2.0)
  } else if (language === 'java') {
    languageId = 91; // Java (JDK 17.0.6)
  } else if (language === 'python') {
    languageId = 100; // Python (3.12.5)
  } else {
    safeCleanup(dir);
    return res.status(400).json({ error: 'Unsupported language for online compiler fallback' });
  }

  const sourceCodeBase64 = Buffer.from(code).toString('base64');
  const stdinBase64 = input ? Buffer.from(input).toString('base64') : '';

  const payload = JSON.stringify({
    source_code: sourceCodeBase64,
    language_id: languageId,
    stdin: stdinBase64
  });

  const options = {
    hostname: 'ce.judge0.com',
    path: '/submissions?base64_encoded=true&wait=true',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': payload.length
    },
    timeout: 10000
  };

  const req = https.request(options, (apiRes) => {
    let data = '';
    apiRes.on('data', (chunk) => {
      data += chunk;
    });
    apiRes.on('end', () => {
      safeCleanup(dir);
      try {
        if (apiRes.statusCode === 200) {
          const resp = JSON.parse(data);
          const stdout = resp.stdout ? Buffer.from(resp.stdout, 'base64').toString('utf8') : '';
          const stderr = resp.stderr ? Buffer.from(resp.stderr, 'base64').toString('utf8') : '';
          const compileOutput = resp.compile_output ? Buffer.from(resp.compile_output, 'base64').toString('utf8') : '';
          
          if (resp.status && resp.status.id > 3) {
            // Compilation error (id 6) or Runtime error (id 7-12)
            return res.json({
              output: stdout,
              error: compileOutput || stderr || `Execution failed: ${resp.status.description}`
            });
          }
          
          return res.json({
            output: stdout,
            error: stderr
          });
        } else {
          return res.status(500).json({
            error: `Local compiler/interpreter is not installed, and online compilation service failed with status ${apiRes.statusCode}.`
          });
        }
      } catch (err) {
        return res.status(500).json({
          error: `Local compiler/interpreter is not installed, and online compilation response parsing failed: ${err.message}`
        });
      }
    });
  });

  req.on('error', (e) => {
    safeCleanup(dir);
    return res.status(500).json({
      error: `Local compiler/interpreter is not installed, and online compilation request failed: ${e.message}`
    });
  });

  req.on('timeout', () => {
    req.destroy();
    safeCleanup(dir);
    return res.status(500).json({
      error: "Local compiler/interpreter is not installed, and online compilation request timed out."
    });
  });

  req.write(payload);
  req.end();
};

const executeCode = async (req, res) => {
  const { language, code, input } = req.body;
  
  if (!language || !code) {
    return res.status(400).json({ error: 'Language and code are required' });
  }

  // Create a unique directory for this execution inside backend/controllers/temp
  const dir = path.join(__dirname, '../temp', uuidv4());
  
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (mkdirErr) {
    return res.status(500).json({ error: 'Failed to create execution sandbox' });
  }

  let filename;

  try {
    if (language === 'python') {
      filename = path.join(dir, 'main.py');
      fs.writeFileSync(filename, code);

      // Run python main.py first
      const child = exec('python main.py', { cwd: dir, timeout: 10000 }, (error, stdout, stderr) => {
        if (error) {
          const isNotFound = 
            error.message.includes('not recognized') || 
            error.message.includes('not found') || 
            error.message.includes('cannot find the file') ||
            error.code === 9009 || 
            error.code === 127;
          
          if (isNotFound) {
            // 'python' command failed to start, try 'py'
            const childPy = exec('py main.py', { cwd: dir, timeout: 10000 }, (errorPy, stdoutPy, stderrPy) => {
              if (errorPy) {
                const isPyNotFound = 
                  errorPy.message.includes('not recognized') || 
                  errorPy.message.includes('not found') || 
                  errorPy.message.includes('cannot find the file') ||
                  errorPy.code === 9009 || 
                  errorPy.code === 127;

                if (isPyNotFound) {
                  // 'py' command also failed to start, try 'python3'
                  const childPy3 = exec('python3 main.py', { cwd: dir, timeout: 10000 }, (errorPy3, stdoutPy3, stderrPy3) => {
                    safeCleanup(dir);
                    if (errorPy3) {
                      const isPy3NotFound = 
                        errorPy3.message.includes('not recognized') || 
                        errorPy3.message.includes('not found') || 
                        errorPy3.message.includes('cannot find the file') ||
                        errorPy3.code === 9009 || 
                        errorPy3.code === 127;

                      if (isPy3NotFound) {
                        return executeWithJudge0('python', code, input, res, dir);
                      }
                      return res.json({ output: stdoutPy3, error: stderrPy3 || errorPy3.message });
                    }
                    return res.json({ output: stdoutPy3, error: stderrPy3 });
                  });
                  if (childPy3.stdin) {
                    if (input) childPy3.stdin.write(input);
                    childPy3.stdin.end();
                  }
                  return;
                }
                safeCleanup(dir);
                return res.json({ output: stdoutPy, error: stderrPy || errorPy.message });
              }
              safeCleanup(dir);
              return res.json({ output: stdoutPy, error: stderrPy });
            });
            if (childPy.stdin) {
              if (input) childPy.stdin.write(input);
              childPy.stdin.end();
            }
            return;
          }
          
          // 'python' is installed but the code failed (runtime error, EOFError, etc.)
          safeCleanup(dir);
          return res.json({ output: stdout, error: stderr || error.message });
        }
        
        // Success
        safeCleanup(dir);
        return res.json({ output: stdout, error: stderr });
      });
      if (child.stdin) {
        if (input) child.stdin.write(input);
        child.stdin.end();
      }
      return;
    }

    let command;
    switch (language) {
      case 'c':
        filename = path.join(dir, 'main.c');
        fs.writeFileSync(filename, code);
        
        if (process.platform === 'win32') {
          command = `gcc main.c -o main.exe && main.exe`;
        } else {
          command = `gcc main.c -o main && ./main`;
        }
        break;

      case 'java': {
        // Strip block comments /* ... */ and line comments // ...
        const cleanCode = code.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1');
        
        let javaClassName = 'Main';
        const publicClassMatch = cleanCode.match(/public\s+class\s+([a-zA-Z0-9_$]+)/);
        if (publicClassMatch) {
          javaClassName = publicClassMatch[1];
        } else {
          const anyClassMatch = cleanCode.match(/class\s+([a-zA-Z0-9_$]+)/);
          if (anyClassMatch) {
            javaClassName = anyClassMatch[1];
          }
        }

        filename = path.join(dir, `${javaClassName}.java`);
        fs.writeFileSync(filename, code);
        command = `javac ${javaClassName}.java && java ${javaClassName}`;
        break;
      }

      default:
        safeCleanup(dir);
        return res.status(400).json({ error: 'Unsupported language' });
    }

    // Execute C or Java
    const child = exec(command, { cwd: dir, timeout: 10000 }, (error, stdout, stderr) => {
      safeCleanup(dir);

      if (error) {
        let userFriendlyError = error.message;
        
        const isCmdNotFound = 
          userFriendlyError.includes('not recognized') || 
          userFriendlyError.includes('not found') || 
          userFriendlyError.includes('cannot find the file') ||
          error.code === 127;

        if (language === 'c' && isCmdNotFound) {
          return executeWithJudge0('c', code, input, res, dir);
        } else if (language === 'java' && isCmdNotFound) {
          return executeWithJudge0('java', code, input, res, dir);
        }

        return res.json({ 
          output: stdout, 
          error: stderr || error.message 
        });
      }

      res.json({ output: stdout, error: stderr });
    });
    if (child.stdin) {
      if (input) child.stdin.write(input);
      child.stdin.end();
    }
  } catch (err) {
    safeCleanup(dir);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { executeCode };