
import puppeteer from 'puppeteer';

const APP_URL = "http://localhost:3000";
const NUM_USERS = 10;

// Random delay helper
const randomDelay = (min, max) =>
  new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min));

const updateBalance = async (page, newAmount) => {
  console.log(`Updating balance to $${newAmount}`);
  await page.goto(`${APP_URL}/#/balance`, { waitUntil: "networkidle2" });
  await page.type("#amount", newAmount.toString());
  await page.click("#updateButton");
  await page.waitForSelector("#balance-updated");
  console.log(`Balance updated successfully`);
};

const register = async (page, email, password, name, surname) => {
  console.log(`Registering user: ${email}`);
  await page.goto(`${APP_URL}/#/register`, { waitUntil: "networkidle2" });
  await page.type("#email", email);
  await page.type("#password", password);
  await page.type("#name", name);
  await page.type("#surname", surname);
  await page.click("#registerButton");
  await page.waitForSelector(".success-message");
  console.log(`Registered successfully`);
};

const login = async (page, email, password) => {
  console.log(`Logging in user: ${email}`);
  await page.goto(`${APP_URL}/#/login`, { waitUntil: "networkidle2" });
  await page.type("#email", email);
  await page.type("#password", password);
  await page.click("#loginButton");
  await page.waitForSelector(".map-container", { timeout: 60000 });
  console.log(`Logged in successfully`);
};

// Function to simulate scooter selection and riding
const simulateScooterRide = async (page, context, id) => { 
  await page.waitForSelector(".circle-icon", { timeout: 60000 });
  console.log(`Scooters loaded on the map`);

  //const scooterElements = await page.$$(".circle-icon");

  const visibleScooters = await page.$$eval('.circle-icon', elements => {
    return elements.filter(el => {
      const rect = el.getBoundingClientRect();
      return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
      );
    }).map(el => el.getAttribute('data-id')); // Assuming each scooter has a unique data-id attribute
  });
  
  if (visibleScooters.length > 0) {
    const randomScooterId = visibleScooters[Math.floor(Math.random() * visibleScooters.length)];
  
    await page.evaluate(id => {
      const el = document.querySelector(`.circle-icon[data-id="${id}"]`);
      if (el) {
        el.scrollIntoView({ block: 'center', inline: 'center' });
        el.click();
      }
    }, randomScooterId);
  

  console.log(visibleScooters.length)
  page.on('dialog', async dialog => {
    console.log(`User ${id}: Handling alert - ${dialog.message()}`);
    await dialog.accept();
    console.log(`User ${id}: Alert accepted`);
    await randomDelay(3000, 10000);
  });

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
  await trackingPage.type("#speed-input", randomSpeed.toString(), { delay: 50 });
  console.log(`User ${id}: Set scooter speed to ${randomSpeed} km/h`);

  const directions = ["N", "S", "E", "W"];
  const randomDirection = directions[Math.floor(Math.random() * directions.length)];
  await trackingPage.waitForSelector('#select', { visible: true });
  await trackingPage.select('#select', randomDirection);
  console.log(`User ${id}: Selected random direction ${randomDirection}`);

  await trackingPage.click("#startButton");
  console.log(`User ${id}: Started scooter`);

  const t = await randomDelay(50000, 150000);

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
  const stations = [
    [18.059196, 59.329323],
    //[18.0649, 59.3170],
    //[18.0359, 59.3326],
    //[11.9733, 57.7089],
    //[11.9497, 57.6933],
    //[11.9379, 57.7274],
    //[13.0038, 55.6090],
    //[12.9852, 55.6156],
    //[13.0031, 55.5954]
  ];
  const email = `usert${id}@example.com`;
  const password = `password${id}`;
  const name = `User${id}`;
  const surname = `Surname${id}`;
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await context.overridePermissions(APP_URL, ['geolocation']);
  const randomStation = stations[Math.floor(Math.random() * stations.length)];
  await page.setGeolocation({ latitude: randomStation[1], longitude: randomStation[0]});
  await randomDelay(10000, 18000);
  try {
    //console.log(`User ${id}: Registering`);
    //await register(page, email, password, name, surname);
    await login(page, email, password);
    await updateBalance(page, Math.random() * 50);

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
  const browser = await puppeteer.launch({ headless: true, slowMo: 50 });
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
