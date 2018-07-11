import ma = require('vsts-task-lib/mock-answer');
import tmrm = require('vsts-task-lib/mock-run');
import path = require('path');

let taskPath = path.join(__dirname, '..', 'index.js');
let tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

tmr.setInput('buildReason', "PullRequest");
tmr.setInput('sourceBranchName', 'development');
tmr.setInput('gitCommitId', 'd6cd1e2bd19e03a81132a23b2025920577f84e37');
tmr.setInput('buildId', '42');

tmr.run();