import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import chrome from 'chrome-aws-lambda';
import { Browser } from "puppeteer";
import { NextApiRequest, NextApiResponse } from 'next';

puppeteer.use(StealthPlugin());

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { url } = req.body;

    if(!url){
        res.status(501).json({ error: 'No Website!' });
        return;
    }

    try {
        const browser: Browser = await puppeteer.launch({
            headless: true,
            args: [...chrome.args, '--no-sandbox', '--disable-setuid-sandbox'],
            executablePath: await chrome.executablePath,
        });
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('body');

        const example = ['impressum', 'contact', 'kontakt'];

        const getLinks = async () => {
            const links = await page.evaluate(() => {
                return Array.from(document.querySelectorAll('a')).map(link => link.href);
            });

            const emailList: string[] = [];

            for (const term of example) {
                const matchingLink = links.find(link => link.toLowerCase().includes(term));
                
                if (matchingLink) {
                    try {
                        const linkPage = await browser.newPage();
                        await linkPage.goto(matchingLink);
                        const email = await linkPage.evaluate(() => {
                            const emailMatch = document.body.innerHTML.match(/(?:e[- ]?mail[:\s]*)?([\w.-]+@[\w.-]+\.[a-z]{2,10})/i);
                            return emailMatch ? emailMatch[0] : null;
                        });
                        if (email){
                            emailList.push(email)
                        };
                        linkPage.close();
                    } catch (error) {
                        console.error(`Failed to navigate to ${matchingLink}:`, error);
                    }
                }
            }
            return emailList[0];
        };

        const email = await getLinks();

        await browser.close();

        res.status(200).json({ message: 'Email retrieved', email: email });
    } catch (error) {
        console.error('Scraping error:', error);
        res.status(500).json({ error: 'Failed to scrape data' });
    }
}
