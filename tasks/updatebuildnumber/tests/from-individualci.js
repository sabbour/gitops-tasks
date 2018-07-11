"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tmrm = require("vsts-task-lib/mock-run");
const path = require("path");
let taskPath = path.join(__dirname, '..', 'index.js');
let tmr = new tmrm.TaskMockRunner(taskPath);
tmr.setInput('buildReason', "IndividualCI");
tmr.setInput('sourceBranchName', 'development');
tmr.setInput('gitCommitId', 'd6cd1e2bd19e03a81132a23b2025920577f84e37');
tmr.setInput('buildId', '42');
tmr.run();
//# sourceMappingURL=from-individualci.js.map