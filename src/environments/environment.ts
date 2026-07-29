// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

export const environment = {
  production: false,
  // In development the Angular dev server runs on :4200 while the multiplayer
  // server runs on :8080, so point the WebSocket at the backend explicitly.
  wsUrl: 'ws://localhost:8080/ws'
};
