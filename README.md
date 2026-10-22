# TicTacPlane

TicTacPlane is the 3D version of TicTacToe, in which the playground is a cube. 
Each player in his turn selects a cubelet (with its symmetric counterpart), trying
to be the first to complete an entire plain through the cube center.   

## Running the Application

1. Run `npm install`

2. Run `npm run ng serve -o`

## Running tests

Tests use Vitest through the Angular CLI with jsdom; no browser installation is required.

- Run `npm test -- --watch` to rerun tests as files change. Press Ctrl+C to stop.
- Run `npm run test:once` to run the full suite once.
- Run `npm run test:coverage` to run the suite with coverage reports in `coverage/`.
