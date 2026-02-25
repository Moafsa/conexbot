/*
 * Copyright 2021 WPPConnect Team
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
// CommonJS Rewrite for direct Node execution
const { initServer } = require('@wppconnect/server');
const express = require('express');
const fs = require('fs');
const path = require('path');
const mergeDeep = require('merge-deep');
let jwt;
try {
    jwt = require('jsonwebtoken');
} catch (e) {
    console.log('jsonwebtoken not found, trying nested path...');
    try {
        jwt = require('@wppconnect/server/node_modules/jsonwebtoken');
    } catch (e2) {
        console.log('jsonwebtoken still not found. Proceeding without JWT generation (might fail).');
    }
}

// Mock program
const program = {
    parse: () => { },
    opts: () => ({})
};

function run() {
    console.log('--- STARTING CUSTOM SERVER (CJS) - JWT BYPASS MODE ---');

    const SECRET_KEY = '12345';
    let serverOptions = {
        secretKey: SECRET_KEY,
        webhook: {
            url: 'http://host.docker.internal:3000/api/webhooks/whatsapp',
            autoDownload: true,
            readMessage: true,
            allUnreadOnStart: true,
            listenAcks: true,
            onPresenceChanged: true,
            onParticipantsChanged: true
        },
        log: { level: 'silly' }
    };

    console.log('--- STARTING WITH OPTIONS ---');
    console.log(JSON.stringify(serverOptions, null, 2));
    console.log('-----------------------------');

    const { app } = initServer(serverOptions);

    // AUTH BYPASS INJECTION
    const authBypassMiddleware = (req, res, next) => {
        // Force authorization header
        if (!req.headers.authorization && jwt) {
            // Extract session from URL if possible? /api/:session/...
            const match = req.url.match(/\/api\/([^\/]+)\//);
            const session = match ? match[1] : 'default';

            // Generate JWT
            const token = jwt.sign({ session: session }, SECRET_KEY);

            req.headers.authorization = `Bearer ${token}`;
            console.log(`[AUTH BYPASS] Injected JWT for session '${session}' on ${req.url}`);
        }
        next();
    };

    // Add middleware to end
    app.use(authBypassMiddleware);

    // Move it to TOP of stack
    if (app._router && app._router.stack) {
        const layer = app._router.stack.pop();
        app._router.stack.unshift(layer);
        console.log('[AUTH BYPASS] Middleware moved to top of stack.');
    }

    try {
        const frontendPackage = require.resolve('@wppconnect/frontend/package.json');
        const frontendPath = path.join(path.dirname(frontendPackage), 'build');
        if (frontendPath && fs.existsSync(frontendPath)) {
            app.use(express.static(frontendPath));
        }
    } catch (e) {
        console.log('Frontend module not found, skipping frontend routes.');
    }
}

// Force run
run();
