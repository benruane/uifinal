/**
 * Post condition check - determines if a DataRequest should be posted
 * @returns true if DataRequest should be posted, false to skip this tick
 */
export async function postCondition(): Promise<boolean> {
  // Default: always post (no conditions)
  return false;
  
  // Users can customize this function with any logic they want:
  
  // Example: Time-based
  // const hour = new Date().getHours();
  // return hour >= 9 && hour <= 17;
  
  // Example: External API check
  // const response = await fetch('https://api.example.com/status');
  // return response.ok;
  
  // Example: Random condition
  // return Math.random() > 0.5;
  
  // Example: Environment variable
  // return process.env.SCHEDULER_ENABLE_POST_CONDITION === 'true';
} 