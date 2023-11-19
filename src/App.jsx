async function graphQLFetch(query, variables = {}) {
    try {
      const response = await fetch('/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json'},
        body: JSON.stringify({ query, variables })
      });
      const body = await response.text();
      const result = JSON.parse(body);
      /*
      Check for errors in the GraphQL response
      */
      if (result.errors) {
        const error = result.errors[0];
        if (error.extensions.code == 'BAD_USER_INPUT') {
          const details = error.extensions.exception.errors.join('\n ');
          alert(`${error.message}:\n ${details}`);
        } else {
          alert(`${error.extensions.code}: ${error.message}`);
        }
      }
      return result.data;
    } catch (e) {
      alert(`Error in sending data to server: ${e.message}`);
    }
  }

function UserProfileDisplay(props) {
  if (props.user) {
    const { id, name, email, profile } = props.user; 
    const { age, location } = props.user.profile;
    return (
      <div className="user-info">
        <h2>Hi {name}!</h2>
        <div className="user-detail">
            <span className="label">Name:</span>
            <span className="value">{name}</span>
        </div>
        <div className="user-detail">
            <span className="label">Email:</span>
            <span className="value">{email}</span>
        </div>
        <div className="user-detail">
            <span className="label">Age:</span>
            <span className="value">{age}</span>
        </div>
        <div className="user-detail">
            <span className="label">Location:</span>
            <span className="value">{location}</span>
        </div>
      </div>
    );
  } else {
    return (
      <p></p>
    )
  }
}

class UserProfileUpdateForm extends React.Component {
  constructor() {
    super();
  }

  handleSubmit = (e) => {
    e.preventDefault();
    const form=document.forms.profileUpdate;
    const updateUser = {
      profile: {
        age: form.age.value,
        location: form.location.value,
      },
    };
    this.props.handleUpdateProfile(updateUser);
    form.age.value = "";
    form.location.value = "";
    alert("User Profile Successfully Updated!");
  };

  render() {
    if (this.props.user) {
      return (
        <div className="profile-update">
            <h3>Manage Your Account</h3>
            <p>You may update your profile or deregister your account.</p>
            <form name="profileUpdate" onSubmit={this.handleSubmit}>
                <div className="input">
                    <label htmlFor="age">Age:</label>
                    <input type="text" id="age" name="age" placeholder="Enter your age"/>
                </div>
                <div className="input">
                    <label htmlFor="location">Location:</label>
                    <input type="text" id="location" name="location" placeholder="Enter your location"/>
                </div>
                <div>
                    <button type="submit">Update</button>
                </div>
            </form>
        </div>
      );
    } else {
      return (
        <p></p>
      );
    }
  }
}

class DeregisterButton extends React.Component {
  constructor() {
    super();
  }
  handleSubmit = (e) => {
    e.preventDefault();
    this.props.handleDeregisterUser();
    alert("User Successfully Deregistered!");
  };
  render() {
    if (this.props.user) {
      return (
        <div className="profile-update">
          <button onClick={this.handleSubmit}>Deregister</button>
        </div>
      );
    } else {
      return (
        <div></div>
      );
    }
  }
}

class SignUpUserForm extends React.Component {
  constructor() {
    super();
  }
  
  handleSubmit = (e) => {
    e.preventDefault();
    const form = document.forms.signup;
    // Prepare user data for GraphQL call
    const userData = {
      name: form.name.value,  
      email: form.email.value,
      profile: {
        age: form.age.value,
        location: form.location.value,
      },
    };
    if (form.name.value == "") {
      alert("Name is a mandatory field to sign up!")
      return;
    }
    if (form.email.value == "") {
      alert("Email is a mandatory field to sign up!")
      return;
    }

    // Call the provided callback function to register the user
    this.props.handleSignUpUser(userData);
  };
  
  render() {
    if (this.props.user == null) {
      return (
        <div className={"signup-form"}>
          <h2>Sign up to view and add questions!</h2>
          <form name="signup" onSubmit={this.handleSubmit}>
            {/* Render form input fields for user registration */}
              <label htmlFor="name">Name:<span class="required-marker">*</span></label>
              <input type="text" name="name" placeholder="Name" />
              <label htmlFor="email">Email:<span class="required-marker">*</span></label>
              <input type="text" name="email" placeholder="email" />
              <label htmlFor="age">Age:</label>
              <input type="text" name="age" placeholder="Age" />
              <label htmlFor="location">Location:</label>
              <input type="text" name="location" placeholder="location" />    
            <button type="submit">Sign Up</button>
          </form>
        </div>
      );
    } else {
      const {name} = this.props.user
      return (
        <p></p>
      );
    }
  }
}
  
class UserService extends React.Component {
  constructor() {
    super();
    // this.state = {
    //   user: null, // Initialize with an empty user object
    // };
  }

  componentDidMount = async () =>  {
    // Implement logic to fetch user profile data and update state using the "getUserProfile" query
    const { user } = this.props;
    if (user) {
      const { email } = user;
      const query = `
        query getUserProfile($email: String!) {
          getUserProfile(email: $email) {
            name
            email
            profile {
              age
              location
            }
          }
        }
      `;
      try {
        // Make the GraphQL call using the graphQLFetch function
        const data = await graphQLFetch(query, email);
  
        // Handle the response data as needed (e.g., update UI, show success message)
        console.log('Get User info:', data);
      } catch (error) {
        console.error('Error Get User Profile:', error);
      }
    }
  }

  handleUpdateProfile = async (profileData) => {
    // Implement logic to update user profile using the "updateUserProfile" mutation
    const { user } = this.props
    if (user) {
      const { email } = user;
      const {profile} = profileData;
      const query = `
        mutation updateUserProfile($email: String!, $profile: UserProfileInput!) {
          updateUserProfile(email: $email, profile: $profile) {
            id
            name
            email
            profile {
              age
              location
            }
          }
        }
      `;
      const variables = {
        email,
        profile,
      };
      try {
        const data = await graphQLFetch(query, variables);
        console.log('Update user profile:', data);
        const newUser = {
          id: data.updateUserProfile.id,  
          name: data.updateUserProfile.name,  
          email: data.updateUserProfile.email,
          profile: {
            age: data.updateUserProfile.profile.age,
            location: data.updateUserProfile.profile.location,
          },
        };
        this.props.setUser(newUser);

      } catch (error) {
        console.error('Error update user data:', error);
      }
    }
  }

  handleDeregisterUser = async () => {
    // Implement logic to deregister the user using the "deregisterUser" mutation
    const { user } = this.props
    if (user) {
      const { email } = user;
      const query = `
        mutation deregisterUser($email: String!) {
          deregisterUser(email: $email)
        }
      `;
      const variables = {
        email,
      };
      try {
        const data = await graphQLFetch(query, variables);
        console.log('deregister user:', data);
        this.props.setUser(null);

      } catch (error) {
        console.error('Error deregister user data:', error);
      }
    }
  }

  handleSignUpUser = async (userData) => {
      const { name, email, profile } = userData;

      // Define the GraphQL mutation query for signing up a user
      const signUpUserMutation = `
        mutation SignUpUser($name: String!, $email: String!, $profile: UserProfileInput!) {
          signUpUser(name: $name, email: $email, profile: $profile) {
            id
            name
            email
            profile {
              age
              location
            }
          }
        }
      `;
  
      // Prepare the variables for the GraphQL mutation
      const variables = {
        name,
        email,
        profile,
      };
  
      try {
        // Make the GraphQL call using the graphQLFetch function
        const data = await graphQLFetch(signUpUserMutation, variables);
  
        // Handle the response data as needed (e.g., update UI, show success message)
        console.log('User signed up:', data);
        const newUser = {
          id: data.signUpUser.id,  
          name: data.signUpUser.name,  
          email: data.signUpUser.email,
          profile: {
            age: data.signUpUser.profile.age,
            location: data.signUpUser.profile.location,
          },
        };
        this.props.setUser(newUser);
        this.props.loadQuestions();
      } catch (error) {
        // Handle errors from the GraphQL call (e.g., display error message)
        console.error('Error signing up:', error);
        // Optionally, you can display an error message to the user
      }
    }
  
  render() {
    const { user } = this.props;
    
    return (
      <div>
        {<UserProfileDisplay user={user} />}
        {<UserProfileUpdateForm handleUpdateProfile={this.handleUpdateProfile} user={user}/>}
        {<DeregisterButton handleDeregisterUser={this.handleDeregisterUser} user={user}/>}
        {<SignUpUserForm handleSignUpUser={this.handleSignUpUser} user={user} />}
      </div>
    );
  }
}

class QuestionForm extends React.Component {
  constructor() {
    super();
  }

  handleSubmit = (e) => {
    e.preventDefault();
    const form = document.forms.addQuestion;
    const questionData = {
      title: form.title.value,
      description: form.description.value,
      complexity: form.complexity.value,
    };

    if (form.title.value == "") {
      alert("Title is a mandatory field to add a new question!")
      return;
    }

    this.props.handleAddQuestion(questionData);
    form.title.value = "";
    form.description.value = "";
    form.complexity.value = "";
  };

  render() {
    if (this.props.user == null) {
      return (
        <p></p>
      );
    } else {
      return (
        <div className="profile-update">
          <h3>Add A New Question</h3>
          <form name="addQuestion" onSubmit={this.handleSubmit}>
            <div className="input">
              <label htmlFor="title">Question Title:<span class="required-marker">*</span></label>
              <input type="text" name="title" placeholder="title"></input>
            </div>
            <div className="input">
              <label htmlFor="description">Question Description:</label>
              <input type="text" name="description" placeholder="description"></input>
            </div>
            <label>Select Complexity:</label>
            <div className="radio-group">
              <label className="radio-option">
                <input type="radio" name="complexity" value="Easy"></input>
                <span className="custom-radio"></span>
                Easy
              </label>
              <label className="radio-option">
                <input type="radio" name="complexity" value="Medium"></input>
                <span className="custom-radio"></span>
                Medium
              </label>
              <label className="radio-option">
                <input type="radio" name="complexity" value="Hard"></input>
                <span className="custom-radio"></span>
                Hard
              </label>
            </div>
            <div>
              <button type="submit">Add</button>
            </div>
          </form>
        </div>
      );
    }
  }
}

class QuestionUpdate extends React.Component {
  constructor() {
    super();
  }

  handleSubmit = (e) => {
    e.preventDefault();
    const form=document.forms.questionUpdate;
    const updateQuestion = {
      id: form.id.value,
      title: form.title.value,
      description: form.description.value,
      complexity: form.complexity.value,
    };
    if (form.id.value == "") {
      alert("Question ID is a mandatory field to update the question!")
      return;
    }
    if (form.title.value == "") {
      alert("Question title is a mandatory field to update the question!")
      return;
    }
    this.props.handleUpdateQuestion(updateQuestion);
    form.id.value = "";
    form.title.value = "";
    form.description.value = "";
    form.complexity.value = "";
  };

  render() {
    if (this.props.user) {
      return (
        <div className="profile-update">
          <h3>Update Your Question</h3>
          <form name="questionUpdate" onSubmit={this.handleSubmit}>
            <div className="input">
              <label htmlFor="id">Question ID:<span class="required-marker">*</span></label>
              <input type="text" name="id" placeholder="question ID"></input>
            </div>
            <div className="input">
              <label htmlFor="title">New Title:<span class="required-marker">*</span></label>
              <input type="text" name="title" placeholder="new question title"></input>
            </div>
            <div className="input">
              <label htmlFor="description">New Description:</label>
              <input type="text" name="description" placeholder="new question description"></input>
            </div>
            <label>Update Question Complexity:</label>
            <div className="radio-group">
              <label className="radio-option">
                <input type="radio" name="complexity" value="Easy"></input>
                <span className="custom-radio"></span>
                Easy
              </label>
              <label className="radio-option">
                <input type="radio" name="complexity" value="Medium"></input>
                <span className="custom-radio"></span>
                Medium
              </label>
              <label className="radio-option">
                <input type="radio" name="complexity" value="Hard"></input>
                <span className="custom-radio"></span>
                Hard
              </label>
            </div>
            <div>
              <button type="submit">Update Question</button>
            </div>
          </form>
        </div>
      )
    } else {
      return (
        <div></div>
      );
    }
  }
}

class QuestionDelete extends React.Component {
  constructor() {
    super();
  }

  handleSubmit = (e) => {
    e.preventDefault();
    const form=document.forms.questionDelete;
    const deleteQuestion = {
      id: form.id.value,
    };
    if (form.id.value == "") {
      alert("Question ID is a mandatory field to delete the question!")
      return;
    }
    this.props.handleDeleteQuestion(deleteQuestion);
    form.id.value = "";
  };

  render() {
    if (this.props.user) {
      return (
        <div className="profile-update">
          <h3>Delete Your Question</h3>
          <form name="questionDelete" onSubmit={this.handleSubmit}>
            <div className="input">
              <label htmlFor="id">Question ID:<span class="required-marker">*</span></label>
              <input type="text" name="id" placeholder="question ID"></input>
            </div>
            <div>
              <button type="submit">Delete</button>
            </div>
          </form>
        </div>
      );
    } else {
      return (
        <p></p>
      );
    }
  }
}

function QuestionsDisplay(props) {
  if (props.user) {
    const questionRows = props.questions.map(question => <QuestionRow key={question.id} question={question}/>);
    return (
      <div className="question-div">
        <h3>Question List</h3>
        <table className="question-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Description</th>
              <th>Complexity</th>
              <th>Creator</th>
              <th>Creator Email</th>
            </tr>
          </thead>
          <tbody>
            {questionRows}
          </tbody>
        </table>
      </div>
    );
  } else {
    return (
      <p></p>
    );
  }
}

class QuestionRow extends React.Component {
  render() {
    const question = this.props.question;
    return (
      <tr>
        <td>{question.id}</td>
        <td>{question.title}</td>
        <td>{question.description}</td>
        <td>{question.complexity}</td>
        <td>{question.name}</td>
        <td>{question.email}</td>
      </tr>
    );
  }
}

class QuestionService extends React.Component {
  constructor() {
    super();
  }

  componentDidMount() {
    // Implement logic to fetch and display questions using the "getAllQuestions" query
    this.props.loadQuestions();
  }

  handleAddQuestion = async (questionData) => {
    // Implement logic to add a new question and update the state
    const {title, description, complexity} = questionData;
    const { user } = this.props
    const {name, email} = user
    const addQuestionMutation = `
      mutation addQuestion($title: String!, $description: String!, $complexity: String!, $name: String!, $email: String!) {
        addQuestion(title: $title, description: $description, complexity: $complexity, name: $name, email: $email) {
          id
          title
          description
          complexity
          name
          email
        }
      }
    `;

    const variables = {
      title,
      description,
      complexity,
      name,
      email,
    };

    try {
      const data = await graphQLFetch(addQuestionMutation, variables)
      console.log("add a new question:", data);
      this.props.loadQuestions();
    } catch (error) {
      console.error("Error add question:", error)
    }
  }

  handleDeleteQuestion = async (deleteQuestion) => {
    // Implement logic to delete a question and update the state
    const {user} = this.props;
    const {email} = user;
    const {id} = deleteQuestion;
    const query = `
      mutation deleteQuestion($id: ID!, $email: String!) {
        deleteQuestion(id: $id, email: $email)
      }
    `;
    const variables = {
      id,
      email,
    };
    try {
      const data = await graphQLFetch(query, variables);
      console.log("delete question:", data);
      this.props.loadQuestions();
    } catch (error) {
      console.error("Error delete question:", error);
    }
  }

  handleUpdateQuestion = async (questionData) => {
    // Implement logic to update a question and update the state
    const { user } = this.props;
    const {email} = user;
    const {id, title, description, complexity} = questionData;
    const query = `
      mutation updateQuestion($id: ID!, $title: String, $description: String, $complexity: String, $email: String!) {
        updateQuestion(id: $id, title: $title, description: $description, complexity: $complexity, email: $email) {
          id
          title
          description
          complexity
          name
          email
        }
      }
    `;
    const variables = {
      id,
      title,
      description,
      complexity,
      email,
    };
    try {
      const data = await graphQLFetch(query, variables);
      console.log("Update question:", data);
      this.props.loadQuestions();
    } catch (error) {
      console.error("Error update question:", error);
    }
  }

  render() {
    const { user, questions } = this.props;

    return (
      <div>
        {<QuestionsDisplay questions={questions} user={user}/>}
        {<QuestionUpdate handleUpdateQuestion={this.handleUpdateQuestion} user={user} questions={questions}/>}
        {<QuestionDelete handleDeleteQuestion={this.handleDeleteQuestion} user={user} questions={questions}/>}
        {<QuestionForm handleAddQuestion={this.handleAddQuestion} user={user} />}
      </div>
    );
  }
}

// Question class需要拿到User红的user state, 用callback还是创建一个parentComponent
class Assignment3 extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      user: null,    // Initialize with an empty user
      questions: [], // Initialize with an empty array of questions
    };
    this.setUser = this.setUser.bind(this);
    this.loadQuestions = this.loadQuestions.bind(this);
  }

  setUser(newUser) {
    this.setState({user: newUser});
  }

  async loadQuestions() {
    if (this.state.user) {
      const query = `
        query {
          getAllQuestions {
            id
            title
            description
            complexity
            name
            email
          }
        }
      `;
      try {
        const data = await graphQLFetch(query);
        console.log("get latest questions:", data);
        this.setState({questions: data.getAllQuestions})
      } catch (error) {
        console.error("Error get question list:", error);
      }
    }
  }
  
  render() {
    const { user, questions } = this.state;

    return (
      <div>
        <UserService user={user} setUser={this.setUser} loadQuestions={this.loadQuestions}/>
        <QuestionService user={user} questions={questions} loadQuestions={this.loadQuestions}/>
      </div>
    );
  }
}

const element = (<><Assignment3/></>);
ReactDOM.render(element, document.getElementById('contents'));