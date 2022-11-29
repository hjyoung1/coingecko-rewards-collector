const Discord = require('discord.js');
const puppeteer = require('puppeteer-extra');

const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
puppeteer.use(AdblockerPlugin());

const hook = new Discord.WebhookClient(process.env.DISCORD_WEBHOOK_ID, process.env.DISCORD_WEBHOOK_TOKEN);

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      // Required for Docker version of Puppeteer
      '--no-sandbox',
      '--disable-setuid-sandbox',
      // This will write shared memory files into /tmp instead of /dev/shm,
      // because Docker’s default for /dev/shm is 64MB
      '--disable-dev-shm-usage'
    ]
  });

  console.log(`${(new Date()).toLocaleString()}`);

  const browserVersion = await browser.version();
  console.log(`Started ${browserVersion}`);

const page = await browser.newPage();

  try {

    await page.goto('https://www.coingecko.com/account/sign_in');
    await page.waitForTimeout(5 * 1000); // cloudflare wait time

    console.log('Navigated to https://www.coingecko.com/account/sign_in');
  

    await page.type('input#user_email', process.env.USERNAME);
    await page.type('input#user_password', process.env.PASSWORD);

    console.log('Typed login credentials.');

    await page.keyboard.press('Enter');
  
    await page.waitForNavigation();

    await page.waitForTimeout(5 * 1000);
  
    await page.goto('https://www.coingecko.com/account/candy?locale=en');
  
    const buttonCollectSelector = 'form.button_to input.collect-candy-button';
    const balanceSelector = 'div[data-target="points.balance"]';
  
    const rewardButton = await page.$(buttonCollectSelector);
  
    if (rewardButton === null) {
      console.log('Daily reward already collected.');
      hook.send('Daily reward already collected.');
    } else {
      rewardButton.click();
      console.log('Reward collected!');
      hook.send('Reward collected!');
    }
  
    await page.waitForSelector(balanceSelector);
    let balance = await page.$eval(balanceSelector, el => el.textContent);
  
    console.log(`Balance: ${balance}`);
    hook.send(`Balance: ${balance}`);
  
    console.log('Done!');
  
    await browser.close();

    process.exit(0);
  } catch (error) {
    console.error(error);
    return;
  }
})();
