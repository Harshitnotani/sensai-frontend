export const API_ENDPOINTS = {
  signUp: 'http://localhost:8002/signup',
  joinCourse: 'http://localhost:8002/join-course',
  submitOffline: 'http://localhost:8002/submit-offline',
  recognizeIntent: 'http://localhost:8002/recognize-intent',
};

export async function signUp(userData) {
  try {
    const response = await fetch(API_ENDPOINTS.signUp, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error during sign up:', error);
    throw error;
  }
}

export async function joinCourse(courseData) {
  try {
    const response = await fetch(API_ENDPOINTS.joinCourse, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(courseData),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error during course joining:', error);
    throw error;
  }
}

export async function submitOfflineTask(taskData) {
  try {
    const response = await fetch(API_ENDPOINTS.submitOffline, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taskData),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error during offline task submission:', error);
    throw error;
  }
}

// Offline Submission Queue
const OFFLINE_QUEUE_KEY = 'offlineSubmissionQueue';

export function getOfflineSubmissionQueue() {
  const queue = localStorage.getItem(OFFLINE_QUEUE_KEY);
  return queue ? JSON.parse(queue) : [];
}

export function addToOfflineSubmissionQueue(submission) {
  const queue = getOfflineSubmissionQueue();
  queue.push(submission);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  console.log('Added to offline queue:', submission);
}

export function clearOfflineSubmissionQueue() {
  localStorage.removeItem(OFFLINE_QUEUE_KEY);
  console.log('Offline submission queue cleared.');
}

export async function processOfflineSubmissionQueue() {
  const queue = getOfflineSubmissionQueue();
  if (queue.length === 0) {
    console.log('Offline submission queue is empty.');
    return;
  }

  console.log(`Processing ${queue.length} offline submissions...`);
  const successfulSubmissions = [];
  for (const submission of queue) {
    try {
      let result;
      if (submission.type === 'sign-up') {
        result = await signUp(submission.data);
      } else if (submission.type === 'join-course') {
        result = await joinCourse(submission.data);
      } else if (submission.type === 'submit-offline') {
        result = await submitOfflineTask(submission.data);
      }
      console.log('Successfully processed offline submission:', submission, result);
      successfulSubmissions.push(submission);
    } catch (error) {
      console.error('Failed to process offline submission:', submission, error);
      // Keep failed submissions in the queue for retry
    }
  }

  // Remove successfully processed submissions from the queue
  const remainingQueue = queue.filter(item => !successfulSubmissions.includes(item));
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remainingQueue));
  console.log(`${successfulSubmissions.length} submissions processed successfully. ${remainingQueue.length} remaining in queue.`);
}
