import puppeteer, { Browser, LaunchOptions } from 'puppeteer';

/**
 * Production-ready Puppeteer launch configuration.
 * Includes necessary arguments for running in Linux/Docker environments.
 */
export const getPuppeteerOptions = (): LaunchOptions => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    headless: true, // Always headless in production
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process', // Critical for some cloud environments
      '--disable-gpu'
    ],
    // In production, we might need to specify the executable path 
    // if it's not in the default location.
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    ...(!isProduction && {
      // Local development overrides if needed
    })
  };
};

/**
 * Utility to launch a browser instance with centralized config
 */
export const launchBrowser = async (): Promise<Browser> => {
  return await puppeteer.launch(getPuppeteerOptions());
};
