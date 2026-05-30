const { spawn } = require('child_process');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

const makeCommand = (name, scriptPath, extraEnv = {}) => {
  const npmArgs = ['run', 'dev', '--prefix', scriptPath];

  if (process.platform === 'win32') {
    return {
      name,
      command: 'cmd.exe',
      args: ['/d', '/s', '/c', 'npm', ...npmArgs],
      extraEnv,
    };
  }

  return {
    name,
    command: 'npm',
    args: npmArgs,
    extraEnv,
  };
};

const spawnCommand = ({ name, command, args, extraEnv }) => {
  const child = spawn(command, args, {
    cwd: rootDir,
    shell: false,
    stdio: 'inherit',
    env: {
      ...process.env,
      ...extraEnv,
    },
  });

  child.on('exit', (code) => {
    if (code && code !== 0) {
      console.error(`${name} exited with code ${code}`);
      process.exitCode = code;
    }
  });

  return child;
};

const shutdown = (processes) => () => {
  for (const child of processes) {
    if (!child.killed) {
      child.kill();
    }
  }
  process.exit();
};

(async () => {
  const serverPort = Number(process.env.PORT || 5000);
  const clientPort = Number(process.env.CLIENT_PORT || 5173);

  console.log(`Using API port ${serverPort}`);
  console.log(`Using client port ${clientPort}`);

  const processes = [
    makeCommand('server', 'server', {
      NODE_ENV: process.env.NODE_ENV || 'development',
      PORT: String(serverPort),
      JWT_SECRET: process.env.JWT_SECRET || 'dev_jwt_secret',
      JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
      CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
    }),
    makeCommand('client', 'client', {
      NODE_ENV: process.env.NODE_ENV || 'development',
      VITE_PORT: String(clientPort),
      CHATAPP_API_PORT: String(serverPort),
    }),
  ].map(spawnCommand);

  process.on('SIGINT', shutdown(processes));
  process.on('SIGTERM', shutdown(processes));
})();