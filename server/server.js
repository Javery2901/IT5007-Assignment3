const fs = require('fs');
const express = require('express');
const { ApolloServer, UserInputError } = require('apollo-server-express');
const { GraphQLScalarType } = require('graphql');
const { Kind } = require('graphql/language');
const { MongoClient } = require('mongodb');
const { fileURLToPath } = require('url');

/******************************************* 
DATABASE CONNECTION CODE
********************************************/
//Note that the below variable is a global variable 
//that is initialized in the connectToDb function and used elsewhere.
let db;

//Function to connect to the database
async function connectToDb() {
    const url = 'mongodb://localhost/assignment3db';
    const client = new MongoClient(url, { useNewUrlParser: true });
    await client.connect();
    console.log('Connected to MongoDB at', url);
    db = client.db();
  }

/******************************************* 
GraphQL CODE
********************************************/  
const resolvers = {
  Query: {
    // User Service (USV) Resolvers
    getUserProfile: getUserProfileResolver,

    // Question Service (QSV) Resolvers
    getAllQuestions: getAllQuestionsResolver,
  },
  Mutation: {
    // User Service (USV) Resolvers
    signUpUser: signUpUserResolver,
    updateUserProfile: updateUserProfileResolver,
    deregisterUser: deregisterUserResolver,

    // Question Service (QSV) Resolvers
    addQuestion: addQuestionResolver,
    deleteQuestion: deleteQuestionResolver,
    updateQuestion: updateQuestionResolver,
  }
};

// User Service (USV) Resolvers
async function getUserProfileResolver(_, args) {
  const {email} = args;
  const user = await db.collection("users").findOne({ email });
  return user;
};

async function updateUserProfileResolver(_, args) {
  try {
    const {email, profile} = args;
    const filter = { email: email };
    const update = { $set: { profile: profile } };
    await db.collection('users').updateOne(filter, update);
   
    const updatedUser = await db.collection('users').findOne(filter);
    console.log("update user profile:", updatedUser);
    return updatedUser;
  } catch (error) {
    throw new Error(`Error update user profile: ${error.message}`);
  }
};

async function signUpUserResolver(_, args) 
{
  try {
    const { name, email, profile } = args;
    // Check if the user with the provided email already exists
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      throw new Error('User with this email already exists.');
    }

    // Create a new user document
    const newUser = {
      name,
      email,
      profile,
      id: await db.collection('users').countDocuments() + 1,
    };

    // Insert the new user into the "users" collection
    const result = await db.collection('users').insertOne(newUser);

    // Get the inserted user document
    const insertedUser = result.ops[0];
    console.log("insert a new user:", insertedUser);
    return insertedUser;
  } catch (error) {
    throw new Error(`Error signing up user: ${error.message}`);
  }
};

async function deregisterUserResolver(_, args) {
  try {
    const {email} = args;
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser == null) {
      throw new Error('User with this email does not exist.');
    }

    const {id} = existingUser;
    await db.collection('users').deleteOne({email});
    console.log("user is deregistered:", existingUser);
    return id;
  } catch (error) {
    throw new Error(`Error deregister user: ${error.message}`);
  }
}

// Qusetion Service (QSV) Resolvers
async function getAllQuestionsResolver(_, args) {
  const questions = await db.collection("questions").find({}).toArray();
  return questions;
}

async function updateQuestionResolver(_, args) {
  try {
    const {id, title, description, complexity, email} = args;
    const idInt = parseInt(id);
    const filter = {id: idInt};
    const existingQuestion = await db.collection("questions").findOne(filter);
    if (existingQuestion == null) {
      throw new Error(`Question ${id} does not exist.`)
    }

    if (existingQuestion.email !== email) {
      throw new Error("Only the question owner is allowed to update the question.")
    }

    const existingSameEmailQuestion = await db.collection("questions").findOne({title: title});
    if (existingSameEmailQuestion && existingSameEmailQuestion.id !== idInt) {
      throw new Error(`A question with ${title} already exists. Please change to another title.`)
    }

    const update = {$set: {title: title, description: description, complexity: complexity}};
    await db.collection("questions").updateOne(filter, update);
   
    const updatedQuestion = await db.collection("questions").findOne(filter);
    console.log("update question:", updatedQuestion);
  } catch (error) {
    throw new Error(`Error update question: ${error.message}`);
  }
}

async function addQuestionResolver(_, args) {
  try {
    const { title, description, complexity, name, email} = args;
    const existingQuestion = await db.collection('questions').findOne({title});
    if (existingQuestion) {
      throw new Error("Question with this title already exists.");
    }

    var nextId;
    const currentNum = await db.collection("questions").countDocuments();
    if (currentNum == 0) {
      nextId = 1;
    } else {
      const lastQuestion = await db.collection('questions').find({}).sort({_id:-1}).limit(1).toArray();
      nextId = lastQuestion[0].id + 1;
    }
    const newQuestion = {
      title,
      description,
      complexity,
      name,
      email,
      id: nextId,
    };

    const result = await db.collection('questions').insertOne(newQuestion);
    const insertedQuestion = result.ops[0];
    console.log("insert a new question:", insertedQuestion);
    return insertedQuestion;
  } catch (error) {
    throw new Error(`Error Add Question: ${error.message}`);
  }
}

async function deleteQuestionResolver(_, args) {
  try {
    const {id, email} = args;
    const idInt = parseInt(id);
    const existingQuestion = await db.collection("questions").findOne({id: idInt});
    if (existingQuestion == null) {
      throw new Error(`Question ${id} does not exist.`)
    }
    if (existingQuestion.email !== email) {
      throw new Error("Only the question owner is allowed to delete the question.")
    }

    await db.collection("questions").deleteOne({id:idInt});
    console.log("question is deleted:", existingQuestion);
    return id;
  } catch (error) {
    throw new Error(`Error delete question: ${error.message}`);
  }
}

/******************************************* 
SERVER INITIALIZATION CODE
********************************************/
const app = express();

//Attaching a Static web server.
app.use(express.static('public')); 

//Creating and attaching a GraphQL API server.
const server = new ApolloServer({
  typeDefs: fs.readFileSync('./server/schema.graphql', 'utf-8'),
  resolvers,
  formatError: error => {
    console.log(error);
    return error;
  },
});
server.applyMiddleware({ app, path: '/graphql' });

//Starting the server that runs forever.
  (async function () {
    try {
      await connectToDb();
      app.listen(3000, function () {
        console.log('App started on port 3000');
      });
    } catch (err) {
      console.log('ERROR:', err);
    }
  })();