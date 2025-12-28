# STEEFE ERP Desktop

Simple desktop wrapper for STEEFE ERP.

## Setup

1. Install dependencies:
```
npm install
```

2. Run in development:
```
npm start
```

3. Package as EXE:
```
npm run package
```

The EXE will be in `dist` folder.

## How it works

- Starts your existing web server (`start.bat`)
- Opens Electron window pointing to `http://localhost:3000`
- Closes server when app closes

## Requirements

- PostgreSQL must be installed and configured
- Database must be set up
- All dependencies in parent folder must be installed

## Distribution

Copy the entire `STEEFE ERP-win32-x64` folder to users.
They need PostgreSQL installed separately.
