const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const executeCode = async (req, res) => {
  const { language, code } = req.body;
  
  if (!language || !code) {
    return res.status(400).json({ error: 'Language and code are required' });
  }

  // Create a unique directory for this execution
  const dir = path.join(__dirname, '../temp', uuidv4());
  fs.mkdirSync(dir, { recursive: true });

  let command, filename;

  try {
    switch (language) {
      case 'c':
        filename = path.join(dir, 'main.c');
        fs.writeFileSync(filename, code);
        command = `gcc ${filename} -o ${dir}/main && ${dir}/main`;
        break;
      case 'java':
        filename = path.join(dir, 'Main.java');
        fs.writeFileSync(filename, code);
        command = `cd ${dir} && javac Main.java && java Main`;
        break;
      case 'python':
        filename = path.join(dir, 'main.py');
        fs.writeFileSync(filename, code);
        command = `python ${filename}`;
        break;
      default:
        return res.status(400).json({ error: 'Unsupported language' });
    }

    // Execute the code
    exec(command, { timeout: 10000 }, (error, stdout, stderr) => {
      // Clean up: remove the temporary directory
      fs.rmSync(dir, { recursive: true, force: true });

      if (error) {
        return res.status(500).json({ error: error.message, stderr });
      }

      res.json({ output: stdout, error: stderr });
    });
  } catch (err) {
    // Clean up on error
    fs.rmSync(dir, { recursive: true, force: true });
    res.status(500).json({ error: err.message });
  }
};

module.exports = { executeCode };