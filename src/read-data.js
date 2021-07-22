const AWS = require('aws-sdk');

const db = new AWS.DynamoDB.DocumentClient({
  apiVersion: '2012-08-10',
  endpoint: new AWS.Endpoint('http://localhost:8000'),
  region: 'us-west-2',
  // what could you do to improve performance?
});

const tableName = 'SchoolStudents';
const studentLastNameGsiName = 'studentLastNameGsi';

/**
 * The entry point into the lambda
 *
 * @param {Object} event
 * @param {string} event.schoolId
 * @param {string} event.studentId
 * @param {string} [event.studentLastName]
 */
exports.handler = async (event) => {
  const limit = 5;
  let params = {
    TableName: tableName,
    Limit: limit
  }

  /**
   * Setting the query paramaters for different events we might receive
   */
  if(event.studentId && event.schoolId) {
    params = {
      ...params,
      KeyConditionExpression: 'schoolId = :hkey  and studentId = :rkey',
      ExpressionAttributeValues: {
        ':hkey': event.schoolId,
        ':rkey': event.studentId
      },
    };
  } else if(event.studentLastName) {
    params = {
      ...params,
      IndexName: studentLastNameGsiName,
      KeyConditionExpression: 'studentLastName = :studentLastName',
      ExpressionAttributeValues: {
        ':studentLastName': event.studentLastName
      },
    };
  } else {
    params = {
      ...params,
      KeyConditionExpression: 'schoolId = :hkey',
      ExpressionAttributeValues: {
        ':hkey': event.schoolId
      },
    }
  }

  /**
   * Main promise returned to Lambda async function
   */
  return new Promise((resolve, reject) => {
    let results = [];

    recursivelyQuery()
      .then(res => {
        return resolve(results);
      })
      .then(err => {
        reject(err);
      })

    /**
     * Recursive function that querys DynamoDB until it has reached the end
     * of items that meet event criteria.
     * @param {*} ExclusiveStartKey
     * @returns
     */
    function recursivelyQuery(ExclusiveStartKey) {
      return new Promise((resolve, reject) => {
        // console.log({...params, ExclusiveStartKey});
        db.query({...params, ExclusiveStartKey}).promise()
          .then(response => {
            results = results.concat(response.Items);
            if(response.Count === limit) {
              return resolve(recursivelyQuery(response.LastEvaluatedKey));
            }
            return resolve();
          });
      });
    }
  });
};

// TODO use the AWS.DynamoDB.DocumentClient to write a query against the 'SchoolStudents' table and return the results.
// The 'SchoolStudents' table key is composed of schoolId (partition key) and studentId (range key).

// TODO (extra credit) if event.studentLastName exists then query using the 'studentLastNameGsi' GSI and return the results.

// TODO (extra credit) limit the amount of records returned in the query to 5 and then implement the logic to return all
//  pages of records found by the query (uncomment the test which exercises this functionality)
