// You shouldn't need to touch this file to complete the code sample but feel free to do so
const AWS = require('aws-sdk');

const port = 8000;

const dynamoOptions = {
  endpoint: new AWS.Endpoint(`http://localhost:${port}`),
  accessKeyId: 'fakeKeyId',
  secretAccessKey: 'fakeSecretAccessKey',
  region: 'us-west-2'
};
const db = new AWS.DynamoDB(dynamoOptions);

const spawn = require('child_process').spawn;
const path = require('path');

let dbLocalProcess = null;

exports.startLocalDynamoDB = () => {
  dbLocalProcess = spawn('java',
    [
      '-Djava.library.path=./DynamoDBLocal_lib',
      '-jar',
      './DynamoDBLocal.jar',
      '-port',
      `${port}`,
      '-sharedDb'
    ],
    {
      'stdio': 'inherit',
      'cwd': path.join(__dirname, 'dynamodb_local_latest_20191209')
    });

  return new Promise(function(resolve, reject) {
    setTimeout(resolve, 1000);
  });
};

exports.stopLocalDynamoDB = () => {
  if (dbLocalProcess) {
    dbLocalProcess.kill();
    dbLocalProcess = null;
  }
};

const tableExists = async (tableName) => {
  const tables = await db.listTables().promise();
  return tables.TableNames.indexOf(tableName) > -1;
};

exports.createTable = async (tableName, keySchema, attributeDefinitions, globalSecondaryIndexes) => {
  if (await tableExists(tableName)) {
    await deleteTable(tableName);
  }

  const attributes = {
    AttributeDefinitions: attributeDefinitions,
    KeySchema: keySchema,
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    },
    TableName: tableName
  };
  if (globalSecondaryIndexes && globalSecondaryIndexes.length) {
    attributes.GlobalSecondaryIndexes = globalSecondaryIndexes
  }
  return db.createTable(attributes).promise();
};

exports.buildGlobalSecondaryIndex = (indexName, keySchema) => {
  return  {
    IndexName: indexName,
    KeySchema: keySchema,
    ProvisionedThroughput: {
      ReadCapacityUnits: 1,
      WriteCapacityUnits: 1
    },
    Projection: {
      ProjectionType: 'ALL'
    }
  };
};

const deleteTable = (tableName) => {
  return db.deleteTable({TableName: tableName}).promise();
};
