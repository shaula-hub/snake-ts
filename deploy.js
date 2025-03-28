const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

// Build the project
exec("npm run build", (error, stdout, stderr) => {
  if (error) {
    console.error(`Build error: ${error}`);
    return;
  }
  console.log("Build successful");

  // Create a temporary directory for deployment
  const tempDir = path.resolve(__dirname, "temp_deploy");
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  // Copy dist contents to temporary directory
  fs.cpSync(path.resolve(__dirname, "dist"), tempDir, { recursive: true });

  // Initialize git in the temporary directory
  process.chdir(tempDir);
  exec("git init && git checkout -b gh-pages", () => {
    exec('git add . && git commit -m "Deploy to GitHub Pages"', () => {
      // Push to gh-pages branch
      exec(
        "git remote add origin https://github.com/shaula-hub/snake-ts.git",
        () => {
          exec("git push -f origin gh-pages", (pushError) => {
            if (pushError) {
              console.error(`Push error: ${pushError}`);
              return;
            }
            console.log("Successfully deployed!");

            // Clean up
            process.chdir(__dirname);
            fs.rmSync(tempDir, { recursive: true, force: true });
          });
        }
      );
    });
  });
});
