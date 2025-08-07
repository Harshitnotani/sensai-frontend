export const DIALOG_FLOWS = {
  "sign-up": {
    "displayName": "Sign Up",
    "steps": [
      {
        "name": "start",
        "prompt": "Okay, let's create your account. What's your full name?",
        "uiHighlight": "#full-name-input",
        "expectedInputType": "text",
        "action": "captureFullName"
      },
      {
        "name": "email",
        "prompt": "And what's your email address?",
        "uiHighlight": "#email-input",
        "expectedInputType": "email",
        "action": "captureEmail"
      },
      {
        "name": "password",
        "prompt": "Please choose a password.",
        "uiHighlight": "#password-input",
        "expectedInputType": "password",
        "action": "capturePassword"
      },
      {
        "name": "confirm",
        "prompt": "Ready to create your account?",
        "uiHighlight": "#sign-up-button",
        "expectedInputType": "confirmation",
        "action": "confirmSignUp"
      }
    ]
  },
  "join-course": {
    "displayName": "Join Course",
    "steps": [
      {
        "name": "start",
        "prompt": "Which course would you like to join?",
        "uiHighlight": "#course-search-input",
        "expectedInputType": "text",
        "action": "captureCourseName"
      },
      {
        "name": "confirm",
        "prompt": "Are you sure you want to join this course?",
        "uiHighlight": "#join-course-button",
        "expectedInputType": "confirmation",
        "action": "confirmJoinCourse"
      }
    ]
  },
  "submit-offline": {
    "displayName": "Submit Offline Task",
    "steps": [
      {
        "name": "start",
        "prompt": "What is the task you want to submit offline?",
        "uiHighlight": "#task-description-input",
        "expectedInputType": "text",
        "action": "captureTaskDescription"
      },
      {
        "name": "confirm",
        "prompt": "Confirm submission?",
        "uiHighlight": "#submit-button",
        "expectedInputType": "confirmation",
        "action": "confirmOfflineSubmission"
      }
    ]
  }
};

export const INTENT_MAPPING = {
  "create account": "sign-up",
  "sign up": "sign-up",
  "new account": "sign-up",
  "join a course": "join-course",
  "enroll in course": "join-course",
  "take a course": "join-course",
  "submit task": "submit-offline",
  "offline submission": "submit-offline",
};
