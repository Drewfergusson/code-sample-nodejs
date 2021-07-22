const chai = require('chai');
const assert = chai.assert;
const uuid = require('uuid/v4');
const localDynamoDbUtils = require('./dynamodb-local/dynamodb-local-util');

// software under test
const readData = require('./../src/read-data');
const writeData = require('./../src/write-data');

describe('the code sample', function () {
  this.timeout(10000);

  // This is the test that you want to pass
  it('saves data to DynamoDB and then it can be read', async function () {
    const schoolId = uuid();
    const studentId = uuid();

    const schoolStudent = {
      schoolId: schoolId,
      schoolName: 'Code Sample Academy',
      studentId: studentId,
      studentFirstName: 'Jane',
      studentLastName: 'Doe',
      studentGrade: '8',
    };

    await writeData.handler(schoolStudent);

    const query = {
      schoolId: schoolId,
      studentId: studentId,
    };
    const queryResult = await readData.handler(query);

    assert.isTrue(Array.isArray(queryResult), 'Expected queryResult to be of type Array');
    assert.equal(queryResult.length, 1, 'Expected to find one result');
    assert.deepEqual(queryResult[0], schoolStudent, 'Expected the query result to match what we saved');
  });

  // TODO (extra credit) enable this test if you implement the GSI query in src/read-data.js
  it('(extra credit) can query for SchoolStudent records by studentLastName', async function () {
    const schoolId = uuid();
    const studentId = uuid();

    const schoolStudent = {
      schoolId: schoolId,
      schoolName: 'NWEA Test School',
      studentId: studentId,
      studentFirstName: 'John',
      studentLastName: 'Robertson',
      studentGrade: '5',
    };

    await writeData.handler(schoolStudent);

    const query = {
      studentLastName: schoolStudent.studentLastName,
    };
    const queryResult = await readData.handler(query);

    assert.isTrue(Array.isArray(queryResult), 'Expected queryResult to be of type Array');
    assert.equal(queryResult.length, 1, 'Expected to find one result');
    assert.deepEqual(queryResult[0], schoolStudent, 'Expected the query result to match what we saved');
  });

  // TODO uncomment this test if you implement retrieval of multiple pages of data
  it.skip('returns all pages of data', async function () {
    let createdRecords = 0;
    const schoolId = uuid();
    while (createdRecords++ < 10) {
      await writeData.handler({
        schoolId: schoolId,
        schoolName: 'NWEA Test School ' + createdRecords,
        studentId: uuid(),
        studentFirstName: 'Dan',
        studentLastName: 'Danny the ' + createdRecords,
        studentGrade: '3',
      });
    }

    const query = {
      schoolId: schoolId,
    };
    const queryResult = await readData.handler(query);
    assert.isTrue(Array.isArray(queryResult), 'Expected queryResult to be of type Array');
    assert.equal(queryResult.length, 10, 'Expected to find ten results');
  });


  // This section starts the local DynamoDB database
  before(async function () {
    await localDynamoDbUtils.startLocalDynamoDB();

    // create the 'SchoolStudents' DynamoDB table in the locally running database
    const partitionKey = 'schoolId', rangeKey = 'studentId',
      gsiPartitionKey = 'studentLastName', gsiRangeKey = 'studentFirstName';

    const keySchema = [
      { AttributeName: partitionKey, KeyType: "HASH" },
      { AttributeName: rangeKey, KeyType: "RANGE" },
    ];
    const attributeDefinitions = [
      { AttributeName: partitionKey, AttributeType: "S"},
      { AttributeName: rangeKey, AttributeType: "S" },
      { AttributeName: gsiPartitionKey, AttributeType: "S" },
      { AttributeName: gsiRangeKey, AttributeType: "S" },
    ];
    const gsis = [
      localDynamoDbUtils.buildGlobalSecondaryIndex('studentLastNameGsi', [
        {AttributeName: gsiPartitionKey, KeyType: "HASH"},
        {AttributeName: gsiRangeKey, KeyType: "RANGE"}]),
    ];

    await localDynamoDbUtils.createTable('SchoolStudents', keySchema, attributeDefinitions, gsis);
  });

  after(function () {
    localDynamoDbUtils.stopLocalDynamoDB();
  });

});
