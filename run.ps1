npx ts-node src/server.ts
npm install --save-dev @types/jsdom

#ubuntu@ip-172-31-41-239:~/spoofinator$ npx ts-node ./src/navbar.ts
# /home/ubuntu/spoofinator/node_modules/ts-node/src/index.ts:859
# return new TSError(diagnosticText, diagnosticCodes, diagnostics);
    #    ^
# TSError: ⨯ Unable to compile TypeScript:
# src/navbar.ts:5:23 - error TS7016: Could not find a declaration file for module 'jsdom'. '/home/ubuntu/spoofinator/node_modules/jsdom/lib/api.js' implicitly has an 'any' type.
# Try `npm i --save-dev @types/jsdom` if it exists or add a new declaration (.d.ts) file containing `declare module 'jsdom';`
# 
# 5 import { JSDOM } from 'jsdom';
                    # ~~~~~~~