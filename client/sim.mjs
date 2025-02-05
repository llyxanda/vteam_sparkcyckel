import puppeteer from 'puppeteer';

const APP_URL = "http://localhost:3000";
const NUM_USERS = 2;

// Random delay helper
const randomDelay = (min, max) =>
  new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min));


const updateBalance = async (page, newAmount) => {
  console.log(`Updating balance to $${newAmount}`);
  await page.goto(`${APP_URL}/#/balance`, { waitUntil: "networkidle2" });
  await page.type("#amount", newAmount);
  await page.click("#updateButton");
  await page.waitForSelector("#balance-updated");
  console.log(`Balance updated successfully`);
};

// Function to simulate scooter selection and riding
const simulateScooterRide = async (page, context, id) => { 
  await page.waitForSelector(".circle-icon", { timeout: 60000 });
  console.log(`Scooters loaded on the map`);

  const scooterElements = await page.$$(".circle-icon");

  page.on('dialog', async dialog => {
    console.log(`User ${id}: Handling alert - ${dialog.message()}`);
    await dialog.accept();
    console.log(`User ${id}: Alert accepted`);
    await randomDelay(3000, 10000);
  });

  if (scooterElements.length > 0) {
    const randomScooter = scooterElements[Math.floor(Math.random() * scooterElements.length)];
    await page.evaluate(el => el.scrollIntoView(), randomScooter);
    await page.waitForFunction(
      (el) => el.offsetParent !== null,
      {},
      randomScooter
    );

    await randomScooter.click();
    await page.waitForSelector("#scooter", { visible: true });

    const scooterId = await page.evaluate(() => {
      const popup = document.querySelector("#scooter");
      if (popup) {
        const h4 = popup.querySelector("h4");
        return h4 ? h4.innerText.replace("Scooter ID: ", "").trim() : null;
      }
      return null;
    });

    console.log(`User ${id}: Clicked on scooter with ID ${scooterId}`);

    // Open scooter tracking page in a new tab within the same browser context
    const trackingPage = await context.newPage();
    await trackingPage.goto(`http://localhost:3001/${scooterId}`, { waitUntil: "networkidle2" });
    console.log(`User ${id}: Opened scooter tracking page`);

    // Switch back to main page to join scooter
    await page.bringToFront();
    await page.waitForSelector(".join-scooter-btn", { timeout: 5000 });
    await page.click(".join-scooter-btn");
    console.log(`User ${id}: Joined scooter successfully`);

    // Switch back to tracking page for scooter ride
    await trackingPage.bringToFront();

    const randomSpeed = Math.floor(Math.random() * 60) + 1;
    await trackingPage.waitForSelector("#speed-input", { visible: true });
    await trackingPage.type("#speed-input", "", { delay: 50 });
    await trackingPage.type("#speed-input", randomSpeed.toString(), { delay: 50 });
    console.log(`User ${id}: Set scooter speed to ${randomSpeed} km/h`);

    const directions = ["N", "S", "E", "W"];
    const randomDirection = directions[Math.floor(Math.random() * directions.length)];
    await trackingPage.waitForSelector('#select', { visible: true });
    await trackingPage.select('#select', randomDirection);
    console.log(`User ${id}: Selected random direction ${randomDirection}`);

    await trackingPage.click("#startButton");
    console.log(`User ${id}: Started scooter`);

    const t = await randomDelay(30000, 100000);
    console.log(`User ${id}: Riding for ${t / 1000} seconds`);

    await trackingPage.click("#stopButton");
    console.log(`User ${id}: Stopped scooter`);

    await randomDelay(3000, 10000);
    await trackingPage.click("#parkButton");
    console.log(`User ${id}: Parked scooter`);

    await trackingPage.close();
  } else {
    console.log(`User ${id}: No scooters available`);
  }
};

// Function to simulate a full user flow
const simulateUserFlow = async (id, browser) => {
  const email = `usert${id}@example.com`;
  const password = `password${id}`;
  const name = `User${id}`;
  const surname = `Surname${id}`;
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await context.overridePermissions(APP_URL, ['geolocation']);
  await page.setGeolocation({ latitude: 59.329, longitude: 18.06 });

  try {
    console.log(`User ${id}: Registering`);
    await randomDelay(10000, 18000);
    await page.goto(`${APP_URL}/#/register`, { waitUntil: "networkidle2" });
    await page.type("#email", email);
    await page.type("#password", password);
    await page.type("#name", name);
    await page.type("#surname", surname);
    await page.click("#registerButton");
    await page.waitForSelector(".success-message");
    console.log(`User ${id}: Registered successfully`);

    console.log(`User ${id}: Logging in`);
    await page.goto(`${APP_URL}/#/login`, { waitUntil: "networkidle2" });
    await page.type("#email", email);
    await page.type("#password", password);
    await page.click("#loginButton");
    await page.waitForSelector(".map-container", { timeout: 60000 });
    console.log(`User ${id}: Logged in successfully`);

    await page.goto(`${APP_URL}/#/mapscooter`, { waitUntil: "networkidle2" });
    console.log(`User ${id}: Navigated to scooter map`);

    // Pass context to maintain session
    await simulateScooterRide(page, context, id);

  } catch (error) {
    console.error(`User ${id}: Error during simulation -`, error.message);
  }
};

// Main function - Launches users asynchronously
const main = async () => {
  const browser = await puppeteer.launch({ headless: false, slowMo: 50 });
  console.log("Simulation started");

  const userSimulations = Array.from({ length: NUM_USERS }, (_, id) =>
    new Promise(resolve => {
      setTimeout(() => resolve(simulateUserFlow(id + 1, browser)), Math.random() * 20000);
    })
  );

  await Promise.all(userSimulations);

  console.log("All user simulations completed");
  //await browser.close();
};

main();
