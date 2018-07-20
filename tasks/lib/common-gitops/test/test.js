var expect = require('chai').expect;
var index = require('../dist/index.js');

describe('generateBuildNumber function test', () => {
    it('should generate pr-1-123', async () => {
        var result =  await index.generateBuildNumber("PullRequest","123", "merge","1");
        expect(result).to.equal('pr-1-123');
    });
    it('should generate dev-124', async () => {
        var result =  await index.generateBuildNumber("IndividualCI","124", "dev");
        expect(result).to.equal('dev-124');
    });
});

describe('generateNamespace function test', () => {
    it('should generate testservice-pr-1', async () => {
        var result =  await index.generateNamespace("testservice","pr", "1");
        expect(result).to.equal('testservice-pr-1');
    });
    it('should generate testservice-dev', async () => {
        var result =  await index.generateNamespace("testservice","dev");
        expect(result).to.equal('testservice-dev');
    });
    it('should generate testservice', async () => {
        var result =  await index.generateNamespace("testservice");
        expect(result).to.equal('testservice');
    });
});