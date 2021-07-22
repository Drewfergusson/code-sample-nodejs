const AWS = require('aws-sdk');

const db = new AWS.DynamoDB.DocumentClient({
  apiVersion: '2012-08-10',
  endpoint: new AWS.Endpoint('http://localhost:8000'),
  region: 'us-west-2',
  // what could you do to improve performance?
});

const tableName = 'SchoolStudents';

/**
 * The entry point into the lambda
 *
 * @param {Object} event
 * @param {string} event.schoolId
 * @param {string} event.schoolName
 * @param {string} event.studentId
 * @param {string} event.studentFirstName
 * @param {string} event.studentLastName
 * @param {string} event.studentGrade
 */
exports.handler = async (event) => {
  const requiredColumns = ['schoolId', 'schoolName', 'studentId', 'studentFirstName', 'studentLastName', 'studentGrade'];
  const params = {
    TableName: tableName,
    Item: event
  };

  const dataIdValid = requiredColumns.reduce((acc, column) => {
    if(typeof event[column] === 'string') {
      return acc && true;
    }
    return acc && false;
  }, true);

  return new Promise((resolve, reject) => {
    if(!dataIdValid) {
      return reject();
    }
    db.put(params).promise()
      .then(response => resolve(response))
      .catch(error => {
        reject(error);
      });
  })
};

// TODO validate that all expected attributes are present (assume they are all required)
// TODO use the AWS.DynamoDB.DocumentClient to save the 'SchoolStudent' record
// The 'SchoolStudents' table key is composed of schoolId (partition key) and studentId (range key).
